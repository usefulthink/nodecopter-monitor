# nodecopter-gamepad

gamepad controls for your nodecopter.

__please note that nothing of the stuff described below actually works as of now.__

The control-data from the gamepad is received by the browser which will then send control-commands
via Websocket to a server controlling the drone.

## integration

this is a first try to create a nodecopter-module which can be seamlessly integrated into existing
nodecopter applications. Inspired by @bkw, this is also a try to find some sort of interface for
these kind of nodecopter-modules everyone could agree on.

In your serverside-application, this will get you up and running

    // server.js
    var drone = require('ar-drone').createClient(),
        http = require('http'),
        WebsocketServer = require('websocket').server,

        httpServer = http.createServer(),
        wss = new WebSocketServer({ httpServer:httpServer });

    var gamepadReceiver = require('nodecopter-gamepad').init(drone, httpServer, wss);

    server.listen(3000);

The gamepad-module will do the following during the initialization:
 * attach request-handlers for the urls `/nodecopter-gamepad/gamepad-client.js` and
   `/nodecopter-gamepad/gamepad-test.html` to the http-server.
 * attach a connection-handler to the websocket-server, filtering messages sent by the client-library
 * attach a `navdata`-handler to the ar-drone-client
 * set up the sending of incoming control-commands to the drone

You can now just go to `http://localhost:3000/nodecopter-gamepad/gamepad-test.html` and should be able to start flying.

In order to integrate it into your own frontend, you'll need to add the following to your html:

    <script src="/nodecopter-gamepad/gamepad-client.js"></script>
    <script>
      nodecopter.initGamepad();
    </script>
