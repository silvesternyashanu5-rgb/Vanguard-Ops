import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OperatorData, OperatorSkin, WeaponData } from '../types/game';
import { createOperatorMesh, getConcreteSlabMaps } from './threeModels';

export class LobbyViewer {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  private container: HTMLElement;
  private isSoftwareGl: boolean = false;
  private animFrameId: number = 0;
  private operatorGroup: THREE.Group | null = null;
  private targetRotationY: number = 0;
  private currentRotationY: number = 0;
  private clock: THREE.Clock;
  private isDragging: boolean = false;
  private lastPointerX: number = 0;
  private resizeObserver: ResizeObserver | null = null;

  constructor(container: HTMLElement, operator: OperatorData, weapon: WeaponData) {
    this.container = container;
    this.clock = new THREE.Clock();

    // Check Software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    // Camera setup - pulled back so full operator + cape + aura fit cleanly in rotated landscape phone viewports
    this.camera = new THREE.PerspectiveCamera(
      45,
      Math.max(0.5, container.clientWidth / Math.max(1, container.clientHeight)),
      0.1,
      100
    );
    this.updateCameraFraming();

    // Reflection map
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch {
      // Ignored
    }

    // Atmospheric Studio-Outdoor Lights (warm sunlight key, cool rim relief, soft fill)
    const keyLight = new THREE.DirectionalLight('#fff1e0', 2.45);
    keyLight.position.set(-3.2, 4.8, 3.2);
    if (!this.isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      const d = 2.4;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.015;
    }
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#7dd3fc', 2.2); // Crisp cool rim highlight
    rimLight.position.set(2.8, 3.4, -2.8);
    this.scene.add(rimLight);

    const frontFill = new THREE.DirectionalLight('#fed7aa', 0.95);
    frontFill.position.set(0, 2.0, 3.2);
    this.scene.add(frontFill);

    const hemi = new THREE.HemisphereLight('#cbd5e1', '#1e293b', 0.75);
    this.scene.add(hemi);

    // Shadow-receiving concrete pedestal disc beneath hero
    const slabMaps = getConcreteSlabMaps('#4b5563');
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.25, 0.06, 36),
      new THREE.MeshStandardMaterial({
        map: slabMaps.map,
        bumpMap: slabMaps.bumpMap,
        bumpScale: 0.035,
        roughness: 0.88,
        metalness: 0.08,
      })
    );
    pedestal.position.y = -0.03;
    pedestal.receiveShadow = true;
    this.scene.add(pedestal);

    // Floating Ember/Dust Particles
    this.setupEmbers();

    // Spawn 3D Operator Model
    this.updateOperator(operator, weapon);

    // Pointer Drag Listeners for 360 rotation
    this.initInteraction();

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.container);
    }

    this.tick = this.tick.bind(this);
    this.tick();
  }

  private setupEmbers() {
    const particleCount = 60;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 6;
      positions[i + 1] = Math.random() * 3;
      positions[i + 2] = (Math.random() - 0.5) * 4;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: '#f97316',
      size: 0.04,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const embers = new THREE.Points(geometry, material);
    embers.name = 'Embers';
    this.scene.add(embers);
  }

  public updateOperator(operator: OperatorData, weapon: WeaponData) {
    if (this.operatorGroup) {
      this.scene.remove(this.operatorGroup);
    }

    const skin: OperatorSkin = operator.skins.find(s => s.id === operator.selectedSkinId) || operator.skins[0];
    this.operatorGroup = createOperatorMesh(skin, weapon);
    this.operatorGroup.position.set(0, 0, 0);
    this.scene.add(this.operatorGroup);
  }

  private initInteraction() {
    const el = this.renderer.domElement;

    const onStart = (clientX: number) => {
      this.isDragging = true;
      this.lastPointerX = clientX;
    };

    const onMove = (clientX: number) => {
      if (!this.isDragging) return;
      const deltaX = clientX - this.lastPointerX;
      this.lastPointerX = clientX;
      this.targetRotationY += deltaX * 0.008;
    };

    const onEnd = () => {
      this.isDragging = false;
    };

    el.addEventListener('mousedown', e => onStart(e.clientX));
    window.addEventListener('mousemove', e => onMove(e.clientX));
    window.addEventListener('mouseup', onEnd);

    el.addEventListener('touchstart', e => {
      if (e.touches.length > 0) onStart(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchmove', e => {
      if (e.touches.length > 0) onMove(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchend', onEnd);
  }

  private tick() {
    if (!this.container) return;
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.getElapsedTime();

    // Smooth turntable rotation damp
    this.currentRotationY = THREE.MathUtils.damp(this.currentRotationY, this.targetRotationY, 10, delta);

    if (this.operatorGroup) {
      this.operatorGroup.rotation.y = this.currentRotationY;

      // Subtle breathing idle animation
      const breath = Math.sin(time * 2.2) * 0.012;
      this.operatorGroup.position.y = breath;

      // Spin Maxwell Shodron's floating Arcane Sigil Halo & Orbiting Elemental Orbs
      const halo = this.operatorGroup.userData?.arcaneHalo as THREE.Object3D | undefined;
      if (halo) {
        halo.rotation.z += delta * 0.85;
      }
      const orbitGroup = this.operatorGroup.userData?.elementalOrbitGroup as THREE.Object3D | undefined;
      if (orbitGroup) {
        orbitGroup.rotation.y += delta * 1.45;
      }

      // Subtle wind ripple on pleated cape in Lobby showcase
      const cape = this.operatorGroup.userData?.capeMesh as THREE.Mesh | undefined;
      const basePos = this.operatorGroup.userData?.capeBasePos as Float32Array | undefined;
      if (cape && basePos) {
        const posAttr = cape.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < posAttr.count; i++) {
          const bx = basePos[i * 3];
          const by = basePos[i * 3 + 1];
          const bz = basePos[i * 3 + 2];
          const pin = THREE.MathUtils.clamp((0.55 - by) / 1.12, 0, 1);
          const flutter = Math.sin(time * 3.1 + by * 3.0 + bx * 2.5) * 0.022 * pin;
          posAttr.setXYZ(i, bx, by, bz + flutter);
        }
        posAttr.needsUpdate = true;
        cape.geometry.computeVertexNormals();
      }
    }

    // Ember particles float upward
    const embers = this.scene.getObjectByName('Embers') as THREE.Points;
    if (embers) {
      const pos = embers.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += delta * 0.35;
        if (pos[i] > 3.2) pos[i] = 0;
      }
      embers.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
    this.animFrameId = requestAnimationFrame(this.tick);
  }

  private updateCameraFraming() {
    if (!this.container) return;
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    const aspect = w / h;

    this.camera.aspect = aspect;
    // Move view range backwards on landscape / compact heights so entire body and UI stay unobstructed
    if (aspect < 1.0) {
      // Portrait or narrow column
      this.camera.fov = 48;
      this.camera.position.set(0, 1.12, 4.9);
    } else if (h < 480) {
      // Rotated phone landscape
      this.camera.fov = 46;
      this.camera.position.set(0, 1.08, 4.35);
    } else {
      // Desktop / tablet
      this.camera.fov = 44;
      this.camera.position.set(0, 1.12, 4.15);
    }
    this.camera.lookAt(0, 1.02, 0);
    this.camera.updateProjectionMatrix();
  }

  public handleResize() {
    if (!this.container) return;
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.updateCameraFraming();
    this.renderer.setSize(w, h);
  }

  public dispose() {
    cancelAnimationFrame(this.animFrameId);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.renderer.dispose();
  }
}
