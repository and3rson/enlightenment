(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = "#define RADIUS 2.0\n#define STEP 1.0\n\nprecision mediump float;\nvarying vec2 vTextureCoord;\nuniform sampler2D uSampler;\nuniform vec2 sizePx;\n\nvoid main() {\n    vec4 color = vec4(0);\n\n    vec2 pixelSize = vec2(1.0) / sizePx.xy * 4.0;\n\n    for (float x = -RADIUS; x <= RADIUS; x += 1.0) {\n        for (float y = -RADIUS; y <= RADIUS; y += 1.0) {\n            color += texture2D(uSampler, vTextureCoord - vec2(pixelSize.x * x * STEP, pixelSize.y * y * STEP));\n        }\n    }\n\n    gl_FragColor = color / pow(RADIUS * 2.0 + 1.0, 2.0);\n}\n";

},{}],2:[function(require,module,exports){
module.exports = "precision mediump float;\n\nvarying vec2 vTextureCoord;\nuniform vec2 sizePx;\n\nuniform vec4 sources[16];\nuniform int sourcesCount;\nuniform vec2 mouse;\n\nuniform vec4 faces[16];\nuniform int facesCount;\n\nuniform vec2 cameraPos;\nuniform vec2 scaleFactor;\n\nuniform bool debug;\n\nbool ccw(in vec2 a, in vec2 b, in vec2 c) {\n    // Checks if three vectors are placed in a CCW order\n    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);\n}\n\nbool intersects(in vec2 a, in vec2 b, in vec2 c, in vec2 d) {\n    // Fast intersection check based on vertex order\n    return ccw(a, c, d) != ccw(b, c, d) && ccw(a, b, c) != ccw(a, b, d);\n}\n\nvec2 flip(in vec2 v) {\n    return vec2(v.x, 1.0 - v.y);\n}\n\nvec2 applyCameraTransformation(in vec2 point) {\n    return point - cameraPos;\n}\n\nvoid main() {\n    // pixel size in units\n\n    vec2 pixelSize = vec2(1.0) / sizePx.xy;\n\n    // vec2 mousePos = mouse * pixelSize;\n\n    // Current position in pixels\n    vec2 pixelCoord = flip(vTextureCoord) / pixelSize;\n\n    // Count & total intensity of light sources that affect this point\n    vec4 lightValue = vec4(0.0);\n    float lightCount = 0.0;\n\n    // sources[0] = mouse;\n\n    for (int sourceIndex = 0; sourceIndex < 256; sourceIndex += 2) {\n        // Loop through light sources\n        if (sourceIndex >= sourcesCount * 2) {\n            break;\n        }\n\n        for (float dx = 0.0; dx < 1.0; dx += 1.0) {\n            for (float dy = 0.0; dy < 1.0; dy += 1.0) {\n                vec4 source = vec4(sources[sourceIndex].xy + vec2(dx, dy) * 8.0, sources[sourceIndex].zw);\n                vec4 sourceColor = sources[sourceIndex + 1];\n\n                // Distance from current light source to current point\n                float distanceFromSource = distance(applyCameraTransformation(source.xy), pixelCoord);\n\n                if (debug) {\n                    // Draw light position & radius\n                    if (distanceFromSource < 5.0) {\n                        gl_FragColor = vec4(sourceColor.xyz, 0.1);\n                        return;\n                    }\n                    if (abs(distanceFromSource - source.z) < 5.0) {\n                        gl_FragColor = vec4(sourceColor.x, sourceColor.y, sourceColor.z, 0.1);\n                        return;\n                    }\n                }\n\n                // Check if segment between this point and current light source\n                // is blocked by any face\n                bool isSourceBlocked = false;\n                for (int faceIndex = 0; faceIndex < 256; faceIndex++) {\n                    if (faceIndex >= facesCount) {\n                        break;\n                    }\n                    if (intersects(applyCameraTransformation(source.xy), pixelCoord, applyCameraTransformation(faces[faceIndex].xy), applyCameraTransformation(faces[faceIndex].zw))) {\n                        // This light is blocked by one of the faces.\n                        // We don't count it.\n                        isSourceBlocked = true;\n                    }\n                }\n\n                if (!isSourceBlocked) {\n                    // Current light source affected this point, let's increase\n                    // lightValue & lightCount for this point\n                    // based on the distance from light source.\n                    // (The closer to the light source, the higher the value)\n                    float radius = source.z;\n                    float intensity = source.w;\n                    float val = max(radius - distanceFromSource, 0.0) / radius * intensity;\n                    lightValue += val * sourceColor;\n                    lightCount += 1.0;\n                    // val = max(radius - distanceFromSource, 0.0) / radius;\n                    // gl_FragColor = vec4(val, val, val, val);\n                    // return;\n                }\n            }\n        }\n    }\n\n    // lightValue /= 4.0;\n\n    // Let's cap maximum lightValue to 0.5 to prevent too much lightness\n    gl_FragColor = vec4(min(lightValue.x, 0.75), min(lightValue.y, 0.75), min(lightValue.z, 0.75), min(lightValue.w, 0.75));\n\n    // gl_FragColor = lightValue;\n}\n";

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// import { BlurShader } from './shaders';

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
        // this.blurShader = new BlurShader(this.w, this.h);
        // this.lightImage.filters = [this.filter, this.blurShader.getFilter()];
        this.blurFilter = new Phaser.Filter(game, this.blurFilterUniforms, blurFragSource);
        this.lightImage.filters = [this.lightFilter, this.blurFilter];
        // this.renderedImage.filters = [this.blurShader.getFilter()];

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
            this.blurShader.destroy();
            this.image.destroy();
        }
    }]);

    return LightSystem;
}();

