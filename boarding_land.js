// ============================================================================
// boarding_land.js - 1. Echtes Stein-Schere-Papier-Kapitänsduell (Pirates!-Stil)
//                       inkl. Kapitäns-Inventar-Werten (Klinge/Pistole/Rüstung)
//                    2. Lösegeld aus dem Schatzgewölbe vs. echtes GAME OVER!
//                    3. Beiboot-Landgang überall an Küsten & Nacht-Einschleichen
//                       in feindliche Häfen [Taste G]
// ============================================================================

let boardingState = null;
let currentBoardTarget = null;
let currentExploreSite = null;
let currentSiegePort = null;
let nearHideout = false;
window.nearAnyCoastForRowboat = null;
window.nearHostilePortForSneak = null;
let escortUidCounter = 1;
let boardingAnimFrameId = null;

function createEmptyPrisonersMap() {
  return { england: 0, spain: 0, france: 0, netherlands: 0, denmark: 0, pirates: 0 };
}

window.setBoardingSanctuaryLock = function(enemyShip, active) {
  if (window.player) {
    player.inBoardingLock = !!active;
    if (!active) player.boardingInvulnTimer = 300;
  }
  if (enemyShip && (window.ships || []).includes(enemyShip)) {
    enemyShip.inBoardingLock = !!active;
    if (!active) enemyShip.boardingInvulnTimer = 300;
  }
  if (window.NetClient && NetClient.isConnected()) {
    NetClient.sendBoardingState(!!active, enemyShip && enemyShip.sessionId ? enemyShip.sessionId : null);
  }
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
};

window.getFreePrizeOfficers = function() {
  if (!player || !player.officers) return [];
  return player.officers.filter(o => o.roleId === 'prize_officer' && !o.assignedShipUid);
};

window.getEffectiveHealthyCrew = function() {
  const total = Math.max(1, Math.ceil(player.crew));
  const wounded = Math.min(total - 1, Math.floor(player.woundedCrew || 0));
  return Math.max(1, total - wounded);
};

window.getCrewCombatStats = function() {
  if (window.clampCrewEquipmentToCrewSize) clampCrewEquipmentToCrewSize();
  const healthyCrew = getEffectiveHealthyCrew();
  const arm = player.armory || {};
  const mods = getOfficerModifiers();

  const cuirassUsed = Math.min(healthyCrew, arm.cuirass || 0);
  const leatherUsed = Math.min(healthyCrew - cuirassUsed, arm.leather || 0);
  const armorBonus = ((cuirassUsed * 0.45) + (leatherUsed * 0.20)) / healthyCrew;

  const rapierUsed = Math.min(healthyCrew, arm.rapier || 0);
  const cutlassUsed = Math.min(healthyCrew - rapierUsed, arm.cutlass || 0);
  const meleeBonus = (((rapierUsed * 0.50) + (cutlassUsed * 0.25)) / healthyCrew) + (mods.boardingMeleeBonus || 0);

  const musketUsed = Math.min(healthyCrew, arm.musket || 0);
  const pistolUsed = Math.min(healthyCrew - musketUsed, arm.pistol || 0);
  const rangedBonus = (((musketUsed * 0.55) + (pistolUsed * 0.25)) / healthyCrew) + (mods.boardingRangedBonus || 0);

  const diseasePenalty = player.disease === 'flux' ? 0.75 : 1.0;
  return {
    healthyCrew,
    armorBonus: armorBonus * diseasePenalty,
    meleeBonus: meleeBonus * diseasePenalty,
    rangedBonus: rangedBonus * diseasePenalty
  };
};

// ============================================================================
// LÖSEGELD AUS DEM SCHATZGEWÖLBE ODER ECHTES GAME OVER!
// ============================================================================
window.RANSOM_MIN_COST = 450;

window.handlePlayerDefeatOrRansom = function(reasonTitle = 'Dein Schiff wurde versenkt!') {
  // Im Arena-Multiplayer sauberer Respawn im Wasser vor dem Safe-Zone-Hafen
  if (game.isMultiplayer && (game.mpMode === 'deathmatch' || game.mpMode === 'league_pvp')) {
    const nassau = PORTS[0];
    const sAng = nassau.seaAngle !== undefined ? nassau.seaAngle : Math.PI / 2;
    player.x = nassau.x + Math.cos(sAng) * 380;
    player.y = nassau.y + Math.sin(sAng) * 380;
    player.angle = sAng;
    player.speed = 0;
    player.angularVel = 0;
    player.hull = player.maxHull;
    player.sail = player.maxSail;
    player.crew = player.maxCrew;
    player.woundedCrew = 0;
    player.onFire = 0;
    player.ghostFire = 0;
    player.disease = null;
    player.inBoardingLock = false;
    player.boardingInvulnTimer = 240;
    updateHUD();
    return;
  }

  ensureHideoutStructure();
  const vaultGold = (game.hideout && game.hideout.foundedPlotId) ? (game.hideout.bankGold || 0) : 0;
  const ransomNeeded = Math.max(RANSOM_MIN_COST, (game.captain.level || 1) * 180);

  if (vaultGold >= ransomNeeded) {
    // GERETTET DURCH SCHATZGEWÖLBE-LÖSEGELD!
    game.hideout.bankGold -= ransomNeeded;
    spawnSinkingWreck(player);
    resetPlayerShipUpgradesOnDestruction();

    const homePlot = BASE_PLOTS.find(b => b.id === game.hideout.foundedPlotId) || PORTS[0];
    const sAng = homePlot.seaAngle !== undefined ? homePlot.seaAngle : Math.PI / 2;
    player.x = homePlot.x + Math.cos(sAng) * 260;
    player.y = homePlot.y + Math.sin(sAng) * 260;
    player.hull = Math.floor(player.maxHull * 0.75);
    player.sail = Math.floor(player.maxSail * 0.85);
    player.crew = Math.max(16, Math.floor(player.maxCrew * 0.55));
    player.woundedCrew = 0; player.onFire = 0; player.ghostFire = 0;
    player.inBoardingLock = false;
    player.cargo.food = Math.max(player.cargo.food || 0, 6);
    player.cargo.rum = Math.max(player.cargo.rum || 0, 4);
    game.activePassenger = null;

    logEvent(`⛓️ AUSGELÖST! Deine Verwalter zahlten ${ransomNeeded} 🪙 Lösegeld aus deinem Schatzgewölbe (Rest im Gewölbe: ${game.hideout.bankGold} 🪙)!`);
    updateHUD();
  } else {
    // KEIN AUSREICHENDES GOLD IM SCHATZGEWÖLBE -> ECHTES GAME OVER!
    game.isGameOver = true;
    game.paused = true;
    const ov = document.getElementById('gameOverOverlay');
    const body = document.getElementById('gameOverBody');
    if (ov && body) {
      body.innerHTML = `
        <div style="text-align:center; padding:18px;">
          <div style="font-size:48px; margin-bottom:10px;">☠️</div>
          <h2 style="color:#ef4444; font-size:24px; margin-bottom:8px;">${escapeHtml(reasonTitle)}</h2>
          <p style="color:#e2e8f0; font-size:14px; line-height:1.6; max-width:560px; margin:0 auto 16px;">
            Um dich aus der Gefangenschaft bzw. nach dem Untergang auszulösen, wären <strong style="color:#ffd700;">${ransomNeeded} 🪙</strong> im Schatzgewölbe deiner Kolonie nötig gewesen (Vorhanden: <strong>${vaultGold} 🪙</strong>).<br>
            Damit endet die Legende von <strong>${escapeHtml(game.captain.name)}</strong> in den Fluten der Karibik!
          </p>
          <div class="card-box" style="max-width:440px; margin:0 auto 18px; background:#091119;">
            <div>🎖️ Erreichte Stufe: <strong>Lv.${game.captain.level}</strong> &nbsp;|&nbsp; ☠️ Ruf: <strong>${game.reputation || 0}</strong></div>
            <div style="margin-top:4px;">🧭 Entdeckte Naturwunder: <strong>${Object.keys((game.discoveries && game.discoveries.found) || {}).length}</strong></div>
          </div>
          <button class="primary-btn" onclick="document.getElementById('gameOverOverlay').classList.remove('active'); game.isGameOver=false; openMainMenu();">
            ⚓ Zurück ins Hauptmenü
          </button>
        </div>
      `;
      ov.classList.add('active');
    } else {
      openMainMenu();
    }
  }
};

// ============================================================================
// ANIMATIONS-ENGINE FÜR ENTER- & DUELL-SZENE
// ============================================================================
function startBoardingAnimationLoop() {
  if (boardingAnimFrameId) cancelAnimationFrame(boardingAnimFrameId);
  function step() {
    const overlay = document.getElementById('boardingOverlay');
    if (!overlay || !overlay.classList.contains('active') || !boardingState) {
      boardingAnimFrameId = null;
      return;
    }
    drawBoardingAnimationFrame();
    boardingAnimFrameId = requestAnimationFrame(step);
  }
  boardingAnimFrameId = requestAnimationFrame(step);
}

