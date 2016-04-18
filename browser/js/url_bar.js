function onLoad() {
    var urlInput = document.getElementById('url');
    urlInput.addEventListener('keydown', function(e) {
        if(e.which === 13) {
            var webView = document.getElementById('wv');
            webView.src = this.value;
        }
    });
}

window.addEventListener('load', onLoad);
