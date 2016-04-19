"use strict";

var EventEmitter = require('events').EventEmitter;

var NavStatus = {
    START: 'START',
    RECEIVING: 'RECEIVING',
    STOP: 'STOP',
    REDIRECT: 'REDIRECT',
    FAIL: 'FAIL'
};

class Tab extends EventEmitter {
    constructor(URL) {
        super();
        let emit = _.bind(this.emit, this);
        let title = document.createElement('span');
        let icon = document.createElement('span');
        let webView = document.createElement('webview');

        let expecting = false;
        let lastStatus = null;
        let lastFavicon = null;
        let lastURL = null;

        this.tab = document.createElement('paper-tab');
        this.webView = webView;

        title.textContent = 'New Tab';
        title.classList.add('tab-title');
        icon.classList.add('tab-icon');

        this.tab.appendChild(icon);
        this.tab.appendChild(title);

        arboretum.taskBar.tabs.before(this.tab, $('paper-tab:last-child', arboretum.taskBar.tabs));
        arboretum.tabs.root.append(this.webView);

        // Subscribing on own events
        this.on('Navigation:Status', function(status) {
            this.status = lastStatus = status;
            if(status === NavStatus.START || status === NavStatus.REDIRECT) {
                icon.innerHTML = '<paper-spinner class="request backward" active></paper-spinner>';
            } else if(status === NavStatus.RECEIVING){
                icon.innerHTML = '<paper-spinner class="yellow" active></paper-spinner>';
            } else if(status === NavStatus.STOP || status === NavStatus.FAIL) {
                if(webView.getUrl() === lastURL && lastFavicon.length){
                    this.emit('Favicon:Render');
                } else {
                    icon.innerHTML = '';
                }
            }
        });
        this.on('Favicon:Render', function() {
            icon.innerHTML = `<img class="tab-img" src="${lastFavicon}" />`;
        });
        this.on('Favicon:Update', function(URL) {
            lastURL = webView.getUrl();
            lastFavicon = URL;
            this.favicon = URL;
            if(lastStatus === NavStatus.STOP){
                emit('Favicon:Render');
            }
        });
        this.on('Title:Update', function(titleVal) {
            title.textContent = titleVal;
        });

        // WebView Events
        this.emit('Navigation:Status', NavStatus.START);
        this.webView.setAttribute('src', URL);
        this.webView.addEventListener('page-title-set', function(event) {
            emit('Title:Update', this.getUrl() === 'about:blank' ? 'New Tab' : event.title);
        });
        this.webView.addEventListener('did-start-loading', function() {
            expecting = true;
            emit('URL:Update', this.getUrl());
            emit('Navigation:Status', NavStatus.START);
        });
        this.webView.addEventListener('did-get-redirect-request', function(e) {
            if(e.isMainFrame){
                emit('URL:Update', e.newUrl);
            }
        });
        this.webView.addEventListener('did-stop-loading', function() {
            expecting = false;
            emit('Navigation:Status', NavStatus.STOP);
        });
        this.webView.addEventListener('did-fail-load', function(event) {
            emit('Navigation:Status', NavStatus.FAIL, {code: event.errorCode, description: event.errorDescription});
        });
        this.webView.addEventListener('page-favicon-updated', function(event) {
            emit('Favicon:Update', event.favicons[0]);
        });
        this.webView.addEventListener('did-get-response-details', function(e) {
            if(!expecting) return ;
            expecting = false;
            if(lastStatus !== NavStatus.STOP) {
                emit('URL:Update', e.newUrl);
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
            arboretum.urlBar.backButton.attr('disabled', !this.webView.canGoBack());
            arboretum.urlBar.forwardButton.attr('disabled', !this.webView.canGoForward());
            if(status === NavStatus.STOP) {
                arboretum.urlBar.refreshStop.icon = 'refresh';
            } else {
                arboretum.urlBar.refreshStop.icon = 'close';
            }
        });
    }
}