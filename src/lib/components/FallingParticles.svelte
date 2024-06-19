<script lang="js">
	function r(min, max) {
		let diff = Math.random() * (max - min);
		return min + diff;
	}
	import { T, useTask, useThrelte } from '@threlte/core';
	import { Mesh, PlaneGeometry, DoubleSide, MeshPhongMaterial, Vector3 } from 'three';
	const { scene, camera, renderer } = useThrelte();
	// particlez

	const offsetPosition = new Vector3(-100 / 2, 0, -150 / 2 / 2);
	const planes = [];
	const leaves = 100;
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
	const planePiece = new PlaneGeometry(5, 5, 1, 1);
	const scale = 1;
	for (let i = 0; i < leaves; i++) {
		const plane = new Mesh(planePiece, planeMat);
		plane.rotation.set(r(-1, 1), r(-1, 1), r(-1, 1));
		plane.rotation.dx = rand() * 0.1;
		plane.rotation.dy = rand() * 0.1;
		plane.rotation.dz = rand() * 0.1;

		plane.position.set(
			((rand() * 100) / 2) * scale,
			0 + rand() * 30 * scale,
			((rand() * 150) / 2) * scale
		);
		plane.position.add(offsetPosition);
		plane.position.dx = rand() - 0.05;
		plane.position.dz = rand() - 0.05;
		// size of particles
		plane.scale.multiplyScalar(rand() * 0.25);
		scene.add(plane);
		planes.push(plane);
	}

	let time = 0;

	useTask((delta) => {
		time += delta;
		for (let i = 0; i < leaves; i++) {
			const plane = planes[i];
			// this need to be positioned over the player or sth.
			plane.rotation.x += plane.rotation.dx;
			plane.rotation.y += plane.rotation.dy;
			plane.rotation.z += plane.rotation.dz;
			plane.position.y -= delta * 10;
			//plane.position.y = 0.0;
			//plane.position.x -= plane.position.dx;
			//plane.position.z += plane.position.dz;

			if (plane.position.y < -25) plane.position.y += 25 * 1.5;
		}
	});
</script>

<T.Mesh position.y={-2.3} visible={$$restProps.visible} />

<!--

<script lang="js">
	function r(min, max) {
		let diff = Math.random() * (max - min);
		return min + diff;
	}
	import { T, useTask, useThrelte } from '@threlte/core';
	import { PlaneGeometry, DoubleSide, MeshPhongMaterial, Vector3, InstancedMesh, Matrix4 } from 'three';
	const { scene, camera, renderer } = useThrelte();
	
	const offsetPosition = new Vector3(-100/2, 0, -150/2/2);
	const leaves = 100;
	const rand = Math.random;
	const planeMat = new MeshPhongMaterial({
		color: 0xff0080,
		shininess: 0.5,
		specular: 0xff0080,
		side: DoubleSide,
		forceSinglePass: true
	});
	const planePiece = new PlaneGeometry(5, 5, 1, 1);
	const instancedMesh = new InstancedMesh(planePiece, planeMat, leaves);
	const scale = 1;
	const dummy = new Matrix4();

	const planes = [];
	for (let i = 0; i < leaves; i++) {
		const rotation = new Vector3(r(-1, 1), r(-1, 1), r(-1, 1));
		rotation.dx = rand() * 0.1;
		rotation.dy = rand() * 0.1;
		rotation.dz = rand() * 0.1;

		const position = new Vector3(rand() * 100/2 * scale, 0 + rand() * 30 * scale, rand() * 150/2 * scale);
		position.add(offsetPosition);
		position.dx = rand() - 0.05;
		position.dz = rand() - 0.05;
		const scaleFactor = rand() * 0.5;

		planes.push({ position, rotation, scaleFactor });

		dummy.identity();
		dummy.makeRotationFromEuler(rotation);
		dummy.setPosition(position);
		dummy.scale(new Vector3(scaleFactor, scaleFactor, scaleFactor));
		instancedMesh.setMatrixAt(i, dummy);
	}

	scene.add(instancedMesh);

	let time = 0;

	useTask((delta) => {
		time += delta;
		for (let i = 0; i < leaves; i++) {
			const plane = planes[i];
			plane.rotation.x += plane.rotation.dx;
			plane.rotation.y += plane.rotation.dy;
			plane.rotation.z += plane.rotation.dz;
			plane.position.y -= 0.1;

			if (plane.position.y < 0) plane.position.y += 25;

			dummy.identity();
			dummy.makeRotationFromEuler(plane.rotation);
			dummy.setPosition(plane.position);
			dummy.scale(new Vector3(plane.scaleFactor, plane.scaleFactor, plane.scaleFactor));
			instancedMesh.setMatrixAt(i, dummy);
		}
		instancedMesh.instanceMatrix.needsUpdate = true;
	});
</script>

<T.Mesh position.y={-2.3} visible={$$restProps.visible} />

-->
