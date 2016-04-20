    "use strict"

var remote = require('remote');
var URL = require('url');

class TaskBar {
    constructor() {
        var browserWindow = remote.getCurrentWindow();
        var webView = $('#wv');
    }
}
/*

function onLoad() {
    var urlInput = document.getElementById('url'),
        backButton = document.getElementById('');
    urlInput.addEventListener('keydown', function(e) {
    });
    this.Back.addEventListener('click', function(){
  Main.Tabs.Active.WebView.goBack();
});
this.Forward.addEventListener('click', function(){
  Main.Tabs.Active.WebView.goForward();
});
this.RefreshStop.addEventListener('click', function(){
  if(this.icon === 'refresh'){
    Main.Tabs.Active.WebView.reload();
  } else {
    Main.Tabs.Active.WebView.stop();
  }
});
}

window.addEventListener('load', onLoad);

*/