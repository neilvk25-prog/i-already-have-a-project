/**
 * Interactive 3D Mesh Sculpting Engine
 * Supports Push, Pull, Smooth, Noise, and Flatten with brush radius, strength, and undo history.
 */
(function(window) {
  'use strict';

  class SculptEngine {
    constructor(scene, camera, renderer, getActiveMesh, controls) {
      this.scene = scene;
      this.camera = camera;
      this.renderer = renderer;
      this.getActiveMesh = getActiveMesh;
      this.controls = controls;

      this.enabled = false;
      this.mode = 'push'; // push, pull, smooth, noise, flatten
      this.radius = 0.6;
      this.strength = 0.35;

      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
      this.isMouseDown = false;
      this.lastIntersection = null;

      // Undo history stack
      this.history = [];
      this.maxHistory = 12;

      // Brush visualizer
      this.createBrushIndicator();

      // Bind events
      this.onPointerDown = this.onPointerDown.bind(this);
      this.onPointerMove = this.onPointerMove.bind(this);
      this.onPointerUp = this.onPointerUp.bind(this);

      this.attachEvents();
    }

    createBrushIndicator() {
      const ringGeom = new THREE.RingGeometry(0.95, 1.0, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        depthTest: false
      });
      this.brushRing = new THREE.Mesh(ringGeom, ringMat);
      this.brushRing.renderOrder = 999;
      this.brushRing.visible = false;
      this.scene.add(this.brushRing);
    }

    attachEvents() {
      const dom = this.renderer.domElement;
      dom.addEventListener('pointerdown', this.onPointerDown, { passive: false });
      window.addEventListener('pointermove', this.onPointerMove, { passive: false });
      window.addEventListener('pointerup', this.onPointerUp, { passive: false });
    }

    setEnabled(enabled) {
      this.enabled = enabled;
      this.brushRing.visible = enabled && (this.lastIntersection !== null);
    }

    saveState() {
      const mesh = this.getActiveMesh();
      if (!mesh || !mesh.geometry) return;
      const pos = mesh.geometry.attributes.position;
      const copy = new Float32Array(pos.array);
      this.history.push(copy);
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
    }

    undo() {
      if (this.history.length === 0) return false;
      const mesh = this.getActiveMesh();
      if (!mesh || !mesh.geometry) return false;

      const previous = this.history.pop();
      const pos = mesh.geometry.attributes.position;
      if (pos.array.length === previous.length) {
        pos.array.set(previous);
        pos.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
        if (mesh.geometry.computeBoundingBox) mesh.geometry.computeBoundingBox();
        if (mesh.geometry.computeBoundingSphere) mesh.geometry.computeBoundingSphere();
        return true;
      }
      return false;
    }

    clearHistory() {
      this.history = [];
    }

    updateMouseCoord(e) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    }

    getMeshIntersection() {
      const mesh = this.getActiveMesh();
      if (!mesh) return null;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObject(mesh, false);
      if (intersects.length > 0) {
        return intersects[0];
      }
      return null;
    }

    updateBrushIndicator(intersection) {
      if (!this.enabled || !intersection) {
        this.brushRing.visible = false;
        return;
      }

      this.brushRing.visible = true;
      this.brushRing.position.copy(intersection.point);
      // Offset slightly along normal to prevent z-fighting
      if (intersection.face) {
        const normal = intersection.face.normal.clone().transformDirection(this.getActiveMesh().matrixWorld);
        this.brushRing.position.addScaledVector(normal, 0.02);
        this.brushRing.lookAt(intersection.point.clone().add(normal));
      }
      this.brushRing.scale.set(this.radius, this.radius, 1);
    }

    onPointerDown(e) {
      if (!this.enabled) return;
      this.updateMouseCoord(e);
      const hit = this.getMeshIntersection();
      if (hit) {
        this.isMouseDown = true;
        if (this.controls) this.controls.enabled = false;
        this.saveState();
        this.applySculpt(hit);
        this.updateBrushIndicator(hit);
        e.preventDefault();
      }
    }

    onPointerMove(e) {
      if (!this.enabled) return;
      this.updateMouseCoord(e);
      const hit = this.getMeshIntersection();
      this.lastIntersection = hit;
      this.updateBrushIndicator(hit);

      if (this.isMouseDown && hit) {
        this.applySculpt(hit);
        e.preventDefault();
      }
    }

    onPointerUp() {
      if (this.isMouseDown) {
        this.isMouseDown = false;
        if (this.controls) this.controls.enabled = true;
        const mesh = this.getActiveMesh();
        if (mesh && mesh.geometry) {
          mesh.geometry.computeVertexNormals();
        }
      }
    }

    applySculpt(hit) {
      const mesh = this.getActiveMesh();
      if (!mesh || !mesh.geometry) return;

      const geom = mesh.geometry;
      const pos = geom.attributes.position;
      const normalAttr = geom.attributes.normal;
      const invMatrix = new THREE.Matrix4().copy(mesh.matrixWorld).invert();

      // Hit point in local mesh coordinates
      const localHit = hit.point.clone().applyMatrix4(invMatrix);
      const hitNormal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);

      const radiusSq = this.radius * this.radius;
      const v = new THREE.Vector3();
      const n = new THREE.Vector3();
      const count = pos.count;

      // Collect vertices within radius for smoothing or flattening
      let affectedIndices = [];
      let centroid = new THREE.Vector3();

      for (let i = 0; i < count; i++) {
        v.fromBufferAttribute(pos, i);
        const distSq = v.distanceToSquared(localHit);
        if (distSq < radiusSq) {
          affectedIndices.push({ index: i, dist: Math.sqrt(distSq) });
          centroid.add(v);
        }
      }

      if (affectedIndices.length === 0) return;
      centroid.divideScalar(affectedIndices.length);

      for (let item of affectedIndices) {
        const i = item.index;
        const dist = item.dist;
        v.fromBufferAttribute(pos, i);

        // Gaussian brush falloff
        const falloff = Math.exp(-Math.pow(dist / this.radius, 2) * 3);
        const effect = this.strength * falloff * 0.12;

        if (normalAttr) {
          n.fromBufferAttribute(normalAttr, i);
        } else {
          n.copy(hitNormal);
        }

        switch (this.mode) {
          case 'push':
            v.addScaledVector(n, effect);
            break;
          case 'pull':
            v.addScaledVector(n, -effect);
            break;
          case 'smooth':
            v.lerp(centroid, effect * 0.7);
            break;
          case 'noise':
            const noiseVal = Math.sin(v.x * 12 + v.y * 12 + v.z * 12) * effect;
            v.addScaledVector(n, noiseVal);
            break;
          case 'flatten':
            // Project onto plane passing through localHit with normal hitNormal
            const diff = v.clone().sub(localHit);
            const projDist = diff.dot(hitNormal);
            v.addScaledVector(hitNormal, -projDist * effect * 2);
            break;
        }

        pos.setXYZ(i, v.x, v.y, v.z);
      }

      pos.needsUpdate = true;
      geom.computeVertexNormals();
      if (geom.computeBoundingSphere) geom.computeBoundingSphere();
    }
  }

  window.SculptEngine = SculptEngine;
})(window);
