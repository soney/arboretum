import * as $ from 'jquery';
import {remote} from 'electron';
import * as URL from 'url';
import {Arboretum} from '../browser_main';

export class URLBar {
    protected navBarEl:JQuery<HTMLElement> = $('#navBar');
    protected backButtonEl:JQuery<HTMLElement> = $('#back', this.navBarEl);
    protected forwardButtonEl:JQuery<HTMLElement> = $('#forward', this.navBarEl);
    protected refreshStopButtonEl:JQuery<HTMLElement> = $('#reload', this.navBarEl);
    protected urlInputEl:JQuery<HTMLElement> = $('#url', this.navBarEl);
    protected requestButtonEl:JQuery<HTMLElement> = $('#task', this.navBarEl);
    constructor(private arboretum:Arboretum) {
        this.urlInputEl.on('keydown', (event) => {
            if(event.which === 13) {
                const url:string = this.urlInputEl.val() + '';
        		const parsedURL = URL.parse(url);
        		if(!parsedURL.protocol) { parsedURL.protocol = 'http'; }
                const formattedURL = URL.format(parsedURL);

                this.arboretum.loadURL(formattedURL);
            }
        }).on('focus', function() {
            $(this).select();
        });
        this.backButtonEl.on('click', (event) => {
            this.arboretum.goBackPressed();
            // arboretum.tabs.active.webView[0].goBack();
        });

        this.forwardButtonEl.on('click', (event) => {
            this.arboretum.goForwardPressed();
            // arboretum.tabs.active.webView[0].goForward();
        });

        this.refreshStopButtonEl.on('click', (event) => {
            this.arboretum.refreshOrStopPressed();
            // arboretum.tabs.active.webView[0].reload();
        });

        this.requestButtonEl.on('click', (event) => {
            var scriptBar = $('#script_bar');

            if(scriptBar.hasClass('visible')) {
                scriptBar.removeClass('visible');
            } else {
                scriptBar.addClass('visible');
            }
        });
    }
}
