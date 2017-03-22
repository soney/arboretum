"use strict";

var $ = require('jquery'),
    _ = require('underscore');
require('jquery-ui');
const dns = require('dns');
const os = require('os');
const url = require('url');


const API_KEY = 'FN0FXKCHSRapKomlD7JeF4AJQGNZPKf12Tvv9ebA';
function getShortcut(url) {
    return $.ajax({
        method: 'PUT',
        url: 'https://api.arbor.site',
        contentType: 'application/json',
        headers: { 'x-api-key': API_KEY },
        data: JSON.stringify({
            target: url
        })
    });
}

function getIPAddress() {
  return new Promise(function(resolve, reject) {
    dns.lookup(os.hostname(), function (err, add, fam) {
      resolve(add);
    })
  });
}

function getMyShortcut() {
  return getIPAddress().then(function(ip) {
    var myLink = url.format({
      protocol: 'http',
      hostname: ip,
      port: 3000,
      pathname: '/'
    });
    return getShortcut(myLink)
  }).then(function(result) {
    const shortcut = result.shortcut;
    return url.format({
      protocol: 'http',
      hostname: 'arbor.site',
      pathname: shortcut
    });
  });
}

$(function(){
  $('#start_script').on('click', function() {
    getMyShortcut().then(function(url) {
      $('#script_url').val(url);
    });
  });
});
