/* ============================================================================
   engine_loop.js - Teil 3 der Engine: Aufpolierte Hafenstädte & Fischerdörfer,
                    Meeresströmungen, Naturwunder, 4:3-HUD & Live-Bau-Timer
   ============================================================================ */

function drawDetailedPortTown(p) {
  const fac = FACTIONS[p.faction] || FACTIONS.pirates;
  const rot = p.coastRotation || 0;
  const seaAng = p.seaAngle !== undefined ? p.seaAngle : (rot + Math.PI / 2);
  const landAng = seaAng + Math.PI;
  const sideAng = seaAng + Math.PI / 2;
  const isConquered = !!(game.conqueredPorts && game.conqueredPorts[p.id]);
  const isDmSafe = !!(game.isMultiplayer && game.mpMode === 'deathmatch');
  const night = isNightTime();
  const tiltInv = 1 / (window.ISO_TILT_Y || 0.62);

  let hash = 0;
  for (let i = 0; i < p.id.length; i++) hash = (hash * 31 + p.id.charCodeAt(i)) & 0xffff;
  const flipPort = (hash % 2) === 1;
  const isCapital = (p.maxFortHp || 3000) >= 3550;

  // 1. EXAKT AN DIE KÜSTENLINIE AUSGERICHTETE KAIMAUER & EICHENHOLZ-ANLEGEPIERS!
  //    (Dreht sich mit p.coastRotation immer präzise zum Meer hinaus – Nord, Süd, Ost & West!)
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.strokeStyle = isDmSafe ? '#2ecc71' : fac.color;
  ctx.fillStyle = isDmSafe ? 'rgba(46, 204, 113, 0.08)' : 'rgba(255, 215, 0, 0.04)';
  ctx.lineWidth = 2.4;
  ctx.setLineDash([16, 10]);
  ctx.beginPath(); ctx.arc(0, 0, 360, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.setLineDash([]);

  ctx.rotate(rot);
  const quayHalfW = isCapital ? 104 : 84;
  // Wasserschatten unter Kaimauer & Stegen
  ctx.fillStyle = 'rgba(2, 10, 20, 0.48)';
  ctx.fillRect(-quayHalfW - 4, -18, quayHalfW * 2 + 8, 34);

  // Naturstein-/Holz-Uferbefestigung bündig am Strand
  ctx.fillStyle = p.faction === 'pirates' ? '#5c3a21' : '#78716c';
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 2;
  ctx.fillRect(-quayHalfW, -22, quayHalfW * 2, 30);
  ctx.strokeRect(-quayHalfW, -22, quayHalfW * 2, 30);
  ctx.fillStyle = p.faction === 'pirates' ? '#7c4d2b' : '#a8a29e';
  ctx.fillRect(-quayHalfW + 3, -20, quayHalfW * 2 - 6, 8);

  // Anlegepiers exakt in See-Richtung (+Y im gedrehten Küstensystem) mit Holzpfählen & Pollerköpfen
  const pierOffsets = isCapital ? [-58, 0, 58] : [-38, 38];
  for (const pxOff of pierOffsets) {
    const pierLen = pxOff === 0 ? 64 : 52;
    ctx.fillStyle = 'rgba(2, 8, 16, 0.45)';
    ctx.fillRect(pxOff - 10, 8, 22, pierLen + 3);
    ctx.fillStyle = '#6b4226';
    ctx.strokeStyle = '#271509';
    ctx.lineWidth = 1.6;
    ctx.fillRect(pxOff - 10, 6, 20, pierLen);
    ctx.strokeRect(pxOff - 10, 6, 20, pierLen);
    // Plankenfugen
    ctx.strokeStyle = 'rgba(30, 15, 5, 0.55)';
    ctx.lineWidth = 1;
    for (let py = 14; py < 6 + pierLen - 4; py += 8) {
      ctx.beginPath(); ctx.moveTo(pxOff - 9, py); ctx.lineTo(pxOff + 9, py); ctx.stroke();
    }
    // Eichen-Poller
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(pxOff - 7, pierLen, 2.3, 0, Math.PI * 2);
    ctx.arc(pxOff + 7, pierLen, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 2. REALISTISCHE 2.5D-KOLONIALARCHITEKTUR AUF DEM FESTLAND HINTER DER KAIMAUER!
  //    Entlang landAng sauber landeinwärts gerückt, damit kein Haus im Wasser schwimmt!
  const townX = p.x + Math.cos(landAng) * 74;
  const townY = p.y + Math.sin(landAng) * 74;

  let portSpriteKey = 'port_merchant';
  if (p.faction === 'spain') portSpriteKey = 'port_spain';
  else if (p.faction === 'england' || p.faction === 'denmark') portSpriteKey = 'port_england';
  else if (p.faction === 'pirates') portSpriteKey = 'port_pirates';

  const mainSz = isCapital ? 236 : 204;
  const townParts = [{ key: portSpriteKey, x: townX, y: townY, sz: mainSz, anchor: 0.80, flip: flipPort }];

  if (!isDmSafe) {
    const flank1Key = p.faction === 'pirates' ? 'tavern' : (isCapital ? 'tobacco_coffee_estate' : 'warehouse');
    const f1x = townX + Math.cos(landAng) * 34 + Math.cos(sideAng) * (flipPort ? -96 : 96);
    const f1y = townY + Math.sin(landAng) * 34 + Math.sin(sideAng) * (flipPort ? -96 : 96);
    townParts.push({ key: flank1Key, x: f1x, y: f1y, sz: isCapital ? 122 : 104, anchor: 0.82, flip: !flipPort });

    // Wehrhafte Küsten-Sternbastion direkt seitlich an der Hafeneinfahrt
    const fortX = p.x + Math.cos(landAng) * 28 + Math.cos(sideAng) * (flipPort ? 98 : -98);
    const fortY = p.y + Math.sin(landAng) * 28 + Math.sin(sideAng) * (flipPort ? 98 : -98);
    townParts.push({ key: 'coastal_fort', x: fortX, y: fortY, sz: isCapital ? 122 : 102, anchor: 0.80, flip: flipPort });
  }
  townParts.sort((a, b) => a.y - b.y);

  let drewMain = false;
  for (const tp of townParts) {
    const ok = window.drawWorldSpriteUpright && drawWorldSpriteUpright(ctx, tp.key, tp.x, tp.y, tp.sz, tp.sz, tp.anchor, tp.flip);
    if (tp.key === portSpriteKey && ok) drewMain = true;
  }

  if (!drewMain) {
    ctx.save(); ctx.translate(townX, townY); ctx.scale(1, tiltInv);
    ctx.fillStyle = '#64748b'; ctx.fillRect(-80, -38, 160, 42);
    ctx.restore();
  }

  // 3. Warme Nachtfenster, wehende Nationalflagge & Hafen-Banner mit generierten Icons!
  ctx.save();
  ctx.translate(townX, townY);
  ctx.scale(1, tiltInv);

  if (night) {
    ctx.fillStyle = 'rgba(254, 240, 138, 0.30)';
    [[-42, -52], [4, -62], [44, -48]].forEach(([lx, ly]) => {
      ctx.beginPath(); ctx.arc(lx, ly, 16, 0, Math.PI * 2); ctx.fill();
    });
  }

  const flagWave = Math.sin((game.time || 0) * 0.12 + p.x) * 2.5;
  const poleX = portSpriteKey === 'port_spain' ? (flipPort ? 38 : -38) : 0;
  const poleTopY = isCapital ? -168 : -146;
  ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(poleX, poleTopY + 26); ctx.lineTo(poleX, poleTopY); ctx.stroke();
  ctx.fillStyle = isDmSafe ? '#2ecc71' : fac.color;
  ctx.strokeStyle = '#111827'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(poleX, poleTopY);
  ctx.lineTo(poleX + 26, poleTopY + 3 + flagWave);
  ctx.lineTo(poleX + 21, poleTopY + 9 + flagWave * 0.5);
  ctx.lineTo(poleX + 26, poleTopY + 15 + flagWave);
  ctx.lineTo(poleX, poleTopY + 13);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  if (p.fortHp <= 0 && !isDmSafe) {
    const flk = 8 + Math.sin((game.time || 0) * 0.25) * 3;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.beginPath(); ctx.arc(-18, -32, flk, 0, Math.PI * 2); ctx.arc(16, -26, flk * 0.8, 0, Math.PI * 2); ctx.fill();
  }

  const uiTop = isCapital ? -196 : -174;
  if (!isDmSafe) {
    const fbw = 135;
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(-fbw / 2, uiTop, fbw, 9);
    ctx.fillStyle = p.fortHp > 0 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(-fbw / 2, uiTop, fbw * (p.fortHp / p.maxFortHp), 9);
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 1; ctx.strokeRect(-fbw / 2, uiTop, fbw, 9);
  }

  ctx.shadowColor = 'rgba(0,0,0,0.92)'; ctx.shadowBlur = 5;
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16.5px sans-serif'; ctx.textAlign = 'center';
  const portLabel = isDmSafe ? `🛡️ Safe-Zone Dock` : `${isConquered ? '👑 ' : '🏰 '}${p.name}`;
  if (window.drawCanvasIconLabel) drawCanvasIconLabel(ctx, portLabel, 0, uiTop - 10, 18);
  else ctx.fillText(portLabel, 0, uiTop - 10);

  ctx.fillStyle = isDmSafe ? '#2ecc71' : fac.color; ctx.font = 'bold 12.5px sans-serif';
  ctx.fillText(isDmSafe ? '[Waffenruhe & Schiffs-Umbau • Taste F]' : (p.fortHp > 0 ? `[${td(fac, 'name')} • ${Math.ceil(p.fortHp)} HP]` : `[STURMREIF • Taste V!]`), 0, uiTop + 22);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawFishingVillage(fv) {
  const raided = (fv.raidCooldown || 0) > 0;
  const isVoodoo = !!fv.isVoodooVillage;
  const rot = fv.coastRotation || 0;
  const seaAng = fv.seaAngle !== undefined ? fv.seaAngle : (rot + Math.PI / 2);
  const landAng = seaAng + Math.PI;
  const flicker = Math.sin((game.time || 0) * 0.25 + fv.x) * 1.8;
  const tiltInv = 1 / (window.ISO_TILT_Y || 0.62);

  ctx.save();
  ctx.translate(fv.x, fv.y);
  ctx.strokeStyle = raided ? '#ef4444' : (isVoodoo ? '#c084fc' : '#34d399');
  ctx.fillStyle = raided ? 'rgba(239, 68, 68, 0.08)' : (isVoodoo ? 'rgba(168, 85, 247, 0.14)' : 'rgba(16, 185, 129, 0.08)');
  ctx.lineWidth = 1.8; ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.arc(0, 0, 155, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);

  // Kleiner Holz-Fischersteg exakt ins Meer ausgerichtet
  ctx.rotate(rot);
  ctx.fillStyle = '#5c3a21'; ctx.strokeStyle = '#1e1108'; ctx.lineWidth = 1.5;
  ctx.fillRect(-8, 0, 16, 46); ctx.strokeRect(-8, 0, 16, 46);
  ctx.restore();

  const hutX = fv.x + Math.cos(landAng) * 46;
  const hutY = fv.y + Math.sin(landAng) * 46;
  const sprKey = isVoodoo ? 'voodoo_village' : 'fishing_village';
  if (!window.drawWorldSpriteUpright || !drawWorldSpriteUpright(ctx, sprKey, hutX, hutY, 158, 158, 0.80)) {
    ctx.save(); ctx.translate(hutX, hutY);
    ctx.fillStyle = isVoodoo ? '#4c1d95' : '#92400e';
    ctx.fillRect(-24, -18, 48, 24);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(hutX, hutY);
  ctx.scale(1, tiltInv);
  if (!raided) {
    ctx.fillStyle = isVoodoo ? '#34d399' : '#f97316';
    ctx.shadowColor = isVoodoo ? '#10b981' : '#fde047';
    ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(0, -22, 4.2 + flicker * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.78)';
    ctx.beginPath(); ctx.arc(0, -28, 7 + flicker * 0.4, 0, Math.PI * 2); ctx.fill();
  }

  ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 5;
  ctx.fillStyle = raided ? '#fca5a5' : (isVoodoo ? '#e9d5ff' : '#a7f3d0');
  ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
  const vilLbl = `${raided ? '🔥' : (isVoodoo ? '🕯️' : '🐟')} ${td(fv, 'name')}`;
  if (window.drawCanvasIconLabel) drawCanvasIconLabel(ctx, vilLbl, 0, -112, 16);
  else ctx.fillText(vilLbl, 0, -112);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawDetailedFlotsam(f) {
  const bob = Math.sin(game.time * 0.08 + f.x) * 2.4;
  const tiltInv = 1 / (window.ISO_TILT_Y || 0.62);

  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.strokeStyle = f.isTutorialCrate ? 'rgba(253, 224, 71, 0.78)' : 'rgba(224, 242, 254, 0.38)';
  ctx.lineWidth = f.isTutorialCrate ? 2.2 : 1.3;
  ctx.beginPath(); ctx.arc(0, 0, (f.isTutorialCrate ? 24 : 17) + Math.sin(game.time * 0.06) * 3, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  if (!window.drawWorldSpriteUpright || !drawWorldSpriteUpright(ctx, 'flotsam_crate', f.x, f.y + bob, 44, 44, 0.65)) {
    ctx.save(); ctx.translate(f.x, f.y + bob); ctx.scale(1, tiltInv);
    ctx.fillStyle = '#92400e'; ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.4;
    ctx.fillRect(-8, -10, 16, 12); ctx.strokeRect(-8, -10, 16, 12);
    ctx.restore();
  }

  if (f.isTutorialCrate || f.isMissionRescue || f.survivors > 0) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(1, tiltInv);
    ctx.fillStyle = (f.isTutorialCrate || f.isMissionRescue) ? '#fde047' : '#38bdf8';
    ctx.font = 'bold 11.5px sans-serif'; ctx.textAlign = 'center';
    ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
    drawCanvasIconLabel(ctx, f.isTutorialCrate ? '📦 Hornigold!' : (f.isMissionRescue ? '🚣 SOS!' : `🚣 ${f.survivors}`), 0, -24, 13);
    ctx.restore();
  }
}

function drawSeaMonster(m) {
  const tiltInv = 1 / (window.ISO_TILT_Y || 0.62);

  // Brodelnder Tiefsee-Schatten & animierte Tentakel im Wasser
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.fillStyle = 'rgba(6, 78, 59, 0.42)';
  ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2 + Math.sin(m.tentaclePhase + i) * 0.25;
    ctx.save(); ctx.rotate(ang);
    ctx.strokeStyle = '#0f766e'; ctx.lineWidth = 6.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(12, 0); ctx.quadraticCurveTo(28, Math.sin(m.tentaclePhase * 1.5 + i) * 15, 46, 0); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // Aufrechter 2.5D-Riesenkraken-Kopf mit glühenden Augen!
  const bob = Math.sin(m.tentaclePhase * 0.8) * 3;
  if (!window.drawWorldSpriteUpright || !drawWorldSpriteUpright(ctx, 'kraken', m.x, m.y + bob, 86, 86, 0.62)) {
    ctx.save(); ctx.translate(m.x, m.y); ctx.scale(1, tiltInv);
    ctx.fillStyle = '#134e4a'; ctx.beginPath(); ctx.arc(0, -10, 20, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawProjectile(b) {
  const tiltInv = 1 / (window.ISO_TILT_Y || 0.62);
  // 2.5D Parabel-Flughöhe + echter Kugelschatten auf der Meeresoberfläche!
  const maxL = b.maxLife || 110;
  const prog = Math.max(0, Math.min(1, 1 - (b.life / maxL)));
  const arcHeight = Math.sin(prog * Math.PI) * (b.ammoType === 'grape' ? 8 : 22);

  // Schatten auf dem Wasser
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.fillStyle = 'rgba(0, 8, 16, 0.42)';
  ctx.beginPath(); ctx.arc(0, 2, b.radius * 0.85, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Aufrechte Kugel auf Parabel-Höhe
  ctx.save();
  ctx.translate(b.x, b.y - arcHeight * tiltInv);
  ctx.scale(1, tiltInv);

  ctx.strokeStyle = b.isGhostShot ? 'rgba(52, 211, 153, 0.48)' : 'rgba(226, 232, 240, 0.30)';
  ctx.lineWidth = b.radius * 0.9;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-b.vx * 2.0, -b.vy * 2.0 * (window.ISO_TILT_Y || 0.62)); ctx.stroke();

  if (b.isGhostShot) { ctx.shadowColor = '#10b981'; ctx.shadowBlur = 14; }
  function drawMetalSphere(cx, cy, r) {
    const grad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
    if (b.isGhostShot) { grad.addColorStop(0, '#ecfdf5'); grad.addColorStop(0.4, '#34d399'); grad.addColorStop(1, '#064e3b'); }
    else { grad.addColorStop(0, '#f8fafc'); grad.addColorStop(0.35, '#94a3b8'); grad.addColorStop(0.75, '#334155'); grad.addColorStop(1, '#090d16'); }
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }
  if (b.ammoType === 'chain') {
    ctx.rotate(b.spin);
    ctx.strokeStyle = b.isGhostShot ? '#6ee7b7' : '#cbd5e1'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-6.5, 0); ctx.lineTo(6.5, 0); ctx.stroke();
    drawMetalSphere(-6.5, 0, 3.6); drawMetalSphere(6.5, 0, 3.6);
  } else drawMetalSphere(0, 0, b.radius);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawStormsInWorld(camLeft, camTop, viewW, viewH) {
  for (const st of storms) {
    if (st.x + st.r < camLeft || st.x - st.r > camLeft + viewW ||
        st.y + st.r < camTop || st.y - st.r > camTop + viewH) continue;
    ctx.save();
    const alphaBase = Math.min(0.94, 0.46 + st.intensity * 0.30);
    const grad = ctx.createRadialGradient(st.x, st.y, st.r * 0.08, st.x, st.y, st.r);
    if (st.isBarrier) {
      grad.addColorStop(0, `rgba(4, 28, 24, ${alphaBase})`); grad.addColorStop(0.58, `rgba(12, 48, 42, ${alphaBase * 0.85})`); grad.addColorStop(1, 'rgba(6, 28, 24, 0)');
    } else {
      grad.addColorStop(0, `rgba(10, 18, 32, ${alphaBase})`); grad.addColorStop(0.55, `rgba(25, 38, 58, ${alphaBase * 0.75})`); grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();

    if (st.flashAlpha > 0.08 && st.boltPts && st.boltPts.length > 1) {
      ctx.strokeStyle = st.isBarrier ? `rgba(110, 231, 183, ${st.flashAlpha})` : `rgba(254, 240, 138, ${st.flashAlpha})`;
      ctx.shadowColor = st.isBarrier ? '#10b981' : '#fde047'; ctx.shadowBlur = 18; ctx.lineWidth = 3.5;
      ctx.beginPath(); st.boltPts.forEach((pt, idx) => idx === 0 ? ctx.moveTo(pt[0], pt[1]) : ctx.lineTo(pt[0], pt[1])); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
}

function draw() {
  if (!game || !player) return;
  const wb = getActiveWorldBounds();
  const tod = ((game.timeOfDay || 0.35) % 1 + 1) % 1;
  const nightDarkness = Math.max(0, Math.cos(tod * Math.PI * 2));
  ctx.fillStyle = nightDarkness > 0.45 ? '#041626' : '#062b42';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const z = camera.zoom || 1.0;
  const tilt = window.ISO_TILT_Y || 0.62;
  const viewW = canvas.width / z, viewH = canvas.height / (z * tilt);
  const shakeX = camera.shake > 0 ? (Math.random() - 0.5) * camera.shake * 2.3 : 0;
  const shakeY = camera.shake > 0 ? (Math.random() - 0.5) * camera.shake * 2.3 : 0;
  const camLeft = camera.x - viewW / 2, camTop = camera.y - viewH / 2;

  ctx.save();
  ctx.translate(canvas.width / 2 + shakeX, canvas.height / 2 + shakeY);
  ctx.scale(z, z * tilt);
  ctx.translate(-camera.x, -camera.y);

  // Arena-Randmarkierung im kompakten Deathmatch
  if (game.isMultiplayer && game.mpMode === 'deathmatch') {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)'; ctx.lineWidth = 8; ctx.setLineDash([30, 20]);
    ctx.strokeRect(40, 40, wb.w - 80, wb.h - 80); ctx.setLineDash([]);
  }

  drawOceanWavesAndGlint(ctx, camLeft, camTop, viewW, viewH);
  drawOceanCurrentsWorld(ctx, camLeft, camTop, viewW, viewH);

  if (!(game.isMultiplayer && game.mpMode === 'deathmatch')) {
    Object.values(FACTIONS).forEach(fac => {
      ctx.save();
      ctx.strokeStyle = fac.color; ctx.globalAlpha = 0.15; ctx.lineWidth = 10; ctx.setLineDash([40, 28]);
      ctx.beginPath(); ctx.arc(fac.territoryCenter.x, fac.territoryCenter.y, fac.territoryCenter.r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });
  }

  ctx.strokeStyle = 'rgba(200, 240, 255, 0.09)'; ctx.lineWidth = 1.8;
  const wx = Math.cos(wind.angle), wy = Math.sin(wind.angle);
  for (const s of windStreaks) {
    if (s.x > camLeft - 120 && s.x < camLeft + viewW + 120 && s.y > camTop - 120 && s.y < camTop + viewH + 120) {
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + wx * s.len, s.y + wy * s.len); ctx.stroke();
    }
  }

  drawWhirlpools(ctx, camLeft, camTop, viewW, viewH);

  for (const rf of wb.reefs) {
    if (rf.x + 280 < camLeft || rf.x - 280 > camLeft + viewW || rf.y + 280 < camTop || rf.y - 280 > camTop + viewH) continue;
    drawCoralReef(ctx, rf);
  }

  for (const land of wb.lands) {
    if (land.bbox.maxX < camLeft - 260 || land.bbox.minX > camLeft + viewW + 260 ||
        land.bbox.maxY < camTop - 260 || land.bbox.minY > camTop + viewH + 260) continue;
    drawLandmassDetailed(ctx, land);
  }

  drawDiscoveryWondersWorld(ctx, camLeft, camTop, viewW, viewH);
  drawGhostEnclaveWorld(ctx);
  if (window.drawWololoShrineWorld) drawWololoShrineWorld(ctx);
  drawBasePlotsWorld(ctx, camLeft, camTop, viewW, viewH);

  if (!(game.isMultiplayer && game.mpMode === 'deathmatch')) {
    for (const site of EXPLORATION_SITES) {
      if (!site.mapBought || (site.looted && (site.forageLeft || 0) <= 0)) continue;
      ctx.save(); ctx.translate(site.x, site.y);
      ctx.strokeStyle = site.looted ? '#38bdf8' : '#2ecc71';
      ctx.fillStyle = 'rgba(46, 204, 113, 0.14)'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.arc(0, 0, 130, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();

      const siteKey = site.landmark1 === 'obsidian_monolith' ? 'maya_temple' : (site.landmark2 === 'skull_arch' ? 'skull_arch' : 'shipwreck');
      drawWorldSpriteUpright(ctx, siteKey, site.x, site.y, 105, 105, 0.70);

      ctx.save(); ctx.translate(site.x, site.y - 68); ctx.scale(1, 1 / tilt);
      ctx.shadowColor = '#000'; ctx.shadowBlur = 5;
      ctx.fillStyle = '#ffd700'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      if (window.drawCanvasIconLabel) drawCanvasIconLabel(ctx, `🏝️ ${td(site, 'name')}`, 0, 0, 16); else ctx.fillText(`🏝️ ${td(site, 'name')}`, 0, 0);
      ctx.restore();
    }
    for (const fv of FISHING_VILLAGES) drawFishingVillage(fv);
    for (const p of PORTS) { drawDetailedPortTown(p); drawPortLighthouse(ctx, p); }
  } else {
    drawDetailedPortTown(PORTS[0]);
  }

  if (game.customWaypoint && hasNavigatorForWaypoints()) {
    ctx.save(); ctx.translate(game.customWaypoint.x, game.customWaypoint.y);
    ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, 26 + Math.sin(game.time * 0.08) * 6, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#e9d5ff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    drawCanvasIconLabel(ctx, '📍', 0, 5, 16);
    ctx.restore();
  }

  updateAndDrawWrecks(ctx, isSimulationHalted());

  for (const w of wakes) {
    ctx.globalAlpha = (w.life / w.maxLife) * 0.20;
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath(); ctx.arc(w.x, w.y, w.size * (1.4 - (w.life / w.maxLife) * 0.4), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Pulverfässer & Treibgut werden gemeinsam mit den Schiffen Y-sortiert gezeichnet

  const mods = getOfficerModifiers();
  const spyBonus = (window.spyglassState && spyglassState.active) ? 950 : 0;
  const sightRadius = (1180 + spyBonus) * (1 + (mods.sightMult || 0)) * (1 - nightDarkness * 0.25);

  const renderQueue = [
    ...flotsam.map(f => ({ y: f.y - 2, drawFn: () => drawDetailedFlotsam(f) })),
    ...floatingBarrels.map(fb => ({
      y: fb.y - 2,
      drawFn: () => {
        if (!window.drawWorldSpriteUpright || !drawWorldSpriteUpright(ctx, 'powder_barrel', fb.x, fb.y, 42, 42, 0.65)) {
          ctx.save(); ctx.translate(fb.x, fb.y);
          ctx.fillStyle = '#7c2d12'; ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0, 0, fb.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.restore();
        }
      }
    }))
  ];

  for (const m of seaMonsters) {
    if (Math.hypot(m.x - player.x, m.y - player.y) <= sightRadius + 180) {
      renderQueue.push({ y: m.y, drawFn: () => drawSeaMonster(m) });
    }
  }

  for (const s of ships) {
    const distToPlayer = Math.hypot(s.x - player.x, s.y - player.y);
    const litByLighthouse = isNightTime() && PORTS.some(p => p.hasLighthouse && p.lighthouseHp > 0 && Math.hypot(s.x - p.lighthouseX, s.y - p.lighthouseY) < 1200);
    if (distToPlayer > sightRadius + 240 && !litByLighthouse) continue;
    renderQueue.push({
      y: s.y,
      drawFn: () => {
        drawDetailedShip(ctx, s, false, false);
        if (isShipProtectedByBoarding(s)) {
          ctx.save(); ctx.translate(s.x, s.y - s.width * 2.8); ctx.scale(1, 1 / tilt);
          ctx.fillStyle = '#bae6fd'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(t('boardingProtected'), 0, 0); ctx.restore();
        } else if (game.playerFocusTarget === s) {
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)'; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.width * 0.95, 0, Math.PI * 2); ctx.stroke();
        }
      }
    });
  }

  for (const rp of Object.values(window.remotePlayers || {})) {
    if (Math.hypot(rp.x - player.x, rp.y - player.y) > sightRadius + 280) continue;
    renderQueue.push({ y: rp.y, drawFn: () => drawDetailedShip(ctx, rp, false, false) });
  }

  for (const esc of (player.fleet || [])) {
    renderQueue.push({
      y: esc.y,
      drawFn: () => {
        drawDetailedShip(ctx, esc, false, true);
        const ebw = 48, ebx = esc.x - ebw / 2, eby = esc.y - esc.width * 2.7;
        ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(ebx - 1, eby - 1, ebw + 2, 6);
        ctx.fillStyle = '#2ecc71'; ctx.fillRect(ebx, eby, ebw * Math.max(0, esc.hull / esc.maxHull), 4);
      }
    });
  }

  renderQueue.push({
    y: player.y,
    drawFn: () => {
      drawDetailedShip(ctx, player, true, false);
      if (isShipProtectedByBoarding(player)) {
        ctx.save(); ctx.translate(player.x, player.y - player.width * 2.9); ctx.scale(1, 1 / tilt);
        ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(t('boardingProtected'), 0, 0); ctx.restore();
      }
      if (player.modeTransitionTimer > 0) {
        const pct = 1 - (player.modeTransitionTimer / Math.max(1, player.modeTransitionMax));
        const bw = 74;
        ctx.save(); ctx.translate(player.x, player.y - player.width * 3.2); ctx.scale(1, 1 / tilt);
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(-bw / 2, 0, bw, 7);
        ctx.fillStyle = '#f59e0b'; ctx.fillRect(-bw / 2, 0, bw * pct, 7);
        ctx.restore();
      }
    }
  });

  renderQueue.sort((a, b) => a.y - b.y);
  for (const item of renderQueue) item.drawFn();

  for (const b of bullets) drawProjectile(b);

  for (const p of particles) {
    ctx.save();
    if (p.isGlow) ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawProximityShouts(ctx);
  updateAndDrawWorldCombatTexts(ctx, isSimulationHalted());
  drawStormsInWorld(camLeft, camTop, viewW, viewH);

  ctx.restore();

  const isDusk = tod > 0.70 && tod < 0.85, isDawn = tod > 0.18 && tod < 0.30;
  if (isDusk || isDawn) {
    const warmAlpha = isDusk ? Math.sin(((tod - 0.70) / 0.15) * Math.PI) * 0.16 : Math.sin(((tod - 0.18) / 0.12) * Math.PI) * 0.12;
    ctx.fillStyle = isDusk ? `rgba(249, 115, 22, ${warmAlpha})` : `rgba(251, 191, 36, ${warmAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (playerInStormNow) {
    ctx.save();
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.26)'; ctx.lineWidth = 1.2;
    const tRain = (game.time * 22) % canvas.height;
    for (let rx = -100; rx < canvas.width + 100; rx += 55) {
      const ry = (tRain + rx * 1.7) % canvas.height;
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 18, ry + 42); ctx.stroke();
    }
    ctx.restore();
  }

  const screenSightR = Math.min(canvas.width, canvas.height) * (0.50 + (mods.sightMult || 0) * 0.25) * (1 - nightDarkness * 0.26);
  const fowGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, screenSightR * 0.65, canvas.width / 2, canvas.height / 2, screenSightR * 1.38);
  fowGrad.addColorStop(0, `rgba(4, 12, 26, ${nightDarkness * 0.38})`);
  fowGrad.addColorStop(1, `rgba(2, 6, 16, ${0.70 + nightDarkness * 0.24})`);
  ctx.fillStyle = fowGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (window.drawSpyglassOverlay) drawSpyglassOverlay(ctx, canvas, mouse);
  drawCompassAndMinimap(ctx, canvas);
}

window.renderOfficerHudBar = function() {
  if (!game || !player) return;
  const bar = document.getElementById('officerHudBar');
  const cap = game.captain;
  let html = `
    <div class="hud-portrait-card captain" onclick="toggleCaptainModal()">
      ${renderPortraitBox(cap.svg, 44, '#ffd700', cap.isGhostCaptain)}
      <div class="hud-off-info">
        <div class="hud-off-name">${cap.isGhostCaptain ? '👻 ' : ''}${escapeHtml(cap.name)}</div>
        <div class="hud-off-role">Lv.${cap.level} ${(cap.skillPoints > 0 || cap.perkPoints > 0) ? '✨' : ''}</div>
        <div class="mini-morale-bg"><div class="mini-morale-fill" style="width:${Math.min(100, (cap.xp / cap.xpNext) * 100)}%; background:#38bdf8;"></div></div>
      </div>
    </div>
  `;

  for (let i = 0; i < MAX_OFFICERS; i++) {
    const off = player.officers[i];
    if (off) {
      const mColor = off.morale > 65 ? '#2ecc71' : (off.morale > 35 ? '#f1c40f' : '#e74c3c');
      const assignedShip = (player.fleet || []).find(e => e.uid === off.assignedShipUid || e.commanderUid === off.uid);
      const roleObj = OFFICER_ROLES.find(r => r.roleId === off.roleId) || off;
      html += `
        <div class="hud-portrait-card ${assignedShip ? 'assigned-cmd' : ''}">
          ${renderPortraitBox(off.svg, 44, assignedShip ? '#38bdf8' : '#d4af37', off.isGhostOfficer)}
          <div class="hud-off-info">
            <div class="hud-off-name">${assignedShip ? '⛵ ' : (off.isGhostOfficer ? '👻 ' : '')}${escapeHtml(off.name)}</div>
            <div class="hud-off-role">${off.isGhostOfficer ? td(off, 'title') : td(roleObj, 'title')}</div>
            <div class="mini-morale-bg"><div class="mini-morale-fill" style="width:${off.morale}%; background:${mColor};"></div></div>
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="hud-portrait-card" style="opacity:0.45; border-style:dashed; min-width:78px;">
          <div class="portrait-box" style="width:44px;height:33px;aspect-ratio:4/3;font-size:13px;color:#64748b;">⚓</div>
          <div class="hud-off-info"><div class="hud-off-name" style="color:#94a3b8;">#${i + 1}</div></div>
        </div>
      `;
    }
  }
  bar.innerHTML = html;
  bar.classList.toggle('collapsed', !!window.officerHudCollapsed);
  syncFleetOrdersUI();
};

window.rebuildCannonPips = function() {
  if (!player) return;
  const portWrap = document.getElementById('portPips'), stbdWrap = document.getElementById('stbdPips');
  portWrap.innerHTML = ''; stbdWrap.innerHTML = '';
  for (let i = 0; i < player.cannonsPerSide; i++) {
    const p1 = document.createElement('div'); p1.className = 'pip ready'; portWrap.appendChild(p1);
    const p2 = document.createElement('div'); p2.className = 'pip ready'; stbdWrap.appendChild(p2);
  }
};

window.updateLiveHUD = function() {
  const portChildren = document.getElementById('portPips').children;
  const stbdChildren = document.getElementById('stbdPips').children;
  const cStats = getPlayerEquippedCannonStats();
  const portManned = Math.min(player.cannonsPerSide, Math.ceil(cStats.mannedCount / 2));
  const stbdManned = Math.min(player.cannonsPerSide, Math.floor(cStats.mannedCount / 2));
  const portEquipped = Math.min(player.cannonsPerSide, Math.ceil(cStats.equippedCount / 2));
  const stbdEquipped = Math.min(player.cannonsPerSide, Math.floor(cStats.equippedCount / 2));
  const portDmgArr = player.portCannonDamage || [], stbdDmgArr = player.stbdCannonDamage || [];

  for (let i = 0; i < player.cannonsPerSide; i++) {
    if (portChildren[i]) {
      if (i >= portEquipped) portChildren[i].className = 'pip empty-port';
      else if (i >= portManned) portChildren[i].className = 'pip unmanned';
      else if ((portDmgArr[i] || 0) > 0) portChildren[i].className = 'pip damaged';
      else if (!player.combatMode || player.modeTransitionTimer > 0) portChildren[i].className = 'pip stowed';
      else portChildren[i].className = player.portCannons[i] <= 0 ? 'pip ready' : 'pip loading';
    }
    if (stbdChildren[i]) {
      if (i >= stbdEquipped) stbdChildren[i].className = 'pip empty-port';
      else if (i >= stbdManned) stbdChildren[i].className = 'pip unmanned';
      else if ((stbdDmgArr[i] || 0) > 0) stbdChildren[i].className = 'pip damaged';
      else if (!player.combatMode || player.modeTransitionTimer > 0) stbdChildren[i].className = 'pip stowed';
      else stbdChildren[i].className = player.stbdCannons[i] <= 0 ? 'pip ready' : 'pip loading';
    }
  }

  const stageNames = ['Geankert', 'Viertel', 'Halbe Fahrt', 'Vollzeug'];
  document.getElementById('sailStageText').textContent = stageNames[player.sailSetting];
  document.getElementById('knotsText').textContent = `${(player.speed * 4.8).toFixed(1)} kn`;
  document.getElementById('clockText').textContent = `${isNightTime() ? '🌙' : '☀️'} ${formatClockFromTimeOfDay(game.timeOfDay)}`;

  const curVec = getOceanCurrentVectorAt(player.x, player.y);
  let region = curVec.active ? '🌊 Strömung' : 'Offene See';
  Object.values(FACTIONS).forEach(fac => {
    if (Math.hypot(player.x - fac.territoryCenter.x, player.y - fac.territoryCenter.y) < fac.territoryCenter.r) region = td(fac, 'short');
  });
  document.getElementById('regionText').textContent = region;

  const firePill = document.getElementById('firePill');
  if (player.ghostFire > 0) { firePill.style.display = 'inline-block'; firePill.textContent = t('ghostFireWarn'); firePill.classList.add('warn'); }
  else if (player.onFire > 0) { firePill.style.display = 'inline-block'; firePill.textContent = '🔥 [X]!'; firePill.classList.add('warn'); }
  else firePill.style.display = 'none';

  const btn4 = document.getElementById('skillBtn4'), sub4 = document.getElementById('skillSub4');
  if (!hasOfficerRole('gunner')) { btn4.disabled = true; sub4.textContent = '🔒'; }
  else if (player.skillCooldowns.salvo > 0) { btn4.disabled = true; sub4.textContent = `${Math.ceil(player.skillCooldowns.salvo / 60)}s`; }
  else { btn4.disabled = false; sub4.textContent = '✓'; }

  const btn5 = document.getElementById('skillBtn5'), sub5 = document.getElementById('skillSub5');
  const canRep = (player.hull < player.maxHull && (player.cargo.timber || 0) >= 1) || (player.sail < player.maxSail && (player.cargo.canvas || 0) >= 1);
  if (!hasOfficerRole('carpenter') && !hasOfficerRole('shipwright')) { btn5.disabled = true; sub5.textContent = '🔒'; }
  else if (player.skillCooldowns.repair > 0) { btn5.disabled = true; sub5.textContent = `${Math.ceil(player.skillCooldowns.repair / 60)}s`; }
  else if (!canRep) { btn5.disabled = true; sub5.textContent = '100%'; }
  else { btn5.disabled = false; sub5.textContent = '🪵/⛵ ✓'; }

  const eqBtn = document.getElementById('equipBtnR'), eqTitle = document.getElementById('equipTitleR'), eqSub = document.getElementById('equipSubR');
  if (eqBtn && eqTitle && eqSub) {
    if (!player.specialEquipment) { eqBtn.disabled = true; eqTitle.textContent = '⚙️ [R]'; eqSub.textContent = '—'; }
    else {
      const eqObj = SPECIAL_SHIP_EQUIPMENT.find(e => e.id === player.specialEquipment);
      eqTitle.textContent = `[R] ${eqObj ? td(eqObj, 'name').slice(0, 12) : 'Equip'}`;
      if (player.specialEquipCooldown > 0) { eqBtn.disabled = true; eqSub.textContent = `${Math.ceil(player.specialEquipCooldown / 60)}s`; }
      else { eqBtn.disabled = false; eqSub.textContent = '✓'; }
    }
  }
};

window.updateHUD = function() {
  if (!game || !player) return;
  recalcPlayerDerivedStats();

  const muteBtn = document.getElementById('muteBtnHud');
  if (muteBtn) muteBtn.textContent = SoundFX.muted ? '🔇' : '🔊';

  document.getElementById('hullBar').style.width = Math.max(0, (player.hull / player.maxHull) * 100) + '%';
  document.getElementById('hullText').textContent = `${Math.ceil(player.hull)}/${player.maxHull}`;
  const sailPct = Math.round((player.sail / player.maxSail) * 100);
  document.getElementById('sailBar').style.width = Math.max(0, sailPct) + '%';
  document.getElementById('sailText').textContent = `${sailPct}%`;
  document.getElementById('crewBar').style.width = Math.max(0, (player.crew / player.maxCrew) * 100) + '%';
  document.getElementById('crewText').textContent = `${Math.ceil(player.crew)}/${player.maxCrew}`;
  const moralePct = Math.round(player.morale);
  document.getElementById('moraleBar').style.width = Math.max(0, moralePct) + '%';
  document.getElementById('moraleText').textContent = `${moralePct}%`;

  const foodVal = Math.floor(player.cargo.food || 0);
  const rumVal = Math.floor(player.cargo.rum || 0);
  const medVal = Math.floor(player.cargo.medicine || 0);
  const timberVal = Math.floor(player.cargo.timber || 0);
  const canvasVal = Math.floor(player.cargo.canvas || 0);
  const woundedVal = Math.floor(player.woundedCrew || 0);
  const cStats = getPlayerEquippedCannonStats();

  document.getElementById('foodText').textContent = foodVal;
  document.getElementById('rumText').textContent = rumVal;
  document.getElementById('medText').textContent = medVal;
  const timberEl = document.getElementById('timberText'); if (timberEl) timberEl.textContent = timberVal;
  const canvasEl = document.getElementById('canvasText'); if (canvasEl) canvasEl.textContent = canvasVal;

  document.getElementById('foodPill').classList.toggle('warn', foodVal <= 2);
  document.getElementById('rumPill').classList.toggle('warn', rumVal <= 2);

  const cPill = document.getElementById('cannonSupplyPill'), cText = document.getElementById('cannonSupplyText');
  if (cPill && cText) {
    cText.textContent = `${cStats.mannedCount}/${cStats.totalSlots}`;
    cPill.classList.toggle('warn', cStats.mannedCount < cStats.equippedCount || cStats.equippedCount < cStats.totalSlots);
  }

  const wPill = document.getElementById('woundedPill');
  if (wPill) {
    if (woundedVal > 0) { wPill.style.display = 'inline-block'; wPill.classList.add('warn'); document.getElementById('woundedText').textContent = woundedVal; }
    else wPill.style.display = 'none';
  }
  const disPill = document.getElementById('diseasePill');
  if (disPill) {
    if (player.disease) { disPill.style.display = 'inline-block'; disPill.classList.add('warn'); document.getElementById('diseaseText').textContent = td(DISEASES[player.disease], 'name'); }
    else disPill.style.display = 'none';
  }

  const mods = getOfficerModifiers();
  const foodNeed = Math.max(0.10, Math.max(0.25, player.crew / 68) * 0.42 * Math.max(0.3, 1.0 + (mods.foodConsumptionMult || 0)));
  document.getElementById('supplyDaysText').textContent = `~${Math.floor((player.cargo.food || 0) / foodNeed)}T`;

  document.getElementById('goldText').textContent = game.gold;
  document.getElementById('cargoText').textContent = `${Math.ceil(getCargoTotal())}/${getMaxCargo()}`;
  document.getElementById('fleetCountText').textContent = `${1 + (player.fleet || []).length}/3`;

  const repHudEl = document.getElementById('repPersonalHud');
  if (repHudEl) {
    const rTier = getPlayerReputationTier(game.reputation || 0);
    repHudEl.innerHTML = `<span style="color:${rTier.color};">☠️ ${game.reputation || 0}</span>`;
    repHudEl.title = rTier.label;
  }

  const ptsAvail = (game.captain.skillPoints || 0) + (game.captain.perkPoints || 0);
  document.getElementById('capBtnHud').textContent = `⚓ Lv.${game.captain.level} ${ptsAvail > 0 ? '(+' + ptsAvail + ')' : '(K)'}`;

  const repEl = document.getElementById('repList');
  repEl.innerHTML = '';
  Object.values(FACTIONS).forEach(fac => {
    const val = game.rep[fac.id] || 0;
    const isSworn = game.allegiance === fac.id;
    const statusColor = val < -20 ? '#ff7675' : (val > 25 ? '#2ecc71' : '#cbd5e1');
    const div = document.createElement('div');
    div.className = 'rep-item';
    div.innerHTML = `<span style="color:${fac.color};">${isSworn ? '👑' : ''}${td(fac, 'short')}:</span> <span style="color:${statusColor};">${val > 0 ? '+' + val : val}</span>`;
    repEl.appendChild(div);
  });

  const msEl = document.getElementById('activeMissionHud');
  const wages = getDailyWageBreakdown();
  if (game.activePassenger) {
    msEl.innerHTML = `🎩 ${escapeHtml(game.activePassenger.name)} ➔ ${game.activePassenger.destPortName}`;
  } else if (game.activeMission) {
    msEl.innerHTML = `${escapeHtml(game.activeMission.title)} <span style="color:#94a3b8;">(${game.activeMission.rewardGold}🪙)</span>`;
  } else {
    msEl.textContent = `${game.isMultiplayer ? '🌐 MP' : (game.allegiance ? '👑 ' + td(FACTIONS[game.allegiance], 'short') : '📜 1714')} | 💰-${wages.total}/T`;
  }
  syncFleetOrdersUI();
};

window.toggleWorldMap = function() {
  const overlay = document.getElementById('mapOverlay');
  overlay.classList.toggle('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
  if (overlay.classList.contains('active')) renderBigMap();
};

let lastLoopTimestamp = performance.now();
let timeAccumulator = 0;
const FIXED_STEP_MS = 1000 / 60;

function loop(now) {
  const elapsedMs = Math.min(100, Math.max(0, now - lastLoopTimestamp));
  lastLoopTimestamp = now;

  if (game && !isSimulationHalted()) {
    timeAccumulator += elapsedMs;
    let maxSubSteps = 4;
    while (timeAccumulator >= FIXED_STEP_MS && maxSubSteps > 0) {
      stepFixedSimulation();
      timeAccumulator -= FIXED_STEP_MS;
      maxSubSteps--;
    }
  } else {
    timeAccumulator = 0;
    // WICHTIG: Auch wenn das Kolonie-Menü im Singleplayer das Meer pausiert, läuft der Bau-Timer live weiter!
    if (game && !game.isGameOver && document.getElementById('hideoutOverlay').classList.contains('active') && window.updateHideoutConstruction) {
      updateHideoutConstruction(elapsedMs / 1000);
    }
  }

  if (window.AmbientSeaAudio && game && player) {
    AmbientSeaAudio.update(
      elapsedMs / FIXED_STEP_MS,
      !document.getElementById('mainMenuOverlay').classList.contains('hidden'),
      player.speed || 0,
      player.sailSetting || 0,
      wind ? wind.speed : 1,
      playerInStormNow,
      window.playerWhirlpoolProximity || 0
    );
  }

  draw();
  requestAnimationFrame(loop);
}

initNewGameFromCreation(creationState, false, null);
openMainMenu();
requestAnimationFrame(loop);