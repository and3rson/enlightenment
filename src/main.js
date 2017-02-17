const lightFragSource = require('./light.frag');
const blurFragSource = require('./blur.frag');

export class LightSystem {
    constructor(w, h, debug) {
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
        this.scaleFactor = new Phaser.Point(
            window.innerWidth / this.w,
            window.innerHeight / this.h
        );

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
                value: new Float32Array([
                    window.innerWidth,
                    window.innerHeight
                ])
            },
            scaleFactor: {
                type: '2fv',
                value: new Float32Array([
                    this.scaleFactor.x,
                    this.scaleFactor.y
                ])
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
                value: new Float32Array([
                    window.innerWidth,
                    window.innerHeight
                ])
            },
        };

        this.lightFilter = new Phaser.Filter(
            game,
            this.lightFilterUniforms,
            lightFragSource
        );
        this.lightFilter.setResolution(this.w, this.h);
        this.blurFilter = new Phaser.Filter(game, this.blurFilterUniforms, blurFragSource);
        this.lightImage.filters = [this.lightFilter, this.blurFilter];

        this.lightSources = [];
        this.objects = [];

        console.log('Light shader info:');

        window.setTimeout(() => {
            this.printFilterInfo(this.lightFilter);
        }, 0);
    }

    getProgramInfo(gl, program) {
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
        for (var i=0; i < activeUniforms; i++) {
            var uniform = gl.getActiveUniform(program, i);
            uniform.typeName = enums[uniform.type];
            result.uniforms.push(uniform);
            result.uniformCount += uniform.size;
        }

        // Loop through active attributes
        for (var i=0; i < activeAttributes; i++) {
            var attribute = gl.getActiveAttrib(program, i);
            attribute.typeName = enums[attribute.type];
            result.attributes.push(attribute);
            result.attributeCount += attribute.size;
        }

        return result;
    }

    printFilterInfo(filter) {
        var shader = filter.shaders[0];
        var programInfo = this.getProgramInfo(shader.gl, shader.program);
        console.table(programInfo.attributes);
        console.table(programInfo.uniforms);
    }

    addLightSource(lightSource) {
        this.lightSources.push(lightSource);
        // this._updateLightSourcesUniforms();
    }

    removeLightSource(lightSource) {
        let index = this.lightSources.indexOf(lightSource);
        this.lightSources.splice(index, 1);
        // this._updateLightSourcesUniforms();
    }

    addObject(obj) {
        this.objects.push(obj);
        // this._updateFacesUniforms();
    }

    removeObject(obj) {
        let index = this.objects.indexOf(obj);
        this.objects.splice(index, 1);
        // this._updateFacesUniforms();
    }

    removeAll() {
        this.lightSources = []
        this.objects = [];
        // this._updateLightSourcesUniforms();
        // this._updateFacesUniforms();
    }

    updateLightSourcesUniforms() {
        this.lightFilterUniforms.sources.value = new Float32Array(
            this.lightSources.reduce((r, x) => r.concat(x.getArray(this.scaleFactor)), [])
        );
        this.lightFilterUniforms.sourcesCount.value = this.lightSources.length;
        // console.log('Updating light sources uniforms, count =', this.lightFilter.uniforms.sourcesCount.value);
    }

    updateFacesUniforms() {
        this.lightFilterUniforms.faces.value = new Float32Array(
            this.objects.reduce((r, x) => r.concat(x.getArray(this.scaleFactor)), [])
        );
        this.lightFilterUniforms.facesCount.value = this.lightFilterUniforms.faces.value.length / 4;
        // console.log('Updating faces uniforms, count =', this.lightFilter.uniforms.facesCount.value);
    }

    updateUniforms() {
        this.updateLightSourcesUniforms();
        this.updateFacesUniforms();
    }

    updateCameraPos(point) {
        this.lightFilterUniforms.cameraPos.value = new Float32Array([
            // point.x / this.scaleFactor.x,
            // point.y / this.scaleFactor.y
            point.x,
            point.y
        ]);
    }

    setDebug(enable) {
        this.lightFilterUniforms.debug.value = !!enable;
    }

    update() {
        this.lightFilter.update();
        this.blurFilter.update();
        this.lightTexture.renderXY(this.lightImage, 0, 0, true);
        // this.image.setTexture(this.image.generateTexture(1, PIXI.scaleModes.LINEAR, game.renderer));
    }

    destroy() {
        // TODO: `destroy` or `remove`?
        this.lightFilter.destroy();
        this.blurFilter.destroy();
        this.image.destroy();
    }
}

export class LightSource {
    constructor(position, radius, intensity, color, angleStart, angleEnd) {
        this.position = position;
        this.radius = radius;
        this.intensity = intensity;
        this.color = color;
        this._angleStart = angleStart || 0;
        this._angleEnd = angleEnd || 0;
        this.setRotation(0);
    }

    getArray(scaleFactor) {
        return [
            this.position.x, // / scaleFactor.x,
            this.position.y, // / scaleFactor.y,
            this.radius,
            this.intensity,
            this.color[0],
            this.color[1],
            this.color[2],
            this.color[3],
            this.angleStart,
            this.angleEnd,
            0,
            0
        ];
    }

    setRotation(rotation) {
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
}

export class LightedObject {
    constructor(points) {
        this.points = points;
    }

    getArray(scaleFactor) {
        var result = [];

        var points = this.points;

        if (points.length > 2) {
            points = points.concat([points[0]]);
        }

        points.forEach((point, index) => {
            if (!index) {
                return;
            }
            result.push.apply(result, [
                this.points[index - 1].x, // / scaleFactor.x,
                this.points[index - 1].y, // / scaleFactor.y,
                point.x, // / scaleFactor.x,
                point.y, // / scaleFactor.y
            ]);
        });

        return result;
    }

    getFacesCount() {
        if (this.points.length < 3) {
            return 1;
        } else {
            return this.points.length;
        }
    }
}

if (window) {
    window.LightSystem = LightSystem;
    window.LightSource = LightSource;
    window.LightedObject = LightedObject;
}
