"use strict"

var remote = require('remote');
var URL = require('url');

class TaskBar {
    constructor() {
        this.backButton = $('#back');
        this.forwardButton = $('#forward');
        this.reloadButton = $('#reload');
        this.urlInput = $('#url');

        var webView = $('#wv');

        this.urlInput.on('keydown', function(event) {
            if(event.which === 13) {
                var url = $(this).val();
        		var parsedURL = URL.parse(url);
        		if(!parsedURL.protocol) { parsedURL.protocol = 'http'; }
        		url = URL.format(parsedURL);
                webView[0].loadURL(url);
            }
        });

        this.backButton.on('click', function(event) {
            webView[0].goBack();
        });

        this.forwardButton.on('click', function(event) {
            webView[0].goForward();
        });

        this.reloadButton.on('click', function(event) {
            webView[0].reload();
        });
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