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
            console.log(isSelected);
            this.select(theTab);
        }
        return theTab;
    }

    select(tab) {
        console.log(tab);
        if(this.active) {
            this.active.webView.removeClass('show');
            this.active.tab.removeClass('selected');
        }
        //arboretum.taskBar.tabs.selected = this.tabs.indexOf(tab);
        this.active = tab;
        this.active.webView.addClass('show');
        this.active.tab.addClass('selected');
        console.log($(this.active.tabLink[0]).children('.tab-title').text());
        document.title = $(this.active.tabLink[0]).children('.tab-title').text();
       
        
    }
}
