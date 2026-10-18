/**
 * 3D Mesh Exporters & Importers
 * Supports Wavefront OBJ export, STL export (3D print ready), and OBJ file importing.
 */
(function(window) {
  'use strict';

  // Helper to trigger file download in browser
  function downloadBlob(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  const MeshIO = {
    // Export Mesh to .OBJ format
    exportOBJ: function(mesh, filename = 'mesh.obj') {
      if (!mesh || !mesh.geometry) return;
      const geom = mesh.geometry.isBufferGeometry ? mesh.geometry : new THREE.BufferGeometry().fromGeometry(mesh.geometry);
      const pos = geom.attributes.position;
      const normal = geom.attributes.normal;
      const uv = geom.attributes.uv;
      const index = geom.index;

      let output = '# MeshCraft 3D Studio - OBJ Exporter\n';
      output += '# Vertices: ' + pos.count + '\n\n';

      // Vertices
      const matrix = mesh.matrixWorld;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(matrix);
        output += `v ${v.x.toFixed(5)} ${v.y.toFixed(5)} ${v.z.toFixed(5)}\n`;
      }

      // UVs
      if (uv) {
        output += '\n# Texture Coordinates\n';
        for (let i = 0; i < uv.count; i++) {
          output += `vt ${uv.getX(i).toFixed(4)} ${uv.getY(i).toFixed(4)}\n`;
        }
      }

      // Normals
      if (normal) {
        output += '\n# Normals\n';
        const n = new THREE.Vector3();
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
        for (let i = 0; i < normal.count; i++) {
          n.fromBufferAttribute(normal, i).applyMatrix3(normalMatrix).normalize();
          output += `vn ${n.x.toFixed(4)} ${n.y.toFixed(4)} ${n.z.toFixed(4)}\n`;
        }
      }

      output += '\n# Faces\n';
      output += 's 1\n';

      // Faces (1-indexed)
      if (index) {
        for (let i = 0; i < index.count; i += 3) {
          const a = index.getX(i) + 1;
          const b = index.getX(i + 1) + 1;
          const c = index.getX(i + 2) + 1;
          if (normal && uv) {
            output += `f ${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}\n`;
          } else if (normal) {
            output += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`;
          } else {
            output += `f ${a} ${b} ${c}\n`;
          }
        }
      } else {
        for (let i = 0; i < pos.count; i += 3) {
          const a = i + 1;
          const b = i + 2;
          const c = i + 3;
          if (normal && uv) {
            output += `f ${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}\n`;
          } else if (normal) {
            output += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`;
          } else {
            output += `f ${a} ${b} ${c}\n`;
          }
        }
      }

      const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
      downloadBlob(blob, filename);
    },

    // Export Mesh to STL (ASCII) - 3D Printing Ready
    exportSTL: function(mesh, filename = 'mesh.stl') {
      if (!mesh || !mesh.geometry) return;
      const geom = mesh.geometry.toNonIndexed ? mesh.geometry.toNonIndexed() : mesh.geometry;
      const pos = geom.attributes.position;
      const matrix = mesh.matrixWorld;

      let output = 'solid MeshCraftModel\n';
      const vA = new THREE.Vector3();
      const vB = new THREE.Vector3();
      const vC = new THREE.Vector3();
      const cb = new THREE.Vector3();
      const ab = new THREE.Vector3();
      const normal = new THREE.Vector3();

      for (let i = 0; i < pos.count; i += 3) {
        vA.fromBufferAttribute(pos, i).applyMatrix4(matrix);
        vB.fromBufferAttribute(pos, i + 1).applyMatrix4(matrix);
        vC.fromBufferAttribute(pos, i + 2).applyMatrix4(matrix);

        cb.subVectors(vC, vB);
        ab.subVectors(vA, vB);
        cb.cross(ab).normalize();
        normal.copy(cb);

        output += `  facet normal ${normal.x.toExponential(6)} ${normal.y.toExponential(6)} ${normal.z.toExponential(6)}\n`;
        output += '    outer loop\n';
        output += `      vertex ${vA.x.toExponential(6)} ${vA.y.toExponential(6)} ${vA.z.toExponential(6)}\n`;
        output += `      vertex ${vB.x.toExponential(6)} ${vB.y.toExponential(6)} ${vB.z.toExponential(6)}\n`;
        output += `      vertex ${vC.x.toExponential(6)} ${vC.y.toExponential(6)} ${vC.z.toExponential(6)}\n`;
        output += '    endloop\n';
        output += '  endfacet\n';
      }

      output += 'endsolid MeshCraftModel\n';
      if (geom !== mesh.geometry) {
        geom.dispose();
      }

      const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
      downloadBlob(blob, filename);
    },

    // Export Mesh with embedded PBR Texture Atlas to Binary glTF (.glb) - Ideal for Xogot / Godot 4 on iPad
    exportGLB: function(mesh, filename = 'medieval_guildhall.glb') {
      if (!mesh || !mesh.geometry) return;
      if (!THREE.GLTFExporter) {
        alert('GLTFExporter is not loaded.');
        return;
      }

      // Clone only the main mesh (without wireframe or normal helper children) so the exported GLB is clean for Xogot
      const exportMat = (window.MedievalHouseBuilder && mesh.material && mesh.material.map)
        ? window.MedievalHouseBuilder.createMaterial({ flatShading: false, wireframe: false })
        : mesh.material.clone();

      const cleanMesh = new THREE.Mesh(mesh.geometry.clone(), exportMat);
      cleanMesh.name = 'MedievalGuildhall';
      cleanMesh.position.set(0, 0, 0);
      cleanMesh.rotation.set(0, 0, 0);
      cleanMesh.scale.set(1, 1, 1);
      cleanMesh.updateMatrixWorld(true);

      const exporter = new THREE.GLTFExporter();
      exporter.parse(
        cleanMesh,
        function(result) {
          if (result instanceof ArrayBuffer) {
            const blob = new Blob([result], { type: 'model/gltf-binary' });
            downloadBlob(blob, filename);
          } else {
            const output = JSON.stringify(result, null, 2);
            const blob = new Blob([output], { type: 'application/json' });
            downloadBlob(blob, filename.replace(/\.glb$/i, '.gltf'));
          }
          cleanMesh.geometry.dispose();
        },
        {
          binary: true,
          embedImages: true,
          onlyVisible: true
        }
      );
    },

    // Export 2048x2048 UV Texture Atlas as PNG
    exportAtlasPNG: function(filename = 'medieval_guildhall_atlas.png') {
      if (!window.MedievalHouseBuilder) return;
      const canvas = window.MedievalHouseBuilder.getAtlasCanvas();
      canvas.toBlob(function(blob) {
        if (blob) {
          downloadBlob(blob, filename);
        }
      }, 'image/png');
    },

    // Parse OBJ file text into a THREE.BufferGeometry
    parseOBJ: function(text) {
      const positions = [];
      const normals = [];
      const uvs = [];

      const rawVertices = [];
      const rawNormals = [];
      const rawUVs = [];

      const lines = text.split('\n');

      for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;

        const parts = line.split(/\s+/);
        const type = parts[0];

        if (type === 'v') {
          rawVertices.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
        } else if (type === 'vn') {
          rawNormals.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
        } else if (type === 'vt') {
          rawUVs.push(parseFloat(parts[1]), parseFloat(parts[2]));
        } else if (type === 'f') {
          // Supports triangles and quads
          const faceVertices = [];
          for (let i = 1; i < parts.length; i++) {
            const indices = parts[i].split('/').map(v => parseInt(v, 10));
            faceVertices.push(indices);
          }

          // Triangulate if polygon has > 3 vertices (fan triangulation)
          for (let i = 1; i < faceVertices.length - 1; i++) {
            const tri = [faceVertices[0], faceVertices[i], faceVertices[i + 1]];
            for (const vertex of tri) {
              const vIndex = (vertex[0] - 1) * 3;
              positions.push(rawVertices[vIndex], rawVertices[vIndex + 1], rawVertices[vIndex + 2]);

              if (vertex[1] && rawUVs.length > 0) {
                const uvIndex = (vertex[1] - 1) * 2;
                uvs.push(rawUVs[uvIndex], rawUVs[uvIndex + 1]);
              }

              if (vertex[2] && rawNormals.length > 0) {
                const nIndex = (vertex[2] - 1) * 3;
                normals.push(rawNormals[nIndex], rawNormals[nIndex + 1], rawNormals[nIndex + 2]);
              }
            }
          }
        }
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      if (normals.length === positions.length) {
        geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      } else {
        geom.computeVertexNormals();
      }
      if (uvs.length === (positions.length / 3) * 2) {
        geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      }

      geom.center();
      // Normalize size to bounding sphere radius ~ 2.0
      geom.computeBoundingSphere();
      if (geom.boundingSphere.radius > 0) {
        const scale = 2.0 / geom.boundingSphere.radius;
        geom.scale(scale, scale, scale);
      }

      return geom;
    }
  };

  window.MeshIO = MeshIO;
})(window);
