// ============================================================================
// spyglass_chat.js - 1. Fernglas-Aufklärung [Z] (Schiffe & Entdecker-Naturwunder!)
//                    2. Proximity-Sprachrohr-Chat [Enter]
//                    3. Ablehnbare Kontaktanfragen [U] + Silberflotten-Hinweise
//                    4. Optionaler WebRTC-Proximity-Voice-Hook (Mikrofon)
// ============================================================================

window.spyglassState = {
  active: false,
  targetShip: null,
  targetWonder: null,
  scanProgress: 0,
  identifiedShips: new WeakMap(),
  lookOffsetX: 0,
  lookOffsetY: 0
};

window.proximityShouts = [];
window.pendingHailRequest = null;
window.incomingHailRequest = null;

window.toggleSpyglass = function(forceState = null) {
  if (!window.game || !window.player) return;
  const next = forceState !== null ? forceState : !spyglassState.active;
  spyglassState.active = next;
  spyglassState.scanProgress = 0;
  spyglassState.targetShip = null;
  spyglassState.targetWonder = null;
  if (next) SoundFX.play('spyglass');
  const btn = document.getElementById('spyglassBtn');
  if (btn) btn.classList.toggle('active', next);
};

window.isShipIdentifiedByPlayer = function(ship) {
  if (!ship) return false;
  const rec = spyglassState.identifiedShips.get(ship);
  return !!(rec && ((game.time || 0) - rec.time) < 7200);
};

window.getIdentifiedShipInfo = function(ship) {
  return spyglassState.identifiedShips.get(ship) || null;
};

window.updateSpyglassSimulation = function(canvas, mouse) {
  if (!spyglassState.active || !window.game || !window.player) {
    spyglassState.lookOffsetX *= 0.82;
    spyglassState.lookOffsetY *= 0.82;
    return;
  }

  const dxScreen = (mouse.x - canvas.width / 2);
  const dyScreen = (mouse.y - canvas.height / 2);
  const maxPan = 680;
  spyglassState.lookOffsetX += (Math.max(-maxPan, Math.min(maxPan, dxScreen * 1.35)) - spyglassState.lookOffsetX) * 0.12;
  spyglassState.lookOffsetY += (Math.max(-maxPan, Math.min(maxPan, dyScreen * 1.35)) - spyglassState.lookOffsetY) * 0.12;

  const z = camera.zoom || 1.0;
  const tilt = window.ISO_TILT_Y || 0.62;
  const worldMouseX = camera.x + (mouse.x - canvas.width / 2) / z;
  const worldMouseY = camera.y + (mouse.y - canvas.height / 2) / (z * tilt);

  const mods = getOfficerModifiers();
  const relicBonus = window.getCaptainDuelStats ? (getCaptainDuelStats().spyBonus || 0) : 0;
  const maxSpyRange = 2350 * (1 + (mods.sightMult || 0) * 0.5 + relicBonus * 0.4);
  const scanSpeed = (1 / 34) * (1 + (mods.spyglassSpeed || 0) + relicBonus);

  // A. Prüfen, ob ein unentdecktes Naturwunder der Entdecker-Gilde im Fokus liegt!
  let bestWonder = null;
  if (typeof DISCOVERY_WONDERS !== 'undefined' && !(game.isMultiplayer && game.mpMode === 'deathmatch')) {
    ensureShipAndCaptainInventory();
    for (const dw of DISCOVERY_WONDERS) {
      if (Math.hypot(dw.x - player.x, dw.y - player.y) <= maxSpyRange &&
          Math.hypot(dw.x - worldMouseX, dw.y - worldMouseY) < 125) {
        bestWonder = dw;
        break;
      }
    }
  }

  if (bestWonder) {
    spyglassState.targetShip = null;
    if (spyglassState.targetWonder !== bestWonder) {
      spyglassState.targetWonder = bestWonder;
      spyglassState.scanProgress = game.discoveries.found[bestWonder.id] ? 1.0 : 0.0;
    } else {
      spyglassState.scanProgress = Math.min(1.0, spyglassState.scanProgress + scanSpeed);
      if (spyglassState.scanProgress >= 1.0 && !game.discoveries.found[bestWonder.id]) {
        game.discoveries.found[bestWonder.id] = true;
        SoundFX.play('coin');
        grantCaptainXP(40, `🧭 ENTDECKT: ${tr(bestWonder.name_de, bestWonder.name_en)}! Reiche den Bericht im Hafen bei der Gilde ein (+${bestWonder.reward} 🪙)!`);
      }
    }
    return;
  }
  spyglassState.targetWonder = null;

  // B. Schiffe im Fernglas scannen
  let bestShip = null, bestCursorDist = 135;
  const candidates = [...(window.ships || []), ...Object.values(window.remotePlayers || {})];
  for (const s of candidates) {
    if (!s || s === player) continue;
    if (Math.hypot(s.x - player.x, s.y - player.y) > maxSpyRange) continue;
    const dCursor = Math.hypot(s.x - worldMouseX, s.y - worldMouseY);
    if (dCursor < bestCursorDist) { bestCursorDist = dCursor; bestShip = s; }
  }

  if (bestShip) {
    if (spyglassState.targetShip !== bestShip) {
      spyglassState.targetShip = bestShip;
      spyglassState.scanProgress = isShipIdentifiedByPlayer(bestShip) ? 1.0 : 0.0;
    } else {
      spyglassState.scanProgress = Math.min(1.0, spyglassState.scanProgress + scanSpeed);
      if (spyglassState.scanProgress >= 1.0 && !isShipIdentifiedByPlayer(bestShip)) {
        const shownFac = bestShip.falseFlag || bestShip.faction || 'pirates';
        const tpl = SHIP_CLASSES[bestShip.clsKey] || SHIP_CLASSES.sloop;
        spyglassState.identifiedShips.set(bestShip, {
          time: game.time || 0,
          shownFaction: shownFac,
          className: td(tpl, 'name'),
          totalCannons: (bestShip.cannonsPerSide || 3) * 2,
          displayName: bestShip.captainName || bestShip.name || td(tpl, 'name')
        });
        SoundFX.play('card');
      }
    }
  } else {
    spyglassState.targetShip = null;
    spyglassState.scanProgress = Math.max(0, spyglassState.scanProgress - 0.05);
  }
};

