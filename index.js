(() => {
  require.config({ paths: { 'vs': 'monaco-editor/min/vs' } });
  let editor;
  require(['vs/editor/editor.main'], function () {
    monaco.languages.typescript.javascriptDefaults.addExtraLib(`
/**
  * @property {string} input  -取得輸入框的值
  * @property {string} output -設定或取得輸出框的值
  */
  export const gui:{/*取得輸入框的值*/input:string,/*設定或取得輸出框的值*/output:string}
`, 'global.d.ts');
    const container = document.getElementById('editor');
    editor = monaco.editor.create(container, {
      value: `
/* gui.input 取得輸入框的值 
   gui.output 設定或取得輸出框的值
*/
gui.output = \'hello world\'`,
      language: 'javascript',
      theme: 'vs-dark', minimap: {
        enabled: false
      },
      automaticLayout: true
    });
  });
  const inputElem = document.querySelector('#input');
  const outputElem = document.querySelector('#output');
  const errorElem = document.querySelector('#error');
  const gui = {};
  Object.defineProperty(gui, 'inpuit', {
    get: () => inputElem.value
  });
  Object.defineProperty(gui, 'output', {
    get: () => outputElem.textContent,
    set: value => {
      outputElem.textContent = value;
    }
  });
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
          if (/<anonymous>:\d+:\d+/.test(ex.stack)) {
            //chromium
            const er = /<anonymous>:(\d+):(\d+)/.exec(ex.stack);
            eLine = er[1] - 2;
            eCol = parseInt(er[2], 10);
          } else if (/\(Function code:(\d+):(\d+)\)/.test(ex.stack)) {
            const er = /\(Function code:(\d+):(\d+)\)/.exec(ex.stack);
            eLine = parseInt(er[1], 10);
            eCol = parseInt(er[2], 10);
          } else {
            errMsg = `***使用chrome/edge已獲得更詳細的錯誤訊息***`
          }
          if (eLine) {
            const sp = sc.split('\n').map((v, i) => padLeft(i + 1, 4) + '. ' + v);
            let nl = '';
            for (let i = 0, c = eCol; i < c; i++) {
              nl += ' ';
            }
            sp.splice(eLine, 0, nl + '     ^^^^^');
            errMsg =
              `      ${errMsg}\n\n` +
              sp
                .filter((v, i) => i > eLine - 3 && i < eLine + 3)
                .join('\n');
          }
        }
        console.error(errMsg);
        errorElem.textContent = errMsg;
      }
    } catch (ex) {
      errorElem.textContent = ex;
    }

  };
  document.querySelector('#execute').addEventListener('click', excute);
  inputElem.addEventListener('keypress', e => {
    if (e.which == 13 || e.keyCode == 13) {
      excute();
    }
  })
})();
