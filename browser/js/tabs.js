"use strict";
class Tabs {
    constructor() {
        this.active = null;
        this.root = $("#content");
        this.addTab = $('#addTab');
        this.tabs = {};
        this.tabsRow = $('#tabs');

        this.addTab.on('click', _.bind(function() {
            this.createNew('',true);
            this.resize();
        }, this));  
   }
    createNew(link, isSelected) {
        var theTab = new Tab(link);
        this.tabs[theTab.TabId]=theTab;
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
            this.active.content.addClass('unselected');
            this.active.tab.removeClass('selected');
        }
        //arboretum.taskBar.tabs.selected = this.tabs.indexOf(tab);
        this.active = tab;
        this.active.webView.addClass('show');
        this.active.tab.addClass('selected');
        this.active.content.removeClass('unselected');
        console.log($(this.active.tabLink[0]).children('.tab-title').text());
        document.title = $(this.active.tabLink[0]).children('.tab-title').text();
       
        
    }

    resize() {
         _.each(Object.keys(this.tabs),_.bind(function(key) {
                   var l = Object.keys(this.tabs).length;
                   var size = this.tabsRow.width()/l-(l*6+1);
                   //console.log(this.tabs[key].title);
                   this.tabs[key].tab.css({'max-width':size+'px'});
                   size=size-32;
                   this.tabs[key].tabLink.children('.tab-title').css({'max-width':size+'px'});
            },this));
    }
}
