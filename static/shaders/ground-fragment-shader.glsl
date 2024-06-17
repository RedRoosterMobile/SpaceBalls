
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vUv;

uniform sampler2D diffuseTexture;
uniform vec2 resolution;

float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

float hash(vec2 p)  // replace this by something better
{
    p  = 50.0*fract( p*0.3183099 + vec2(0.71,0.113));
    return -1.0+2.0*fract( p.x*p.y*(p.x+p.y) );
}

void main() {

  vec2 uv = gl_FragCoord.xy / resolution.xy;

vec3 COLOUR_LIGHT_BLUE = vec3(0.42, 0.65, 0.85);
vec3 COLOUR_BRIGHT_BLUE = vec3(0.01, 0.2, 1.0);
vec3 COLOUR_DARK_YELLOW = vec3(0.25, 0.25, 0.0625);

  float blueT = pow(
      smoothstep(0.0, 1.0, uv.y) * smoothstep(1.0, 0.0, uv.x), 0.5);
  float yellowT = 1.0 - pow(
      smoothstep(0.0, 1.0, uv.y) * smoothstep(1.0, 0.0, uv.x), 0.1);
  float blackT = 1.0 - pow(
      smoothstep(0.0, 0.5, uv.x) * smoothstep(1.0, 0.5, uv.y), 0.2);
  blackT *= smoothstep(0.0, 1.0, uv.y) * smoothstep(1.0, 0.0, uv.x);

  vec3 skyColour = mix(COLOUR_LIGHT_BLUE, COLOUR_BRIGHT_BLUE, blueT);
  skyColour = mix(skyColour, COLOUR_DARK_YELLOW, yellowT * 0.75);
  skyColour = mix(skyColour, vec3(0.0), blackT * 0.75);


  // Grid
  float grid1 = texture(diffuseTexture, vWorldPosition.xz * 0.1).r;
	float grid2 = texture(diffuseTexture, vWorldPosition.xz * 1.0).r;

	float gridHash1 = hash(floor(vWorldPosition.xz * 1.0));

	vec3 gridColour = mix(
      vec3(0.5 + remap(gridHash1, -1.0, 1.0, -0.2, 0.2)),
      vec3(0.0625),
      grid2);
	gridColour = mix(gridColour, vec3(0.00625), grid1);

  vec3 colour = gridColour * 0.0625;

  // Calculate silly fake fog
	float fogDepth = length(vWorldPosition - cameraPosition);

  float SKY_fogScatterDensity = 0.0025;
  float SKY_fogExtinctionDensity = 0.00375;

	float fogScatterFactor = exp(-SKY_fogScatterDensity * fogDepth);
	float fogExtinctionFactor = exp(-SKY_fogExtinctionDensity * fogDepth);

	vec3 finalColour = colour * fogExtinctionFactor + skyColour * (1.0 - fogScatterFactor);

  gl_FragColor = vec4(pow(finalColour, vec3(1.0 / 2.2)), 1.0);
}