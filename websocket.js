var WebSocketServer = require('websocket').server;
var http = require('http');
var Memcached = require('memcached');
var memcached = new Memcached('127.0.0.1:11211');
const crypto = require("crypto");

function signHmacSha256(key, str) {
  let hmac = crypto.createHmac("sha256", key);
  let signed = hmac.update(new Buffer(str, 'utf-8')).digest("hex");
  return signed
}

var server = http.createServer(function(request, response) {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
});
server.listen(1337, function() { });

// create the server
wsServer = new WebSocketServer({
  httpServer: server
});
var clients = [];

// WebSocket server
wsServer.on('request', function(request) {
    var hmacCheck = signHmacSha256('wsConnectionSecurev1',request.origin);
    console.log(request);
    console.log(hmacCheck,request.key);
    
    /*if (hmacCheck === request.key)
    {*/
        var connection = request.accept(null, request.origin);
        console.log(request);
        clients.push(connection);
        // This is the most important callback for us, we'll handle
        // all messages from users here.
        connection.on('message', function(message) {
          if (message.type === 'utf8') {
            // process WebSocket message
            memcached.set('new_key', JSON.parse(message.utf8Data), 1000, function (err) { /* stuff */ });
            console.log(JSON.parse(message.utf8Data));
            for (var i=0; i < clients.length; i++) {
                clients[i].sendUTF(message.utf8Data);
                console.log(i+" client");
              }
            //connection.sendUTF(message.utf8Data);
          }
        });

        connection.on('close', function(connection) {
          // close user connection
          clients.splice(clients.indexOf(connection), 1);
        });
    //}
});