function pushBoardingFloatingText(txt, x, y, color) {
  if (!boardingState) return;
  boardingState.floatingTexts = boardingState.floatingTexts || [];
  boardingState.floatingTexts.push({ txt, x, y, vy: -0.85, life: 52, maxLife: 52, color: color || '#fde047' });
}

function triggerBoardingVisualAction(actionType, pKills = 0, ownLoss = 0) {
  if (!boardingState) return;
  boardingState.animAction = actionType;
  boardingState.animTimer = 42;
  boardingState.sparks = boardingState.sparks || [];
  boardingState.slashes = boardingState.slashes || [];
  boardingState.screenShake = 5;

  const cx = boardingState.duelBalanceX || 460;
  const col = actionType === 'ranged' ? '#fde047' : (actionType === 'duel' ? '#38bdf8' : '#fb923c');
  for (let s = 0; s < 3; s++) {
    boardingState.slashes.push({ x: cx + (s - 1) * 14, y: 130 + (Math.random() - 0.5) * 12, r: 24 + s * 6, startAng: -1.1 + s * 0.35, endAng: 1.0 + s * 0.25, life: 16 + s * 4, maxLife: 20, color: col });
  }
  for (let i = 0; i < 20; i++) {
    boardingState.sparks.push({ x: cx + (Math.random() - 0.5) * 34, y: 126 + (Math.random() - 0.5) * 28, vx: (Math.random() - 0.5) * 7, vy: (Math.random() - 0.75) * 6, life: 22 + Math.random() * 14, color: col });
  }
  if (pKills > 0) pushBoardingFloatingText(`-${pKills}`, cx + 58, 86, '#fde047');
  if (ownLoss > 0) pushBoardingFloatingText(`-${ownLoss}`, cx - 58, 96, '#f87171');
}

function drawSwashbucklerFighter(bctx, x, y, facing, coatColor, hatColor, isCaptain, animTick, actionMode, isDefending, scale = 1.0, isGhost = false) {
  bctx.save();
  bctx.translate(x, y);
  bctx.scale(facing * scale, scale);
  const bob = Math.sin(animTick * 0.18) * 2.5;
  const lunge = (actionMode === 'melee' || actionMode === 'duel') ? Math.sin(animTick * 0.48) * 15 : 0;
  bctx.translate(lunge, bob);

  if (isGhost) { bctx.shadowColor = '#10b981'; bctx.shadowBlur = 12; }
  bctx.fillStyle = 'rgba(0,0,0,0.38)';
  bctx.beginPath(); bctx.ellipse(0, 29, 17, 5, 0, 0, Math.PI * 2); bctx.fill();

  const step = Math.sin(animTick * 0.26) * 6.5;
  bctx.strokeStyle = isGhost ? '#064e3b' : '#1e293b'; bctx.lineWidth = 5.5; bctx.lineCap = 'round';
  bctx.beginPath();
  bctx.moveTo(-5, 7); bctx.lineTo(-14 - step * 0.45, 27);
  bctx.moveTo(5, 7);  bctx.lineTo(15 + step * 0.65, 27);
  bctx.stroke();

  bctx.fillStyle = coatColor; bctx.strokeStyle = isGhost ? '#34d399' : '#d4af37'; bctx.lineWidth = isCaptain ? 1.8 : 1.0;
  bctx.beginPath(); bctx.moveTo(-9, -16); bctx.lineTo(9, -16); bctx.lineTo(13, 11); bctx.lineTo(-14, 12); bctx.closePath();
  bctx.fill(); bctx.stroke();

  bctx.fillStyle = isGhost ? '#6ee7b7' : '#eab676';
  bctx.beginPath(); bctx.arc(0, -24, 7.5, 0, Math.PI * 2); bctx.fill();

  bctx.fillStyle = hatColor; bctx.strokeStyle = isGhost ? '#34d399' : '#ffd700'; bctx.lineWidth = 1.3;
  bctx.beginPath(); bctx.moveTo(-15, -27); bctx.quadraticCurveTo(0, -40, 15, -27); bctx.closePath(); bctx.fill(); bctx.stroke();

  const swordWave = isDefending ? -0.95 : Math.sin(animTick * 0.55) * 0.72;
  bctx.save();
  bctx.translate(7, -10); bctx.rotate(swordWave);
  bctx.strokeStyle = coatColor; bctx.lineWidth = 4.6;
  bctx.beginPath(); bctx.moveTo(0, 0); bctx.lineTo(13, -2); bctx.stroke();
  bctx.strokeStyle = isGhost ? '#a7f3d0' : '#f8fafc'; bctx.lineWidth = 2.6;
  bctx.beginPath(); bctx.moveTo(16, -2); bctx.lineTo(48, -9); bctx.stroke();
  bctx.restore();

  bctx.shadowBlur = 0;
  bctx.restore();
}

function drawBoardingAnimationFrame() {
  const c = document.getElementById('boardingAnimCanvas');
  if (!c || !boardingState) return;
  const bctx = c.getContext('2d');
  const w = c.width, h = c.height;
  const st = boardingState;

  st.animTick = (st.animTick || 0) + 1;
  if (st.animTimer > 0) st.animTimer--; else st.animAction = 'idle';
  if (st.screenShake > 0) st.screenShake *= 0.82;
  const shakeX = st.screenShake > 0.4 ? (Math.random() - 0.5) * st.screenShake * 2 : 0;
  const shakeY = st.screenShake > 0.4 ? (Math.random() - 0.5) * st.screenShake * 2 : 0;

  const isFort = st.mode === 'fort';
  const isVillage = st.mode === 'village';
  const isGhostEnemy = !!(st.enemy && st.enemy.isGhost);
  const isPlayerGhost = !!(player.isGhostShip || (game.captain && game.captain.isGhostCaptain));
  const cStats = getCrewCombatStats();

  // Im 1v1-Duell bestimmt das Verhältnis der Kapitäns-HP die Position auf der Planke!
  const pRatio = st.phase === 'captain_duel' && st.duel
    ? (st.duel.playerHp / Math.max(1, st.duel.playerHp + st.duel.enemyHp))
    : (cStats.healthyCrew / Math.max(1, cStats.healthyCrew + st.enemy.crew));

  const targetDuelX = 230 + pRatio * 460;
  st.duelBalanceX = (st.duelBalanceX || 460) + (targetDuelX - (st.duelBalanceX || 460)) * 0.09;
  const enemyFacColor = isGhostEnemy ? '#065f46' : (st.enemy.faction && FACTIONS[st.enemy.faction] ? FACTIONS[st.enemy.faction].color : '#b45309');

  bctx.save();
  bctx.translate(shakeX, shakeY);

  const skyGrad = bctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, isFort ? '#1e1b4b' : (isGhostEnemy ? '#022c22' : '#082f49'));
  skyGrad.addColorStop(1, isFort ? '#292524' : (isGhostEnemy ? '#042f2e' : '#0c4a6e'));
  bctx.fillStyle = skyGrad;
  bctx.fillRect(-15, -15, w + 30, h + 30);

  if (!isFort && !isVillage) {
    bctx.translate(w / 2, h / 2);
    bctx.rotate(Math.sin(st.animTick * 0.032) * 0.015);
    bctx.translate(-w / 2, -h / 2);
  }

  bctx.fillStyle = isFort ? '#44403c' : '#5c3a18';
  bctx.fillRect(-10, 166, w + 20, h - 150);
  bctx.fillStyle = '#3e240c';
  bctx.fillRect(-10, 160, w + 20, 8);

  const barW = 380, barX = (w - barW) / 2;
  bctx.fillStyle = 'rgba(0,0,0,0.78)'; bctx.fillRect(barX, 12, barW, 11);
  bctx.fillStyle = '#2ecc71'; bctx.fillRect(barX, 12, barW * pRatio, 11);
  bctx.fillStyle = '#ef4444'; bctx.fillRect(barX + barW * pRatio, 12, barW * (1 - pRatio), 11);
  bctx.strokeStyle = '#d4af37'; bctx.lineWidth = 1.5; bctx.strokeRect(barX, 12, barW, 11);

  const duelCenter = st.duelBalanceX;
  const scaleF = st.phase === 'captain_duel' ? 1.24 : 1.06;
  drawSwashbucklerFighter(bctx, duelCenter - 38, 144, 1, isPlayerGhost ? '#065f46' : '#1e3a8a', '#7b241c', true, st.animTick, st.animAction, st.playerDefending, scaleF, isPlayerGhost);
  if (st.enemy.crew > 0 || st.phase === 'captain_duel') {
    drawSwashbucklerFighter(bctx, duelCenter + 38, 144, -1, enemyFacColor, '#1f2937', true, st.animTick + 11, st.animAction, false, scaleF, isGhostEnemy);
  }

  if (st.slashes) {
    for (let i = st.slashes.length - 1; i >= 0; i--) {
      const sl = st.slashes[i]; sl.life--;
      if (sl.life <= 0) { st.slashes.splice(i, 1); continue; }
      bctx.save(); bctx.globalAlpha = sl.life / sl.maxLife; bctx.strokeStyle = sl.color; bctx.lineWidth = 4;
      bctx.beginPath(); bctx.arc(sl.x, sl.y, sl.r, sl.startAng, sl.endAng); bctx.stroke(); bctx.restore();
    }
  }
  if (st.sparks) {
    for (let i = st.sparks.length - 1; i >= 0; i--) {
      const sp = st.sparks[i]; sp.x += sp.vx; sp.y += sp.vy; sp.vy += 0.14; sp.life--;
      if (sp.life <= 0) { st.sparks.splice(i, 1); continue; }
      bctx.fillStyle = sp.color; bctx.beginPath(); bctx.arc(sp.x, sp.y, 2.5, 0, Math.PI * 2); bctx.fill();
    }
  }
  if (st.floatingTexts) {
    for (let i = st.floatingTexts.length - 1; i >= 0; i--) {
      const ft = st.floatingTexts[i]; ft.y += ft.vy; ft.life--;
      if (ft.life <= 0) { st.floatingTexts.splice(i, 1); continue; }
      bctx.save(); bctx.globalAlpha = Math.min(1, ft.life / 20); bctx.font = 'bold 15px sans-serif'; bctx.textAlign = 'center';
      bctx.fillStyle = '#000'; bctx.fillText(ft.txt, ft.x + 1, ft.y + 1);
      bctx.fillStyle = ft.color; bctx.fillText(ft.txt, ft.x, ft.y);
      bctx.restore();
    }
  }
  bctx.restore();
}

