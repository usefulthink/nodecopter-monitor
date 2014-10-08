exports.init = function(drone) {
    var express = require('express'),
        http = require('http'),
        path = require('path'),
        util = require('util');

    var app = express(),
        srv = http.createServer(app),
        io = require('socket.io').listen(srv);

    io.set('log level', 0);

    app.configure(function() {
      app.set('port', process.env.PORT || 3001);
      app.use(app.router);
      app.use(express.static(path.join(__dirname, 'public')));
    });

    drone.config('general:navdata_demo', 'TRUE');


    // send required parts of navdata to the client
    drone.on('navdata', function(data) {
        if(!data.demo) { return; }

        var clientData = {
            droneState: { flying: data.droneState.flying }
        };

        var navdataClientKeys = ['controlState', 'flyState', 'batteryPercentage', 'altitudeMeters'];

        for(var i=0, n=navdataClientKeys.length; i<n; i++) {
            var k = navdataClientKeys[i];
            clientData[k] = data.demo[k];
        }

        clientData.rotation = {
            leftRight: data.demo.rotation.leftRight,
            frontBack: data.demo.rotation.frontBack,
            clockwise: data.demo.rotation.clockwise
        };

        io.sockets.emit('navdata', clientData);
        //console.log(util.inspect(clientData, {colors:true}));
    });

    srv.listen(app.get('port'), function(){
      console.log("Express server listening on port " + app.get('port'));
    });




    // notify client and serve images
    var pngstream = drone.createPngStream(),
        currentImg, i = 0;

    pngstream.on("data", function (frame) {
        currentImg = frame;
        io.sockets.emit("image", "/image/" + i++);
    });

    app.get('/image/:id', function (req, res) {
        res.writeHead(200, { "Content-Type": "image/png" });
        res.end(currentImg, "binary");
    });

    return app;
};
