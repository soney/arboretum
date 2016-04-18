"use strict";
var $ = require('jquery');

class Arboretum {
    constructor() {
        this.Remote = require('remote');
        this.BrowserWindow = this.Remote.getCurrentWindow();

        this.taskBar = new TaskBar();
        this.tabs = new Tabs();
        this.urlBar = new URLBar();

        this.listen();
        this.tabs.createNew('https://www.umich.edu/', true);
    }

    listen() {
        document.addEventListener('keydown', function(e) {
            if(e.which === 82 && e.ctrlKey && e.altKey) { // CTRL + ALT + R
                location.reload();
            } else if((e.which === 73 && e.ctrlKey && e.shiftKey) || e.which === 123) { // F12 OR CTRL + SHIFT + I
                if(Main.Tabs.Active) {
                    if(Main.Tabs.Active.WebView.isDevToolsOpened()) {
                        Main.Tabs.Active.WebView.closeDevTools();
                    } else {
                        Main.Tabs.Active.WebView.openDevTools();
                    }
                }
            }
        });
    }
}

$(function() {
    window.arboretum = new Arboretum();
});