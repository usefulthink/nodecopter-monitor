remote-control and monitoring for your nodecopter
====

note: the code is a complete mess and will eventually be reworked and
documented.

usage
----

Install the module with `npm install nodecopter-monitor`, then integrate it
into your project with

    var arDrone = require('ar-drone'),
        client = arDrone.createClient();

    require('nodecopter-monitor').init(client);

after starting your program you can access the monitoring via `http://localhost:3001/webgl.html`.
From the monitoring-page you can also remote-control the drone with the following key-commands:

    space – takeoff
    escape - land
    W/S/A/D – move front/back/left/right
    cursor-keys – up/down and rotate cw/ccw
    1/2/3/4/5 – animations (flipAhead/flipLeft/yawShake/doublePhiThetaMixed/wave)
 
