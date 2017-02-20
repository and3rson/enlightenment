(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = "#define RADIUS 2.0\n#define STEP 1.0\n\nprecision mediump float;\nvarying vec2 vTextureCoord;\nuniform sampler2D uSampler;\nuniform vec2 sizePx;\n\nvoid main() {\n    vec4 color = vec4(0);\n\n    vec2 pixelSize = vec2(1.0) / sizePx.xy * 4.0;\n\n    float factorTotal = 0.0;\n\n    for (float x = -RADIUS; x <= RADIUS; x += 1.0) {\n        for (float y = -RADIUS; y <= RADIUS; y += 1.0) {\n            float factor = (RADIUS - abs(x) + 1.0) * (RADIUS - abs(y) + 1.0);\n            factorTotal += factor;\n            color += texture2D(uSampler, vTextureCoord - vec2(pixelSize.x * x * STEP, pixelSize.y * y * STEP)) * factor;\n        }\n    }\n\n    // gl_FragColor = color / pow(RADIUS * 2.0 + 1.0, 2.0);\n    gl_FragColor = color / factorTotal;\n}\n";

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
        this.lightImage.filters = [this.lightFilter];

        this.renderedImage.filters = [this.blurFilter];

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

window.LightSystem = LightSystem;
window.LightSource = LightSource;
window.LightedObject = LightedObject;
},{"./blur.frag":1,"./light.frag":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYmx1ci5mcmFnIiwic3JjL2xpZ2h0LmZyYWciLCJzcmMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IFwiI2RlZmluZSBSQURJVVMgMi4wXFxuI2RlZmluZSBTVEVQIDEuMFxcblxcbnByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O1xcbnZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1xcbnVuaWZvcm0gc2FtcGxlcjJEIHVTYW1wbGVyO1xcbnVuaWZvcm0gdmVjMiBzaXplUHg7XFxuXFxudm9pZCBtYWluKCkge1xcbiAgICB2ZWM0IGNvbG9yID0gdmVjNCgwKTtcXG5cXG4gICAgdmVjMiBwaXhlbFNpemUgPSB2ZWMyKDEuMCkgLyBzaXplUHgueHkgKiA0LjA7XFxuXFxuICAgIGZsb2F0IGZhY3RvclRvdGFsID0gMC4wO1xcblxcbiAgICBmb3IgKGZsb2F0IHggPSAtUkFESVVTOyB4IDw9IFJBRElVUzsgeCArPSAxLjApIHtcXG4gICAgICAgIGZvciAoZmxvYXQgeSA9IC1SQURJVVM7IHkgPD0gUkFESVVTOyB5ICs9IDEuMCkge1xcbiAgICAgICAgICAgIGZsb2F0IGZhY3RvciA9IChSQURJVVMgLSBhYnMoeCkgKyAxLjApICogKFJBRElVUyAtIGFicyh5KSArIDEuMCk7XFxuICAgICAgICAgICAgZmFjdG9yVG90YWwgKz0gZmFjdG9yO1xcbiAgICAgICAgICAgIGNvbG9yICs9IHRleHR1cmUyRCh1U2FtcGxlciwgdlRleHR1cmVDb29yZCAtIHZlYzIocGl4ZWxTaXplLnggKiB4ICogU1RFUCwgcGl4ZWxTaXplLnkgKiB5ICogU1RFUCkpICogZmFjdG9yO1xcbiAgICAgICAgfVxcbiAgICB9XFxuXFxuICAgIC8vIGdsX0ZyYWdDb2xvciA9IGNvbG9yIC8gcG93KFJBRElVUyAqIDIuMCArIDEuMCwgMi4wKTtcXG4gICAgZ2xfRnJhZ0NvbG9yID0gY29sb3IgLyBmYWN0b3JUb3RhbDtcXG59XFxuXCI7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFwicHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XFxuXFxuI2RlZmluZSBNX1BJIDMuMTQxNTkyNjUzNTg5NzkzMjM4NDYyNjQzMzgzMjc5NVxcblxcbnZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1xcbnVuaWZvcm0gdmVjMiBzaXplUHg7XFxuXFxudW5pZm9ybSB2ZWM0IHNvdXJjZXNbMTAyNF07XFxudW5pZm9ybSBpbnQgc291cmNlc0NvdW50O1xcbnVuaWZvcm0gdmVjMiBtb3VzZTtcXG5cXG51bmlmb3JtIHZlYzQgZmFjZXNbMTAyNF07XFxudW5pZm9ybSBpbnQgZmFjZXNDb3VudDtcXG5cXG51bmlmb3JtIHZlYzIgY2FtZXJhUG9zO1xcbnVuaWZvcm0gdmVjMiBzY2FsZUZhY3RvcjtcXG5cXG51bmlmb3JtIGJvb2wgZGVidWc7XFxuXFxuYm9vbCBjY3coaW4gdmVjMiBhLCBpbiB2ZWMyIGIsIGluIHZlYzIgYykge1xcbiAgICAvLyBDaGVja3MgaWYgdGhyZWUgdmVjdG9ycyBhcmUgcGxhY2VkIGluIGEgQ0NXIG9yZGVyXFxuICAgIHJldHVybiAoYy55IC0gYS55KSAqIChiLnggLSBhLngpID4gKGIueSAtIGEueSkgKiAoYy54IC0gYS54KTtcXG59XFxuXFxuYm9vbCBpbnRlcnNlY3RzKGluIHZlYzIgYSwgaW4gdmVjMiBiLCBpbiB2ZWMyIGMsIGluIHZlYzIgZCkge1xcbiAgICAvLyBGYXN0IGludGVyc2VjdGlvbiBjaGVjayBiYXNlZCBvbiB2ZXJ0ZXggb3JkZXJcXG4gICAgcmV0dXJuIGNjdyhhLCBjLCBkKSAhPSBjY3coYiwgYywgZCkgJiYgY2N3KGEsIGIsIGMpICE9IGNjdyhhLCBiLCBkKTtcXG59XFxuXFxudmVjMiBmbGlwKGluIHZlYzIgdikge1xcbiAgICByZXR1cm4gdmVjMih2LngsIDEuMCAtIHYueSk7XFxufVxcblxcbnZlYzIgYXBwbHlDYW1lcmFUcmFuc2Zvcm1hdGlvbihpbiB2ZWMyIHBvaW50KSB7XFxuICAgIHJldHVybiBwb2ludCAtIGNhbWVyYVBvcztcXG59XFxuXFxuZmxvYXQgYW5nbGVCZXR3ZWVuKGluIGZsb2F0IHN0YXJ0LCBpbiBmbG9hdCBlbmQpXFxue1xcbiAgICByZXR1cm4gbW9kKGVuZCAtIHN0YXJ0LCBNX1BJICogMi4wKTtcXG59XFxuXFxuYm9vbCBpc0JldHdlZW4oaW4gZmxvYXQgc3RhcnRBbmdsZSwgaW4gZmxvYXQgZW5kQW5nbGUsIGluIGZsb2F0IHRlc3RBbmdsZSkge1xcbiAgICBmbG9hdCBhMSA9IGFicyhhbmdsZUJldHdlZW4oc3RhcnRBbmdsZSwgdGVzdEFuZ2xlKSk7XFxuICAgIGZsb2F0IGEyID0gYWJzKGFuZ2xlQmV0d2Vlbih0ZXN0QW5nbGUsIGVuZEFuZ2xlKSk7XFxuICAgIGZsb2F0IGEzID0gYWJzKGFuZ2xlQmV0d2VlbihzdGFydEFuZ2xlLCBlbmRBbmdsZSkpO1xcbiAgICByZXR1cm4gKGExICsgYTIpIC0gYTMgPCAxLjA7XFxufVxcblxcbnZvaWQgbWFpbigpIHtcXG4gICAgLy8gcGl4ZWwgc2l6ZSBpbiB1bml0c1xcblxcbiAgICB2ZWMyIHBpeGVsU2l6ZSA9IHZlYzIoMS4wKSAvIHNpemVQeC54eTtcXG5cXG4gICAgLy8gdmVjMiBtb3VzZVBvcyA9IG1vdXNlICogcGl4ZWxTaXplO1xcblxcbiAgICAvLyBDdXJyZW50IHBvc2l0aW9uIGluIHBpeGVsc1xcbiAgICB2ZWMyIHBpeGVsQ29vcmQgPSBmbGlwKHZUZXh0dXJlQ29vcmQpIC8gcGl4ZWxTaXplO1xcblxcbiAgICAvLyBDb3VudCAmIHRvdGFsIGludGVuc2l0eSBvZiBsaWdodCBzb3VyY2VzIHRoYXQgYWZmZWN0IHRoaXMgcG9pbnRcXG4gICAgdmVjNCBsaWdodFZhbHVlID0gdmVjNCgwLjApO1xcbiAgICBmbG9hdCBsaWdodENvdW50ID0gMC4wO1xcblxcbiAgICAvLyBzb3VyY2VzWzBdID0gbW91c2U7XFxuXFxuICAgIGZvciAoaW50IHNvdXJjZUluZGV4ID0gMDsgc291cmNlSW5kZXggPCAxMDI0OyBzb3VyY2VJbmRleCArPSAzKSB7XFxuICAgICAgICAvLyBMb29wIHRocm91Z2ggbGlnaHQgc291cmNlc1xcbiAgICAgICAgaWYgKHNvdXJjZUluZGV4ID49IHNvdXJjZXNDb3VudCAqIDMpIHtcXG4gICAgICAgICAgICBicmVhaztcXG4gICAgICAgIH1cXG5cXG4gICAgICAgIGZvciAoZmxvYXQgZHggPSAwLjA7IGR4IDwgMS4wOyBkeCArPSAxLjApIHtcXG4gICAgICAgICAgICBmb3IgKGZsb2F0IGR5ID0gMC4wOyBkeSA8IDEuMDsgZHkgKz0gMS4wKSB7XFxuICAgICAgICAgICAgICAgIHZlYzQgc291cmNlID0gdmVjNChzb3VyY2VzW3NvdXJjZUluZGV4XS54eSArIHZlYzIoZHgsIGR5KSAqIDguMCwgc291cmNlc1tzb3VyY2VJbmRleF0uencpO1xcbiAgICAgICAgICAgICAgICB2ZWM0IHNvdXJjZUNvbG9yID0gc291cmNlc1tzb3VyY2VJbmRleCArIDFdO1xcbiAgICAgICAgICAgICAgICB2ZWMyIHNvdXJjZUFuZ2xlID0gc291cmNlc1tzb3VyY2VJbmRleCArIDJdLnh5O1xcblxcbiAgICAgICAgICAgICAgICAvLyBEaXN0YW5jZSBmcm9tIGN1cnJlbnQgbGlnaHQgc291cmNlIHRvIGN1cnJlbnQgcG9pbnRcXG4gICAgICAgICAgICAgICAgZmxvYXQgZGlzdGFuY2VGcm9tU291cmNlID0gZGlzdGFuY2UoYXBwbHlDYW1lcmFUcmFuc2Zvcm1hdGlvbihzb3VyY2UueHkpLCBwaXhlbENvb3JkKTtcXG4gICAgICAgICAgICAgICAgdmVjMiBvZmZzZXQgPSBwaXhlbENvb3JkIC0gYXBwbHlDYW1lcmFUcmFuc2Zvcm1hdGlvbihzb3VyY2UueHkpO1xcbiAgICAgICAgICAgICAgICBmbG9hdCBhbmdsZUZyb21Tb3VyY2UgPSBhdGFuKG9mZnNldC55LCBvZmZzZXQueCk7XFxuXFxuICAgICAgICAgICAgICAgIGlmIChkZWJ1Zykge1xcbiAgICAgICAgICAgICAgICAgICAgLy8gRHJhdyBsaWdodCBwb3NpdGlvbiAmIHJhZGl1c1xcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpc3RhbmNlRnJvbVNvdXJjZSA8IDUuMCkge1xcbiAgICAgICAgICAgICAgICAgICAgICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoc291cmNlQ29sb3IueHl6LCAwLjEpO1xcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcXG4gICAgICAgICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAgICAgICAgIGlmIChhYnMoZGlzdGFuY2VGcm9tU291cmNlIC0gc291cmNlLnopIDwgNS4wKSB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChzb3VyY2VBbmdsZS54ID09IHNvdXJjZUFuZ2xlLnkpIHx8IGlzQmV0d2Vlbihzb3VyY2VBbmdsZS54LCBzb3VyY2VBbmdsZS55LCBhbmdsZUZyb21Tb3VyY2UpKSB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoc291cmNlQ29sb3IueCwgc291cmNlQ29sb3IueSwgc291cmNlQ29sb3IueiwgMC4xKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIChzb3VyY2VBbmdsZS54ICE9IHNvdXJjZUFuZ2xlLnkpIHtcXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoYW5nbGVGcm9tU291cmNlIC0gKG9mZnNldC54ICsgb2Zmc2V0LnkpIC8gMi4wIDwgMi4wKSB7XFxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoMC4wLCAxLjAsIDAuMCwgMS4wKTtcXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICB9XFxuICAgICAgICAgICAgICAgICAgICAvLyB9XFxuICAgICAgICAgICAgICAgIH1cXG5cXG4gICAgICAgICAgICAgICAgaWYgKGRpc3RhbmNlRnJvbVNvdXJjZSA+IHNvdXJjZS56KSB7XFxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcXG4gICAgICAgICAgICAgICAgfVxcblxcbiAgICAgICAgICAgICAgICBpZiAoKHNvdXJjZUFuZ2xlLnggIT0gc291cmNlQW5nbGUueSkgJiYgIWlzQmV0d2Vlbihzb3VyY2VBbmdsZS54LCBzb3VyY2VBbmdsZS55LCBhbmdsZUZyb21Tb3VyY2UpKSB7XFxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcXG4gICAgICAgICAgICAgICAgfVxcblxcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBzZWdtZW50IGJldHdlZW4gdGhpcyBwb2ludCBhbmQgY3VycmVudCBsaWdodCBzb3VyY2VcXG4gICAgICAgICAgICAgICAgLy8gaXMgYmxvY2tlZCBieSBhbnkgZmFjZVxcbiAgICAgICAgICAgICAgICBib29sIGlzU291cmNlQmxvY2tlZCA9IGZhbHNlO1xcbiAgICAgICAgICAgICAgICBmb3IgKGludCBmYWNlSW5kZXggPSAwOyBmYWNlSW5kZXggPCAxMDI0OyBmYWNlSW5kZXgrKykge1xcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZhY2VJbmRleCA+PSBmYWNlc0NvdW50KSB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XFxuICAgICAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgICAgICAgICBpZiAoZGVidWcpIHtcXG4gICAgICAgICAgICAgICAgICAgICAgICB2ZWMyIGEgPSBhcHBseUNhbWVyYVRyYW5zZm9ybWF0aW9uKGZhY2VzW2ZhY2VJbmRleF0ueHkpO1xcbiAgICAgICAgICAgICAgICAgICAgICAgIHZlYzIgYiA9IGFwcGx5Q2FtZXJhVHJhbnNmb3JtYXRpb24oZmFjZXNbZmFjZUluZGV4XS56dyk7XFxuXFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFicygoZGlzdGFuY2UoYSwgcGl4ZWxDb29yZCkgKyBkaXN0YW5jZShiLCBwaXhlbENvb3JkKSkgLSBkaXN0YW5jZShhLCBiKSkgPD0gMS4wKSB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoMC4wLCAxLjAsIDEuMCwgMS4wKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnRlcnNlY3RzKGFwcGx5Q2FtZXJhVHJhbnNmb3JtYXRpb24oc291cmNlLnh5KSwgcGl4ZWxDb29yZCwgYXBwbHlDYW1lcmFUcmFuc2Zvcm1hdGlvbihmYWNlc1tmYWNlSW5kZXhdLnh5KSwgYXBwbHlDYW1lcmFUcmFuc2Zvcm1hdGlvbihmYWNlc1tmYWNlSW5kZXhdLnp3KSkpIHtcXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGxpZ2h0IGlzIGJsb2NrZWQgYnkgb25lIG9mIHRoZSBmYWNlcy5cXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBkb24ndCBjb3VudCBpdC5cXG4gICAgICAgICAgICAgICAgICAgICAgICBpc1NvdXJjZUJsb2NrZWQgPSB0cnVlO1xcbiAgICAgICAgICAgICAgICAgICAgfVxcbiAgICAgICAgICAgICAgICB9XFxuXFxuICAgICAgICAgICAgICAgIGlmICghaXNTb3VyY2VCbG9ja2VkKSB7XFxuICAgICAgICAgICAgICAgICAgICAvLyBDdXJyZW50IGxpZ2h0IHNvdXJjZSBhZmZlY3RlZCB0aGlzIHBvaW50LCBsZXQncyBpbmNyZWFzZVxcbiAgICAgICAgICAgICAgICAgICAgLy8gbGlnaHRWYWx1ZSAmIGxpZ2h0Q291bnQgZm9yIHRoaXMgcG9pbnRcXG4gICAgICAgICAgICAgICAgICAgIC8vIGJhc2VkIG9uIHRoZSBkaXN0YW5jZSBmcm9tIGxpZ2h0IHNvdXJjZS5cXG4gICAgICAgICAgICAgICAgICAgIC8vIChUaGUgY2xvc2VyIHRvIHRoZSBsaWdodCBzb3VyY2UsIHRoZSBoaWdoZXIgdGhlIHZhbHVlKVxcbiAgICAgICAgICAgICAgICAgICAgZmxvYXQgcmFkaXVzID0gc291cmNlLno7XFxuICAgICAgICAgICAgICAgICAgICBmbG9hdCBpbnRlbnNpdHkgPSBzb3VyY2UudztcXG4gICAgICAgICAgICAgICAgICAgIGZsb2F0IHZhbCA9IG1heChyYWRpdXMgLSBkaXN0YW5jZUZyb21Tb3VyY2UsIDAuMCkgLyByYWRpdXMgKiBpbnRlbnNpdHk7XFxuICAgICAgICAgICAgICAgICAgICBsaWdodFZhbHVlICs9IHZhbCAqIHNvdXJjZUNvbG9yO1xcbiAgICAgICAgICAgICAgICAgICAgbGlnaHRDb3VudCArPSAxLjA7XFxuICAgICAgICAgICAgICAgICAgICAvLyB2YWwgPSBtYXgocmFkaXVzIC0gZGlzdGFuY2VGcm9tU291cmNlLCAwLjApIC8gcmFkaXVzO1xcbiAgICAgICAgICAgICAgICAgICAgLy8gZ2xfRnJhZ0NvbG9yID0gdmVjNCh2YWwsIHZhbCwgdmFsLCB2YWwpO1xcbiAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuO1xcbiAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgfVxcbiAgICB9XFxuXFxuICAgIC8vIGxpZ2h0VmFsdWUgLz0gNC4wO1xcblxcbiAgICAvLyBMZXQncyBjYXAgbWF4aW11bSBsaWdodFZhbHVlIHRvIDAuNSB0byBwcmV2ZW50IHRvbyBtdWNoIGxpZ2h0bmVzc1xcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KG1pbihsaWdodFZhbHVlLngsIDAuNzUpLCBtaW4obGlnaHRWYWx1ZS55LCAwLjc1KSwgbWluKGxpZ2h0VmFsdWUueiwgMC43NSksIG1pbihsaWdodFZhbHVlLncsIDAuNzUpKTtcXG5cXG4gICAgLy8gZ2xfRnJhZ0NvbG9yID0gbGlnaHRWYWx1ZTtcXG59XFxuXCI7XG4iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIGxpZ2h0RnJhZ1NvdXJjZSA9IHJlcXVpcmUoJy4vbGlnaHQuZnJhZycpO1xudmFyIGJsdXJGcmFnU291cmNlID0gcmVxdWlyZSgnLi9ibHVyLmZyYWcnKTtcblxudmFyIExpZ2h0U3lzdGVtID0gZXhwb3J0cy5MaWdodFN5c3RlbSA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMaWdodFN5c3RlbSh3LCBoLCBkZWJ1Zykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBMaWdodFN5c3RlbSk7XG5cbiAgICAgICAgLy8gdGhpcy5zcHJpdGUgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCk7XG4gICAgICAgIC8vIHRoaXMudyA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgICAgICAvLyB0aGlzLmggPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICAgIC8vIHZhciBzY2FsZSA9IDQ7XG4gICAgICAgIC8vIHRoaXMudyA9IHdpbmRvdy5pbm5lcldpZHRoIC8gc2NhbGU7XG4gICAgICAgIC8vIHRoaXMuaCA9IHdpbmRvdy5pbm5lckhlaWdodCAvIHNjYWxlO1xuICAgICAgICB0aGlzLncgPSB3IHx8IDI1NjtcbiAgICAgICAgdGhpcy5oID0gaCB8fCAyNTY7XG4gICAgICAgIC8vIFRPRE86IE1ha2UgaW1hZ2UgaW52aXNpYmxlICpwcm9wZXJseSpcbiAgICAgICAgLy8gdGhpcy5pbWFnZSA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwKTtcbiAgICAgICAgLy8gdGhpcy5pbWFnZSA9IG5ldyBQaGFzZXIuR3JhcGhpY3MoZ2FtZSwgMCwgMCk7XG4gICAgICAgIHRoaXMubGlnaHRUZXh0dXJlID0gZ2FtZS5hZGQucmVuZGVyVGV4dHVyZSh0aGlzLncsIHRoaXMuaCwgJ2xpZ2h0VGV4dHVyZScpO1xuICAgICAgICB0aGlzLmxpZ2h0SW1hZ2UgPSBnYW1lLmFkZC5pbWFnZSgxMDQ4NTc2LCAxMDQ4NTc2KTtcbiAgICAgICAgdGhpcy5saWdodEltYWdlLndpZHRoID0gdGhpcy53O1xuICAgICAgICB0aGlzLmxpZ2h0SW1hZ2UuaGVpZ2h0ID0gdGhpcy5oO1xuXG4gICAgICAgIC8vIHRoaXMubGlnaHRJbWFnZS5ibGVuZE1vZGUgPSAxO1xuXG4gICAgICAgIC8vIHRoaXMubGlnaHRJbWFnZS5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5saWdodEltYWdlLnNtb290aGVkID0gdHJ1ZTtcbiAgICAgICAgLy8gdGhpcy5saWdodEltYWdlLnJlbmRlcmFibGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zY2FsZUZhY3RvciA9IG5ldyBQaGFzZXIuUG9pbnQod2luZG93LmlubmVyV2lkdGggLyB0aGlzLncsIHdpbmRvdy5pbm5lckhlaWdodCAvIHRoaXMuaCk7XG5cbiAgICAgICAgdGhpcy5yZW5kZXJlZEltYWdlID0gZ2FtZS5hZGQuaW1hZ2UoMCwgd2luZG93LmlubmVySGVpZ2h0LCB0aGlzLmxpZ2h0VGV4dHVyZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZWRJbWFnZS53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgICAgICB0aGlzLnJlbmRlcmVkSW1hZ2UuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgICB0aGlzLnJlbmRlcmVkSW1hZ2UuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG4gICAgICAgIHRoaXMucmVuZGVyZWRJbWFnZS5zY2FsZS55ICo9IC0xO1xuICAgICAgICB0aGlzLnJlbmRlcmVkSW1hZ2Uuc21vb3RoZWQgPSB0cnVlO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnSW5pdGlhbCBsaWdodCBzcHJpdGUgc2NhbGU6JywgdGhpcy5zcHJpdGUuc2NhbGUueCwgdGhpcy5zcHJpdGUuc2NhbGUueSk7XG4gICAgICAgIC8vIHRoaXMuc3ByaXRlLnNjYWxlLnggKj0gdGhpcy5zY2FsZUZhY3Rvci54O1xuICAgICAgICAvLyB0aGlzLnNwcml0ZS5zY2FsZS55ICo9IHRoaXMuc2NhbGVGYWN0b3IueTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ0NyZWF0aW5nIGxpZ2h0IHNwcml0ZSwgc2l6ZScsIHRoaXMudywgdGhpcy5oLCAnc2NhbGUnLCB0aGlzLnNjYWxlRmFjdG9yLngsIHRoaXMuc2NhbGVGYWN0b3IueSk7XG4gICAgICAgIC8vIHRoaXMuc3ByaXRlLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgIC8vIHRoaXMuc3ByaXRlLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcblxuICAgICAgICB0aGlzLmxpZ2h0RmlsdGVyVW5pZm9ybXMgPSB7XG4gICAgICAgICAgICBzaXplUHg6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnMmZ2JyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbmV3IEZsb2F0MzJBcnJheShbd2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodF0pXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2NhbGVGYWN0b3I6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnMmZ2JyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbmV3IEZsb2F0MzJBcnJheShbdGhpcy5zY2FsZUZhY3Rvci54LCB0aGlzLnNjYWxlRmFjdG9yLnldKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNvdXJjZXM6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnNGZ2JyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbmV3IEZsb2F0MzJBcnJheShbXSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzb3VyY2VzQ291bnQ6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnMWknLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmFjZXM6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnNGZ2JyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbmV3IEZsb2F0MzJBcnJheShbXSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmYWNlc0NvdW50OiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJzFpJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhbWVyYVBvczoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICcyZnYnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBuZXcgRmxvYXQzMkFycmF5KFswLCAwXSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZWJ1Zzoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICcxaScsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICEhZGVidWdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmJsdXJGaWx0ZXJVbmlmb3JtcyA9IHtcbiAgICAgICAgICAgIHNpemVQeDoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICcyZnYnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBuZXcgRmxvYXQzMkFycmF5KFt3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0XSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxpZ2h0RmlsdGVyID0gbmV3IFBoYXNlci5GaWx0ZXIoZ2FtZSwgdGhpcy5saWdodEZpbHRlclVuaWZvcm1zLCBsaWdodEZyYWdTb3VyY2UpO1xuICAgICAgICB0aGlzLmxpZ2h0RmlsdGVyLnNldFJlc29sdXRpb24odGhpcy53LCB0aGlzLmgpO1xuICAgICAgICB0aGlzLmJsdXJGaWx0ZXIgPSBuZXcgUGhhc2VyLkZpbHRlcihnYW1lLCB0aGlzLmJsdXJGaWx0ZXJVbmlmb3JtcywgYmx1ckZyYWdTb3VyY2UpO1xuICAgICAgICB0aGlzLmxpZ2h0SW1hZ2UuZmlsdGVycyA9IFt0aGlzLmxpZ2h0RmlsdGVyXTtcblxuICAgICAgICB0aGlzLnJlbmRlcmVkSW1hZ2UuZmlsdGVycyA9IFt0aGlzLmJsdXJGaWx0ZXJdO1xuXG4gICAgICAgIHRoaXMubGlnaHRTb3VyY2VzID0gW107XG4gICAgICAgIHRoaXMub2JqZWN0cyA9IFtdO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKCdMaWdodCBzaGFkZXIgaW5mbzonKTtcblxuICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy5wcmludEZpbHRlckluZm8oX3RoaXMubGlnaHRGaWx0ZXIpO1xuICAgICAgICB9LCAwKTtcbiAgICB9XG5cbiAgICBfY3JlYXRlQ2xhc3MoTGlnaHRTeXN0ZW0sIFt7XG4gICAgICAgIGtleTogJ2dldFByb2dyYW1JbmZvJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldFByb2dyYW1JbmZvKGdsLCBwcm9ncmFtKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0ge1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IFtdLFxuICAgICAgICAgICAgICAgIHVuaWZvcm1zOiBbXSxcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVDb3VudDogMCxcbiAgICAgICAgICAgICAgICB1bmlmb3JtQ291bnQ6IDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYWN0aXZlVW5pZm9ybXMgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkFDVElWRV9VTklGT1JNUyksXG4gICAgICAgICAgICAgICAgYWN0aXZlQXR0cmlidXRlcyA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuQUNUSVZFX0FUVFJJQlVURVMpO1xuXG4gICAgICAgICAgICAvLyBUYWtlbiBmcm9tIHRoZSBXZWJHbCBzcGVjOlxuICAgICAgICAgICAgLy8gaHR0cDovL3d3dy5raHJvbm9zLm9yZy9yZWdpc3RyeS93ZWJnbC9zcGVjcy9sYXRlc3QvMS4wLyM1LjE0XG4gICAgICAgICAgICB2YXIgZW51bXMgPSB7XG4gICAgICAgICAgICAgICAgMHg4QjUwOiAnRkxPQVRfVkVDMicsXG4gICAgICAgICAgICAgICAgMHg4QjUxOiAnRkxPQVRfVkVDMycsXG4gICAgICAgICAgICAgICAgMHg4QjUyOiAnRkxPQVRfVkVDNCcsXG4gICAgICAgICAgICAgICAgMHg4QjUzOiAnSU5UX1ZFQzInLFxuICAgICAgICAgICAgICAgIDB4OEI1NDogJ0lOVF9WRUMzJyxcbiAgICAgICAgICAgICAgICAweDhCNTU6ICdJTlRfVkVDNCcsXG4gICAgICAgICAgICAgICAgMHg4QjU2OiAnQk9PTCcsXG4gICAgICAgICAgICAgICAgMHg4QjU3OiAnQk9PTF9WRUMyJyxcbiAgICAgICAgICAgICAgICAweDhCNTg6ICdCT09MX1ZFQzMnLFxuICAgICAgICAgICAgICAgIDB4OEI1OTogJ0JPT0xfVkVDNCcsXG4gICAgICAgICAgICAgICAgMHg4QjVBOiAnRkxPQVRfTUFUMicsXG4gICAgICAgICAgICAgICAgMHg4QjVCOiAnRkxPQVRfTUFUMycsXG4gICAgICAgICAgICAgICAgMHg4QjVDOiAnRkxPQVRfTUFUNCcsXG4gICAgICAgICAgICAgICAgMHg4QjVFOiAnU0FNUExFUl8yRCcsXG4gICAgICAgICAgICAgICAgMHg4QjYwOiAnU0FNUExFUl9DVUJFJyxcbiAgICAgICAgICAgICAgICAweDE0MDA6ICdCWVRFJyxcbiAgICAgICAgICAgICAgICAweDE0MDE6ICdVTlNJR05FRF9CWVRFJyxcbiAgICAgICAgICAgICAgICAweDE0MDI6ICdTSE9SVCcsXG4gICAgICAgICAgICAgICAgMHgxNDAzOiAnVU5TSUdORURfU0hPUlQnLFxuICAgICAgICAgICAgICAgIDB4MTQwNDogJ0lOVCcsXG4gICAgICAgICAgICAgICAgMHgxNDA1OiAnVU5TSUdORURfSU5UJyxcbiAgICAgICAgICAgICAgICAweDE0MDY6ICdGTE9BVCdcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIExvb3AgdGhyb3VnaCBhY3RpdmUgdW5pZm9ybXNcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0aXZlVW5pZm9ybXM7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciB1bmlmb3JtID0gZ2wuZ2V0QWN0aXZlVW5pZm9ybShwcm9ncmFtLCBpKTtcbiAgICAgICAgICAgICAgICB1bmlmb3JtLnR5cGVOYW1lID0gZW51bXNbdW5pZm9ybS50eXBlXTtcbiAgICAgICAgICAgICAgICByZXN1bHQudW5pZm9ybXMucHVzaCh1bmlmb3JtKTtcbiAgICAgICAgICAgICAgICByZXN1bHQudW5pZm9ybUNvdW50ICs9IHVuaWZvcm0uc2l6ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTG9vcCB0aHJvdWdoIGFjdGl2ZSBhdHRyaWJ1dGVzXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdGl2ZUF0dHJpYnV0ZXM7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBhdHRyaWJ1dGUgPSBnbC5nZXRBY3RpdmVBdHRyaWIocHJvZ3JhbSwgaSk7XG4gICAgICAgICAgICAgICAgYXR0cmlidXRlLnR5cGVOYW1lID0gZW51bXNbYXR0cmlidXRlLnR5cGVdO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5hdHRyaWJ1dGVzLnB1c2goYXR0cmlidXRlKTtcbiAgICAgICAgICAgICAgICByZXN1bHQuYXR0cmlidXRlQ291bnQgKz0gYXR0cmlidXRlLnNpemU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3ByaW50RmlsdGVySW5mbycsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBwcmludEZpbHRlckluZm8oZmlsdGVyKSB7XG4gICAgICAgICAgICB2YXIgc2hhZGVyID0gZmlsdGVyLnNoYWRlcnNbMF07XG4gICAgICAgICAgICB2YXIgcHJvZ3JhbUluZm8gPSB0aGlzLmdldFByb2dyYW1JbmZvKHNoYWRlci5nbCwgc2hhZGVyLnByb2dyYW0pO1xuICAgICAgICAgICAgY29uc29sZS50YWJsZShwcm9ncmFtSW5mby5hdHRyaWJ1dGVzKTtcbiAgICAgICAgICAgIGNvbnNvbGUudGFibGUocHJvZ3JhbUluZm8udW5pZm9ybXMpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdhZGRMaWdodFNvdXJjZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBhZGRMaWdodFNvdXJjZShsaWdodFNvdXJjZSkge1xuICAgICAgICAgICAgdGhpcy5saWdodFNvdXJjZXMucHVzaChsaWdodFNvdXJjZSk7XG4gICAgICAgICAgICAvLyB0aGlzLl91cGRhdGVMaWdodFNvdXJjZXNVbmlmb3JtcygpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdyZW1vdmVMaWdodFNvdXJjZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZW1vdmVMaWdodFNvdXJjZShsaWdodFNvdXJjZSkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5saWdodFNvdXJjZXMuaW5kZXhPZihsaWdodFNvdXJjZSk7XG4gICAgICAgICAgICB0aGlzLmxpZ2h0U291cmNlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgLy8gdGhpcy5fdXBkYXRlTGlnaHRTb3VyY2VzVW5pZm9ybXMoKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAnYWRkT2JqZWN0JyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGFkZE9iamVjdChvYmopIHtcbiAgICAgICAgICAgIHRoaXMub2JqZWN0cy5wdXNoKG9iaik7XG4gICAgICAgICAgICAvLyB0aGlzLl91cGRhdGVGYWNlc1VuaWZvcm1zKCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3JlbW92ZU9iamVjdCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZW1vdmVPYmplY3Qob2JqKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLm9iamVjdHMuaW5kZXhPZihvYmopO1xuICAgICAgICAgICAgdGhpcy5vYmplY3RzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAvLyB0aGlzLl91cGRhdGVGYWNlc1VuaWZvcm1zKCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3JlbW92ZUFsbCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZW1vdmVBbGwoKSB7XG4gICAgICAgICAgICB0aGlzLmxpZ2h0U291cmNlcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5vYmplY3RzID0gW107XG4gICAgICAgICAgICAvLyB0aGlzLl91cGRhdGVMaWdodFNvdXJjZXNVbmlmb3JtcygpO1xuICAgICAgICAgICAgLy8gdGhpcy5fdXBkYXRlRmFjZXNVbmlmb3JtcygpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICd1cGRhdGVMaWdodFNvdXJjZXNVbmlmb3JtcycsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB1cGRhdGVMaWdodFNvdXJjZXNVbmlmb3JtcygpIHtcbiAgICAgICAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gICAgICAgICAgICB0aGlzLmxpZ2h0RmlsdGVyVW5pZm9ybXMuc291cmNlcy52YWx1ZSA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5saWdodFNvdXJjZXMucmVkdWNlKGZ1bmN0aW9uIChyLCB4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHIuY29uY2F0KHguZ2V0QXJyYXkoX3RoaXMyLnNjYWxlRmFjdG9yKSk7XG4gICAgICAgICAgICB9LCBbXSkpO1xuICAgICAgICAgICAgdGhpcy5saWdodEZpbHRlclVuaWZvcm1zLnNvdXJjZXNDb3VudC52YWx1ZSA9IHRoaXMubGlnaHRTb3VyY2VzLmxlbmd0aDtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdVcGRhdGluZyBsaWdodCBzb3VyY2VzIHVuaWZvcm1zLCBjb3VudCA9JywgdGhpcy5saWdodEZpbHRlci51bmlmb3Jtcy5zb3VyY2VzQ291bnQudmFsdWUpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICd1cGRhdGVGYWNlc1VuaWZvcm1zJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZUZhY2VzVW5pZm9ybXMoKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgICAgICAgdGhpcy5saWdodEZpbHRlclVuaWZvcm1zLmZhY2VzLnZhbHVlID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLm9iamVjdHMucmVkdWNlKGZ1bmN0aW9uIChyLCB4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHIuY29uY2F0KHguZ2V0QXJyYXkoX3RoaXMzLnNjYWxlRmFjdG9yKSk7XG4gICAgICAgICAgICB9LCBbXSkpO1xuICAgICAgICAgICAgdGhpcy5saWdodEZpbHRlclVuaWZvcm1zLmZhY2VzQ291bnQudmFsdWUgPSB0aGlzLmxpZ2h0RmlsdGVyVW5pZm9ybXMuZmFjZXMudmFsdWUubGVuZ3RoIC8gNDtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdVcGRhdGluZyBmYWNlcyB1bmlmb3JtcywgY291bnQgPScsIHRoaXMubGlnaHRGaWx0ZXIudW5pZm9ybXMuZmFjZXNDb3VudC52YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3VwZGF0ZVVuaWZvcm1zJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZVVuaWZvcm1zKCkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVMaWdodFNvdXJjZXNVbmlmb3JtcygpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVGYWNlc1VuaWZvcm1zKCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3VwZGF0ZUNhbWVyYVBvcycsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB1cGRhdGVDYW1lcmFQb3MocG9pbnQpIHtcbiAgICAgICAgICAgIHRoaXMubGlnaHRGaWx0ZXJVbmlmb3Jtcy5jYW1lcmFQb3MudmFsdWUgPSBuZXcgRmxvYXQzMkFycmF5KFtcbiAgICAgICAgICAgIC8vIHBvaW50LnggLyB0aGlzLnNjYWxlRmFjdG9yLngsXG4gICAgICAgICAgICAvLyBwb2ludC55IC8gdGhpcy5zY2FsZUZhY3Rvci55XG4gICAgICAgICAgICBwb2ludC54LCBwb2ludC55XSk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3NldERlYnVnJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHNldERlYnVnKGVuYWJsZSkge1xuICAgICAgICAgICAgdGhpcy5saWdodEZpbHRlclVuaWZvcm1zLmRlYnVnLnZhbHVlID0gISFlbmFibGU7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3VwZGF0ZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB1cGRhdGUoKSB7XG4gICAgICAgICAgICB0aGlzLmxpZ2h0RmlsdGVyLnVwZGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5ibHVyRmlsdGVyLnVwZGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5saWdodFRleHR1cmUucmVuZGVyWFkodGhpcy5saWdodEltYWdlLCAwLCAwLCB0cnVlKTtcbiAgICAgICAgICAgIC8vIHRoaXMuaW1hZ2Uuc2V0VGV4dHVyZSh0aGlzLmltYWdlLmdlbmVyYXRlVGV4dHVyZSgxLCBQSVhJLnNjYWxlTW9kZXMuTElORUFSLCBnYW1lLnJlbmRlcmVyKSk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ2Rlc3Ryb3knLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZGVzdHJveSgpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGBkZXN0cm95YCBvciBgcmVtb3ZlYD9cbiAgICAgICAgICAgIHRoaXMubGlnaHRGaWx0ZXIuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5ibHVyRmlsdGVyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMuaW1hZ2UuZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIExpZ2h0U3lzdGVtO1xufSgpO1xuXG52YXIgTGlnaHRTb3VyY2UgPSBleHBvcnRzLkxpZ2h0U291cmNlID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExpZ2h0U291cmNlKHBvc2l0aW9uLCByYWRpdXMsIGludGVuc2l0eSwgY29sb3IsIGFuZ2xlU3RhcnQsIGFuZ2xlRW5kKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBMaWdodFNvdXJjZSk7XG5cbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgICAgICB0aGlzLnJhZGl1cyA9IHJhZGl1cztcbiAgICAgICAgdGhpcy5pbnRlbnNpdHkgPSBpbnRlbnNpdHk7XG4gICAgICAgIHRoaXMuY29sb3IgPSBjb2xvcjtcbiAgICAgICAgdGhpcy5fYW5nbGVTdGFydCA9IGFuZ2xlU3RhcnQgfHwgMDtcbiAgICAgICAgdGhpcy5fYW5nbGVFbmQgPSBhbmdsZUVuZCB8fCAwO1xuICAgICAgICB0aGlzLnNldFJvdGF0aW9uKDApO1xuICAgIH1cblxuICAgIF9jcmVhdGVDbGFzcyhMaWdodFNvdXJjZSwgW3tcbiAgICAgICAga2V5OiAnZ2V0QXJyYXknLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0QXJyYXkoc2NhbGVGYWN0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy5wb3NpdGlvbi54LCAvLyAvIHNjYWxlRmFjdG9yLngsXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uLnksIC8vIC8gc2NhbGVGYWN0b3IueSxcbiAgICAgICAgICAgIHRoaXMucmFkaXVzLCB0aGlzLmludGVuc2l0eSwgdGhpcy5jb2xvclswXSwgdGhpcy5jb2xvclsxXSwgdGhpcy5jb2xvclsyXSwgdGhpcy5jb2xvclszXSwgdGhpcy5hbmdsZVN0YXJ0LCB0aGlzLmFuZ2xlRW5kLCAwLCAwXTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAnc2V0Um90YXRpb24nLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc2V0Um90YXRpb24ocm90YXRpb24pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9hbmdsZVN0YXJ0ID09IDAgJiYgdGhpcy5fYW5kbGVFbmQgPT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5yb3RhdGlvbiA9IHJvdGF0aW9uO1xuICAgICAgICAgICAgdGhpcy5hbmdsZVN0YXJ0ID0gKHRoaXMuX2FuZ2xlU3RhcnQgKyB0aGlzLnJvdGF0aW9uKSAlIChNYXRoLlBJICogMik7XG4gICAgICAgICAgICB0aGlzLmFuZ2xlRW5kID0gKHRoaXMuX2FuZ2xlRW5kICsgdGhpcy5yb3RhdGlvbikgJSAoTWF0aC5QSSAqIDIpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5hbmdsZVN0YXJ0IDwgMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYW5nbGVTdGFydCArPSBNYXRoLlBJICogMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmFuZ2xlRW5kIDwgMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYW5nbGVFbmQgKz0gTWF0aC5QSSAqIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gTGlnaHRTb3VyY2U7XG59KCk7XG5cbnZhciBMaWdodGVkT2JqZWN0ID0gZXhwb3J0cy5MaWdodGVkT2JqZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExpZ2h0ZWRPYmplY3QocG9pbnRzKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBMaWdodGVkT2JqZWN0KTtcblxuICAgICAgICB0aGlzLnBvaW50cyA9IHBvaW50cztcbiAgICB9XG5cbiAgICBfY3JlYXRlQ2xhc3MoTGlnaHRlZE9iamVjdCwgW3tcbiAgICAgICAga2V5OiAnZ2V0QXJyYXknLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0QXJyYXkoc2NhbGVGYWN0b3IpIHtcbiAgICAgICAgICAgIHZhciBfdGhpczQgPSB0aGlzO1xuXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG5cbiAgICAgICAgICAgIHZhciBwb2ludHMgPSB0aGlzLnBvaW50cztcblxuICAgICAgICAgICAgaWYgKHBvaW50cy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICAgICAgcG9pbnRzID0gcG9pbnRzLmNvbmNhdChbcG9pbnRzWzBdXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBvaW50cy5mb3JFYWNoKGZ1bmN0aW9uIChwb2ludCwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBbX3RoaXM0LnBvaW50c1tpbmRleCAtIDFdLngsIC8vIC8gc2NhbGVGYWN0b3IueCxcbiAgICAgICAgICAgICAgICBfdGhpczQucG9pbnRzW2luZGV4IC0gMV0ueSwgLy8gLyBzY2FsZUZhY3Rvci55LFxuICAgICAgICAgICAgICAgIHBvaW50LngsIC8vIC8gc2NhbGVGYWN0b3IueCxcbiAgICAgICAgICAgICAgICBwb2ludC55XSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAnZ2V0RmFjZXNDb3VudCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRGYWNlc0NvdW50KCkge1xuICAgICAgICAgICAgaWYgKHRoaXMucG9pbnRzLmxlbmd0aCA8IDMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucG9pbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBMaWdodGVkT2JqZWN0O1xufSgpO1xuXG53aW5kb3cuTGlnaHRTeXN0ZW0gPSBMaWdodFN5c3RlbTtcbndpbmRvdy5MaWdodFNvdXJjZSA9IExpZ2h0U291cmNlO1xud2luZG93LkxpZ2h0ZWRPYmplY3QgPSBMaWdodGVkT2JqZWN0OyJdfQ==
