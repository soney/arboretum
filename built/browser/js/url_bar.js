"use strict"

var $ = require('jquery');
var remote = require('electron').remote;
var URL = require('url');

class URLBar {
    constructor() {
        this.navBar = $('#navBar');
        this.backButton = $('#back', this.navBar);
        this.forwardButton = $('#forward', this.navBar);
        this.refreshStop = $('#reload', this.navBar);
        this.urlInput = $('#url', this.navBar);
        this.requestButton = $('#task', this.navBar);

        var webView = $('#wv');

        this.urlInput.on('keydown', function(event) {
            if(event.which === 13) {
                var url = $(this).val();
        		var parsedURL = URL.parse(url);
        		if(!parsedURL.protocol) { parsedURL.protocol = 'http'; }
        		url = URL.format(parsedURL);

                arboretum.tabs.active.webView[0].loadURL(url);
            }
        }).on('focus', function() {
            $(this).select();
        });

        this.backButton.on('click', function(event) {
            arboretum.tabs.active.webView[0].goBack();
        });

        this.forwardButton.on('click', function(event) {
            arboretum.tabs.active.webView[0].goForward();
        });

        this.refreshStop.on('click', function(event) {
            arboretum.tabs.active.webView[0].reload();
            /*
            if(this.icon === 'refresh'){
                arboretum.tabs.active.webView.reload();
            } else {
                arboretum.tabs.active.webView.stop();
            }
            */
        });

        this.requestButton.on('click', _.bind(function(event) {
            var scriptBar = $('#script_bar');

            if(scriptBar.hasClass('visible')) {
                scriptBar.removeClass('visible');
            } else {
                scriptBar.addClass('visible');
            }
            //
            // var oldRequestWindows = $('.requestWindow');
            // if(oldRequestWindows.length > 0) {
            //     oldRequestWindows.remove();
            // } else {
            //     var webView = $('<webview/>', {src: 'http://localhost:3000/o', class:'requestWindow'});
            //     this.navBar.css({
            //         position: 'relative'
            //     });
            //     webView.appendTo(this.navBar)
            //             .css({
            //                 position: 'absolute',
            //                 left: '15px',
            //                 top: '20px',
            //                 width: '400px',
            //                 height: '200px',
            //                 border: '1px solid #555',
            //                 'box-shadow': '0px 0px 15px #222',
            //                 opacity: 0.98
            //             });
            // }
        }, this));
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