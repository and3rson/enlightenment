# Enlightenment

A simple yet fast light engine for Phaser (WebGL render).

# Example

![Screenshot](http://i.imgur.com/d9XeWld.jpg)

# Demo

Check out the demo [here](https://and3rson.github.io/enlightenment/)!

# Usage

Enlightenment consists of 3 main classes:

## `LightSystem` class

### `LightSystem([WIDTH, [HEIGHT, [DEBUG]]])`

This is the main class that you need to instantiate in order to spawn necessary shaders & render images.

- WIDTH/HEIGHT (optional): size of the off-screen image used to render the light map. The higher the resolution - the better the quality. I recommend using 256x256 as larger values have significant impact on the performance.
- DEBUG (optional): set to true to draw debug stuff.

```javascript
// Create light system
var lightSystem = new LightSystem(256, 256, true);

// Call this in your `update` method:
lightSystem.update();

// You *must* call this every time you add/move/remove lights or objects:
lightSystem.updateUniforms();
```

## `LightSource` class

### `LightSource(POSITION, RADIUS, INTENSITY, COLOR, [ANGLE_START, ANGLE_END])`

Represents a source of light. Has color, radius, strength and optional direction.

- POSITION: position of light source, must be instance of `Phaser.Point`
- RADIUS: radius of image.
- INTENSITY: how intensive is the light. 0 < INTENSITY <= 1
- COLOR: color of the light.
- ANGLE_START, ANGLE_END (optional): direction of the light cone. Defaults to `0, 0`. If not provided (i. e. bot values set to zero), the light will be emitted in all directions, otherwise the light will become directional and will be capped to provided angles.

```javascript
// Create light source
var lightSource1 = new LightSource(new Phaser.Point(200, 300), 500, 0.5, [1, 0, 0, 1]);

// Add light to scene
lightSystem.addLightSource(lightSource1);
lightSystem.updateUniforms();

// You can move it:
lightSource1.position.x = 100;
lightSource1.position.y = 200;
lightSystem.updateUniforms();

// ...or remove it:
lightSystem.removeLightSource(lightSource1);
lightSystem.updateUniforms();
```

## `LightedObject` class

### `LightedObject(POINTS)`

Represents an object that is "lighted", i. e. blocks light rays that are cast by light sources.

- ARRAY_OF_POINTS: array of `Phaser.Point` intances.

```javascript
// Create lighted object
var lightedObject1 = new LightedObject([ARRAY_OF_POINTS]);

// Add lighted object to scene
lightSystem.addLightedObject(lightedObject1);
lightSystem.updateUniforms();

// Remove lighted object to scene
lightSystem.removeLightedObject(lightedObject1);
lightSystem.updateUniforms();

// TODO: move & rotate lighted object
```

## Controlling the camera

You would probably want the light system to know where your camera is. Here's how you do it:

```javascript
// ...in your `update` method:
lightSystem.updateCamera(new Phaser.Point(X, Y));
// - X, Y: camera position.

// You *must* call these after any changes to light sources, lighted objects or camera.
lightSystem.updateUniforms();
lightSystem.update();
```

## Rotating the light source

Directional lights can be rotated using `setRotation(ANGLE_IN_RADIANS)` method:

```javascript
lightSource1.setRotation(Math.PI / 2); // Rotates light by 90 degrees
lightSource1.setRotation(Math.PI / 2); // Does not do anything, the light is already at the same rotation
lightSource1.setRotation(Math.PI / 4); // Rotates light by -45 degrees so that now it is at 45 degrees
lightSource1.setRotation(Math.PI); // Rotates light by 135 degrees so that not it is at 180 degrees
```

# Roadmap

- Rotating the camera
- Moving & rotating `LightedObject`s
- Blurred edges (WIP)

# About & cntributing

My name is Andrew Dunai, and I like nice stuff.

I'm open to ideas, suggestions & contributions.

Please open a GitHub issue if you have something to say.

# License

The license is MIT.
