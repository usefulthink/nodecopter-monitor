var express = require('express'),
    http = require('http'),
    path = require('path');

var app = express(),
    srv = http.createServer(app),
    io = require('socket.io').listen(srv);

app.configure(function(){
  app.set('port', process.env.PORT || 3001);
  app.use(express.favicon());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

var arDrone = require('ar-drone'),
    client = arDrone.createClient();

client.config('general:navdata_demo', 'TRUE');

io.set('log level', 0);

io.sockets.on('connection', function (socket) {
    console.log('socket.io connected');

    socket.on("move", function (cmd) {
        console.log('move', cmd.action);
        client[cmd.action](cmd.speed);
    });

    socket.on("animate", function (cmd) {
        console.log('animate', cmd.action);
        client[cmd.action](cmd.duration);
    });

    socket.on("drone", function (cmd) {
        console.log('drone command: ', cmd.action);
        client[cmd.action]();
    });
});

srv.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});



var fs = require("fs"),
    pngstream = client.createPngStream(),
    currentImg,
    i = 0;

client.on('navdata', function(data) {
    io.sockets.emit('navdata', data);
});

var imageSendingPaused = false;
pngstream.on("data", function (frame) {
    currentImg = frame;

    if(imageSendingPaused) { return; }

    io.sockets.emit("image", "/image/" + i++);

    imageSendingPaused = true;
    setTimeout(function() {imageSendingPaused = false; }, 100);
});

app.get('/image/:id', function (req, res) {
    res.writeHead(200, { "Content-Type": "image/png" });
    res.end(currentImg, "binary");
});