(function(global) {
    "use strict";

    // lookup-tables
    var BTN = {
        // Face (main) buttons
        FACE_1: 0, FACE_2: 1, FACE_3: 2, FACE_4: 3,

        // Top/bottom shoulder buttons
        LEFT_SHOULDER: 4, RIGHT_SHOULDER: 5,
        LEFT_SHOULDER_BOTTOM: 6, RIGHT_SHOULDER_BOTTOM: 7,

        SELECT: 8, START: 9,

        // Analogue stick-buttons (if depressible)
        LEFT_ANALOGUE_STICK: 10,
        RIGHT_ANALOGUE_STICK: 11,

        // Directional (discrete) pad
        PAD_TOP: 12, PAD_BOTTOM: 13, PAD_LEFT: 14, PAD_RIGHT: 15
    };

    var AXES = {
        LEFT_ANALOGUE_HOR: 0, LEFT_ANALOGUE_VERT: 1,
        RIGHT_ANALOGUE_HOR: 2, RIGHT_ANALOGUE_VERT: 3
    };


    var exports = global.nodecopter = global.nodecopter || {},
        socket = null;

    /**
     * initializes the gamepad-controls
     *
     * @param websocket the websocket control-events are sent to
     * @param options TODO...
     *     some ideas:
     *       - calibration-data
     *       - handler-callbacks for 'gamepadState'-events
     *       - button-configuration
     */
    exports.initGamepad = function(websocket, options) {
        socket = websocket;

        // kick-off control-loop
        (function __controlLoop() {
            requestAnimationFrame(__controlLoop);

            // TODO: only works in newer versions of chrome, adapt for mozilla-API…
            var gamepad = navigator.webkitGetGamepads()[0];

            // TODO: emit events gamepadConnect/gamepadDisconnect
            if(!gamepad) { return; }

            handleGamepadState(gamepad);
        } ());
    };

    // initialize
    var lastGamepadState = {
        leftX: 0.0, leftY: 0.0,
        btnStart: false, btnStop: false,
        btnTurnCW: false, btnTurnCCW: false,
        btnUp: false, btnDown: false
    };

    function handleGamepadState(gamepad) {
        var leftX, leftY;

        leftX = exports.getCalibratedValue(gamepad, AXES.LEFT_ANALOGUE_HOR);
        leftY = exports.getCalibratedValue(gamepad, AXES.LEFT_ANALOGUE_VERT);

        // this is for better readability only and might be inlined.
        // (I suspect the js-engine will likely inline it anyway).
        var gamepadState = {
            // toFixed(1) to prevent too many useless nav-packets
            leftX: leftX.toFixed(1),
            leftY: leftY.toFixed(1),

            // buttons are converted to boolean for easier handling
            btnStart: (1==gamepad.buttons[BTN.START]),
            btnStop: (1==gamepad.buttons[BTN.SELECT]),
            btnTurnCW: (1==gamepad.buttons[BTN.RIGHT_SHOULDER]),
            btnTurnCCW: (1==gamepad.buttons[BTN.LEFT_SHOULDER]),
            btnDown: (1==gamepad.buttons[BTN.FACE_1]),
            btnUp: (1==gamepad.buttons[BTN.FACE_4]),

            btnFlipFwd: (1==gamepad.buttons[BTN.PAD_TOP]),
            btnFlipBwd: (1==gamepad.buttons[BTN.PAD_BOTTOM]),
            btnFlipLeft: (1==gamepad.buttons[BTN.PAD_LEFT]),
            btnFlipRight: (1==gamepad.buttons[BTN.PAD_RIGHT])
        };

        // ---- logging
        // TODO: emit a gamepadState-event or something

        // ---- analogue-stick left/right
        var horiz=gamepadState.leftX;
        if(horiz != lastGamepadState.leftX) {
            if(horiz<0) { // negative: left
                socket.emit('move', { action: 'left', speed: -horiz });
            } else if(horiz>0) {
                socket.emit('move', { action: 'right', speed: horiz });
            } else { // == 0
                socket.emit('move', { action: 'left', speed: 0 });
                socket.emit('move', { action: 'right', speed: 0 });
            }
        }

        // ---- analogue-stick up/down
        var leftY=gamepadState.leftY;
        if(leftY != lastGamepadState.leftY) {
            if(leftY<0) { // negative: up
                socket.emit('move', { action: 'front', speed: -leftY });
            } else if(leftY>0) {
                socket.emit('move', { action: 'back', speed: leftY });
            } else { // == 0
                socket.emit('move', { action: 'front', speed: 0 });
                socket.emit('move', { action: 'back', speed: 0 });
            }
        }

        // ---- takeoff/land
        if(gamepadState.btnStart && !lastGamepadState.btnStart) {
            if(!droneState.flying) {
                socket.emit('drone', { action: 'takeoff' });
            } else {
                socket.emit('drone', { action: 'land' });
            }
        }

        // ---- stop-button
        if(gamepadState.btnStop && !lastGamepadState.btnStop) {
            socket.emit('drone', { action: 'stop' });
        }

        // ---- up/down/cw/ccw buttons (TODO: add accelleration for more fine-grained control)
        var evMap = {
            btnUp: { ev: 'move', action: 'up', mode: 'toggleSpeed' },
            btnDown: { ev: 'move', action: 'down', mode: 'toggleSpeed' },
            btnTurnCW: { ev: 'move', action: 'clockwise', mode: 'toggleSpeed' },
            btnTurnCCW: { ev: 'move', action: 'counterClockwise', mode: 'toggleSpeed' },

            btnFlipFwd: { ev: 'animate', action: 'flipAhead', mode: 'trigger' },
            btnFlipBwd: { ev: 'animate', action: 'flipBehind', mode: 'trigger' },
            btnFlipLeft: { ev: 'animate', action: 'flipLeft', mode: 'trigger' },
            btnFlipRight: { ev: 'animate', action: 'flipRight', mode: 'trigger' }
        };

        Object.keys(evMap).forEach(function(btnId) {
            var evData = evMap[btnId],
                curr = gamepadState[btnId],
                last = lastGamepadState[btnId];

            if('toggleSpeed' == evData.mode) {
                if(curr && !last) { // btnPress
                    socket.emit(evData.ev, { action: evData.action, speed: 1 });
                } else if(!curr && last) { // btnRelease
                    socket.emit(evData.ev, { action: evData.action, speed: 0 });
                }
            } else if('trigger' == evData.mode) {
                if(curr && !last) {
                    socket.emit(evData.ev, { action: evData.action, duration: 15 });
                }
            }
        });

        lastGamepadState = gamepadState;
    };
} (this));