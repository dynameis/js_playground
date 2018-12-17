(() => {
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
    return Array(n - String(nr).length + 1).join(str || '0') + nr;
  }
  document.querySelector('#execute').addEventListener('click', () => {
    gui.output = '';
    errorElem.textContent = '';
    fetch('./main/main.js?_=' + new Date().valueOf())
      .then(res => res.text())
      .then(sc => {
        const func = new Function('gui', sc);
        try {
          func(gui);
        } catch (ex) {
          let errMsg = ex.toString();
          const er = /<anonymous>:(\d+):(\d+)/.exec(ex.stack);
          if (er.length) {
            const sp = sc.split('\n').map((v, i) => padLeft(i, 4) + '. ' + v);
            let nl = '';
            for (let i = 0, c = parseInt(sp[2], 10); i < c; i++) {
              nl += ' ';
            }
            const errIndex = er[1] - 2;
            sp.splice(errIndex, 0, nl + '    ^^^^^');
            errMsg +=
              '\n\n' +
              sp
                .filter((v, i) => i > errIndex - 3 && i < errIndex + 3)
                .join('\n');
          }
          console.error(errMsg);
          errorElem.textContent = errMsg;
        }
      });
  });
})();
