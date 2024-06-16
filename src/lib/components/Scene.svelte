<script>
	import { T, useRender, useThrelte } from '@threlte/core';
	import { OrbitControls, Sky, Stars, Grid, AnimatedSpriteMaterial } from '@threlte/extras';
	import Spaceship from './models/spaceship.svelte';
	import { ParticleSystemSimon } from '../classes/ParticleSystemSimon';
	import {
		Color,
		Mesh,
		MeshBasicMaterial,
		PMREMGenerator,
		PlaneGeometry,
		Raycaster,
		Vector2,
		Vector3,
		DoubleSide,
		BoxGeometry,
		// https://dustinpfister.github.io/2022/05/09/threejs-box3/
		Box3,
		//Box3Helper,
		BoxHelper,
		ObjectSpaceNormalMap,
		TextureLoader,
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
	import { DotScreenShader } from 'three/addons/shaders/DotScreenShader.js';
	import PurpleSky from './PurpleSky.svelte';
	import { Box3Helper } from 'three';
	import { itemsStore } from '../store.js';
	import Fire from './Fire.svelte';

	function r(min, max) {
		let diff = Math.random() * (max - min);
		return min + diff;
	}

	const { scene, camera, renderer } = useThrelte();
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
	// const createEmitter = () => {
	// 	const emitter = new Emitter();

	// 	return emitter
	// 		.setRate(new Rate(new Span(10, 15), new Span(0.05, 0.1)))
	// 		.addInitializers([
	// 			new Body(createSprite()),
	// 			new Mass(1),
	// 			new Life(1, 3),
	// 			new Position(new SphereZone(20)),
	// 			new RadialVelocity(new Span(500, 800), new Vector3D(0, 1, 0), 30)
	// 		])
	// 		.addBehaviours([
	// 			new RandomDrift(10, 10, 10, 0.05),
	// 			new Scale(new Span(2, 3.5), 0),
	// 			new Gravity(6),
	// 			new Color('#FF0026', ['#ffff00', '#ffff11'], Infinity, ease.easeOutSine)
	// 		])
	// 		.setPosition({ x: 2, y: 2 })
	// 		.emit();
	// };

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

	const setupEffectComposer = () => {
		const renderPass = new RenderPass(scene, camera.current);
		composer.addPass(renderPass);

		// const bloomPass = new UnrealBloomPass(new Vector2(innerWidth, innerHeight), 0.275, 1, 0);
		// composer.addPass(bloomPass);

		// const effect1 = new ShaderPass(DotScreenShader);
		// effect1.uniforms['scale'].value = 4;
		// composer.addPass(effect1);

		// cool stuff
		// https://threejs.org/examples/?q=post#webgl_postprocessing_advanced

		// const effect2 = new ShaderPass(RGBShiftShader);
		// effect2.uniforms['amount'].value = 0.0015;
		// composer.addPass(effect2);

		const outputPass = new OutputPass();
		composer.addPass(outputPass);
	};

	//useRender(({ _ }, delta) => {

	let explosionParticles;
	let currentDelta = 0;
	useRender(({ _, renderer, __ }, delta) => {
		time += delta;
		currentDelta = delta;
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
		$camera.lookAt(cameraTarget);
		// billboarding
		//planeRef.lookAt(camera.current.position);
		//angleAccelleration *= 0.2;
		updateBoundingBoxes();
		checkIntersection();

		if (explosionParticles) {
			explosionParticles._UpdateParticles(delta);
			explosionParticles._UpdateGeometry();
		}

		composer.render();
	});
	// Function to update the bounding boxes
	function updateBoundingBoxes() {
		spaceShipColliderBox.setFromObject(playerBodyRef);
	}

	let screenshakeOffset = 0;
	function screenshake() {
		// better? https://www.youtube.com/watch?v=1i5SB8Ct1y0
		cameraTarget.y = (Math.sin(time / 30) * 0.5 + 0.5) * screenshakeOffset;
		cameraTarget.z = (Math.sin(time / 30) * screenshakeOffset) / 5;
	}

	let lastExplosion = 0;
	// Function to check for intersection
	function checkIntersection() {
		let hadExplosion = false;
		balls.forEach((ballBox) => {
			if (spaceShipColliderBox.intersectsSphere({ center: ballBox.pos, radius: ballBox.scale })) {
				//console.log('Player is overlapping the target mesh!');
				//fireRef.visible = true;
				screenshakeOffset = 1;
				hideItem(ballBox.id);
				// prevent multiple triggers
				if (lastExplosion <= 0) {
					explosionParticles._AddParticles(currentDelta, spaceShipRef.position);
					hadExplosion = true;
				}
				play();
			}
		});
		if (hadExplosion) {
			lastExplosion = 1;
		}
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
				console.log('Space key was pressed', spaceShipRef.position);
				//fireRef.visible = true;
				explosionParticles._AddParticles(currentDelta, spaceShipRef.position);
				play();
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
		console.log(scene, camera.current);
		const params = { parent: scene, camera: camera.current };
		console.log(params);
		explosionParticles = new ParticleSystemSimon(params);

		return () => {
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('keydown', onKeyPressed);
		};
	});

	// sprite hooks
	let play = () => {
		console.log('play');
	};
	let pause = () => {
		console.log('pause');
	};
	let onEnd = () => {
		console.log('ended');
	};
	let onStart = () => {
		console.log('started');
	};
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

<Spaceship
	bind:ref={spaceShipRef}
	position={[0, 0, translZ]}
	rotation={[-angleY, angleY * 0.1, 0, 'ZXY']}
/>

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
