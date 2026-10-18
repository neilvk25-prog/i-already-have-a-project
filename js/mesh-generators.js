/**
 * 3D Mesh Generators & Parametric Surfaces
 */
(function(window) {
  'use strict';

  // Helper: creates a THREE.BufferGeometry from a parametric function f(u, v, targetVector3)
  function createParametricGeometry(func, slices, stacks) {
    const indices = [];
    const vertices = [];
    const uvs = [];

    const p = new THREE.Vector3();

    for (let i = 0; i <= stacks; i++) {
      const v = i / stacks;
      for (let j = 0; j <= slices; j++) {
        const u = j / slices;
        func(u, v, p);
        vertices.push(p.x, p.y, p.z);
        uvs.push(u, v);
      }
    }

    const sliceCount = slices + 1;
    for (let i = 0; i < stacks; i++) {
      for (let j = 0; j < slices; j++) {
        const a = i * sliceCount + j;
        const b = i * sliceCount + j + 1;
        const c = (i + 1) * sliceCount + j + 1;
        const d = (i + 1) * sliceCount + j;
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setIndex(indices);
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.computeVertexNormals();
    return geom;
  }

  // Precomputed or procedural noise instance
  const noise = new SimplexNoise(42);

  const MeshGenerators = {
    // 1. Klein Bottle (Figure-8 Immersion)
    kleinBottle: function(params = {}) {
      const scale = params.scale || 1.8;
      const slices = params.slices || 64;
      const stacks = params.stacks || 64;

      return createParametricGeometry(function(u, v, target) {
        u = u * Math.PI * 2;
        v = v * Math.PI * 2;

        const r = 4 * (1 - Math.cos(u) / 2);
        let x, y, z;

        if (u < Math.PI) {
          x = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(u) * Math.cos(v);
          y = 16 * Math.sin(u);
          z = r * Math.sin(v);
        } else if (u <= Math.PI * 2) {
          x = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(v + Math.PI);
          y = 16 * Math.sin(u);
          z = r * Math.sin(v);
        }
        target.set((x / 16) * scale, (y / 16 - 0.4) * scale, (z / 16) * scale);
      }, slices, stacks);
    },

    // 2. Mobius Strip
    mobiusStrip: function(params = {}) {
      const scale = params.scale || 2.2;
      const slices = params.slices || 80;
      const stacks = params.stacks || 24;
      const twists = params.twists || 1; // 1 = classic half-twist
      const width = params.width || 0.7;

      return createParametricGeometry(function(u, v, target) {
        // u along loop [0, 2pi], v across width [-width, width]
        const theta = u * Math.PI * 2;
        const t = (v - 0.5) * 2 * width;
        const phi = (twists * theta) / 2;

        const x = (1 + t * Math.cos(phi)) * Math.cos(theta);
        const y = t * Math.sin(phi);
        const z = (1 + t * Math.cos(phi)) * Math.sin(theta);

        target.set(x * scale * 0.9, y * scale * 0.9, z * scale * 0.9);
      }, slices, stacks);
    },

    // 3. Torus Knot (p, q harmonic knot)
    torusKnot: function(params = {}) {
      const p = params.p || 3;
      const q = params.q || 5;
      const tubularSegments = params.tubularSegments || 160;
      const radialSegments = params.radialSegments || 32;
      const tube = params.tube || 0.35;
      const radius = params.radius || 1.8;

      return new THREE.TorusKnotGeometry(radius, tube, tubularSegments, radialSegments, p, q);
    },

    // 4. Superformula 3D (Gielis Supershape)
    superformula: function(params = {}) {
      const a = 1, b = 1;
      const m1 = params.m1 !== undefined ? params.m1 : 7;
      const n1_1 = params.n1_1 !== undefined ? params.n1_1 : 0.2;
      const n2_1 = params.n2_1 !== undefined ? params.n2_1 : 1.7;
      const n3_1 = params.n3_1 !== undefined ? params.n3_1 : 1.7;

      const m2 = params.m2 !== undefined ? params.m2 : 7;
      const n1_2 = params.n1_2 !== undefined ? params.n1_2 : 0.2;
      const n2_2 = params.n2_2 !== undefined ? params.n2_2 : 1.7;
      const n3_2 = params.n3_2 !== undefined ? params.n3_2 : 1.7;

      const scale = params.scale || 1.8;
      const slices = params.slices || 80;
      const stacks = params.stacks || 80;

      function sf(phi, m, n1, n2, n3) {
        const t1 = Math.abs((1 / a) * Math.cos(m * phi / 4));
        const t2 = Math.abs((1 / b) * Math.sin(m * phi / 4));
        const sum = Math.pow(t1, n2) + Math.pow(t2, n3);
        if (sum === 0) return 0;
        return Math.pow(sum, -1 / n1);
      }

      return createParametricGeometry(function(u, v, target) {
        const theta = (u - 0.5) * Math.PI * 2; // -pi to pi
        const phi = (v - 0.5) * Math.PI;       // -pi/2 to pi/2

        const r1 = sf(theta, m1, n1_1, n2_1, n3_1);
        const r2 = sf(phi, m2, n1_2, n2_2, n3_2);

        const x = r1 * Math.cos(theta) * r2 * Math.cos(phi);
        const y = r1 * Math.sin(theta) * r2 * Math.cos(phi);
        const z = r2 * Math.sin(phi);

        target.set(x * scale, z * scale, y * scale);
      }, slices, stacks);
    },

    // 5. Enneper Minimal Surface
    enneperSurface: function(params = {}) {
      const scale = params.scale || 0.7;
      const slices = params.slices || 60;
      const stacks = params.stacks || 60;
      const range = params.range || 1.8;

      return createParametricGeometry(function(u, v, target) {
        const uVal = (u - 0.5) * 2 * range;
        const vVal = (v - 0.5) * 2 * range;

        const x = uVal - (Math.pow(uVal, 3) / 3) + uVal * Math.pow(vVal, 2);
        const y = -vVal + (Math.pow(vVal, 3) / 3) - vVal * Math.pow(uVal, 2);
        const z = Math.pow(uVal, 2) - Math.pow(vVal, 2);

        target.set(x * scale, z * scale, y * scale);
      }, slices, stacks);
    },

    // 6. Dini's Pseudosphere Spiral
    diniSurface: function(params = {}) {
      const a = 1.0;
      const b = 0.2;
      const scale = params.scale || 1.1;
      const slices = params.slices || 80;
      const stacks = params.stacks || 50;

      return createParametricGeometry(function(u, v, target) {
        const uVal = u * 4 * Math.PI; // coils
        const vVal = 0.001 + v * 1.95; // avoid singularity at 0 & pi

        const x = a * Math.cos(uVal) * Math.sin(vVal);
        const y = a * (Math.cos(vVal) + Math.log(Math.tan(vVal / 2))) + b * uVal;
        const z = a * Math.sin(uVal) * Math.sin(vVal);

        target.set(x * scale, (y - 1.2) * scale, z * scale);
      }, slices, stacks);
    },

    // 7. Procedural Cyber Crystal
    cyberCrystal: function(params = {}) {
      const detail = params.detail || 2;
      const geom = new THREE.IcosahedronGeometry(2.2, detail);
      const pos = geom.attributes.position;
      const v = new THREE.Vector3();

      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        // Multiscale faceted displacement
        const n = noise.fbm(v.x * 0.9, v.y * 0.9, v.z * 0.9, 3, 2.0, 0.5);
        // Crystal faceting by quantizing
        const facet = Math.round(n * 5) / 5;
        const stretch = 1.0 + (v.y > 0 ? 0.3 * v.y : -0.1 * v.y);
        v.multiplyScalar(1.0 + facet * 0.45);
        v.y *= stretch;
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geom.computeVertexNormals();
      return geom;
    },

    // 8. Procedural Landscape / Terrain Mesh
    terrainLandscape: function(params = {}) {
      const size = params.size || 5;
      const segments = params.segments || 60;
      const geom = new THREE.PlaneGeometry(size, size, segments, segments);
      geom.rotateX(-Math.PI / 2);

      const pos = geom.attributes.position;
      const v = new THREE.Vector3();

      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        // Circular falloff towards edges
        const distFromCenter = Math.sqrt(v.x * v.x + v.z * v.z) / (size * 0.5);
        const falloff = Math.max(0, 1 - Math.pow(distFromCenter, 2.5));

        // Ridge mountain noise
        const n1 = noise.fbm(v.x * 0.8, 0, v.z * 0.8, 4, 2.0, 0.5);
        const ridges = 1.0 - Math.abs(n1);
        const height = ridges * 1.5 * falloff;

        pos.setY(i, height - 0.4);
      }
      geom.computeVertexNormals();
      return geom;
    },

    // 9. Geodesic Polyhedron / Buckminster Sphere
    geodesicSphere: function(params = {}) {
      const radius = params.radius || 2.2;
      const detail = params.detail || 3;
      return new THREE.IcosahedronGeometry(radius, detail);
    },

    // 10. Primitives
    primitiveTorus: function(params = {}) {
      return new THREE.TorusGeometry(1.8, 0.6, 32, 64);
    },
    primitiveCylinder: function(params = {}) {
      return new THREE.CylinderGeometry(1.4, 1.4, 3, 32, 16);
    },
    primitiveSphere: function(params = {}) {
      return new THREE.SphereGeometry(2.0, 48, 32);
    },
    primitiveBox: function(params = {}) {
      return new THREE.BoxGeometry(2.5, 2.5, 2.5, 12, 12, 12);
    }
  };

  window.MeshGenerators = MeshGenerators;
})(window);
