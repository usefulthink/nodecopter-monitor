exports.init = function(drone) {
    var express = require('express'),
        http = require('http'),
        path = require('path');

    var app = express(),
        srv = http.createServer(app),
        io = require('socket.io').listen(srv);

    drone.config('general:navdata_demo', 'TRUE');

    app.configure(function(){
      app.set('port', process.env.PORT || 3001);
      app.use(app.router);
      app.use(express.static(path.join(__dirname, 'public')));
    });

    io.set('log level', 0);

    io.sockets.on('connection', function (socket) {
        console.log('socket.io connected');

        socket.on("move", function (cmd) {
            if(!drone[cmd.action]) { return; }

            console.log('move', cmd);
            drone[cmd.action](cmd.speed);
        });

        socket.on("animate", function (cmd) {
            console.log('animate', cmd);
            drone.animate(cmd.action, cmd.duration);
        });

        socket.on("drone", function (cmd) {
            if(!drone[cmd.action]) { return; }

            console.log('drone command: ', cmd);
            drone[cmd.action]();
        });
    });

    drone.on('navdata', function(data) {
        io.sockets.emit('navdata', data);
    });

    srv.listen(app.get('port'), function(){
      console.log("Express server listening on port " + app.get('port'));
    });

    var fs = require("fs"),
        pngstream = drone.createPngStream(),
        currentImg,
        i = 0;

    var imageSendingPaused = false;
    pngstream.on("data", function (frame) {
        currentImg = frame;

        //if(imageSendingPaused) { return; }

        io.sockets.emit("image", "/image/" + i++);

        //imageSendingPaused = true;
        //setTimeout(function() { imageSendingPaused = false; }, 100); // limit to 10fps
    });

    app.get('/image/:id', function (req, res) {
        res.writeHead(200, { "Content-Type": "image/png" });
        res.end(currentImg, "binary");
    });

    return app;
};
