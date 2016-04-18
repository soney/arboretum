"use strict";
class Tabs {
    constructor() {
        this.active = null;
        this.tabs = [];
        this.root = $("#tabs");
    }
    createNew(link, isSelected) {
        var theTab = new Tab(link);
        this.Tabs.push(theTab);
        if(isSelected) {
            this.select(theTab);
        }
        return theTab;
    }

    select(tab) {
        if(this.active) {
            this.active.WebView.classList.remove('show');
        }
        arboretum.taskBar.tabs.selected = this.tabs.indexOf(tab);
        this.active = Tab;
        this.active.WebView.classList.add('show');
    }
}