precision mediump float;

#define M_PI 3.1415926535897932384626433832795

varying vec2 vTextureCoord;
uniform vec2 sizePx;

uniform vec4 sources[16];
uniform int sourcesCount;
uniform vec2 mouse;

uniform vec4 faces[16];
uniform int facesCount;

uniform vec2 cameraPos;
uniform vec2 scaleFactor;

uniform bool debug;

bool ccw(in vec2 a, in vec2 b, in vec2 c) {
    // Checks if three vectors are placed in a CCW order
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
}

bool intersects(in vec2 a, in vec2 b, in vec2 c, in vec2 d) {
    // Fast intersection check based on vertex order
    return ccw(a, c, d) != ccw(b, c, d) && ccw(a, b, c) != ccw(a, b, d);
}

vec2 flip(in vec2 v) {
    return vec2(v.x, 1.0 - v.y);
}

vec2 applyCameraTransformation(in vec2 point) {
    return point - cameraPos;
}

float angleBetween(in float start, in float end)
{
    return mod(end - start, M_PI * 2.0);
}

bool isBetween(in float startAngle, in float endAngle, in float testAngle) {
    float a1 = abs(angleBetween(startAngle, testAngle));
    float a2 = abs(angleBetween(testAngle, endAngle));
    float a3 = abs(angleBetween(startAngle, endAngle));
    return (a1 + a2) - a3 < 1.0;
}

void main() {
    // pixel size in units

    vec2 pixelSize = vec2(1.0) / sizePx.xy;

    // vec2 mousePos = mouse * pixelSize;

    // Current position in pixels
    vec2 pixelCoord = flip(vTextureCoord) / pixelSize;

    // Count & total intensity of light sources that affect this point
    vec4 lightValue = vec4(0.0);
    float lightCount = 0.0;

    // sources[0] = mouse;

    for (int sourceIndex = 0; sourceIndex < 256; sourceIndex += 3) {
        // Loop through light sources
        if (sourceIndex >= sourcesCount * 3) {
            break;
        }

        for (float dx = 0.0; dx < 1.0; dx += 1.0) {
            for (float dy = 0.0; dy < 1.0; dy += 1.0) {
                vec4 source = vec4(sources[sourceIndex].xy + vec2(dx, dy) * 8.0, sources[sourceIndex].zw);
                vec4 sourceColor = sources[sourceIndex + 1];
                vec2 sourceAngle = sources[sourceIndex + 2].xy;

                // Distance from current light source to current point
                float distanceFromSource = distance(applyCameraTransformation(source.xy), applyCameraTransformation(pixelCoord));
                vec2 offset = pixelCoord - source.xy;
                float angleFromSource = atan(offset.y, offset.x);

                if (debug) {
                    // Draw light position & radius
                    if (distanceFromSource < 5.0) {
                        gl_FragColor = vec4(sourceColor.xyz, 0.1);
                        return;
                    }
                    if (abs(distanceFromSource - source.z) < 5.0) {
                        if ((sourceAngle.x == sourceAngle.y) || isBetween(sourceAngle.x, sourceAngle.y, angleFromSource)) {
                            gl_FragColor = vec4(sourceColor.x, sourceColor.y, sourceColor.z, 0.1);
                            return;
                        }
                    }
                    // if (sourceAngle.x != sourceAngle.y) {
                    //     if (angleFromSource - (offset.x + offset.y) / 2.0 < 2.0) {
                    //         gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
                    //     }
                    // }
                }

                if (distanceFromSource > source.z) {
                    continue;
                }

                if ((sourceAngle.x != sourceAngle.y) && !isBetween(sourceAngle.x, sourceAngle.y, angleFromSource)) {
                    continue;
                }

                // Check if segment between this point and current light source
                // is blocked by any face
                bool isSourceBlocked = false;
                for (int faceIndex = 0; faceIndex < 256; faceIndex++) {
                    if (faceIndex >= facesCount) {
                        break;
                    }
                    if (intersects(applyCameraTransformation(source.xy), pixelCoord, applyCameraTransformation(faces[faceIndex].xy), applyCameraTransformation(faces[faceIndex].zw))) {
                        // This light is blocked by one of the faces.
                        // We don't count it.
                        isSourceBlocked = true;
                    }
                }

                if (!isSourceBlocked) {
                    // Current light source affected this point, let's increase
                    // lightValue & lightCount for this point
                    // based on the distance from light source.
                    // (The closer to the light source, the higher the value)
                    float radius = source.z;
                    float intensity = source.w;
                    float val = max(radius - distanceFromSource, 0.0) / radius * intensity;
                    lightValue += val * sourceColor;
                    lightCount += 1.0;
                    // val = max(radius - distanceFromSource, 0.0) / radius;
                    // gl_FragColor = vec4(val, val, val, val);
                    // return;
                }
            }
        }
    }

    // lightValue /= 4.0;

    // Let's cap maximum lightValue to 0.5 to prevent too much lightness
    gl_FragColor = vec4(min(lightValue.x, 0.75), min(lightValue.y, 0.75), min(lightValue.z, 0.75), min(lightValue.w, 0.75));

    // gl_FragColor = lightValue;
}
