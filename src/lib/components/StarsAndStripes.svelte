<script>
	import { T, useFrame, forwardEventHandlers } from '@threlte/core';
	import { Float, Instance, InstancedMesh, useTexture, Billboard } from '@threlte/extras';
	import {
		Color,
		DoubleSide,
		BackSide,
		FrontSide,
		Vector3,
		Group,
		
		RGB_PVRTC_2BPPV1_Format
	} from 'three';
	import { onDestroy, onMount } from 'svelte';
	import { itemsStore } from '../store.js';
	import { r } from '../helpers';

	let BALLS_COUNT = 10;
	let BALL_SPEED_MULT = 5;
	let balls = [];

	// Subscribe to the store to get the initial value and updates
	const unsubscribe = itemsStore.subscribe((value) => {
		balls = value;
	});

	// Clean up the subscription
	onDestroy(() => {
		unsubscribe();
	});

	let STARS_COUNT = 350;
	let colors = ['#fcaa67', '#C75D59', '#ffffc7', '#8CC5C6', '#A5898C'];
	let stars = [];

	let time = 0;

	//let getCollidingObjects = $$restProps.getCollidingObjects;

	export const ref = new Group();

	const map = useTexture('textures/star.png');

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
	function createBalls() {
		for (let i = 0; i < BALLS_COUNT; i++) {
			//const color = new Color(Math.random(), Math.random(), Math.random());
			const color = new Color(colors[Math.floor(Math.random() * colors.length)])
				.convertSRGBToLinear()
				.multiplyScalar(1.3);
			balls.push({
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
	function resetBall(ball, index) {
		const color = new Color(colors[Math.floor(Math.random() * colors.length)])
			.convertSRGBToLinear()
			.multiplyScalar(1.3);

		ball.scale = r(0.5, 1.5);
		//ball.scale = 1;

		//nebula.pos = new Vector3(r(-15-150, -45 - 150), r(-10.5, 1.5), r(30, -45));

		// back, but random
		ball.pos = new Vector3(r(-200, -255), 0.5 * ball.scale, r(19, -19));

		// all in one line
		//ball.pos = new Vector3(-200, 0.5 * ball.scale, -5);

		ball.color = color;
		ball.speed = r(0.5, 1.5) * BALL_SPEED_MULT;
		//ball.speed = 1;
		ball.floatSpeed = r(0.5, 1.5);
		ball.visible = true;
		balls[index] = ball;
	}
	createBalls();

	onMount(() => {
		console.log('mounted', $$restProps);
	});

	useFrame((_, delta) => {
		time += delta;
		stars.forEach((star) => {
			star.pos.x += star.speed * delta;
			if (star.pos.x > 40) resetStar(star);
		});
		stars = stars;
		let index = 0;
		balls.forEach((ball) => {
			ball.pos.x += ball.speed * 10 * delta;
			if (ball.pos.x > 40) {
				resetBall(ball, index);
				index++;
			}
		});
		balls = balls;

		itemsStore.set(balls);
	});
	const component = forwardEventHandlers();
	function lookAtOrigin(position) {
		const dx = -position.x;
		const dy = -position.y;
		const dz = -position.z;

		const distanceXY = Math.sqrt(dx * dx + dy * dy);
		const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

		const rotationY = Math.atan2(dx, dz);
		const rotationX = Math.atan2(dy, distanceXY);

		return [rotationX, 0, 0]; // Assuming no roll needed
	}
</script>

<T is={ref} dispose={false} {...$$restProps} bind:this={$component}>
	{#await map then value}
		<InstancedMesh limit={STARS_COUNT} range={STARS_COUNT}>
			<T.PlaneGeometry args={[1, 0.05]} />
			<!--alphaMap={value} alphaTest={0.5}-->
			<T.MeshBasicMaterial side={DoubleSide} transparent alphaMap={value}  />

			{#each stars as star}
				<Instance
					position={[star.pos.x, star.pos.y, star.pos.z]}
					scale={[star.len, 1, 1]}
					color={star.color}
					rotation={lookAtOrigin(star.pos)}
				/>
				<!-- //rotation.x={Math.PI / 2} -->
			{/each}
		</InstancedMesh>

		<InstancedMesh limit={BALLS_COUNT} range={BALLS_COUNT}>
			<T.SphereGeometry args={[1, 32, 32]} />

			<T.MeshBasicMaterial />
			{#each balls as ball}
				{#if ball.visible}
					<Instance
						position={[ball.pos.x, 0.5 * ball.scale, ball.pos.z]}
						scale={[1 * ball.scale, 1 * ball.scale, 1 * ball.scale]}
						color={ball.color}
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
