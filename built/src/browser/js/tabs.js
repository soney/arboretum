"use strict";
class Tabs {
    constructor() {
        this.active = null;
        this.root = $("#content");
        this.addTab = $('#addTab');
        this.tabs = {};
        this.tabsRow = $('#tabsBar');
        this.addTab.on('click', _.bind(function () {
            this.createNew('', true);
            // this.resize();
        }, this));
    }
    createNew(link, isSelected) {
        var theTab = new Tab(link);
        this.tabs[theTab.TabId] = theTab;
        if (isSelected) {
            this.select(theTab);
        }
        return theTab;
    }
    select(tab) {
        if (this.active) {
            this.active.webView.removeClass('show');
            this.active.content.addClass('unselected');
            this.active.tab.removeClass('active')
                .addClass('not-active');
        }
        //arboretum.taskBar.tabs.selected = this.tabs.indexOf(tab);
        this.active = tab;
        this.active.webView.addClass('show');
        this.active.tab.addClass('active')
            .removeClass('not-active');
        this.active.content.removeClass('unselected');
        document.title = $(this.active[0]).children('.tab-title').text();
    }
}
