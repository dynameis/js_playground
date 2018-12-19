(() => {
    window['text'] = {
        input: '取得輸入框的值',
        output: '設定或取得輸出框的值',
        warn: '***使用chrome/edge已獲得更詳細的錯誤訊息***'
    }
    if (!/^zh/.test(window.navigator.language)) {
        window['text'] = {
            input: 'get value of input box',
            output: 'set or get value of output box',
            warn: '***use chrome/edge for more detail infomation***'
        }
        document.querySelectorAll('[altLang]').forEach(elem => {
            if (elem) {
                elem.textContent = elem.getAttribute('altLang');
            }
        });
    }
})();