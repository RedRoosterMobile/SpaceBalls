<script>
	import { T, useFrame } from '@threlte/core';
	import { Float, Instance, InstancedMesh, useTexture } from '@threlte/extras';
	// import { Color, DoubleSide, Vector3, Sphere } from 'three';
	import { onMount } from 'svelte';
	import {
		Color,
		MeshStandardMaterial,
		SphereGeometry,
		ShaderMaterial,
		BackSide,
		Mesh,
		DoubleSide,
		Vector2,
		Vector3
	} from 'three';

	let skyMaterial = new MeshStandardMaterial();
	let skyPosition = [0, 0, 0];
	let skyGeometry = new SphereGeometry();

	function PurpleSky(topColor, bottomColor, offset, exponent, brightness, position, size) {
		skyPosition = position;
		const uniforms = {
			topColor: { value: new Color(topColor) },
			bottomColor: { value: new Color(bottomColor) },
			offset: { value: offset },
			exponent: { value: exponent },
			brightness: { value: brightness }
		};
		skyGeometry = new SphereGeometry(size, 32, 15);

		skyMaterial = new ShaderMaterial({
			uniforms: uniforms,
			vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
            vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
        `,
			fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        uniform float brightness;

        varying vec3 vWorldPosition;

        void main() {
            float h = normalize( vWorldPosition ).y + offset;
            gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h, 0.0 ), exponent ), 0.0 ) ), 1.0 );
            gl_FragColor=gl_FragColor*vec4(brightness,brightness,brightness,1.);
        }
        `,
			side: BackSide
		});

		return 'done';

		//{#await map then value}

		//return <mesh position={position} material={skyMat} geometry={skyGeo} />;
	}
	PurpleSky(0x11e8bb, 0x8200c9, 0.5, 1.5, 0.1, [0, 0, 0], 256);

	function glitter() {
		// Vertex Shader
		const vertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;

        void main() {
            vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
            vWorldPosition = worldPosition.xyz;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

		// Fragment Shader
		const fragmentShader = `
  uniform float iTime;
  uniform vec2 iResolution;
  varying vec2 vUv;
  #define time iTime*30.
#define resolution iResolution.xy

bool mode;

vec3 fcos( vec3 x )
{
    if( mode) return cos(x);                // naive

    vec3 w = fwidth(x);
    return cos(x) * sin(0.5*w)/(0.5*w);     // filtered-exact
}

vec3 getColor( in float t )
{
    vec3 col = vec3(0.4,0.4,0.4);
    col += 0.12*fcos(6.28318*t*  1.0+vec3(0.0,0.8,1.1));
    col += 0.11*fcos(6.28318*t*  3.1+vec3(0.3,0.4,0.1));
    col += 0.10*fcos(6.28318*t*  5.1+vec3(0.1,0.7,1.1));
    col += 0.09*fcos(6.28318*t*  9.1+vec3(0.2,0.8,1.4));
    col += 0.08*fcos(6.28318*t* 17.1+vec3(0.2,0.6,0.7));
    col += 0.07*fcos(6.28318*t* 31.1+vec3(0.1,0.6,0.7));
    col += 0.06*fcos(6.28318*t* 65.1+vec3(0.0,0.5,0.8));
    col += 0.06*fcos(6.28318*t*115.1+vec3(0.1,0.4,0.7));
    col += 0.09*fcos(6.28318*t*265.1+vec3(1.1,1.4,2.7));
    return col;
}

void main()
{
    // coordiantes
    //vec2 p = vUv;
    vec2 p = vUv * 2.0 - 1.0;  // Convert UV to -1 to 1 range
        

    vec2 origin = vec2(0.0, 0.0); // origin point
    origin.x+=sin(iTime/-200.)*0.2;
    origin.y+=sin(iTime/-220.)*0.21;
    float dist = distance(p/300., origin); // calculate distance to origin
    float zto1 = sin(-iTime*dist)*0.5+0.5;

    p *= zto1+1.;

    vec2 w = p;

    // deform 1
    p *= 0.25;
    p = 0.5*p/dot(p,p);
    vec2 q = p;

    // deform 2
    p += 0.2*cos( 1.5*p.yx + 0.03*1.0*time + vec2(0.1,1.1) );
    p += 0.2*cos( 2.4*p.yx + 0.03*1.6*time + vec2(4.5,2.6) );
    p += 0.2*cos( 3.3*p.yx + 0.03*1.2*time + vec2(3.2,3.4) );


    // base color pattern
    vec3 col = getColor( 0.5*length(p) );
    // Darken the color
    col *= 0.01;

    // Make the red component blink over time
    col.r *= abs(sin(iTime * 3.0)*0.5+0.5)*5.; // Adjust the frequency as needed
    gl_FragColor = vec4( col, .01 );
}
`;

		// Create the ShaderMaterial
		skyMaterial = new ShaderMaterial({
			uniforms: {
				iTime: { value: 0.0 },
				iResolution: { value: new Vector2(window.innerWidth, window.innerHeight) }
			},
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			side: BackSide
		});

		// // Create a plane and apply the shader material
		// const geometry = new PlaneGeometry(2, 2);
		// const plane = new Mesh(geometry, shaderMaterial);
		// scene.add(plane);

		// // Update the uniform values in the animation loop
		// function animate() {
		// 	requestAnimationFrame(animate);
		// 	shaderMaterial.uniforms.iTime.value = performance.now() / 1000;
		// 	renderer.render(scene, camera);
		// }

		// animate();
	}
	glitter();
	let time = 0;
	useFrame(({ camera }, delta) => {
		time += delta;
		skyMaterial.uniforms.iTime.value = time;
	});
</script>

<T.Mesh
	position={skyPosition}
	material={skyMaterial}
	geometry={skyGeometry}
	rotation.z={Math.PI}
	receiveShadow
/>
