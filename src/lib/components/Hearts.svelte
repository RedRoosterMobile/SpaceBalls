<script>
	import { T, useTask, useThrelte } from '@threlte/core';
	import { FakeGlowMaterial, Float } from '@threlte/extras';
	import { ShapeGeometry, ExtrudeGeometry, Shape, Group, Vector3 } from 'three';
	function heartShapeGeo() {
		// Create a heart shape
		let x = 0,
			y = 0;
		const heartShape = new Shape();

		heartShape.moveTo(x + 5, y + 5);
		heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
		heartShape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
		heartShape.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19);
		heartShape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
		heartShape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
		heartShape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);
		// Define extrusion settings
		let extrudeSettings = {
			steps: 2,
			depth: 2,
			bevelEnabled: false,
			bevelThickness: 0.5,
			bevelSize: 1,
			bevelOffset: 0,
			bevelSegments: 1
		};

		const geometry = new ExtrudeGeometry(heartShape, extrudeSettings);

		//let geometry = new ShapeGeometry(heartShape);
		geometry.rotateY(Math.PI / 2);
		// Flip the geometry by scaling
		geometry.scale(0.1, -0.1, 0.1); // Flips the geometry along the x-axis
		geometry.translate(0.5, 5, 0); // Moves the origin by 0.5 units along x and y axes
		return geometry;
	}
	let groupRef;
	const geo = heartShapeGeo();
	let time = 0;
	const { camera } = useThrelte();
	useTask((delta) => {
		time += delta;
		if (groupRef) {
			// WARNING: when motion blur kicks in it flickers
			// or when shooting?

			// Calculate the lower left corner in NDC (Normalized Device Coordinates)
			const lowerLeftNDC = new Vector3(0, -1, -1);
			lowerLeftNDC.unproject($camera);
			const dir = lowerLeftNDC.sub($camera.position).normalize();
			const distance = -$camera.position.y / dir.y;
			const position = $camera.position.clone().add(dir.multiplyScalar(distance));

			groupRef.position.copy(position);
		}
	});
</script>

<Float speed={10} floatingRange={[-0.1, 0.1]}>
	<T.Group scale={0.1} bind:ref={groupRef}>
		<Float speed={10} floatingRange={[-0.1, 0.1]}>
			<T.Mesh geometry={geo}>
				<!--transparent={true} opacity={0.1}-->
				<T.MeshBasicMaterial color={0xff0000} />
			</T.Mesh>
		</Float>
		<!-- <T.Mesh geometry={geo} position.z={0}>
			<FakeGlowMaterial glowColor={0xff0000} />
		</T.Mesh> -->
		<T.Mesh geometry={geo} position.z={-2.5}>
			<T.MeshBasicMaterial color={0xff0000} />
		</T.Mesh>
		<Float speed={10} floatingRange={[-0.1, 0.1]}>
			<T.Mesh geometry={geo} position.z={-5}>
				<T.MeshBasicMaterial color={0xff0000} />
			</T.Mesh>
		</Float>
	</T.Group>
</Float>
