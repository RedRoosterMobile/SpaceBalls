<script lang="js">
	function r(min, max) {
		let diff = Math.random() * (max - min);
		return min + diff;
	}
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
	// crankable without major caveats!!!
	const LEAVES_COUNT = 50;
	let startX=0;
	const rand = Math.random;
	const planeMat = new MeshPhongMaterial({
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

	const instancedMesh = new InstancedMesh(planePiece, planeMat, LEAVES_COUNT);
	const dummy = new Object3D();

	const rotations = [];
	const positions = [];
	const velocities = [];

	for (let i = 0; i < LEAVES_COUNT; i++) {
		const rotation = {
			x: r(-1, 1),
			y: r(-1, 1),
			z: r(-1, 1),
			dx: rand() * 0.1,
			dy: rand() * 0.1,
			dz: rand() * 0.1
		};
		rotations.push(rotation);

		const position = {
			x: ((rand() * 10) / 2) * scale,
			y: 0 + rand() * 30 * scale,
			z: ((rand() * 150) / 2) * scale,
			dx: rand() - 0.05,
			dz: rand() - 0.05
		};
		position.x += offsetPosition.x;
		position.z += offsetPosition.z;
		positions.push(position);

		const velocity = { x: rand() - 0.05, y: -(rand() * 0.1), z: rand() - 0.05 };
		velocities.push(velocity);

		dummy.position.set(position.x, position.y, position.z);
		dummy.rotation.set(rotation.x, rotation.y, rotation.z);
		dummy.scale.setScalar(rand() * 0.25);

		dummy.updateMatrix();
		instancedMesh.setMatrixAt(i, dummy.matrix);
	}
	scene.add(instancedMesh);

	let time = 0;

	function updateInstance(index, delta) {
		const rotation = rotations[index];
		const position = positions[index];
		const velocity = velocities[index];

		rotation.x += rotation.dx;
		rotation.y += rotation.dy;
		rotation.z += rotation.dz;
		position.y += velocity.y * delta * 100;
		position.x += velocity.x * delta * 100;
		// debatable, more like snow
		// position.z += velocity.z * delta * r(-1,1);

		if (position.y < -25) {
			position.y += 25 * 1.5;
		}
		if (position.x > 1) {
			position.x = startX - 100;
		}

		dummy.position.set(position.x, position.y, position.z);
		dummy.rotation.set(rotation.x, rotation.y, rotation.z);

		dummy.updateMatrix();
		instancedMesh.setMatrixAt(index, dummy.matrix);
	}

	useTask((delta) => {
		time += delta;
		for (let i = 0; i < LEAVES_COUNT; i++) {
			updateInstance(i, delta);
			instancedMesh.instanceMatrix.needsUpdate = true;
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
