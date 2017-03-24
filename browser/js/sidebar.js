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

function getMyShortcut(path) {
  return getIPAddress().then(function(ip) {
    var myLink = url.format({
      protocol: 'http',
      hostname: ip,
      port: 3000,
      pathname: path || '/'
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
  $('.sidebar .toggle').toggles({
    clicker:$('.switch_label'),
    width: 50
  }).on('toggle', function(event, isActive) {
    if(isActive) { startServer(); }
    else { stopServer(); }
  });

  new Clipboard('#admin_copy');
  new Clipboard('#share_copy');
  $('.copy_area input').on('click', function(event) {
    const target = $(event.target);
    target.select();
    // if(!target.is(":focus")) {
    // }
  });
  $('#chat-box').on('keydown', function(event) {
    if(event.keyCode == 13) {
      $('#chat-form').submit();
      event.preventDefault();
    }
  });
  $('#chat-form').on('submit', function(event) {
    sendCurrentTextMessage();
    event.preventDefault();
  });
  // $('#start_script').on('click', function() {
  // });
});

function sendCurrentTextMessage() {
  var message = $('#chat-box').val();
  $('#chat-box').val('');
  if(message) {
    console.log('send', message);
  }
}

function startServer() {
    getMyShortcut().then(function(url) {
      $('#share_url').val(url.replace('http://', '')).prop('disabled', false);
    });
    getMyShortcut('/o').then(function(url) {
      $('#admin_url').val(url.replace('http://', '')).prop('disabled', false);
    });
}

function stopServer() {
  $('#share_url').val('').prop('disabled', true);
  $('#admin_url').val('').prop('disabled', true);
}

