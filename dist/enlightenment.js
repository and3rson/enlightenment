(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = "#define RADIUS 2.0\n#define STEP 1.0\n\nprecision mediump float;\nvarying vec2 vTextureCoord;\nuniform sampler2D uSampler;\nuniform vec2 sizePx;\n\nvoid main() {\n    vec4 color = vec4(0);\n\n    vec2 pixelSize = vec2(1.0) / sizePx.xy * 4.0;\n\n    for (float x = -RADIUS; x <= RADIUS; x += 1.0) {\n        for (float y = -RADIUS; y <= RADIUS; y += 1.0) {\n            color += texture2D(uSampler, vTextureCoord - vec2(pixelSize.x * x * STEP, pixelSize.y * y * STEP));\n        }\n    }\n\n    gl_FragColor = color / pow(RADIUS * 2.0 + 1.0, 2.0);\n}\n";

},{}],2:[function(require,module,exports){
module.exports = "precision mediump float;\n\n#define M_PI 3.1415926535897932384626433832795\n\nvarying vec2 vTextureCoord;\nuniform vec2 sizePx;\n\nuniform vec4 sources[1024];\nuniform int sourcesCount;\nuniform vec2 mouse;\n\nuniform vec4 faces[1024];\nuniform int facesCount;\n\nuniform vec2 cameraPos;\nuniform vec2 scaleFactor;\n\nuniform bool debug;\n\nbool ccw(in vec2 a, in vec2 b, in vec2 c) {\n    // Checks if three vectors are placed in a CCW order\n    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);\n}\n\nbool intersects(in vec2 a, in vec2 b, in vec2 c, in vec2 d) {\n    // Fast intersection check based on vertex order\n    return ccw(a, c, d) != ccw(b, c, d) && ccw(a, b, c) != ccw(a, b, d);\n}\n\nvec2 flip(in vec2 v) {\n    return vec2(v.x, 1.0 - v.y);\n}\n\nvec2 applyCameraTransformation(in vec2 point) {\n    return point - cameraPos;\n}\n\nfloat angleBetween(in float start, in float end)\n{\n    return mod(end - start, M_PI * 2.0);\n}\n\nbool isBetween(in float startAngle, in float endAngle, in float testAngle) {\n    float a1 = abs(angleBetween(startAngle, testAngle));\n    float a2 = abs(angleBetween(testAngle, endAngle));\n    float a3 = abs(angleBetween(startAngle, endAngle));\n    return (a1 + a2) - a3 < 1.0;\n}\n\nvoid main() {\n    // pixel size in units\n\n    vec2 pixelSize = vec2(1.0) / sizePx.xy;\n\n    // vec2 mousePos = mouse * pixelSize;\n\n    // Current position in pixels\n    vec2 pixelCoord = flip(vTextureCoord) / pixelSize;\n\n    // Count & total intensity of light sources that affect this point\n    vec4 lightValue = vec4(0.0);\n    float lightCount = 0.0;\n\n    // sources[0] = mouse;\n\n    for (int sourceIndex = 0; sourceIndex < 1024; sourceIndex += 3) {\n        // Loop through light sources\n        if (sourceIndex >= sourcesCount * 3) {\n            break;\n        }\n\n        for (float dx = 0.0; dx < 1.0; dx += 1.0) {\n            for (float dy = 0.0; dy < 1.0; dy += 1.0) {\n                vec4 source = vec4(sources[sourceIndex].xy + vec2(dx, dy) * 8.0, sources[sourceIndex].zw);\n                vec4 sourceColor = sources[sourceIndex + 1];\n                vec2 sourceAngle = sources[sourceIndex + 2].xy;\n\n                // Distance from current light source to current point\n                float distanceFromSource = distance(applyCameraTransformation(source.xy), pixelCoord);\n                vec2 offset = pixelCoord - applyCameraTransformation(source.xy);\n                float angleFromSource = atan(offset.y, offset.x);\n\n                if (debug) {\n                    // Draw light position & radius\n                    if (distanceFromSource < 5.0) {\n                        gl_FragColor = vec4(sourceColor.xyz, 0.1);\n                        return;\n                    }\n                    if (abs(distanceFromSource - source.z) < 5.0) {\n                        if ((sourceAngle.x == sourceAngle.y) || isBetween(sourceAngle.x, sourceAngle.y, angleFromSource)) {\n                            gl_FragColor = vec4(sourceColor.x, sourceColor.y, sourceColor.z, 0.1);\n                            return;\n                        }\n                    }\n                    // if (sourceAngle.x != sourceAngle.y) {\n                    //     if (angleFromSource - (offset.x + offset.y) / 2.0 < 2.0) {\n                    //         gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);\n                    //     }\n                    // }\n                }\n\n                if (distanceFromSource > source.z) {\n                    continue;\n                }\n\n                if ((sourceAngle.x != sourceAngle.y) && !isBetween(sourceAngle.x, sourceAngle.y, angleFromSource)) {\n                    continue;\n                }\n\n                // Check if segment between this point and current light source\n                // is blocked by any face\n                bool isSourceBlocked = false;\n                for (int faceIndex = 0; faceIndex < 1024; faceIndex++) {\n                    if (faceIndex >= facesCount) {\n                        break;\n                    }\n                    if (debug) {\n                        vec2 a = applyCameraTransformation(faces[faceIndex].xy);\n                        vec2 b = applyCameraTransformation(faces[faceIndex].zw);\n\n                        if (abs((distance(a, pixelCoord) + distance(b, pixelCoord)) - distance(a, b)) <= 1.0) {\n                            gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);\n                            return;\n                        }\n                    }\n                    if (intersects(applyCameraTransformation(source.xy), pixelCoord, applyCameraTransformation(faces[faceIndex].xy), applyCameraTransformation(faces[faceIndex].zw))) {\n                        // This light is blocked by one of the faces.\n                        // We don't count it.\n                        isSourceBlocked = true;\n                    }\n                }\n\n                if (!isSourceBlocked) {\n                    // Current light source affected this point, let's increase\n                    // lightValue & lightCount for this point\n                    // based on the distance from light source.\n                    // (The closer to the light source, the higher the value)\n                    float radius = source.z;\n                    float intensity = source.w;\n                    float val = max(radius - distanceFromSource, 0.0) / radius * intensity;\n                    lightValue += val * sourceColor;\n                    lightCount += 1.0;\n                    // val = max(radius - distanceFromSource, 0.0) / radius;\n                    // gl_FragColor = vec4(val, val, val, val);\n                    // return;\n                }\n            }\n        }\n    }\n\n    // lightValue /= 4.0;\n\n    // Let's cap maximum lightValue to 0.5 to prevent too much lightness\n    gl_FragColor = vec4(min(lightValue.x, 0.75), min(lightValue.y, 0.75), min(lightValue.z, 0.75), min(lightValue.w, 0.75));\n\n    // gl_FragColor = lightValue;\n}\n";

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
        var _this = this;

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

        console.log('Light shader info:');

        window.setTimeout(function () {
            _this.printFilterInfo(_this.lightFilter);
        }, 0);
    }

    _createClass(LightSystem, [{
        key: 'getProgramInfo',
        value: function getProgramInfo(gl, program) {
            var result = {
                attributes: [],
                uniforms: [],
                attributeCount: 0,
                uniformCount: 0
            },
                activeUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS),
                activeAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

            // Taken from the WebGl spec:
            // http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14
            var enums = {
                0x8B50: 'FLOAT_VEC2',
                0x8B51: 'FLOAT_VEC3',
                0x8B52: 'FLOAT_VEC4',
                0x8B53: 'INT_VEC2',
                0x8B54: 'INT_VEC3',
                0x8B55: 'INT_VEC4',
                0x8B56: 'BOOL',
                0x8B57: 'BOOL_VEC2',
                0x8B58: 'BOOL_VEC3',
                0x8B59: 'BOOL_VEC4',
                0x8B5A: 'FLOAT_MAT2',
                0x8B5B: 'FLOAT_MAT3',
                0x8B5C: 'FLOAT_MAT4',
                0x8B5E: 'SAMPLER_2D',
                0x8B60: 'SAMPLER_CUBE',
                0x1400: 'BYTE',
                0x1401: 'UNSIGNED_BYTE',
                0x1402: 'SHORT',
                0x1403: 'UNSIGNED_SHORT',
                0x1404: 'INT',
                0x1405: 'UNSIGNED_INT',
                0x1406: 'FLOAT'
            };

            // Loop through active uniforms
            for (var i = 0; i < activeUniforms; i++) {
                var uniform = gl.getActiveUniform(program, i);
                uniform.typeName = enums[uniform.type];
                result.uniforms.push(uniform);
                result.uniformCount += uniform.size;
            }

            // Loop through active attributes
            for (var i = 0; i < activeAttributes; i++) {
                var attribute = gl.getActiveAttrib(program, i);
                attribute.typeName = enums[attribute.type];
                result.attributes.push(attribute);
                result.attributeCount += attribute.size;
            }

            return result;
        }
    }, {
        key: 'printFilterInfo',
        value: function printFilterInfo(filter) {
            var shader = filter.shaders[0];
            var programInfo = this.getProgramInfo(shader.gl, shader.program);
            console.table(programInfo.attributes);
            console.table(programInfo.uniforms);
        }
    }, {
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
            var _this2 = this;

            this.lightFilterUniforms.sources.value = new Float32Array(this.lightSources.reduce(function (r, x) {
                return r.concat(x.getArray(_this2.scaleFactor));
            }, []));
            this.lightFilterUniforms.sourcesCount.value = this.lightSources.length;
            // console.log('Updating light sources uniforms, count =', this.lightFilter.uniforms.sourcesCount.value);
        }
    }, {
        key: 'updateFacesUniforms',
        value: function updateFacesUniforms() {
            var _this3 = this;

            this.lightFilterUniforms.faces.value = new Float32Array(this.objects.reduce(function (r, x) {
                return r.concat(x.getArray(_this3.scaleFactor));
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
            var _this4 = this;

            var result = [];

            var points = this.points;

            if (points.length > 2) {
                points = points.concat([points[0]]);
            }

            points.forEach(function (point, index) {
                if (!index) {
                    return;
                }
                result.push.apply(result, [_this4.points[index - 1].x, // / scaleFactor.x,
                _this4.points[index - 1].y, // / scaleFactor.y,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYmx1ci5mcmFnIiwic3JjL2xpZ2h0LmZyYWciLCJzcmMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IFwiI2RlZmluZSBSQURJVVMgMi4wXFxuI2RlZmluZSBTVEVQIDEuMFxcblxcbnByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O1xcbnZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1xcbnVuaWZvcm0gc2FtcGxlcjJEIHVTYW1wbGVyO1xcbnVuaWZvcm0gdmVjMiBzaXplUHg7XFxuXFxudm9pZCBtYWluKCkge1xcbiAgICB2ZWM0IGNvbG9yID0gdmVjNCgwKTtcXG5cXG4gICAgdmVjMiBwaXhlbFNpemUgPSB2ZWMyKDEuMCkgLyBzaXplUHgueHkgKiA0LjA7XFxuXFxuICAgIGZvciAoZmxvYXQgeCA9IC1SQURJVVM7IHggPD0gUkFESVVTOyB4ICs9IDEuMCkge1xcbiAgICAgICAgZm9yIChmbG9hdCB5ID0gLVJBRElVUzsgeSA8PSBSQURJVVM7IHkgKz0gMS4wKSB7XFxuICAgICAgICAgICAgY29sb3IgKz0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2VGV4dHVyZUNvb3JkIC0gdmVjMihwaXhlbFNpemUueCAqIHggKiBTVEVQLCBwaXhlbFNpemUueSAqIHkgKiBTVEVQKSk7XFxuICAgICAgICB9XFxuICAgIH1cXG5cXG4gICAgZ2xfRnJhZ0NvbG9yID0gY29sb3IgLyBwb3coUkFESVVTICogMi4wICsgMS4wLCAyLjApO1xcbn1cXG5cIjtcbiIsIm1vZHVsZS5leHBvcnRzID0gXCJwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcXG5cXG4jZGVmaW5lIE1fUEkgMy4xNDE1OTI2NTM1ODk3OTMyMzg0NjI2NDMzODMyNzk1XFxuXFxudmFyeWluZyB2ZWMyIHZUZXh0dXJlQ29vcmQ7XFxudW5pZm9ybSB2ZWMyIHNpemVQeDtcXG5cXG51bmlmb3JtIHZlYzQgc291cmNlc1sxMDI0XTtcXG51bmlmb3JtIGludCBzb3VyY2VzQ291bnQ7XFxudW5pZm9ybSB2ZWMyIG1vdXNlO1xcblxcbnVuaWZvcm0gdmVjNCBmYWNlc1sxMDI0XTtcXG51bmlmb3JtIGludCBmYWNlc0NvdW50O1xcblxcbnVuaWZvcm0gdmVjMiBjYW1lcmFQb3M7XFxudW5pZm9ybSB2ZWMyIHNjYWxlRmFjdG9yO1xcblxcbnVuaWZvcm0gYm9vbCBkZWJ1ZztcXG5cXG5ib29sIGNjdyhpbiB2ZWMyIGEsIGluIHZlYzIgYiwgaW4gdmVjMiBjKSB7XFxuICAgIC8vIENoZWNrcyBpZiB0aHJlZSB2ZWN0b3JzIGFyZSBwbGFjZWQgaW4gYSBDQ1cgb3JkZXJcXG4gICAgcmV0dXJuIChjLnkgLSBhLnkpICogKGIueCAtIGEueCkgPiAoYi55IC0gYS55KSAqIChjLnggLSBhLngpO1xcbn1cXG5cXG5ib29sIGludGVyc2VjdHMoaW4gdmVjMiBhLCBpbiB2ZWMyIGIsIGluIHZlYzIgYywgaW4gdmVjMiBkKSB7XFxuICAgIC8vIEZhc3QgaW50ZXJzZWN0aW9uIGNoZWNrIGJhc2VkIG9uIHZlcnRleCBvcmRlclxcbiAgICByZXR1cm4gY2N3KGEsIGMsIGQpICE9IGNjdyhiLCBjLCBkKSAmJiBjY3coYSwgYiwgYykgIT0gY2N3KGEsIGIsIGQpO1xcbn1cXG5cXG52ZWMyIGZsaXAoaW4gdmVjMiB2KSB7XFxuICAgIHJldHVybiB2ZWMyKHYueCwgMS4wIC0gdi55KTtcXG59XFxuXFxudmVjMiBhcHBseUNhbWVyYVRyYW5zZm9ybWF0aW9uKGluIHZlYzIgcG9pbnQpIHtcXG4gICAgcmV0dXJuIHBvaW50IC0gY2FtZXJhUG9zO1xcbn1cXG5cXG5mbG9hdCBhbmdsZUJldHdlZW4oaW4gZmxvYXQgc3RhcnQsIGluIGZsb2F0IGVuZClcXG57XFxuICAgIHJldHVybiBtb2QoZW5kIC0gc3RhcnQsIE1fUEkgKiAyLjApO1xcbn1cXG5cXG5ib29sIGlzQmV0d2VlbihpbiBmbG9hdCBzdGFydEFuZ2xlLCBpbiBmbG9hdCBlbmRBbmdsZSwgaW4gZmxvYXQgdGVzdEFuZ2xlKSB7XFxuICAgIGZsb2F0IGExID0gYWJzKGFuZ2xlQmV0d2VlbihzdGFydEFuZ2xlLCB0ZXN0QW5nbGUpKTtcXG4gICAgZmxvYXQgYTIgPSBhYnMoYW5nbGVCZXR3ZWVuKHRlc3RBbmdsZSwgZW5kQW5nbGUpKTtcXG4gICAgZmxvYXQgYTMgPSBhYnMoYW5nbGVCZXR3ZWVuKHN0YXJ0QW5nbGUsIGVuZEFuZ2xlKSk7XFxuICAgIHJldHVybiAoYTEgKyBhMikgLSBhMyA8IDEuMDtcXG59XFxuXFxudm9pZCBtYWluKCkge1xcbiAgICAvLyBwaXhlbCBzaXplIGluIHVuaXRzXFxuXFxuICAgIHZlYzIgcGl4ZWxTaXplID0gdmVjMigxLjApIC8gc2l6ZVB4Lnh5O1xcblxcbiAgICAvLyB2ZWMyIG1vdXNlUG9zID0gbW91c2UgKiBwaXhlbFNpemU7XFxuXFxuICAgIC8vIEN1cnJlbnQgcG9zaXRpb24gaW4gcGl4ZWxzXFxuICAgIHZlYzIgcGl4ZWxDb29yZCA9IGZsaXAodlRleHR1cmVDb29yZCkgLyBwaXhlbFNpemU7XFxuXFxuICAgIC8vIENvdW50ICYgdG90YWwgaW50ZW5zaXR5IG9mIGxpZ2h0IHNvdXJjZXMgdGhhdCBhZmZlY3QgdGhpcyBwb2ludFxcbiAgICB2ZWM0IGxpZ2h0VmFsdWUgPSB2ZWM0KDAuMCk7XFxuICAgIGZsb2F0IGxpZ2h0Q291bnQgPSAwLjA7XFxuXFxuICAgIC8vIHNvdXJjZXNbMF0gPSBtb3VzZTtcXG5cXG4gICAgZm9yIChpbnQgc291cmNlSW5kZXggPSAwOyBzb3VyY2VJbmRleCA8IDEwMjQ7IHNvdXJjZUluZGV4ICs9IDMpIHtcXG4gICAgICAgIC8vIExvb3AgdGhyb3VnaCBsaWdodCBzb3VyY2VzXFxuICAgICAgICBpZiAoc291cmNlSW5kZXggPj0gc291cmNlc0NvdW50ICogMykge1xcbiAgICAgICAgICAgIGJyZWFrO1xcbiAgICAgICAgfVxcblxcbiAgICAgICAgZm9yIChmbG9hdCBkeCA9IDAuMDsgZHggPCAxLjA7IGR4ICs9IDEuMCkge1xcbiAgICAgICAgICAgIGZvciAoZmxvYXQgZHkgPSAwLjA7IGR5IDwgMS4wOyBkeSArPSAxLjApIHtcXG4gICAgICAgICAgICAgICAgdmVjNCBzb3VyY2UgPSB2ZWM0KHNvdXJjZXNbc291cmNlSW5kZXhdLnh5ICsgdmVjMihkeCwgZHkpICogOC4wLCBzb3VyY2VzW3NvdXJjZUluZGV4XS56dyk7XFxuICAgICAgICAgICAgICAgIHZlYzQgc291cmNlQ29sb3IgPSBzb3VyY2VzW3NvdXJjZUluZGV4ICsgMV07XFxuICAgICAgICAgICAgICAgIHZlYzIgc291cmNlQW5nbGUgPSBzb3VyY2VzW3NvdXJjZUluZGV4ICsgMl0ueHk7XFxuXFxuICAgICAgICAgICAgICAgIC8vIERpc3RhbmNlIGZyb20gY3VycmVudCBsaWdodCBzb3VyY2UgdG8gY3VycmVudCBwb2ludFxcbiAgICAgICAgICAgICAgICBmbG9hdCBkaXN0YW5jZUZyb21Tb3VyY2UgPSBkaXN0YW5jZShhcHBseUNhbWVyYVRyYW5zZm9ybWF0aW9uKHNvdXJjZS54eSksIHBpeGVsQ29vcmQpO1xcbiAgICAgICAgICAgICAgICB2ZWMyIG9mZnNldCA9IHBpeGVsQ29vcmQgLSBhcHBseUNhbWVyYVRyYW5zZm9ybWF0aW9uKHNvdXJjZS54eSk7XFxuICAgICAgICAgICAgICAgIGZsb2F0IGFuZ2xlRnJvbVNvdXJjZSA9IGF0YW4ob2Zmc2V0LnksIG9mZnNldC54KTtcXG5cXG4gICAgICAgICAgICAgICAgaWYgKGRlYnVnKSB7XFxuICAgICAgICAgICAgICAgICAgICAvLyBEcmF3IGxpZ2h0IHBvc2l0aW9uICYgcmFkaXVzXFxuICAgICAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2VGcm9tU291cmNlIDwgNS4wKSB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2xfRnJhZ0NvbG9yID0gdmVjNChzb3VyY2VDb2xvci54eXosIDAuMSk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xcbiAgICAgICAgICAgICAgICAgICAgfVxcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFicyhkaXN0YW5jZUZyb21Tb3VyY2UgLSBzb3VyY2UueikgPCA1LjApIHtcXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKHNvdXJjZUFuZ2xlLnggPT0gc291cmNlQW5nbGUueSkgfHwgaXNCZXR3ZWVuKHNvdXJjZUFuZ2xlLngsIHNvdXJjZUFuZ2xlLnksIGFuZ2xlRnJvbVNvdXJjZSkpIHtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2xfRnJhZ0NvbG9yID0gdmVjNChzb3VyY2VDb2xvci54LCBzb3VyY2VDb2xvci55LCBzb3VyY2VDb2xvci56LCAwLjEpO1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxcbiAgICAgICAgICAgICAgICAgICAgfVxcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHNvdXJjZUFuZ2xlLnggIT0gc291cmNlQW5nbGUueSkge1xcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmIChhbmdsZUZyb21Tb3VyY2UgLSAob2Zmc2V0LnggKyBvZmZzZXQueSkgLyAyLjAgPCAyLjApIHtcXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCgwLjAsIDEuMCwgMC4wLCAxLjApO1xcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cXG4gICAgICAgICAgICAgICAgICAgIC8vIH1cXG4gICAgICAgICAgICAgICAgfVxcblxcbiAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2VGcm9tU291cmNlID4gc291cmNlLnopIHtcXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xcbiAgICAgICAgICAgICAgICB9XFxuXFxuICAgICAgICAgICAgICAgIGlmICgoc291cmNlQW5nbGUueCAhPSBzb3VyY2VBbmdsZS55KSAmJiAhaXNCZXR3ZWVuKHNvdXJjZUFuZ2xlLngsIHNvdXJjZUFuZ2xlLnksIGFuZ2xlRnJvbVNvdXJjZSkpIHtcXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xcbiAgICAgICAgICAgICAgICB9XFxuXFxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHNlZ21lbnQgYmV0d2VlbiB0aGlzIHBvaW50IGFuZCBjdXJyZW50IGxpZ2h0IHNvdXJjZVxcbiAgICAgICAgICAgICAgICAvLyBpcyBibG9ja2VkIGJ5IGFueSBmYWNlXFxuICAgICAgICAgICAgICAgIGJvb2wgaXNTb3VyY2VCbG9ja2VkID0gZmFsc2U7XFxuICAgICAgICAgICAgICAgIGZvciAoaW50IGZhY2VJbmRleCA9IDA7IGZhY2VJbmRleCA8IDEwMjQ7IGZhY2VJbmRleCsrKSB7XFxuICAgICAgICAgICAgICAgICAgICBpZiAoZmFjZUluZGV4ID49IGZhY2VzQ291bnQpIHtcXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcXG4gICAgICAgICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWJ1Zykge1xcbiAgICAgICAgICAgICAgICAgICAgICAgIHZlYzIgYSA9IGFwcGx5Q2FtZXJhVHJhbnNmb3JtYXRpb24oZmFjZXNbZmFjZUluZGV4XS54eSk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgdmVjMiBiID0gYXBwbHlDYW1lcmFUcmFuc2Zvcm1hdGlvbihmYWNlc1tmYWNlSW5kZXhdLnp3KTtcXG5cXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWJzKChkaXN0YW5jZShhLCBwaXhlbENvb3JkKSArIGRpc3RhbmNlKGIsIHBpeGVsQ29vcmQpKSAtIGRpc3RhbmNlKGEsIGIpKSA8PSAxLjApIHtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCgwLjAsIDEuMCwgMS4wLCAxLjApO1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxcbiAgICAgICAgICAgICAgICAgICAgfVxcbiAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyc2VjdHMoYXBwbHlDYW1lcmFUcmFuc2Zvcm1hdGlvbihzb3VyY2UueHkpLCBwaXhlbENvb3JkLCBhcHBseUNhbWVyYVRyYW5zZm9ybWF0aW9uKGZhY2VzW2ZhY2VJbmRleF0ueHkpLCBhcHBseUNhbWVyYVRyYW5zZm9ybWF0aW9uKGZhY2VzW2ZhY2VJbmRleF0uencpKSkge1xcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgbGlnaHQgaXMgYmxvY2tlZCBieSBvbmUgb2YgdGhlIGZhY2VzLlxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIGRvbid0IGNvdW50IGl0LlxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzU291cmNlQmxvY2tlZCA9IHRydWU7XFxuICAgICAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgICAgIH1cXG5cXG4gICAgICAgICAgICAgICAgaWYgKCFpc1NvdXJjZUJsb2NrZWQpIHtcXG4gICAgICAgICAgICAgICAgICAgIC8vIEN1cnJlbnQgbGlnaHQgc291cmNlIGFmZmVjdGVkIHRoaXMgcG9pbnQsIGxldCdzIGluY3JlYXNlXFxuICAgICAgICAgICAgICAgICAgICAvLyBsaWdodFZhbHVlICYgbGlnaHRDb3VudCBmb3IgdGhpcyBwb2ludFxcbiAgICAgICAgICAgICAgICAgICAgLy8gYmFzZWQgb24gdGhlIGRpc3RhbmNlIGZyb20gbGlnaHQgc291cmNlLlxcbiAgICAgICAgICAgICAgICAgICAgLy8gKFRoZSBjbG9zZXIgdG8gdGhlIGxpZ2h0IHNvdXJjZSwgdGhlIGhpZ2hlciB0aGUgdmFsdWUpXFxuICAgICAgICAgICAgICAgICAgICBmbG9hdCByYWRpdXMgPSBzb3VyY2UuejtcXG4gICAgICAgICAgICAgICAgICAgIGZsb2F0IGludGVuc2l0eSA9IHNvdXJjZS53O1xcbiAgICAgICAgICAgICAgICAgICAgZmxvYXQgdmFsID0gbWF4KHJhZGl1cyAtIGRpc3RhbmNlRnJvbVNvdXJjZSwgMC4wKSAvIHJhZGl1cyAqIGludGVuc2l0eTtcXG4gICAgICAgICAgICAgICAgICAgIGxpZ2h0VmFsdWUgKz0gdmFsICogc291cmNlQ29sb3I7XFxuICAgICAgICAgICAgICAgICAgICBsaWdodENvdW50ICs9IDEuMDtcXG4gICAgICAgICAgICAgICAgICAgIC8vIHZhbCA9IG1heChyYWRpdXMgLSBkaXN0YW5jZUZyb21Tb3VyY2UsIDAuMCkgLyByYWRpdXM7XFxuICAgICAgICAgICAgICAgICAgICAvLyBnbF9GcmFnQ29sb3IgPSB2ZWM0KHZhbCwgdmFsLCB2YWwsIHZhbCk7XFxuICAgICAgICAgICAgICAgICAgICAvLyByZXR1cm47XFxuICAgICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICB9XFxuICAgICAgICB9XFxuICAgIH1cXG5cXG4gICAgLy8gbGlnaHRWYWx1ZSAvPSA0LjA7XFxuXFxuICAgIC8vIExldCdzIGNhcCBtYXhpbXVtIGxpZ2h0VmFsdWUgdG8gMC41IHRvIHByZXZlbnQgdG9vIG11Y2ggbGlnaHRuZXNzXFxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQobWluKGxpZ2h0VmFsdWUueCwgMC43NSksIG1pbihsaWdodFZhbHVlLnksIDAuNzUpLCBtaW4obGlnaHRWYWx1ZS56LCAwLjc1KSwgbWluKGxpZ2h0VmFsdWUudywgMC43NSkpO1xcblxcbiAgICAvLyBnbF9GcmFnQ29sb3IgPSBsaWdodFZhbHVlO1xcbn1cXG5cIjtcbiIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG52YXIgbGlnaHRGcmFnU291cmNlID0gcmVxdWlyZSgnLi9saWdodC5mcmFnJyk7XG52YXIgYmx1ckZyYWdTb3VyY2UgPSByZXF1aXJlKCcuL2JsdXIuZnJhZycpO1xuXG52YXIgTGlnaHRTeXN0ZW0gPSBleHBvcnRzLkxpZ2h0U3lzdGVtID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExpZ2h0U3lzdGVtKHcsIGgsIGRlYnVnKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIExpZ2h0U3lzdGVtKTtcblxuICAgICAgICAvLyB0aGlzLnNwcml0ZSA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwKTtcbiAgICAgICAgLy8gdGhpcy53ID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgIC8vIHRoaXMuaCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgICAgLy8gdmFyIHNjYWxlID0gNDtcbiAgICAgICAgLy8gdGhpcy53ID0gd2luZG93LmlubmVyV2lkdGggLyBzY2FsZTtcbiAgICAgICAgLy8gdGhpcy5oID0gd2luZG93LmlubmVySGVpZ2h0IC8gc2NhbGU7XG4gICAgICAgIHRoaXMudyA9IHcgfHwgMjU2O1xuICAgICAgICB0aGlzLmggPSBoIHx8IDI1NjtcbiAgICAgICAgLy8gVE9ETzogTWFrZSBpbWFnZSBpbnZpc2libGUgKnByb3Blcmx5KlxuICAgICAgICAvLyB0aGlzLmltYWdlID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDApO1xuICAgICAgICAvLyB0aGlzLmltYWdlID0gbmV3IFBoYXNlci5HcmFwaGljcyhnYW1lLCAwLCAwKTtcbiAgICAgICAgdGhpcy5saWdodFRleHR1cmUgPSBnYW1lLmFkZC5yZW5kZXJUZXh0dXJlKHRoaXMudywgdGhpcy5oLCAnbGlnaHRUZXh0dXJlJyk7XG4gICAgICAgIHRoaXMubGlnaHRJbWFnZSA9IGdhbWUuYWRkLmltYWdlKDEwNDg1NzYsIDEwNDg1NzYpO1xuICAgICAgICB0aGlzLmxpZ2h0SW1hZ2Uud2lkdGggPSB0aGlzLnc7XG4gICAgICAgIHRoaXMubGlnaHRJbWFnZS5oZWlnaHQgPSB0aGlzLmg7XG5cbiAgICAgICAgLy8gdGhpcy5saWdodEltYWdlLmJsZW5kTW9kZSA9IDE7XG5cbiAgICAgICAgLy8gdGhpcy5saWdodEltYWdlLmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuICAgICAgICB0aGlzLmxpZ2h0SW1hZ2Uuc21vb3RoZWQgPSB0cnVlO1xuICAgICAgICAvLyB0aGlzLmxpZ2h0SW1hZ2UucmVuZGVyYWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNjYWxlRmFjdG9yID0gbmV3IFBoYXNlci5Qb2ludCh3aW5kb3cuaW5uZXJXaWR0aCAvIHRoaXMudywgd2luZG93LmlubmVySGVpZ2h0IC8gdGhpcy5oKTtcblxuICAgICAgICB0aGlzLnJlbmRlcmVkSW1hZ2UgPSBnYW1lLmFkZC5pbWFnZSgwLCB3aW5kb3cuaW5uZXJIZWlnaHQsIHRoaXMubGlnaHRUZXh0dXJlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlZEltYWdlLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgIHRoaXMucmVuZGVyZWRJbWFnZS5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICAgIHRoaXMucmVuZGVyZWRJbWFnZS5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZW5kZXJlZEltYWdlLnNjYWxlLnkgKj0gLTE7XG4gICAgICAgIHRoaXMucmVuZGVyZWRJbWFnZS5zbW9vdGhlZCA9IHRydWU7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdJbml0aWFsIGxpZ2h0IHNwcml0ZSBzY2FsZTonLCB0aGlzLnNwcml0ZS5zY2FsZS54LCB0aGlzLnNwcml0ZS5zY2FsZS55KTtcbiAgICAgICAgLy8gdGhpcy5zcHJpdGUuc2NhbGUueCAqPSB0aGlzLnNjYWxlRmFjdG9yLng7XG4gICAgICAgIC8vIHRoaXMuc3ByaXRlLnNjYWxlLnkgKj0gdGhpcy5zY2FsZUZhY3Rvci55O1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnQ3JlYXRpbmcgbGlnaHQgc3ByaXRlLCBzaXplJywgdGhpcy53LCB0aGlzLmgsICdzY2FsZScsIHRoaXMuc2NhbGVGYWN0b3IueCwgdGhpcy5zY2FsZUZhY3Rvci55KTtcbiAgICAgICAgLy8gdGhpcy5zcHJpdGUud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICAgICAgLy8gdGhpcy5zcHJpdGUuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuXG4gICAgICAgIHRoaXMubGlnaHRGaWx0ZXJVbmlmb3JtcyA9IHtcbiAgICAgICAgICAgIHNpemVQeDoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICcyZnYnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBuZXcgRmxvYXQzMkFycmF5KFt3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0XSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzY2FsZUZhY3Rvcjoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICcyZnYnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBuZXcgRmxvYXQzMkFycmF5KFt0aGlzLnNjYWxlRmFjdG9yLngsIHRoaXMuc2NhbGVGYWN0b3IueV0pXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc291cmNlczoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICc0ZnYnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBuZXcgRmxvYXQzMkFycmF5KFtdKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNvdXJjZXNDb3VudDoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICcxaScsXG4gICAgICAgICAgICAgICAgdmFsdWU6IDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmYWNlczoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICc0ZnYnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBuZXcgRmxvYXQzMkFycmF5KFtdKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZhY2VzQ291bnQ6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnMWknLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2FtZXJhUG9zOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJzJmdicsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG5ldyBGbG9hdDMyQXJyYXkoWzAsIDBdKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlYnVnOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJzFpJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogISFkZWJ1Z1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYmx1ckZpbHRlclVuaWZvcm1zID0ge1xuICAgICAgICAgICAgc2l6ZVB4OiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJzJmdicsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG5ldyBGbG9hdDMyQXJyYXkoW3dpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHRdKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubGlnaHRGaWx0ZXIgPSBuZXcgUGhhc2VyLkZpbHRlcihnYW1lLCB0aGlzLmxpZ2h0RmlsdGVyVW5pZm9ybXMsIGxpZ2h0RnJhZ1NvdXJjZSk7XG4gICAgICAgIHRoaXMubGlnaHRGaWx0ZXIuc2V0UmVzb2x1dGlvbih0aGlzLncsIHRoaXMuaCk7XG4gICAgICAgIHRoaXMuYmx1ckZpbHRlciA9IG5ldyBQaGFzZXIuRmlsdGVyKGdhbWUsIHRoaXMuYmx1ckZpbHRlclVuaWZvcm1zLCBibHVyRnJhZ1NvdXJjZSk7XG4gICAgICAgIHRoaXMubGlnaHRJbWFnZS5maWx0ZXJzID0gW3RoaXMubGlnaHRGaWx0ZXIsIHRoaXMuYmx1ckZpbHRlcl07XG5cbiAgICAgICAgdGhpcy5saWdodFNvdXJjZXMgPSBbXTtcbiAgICAgICAgdGhpcy5vYmplY3RzID0gW107XG5cbiAgICAgICAgY29uc29sZS5sb2coJ0xpZ2h0IHNoYWRlciBpbmZvOicpO1xuXG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzLnByaW50RmlsdGVySW5mbyhfdGhpcy5saWdodEZpbHRlcik7XG4gICAgICAgIH0sIDApO1xuICAgIH1cblxuICAgIF9jcmVhdGVDbGFzcyhMaWdodFN5c3RlbSwgW3tcbiAgICAgICAga2V5OiAnZ2V0UHJvZ3JhbUluZm8nLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0UHJvZ3JhbUluZm8oZ2wsIHByb2dyYW0pIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB7XG4gICAgICAgICAgICAgICAgYXR0cmlidXRlczogW10sXG4gICAgICAgICAgICAgICAgdW5pZm9ybXM6IFtdLFxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZUNvdW50OiAwLFxuICAgICAgICAgICAgICAgIHVuaWZvcm1Db3VudDogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBhY3RpdmVVbmlmb3JtcyA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TKSxcbiAgICAgICAgICAgICAgICBhY3RpdmVBdHRyaWJ1dGVzID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCBnbC5BQ1RJVkVfQVRUUklCVVRFUyk7XG5cbiAgICAgICAgICAgIC8vIFRha2VuIGZyb20gdGhlIFdlYkdsIHNwZWM6XG4gICAgICAgICAgICAvLyBodHRwOi8vd3d3Lmtocm9ub3Mub3JnL3JlZ2lzdHJ5L3dlYmdsL3NwZWNzL2xhdGVzdC8xLjAvIzUuMTRcbiAgICAgICAgICAgIHZhciBlbnVtcyA9IHtcbiAgICAgICAgICAgICAgICAweDhCNTA6ICdGTE9BVF9WRUMyJyxcbiAgICAgICAgICAgICAgICAweDhCNTE6ICdGTE9BVF9WRUMzJyxcbiAgICAgICAgICAgICAgICAweDhCNTI6ICdGTE9BVF9WRUM0JyxcbiAgICAgICAgICAgICAgICAweDhCNTM6ICdJTlRfVkVDMicsXG4gICAgICAgICAgICAgICAgMHg4QjU0OiAnSU5UX1ZFQzMnLFxuICAgICAgICAgICAgICAgIDB4OEI1NTogJ0lOVF9WRUM0JyxcbiAgICAgICAgICAgICAgICAweDhCNTY6ICdCT09MJyxcbiAgICAgICAgICAgICAgICAweDhCNTc6ICdCT09MX1ZFQzInLFxuICAgICAgICAgICAgICAgIDB4OEI1ODogJ0JPT0xfVkVDMycsXG4gICAgICAgICAgICAgICAgMHg4QjU5OiAnQk9PTF9WRUM0JyxcbiAgICAgICAgICAgICAgICAweDhCNUE6ICdGTE9BVF9NQVQyJyxcbiAgICAgICAgICAgICAgICAweDhCNUI6ICdGTE9BVF9NQVQzJyxcbiAgICAgICAgICAgICAgICAweDhCNUM6ICdGTE9BVF9NQVQ0JyxcbiAgICAgICAgICAgICAgICAweDhCNUU6ICdTQU1QTEVSXzJEJyxcbiAgICAgICAgICAgICAgICAweDhCNjA6ICdTQU1QTEVSX0NVQkUnLFxuICAgICAgICAgICAgICAgIDB4MTQwMDogJ0JZVEUnLFxuICAgICAgICAgICAgICAgIDB4MTQwMTogJ1VOU0lHTkVEX0JZVEUnLFxuICAgICAgICAgICAgICAgIDB4MTQwMjogJ1NIT1JUJyxcbiAgICAgICAgICAgICAgICAweDE0MDM6ICdVTlNJR05FRF9TSE9SVCcsXG4gICAgICAgICAgICAgICAgMHgxNDA0OiAnSU5UJyxcbiAgICAgICAgICAgICAgICAweDE0MDU6ICdVTlNJR05FRF9JTlQnLFxuICAgICAgICAgICAgICAgIDB4MTQwNjogJ0ZMT0FUJ1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gTG9vcCB0aHJvdWdoIGFjdGl2ZSB1bmlmb3Jtc1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3RpdmVVbmlmb3JtczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHVuaWZvcm0gPSBnbC5nZXRBY3RpdmVVbmlmb3JtKHByb2dyYW0sIGkpO1xuICAgICAgICAgICAgICAgIHVuaWZvcm0udHlwZU5hbWUgPSBlbnVtc1t1bmlmb3JtLnR5cGVdO1xuICAgICAgICAgICAgICAgIHJlc3VsdC51bmlmb3Jtcy5wdXNoKHVuaWZvcm0pO1xuICAgICAgICAgICAgICAgIHJlc3VsdC51bmlmb3JtQ291bnQgKz0gdW5pZm9ybS5zaXplO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBMb29wIHRocm91Z2ggYWN0aXZlIGF0dHJpYnV0ZXNcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0aXZlQXR0cmlidXRlczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGF0dHJpYnV0ZSA9IGdsLmdldEFjdGl2ZUF0dHJpYihwcm9ncmFtLCBpKTtcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGUudHlwZU5hbWUgPSBlbnVtc1thdHRyaWJ1dGUudHlwZV07XG4gICAgICAgICAgICAgICAgcmVzdWx0LmF0dHJpYnV0ZXMucHVzaChhdHRyaWJ1dGUpO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5hdHRyaWJ1dGVDb3VudCArPSBhdHRyaWJ1dGUuc2l6ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAncHJpbnRGaWx0ZXJJbmZvJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHByaW50RmlsdGVySW5mbyhmaWx0ZXIpIHtcbiAgICAgICAgICAgIHZhciBzaGFkZXIgPSBmaWx0ZXIuc2hhZGVyc1swXTtcbiAgICAgICAgICAgIHZhciBwcm9ncmFtSW5mbyA9IHRoaXMuZ2V0UHJvZ3JhbUluZm8oc2hhZGVyLmdsLCBzaGFkZXIucHJvZ3JhbSk7XG4gICAgICAgICAgICBjb25zb2xlLnRhYmxlKHByb2dyYW1JbmZvLmF0dHJpYnV0ZXMpO1xuICAgICAgICAgICAgY29uc29sZS50YWJsZShwcm9ncmFtSW5mby51bmlmb3Jtcyk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ2FkZExpZ2h0U291cmNlJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGFkZExpZ2h0U291cmNlKGxpZ2h0U291cmNlKSB7XG4gICAgICAgICAgICB0aGlzLmxpZ2h0U291cmNlcy5wdXNoKGxpZ2h0U291cmNlKTtcbiAgICAgICAgICAgIC8vIHRoaXMuX3VwZGF0ZUxpZ2h0U291cmNlc1VuaWZvcm1zKCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3JlbW92ZUxpZ2h0U291cmNlJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlbW92ZUxpZ2h0U291cmNlKGxpZ2h0U291cmNlKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmxpZ2h0U291cmNlcy5pbmRleE9mKGxpZ2h0U291cmNlKTtcbiAgICAgICAgICAgIHRoaXMubGlnaHRTb3VyY2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAvLyB0aGlzLl91cGRhdGVMaWdodFNvdXJjZXNVbmlmb3JtcygpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdhZGRPYmplY3QnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gYWRkT2JqZWN0KG9iaikge1xuICAgICAgICAgICAgdGhpcy5vYmplY3RzLnB1c2gob2JqKTtcbiAgICAgICAgICAgIC8vIHRoaXMuX3VwZGF0ZUZhY2VzVW5pZm9ybXMoKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAncmVtb3ZlT2JqZWN0JyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlbW92ZU9iamVjdChvYmopIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMub2JqZWN0cy5pbmRleE9mKG9iaik7XG4gICAgICAgICAgICB0aGlzLm9iamVjdHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIC8vIHRoaXMuX3VwZGF0ZUZhY2VzVW5pZm9ybXMoKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAncmVtb3ZlQWxsJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlbW92ZUFsbCgpIHtcbiAgICAgICAgICAgIHRoaXMubGlnaHRTb3VyY2VzID0gW107XG4gICAgICAgICAgICB0aGlzLm9iamVjdHMgPSBbXTtcbiAgICAgICAgICAgIC8vIHRoaXMuX3VwZGF0ZUxpZ2h0U291cmNlc1VuaWZvcm1zKCk7XG4gICAgICAgICAgICAvLyB0aGlzLl91cGRhdGVGYWNlc1VuaWZvcm1zKCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3VwZGF0ZUxpZ2h0U291cmNlc1VuaWZvcm1zJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZUxpZ2h0U291cmNlc1VuaWZvcm1zKCkge1xuICAgICAgICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgICAgICAgIHRoaXMubGlnaHRGaWx0ZXJVbmlmb3Jtcy5zb3VyY2VzLnZhbHVlID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLmxpZ2h0U291cmNlcy5yZWR1Y2UoZnVuY3Rpb24gKHIsIHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gci5jb25jYXQoeC5nZXRBcnJheShfdGhpczIuc2NhbGVGYWN0b3IpKTtcbiAgICAgICAgICAgIH0sIFtdKSk7XG4gICAgICAgICAgICB0aGlzLmxpZ2h0RmlsdGVyVW5pZm9ybXMuc291cmNlc0NvdW50LnZhbHVlID0gdGhpcy5saWdodFNvdXJjZXMubGVuZ3RoO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ1VwZGF0aW5nIGxpZ2h0IHNvdXJjZXMgdW5pZm9ybXMsIGNvdW50ID0nLCB0aGlzLmxpZ2h0RmlsdGVyLnVuaWZvcm1zLnNvdXJjZXNDb3VudC52YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3VwZGF0ZUZhY2VzVW5pZm9ybXMnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gdXBkYXRlRmFjZXNVbmlmb3JtcygpIHtcbiAgICAgICAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG4gICAgICAgICAgICB0aGlzLmxpZ2h0RmlsdGVyVW5pZm9ybXMuZmFjZXMudmFsdWUgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMub2JqZWN0cy5yZWR1Y2UoZnVuY3Rpb24gKHIsIHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gci5jb25jYXQoeC5nZXRBcnJheShfdGhpczMuc2NhbGVGYWN0b3IpKTtcbiAgICAgICAgICAgIH0sIFtdKSk7XG4gICAgICAgICAgICB0aGlzLmxpZ2h0RmlsdGVyVW5pZm9ybXMuZmFjZXNDb3VudC52YWx1ZSA9IHRoaXMubGlnaHRGaWx0ZXJVbmlmb3Jtcy5mYWNlcy52YWx1ZS5sZW5ndGggLyA0O1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ1VwZGF0aW5nIGZhY2VzIHVuaWZvcm1zLCBjb3VudCA9JywgdGhpcy5saWdodEZpbHRlci51bmlmb3Jtcy5mYWNlc0NvdW50LnZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAndXBkYXRlVW5pZm9ybXMnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gdXBkYXRlVW5pZm9ybXMoKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUxpZ2h0U291cmNlc1VuaWZvcm1zKCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUZhY2VzVW5pZm9ybXMoKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAndXBkYXRlQ2FtZXJhUG9zJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZUNhbWVyYVBvcyhwb2ludCkge1xuICAgICAgICAgICAgdGhpcy5saWdodEZpbHRlclVuaWZvcm1zLmNhbWVyYVBvcy52YWx1ZSA9IG5ldyBGbG9hdDMyQXJyYXkoW1xuICAgICAgICAgICAgLy8gcG9pbnQueCAvIHRoaXMuc2NhbGVGYWN0b3IueCxcbiAgICAgICAgICAgIC8vIHBvaW50LnkgLyB0aGlzLnNjYWxlRmFjdG9yLnlcbiAgICAgICAgICAgIHBvaW50LngsIHBvaW50LnldKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAnc2V0RGVidWcnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc2V0RGVidWcoZW5hYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmxpZ2h0RmlsdGVyVW5pZm9ybXMuZGVidWcudmFsdWUgPSAhIWVuYWJsZTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAndXBkYXRlJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICAgICAgICAgIHRoaXMubGlnaHRGaWx0ZXIudXBkYXRlKCk7XG4gICAgICAgICAgICB0aGlzLmJsdXJGaWx0ZXIudXBkYXRlKCk7XG4gICAgICAgICAgICB0aGlzLmxpZ2h0VGV4dHVyZS5yZW5kZXJYWSh0aGlzLmxpZ2h0SW1hZ2UsIDAsIDAsIHRydWUpO1xuICAgICAgICAgICAgLy8gdGhpcy5pbWFnZS5zZXRUZXh0dXJlKHRoaXMuaW1hZ2UuZ2VuZXJhdGVUZXh0dXJlKDEsIFBJWEkuc2NhbGVNb2Rlcy5MSU5FQVIsIGdhbWUucmVuZGVyZXIpKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAnZGVzdHJveScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgICAgICAgICAgLy8gVE9ETzogYGRlc3Ryb3lgIG9yIGByZW1vdmVgP1xuICAgICAgICAgICAgdGhpcy5saWdodEZpbHRlci5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLmJsdXJGaWx0ZXIuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5pbWFnZS5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gTGlnaHRTeXN0ZW07XG59KCk7XG5cbnZhciBMaWdodFNvdXJjZSA9IGV4cG9ydHMuTGlnaHRTb3VyY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGlnaHRTb3VyY2UocG9zaXRpb24sIHJhZGl1cywgaW50ZW5zaXR5LCBjb2xvciwgYW5nbGVTdGFydCwgYW5nbGVFbmQpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIExpZ2h0U291cmNlKTtcblxuICAgICAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb247XG4gICAgICAgIHRoaXMucmFkaXVzID0gcmFkaXVzO1xuICAgICAgICB0aGlzLmludGVuc2l0eSA9IGludGVuc2l0eTtcbiAgICAgICAgdGhpcy5jb2xvciA9IGNvbG9yO1xuICAgICAgICB0aGlzLl9hbmdsZVN0YXJ0ID0gYW5nbGVTdGFydCB8fCAwO1xuICAgICAgICB0aGlzLl9hbmdsZUVuZCA9IGFuZ2xlRW5kIHx8IDA7XG4gICAgICAgIHRoaXMuc2V0Um90YXRpb24oMCk7XG4gICAgfVxuXG4gICAgX2NyZWF0ZUNsYXNzKExpZ2h0U291cmNlLCBbe1xuICAgICAgICBrZXk6ICdnZXRBcnJheScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRBcnJheShzY2FsZUZhY3Rvcikge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLnBvc2l0aW9uLngsIC8vIC8gc2NhbGVGYWN0b3IueCxcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb24ueSwgLy8gLyBzY2FsZUZhY3Rvci55LFxuICAgICAgICAgICAgdGhpcy5yYWRpdXMsIHRoaXMuaW50ZW5zaXR5LCB0aGlzLmNvbG9yWzBdLCB0aGlzLmNvbG9yWzFdLCB0aGlzLmNvbG9yWzJdLCB0aGlzLmNvbG9yWzNdLCB0aGlzLmFuZ2xlU3RhcnQsIHRoaXMuYW5nbGVFbmQsIDAsIDBdO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdzZXRSb3RhdGlvbicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRSb3RhdGlvbihyb3RhdGlvbikge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2FuZ2xlU3RhcnQgPT0gMCAmJiB0aGlzLl9hbmRsZUVuZCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnJvdGF0aW9uID0gcm90YXRpb247XG4gICAgICAgICAgICB0aGlzLmFuZ2xlU3RhcnQgPSAodGhpcy5fYW5nbGVTdGFydCArIHRoaXMucm90YXRpb24pICUgKE1hdGguUEkgKiAyKTtcbiAgICAgICAgICAgIHRoaXMuYW5nbGVFbmQgPSAodGhpcy5fYW5nbGVFbmQgKyB0aGlzLnJvdGF0aW9uKSAlIChNYXRoLlBJICogMik7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmFuZ2xlU3RhcnQgPCAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hbmdsZVN0YXJ0ICs9IE1hdGguUEkgKiAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuYW5nbGVFbmQgPCAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hbmdsZUVuZCArPSBNYXRoLlBJICogMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBMaWdodFNvdXJjZTtcbn0oKTtcblxudmFyIExpZ2h0ZWRPYmplY3QgPSBleHBvcnRzLkxpZ2h0ZWRPYmplY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGlnaHRlZE9iamVjdChwb2ludHMpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIExpZ2h0ZWRPYmplY3QpO1xuXG4gICAgICAgIHRoaXMucG9pbnRzID0gcG9pbnRzO1xuICAgIH1cblxuICAgIF9jcmVhdGVDbGFzcyhMaWdodGVkT2JqZWN0LCBbe1xuICAgICAgICBrZXk6ICdnZXRBcnJheScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRBcnJheShzY2FsZUZhY3Rvcikge1xuICAgICAgICAgICAgdmFyIF90aGlzNCA9IHRoaXM7XG5cbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgICAgICAgICAgdmFyIHBvaW50cyA9IHRoaXMucG9pbnRzO1xuXG4gICAgICAgICAgICBpZiAocG9pbnRzLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgICAgICBwb2ludHMgPSBwb2ludHMuY29uY2F0KFtwb2ludHNbMF1dKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcG9pbnRzLmZvckVhY2goZnVuY3Rpb24gKHBvaW50LCBpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmICghaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIFtfdGhpczQucG9pbnRzW2luZGV4IC0gMV0ueCwgLy8gLyBzY2FsZUZhY3Rvci54LFxuICAgICAgICAgICAgICAgIF90aGlzNC5wb2ludHNbaW5kZXggLSAxXS55LCAvLyAvIHNjYWxlRmFjdG9yLnksXG4gICAgICAgICAgICAgICAgcG9pbnQueCwgLy8gLyBzY2FsZUZhY3Rvci54LFxuICAgICAgICAgICAgICAgIHBvaW50LnldKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdnZXRGYWNlc0NvdW50JyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldEZhY2VzQ291bnQoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wb2ludHMubGVuZ3RoIDwgMykge1xuICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wb2ludHMubGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIExpZ2h0ZWRPYmplY3Q7XG59KCk7XG5cbmlmICh3aW5kb3cpIHtcbiAgICB3aW5kb3cuTGlnaHRTeXN0ZW0gPSBMaWdodFN5c3RlbTtcbiAgICB3aW5kb3cuTGlnaHRTb3VyY2UgPSBMaWdodFNvdXJjZTtcbiAgICB3aW5kb3cuTGlnaHRlZE9iamVjdCA9IExpZ2h0ZWRPYmplY3Q7XG59Il19