window.drawSpyglassOverlay = function(ctx, canvas, mouse) {
  if (!spyglassState.active) return;
  const mx = mouse.x, my = mouse.y;
  const lensR = Math.min(canvas.width, canvas.height) * 0.28;

  ctx.save();
  ctx.fillStyle = 'rgba(2, 6, 14, 0.76)';
  ctx.beginPath(); ctx.rect(0, 0, canvas.width, canvas.height); ctx.arc(mx, my, lensR, 0, Math.PI * 2, true); ctx.fill();

  ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(mx, my, lensR, 0, Math.PI * 2); ctx.stroke();

  ctx.strokeStyle = 'rgba(248, 250, 252, 0.38)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mx - lensR + 18, my); ctx.lineTo(mx - 16, my);
  ctx.moveTo(mx + 16, my); ctx.lineTo(mx + lensR - 18, my);
  ctx.moveTo(mx, my - lensR + 18); ctx.lineTo(mx, my - 16);
  ctx.moveTo(mx, my + 16); ctx.lineTo(mx, my + lensR - 18);
  ctx.stroke();

  const wnd = spyglassState.targetWonder;
  const tgt = spyglassState.targetShip;

  if (wnd) {
    const prog = spyglassState.scanProgress;
    ctx.strokeStyle = prog >= 1 ? '#2ecc71' : '#fde047'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(mx, my, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog); ctx.stroke();

    const boxW = 300, boxH = 68;
    const bx = Math.min(canvas.width - boxW - 16, Math.max(16, mx - boxW / 2));
    const by = my + lensR * 0.52;
    ctx.fillStyle = 'rgba(8, 18, 22, 0.94)'; ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(bx, by, boxW, boxH, 7); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047'; ctx.font = 'bold 13px sans-serif';
    drawCanvasIconLabel(ctx, prog < 1 ? `🧭 Zeichne Entdeckung... ${Math.round(prog * 100)}%` : `${wnd.icon} ${tr(wnd.name_de, wnd.name_en)}`, bx + boxW / 2, by + 26, 15, boxW - 16);
    if (prog >= 1) {
      ctx.fillStyle = '#a7f3d0'; ctx.font = '12px sans-serif';
      drawCanvasIconLabel(ctx, `Gilden-Prämie im Hafen: +${wnd.reward} 🪙`, bx + boxW / 2, by + 48, 14);
    }
  } else if (tgt) {
    const prog = spyglassState.scanProgress;
    ctx.strokeStyle = prog >= 1 ? '#2ecc71' : '#fde047'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(mx, my, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog); ctx.stroke();

    const boxW = 290, boxH = prog >= 1 ? 100 : 42;
    const bx = Math.min(canvas.width - boxW - 16, Math.max(16, mx - boxW / 2));
    const by = my + lensR * 0.52;
    ctx.fillStyle = 'rgba(8, 15, 25, 0.92)'; ctx.strokeStyle = prog >= 1 ? '#d4af37' : '#38bdf8'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.roundRect(bx, by, boxW, boxH, 7); ctx.fill(); ctx.stroke();

    ctx.textAlign = 'center';
    if (prog < 1) {
      ctx.fillStyle = '#fde047'; ctx.font = 'bold 13px sans-serif';
      drawCanvasIconLabel(ctx, `🔭 Fokussiere... ${Math.round(prog * 100)}%`, bx + boxW / 2, by + 26, 15);
    } else {
      const info = getIdentifiedShipInfo(tgt);
      const fac = FACTIONS[info.shownFaction] || FACTIONS.pirates;
      const distSm = Math.round(Math.hypot(tgt.x - player.x, tgt.y - player.y) / 10);
      const hullState = tgt.hull > tgt.maxHull * 0.75 ? 'Intakt' : (tgt.hull > tgt.maxHull * 0.40 ? 'Beschädigt' : 'Schwer getroffen!');

      ctx.fillStyle = '#ffd700'; ctx.font = 'bold 13.5px sans-serif';
      ctx.fillText(info.displayName, bx + boxW / 2, by + 22, boxW - 16);
      ctx.fillStyle = fac.color; ctx.font = 'bold 12px sans-serif';
      drawCanvasIconLabel(ctx, `🚩 ${td(fac, 'name')} • ${info.className}`, bx + boxW / 2, by + 44, 14, boxW - 16);
      ctx.fillStyle = '#e2e8f0'; ctx.font = '12px sans-serif';
      drawCanvasIconLabel(ctx, `💣 ${info.totalCannons} Kanonen | 🛡️ ${hullState} | 📏 ${distSm} sm`, bx + boxW / 2, by + 66, 13, boxW - 16);
      ctx.fillStyle = tgt.combatMode ? '#fca5a5' : '#a7f3d0'; ctx.font = 'bold 11px sans-serif';
      drawCanvasIconLabel(ctx, tgt.combatMode ? '⚔️ Stückpforten offen!' : '🧭 Reisefahrt', bx + boxW / 2, by + 86, 13);
    }
  }
  ctx.restore();
};

