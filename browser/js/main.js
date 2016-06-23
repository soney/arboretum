"use strict";

var $ = require('jquery'),
    _ = require('underscore');

require('jquery-ui');

class Arboretum {
    constructor() {
        window.arboretum = this;

        this.Remote = require('electron').remote;
        this.browserWindow = this.Remote.getCurrentWindow();

        this.taskBar = new TaskBar();
        this.tabs = new Tabs();
        this.urlBar = new URLBar();

        this.listen();
        this.tabs.createNew('https://www.umich.edu/', true);
    }

    listen() {
        $(window).on('keydown', function(e) {
            if(e.which === 82 && e.ctrlKey) { // CTRL + ALT + R
                if(e.altKey){
                  console.log('altkey');
                  location.reload();
                }
                else{
                  e.preventDefault();
                  window.arboretum.urlBar.refreshStop.click();
                }
            } else if((e.which === 73 && e.ctrlKey && e.shiftKey) || e.which === 123) { // F12 OR CTRL + SHIFT + I
                var activeTab = this.tabs.active;
                if(activeTab) {
                    if(activeTab.WebView.isDevToolsOpened()) {
                        activeTab.WebView.closeDevTools();
                    } else {
                        activeTab.WebView.openDevTools();
                    }
                }
            }else if(e.which===76 && e.ctrlKey){
                window.arboretum.urlBar.urlInput.focus();
            }
        });
    }
}

$(function() {
     new Arboretum();
});
