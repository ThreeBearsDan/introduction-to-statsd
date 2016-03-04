"use strict";
var express = require('express');
var app = express();
var path = require('path')
var dgram = require('dgram');
var client = dgram.createSocket('udp4');
var WebSockerServer = require('ws').Server;
var net = require('net');

var server = require('http').createServer();
var config = require('./config');
var wss = new WebSockerServer({
  server: server
});
var socket = net.connect({
  host: "127.0.0.1",
  port: config.mgmt_port
});


function broadcast(type, data) {
  wss.clients.forEach(function each(client) {
    client.send(JSON.stringify({
      type: type,
      data: data.toString()
    }));
  });
}

process.stdin.on('data', function (data) {
  broadcast('console', data)
})

socket.on('data', function (data) {
  broadcast('admin', data)
})

/**
 * 写入 statsd
 *
 * @param msg
 * @param port
 */
function line(msg, port) {
  let message = new Buffer('demo0.' + msg);
  // standard statsd
  client.send(message, 0, message.length, port, 'localhost', err=> {
    if (err) {
      console.error(arguments);
    }
  })
  // oneapmstatsd
  client.send(message, 0, message.length, 8251, 'localhost', err=> {
    if (err) {
      console.error(arguments);
    }
  })
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/line', function (req, res) {
  res.end("ok");
  line(req.query.message, config.port);
});

app.get('/admin', function (req, res) {
  res.end("ok");
  socket.write(req.query.message);
});

server.on('request', app);
server.listen(8080);


