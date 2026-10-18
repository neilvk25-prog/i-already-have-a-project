/**
 * MeshCraft 3D - Main Application
 */
(function() {
  'use strict';

  // State Management
  const state = {
    currentPreset: 'guildhallHouse',
    currentMaterial: 'medievalAtlas',
    wireframeOverlay: false,
    showNormals: false,
    showBoundingBox: false,
    autoRotate: true,
    rotationSpeed: 0.45,
    shadingFlat: false,

    // Deformers
    twist: 0,
    noiseAmp: 0,
    waveAmp: 0,
    animateModifiers: false,

    // Parametric specific
    torusP: 3,
    torusQ: 5,
    superM: 7,
    superN1: 0.2,
    superN2: 1.7,

    // Metrics
    verticesCount: 0,
    facesCount: 0,
    edgesCount: 0,
    eulerChar: 0,
    dimensions: { x: 0, y: 0, z: 0 },
    fps: 60
  };

  // Three.js Core Variables
  let scene, camera, renderer, controls;
  let activeMesh = null;
  let wireframeMesh = null;
  let normalsHelper = null;
  let bboxHelper = null;
  let floorGrid = null;
  let sculptEngine = null;

  // Base geometry cache for resetting/applying deformers
  let baseGeometry = null;

  // Lighting
  let keyLight, fillLight, rimLight, ambientLight;

  // Clock & FPS tracking
  const clock = new THREE.Clock();
  let frameCount = 0;
  let lastTime = performance.now();

  // Initialize Application
  function init() {
    const container = document.getElementById('canvas-container');

    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c111d);
    scene.fog = new THREE.FogExp2(0x0c111d, 0.025);

    // 2. Camera (3/4 Isometric perspective matching the reference artwork)
    camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(4.2, 2.7, 6.2);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.appendChild(renderer.domElement);

    // 4. Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.8;
    controls.maxDistance = 25;
    controls.maxPolarAngle = Math.PI / 2 + 0.15; // Allow slight angle below floor
    controls.target.set(0, -0.2, 0);

    // 5. Environment Map & Material Factory
    MaterialFactory.init(renderer);

    // 6. Lighting
    setupLighting();

    // 7. Ground Grid
    setupFloor();

    // 8. Sculpt Engine
    sculptEngine = new SculptEngine(scene, camera, renderer, () => activeMesh, controls);

    // 9. Render 2K Texture Atlas Preview in Sidebar
    renderAtlasPreview();

    // 10. Build Initial Mesh (Medieval Guildhall)
    loadPreset('guildhallHouse');

    // 11. Bind UI & Events
    bindUIEvents();

    // 12. Responsive resize
    window.addEventListener('resize', onWindowResize);

    // 13. Animation Loop
    animate();
  }

  function renderAtlasPreview() {
    const previewCanvas = document.getElementById('atlas-preview-canvas');
    if (previewCanvas && window.MedievalHouseBuilder) {
      const atlas = window.MedievalHouseBuilder.getAtlasCanvas();
      const pCtx = previewCanvas.getContext('2d');
      pCtx.drawImage(atlas, 0, 0, previewCanvas.width, previewCanvas.height);
    }
  }

  function setupLighting() {
    ambientLight = new THREE.HemisphereLight(0xfff6e5, 0x384558, 0.85);
    scene.add(ambientLight);

    // Warm Golden Sun Key Light
    keyLight = new THREE.DirectionalLight(0xfff2dc, 1.55);
    keyLight.position.set(6, 9, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 28;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Soft Sky Fill Light
    fillLight = new THREE.DirectionalLight(0x8ab4f8, 0.65);
    fillLight.position.set(-7, 4, -5);
    scene.add(fillLight);

    // Warm Lantern / Torch Rim Light
    rimLight = new THREE.PointLight(0xffaa44, 1.1, 16);
    rimLight.position.set(-2, 2.5, 4.5);
    scene.add(rimLight);
  }

  function setupFloor() {
    // Elegant radial grid
    floorGrid = new THREE.GridHelper(24, 48, 0x00f0ff, 0x1f2b3e);
    floorGrid.position.y = -2.2;
    floorGrid.material.opacity = 0.35;
    floorGrid.material.transparent = true;
    scene.add(floorGrid);

    // Subtle contact shadow floor disk
    const shadowGeo = new THREE.PlaneGeometry(24, 24);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.45 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.201;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);
  }

  // Load a mesh preset
  function loadPreset(presetName) {
    state.currentPreset = presetName;

    // Reset modifier sliders in UI
    state.twist = 0;
    state.noiseAmp = 0;
    state.waveAmp = 0;
    syncModifierSliders();

    if (presetName === 'guildhallHouse') {
      state.currentMaterial = 'medievalAtlas';
      const matBtns = document.querySelectorAll('[data-material]');
      matBtns.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-material') === 'medievalAtlas');
      });
    }

    let geom;
    switch (presetName) {
      case 'guildhallHouse':
        geom = MeshGenerators.guildhallHouse();
        break;
      case 'kleinBottle':
        geom = MeshGenerators.kleinBottle();
        break;
      case 'mobiusStrip':
        geom = MeshGenerators.mobiusStrip();
        break;
      case 'torusKnot':
        geom = MeshGenerators.torusKnot({ p: state.torusP, q: state.torusQ });
        break;
      case 'superformula':
        geom = MeshGenerators.superformula({
          m1: state.superM, m2: state.superM,
          n1_1: state.superN1, n1_2: state.superN1,
          n2_1: state.superN2, n2_2: state.superN2,
          n3_1: state.superN2, n3_2: state.superN2
        });
        break;
      case 'enneper':
        geom = MeshGenerators.enneperSurface();
        break;
      case 'dini':
        geom = MeshGenerators.diniSurface();
        break;
      case 'cyberCrystal':
        geom = MeshGenerators.cyberCrystal();
        break;
      case 'landscape':
        geom = MeshGenerators.terrainLandscape();
        break;
      case 'geodesic':
        geom = MeshGenerators.geodesicSphere();
        break;
      case 'primitiveTorus':
        geom = MeshGenerators.primitiveTorus();
        break;
      case 'primitiveSphere':
        geom = MeshGenerators.primitiveSphere();
        break;
      case 'primitiveBox':
        geom = MeshGenerators.primitiveBox();
        break;
      default:
        geom = MeshGenerators.guildhallHouse();
    }

    setNewGeometry(geom);
    updateParametricControlsVisibility();
  }

  function setNewGeometry(geom) {
    if (!geom.attributes.normal) geom.computeVertexNormals();
    geom.center();

    // If displaying the Medieval Guildhall, seat its courtyard plinth cleanly on the ground grid (y = -2.18)
    if (state.currentPreset === 'guildhallHouse') {
      geom.computeBoundingBox();
      if (geom.boundingBox) {
        const yOffset = -2.18 - geom.boundingBox.min.y;
        geom.translate(0, yOffset, 0);
      }
    }

    // Cache un-deformed base clone
    if (baseGeometry) baseGeometry.dispose();
    baseGeometry = geom.clone();

    // Clear sculpt history for new mesh
    if (sculptEngine) sculptEngine.clearHistory();

    // Create or update activeMesh
    if (activeMesh) {
      scene.remove(activeMesh);
      if (activeMesh.geometry) activeMesh.geometry.dispose();
    }

    const material = MaterialFactory.get(state.currentMaterial, {
      flatShading: state.shadingFlat
    });

    activeMesh = new THREE.Mesh(geom, material);
    activeMesh.castShadow = true;
    activeMesh.receiveShadow = true;
    // Start with a slight 3/4 front-right presentation angle
    if (state.currentPreset === 'guildhallHouse') {
      activeMesh.rotation.y = -0.38;
    }
    scene.add(activeMesh);

    // Wireframe overlay
    setupWireframeOverlay();

    // Normals helper
    updateNormalsHelper();

    // Bounding Box helper
    updateBoundingBoxHelper();

    // Update Live HUD Metrics
    updateMeshMetrics();
  }

  function setupWireframeOverlay() {
    if (wireframeMesh) {
      activeMesh.remove(wireframeMesh);
      wireframeMesh.geometry.dispose();
      wireframeMesh = null;
    }

    if (state.wireframeOverlay && activeMesh) {
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        wireframe: true,
        transparent: true,
        opacity: 0.25,
        depthTest: true
      });
      wireframeMesh = new THREE.Mesh(activeMesh.geometry, wireMat);
      activeMesh.add(wireframeMesh);
    }
  }

  function updateNormalsHelper() {
    if (normalsHelper) {
      scene.remove(normalsHelper);
      normalsHelper = null;
    }

    if (state.showNormals && activeMesh) {
      // Create line segments for normals
      const geom = activeMesh.geometry;
      const pos = geom.attributes.position;
      const norm = geom.attributes.normal;
      if (!norm) return;

      const linePositions = [];
      const v = new THREE.Vector3();
      const n = new THREE.Vector3();
      const length = 0.18;

      // Sample a subset if vertex count is huge to maintain 60 FPS
      const step = pos.count > 4000 ? Math.ceil(pos.count / 4000) : 1;
      for (let i = 0; i < pos.count; i += step) {
        v.fromBufferAttribute(pos, i);
        n.fromBufferAttribute(norm, i);
        linePositions.push(v.x, v.y, v.z);
        linePositions.push(v.x + n.x * length, v.y + n.y * length, v.z + n.z * length);
      }

      const lineGeom = new THREE.BufferGeometry();
      lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const lineMat = new THREE.LineBasicMaterial({ color: 0x39ff14, transparent: true, opacity: 0.6 });
      normalsHelper = new THREE.LineSegments(lineGeom, lineMat);
      activeMesh.add(normalsHelper);
    }
  }

  function updateBoundingBoxHelper() {
    if (bboxHelper) {
      scene.remove(bboxHelper);
      bboxHelper = null;
    }

    if (state.showBoundingBox && activeMesh) {
      bboxHelper = new THREE.BoxHelper(activeMesh, 0xff007f);
      scene.add(bboxHelper);
    }
  }

  // Real-time Mesh Deformers Stack
  function applyDeformers(time = 0) {
    if (!activeMesh || !baseGeometry) return;
    if (sculptEngine && sculptEngine.enabled && sculptEngine.isMouseDown) return;

    const basePos = baseGeometry.attributes.position;
    const currentPos = activeMesh.geometry.attributes.position;
    const count = basePos.count;

    const twist = state.twist;
    const noiseAmp = state.noiseAmp;
    const waveAmp = state.waveAmp;

    // Fast-path: if no modifiers and not animating, return
    if (twist === 0 && noiseAmp === 0 && waveAmp === 0 && !state.animateModifiers) {
      return;
    }

    const v = new THREE.Vector3();
    const simplex = new SimplexNoise(999);

    for (let i = 0; i < count; i++) {
      v.fromBufferAttribute(basePos, i);

      // 1. Twist along Y
      if (twist !== 0) {
        const angle = v.y * twist;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const x = v.x * cosA - v.z * sinA;
        const z = v.x * sinA + v.z * cosA;
        v.x = x;
        v.z = z;
      }

      // 2. Wave Ripple
      if (waveAmp !== 0) {
        const dist = Math.sqrt(v.x * v.x + v.z * v.z);
        const animOffset = state.animateModifiers ? time * 3.5 : 0;
        const wave = Math.sin(dist * 5.0 - animOffset) * waveAmp * 0.4;
        v.y += wave;
      }

      // 3. Noise Displacement
      if (noiseAmp !== 0) {
        const animOffset = state.animateModifiers ? time * 0.8 : 0;
        const n = simplex.noise3D(v.x * 1.5 + animOffset, v.y * 1.5, v.z * 1.5);
        const factor = 1.0 + n * noiseAmp * 0.35;
        v.multiplyScalar(factor);
      }

      currentPos.setXYZ(i, v.x, v.y, v.z);
    }

    currentPos.needsUpdate = true;
    activeMesh.geometry.computeVertexNormals();

    if (bboxHelper) bboxHelper.update();
    if (normalsHelper) updateNormalsHelper();
  }

  // Subdivide Mesh
  function subdivideMesh() {
    if (!activeMesh || !activeMesh.geometry) return;
    const geom = activeMesh.geometry.toNonIndexed ? activeMesh.geometry.toNonIndexed() : activeMesh.geometry;
    const pos = geom.attributes.position;
    if (pos.count > 50000) {
      alert('Mesh is already at high resolution (' + pos.count + ' vertices)');
      return;
    }

    const newPositions = [];
    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vC = new THREE.Vector3();
    const mAB = new THREE.Vector3();
    const mBC = new THREE.Vector3();
    const mCA = new THREE.Vector3();

    for (let i = 0; i < pos.count; i += 3) {
      vA.fromBufferAttribute(pos, i);
      vB.fromBufferAttribute(pos, i + 1);
      vC.fromBufferAttribute(pos, i + 2);

      mAB.addVectors(vA, vB).multiplyScalar(0.5);
      mBC.addVectors(vB, vC).multiplyScalar(0.5);
      mCA.addVectors(vC, vA).multiplyScalar(0.5);

      // Tri 1: vA, mAB, mCA
      newPositions.push(vA.x, vA.y, vA.z, mAB.x, mAB.y, mAB.z, mCA.x, mCA.y, mCA.z);
      // Tri 2: vB, mBC, mAB
      newPositions.push(vB.x, vB.y, vB.z, mBC.x, mBC.y, mBC.z, mAB.x, mAB.y, mAB.z);
      // Tri 3: vC, mCA, mBC
      newPositions.push(vC.x, vC.y, vC.z, mCA.x, mCA.y, mCA.z, mBC.x, mBC.y, mBC.z);
      // Tri 4: mAB, mBC, mCA
      newPositions.push(mAB.x, mAB.y, mAB.z, mBC.x, mBC.y, mBC.z, mCA.x, mCA.y, mCA.z);
    }

    const newGeom = new THREE.BufferGeometry();
    newGeom.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
    newGeom.computeVertexNormals();

    setNewGeometry(newGeom);
  }

  // Update Live HUD Metrics
  function updateMeshMetrics() {
    if (!activeMesh || !activeMesh.geometry) return;
    const geom = activeMesh.geometry;
    geom.computeBoundingBox();

    const pos = geom.attributes.position;
    const count = pos.count;
    const index = geom.index;

    let faces = 0;
    if (index) {
      faces = index.count / 3;
    } else {
      faces = count / 3;
    }

    // Estimate edges for manifold mesh (E approx 1.5 * F)
    const edges = Math.round(faces * 1.5);
    // Euler characteristic chi = V - E + F
    const euler = count - edges + faces;

    const bbox = geom.boundingBox;
    const size = new THREE.Vector3();
    bbox.getSize(size);

    state.verticesCount = count;
    state.facesCount = faces;
    state.edgesCount = edges;
    state.eulerChar = euler;
    state.dimensions = { x: size.x, y: size.y, z: size.z };

    // Update DOM elements
    document.getElementById('metric-vertices').textContent = count.toLocaleString();
    document.getElementById('metric-faces').textContent = Math.round(faces).toLocaleString();
    document.getElementById('metric-edges').textContent = edges.toLocaleString();
    document.getElementById('metric-euler').textContent = euler;
    document.getElementById('metric-dimensions').textContent =
      `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}`;
  }

  function setMaterial(materialType) {
    state.currentMaterial = materialType;
    if (!activeMesh) return;

    const newMat = MaterialFactory.get(materialType, {
      flatShading: state.shadingFlat
    });
    activeMesh.material = newMat;
    setupWireframeOverlay();
  }

  function updateParametricControlsVisibility() {
    const torusControls = document.getElementById('torus-controls');
    const superControls = document.getElementById('superformula-controls');
    const guildhallCard = document.getElementById('guildhall-info-card');

    if (torusControls) torusControls.style.display = state.currentPreset === 'torusKnot' ? 'block' : 'none';
    if (superControls) superControls.style.display = state.currentPreset === 'superformula' ? 'block' : 'none';
    if (guildhallCard) guildhallCard.style.display = state.currentPreset === 'guildhallHouse' ? 'block' : 'none';
  }

  function syncModifierSliders() {
    const twistInput = document.getElementById('slider-twist');
    const noiseInput = document.getElementById('slider-noise');
    const waveInput = document.getElementById('slider-wave');

    if (twistInput) twistInput.value = state.twist;
    if (noiseInput) noiseInput.value = state.noiseAmp;
    if (waveInput) waveInput.value = state.waveAmp;
  }

  // Camera presets
  function setCameraView(view) {
    const dist = 7.4;
    controls.reset();
    switch (view) {
      case 'front':
        camera.position.set(0, 0.6, dist);
        break;
      case 'top':
        camera.position.set(0, dist * 1.15, 0.001);
        break;
      case 'side':
        camera.position.set(dist, 0.6, 0);
        break;
      case 'iso':
      default:
        camera.position.set(4.2, 2.7, 6.2);
        break;
    }
    controls.target.set(0, -0.2, 0);
    camera.lookAt(0, -0.2, 0);
  }

  // Capture High-Res Snapshot
  function takeSnapshot() {
    const wasAutoRotate = state.autoRotate;
    state.autoRotate = false;

    // Render at current frame
    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/png');

    const link = document.createElement('a');
    link.download = `meshcraft-${state.currentPreset}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    state.autoRotate = wasAutoRotate;
  }

  // Bind All UI Interactivity
  function bindUIEvents() {
    // Preset buttons
    const presetButtons = document.querySelectorAll('[data-preset]');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadPreset(btn.getAttribute('data-preset'));
      });
    });

    // Material buttons
    const materialButtons = document.querySelectorAll('[data-material]');
    materialButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        materialButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setMaterial(btn.getAttribute('data-material'));
      });
    });

    // Wireframe Overlay Toggle
    const wireframeToggle = document.getElementById('toggle-wireframe');
    if (wireframeToggle) {
      wireframeToggle.addEventListener('change', (e) => {
        state.wireframeOverlay = e.target.checked;
        setupWireframeOverlay();
      });
    }

    // Flat Shading Toggle
    const flatToggle = document.getElementById('toggle-flat');
    if (flatToggle) {
      flatToggle.addEventListener('change', (e) => {
        state.shadingFlat = e.target.checked;
        setMaterial(state.currentMaterial);
      });
    }

    // Show Normals Toggle
    const normalsToggle = document.getElementById('toggle-normals');
    if (normalsToggle) {
      normalsToggle.addEventListener('change', (e) => {
        state.showNormals = e.target.checked;
        updateNormalsHelper();
      });
    }

    // Show Bounding Box Toggle
    const bboxToggle = document.getElementById('toggle-bbox');
    if (bboxToggle) {
      bboxToggle.addEventListener('change', (e) => {
        state.showBoundingBox = e.target.checked;
        updateBoundingBoxHelper();
      });
    }

    // Auto Rotate Toggle
    const rotateToggle = document.getElementById('toggle-autorotate');
    if (rotateToggle) {
      rotateToggle.addEventListener('change', (e) => {
        state.autoRotate = e.target.checked;
      });
    }

    // Rotation Speed Slider
    const rotateSpeedInput = document.getElementById('slider-rotate-speed');
    if (rotateSpeedInput) {
      rotateSpeedInput.addEventListener('input', (e) => {
        state.rotationSpeed = parseFloat(e.target.value);
      });
    }

    // Sculpt Mode Toggle
    const sculptToggle = document.getElementById('toggle-sculpt');
    const sculptPanel = document.getElementById('sculpt-subpanel');
    if (sculptToggle) {
      sculptToggle.addEventListener('change', (e) => {
        const active = e.target.checked;
        sculptEngine.setEnabled(active);
        if (sculptPanel) sculptPanel.style.display = active ? 'block' : 'none';
      });
    }

    // Sculpt Brush Modes
    const brushModeButtons = document.querySelectorAll('[data-sculpt-mode]');
    brushModeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        brushModeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        sculptEngine.mode = btn.getAttribute('data-sculpt-mode');
      });
    });

    // Sculpt Brush Radius & Strength
    const brushRadiusInput = document.getElementById('slider-brush-radius');
    if (brushRadiusInput) {
      brushRadiusInput.addEventListener('input', (e) => {
        sculptEngine.radius = parseFloat(e.target.value);
      });
    }
    const brushStrengthInput = document.getElementById('slider-brush-strength');
    if (brushStrengthInput) {
      brushStrengthInput.addEventListener('input', (e) => {
        sculptEngine.strength = parseFloat(e.target.value);
      });
    }

    // Sculpt Undo
    const undoBtn = document.getElementById('btn-sculpt-undo');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        const success = sculptEngine.undo();
        if (success) {
          updateMeshMetrics();
        }
      });
    }

    // Sculpt Reset
    const resetBtn = document.getElementById('btn-sculpt-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (baseGeometry) {
          setNewGeometry(baseGeometry.clone());
        }
      });
    }

    // Deformer Sliders
    const twistInput = document.getElementById('slider-twist');
    if (twistInput) {
      twistInput.addEventListener('input', (e) => {
        state.twist = parseFloat(e.target.value);
        applyDeformers();
        updateMeshMetrics();
      });
    }
    const noiseInput = document.getElementById('slider-noise');
    if (noiseInput) {
      noiseInput.addEventListener('input', (e) => {
        state.noiseAmp = parseFloat(e.target.value);
        applyDeformers();
        updateMeshMetrics();
      });
    }
    const waveInput = document.getElementById('slider-wave');
    if (waveInput) {
      waveInput.addEventListener('input', (e) => {
        state.waveAmp = parseFloat(e.target.value);
        applyDeformers();
        updateMeshMetrics();
      });
    }

    // Animate Deformers
    const animToggle = document.getElementById('toggle-animate-deformers');
    if (animToggle) {
      animToggle.addEventListener('change', (e) => {
        state.animateModifiers = e.target.checked;
      });
    }

    // Subdivide button
    const subdivideBtn = document.getElementById('btn-subdivide');
    if (subdivideBtn) {
      subdivideBtn.addEventListener('click', () => {
        subdivideMesh();
      });
    }

    // Parametric Torus Knots sliders
    const torusPInput = document.getElementById('slider-torus-p');
    if (torusPInput) {
      torusPInput.addEventListener('input', (e) => {
        state.torusP = parseInt(e.target.value, 10);
        document.getElementById('val-torus-p').textContent = state.torusP;
        loadPreset('torusKnot');
      });
    }
    const torusQInput = document.getElementById('slider-torus-q');
    if (torusQInput) {
      torusQInput.addEventListener('input', (e) => {
        state.torusQ = parseInt(e.target.value, 10);
        document.getElementById('val-torus-q').textContent = state.torusQ;
        loadPreset('torusKnot');
      });
    }

    // Parametric Supershape sliders
    const superMInput = document.getElementById('slider-super-m');
    if (superMInput) {
      superMInput.addEventListener('input', (e) => {
        state.superM = parseFloat(e.target.value);
        document.getElementById('val-super-m').textContent = state.superM;
        loadPreset('superformula');
      });
    }
    const superN1Input = document.getElementById('slider-super-n1');
    if (superN1Input) {
      superN1Input.addEventListener('input', (e) => {
        state.superN1 = parseFloat(e.target.value);
        document.getElementById('val-super-n1').textContent = state.superN1;
        loadPreset('superformula');
      });
    }

    // Camera preset buttons
    const cameraButtons = document.querySelectorAll('[data-camera]');
    cameraButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        cameraButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setCameraView(btn.getAttribute('data-camera'));
      });
    });

    // Export GLB (for Xogot Engine on iPad)
    const exportGlbBtn = document.getElementById('btn-export-glb');
    if (exportGlbBtn) {
      exportGlbBtn.addEventListener('click', () => {
        const fname = state.currentPreset === 'guildhallHouse' ? 'medieval_guildhall.glb' : `${state.currentPreset}.glb`;
        MeshIO.exportGLB(activeMesh, fname);
      });
    }

    // Export 2K Texture Atlas PNG
    const exportAtlasBtn = document.getElementById('btn-export-atlas');
    if (exportAtlasBtn) {
      exportAtlasBtn.addEventListener('click', () => {
        MeshIO.exportAtlasPNG('medieval_guildhall_atlas.png');
      });
    }
    const quickAtlasBtn = document.getElementById('btn-quick-atlas');
    if (quickAtlasBtn) {
      quickAtlasBtn.addEventListener('click', () => {
        MeshIO.exportAtlasPNG('medieval_guildhall_atlas.png');
      });
    }

    // Export OBJ & STL
    const exportObjBtn = document.getElementById('btn-export-obj');
    if (exportObjBtn) {
      exportObjBtn.addEventListener('click', () => {
        const fname = state.currentPreset === 'guildhallHouse' ? 'medieval_guildhall.obj' : `${state.currentPreset}.obj`;
        MeshIO.exportOBJ(activeMesh, fname);
      });
    }
    const exportStlBtn = document.getElementById('btn-export-stl');
    if (exportStlBtn) {
      exportStlBtn.addEventListener('click', () => {
        const fname = state.currentPreset === 'guildhallHouse' ? 'medieval_guildhall.stl' : `${state.currentPreset}.stl`;
        MeshIO.exportSTL(activeMesh, fname);
      });
    }

    // Snapshot button
    const snapshotBtn = document.getElementById('btn-snapshot');
    if (snapshotBtn) {
      snapshotBtn.addEventListener('click', takeSnapshot);
    }

    // Import OBJ file
    const fileInput = document.getElementById('file-import-obj');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
          const geom = MeshIO.parseOBJ(evt.target.result);
          state.currentPreset = file.name.replace(/\.[^/.]+$/, "");
          setNewGeometry(geom);
        };
        reader.readAsText(file);
      });
    }

    // Mobile Panel Drawer Toggle
    const drawerToggleBtn = document.getElementById('btn-toggle-drawer');
    const controlPanel = document.getElementById('control-panel');
    if (drawerToggleBtn && controlPanel) {
      drawerToggleBtn.addEventListener('click', () => {
        controlPanel.classList.toggle('collapsed');
        drawerToggleBtn.textContent = controlPanel.classList.contains('collapsed') ? '⚙️ Controls' : '✕ Close';
      });
    }

    // Tab Navigation in Sidebar/Drawer
    const tabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));

        tab.classList.add('active');
        const targetId = `tab-${tab.getAttribute('data-tab')}`;
        const target = document.getElementById(targetId);
        if (target) target.classList.add('active');
      });
    });
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Auto rotate turntable
    if (state.autoRotate && activeMesh && (!sculptEngine || !sculptEngine.enabled || !sculptEngine.isMouseDown)) {
      activeMesh.rotation.y += delta * state.rotationSpeed * 0.5;
    }

    // Update dynamic shaders (Hologram, Iridescent)
    if (activeMesh && activeMesh.material) {
      if (activeMesh.material.uniforms && activeMesh.material.uniforms.time) {
        activeMesh.material.uniforms.time.value = elapsedTime;
      }
    }

    // Animated modifiers
    if (state.animateModifiers) {
      applyDeformers(elapsedTime);
    }

    // OrbitControls update
    controls.update();

    // Render Scene
    renderer.render(scene, camera);

    // FPS Meter
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      state.fps = Math.round((frameCount * 1000) / (now - lastTime));
      const fpsEl = document.getElementById('metric-fps');
      if (fpsEl) fpsEl.textContent = state.fps;
      frameCount = 0;
      lastTime = now;
    }
  }

  // Run when DOM is ready
  window.addEventListener('DOMContentLoaded', init);
})();
