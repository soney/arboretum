import * as $ from 'jquery';
import {Tab, TabID} from './tab';
import {Arboretum} from '../browser_main';

export class Tabs {
    private activeTab:Tab;
    private rootEl:JQuery<HTMLElement> = $('#content');
    private addTabEl:JQuery<HTMLElement> = $('#addTab');
    private tabsRowEl:JQuery<HTMLElement> = $('#tabsBar');
    private tabs:Map<TabID, Tab> = new Map<TabID, Tab>();

    constructor(private arboretum:Arboretum) {
        this.addTabEl.on('click', () => {
            this.createNew('', true);
            // this.resize();
        });
    }
    private createNew(url:string, isSelected:boolean=true):Tab {
        const theTab = new Tab(url);
        this.tabs.set(theTab.TabId, theTab);
        if(isSelected) {
            this.select(theTab);
        }
        return theTab;
    }

    public select(tab:Tab):void {
        if(this.activeTab) {
            this.activeTab.webView.removeClass('show');
            this.activeTab.content.addClass('unselected');
            this.activeTab.tab.removeClass('active')
                           .addClass('not-active');
        }
        //arboretum.taskBar.tabs.selected = this.tabs.indexOf(tab);
        this.activeTab = tab;
        this.activeTab.webView.addClass('show');
        this.activeTab.tab.addClass('active')
                        .removeClass('not-active');
        this.activeTab.content.removeClass('unselected');
        document.title = $(this.activeTab[0]).children('.tab-title').text();
    }

   //  resize() {
   //       _.each(Object.keys(this.tabs),_.bind(function(key) {
   //                 var l = Object.keys(this.tabs).length;
   //                 var size = this.tabsRow.width()/l-(l*6+1);
   //                 //console.log(this.tabs[key].title);
   //                //  this.tabs[key].tab.css({'max-width':size+'px'});
   //                //  size=size-32;
   //                //  this.tabs[key].tabLink.children('.tab-title').css({'max-width':size+'px'});
   //          },this));
   //  }
}
