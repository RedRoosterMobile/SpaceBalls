<script>
	import * as THREE from 'three';
	import { T, useThrelte, useTask } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import { SimonDevGLSLCourse } from '../classes/SimonDevGLSLCourse';

	const { scene, camera, renderer } = useThrelte();
	renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));

	const grass = new SimonDevGLSLCourse();
	let grassInitialized = false;
	grass.initialize(renderer, scene, $camera).then(() => {
		console.log('initialized');
		grassInitialized = true;
	});
	useTask((delta) => {
		if (grassInitialized) grass.update(delta);
	});
</script>

<!-- original position={[-5, 6, 10]} -->
<T.PerspectiveCamera makeDefault position={[24, 3, 0]} fov={25}>
	<OrbitControls enableDamping target={[0, 0, 0]} />
</T.PerspectiveCamera>

<T.DirectionalLight intensity={1.8} position={[0, 10, 0]} castShadow shadow.bias={-0.0001} />
