(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = "#define RADIUS 2.0\n#define STEP 1.0\n\nprecision mediump float;\nvarying vec2 vTextureCoord;\nuniform sampler2D uSampler;\nuniform vec2 sizePx;\n\nvoid main() {\n    vec4 color = vec4(0);\n\n    vec2 pixelSize = vec2(1.0) / sizePx.xy * 4.0;\n\n    for (float x = -RADIUS; x <= RADIUS; x += 1.0) {\n        for (float y = -RADIUS; y <= RADIUS; y += 1.0) {\n            color += texture2D(uSampler, vTextureCoord - vec2(pixelSize.x * x * STEP, pixelSize.y * y * STEP));\n        }\n    }\n\n    gl_FragColor = color / pow(RADIUS * 2.0 + 1.0, 2.0);\n}\n";

},{}],2:[function(require,module,exports){
module.exports = "precision mediump float;\n\n#define M_PI 3.1415926535897932384626433832795\n\nvarying vec2 vTextureCoord;\nuniform vec2 sizePx;\n\nuniform vec4 sources[16];\nuniform int sourcesCount;\nuniform vec2 mouse;\n\nuniform vec4 faces[16];\nuniform int facesCount;\n\nuniform vec2 cameraPos;\nuniform vec2 scaleFactor;\n\nuniform bool debug;\n\nbool ccw(in vec2 a, in vec2 b, in vec2 c) {\n    // Checks if three vectors are placed in a CCW order\n    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);\n}\n\nbool intersects(in vec2 a, in vec2 b, in vec2 c, in vec2 d) {\n    // Fast intersection check based on vertex order\n    return ccw(a, c, d) != ccw(b, c, d) && ccw(a, b, c) != ccw(a, b, d);\n}\n\nvec2 flip(in vec2 v) {\n    return vec2(v.x, 1.0 - v.y);\n}\n\nvec2 applyCameraTransformation(in vec2 point) {\n    return point - cameraPos;\n}\n\nfloat angleBetween(in float start, in float end)\n{\n    return mod(end - start, M_PI * 2.0);\n}\n\nbool isBetween(in float startAngle, in float endAngle, in float testAngle) {\n    float a1 = abs(angleBetween(startAngle, testAngle));\n    float a2 = abs(angleBetween(testAngle, endAngle));\n    float a3 = abs(angleBetween(startAngle, endAngle));\n    return (a1 + a2) - a3 < 1.0;\n}\n\nvoid main() {\n    // pixel size in units\n\n    vec2 pixelSize = vec2(1.0) / sizePx.xy;\n\n    // vec2 mousePos = mouse * pixelSize;\n\n    // Current position in pixels\n    vec2 pixelCoord = flip(vTextureCoord) / pixelSize;\n\n    // Count & total intensity of light sources that affect this point\n    vec4 lightValue = vec4(0.0);\n    float lightCount = 0.0;\n\n    // sources[0] = mouse;\n\n    for (int sourceIndex = 0; sourceIndex < 256; sourceIndex += 3) {\n        // Loop through light sources\n        if (sourceIndex >= sourcesCount * 3) {\n            break;\n        }\n\n        for (float dx = 0.0; dx < 1.0; dx += 1.0) {\n            for (float dy = 0.0; dy < 1.0; dy += 1.0) {\n                vec4 source = vec4(sources[sourceIndex].xy + vec2(dx, dy) * 8.0, sources[sourceIndex].zw);\n                vec4 sourceColor = sources[sourceIndex + 1];\n                vec2 sourceAngle = sources[sourceIndex + 2].xy;\n\n                // Distance from current light source to current point\n                float distanceFromSource = distance(applyCameraTransformation(source.xy), applyCameraTransformation(pixelCoord));\n                vec2 offset = pixelCoord - source.xy;\n                float angleFromSource = atan(offset.y, offset.x);\n\n                if (debug) {\n                    // Draw light position & radius\n                    if (distanceFromSource < 5.0) {\n                        gl_FragColor = vec4(sourceColor.xyz, 0.1);\n                        return;\n                    }\n                    if (abs(distanceFromSource - source.z) < 5.0) {\n                        if ((sourceAngle.x == sourceAngle.y) || isBetween(sourceAngle.x, sourceAngle.y, angleFromSource)) {\n                            gl_FragColor = vec4(sourceColor.x, sourceColor.y, sourceColor.z, 0.1);\n                            return;\n                        }\n                    }\n                    // if (sourceAngle.x != sourceAngle.y) {\n                    //     if (angleFromSource - (offset.x + offset.y) / 2.0 < 2.0) {\n                    //         gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);\n                    //     }\n                    // }\n                }\n\n                if (distanceFromSource > source.z) {\n                    continue;\n                }\n\n                if ((sourceAngle.x != sourceAngle.y) && !isBetween(sourceAngle.x, sourceAngle.y, angleFromSource)) {\n                    continue;\n                }\n\n                // Check if segment between this point and current light source\n                // is blocked by any face\n                bool isSourceBlocked = false;\n                for (int faceIndex = 0; faceIndex < 256; faceIndex++) {\n                    if (faceIndex >= facesCount) {\n                        break;\n                    }\n                    if (intersects(applyCameraTransformation(source.xy), pixelCoord, applyCameraTransformation(faces[faceIndex].xy), applyCameraTransformation(faces[faceIndex].zw))) {\n                        // This light is blocked by one of the faces.\n                        // We don't count it.\n                        isSourceBlocked = true;\n                    }\n                }\n\n                if (!isSourceBlocked) {\n                    // Current light source affected this point, let's increase\n                    // lightValue & lightCount for this point\n                    // based on the distance from light source.\n                    // (The closer to the light source, the higher the value)\n                    float radius = source.z;\n                    float intensity = source.w;\n                    float val = max(radius - distanceFromSource, 0.0) / radius * intensity;\n                    lightValue += val * sourceColor;\n                    lightCount += 1.0;\n                    // val = max(radius - distanceFromSource, 0.0) / radius;\n                    // gl_FragColor = vec4(val, val, val, val);\n                    // return;\n                }\n            }\n        }\n    }\n\n    // lightValue /= 4.0;\n\n    // Let's cap maximum lightValue to 0.5 to prevent too much lightness\n    gl_FragColor = vec4(min(lightValue.x, 0.75), min(lightValue.y, 0.75), min(lightValue.z, 0.75), min(lightValue.w, 0.75));\n\n    // gl_FragColor = lightValue;\n}\n";

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var lightFragSource = require('./light.frag');
var blurFragSource = require('./blur.frag');

var LightSystem = exports.LightSystem = function () {
    function LightSystem(w, h, debug) {
        _classCallCheck(this, LightSystem);

        // this.sprite = game.add.sprite(0, 0);
        // this.w = window.innerWidth;
        // this.h = window.innerHeight;
        // var scale = 4;
        // this.w = window.innerWidth / scale;
        // this.h = window.innerHeight / scale;
        this.w = w || 256;
        this.h = h || 256;
        // TODO: Make image invisible *properly*
        // this.image = game.add.sprite(0, 0);
        // this.image = new Phaser.Graphics(game, 0, 0);
        this.lightTexture = game.add.renderTexture(this.w, this.h, 'lightTexture');
        this.lightImage = game.add.image(1048576, 1048576);
        this.lightImage.width = this.w;
        this.lightImage.height = this.h;

        // this.lightImage.blendMode = 1;

        // this.lightImage.fixedToCamera = true;
        this.lightImage.smoothed = true;
        // this.lightImage.renderable = false;
        this.scaleFactor = new Phaser.Point(window.innerWidth / this.w, window.innerHeight / this.h);

        this.renderedImage = game.add.image(0, window.innerHeight, this.lightTexture);
        this.renderedImage.width = window.innerWidth;
        this.renderedImage.height = window.innerHeight;
        this.renderedImage.fixedToCamera = true;
        this.renderedImage.scale.y *= -1;
        this.renderedImage.smoothed = true;
        // console.log('Initial light sprite scale:', this.sprite.scale.x, this.sprite.scale.y);
        // this.sprite.scale.x *= this.scaleFactor.x;
        // this.sprite.scale.y *= this.scaleFactor.y;
        // console.log('Creating light sprite, size', this.w, this.h, 'scale', this.scaleFactor.x, this.scaleFactor.y);
        // this.sprite.width = window.innerWidth;
        // this.sprite.height = window.innerHeight;

        this.lightFilterUniforms = {
            sizePx: {
                type: '2fv',
                value: new Float32Array([window.innerWidth, window.innerHeight])
            },
            scaleFactor: {
                type: '2fv',
                value: new Float32Array([this.scaleFactor.x, this.scaleFactor.y])
            },
            sources: {
                type: '4fv',
                value: new Float32Array([])
            },
            sourcesCount: {
                type: '1i',
                value: 0
            },
            faces: {
                type: '4fv',
                value: new Float32Array([])
            },
            facesCount: {
                type: '1i',
                value: 0
            },
            cameraPos: {
                type: '2fv',
                value: new Float32Array([0, 0])
            },
            debug: {
                type: '1i',
                value: !!debug
            }
        };

        this.blurFilterUniforms = {
            sizePx: {
                type: '2fv',
                value: new Float32Array([window.innerWidth, window.innerHeight])
            }
        };

        this.lightFilter = new Phaser.Filter(game, this.lightFilterUniforms, lightFragSource);
        this.lightFilter.setResolution(this.w, this.h);
        this.blurFilter = new Phaser.Filter(game, this.blurFilterUniforms, blurFragSource);
        this.lightImage.filters = [this.lightFilter, this.blurFilter];

        this.lightSources = [];
        this.objects = [];
    }

    _createClass(LightSystem, [{
        key: 'addLightSource',
        value: function addLightSource(lightSource) {
            this.lightSources.push(lightSource);
            // this._updateLightSourcesUniforms();
        }
    }, {
        key: 'removeLightSource',
        value: function removeLightSource(lightSource) {
            var index = this.lightSources.indexOf(lightSource);
            this.lightSources.splice(index, 1);
            // this._updateLightSourcesUniforms();
        }
    }, {
        key: 'addObject',
        value: function addObject(obj) {
            this.objects.push(obj);
            // this._updateFacesUniforms();
        }
    }, {
        key: 'removeObject',
        value: function removeObject(obj) {
            var index = this.objects.indexOf(obj);
            this.objects.splice(index, 1);
            // this._updateFacesUniforms();
        }
    }, {
        key: 'removeAll',
        value: function removeAll() {
            this.lightSources = [];
            this.objects = [];
            // this._updateLightSourcesUniforms();
            // this._updateFacesUniforms();
        }
    }, {
        key: 'updateLightSourcesUniforms',
        value: function updateLightSourcesUniforms() {
            var _this = this;

            this.lightFilterUniforms.sources.value = new Float32Array(this.lightSources.reduce(function (r, x) {
                return r.concat(x.getArray(_this.scaleFactor));
            }, []));
            this.lightFilterUniforms.sourcesCount.value = this.lightSources.length;
            // console.log('Updating light sources uniforms, count =', this.lightFilter.uniforms.sourcesCount.value);
        }
    }, {
        key: 'updateFacesUniforms',
        value: function updateFacesUniforms() {
            var _this2 = this;

            this.lightFilterUniforms.faces.value = new Float32Array(this.objects.reduce(function (r, x) {
                return r.concat(x.getArray(_this2.scaleFactor));
            }, []));
            this.lightFilterUniforms.facesCount.value = this.lightFilterUniforms.faces.value.length / 4;
            // console.log('Updating faces uniforms, count =', this.lightFilter.uniforms.facesCount.value);
        }
    }, {
        key: 'updateUniforms',
        value: function updateUniforms() {
            this.updateLightSourcesUniforms();
            this.updateFacesUniforms();
        }
    }, {
        key: 'updateCameraPos',
        value: function updateCameraPos(point) {
            this.lightFilterUniforms.cameraPos.value = new Float32Array([
            // point.x / this.scaleFactor.x,
            // point.y / this.scaleFactor.y
            point.x, point.y]);
        }
    }, {
        key: 'setDebug',
        value: function setDebug(enable) {
            this.lightFilterUniforms.debug.value = !!enable;
        }
    }, {
        key: 'update',
        value: function update() {
            this.lightFilter.update();
            this.blurFilter.update();
            this.lightTexture.renderXY(this.lightImage, 0, 0, true);
            // this.image.setTexture(this.image.generateTexture(1, PIXI.scaleModes.LINEAR, game.renderer));
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            // TODO: `destroy` or `remove`?
            this.lightFilter.destroy();
            this.blurFilter.destroy();
            this.image.destroy();
        }
    }]);

    return LightSystem;
}();

var LightSource = exports.LightSource = function () {
    function LightSource(position, radius, intensity, color, angleStart, angleEnd) {
        _classCallCheck(this, LightSource);

        this.position = position;
        this.radius = radius;
        this.intensity = intensity;
        this.color = color;
        this._angleStart = angleStart || 0;
        this._angleEnd = angleEnd || 0;
        this.setRotation(0);
    }

    _createClass(LightSource, [{
        key: 'getArray',
        value: function getArray(scaleFactor) {
            return [this.position.x, // / scaleFactor.x,
            this.position.y, // / scaleFactor.y,
            this.radius, this.intensity, this.color[0], this.color[1], this.color[2], this.color[3], this.angleStart, this.angleEnd, 0, 0];
        }
    }, {
        key: 'setRotation',
        value: function setRotation(rotation) {
            if (this._angleStart == 0 && this._andleEnd == 0) {
                return;
            }

            this.rotation = rotation;
            this.angleStart = (this._angleStart + this.rotation) % (Math.PI * 2);
            this.angleEnd = (this._angleEnd + this.rotation) % (Math.PI * 2);

            if (this.angleStart < 0) {
                this.angleStart += Math.PI * 2;
            }
            if (this.angleEnd < 0) {
                this.angleEnd += Math.PI * 2;
            }
        }
    }]);

    return LightSource;
}();

var LightedObject = exports.LightedObject = function () {
    function LightedObject(points) {
        _classCallCheck(this, LightedObject);

        this.points = points;
    }

    _createClass(LightedObject, [{
        key: 'getArray',
        value: function getArray(scaleFactor) {
            var _this3 = this;

            var result = [];

            var points = this.points;

            if (points.length > 2) {
                points = points.concat([points[0]]);
            }

            points.forEach(function (point, index) {
                if (!index) {
                    return;
                }
                result.push.apply(result, [_this3.points[index - 1].x, // / scaleFactor.x,
                _this3.points[index - 1].y, // / scaleFactor.y,
                point.x, // / scaleFactor.x,
                point.y]);
            });

            return result;
        }
    }, {
        key: 'getFacesCount',
        value: function getFacesCount() {
            if (this.points.length < 3) {
                return 1;
            } else {
                return this.points.length;
            }
        }
    }]);

    return LightedObject;
}();

if (window) {
    window.LightSystem = LightSystem;
    window.LightSource = LightSource;
    window.LightedObject = LightedObject;
}
},{"./blur.frag":1,"./light.frag":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYmx1ci5mcmFnIiwic3JjL2xpZ2h0LmZyYWciLCJzcmMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBcIiNkZWZpbmUgUkFESVVTIDIuMFxcbiNkZWZpbmUgU1RFUCAxLjBcXG5cXG5wcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcXG52YXJ5aW5nIHZlYzIgdlRleHR1cmVDb29yZDtcXG51bmlmb3JtIHNhbXBsZXIyRCB1U2FtcGxlcjtcXG51bmlmb3JtIHZlYzIgc2l6ZVB4O1xcblxcbnZvaWQgbWFpbigpIHtcXG4gICAgdmVjNCBjb2xvciA9IHZlYzQoMCk7XFxuXFxuICAgIHZlYzIgcGl4ZWxTaXplID0gdmVjMigxLjApIC8gc2l6ZVB4Lnh5ICogNC4wO1xcblxcbiAgICBmb3IgKGZsb2F0IHggPSAtUkFESVVTOyB4IDw9IFJBRElVUzsgeCArPSAxLjApIHtcXG4gICAgICAgIGZvciAoZmxvYXQgeSA9IC1SQURJVVM7IHkgPD0gUkFESVVTOyB5ICs9IDEuMCkge1xcbiAgICAgICAgICAgIGNvbG9yICs9IHRleHR1cmUyRCh1U2FtcGxlciwgdlRleHR1cmVDb29yZCAtIHZlYzIocGl4ZWxTaXplLnggKiB4ICogU1RFUCwgcGl4ZWxTaXplLnkgKiB5ICogU1RFUCkpO1xcbiAgICAgICAgfVxcbiAgICB9XFxuXFxuICAgIGdsX0ZyYWdDb2xvciA9IGNvbG9yIC8gcG93KFJBRElVUyAqIDIuMCArIDEuMCwgMi4wKTtcXG59XFxuXCI7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFwicHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XFxuXFxuI2RlZmluZSBNX1BJIDMuMTQxNTkyNjUzNTg5NzkzMjM4NDYyNjQzMzgzMjc5NVxcblxcbnZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1xcbnVuaWZvcm0gdmVjMiBzaXplUHg7XFxuXFxudW5pZm9ybSB2ZWM0IHNvdXJjZXNbMTZdO1xcbnVuaWZvcm0gaW50IHNvdXJjZXNDb3VudDtcXG51bmlmb3JtIHZlYzIgbW91c2U7XFxuXFxudW5pZm9ybSB2ZWM0IGZhY2VzWzE2XTtcXG51bmlmb3JtIGludCBmYWNlc0NvdW50O1xcblxcbnVuaWZvcm0gdmVjMiBjYW1lcmFQb3M7XFxudW5pZm9ybSB2ZWMyIHNjYWxlRmFjdG9yO1xcblxcbnVuaWZvcm0gYm9vbCBkZWJ1ZztcXG5cXG5ib29sIGNjdyhpbiB2ZWMyIGEsIGluIHZlYzIgYiwgaW4gdmVjMiBjKSB7XFxuICAgIC8vIENoZWNrcyBpZiB0aHJlZSB2ZWN0b3JzIGFyZSBwbGFjZWQgaW4gYSBDQ1cgb3JkZXJcXG4gICAgcmV0dXJuIChjLnkgLSBhLnkpICogKGIueCAtIGEueCkgPiAoYi55IC0gYS55KSAqIChjLnggLSBhLngpO1xcbn1cXG5cXG5ib29sIGludGVyc2VjdHMoaW4gdmVjMiBhLCBpbiB2ZWMyIGIsIGluIHZlYzIgYywgaW4gdmVjMiBkKSB7XFxuICAgIC8vIEZhc3QgaW50ZXJzZWN0aW9uIGNoZWNrIGJhc2VkIG9uIHZlcnRleCBvcmRlclxcbiAgICByZXR1cm4gY2N3KGEsIGMsIGQpICE9IGNjdyhiLCBjLCBkKSAmJiBjY3coYSwgYiwgYykgIT0gY2N3KGEsIGIsIGQpO1xcbn1cXG5cXG52ZWMyIGZsaXAoaW4gdmVjMiB2KSB7XFxuICAgIHJldHVybiB2ZWMyKHYueCwgMS4wIC0gdi55KTtcXG59XFxuXFxudmVjMiBhcHBseUNhbWVyYVRyYW5zZm9ybWF0aW9uKGluIHZlYzIgcG9pbnQpIHtcXG4gICAgcmV0dXJuIHBvaW50IC0gY2FtZXJhUG9zO1xcbn1cXG5cXG5mbG9hdCBhbmdsZUJldHdlZW4oaW4gZmxvYXQgc3RhcnQsIGluIGZsb2F0IGVuZClcXG57XFxuICAgIHJldHVybiBtb2QoZW5kIC0gc3RhcnQsIE1fUEkgKiAyLjApO1xcbn1cXG5cXG5ib29sIGlzQmV0d2VlbihpbiBmbG9hdCBzdGFydEFuZ2xlLCBpbiBmbG9hdCBlbmRBbmdsZSwgaW4gZmxvYXQgdGVzdEFuZ2xlKSB7XFxuICAgIGZsb2F0IGExID0gYWJzKGFuZ2xlQmV0d2VlbihzdGFydEFuZ2xlLCB0ZXN0QW5nbGUpKTtcXG4gICAgZmxvYXQgYTIgPSBhYnMoYW5nbGVCZXR3ZWVuKHRlc3RBbmdsZSwgZW5kQW5nbGUpKTtcXG4gICAgZmxvYXQgYTMgPSBhYnMoYW5nbGVCZXR3ZWVuKHN0YXJ0QW5nbGUsIGVuZEFuZ2xlKSk7XFxuICAgIHJldHVybiAoYTEgKyBhMikgLSBhMyA8IDEuMDtcXG59XFxuXFxudm9pZCBtYWluKCkge1xcbiAgICAvLyBwaXhlbCBzaXplIGluIHVuaXRzXFxuXFxuICAgIHZlYzIgcGl4ZWxTaXplID0gdmVjMigxLjApIC8gc2l6ZVB4Lnh5O1xcblxcbiAgICAvLyB2ZWMyIG1vdXNlUG9zID0gbW91c2UgKiBwaXhlbFNpemU7XFxuXFxuICAgIC8vIEN1cnJlbnQgcG9zaXRpb24gaW4gcGl4ZWxzXFxuICAgIHZlYzIgcGl4ZWxDb29yZCA9IGZsaXAodlRleHR1cmVDb29yZCkgLyBwaXhlbFNpemU7XFxuXFxuICAgIC8vIENvdW50ICYgdG90YWwgaW50ZW5zaXR5IG9mIGxpZ2h0IHNvdXJjZXMgdGhhdCBhZmZlY3QgdGhpcyBwb2ludFxcbiAgICB2ZWM0IGxpZ2h0VmFsdWUgPSB2ZWM0KDAuMCk7XFxuICAgIGZsb2F0IGxpZ2h0Q291bnQgPSAwLjA7XFxuXFxuICAgIC8vIHNvdXJjZXNbMF0gPSBtb3VzZTtcXG5cXG4gICAgZm9yIChpbnQgc291cmNlSW5kZXggPSAwOyBzb3VyY2VJbmRleCA8IDI1Njsgc291cmNlSW5kZXggKz0gMykge1xcbiAgICAgICAgLy8gTG9vcCB0aHJvdWdoIGxpZ2h0IHNvdXJjZXNcXG4gICAgICAgIGlmIChzb3VyY2VJbmRleCA+PSBzb3VyY2VzQ291bnQgKiAzKSB7XFxuICAgICAgICAgICAgYnJlYWs7XFxuICAgICAgICB9XFxuXFxuICAgICAgICBmb3IgKGZsb2F0IGR4ID0gMC4wOyBkeCA8IDEuMDsgZHggKz0gMS4wKSB7XFxuICAgICAgICAgICAgZm9yIChmbG9hdCBkeSA9IDAuMDsgZHkgPCAxLjA7IGR5ICs9IDEuMCkge1xcbiAgICAgICAgICAgICAgICB2ZWM0IHNvdXJjZSA9IHZlYzQoc291cmNlc1tzb3VyY2VJbmRleF0ueHkgKyB2ZWMyKGR4LCBkeSkgKiA4LjAsIHNvdXJjZXNbc291cmNlSW5kZXhdLnp3KTtcXG4gICAgICAgICAgICAgICAgdmVjNCBzb3VyY2VDb2xvciA9IHNvdXJjZXNbc291cmNlSW5kZXggKyAxXTtcXG4gICAgICAgICAgICAgICAgdmVjMiBzb3VyY2VBbmdsZSA9IHNvdXJjZXNbc291cmNlSW5kZXggKyAyXS54eTtcXG5cXG4gICAgICAgICAgICAgICAgLy8gRGlzdGFuY2UgZnJvbSBjdXJyZW50IGxpZ2h0IHNvdXJjZSB0byBjdXJyZW50IHBvaW50XFxuICAgICAgICAgICAgICAgIGZsb2F0IGRpc3RhbmNlRnJvbVNvdXJjZSA9IGRpc3RhbmNlKGFwcGx5Q2FtZXJhVHJhbnNmb3JtYXRpb24oc291cmNlLnh5KSwgYXBwbHlDYW1lcmFUcmFuc2Zvcm1hdGlvbihwaXhlbENvb3JkKSk7XFxuICAgICAgICAgICAgICAgIHZlYzIgb2Zmc2V0ID0gcGl4ZWxDb29yZCAtIHNvdXJjZS54eTtcXG4gICAgICAgICAgICAgICAgZmxvYXQgYW5nbGVGcm9tU291cmNlID0gYXRhbihvZmZzZXQueSwgb2Zmc2V0LngpO1xcblxcbiAgICAgICAgICAgICAgICBpZiAoZGVidWcpIHtcXG4gICAgICAgICAgICAgICAgICAgIC8vIERyYXcgbGlnaHQgcG9zaXRpb24gJiByYWRpdXNcXG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXN0YW5jZUZyb21Tb3VyY2UgPCA1LjApIHtcXG4gICAgICAgICAgICAgICAgICAgICAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KHNvdXJjZUNvbG9yLnh5eiwgMC4xKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XFxuICAgICAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgICAgICAgICBpZiAoYWJzKGRpc3RhbmNlRnJvbVNvdXJjZSAtIHNvdXJjZS56KSA8IDUuMCkge1xcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoc291cmNlQW5nbGUueCA9PSBzb3VyY2VBbmdsZS55KSB8fCBpc0JldHdlZW4oc291cmNlQW5nbGUueCwgc291cmNlQW5nbGUueSwgYW5nbGVGcm9tU291cmNlKSkge1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KHNvdXJjZUNvbG9yLngsIHNvdXJjZUNvbG9yLnksIHNvdXJjZUNvbG9yLnosIDAuMSk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcXG4gICAgICAgICAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgICAgICAgICAvLyBpZiAoc291cmNlQW5nbGUueCAhPSBzb3VyY2VBbmdsZS55KSB7XFxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKGFuZ2xlRnJvbVNvdXJjZSAtIChvZmZzZXQueCArIG9mZnNldC55KSAvIDIuMCA8IDIuMCkge1xcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KDAuMCwgMS4wLCAwLjAsIDEuMCk7XFxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxcbiAgICAgICAgICAgICAgICAgICAgLy8gfVxcbiAgICAgICAgICAgICAgICB9XFxuXFxuICAgICAgICAgICAgICAgIGlmIChkaXN0YW5jZUZyb21Tb3VyY2UgPiBzb3VyY2Uueikge1xcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XFxuICAgICAgICAgICAgICAgIH1cXG5cXG4gICAgICAgICAgICAgICAgaWYgKChzb3VyY2VBbmdsZS54ICE9IHNvdXJjZUFuZ2xlLnkpICYmICFpc0JldHdlZW4oc291cmNlQW5nbGUueCwgc291cmNlQW5nbGUueSwgYW5nbGVGcm9tU291cmNlKSkge1xcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XFxuICAgICAgICAgICAgICAgIH1cXG5cXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgc2VnbWVudCBiZXR3ZWVuIHRoaXMgcG9pbnQgYW5kIGN1cnJlbnQgbGlnaHQgc291cmNlXFxuICAgICAgICAgICAgICAgIC8vIGlzIGJsb2NrZWQgYnkgYW55IGZhY2VcXG4gICAgICAgICAgICAgICAgYm9vbCBpc1NvdXJjZUJsb2NrZWQgPSBmYWxzZTtcXG4gICAgICAgICAgICAgICAgZm9yIChpbnQgZmFjZUluZGV4ID0gMDsgZmFjZUluZGV4IDwgMjU2OyBmYWNlSW5kZXgrKykge1xcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZhY2VJbmRleCA+PSBmYWNlc0NvdW50KSB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XFxuICAgICAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgICAgICAgICBpZiAoaW50ZXJzZWN0cyhhcHBseUNhbWVyYVRyYW5zZm9ybWF0aW9uKHNvdXJjZS54eSksIHBpeGVsQ29vcmQsIGFwcGx5Q2FtZXJhVHJhbnNmb3JtYXRpb24oZmFjZXNbZmFjZUluZGV4XS54eSksIGFwcGx5Q2FtZXJhVHJhbnNmb3JtYXRpb24oZmFjZXNbZmFjZUluZGV4XS56dykpKSB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBsaWdodCBpcyBibG9ja2VkIGJ5IG9uZSBvZiB0aGUgZmFjZXMuXFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgZG9uJ3QgY291bnQgaXQuXFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNTb3VyY2VCbG9ja2VkID0gdHJ1ZTtcXG4gICAgICAgICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAgICAgfVxcblxcbiAgICAgICAgICAgICAgICBpZiAoIWlzU291cmNlQmxvY2tlZCkge1xcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3VycmVudCBsaWdodCBzb3VyY2UgYWZmZWN0ZWQgdGhpcyBwb2ludCwgbGV0J3MgaW5jcmVhc2VcXG4gICAgICAgICAgICAgICAgICAgIC8vIGxpZ2h0VmFsdWUgJiBsaWdodENvdW50IGZvciB0aGlzIHBvaW50XFxuICAgICAgICAgICAgICAgICAgICAvLyBiYXNlZCBvbiB0aGUgZGlzdGFuY2UgZnJvbSBsaWdodCBzb3VyY2UuXFxuICAgICAgICAgICAgICAgICAgICAvLyAoVGhlIGNsb3NlciB0byB0aGUgbGlnaHQgc291cmNlLCB0aGUgaGlnaGVyIHRoZSB2YWx1ZSlcXG4gICAgICAgICAgICAgICAgICAgIGZsb2F0IHJhZGl1cyA9IHNvdXJjZS56O1xcbiAgICAgICAgICAgICAgICAgICAgZmxvYXQgaW50ZW5zaXR5ID0gc291cmNlLnc7XFxuICAgICAgICAgICAgICAgICAgICBmbG9hdCB2YWwgPSBtYXgocmFkaXVzIC0gZGlzdGFuY2VGcm9tU291cmNlLCAwLjApIC8gcmFkaXVzICogaW50ZW5zaXR5O1xcbiAgICAgICAgICAgICAgICAgICAgbGlnaHRWYWx1ZSArPSB2YWwgKiBzb3VyY2VDb2xvcjtcXG4gICAgICAgICAgICAgICAgICAgIGxpZ2h0Q291bnQgKz0gMS4wO1xcbiAgICAgICAgICAgICAgICAgICAgLy8gdmFsID0gbWF4KHJhZGl1cyAtIGRpc3RhbmNlRnJvbVNvdXJjZSwgMC4wKSAvIHJhZGl1cztcXG4gICAgICAgICAgICAgICAgICAgIC8vIGdsX0ZyYWdDb2xvciA9IHZlYzQodmFsLCB2YWwsIHZhbCwgdmFsKTtcXG4gICAgICAgICAgICAgICAgICAgIC8vIHJldHVybjtcXG4gICAgICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIH1cXG4gICAgICAgIH1cXG4gICAgfVxcblxcbiAgICAvLyBsaWdodFZhbHVlIC89IDQuMDtcXG5cXG4gICAgLy8gTGV0J3MgY2FwIG1heGltdW0gbGlnaHRWYWx1ZSB0byAwLjUgdG8gcHJldmVudCB0b28gbXVjaCBsaWdodG5lc3NcXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNChtaW4obGlnaHRWYWx1ZS54LCAwLjc1KSwgbWluKGxpZ2h0VmFsdWUueSwgMC43NSksIG1pbihsaWdodFZhbHVlLnosIDAuNzUpLCBtaW4obGlnaHRWYWx1ZS53LCAwLjc1KSk7XFxuXFxuICAgIC8vIGdsX0ZyYWdDb2xvciA9IGxpZ2h0VmFsdWU7XFxufVxcblwiO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbnZhciBsaWdodEZyYWdTb3VyY2UgPSByZXF1aXJlKCcuL2xpZ2h0LmZyYWcnKTtcbnZhciBibHVyRnJhZ1NvdXJjZSA9IHJlcXVpcmUoJy4vYmx1ci5mcmFnJyk7XG5cbnZhciBMaWdodFN5c3RlbSA9IGV4cG9ydHMuTGlnaHRTeXN0ZW0gPSBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGlnaHRTeXN0ZW0odywgaCwgZGVidWcpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIExpZ2h0U3lzdGVtKTtcblxuICAgICAgICAvLyB0aGlzLnNwcml0ZSA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwKTtcbiAgICAgICAgLy8gdGhpcy53ID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgIC8vIHRoaXMuaCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgICAgLy8gdmFyIHNjYWxlID0gNDtcbiAgICAgICAgLy8gdGhpcy53ID0gd2luZG93LmlubmVyV2lkdGggLyBzY2FsZTtcbiAgICAgICAgLy8gdGhpcy5oID0gd2luZG93LmlubmVySGVpZ2h0IC8gc2NhbGU7XG4gICAgICAgIHRoaXMudyA9IHcgfHwgMjU2O1xuICAgICAgICB0aGlzLmggPSBoIHx8IDI1NjtcbiAgICAgICAgLy8gVE9ETzogTWFrZSBpbWFnZSBpbnZpc2libGUgKnByb3Blcmx5KlxuICAgICAgICAvLyB0aGlzLmltYWdlID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDApO1xuICAgICAgICAvLyB0aGlzLmltYWdlID0gbmV3IFBoYXNlci5HcmFwaGljcyhnYW1lLCAwLCAwKTtcbiAgICAgICAgdGhpcy5saWdodFRleHR1cmUgPSBnYW1lLmFkZC5yZW5kZXJUZXh0dXJlKHRoaXMudywgdGhpcy5oLCAnbGlnaHRUZXh0dXJlJyk7XG4gICAgICAgIHRoaXMubGlnaHRJbWFnZSA9IGdhbWUuYWRkLmltYWdlKDEwNDg1NzYsIDEwNDg1NzYpO1xuICAgICAgICB0aGlzLmxpZ2h0SW1hZ2Uud2lkdGggPSB0aGlzLnc7XG4gICAgICAgIHRoaXMubGlnaHRJbWFnZS5oZWlnaHQgPSB0aGlzLmg7XG5cbiAgICAgICAgLy8gdGhpcy5saWdodEltYWdlLmJsZW5kTW9kZSA9IDE7XG5cbiAgICAgICAgLy8gdGhpcy5saWdodEltYWdlLmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuICAgICAgICB0aGlzLmxpZ2h0SW1hZ2Uuc21vb3RoZWQgPSB0cnVlO1xuICAgICAgICAvLyB0aGlzLmxpZ2h0SW1hZ2UucmVuZGVyYWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNjYWxlRmFjdG9yID0gbmV3IFBoYXNlci5Qb2ludCh3aW5kb3cuaW5uZXJXaWR0aCAvIHRoaXMudywgd2luZG93LmlubmVySGVpZ2h0IC8gdGhpcy5oKTtcblxuICAgICAgICB0aGlzLnJlbmRlcmVkSW1hZ2UgPSBnYW1lLmFkZC5pbWFnZSgwLCB3aW5kb3cuaW5uZXJIZWlnaHQsIHRoaXMubGlnaHRUZXh0dXJlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlZEltYWdlLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgIHRoaXMucmVuZGVyZWRJbWFnZS5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICAgIHRoaXMucmVuZGVyZWRJbWFnZS5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZW5kZXJlZEltYWdlLnNjYWxlLnkgKj0gLTE7XG4gICAgICAgIHRoaXMucmVuZGVyZWRJbWFnZS5zbW9vdGhlZCA9IHRydWU7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdJbml0aWFsIGxpZ2h0IHNwcml0ZSBzY2FsZTonLCB0aGlzLnNwcml0ZS5zY2FsZS54LCB0aGlzLnNwcml0ZS5zY2FsZS55KTtcbiAgICAgICAgLy8gdGhpcy5zcHJpdGUuc2NhbGUueCAqPSB0aGlzLnNjYWxlRmFjdG9yLng7XG4gICAgICAgIC8vIHRoaXMuc3ByaXRlLnNjYWxlLnkgKj0gdGhpcy5zY2FsZUZhY3Rvci55O1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnQ3JlYXRpbmcgbGlnaHQgc3ByaXRlLCBzaXplJywgdGhpcy53LCB0aGlzLmgsICdzY2FsZScsIHRoaXMuc2NhbGVGYWN0b3IueCwgdGhpcy5zY2FsZUZhY3Rvci55KTtcbiAgICAgICAgLy8gdGhpcy5zcHJpdGUud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICAgICAgLy8gdGhpcy5zcHJpdGUuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuXG4gICAgICAgIHRoaXMubGlnaHRGaWx0ZXJVbmlmb3JtcyA9IHtcbiAgICAgICAgICAgIHNpemVQeDoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICcyZnYnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBuZXcgRmxvYXQzMkFycmF5KFt3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0XSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzY2FsZUZhY3Rvcjoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICcyZnYnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBuZXcgRmxvYXQzMkFycmF5KFt0aGlzLnNjYWxlRmFjdG9yLngsIHRoaXMuc2NhbGVGYWN0b3IueV0pXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc291cmNlczoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICc0ZnYnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBuZXcgRmxvYXQzMkFycmF5KFtdKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNvdXJjZXNDb3VudDoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICcxaScsXG4gICAgICAgICAgICAgICAgdmFsdWU6IDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmYWNlczoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICc0ZnYnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBuZXcgRmxvYXQzMkFycmF5KFtdKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZhY2VzQ291bnQ6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnMWknLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2FtZXJhUG9zOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJzJmdicsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG5ldyBGbG9hdDMyQXJyYXkoWzAsIDBdKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlYnVnOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJzFpJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogISFkZWJ1Z1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYmx1ckZpbHRlclVuaWZvcm1zID0ge1xuICAgICAgICAgICAgc2l6ZVB4OiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJzJmdicsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG5ldyBGbG9hdDMyQXJyYXkoW3dpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHRdKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubGlnaHRGaWx0ZXIgPSBuZXcgUGhhc2VyLkZpbHRlcihnYW1lLCB0aGlzLmxpZ2h0RmlsdGVyVW5pZm9ybXMsIGxpZ2h0RnJhZ1NvdXJjZSk7XG4gICAgICAgIHRoaXMubGlnaHRGaWx0ZXIuc2V0UmVzb2x1dGlvbih0aGlzLncsIHRoaXMuaCk7XG4gICAgICAgIHRoaXMuYmx1ckZpbHRlciA9IG5ldyBQaGFzZXIuRmlsdGVyKGdhbWUsIHRoaXMuYmx1ckZpbHRlclVuaWZvcm1zLCBibHVyRnJhZ1NvdXJjZSk7XG4gICAgICAgIHRoaXMubGlnaHRJbWFnZS5maWx0ZXJzID0gW3RoaXMubGlnaHRGaWx0ZXIsIHRoaXMuYmx1ckZpbHRlcl07XG5cbiAgICAgICAgdGhpcy5saWdodFNvdXJjZXMgPSBbXTtcbiAgICAgICAgdGhpcy5vYmplY3RzID0gW107XG4gICAgfVxuXG4gICAgX2NyZWF0ZUNsYXNzKExpZ2h0U3lzdGVtLCBbe1xuICAgICAgICBrZXk6ICdhZGRMaWdodFNvdXJjZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBhZGRMaWdodFNvdXJjZShsaWdodFNvdXJjZSkge1xuICAgICAgICAgICAgdGhpcy5saWdodFNvdXJjZXMucHVzaChsaWdodFNvdXJjZSk7XG4gICAgICAgICAgICAvLyB0aGlzLl91cGRhdGVMaWdodFNvdXJjZXNVbmlmb3JtcygpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdyZW1vdmVMaWdodFNvdXJjZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZW1vdmVMaWdodFNvdXJjZShsaWdodFNvdXJjZSkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5saWdodFNvdXJjZXMuaW5kZXhPZihsaWdodFNvdXJjZSk7XG4gICAgICAgICAgICB0aGlzLmxpZ2h0U291cmNlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgLy8gdGhpcy5fdXBkYXRlTGlnaHRTb3VyY2VzVW5pZm9ybXMoKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAnYWRkT2JqZWN0JyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGFkZE9iamVjdChvYmopIHtcbiAgICAgICAgICAgIHRoaXMub2JqZWN0cy5wdXNoKG9iaik7XG4gICAgICAgICAgICAvLyB0aGlzLl91cGRhdGVGYWNlc1VuaWZvcm1zKCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3JlbW92ZU9iamVjdCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZW1vdmVPYmplY3Qob2JqKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLm9iamVjdHMuaW5kZXhPZihvYmopO1xuICAgICAgICAgICAgdGhpcy5vYmplY3RzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAvLyB0aGlzLl91cGRhdGVGYWNlc1VuaWZvcm1zKCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3JlbW92ZUFsbCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZW1vdmVBbGwoKSB7XG4gICAgICAgICAgICB0aGlzLmxpZ2h0U291cmNlcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5vYmplY3RzID0gW107XG4gICAgICAgICAgICAvLyB0aGlzLl91cGRhdGVMaWdodFNvdXJjZXNVbmlmb3JtcygpO1xuICAgICAgICAgICAgLy8gdGhpcy5fdXBkYXRlRmFjZXNVbmlmb3JtcygpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICd1cGRhdGVMaWdodFNvdXJjZXNVbmlmb3JtcycsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB1cGRhdGVMaWdodFNvdXJjZXNVbmlmb3JtcygpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgICAgIHRoaXMubGlnaHRGaWx0ZXJVbmlmb3Jtcy5zb3VyY2VzLnZhbHVlID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLmxpZ2h0U291cmNlcy5yZWR1Y2UoZnVuY3Rpb24gKHIsIHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gci5jb25jYXQoeC5nZXRBcnJheShfdGhpcy5zY2FsZUZhY3RvcikpO1xuICAgICAgICAgICAgfSwgW10pKTtcbiAgICAgICAgICAgIHRoaXMubGlnaHRGaWx0ZXJVbmlmb3Jtcy5zb3VyY2VzQ291bnQudmFsdWUgPSB0aGlzLmxpZ2h0U291cmNlcy5sZW5ndGg7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnVXBkYXRpbmcgbGlnaHQgc291cmNlcyB1bmlmb3JtcywgY291bnQgPScsIHRoaXMubGlnaHRGaWx0ZXIudW5pZm9ybXMuc291cmNlc0NvdW50LnZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAndXBkYXRlRmFjZXNVbmlmb3JtcycsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB1cGRhdGVGYWNlc1VuaWZvcm1zKCkge1xuICAgICAgICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgICAgICAgIHRoaXMubGlnaHRGaWx0ZXJVbmlmb3Jtcy5mYWNlcy52YWx1ZSA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5vYmplY3RzLnJlZHVjZShmdW5jdGlvbiAociwgeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByLmNvbmNhdCh4LmdldEFycmF5KF90aGlzMi5zY2FsZUZhY3RvcikpO1xuICAgICAgICAgICAgfSwgW10pKTtcbiAgICAgICAgICAgIHRoaXMubGlnaHRGaWx0ZXJVbmlmb3Jtcy5mYWNlc0NvdW50LnZhbHVlID0gdGhpcy5saWdodEZpbHRlclVuaWZvcm1zLmZhY2VzLnZhbHVlLmxlbmd0aCAvIDQ7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnVXBkYXRpbmcgZmFjZXMgdW5pZm9ybXMsIGNvdW50ID0nLCB0aGlzLmxpZ2h0RmlsdGVyLnVuaWZvcm1zLmZhY2VzQ291bnQudmFsdWUpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICd1cGRhdGVVbmlmb3JtcycsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB1cGRhdGVVbmlmb3JtcygpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTGlnaHRTb3VyY2VzVW5pZm9ybXMoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRmFjZXNVbmlmb3JtcygpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICd1cGRhdGVDYW1lcmFQb3MnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gdXBkYXRlQ2FtZXJhUG9zKHBvaW50KSB7XG4gICAgICAgICAgICB0aGlzLmxpZ2h0RmlsdGVyVW5pZm9ybXMuY2FtZXJhUG9zLnZhbHVlID0gbmV3IEZsb2F0MzJBcnJheShbXG4gICAgICAgICAgICAvLyBwb2ludC54IC8gdGhpcy5zY2FsZUZhY3Rvci54LFxuICAgICAgICAgICAgLy8gcG9pbnQueSAvIHRoaXMuc2NhbGVGYWN0b3IueVxuICAgICAgICAgICAgcG9pbnQueCwgcG9pbnQueV0pO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdzZXREZWJ1ZycsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzZXREZWJ1ZyhlbmFibGUpIHtcbiAgICAgICAgICAgIHRoaXMubGlnaHRGaWx0ZXJVbmlmb3Jtcy5kZWJ1Zy52YWx1ZSA9ICEhZW5hYmxlO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICd1cGRhdGUnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gdXBkYXRlKCkge1xuICAgICAgICAgICAgdGhpcy5saWdodEZpbHRlci51cGRhdGUoKTtcbiAgICAgICAgICAgIHRoaXMuYmx1ckZpbHRlci51cGRhdGUoKTtcbiAgICAgICAgICAgIHRoaXMubGlnaHRUZXh0dXJlLnJlbmRlclhZKHRoaXMubGlnaHRJbWFnZSwgMCwgMCwgdHJ1ZSk7XG4gICAgICAgICAgICAvLyB0aGlzLmltYWdlLnNldFRleHR1cmUodGhpcy5pbWFnZS5nZW5lcmF0ZVRleHR1cmUoMSwgUElYSS5zY2FsZU1vZGVzLkxJTkVBUiwgZ2FtZS5yZW5kZXJlcikpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdkZXN0cm95JyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBgZGVzdHJveWAgb3IgYHJlbW92ZWA/XG4gICAgICAgICAgICB0aGlzLmxpZ2h0RmlsdGVyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMuYmx1ckZpbHRlci5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLmltYWdlLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBMaWdodFN5c3RlbTtcbn0oKTtcblxudmFyIExpZ2h0U291cmNlID0gZXhwb3J0cy5MaWdodFNvdXJjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMaWdodFNvdXJjZShwb3NpdGlvbiwgcmFkaXVzLCBpbnRlbnNpdHksIGNvbG9yLCBhbmdsZVN0YXJ0LCBhbmdsZUVuZCkge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTGlnaHRTb3VyY2UpO1xuXG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICAgICAgdGhpcy5yYWRpdXMgPSByYWRpdXM7XG4gICAgICAgIHRoaXMuaW50ZW5zaXR5ID0gaW50ZW5zaXR5O1xuICAgICAgICB0aGlzLmNvbG9yID0gY29sb3I7XG4gICAgICAgIHRoaXMuX2FuZ2xlU3RhcnQgPSBhbmdsZVN0YXJ0IHx8IDA7XG4gICAgICAgIHRoaXMuX2FuZ2xlRW5kID0gYW5nbGVFbmQgfHwgMDtcbiAgICAgICAgdGhpcy5zZXRSb3RhdGlvbigwKTtcbiAgICB9XG5cbiAgICBfY3JlYXRlQ2xhc3MoTGlnaHRTb3VyY2UsIFt7XG4gICAgICAgIGtleTogJ2dldEFycmF5JyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldEFycmF5KHNjYWxlRmFjdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMucG9zaXRpb24ueCwgLy8gLyBzY2FsZUZhY3Rvci54LFxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbi55LCAvLyAvIHNjYWxlRmFjdG9yLnksXG4gICAgICAgICAgICB0aGlzLnJhZGl1cywgdGhpcy5pbnRlbnNpdHksIHRoaXMuY29sb3JbMF0sIHRoaXMuY29sb3JbMV0sIHRoaXMuY29sb3JbMl0sIHRoaXMuY29sb3JbM10sIHRoaXMuYW5nbGVTdGFydCwgdGhpcy5hbmdsZUVuZCwgMCwgMF07XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3NldFJvdGF0aW9uJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHNldFJvdGF0aW9uKHJvdGF0aW9uKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fYW5nbGVTdGFydCA9PSAwICYmIHRoaXMuX2FuZGxlRW5kID09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucm90YXRpb24gPSByb3RhdGlvbjtcbiAgICAgICAgICAgIHRoaXMuYW5nbGVTdGFydCA9ICh0aGlzLl9hbmdsZVN0YXJ0ICsgdGhpcy5yb3RhdGlvbikgJSAoTWF0aC5QSSAqIDIpO1xuICAgICAgICAgICAgdGhpcy5hbmdsZUVuZCA9ICh0aGlzLl9hbmdsZUVuZCArIHRoaXMucm90YXRpb24pICUgKE1hdGguUEkgKiAyKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuYW5nbGVTdGFydCA8IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFuZ2xlU3RhcnQgKz0gTWF0aC5QSSAqIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5hbmdsZUVuZCA8IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFuZ2xlRW5kICs9IE1hdGguUEkgKiAyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIExpZ2h0U291cmNlO1xufSgpO1xuXG52YXIgTGlnaHRlZE9iamVjdCA9IGV4cG9ydHMuTGlnaHRlZE9iamVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMaWdodGVkT2JqZWN0KHBvaW50cykge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTGlnaHRlZE9iamVjdCk7XG5cbiAgICAgICAgdGhpcy5wb2ludHMgPSBwb2ludHM7XG4gICAgfVxuXG4gICAgX2NyZWF0ZUNsYXNzKExpZ2h0ZWRPYmplY3QsIFt7XG4gICAgICAgIGtleTogJ2dldEFycmF5JyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldEFycmF5KHNjYWxlRmFjdG9yKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgICAgICB2YXIgcG9pbnRzID0gdGhpcy5wb2ludHM7XG5cbiAgICAgICAgICAgIGlmIChwb2ludHMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgICAgIHBvaW50cyA9IHBvaW50cy5jb25jYXQoW3BvaW50c1swXV0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwb2ludHMuZm9yRWFjaChmdW5jdGlvbiAocG9pbnQsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgW190aGlzMy5wb2ludHNbaW5kZXggLSAxXS54LCAvLyAvIHNjYWxlRmFjdG9yLngsXG4gICAgICAgICAgICAgICAgX3RoaXMzLnBvaW50c1tpbmRleCAtIDFdLnksIC8vIC8gc2NhbGVGYWN0b3IueSxcbiAgICAgICAgICAgICAgICBwb2ludC54LCAvLyAvIHNjYWxlRmFjdG9yLngsXG4gICAgICAgICAgICAgICAgcG9pbnQueV0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ2dldEZhY2VzQ291bnQnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0RmFjZXNDb3VudCgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnBvaW50cy5sZW5ndGggPCAzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBvaW50cy5sZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gTGlnaHRlZE9iamVjdDtcbn0oKTtcblxuaWYgKHdpbmRvdykge1xuICAgIHdpbmRvdy5MaWdodFN5c3RlbSA9IExpZ2h0U3lzdGVtO1xuICAgIHdpbmRvdy5MaWdodFNvdXJjZSA9IExpZ2h0U291cmNlO1xuICAgIHdpbmRvdy5MaWdodGVkT2JqZWN0ID0gTGlnaHRlZE9iamVjdDtcbn0iXX0=