// ============================================================================
// START ENTERSCHLACHTEN & STEIN-SCHERE-PAPIER KAPITÄNSDUELL!
// ============================================================================
window.startBoardingCombat = function() {
  if (!currentBoardTarget || isShipProtectedByBoarding(currentBoardTarget)) return;
  SoundFX.play('sword');
  const enemy = currentBoardTarget;
  setBoardingSanctuaryLock(enemy, true);

  const eTier = enemy.isGhost ? 0.45 : (enemy.cannonsPerSide >= 8 ? 0.35 : (enemy.cannonsPerSide >= 5 ? 0.20 : 0.10));
  let shockMult = hasCaptainPerk('perk_scholar_parrot') ? 0.88 : 1.0;
  if (player.figurehead === 'fh_reaper') shockMult *= 0.82;

  boardingState = {
    mode: 'ship', enemy, round: 1, phase: 'combat',
    enemyArmor: eTier * shockMult, enemyMelee: eTier * shockMult, enemyRanged: eTier,
    playerDefending: false, duel: null,
    animTick: 0, animAction: 'melee', animTimer: 28, duelBalanceX: 460, screenShake: 4,
    sparks: [], slashes: [], floatingTexts: [],
    log: [`🛡️ ENTERSCHUTZ AKTIV! Eure ${getEffectiveHealthyCrew()} Matrosen entern die "${enemy.name}" (${Math.ceil(enemy.crew)} Mann)!`]
  };

  document.getElementById('boardingOverlay').classList.add('active');
  renderBoardingModal();
  startBoardingAnimationLoop();
};

window.startFortSiegeBoarding = function() {
  if (!currentSiegePort) return;
  SoundFX.play('sword');
  setBoardingSanctuaryLock(null, true);
  const port = currentSiegePort;
  const garrisonCrew = Math.round(65 + port.maxFortHp * 0.032);

  boardingState = {
    mode: 'fort', port,
    enemy: { name: `${port.name} (${td(FACTIONS[port.faction], 'short')})`, faction: port.faction, crew: garrisonCrew, maxCrew: garrisonCrew, cannonsPerSide: 12, captainPortraitId: `kolonial:${(PORTS.indexOf(port) * 3 + 1) % 16}` },
    round: 1, phase: 'combat', enemyArmor: 0.35, enemyMelee: 0.35, enemyRanged: 0.38, playerDefending: false, duel: null,
    animTick: 0, animAction: 'melee', animTimer: 28, duelBalanceX: 460, screenShake: 5,
    sparks: [], slashes: [], floatingTexts: [],
    log: [`🏰 Sturmangriff auf die Bastion von ${port.name} (${garrisonCrew} Verteidiger)!`]
  };
  document.getElementById('boardingOverlay').classList.add('active');
  renderBoardingModal();
  startBoardingAnimationLoop();
};

window.startVillageRaidBoarding = function(village) {
  if (!village) return;
  SoundFX.play('sword');
  setBoardingSanctuaryLock(null, true);
  const militiaCount = 16 + Math.floor(Math.random() * 10);
  boardingState = {
    mode: 'village', village,
    enemy: { name: `${td(village, 'name')}`, faction: 'england', crew: militiaCount, maxCrew: militiaCount, cannonsPerSide: 0, captainPortraitId: 'inselvolk:10' },
    round: 1, phase: 'combat', enemyArmor: 0.08, enemyMelee: 0.14, enemyRanged: 0.12, playerDefending: false, duel: null,
    animTick: 0, animAction: 'melee', animTimer: 28, duelBalanceX: 460, screenShake: 4,
    sparks: [], slashes: [], floatingTexts: [],
    log: [`🔥 Überfall auf ${td(village, 'name')} (${militiaCount} Verteidiger)!`]
  };
  document.getElementById('boardingOverlay').classList.add('active');
  renderBoardingModal();
  startBoardingAnimationLoop();
};

window.triggerMutinyCombat = function() {
  SoundFX.play('sword');
  setBoardingSanctuaryLock(null, true);
  const totalCrew = Math.ceil(player.crew);
  const mutineers = Math.max(5, Math.floor(totalCrew * 0.42));
  player.crew = Math.max(5, totalCrew - mutineers);
  clampCrewEquipmentToCrewSize();

  boardingState = {
    mode: 'mutiny',
    enemy: { name: 'Meuterer-Rädelsführer', faction: 'pirates', crew: mutineers, maxCrew: mutineers, cannonsPerSide: player.cannonsPerSide, captainPortraitId: 'schmuggler:8' },
    round: 1, phase: 'combat', enemyArmor: 0.18, enemyMelee: 0.25, enemyRanged: 0.20, playerDefending: false, duel: null,
    animTick: 0, animAction: 'duel', animTimer: 28, duelBalanceX: 460, screenShake: 4,
    sparks: [], slashes: [], floatingTexts: [],
    log: [`☠️ MEUTEREI AN BORD! (${mutineers} Meuterer)`]
  };
  document.getElementById('boardingOverlay').classList.add('active');
  renderBoardingModal();
  startBoardingAnimationLoop();
};

// Öffnet das taktische 1-gegen-1 Stein-Schere-Papier Kapitänsduell!
window.enterCaptainSwordDuel = function() {
  if (!boardingState || boardingState.phase !== 'combat') return;
  const st = boardingState;
  const dStats = getCaptainDuelStats();
  const ePower = st.enemy.isGhost ? 1.35 : (0.85 + (st.enemy.cannonsPerSide || 4) * 0.05);
  const enemyMaxHp = Math.round(95 * ePower);
  let enemyStartHp = enemyMaxHp;

  st.phase = 'captain_duel';
  if (dStats.openerDmg > 0) {
    SoundFX.play('cannon');
    enemyStartHp = Math.max(20, enemyStartHp - dStats.openerDmg);
    st.log.unshift(`🔫 Du feuerst deine geladene Duellpistole ab: -${dStats.openerDmg} HP beim feindlichen Kapitän!`);
  } else {
    SoundFX.play('sword');
    st.log.unshift(`🤺 Die Mannschaften bilden einen Kreis – Klinge gegen Klinge im 1-gegen-1-Duell!`);
  }

  st.duel = {
    playerHp: dStats.maxHp,
    playerMaxHp: dStats.maxHp,
    enemyHp: enemyStartHp,
    enemyMaxHp,
    enemyBaseDmg: Math.round(16 * ePower),
    enemyNextHint: rollEnemyDuelMoveAndHint()
  };
  renderBoardingModal();
};

function rollEnemyDuelMoveAndHint() {
  const moves = ['slash', 'thrust', 'parry'];
  const picked = moves[Math.floor(Math.random() * 3)];
  // Zu 65% verrät die Körperhaltung des Gegners eine subtile Tendenz!
  let hint = 'Der feindliche Kapitän kreist lauernd mit der Klinge...';
  if (Math.random() < 0.65) {
    if (picked === 'slash') hint = '👀 Beobachtung: Er holt weit über die Schulter zum wuchtigen Hieb aus!';
    else if (picked === 'thrust') hint = '👀 Beobachtung: Er senkt die Klingenspitze für einen blitzschnellen Ausfallstich!';
    else hint = '👀 Beobachtung: Er zieht den Mantel eng vor die Brust und lauert auf eine Parade!';
  }
  return { move: picked, hint };
}