var LightSource = exports.LightSource = function () {
    function LightSource(position, radius, intensity, color) {
        _classCallCheck(this, LightSource);

        this.position = position;
        this.radius = radius;
        this.intensity = intensity;
        this.color = color;
    }

    _createClass(LightSource, [{
        key: 'getArray',
        value: function getArray(scaleFactor) {
            return [this.position.x, // / scaleFactor.x,
            this.position.y, // / scaleFactor.y,
            this.radius, this.intensity, this.color[0], this.color[1], this.color[2], this.color[3]];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYmx1ci5mcmFnIiwic3JjL2xpZ2h0LmZyYWciLCJzcmMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTs7Ozs7Ozs7Ozs7O0FDREE7O0FBRUEsSUFBTSxrQkFBa0IsUUFBUSxjQUFSLENBQXhCO0FBQ0EsSUFBTSxpQkFBaUIsUUFBUSxhQUFSLENBQXZCOztJQUVhLFcsV0FBQSxXO0FBQ1QseUJBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsS0FBbEIsRUFBeUI7QUFBQTs7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBSyxDQUFMLEdBQVMsS0FBSyxHQUFkO0FBQ0EsYUFBSyxDQUFMLEdBQVMsS0FBSyxHQUFkO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBSyxZQUFMLEdBQW9CLEtBQUssR0FBTCxDQUFTLGFBQVQsQ0FBdUIsS0FBSyxDQUE1QixFQUErQixLQUFLLENBQXBDLEVBQXVDLGNBQXZDLENBQXBCO0FBQ0EsYUFBSyxVQUFMLEdBQWtCLEtBQUssR0FBTCxDQUFTLEtBQVQsQ0FBZSxPQUFmLEVBQXdCLE9BQXhCLENBQWxCO0FBQ0EsYUFBSyxVQUFMLENBQWdCLEtBQWhCLEdBQXdCLEtBQUssQ0FBN0I7QUFDQSxhQUFLLFVBQUwsQ0FBZ0IsTUFBaEIsR0FBeUIsS0FBSyxDQUE5Qjs7QUFFQTs7QUFFQTtBQUNBLGFBQUssVUFBTCxDQUFnQixRQUFoQixHQUEyQixJQUEzQjtBQUNBO0FBQ0EsYUFBSyxXQUFMLEdBQW1CLElBQUksT0FBTyxLQUFYLENBQ2YsT0FBTyxVQUFQLEdBQW9CLEtBQUssQ0FEVixFQUVmLE9BQU8sV0FBUCxHQUFxQixLQUFLLENBRlgsQ0FBbkI7O0FBS0EsYUFBSyxhQUFMLEdBQXFCLEtBQUssR0FBTCxDQUFTLEtBQVQsQ0FBZSxDQUFmLEVBQWtCLE9BQU8sV0FBekIsRUFBc0Ms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RUFBYTtBQUFBOztBQUNsQixnQkFBSSxTQUFTLEVBQWI7O0FBRUEsZ0JBQUksU0FBUyxLQUFLLE1BQWxCOztBQUVBLGdCQUFJLE9BQU8sTUFBUCxHQUFnQixDQUFwQixFQUF1QjtBQUNuQix5QkFBUyxPQUFPLE1BQVAsQ0FBYyxDQUFDLE9BQU8sQ0FBUCxDQUFELENBQWQsQ0FBVDtBQUNIOztBQUVELG1CQUFPLE9BQVAsQ0FBZSxVQUFDLEtBQUQsRUFBUSxLQUFSLEVBQWtCO0FBQzdCLG9CQUFJLENBQUMsS0FBTCxFQUFZO0FBQ1I7QUFDSDtBQUNELHVCQUFPLElBQVAsQ0FBWSxLQUFaLENBQWtCLE1BQWxCLEVBQTBCLENBQ3RCLE9BQUssTUFBTCxDQUFZLFFBQVEsQ0FBcEIsRUFBdUIsQ0FERCxFQUNJO0FBQzFCLHVCQUFLLE1BQUwsQ0FBWSxRQUFRLENBQXBCLEVBQXVCLENBRkQsRUFFSTtBQUMxQixzQkFBTSxDQUhnQixFQUdiO0FBQ1Qsc0JBQU0sQ0FKZ0IsQ0FBMUI7QUFNSCxhQVZEOztBQVlBLG1CQUFPLE1BQVA7QUFDSDs7O3dDQUVlO0FBQ1osZ0JBQUksS0FBSyxNQUFMLENBQVksTUFBWixHQUFxQixDQUF6QixFQUE0QjtBQUN4Qix1QkFBTyxDQUFQO0FBQ0gsYUFGRCxNQUVPO0FBQ0gsdUJBQU8sS0FBSyxNQUFMLENBQVksTUFBbkI7QUFDSDtBQUNKOzs7Ozs7QUFHTCxJQUFJLE1BQUosRUFBWTtBQUNSLFdBQU8sV0FBUCxHQUFxQixXQUFyQjtBQUNBLFdBQU8sV0FBUCxHQUFxQixXQUFyQjtBQUNBLFdBQU8sYUFBUCxHQUF1QixhQUF2QjtBQUNIIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gXCIjZGVmaW5lIFJBRElVUyAyLjBcXG4jZGVmaW5lIFNURVAgMS4wXFxuXFxucHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XFxudmFyeWluZyB2ZWMyIHZUZXh0dXJlQ29vcmQ7XFxudW5pZm9ybSBzYW1wbGVyMkQgdVNhbXBsZXI7XFxudW5pZm9ybSB2ZWMyIHNpemVQeDtcXG5cXG52b2lkIG1haW4oKSB7XFxuICAgIHZlYzQgY29sb3IgPSB2ZWM0KDApO1xcblxcbiAgICB2ZWMyIHBpeGVsU2l6ZSA9IHZlYzIoMS4wKSAvIHNpemVQeC54eSAqIDQuMDtcXG5cXG4gICAgZm9yIChmbG9hdCB4ID0gLVJBRElVUzsgeCA8PSBSQURJVVM7IHggKz0gMS4wKSB7XFxuICAgICAgICBmb3IgKGZsb2F0IHkgPSAtUkFESVVTOyB5IDw9IFJBRElVUzsgeSArPSAxLjApIHtcXG4gICAgICAgICAgICBjb2xvciArPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZUZXh0dXJlQ29vcmQgLSB2ZWMyKHBpeGVsU2l6ZS54ICogeCAqIFNURVAsIHBpeGVsU2l6ZS55ICogeSAqIFNURVApKTtcXG4gICAgICAgIH1cXG4gICAgfVxcblxcbiAgICBnbF9GcmFnQ29sb3IgPSBjb2xvciAvIHBvdyhSQURJVVMgKiAyLjAgKyAxLjAsIDIuMCk7XFxufVxcblwiO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBcInByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O1xcblxcbnZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1xcbnVuaWZvcm0gdmVjMiBzaXplUHg7XFxuXFxudW5pZm9ybSB2ZWM0IHNvdXJjZXNbMTZdO1xcbnVuaWZvcm0gaW50IHNvdXJjZXNDb3VudDtcXG51bmlmb3JtIHZlYzIgbW91c2U7XFxuXFxudW5pZm9ybSB2ZWM0IGZhY2VzWzE2XTtcXG51bmlmb3JtIGludCBmYWNlc0NvdW50O1xcblxcbnVuaWZvcm0gdmVjMiBjYW1lcmFQb3M7XFxudW5pZm9ybSB2ZWMyIHNjYWxlRmFjdG9yO1xcblxcbnVuaWZvcm0gYm9vbCBkZWJ1ZztcXG5cXG5ib29sIGNjdyhpbiB2ZWMyIGEsIGluIHZlYzIgYiwgaW4gdmVjMiBjKSB7XFxuICAgIC8vIENoZWNrcyBpZiB0aHJlZSB2ZWN0b3JzIGFyZSBwbGFjZWQgaW4gYSBDQ1cgb3JkZXJcXG4gICAgcmV0dXJuIChjLnkgLSBhLnkpICogKGIueCAtIGEueCkgPiAoYi55IC0gYS55KSAqIChjLnggLSBhLngpO1xcbn1cXG5cXG5ib29sIGludGVyc2VjdHMoaW4gdmVjMiBhLCBpbiB2ZWMyIGIsIGluIHZlYzIgYywgaW4gdmVjMiBkKSB7XFxuICAgIC8vIEZhc3QgaW50ZXJzZWN0aW9uIGNoZWNrIGJhc2VkIG9uIHZlcnRleCBvcmRlclxcbiAgICByZXR1cm4gY2N3KGEsIGMsIGQpICE9IGNjdyhiLCBjLCBkKSAmJiBjY3coYSwgYiwgYykgIT0gY2N3KGEsIGIsIGQpO1xcbn1cXG5cXG52ZWMyIGZsaXAoaW4gdmVjMiB2KSB7XFxuICAgIHJldHVybiB2ZWMyKHYueCwgMS4wIC0gdi55KTtcXG59XFxuXFxudmVjMiBhcHBseUNhbWVyYVRyYW5zZm9ybWF0aW9uKGluIHZlYzIgcG9pbnQpIHtcXG4gICAgcmV0dXJuIHBvaW50IC0gY2FtZXJhUG9zO1xcbn1cXG5cXG52b2lkIG1haW4oKSB7XFxuICAgIC8vIHBpeGVsIHNpemUgaW4gdW5pdHNcXG5cXG4gICAgdmVjMiBwaXhlbFNpemUgPSB2ZWMyKDEuMCkgLyBzaXplUHgueHk7XFxuXFxuICAgIC8vIHZlYzIgbW91c2VQb3MgPSBtb3VzZSAqIHBpeGVsU2l6ZTtcXG5cXG4gICAgLy8gQ3VycmVudCBwb3NpdGlvbiBpbiBwaXhlbHNcXG4gICAgdmVjMiBwaXhlbENvb3JkID0gZmxpcCh2VGV4dHVyZUNvb3JkKSAvIHBpeGVsU2l6ZTtcXG5cXG4gICAgLy8gQ291bnQgJiB0b3RhbCBpbnRlbnNpdHkgb2YgbGlnaHQgc291cmNlcyB0aGF0IGFmZmVjdCB0aGlzIHBvaW50XFxuICAgIHZlYzQgbGlnaHRWYWx1ZSA9IHZlYzQoMC4wKTtcXG4gICAgZmxvYXQgbGlnaHRDb3VudCA9IDAuMDtcXG5cXG4gICAgLy8gc291cmNlc1swXSA9IG1vdXNlO1xcblxcbiAgICBmb3IgKGludCBzb3VyY2VJbmRleCA9IDA7IHNvdXJjZUluZGV4IDwgMjU2OyBzb3VyY2VJbmRleCArPSAyKSB7XFxuICAgICAgICAvLyBMb29wIHRocm91Z2ggbGlnaHQgc291cmNlc1xcbiAgICAgICAgaWYgKHNvdXJjZUluZGV4ID49IHNvdXJjZXNDb3VudCAqIDIpIHtcXG4gICAgICAgICAgICBicmVhaztcXG4gICAgICAgIH1cXG5cXG4gICAgICAgIGZvciAoZmxvYXQgZHggPSAwLjA7IGR4IDwgMS4wOyBkeCArPSAxLjApIHtcXG4gICAgICAgICAgICBmb3IgKGZsb2F0IGR5ID0gMC4wOyBkeSA8IDEuMDsgZHkgKz0gMS4wKSB7XFxuICAgICAgICAgICAgICAgIHZlYzQgc291cmNlID0gdmVjNChzb3VyY2VzW3NvdXJjZUluZGV4XS54eSArIHZlYzIoZHgsIGR5KSAqIDguMCwgc291cmNlc1tzb3VyY2VJbmRleF0uencpO1xcbiAgICAgICAgICAgICAgICB2ZWM0IHNvdXJjZUNvbG9yID0gc291cmNlc1tzb3VyY2VJbmRleCArIDFdO1xcblxcbiAgICAgICAgICAgICAgICAvLyBEaXN0YW5jZSBmcm9tIGN1cnJlbnQgbGlnaHQgc291cmNlIHRvIGN1cnJlbnQgcG9pbnRcXG4gICAgICAgICAgICAgICAgZmxvYXQgZGlzdGFuY2VGcm9tU291cmNlID0gZGlzdGFuY2UoYXBwbHlDYW1lcmFUcmFuc2Zvcm1hdGlvbihzb3VyY2UueHkpLCBwaXhlbENvb3JkKTtcXG5cXG4gICAgICAgICAgICAgICAgaWYgKGRlYnVnKSB7XFxuICAgICAgICAgICAgICAgICAgICAvLyBEcmF3IGxpZ2h0IHBvc2l0aW9uICYgcmFkaXVzXFxuICAgICAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2VGcm9tU291cmNlIDwgNS4wKSB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2xfRnJhZ0NvbG9yID0gdmVjNChzb3VyY2VDb2xvci54eXosIDAuMSk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xcbiAgICAgICAgICAgICAgICAgICAgfVxcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFicyhkaXN0YW5jZUZyb21Tb3VyY2UgLSBzb3VyY2UueikgPCA1LjApIHtcXG4gICAgICAgICAgICAgICAgICAgICAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KHNvdXJjZUNvbG9yLngsIHNvdXJjZUNvbG9yLnksIHNvdXJjZUNvbG9yLnosIDAuMSk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xcbiAgICAgICAgICAgICAgICAgICAgfVxcbiAgICAgICAgICAgICAgICB9XFxuXFxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHNlZ21lbnQgYmV0d2VlbiB0aGlzIHBvaW50IGFuZCBjdXJyZW50IGxpZ2h0IHNvdXJjZVxcbiAgICAgICAgICAgICAgICAvLyBpcyBibG9ja2VkIGJ5IGFueSBmYWNlXFxuICAgICAgICAgICAgICAgIGJvb2wgaXNTb3VyY2VCbG9ja2VkID0gZmFsc2U7XFxuICAgICAgICAgICAgICAgIGZvciAoaW50IGZhY2VJbmRleCA9IDA7IGZhY2VJbmRleCA8IDI1NjsgZmFjZUluZGV4KyspIHtcXG4gICAgICAgICAgICAgICAgICAgIGlmIChmYWNlSW5kZXggPj0gZmFjZXNDb3VudCkge1xcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xcbiAgICAgICAgICAgICAgICAgICAgfVxcbiAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyc2VjdHMoYXBwbHlDYW1lcmFUcmFuc2Zvcm1hdGlvbihzb3VyY2UueHkpLCBwaXhlbENvb3JkLCBhcHBseUNhbWVyYVRyYW5zZm9ybWF0aW9uKGZhY2VzW2ZhY2VJbmRleF0ueHkpLCBhcHBseUNhbWVyYVRyYW5zZm9ybWF0aW9uKGZhY2VzW2ZhY2VJbmRleF0uencpKSkge1xcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgbGlnaHQgaXMgYmxvY2tlZCBieSBvbmUgb2YgdGhlIGZhY2VzLlxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIGRvbid0IGNvdW50IGl0LlxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzU291cmNlQmxvY2tlZCA9IHRydWU7XFxuICAgICAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgICAgIH1cXG5cXG4gICAgICAgICAgICAgICAgaWYgKCFpc1NvdXJjZUJsb2NrZWQpIHtcXG4gICAgICAgICAgICAgICAgICAgIC8vIEN1cnJlbnQgbGlnaHQgc291cmNlIGFmZmVjdGVkIHRoaXMgcG9pbnQsIGxldCdzIGluY3JlYXNlXFxuICAgICAgICAgICAgICAgICAgICAvLyBsaWdodFZhbHVlICYgbGlnaHRDb3VudCBmb3IgdGhpcyBwb2ludFxcbiAgICAgICAgICAgICAgICAgICAgLy8gYmFzZWQgb24gdGhlIGRpc3RhbmNlIGZyb20gbGlnaHQgc291cmNlLlxcbiAgICAgICAgICAgICAgICAgICAgLy8gKFRoZSBjbG9zZXIgdG8gdGhlIGxpZ2h0IHNvdXJjZSwgdGhlIGhpZ2hlciB0aGUgdmFsdWUpXFxuICAgICAgICAgICAgICAgICAgICBmbG9hdCByYWRpdXMgPSBzb3VyY2UuejtcXG4gICAgICAgICAgICAgICAgICAgIGZsb2F0IGludGVuc2l0eSA9IHNvdXJjZS53O1xcbiAgICAgICAgICAgICAgICAgICAgZmxvYXQgdmFsID0gbWF4KHJhZGl1cyAtIGRpc3RhbmNlRnJvbVNvdXJjZSwgMC4wKSAvIHJhZGl1cyAqIGludGVuc2l0eTtcXG4gICAgICAgICAgICAgICAgICAgIGxpZ2h0VmFsdWUgKz0gdmFsICogc291cmNlQ29sb3I7XFxuICAgICAgICAgICAgICAgICAgICBsaWdodENvdW50ICs9IDEuMDtcXG4gICAgICAgICAgICAgICAgICAgIC8vIHZhbCA9IG1heChyYWRpdXMgLSBkaXN0YW5jZUZyb21Tb3VyY2UsIDAuMCkgLyByYWRpdXM7XFxuICAgICAgICAgICAgICAgICAgICAvLyBnbF9GcmFnQ29sb3IgPSB2ZWM0KHZhbCwgdmFsLCB2YWwsIHZhbCk7XFxuICAgICAgICAgICAgICAgICAgICAvLyByZXR1cm47XFxuICAgICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICB9XFxuICAgICAgICB9XFxuICAgIH1cXG5cXG4gICAgLy8gbGlnaHRWYWx1ZSAvPSA0LjA7XFxuXFxuICAgIC8vIExldCdzIGNhcCBtYXhpbXVtIGxpZ2h0VmFsdWUgdG8gMC41IHRvIHByZXZlbnQgdG9vIG11Y2ggbGlnaHRuZXNzXFxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQobWluKGxpZ2h0VmFsdWUueCwgMC43NSksIG1pbihsaWdodFZhbHVlLnksIDAuNzUpLCBtaW4obGlnaHRWYWx1ZS56LCAwLjc1KSwgbWluKGxpZ2h0VmFsdWUudywgMC43NSkpO1xcblxcbiAgICAvLyBnbF9GcmFnQ29sb3IgPSBsaWdodFZhbHVlO1xcbn1cXG5cIjtcbiIsIi8vIGltcG9ydCB7IEJsdXJTaGFkZXIgfSBmcm9tICcuL3NoYWRlcnMnO1xuXG5jb25zdCBsaWdodEZyYWdTb3VyY2UgPSByZXF1aXJlKCcuL2xpZ2h0LmZyYWcnKTtcbmNvbnN0IGJsdXJGcmFnU291cmNlID0gcmVxdWlyZSgnLi9ibHVyLmZyYWcnKTtcblxuZXhwb3J0IGNsYXNzIExpZ2h0U3lzdGVtIHtcbiAgICBjb25zdHJ1Y3Rvcih3LCBoLCBkZWJ1Zykge1xuICAgICAgICAvLyB0aGlzLnNwcml0ZSA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwKTtcbiAgICAgICAgLy8gdGhpcy53ID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgIC8vIHRoaXMuaCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgICAgLy8gdmFyIHNjYWxlID0gNDtcbiAgICAgICAgLy8gdGhpcy53ID0gd2luZG93LmlubmVyV2lkdGggLyBzY2FsZTtcbiAgICAgICAgLy8gdGhpcy5oID0gd2luZG93LmlubmVySGVpZ2h0IC8gc2NhbGU7XG4gICAgICAgIHRoaXMudyA9IHcgfHwgMjU2O1xuICAgICAgICB0aGlzLmggPSBoIHx8IDI1NjtcbiAgICAgICAgLy8gVE9ETzogTWFrZSBpbWFnZSBpbnZpc2libGUgKnByb3Blcmx5KlxuICAgICAgICAvLyB0aGlzLmltYWdlID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDApO1xuICAgICAgICAvLyB0aGlzLmltYWdlID0gbmV3IFBoYXNlci5HcmFwaGljcyhnYW1lLCAwLCAwKTtcbiAgICAgICAgdGhpcy5saWdodFRleHR1cmUgPSBnYW1lLmFkZC5yZW5kZXJUZXh0dXJlKHRoaXMudywgdGhpcy5oLCAnbGlnaHRUZXh0dXJlJyk7XG4gICAgICAgIHRoaXMubGlnaHRJbWFnZSA9IGdhbWUuYWRkLmltYWdlKDEwNDg1NzYsIDEwNDg1NzYpO1xuICAgICAgICB0aGlzLmxpZ2h0SW1hZ2Uud2lkdGggPSB0aGlzLnc7XG4gICAgICAgIHRoaXMubGlnaHRJbWFnZS5oZWlnaHQgPSB0aGlzLmg7XG5cbiAgICAgICAgLy8gdGhpcy5saWdodEltYWdlLmJsZW5kTW9kZSA9IDE7XG5cbiAgICAgICAgLy8gdGhpcy5saWdodEltYWdlLmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuICAgICAgICB0aGlzLmxpZ2h0SW1hZ2Uuc21vb3RoZWQgPSB0cnVlO1xuICAgICAgICAvLyB0aGlzLmxpZ2h0SW1hZ2UucmVuZGVyYWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNjYWxlRmFjdG9yID0gbmV3IFBoYXNlci5Qb2ludChcbiAgICAgICAgICAgIHdpbmRvdy5pbm5lcldpZHRoIC8gdGhpcy53LFxuICAgICAgICAgICAgd2luZG93LmlubmVySGVpZ2h0IC8gdGhpcy5oXG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5yZW5kZXJlZEltYWdlID0gZ2FtZS5hZGQuaW1hZ2UoMCwgd2luZG93LmlubmVySGVpZ2h0LCB0aGlzLmxpZ2h0VGV4dHVyZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZWRJbWFnZS53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgICAgICB0aGlzLnJlbmRlcmVkSW1hZ2UuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgICB0aGlzLnJlbmRlcmVkSW1hZ2UuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG4gICAgICAgIHRoaXMucmVuZGVyZWRJbWFnZS5zY2FsZS55ICo9IC0xO1xuICAgICAgICB0aGlzLnJlbmRlcmVkSW1hZ2Uuc21vb3RoZWQgPSB0cnVlO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnSW5pdGlhbCBsaWdodCBzcHJpdGUgc2NhbGU6JywgdGhpcy5zcHJpdGUuc2NhbGUueCwgdGhpcy5zcHJpdGUuc2NhbGUueSk7XG4gICAgICAgIC8vIHRoaXMuc3ByaXRlLnNjYWxlLnggKj0gdGhpcy5zY2FsZUZhY3Rvci54O1xuICAgICAgICAvLyB0aGlzLnNwcml0ZS5zY2FsZS55ICo9IHRoaXMuc2NhbGVGYWN0b3IueTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ0NyZWF0aW5nIGxpZ2h0IHNwcml0ZSwgc2l6ZScsIHRoaXMudywgdGhpcy5oLCAnc2NhbGUnLCB0aGlzLnNjYWxlRmFjdG9yLngsIHRoaXMuc2NhbGVGYWN0b3IueSk7XG4gICAgICAgIC8vIHRoaXMuc3ByaXRlLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgIC8vIHRoaXMuc3ByaXRlLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcblxuICAgICAgICB0aGlzLmxpZ2h0RmlsdGVyVW5pZm9ybXMgPSB7XG4gICAgICAgICAgICBzaXplUHg6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnMmZ2JyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbmV3IEZsb2F0MzJBcnJheShbXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5pbm5lcldpZHRoLFxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuaW5uZXJIZWlnaHRcbiAgICAgICAgICAgICAgICBdKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNjYWxlRmFjdG9yOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJzJmdicsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG5ldyBGbG9hdDMyQXJyYXkoW1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRmFjdG9yLngsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVGYWN0b3IueVxuICAgICAgICAgICAgICAgIF0pXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc291cmNlczoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICc0ZnYnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBuZXcgRmxvYXQzMkFycmF5KFtdKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNvdXJjZXNDb3VudDoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICcxaScsXG4gICAgICAgICAgICAgICAgdmFsdWU6IDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmYWNlczoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICc0ZnYnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBuZXcgRmxvYXQzMkFycmF5KFtdKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZhY2VzQ291bnQ6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnMWknLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2FtZXJhUG9zOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJzJmdicsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG5ldyBGbG9hdDMyQXJyYXkoWzAsIDBdKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlYnVnOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJzFpJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogISFkZWJ1Z1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYmx1ckZpbHRlclVuaWZvcm1zID0ge1xuICAgICAgICAgICAgc2l6ZVB4OiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJzJmdicsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG5ldyBGbG9hdDMyQXJyYXkoW1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuaW5uZXJXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmlubmVySGVpZ2h0XG4gICAgICAgICAgICAgICAgXSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5saWdodEZpbHRlciA9IG5ldyBQaGFzZXIuRmlsdGVyKFxuICAgICAgICAgICAgZ2FtZSxcbiAgICAgICAgICAgIHRoaXMubGlnaHRGaWx0ZXJVbmlmb3JtcyxcbiAgICAgICAgICAgIGxpZ2h0RnJhZ1NvdXJjZVxuICAgICAgICApO1xuICAgICAgICB0aGlzLmxpZ2h0RmlsdGVyLnNldFJlc29sdXRpb24odGhpcy53LCB0aGlzLmgpO1xuICAgICAgICAvLyB0aGlzLmJsdXJTaGFkZXIgPSBuZXcgQmx1clNoYWRlcih0aGlzLncsIHRoaXMuaCk7XG4gICAgICAgIC8vIHRoaXMubGlnaHRJbWFnZS5maWx0ZXJzID0gW3RoaXMuZmlsdGVyLCB0aGlzLmJsdXJTaGFkZXIuZ2V0RmlsdGVyKCldO1xuICAgICAgICB0aGlzLmJsdXJGaWx0ZXIgPSBuZXcgUGhhc2VyLkZpbHRlcihnYW1lLCB0aGlzLmJsdXJGaWx0ZXJVbmlmb3JtcywgYmx1ckZyYWdTb3VyY2UpO1xuICAgICAgICB0aGlzLmxpZ2h0SW1hZ2UuZmlsdGVycyA9IFt0aGlzLmxpZ2h0RmlsdGVyLCB0aGlzLmJsdXJGaWx0ZXJdO1xuICAgICAgICAvLyB0aGlzLnJlbmRlcmVkSW1hZ2UuZmlsdGVycyA9IFt0aGlzLmJsdXJTaGFkZXIuZ2V0RmlsdGVyKCldO1xuXG4gICAgICAgIHRoaXMubGlnaHRTb3VyY2VzID0gW107XG4gICAgICAgIHRoaXMub2JqZWN0cyA9IFtdO1xuICAgIH1cblxuICAgIGFkZExpZ2h0U291cmNlKGxpZ2h0U291cmNlKSB7XG4gICAgICAgIHRoaXMubGlnaHRTb3VyY2VzLnB1c2gobGlnaHRTb3VyY2UpO1xuICAgICAgICAvLyB0aGlzLl91cGRhdGVMaWdodFNvdXJjZXNVbmlmb3JtcygpO1xuICAgIH1cblxuICAgIHJlbW92ZUxpZ2h0U291cmNlKGxpZ2h0U291cmNlKSB7XG4gICAgICAgIGxldCBpbmRleCA9IHRoaXMubGlnaHRTb3VyY2VzLmluZGV4T2YobGlnaHRTb3VyY2UpO1xuICAgICAgICB0aGlzLmxpZ2h0U291cmNlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAvLyB0aGlzLl91cGRhdGVMaWdodFNvdXJjZXNVbmlmb3JtcygpO1xuICAgIH1cblxuICAgIGFkZE9iamVjdChvYmopIHtcbiAgICAgICAgdGhpcy5vYmplY3RzLnB1c2gob2JqKTtcbiAgICAgICAgLy8gdGhpcy5fdXBkYXRlRmFjZXNVbmlmb3JtcygpO1xuICAgIH1cblxuICAgIHJlbW92ZU9iamVjdChvYmopIHtcbiAgICAgICAgbGV0IGluZGV4ID0gdGhpcy5vYmplY3RzLmluZGV4T2Yob2JqKTtcbiAgICAgICAgdGhpcy5vYmplY3RzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIC8vIHRoaXMuX3VwZGF0ZUZhY2VzVW5pZm9ybXMoKTtcbiAgICB9XG5cbiAgICByZW1vdmVBbGwoKSB7XG4gICAgICAgIHRoaXMubGlnaHRTb3VyY2VzID0gW11cbiAgICAgICAgdGhpcy5vYmplY3RzID0gW107XG4gICAgICAgIC8vIHRoaXMuX3VwZGF0ZUxpZ2h0U291cmNlc1VuaWZvcm1zKCk7XG4gICAgICAgIC8vIHRoaXMuX3VwZGF0ZUZhY2VzVW5pZm9ybXMoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVMaWdodFNvdXJjZXNVbmlmb3JtcygpIHtcbiAgICAgICAgdGhpcy5saWdodEZpbHRlclVuaWZvcm1zLnNvdXJjZXMudmFsdWUgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgICAgICAgICAgdGhpcy5saWdodFNvdXJjZXMucmVkdWNlKChyLCB4KSA9PiByLmNvbmNhdCh4LmdldEFycmF5KHRoaXMuc2NhbGVGYWN0b3IpKSwgW10pXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMubGlnaHRGaWx0ZXJVbmlmb3Jtcy5zb3VyY2VzQ291bnQudmFsdWUgPSB0aGlzLmxpZ2h0U291cmNlcy5sZW5ndGg7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdVcGRhdGluZyBsaWdodCBzb3VyY2VzIHVuaWZvcm1zLCBjb3VudCA9JywgdGhpcy5saWdodEZpbHRlci51bmlmb3Jtcy5zb3VyY2VzQ291bnQudmFsdWUpO1xuICAgIH1cblxuICAgIHVwZGF0ZUZhY2VzVW5pZm9ybXMoKSB7XG4gICAgICAgIHRoaXMubGlnaHRGaWx0ZXJVbmlmb3Jtcy5mYWNlcy52YWx1ZSA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICAgICAgICB0aGlzLm9iamVjdHMucmVkdWNlKChyLCB4KSA9PiByLmNvbmNhdCh4LmdldEFycmF5KHRoaXMuc2NhbGVGYWN0b3IpKSwgW10pXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMubGlnaHRGaWx0ZXJVbmlmb3Jtcy5mYWNlc0NvdW50LnZhbHVlID0gdGhpcy5saWdodEZpbHRlclVuaWZvcm1zLmZhY2VzLnZhbHVlLmxlbmd0aCAvIDQ7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdVcGRhdGluZyBmYWNlcyB1bmlmb3JtcywgY291bnQgPScsIHRoaXMubGlnaHRGaWx0ZXIudW5pZm9ybXMuZmFjZXNDb3VudC52YWx1ZSk7XG4gICAgfVxuXG4gICAgdXBkYXRlVW5pZm9ybXMoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlTGlnaHRTb3VyY2VzVW5pZm9ybXMoKTtcbiAgICAgICAgdGhpcy51cGRhdGVGYWNlc1VuaWZvcm1zKCk7XG4gICAgfVxuXG4gICAgdXBkYXRlQ2FtZXJhUG9zKHBvaW50KSB7XG4gICAgICAgIHRoaXMubGlnaHRGaWx0ZXJVbmlmb3Jtcy5jYW1lcmFQb3MudmFsdWUgPSBuZXcgRmxvYXQzMkFycmF5KFtcbiAgICAgICAgICAgIC8vIHBvaW50LnggLyB0aGlzLnNjYWxlRmFjdG9yLngsXG4gICAgICAgICAgICAvLyBwb2ludC55IC8gdGhpcy5zY2FsZUZhY3Rvci55XG4gICAgICAgICAgICBwb2ludC54LFxuICAgICAgICAgICAgcG9pbnQueVxuICAgICAgICBdKTtcbiAgICB9XG5cbiAgICBzZXREZWJ1ZyhlbmFibGUpIHtcbiAgICAgICAgdGhpcy5saWdodEZpbHRlclVuaWZvcm1zLmRlYnVnLnZhbHVlID0gISFlbmFibGU7XG4gICAgfVxuXG4gICAgdXBkYXRlKCkge1xuICAgICAgICB0aGlzLmxpZ2h0RmlsdGVyLnVwZGF0ZSgpO1xuICAgICAgICB0aGlzLmJsdXJGaWx0ZXIudXBkYXRlKCk7XG4gICAgICAgIHRoaXMubGlnaHRUZXh0dXJlLnJlbmRlclhZKHRoaXMubGlnaHRJbWFnZSwgMCwgMCwgdHJ1ZSk7XG4gICAgICAgIC8vIHRoaXMuaW1hZ2Uuc2V0VGV4dHVyZSh0aGlzLmltYWdlLmdlbmVyYXRlVGV4dHVyZSgxLCBQSVhJLnNjYWxlTW9kZXMuTElORUFSLCBnYW1lLnJlbmRlcmVyKSk7XG4gICAgfVxuXG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgLy8gVE9ETzogYGRlc3Ryb3lgIG9yIGByZW1vdmVgP1xuICAgICAgICB0aGlzLmxpZ2h0RmlsdGVyLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5ibHVyU2hhZGVyLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5pbWFnZS5kZXN0cm95KCk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTGlnaHRTb3VyY2Uge1xuICAgIGNvbnN0cnVjdG9yKHBvc2l0aW9uLCByYWRpdXMsIGludGVuc2l0eSwgY29sb3IpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgICAgICB0aGlzLnJhZGl1cyA9IHJhZGl1cztcbiAgICAgICAgdGhpcy5pbnRlbnNpdHkgPSBpbnRlbnNpdHk7XG4gICAgICAgIHRoaXMuY29sb3IgPSBjb2xvcjtcbiAgICB9XG5cbiAgICBnZXRBcnJheShzY2FsZUZhY3Rvcikge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbi54LCAvLyAvIHNjYWxlRmFjdG9yLngsXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uLnksIC8vIC8gc2NhbGVGYWN0b3IueSxcbiAgICAgICAgICAgIHRoaXMucmFkaXVzLFxuICAgICAgICAgICAgdGhpcy5pbnRlbnNpdHksXG4gICAgICAgICAgICB0aGlzLmNvbG9yWzBdLFxuICAgICAgICAgICAgdGhpcy5jb2xvclsxXSxcbiAgICAgICAgICAgIHRoaXMuY29sb3JbMl0sXG4gICAgICAgICAgICB0aGlzLmNvbG9yWzNdXG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTGlnaHRlZE9iamVjdCB7XG4gICAgY29uc3RydWN0b3IocG9pbnRzKSB7XG4gICAgICAgIHRoaXMucG9pbnRzID0gcG9pbnRzO1xuICAgIH1cblxuICAgIGdldEFycmF5KHNjYWxlRmFjdG9yKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgICAgICB2YXIgcG9pbnRzID0gdGhpcy5wb2ludHM7XG5cbiAgICAgICAgaWYgKHBvaW50cy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICBwb2ludHMgPSBwb2ludHMuY29uY2F0KFtwb2ludHNbMF1dKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHBvaW50cy5mb3JFYWNoKChwb2ludCwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGlmICghaW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIFtcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50c1tpbmRleCAtIDFdLngsIC8vIC8gc2NhbGVGYWN0b3IueCxcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50c1tpbmRleCAtIDFdLnksIC8vIC8gc2NhbGVGYWN0b3IueSxcbiAgICAgICAgICAgICAgICBwb2ludC54LCAvLyAvIHNjYWxlRmFjdG9yLngsXG4gICAgICAgICAgICAgICAgcG9pbnQueSwgLy8gLyBzY2FsZUZhY3Rvci55XG4gICAgICAgICAgICBdKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBnZXRGYWNlc0NvdW50KCkge1xuICAgICAgICBpZiAodGhpcy5wb2ludHMubGVuZ3RoIDwgMykge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wb2ludHMubGVuZ3RoO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5pZiAod2luZG93KSB7XG4gICAgd2luZG93LkxpZ2h0U3lzdGVtID0gTGlnaHRTeXN0ZW07XG4gICAgd2luZG93LkxpZ2h0U291cmNlID0gTGlnaHRTb3VyY2U7XG4gICAgd2luZG93LkxpZ2h0ZWRPYmplY3QgPSBMaWdodGVkT2JqZWN0O1xufVxuIl19
