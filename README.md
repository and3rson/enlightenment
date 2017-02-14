# Enlightenment

A simple yet fast light engine for Phaser (WebGL render).

# Example

![Screenshot](http://i.imgur.com/74vkxas.jpg)

# Demo

Check out the demo [here](https://and3rson.github.io/enlightenment/)!

# Usage

Enlightenment consists of 3 main classes:

## `LightSystem` class

This is the main class that you need to instantiate in order to spawn necessary shaders & render images.

    var lightSystem = new LightSystem(WIDTH, HEIGHT, DEBUG);
    // - WIDTH, HEIGHT: size of the off-screen image used to render the light map.
    // The higher the resolution - the better the quality. I recommend using 256x256 as larger values have significant impact on the performance.
    // - DEBUG: set to true to draw debug stuff.

    // Call this in your `update` method:
    lightSystem.update();

    // You *must* call this every time you add/move/remove lights or objects:
    lightSystem.updateUniforms();

## `LightSource` class

Represents a source of light. Has color, radius and strength.

    var lightSource1 = new LightSource(new Phaser.Point(X, Y), RADIUS, INTENSITY, [RED, GREEN, BLUE, ALPHA]);
    // - X, Y: position of light source.
    // - RADIUS: radius of image.
    // - INTENSITY: how intensive is the light. 0 < INTENSITY <= 1
    // - RED, GREEN, BLUE, ALPHA - color of the light.

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

## `LightedObject` class

Represents an object that is "lighted", i. e. blocks light rays that are cast by light sources.

    var lightedObject1 = new LightedObject([ARRAY_OF_POINTS]);
    // - ARRAY_OF_POINTS: array of `Phaser.Point` intances.

    // Add lighted object to scene
    lightSystem.addLightedObject(lightedObject1);
    lightSystem.updateUniforms();

    // Remove lighted object to scene
    lightSystem.removeLightedObject(lightedObject1);
    lightSystem.updateUniforms();

    // TODO: move & rotate lighted object

## Controlling the camera

You would probably want the light system to know where your camera is. Here's how you do it:

    // ...in your `update` method:
    lightSystem.updateCamera(new Phaser.Point(X, Y));
    // - X, Y: camera position.

    // You *must* call these after any changes to light sources, lighted objects or camera.
    lightSystem.updateUniforms();
    lightSystem.update();

# Roadmap

- Rotating the camera
- Moving & rotating `LightedObject`s

# About & cntributing

My name is Andrew Dunai, and I like nice stuff.

I'm open to ideas, suggestions & contributions.

Please open a GitHub issue if you have something to say.

# License

The license is MIT.
