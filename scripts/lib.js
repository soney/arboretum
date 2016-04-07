var socket_client = require('socket.io-client');

function getSocket(host) {
    return new Promise(function(resolve, reject) {
        var socket = socket_client.connect(host);
        socket.on('connect', function() {
            resolve(socket);
        });
    });
}

getSocket('http://localhost:3000').then(function(socket) {
    console.log(socket);
});

function getElements(selector) {

}

function click(elements) {

}

function input(elements, val) {

}

function navigate(url) {

}

function connect() {

}

function disconnect() {

}

function handoff() {

}