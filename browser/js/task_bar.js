"use strict"

var $ = require('jquery');
var remote = require('remote');
var URL = require('url');

class URLBar {
    constructor() {
        var browserWindow = remote.getCurrentWindow();
        var webView = $('#wv');
        $('.titlebar-close').on('click', function() {
            browserWindow.close();
        });
        $('.titlebar-minimize').on('click', function() {
            browserWindow.minimize();
        });
        $('.titlebar-fullscreen').on('click', function() {
            if(browserWindow.isMaximized()){
                browserWindow.unmaximize();
            } else {
                browserWindow.maximize();
            }
        });
    }
}

$(function() {
});
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