// Stein-Schere-Papier-Auflösung:
// slash (Hoher Hieb) schlägt parry (Parade/Finte)
// thrust (Ausfallstich) schlägt slash (Hoher Hieb)
// parry (Parade & Konter) schlägt thrust (Ausfallstich)
window.executeCaptainDuelMove = function(pMove) {
  if (!boardingState || boardingState.phase !== 'captain_duel' || !boardingState.duel) return;
  const st = boardingState;
  const dl = st.duel;
  const dStats = getCaptainDuelStats();
  const eMove = dl.enemyNextHint.move;

  SoundFX.play('sword');
  const moveNames = { slash: '🗡️ Hoher Hieb', thrust: '🤺 Ausfallstich', parry: '🛡️ Parade & Finte' };
  const pWins = (pMove === 'slash' && eMove === 'parry') ||
                (pMove === 'thrust' && eMove === 'slash') ||
                (pMove === 'parry' && eMove === 'thrust');

  if (pMove === eMove) {
    // Klingen kreuzen sich -> leichter Schaden auf beiden Seiten
    const pDmg = Math.round((dStats[pMove] || 15) * 0.45);
    const eDmg = Math.round(dl.enemyBaseDmg * 0.45);
    dl.enemyHp = Math.max(0, dl.enemyHp - pDmg);
    dl.playerHp = Math.max(0, dl.playerHp - eDmg);
    triggerBoardingVisualAction('duel', pDmg, eDmg);
    st.log.unshift(`⚔️ Klingenprall! Beide wählen ${moveNames[pMove]} (-${pDmg} Gegner / -${eDmg} Du).`);
  } else if (pWins) {
    const dmg = Math.round((dStats[pMove] || 16) * (1.25 + Math.random() * 0.25));
    dl.enemyHp = Math.max(0, dl.enemyHp - dmg);
    triggerBoardingVisualAction('duel', dmg, 0);
    st.log.unshift(`✅ Treffer! Dein ${moveNames[pMove]} durchbricht ${moveNames[eMove]} (-${dmg} HP beim Feind)!`);
  } else {
    const dmg = Math.max(6, Math.round(dl.enemyBaseDmg * 1.25 - (dStats.parry * 0.22)));
    dl.playerHp = Math.max(0, dl.playerHp - dmg);
    triggerBoardingVisualAction('melee', 0, dmg);
    st.log.unshift(`💥 Konter! Des Gegners ${moveNames[eMove]} schlägt deinen ${moveNames[pMove]} (-${dmg} Ausdauer)!`);
  }

  if (dl.enemyHp <= 0) {
    st.enemy.crew = 0;
    st.phase = 'victory';
    SoundFX.play('coin');
    st.log.unshift(`🏆 KAPITÄNSDUELL GEWONNEN! Der feindliche Anführer wirft seinen Degen auf die Planken – die Crew ergibt sich sofort!`);
    renderBoardingModal();
    return;
  }

  if (dl.playerHp <= 0) {
    // Kapitän im Duell verwundet -> zurück ins Mannschaftsgefecht mit Moralverlust (oder Niederlage bei wenig Crew)
    player.morale = Math.max(12, player.morale - 15);
    if (getEffectiveHealthyCrew() <= 4) {
      st.phase = 'defeat';
      st.log.unshift(`☠️ Du gehst verwundet zu Boden und deine letzten Männer strecken die Waffen!`);
    } else {
      st.phase = 'combat';
      st.log.unshift(`🩸 Du wirst am Arm getroffen – deine Matrosen ziehen dich hinter ihre Reihen zurück (-15% Moral)!`);
    }
    updateHUD();
    renderBoardingModal();
    return;
  }

  dl.enemyNextHint = rollEnemyDuelMoveAndHint();
  renderBoardingModal();
};

window.executeBoardingTurn = function(action) {
  if (!boardingState) return;
  const st = boardingState;

  if (action === 'retreat') {
    if (st.mode === 'mutiny' && st.phase === 'combat') return;
    const wasDefeated = (st.phase === 'defeat');
    setBoardingSanctuaryLock(st.enemy, false);
    document.getElementById('boardingOverlay').classList.remove('active');
    boardingState = null;
    if (wasDefeated) {
      handlePlayerDefeatOrRansom('Deine Mannschaft wurde im Entergefecht überwältigt!');
    }
    updateHUD();
    return;
  }

  if (action === 'duel') {
    enterCaptainSwordDuel();
    return;
  }

  if (st.phase !== 'combat') return;
  const enemy = st.enemy;
  const cStats = getCrewCombatStats();
  const moraleFactor = 0.75 + 0.35 * (player.morale / 100);

  st.playerDefending = false;
  let pKills = 0;

  if (action === 'ranged') {
    SoundFX.play('cannon');
    const baseDmg = (cStats.healthyCrew * 0.16) * (1 + cStats.rangedBonus) * moraleFactor;
    pKills = Math.max(1, Math.round(baseDmg * (0.85 + Math.random() * 0.3) * (1 - st.enemyArmor * 0.45)));
    enemy.crew = Math.max(0, enemy.crew - pKills);
    st.log.unshift(`🔫 #${st.round}: Musketensalve schaltet ${pKills} Gegner aus!`);
  } else if (action === 'melee') {
    SoundFX.play('sword');
    const baseDmg = (cStats.healthyCrew * 0.24) * (1 + cStats.meleeBonus) * moraleFactor;
    pKills = Math.max(2, Math.round(baseDmg * (0.85 + Math.random() * 0.35) * (1 - st.enemyArmor * 0.35)));
    enemy.crew = Math.max(0, enemy.crew - pKills);
    st.log.unshift(`🗡️ #${st.round}: Entersturm schaltet ${pKills} Verteidiger aus!`);
  } else if (action === 'defend') {
    st.playerDefending = true;
    const hasDoc = hasOfficerRole('surgeon') || hasOfficerRole('barber');
    const healWounded = Math.min(player.woundedCrew || 0, hasDoc ? 3 : 1);
    player.woundedCrew = Math.max(0, (player.woundedCrew || 0) - healWounded);
    pKills = Math.max(1, Math.round(cStats.healthyCrew * 0.08 * (1 + cStats.rangedBonus)));
    enemy.crew = Math.max(0, enemy.crew - pKills);
    st.log.unshift(`🛡️ #${st.round}: +${healWounded} ❤️ versorgt | -${pKills} Gegner`);
  }

  if (enemy.crew <= 2 || (enemy.crew < cStats.healthyCrew * 0.18 && st.round >= 2)) {
    enemy.crew = 0;
    st.phase = 'victory';
    triggerBoardingVisualAction(action, pKills, 0);
    SoundFX.play('coin');
    st.log.unshift(`🏆 "${enemy.name}" streckt die Waffen!`);
    renderBoardingModal();
    updateHUD();
    return;
  }

  const defMultiplier = st.playerDefending ? 0.45 : (action === 'melee' ? 1.15 : 0.85);
  const eRaw = (enemy.crew * 0.17) * (1 + st.enemyMelee) * defMultiplier;
  const totalCasualties = Math.max(1, Math.round(eRaw * (0.85 + Math.random() * 0.3) * Math.max(0.35, 1 - cStats.armorBonus)));
  const killed = Math.max(0, Math.floor(totalCasualties * 0.45));
  const wounded = Math.max(1, totalCasualties - killed);

  player.crew = Math.max(2, player.crew - killed);
  player.woundedCrew = Math.min(Math.max(0, player.crew - 2), (player.woundedCrew || 0) + wounded);
  clampCrewEquipmentToCrewSize();
  triggerBoardingVisualAction(action, pKills, killed + wounded);
  st.log.unshift(`💥 Gegenstoß: -${killed} 💀, +${wounded} 🩸`);

  if (getEffectiveHealthyCrew() <= 2) {
    st.phase = 'defeat';
    st.log.unshift(`☠️ Deine Mannschaft ist kampfunfähig geschlagen!`);
  }

  st.round++;
  updateHUD();
  renderBoardingModal();
};

function spawnPortRetakeSquadron(conqueredPort, oldFactionId) {
  if (!oldFactionId || oldFactionId === 'pirates') return;
  const friendlyOrigin = PORTS.find(p => p.faction === oldFactionId && p.id !== conqueredPort.id);
  if (!friendlyOrigin) return;
  const sAng = friendlyOrigin.seaAngle !== undefined ? friendlyOrigin.seaAngle : 0;
  const destAng = conqueredPort.seaAngle !== undefined ? conqueredPort.seaAngle : 0;
  const retakeShip = spawnWorldShip({
    faction: oldFactionId, clsKey: 'manowar',
    x: friendlyOrigin.x + Math.cos(sAng) * 420, y: friendlyOrigin.y + Math.sin(sAng) * 420,
    name: `${td(FACTIONS[oldFactionId], 'short')} (${conqueredPort.name})`, skipEscorts: true
  });
  retakeShip.retakePortId = conqueredPort.id;
  retakeShip.destX = conqueredPort.x + Math.cos(destAng) * 320;
  retakeShip.destY = conqueredPort.y + Math.sin(destAng) * 320;
}

