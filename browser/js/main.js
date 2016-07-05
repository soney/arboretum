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
            if(e.which === 82 && (e.ctrlKey || e.metaKey)) { // CTRL + ALT + R
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
            } else if(e.which === 76 && (e.ctrlKey || e.metaKey)) {
                window.arboretum.urlBar.urlInput.focus();
               // window.open('https://www.umich.edu/');
               // new Arboretum();
            } else if((e.which === 9 && (e.ctrlKey || e.metaKey)) ||( e.which === 9)) {
                e.preventDefault();
                let tabs = window.arboretum.tabs.tabs;
                let selectedKey = window.arboretum.tabs.active.TabId;
                let Keys = Object.keys(tabs);
                let i = Keys.indexOf(selectedKey.toString());
                i++;
                if(i+1 > Keys.length)
                   i = 0;
                window.arboretum.tabs.select(tabs[Keys[i]]);
            } else if(e.which === 78 && (e.ctrlKey || e.metaKey)) {
               e.preventDefault();
               const {ipcRenderer} = require('electron');
               console.log(ipcRenderer);
               ipcRenderer.send('New-Window','test');
            }
           
        });
    }
}

$(function() {
     new Arboretum();
});