window.pushProximityShoutBubble = function(shipRef, x, y, senderName, rawText, color = '#ffd700') {
  const clean = String(rawText || '').replace(/[<>]/g, '').trim().slice(0, 90);
  if (!clean) return;
  window.proximityShouts.push({ shipRef, x, y, senderName, text: `${senderName}: „${clean}“`, color, life: 320 });
  if (window.proximityShouts.length > 18) window.proximityShouts.shift();
};

window.sendProximityShout = function() {
  const input = document.getElementById('proximityShoutInput');
  if (!input || !window.player || !window.game) return;
  const msg = input.value.replace(/[<>]/g, '').trim().slice(0, 90);
  input.value = ''; input.blur();
  if (!msg) return;

  SoundFX.play('horn');
  const capName = (game.captain && game.captain.name) ? game.captain.name : 'Kapitän';
  pushProximityShoutBubble(player, player.x, player.y, capName, msg, '#ffd700');

  if (window.NetClient && NetClient.isConnected()) {
    NetClient.sendProximityShout(msg);
  } else {
    const nearAi = (window.ships || []).find(s => !s.isGhost && Math.hypot(s.x - player.x, s.y - player.y) < 550);
    if (nearAi && Math.random() < 0.65) {
      const hostile = areShipsHostile(nearAi, player);
      setTimeout(() => {
        if (!window.ships.includes(nearAi)) return;
        const reply = hostile ? 'Spart Euch den Atem – unsere Kanonen antworten!' : 'Ahoi drüben! Gute Winde und sichere Fahrt!';
        pushProximityShoutBubble(nearAi, nearAi.x, nearAi.y, nearAi.captainName || nearAi.name, reply, hostile ? '#ef4444' : '#38bdf8');
      }, 950);
    }
  }
};

