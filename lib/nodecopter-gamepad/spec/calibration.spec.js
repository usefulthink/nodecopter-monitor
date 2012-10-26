var calibration = require('../public/gamepad-calibration.js');

var cInit = calibration.initCalibrators,
    calibrated = calibration.getCalibratedValue;

describe('Calibration', function () {
    // setup: reset calibration-data
    beforeEach(function() { cInit([]); });

    it("should preseve values when uninitialized", function(done) {
        expect(calibrated([0.5,0,0,0], 0)).toEqual(0.5);
        expect(calibrated([0,0,0,0.6], 3)).toEqual(0.6);

        done();
    });

    it("should handle identity-transform", function(done) {
        cInit([ { min: -1, max: 1, center: 0 } ]);

        expect(calibrated([0.5,0,0,0], 0)).toEqual(0.5);
        expect(calibrated([-0.5,0,0,0], 0)).toEqual(-0.5);

        done();
    });

    it("should handle scaling for negative values", function(done) {
        cInit([
            { min: -0.5, center: 0, max: 1 }
        ]);

        expect(calibrated([0.5], 0)).toEqual(0.5);
        expect(calibrated([-0.5], 0)).toEqual(-1);
        expect(calibrated([-0.1], 0)).toEqual(-0.2);

        done();
    });

    it("should handle scaling for positive values", function(done) {
        cInit([
            { min: -1, center: 0, max: 0.5 }
        ]);

        expect(calibrated([-0.5], 0)).toEqual(-0.5);
        expect(calibrated([0.5], 0)).toEqual(1);
        expect(calibrated([0.2], 0)).toEqual(0.4);

        done();
    });

    it("should handle center-offset", function(done) {
        cInit([
            { min: -0.4, center: 0.1, max: 0.6 }
        ]);

        expect(calibrated([-0.4], 0)).toEqual(-1);
        expect(calibrated([0.6], 0)).toEqual(1);
        expect(calibrated([0.1], 0)).toEqual(0);

        done();
    });

    it("should handle clipping", function(done) {
        cInit([
            { min: -0.4, center: 0.1, max: 0.6 }
        ]);

        expect(calibrated([-0.6], 0)).toEqual(-1);
        expect(calibrated([0.8], 0)).toEqual(1);

        done();
    });

    it("should throw errors for invalid calibration-data", function(done) {
        var testcases = [
            { data: {min: 1, max: 1, center: 0}, msg: 'invalid calibration-data (min >= center)' },
            { data: {min: 0, max: 1, center: 0}, msg: 'invalid calibration-data (min >= center)' },
            { data: {min: -1, max: -1, center: 0}, msg: 'invalid calibration-data (max <= center)' },
            { data: {min: -1, max: 0, center: 0}, msg: 'invalid calibration-data (max <= center)' }
        ];

        testcases.forEach(function(testcase) {
            expect(function() { cInit([testcase.data]) }).toThrow(testcase.msg);
        });

        done();
    });
});