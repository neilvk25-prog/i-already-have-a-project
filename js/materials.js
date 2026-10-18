/**
 * Material and Shader Studio for 3D Meshes
 */
(function(window) {
  'use strict';

  // Procedural environment cube / sphere texture for realistic reflections
  function createStudioEnvMap(renderer) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Studio softbox lighting gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#3a4454');
    grad.addColorStop(0.3, '#1a1f2c');
    grad.addColorStop(0.7, '#0b0e14');
    grad.addColorStop(1, '#05070a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Studio light panels
    function drawSoftbox(x, y, w, h, color) {
      const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 5, x + w / 2, y + h / 2, Math.max(w, h) / 1.5);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    }

    drawSoftbox(100, 40, 160, 100, 'rgba(255, 255, 255, 0.95)');
    drawSoftbox(340, 60, 120, 80, 'rgba(180, 210, 255, 0.7)');
    drawSoftbox(250, 150, 180, 60, 'rgba(255, 200, 150, 0.4)');

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    return texture;
  }

  // Hologram custom ShaderMaterial
  function createHologramMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color(0x00f0ff) },
        rimColor: { value: new THREE.Color(0xbd00ff) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 baseColor;
        uniform vec3 rimColor;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          // Fresnel edge glow
          float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 2.5);

          // Scanlines
          float scanline = sin((vPosition.y + time * 0.4) * 45.0) * 0.5 + 0.5;
          scanline = pow(scanline, 2.0);

          vec3 color = mix(baseColor, rimColor, fresnel * 0.8);
          color += baseColor * scanline * 0.4;
          color += rimColor * fresnel * 1.2;

          float alpha = clamp(fresnel * 0.85 + scanline * 0.15 + 0.15, 0.0, 0.95);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }

  // Iridescent Rainbow Pearlescent ShaderMaterial
  function createIridescentMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        vec3 rainbow(float t) {
          return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
        }

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float ndotv = abs(dot(normal, viewDir));

          vec3 irid = rainbow(ndotv * 2.2 + 0.1);
          float rim = pow(1.0 - ndotv, 3.0);

          vec3 color = irid + vec3(rim * 0.6);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });
  }

  // Heatmap / Elevation ShaderMaterial
  function createHeatmapMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        minY: { value: -2.0 },
        maxY: { value: 2.0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float minY;
        uniform float maxY;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        // Turbo / Heatmap color ramp
        vec3 heatmap(float t) {
          t = clamp(t, 0.0, 1.0);
          // Blue -> Cyan -> Green -> Yellow -> Red
          vec3 c = vec3(0.0);
          c.r = clamp(1.5 - abs(t * 4.0 - 3.0), 0.0, 1.0);
          c.g = clamp(1.5 - abs(t * 4.0 - 2.0), 0.0, 1.0);
          c.b = clamp(1.5 - abs(t * 4.0 - 1.0), 0.0, 1.0);
          return c;
        }

        void main() {
          float t = (vWorldPosition.y - minY) / max(maxY - minY, 0.001);
          vec3 color = heatmap(t);

          // Subtle directional lighting
          vec3 light = normalize(vec3(0.5, 1.0, 0.8));
          float diff = max(dot(vNormal, light), 0.2);

          gl_FragColor = vec4(color * (diff * 0.6 + 0.4), 1.0);
        }
      `,
      side: THREE.DoubleSide
    });
  }

  const MaterialFactory = {
    envMap: null,

    init(renderer) {
      if (!this.envMap) {
        this.envMap = createStudioEnvMap(renderer);
      }
    },

    get(type, options = {}) {
      const wireframe = options.wireframe || false;
      const flatShading = options.flatShading || false;

      switch (type) {
        case 'hologram':
          return createHologramMaterial();

        case 'iridescent':
          return createIridescentMaterial();

        case 'heatmap':
          return createHeatmapMaterial();

        case 'chrome':
          return new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.95,
            roughness: 0.08,
            envMap: this.envMap,
            envMapIntensity: 1.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            flatShading: flatShading,
            wireframe: wireframe,
            side: THREE.DoubleSide
          });

        case 'gold':
          return new THREE.MeshStandardMaterial({
            color: 0xffcc33,
            metalness: 0.9,
            roughness: 0.25,
            envMap: this.envMap,
            envMapIntensity: 1.2,
            flatShading: flatShading,
            wireframe: wireframe,
            side: THREE.DoubleSide
          });

        case 'clay':
          return new THREE.MeshStandardMaterial({
            color: 0xe5e7eb,
            roughness: 0.85,
            metalness: 0.05,
            flatShading: flatShading,
            wireframe: wireframe,
            side: THREE.DoubleSide
          });

        case 'obsidian':
          return new THREE.MeshStandardMaterial({
            color: 0x111622,
            roughness: 0.2,
            metalness: 0.8,
            envMap: this.envMap,
            envMapIntensity: 0.9,
            flatShading: flatShading,
            wireframe: wireframe,
            side: THREE.DoubleSide
          });

        case 'normal':
          return new THREE.MeshNormalMaterial({
            flatShading: flatShading,
            wireframe: wireframe,
            side: THREE.DoubleSide
          });

        case 'glass':
          return new THREE.MeshPhysicalMaterial({
            color: 0x00d4ff,
            metalness: 0.1,
            roughness: 0.15,
            transmission: 0.85,
            transparent: true,
            opacity: 0.7,
            envMap: this.envMap,
            envMapIntensity: 1.2,
            ior: 1.5,
            side: THREE.DoubleSide,
            wireframe: wireframe
          });

        case 'cyberpunk':
        default:
          return new THREE.MeshStandardMaterial({
            color: 0x0066ff,
            emissive: 0x001a4d,
            roughness: 0.35,
            metalness: 0.65,
            envMap: this.envMap,
            envMapIntensity: 1.0,
            flatShading: flatShading,
            wireframe: wireframe,
            side: THREE.DoubleSide
          });
      }
    }
  };

  window.MaterialFactory = MaterialFactory;
})(window);
