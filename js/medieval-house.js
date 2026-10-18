/**
 * Medieval Guildhall / Manor 3D Builder & Procedural Texture Atlas Generator
 * Designed for MeshCraft 3D Studio & Xogot Engine (Godot on iPad) GLB/OBJ Export.
 */
(function(window) {
  'use strict';

  // Create a 2048x2048 hand-painted stylized medieval texture atlas (4x4 grid of 512x512 tiles)
  function generateAtlasCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    const S = 512; // tile size
    function tileOrigin(col, row) {
      return { x: col * S, y: row * S };
    }

    // Helper: deterministic pseudo-random
    let seed = 1337;
    function rand() {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    }

    // Helper: subtle grunge/grain over a tile
    function addTileGrain(tx, ty, amount = 12) {
      ctx.save();
      for (let i = 0; i < 900; i++) {
        const gx = tx + rand() * S;
        const gy = ty + rand() * S;
        const r = 1 + rand() * 3;
        ctx.fillStyle = rand() > 0.5 ? `rgba(255,245,220,${amount / 255})` : `rgba(25,18,12,${amount / 255})`;
        ctx.fillRect(gx, gy, r, r);
      }
      ctx.restore();
    }

    // =========================================================================
    // TILE (0,0): Ground Floor Dressed Ashlar Stone Blocks & Mortar
    // =========================================================================
    {
      const { x: ox, y: oy } = tileOrigin(0, 0);
      ctx.fillStyle = '#5c5852'; // Mortar base
      ctx.fillRect(ox, oy, S, S);

      const rows = 8;
      const rowH = S / rows;
      const stonePalette = ['#9e998e', '#a9a498', '#8f8b81', '#b2ada0', '#969287'];

      for (let r = 0; r < rows; r++) {
        const y = oy + r * rowH;
        const cols = 4;
        const colW = S / cols;
        const offset = (r % 2 === 1) ? colW * 0.5 : 0;

        for (let c = -1; c <= cols; c++) {
          const bx = ox + c * colW + offset;
          const bw = colW;
          const bh = rowH;

          // Clip to tile
          const drawX = Math.max(ox, bx + 4);
          const drawRight = Math.min(ox + S, bx + bw - 4);
          const drawW = drawRight - drawX;
          if (drawW <= 0) continue;

          const drawY = y + 4;
          const drawH = bh - 8;

          const baseCol = stonePalette[Math.floor(rand() * stonePalette.length)];
          ctx.fillStyle = baseCol;
          ctx.fillRect(drawX, drawY, drawW, drawH);

          // Bevel highlight top/left
          ctx.fillStyle = 'rgba(255, 250, 240, 0.22)';
          ctx.fillRect(drawX, drawY, drawW, 5);
          ctx.fillRect(drawX, drawY, 5, drawH);

          // Bevel shadow bottom/right
          ctx.fillStyle = 'rgba(25, 22, 18, 0.28)';
          ctx.fillRect(drawX, drawY + drawH - 6, drawW, 6);
          ctx.fillRect(drawX + drawW - 6, drawY, 6, drawH);

          // Stylized ink outline
          ctx.strokeStyle = '#3a352f';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(drawX, drawY, drawW, drawH);
        }
      }
      addTileGrain(ox, oy, 14);
    }

    // =========================================================================
    // TILE (1,0): Corner Stone Quoins & Carved Moulding Trim
    // =========================================================================
    {
      const { x: ox, y: oy } = tileOrigin(1, 0);
      ctx.fillStyle = '#aea89b';
      ctx.fillRect(ox, oy, S, S);

      const blocks = 6;
      const bh = S / blocks;
      for (let i = 0; i < blocks; i++) {
        const by = oy + i * bh;
        ctx.fillStyle = (i % 2 === 0) ? '#c2bcb0' : '#b2aca0';
        ctx.fillRect(ox + 6, by + 5, S - 12, bh - 10);

        // Chiseled inner bevel frame
        ctx.strokeStyle = '#d8d2c5';
        ctx.lineWidth = 4;
        ctx.strokeRect(ox + 14, by + 12, S - 28, bh - 24);

        ctx.strokeStyle = '#403b34';
        ctx.lineWidth = 3;
        ctx.strokeRect(ox + 6, by + 5, S - 12, bh - 10);
      }
      addTileGrain(ox, oy, 12);
    }

    // =========================================================================
    // TILE (2,0): Cream Stucco Plaster & Dark Oak Half-Timber Framing
    // =========================================================================
    {
      const { x: ox, y: oy } = tileOrigin(2, 0);
      // Warm cream stucco background
      const grad = ctx.createLinearGradient(ox, oy, ox, oy + S);
      grad.addColorStop(0, '#eadbc2');
      grad.addColorStop(0.5, '#f2e5ce');
      grad.addColorStop(1, '#dfd0b4');
      ctx.fillStyle = grad;
      ctx.fillRect(ox, oy, S, S);
      addTileGrain(ox, oy, 14);

      // Helper to draw oak timber beam
      function drawBeam(x1, y1, x2, y2, width) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#2d1c10';
        ctx.lineWidth = width + 6;
        ctx.stroke();

        ctx.strokeStyle = '#5c3c24';
        ctx.lineWidth = width;
        ctx.stroke();

        ctx.strokeStyle = '#734d31';
        ctx.lineWidth = width * 0.4;
        ctx.stroke();
        ctx.restore();
      }

      // Diagonal braces
      drawBeam(ox + 20, oy + S - 20, ox + S * 0.5, oy + 20, 26);
      drawBeam(ox + S - 20, oy + S - 20, ox + S * 0.5, oy + 20, 26);
      // Center & side vertical posts
      drawBeam(ox + S * 0.5, oy, ox + S * 0.5, oy + S, 30);
      drawBeam(ox + 18, oy, ox + 18, oy + S, 32);
      drawBeam(ox + S - 18, oy, ox + S - 18, oy + S, 32);
      // Top & bottom horizontal beams
      drawBeam(ox, oy + 18, ox + S, oy + 18, 32);
      drawBeam(ox, oy + S - 18, ox + S, oy + S - 18, 32);
      drawBeam(ox, oy + S * 0.55, ox + S, oy + S * 0.55, 22);
    }

    // =========================================================================
    // TILE (3,0): Dark Carved Oak Wood & Ornate Frieze
    // =========================================================================
    {
      const { x: ox, y: oy } = tileOrigin(3, 0);
      ctx.fillStyle = '#4e331e';
      ctx.fillRect(ox, oy, S, S);

      // Wood planks & grain
      const planks = 8;
      const pw = S / planks;
      for (let p = 0; p < planks; p++) {
        const px = ox + p * pw;
        ctx.fillStyle = (p % 2 === 0) ? '#563822' : '#4a2f1b';
        ctx.fillRect(px, oy, pw, S);

        // Wood grain lines
        ctx.strokeStyle = 'rgba(30, 16, 8, 0.35)';
        ctx.lineWidth = 2;
        for (let g = 0; g < 6; g++) {
          ctx.beginPath();
          const gx = px + 6 + g * (pw / 6);
          ctx.moveTo(gx, oy);
          ctx.bezierCurveTo(gx + 5, oy + S * 0.33, gx - 5, oy + S * 0.66, gx, oy + S);
          ctx.stroke();
        }

        ctx.strokeStyle = '#241409';
        ctx.lineWidth = 3;
        ctx.strokeRect(px, oy, pw, S);
      }

      // Carved decorative scrollwork band across middle
      ctx.fillStyle = '#3b2414';
      ctx.fillRect(ox, oy + S * 0.4, S, S * 0.2);
      ctx.strokeStyle = '#755034';
      ctx.lineWidth = 4;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(ox + (i + 0.5) * (S / 8), oy + S * 0.5, 22, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // =========================================================================
    // TILE (0,1): Warm Terracotta / Orange-Brown Clay Roof Shingles
    // =========================================================================
    {
      const { x: ox, y: oy } = tileOrigin(0, 1);
      ctx.fillStyle = '#6e351c';
      ctx.fillRect(ox, oy, S, S);

      const rows = 10;
      const cols = 8;
      const rh = S / rows;
      const cw = S / cols;
      const shingleColors = ['#b85d32', '#c96c3b', '#9e4b25', '#d17842', '#a8522b', '#874324'];

      for (let r = 0; r < rows; r++) {
        const sy = oy + r * rh;
        const shift = (r % 2 === 1) ? cw * 0.5 : 0;
        for (let c = -1; c <= cols; c++) {
          const sx = ox + c * cw + shift;
          const drawX = Math.max(ox, sx + 2);
          const drawRight = Math.min(ox + S, sx + cw - 2);
          const drawW = drawRight - drawX;
          if (drawW <= 0) continue;

          ctx.fillStyle = shingleColors[Math.floor(rand() * shingleColors.length)];
          ctx.fillRect(drawX, sy + 2, drawW, rh - 4);

          // Shingle bottom drop shadow
          ctx.fillStyle = 'rgba(35, 14, 5, 0.45)';
          ctx.fillRect(drawX, sy + rh - 7, drawW, 5);

          // Shingle top highlight
          ctx.fillStyle = 'rgba(255, 210, 160, 0.2)';
          ctx.fillRect(drawX, sy + 2, drawW, 4);

          ctx.strokeStyle = '#3d1c0a';
          ctx.lineWidth = 2;
          ctx.strokeRect(drawX, sy + 2, drawW, rh - 4);
        }
      }
      addTileGrain(ox, oy, 14);
    }

    // =========================================================================
    // TILE (1,1): Blue-Grey Slate Roof Shingles (Gable & Bell Tower Spire)
    // =========================================================================
    {
      const { x: ox, y: oy } = tileOrigin(1, 1);
      ctx.fillStyle = '#333b42';
      ctx.fillRect(ox, oy, S, S);

      const rows = 10;
      const cols = 8;
      const rh = S / rows;
      const cw = S / cols;
      const slateColors = ['#5b6875', '#677582', '#4e5964', '#738290', '#535f6b'];

      for (let r = 0; r < rows; r++) {
        const sy = oy + r * rh;
        const shift = (r % 2 === 1) ? cw * 0.5 : 0;
        for (let c = -1; c <= cols; c++) {
          const sx = ox + c * cw + shift;
          const drawX = Math.max(ox, sx + 2);
          const drawRight = Math.min(ox + S, sx + cw - 2);
          const drawW = drawRight - drawX;
          if (drawW <= 0) continue;

          ctx.fillStyle = slateColors[Math.floor(rand() * slateColors.length)];
          ctx.fillRect(drawX, sy + 2, drawW, rh - 4);

          ctx.fillStyle = 'rgba(15, 20, 28, 0.45)';
          ctx.fillRect(drawX, sy + rh - 7, drawW, 5);

          ctx.fillStyle = 'rgba(210, 230, 255, 0.18)';
          ctx.fillRect(drawX, sy + 2, drawW, 4);

          ctx.strokeStyle = '#22282e';
          ctx.lineWidth = 2;
          ctx.strokeRect(drawX, sy + 2, drawW, rh - 4);
        }
      }
      addTileGrain(ox, oy, 12);
    }

    // =========================================================================
    // TILE (2,1): Grand Arched Double Wooden Door with Iron Studs & Ring Handles
    // =========================================================================
    {
      const { x: ox, y: oy } = tileOrigin(2, 1);
      // Warm oak planks background
      ctx.fillStyle = '#8c5830';
      ctx.fillRect(ox, oy, S, S);

      const planks = 10;
      const pw = S / planks;
      for (let p = 0; p < planks; p++) {
        ctx.fillStyle = (p % 2 === 0) ? '#996236' : '#85522b';
        ctx.fillRect(ox + p * pw, oy, pw, S);
        ctx.strokeStyle = '#3d2210';
        ctx.lineWidth = 2;
        ctx.strokeRect(ox + p * pw, oy, pw, S);
      }

      // Outer & center thick door frames
      ctx.strokeStyle = '#4a2c16';
      ctx.lineWidth = 18;
      ctx.strokeRect(ox + 9, oy + 9, S - 18, S - 18);

      // Center split line between double doors
      ctx.fillStyle = '#291507';
      ctx.fillRect(ox + S * 0.5 - 5, oy, 10, S);

      // Recessed panels & iron studs
      ctx.strokeStyle = '#3d2210';
      ctx.lineWidth = 6;
      const panelW = S * 0.34;
      const panelH = S * 0.28;
      // Upper & lower panels on left & right doors
      const panels = [
        [ox + S * 0.08, oy + S * 0.12],
        [ox + S * 0.58, oy + S * 0.12],
        [ox + S * 0.08, oy + S * 0.58],
        [ox + S * 0.58, oy + S * 0.58]
      ];
      panels.forEach(([px, py]) => {
        ctx.fillStyle = '#784722';
        ctx.fillRect(px, py, panelW, panelH);
        ctx.strokeRect(px, py, panelW, panelH);
      });

      // Iron strap hinges & rivets
      ctx.fillStyle = '#2c2f33';
      [oy + S * 0.2, oy + S * 0.72].forEach(hy => {
        ctx.fillRect(ox + 12, hy, S * 0.36, 14);
        ctx.fillRect(ox + S - 12 - S * 0.36, hy, S * 0.36, 14);
      });

      // Iron studs grid
      ctx.fillStyle = '#2b2d2f';
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 6; c++) {
          const sx = ox + 45 + c * ((S - 90) / 5);
          const sy = oy + 50 + r * ((S - 100) / 4);
          ctx.beginPath();
          ctx.arc(sx, sy, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Heavy Brass/Iron Ring Knockers
      [ox + S * 0.42, ox + S * 0.58].forEach(kx => {
        const ky = oy + S * 0.48;
        ctx.fillStyle = '#382a1e';
        ctx.beginPath();
        ctx.arc(kx, ky, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#d4a24c';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(kx, ky + 16, 18, 0, Math.PI * 2);
        ctx.stroke();
      });
    }

    // =========================================================================
    // TILE (3,1): Carved Stone Tympanum Relief & Heraldic Shield
    // =========================================================================
    {
      const { x: ox, y: oy } = tileOrigin(3, 1);
      ctx.fillStyle = '#b8b2a4';
      ctx.fillRect(ox, oy, S, S);
      addTileGrain(ox, oy, 14);

      // Concentric arch mouldings
      const cx = ox + S * 0.5;
      const cy = oy + S * 0.85;
      [220, 195, 170, 140].forEach((rad, idx) => {
        ctx.beginPath();
        ctx.arc(cx, cy, rad, Math.PI, 0, false);
        ctx.strokeStyle = (idx % 2 === 0) ? '#dcd6c8' : '#6e685c';
        ctx.lineWidth = 14;
        ctx.stroke();
      });

      // Foliate scrollwork cues
      ctx.strokeStyle = '#756f63';
      ctx.lineWidth = 5;
      for (let a = 0; a < 7; a++) {
        const ang = Math.PI + (a + 0.5) * (Math.PI / 7);
        const sx = cx + Math.cos(ang) * 110;
        const sy = cy + Math.sin(ang) * 110;
        ctx.beginPath();
        ctx.arc(sx, sy, 18, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Central crest shield in tympanum
      ctx.fillStyle = '#c9a658';
      ctx.strokeStyle = '#4a3c20';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx - 45, cy - 115);
      ctx.lineTo(cx + 45, cy - 115);
      ctx.lineTo(cx + 45, cy - 55);
      ctx.quadraticCurveTo(cx, cy - 10, cx, cy - 10);
      ctx.quadraticCurveTo(cx - 45, cy - 55, cx - 45, cy - 55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // =========================================================================
    // TILE (0,2): Warm Glowing Arched Window with Wrought-Iron Scrollwork Grille
    // =========================================================================
    {
      const { x: ox, y: oy } = tileOrigin(0, 2);
      // Outer stone frame surround
      ctx.fillStyle = '#9c968a';
      ctx.fillRect(ox, oy, S, S);

      // Warm golden interior candlelight gradient
      const radGrad = ctx.createRadialGradient(ox + S * 0.5, oy + S * 0.55, 20, ox + S * 0.5, oy + S * 0.5, S * 0.48);
      radGrad.addColorStop(0, '#fff7cc');
      radGrad.addColorStop(0.45, '#ffcf5c');
      radGrad.addColorStop(0.85, '#e08224');
      radGrad.addColorStop(1, '#8c3b10');

      ctx.fillStyle = radGrad;
      ctx.fillRect(ox + 28, oy + 28, S - 56, S - 56);

      // Lead diamond/rectangular mullion grid
      ctx.strokeStyle = '#3b2818';
      ctx.lineWidth = 5;
      const cols = 4, rows = 5;
      for (let c = 1; c < cols; c++) {
        const lx = ox + 28 + c * ((S - 56) / cols);
        ctx.beginPath();
        ctx.moveTo(lx, oy + 28);
        ctx.lineTo(lx, oy + S - 28);
        ctx.stroke();
      }
      for (let r = 1; r < rows; r++) {
        const ly = oy + 28 + r * ((S - 56) / rows);
        ctx.beginPath();
        ctx.moveTo(ox + 28, ly);
        ctx.lineTo(ox + S - 28, ly);
        ctx.stroke();
      }

      // Wrought-iron decorative S-scrollwork security bars
      ctx.strokeStyle = '#221c18';
      ctx.lineWidth = 6;
      for (let c = 0; c < 2; c++) {
        for (let r = 0; r < 3; r++) {
          const scx = ox + S * (0.32 + c * 0.36);
          const scy = oy + S * (0.26 + r * 0.24);
          ctx.beginPath();
          ctx.arc(scx, scy, 24, 0, Math.PI * 1.5);
          ctx.stroke();
        }
      }

      // Dark frame border
      ctx.strokeStyle = '#2b241d';
      ctx.lineWidth = 14;
      ctx.strokeRect(ox + 24, oy + 24, S - 48, S - 48);
    }

    // =========================================================================
    // TILE (1,2): Oriel Bay Stained-Glass Window (Colorful Diamond Panes)
    // =========================================================================
    {
      const { x: ox, y: oy } = tileOrigin(1, 2);
      ctx.fillStyle = '#3b2516';
      ctx.fillRect(ox, oy, S, S);

      const stainPalette = ['#d9537f', '#5bc0be', '#f0c85a', '#9b6bcc', '#7ec868', '#e8834a'];
      const dSize = 48;
      for (let y = oy + 24; y < oy + S - 24; y += dSize) {
        for (let x = ox + 24; x < ox + S - 24; x += dSize) {
          ctx.fillStyle = stainPalette[Math.floor(rand() * stainPalette.length)];
          ctx.fillRect(x, y, dSize, dSize);

          // Diamond lead cames
          ctx.strokeStyle = '#241a14';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x + dSize * 0.5, y);
          ctx.lineTo(x + dSize, y + dSize * 0.5);
          ctx.lineTo(x + dSize * 0.5, y + dSize);
          ctx.lineTo(x, y + dSize * 0.5);
          ctx.closePath();
          ctx.stroke();
        }
      }

      // Wooden mullion border
      ctx.strokeStyle = '#2e1b0f';
      ctx.lineWidth = 22;
      ctx.strokeRect(ox + 11, oy + 11, S - 22, S - 22);
      ctx.beginPath();
      ctx.moveTo(ox + S * 0.5, oy);
      ctx.lineTo(ox + S * 0.5, oy + S);
      ctx.moveTo(ox, oy + S * 0.5);
      ctx.lineTo(ox + S, oy + S * 0.5);
      ctx.stroke();
    }

    // =========================================================================
    // TILE (2,2): Crimson & Gold Medieval Banners (Lion Rampant & Broadsword)
    // =========================================================================
    {
      const { x: ox, y: oy } = tileOrigin(2, 2);
      // Rich crimson cloth background with vertical fold shading
      const clothGrad = ctx.createLinearGradient(ox, oy, ox + S, oy);
      clothGrad.addColorStop(0, '#6e1919');
      clothGrad.addColorStop(0.25, '#9e2424');
      clothGrad.addColorStop(0.5, '#7c1c1c');
      clothGrad.addColorStop(0.75, '#a62828');
      clothGrad.addColorStop(1, '#681616');
      ctx.fillStyle = clothGrad;
      ctx.fillRect(ox, oy, S, S);

      // Gold trim borders (Left half = Lion banner, Right half = Sword banner)
      ctx.strokeStyle = '#e0b34c';
      ctx.lineWidth = 10;
      ctx.strokeRect(ox + 18, oy + 18, S * 0.5 - 36, S - 36);
      ctx.strokeRect(ox + S * 0.5 + 18, oy + 18, S * 0.5 - 36, S - 36);

      // Left Emblem: Golden Heraldic Lion / Griffin silhouette
      ctx.fillStyle = '#f2c55c';
      const lx = ox + S * 0.25;
      const ly = oy + S * 0.48;
      ctx.beginPath();
      ctx.arc(lx, ly - 55, 26, 0, Math.PI * 2); // Head/mane
      ctx.fill();
      ctx.fillRect(lx - 18, ly - 30, 36, 75); // Torso
      ctx.fillRect(lx - 42, ly - 25, 28, 14); // Forelimb raised
      ctx.fillRect(lx + 14, ly - 35, 28, 14); // Forelimb right
      ctx.fillRect(lx - 26, ly + 40, 16, 45); // Hind leg
      ctx.fillRect(lx + 10, ly + 40, 16, 45); // Hind leg

      // Right Emblem: Golden Broadsword
      const sx = ox + S * 0.75;
      const sy = oy + S * 0.48;
      // Blade
      ctx.fillStyle = '#f5ce6e';
      ctx.beginPath();
      ctx.moveTo(sx, sy - 135);
      ctx.lineTo(sx + 13, sy - 95);
      ctx.lineTo(sx + 10, sy + 60);
      ctx.lineTo(sx - 10, sy + 60);
      ctx.lineTo(sx - 13, sy - 95);
      ctx.closePath();
      ctx.fill();
      // Crossguard
      ctx.fillRect(sx - 48, sy + 55, 96, 16);
      // Grip & Pommel
      ctx.fillStyle = '#b88728';
      ctx.fillRect(sx - 7, sy + 71, 14, 42);
      ctx.fillStyle = '#f5ce6e';
      ctx.beginPath();
      ctx.arc(sx, sy + 122, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    // =========================================================================
    // TILE (3,2): Bell Tower Roman Numeral Clock Face & Golden Heraldic Crest
    // =========================================================================
    {
      const { x: ox, y: oy } = tileOrigin(3, 2);
      ctx.fillStyle = '#7c766b';
      ctx.fillRect(ox, oy, S, S);

      const cx = ox + S * 0.5;
      const cy = oy + S * 0.5;
      const r = S * 0.42;

      // Outer stone & iron clock bezel
      ctx.beginPath();
      ctx.arc(cx, cy, r + 14, 0, Math.PI * 2);
      ctx.fillStyle = '#38342f';
      ctx.fill();

      // Clock dial face
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#e8e0cf';
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#c49940';
      ctx.stroke();

      // Hour ticks & Roman-style spokes
      ctx.strokeStyle = '#26221e';
      for (let h = 0; h < 12; h++) {
        const ang = (h * Math.PI) / 6;
        ctx.lineWidth = (h % 3 === 0) ? 7 : 4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * (r * 0.72), cy + Math.sin(ang) * (r * 0.72));
        ctx.lineTo(cx + Math.cos(ang) * (r * 0.92), cy + Math.sin(ang) * (r * 0.92));
        ctx.stroke();
      }

      // Ornate clock hands
      ctx.strokeStyle = '#1c1815';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - r * 0.65); // Minute hand
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r * 0.45, cy + r * 0.2); // Hour hand
      ctx.stroke();

      ctx.fillStyle = '#d4a242';
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    // =========================================================================
    // TILE (0,3): Courtyard Flagstone / Cobblestone Paving
    // =========================================================================
    {
      const { x: ox, y: oy } = tileOrigin(0, 3);
      ctx.fillStyle = '#8a7b65';
      ctx.fillRect(ox, oy, S, S);

      const grid = 4;
      const cell = S / grid;
      const paverColors = ['#c9b79c', '#bfa98a', '#d4c3a9', '#b39e80', '#cbb89b'];

      for (let r = 0; r < grid; r++) {
        for (let c = 0; c < grid; c++) {
          const px = ox + c * cell;
          const py = oy + r * cell;
          ctx.fillStyle = paverColors[(r * 3 + c) % paverColors.length];
          ctx.fillRect(px + 4, py + 4, cell - 8, cell - 8);

          ctx.strokeStyle = '#5e5243';
          ctx.lineWidth = 3;
          ctx.strokeRect(px + 4, py + 4, cell - 8, cell - 8);
        }
      }
      addTileGrain(ox, oy, 16);
    }

    // =========================================================================
    // TILE (1,3): Warm Oak Planks (Crates, Barrel Staves, Benches, Notice Board)
    // =========================================================================
    {
      const { x: ox, y: oy } = tileOrigin(1, 3);
      ctx.fillStyle = '#8f6239';
      ctx.fillRect(ox, oy, S, S);

      const planks = 6;
      const ph = S / planks;
      for (let i = 0; i < planks; i++) {
        const py = oy + i * ph;
        ctx.fillStyle = (i % 2 === 0) ? '#9e6d40' : '#855932';
        ctx.fillRect(ox, py, S, ph);

        ctx.strokeStyle = '#3b2310';
        ctx.lineWidth = 4;
        ctx.strokeRect(ox + 2, py + 2, S - 4, ph - 4);
      }
      addTileGrain(ox, oy, 12);
    }

    // =========================================================================
    // TILE (2,3): Lush Foliage, Boxwood Greenery & Colorful Flower Blossoms
    // =========================================================================
    {
      const { x: ox, y: oy } = tileOrigin(2, 3);
      ctx.fillStyle = '#2d4c25';
      ctx.fillRect(ox, oy, S, S);

      const leafColors = ['#3b662f', '#4e803d', '#2b4f21', '#5f9449', '#345929'];
      for (let i = 0; i < 450; i++) {
        ctx.fillStyle = leafColors[Math.floor(rand() * leafColors.length)];
        const lx = ox + rand() * S;
        const ly = oy + rand() * S;
        ctx.beginPath();
        ctx.arc(lx, ly, 10 + rand() * 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // Vibrant flower clusters (red, blue, gold, coral)
      const flowerColors = ['#e65540', '#5aa9e6', '#f5cb5c', '#ff85a1', '#ffffff'];
      for (let i = 0; i < 95; i++) {
        ctx.fillStyle = flowerColors[Math.floor(rand() * flowerColors.length)];
        const fx = ox + 16 + rand() * (S - 32);
        const fy = oy + 16 + rand() * (S - 32);
        ctx.beginPath();
        ctx.arc(fx, fy, 6 + rand() * 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // =========================================================================
    // TILE (3,3): Wrought Iron, Bronze Bell, Gold Brass & Parchment Notices
    // =========================================================================
    {
      const { x: ox, y: oy } = tileOrigin(3, 3);
      // Top-left quadrant: Dark Wrought Iron
      ctx.fillStyle = '#25282c';
      ctx.fillRect(ox, oy, S * 0.5, S * 0.5);
      // Top-right quadrant: Warm Polished Gold / Brass
      const goldGrad = ctx.createLinearGradient(ox + S * 0.5, oy, ox + S, oy + S * 0.5);
      goldGrad.addColorStop(0, '#f5d478');
      goldGrad.addColorStop(0.5, '#c99738');
      goldGrad.addColorStop(1, '#8c6218');
      ctx.fillStyle = goldGrad;
      ctx.fillRect(ox + S * 0.5, oy, S * 0.5, S * 0.5);

      // Bottom-left quadrant: Parchment Notice Sheets
      ctx.fillStyle = '#f0e2c4';
      ctx.fillRect(ox, oy + S * 0.5, S * 0.5, S * 0.5);
      ctx.strokeStyle = '#7a6348';
      ctx.lineWidth = 3;
      for (let line = 0; line < 8; line++) {
        const ly = oy + S * 0.56 + line * 24;
        ctx.beginPath();
        ctx.moveTo(ox + 28, ly);
        ctx.lineTo(ox + S * 0.5 - 28, ly);
        ctx.stroke();
      }

      // Bottom-right quadrant: Glowing Lantern Glass / Fountain Water
      const glowGrad = ctx.createRadialGradient(ox + S * 0.75, oy + S * 0.75, 10, ox + S * 0.75, oy + S * 0.75, S * 0.25);
      glowGrad.addColorStop(0, '#fffbe0');
      glowGrad.addColorStop(0.6, '#ffbe42');
      glowGrad.addColorStop(1, '#d46a1e');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(ox + S * 0.5, oy + S * 0.5, S * 0.5, S * 0.5);
    }

    return canvas;
  }

  // Remap a BufferGeometry's UVs into a specific [col, row] tile of our 4x4 texture atlas
  // Note: Canvas y=0 is top, while Three.js UV v=1 is top.
  // So tile (col, row) with row=0 (top row of canvas) corresponds to v in [0.75, 1.0].
  function mapUVToTile(geom, col, row, repeatU = 1, repeatV = 1, subRect = null) {
    const uvAttr = geom.attributes.uv;
    if (!uvAttr) return geom;

    let uMin = col * 0.25;
    let uSpan = 0.25;
    let vMin = (3 - row) * 0.25;
    let vSpan = 0.25;

    if (subRect) {
      uMin += subRect.u * 0.25;
      uSpan = subRect.uw * 0.25;
      vMin += subRect.v * 0.25;
      vSpan = subRect.vh * 0.25;
    }

    // Inset slightly by 0.003 to prevent mipmap bleeding across tile borders
    const pad = 0.003;
    uMin += pad;
    vMin += pad;
    uSpan = Math.max(0.001, uSpan - pad * 2);
    vSpan = Math.max(0.001, vSpan - pad * 2);

    for (let i = 0; i < uvAttr.count; i++) {
      let u = uvAttr.getX(i) * repeatU;
      let v = uvAttr.getY(i) * repeatV;
      // Wrap [0, 1] softly
      u = u - Math.floor(u);
      v = v - Math.floor(v);
      if (u === 0 && uvAttr.getX(i) >= 0.999) u = 1.0;
      if (v === 0 && uvAttr.getY(i) >= 0.999) v = 1.0;

      uvAttr.setXY(i, uMin + u * uSpan, vMin + v * vSpan);
    }
    uvAttr.needsUpdate = true;
    return geom;
  }

  // Merge an array of BufferGeometries into a single non-indexed BufferGeometry
  function mergeBufferGeometries(geometries) {
    const positions = [];
    const normals = [];
    const uvs = [];

    for (let g of geometries) {
      const nonIndexed = g.index ? g.toNonIndexed() : g;
      if (!nonIndexed.attributes.normal) {
        nonIndexed.computeVertexNormals();
      }
      const pos = nonIndexed.attributes.position;
      const norm = nonIndexed.attributes.normal;
      const uv = nonIndexed.attributes.uv;

      for (let i = 0; i < pos.count; i++) {
        positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
        normals.push(norm ? norm.getX(i) : 0, norm ? norm.getY(i) : 1, norm ? norm.getZ(i) : 0);
        if (uv) {
          uvs.push(uv.getX(i), uv.getY(i));
        } else {
          uvs.push(0, 0);
        }
      }
      if (nonIndexed !== g) nonIndexed.dispose();
      g.dispose();
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    return merged;
  }

  // Build a custom pitched roof prism (gable along Z or X)
  // Creates a solid dual-pitched roof with gable triangular end caps
  function createGableRoof(width, height, length, axis = 'x', roofTileCol = 0, roofTileRow = 1, gableTileCol = 2, gableTileRow = 0) {
    const parts = [];
    const hw = width * 0.5;
    const hl = length * 0.5;
    const slopeLen = Math.sqrt(hw * hw + height * height);
    const slopeAngle = Math.atan2(height, hw);

    if (axis === 'x') {
      // Ridge runs along X axis (length = X span, width = Z span)
      // Front slope (+Z)
      const frontSlope = new THREE.BoxGeometry(length, 0.08, slopeLen);
      mapUVToTile(frontSlope, roofTileCol, roofTileRow);
      frontSlope.rotateX(slopeAngle);
      frontSlope.translate(0, height * 0.5, hw * 0.5);
      parts.push(frontSlope);

      // Back slope (-Z)
      const backSlope = new THREE.BoxGeometry(length, 0.08, slopeLen);
      mapUVToTile(backSlope, roofTileCol, roofTileRow);
      backSlope.rotateX(-slopeAngle);
      backSlope.translate(0, height * 0.5, -hw * 0.5);
      parts.push(backSlope);

      // Gable triangular walls at -X and +X
      const shape = new THREE.Shape();
      shape.moveTo(-hw + 0.08, 0);
      shape.lineTo(hw - 0.08, 0);
      shape.lineTo(0, height - 0.04);
      shape.closePath();

      const extrudeSettings = { depth: length - 0.16, bevelEnabled: false };
      const gableGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      // Normalize UVs of ExtrudeGeometry to [0,1] before mapping to tile
      normalizePlanarUVs(gableGeo, hw * 2, height);
      mapUVToTile(gableGeo, gableTileCol, gableTileRow);
      gableGeo.rotateY(Math.PI * 0.5);
      gableGeo.translate(-(length - 0.16) * 0.5, 0, 0);
      parts.push(gableGeo);

      // Timber bargeboards along gable edges
      [-hl + 0.04, hl - 0.04].forEach(gx => {
        const leftBoard = new THREE.BoxGeometry(0.1, 0.12, slopeLen + 0.08);
        mapUVToTile(leftBoard, 3, 0);
        leftBoard.rotateX(slopeAngle);
        leftBoard.translate(gx, height * 0.5, hw * 0.5);
        parts.push(leftBoard);

        const rightBoard = new THREE.BoxGeometry(0.1, 0.12, slopeLen + 0.08);
        mapUVToTile(rightBoard, 3, 0);
        rightBoard.rotateX(-slopeAngle);
        rightBoard.translate(gx, height * 0.5, -hw * 0.5);
        parts.push(rightBoard);
      });
    } else {
      // Ridge runs along Z axis (width = X span, length = Z span)
      // Left slope (-X)
      const leftSlope = new THREE.BoxGeometry(slopeLen, 0.08, length);
      mapUVToTile(leftSlope, roofTileCol, roofTileRow);
      leftSlope.rotateZ(slopeAngle);
      leftSlope.translate(-hw * 0.5, height * 0.5, 0);
      parts.push(leftSlope);

      // Right slope (+X)
      const rightSlope = new THREE.BoxGeometry(slopeLen, 0.08, length);
      mapUVToTile(rightSlope, roofTileCol, roofTileRow);
      rightSlope.rotateZ(-slopeAngle);
      rightSlope.translate(hw * 0.5, height * 0.5, 0);
      parts.push(rightSlope);

      // Gable triangular walls along Z
      const shape = new THREE.Shape();
      shape.moveTo(-hw + 0.08, 0);
      shape.lineTo(hw - 0.08, 0);
      shape.lineTo(0, height - 0.04);
      shape.closePath();

      const extrudeSettings = { depth: length - 0.16, bevelEnabled: false };
      const gableGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      normalizePlanarUVs(gableGeo, hw * 2, height);
      mapUVToTile(gableGeo, gableTileCol, gableTileRow);
      gableGeo.translate(0, 0, -(length - 0.16) * 0.5);
      parts.push(gableGeo);

      // Front & back timber bargeboards
      [hl - 0.04, -hl + 0.04].forEach(gz => {
        const lBoard = new THREE.BoxGeometry(slopeLen + 0.08, 0.12, 0.1);
        mapUVToTile(lBoard, 3, 0);
        lBoard.rotateZ(slopeAngle);
        lBoard.translate(-hw * 0.5, height * 0.5, gz);
        parts.push(lBoard);

        const rBoard = new THREE.BoxGeometry(slopeLen + 0.08, 0.12, 0.1);
        mapUVToTile(rBoard, 3, 0);
        rBoard.rotateZ(-slopeAngle);
        rBoard.translate(hw * 0.5, height * 0.5, gz);
        parts.push(rBoard);
      });
    }

    return mergeBufferGeometries(parts);
  }

  function normalizePlanarUVs(geom, spanX, spanY) {
    const pos = geom.attributes.position;
    const uv = geom.attributes.uv;
    if (!uv) return;
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) / spanX) + 0.5;
      const v = (pos.getY(i) / spanY);
      uv.setXY(i, Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v)));
    }
    uv.needsUpdate = true;
  }

  // Build the complete Medieval Guildhall / Manor House geometry matching the reference artwork
  function buildGuildhallGeometry() {
    const parts = [];

    function addBox(w, h, d, x, y, z, col, row, rotX = 0, rotY = 0, rotZ = 0, subRect = null) {
      const g = new THREE.BoxGeometry(w, h, d);
      mapUVToTile(g, col, row, 1, 1, subRect);
      if (rotX) g.rotateX(rotX);
      if (rotY) g.rotateY(rotY);
      if (rotZ) g.rotateZ(rotZ);
      g.translate(x, y, z);
      parts.push(g);
    }

    function addCyl(rTop, rBot, h, segs, x, y, z, col, row, rotX = 0, rotY = 0, rotZ = 0, subRect = null) {
      const g = new THREE.CylinderGeometry(rTop, rBot, h, segs);
      mapUVToTile(g, col, row, 1, 1, subRect);
      if (rotX) g.rotateX(rotX);
      if (rotY) g.rotateY(rotY);
      if (rotZ) g.rotateZ(rotZ);
      g.translate(x, y, z);
      parts.push(g);
    }

    // =========================================================================
    // 1. COURTYARD BASE PLINTH & FLAGSTONE PAVING
    // =========================================================================
    addBox(6.8, 0.18, 5.4, 0.0, -1.65, 0.1, 0, 3);
    // Molded stone border around plinth
    addBox(6.92, 0.08, 5.52, 0.0, -1.72, 0.1, 1, 0);

    // =========================================================================
    // 2. GROUND FLOOR STONE HALL (Rusticated Ashlar Stone + Corner Quoins)
    // =========================================================================
    const gfY = -0.82;
    const gfH = 1.50;
    // Main Stone Body (Left, Center, Right)
    addBox(3.75, gfH, 2.75, -0.05, gfY, 0.0, 0, 0);

    // Stone belt course / cornice moulding between Ground Floor & Upper Floor
    addBox(3.92, 0.14, 2.92, -0.05, -0.03, 0.0, 1, 0);

    // Corner Quoin Pillars (alternating rusticated corner blocks)
    const quoinCorners = [
      [-1.92, 1.37],
      [0.24, 1.37],
      [1.82, 1.37],
      [1.82, -1.37],
      [-1.92, -1.37]
    ];
    quoinCorners.forEach(([qx, qz]) => {
      for (let k = 0; k < 6; k++) {
        const bw = (k % 2 === 0) ? 0.24 : 0.18;
        const bd = (k % 2 === 0) ? 0.18 : 0.24;
        addBox(bw, 0.23, bd, qx, -1.44 + k * 0.24, qz, 1, 0);
      }
    });

    // =========================================================================
    // 3. GRAND FRONT ENTRANCE PORTAL, ARCHED DOORS, TYMPANUM & STAIRCASE
    // =========================================================================
    const doorX = -0.78;
    const doorZ = 1.46;

    // Projecting Stone Entrance Portal Bay
    addBox(1.52, 1.62, 0.34, doorX, -0.78, doorZ - 0.05, 1, 0);

    // Left & Right Classical Fluted Pilasters flanking the entrance
    [-0.62, 0.62].forEach(dx => {
      addBox(0.22, 1.35, 0.26, doorX + dx, -0.88, doorZ + 0.08, 1, 0);
      // Pilaster Base & Capital
      addBox(0.28, 0.14, 0.32, doorX + dx, -1.50, doorZ + 0.08, 1, 0);
      addBox(0.30, 0.15, 0.34, doorX + dx, -0.16, doorZ + 0.08, 1, 0);
    });

    // Recessed Wooden Double Doors (Tile 2,1)
    addBox(0.96, 1.15, 0.12, doorX, -0.96, doorZ + 0.06, 2, 1);

    // Semicircular Carved Stone Tympanum above Door (Tile 3,1)
    const tympCyl = new THREE.CylinderGeometry(0.48, 0.48, 0.14, 24, 1, false, 0, Math.PI);
    mapUVToTile(tympCyl, 3, 1);
    tympCyl.rotateZ(Math.PI * 0.5);
    tympCyl.rotateY(Math.PI * 0.5);
    tympCyl.translate(doorX, -0.38, doorZ + 0.08);
    parts.push(tympCyl);

    // Outer Moulded Stone Arch Ring (Voussoirs) over Tympanum
    const archSegments = 11;
    for (let i = 0; i < archSegments; i++) {
      const a = Math.PI * (i + 0.5) / archSegments;
      const r = 0.56;
      const vx = doorX - Math.cos(a) * r;
      const vy = -0.38 + Math.sin(a) * r;
      addBox(0.16, 0.16, 0.28, vx, vy, doorZ + 0.12, 1, 0, 0, 0, a - Math.PI * 0.5);
    }
    // Central Keystone with carved crest at top of arch
    addBox(0.20, 0.26, 0.34, doorX, 0.20, doorZ + 0.15, 3, 1);

    // 5-Step Wide Stone Entrance Staircase
    for (let s = 0; s < 5; s++) {
      const stepH = 0.09;
      const stepD = 0.72 - s * 0.12;
      const stepY = -1.52 + s * stepH;
      const stepZ = doorZ + 0.22 + stepD * 0.5;
      addBox(1.36, stepH, stepD, doorX, stepY, stepZ, 1, 0);
    }

    // Stepped Stone Balustrades & Newel Posts flanking stairs
    [-0.72, 0.72].forEach(sx => {
      // Bottom square newel post with ball finial
      addBox(0.22, 0.48, 0.22, doorX + sx, -1.32, doorZ + 0.90, 1, 0);
      addBox(0.26, 0.08, 0.26, doorX + sx, -1.06, doorZ + 0.90, 1, 0);
      // Sloped stone handrail
      addBox(0.16, 0.12, 0.78, doorX + sx, -1.02, doorZ + 0.52, 1, 0, 0.46, 0, 0);
      // Balusters under handrail
      for (let b = 0; b < 4; b++) {
        addCyl(0.04, 0.05, 0.28, 8, doorX + sx, -1.24 + b * 0.08, doorZ + 0.76 - b * 0.15, 1, 0);
      }
    });

    // Warm Glowing Wall Lanterns flanking the entrance arch
    [-0.64, 0.64].forEach(lx => {
      // Iron wall bracket
      addBox(0.05, 0.05, 0.18, doorX + lx, -0.68, doorZ + 0.25, 3, 3, 0, 0, 0, { u: 0, v: 0.5, uw: 0.5, vh: 0.5 });
      // Lantern glowing body
      addCyl(0.08, 0.06, 0.18, 6, doorX + lx, -0.72, doorZ + 0.34, 3, 3, 0, 0, 0, { u: 0.5, v: 0, uw: 0.5, vh: 0.5 });
      // Lantern cap
      addCyl(0.01, 0.10, 0.08, 6, doorX + lx, -0.60, doorZ + 0.34, 3, 3, 0, 0, 0, { u: 0, v: 0.5, uw: 0.5, vh: 0.5 });
    });

    // =========================================================================
    // 4. GLOWING ARCHED WINDOWS ON GROUND FLOOR (Front & Right Facade)
    // =========================================================================
    // Front Right Arched Window
    const winFrontX = 0.98;
    const winFrontY = -0.82;
    addBox(0.76, 0.94, 0.14, winFrontX, winFrontY, 1.38, 1, 0); // Stone frame
    addBox(0.62, 0.80, 0.16, winFrontX, winFrontY, 1.39, 0, 2); // Glowing window + iron grille
    addBox(0.86, 0.10, 0.22, winFrontX, winFrontY - 0.48, 1.42, 1, 0); // Window sill

    // Right Side Wall Arched Windows (2 large arched windows along +X wall)
    [-0.58, 0.58].forEach(wz => {
      addBox(0.14, 0.94, 0.72, 1.84, winFrontY, wz, 1, 0);
      addBox(0.16, 0.80, 0.58, 1.85, winFrontY, wz, 0, 2);
      addBox(0.22, 0.10, 0.82, 1.88, winFrontY - 0.48, wz, 1, 0);
    });

    // =========================================================================
    // 5. SECOND FLOOR HALF-TIMBERED HALL, JETTIED GABLE & BALCONY LOGGIA
    // =========================================================================
    const ufY = 0.65;
    const ufH = 1.22;

    // Left Half-Timbered Volume (behind & including front gable projection)
    addBox(2.25, ufH, 2.82, -0.82, ufY, 0.02, 2, 0);

    // Projecting Front Gable Bay over Entrance Portal
    addBox(1.58, ufH, 0.36, doorX, ufY, 1.42, 2, 0);

    // Ornate Golden Heraldic Coat of Arms Shield on Front Gable Wall
    addBox(0.46, 0.52, 0.10, doorX, 0.68, 1.62, 3, 1);
    // Carved wood cornice above shield
    addBox(1.66, 0.10, 0.42, doorX, 1.24, 1.44, 3, 0);

    // Right Second-Floor Open Arcaded Loggia / Balcony
    // Recessed back & inner wall of loggia with glowing window
    addBox(1.55, ufH, 1.85, 0.95, ufY, -0.45, 2, 0);
    addBox(0.55, 0.72, 0.10, 0.85, ufY, 0.48, 0, 2); // Warm interior window inside loggia

    // Loggia Floor Deck
    addBox(1.68, 0.10, 1.05, 1.02, 0.06, 0.90, 3, 0);

    // Stone Balustrade Railing around Loggia (Front & Right edge)
    // Front balustrade rail
    addBox(1.65, 0.08, 0.14, 1.02, 0.42, 1.36, 1, 0);
    addBox(1.65, 0.08, 0.16, 1.02, 0.12, 1.36, 1, 0);
    for (let b = 0; b < 7; b++) {
      addCyl(0.035, 0.045, 0.26, 8, 0.34 + b * 0.22, 0.27, 1.36, 1, 0);
    }
    // Right side balustrade rail
    addBox(0.14, 0.08, 1.05, 1.80, 0.42, 0.90, 1, 0);
    addBox(0.16, 0.08, 1.05, 1.80, 0.12, 0.90, 1, 0);
    for (let b = 0; b < 5; b++) {
      addCyl(0.035, 0.045, 0.26, 8, 1.80, 0.27, 0.48 + b * 0.21, 1, 0);
    }
    // Corner Stone Balustrade Posts
    [[0.22, 1.36], [1.02, 1.36], [1.80, 1.36], [1.80, 0.38], [1.80, -0.42]].forEach(([px, pz]) => {
      addBox(0.18, 0.42, 0.18, px, 0.26, pz, 1, 0);
    });

    // Timber Arcade Columns & Carved Wooden Arches supporting the Roof over Loggia
    const loggiaCols = [
      [0.24, 1.36],
      [1.02, 1.36],
      [1.80, 1.36],
      [1.80, 0.45],
      [1.80, -0.42],
      [1.80, -1.32]
    ];
    loggiaCols.forEach(([cx, cz]) => {
      addBox(0.13, 0.82, 0.13, cx, 0.84, cz, 3, 0);
      // Curved arch spandrel brackets at top of column
      addBox(0.26, 0.14, 0.14, cx, 1.15, cz, 3, 0);
    });
    // Carved frieze entablature beam above loggia columns
    addBox(1.68, 0.14, 0.16, 1.02, 1.22, 1.36, 3, 0);
    addBox(0.16, 0.14, 2.76, 1.80, 1.22, 0.0, 3, 0);

    // =========================================================================
    // 6. MAIN STEEP TERRACOTTA ROOFS, CROSS GABLES & DORMER WINDOWS
    // =========================================================================
    // Main Transverse Gable Roof running Left-Right (X axis)
    const mainRoof = createGableRoof(3.08, 1.42, 4.05, 'x', 0, 1, 2, 0);
    mainRoof.translate(-0.05, 1.26, 0.0);
    parts.push(mainRoof);

    // Prominent Front Cross-Gable Roof over the Entrance Bay (Slate & Terracotta contrast)
    const frontGableRoof = createGableRoof(1.76, 1.38, 1.95, 'z', 1, 1, 2, 0);
    frontGableRoof.translate(doorX, 1.26, 0.72);
    parts.push(frontGableRoof);

    // Left Roof Dormer Window
    addBox(0.48, 0.44, 0.55, -1.52, 1.78, 0.82, 2, 0);
    addBox(0.32, 0.32, 0.06, -1.52, 1.76, 1.10, 0, 2); // Dormer window pane
    const leftDormerRoof = createGableRoof(0.60, 0.34, 0.68, 'z', 0, 1, 2, 0);
    leftDormerRoof.translate(-1.52, 1.98, 0.84);
    parts.push(leftDormerRoof);

    // Right Roof Dormer Window (above balcony loggia)
    addBox(0.52, 0.46, 0.58, 0.52, 1.78, 0.82, 2, 0);
    addBox(0.34, 0.34, 0.06, 0.52, 1.76, 1.11, 0, 2);
    const rightDormerRoof = createGableRoof(0.64, 0.36, 0.70, 'z', 0, 1, 2, 0);
    rightDormerRoof.translate(0.52, 1.98, 0.84);
    parts.push(rightDormerRoof);

    // Tall Stone Chimneys & Clay Chimney Pots
    // Left Chimney Stack
    addBox(0.42, 0.95, 0.42, -1.05, 2.55, -0.35, 0, 0);
    addBox(0.50, 0.10, 0.50, -1.05, 2.98, -0.35, 1, 0);
    addCyl(0.07, 0.08, 0.24, 8, -1.14, 3.14, -0.35, 0, 1);
    addCyl(0.07, 0.08, 0.24, 8, -0.96, 3.14, -0.35, 0, 1);

    // Right Front Chimney Stack (rising along right slope)
    addBox(0.44, 1.25, 0.44, 1.15, 2.25, 0.55, 0, 0);
    addBox(0.52, 0.12, 0.52, 1.15, 2.86, 0.55, 1, 0);

    // Wrought-Iron Weathervanes on Roof Peaks (W-E / W-N)
    [-1.65, 1.55].forEach(wx => {
      addCyl(0.02, 0.025, 0.58, 6, wx, 2.92, 0.0, 3, 3, 0, 0, 0, { u: 0, v: 0.5, uw: 0.5, vh: 0.5 });
      addBox(0.34, 0.03, 0.03, wx, 3.06, 0.0, 3, 3, 0, 0, 0, { u: 0, v: 0.5, uw: 0.5, vh: 0.5 });
      addBox(0.03, 0.03, 0.34, wx, 3.06, 0.0, 3, 3, 0, 0, 0, { u: 0, v: 0.5, uw: 0.5, vh: 0.5 });
      addCyl(0.05, 0.01, 0.14, 6, wx, 3.22, 0.0, 3, 3, 0, 0, 0, { u: 0.5, v: 0.5, uw: 0.5, vh: 0.5 });
    });

    // =========================================================================
    // 7. RIGHT REAR CLOCK & BELL TOWER + ORIEL STAINED-GLASS BAY WINDOW
    // =========================================================================
    const towX = 2.38;
    const towZ = -0.58;

    // Tower Stone Base & Half-Timbered Middle Stage
    addBox(1.32, 1.65, 1.32, towX, -0.75, towZ, 0, 0);
    addBox(1.40, 0.12, 1.40, towX, 0.08, towZ, 1, 0);
    addBox(1.36, 1.35, 1.36, towX, 0.80, towZ, 2, 0);

    // Steep Slate Gable Sub-Roof on Tower Wing
    const wingRoof = createGableRoof(1.48, 0.95, 1.48, 'x', 1, 1, 2, 0);
    wingRoof.translate(towX, 1.46, towZ);
    parts.push(wingRoof);

    // Projecting Polygonal Oriel Stained-Glass Bay Window on Right Facade of Tower Wing
    const orielX = towX + 0.72;
    const orielY = 0.68;
    const orielZ = towZ + 0.15;
    // Molded Stone/Wood Corbel Bracket supporting Oriel Window
    addCyl(0.34, 0.08, 0.38, 6, orielX - 0.08, orielY - 0.52, orielZ, 3, 0);
    // Hexagonal Stained-Glass Oriel Drum (Tile 1,2)
    addCyl(0.36, 0.36, 0.68, 6, orielX - 0.05, orielY, orielZ, 1, 2);
    // Conical Slate Hip Cap on Oriel Window
    addCyl(0.02, 0.42, 0.44, 6, orielX - 0.05, orielY + 0.55, orielZ, 1, 1);

    // Upper Stone Bell & Clock Tower Belfry rising above roof
    const belfryY = 2.42;
    addBox(1.08, 0.96, 1.08, towX, belfryY, towZ, 1, 0);
    addBox(1.18, 0.10, 1.18, towX, belfryY - 0.48, towZ, 1, 0);
    addBox(1.20, 0.10, 1.20, towX, belfryY + 0.48, towZ, 1, 0);

    // Bell Arch Opening on Front (+Z) of Belfry with Hanging Bronze Bell
    addBox(0.46, 0.58, 0.12, towX, belfryY - 0.02, towZ + 0.50, 3, 3, 0, 0, 0, { u: 0, v: 0.5, uw: 0.5, vh: 0.5 });
    // Hanging Golden-Bronze Bell inside arch
    addCyl(0.08, 0.18, 0.24, 12, towX, belfryY - 0.02, towZ + 0.54, 3, 3, 0, 0, 0, { u: 0.5, v: 0.5, uw: 0.5, vh: 0.5 });

    // Circular Roman Numeral Clock Face on Right (+X) of Belfry (Tile 3,2)
    const clockCyl = new THREE.CylinderGeometry(0.34, 0.34, 0.08, 20);
    mapUVToTile(clockCyl, 3, 2);
    clockCyl.rotateZ(Math.PI * 0.5);
    clockCyl.translate(towX + 0.54, belfryY + 0.02, towZ);
    parts.push(clockCyl);

    // Tall Pointed Octagonal Slate Spire & Copper Finial atop Bell Tower
    addCyl(0.03, 0.82, 1.28, 8, towX, belfryY + 1.14, towZ, 1, 1, 0, Math.PI / 8, 0);
    addCyl(0.01, 0.08, 0.25, 8, towX, belfryY + 1.86, towZ, 3, 3, 0, 0, 0, { u: 0.5, v: 0.5, uw: 0.5, vh: 0.5 });

    // =========================================================================
    // 8. LEFT SIDE TIMBER LEAN-TO PORCH, WATER TROUGH, BENCHES & HITCHING POSTS
    // =========================================================================
    const porchX = -2.48;
    const porchZ = 0.15;

    // Sloped Terracotta Lean-To Porch Roof
    const porchRoof = new THREE.BoxGeometry(1.42, 0.08, 2.55);
    mapUVToTile(porchRoof, 0, 1);
    porchRoof.rotateZ(0.34);
    porchRoof.translate(porchX, -0.02, porchZ);
    parts.push(porchRoof);

    // Timber Porch Support Posts & Curved Brackets
    [-0.95, -0.22, 0.52, 1.22].forEach(pz => {
      addBox(0.12, 1.35, 0.12, porchX - 0.55, -0.90, pz, 3, 0);
      addBox(0.16, 0.16, 0.16, porchX - 0.55, -1.50, pz, 1, 0); // Stone post base
    });
    // Horizontal porch header beam
    addBox(0.14, 0.14, 2.50, porchX - 0.55, -0.22, porchZ, 3, 0);

    // Stone Water Trough / Fountain under Left Porch
    addBox(0.46, 0.34, 0.86, porchX - 0.25, -1.38, -0.45, 1, 0);
    // Water surface inside trough
    addBox(0.36, 0.04, 0.74, porchX - 0.25, -1.21, -0.45, 3, 3, 0, 0, 0, { u: 0.5, v: 0, uw: 0.5, vh: 0.5 });
    // Spout pipe
    addBox(0.18, 0.24, 0.08, porchX + 0.02, -1.12, -0.45, 1, 0);

    // Wooden Bench against Left Wall under Porch
    addBox(0.32, 0.06, 1.05, -1.98, -1.28, 0.45, 1, 3);
    addBox(0.06, 0.34, 1.05, -1.86, -1.12, 0.45, 1, 3);
    addBox(0.28, 0.26, 0.08, -1.98, -1.42, 0.02, 3, 0);
    addBox(0.28, 0.26, 0.08, -1.98, -1.42, 0.88, 3, 0);

    // Wooden Bollard Posts & Hanging Iron Chains around Left Courtyard
    const bollards = [
      [-3.15, 1.55],
      [-2.62, 1.72],
      [-2.08, 1.88]
    ];
    bollards.forEach(([bx, bz]) => {
      addCyl(0.06, 0.065, 0.52, 8, bx, -1.32, bz, 3, 0);
      addCyl(0.075, 0.06, 0.06, 8, bx, -1.04, bz, 3, 0);
    });
    // Hanging chains between bollards
    addBox(0.56, 0.04, 0.04, -2.88, -1.22, 1.63, 3, 3, 0, -0.3, 0, { u: 0, v: 0.5, uw: 0.5, vh: 0.5 });
    addBox(0.56, 0.04, 0.04, -2.35, -1.22, 1.80, 3, 3, 0, -0.3, 0, { u: 0, v: 0.5, uw: 0.5, vh: 0.5 });

    // =========================================================================
    // 9. CRIMSON & GOLD ROYAL BANNERS (5 Hanging Banners on Facade)
    // =========================================================================
    function addBanner(x, y, z, w, h, isLion = true, tiltZ = 0) {
      // Gold horizontal hanger rod
      addCyl(0.02, 0.02, w + 0.14, 6, x, y + h * 0.5 + 0.03, z, 3, 3, 0, 0, Math.PI * 0.5, { u: 0.5, v: 0.5, uw: 0.5, vh: 0.5 });
      // Banner cloth body (Left half of Tile 2,2 is Lion, Right half is Broadsword)
      const sub = isLion ? { u: 0.02, v: 0.04, uw: 0.46, vh: 0.92 } : { u: 0.52, v: 0.04, uw: 0.46, vh: 0.92 };
      addBox(w, h, 0.03, x, y, z, 2, 2, 0, 0, tiltZ, sub);
      // Pointed swallowtail / triangular pennant tip at bottom
      const tip = new THREE.ConeGeometry(w * 0.52, 0.22, 4);
      mapUVToTile(tip, 2, 2, 1, 1, sub);
      tip.rotateY(Math.PI * 0.25);
      tip.rotateX(Math.PI);
      tip.scale(1.0, 1.0, 0.12);
      tip.translate(x, y - h * 0.5 - 0.10, z);
      parts.push(tip);
    }

    // Two Upper Left Banners (Lion & Sword)
    addBanner(-1.72, 0.55, 1.46, 0.34, 0.82, true);
    addBanner(-1.32, 0.52, 1.46, 0.34, 0.82, false);
    // Upper Right Banner flanking Entrance Gable
    addBanner(-0.12, 0.48, 1.62, 0.34, 0.84, false, -0.08);
    // Two Lower Ground Floor Banners flanking the Front Right Arched Window
    addBanner(0.46, -0.78, 1.42, 0.26, 0.66, true);
    addBanner(1.50, -0.78, 1.42, 0.26, 0.66, false);

    // =========================================================================
    // 10. FLOWER PLANTERS, CRATES, BARRELS & COURTYARD NOTICE BOARD
    // =========================================================================
    // Front Stone Flower Planter Box & Pedestal Pots between Door & Corner
    addBox(0.76, 0.28, 0.34, 0.98, -1.42, 1.62, 1, 0);
    addBox(0.68, 0.24, 0.26, 0.98, -1.20, 1.62, 2, 3); // Lush flowers & foliage

    // Flanking stone flower pedestals with spherical flower bushes
    [0.48, 1.48].forEach(px => {
      addBox(0.30, 0.34, 0.30, px, -1.39, 1.64, 1, 0);
      addCyl(0.16, 0.11, 0.16, 10, px, -1.15, 1.64, 0, 1); // Terracotta pot
      const bush = new THREE.IcosahedronGeometry(0.19, 1);
      mapUVToTile(bush, 2, 3);
      bush.translate(px, -0.96, 1.64);
      parts.push(bush);
    });

    // Left Stair Planter Pot
    addCyl(0.15, 0.10, 0.16, 10, doorX - 0.85, -1.18, doorZ + 0.18, 0, 1);
    const leftBush = new THREE.IcosahedronGeometry(0.18, 1);
    mapUVToTile(leftBush, 2, 3);
    leftBush.translate(doorX - 0.85, -1.00, doorZ + 0.18);
    parts.push(leftBush);

    // Wooden Cargo Crates at Right Corner
    addBox(0.36, 0.36, 0.36, 2.08, -1.38, 1.18, 1, 3, 0, 0.12, 0);
    addBox(0.32, 0.32, 0.32, 2.12, -1.40, 0.76, 1, 3, 0, -0.08, 0);

    // Wooden Barrels on Right Side
    addCyl(0.16, 0.16, 0.42, 12, 2.15, -1.35, -0.05, 1, 3);
    addCyl(0.16, 0.16, 0.42, 12, 2.28, -1.35, -0.42, 1, 3);

    // Freestanding Wooden Courtyard Notice Board / Quest Board on Right Side
    const nbX = 2.65;
    const nbZ = 0.35;
    addBox(0.10, 1.15, 0.10, nbX, -0.98, nbZ - 0.48, 3, 0);
    addBox(0.10, 1.15, 0.10, nbX, -0.98, nbZ + 0.48, 3, 0);
    addBox(0.32, 0.08, 0.14, nbX, -1.52, nbZ - 0.48, 3, 0);
    addBox(0.32, 0.08, 0.14, nbX, -1.52, nbZ + 0.48, 3, 0);
    // Notice board backing plank
    addBox(0.06, 0.68, 0.92, nbX, -0.82, nbZ, 1, 3);
    // Pitched mini-roof cap on notice board
    addBox(0.24, 0.10, 1.10, nbX, -0.44, nbZ, 3, 0);
    // Pinned Parchment Quest Notices on Board
    [-0.26, 0.0, 0.26].forEach((nz, idx) => {
      addBox(0.08, 0.22, 0.18, nbX, -0.76 + (idx % 2) * 0.08, nbZ + nz, 3, 3, 0, 0, 0, { u: 0, v: 0, uw: 0.5, vh: 0.5 });
    });

    const finalGeom = mergeBufferGeometries(parts);
    finalGeom.computeVertexNormals();
    return finalGeom;
  }

  let cachedAtlasTexture = null;
  let cachedAtlasCanvas = null;

  const MedievalHouseBuilder = {
    getAtlasCanvas: function() {
      if (!cachedAtlasCanvas) {
        cachedAtlasCanvas = generateAtlasCanvas();
      }
      return cachedAtlasCanvas;
    },

    getAtlasTexture: function() {
      if (!cachedAtlasTexture) {
        const canvas = this.getAtlasCanvas();
        cachedAtlasTexture = new THREE.CanvasTexture(canvas);
        cachedAtlasTexture.anisotropy = 4;
        cachedAtlasTexture.needsUpdate = true;
      }
      return cachedAtlasTexture;
    },

    createMaterial: function(options = {}) {
      const tex = this.getAtlasTexture();
      return new THREE.MeshStandardMaterial({
        name: 'MedievalGuildhall_PBR',
        map: tex,
        roughness: 0.72,
        metalness: 0.08,
        flatShading: options.flatShading || false,
        wireframe: options.wireframe || false,
        side: THREE.DoubleSide
      });
    },

    buildGeometry: function() {
      return buildGuildhallGeometry();
    }
  };

  window.MedievalHouseBuilder = MedievalHouseBuilder;
})(window);