window.requestCaptainHail = function() {
  if (!window.currentTalkTarget || !window.game) return;
  const target = currentTalkTarget;
  SoundFX.play('horn');

  if (target.isRemotePlayer && window.NetClient && NetClient.isConnected()) {
    window.pendingHailRequest = { target, timer: 600 };
    logEvent(t('hailRequestSent'));
    NetClient.sendHailRequest(target.sessionId);
    return;
  }

  const rel = window.getCaptainRelationshipScore ? getCaptainRelationshipScore(target) : 0;
  const badRep = (game.reputation || 0) <= -55 && target.faction !== 'pirates';
  if (rel <= -20 || badRep || target.provokedByPlayer) {
    SoundFX.play('hit');
    pushProximityShoutBubble(target, target.x, target.y, target.captainName || target.name, 'Wir verhandeln nicht mit Euresgleichen! Haltet Abstand!', '#ef4444');
    logEvent(t('hailRequestDeclined'));
    return;
  }
  openCaptainTalkModal();
};

window.receiveIncomingHailRequest = function(fromSessionId, fromName) {
  SoundFX.play('horn');
  window.incomingHailRequest = { fromSessionId, fromName, timer: 720 };
  renderIncomingHailBanner();
};

window.respondToIncomingHail = function(accepted) {
  const req = window.incomingHailRequest;
  window.incomingHailRequest = null;
  renderIncomingHailBanner();
  if (req && window.NetClient && NetClient.isConnected()) NetClient.respondHailRequest(req.fromSessionId, accepted);
};

window.renderIncomingHailBanner = function() {
  const el = document.getElementById('hailRequestBanner');
  if (!el) return;
  if (!window.incomingHailRequest) { el.classList.remove('visible'); return; }
  el.innerHTML = `
    <span>${t('hailIncomingTitle')} <strong style="color:#ffd700;">${escapeHtml(window.incomingHailRequest.fromName)}</strong></span>
    <div style="display:inline-flex; gap:6px; margin-left:10px;">
      <button class="sm-btn" style="border-color:#2ecc71; color:#a7f3d0;" onclick="respondToIncomingHail(true)">${t('acceptBtn')}</button>
      <button class="sm-btn" style="border-color:#ef4444; color:#fecaca;" onclick="respondToIncomingHail(false)">${t('declineBtn')}</button>
    </div>
  `;
  el.classList.add('visible');
};

window.VoiceChatManager = {
  enabled: false, localStream: null, peers: {},
  async toggleMic() {
    if (this.enabled) { this.disableMic(); return false; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.enabled = true; this.syncMicHudButton();
      return true;
    } catch (err) { this.enabled = false; this.syncMicHudButton(); return false; }
  },
  disableMic() {
    if (this.localStream) { this.localStream.getTracks().forEach(tTrack => tTrack.stop()); this.localStream = null; }
    this.enabled = false; this.syncMicHudButton();
  },
  syncMicHudButton() {
    const btn = document.getElementById('micToggleBtn');
    if (btn) { btn.textContent = this.enabled ? t('micBtnOn') : t('micBtnOff'); btn.classList.toggle('active', this.enabled); }
  }
};