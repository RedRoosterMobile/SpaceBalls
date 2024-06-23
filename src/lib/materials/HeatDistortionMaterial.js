import * as THREE from 'three';
import {
  AddEquation,
  BoxGeometry,
  CustomBlending,
  CylinderGeometry,
  Group,
  LessEqualDepth,
  MeshBasicMaterial,
  OneFactor,
  ShaderMaterial,
  TextureLoader
} from 'three';
const HeatDistortionMaterial = new ShaderMaterial({
	uniforms: {
		time: { value: 0.0 },
		noiseTexture: { value: new TextureLoader().load('./textures/grid.png') },
		distortionStrength: { value: 0.1 }
	},
	vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `,
	fragmentShader: `
        uniform float time;
        uniform sampler2D noiseTexture;
        uniform float distortionStrength;
        varying vec2 vUv;

        void main() {
            vec2 uv = vUv;

            // Sample the noise texture
            vec2 noiseUv = uv + vec2(time * 0.1, time * 0.1);
            vec4 noise = texture2D(noiseTexture, noiseUv);

            // Apply distortion based on noise
            uv += (noise.xy * 2.0 - 1.0) * distortionStrength;

            // Output the distorted color (example: a simple orange color)
            vec4 color = vec4(1.0, 0.4, 0.02, 1.0);

            gl_FragColor = color;
        }
    `
});
console.log(HeatDistortionMaterial);

export { HeatDistortionMaterial };


// https://chatgpt.com/c/2e746c32-a246-4ac7-a755-459f0aa19582


/**
 import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { HeatDistortionMaterial } from './HeatDistortionMaterial';

const ExhaustPipe = ({ afterBurnerScaleY }) => {
    const meshRef = useRef();

    useEffect(() => {
        const animate = () => {
            requestAnimationFrame(animate);
            HeatDistortionMaterial.uniforms.time.value += 0.05;
        };
        animate();
    }, []);

    return (
        <mesh
            ref={meshRef}
            position={[740, -60, -1350 - 10]}
            rotation-x={Math.PI * 0.5}
            scale-y={afterBurnerScaleY}
        >
            <cylinderGeometry args={[70, 0, 1600, 15]} />
            <primitive attach="material" object={HeatDistortionMaterial} />
        </mesh>
    );
};

export default ExhaustPipe;

 */