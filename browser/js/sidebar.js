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
    if(event.keyCode == 13 && !(event.ctrlKey || event.altKey || event.metaKey || event.shiftKey)) {
      $('#chat-form').submit();
      event.preventDefault();
    }
  });
  $('#chat-form').on('submit', function(event) {
    sendCurrentTextMessage();
    event.preventDefault();
  });
  // disableChat();
  enableChat();

  $('#task').on('click', function() {
    var script_bar = $('#script_bar');
    var task_button = $('#task');
    if(script_bar.is(':hidden')) {
      task_button.addClass('active');
      script_bar.show();
    } else {
      task_button.removeClass('active');
      script_bar.hide();
    }
  });
});


function addChatMessage(sender, message, options) {
  const container = $('#chat-lines');
  var at_bottom = Math.abs(container.scrollTop() + container.height() - container.prop('scrollHeight')) < 100;
  container.append(getChatMessageElement(sender, message, options))
  if(at_bottom) {
    container.scrollTop(container.prop('scrollHeight'));
  }
}

function getChatMessageElement(sender, message, options) {
  options = _.extend({
    class: '',
    color: ''
  }, options);
  var rv = $('<li />', {class: 'chat-line ' + options.class});
  if(sender) {
      rv.append($('<span />', {class: 'from', text: sender, style: 'color:'+options.color+';'}))
  }
  rv.append($('<span />', {class: 'message', html: mdify(message)}));
  return rv;
}

function sendCurrentTextMessage() {
  var message = $('#chat-box').val();
  $('#chat-box').val('');
  if(message) {
    if(message[0] == '/') {
      var spaceIndex = message.search(/\s/);
      if(spaceIndex < 0) {
        spaceIndex = message.length;
      }

      var command = message.slice(1, spaceIndex);
      var args = message.slice(spaceIndex+1);
      doCommand(command, args);
    } else {
      addChatMessage('Me', message);
    }
  }
}
function mdify(message) {
  //  var tmp = document.createElement("DIV");
  //  tmp.innerHTML = message;
  //  var rv = tmp.textContent || tmp.innerText || "";
  var rv = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
   return rv.replace(/\*\*([^*]+)\*\*/g, "<b>$1<\/b>").replace(/\*([^*]+)\*/g, "<i>$1<\/i>");
}

const COMMANDS = [
  {
    name: 'clear',
    description: 'Clear the chat window',
    action: clearChat
  }, {
    name: 'title',
    description: 'Set the title of the task (use ampersands before variable names, like *&var*)',
    args: ['description'],
    action: setTitle
  }, {
    name: 'help',
    description: 'Print out this message',
    action: printCommandHelp
  }, {
    name: 'set',
    description: 'Set a variable value',
    args: ['var', 'val'],
    action: setVar
  }
];

function setVar(value) {
  console.log(value);
}

function setTitle(title) {
  $('#task-name').text(title);
}

function printCommandHelp(starterLine) {
  starterLine = starterLine || '';
  var commandDescriptions = _.map(COMMANDS, function(c) {
    var name = '**/'+c.name+'**';
    var args = _.map(c.args || [], function(a) {
      return '{'+a+'}';
    }).join(' ');
    if(args.length > 0) {
      name = name + ' '+args+'';
    }
    name = name + ': '+c.description+'';
    return name;
  });
  var commandDescriptionString = starterLine+'\n'+commandDescriptions.join('\n');
  addChatMessage('🤖 Arbi', commandDescriptionString, {color: '#307f8c'});
}

function doCommand(command, args) {
  var matchingCommands = _.filter(COMMANDS, function(c) {
    return c.name.toUpperCase() === command.toUpperCase();
  });
  addChatMessage(false, '/'+command+' '+args, {class: 'command'});
  if(matchingCommands.length === 0) {
    printCommandHelp('*/'+command+'* is not a recognized command');
  } else {
    _.each(matchingCommands, function(c) {
      c.action(args);
    });
  }
}

function clearChat() {
  $('#chat-lines').children().remove();
}

function disableChat() {
  $('#chat-box').val('').prop('disabled', true).hide();
}

function enableChat() {
  $('#chat-box').prop('disabled', false).show();
  printCommandHelp('Commands:')
}

function startServer() {
  $('#share_url').val('loading...');
  $('#admin_url').val('loading...');
  enableChat();
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
  clearChat();
  disableChat();
}
