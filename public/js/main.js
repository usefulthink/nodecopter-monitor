(function(global) {

    var doc = global.document,
        $ = doc.getElementById.bind(doc),
        query = function (selector, scope) { return (scope || doc).querySelectorAll(); };

    var VENDOR_PREFIX=(function () {
        var r = /^(Moz|Webkit|Khtml|O|ms|Icab)(?=[A-Z])/,
            s = document.getElementsByTagName('script')[0].style;

        for(var p in s) { if(r.test(p)) { return p.match(r)[0]; } }

        if('WebkitOpacity' in s) return 'Webkit';
        if('KhtmlOpacity' in s) return 'Khtml';

        return '';
    } ());
    (function __rafPolyfillInit() {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                || window[vendors[x]+'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                    timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
    }());


    var socket = io.connect('http://localhost:3001'),
        valueDisplay = document.getElementById('display');

    var lastNavdata = null;
    socket.on('navdata', function (data) {
        valueDisplay.innerText = JSON.stringify(data, null, 2);

        lastNavdata = data.demo;
    });

    var camImg = document.getElementById('cam');
    socket.on('image', function(src) {
        console.log('received an image…');
        cam.src=src;
    });


    var drone = {
        keydown: function (e) {
            e.preventDefault();
            switch (e.keyCode) {
                case 87: // W
                    socket.emit("move", "front");
                break;
                case 83: // S
                    socket.emit("move", "back");
                break;
                case 65: // A
                    socket.emit("move", "left");
                break;
                case 68: // D
                    socket.emit("move", "right");
                break;
                case 38: // arrow up
                    socket.emit("move", "up");
                break;
                case 40: // arrow down
                    socket.emit("move", "down");
                break;
                case 37: // arrow left
                    socket.emit("rotate", "counterclockwise");
                break;
                case 39: // arrow right
                    socket.emit("rotate", "clockwise");
                break;
                case 32: // spacebar
                    socket.emit("drone", "takeoff");
                break;
                case 27: // esc
                    socket.emit("drone", "land");
                break;
            }
        },
        mousemove: function (e) {
            var movementX = e.webkitMovementX;
            socket.emit("rotate", movementX);
        }
    };

    $("mouselock").addEventListener("click", function () {
        $("rotor").webkitRequestPointerLock();
    }, false);

    doc.addEventListener("keydown", drone.keydown, false);
    doc.addEventListener("mousemove", drone.mousemove, false);

         /*
            "controlState":"CTRL_LANDED",
            "flyState":"FLYING_OK",
            "batteryPercentage":20,
            "frontBackDegrees":11.155,
            "leftRightDegrees":0.905,
            "clockwiseDegrees":43.913,
            "altitudeMeters":0,
            "xVelocity":0,
            "yVelocity":0,
            "zVelocity":0,
            "frameIndex":0
        */

    var el = document.getElementById('rotor'),
        s = el.style;

    global.onload = function __mainStartup() {
        (function __mainloop(t){
            requestAnimationFrame(__mainloop);

            if(!lastNavdata) { return; }
            s.WebkitTransform = 'rotateX(' + (45-lastNavdata.frontBackDegrees) + 'deg)'
                + ' rotateY(' + lastNavdata.leftRightDegrees + 'deg)'
                + ' rotateZ(' + lastNavdata.clockwiseDegrees + 'deg)'
        } ());
    };
} (this));