"use strict";

var EventEmitter = require('events').EventEmitter;

var NavStatus = {
    START: 'START',
    RECEIVING: 'RECEIVING',
    STOP: 'STOP',
    REDIRECT: 'REDIRECT',
    FAIL: 'FAIL'
};

var tabNum = 0;

class Tab extends EventEmitter {
    constructor(URL) {
        tabNum++;
        super();
        let emit = _.bind(this.emit, this);
        let title = $('<span />', {text: 'New Tab', class: 'tab-title'});
        let icon = $('<span />', {class: 'tab-icon'});
        let closeButton = $('<span />', {
			text: 'x'
		}).css({
			color: 'red',
			cursor: 'pointer',
			position: 'static',
			right: '5px'});
        let webView = $('<webview />', {src: 'http://osu.edu/',id:'wv'+tabNum});

        let expecting = false;
        let lastStatus = null;
        let lastFavicon = null;
        let lastURL = null;
        this.tab = $('<li />', {class: 'tab',id: 'li'+tabNum});
        this.tabLink = $('<a />', {href: '#tab'+tabNum}).appendTo(this.tab);
        this.content = $('<div />', {id: 'tab'+tabNum, class:'tab_content'}).appendTo(arboretum.tabs.root).append(webView);
        this.webView = webView;

        this.tabLink.append(icon, title, closeButton);
        arboretum.tabs.tabsRow.append(this.tab);
        closeButton.on('click',function(){
            $('#tab'+tabNum).remove();
            $('#li'+tabNum).remove();
        });

        // Subscribing on own events
        this.on('Navigation:Status', function(status) {
            this.status = lastStatus = status;
            if(status === NavStatus.START || status === NavStatus.REDIRECT) {
                icon.html('<paper-spinner class="request backward" active></paper-spinner>');
            } else if(status === NavStatus.RECEIVING){
                icon.html('<paper-spinner class="yellow" active></paper-spinner>');
            } else if(status === NavStatus.STOP || status === NavStatus.FAIL) {
                if(webView[0].getURL() === lastURL && lastFavicon.length){
                    this.emit('Favicon:Render');
                } else {
                    icon.html('');
                }
            }
        });
        this.on('Favicon:Render', function() {
            icon.html(`<img class="tab-img" src="${lastFavicon}" />`);
        });
        this.on('Favicon:Update', function(URL) {
            lastURL = webView[0].getURL();
            lastFavicon = URL;
            this.favicon = URL;
            if(lastStatus === NavStatus.STOP){
                emit('Favicon:Render');
            }
        });
        this.on('Title:Update', function(titleVal) {
            title.text(titleVal);
            if(arboretum.tabs.active == this)
               document.title = titleVal;
        });

        // WebView Events
        this.emit('Navigation:Status', NavStatus.START);
        this.webView.attr('src', URL);
        this.webView.on('page-title-set', function(e) {
            var event = e.originalEvent;
            emit('Title:Update', this.getURL() === 'about:blank' ? 'New Tab' : event.title);
        });
        this.webView.on('did-start-loading', function() {
            expecting = true;
            emit('URL:Update', this.getURL());
            emit('Navigation:Status', NavStatus.START);
        });
        this.webView.on('did-get-redirect-request', function(e) {
            var event = e.originalEvent;
            if(event.isMainFrame){
                emit('URL:Update', event.newUrl);
            }
        });
        this.webView.on('did-stop-loading', function() {
            expecting = false;
            emit('Navigation:Status', NavStatus.STOP);
        });
        this.webView.on('did-fail-load', function(event) {
            emit('Navigation:Status', NavStatus.FAIL, {code: event.errorCode, description: event.errorDescription});
        });
        this.webView.on('page-favicon-updated', function(e) {
            var event = e.originalEvent;
            emit('Favicon:Update', event.favicons[0]);
        });
        this.webView.on('did-get-response-details', function(e) {
            var event = e.originalEvent;

            if(!expecting) return ;
            expecting = false;
            if(lastStatus !== NavStatus.STOP) {
                emit('URL:Update', event.newUrl);
                emit('Navigation:Status', NavStatus.RECEIVING);
            }
        });
        // Listen on extra high-level events
        this.listen();
    }
    listen() {
        let oldURL = null;
        this.on('URL:Update', function(url) {
            if(this !== arboretum.tabs.active) return void(oldURL = url);

            if(arboretum.urlBar.urlInput.is(':focus')) {
                if(oldURL === arboretum.urlBar.url) {
                    arboretum.urlBar.urlInput.val(url);
                }
            } else {
                arboretum.urlBar.urlInput.val(url);
                oldURL = url;
            }
        });

        this.on('Navigation:Status', function(status) {
            if(this !== arboretum.tabs.active) return ;
            arboretum.urlBar.backButton.attr('disabled', !this.webView[0].canGoBack());
            arboretum.urlBar.forwardButton.attr('disabled', !this.webView[0].canGoForward());
            if(status === NavStatus.STOP) {
                arboretum.urlBar.refreshStop.icon = 'refresh';
            } else {
                arboretum.urlBar.refreshStop.icon = 'close';
            }
        });
    }
}
