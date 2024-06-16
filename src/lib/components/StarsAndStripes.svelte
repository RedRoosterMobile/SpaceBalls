<script>
	import { T, useFrame, forwardEventHandlers } from '@threlte/core';
	import { Float, Instance, InstancedMesh, useTexture, Billboard } from '@threlte/extras';
	import { Color, DoubleSide, Vector3, Group } from 'three';
	import { onDestroy, onMount } from 'svelte';
	import { itemsStore } from '../store.js';

	let NEBULAS_COUNT = 10;
	let nebulas = [];

	// Subscribe to the store to get the initial value and updates
	const unsubscribe = itemsStore.subscribe((value) => {
		nebulas = value;
	});

	function removeItem(id) {
		nebulas = nebulas.filter((item) => item.id !== id);
		itemsStore.set(nebulas); // Update the store
	}

	// Clean up the subscription
	onDestroy(() => {
		unsubscribe();
	});

	// TODO:
	// add sky sphere https://github.com/RedRoosterMobile/RingOfFire/blob/master/src/PurpleSky.js

	let STARS_COUNT = 350;
	let BALL_SPEED_MULT = 5;
	let colors = ['#fcaa67', '#C75D59', '#ffffc7', '#8CC5C6', '#A5898C'];
	let stars = [];

	let phase = 0;

	//let getCollidingObjects = $$restProps.getCollidingObjects;

	export const ref = new Group();

	const map = useTexture('textures/star.png');

	function r(min, max) {
		let diff = Math.random() * (max - min);
		return min + diff;
	}

	function resetStar(star) {
		if (r(0, 1) > 0.8) {
			star.pos = new Vector3(r(-10, -30), r(-5, 5), r(6, -6));
			star.len = r(1.5, 15);
		} else {
			star.pos = new Vector3(r(-15, -45 - 150), r(-10.5, 1.5), r(30, -45));
			star.len = r(2.5, 20);
		}

		star.speed = r(19.5, 42);
		star.rad = r(0.04, 0.07);
		star.color = new Color(colors[Math.floor(Math.random() * colors.length)])
			.convertSRGBToLinear()
			.multiplyScalar(1.3);

		return star;
	}

	for (let i = 0; i < STARS_COUNT; i++) {
		let star = {
			pos: null,
			len: null,
			speed: null,
			color: null
		};

		stars.push(resetStar(star));
	}

	// Function to create nebulas
	function createNebulas() {
		for (let i = 0; i < NEBULAS_COUNT; i++) {
			//const color = new Color(Math.random(), Math.random(), Math.random());
			const color = new Color(colors[Math.floor(Math.random() * colors.length)])
				.convertSRGBToLinear()
				.multiplyScalar(1.3);
			nebulas.push({
				visible: true,
				id: 'neb' + i,
				pos: new Vector3(r(-15, -45), r(-10.5, 1.5), r(30, -45)),
				color,
				scale: r(0.5, 1.5),
				speed: r(0.5, 1.5) * BALL_SPEED_MULT,
				floatSpeed: r(0.5, 1.5)
			});
		}
	}
	function resetNebula(nebula) {
		const color = new Color(colors[Math.floor(Math.random() * colors.length)])
			.convertSRGBToLinear()
			.multiplyScalar(1.3);
		nebula.visible = true;
		nebula.scale = r(0.5, 1.5);
		//nebula.pos = new Vector3(r(-15-150, -45 - 150), r(-10.5, 1.5), r(30, -45));
		nebula.pos = new Vector3(r(-15 - 150, -45 - 150), 0.5 * nebula.scale, r(30, -45));
		//nebula.pos = new Vector3(r(-40 - 150, -45 - 150), 0.5 * nebula.scale, r(30, -45));
		// nebula.pos = new Vector3(-45 - 150, 0.5 * nebula.scale, 0);
		nebula.color = color;
		nebula.speed = r(0.5, 1.5) * BALL_SPEED_MULT;
		nebula.floatSpeed = r(0.5, 1.5);

		return nebula;
	}
	createNebulas();

	onMount(() => {
		console.log('mounted', $$restProps);
	});

	useFrame((_, delta) => {
		phase += delta;
		stars.forEach((star) => {
			star.pos.x += star.speed * delta;
			if (star.pos.x > 40) resetStar(star);
		});
		stars = stars;

		nebulas.forEach((nebula) => {
			nebula.pos.x += nebula.speed * 10 * delta;
			if (nebula.pos.x > 40) {
				resetNebula(nebula);
				// } else {
				// 	if(nebula.visible==false) {

				// 	}
			}
		});
		nebulas = nebulas;

		//getCollidingObjects(nebulas);
		itemsStore.set(nebulas);
	});
	const component = forwardEventHandlers();
</script>

<T is={ref} dispose={false} {...$$restProps} bind:this={$component}>
	{#await map then value}
		<InstancedMesh limit={STARS_COUNT} range={STARS_COUNT}>
			<T.PlaneGeometry args={[1, 0.05]} />
			<T.MeshBasicMaterial side={DoubleSide} alphaMap={value} transparent />

			{#each stars as star}
				<Instance
					position={[star.pos.x, star.pos.y, star.pos.z]}
					scale={[star.len, 1, 1]}
					color={star.color}
					rotation.x={Math.PI / 2}
				/>
			{/each}
		</InstancedMesh>

		<InstancedMesh limit={NEBULAS_COUNT} range={NEBULAS_COUNT}>
			<T.SphereGeometry args={[1, 32, 32]} />

			<!--alphaMap={value} transparent-->
			<T.MeshBasicMaterial />
			{#each nebulas as nebula}
				{#if nebula.visible}
					<Instance
						position={[nebula.pos.x, 0.5 * nebula.scale, nebula.pos.z]}
						scale={[1 * nebula.scale, 1 * nebula.scale, 1 * nebula.scale]}
						color={nebula.color}
					/>
				{/if}
			{/each}
		</InstancedMesh>
	{/await}
	<!-- working -->
	<!-- <AutoColliders shape="ball" sensor={true}>
		
		<Float speed={30} floatingRange={[-1, 1]}>
			<T.Mesh position={[0, 0, 0]} castShadow receiveShadow>
				<T.SphereGeometry args={[1, 32, 32]} />
				<T.MeshStandardMaterial color={'blue'} />
			</T.Mesh>
		</Float>
	</AutoColliders> -->
</T>
