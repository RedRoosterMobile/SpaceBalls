<script>
	import { Canvas } from '@threlte/core';
	import Scene from './Scene.svelte';
	import { PerfMonitor } from '@threlte/extras';
</script>

<Canvas>
  <PerfMonitor anchorX={'left'}  logsPerSecond={30}/>
	<Scene />
</Canvas>
