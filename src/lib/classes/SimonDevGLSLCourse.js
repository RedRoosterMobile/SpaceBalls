import * as THREE from 'three';

const NUM_GRASS = 100;
const GRASS_SEGMENTS = 6;
const GRASS_VERTICES = (GRASS_SEGMENTS + 1) * 2;
const GRASS_PATCH_SIZE = 10;
const GRASS_WIDTH = 0.25;
const GRASS_HEIGHT = 20;

// Taken from https://github.com/mrdoob/three.js/issues/758
function _GetImageData(image) {
	const canvas = document.createElement('canvas');
	canvas.width = image.width;
	canvas.height = image.height;

	const context = canvas.getContext('2d');
	context.translate(0, image.height);
	context.scale(1, -1);
	context.drawImage(image, 0, 0);

	return context.getImageData(0, 0, image.width, image.height);
}

class TextureAtlas {
	constructor() {
		this.create_();
		this.onLoad = () => {};
	}

	Load(atlas, names) {
		this.loadAtlas_(atlas, names);
	}

	create_() {
		this.manager_ = new THREE.LoadingManager();
		this.loader_ = new THREE.TextureLoader(this.manager_);
		this.textures_ = {};

		this.manager_.onLoad = () => {
			this.onLoad_();
		};
	}

	get Info() {
		return this.textures_;
	}

	onLoad_() {
		for (let k in this.textures_) {
			let X = null;
			let Y = null;
			const atlas = this.textures_[k];
			let data = null;

			for (let t = 0; t < atlas.textures.length; t++) {
				const loader = atlas.textures[t];
				const curData = loader();

				const h = curData.height;
				const w = curData.width;

				if (X === null) {
					X = w;
					Y = h;
					data = new Uint8Array(atlas.textures.length * 4 * X * Y);
				}

				if (w !== X || h !== Y) {
					console.error('Texture dimensions do not match');
					return;
				}
				const offset = t * (4 * w * h);

				data.set(curData.data, offset);
			}

			const diffuse = new THREE.DataArrayTexture(data, X, Y, atlas.textures.length);
			diffuse.format = THREE.RGBAFormat;
			diffuse.type = THREE.UnsignedByteType;
			diffuse.minFilter = THREE.LinearMipMapLinearFilter;
			diffuse.magFilter = THREE.LinearFilter;
			diffuse.wrapS = THREE.ClampToEdgeWrapping;
			diffuse.wrapT = THREE.ClampToEdgeWrapping;
			// diffuse.wrapS = THREE.RepeatWrapping;
			// diffuse.wrapT = THREE.RepeatWrapping;
			diffuse.generateMipmaps = true;
			diffuse.needsUpdate = true;

			atlas.atlas = diffuse;
		}

		this.onLoad();
	}

	loadType_(t) {
		if (typeof t == 'string') {
			const texture = this.loader_.load(t);
			return () => {
				return _GetImageData(texture.image);
			};
		} else {
			return () => {
				return t;
			};
		}
	}

	loadAtlas_(atlas, names) {
		this.textures_[atlas] = {
			textures: names.map((n) => this.loadType_(n))
		};
	}
}

export class SimonDevGLSLCourse {
	constructor() {}

	/**
	 *
	 * @param {THREE.WebGLRenderer} renderer
	 * @param {*} scene
	 * @param {*} camera
	 * @param {*} orbitControls
	 */
	//async initialize(renderer, scene, camera, orbitControls) {
	async initialize(renderer, scene, camera) {
		this.threejs_ = renderer;

		this.scene_ = scene;
		this.camera_ = camera;
		console.group(camera);
		this.materials_ = [];

		await this.setupProject_();
	}

