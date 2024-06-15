<script>
	import { Canvas } from '@threlte/core';
	import Scene from './Scene.svelte';
	import { World, Debug } from '@threlte/rapier';
</script>

<Canvas>
	<World >
		<Debug />
		<Scene />
	</World>
</Canvas>
