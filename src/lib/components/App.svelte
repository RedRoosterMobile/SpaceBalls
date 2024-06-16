<script>
	import { Canvas } from '@threlte/core';
	import Scene from './Scene.svelte';
	import { PerfMonitor } from '@threlte/extras';
	// import { World, Debug } from '@threlte/rapier';
</script>

<Canvas>
  <PerfMonitor anchorX={'left'}  logsPerSecond={30}/>
	<Scene />
</Canvas>
