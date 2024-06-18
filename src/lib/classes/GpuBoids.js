/// bird bird
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer';
import * as THREE from 'three';
import { BirdGeometry } from './BirdGeometry';
/* TEXTURE WIDTH FOR SIMULATION */
export const WIDTH = 8;

const BIRDS = WIDTH * WIDTH;

const fragmentShaderPosition = `
	    uniform float time;
			uniform float delta;

			void main()	{

				vec2 uv = gl_FragCoord.xy / resolution.xy;
				vec4 tmpPos = texture2D( texturePosition, uv );
				vec3 position = tmpPos.xyz;
				vec3 velocity = texture2D( textureVelocity, uv ).xyz;

				float phase = tmpPos.w;

				phase = mod( ( phase + delta +
					length( velocity.xz ) * delta * 3. +
					max( velocity.y, 0.0 ) * delta * 6. ), 62.83 );

				gl_FragColor = vec4( position + velocity * delta * 15. , phase );

			}
	`;
const fragmentShaderVelocity = `
	    uniform float time;
			uniform float testing;
			uniform float delta; // about 0.016
			uniform float separationDistance; // 20
			uniform float alignmentDistance; // 40
			uniform float cohesionDistance; //
			uniform float freedomFactor;
			uniform vec3 predator;

			const float width = resolution.x;
			const float height = resolution.y;

			const float PI = 3.141592653589793;
			const float PI_2 = PI * 2.0;
			// const float VISION = PI * 0.55;

			float zoneRadius = 40.0;
			float zoneRadiusSquared = 1600.0;

			float separationThresh = 0.45;
			float alignmentThresh = 0.65;

			const float UPPER_BOUNDS = BOUNDS;
			const float LOWER_BOUNDS = -UPPER_BOUNDS;

			const float SPEED_LIMIT = 9.0;

			float rand( vec2 co ){
				return fract( sin( dot( co.xy, vec2(12.9898,78.233) ) ) * 43758.5453 );
			}

			void main() {

				zoneRadius = separationDistance + alignmentDistance + cohesionDistance;
				separationThresh = separationDistance / zoneRadius;
				alignmentThresh = ( separationDistance + alignmentDistance ) / zoneRadius;
				zoneRadiusSquared = zoneRadius * zoneRadius;


				vec2 uv = gl_FragCoord.xy / resolution.xy;
				vec3 birdPosition, birdVelocity;

				vec3 selfPosition = texture2D( texturePosition, uv ).xyz;
				vec3 selfVelocity = texture2D( textureVelocity, uv ).xyz;

				float dist;
				vec3 dir; // direction
				float distSquared;

				float separationSquared = separationDistance * separationDistance;
				float cohesionSquared = cohesionDistance * cohesionDistance;

				float f;
				float percent;

				vec3 velocity = selfVelocity;

				float limit = SPEED_LIMIT;

				dir = predator * UPPER_BOUNDS - selfPosition;
				dir.z = 0.;
				// dir.z *= 0.6;
				dist = length( dir );
				distSquared = dist * dist;

				float preyRadius = 150.0;
				float preyRadiusSq = preyRadius * preyRadius;


				// move birds away from predator
				if ( dist < preyRadius ) {

					f = ( distSquared / preyRadiusSq - 1.0 ) * delta * 100.;
					velocity += normalize( dir ) * f;
					limit += 5.0;
				}


				// if (testing == 0.0) {}
				// if ( rand( uv + time ) < freedomFactor ) {}


				// Attract flocks to the center
				vec3 central = vec3( 0., 0., 0. );
				dir = selfPosition - central;
				dist = length( dir );

				dir.y *= 2.5;
				velocity -= normalize( dir ) * delta * 5.;

				for ( float y = 0.0; y < height; y++ ) {
					for ( float x = 0.0; x < width; x++ ) {

						vec2 ref = vec2( x + 0.5, y + 0.5 ) / resolution.xy;
						birdPosition = texture2D( texturePosition, ref ).xyz;

						dir = birdPosition - selfPosition;
						dist = length( dir );

						if ( dist < 0.0001 ) continue;

						distSquared = dist * dist;

						if ( distSquared > zoneRadiusSquared ) continue;

						percent = distSquared / zoneRadiusSquared;

						if ( percent < separationThresh ) { // low

							// Separation - Move apart for comfort
							f = ( separationThresh / percent - 1.0 ) * delta;
							velocity -= normalize( dir ) * f;

						} else if ( percent < alignmentThresh ) { // high

							// Alignment - fly the same direction
							float threshDelta = alignmentThresh - separationThresh;
							float adjustedPercent = ( percent - separationThresh ) / threshDelta;

							birdVelocity = texture2D( textureVelocity, ref ).xyz;

							f = ( 0.5 - cos( adjustedPercent * PI_2 ) * 0.5 + 0.5 ) * delta;
							velocity += normalize( birdVelocity ) * f;

						} else {

							// Attraction / Cohesion - move closer
							float threshDelta = 1.0 - alignmentThresh;
							float adjustedPercent;
							if( threshDelta == 0. ) adjustedPercent = 1.;
							else adjustedPercent = ( percent - alignmentThresh ) / threshDelta;

							f = ( 0.5 - ( cos( adjustedPercent * PI_2 ) * -0.5 + 0.5 ) ) * delta;

							velocity += normalize( dir ) * f;

						}

					}

				}



				// this make tends to fly around than down or up
				// if (velocity.y > 0.) velocity.y *= (1. - 0.2 * delta);

				// Speed Limits
				if ( length( velocity ) > limit ) {
					velocity = normalize( velocity ) * limit;
				}

				gl_FragColor = vec4( velocity, 1.0 );

			}
	`;