	CreateGeometry_(segments) {
		const VERTICES = (segments + 1) * 2;
		const indices = [];

		for (let i = 0; i < segments; ++i) {
			const vi = i * 2;
			indices[i * 12 + 0] = vi + 0;
			indices[i * 12 + 1] = vi + 1;
			indices[i * 12 + 2] = vi + 2;

			indices[i * 12 + 3] = vi + 2;
			indices[i * 12 + 4] = vi + 1;
			indices[i * 12 + 5] = vi + 3;

			const fi = VERTICES + vi;
			indices[i * 12 + 6] = fi + 2;
			indices[i * 12 + 7] = fi + 1;
			indices[i * 12 + 8] = fi + 0;

			indices[i * 12 + 9] = fi + 3;
			indices[i * 12 + 10] = fi + 1;
			indices[i * 12 + 11] = fi + 2;
		}

		const geo = new THREE.InstancedBufferGeometry();
		geo.instanceCount = NUM_GRASS;
		geo.setIndex(indices);
		geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1 + GRASS_PATCH_SIZE * 2);

		return geo;
	}

	async setupProject_() {
		const vshSky = await fetch('./shaders/sky-vertex-shader.glsl');
		const fshSky = await fetch('./shaders/sky-fragment-shader.glsl');
		const vshGrass = await fetch('./shaders/grass-vertex-shader.glsl');
		const fshGrass = await fetch('./shaders/grass-fragment-shader.glsl');
		const vshGround = await fetch('./shaders/ground-vertex-shader.glsl');
		const fshGround = await fetch('./shaders/ground-fragment-shader.glsl');

		const vshSkyText = await vshSky.text();
		const fshSkyText = await fshSky.text();
		const vshGrassText = await vshGrass.text();
		const fshGrassText = await fshGrass.text();
		const vshGroundText = await vshGround.text();
		const fshGroundText = await fshGround.text();

		const diffuseTexture = new THREE.TextureLoader().load('./textures/grid.png');
		diffuseTexture.wrapS = THREE.RepeatWrapping;
		diffuseTexture.wrapT = THREE.RepeatWrapping;

		// Make ground
		const groundMat = new THREE.ShaderMaterial({
			uniforms: {
				time: { value: 0 },
				resolution: { value: new THREE.Vector2(1, 1) },
				diffuseTexture: { value: diffuseTexture }
			},
			vertexShader: vshGroundText,
			fragmentShader: fshGroundText
		});

		const geometry = new THREE.PlaneGeometry(1, 1, 16, 16);
		const plane = new THREE.Mesh(geometry, groundMat);
		plane.rotateX(-Math.PI / 2);
		plane.scale.setScalar(1000);
		this.scene_.add(plane);
		this.materials_.push(groundMat);

		// Make sky
		const skyGeo = new THREE.SphereGeometry(5000, 32, 15);
		const skyMat = new THREE.ShaderMaterial({
			uniforms: {
				time: { value: 0 },
				resolution: { value: new THREE.Vector2(1, 1) }
			},
			vertexShader: vshSkyText,
			fragmentShader: fshSkyText,
			side: THREE.BackSide
		});

		this.sky_ = new THREE.Mesh(skyGeo, skyMat);
		this.sky_.castShadow = false;
		this.sky_.receiveShadow = false;
		this.scene_.add(this.sky_);
		this.materials_.push(skyMat);

		// Grass
		const tileDataTexture = new THREE.TextureLoader().load('./textures/tileData.jpg');

		const uniforms = {
			grassParams: {
				value: new THREE.Vector4(GRASS_SEGMENTS, GRASS_PATCH_SIZE, GRASS_WIDTH, GRASS_HEIGHT)
			},
			tileDataTexture: {
				value: tileDataTexture
			},
			grassDiffuse: {
				value: null
			},
			time: { value: 0 },
			resolution: { value: new THREE.Vector2(1, 1) }
		};

		const diffuse = new TextureAtlas();
		diffuse.Load('diffuse', ['./textures/grass1.png', './textures/grass2.png']);
		diffuse.onLoad = () => {
			uniforms.grassDiffuse.value = diffuse.Info['diffuse'].atlas;
		};

		const grassMaterial = new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: vshGrassText,
			fragmentShader: fshGrassText,
			side: THREE.FrontSide
		});
		this.grassMaterial_ = grassMaterial;
		this.grassGeometry_ = this.CreateGeometry_(GRASS_SEGMENTS);
		this.grassGroup_ = new THREE.Group();
		this.scene_.add(this.grassGroup_);

		this.materials_.push(grassMaterial);

		this.meshes_ = {};
		this.unusuedMeshes_ = [];

		this.totalTime_ = 0;
	}
  CreateMesh_() {
    const geo = this.grassGeometry_;
    const mat = this.grassMaterial_;

    const m = new THREE.Mesh(geo, mat);
    m.position.set(0, 0, 0);
    m.visible = false;

    this.grassGroup_.add(m);
    return m;
  }

	update(delta) {
		//this.totalTime_ = time;
		this.step_(delta);
	}

	// // translate this, call it from the outside
	// raf_() {
	// 	requestAnimationFrame((t) => {
	// 		if (this.previousRAF_ === null) {
	// 			this.previousRAF_ = t;
	// 		}

	// 		this.step_(t - this.previousRAF_);
	// 		this.threejs_.render(this.scene_, this.camera_);
	// 		this.raf_();
	// 		this.previousRAF_ = t;
	// 	});
	// }

	step_(timeElapsed) {
		const timeElapsedS = timeElapsed; //* 0.001;
		this.totalTime_ += timeElapsedS;

		//this.controls_.update();

		// Update the material uniforms
		for (let m of this.materials_) {
			m.uniforms.time.value = this.totalTime_;
		}

		// Update the grass
		const camera = this.camera_;

		const baseCellPos = camera.position.clone();
		baseCellPos.divideScalar(GRASS_PATCH_SIZE);
		baseCellPos.floor();
		baseCellPos.multiplyScalar(GRASS_PATCH_SIZE);

		for (let c of this.grassGroup_.children) {
			c.visible = false;
		}

		const currentMeshes_ = this.meshes_;
		const newMeshes_ = {};

		const cameraPosXZ = new THREE.Vector3(camera.position.x, 0, camera.position.z);
		const GRASS_MAX_DIST = 500;
		const AABB_TMP = new THREE.Box3();
		for (let x = -10; x < 10; x++) {
			for (let z = -10; z < 10; z++) {
				// Current cell
				const currentCell = new THREE.Vector3(
					baseCellPos.x + x * GRASS_PATCH_SIZE,
					0,
					baseCellPos.z + z * GRASS_PATCH_SIZE
				);

				AABB_TMP.setFromCenterAndSize(
					currentCell,
					new THREE.Vector3(GRASS_PATCH_SIZE, 1000, GRASS_PATCH_SIZE)
				);
				const distToCell = AABB_TMP.distanceToPoint(cameraPosXZ);
				if (distToCell > GRASS_MAX_DIST) {
					continue;
				}

				// Check if this mesh exists already
				const key = `${currentCell.x}_${currentCell.z}`;
				if (!(key in currentMeshes_)) {
					if (this.unusuedMeshes_.length > 0) {
						newMeshes_[key] = this.unusuedMeshes_.pop();
					} else {
						newMeshes_[key] = this.CreateMesh_();
					}
				} else {
					newMeshes_[key] = currentMeshes_[key];
					currentMeshes_[key] = null;
				}

				const m = newMeshes_[key];
				m.position.copy(currentCell);
				m.position.y = 0;
				m.visible = true;
			}
		}

		// Move all the unused meshes to the unused list
		for (let k in currentMeshes_) {
			if (currentMeshes_[k] !== null) {
				this.unusuedMeshes_.push(currentMeshes_[k]);
			}
		}

		this.meshes_ = newMeshes_;
	}
}
