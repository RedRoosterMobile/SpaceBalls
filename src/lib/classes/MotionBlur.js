import { Vector2 } from 'three';

/**
 * Dot screen shader
 * based on glfx.js sepia shader
 * https://github.com/evanw/glfx.js
 */

const MotionBlur = {
	name: 'MotionBlur',

	uniforms: {
		strength: { value: 1.0 },
		tDiffuse: { value: null }
	},

	vertexShader: /* glsl */ `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

	fragmentShader: /* glsl */ `
		uniform float strength;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;


		float rand2 (vec2 n) { 
			return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
		}
		void mainImagee(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
		  
			vec2 dir = normalize(uv - vec2(0.5));
			float dist = length(uv - vec2(0.5));
			float positionalStrength = max(dist - 0.1, 0.0) * 0.1;
			positionalStrength = pow(positionalStrength, 1.5) * 7.0;
		  
			vec4 accum = vec4(0.0);
			for (int i = 0; i < 7; i++) {
			  vec2 offs1 = -dir * positionalStrength * strength * ((float(i) + rand2(uv * 5.0)) * 0.2);
			  vec2 offs2 = dir * positionalStrength * strength * ((float(i) + rand2(uv * 5.0)) * 0.2);
		  
			  accum += texture2D(tDiffuse, uv + offs1);
			  accum += texture2D(tDiffuse, uv + offs2);
			}
			accum *= 1.0 / 14.0;
		  
			  outputColor = accum;
		  }

		void main() {
			//gl_FragColor = texture2D( tDiffuse, vUv );
			mainImagee(gl_FragColor,vUv,gl_FragColor);


		}`
};

export { MotionBlur };

//src/lib/classes/DotScreenShader.js
const fragmentShader = `
uniform float strength;

float rand2 (vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 aspectCorrection = vec2(1.0, aspect);

  vec2 dir = normalize(uv - vec2(0.5));
  float dist = length(uv - vec2(0.5));
  float positionalStrength = max(dist - 0.1, 0.0) * 0.1;
  positionalStrength = pow(positionalStrength, 1.5) * 7.0;

  vec4 accum = vec4(0.0);
  for (int i = 0; i < 7; i++) {
    vec2 offs1 = -dir * positionalStrength * strength * ((float(i) + rand2(uv * 5.0)) * 0.2);
    vec2 offs2 = dir * positionalStrength * strength * ((float(i) + rand2(uv * 5.0)) * 0.2);

    accum += texture2D(inputBuffer, uv + offs1);
    accum += texture2D(inputBuffer, uv + offs2);
  }
  accum *= 1.0 / 14.0;

	outputColor = accum;
}`;
