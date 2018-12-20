(() => {
  const defaultContent = `
/* gui.input ${window['text'].input} 
   gui.output ${window['text'].output}
*/
gui.output = \'hello world\'`;
  const customEnvVarDef = `declare const gui:{input:string,output:string}`;
  const saveButtons = document.querySelectorAll('button[save]');
  let currentSave;
  const inputElem = document.querySelector('#input');
  const outputElem = document.querySelector('#output');
  const errorElem = document.querySelector('#error');
  const executeButton = document.querySelector('#execute');
  const clearButton = document.querySelector('button[clear]');
  const shareButton = document.querySelector('button[share]');
  const errorContainer = document.querySelector('.errors>ul');
  const exceptionDisplayRange = 5;
  let t2;
  let t;
  let editor;
  let loading = false;
  let urlParameter;
  if (location.hash && location.hash.length > 5) {
    try {
      const json = location.hash.replace(/^#/, '');
      const urlObj = JSON.parse(decodeURIComponent(json));
      if (urlObj.code) {
        urlParameter = urlObj;
      }
    } catch (ex) {
      console.error('url obj parse failure', ex);
    }
  }
  const createEnvVar = () => {
    const gui = {};
    Object.defineProperty(gui, 'input', {
      get: () => inputElem.value
    });
    Object.defineProperty(gui, 'output', {
      get: () => outputElem.textContent,
      set: value => {
        outputElem.textContent = value;
      }
    });
    return gui;
  }
  const setupMonaco = (customEnvVarDef) => {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    });
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES6,
      allowNonTsExtensions: true,
      alwaysStrict: true,
      noUnusedParameters: true,
      noImplicitUseStrict: true
    });
    monaco.languages.typescript.javascriptDefaults.addExtraLib(customEnvVarDef, 'global.d.ts');
  }
  const setupAutoSave = () => {
    editor.onDidChangeModelContent(e => {
      if (!loading) {
        if (t2) {
          clearTimeout(t2);
          t2 = undefined;
        }
        t2 = setTimeout(() => {
          t2 = undefined;
          saveCode();
          console.log('auto saved');
        }, 500);
      }
    });
  }
  const showIssue = (errors) => {
    errorContainer.innerHTML = '';
    errors.forEach(x => {
      const li = document.createElement('li');
      li.textContent = x.message;
      errorContainer.appendChild(li);
    });
    executeButton.disabled = errors.length > 0;
  }
  const setupCodeIssueDisplay = () => {
    editor.onDidChangeModelDecorations(e => {
      if (t) {
        clearTimeout(t);
        t = undefined;
      }
      t = setTimeout(() => {
        t = undefined;
        const err = monaco.editor.getModelMarkers({});
        showIssue(err)
      }, 100);
    });
  }
  const saveCode = () => localStorage.setItem(currentSave, editor.getValue());

  const setValue = (v) => {
    loading = true;
    editor.setValue(v);
    setTimeout(() => loading = false);
  }

  const setSaveLoc = (loc) => {
    clearTimeout(t2);
    t2 = undefined;
    if (currentSave) {
      saveCode();
    }
    currentSave = loc;
    if (editor) {
      setValue(localStorage.getItem(currentSave) || defaultContent);
    }
    const cur = document.querySelector(`button[save][current]`);
    if (cur) cur.removeAttribute('current');
    document.querySelector(`button[save="${loc}"]`).setAttribute('current', '');
    localStorage.setItem('current-save', loc);
  }
  if (urlParameter) {
    localStorage.setItem('save-temp', urlParameter.code);
    if (urlParameter.input) {
      inputElem.value = urlParameter.input;
    }
    setSaveLoc('save-temp');
  } else {
    setSaveLoc(localStorage.getItem('current-save') || saveButtons[0].getAttribute('save'));
  }
  require.config({ paths: { 'vs': 'monaco-editor/min/vs' } });
  require(['vs/editor/editor.main'], function () {
    setupMonaco(customEnvVarDef);
    const container = document.getElementById('editor');
    editor = monaco.editor.create(container, {
      value: localStorage.getItem(currentSave) || defaultContent,
      language: 'javascript',
      theme: 'vs-dark', minimap: {
        enabled: false
      },
      automaticLayout: true
    });
    setupAutoSave();
    setupCodeIssueDisplay();
  });
  const gui = createEnvVar();
  function padLeft(nr, n, str) {
    return Array(n - String(nr).length + 1).join(str || ' ') + nr;
  }
  var excute = () => {
    console.log('code excuting..');
    gui.output = '';
    errorElem.textContent = '';
    const sc = editor.getValue();
    let func;
    try {
      func = new Function('gui', sc);
      try {
        func(gui);
      } catch (ex) {
        let errMsg = ex.toString();
        let eLine, eCol;
        if (ex.stack) {
          const ss = ex.stack.split('\n');
          const stack = ss[ss.length - 2];
          if (/<anonymous>:\d+:\d+/.test(stack)) {
            //chromium
            const er = /<anonymous>:(\d+):(\d+)/.exec(stack);
            eLine = er[1] - 2;
            eCol = parseInt(er[2], 10);
          } else if (/\(Function code:(\d+):(\d+)\)/.test(stack)) {
            const er = /\(Function code:(\d+):(\d+)\)/.exec(stack);
            eLine = parseInt(er[1], 10);
            eCol = parseInt(er[2], 10);
          } else {
            errMsg = window['text'].warn
          }
          if (eLine) {
            const sp = sc.split('\n').map((v, i) => padLeft(i + 1, 4) + '. ' + v);
            let nl = '';
            for (let i = 0, c = eCol; i < c; i++) {
              nl += ' ';
            }
            sp.splice(eLine, 0, nl + '     ^^^^^');
            errMsg = `${errMsg}\n\n...\n` + sp.filter((v, i) => i > eLine - exceptionDisplayRange && i < eLine + exceptionDisplayRange).join('\n') + '\n...\n';
          }
        }
        errorElem.textContent = errMsg;
      }
    } catch (ex) {
      errorElem.textContent = ex;
    }

  };
  saveButtons.forEach(b => {
    b.addEventListener('click', e => setSaveLoc(e.target.getAttribute('save')));
  })
  clearButton.addEventListener('click', e => {
    localStorage.removeItem(currentSave);
    setValue(defaultContent);
  });
  shareButton.addEventListener('click', e => {
    window.open(`/${location.pathname}#` + encodeURIComponent(JSON.stringify({
      code: editor.getValue(),
      input: inputElem.value
    })));
  });
  executeButton.addEventListener('click', excute);
  inputElem.addEventListener('keypress', e => {
    if (e.which == 13 || e.keyCode == 13) {
      excute();
    }
  })
})();

