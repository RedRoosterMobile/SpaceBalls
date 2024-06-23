<script lang="js">
	import { useTask, useThrelte } from '@threlte/core';
	import {
		PlaneGeometry,
		DoubleSide,
		FrontSide,
		MeshPhongMaterial,
		Vector3,
		Object3D,
		InstancedMesh
	} from 'three';
	import { r } from '../helpers';
	const { scene } = useThrelte();

	const startOffsetPosition = new Vector3(-100 / 2, 0, -150 / 2 / 2);
	// crankable without major performance caveats!!!
	const LEAVES_COUNT = 50;
	let startX = 0;
	const rand = Math.random;
	const planeMat = new MeshPhongMaterial({
		color: 0xff0080,
		shininess: 0.5,
		specular: 0xff0080,
		emissive: 0x800080,
		emissiveIntensity: 7.5,
		side: DoubleSide
		//side: FrontSide,
		//forceSinglePass: true
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
		position.x += startOffsetPosition.x;
		position.z += startOffsetPosition.z;
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

		let offScreenOffsetZ = 0;
		if ($$restProps.amount < index+1) {
			offScreenOffsetZ = 1000;
		}
		dummy.position.set(position.x, position.y, position.z + offScreenOffsetZ);
		dummy.rotation.set(rotation.x, rotation.y, rotation.z);

		dummy.updateMatrix();
		instancedMesh.setMatrixAt(index, dummy.matrix);
	}

	let time = 0;
	useTask((delta) => {
		time += delta;
		for (let i = 0; i < LEAVES_COUNT; i++) {
			updateInstance(i, delta);
			instancedMesh.instanceMatrix.needsUpdate = true;
		}
	});
</script>