window.finishBoardingVictory = function(choice, extraParam = null) {
  if (!boardingState) return;
  const st = boardingState;
  setBoardingSanctuaryLock(st.enemy, false);

  if (st.mode === 'mutiny') {
    player.morale = 60;
    grantCaptainXP(40, '⚖️ Meuterei niedergeschlagen!');
    document.getElementById('boardingOverlay').classList.remove('active');
    boardingState = null; updateHUD(); return;
  }

  if (st.mode === 'village' && st.village) {
    const fv = st.village;
    const raidGold = 185 + Math.floor(Math.random() * 140);
    game.gold += raidGold;
    let free = Math.max(0, Math.floor(getMaxCargo() - getCargoTotal()));
    const foodLoot = Math.min(free, Math.max(6, fv.foodStock || 10));
    if (foodLoot > 0) player.cargo.food = (player.cargo.food || 0) + foodLoot;
    fv.foodStock = 0; fv.crewAvail = 0; fv.raidCooldown = 7200;
    ['england', 'spain', 'france', 'netherlands', 'denmark'].forEach(fk => { game.rep[fk] = Math.max(-100, (game.rep[fk] || 0) - 12); });
    changePlayerReputation(-28, `🔥 ${td(fv, 'name')} geplündert (+${raidGold} 🪙)!`);
    SoundFX.play('coin');
    document.getElementById('boardingOverlay').classList.remove('active');
    boardingState = null; updateHUD(); return;
  }

  if (st.mode === 'fort' && st.port) {
    const port = st.port;
    const oldFac = port.faction;
    if (choice === 'sack_port') {
      const sackGold = 850 + Math.floor(Math.random() * 350);
      game.gold += sackGold; port.fortHp = Math.round(port.maxFortHp * 0.45);
      game.rep[oldFac] = -100; changePlayerReputation(-22);
      grantCaptainXP(110, `🔥 ${port.name}: +${sackGold} 🪙!`);
    } else if (choice === 'annex_port' && extraParam) {
      port.faction = extraParam; port.fortHp = Math.round(port.maxFortHp * 0.70);
      if (port.hasLighthouse) port.lighthouseHp = port.maxLighthouseHp || 680;
      game.rep[oldFac] = -100; game.rep[extraParam] = Math.min(100, (game.rep[extraParam] || 0) + 45);
      game.rankPts[extraParam] = (game.rankPts[extraParam] || 0) + 65;
      const dailyTrib = Math.round(75 + (port.maxFortHp / 100));
      game.conqueredPorts = game.conqueredPorts || {};
      game.conqueredPorts[port.id] = { dailyTribute: dailyTrib, oldFaction: oldFac, newFaction: extraParam };
      if (window.rebuildPortShipyardOffersForFaction) rebuildPortShipyardOffersForFaction(port);
      generatePortMissions(port);
      spawnPortRetakeSquadron(port, oldFac);
      if (window.recalculateFactionTerritories) recalculateFactionTerritories();
      grantCaptainXP(125, `👑 ${port.name} (+${dailyTrib} 🪙/T)!`);
    }
    SoundFX.play('coin');
    document.getElementById('boardingOverlay').classList.remove('active');
    boardingState = null; currentSiegePort = null; updateHUD(); return;
  }

  const enemy = st.enemy;
  const mods = getOfficerModifiers();
  const lootMult = Math.max(0.6, 1.0 + (mods.lootMult || 0));
  const baseGold = Math.round(enemy.gold * 1.5 * lootMult);
  const baseGoodAmt = Math.round(enemy.lootAmount * 1.5 * lootMult);

  let freeSpace = Math.max(0, Math.floor(getMaxCargo() - getCargoTotal()));
  const capturedPrisoners = Math.min(freeSpace, enemy.isGhost ? 0 : (3 + Math.floor(Math.random() * 5)));
  if (capturedPrisoners > 0) {
    player.prisoners = (player.prisoners || 0) + capturedPrisoners;
    const eFac = enemy.faction || 'pirates';
    player.prisonersByFaction = player.prisonersByFaction || createEmptyPrisonersMap();
    player.prisonersByFaction[eFac] = (player.prisonersByFaction[eFac] || 0) + capturedPrisoners;
    freeSpace -= capturedPrisoners;
  }

  if (!enemy.isGhost && !enemy.isMissionTarget) changePlayerReputation(enemy.isMerchant ? -12 : -6);

  if (choice === 'plunder') {
    game.gold += baseGold;
    const taken = Math.min(freeSpace, baseGoodAmt);
    if (taken > 0) { player.cargo[enemy.lootGood] = (player.cargo[enemy.lootGood] || 0) + taken; freeSpace -= taken; }
    if (freeSpace >= 1 && !enemy.isGhost) {
      const cBonusId = enemy.cannonsPerSide >= 8 ? 'cannon_18pdr' : (enemy.cannonsPerSide >= 5 ? 'cannon_12pdr' : 'cannon_6pdr');
      player.cargo[cBonusId] = (player.cargo[cBonusId] || 0) + 1;
    }
    grantCaptainXP(enemy.isGhost ? 95 : 45, `🏴‍☠️ +${baseGold} 🪙!`);
  } else if (choice === 'salvage') {
    const prizeGold = Math.round(baseGold * 1.35);
    game.gold += prizeGold;
    player.hull = Math.min(player.maxHull, player.hull + player.maxHull * 0.35);
    player.sail = Math.min(player.maxSail, player.sail + player.maxSail * 0.40);
    if (freeSpace >= 2) player.cargo.timber = (player.cargo.timber || 0) + 2;
    grantCaptainXP(55, `🔨 +${prizeGold} 🪙 & +2 🪵!`);
  } else if (choice === 'add_escort') {
    const freePrizeOffs = getFreePrizeOfficers();
    if (freePrizeOffs.length === 0 || (player.fleet || []).length >= MAX_ESCORT_SHIPS) return;
    const cmdOfficer = freePrizeOffs.find(o => o.uid === extraParam) || freePrizeOffs[0];
    const tpl = SHIP_CLASSES[enemy.clsKey] || SHIP_CLASSES.sloop;
    const newEscortUid = 'esc_' + (escortUidCounter++);
    cmdOfficer.assignedShipUid = newEscortUid;

    player.fleet.push({
      uid: newEscortUid, name: enemy.name.replace(/^.*?–\s*/, ''), clsKey: enemy.clsKey || 'sloop',
      shipFaction: enemy.faction || 'pirates', isGhost: !!enemy.isGhost, hasGhostVisual: !!enemy.isGhost,
      ghostAbility: enemy.ghostAbility || null, specialEquipment: null,
      upgrades: { cannons: 0, reload: 0, damage: 0, sails: 0, hull: 0, cargo: 0 },
      commanderUid: cmdOfficer.uid, commanderName: cmdOfficer.name,
      x: enemy.x, y: enemy.y, angle: enemy.angle, speed: 0,
      length: enemy.length, width: enemy.width, cannonsPerSide: enemy.cannonsPerSide,
      portCannons: initCannonsArray(enemy.cannonsPerSide), stbdCannons: initCannonsArray(enemy.cannonsPerSide),
      nextPortIndex: 0, nextStbdIndex: 0, portFireDelay: 0, stbdFireDelay: 0, singleFireInterval: 10,
      baseMaxSpeed: enemy.baseMaxSpeed || tpl.baseSpeed, baseTurnRate: enemy.baseTurnRate || tpl.turnRate,
      rangeBonus: 1.0, reloadMax: enemy.reloadMax || tpl.reload, dmg: enemy.dmg || tpl.dmg,
      hull: Math.max(85, Math.round(enemy.hull)), maxHull: enemy.maxHull,
      sail: Math.max(70, Math.round(enemy.sail)), maxSail: enemy.maxSail,
      crew: Math.min(enemy.maxCrew, Math.max(12, Math.floor(player.crew * 0.25))), maxCrew: enemy.maxCrew,
      cargoCap: tpl.cargoCap || 40, hullColor: enemy.isGhost ? '#064e3b' : '#1e3a5f',
      sailColor: enemy.isGhost ? 'rgba(52,211,153,0.65)' : '#f8fafc', flagColor: '#2ecc71',
      combatMode: player.combatMode, cannonExtendPct: player.cannonExtendPct
    });
    game.gold += Math.round(baseGold * 0.7);
    grantCaptainXP(65, `⛵ "${enemy.name}" (${cmdOfficer.name})!`);
  } else if (choice === 'swap_flagship_sink' || choice === 'swap_flagship_keep') {
    const tpl = SHIP_CLASSES[enemy.clsKey] || SHIP_CLASSES.frigate;
    if (choice === 'swap_flagship_keep') {
      const freePrizeOffs = getFreePrizeOfficers();
      if (freePrizeOffs.length > 0 && (player.fleet || []).length < MAX_ESCORT_SHIPS) {
        const cmdOfficer = freePrizeOffs[0];
        const oldEscortUid = 'esc_' + (escortUidCounter++);
        cmdOfficer.assignedShipUid = oldEscortUid;
        player.fleet.push({
          uid: oldEscortUid, name: player.shipName || 'Flaggschiff', clsKey: player.clsKey || 'sloop',
          shipFaction: player.shipFaction || 'pirates', isGhost: !!player.isGhostShip, hasGhostVisual: !!player.hasGhostVisual,
          ghostAbility: player.ghostAbility || null, specialEquipment: player.specialEquipment || null,
          upgrades: { ...(player.upgrades || { cannons: 0, reload: 0, damage: 0, sails: 0, hull: 0, cargo: 0 }) },
          commanderUid: cmdOfficer.uid, commanderName: cmdOfficer.name,
          x: player.x - 60, y: player.y - 60, angle: player.angle, speed: 0,
          length: player.length, width: player.width, cannonsPerSide: player.cannonsPerSide,
          portCannons: initCannonsArray(player.cannonsPerSide), stbdCannons: initCannonsArray(player.cannonsPerSide),
          nextPortIndex: 0, nextStbdIndex: 0, portFireDelay: 0, stbdFireDelay: 0, singleFireInterval: 10,
          baseMaxSpeed: player.baseMaxSpeed, baseTurnRate: player.baseTurnRate, rangeBonus: player.rangeBonus || 1.0,
          reloadMax: player.reloadMax, dmg: player.baseDamage,
          hull: Math.max(80, Math.round(player.hull)), maxHull: player.baseMaxHull,
          sail: Math.max(60, Math.round(player.sail)), maxSail: player.maxSail,
          crew: Math.max(10, Math.floor(player.crew * 0.3)), maxCrew: player.baseMaxCrew,
          cargoCap: player.baseCargoCap, hullColor: '#5c3a18', sailColor: '#f8f9fa', flagColor: '#111',
          combatMode: player.combatMode, cannonExtendPct: player.cannonExtendPct
        });
      }
    }

    const isGhostCap = !!(game.captain && game.captain.isGhostCaptain);
    player.shipName = enemy.name.replace(/^.*?–\s*/, '');
    player.clsKey = enemy.clsKey || 'frigate'; player.shipFaction = enemy.faction || 'pirates';
    player.isGhostShip = !!enemy.isGhost; player.hasGhostVisual = !!(enemy.isGhost || isGhostCap);
    player.ghostAbility = enemy.ghostAbility || null;
    player.specialEquipment = null; player.specialEquipCooldown = 0; player.hullSpaceShift = 0;
    player.length = enemy.length; player.width = enemy.width; player.cannonsPerSide = enemy.cannonsPerSide;
    player.portCannons = initCannonsArray(enemy.cannonsPerSide); player.stbdCannons = initCannonsArray(enemy.cannonsPerSide);
    player.portCannonDamage = initCannonsArray(enemy.cannonsPerSide); player.stbdCannonDamage = initCannonsArray(enemy.cannonsPerSide);
    player.baseMaxSpeed = enemy.baseMaxSpeed || tpl.baseSpeed; player.baseTurnRate = enemy.baseTurnRate || tpl.turnRate;
    player.rangeBonus = 1.0; player.reloadMax = enemy.reloadMax || tpl.reload; player.baseDamage = enemy.dmg || tpl.dmg;
    player.baseMaxHull = enemy.maxHull; player.hull = Math.max(100, Math.round(enemy.hull));
    player.maxSail = enemy.maxSail; player.sail = Math.max(80, Math.round(enemy.sail));
    player.baseMaxCrew = enemy.maxCrew; player.baseCargoCap = Math.max(40, (tpl.cargoCap || 60) + 15);
    player.upgrades = { cannons: 0, reload: 0, damage: 0, sails: 0, hull: 0, cargo: 0 };

    const cDefId = enemy.isGhost ? 'cannon_18pdr' : (tpl.defaultCannon || 'cannon_6pdr');
    const missingC = Math.max(0, (enemy.cannonsPerSide * 2) - getPlayerEquippedCannonStats().equippedCount);
    if (missingC > 0) player.cargo[cDefId] = (player.cargo[cDefId] || 0) + missingC;

    recalcPlayerDerivedStats();
    if (window.trimExcessCargoCannonsAfterShipSwap) trimExcessCargoCannonsAfterShipSwap(null);
    rebuildCannonPips();
    game.gold += Math.round(baseGold * 0.85);
    grantCaptainXP(75, `⚓ "${player.shipName}"!`);
  }

  if (game.activeMission && (game.activeMission.type === 'hunt' || game.activeMission.type === 'capture_only') && enemy.isMissionTarget) {
    const ms = game.activeMission;
    game.gold += ms.rewardGold;
    game.rankPts[ms.faction] = (game.rankPts[ms.faction] || 0) + ms.rewardRankPts;
    game.rep[ms.faction] = Math.min(100, game.rep[ms.faction] + ms.rewardRep);
    changePlayerReputation(8);
    grantCaptainXP(ms.rewardXp, `🏆 "${ms.title}" +${ms.rewardGold} 🪙!`);
    game.activeMission = null;
  }

  const idx = ships.indexOf(enemy);
  if (idx !== -1) ships.splice(idx, 1);

  SoundFX.play('coin');
  document.getElementById('boardingOverlay').classList.remove('active');
  boardingState = null; currentBoardTarget = null;
  renderOfficerHudBar(); updateHUD();
};

