<script>
	import { T, useRender, useThrelte } from '@threlte/core';
	import { OrbitControls, Sky, Stars, Grid } from '@threlte/extras';
	import Spaceship from './models/spaceship.svelte';
	import {
		Color,
		Mesh,
		MeshBasicMaterial,
		PMREMGenerator,
		PlaneGeometry,
		Raycaster,
		Vector2,
		Vector3,
		DoubleSide
	} from 'three';
	import { onMount } from 'svelte';
	import StarsAndStripes from './StarsAndStripes.svelte';
	import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
	import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
	import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
	import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
	import PurpleSky from './PurpleSky.svelte';

	const { scene, camera, renderer } = useThrelte();
	let spaceShipRef;
	let starsAndStripesRef;
	let intersectionPoint;
	let translZ = 0;
	let translY = 0;
	let translX = 0;
	let translAccelleration = 0;
	let angleZ = 0;
	let angleX = 0;
	let angleY = 0;
	let angleAccelleration = 0;
	let pmrem = new PMREMGenerator(renderer);
	let envMapRT;

	let planeRef;

	const composer = new EffectComposer(renderer);
	composer.setSize(innerWidth, innerHeight);

	const setupEffectComposer = () => {
		const renderPass = new RenderPass(scene, camera.current);
		composer.addPass(renderPass);

		// const bloomPass = new UnrealBloomPass(new Vector2(innerWidth, innerHeight), 0.275, 1, 0);
		// composer.addPass(bloomPass);

		const outputPass = new OutputPass();
		composer.addPass(outputPass);
	};

	// takes control of the render loop, unlike useFrame
	// https://threlte.xyz/docs/reference/core/use-render
	useRender(({ scene }) => {
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
			translAccelleration += (targetZ - translZ) * 0.002; // stiffness
			translAccelleration *= 0.95; // damping
			translZ += translAccelleration;

			const dir = intersectionPoint.clone().sub(new Vector3(0, translZ, 0)).normalize();
			const dirCos = dir.dot(new Vector3(0, 0, 1));
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
		// billboarding
		//planeRef.lookAt(camera.current.position);

		composer.render();
	});

	onMount(() => {
		setupEffectComposer();

		const planeGeo = new PlaneGeometry(40, 40);
		//const planeMat = new MeshBasicMaterial();
		//planeMat.color=0xff0000;
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
				console.log('Space key was pressed');
				// starsAndStripesRef.visible = !starsAndStripesRef.visible;
				console.log(camera.current.position);
			}
		}

		window.addEventListener('keydown', onKeyPressed);
		window.addEventListener('pointermove', onPointerMove);
		return () => {
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('keydown', onKeyPressed);
		};
	});
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

<StarsAndStripes bind:ref={starsAndStripesRef} />
<!-- https://threlte.xyz/docs/reference/extras/stars -->
<!-- <Stars lightness={0.1} factor={6}  radius={50}/> -->
<!-- <PurpleSky/> -->
<Grid sectionThickness={0} infiniteGrid cellColor="#dddddd" cellSize={2} />
