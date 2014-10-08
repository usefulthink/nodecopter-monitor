var win = window;

var nodecopterWebGL = {
    /**
     * Expose these objects for debugging purposes
     * (to easily change positions, rotations, etc).
     */
    camera: null,
    scene: null,
    renderer: null,
    floor: null,
    drone: null,
    ambientLight: null,
    spotLight: null,
    directionalLight: null,

    droneModelURL: "",
    navData: null,

    /**
     * Helper function to convert angle degrees to radians.
     * @function
     * @param  {number} The angle in degrees.
     * @return {number} The angle in radians.
     */
    deg2Rad: (function () {
        var RAD_PER_DEG = Math.PI / 180;
        return function (deg) {
            return deg * RAD_PER_DEG;
        };
    }()),


    init: function (container) {
        this.width = win.innerWidth;
        this.height = win.innerHeight;

        win.addEventListener("resize", this.setSize.bind(this), false);

        // Initialize everything.
        this.scene = this.initThreeJS(container);
        this.initFloorModel(this.scene);
        this.initLightning(this.scene);

        // Start rendering the scene once the drone model is loaded
        this.initDroneModel(this.scene, function () {
            this.render();
        }.bind(this));
    },

    /**
     * Resets the camera aspect ratio and the renderer size.
     * To be called whenever the display size changes.
     * @param {number} width  The new display width.
     * @param {number} height The new display height.
     */
    setSize: function (width, height) {
        this.width = typeof width === "number" ? width : win.innerWidth;
        this.height = typeof height === "number" ? width : win.innerHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
    },

    /**
     * Sets the demo navdata from the drone so the webGL drone can move.
     * @param {object} navData The navdata.demo data from the drone.
     */
    setNavData: function (navData) {
        this.navData = navData;
    },

    /**
     * Initializes the camera, renderer and scene and attaches
     * the canvas to the provided DOM node.
     */
    initThreeJS: function (container) {
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 8000);
        this.camera.position.set(0, 200, 300);

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize(this.width, this.height);
        this.renderer.shadowMapEnabled = true;

        container.appendChild(this.renderer.domElement);

        return new THREE.Scene();
    },

    /**
     * Initializes the floor model.
     * @param  {object} scene The THREE.js scene object.
     */
    initFloorModel: function (scene) {
        /*
         var planeGeo = new THREE.PlaneGeometry(1200, 2000, 1, 1);
         var planeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
         this.floor = new THREE.Mesh(planeGeo, planeMat);
         this.floor.rotation.x = -Math.PI/2;
         this.floor.receiveShadow = true;
         scene.add(this.floor);
         */

        var floorTileCanvas = document.createElement("canvas"),
            context = floorTileCanvas.getContext("2d");

        floorTileCanvas.width = floorTileCanvas.height = 512;
        context.fillStyle = "#aac";
        context.fillRect(0, 0, 512, 512);
        context.fillStyle = "#ccf";

        context.fillRect(0, 0, 256, 256);
        context.fillRect(256, 256, 256, 256);

        var floorTexture = new THREE.Texture(floorTileCanvas, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping),
            floorMaterial = new THREE.MeshLambertMaterial({map: floorTexture});

        floorTexture.needsUpdate = true;
        floorTexture.repeat.set(5000, 5000);

        var geometry = new THREE.PlaneGeometry(100, 100);

        this.floor = new THREE.Mesh(geometry, floorMaterial);

        this.floor.rotation.x = -Math.PI / 2;
        this.floor.scale.set(10000, 10000, 10000);
        this.floor.receiveShadow = true;

        scene.add(this.floor);
    },

    /**
     * Loads and initializes the drone model.
     * @param  {object}   scene    The THREE.js scene object.
     * @param  {function} callback A callback function to be called when the model is loaded.
     */
    initDroneModel: function (scene, callback) {
        new THREE.JSONLoader().load(this.droneModelURL, function (geometry) {
            var material = new THREE.MeshFaceMaterial();
            this.drone = new THREE.Mesh(geometry, material);
            this.drone.scale.set(0.8, 0.8, 0.8);
            this.drone.castShadow = true;
            scene.add(this.drone);

            callback();
        }.bind(this));
    },

    /**
     * Initializes three different lights.
     */
    initLightning: function (scene) {
        this.ambientLight = new THREE.AmbientLight(0x404030);
        scene.add(this.ambientLight);

        this.spotLight = new THREE.SpotLight(0xffeedd);
        this.spotLight.position.set(0, 1000, 0);
        this.spotLight.castShadow = true;
        this.spotLight.shadowDarkness = 0.7;

        // this.spotLight.shadowCameraVisible = true;

        scene.add(this.spotLight);

        this.directionalLight = new THREE.DirectionalLight(0xffeedd);
        this.directionalLight.position.set(0, 1000, 1000);
        // this.directionalLight.castShadow = true; // Works only with orthographic camera.
        scene.add(this.directionalLight);
    },

    /**
     * Renders the scene and calls itself via requestAnimationFrame.
     */
    render: function () {
        requestAnimationFrame(this.render.bind(this));

        if (this.navData) {
            var roll = this.deg2Rad(this.navData.rotation.leftRight),
                yaw = -this.deg2Rad(this.navData.rotation.clockwise),
                pitch = -this.deg2Rad(this.navData.rotation.frontBack);

            this.drone.eulerOrder = 'YZX';
            this.drone.rotation.set(pitch, yaw, roll);
            this.drone.position.y = 10 + this.navData.altitudeMeters * 100;

            //this.drone.position.x += this.navData.xVelocity / 60;
            //this.drone.position.z += this.navData.yVelocity / 60;
        }

        if (typeof this.onRender === "function") {
            this.onRender.call(this);
        }

        this.camera.lookAt(this.drone.position);
        this.renderer.render(this.scene, this.camera);
    }
};


var $ = document.getElementById.bind(document);

var batteryMeterEl = $('batteryMeter'),
    droneStateEl = $('droneStateData'),
    imgEl = $('camImage'),
    containerEl = $('nodecopter-webgl');

var navData = null, droneState = null,
    lastBatteryPercentage = 100;

var socket = io.connect('http://localhost:3001');

socket.on('navdata', function (data) {
    droneState = data.droneState;
    navData = data;
    nodecopterWebGL.setNavData(navData);
});

var isImageLoading = false;
socket.on('image', function(src) {
    if(isImageLoading) { return; }

    var tmpImg = new Image();
    tmpImg.src = src;
    tmpImg.onload = function() {
        isImageLoading = false;
        imgEl.src = src;
    };
    isImageLoading = true;
});


// initialize webgl-stuff
nodecopterWebGL.droneModelURL = "model/ARDrone.three.json";
nodecopterWebGL.init(containerEl);

nodecopterWebGL.onRender = function () {
    if(!navData) { return; }

    droneStateEl.innerHTML = JSON.stringify(navData, null, 2);

    if (navData.batteryPercentage !== lastBatteryPercentage) {
        lastBatteryPercentage = navData.batteryPercentage;
        batteryMeterEl.innerHTML = lastBatteryPercentage;
    }
};