window.renderBoardingModal = function() {
  if (!boardingState) return;
  const st = boardingState;
  const enemy = st.enemy;
  const cStats = getCrewCombatStats();
  const dStats = getCaptainDuelStats();
  const enemyCapPortraitId = enemy.captainPortraitId || pickPortraitForFactionCaptain(enemy.faction, enemy.captainSeed || 88, !!enemy.isGhost);

  document.getElementById('boardingTitle').textContent = st.phase === 'captain_duel' ? `🤺 1-gegen-1 Kapitänsduell!` : `⚔️ "${enemy.name}"`;
  document.getElementById('boardingRoundText').textContent = `🛡️ ${t('boardingProtected')} • #${st.round}`;

  let html = `
    <div class="grid-2" style="margin-bottom:10px;">
      <div class="card-box">
        <div style="display:flex; gap:10px; align-items:center;">
          ${renderPortraitBox(game.captain.svg, 60, '#2ecc71', game.captain.isGhostCaptain)}
          <div>
            <div class="card-title" style="color:#2ecc71;">
              ${st.phase === 'captain_duel' ? `❤️ Du: ${st.duel.playerHp} / ${st.duel.playerMaxHp} HP` : `🏴‍☠️ ${cStats.healthyCrew} (${Math.floor(player.woundedCrew || 0)} 🩸)`}
            </div>
            <div class="card-desc" style="margin:2px 0 0;">
              ${st.phase === 'captain_duel' ? `🗡️ ${dStats.slash} | 🤺 ${dStats.thrust} | 🛡️ ${dStats.parry}` : `🛡️ +${Math.round(cStats.armorBonus * 100)}% | 🗡️ +${Math.round(cStats.meleeBonus * 100)}% | 🔫 +${Math.round(cStats.rangedBonus * 100)}%`}
            </div>
          </div>
        </div>
      </div>

      <div class="card-box">
        <div style="display:flex; gap:10px; align-items:center;">
          ${renderPortraitBox(enemyCapPortraitId, 60, '#ef4444', !!enemy.isGhost)}
          <div>
            <div class="card-title" style="color:#ef4444;">
              ${st.phase === 'captain_duel' ? `☠️ Feind: ${st.duel.enemyHp} / ${st.duel.enemyMaxHp} HP` : `⚓ ${Math.ceil(enemy.crew)} / ${enemy.maxCrew}`}
            </div>
            <div class="card-desc" style="margin:2px 0 0;"><strong>${escapeHtml(enemy.name)}</strong></div>
          </div>
        </div>
      </div>
    </div>

    <div class="card-box" style="margin-bottom:10px; background:#081018; max-height:95px; overflow-y:auto;">
      ${st.log.map(line => `<div style="font-size:12px; padding:3px 0; border-bottom:1px solid #1e293b;">${escapeHtml(line)}</div>`).join('')}
    </div>
  `;

  if (st.phase === 'captain_duel' && st.duel) {
    html += `
      <div style="padding:8px 12px; margin-bottom:10px; background:#142230; border-left:3px solid #fde047; color:#fef08a; font-size:12.5px;">
        ${escapeHtml(st.duel.enemyNextHint.hint)}
      </div>
      <div class="grid-3">
        <button class="action-btn" style="flex-direction:column; align-items:flex-start; padding:10px;" onclick="executeCaptainDuelMove('slash')">
          <strong style="color:#fb923c; font-size:13.5px;">🗡️ Hoher Hieb (${dStats.slash})</strong>
          <span style="font-size:11px; color:#cbd5e1;">Schlägt: <strong>🛡️ Parade &amp; Finte</strong></span>
        </button>
        <button class="action-btn" style="flex-direction:column; align-items:flex-start; padding:10px;" onclick="executeCaptainDuelMove('thrust')">
          <strong style="color:#38bdf8; font-size:13.5px;">🤺 Ausfallstich (${dStats.thrust})</strong>
          <span style="font-size:11px; color:#cbd5e1;">Schlägt: <strong>🗡️ Hoher Hieb</strong></span>
        </button>
        <button class="action-btn" style="flex-direction:column; align-items:flex-start; padding:10px;" onclick="executeCaptainDuelMove('parry')">
          <strong style="color:#2ecc71; font-size:13.5px;">🛡️ Parade &amp; Finte (${dStats.parry})</strong>
          <span style="font-size:11px; color:#cbd5e1;">Schlägt: <strong>🤺 Ausfallstich</strong></span>
        </button>
      </div>
    `;
  } else if (st.phase === 'combat') {
    html += `
      <div class="grid-2">
        <button class="action-btn" onclick="executeBoardingTurn('ranged')"><span>🔫 Musketen- &amp; Pistolensalve</span><span>+${Math.round(cStats.rangedBonus * 100)}%</span></button>
        <button class="action-btn" onclick="executeBoardingTurn('melee')"><span>🗡️ Vorstoß mit Entermessern</span><span>+${Math.round(cStats.meleeBonus * 100)}%</span></button>
        <button class="action-btn" style="border-color:#38bdf8; background:#0f2942;" onclick="executeBoardingTurn('duel')"><span>🤺 1v1 Kapitänsduell (Stein-Schere-Papier!)</span><span>⚔️</span></button>
        <button class="action-btn" onclick="executeBoardingTurn('defend')"><span>🛡️ Deckung &amp; Verletzte verbinden</span><span>+${Math.round(cStats.armorBonus * 100)}%</span></button>
      </div>
      ${st.mode !== 'mutiny' ? `<div style="margin-top:8px; text-align:right;"><button class="action-btn danger" style="display:inline-flex;" onclick="executeBoardingTurn('retreat')">⛓️ Rückzug (Esc)</button></div>` : ''}
    `;
  } else if (st.phase === 'victory') {
    if (st.mode === 'mutiny') {
      html += `<button class="primary-btn" style="width:100%;" onclick="finishBoardingVictory('mutiny_end')">⚖️ Kommando wiederherstellen</button>`;
    } else if (st.mode === 'village') {
      html += `<button class="action-btn danger" style="width:100%; justify-content:center;" onclick="finishBoardingVictory('village_plunder')">🔥 Beute verladen (-28 Ruf)</button>`;
    } else if (st.mode === 'fort') {
      const estTrib = Math.round(75 + (st.port.maxFortHp / 100));
      html += `
        <div class="grid-2">
          <button class="action-btn danger" onclick="finishBoardingVictory('sack_port')"><span>🔥 Schatzkammer plündern (~1.000 🪙)</span><span>🪙</span></button>
          <div class="card-box">
            <div class="card-title">👑 Stadt übergeben (+${estTrib} 🪙/Tag Tribut):</div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">
              ${Object.values(FACTIONS).filter(f => f.id !== st.port.faction).map(f => `<button class="sm-btn" onclick="finishBoardingVictory('annex_port', '${f.id}')">${td(f, 'short')}</button>`).join('')}
            </div>
          </div>
        </div>
      `;
    } else {
      const freePrizeOffs = getFreePrizeOfficers();
      const fleetCount = (player.fleet || []).length;
      const canAddEscort = freePrizeOffs.length > 0 && fleetCount < MAX_ESCORT_SHIPS;
      const goodObj = GOODS.find(g => g.id === enemy.lootGood);
      html += `
        <div class="grid-2" style="margin-bottom:10px;">
          <div class="card-box">
            <div class="card-title">1. Als Begleitschiff (${fleetCount}/${MAX_ESCORT_SHIPS})</div>
            <div class="card-desc">${freePrizeOffs.length > 0 ? `<span style="color:#2ecc71;">🎖️ ${escapeHtml(freePrizeOffs[0].name)}</span>` : `<span style="color:#ff7675;">⚠️ Freier Prisen-Offizier nötig!</span>`}</div>
            <button class="action-btn" ${!canAddEscort ? 'disabled' : ''} onclick="finishBoardingVictory('add_escort', '${freePrizeOffs[0] ? freePrizeOffs[0].uid : ''}')"><span>${canAddEscort ? escapeHtml(freePrizeOffs[0].name) : '🔒'}</span><span>⛵</span></button>
          </div>
          <div class="card-box">
            <div class="card-title">2. Als neues Flaggschiff</div>
            <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
              <button class="action-btn" ${!canAddEscort ? 'disabled' : ''} onclick="finishBoardingVictory('swap_flagship_keep')"><span>⚓ Tauschen &amp; altes behalten</span><span>⛵</span></button>
              <button class="action-btn" onclick="finishBoardingVictory('swap_flagship_sink')"><span>⚓ Tauschen &amp; altes aufgeben</span><span>✓</span></button>
            </div>
          </div>
        </div>
        <div class="grid-2">
          <button class="primary-btn" onclick="finishBoardingVictory('plunder')">📦 Ladung plündern (${goodObj ? td(goodObj, 'name') : ''})</button>
          <button class="action-btn" style="justify-content:center;" onclick="finishBoardingVictory('salvage')">🔨 Ausschlachten (+Gold, +2 🪵 &amp; Reparatur)</button>
        </div>
      `;
    }
  } else {
    html += `<div style="text-align:right;"><button class="action-btn danger" onclick="executeBoardingTurn('retreat')">⛓️ Niederlage hinnehmen</button></div>`;
  }

  document.getElementById('boardingBody').innerHTML = html;
};

