<script>
	import { T, useRender, useThrelte } from '@threlte/core';
	import { OrbitControls, Float, Sky, Stars, Grid, AnimatedSpriteMaterial } from '@threlte/extras';
	import Spaceship from './models/spaceship.svelte';
	import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer';
	import { BirdGeometry } from '../classes/BirdGeometry';
	// console.log(GPUComputationRenderer);

	import { GeneralParticleSystemSimon } from '../classes/GeneralParticleSystemSimon';
	import {
		Color,
		Mesh,
		AudioLoader,
		AudioListener,
		Audio,
		MeshBasicMaterial,
		MeshLambertMaterial,
		MeshPhongMaterial,
		PMREMGenerator,
		PlaneGeometry,
		Raycaster,
		Vector2,
		Vector3,
		DoubleSide,
		BackSide,
		FrontSide,
		BoxGeometry,
		// https://dustinpfister.github.io/2022/05/09/threejs-box3/
		Box3,
		//Box3Helper,
		BoxHelper,
		ObjectSpaceNormalMap,
		TextureLoader,
		BufferGeometry,
		Line,
		LineBasicMaterial,
		SpriteMaterial,
		AdditiveBlending,
		Sprite
	} from 'three';
	import * as THREE from 'three';

	import ParticleSystem, {
		Body,
		Emitter,
		Gravity,
		Life,
		Mass,
		Position,
		RadialVelocity,
		RandomDrift,
		Rate,
		Scale,
		Span,
		SphereZone,
		SpriteRenderer,
		Vector3D,
		ease
	} from 'three-nebula';
	import { onMount, onDestroy } from 'svelte';
	import StarsAndStripes from './StarsAndStripes.svelte';
	import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';

	import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
	import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
	import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
	import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
	import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
	import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
	import { BleachBypassShader } from 'three/addons/shaders/BleachBypassShader.js';
	import { ColorifyShader } from 'three/addons/shaders/ColorifyShader.js';
	import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
	import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';
	import { SepiaShader } from 'three/addons/shaders/SepiaShader.js';
	import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';
	import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js';
	//import { DotScreenShader } from 'three/addons/shaders/DotScreenShader.js';
	import { DotScreenShader } from '../classes/DotScreenShader';
	import { DotScreenPass } from 'three/addons/postprocessing/DotScreenPass.js';
	import { HalftonePass } from 'three/addons/postprocessing/HalftonePass.js';
	import { MotionBlur } from '../classes/MotionBlur';

	import PurpleSky from './PurpleSky.svelte';
	import { Box3Helper } from 'three';
	import { itemsStore } from '../store.js';
	import Fire from './Fire.svelte';
	import Boids from './Boids.svelte';

	const LASER_WIDTH = 0.5;

	function r(min, max) {
		let diff = Math.random() * (max - min);
		return min + diff;
	}

	const { scene, camera, renderer } = useThrelte();
	console.log(renderer);
	renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));

	/* TEXTURE WIDTH FOR SIMULATION */
	const WIDTH = 32;

	const BIRDS = WIDTH * WIDTH;
	/// bird bird

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

	let windowHalfX = window.innerWidth / 2;
	let windowHalfY = window.innerHeight / 2;

	const BOUNDS = 800,
		BOUNDS_HALF = BOUNDS / 2;

	let gpuCompute;
	let velocityVariable;
	let positionVariable;
	let positionUniforms;
	let velocityUniforms;
	let birdUniforms;

	init();
	function init() {
		initComputeRenderer();

		initBirds();
	}

	function initComputeRenderer() {
		gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, renderer);

		const dtPosition = gpuCompute.createTexture();
		const dtVelocity = gpuCompute.createTexture();
		fillPositionTexture(dtPosition);
		fillVelocityTexture(dtVelocity);

		velocityVariable = gpuCompute.addVariable(
			'textureVelocity',
			fragmentShaderVelocity,
			dtVelocity
		);
		positionVariable = gpuCompute.addVariable(
			'texturePosition',
			fragmentShaderPosition,
			dtPosition
		);

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

	function initBirds() {
		const geometry = new BirdGeometry(BIRDS, WIDTH);

		// For Vertex and Fragment
		birdUniforms = {
			color: { value: new THREE.Color(0xff2200) },
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

		velocityUniforms['predator'].value.set(
			(0.5 * mouseX) / windowHalfX,
			(-0.5 * mouseY) / windowHalfY,
			0
		);

		mouseX = 10000;
		mouseY = 10000;

		gpuCompute.compute();

		birdUniforms['texturePosition'].value =
			gpuCompute.getCurrentRenderTarget(positionVariable).texture;
		birdUniforms['textureVelocity'].value =
			gpuCompute.getCurrentRenderTarget(velocityVariable).texture;
	}
	/// bird bird

	let spaceShipRef;
	let playerBodyRef;
	let starsAndStripesRef;
	let intersectionPoint;
	let translZ = 0;
	let translY = 0;
	let translX = 0;
	let translAccelleration = 0;
	let angleZ = 0;
	let angleX = 0;
	let prevTargetZ = 0;
	let distanceFromMouseBaseZ = 0;
	let angleY = 0;
	let angleAccelleration = 0;
	let pmrem = new PMREMGenerator(renderer);
	let envMapRT;
	let animateLaser = false;

	let fireRef;
	let cameraTarget = new Vector3(0, 0, 0);
	// takes control of the render loop, unlike useFrame
	// https://threlte.xyz/docs/reference/core/use-render
	let time = 0;
	const createSprite = () => {
		var map = new TextureLoader().load('/textures/explosion.png');
		var material = new SpriteMaterial({
			map: map,
			color: 0xff0000,
			blending: AdditiveBlending,
			fog: true
		});
		console.log('loaded particle thing');
		return new Sprite(material);
	};

	const createEmitter = () => {
		const emitter = new Emitter();

		return emitter
			.setRate(new Rate(new Span(1, 1), new Span(0.05, 0.1)))
			.addInitializers([
				new Body(createSprite()),
				new Mass(1),
				new Life(1, 3),
				new Position(new SphereZone(2)),
				new RadialVelocity(new Span(50, 80), new Vector3D(0, 1, 0), 30)
			])
			.addBehaviours([
				new RandomDrift(10, 10, 10, 0.05),
				new Scale(new Span(2, 3.5), 0),
				new Gravity(6),
				new Color('#FF0026', ['#ffff00', '#ffff11'], Infinity, ease.easeOutSine)
			])
			.setPosition({ x: 2, y: 2 })
			.emit();
	};

	const spaceShipColliderBox = new Box3();
	let balls = [];
	// Subscribe to the store to get the initial value and updates
	const unsubscribe = itemsStore.subscribe((value) => {
		balls = value;
	});

	// this will kick it out of the array..
	// how to add new ones?
	function removeItem(id) {
		balls = balls.filter((item) => item.id !== id);
		itemsStore.set(balls); // Update the store
	}

	function hideItem(id) {
		balls = balls.map((item) => {
			if (item.id === id) item.visible = false;
			return item;
		});
		itemsStore.set(balls); // Update the store
	}

	// Clean up the subscription
	onDestroy(() => {
		unsubscribe();
	});

	const composer = new EffectComposer(renderer);
	composer.setSize(innerWidth, innerHeight);

	let motionBlurFx;
	let rgbShiftFx;
	const setupEffectComposer = () => {
		const renderPass = new RenderPass(scene, camera.current);
		console.log('far', camera.current.far); // outputs: 2000!!!
		console.log('near', camera.current.near); // outputs: 0.1
		composer.addPass(renderPass);

		// fucks up shader textures for explosion
		// const renderPixelatedPass = new RenderPixelatedPass(1, scene, camera.current);
		// composer.addPass(renderPixelatedPass);

		const bloomPass = new UnrealBloomPass(new Vector2(innerWidth, innerHeight), 0.275, 1, 0);
		composer.addPass(bloomPass);
		//https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/shaders/DotScreenShader.js
		// const effect1 = new ShaderPass(DotScreenShader);

		// effect1.uniforms['scale'].value = 4;
		// composer.addPass(effect1);

		motionBlurFx = new ShaderPass(MotionBlur);
		motionBlurFx.uniforms['strength'].value = 0.0;
		composer.addPass(motionBlurFx);

		// cool stuff
		// https://threejs.org/examples/?q=post#webgl_postprocessing_advanced

		rgbShiftFx = new ShaderPass(RGBShiftShader);
		rgbShiftFx.uniforms['amount'].value = 0.0015;
		composer.addPass(rgbShiftFx);

		//

		// const params = {
		// 	shape: 1,
		// 	radius: 8,
		// 	// rotateR: Math.PI / 12,
		// 	// rotateB: (Math.PI / 12) * 2,
		// 	// rotateG: (Math.PI / 12) * 3,
		// 	scatter: 0,
		// 	blending: 0.5,
		// 	blendingMode: 3 ,
		// 	greyscale: false,
		// 	disable: false
		// };
		// const halftonePass = new HalftonePass(window.innerWidth, window.innerHeight, params);
		// composer.addPass( halftonePass );

		// const effectDotScreen = new DotScreenPass( new THREE.Vector2( 0, 0 ), 0.5, 0.8 );
		// composer.addPass(effectDotScreen);
		// console.log(effectDotScreen.uniforms);

		// const gammaCorrection = new ShaderPass( GammaCorrectionShader );
		// composer.addPass( gammaCorrection );
		// console.log(gammaCorrection.uniforms);

		const outputPass = new OutputPass();
		composer.addPass(outputPass);
		// renderPixelatedPass.setPixelSize(6);
	};

	//useRender(({ _ }, delta) => {

	let explosionParticles;
	let currentDelta = 0;
	let floatSpeed = 3;
	let motionBlurStrength = 0;
	useRender(({ _, renderer, __ }, delta) => {
		time += delta;

		currentDelta = delta;
		if (animateLaser) laser.position.x = laser.position.x - delta * 1000;
		if (intersectionPoint) {
			// const targetY = intersectionPoint?.y || 0;
			// translAccelleration += (targetY - translY) * 0.002; // stiffness
			// translAccelleration *= 0.95; // damping
			// translY += translAccelleration;

			// const dir = intersectionPoint.clone().sub(new Vector3(0, translY, 0)).normalize();
			// const dirCos = dir.dot(new Vector3(0, 1, 0));
			// const angle = Math.acos(dirCos) - Math.PI * 0.5;
			// angleAccelleration += (angle - angleZ) * 0.01; // stiffness
			// angleAccelleration *= 0.85; // damping
			// angleZ += angleAccelleration;

			const targetZ = intersectionPoint?.z || 0;

			distanceFromMouseBaseZ = Math.abs(prevTargetZ - targetZ);

			prevTargetZ = targetZ;
			translAccelleration += (targetZ - translZ) * 0.002; // stiffness
			translAccelleration *= 0.95; // damping
			translZ += translAccelleration;

			const magic = distanceFromMouseBaseZ * 40;

			const dir = intersectionPoint.clone().sub(new Vector3(0, translZ, 0)).normalize();
			const dirCos = dir.dot(new Vector3(0, 0, Math.min(magic, 1)));
			const angle = Math.acos(dirCos) - Math.PI * 0.5;
			angleAccelleration += (angle - angleY) * 0.01; // stiffness
			angleAccelleration *= 0.85; // damping
			angleY += angleAccelleration;
		}

		if (envMapRT) envMapRT.dispose();

		spaceShipRef.visible = false;
		scene.background = null;
		envMapRT = pmrem.fromScene(scene, 0, 0.1, 1000);
		scene.background = new Color('#598889').multiplyScalar(0.05);
		spaceShipRef.visible = true;

		spaceShipRef.traverse((child) => {
			if (child?.material?.envMapIntensity) {
				child.material.envMap = envMapRT.texture;
				child.material.envMapIntensity = 100;
				child.material.normalScale.set(0.3, 0.3);
			}
		});

		//$camera.position.z += Math.sin(time)*.0001;
		//$camera.position.z = Math.sin(time) * 0.1;
		screenshake();
		screenshakeOffset = Math.max(screenshakeOffset - delta * 2, 0);
		lastExplosion = Math.max(lastExplosion - delta, 0);
		motionBlurStrength = Math.max(motionBlurStrength - delta, 0);
		//floatSpeed=Math.max(Math.floor(floatSpeed - delta), 3);
		//floatSpeed=Math.max(floatSpeed - delta/2, 3);
		// motionBlurStrength = (Math.sin(time * 20) * 0.5 + 0.5) / 10;
		motionBlurFx.uniforms['strength'].value = motionBlurStrength;

		//rgbShiftFx.uniforms['amount'].value = 0.0015;
		const zto = Math.sin(time * 4) * 0.5 + 0.5;
		rgbShiftFx.uniforms['amount'].value = zto * 0.0015;
		//console.log(floatSpeed);
		$camera.lookAt(cameraTarget);
		// billboarding
		//planeRef.lookAt(camera.current.position);
		//angleAccelleration *= 0.2;
		updateSpaceshipBoundingBoxes();
		checkSpaceshipIntersection();

		if (explosionParticles) {
			explosionParticles._UpdateParticles(delta);
			explosionParticles._UpdateGeometry();
		}

    render(delta)

		composer.render();
	});

	function updateSpaceshipBoundingBoxes() {
		spaceShipColliderBox.setFromObject(playerBodyRef);
	}

	let screenshakeOffset = 0;
	function screenshake() {
		// better? https://www.youtube.com/watch?v=1i5SB8Ct1y0
		cameraTarget.y = (Math.sin(time / 30) * 0.5 + 0.5) * screenshakeOffset;
		cameraTarget.z = (Math.sin(time / 30) * screenshakeOffset) / 5;
	}

	let lastExplosion = 0;
	function checkSpaceshipIntersection() {
		balls.forEach((ball) => {
			if (
				ball.visible &&
				spaceShipColliderBox.intersectsSphere({ center: ball.pos, radius: ball.scale })
			) {
				//console.log('Player is overlapping the target mesh!');
				//fireRef.visible = true;
				screenshakeOffset = 1;
				motionBlurStrength = 1;
				hideItem(ball.id);
				// prevent multiple triggers
				if (lastExplosion <= 0) {
					explosionParticles._AddParticles(currentDelta, spaceShipRef.position, ball.color);
					if (sfxExplosion.isPlaying) sfxExplosion.stop();
					// https://threejs.org/docs/#api/en/audio/PositionalAudio use this!!
					sfxExplosion.position.copy(spaceShipRef.position);
					lastExplosion = 1;
					// we hit sth: stop the laser
					sfxLaser.stop();
					sfxExplosion.play();
					return;
				}
				// play();
			}
		});
	}
	let laserDuration = 350; // Duration in milliseconds
	let laser;
	function initLaser() {
		// Create the laser geometry and material
		const laserGeometry = new PlaneGeometry(LASER_WIDTH, 10); // Width, Length of the laser
		const laserMaterial = new MeshPhongMaterial({
			color: 0x800080,
			emissive: 0x800080,
			side: DoubleSide,
			emissiveIntensity: 55
		});

		// Create the laser plane
		laser = new Mesh(laserGeometry, laserMaterial);
		laser.rotation.set(Math.PI / 2, 0, Math.PI / 2);
		laser.visible = false; // Initially hidden
		scene.add(laser);
	}

	function rayIntersectsSphere(rayOrigin, rayDirection, sphereCenter, sphereRadius) {
		const oc = rayOrigin.clone().sub(sphereCenter);
		const a = rayDirection.dot(rayDirection);
		const b = 2.0 * oc.dot(rayDirection);
		const c = oc.dot(oc) - sphereRadius * sphereRadius;
		const discriminant = b * b - 4 * a * c;
		return discriminant > 0;
	}

	const raycaster = new Raycaster();
	function shootLaser(position) {
		if (animateLaser) return;
		if (sfxLaser.isPlaying) sfxLaser.stop();
		sfxLaser.play();
		// Update the laser's position

		const laserStartPosition = new THREE.Vector3(-laser.geometry.parameters.height / 2, 0, 0);
		laserStartPosition.applyMatrix4(spaceShipRef.matrixWorld); // Convert to world coordinates
		laser.position.copy(laserStartPosition);
		laser.visible = true;
		animateLaser = true;
		// Perform raycasting
		const laserDirection = new THREE.Vector3(1, 0, 0); // Adjust based on laser direction
		laserDirection.applyQuaternion(spaceShipRef.quaternion); // Align direction with spaceship orientation

		raycaster.set(laserStartPosition, laserDirection);

		// make sure only the ones in front (x) and not left or right get blasted
		const sortedBalls = balls
			.slice() // keep original order
			.filter((ball) => ball.visible && ball.pos.x < 0) // only alive balls that are not behind me
			.sort((a, b) => laserStartPosition.distanceTo(a.pos) - laserStartPosition.distanceTo(b.pos)); // closest first

		let hitBall = null;

		// Check for intersections in order of proximity
		for (const ball of sortedBalls) {
			if (
				rayIntersectsSphere(laserStartPosition, laserDirection, ball.pos, ball.scale + LASER_WIDTH)
			) {
				hitBall = ball;
				break;
			}
		}
		if (hitBall) {
			// Handle hit (e.g., remove the object, play a sound, etc.)
			handleHit(hitBall);
		}

		// Hide the laser after a short duration
		setTimeout(() => {
			laser.visible = false;
			animateLaser = false; // also prevents further shoots
		}, laserDuration);
	}
	function handleHit(ball) {
		hideItem(ball.id);
		screenshakeOffset = 0.1;
		motionBlurStrength = 0.1;

		explosionParticles._AddParticles(
			currentDelta,
			ball.pos,
			ball.color,
			new Vector3(r(ball.speed, ball.speed * 5), r(-1, 1), r(-1, 1)) //r(-1, 1), r(-1, 1))
		);
		if (sfxExplosion.isPlaying) sfxExplosion.stop();
		sfxExplosion.position.copy(ball.pos);
		sfxExplosion.play();
		floatSpeed = 6;
	}

	onMount(() => {
		setupEffectComposer();

		const planeGeo = new PlaneGeometry(40, 40);
		const planeMat = new MeshBasicMaterial({
			color: 0xff0000,
			side: DoubleSide, // Double-sided
			transparent: true, // Enable transparency
			opacity: 0.25 // Set opacity level (0.0 to 1.0)}); // 0xff0000 is the hexadecimal value for red
		});
		const mesh = new Mesh(planeGeo, planeMat);
		mesh.rotation.x = -Math.PI / 2; // Rotate 90 degrees
		// Add the mesh to the scene to actually see it
		//scene.add(mesh);

		const raycaster = new Raycaster();
		const pointer = new Vector2();

		function onPointerMove(event) {
			// billboarding
			mesh.lookAt($camera.position);
			pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
			pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

			raycaster.setFromCamera(pointer, $camera);

			const intersects = raycaster.intersectObject(mesh);
			intersectionPoint = intersects[0]?.point;

			if (intersectionPoint) {
				// this prevents the spring motion to be different while the pointer
				// spans the x axis
				//intersectionPoint.x = 3;
			}
		}
		function onKeyPressed(e) {
			if (e.code === 'Space') {
				//console.log('Space key was pressed', spaceShipRef.position);
				//fireRef.visible = true;
				//explosionParticles._AddParticles(currentDelta, spaceShipRef.position);
				// play();
				shootLaser(spaceShipRef.position);
			}
		}

		playerBodyRef.visible = false;
		//fireRef.visible = false;
		window.addEventListener('keydown', onKeyPressed);
		window.addEventListener('pointermove', onPointerMove);

		// not  working... add particles??
		// const system = new ParticleSystem();
		// system.addEmitter(createEmitter()).addRenderer(new SpriteRenderer(scene, THREE));
		// console.log(system);
		const params = { parent: scene, camera: camera.current };
		//console.log(params);
		explosionParticles = new GeneralParticleSystemSimon(params);
		initLaser();
		loadSounds();

		return () => {
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('keydown', onKeyPressed);
		};
	});

	// sprite hooks
	// let play = () => {
	// 	console.log('play');
	// };
	// let pause = () => {
	// 	console.log('pause');
	// };
	// let onEnd = () => {
	// 	console.log('ended');
	// };
	// let onStart = () => {
	// 	console.log('started');
	// };

	// laser: super long, thin billboards https://youtu.be/LltugBg4dtk?si=wwXuxxDQYK3lDOa7&t=501
	let sfxLaser;
	let sfxExplosion;
	function loadSounds() {
		// create an AudioListener and add it to the camera
		const listener = new AudioListener();
		$camera.add(listener);

		// create a global audio source
		sfxLaser = new Audio(listener);

		// load a sound and set it as the Audio object's buffer
		const audioLoader = new AudioLoader();
		audioLoader.load('./audio/Laser.mp3', function (buffer) {
			sfxLaser.setBuffer(buffer);
			sfxLaser.setLoop(false);
			sfxLaser.setVolume(0.5);
		});

		sfxExplosion = new Audio(listener);
		audioLoader.load('./audio/Explosion.mp3', function (buffer) {
			sfxExplosion.setBuffer(buffer);
			sfxExplosion.setLoop(false);
			sfxExplosion.setVolume(0.35);
		});
	}
</script>

<!-- original position={[-5, 6, 10]} -->
<T.PerspectiveCamera makeDefault position={[24, 3, 0]} fov={25}>
	<OrbitControls enableDamping target={[0, 0, 0]} />
</T.PerspectiveCamera>

<T.DirectionalLight intensity={1.8} position={[0, 10, 0]} castShadow shadow.bias={-0.0001} />

<!-- <T.Mesh renderOrder={0} bind:ref={planeRef} rotation={[Math.PI / 2, 0, 0, 'XYZ']}>
	<T.PlaneGeometry args={[2, 2]} />
	<T.MeshBasicMaterial side={DoubleSide} color={[1, 0, 1]} transparent opacity={0.25} />
</T.Mesh> -->
<!-- rotation={[angleZ, 0, angleZ, 'ZXY']} -->
<Float speed={floatSpeed} floatingRange={[-0.5, 0.5]} rotationIntensity={0.01} rotationSpeed={50}>
	<Spaceship
		bind:ref={spaceShipRef}
		position={[0, 0, translZ]}
		rotation={[-angleY, angleY * 0.1, 0, 'ZXY']}
	/>
</Float>

<T.Mesh
	bind:ref={playerBodyRef}
	geometry={new BoxGeometry(2, 1, 1)}
	position={[0, 0, translZ]}
	material={new MeshBasicMaterial()}
/>

<StarsAndStripes bind:ref={starsAndStripesRef} />
<!-- https://threlte.xyz/docs/reference/extras/stars -->
<!-- <Stars lightness={0.1} factor={6} radius={50} /> -->
<PurpleSky />
<!-- <Grid sectionThickness={1} infiniteGrid cellColor="#dddddd" cellSize={2} /> -->
<!-- <T.Sprite position={[0, 1, translZ]} bind:ref={fireRef}>
	<AnimatedSpriteMaterial
		bind:play
		bind:pause
		autoplay={false}
		textureUrl="/textures/explosion.png"
		totalFrames={16}
		rows={4}
		on:end={onEnd}
		on:start={onStart}
		loop={false}
		columns={4}
		fps={20}
	/>
</T.Sprite> -->
<!-- <Fire visible={false} /> -->

<!-- shitty boids - can't scale 'em properly, too many draw calls -->
<!-- <Boids position={[0, 0, 0]}/> -->
