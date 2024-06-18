<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { Color, DoubleSide, Group, ShaderMaterial, Vector3, Mesh } from 'three';
	import { FishGeometry } from '../classes/FishGeometry';
	import { Boid } from '../classes/Boid';
	import { onMount } from 'svelte';

	let groupRef = null;
	const fishNum = 200;
	const boids = [];
	const fishes = [];

	const { position } = $$restProps;

	//----filled fish
	const geometry = new FishGeometry(0.1);
	const uniforms = {
		topColor: { value: new Color(0x11e8bb) },
		bottomColor: { value: new Color(0x8200c9) },
		offset: { value: 0.1 },
		exponent: { value: 2.0 },
		brightness: { value: 0.5 }
	};

	const material = new ShaderMaterial({
		uniforms: uniforms,
		vertexShader: /* glsl */ `
      varying vec3 vWorldPosition;

			void main() {
				vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
				vWorldPosition = worldPosition.xyz;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}
      `,
		fragmentShader: /* glsl */ `
      uniform vec3 topColor;
			uniform vec3 bottomColor;
			uniform float offset;
			uniform float exponent;
      uniform float brightness;

			varying vec3 vWorldPosition;

			void main() {

				float h = normalize( vWorldPosition ).y + offset;
				vec4 beforeDark = vec4( mix( bottomColor, topColor, max( pow( max( h, 0.0 ), exponent ), 0.0 ) ), 1.0 );
        gl_FragColor = beforeDark * vec4(vec3(brightness,brightness,brightness),1.);

			}
      `,
		side: DoubleSide
	});

	//const offset = new Vector3(...(props.position || [0, 0, 0]));
	const offset = position
		? new Vector3(position[0], position[1], position[2])
		: new Vector3(0, 0, 0);
	
	const var1 = 4;
	const var2 = 2;
	for (let i = 0; i < fishNum; i++) {
		//boids[i] = new Boid(0.38, 0.3);
		boids[i] = new Boid(1, 0.05);
		const boid = boids[i];
		boid.position.x = Math.random() * var1 - var2 + offset.x;
		boid.position.y = Math.random() * var1 - var2 + offset.y;
		boid.position.z = Math.random() * var1 - var2 + offset.z;
		boid.velocity.x = Math.random() * 2 - 1;
		boid.velocity.y = Math.random() * 2 - 1;
		boid.velocity.z = Math.random() * 2 - 1;
		boid.setAvoidWalls(true);
		// a bit wider on the plane to make them go away and come back
		boid.setWorldSize(32, 32, 32);

		// Assuming you have your material, geometry, and boid defined somewhere
		const mesh = new Mesh(geometry, material);
		mesh.position.set(boid.position.x, boid.position.y, boid.position.z);

		// size of the fish
		//mesh.scale.multiplyScalar(0.5);

		fishes[i] = mesh;
	}

	let isInitialized = false;
	onMount(() => {
		groupRef.children = fishes;

        // no effect
		// groupRef.scale.x = 0.1;
		// groupRef.scale.y = 0.1;
		// groupRef.scale.z = 0.1;
		// console.log(groupRef.scale);

		isInitialized = true;
	});

	let time = 0;
	let diff = 0;
	useTask((delta) => {
		time += delta;
		if (isInitialized && diff > 0.32) {
			for (let i = 0; i < boids.length; i++) {
				const boid = boids[i];
				boid.run(boids);
				const fish = groupRef.children[i];
				fish.position.copy(boids[i].position);
				fish.rotation.y = Math.atan2(-boid.velocity.z, boid.velocity.x);
				fish.rotation.z = Math.asin(boid.velocity.y / boid.velocity.length());
			}
		}
		diff += delta;
	});
</script>

<T.Group bind:ref={groupRef} />
