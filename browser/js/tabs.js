"use strict";
class Tabs {
    constructor() {
        this.active = null;
        this.tabs = [];
        this.root = $("#content");
    }
    createNew(link, isSelected) {
        var theTab = new Tab(link);
        this.tabs.push(theTab);
        if(isSelected) {
            this.select(theTab);
        }
        return theTab;
    }

    select(tab) {
        if(this.active) {
            this.active.webView.classList.remove('show');
        }
        arboretum.taskBar.tabs.selected = this.tabs.indexOf(tab);
        this.active = tab;
        this.active.webView.classList.add('show');
    }
}