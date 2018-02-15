"use strict";

const API_KEY = 'FN0FXKCHSRapKomlD7JeF4AJQGNZPKf12Tvv9ebA';
class Sidebar {
    constructor() {
        $('.sidebar .toggle').toggles({
            clicker: $('.switch_label'),
            width: 50
        }).on('toggle', _.bind(function(event, isActive) {
            if (isActive) {
                this.startServer();
            } else {
                this.stopServer();
            }
        }, this));

        $('#mturk_post').on('click', _.bind(function() {
            this.postToMTurk();
        }, this));

        new Clipboard('#admin_copy');
        new Clipboard('#share_copy');
        $('.copy_area input').on('click', function(event) {
            const target = $(event.target);
            target.select();
        });

        this.chat = new Chat();
        this.chat.disable();

        // this.startServer();
    }

    populateShareURLs() {
        $('#share_url').val('loading...');
        $('#admin_url').val('loading...');

        this.getMyShortcut().then(function(url) {
            $('#share_url').val(url.replace('http://', '')).prop('disabled', false);
        });
        this.getMyShortcut('/a').then(function(url) {
            $('#admin_url').val(url.replace('http://', '')).prop('disabled', false);
        });
    }

    startServer() {
        this.chat.enable();
        const {ipcRenderer} = require('electron');
        ipcRenderer.send('asynchronous-message', 'startServer');
        // this.populateShareURLs();
        // remote.getCurrentWindow().emit('startServer', () => {
        //     ipcRenderer.send('asynchronous-message','test');
        //     this.chat.connect();
        // });
    }

    stopServer() {
        const {ipcRenderer} = require('electron');
        ipcRenderer.send('asynchronous-message', 'stopServer');
        $('#share_url').val('').prop('disabled', true);
        $('#admin_url').val('').prop('disabled', true);
        this.chat.clear();
        this.chat.disable();
    }

    postToMTurk() {
        console.log($('#sandbox').is(":checked"));

        remote.getCurrentWindow().emit('postHIT', {
            share_url: 'http://'+$('#share_url').val(),
            sandbox: $('#sandbox').is(":checked")
        }, _.bind(() => {
            console.log('posted!')
        }, this));
    }

    getMyShortcut(path) {
        const url = require('url');
        return Sidebar.getIPAddress().then(function(ip) {
            var myLink = url.format({
                protocol: 'http',
                hostname: ip,
                port: 3000,
                pathname: path || '/'
            });
            return Sidebar.getShortcut(myLink)
        }).then(function(result) {
            const shortcut = result.shortcut;
            return url.format({
                protocol: 'http',
                hostname: 'arbor.site',
                pathname: shortcut
            });
        });
    }

    static getShortcut(url) {
        return $.ajax({
            method: 'PUT',
            url: 'https://api.arbor.site',
            contentType: 'application/json',
            headers: {
                'x-api-key': API_KEY
            },
            data: JSON.stringify({
                target: url
            })
        });
    }

    static getIPAddress() {
        // const dns = require('dns');
        // const os = require('os');
        const ip = require("ip");
        return new Promise(function(resolve, reject) {
            resolve(ip.address('en0'));
        });
        // return new Promise(function(resolve, reject) {
            // dns.lookup(os.hostname(), function(err, add, fam) {
                // resolve(add);
            // })
        // });
    }
}
