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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYmx1ci5mcmFnIiwic3JjL2xpZ2h0LmZyYWciLCJzcmMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTs7Ozs7Ozs7Ozs7O0FDREE7O0FBRUEsSUFBTSxrQkFBa0IsUUFBUSxjQUFSLENBQXhCO0FBQ0EsSUFBTSxpQkFBaUIsUUFBUSxhQUFSLENBQXZCOztJQUVhLFcsV0FBQSxXO0FBQ1QseUJBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsS0FBbEIsRUFBeUI7QUFBQTs7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBSyxDQUFMLEdBQVMsS0FBSyxHQUFkO0FBQ0EsYUFBSyxDQUFMLEdBQVMsS0FBSyxHQUFkO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBSyxZQUFMLEdBQW9CLEtBQUssR0FBTCxDQUFTLGFBQVQsQ0FBdUIsS0FBSyxDQUE1QixFQUErQixLQUFLLENBQXBDLEVBQXVDLGNBQXZDLENBQXBCO0FBQ0EsYUFBSyxVQUFMLEdBQWtCLEtBQUssR0FBTCxDQUFTLEtBQVQsQ0FBZSxPQUFmLEVBQXdCLE9BQXhCLENBQWxCO0FBQ0EsYUFBSyxVQUFMLENBQWdCLEtBQWhCLEdBQXdCLEtBQUssQ0FBN0I7QUFDQSxhQUFLLFVBQUwsQ0FBZ0IsTUFBaEIsR0FBeUIsS0FBSyxDQUE5Qjs7QUFFQTs7QUFFQTtBQUNBLGFBQUssVUFBTCxDQUFnQixRQUFoQixHQUEyQixJQUEzQjtBQUNBO0FBQ0EsYUFBSyxXQUFMLEdBQW1CLElBQUksT0FBTyxLQUFYLENBQ2YsT0FBTyxVQUFQLEdBQW9CLEtBQUssQ0FEVixFQUVmLE9BQU8sV0FBUCxHQUFxQixLQUFLLENBRlgsQ0FBbkI7O0FBS0EsYUFBSyxhQUFMLEdBQXFCLEtBQUssR0FBTCxDQUFTLEtBQVQsQ0FBZSxDQUFmLEVBQWtCLE9BQU8sV0FBekIsRUFBc0MsS0FBSyxZQUEzQyxDQUFyQjtBQUNBLGFBQUssYUFBTCxDQUFtQixLQUFuQixHQUEyQixPQUFPLFVBQWxDO0FBQ0EsYUFBSyxhQUFMLENBQW1CLE1BQW5CLEdBQTRCLE9BQU8sV0FBbkM7QUFDQSxhQUFLLGFBQUwsQ0FBbUIsYUFBbkIsR0FBbUMsSUFBbkM7QUFDQSxhQUFLLGFBQUwsQ0FBbUIsS0FBbkIsQ0FBeUIsQ0FBekIsSUFBOEIsQ0FBQyxDQUEvQjtBQUNBLGFBQUssYUFBTCxDQUFtQixRQUFuQixHQUE4QixJQUE5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxhQUFLLG1CQUFMLEdBQTJCO0FBQ3ZCLG9CQUFRO0FBQ0osc0JBQU0sS0FERjtBQUVKLHVCQUFPLElBQUksWUFBSixDQUFpQixDQUNwQixPQUFPLFVBRGEsRUFFcEIsT0FBTyxXQUZhLENBQWpCO0FBRkgsYUFEZTtBQVF2Qix5QkFBYTtBQUNULHNCQUFNLEtBREc7QUFFVCx1QkFBTyxJQUFJLFlBQUosQ0FBaUIsQ0FDcEIsS0FBSyxXQUFMLENBQWlCLENBREcsRUFFcEIsS0FBSyxXQUFMLENBQWlCLENBRkcsQ0FBakI7QUFGRSxhQVJVO0FBZXZCLHFCQUFTO0FBQ0wsc0JBQU0sS0FERDtBQUVMLHVCQUFPLElBQUksWUFBSixDQUFpQixFQUFqQjtBQUZGLGFBZmM7QUFtQnZCLDBCQUFjO0FBQ1Ysc0JBQU0sSUFESTtBQUVWLHVCQUFPO0FBRkcsYUFuQlM7QUF1QnZCLG1CQUFPO0FBQ0gsc0JBQU0sS0FESDtBQUVILHVCQUFPLElBQUksWUFBSixDQUFpQixFQUFqQjtBQUZKLGFBdkJnQjtBQTJCdkIsd0JBQVk7QUFDUixzQkFBTSxJQURFO0FBRVIsdUJBQU87QUFGQyxhQTNCVztBQStCdkIsdUJBQVc7QUFDUCxzQkFBTSxLQURDO0FBRVAsdUJBQU8sSUFBSSxZQUFKLENBQWlCLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBakI7QUFGQSxhQS9CWTtBQW1DdkIsbUJBQU87QUFDSCxzQkFBTSxJQURIO0FBRUgsdUJBQU8sQ0FBQyxDQUFDO0FBRk47QUFuQ2dCLFNBQTNCOztBQXlDQSxhQUFLLGtCQUFMLEdBQTBCO0FBQ3RCLG9CQUFRO0FBQ0osc0JBQU0sS0FERjtBQUVKLHVCQUFPLElBQUksWUFBSixDQUFpQixDQUNwQixPQUFPLFVBRGEsRUFFcEIsT0FBTyxXQUZhLENBQWpCO0FBRkg7QUFEYyxTQUExQjs7QUFVQSxhQUFLLFdBQUwsR0FBbUIsSUFBSSxPQUFPLE1BQVgsQ0FDZixJQURlLEVBRWYsS0FBSyxtQkFGVSxFQUdmLGVBSGUsQ0FBbkI7QUFLQSxhQUFLLFdBQUwsQ0FBaUIsYUFBakIsQ0FBK0IsS0FBSyxDQUFwQyxFQUF1QyxLQUFLLENBQTVDO0FBQ0E7QUFDQTtBQUNBLGFBQUssVUFBTCxHQUFrQixJQUFJLE9BQU8sTUFBWCxDQUFrQixJQUFsQixFQUF3QixLQUFLLGtCQUE3QixFQUFpRCxjQUFqRCxDQUFsQjtBQUNBLGFBQUssVUFBTCxDQUFnQixPQUFoQixHQUEwQixDQUFDLEtBQUssV0FBTixFQUFtQixLQUFLLFVBQXhCLENBQTFCO0FBQ0E7O0FBRUEsYUFBSyxZQUFMLEdBQW9CLEVBQXBCO0FBQ0EsYUFBSyxPQUFMLEdBQWUsRUFBZjtBQUNIOzs7O3VDQUVjLFcsRUFBYTtBQUN4QixpQkFBSyxZQUFMLENBQWtCLElBQWxCLENBQXVCLFdBQXZCO0FBQ0E7QUFDSDs7OzBDQUVpQixXLEVBQWE7QUFDM0IsZ0JBQUksUUFBUSxLQUFLLFlBQUwsQ0FBa0IsT0FBbEIsQ0FBMEIsV0FBMUIsQ0FBWjtBQUNBLGlCQUFLLFlBQUwsQ0FBa0IsTUFBbEIsQ0FBeUIsS0FBekIsRUFBZ0MsQ0FBaEM7QUFDQTtBQUNIOzs7a0NBRVMsRyxFQUFLO0FBQ1gsaUJBQUssT0FBTCxDQUFhLElBQWIsQ0FBa0IsR0FBbEI7QUFDQTtBQUNIOzs7cUNBRVksRyxFQUFLO0FBQ2QsZ0JBQUksUUFBUSxLQUFLLE9BQUwsQ0FBYSxPQUFiLENBQXFCLEdBQXJCLENBQVo7QUFDQSxpQkFBSyxPQUFMLENBQWEsTUFBYixDQUFvQixLQUFwQixFQUEyQixDQUEzQjtBQUNBO0FBQ0g7OztvQ0FFVztBQUNSLGlCQUFLLFlBQUwsR0FBb0IsRUFBcEI7QUFDQSxpQkFBSyxPQUFMLEdBQWUsRUFBZjtBQUNBO0FBQ0E7QUFDSDs7O3FEQUU0QjtBQUFBOztBQUN6QixpQkFBSyxtQkFBTCxDQUF5QixPQUF6QixDQUFpQyxLQUFqQyxHQUF5QyxJQUFJLFlBQUosQ0FDckMsS0FBSyxZQUFMLENBQWtCLE1BQWxCLENBQXlCLFVBQUMsQ0FBRCxFQUFJLENBQUo7QUFBQSx1QkFBVSxFQUFFLE1BQUYsQ0FBUyxFQUFFLFFBQUYsQ0FBVyxNQUFLLFdBQWhCLENBQVQsQ0FBVjtBQUFBLGFBQXpCLEVBQTJFLEVBQTNFLENBRHFDLENBQXpDO0FBR0EsaUJBQUssbUJBQUwsQ0FBeUIsWUFBekIsQ0FBc0MsS0FBdEMsR0FBOEMsS0FBSyxZQUFMLENBQWtCLE1BQWhFO0FBQ0E7QUFDSDs7OzhDQUVxQjtBQUFBOztBQUNsQixpQkFBSyxtQkFBTCxDQUF5QixLQUF6QixDQUErQixLQUEvQixHQUF1QyxJQUFJLFlBQUosQ0FDbkMsS0FBSyxPQUFMLENBQWEsTUFBYixDQUFvQixVQUFDLENBQUQsRUFBSSxDQUFKO0FBQUEsdUJBQVUsRUFBRSxNQUFGLENBQVMsRUFBRSxRQUFGLENBQVcsT0FBSyxXQUFoQixDQUFULENBQVY7QUFBQSxhQUFwQixFQUFzRSxFQUF0RSxDQURtQyxDQUF2QztBQUdBLGlCQUFLLG1CQUFMLENBQXlCLFVBQXpCLENBQW9DLEtBQXBDLEdBQTRDLEtBQUssbUJBQUwsQ0FBeUIsS0FBekIsQ0FBK0IsS0FBL0IsQ0FBcUMsTUFBckMsR0FBOEMsQ0FBMUY7QUFDQTtBQUNIOzs7eUNBRWdCO0FBQ2IsaUJBQUssMEJBQUw7QUFDQSxpQkFBSyxtQkFBTDtBQUNIOzs7d0NBRWUsSyxFQUFPO0FBQ25CLGlCQUFLLG1CQUFMLENBQXlCLFNBQXpCLENBQW1DLEtBQW5DLEdBQTJDLElBQUksWUFBSixDQUFpQjtBQUN4RDtBQUNBO0FBQ0Esa0JBQU0sQ0FIa0QsRUFJeEQsTUFBTSxDQUprRCxDQUFqQixDQUEzQztBQU1IOzs7aUNBRVEsTSxFQUFRO0FBQ2IsaUJBQUssbUJBQUwsQ0FBeUIsS0FBekIsQ0FBK0IsS0FBL0IsR0FBdUMsQ0FBQyxDQUFDLE1BQXpDO0FBQ0g7OztpQ0FFUTtBQUNMLGlCQUFLLFdBQUwsQ0FBaUIsTUFBakI7QUFDQSxpQkFBSyxVQUFMLENBQWdCLE1BQWhCO0FBQ0EsaUJBQUssWUFBTCxDQUFrQixRQUFsQixDQUEyQixLQUFLLFVBQWhDLEVBQTRDLENBQTVDLEVBQStDLENBQS9DLEVBQWtELElBQWxEO0FBQ0E7QUFDSDs7O2tDQUVTO0FBQ047QUFDQSxpQkFBSyxXQUFMLENBQWlCLE9BQWpCO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixPQUFoQjtBQUNBLGlCQUFLLEtBQUwsQ0FBVyxPQUFYO0FBQ0g7Ozs7OztJQUdRLFcsV0FBQSxXO0FBQ1QseUJBQVksUUFBWixFQUFzQixNQUF0QixFQUE4QixTQUE5QixFQUF5QyxLQUF6QyxFQUFnRCxVQUFoRCxFQUE0RCxRQUE1RCxFQUFzRTtBQUFBOztBQUNsRSxhQUFLLFFBQUwsR0FBZ0IsUUFBaEI7QUFDQSxhQUFLLE1BQUwsR0FBYyxNQUFkO0FBQ0EsYUFBSyxTQUFMLEdBQWlCLFNBQWpCO0FBQ0EsYUFBSyxLQUFMLEdBQWEsS0FBYjtBQUNBLGFBQUssV0FBTCxHQUFtQixjQUFjLENBQWpDO0FBQ0EsYUFBSyxTQUFMLEdBQWlCLFlBQVksQ0FBN0I7QUFDQSxhQUFLLFdBQUwsQ0FBaUIsQ0FBakI7QUFDSDs7OztpQ0FFUSxXLEVBQWE7QUFDbEIsbUJBQU8sQ0FDSCxLQUFLLFFBQUwsQ0FBYyxDQURYLEVBQ2M7QUFDakIsaUJBQUssUUFBTCxDQUFjLENBRlgsRUFFYztBQUNqQixpQkFBSyxNQUhGLEVBSUgsS0FBSyxTQUpGLEVBS0gsS0FBSyxLQUFMLENBQVcsQ0FBWCxDQUxHLEVBTUgsS0FBSyxLQUFMLENBQVcsQ0FBWCxDQU5HLEVBT0gsS0FBSyxLQUFMLENBQVcsQ0FBWCxDQVBHLEVBUUgsS0FBSyxLQUFMLENBQVcsQ0FBWCxDQVJHLEVBU0gsS0FBSyxVQVRGLEVBVUgsS0FBSyxRQVZGLEVBV0gsQ0FYRyxFQVlILENBWkcsQ0FBUDtBQWNIOzs7b0NBRVcsUSxFQUFVO0FBQ2xCLGdCQUFJLEtBQUssV0FBTCxJQUFvQixDQUFwQixJQUF5QixLQUFLLFNBQUwsSUFBa0IsQ0FBL0MsRUFBa0Q7QUFDOUM7QUFDSDs7QUFFRCxpQkFBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsaUJBQUssVUFBTCxHQUFrQixDQUFDLEtBQUssV0FBTCxHQUFtQixLQUFLLFFBQXpCLEtBQXNDLEtBQUssRUFBTCxHQUFVLENBQWhELENBQWxCO0FBQ0EsaUJBQUssUUFBTCxHQUFnQixDQUFDLEtBQUssU0FBTCxHQUFpQixLQUFLLFFBQXZCLEtBQW9DLEtBQUssRUFBTCxHQUFVLENBQTlDLENBQWhCOztBQUVBLGdCQUFJLEtBQUssVUFBTCxHQUFrQixDQUF0QixFQUF5QjtBQUNyQixxQkFBSyxVQUFMLElBQW1CLEtBQUssRUFBTCxHQUFVLENBQTdCO0FBQ0g7QUFDRCxnQkFBSSxLQUFLLFFBQUwsR0FBZ0IsQ0FBcEIsRUFBdUI7QUFDbkIscUJBQUssUUFBTCxJQUFpQixLQUFLLEVBQUwsR0FBVSxDQUEzQjtBQUNIO0FBQ0o7Ozs7OztJQUdRLGEsV0FBQSxhO0FBQ1QsMkJBQVksTUFBWixFQUFvQjtBQUFBOztBQUNoQixhQUFLLE1BQUwsR0FBYyxNQUFkO0FBQ0g7Ozs7aUNBRVEsVyxFQUFhO0FBQUE7O0FBQ2xCLGdCQUFJLFNBQVMsRUFBYjs7QUFFQSxnQkFBSSxTQUFTLEtBQUssTUFBbEI7O0FBRUEsZ0JBQUksT0FBTyxNQUFQLEdBQWdCLENBQXBCLEVBQXVCO0FBQ25CLHlCQUFTLE9BQU8sTUFBUCxDQUFjLENBQUMsT0FBTyxDQUFQLENBQUQsQ0FBZCxDQUFUO0FBQ0g7O0FBRUQsbUJBQU8sT0FBUCxDQUFlLFVBQUMsS0FBRCxFQUFRLEtBQVIsRUFBa0I7QUFDN0Isb0JBQUksQ0FBQyxLQUFMLEVBQVk7QUFDUjtBQUNIO0FBQ0QsdUJBQU8sSUFBUCxDQUFZLEtBQVosQ0FBa0IsTUFBbEIsRUFBMEIsQ0FDdEIsT0FBSyxNQUFMLENBQVksUUFBUSxDQUFwQixFQUF1QixDQURELEVBQ0k7QUFDMUIsdUJBQUssTUFBTCxDQUFZLFFBQVEsQ0FBcEIsRUFBdUIsQ0FGRCxFQUVJO0FBQzFCLHNCQUFNLENBSGdCLEVBR2I7QUFDVCxzQkFBTSxDQUpnQixDQUExQjtBQU1ILGFBVkQ7O0FBWUEsbUJBQU8sTUFBUDtBQUNIOzs7d0NBRWU7QUFDWixnQkFBSSxLQUFLLE1BQUwsQ0FBWSxNQUFaLEdBQXFCLENBQXpCLEVBQTRCO0FBQ3hCLHVCQUFPLENBQVA7QUFDSCxhQUZELE1BRU87QUFDSCx1QkFBTyxLQUFLLE1BQUwsQ0FBWSxNQUFuQjtBQUNIO0FBQ0o7Ozs7OztBQUdMLElBQUksTUFBSixFQUFZO0FBQ1IsV0FBTyxXQUFQLEdBQXFCLFdBQXJCO0FBQ0EsV0FBTyxXQUFQLEdBQXFCLFdBQXJCO0FBQ0EsV0FBTyxhQUFQLEdBQXVCLGFBQXZCO0FBQ0giLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBcIiNkZWZpbmUgUkFESVVTIDIuMFxcbiNkZWZpbmUgU1RFUCAxLjBcXG5cXG5wcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcXG52YXJ5aW5nIHZlYzIgdlRleHR1cmVDb29yZDtcXG51bmlmb3JtIHNhbXBsZXIyRCB1U2FtcGxlcjtcXG51bmlmb3JtIHZlYzIgc2l6ZVB4O1xcblxcbnZvaWQgbWFpbigpIHtcXG4gICAgdmVjNCBjb2xvciA9IHZlYzQoMCk7XFxuXFxuICAgIHZlYzIgcGl4ZWxTaXplID0gdmVjMigxLjApIC8gc2l6ZVB4Lnh5ICogNC4wO1xcblxcbiAgICBmb3IgKGZsb2F0IHggPSAtUkFESVVTOyB4IDw9IFJBRElVUzsgeCArPSAxLjApIHtcXG4gICAgICAgIGZvciAoZmxvYXQgeSA9IC1SQURJVVM7IHkgPD0gUkFESVVTOyB5ICs9IDEuMCkge1xcbiAgICAgICAgICAgIGNvbG9yICs9IHRleHR1cmUyRCh1U2FtcGxlciwgdlRleHR1cmVDb29yZCAtIHZlYzIocGl4ZWxTaXplLnggKiB4ICogU1RFUCwgcGl4ZWxTaXplLnkgKiB5ICogU1RFUCkpO1xcbiAgICAgICAgfVxcbiAgICB9XFxuXFxuICAgIGdsX0ZyYWdDb2xvciA9IGNvbG9yIC8gcG93KFJBRElVUyAqIDIuMCArIDEuMCwgMi4wKTtcXG59XFxuXCI7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFwicHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XFxuXFxuI2RlZmluZSBNX1BJIDMuMTQxNTkyNjUzNTg5NzkzMjM4NDYyNjQzMzgzMjc5NVxcblxcbnZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1xcbnVuaWZvcm0gdmVjMiBzaXplUHg7XFxuXFxudW5pZm9ybSB2ZWM0IHNvdXJjZXNbMTZdO1xcbnVuaWZvcm0gaW50IHNvdXJjZXNDb3VudDtcXG51bmlmb3JtIHZlYzIgbW91c2U7XFxuXFxudW5pZm9ybSB2ZWM0IGZhY2VzWzE2XTtcXG51bmlmb3JtIGludCBmYWNlc0NvdW50O1xcblxcbnVuaWZvcm0gdmVjMiBjYW1lcmFQb3M7XFxudW5pZm9ybSB2ZWMyIHNjYWxlRmFjdG9yO1xcblxcbnVuaWZvcm0gYm9vbCBkZWJ1ZztcXG5cXG5ib29sIGNjdyhpbiB2ZWMyIGEsIGluIHZlYzIgYiwgaW4gdmVjMiBjKSB7XFxuICAgIC8vIENoZWNrcyBpZiB0aHJlZSB2ZWN0b3JzIGFyZSBwbGFjZWQgaW4gYSBDQ1cgb3JkZXJcXG4gICAgcmV0dXJuIChjLnkgLSBhLnkpICogKGIueCAtIGEueCkgPiAoYi55IC0gYS55KSAqIChjLnggLSBhLngpO1xcbn1cXG5cXG5ib29sIGludGVyc2VjdHMoaW4gdmVjMiBhLCBpbiB2ZWMyIGIsIGluIHZlYzIgYywgaW4gdmVjMiBkKSB7XFxuICAgIC8vIEZhc3QgaW50ZXJzZWN0aW9uIGNoZWNrIGJhc2VkIG9uIHZlcnRleCBvcmRlclxcbiAgICByZXR1cm4gY2N3KGEsIGMsIGQpICE9IGNjdyhiLCBjLCBkKSAmJiBjY3coYSwgYiwgYykgIT0gY2N3KGEsIGIsIGQpO1xcbn1cXG5cXG52ZWMyIGZsaXAoaW4gdmVjMiB2KSB7XFxuICAgIHJldHVybiB2ZWMyKHYueCwgMS4wIC0gdi55KTtcXG59XFxuXFxudmVjMiBhcHBseUNhbWVyYVRyYW5zZm9ybWF0aW9uKGluIHZlYzIgcG9pbnQpIHtcXG4gICAgcmV0dXJuIHBvaW50IC0gY2FtZXJhUG9zO1xcbn1cXG5cXG5mbG9hdCBhbmdsZUJldHdlZW4oaW4gZmxvYXQgc3RhcnQsIGluIGZsb2F0IGVuZClcXG57XFxuICAgIHJldHVybiBtb2QoZW5kIC0gc3RhcnQsIE1fUEkgKiAyLjApO1xcbn1cXG5cXG5ib29sIGlzQmV0d2VlbihpbiBmbG9hdCBzdGFydEFuZ2xlLCBpbiBmbG9hdCBlbmRBbmdsZSwgaW4gZmxvYXQgdGVzdEFuZ2xlKSB7XFxuICAgIGZsb2F0IGExID0gYWJzKGFuZ2xlQmV0d2VlbihzdGFydEFuZ2xlLCB0ZXN0QW5nbGUpKTtcXG4gICAgZmxvYXQgYTIgPSBhYnMoYW5nbGVCZXR3ZWVuKHRlc3RBbmdsZSwgZW5kQW5nbGUpKTtcXG4gICAgZmxvYXQgYTMgPSBhYnMoYW5nbGVCZXR3ZWVuKHN0YXJ0QW5nbGUsIGVuZEFuZ2xlKSk7XFxuICAgIHJldHVybiAoYTEgKyBhMikgLSBhMyA8IDEuMDtcXG59XFxuXFxudm9pZCBtYWluKCkge1xcbiAgICAvLyBwaXhlbCBzaXplIGluIHVuaXRzXFxuXFxuICAgIHZlYzIgcGl4ZWxTaXplID0gdmVjMigxLjApIC8gc2l6ZVB4Lnh5O1xcblxcbiAgICAvLyB2ZWMyIG1vdXNlUG9zID0gbW91c2UgKiBwaXhlbFNpemU7XFxuXFxuICAgIC8vIEN1cnJlbnQgcG9zaXRpb24gaW4gcGl4ZWxzXFxuICAgIHZlYzIgcGl4ZWxDb29yZCA9IGZsaXAodlRleHR1cmVDb29yZCkgLyBwaXhlbFNpemU7XFxuXFxuICAgIC8vIENvdW50ICYgdG90YWwgaW50ZW5zaXR5IG9mIGxpZ2h0IHNvdXJjZXMgdGhhdCBhZmZlY3QgdGhpcyBwb2ludFxcbiAgICB2ZWM0IGxpZ2h0VmFsdWUgPSB2ZWM0KDAuMCk7XFxuICAgIGZsb2F0IGxpZ2h0Q291bnQgPSAwLjA7XFxuXFxuICAgIC8vIHNvdXJjZXNbMF0gPSBtb3VzZTtcXG5cXG4gICAgZm9yIChpbnQgc291cmNlSW5kZXggPSAwOyBzb3VyY2VJbmRleCA8IDI1Njsgc291cmNlSW5kZXggKz0gMykge1xcbiAgICAgICAgLy8gTG9vcCB0aHJvdWdoIGxpZ2h0IHNvdXJjZXNcXG4gICAgICAgIGlmIChzb3VyY2VJbmRleCA+PSBzb3VyY2VzQ291bnQgKiAzKSB7XFxuICAgICAgICAgICAgYnJlYWs7XFxuICAgICAgICB9XFxuXFxuICAgICAgICBmb3IgKGZsb2F0IGR4ID0gMC4wOyBkeCA8IDEuMDsgZHggKz0gMS4wKSB7XFxuICAgICAgICAgICAgZm9yIChmbG9hdCBkeSA9IDAuMDsgZHkgPCAxLjA7IGR5ICs9IDEuMCkge1xcbiAgICAgICAgICAgICAgICB2ZWM0IHNvdXJjZSA9IHZlYzQoc291cmNlc1tzb3VyY2VJbmRleF0ueHkgKyB2ZWMyKGR4LCBkeSkgKiA4LjAsIHNvdXJjZXNbc291cmNlSW5kZXhdLnp3KTtcXG4gICAgICAgICAgICAgICAgdmVjNCBzb3VyY2VDb2xvciA9IHNvdXJjZXNbc291cmNlSW5kZXggKyAxXTtcXG4gICAgICAgICAgICAgICAgdmVjMiBzb3VyY2VBbmdsZSA9IHNvdXJjZXNbc291cmNlSW5kZXggKyAyXS54eTtcXG5cXG4gICAgICAgICAgICAgICAgLy8gRGlzdGFuY2UgZnJvbSBjdXJyZW50IGxpZ2h0IHNvdXJjZSB0byBjdXJyZW50IHBvaW50XFxuICAgICAgICAgICAgICAgIGZsb2F0IGRpc3RhbmNlRnJvbVNvdXJjZSA9IGRpc3RhbmNlKGFwcGx5Q2FtZXJhVHJhbnNmb3JtYXRpb24oc291cmNlLnh5KSwgYXBwbHlDYW1lcmFUcmFuc2Zvcm1hdGlvbihwaXhlbENvb3JkKSk7XFxuICAgICAgICAgICAgICAgIHZlYzIgb2Zmc2V0ID0gcGl4ZWxDb29yZCAtIHNvdXJjZS54eTtcXG4gICAgICAgICAgICAgICAgZmxvYXQgYW5nbGVGcm9tU291cmNlID0gYXRhbihvZmZzZXQueSwgb2Zmc2V0LngpO1xcblxcbiAgICAgICAgICAgICAgICBpZiAoZGVidWcpIHtcXG4gICAgICAgICAgICAgICAgICAgIC8vIERyYXcgbGlnaHQgcG9zaXRpb24gJiByYWRpdXNcXG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXN0YW5jZUZyb21Tb3VyY2UgPCA1LjApIHtcXG4gICAgICAgICAgICAgICAgICAgICAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KHNvdXJjZUNvbG9yLnh5eiwgMC4xKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XFxuICAgICAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgICAgICAgICBpZiAoYWJzKGRpc3RhbmNlRnJvbVNvdXJjZSAtIHNvdXJjZS56KSA8IDUuMCkge1xcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoc291cmNlQW5nbGUueCA9PSBzb3VyY2VBbmdsZS55KSB8fCBpc0JldHdlZW4oc291cmNlQW5nbGUueCwgc291cmNlQW5nbGUueSwgYW5nbGVGcm9tU291cmNlKSkge1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KHNvdXJjZUNvbG9yLngsIHNvdXJjZUNvbG9yLnksIHNvdXJjZUNvbG9yLnosIDAuMSk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcXG4gICAgICAgICAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgICAgICAgICAvLyBpZiAoc291cmNlQW5nbGUueCAhPSBzb3VyY2VBbmdsZS55KSB7XFxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKGFuZ2xlRnJvbVNvdXJjZSAtIChvZmZzZXQueCArIG9mZnNldC55KSAvIDIuMCA8IDIuMCkge1xcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KDAuMCwgMS4wLCAwLjAsIDEuMCk7XFxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxcbiAgICAgICAgICAgICAgICAgICAgLy8gfVxcbiAgICAgICAgICAgICAgICB9XFxuXFxuICAgICAgICAgICAgICAgIGlmIChkaXN0YW5jZUZyb21Tb3VyY2UgPiBzb3VyY2Uueikge1xcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XFxuICAgICAgICAgICAgICAgIH1cXG5cXG4gICAgICAgICAgICAgICAgaWYgKChzb3VyY2VBbmdsZS54ICE9IHNvdXJjZUFuZ2xlLnkpICYmICFpc0JldHdlZW4oc291cmNlQW5nbGUueCwgc291cmNlQW5nbGUueSwgYW5nbGVGcm9tU291cmNlKSkge1xcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XFxuICAgICAgICAgICAgICAgIH1cXG5cXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgc2VnbWVudCBiZXR3ZWVuIHRoaXMgcG9pbnQgYW5kIGN1cnJlbnQgbGlnaHQgc291cmNlXFxuICAgICAgICAgICAgICAgIC8vIGlzIGJsb2NrZWQgYnkgYW55IGZhY2VcXG4gICAgICAgICAgICAgICAgYm9vbCBpc1NvdXJjZUJsb2NrZWQgPSBmYWxzZTtcXG4gICAgICAgICAgICAgICAgZm9yIChpbnQgZmFjZUluZGV4ID0gMDsgZmFjZUluZGV4IDwgMjU2OyBmYWNlSW5kZXgrKykge1xcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZhY2VJbmRleCA+PSBmYWNlc0NvdW50KSB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XFxuICAgICAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgICAgICAgICBpZiAoaW50ZXJzZWN0cyhhcHBseUNhbWVyYVRyYW5zZm9ybWF0aW9uKHNvdXJjZS54eSksIHBpeGVsQ29vcmQsIGFwcGx5Q2FtZXJhVHJhbnNmb3JtYXRpb24oZmFjZXNbZmFjZUluZGV4XS54eSksIGFwcGx5Q2FtZXJhVHJhbnNmb3JtYXRpb24oZmFjZXNbZmFjZUluZGV4XS56dykpKSB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBsaWdodCBpcyBibG9ja2VkIGJ5IG9uZSBvZiB0aGUgZmFjZXMuXFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgZG9uJ3QgY291bnQgaXQuXFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNTb3VyY2VCbG9ja2VkID0gdHJ1ZTtcXG4gICAgICAgICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAgICAgfVxcblxcbiAgICAgICAgICAgICAgICBpZiAoIWlzU291cmNlQmxvY2tlZCkge1xcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3VycmVudCBsaWdodCBzb3VyY2UgYWZmZWN0ZWQgdGhpcyBwb2ludCwgbGV0J3MgaW5jcmVhc2VcXG4gICAgICAgICAgICAgICAgICAgIC8vIGxpZ2h0VmFsdWUgJiBsaWdodENvdW50IGZvciB0aGlzIHBvaW50XFxuICAgICAgICAgICAgICAgICAgICAvLyBiYXNlZCBvbiB0aGUgZGlzdGFuY2UgZnJvbSBsaWdodCBzb3VyY2UuXFxuICAgICAgICAgICAgICAgICAgICAvLyAoVGhlIGNsb3NlciB0byB0aGUgbGlnaHQgc291cmNlLCB0aGUgaGlnaGVyIHRoZSB2YWx1ZSlcXG4gICAgICAgICAgICAgICAgICAgIGZsb2F0IHJhZGl1cyA9IHNvdXJjZS56O1xcbiAgICAgICAgICAgICAgICAgICAgZmxvYXQgaW50ZW5zaXR5ID0gc291cmNlLnc7XFxuICAgICAgICAgICAgICAgICAgICBmbG9hdCB2YWwgPSBtYXgocmFkaXVzIC0gZGlzdGFuY2VGcm9tU291cmNlLCAwLjApIC8gcmFkaXVzICogaW50ZW5zaXR5O1xcbiAgICAgICAgICAgICAgICAgICAgbGlnaHRWYWx1ZSArPSB2YWwgKiBzb3VyY2VDb2xvcjtcXG4gICAgICAgICAgICAgICAgICAgIGxpZ2h0Q291bnQgKz0gMS4wO1xcbiAgICAgICAgICAgICAgICAgICAgLy8gdmFsID0gbWF4KHJhZGl1cyAtIGRpc3RhbmNlRnJvbVNvdXJjZSwgMC4wKSAvIHJhZGl1cztcXG4gICAgICAgICAgICAgICAgICAgIC8vIGdsX0ZyYWdDb2xvciA9IHZlYzQodmFsLCB2YWwsIHZhbCwgdmFsKTtcXG4gICAgICAgICAgICAgICAgICAgIC8vIHJldHVybjtcXG4gICAgICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIH1cXG4gICAgICAgIH1cXG4gICAgfVxcblxcbiAgICAvLyBsaWdodFZhbHVlIC89IDQuMDtcXG5cXG4gICAgLy8gTGV0J3MgY2FwIG1heGltdW0gbGlnaHRWYWx1ZSB0byAwLjUgdG8gcHJldmVudCB0b28gbXVjaCBsaWdodG5lc3NcXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNChtaW4obGlnaHRWYWx1ZS54LCAwLjc1KSwgbWluKGxpZ2h0VmFsdWUueSwgMC43NSksIG1pbihsaWdodFZhbHVlLnosIDAuNzUpLCBtaW4obGlnaHRWYWx1ZS53LCAwLjc1KSk7XFxuXFxuICAgIC8vIGdsX0ZyYWdDb2xvciA9IGxpZ2h0VmFsdWU7XFxufVxcblwiO1xuIiwiLy8gaW1wb3J0IHsgQmx1clNoYWRlciB9IGZyb20gJy4vc2hhZGVycyc7XG5cbmNvbnN0IGxpZ2h0RnJhZ1NvdXJjZSA9IHJlcXVpcmUoJy4vbGlnaHQuZnJhZycpO1xuY29uc3QgYmx1ckZyYWdTb3VyY2UgPSByZXF1aXJlKCcuL2JsdXIuZnJhZycpO1xuXG5leHBvcnQgY2xhc3MgTGlnaHRTeXN0ZW0ge1xuICAgIGNvbnN0cnVjdG9yKHcsIGgsIGRlYnVnKSB7XG4gICAgICAgIC8vIHRoaXMuc3ByaXRlID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDApO1xuICAgICAgICAvLyB0aGlzLncgPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICAgICAgLy8gdGhpcy5oID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgICAvLyB2YXIgc2NhbGUgPSA0O1xuICAgICAgICAvLyB0aGlzLncgPSB3aW5kb3cuaW5uZXJXaWR0aCAvIHNjYWxlO1xuICAgICAgICAvLyB0aGlzLmggPSB3aW5kb3cuaW5uZXJIZWlnaHQgLyBzY2FsZTtcbiAgICAgICAgdGhpcy53ID0gdyB8fCAyNTY7XG4gICAgICAgIHRoaXMuaCA9IGggfHwgMjU2O1xuICAgICAgICAvLyBUT0RPOiBNYWtlIGltYWdlIGludmlzaWJsZSAqcHJvcGVybHkqXG4gICAgICAgIC8vIHRoaXMuaW1hZ2UgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCk7XG4gICAgICAgIC8vIHRoaXMuaW1hZ2UgPSBuZXcgUGhhc2VyLkdyYXBoaWNzKGdhbWUsIDAsIDApO1xuICAgICAgICB0aGlzLmxpZ2h0VGV4dHVyZSA9IGdhbWUuYWRkLnJlbmRlclRleHR1cmUodGhpcy53LCB0aGlzLmgsICdsaWdodFRleHR1cmUnKTtcbiAgICAgICAgdGhpcy5saWdodEltYWdlID0gZ2FtZS5hZGQuaW1hZ2UoMTA0ODU3NiwgMTA0ODU3Nik7XG4gICAgICAgIHRoaXMubGlnaHRJbWFnZS53aWR0aCA9IHRoaXMudztcbiAgICAgICAgdGhpcy5saWdodEltYWdlLmhlaWdodCA9IHRoaXMuaDtcblxuICAgICAgICAvLyB0aGlzLmxpZ2h0SW1hZ2UuYmxlbmRNb2RlID0gMTtcblxuICAgICAgICAvLyB0aGlzLmxpZ2h0SW1hZ2UuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG4gICAgICAgIHRoaXMubGlnaHRJbWFnZS5zbW9vdGhlZCA9IHRydWU7XG4gICAgICAgIC8vIHRoaXMubGlnaHRJbWFnZS5yZW5kZXJhYmxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2NhbGVGYWN0b3IgPSBuZXcgUGhhc2VyLlBvaW50KFxuICAgICAgICAgICAgd2luZG93LmlubmVyV2lkdGggLyB0aGlzLncsXG4gICAgICAgICAgICB3aW5kb3cuaW5uZXJIZWlnaHQgLyB0aGlzLmhcbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLnJlbmRlcmVkSW1hZ2UgPSBnYW1lLmFkZC5pbWFnZSgwLCB3aW5kb3cuaW5uZXJIZWlnaHQsIHRoaXMubGlnaHRUZXh0dXJlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlZEltYWdlLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgIHRoaXMucmVuZGVyZWRJbWFnZS5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICAgIHRoaXMucmVuZGVyZWRJbWFnZS5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZW5kZXJlZEltYWdlLnNjYWxlLnkgKj0gLTE7XG4gICAgICAgIHRoaXMucmVuZGVyZWRJbWFnZS5zbW9vdGhlZCA9IHRydWU7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdJbml0aWFsIGxpZ2h0IHNwcml0ZSBzY2FsZTonLCB0aGlzLnNwcml0ZS5zY2FsZS54LCB0aGlzLnNwcml0ZS5zY2FsZS55KTtcbiAgICAgICAgLy8gdGhpcy5zcHJpdGUuc2NhbGUueCAqPSB0aGlzLnNjYWxlRmFjdG9yLng7XG4gICAgICAgIC8vIHRoaXMuc3ByaXRlLnNjYWxlLnkgKj0gdGhpcy5zY2FsZUZhY3Rvci55O1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnQ3JlYXRpbmcgbGlnaHQgc3ByaXRlLCBzaXplJywgdGhpcy53LCB0aGlzLmgsICdzY2FsZScsIHRoaXMuc2NhbGVGYWN0b3IueCwgdGhpcy5zY2FsZUZhY3Rvci55KTtcbiAgICAgICAgLy8gdGhpcy5zcHJpdGUud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICAgICAgLy8gdGhpcy5zcHJpdGUuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuXG4gICAgICAgIHRoaXMubGlnaHRGaWx0ZXJVbmlmb3JtcyA9IHtcbiAgICAgICAgICAgIHNpemVQeDoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICcyZnYnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBuZXcgRmxvYXQzMkFycmF5KFtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmlubmVyV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5pbm5lckhlaWdodFxuICAgICAgICAgICAgICAgIF0pXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2NhbGVGYWN0b3I6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnMmZ2JyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbmV3IEZsb2F0MzJBcnJheShbXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVGYWN0b3IueCxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY2FsZUZhY3Rvci55XG4gICAgICAgICAgICAgICAgXSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzb3VyY2VzOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJzRmdicsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG5ldyBGbG9hdDMyQXJyYXkoW10pXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc291cmNlc0NvdW50OiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJzFpJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZhY2VzOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJzRmdicsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG5ldyBGbG9hdDMyQXJyYXkoW10pXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmFjZXNDb3VudDoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICcxaScsXG4gICAgICAgICAgICAgICAgdmFsdWU6IDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjYW1lcmFQb3M6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnMmZ2JyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbmV3IEZsb2F0MzJBcnJheShbMCwgMF0pXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVidWc6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnMWknLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAhIWRlYnVnXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5ibHVyRmlsdGVyVW5pZm9ybXMgPSB7XG4gICAgICAgICAgICBzaXplUHg6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnMmZ2JyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbmV3IEZsb2F0MzJBcnJheShbXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5pbm5lcldpZHRoLFxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuaW5uZXJIZWlnaHRcbiAgICAgICAgICAgICAgICBdKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxpZ2h0RmlsdGVyID0gbmV3IFBoYXNlci5GaWx0ZXIoXG4gICAgICAgICAgICBnYW1lLFxuICAgICAgICAgICAgdGhpcy5saWdodEZpbHRlclVuaWZvcm1zLFxuICAgICAgICAgICAgbGlnaHRGcmFnU291cmNlXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMubGlnaHRGaWx0ZXIuc2V0UmVzb2x1dGlvbih0aGlzLncsIHRoaXMuaCk7XG4gICAgICAgIC8vIHRoaXMuYmx1clNoYWRlciA9IG5ldyBCbHVyU2hhZGVyKHRoaXMudywgdGhpcy5oKTtcbiAgICAgICAgLy8gdGhpcy5saWdodEltYWdlLmZpbHRlcnMgPSBbdGhpcy5maWx0ZXIsIHRoaXMuYmx1clNoYWRlci5nZXRGaWx0ZXIoKV07XG4gICAgICAgIHRoaXMuYmx1ckZpbHRlciA9IG5ldyBQaGFzZXIuRmlsdGVyKGdhbWUsIHRoaXMuYmx1ckZpbHRlclVuaWZvcm1zLCBibHVyRnJhZ1NvdXJjZSk7XG4gICAgICAgIHRoaXMubGlnaHRJbWFnZS5maWx0ZXJzID0gW3RoaXMubGlnaHRGaWx0ZXIsIHRoaXMuYmx1ckZpbHRlcl07XG4gICAgICAgIC8vIHRoaXMucmVuZGVyZWRJbWFnZS5maWx0ZXJzID0gW3RoaXMuYmx1clNoYWRlci5nZXRGaWx0ZXIoKV07XG5cbiAgICAgICAgdGhpcy5saWdodFNvdXJjZXMgPSBbXTtcbiAgICAgICAgdGhpcy5vYmplY3RzID0gW107XG4gICAgfVxuXG4gICAgYWRkTGlnaHRTb3VyY2UobGlnaHRTb3VyY2UpIHtcbiAgICAgICAgdGhpcy5saWdodFNvdXJjZXMucHVzaChsaWdodFNvdXJjZSk7XG4gICAgICAgIC8vIHRoaXMuX3VwZGF0ZUxpZ2h0U291cmNlc1VuaWZvcm1zKCk7XG4gICAgfVxuXG4gICAgcmVtb3ZlTGlnaHRTb3VyY2UobGlnaHRTb3VyY2UpIHtcbiAgICAgICAgbGV0IGluZGV4ID0gdGhpcy5saWdodFNvdXJjZXMuaW5kZXhPZihsaWdodFNvdXJjZSk7XG4gICAgICAgIHRoaXMubGlnaHRTb3VyY2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIC8vIHRoaXMuX3VwZGF0ZUxpZ2h0U291cmNlc1VuaWZvcm1zKCk7XG4gICAgfVxuXG4gICAgYWRkT2JqZWN0KG9iaikge1xuICAgICAgICB0aGlzLm9iamVjdHMucHVzaChvYmopO1xuICAgICAgICAvLyB0aGlzLl91cGRhdGVGYWNlc1VuaWZvcm1zKCk7XG4gICAgfVxuXG4gICAgcmVtb3ZlT2JqZWN0KG9iaikge1xuICAgICAgICBsZXQgaW5kZXggPSB0aGlzLm9iamVjdHMuaW5kZXhPZihvYmopO1xuICAgICAgICB0aGlzLm9iamVjdHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgLy8gdGhpcy5fdXBkYXRlRmFjZXNVbmlmb3JtcygpO1xuICAgIH1cblxuICAgIHJlbW92ZUFsbCgpIHtcbiAgICAgICAgdGhpcy5saWdodFNvdXJjZXMgPSBbXVxuICAgICAgICB0aGlzLm9iamVjdHMgPSBbXTtcbiAgICAgICAgLy8gdGhpcy5fdXBkYXRlTGlnaHRTb3VyY2VzVW5pZm9ybXMoKTtcbiAgICAgICAgLy8gdGhpcy5fdXBkYXRlRmFjZXNVbmlmb3JtcygpO1xuICAgIH1cblxuICAgIHVwZGF0ZUxpZ2h0U291cmNlc1VuaWZvcm1zKCkge1xuICAgICAgICB0aGlzLmxpZ2h0RmlsdGVyVW5pZm9ybXMuc291cmNlcy52YWx1ZSA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICAgICAgICB0aGlzLmxpZ2h0U291cmNlcy5yZWR1Y2UoKHIsIHgpID0+IHIuY29uY2F0KHguZ2V0QXJyYXkodGhpcy5zY2FsZUZhY3RvcikpLCBbXSlcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5saWdodEZpbHRlclVuaWZvcm1zLnNvdXJjZXNDb3VudC52YWx1ZSA9IHRoaXMubGlnaHRTb3VyY2VzLmxlbmd0aDtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ1VwZGF0aW5nIGxpZ2h0IHNvdXJjZXMgdW5pZm9ybXMsIGNvdW50ID0nLCB0aGlzLmxpZ2h0RmlsdGVyLnVuaWZvcm1zLnNvdXJjZXNDb3VudC52YWx1ZSk7XG4gICAgfVxuXG4gICAgdXBkYXRlRmFjZXNVbmlmb3JtcygpIHtcbiAgICAgICAgdGhpcy5saWdodEZpbHRlclVuaWZvcm1zLmZhY2VzLnZhbHVlID0gbmV3IEZsb2F0MzJBcnJheShcbiAgICAgICAgICAgIHRoaXMub2JqZWN0cy5yZWR1Y2UoKHIsIHgpID0+IHIuY29uY2F0KHguZ2V0QXJyYXkodGhpcy5zY2FsZUZhY3RvcikpLCBbXSlcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5saWdodEZpbHRlclVuaWZvcm1zLmZhY2VzQ291bnQudmFsdWUgPSB0aGlzLmxpZ2h0RmlsdGVyVW5pZm9ybXMuZmFjZXMudmFsdWUubGVuZ3RoIC8gNDtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ1VwZGF0aW5nIGZhY2VzIHVuaWZvcm1zLCBjb3VudCA9JywgdGhpcy5saWdodEZpbHRlci51bmlmb3Jtcy5mYWNlc0NvdW50LnZhbHVlKTtcbiAgICB9XG5cbiAgICB1cGRhdGVVbmlmb3JtcygpIHtcbiAgICAgICAgdGhpcy51cGRhdGVMaWdodFNvdXJjZXNVbmlmb3JtcygpO1xuICAgICAgICB0aGlzLnVwZGF0ZUZhY2VzVW5pZm9ybXMoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVDYW1lcmFQb3MocG9pbnQpIHtcbiAgICAgICAgdGhpcy5saWdodEZpbHRlclVuaWZvcm1zLmNhbWVyYVBvcy52YWx1ZSA9IG5ldyBGbG9hdDMyQXJyYXkoW1xuICAgICAgICAgICAgLy8gcG9pbnQueCAvIHRoaXMuc2NhbGVGYWN0b3IueCxcbiAgICAgICAgICAgIC8vIHBvaW50LnkgLyB0aGlzLnNjYWxlRmFjdG9yLnlcbiAgICAgICAgICAgIHBvaW50LngsXG4gICAgICAgICAgICBwb2ludC55XG4gICAgICAgIF0pO1xuICAgIH1cblxuICAgIHNldERlYnVnKGVuYWJsZSkge1xuICAgICAgICB0aGlzLmxpZ2h0RmlsdGVyVW5pZm9ybXMuZGVidWcudmFsdWUgPSAhIWVuYWJsZTtcbiAgICB9XG5cbiAgICB1cGRhdGUoKSB7XG4gICAgICAgIHRoaXMubGlnaHRGaWx0ZXIudXBkYXRlKCk7XG4gICAgICAgIHRoaXMuYmx1ckZpbHRlci51cGRhdGUoKTtcbiAgICAgICAgdGhpcy5saWdodFRleHR1cmUucmVuZGVyWFkodGhpcy5saWdodEltYWdlLCAwLCAwLCB0cnVlKTtcbiAgICAgICAgLy8gdGhpcy5pbWFnZS5zZXRUZXh0dXJlKHRoaXMuaW1hZ2UuZ2VuZXJhdGVUZXh0dXJlKDEsIFBJWEkuc2NhbGVNb2Rlcy5MSU5FQVIsIGdhbWUucmVuZGVyZXIpKTtcbiAgICB9XG5cbiAgICBkZXN0cm95KCkge1xuICAgICAgICAvLyBUT0RPOiBgZGVzdHJveWAgb3IgYHJlbW92ZWA/XG4gICAgICAgIHRoaXMubGlnaHRGaWx0ZXIuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLmJsdXJTaGFkZXIuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLmltYWdlLmRlc3Ryb3koKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBMaWdodFNvdXJjZSB7XG4gICAgY29uc3RydWN0b3IocG9zaXRpb24sIHJhZGl1cywgaW50ZW5zaXR5LCBjb2xvciwgYW5nbGVTdGFydCwgYW5nbGVFbmQpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgICAgICB0aGlzLnJhZGl1cyA9IHJhZGl1cztcbiAgICAgICAgdGhpcy5pbnRlbnNpdHkgPSBpbnRlbnNpdHk7XG4gICAgICAgIHRoaXMuY29sb3IgPSBjb2xvcjtcbiAgICAgICAgdGhpcy5fYW5nbGVTdGFydCA9IGFuZ2xlU3RhcnQgfHwgMDtcbiAgICAgICAgdGhpcy5fYW5nbGVFbmQgPSBhbmdsZUVuZCB8fCAwO1xuICAgICAgICB0aGlzLnNldFJvdGF0aW9uKDApO1xuICAgIH1cblxuICAgIGdldEFycmF5KHNjYWxlRmFjdG9yKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uLngsIC8vIC8gc2NhbGVGYWN0b3IueCxcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb24ueSwgLy8gLyBzY2FsZUZhY3Rvci55LFxuICAgICAgICAgICAgdGhpcy5yYWRpdXMsXG4gICAgICAgICAgICB0aGlzLmludGVuc2l0eSxcbiAgICAgICAgICAgIHRoaXMuY29sb3JbMF0sXG4gICAgICAgICAgICB0aGlzLmNvbG9yWzFdLFxuICAgICAgICAgICAgdGhpcy5jb2xvclsyXSxcbiAgICAgICAgICAgIHRoaXMuY29sb3JbM10sXG4gICAgICAgICAgICB0aGlzLmFuZ2xlU3RhcnQsXG4gICAgICAgICAgICB0aGlzLmFuZ2xlRW5kLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICBzZXRSb3RhdGlvbihyb3RhdGlvbikge1xuICAgICAgICBpZiAodGhpcy5fYW5nbGVTdGFydCA9PSAwICYmIHRoaXMuX2FuZGxlRW5kID09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucm90YXRpb24gPSByb3RhdGlvbjtcbiAgICAgICAgdGhpcy5hbmdsZVN0YXJ0ID0gKHRoaXMuX2FuZ2xlU3RhcnQgKyB0aGlzLnJvdGF0aW9uKSAlIChNYXRoLlBJICogMik7XG4gICAgICAgIHRoaXMuYW5nbGVFbmQgPSAodGhpcy5fYW5nbGVFbmQgKyB0aGlzLnJvdGF0aW9uKSAlIChNYXRoLlBJICogMik7XG5cbiAgICAgICAgaWYgKHRoaXMuYW5nbGVTdGFydCA8IDApIHtcbiAgICAgICAgICAgIHRoaXMuYW5nbGVTdGFydCArPSBNYXRoLlBJICogMjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5hbmdsZUVuZCA8IDApIHtcbiAgICAgICAgICAgIHRoaXMuYW5nbGVFbmQgKz0gTWF0aC5QSSAqIDI7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBMaWdodGVkT2JqZWN0IHtcbiAgICBjb25zdHJ1Y3Rvcihwb2ludHMpIHtcbiAgICAgICAgdGhpcy5wb2ludHMgPSBwb2ludHM7XG4gICAgfVxuXG4gICAgZ2V0QXJyYXkoc2NhbGVGYWN0b3IpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIHZhciBwb2ludHMgPSB0aGlzLnBvaW50cztcblxuICAgICAgICBpZiAocG9pbnRzLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgIHBvaW50cyA9IHBvaW50cy5jb25jYXQoW3BvaW50c1swXV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcG9pbnRzLmZvckVhY2goKHBvaW50LCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFpbmRleCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgW1xuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRzW2luZGV4IC0gMV0ueCwgLy8gLyBzY2FsZUZhY3Rvci54LFxuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRzW2luZGV4IC0gMV0ueSwgLy8gLyBzY2FsZUZhY3Rvci55LFxuICAgICAgICAgICAgICAgIHBvaW50LngsIC8vIC8gc2NhbGVGYWN0b3IueCxcbiAgICAgICAgICAgICAgICBwb2ludC55LCAvLyAvIHNjYWxlRmFjdG9yLnlcbiAgICAgICAgICAgIF0pO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGdldEZhY2VzQ291bnQoKSB7XG4gICAgICAgIGlmICh0aGlzLnBvaW50cy5sZW5ndGggPCAzKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBvaW50cy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmlmICh3aW5kb3cpIHtcbiAgICB3aW5kb3cuTGlnaHRTeXN0ZW0gPSBMaWdodFN5c3RlbTtcbiAgICB3aW5kb3cuTGlnaHRTb3VyY2UgPSBMaWdodFNvdXJjZTtcbiAgICB3aW5kb3cuTGlnaHRlZE9iamVjdCA9IExpZ2h0ZWRPYmplY3Q7XG59XG4iXX0=