// ============================================================================
// SCHATZBUCHT, BEIBOOT-KÜSTENLANDGANG & NACHT-EINSCHLEICHEN IN FEINDHÄFEN [G]
// ============================================================================
window.openLandExploration = function() {
  // 1. Schatzkarte am Ort vorhanden (BUGFIX: Öffnet sich AUCH nach site.looted zum Proviantsammeln!)
  if (currentExploreSite && currentExploreSite.mapBought) {
    currentExploreSite.discovered = true;
    if (currentExploreSite.forageLeft === undefined) currentExploreSite.forageLeft = 2;
    if (window.startTreasureTextAdventure && (!window.treasureAdvState || window.treasureAdvState.siteId !== currentExploreSite.id)) {
      startTreasureTextAdventure(currentExploreSite);
    }
    document.getElementById('exploreOverlay').classList.add('active');
    if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
    renderExplorationModal();
    return;
  }

  // 2. Einschleichen in nahen Feindhafen per Beiboot!
  if (window.nearHostilePortForSneak) {
    openSneakHostilePortModal(window.nearHostilePortForSneak);
    return;
  }

  // 3. Allgemeiner Beiboot-Landgang an jeder beliebigen Küste zum Proviantsuchen!
  if (window.nearAnyCoastForRowboat) {
    openRowboatShoreForageModal(window.nearAnyCoastForRowboat);
  }
};