const birdVS = `
	    attribute vec2 reference;
			attribute float birdVertex;

			attribute vec3 birdColor;

			uniform sampler2D texturePosition;
			uniform sampler2D textureVelocity;

			varying vec4 vColor;
			varying float z;

			uniform float time;

			void main() {

				vec4 tmpPos = texture2D( texturePosition, reference );
				vec3 pos = tmpPos.xyz;
				vec3 velocity = normalize(texture2D( textureVelocity, reference ).xyz);

				vec3 newPosition = position;

				if ( birdVertex == 4.0 || birdVertex == 7.0 ) {
					// flap wings
					newPosition.y = sin( tmpPos.w ) * 5.;
				}

				newPosition = mat3( modelMatrix ) * newPosition;


				velocity.z *= -1.;
				float xz = length( velocity.xz );
				float xyz = 1.;
				float x = sqrt( 1. - velocity.y * velocity.y );

				float cosry = velocity.x / xz;
				float sinry = velocity.z / xz;

				float cosrz = x / xyz;
				float sinrz = velocity.y / xyz;

				mat3 maty =  mat3(
					cosry, 0, -sinry,
					0    , 1, 0     ,
					sinry, 0, cosry

				);

				mat3 matz =  mat3(
					cosrz , sinrz, 0,
					-sinrz, cosrz, 0,
					0     , 0    , 1
				);

				newPosition =  maty * matz * newPosition;
				newPosition += pos;

				z = newPosition.z;

				vColor = vec4( birdColor, 1.0 );
				gl_Position = projectionMatrix *  viewMatrix  * vec4( newPosition, 1.0 );
			}
	`;

const birdFS = `
			varying vec4 vColor;
			varying float z;

			uniform vec3 color;

			void main() {
				// Fake colors for now
				float z2 = 0.2 + ( 1000. - z ) / 1000. * vColor.x;
				gl_FragColor = vec4( z2, z2, z2, 1. );

			}
	`;

let mouseX = 0,
	mouseY = 0;

// let windowHalfX = window.innerWidth / 2;
// let windowHalfY = window.innerHeight / 2;

const BOUNDS = 256,
	BOUNDS_HALF = BOUNDS / 2;

let gpuCompute;
let velocityVariable;
let positionVariable;
let positionUniforms;
let velocityUniforms;
let birdUniforms;

function initt(renderer, scene) {
	initComputeRenderer(renderer);
	console.log('initt half');
	initBirds(scene);
}

