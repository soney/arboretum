"use strict";
class Tabs {
    constructor() {
        this.active = null;
        this.root = $("#content");
        this.addTab = $('#addTab');

        this.tabsRow = $('#tabs');

        this.addTab.on('click', _.bind(function() {
            this.createNew();
        }, this));
    }
    createNew(link, isSelected) {
        var theTab = new Tab(link);
        //this.tabs.push(theTab);
        if(isSelected) {
            this.select(theTab);
        }
        return theTab;
    }

    select(tab) {
        if(this.active) {
            this.active.webView.removeClass('show');
        }
        //arboretum.taskBar.tabs.selected = this.tabs.indexOf(tab);
        this.active = tab;
        this.active.webView.addClass('show');
    }
}