window.openSneakHostilePortModal = function(port) {
  if (window.applySceneBackgroundToModal) applySceneBackgroundToModal('exploreOverlay', 'exp_catacombs');
  const night = isNightTime();
  const dStats = getCaptainDuelStats();
  const chance = Math.min(0.92, (night ? 0.65 : 0.28) + game.captain.skills.seamanship * 0.05 + (dStats.sneakBonus || 0));
  document.getElementById('exploreTitle').textContent = `🕶️ Heimlich nach ${port.name} einschleichen`;
  document.getElementById('exploreBody').innerHTML = `
    <div class="card-box" style="background:#09131d; border-color:#38bdf8; margin-bottom:12px;">
      <div class="card-title">🚣 Im Ruderboot unter den Kanonen der Festung hindurch</div>
      <div class="card-desc" style="font-size:13px; color:#e2e8f0; margin-top:6px;">
        Die Garnison von <strong>${port.name}</strong> (${td(FACTIONS[port.faction], 'short')}) ist dir feindlich gesinnt. Du kannst jedoch versuchen, mit gedämpften Rudern über die Kaimauer in die Stadt zu schleichen!<br><br>
        🕒 Tageszeit: <strong>${night ? '🌙 Schutz der Dunkelheit (+37% Chance!)' : '☀️ Hellerlichter Tag (Hohes Entdeckungsrisiko!)'}</strong><br>
        🎯 Geschätzte Erfolgschance: <strong style="color:${chance >= 0.6 ? '#2ecc71' : '#f59e0b'};">${Math.round(chance * 100)}%</strong>
      </div>
    </div>
    <button class="primary-btn" style="width:100%;" onclick="attemptSneakIntoPort('${port.id}', ${chance})">
      🕶️ Jetzt im Beiboot an Land schleichen (${Math.round(chance * 100)}%)
    </button>
  `;
  document.getElementById('exploreOverlay').classList.add('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
};

window.attemptSneakIntoPort = function(portId, chance) {
  const port = PORTS.find(p => p.id === portId);
  if (!port) return;
  document.getElementById('exploreOverlay').classList.remove('active');

  if (Math.random() < chance) {
    SoundFX.play('card');
    logEvent(`🕶️ Unbemerkt in die Gassen von ${port.name} geschlichen! Du hast Zugang zu Taverne, Kontor & Gouverneur.`);
    window.currentPort = port;
    openPortModal();
  } else {
    SoundFX.play('cannon');
    player.woundedCrew = Math.min(player.crew - 2, (player.woundedCrew || 0) + 2);
    player.hull = Math.max(15, player.hull - 18);
    logEvent(`🚨 Stadtwachen schlagen Alarm! Unter Musketenfeuer rudert ihr zum Schiff zurück (-18 Rumpf, +2 Verletzte)!`);
    updateHUD();
    if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
  }
};

window.openRowboatShoreForageModal = function(land) {
  if (window.applySceneBackgroundToModal) applySceneBackgroundToModal('exploreOverlay', 'shipyard_beach');
  player.shoreForageCooldowns = player.shoreForageCooldowns || {};
  const cd = player.shoreForageCooldowns[land.name] || 0;
  const canForage = (game.time || 0) >= cd;
  const free = Math.max(0, Math.floor(getMaxCargo() - getCargoTotal()));

  document.getElementById('exploreTitle').textContent = `🚣 Beiboot-Landgang: ${land.name}`;
  document.getElementById('exploreBody').innerHTML = `
    <div class="card-box" style="background:#09131d; border-color:#2ecc71; margin-bottom:12px;">
      <div class="card-title">🏝️ Unbewohnten Küstenabschnitt nach Frischwasser, Wild &amp; Kokosnüssen absuchen</div>
      <div class="card-desc" style="font-size:13px; color:#cbd5e1; margin-top:6px;">
        Dein Schiff ankert vor <strong>${escapeHtml(land.name)}</strong>. Ein Beiboot-Trupp kann am Strand Proviant (🍖), Heilkräuter/Limetten (🍋) und Treibholz (🪵) sammeln.<br>
        📦 Freier Laderaum: <strong>${free}</strong>
      </div>
    </div>
    <button class="primary-btn" style="width:100%;" ${!canForage || free <= 0 ? 'disabled' : ''} onclick="executeRowboatShoreForage('${escapeHtml(land.name)}')">
      ${!canForage ? '⏳ Dieser Küstenstreifen wurde kürzlich bereits abgesucht' : (free <= 0 ? '📦 Laderaum voll!' : '🚣 Beiboot an Land rudern & Vorräte sammeln')}
    </button>
  `;
  document.getElementById('exploreOverlay').classList.add('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
};

window.executeRowboatShoreForage = function(landName) {
  player.shoreForageCooldowns = player.shoreForageCooldowns || {};
  player.shoreForageCooldowns[landName] = (game.time || 0) + 4800;

  const mods = getOfficerModifiers();
  const mult = 1.0 + (mods.forageBonus || 0);
  let free = Math.max(0, Math.floor(getMaxCargo() - getCargoTotal()));
  const fGain = Math.min(free, Math.max(2, Math.round((2 + Math.random() * 3) * mult)));
  free -= fGain;
  const mGain = Math.min(free, Math.round((1 + Math.random() * 1.5) * mult));
  free -= mGain;
  const tGain = Math.min(free, Math.random() < 0.6 ? 1 : 0);

  if (fGain > 0) player.cargo.food = (player.cargo.food || 0) + fGain;
  if (mGain > 0) player.cargo.medicine = (player.cargo.medicine || 0) + mGain;
  if (tGain > 0) player.cargo.timber = (player.cargo.timber || 0) + tGain;
  if (player.disease === 'scurvy') player.disease = null;

  SoundFX.play('coin');
  logEvent(`🚣 Landgang erfolgreich: +${fGain}× 🍖 Proviant, +${mGain}× 🍋 Limetten${tGain ? ' & +1× 🪵 Holz' : ''} an Bord geholt!`);
  closeLandExploration();
};

window.closeLandExploration = function() {
  document.getElementById('exploreOverlay').classList.remove('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
  updateHUD();
};

window.performLandAction = function(act) {
  if (!currentExploreSite) return;
  const site = currentExploreSite;
  const mods = getOfficerModifiers();

  if (act === 'forage') {
    if ((site.forageLeft || 0) <= 0) return;
    const free = Math.max(0, Math.floor(getMaxCargo() - getCargoTotal()));
    if (free <= 0) return;
    site.forageLeft--;

    const mult = 1.0 + (mods.forageBonus || 0);
    const fAdd = Math.min(free, Math.max(1, Math.round((2 + Math.random() * 3) * mult)));
    if (fAdd > 0) player.cargo.food = (player.cargo.food || 0) + fAdd;
    const mAdd = Math.min(Math.max(0, free - fAdd), Math.round((1 + Math.random() * 2) * mult));
    if (mAdd > 0) player.cargo.medicine = (player.cargo.medicine || 0) + mAdd;

    if (player.disease === 'scurvy') player.disease = null;
    const msg = `🏝️ Strandsuche: +${fAdd} 🍖 & +${mAdd} 🍋 gesammelt (${site.forageLeft}× übrig)`;
    if (window.treasureAdvState && window.treasureAdvState.siteId === site.id) {
      window.treasureAdvState.log.unshift(msg);
    }
    SoundFX.play('coin');
    logEvent(msg);
  }
  updateHUD();
  renderExplorationModal();
};

window.renderExplorationModal = function() {
  if (!currentExploreSite) return;
  document.getElementById('exploreTitle').textContent = `🏝️ ${td(currentExploreSite, 'name')}`;
  if (typeof window.renderTreasureAdventureHTML === 'function') {
    document.getElementById('exploreBody').innerHTML = renderTreasureAdventureHTML(currentExploreSite);
  }
};

window.openHideoutModal = function() {
  if (!currentBasePlot) return;
  document.getElementById('hideoutOverlay').classList.add('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
  renderHideoutModal();
  if (game.hideout && game.hideout.foundedPlotId === currentBasePlot.id && window.triggerPortAutoSave) {
    triggerPortAutoSave(game.hideout.customBaseName || td(currentBasePlot, 'name'));
  }
};

window.closeHideoutModal = function() {
  document.getElementById('hideoutOverlay').classList.remove('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
  updateHUD();
};

window.hideoutBankAction = function(isDeposit, amount) {
  ensureHideoutStructure();
  if (!game.hideout.foundedPlotId) return;
  if (isDeposit) {
    const amt = Math.min(amount, game.gold);
    if (amt <= 0) return;
    game.gold -= amt; game.hideout.bankGold = (game.hideout.bankGold || 0) + amt;
  } else {
    const amt = Math.min(amount, game.hideout.bankGold || 0);
    if (amt <= 0) return;
    game.hideout.bankGold -= amt; game.gold += amt;
  }
  SoundFX.play('coin');
  updateHUD(); renderHideoutModal();
};

window.useHideoutCareenageRepair = function() {
  if (!game.hideout.foundedPlotId || getHideoutBuildingLevel('careenage') <= 0) return;
  player.hull = player.maxHull; player.sail = player.maxSail;
  player.onFire = 0; player.ghostFire = 0;
  (player.fleet || []).forEach(esc => { esc.hull = esc.maxHull; esc.sail = esc.maxSail; esc.crew = esc.maxCrew; });
  if (game.hideout.maxFortHp > 0) game.hideout.fortHp = game.hideout.maxFortHp;
  SoundFX.play('coin');
  updateHUD(); renderHideoutModal();
};

window.claimHideoutRecruitsAndFeast = function() {
  if (!game.hideout.foundedPlotId || getHideoutBuildingLevel('tavern') <= 0) return;
  const taken = Math.min(game.hideout.recruitsAvail || 0, Math.max(0, player.maxCrew - Math.ceil(player.crew)));
  if (taken > 0) { player.crew += taken; game.hideout.recruitsAvail -= taken; }
  player.morale = 100;
  player.officers.forEach(o => o.morale = 100);
  SoundFX.play('coin');
  updateHUD(); renderHideoutModal();
};

window.updateShipDiseases = function() {
  const mods = getOfficerModifiers();
  const resist = Math.max(-0.5, Math.min(0.85, mods.diseaseResist || 0));
  if ((player.woundedCrew || 0) > 0) {
    let healAmt = 0.35 + (mods.woundedHealRate || 0) * 0.5;
    if ((player.cargo.medicine || 0) >= 0.5) { player.cargo.medicine = Math.round((player.cargo.medicine - 0.2) * 10) / 10; healAmt += 0.8; }
    player.woundedCrew = Math.max(0, Math.round((player.woundedCrew - healAmt) * 10) / 10);
  }
  if (player.disease) {
    const dis = DISEASES[player.disease];
    if ((player.cargo.medicine || 0) >= 1) {
      player.cargo.medicine = Math.round((player.cargo.medicine - 0.5) * 10) / 10;
      if (Math.random() < 0.45 + Math.max(0, resist) * 0.5) { player.disease = null; return; }
    } else if (resist > 0.3 && Math.random() < resist * 0.4) { player.disease = null; return; }
    player.crew = Math.max(3, player.crew - Math.max(0.4, dis.crewLossRate * (1 - resist * 0.6)));
    player.morale = Math.max(10, player.morale - dis.moraleLoss * (1 - resist * 0.5));
    clampCrewEquipmentToCrewSize();
  } else if (!(game.captain && game.captain.isGhostCaptain)) {
    let risk = 0.038 * (1 - resist);
    if ((player.cargo.medicine || 0) > 0) risk *= 0.25;
    if ((player.cargo.food || 0) <= 2) risk += 0.04;
    if (Math.random() < risk) {
      const keys = Object.keys(DISEASES);
      player.disease = keys[Math.floor(Math.random() * keys.length)];
    }
  }
};