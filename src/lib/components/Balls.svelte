<script>
	import { GlobalData } from './GlobalData';
	import { T, useTask, useThrelte } from '@threlte/core';
	import { Object3D, SphereGeometry, MeshBasicMaterial, InstancedMesh } from 'three';
	import { Vector3, Color } from 'three';
	const { scene } = useThrelte();
	import { r } from '../helpers';

	let BALLS_COUNT = 1;
	let BALL_SPEED_MULT = 5;
	let resetOffscreenX = 40;
	// let BALLS_COUNT = 5;
	// let BALL_SPEED_MULT = 2.5;
	let balls = GlobalData.balls;
	let colors = ['#fcaa67', '#C75D59', '#ffffc7', '#8CC5C6', '#A5898C'];
	const dummy = new Object3D();
	let instancedMesh;
	// Function to create nebulas
	function createBalls() {
		const geometry = new SphereGeometry(1, 32, 32);
		const material = new MeshBasicMaterial();
		instancedMesh = new InstancedMesh(geometry, material, BALLS_COUNT);
		for (let i = 0; i < BALLS_COUNT; i++) {
			const color = new Color(colors[Math.floor(Math.random() * colors.length)])
				.convertSRGBToLinear()
				.multiplyScalar(1.3);
			const ballData = {
				visible: true,
				id: 'neb' + i,
				pos: new Vector3(r(1, resetOffscreenX), r(-10.5, 1.5), r(30, -45)),
				color,
				scale: r(0.5, 1.5),
				speed: r(0.5, 1.5) * BALL_SPEED_MULT,
				floatSpeed: r(0.5, 1.5),
				offset: 0,
				zFactor: Math.random() * 2 - 1, // Random value between -1 and 1
				zTween: {
					start: r(30, -45),
					end: r(30, -45) + (Math.random() * 2 - 1) * 5,
					duration: Math.random() * 3 + 2,
					elapsed: 0
				}
			};
			balls.push(ballData);
			dummy.position.copy(ballData.pos);
			dummy.updateMatrix();
			instancedMesh.setMatrixAt(i, dummy.matrix);
		}
		scene.add(instancedMesh);
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
		//ball.pos = new Vector3(-200, 0.5 * ball.scale, 0);

		ball.color = color;
		ball.speed = r(0.5, 1.5) * BALL_SPEED_MULT;
		ball.floatSpeed = r(0.5, 1.5);
		ball.visible = true;
		ball.zFactor = Math.random() * 2 - 1;
		ball.zTween = {
			start: r(19, -19),
			end: r(19, -19) + (Math.random() * 2 - 1) * 5,
			duration: Math.random() * 3 + 2,
			elapsed: 0
		};
		balls[index] = ball;
	}

	// Tweening function to update the ball's z position smoothly
	function updateTween(ball, delta) {
		ball.zTween.elapsed += delta;
		if (ball.zTween.elapsed >= ball.zTween.duration) {
			ball.zTween.start = ball.pos.z;
			ball.zTween.end = ball.pos.z + (Math.random() * 2 - 1) * 5;
			ball.zTween.duration = Math.random() * 3 + 2;
			ball.zTween.elapsed = 0;
		}
		let t = ball.zTween.elapsed / ball.zTween.duration;
		ball.pos.z = ball.zTween.start + t * (ball.zTween.end - ball.zTween.start);
	}

	// Initialize balls
	createBalls();

	let time = 0;

	const vecZero = new Vector3(0, 0, 0);
	const vecOffScreen = new Vector3(0, 0, 2000);
	useTask((delta) => {
		time += delta;
		let index = 0;
		balls.forEach((ball) => {
			ball.pos.x += ball.speed * 10 * delta;
			if (ball.pos.x > resetOffscreenX) {
				resetBall(ball, index);
			}

			updateTween(ball, delta);

			// update the instances
			dummy.position.copy(ball.pos.add(ball.visible ? vecZero : vecOffScreen));
			dummy.scale.set(ball.scale, ball.scale, ball.scale);
			dummy.updateMatrix();
			instancedMesh.setMatrixAt(index, dummy.matrix);
			instancedMesh.setColorAt(index, ball.color);
			index++;
		});
		instancedMesh.instanceMatrix.needsUpdate = true;
	});
</script>