function initComputeRenderer(_renderer) {
	gpuCompute = _renderer;

	console.log('initt half there');
	const dtPosition = gpuCompute.createTexture();
	const dtVelocity = gpuCompute.createTexture();
	fillPositionTexture(dtPosition);
	fillVelocityTexture(dtVelocity);

	velocityVariable = gpuCompute.addVariable('textureVelocity', fragmentShaderVelocity, dtVelocity);
	positionVariable = gpuCompute.addVariable('texturePosition', fragmentShaderPosition, dtPosition);

	gpuCompute.setVariableDependencies(velocityVariable, [positionVariable, velocityVariable]);
	gpuCompute.setVariableDependencies(positionVariable, [positionVariable, velocityVariable]);

	positionUniforms = positionVariable.material.uniforms;
	velocityUniforms = velocityVariable.material.uniforms;

	positionUniforms['time'] = { value: 0.0 };
	positionUniforms['delta'] = { value: 0.0 };
	velocityUniforms['time'] = { value: 1.0 };
	velocityUniforms['delta'] = { value: 0.0 };
	velocityUniforms['testing'] = { value: 1.0 };
	velocityUniforms['separationDistance'] = { value: 1.0 };
	velocityUniforms['alignmentDistance'] = { value: 1.0 };
	velocityUniforms['cohesionDistance'] = { value: 1.0 };
	velocityUniforms['freedomFactor'] = { value: 1.0 };
	velocityUniforms['predator'] = { value: new THREE.Vector3() };
	velocityVariable.material.defines.BOUNDS = BOUNDS.toFixed(2);

	velocityVariable.wrapS = THREE.RepeatWrapping;
	velocityVariable.wrapT = THREE.RepeatWrapping;
	positionVariable.wrapS = THREE.RepeatWrapping;
	positionVariable.wrapT = THREE.RepeatWrapping;

	const error = gpuCompute.init();

	if (error !== null) {
		console.error(error);
	}
}

function initBirds(scene) {
	const geometry = new BirdGeometry(BIRDS, WIDTH);

	// For Vertex and Fragment
	birdUniforms = {
		//color: { value: new THREE.Color(0xff2200) },
		//ffffc7
		birdColor: { value: new THREE.Color(0xc0000ff) },
		color: { value: new THREE.Color(0xc0000ff) },
		texturePosition: { value: null },
		textureVelocity: { value: null },
		time: { value: 1.0 },
		delta: { value: 0.0 }
	};

	// THREE.ShaderMaterial
	const material = new THREE.ShaderMaterial({
		uniforms: birdUniforms,
		vertexShader: birdVS,
		fragmentShader: birdFS,
		side: THREE.DoubleSide
	});
	// scale of the birds, but not the range
	const scale = 0.5;
	//material.scale.set(scale, scale, scale);
	geometry.scale(scale, scale, scale);

	const birdMesh = new THREE.Mesh(geometry, material);
	birdMesh.rotation.y = Math.PI / 2;
	birdMesh.matrixAutoUpdate = false;
	birdMesh.updateMatrix();

	scene.add(birdMesh);
}

function fillPositionTexture(texture) {
	const theArray = texture.image.data;

	for (let k = 0, kl = theArray.length; k < kl; k += 4) {
		const x = Math.random() * BOUNDS - BOUNDS_HALF;
		const y = Math.random() * BOUNDS - BOUNDS_HALF;
		const z = Math.random() * BOUNDS - BOUNDS_HALF;

		theArray[k + 0] = x;
		theArray[k + 1] = y;
		theArray[k + 2] = z;
		theArray[k + 3] = 1;
	}
}

function fillVelocityTexture(texture) {
	const theArray = texture.image.data;

	for (let k = 0, kl = theArray.length; k < kl; k += 4) {
		const x = Math.random() - 0.5;
		const y = Math.random() - 0.5;
		const z = Math.random() - 0.5;

		theArray[k + 0] = x * 10;
		theArray[k + 1] = y * 10;
		theArray[k + 2] = z * 10;
		theArray[k + 3] = 1;
	}
}

function render(delta) {
	//if (delta > 1) delta = 1; // safety cap on large deltas

	positionUniforms['time'].value = time;
	positionUniforms['delta'].value = delta;
	velocityUniforms['time'].value = time;
	velocityUniforms['delta'].value = delta;
	birdUniforms['time'].value = time;
	birdUniforms['delta'].value = delta;

	// velocityUniforms['predator'].value.set(
	// 	(0.5 * mouseX) / windowHalfX,
	// 	(-0.5 * mouseY) / windowHalfY,
	// 	0
	// );

	mouseX = 10000;
	mouseY = 10000;

	gpuCompute.compute();

	birdUniforms['texturePosition'].value =
		gpuCompute.getCurrentRenderTarget(positionVariable).texture;
	birdUniforms['textureVelocity'].value =
		gpuCompute.getCurrentRenderTarget(velocityVariable).texture;
}

let time = 0;
export class GpuBoids {
	constructor(renderer, scene) {
		initt(renderer, scene);
	}
	update(delta) {
		time += delta;
		render(delta);
	}
}

/// bird bird
