<script>
	import { T, useTask, useThrelte } from '@threlte/core';
	import { Object3D, SphereGeometry, MeshBasicMaterial, InstancedMesh } from 'three';
	import { Vector3 } from 'three';
	const { scene, camera, renderer } = useThrelte();

	const particleCount = 1000;
	const dummy = new Object3D();
	let instancedMesh;

	const gridSize = 32;
	const particles = [];

	init();
	function init() {
		// why a shpere??
		const geometry = new SphereGeometry(0.05, 16, 16);
		const material = new MeshBasicMaterial({ color: 0xffffff });
		instancedMesh = new InstancedMesh(geometry, material, particleCount);

		let index = 0;
		for (let i = 0; i < gridSize; i++) {
			for (let j = 0; j < gridSize; j++) {
				const x = i - gridSize / 2;
				const y = j - gridSize / 2;
				dummy.position.set(x, y, 0);
				dummy.updateMatrix();
				instancedMesh.setMatrixAt(index, dummy.matrix);
				particles.push({ x, y });
				index++;
			}
		}

		scene.add(instancedMesh);
	}

	function updateParticles() {
		for (let i = 0; i < particleCount; i++) {
			const particle = particles[i];
			const y = particle.x + Math.sin(time * 10 + particle.x * 0.5) * 0.5;
			const x = particle.y + Math.sin(time) + Math.sin(time * 7.5 + particle.y * 0.5) * 0.5;
			//Math.sin(time) + Math.sin(time * 2) / 2;
			const z = Math.sin(time) + (i % 2) * Math.cos(time);
			// play with order to rotate
			dummy.position.set(x, z, y);
			// shit not working...
			//dummy.setRotationFromAxisAngle()
			//dummy.rotateX((i / particleCount) * Math.PI * 2);
      //(true) && dummy.rotateOnWorldAxis(new Vector3(1,0,0),Math.PI/2)
			dummy.updateMatrix();
			instancedMesh.setMatrixAt(i, dummy.matrix);
		}

		instancedMesh.instanceMatrix.needsUpdate = true;
	}

	let time = 0;
	useTask((delta) => {
		time += delta;
		updateParticles();
	});
</script>
