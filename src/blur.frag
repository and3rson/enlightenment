#define RADIUS 2.0
#define STEP 1.0

precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec2 sizePx;

void main() {
    vec4 color = vec4(0);

    vec2 pixelSize = vec2(1.0) / sizePx.xy * 4.0;

    for (float x = -RADIUS; x <= RADIUS; x += 1.0) {
        for (float y = -RADIUS; y <= RADIUS; y += 1.0) {
            color += texture2D(uSampler, vTextureCoord - vec2(pixelSize.x * x * STEP, pixelSize.y * y * STEP));
        }
    }

    gl_FragColor = color / pow(RADIUS * 2.0 + 1.0, 2.0);
}
