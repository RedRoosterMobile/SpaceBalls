<script lang="js">
	import { r } from '../helpers';
	import { T, useTask, useThrelte } from '@threlte/core';
	import {
		Mesh,
		PlaneGeometry,
		DoubleSide,
		MeshPhongMaterial,
		Vector3,
		Object3D,
		InstancedMesh
	} from 'three';
	const { scene } = useThrelte();

	const offsetPosition = new Vector3(-100 / 2, 0, -150 / 2 / 2);
	const planes = [];
	// animate this when instanced!! like an effect
	const LEAVES_COUNT = 100; // was 100
	const rand = Math.random;
	const planeMat = new MeshPhongMaterial({
		//color: 0xffffff * 0.4,
		color: 0xff0080,
		shininess: 0.5,
		specular: 0xff0080,
		emissive: 0x800080,
		emissiveIntensity: 10.5,

		side: DoubleSide,
		forceSinglePass: true
	});
	const planePiece = new PlaneGeometry(2.5, 5, 1, 1);
	const scale = 1;
	let startX = 0;

	//const instancedMesh = new InstancedMesh(planePiece, planeMat, LEAVES_COUNT);
	const dummy = new Object3D();
	for (let i = 0; i < LEAVES_COUNT; i++) {
		const plane = new Mesh(planePiece, planeMat);
		plane.rotation.set(r(-1, 1), r(-1, 1), r(-1, 1));

		// crank rotation x to make it a star
		// do like src/lib/components/StarsAndStripes.svelte with the intances
		plane.rotation.dx = rand() * 0.1;
		plane.rotation.dy = rand() * 0.1;
		plane.rotation.dz = rand() * 0.1;

		plane.position.set(
			((rand() * 10) / 2) * scale, // was 100
			0 + rand() * 30 * scale,
			((rand() * 150) / 2) * scale
		);
		startX = plane.position.x;
		plane.position.add(offsetPosition);
		plane.position.dx = rand() - 0.05;
		plane.position.dz = rand() - 0.05;
		// size of particles
		plane.scale.multiplyScalar(rand() * 0.25);
		scene.add(plane);
		planes.push(plane);
	}

	let time = 0;

	function updateInstance(index, delta) {
		const plane = planes[index];
		// this need to be positioned over the player or sth.
		plane.rotation.x += plane.rotation.dx;
		plane.rotation.y += plane.rotation.dy;
		plane.rotation.z += plane.rotation.dz;
		plane.position.y -= delta * 10;
		//plane.position.y = 0.0;
		plane.position.x += plane.position.dx;
		//plane.position.z += plane.position.dz;

		if (plane.position.y < -25) {
			plane.position.y += 25 * 1.5;
		}
		if (plane.position.x > 1) {
			plane.position.x = startX - 100;
		}
	}

	useTask((delta) => {
		time += delta;
		for (let i = 0; i < LEAVES_COUNT; i++) {
			updateInstance(i, delta);
		}
	});
</script>

<!-- 
<InstancedMesh limit={LEAVES_COUNT} range={LEAVES_COUNT}>
	<T.PlaneGeometry args={[2.5, 5, 1, 1]} />
	<T.MeshBasicMaterial side={DoubleSide} />

	{#each planes as plane}
		<Instance
			position={[plane.position.x, plane.position.y, plane.position.z]}
			scale={[star.len, 1, 1]}
			color={star.color}
			rotation={lookAtOrigin(star.pos)}
		/>
	{/each}
</InstancedMesh> -->

<!--
To use instanced meshes in a Three.js way within your Svelte component, you can follow these steps:

Create an InstancedMesh: Since the mesh and the material are always the same for all instances, you can create a single InstancedMesh instead of multiple Mesh objects. This is more efficient for rendering a large number of the same object.

Set Instance Transformations: For each instance, you need to set its position, rotation, and scale. These transformations can be applied using a matrix that combines all three transformations.

Update the InstancedMesh in the Animation Loop: If you want to animate the instances (e.g., falling leaves), update their transformations within the useTask animation loop.

Here's how you can modify your code to use InstancedMesh:

Math.random() * 0.25 + 0.75;

        const matrix = new Matrix4();
        matrix.makeRotationFromEuler(new THREE.Euler(rotation.x, rotation.y, rotation.z, 'XYZ'));
        matrix.setPosition(position);
        matrix.scale(new Vector3(scale, scale, scale));

        instancedMesh.setMatrixAt(index, matrix);
        instancedMesh.instanceMatrix.needsUpdate = true;
    }

    useTask((delta) => {
        // Update your instances here if needed for animation
    });

</script>
This example demonstrates how to initialize an InstancedMesh with a specified geometry and material, and then position, rotate, and scale each instance using a transformation matrix. Remember to call instancedMesh.instanceMatrix.needsUpdate = true after modifying the instances to ensure the changes are reflected in the render.
-->
