// ============================================================================
// engine_sim.js - Teil 2 der Engine: Symmetrischer Backbord/Steuerbord-Fix,
//                 Singleplayer-Pause in Häfen/Dialogen, Meeresströmungen,
//                 Rationsstufen, Live-Crew-Regler, ruhigere Leuchttürme & Beiboot
// ============================================================================

window.isAnyModalOverlayOpen = function() {
  const modalIds = [
    'optionsOverlay', 'portOverlay', 'captainOverlay', 'mapOverlay',
    'boardingOverlay', 'exploreOverlay', 'hideoutOverlay', 'villageOverlay',
    'talkOverlay', 'blackjackOverlay', 'zilchOverlay', 'logbookOverlay',
    'enclaveOverlay', 'mpLobbyOverlay', 'shipInvOverlay', 'gameOverOverlay'
  ];
  return modalIds.some(id => {
    const el = document.getElementById(id);
    return el && el.classList.contains('active');
  });
};

window.syncSingleplayerPauseState = function() {
  if (!window.game) return;
  if (game.isMultiplayer) {
    game.paused = false;
  } else {
    game.paused = isAnyModalOverlayOpen() || !!game.isGameOver;
  }
};

window.isSimulationHalted = function() {
  if (!window.game || game.isGameOver) return true;
  const mainEl = document.getElementById('mainMenuOverlay');
  if (mainEl && !mainEl.classList.contains('hidden')) return true;
  const introEl = document.getElementById('introOverlay');
  if (introEl && introEl.classList.contains('active')) return true;
  if (!game.isMultiplayer && isAnyModalOverlayOpen()) return true;
  return false;
};

window.isShipProtectedByBoarding = function(ship) {
  if (!ship) return false;
  return !!(ship.inBoardingLock || (ship.boardingInvulnTimer && ship.boardingInvulnTimer > 0));
};

window.toggleFireCadence = function() {
  if (!player) return;
  player.fireCadence = player.fireCadence === 'broadside' ? 'single' : 'broadside';
  const titleEl = document.getElementById('fireCadenceTitle');
  const subEl = document.getElementById('fireCadenceSub');
  if (player.fireCadence === 'broadside') {
    titleEl.textContent = t('broadside');
    subEl.textContent = t('broadsideSub');
  } else {
    titleEl.textContent = t('singleFire');
    subEl.textContent = t('singleSub');
  }
};

window.cycleFalseFlag = function() {
  if (!game || isSimulationHalted()) return;
  const order = [null, 'spain', 'england', 'france', 'netherlands', 'denmark'];
  const curIdx = order.indexOf(player.falseFlag);
  player.falseFlag = order[(curIdx + 1) % order.length];

  const titleEl = document.getElementById('flagTitle');
  const subEl = document.getElementById('flagSub');
  if (!player.falseFlag) {
    titleEl.textContent = t('ownFlag');
    subEl.textContent = t('noDisguise');
  } else {
    const fac = FACTIONS[player.falseFlag];
    titleEl.textContent = `🚩 [T] ${td(fac, 'short')}`;
    subEl.textContent = '>240px';
  }
};

window.extinguishShipFire = function() {
  if (!player) return;
  if (player.onFire > 0) {
    player.onFire = 0;
    logEvent('🪣 Deckbrand gelöscht!');
  }
  if (player.ghostFire > 0) {
    player.ghostFire = Math.floor(player.ghostFire * 0.45);
    logEvent('🟢 Grünes Geisterfeuer trotzt dem Löschwasser – nur abgeschwächt!');
  }
  updateHUD();
};

window.useSpecialEquipmentAction = function() {
  if (!game || isSimulationHalted() || !player.specialEquipment || isShipProtectedByBoarding(player)) return;
  if (player.specialEquipCooldown > 0) return;

  const eqId = player.specialEquipment;
  if (eqId === 'powder_barrels') {
    player.specialEquipCooldown = 780;
    const bx = player.x - Math.cos(player.angle) * (player.length * 0.65);
    const by = player.y - Math.sin(player.angle) * (player.length * 0.65);
    floatingBarrels.push({ x: bx, y: by, life: 600, radius: 14, dmg: 140 });
    SoundFX.play('hit');
  } else if (eqId === 'bow_chasers') {
    const mods = getOfficerModifiers();
    const reloadUpgradeLvl = (player.upgrades && player.upgrades.reload) || 0;
    const finalBowCooldown = Math.max(210, Math.round(560 * Math.pow(0.95, reloadUpgradeLvl) / Math.max(0.5, 1 + (mods.reloadMult || 0))));

    player.specialEquipCooldown = finalBowCooldown;
    const cStats = getPlayerEquippedCannonStats();
    SoundFX.play(cStats.hasGhostCannons ? 'ghost_cannon' : 'cannon');
    triggerWorldScreenShake(3.8);

    const fx = player.x + Math.cos(player.angle) * (player.length * 0.58);
    const fy = player.y + Math.sin(player.angle) * (player.length * 0.58);
    bullets.push({
      x: fx, y: fy,
      vx: Math.cos(player.angle) * 10.2, vy: Math.sin(player.angle) * 10.2,
      owner: player, ownerFaction: 'player', isBroadsideShot: false,
      isGhostShot: cStats.hasGhostCannons, ghostFireChance: cStats.ghostFireChance || 0,
      ammoType: 'round',
      damage: cStats.avgDamage * 2.1 * (1 + (((player.upgrades && player.upgrades.damage) || 0) * 0.03) + (mods.damageMult || 0)),
      hullMult: 1.1, sailMult: 0.95, crewMult: 0.3,
      radius: 6.2, spin: 0,
      life: Math.round(145 * player.rangeBonus * cStats.avgRangeMult)
    });
  } else if (eqId === 'french_studsails') {
    player.specialEquipCooldown = 900;
    player.speedBoostTimer = 240;
    SoundFX.play('sail_flap');
  } else if (eqId === 'dutch_cargo_crane') {
    player.specialEquipCooldown = 540;
    let pulled = 0;
    flotsam.forEach(f => {
      if (Math.hypot(f.x - player.x, f.y - player.y) <= 560) {
        f.x = player.x + (Math.random() - 0.5) * 12;
        f.y = player.y + (Math.random() - 0.5) * 12;
        pulled++;
      }
    });
    SoundFX.play('sail_flap');
    logEvent(pulled > 0 ? `🏗️ WIC-Ladekran hievt ${pulled} Treibgut-Ladung(en) an Bord!` : '🏗️ Kein Treibgut in Kran-Reichweite.');
  } else if (eqId === 'danish_oak_swivels') {
    player.specialEquipCooldown = 720;
    SoundFX.play('broadside');
    triggerWorldScreenShake(5.5);
    for (let k = 0; k < 16; k++) {
      const ang = (k / 16) * Math.PI * 2;
      bullets.push({
        x: player.x + Math.cos(ang) * 24, y: player.y + Math.sin(ang) * 24,
        vx: Math.cos(ang) * 7.0, vy: Math.sin(ang) * 7.0,
        owner: player, ownerFaction: 'player', isBroadsideShot: false,
        ammoType: 'grape', damage: 16, hullMult: 0.35, sailMult: 0.45, crewMult: 1.6,
        radius: 4.0, spin: 0, life: 36
      });
    }
  } else if (eqId === 'ghost_lantern') {
    player.specialEquipCooldown = 840;
    SoundFX.play('ghost_cannon');
    triggerWorldScreenShake(6.5);
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2;
      particles.push({ x: player.x, y: player.y, vx: Math.cos(a) * 6.5, vy: Math.sin(a) * 6.5, life: 36, maxLife: 36, size: 6, color: '#34d399', isGlow: true });
    }
    ships.forEach(s => {
      if (!isShipProtectedByBoarding(s) && Math.hypot(s.x - player.x, s.y - player.y) < 310) {
        s.ghostFire = 480; s.hull = Math.max(0, s.hull - 45); s.provokedByPlayer = true;
        spawnWorldCombatText(s.x, s.y, '🟢 -45', '#34d399', 15);
      }
    });
  } else if (eqId === 'eq_greek_fire') {
    player.specialEquipCooldown = 660;
    SoundFX.play('broadside');
    triggerWorldScreenShake(6.0);
    for (let k = 0; k < 32; k++) {
      const a = (k / 32) * Math.PI * 2;
      particles.push({ x: player.x, y: player.y, vx: Math.cos(a) * 6.8, vy: Math.sin(a) * 6.8, life: 34, maxLife: 34, size: 6.5, color: k % 2 === 0 ? '#f97316' : '#ef4444', isGlow: true });
    }
    ships.forEach(s => {
      if (!isShipProtectedByBoarding(s) && Math.hypot(s.x - player.x, s.y - player.y) < 320) {
        s.onFire = 540; s.hull = Math.max(0, s.hull - 65); s.sail = Math.max(10, s.sail - 35); s.provokedByPlayer = true;
        spawnWorldCombatText(s.x, s.y, '🔥 -65', '#f97316', 15);
      }
    });
  } else if (eqId === 'eq_smuggler_keel') {
    player.specialEquipCooldown = 720;
    player.speedBoostTimer = 280;
    SoundFX.play('sail_flap');
    for (let k = 0; k < 24; k++) {
      particles.push({
        x: player.x - Math.cos(player.angle) * 24 + (Math.random() - 0.5) * 28,
        y: player.y - Math.sin(player.angle) * 24 + (Math.random() - 0.5) * 28,
        vx: (Math.random() - 0.5) * 1.8, vy: (Math.random() - 0.5) * 1.8,
        life: 75, maxLife: 75, size: 9, grow: 0.22, color: 'rgba(148, 163, 184, 0.65)'
      });
    }
    logEvent('💨 Nebel-Rauchwand gezündet – Fluchtsprint aktiv!');
  } else if (eqId === 'eq_corsair_ram') {
    player.specialEquipCooldown = 600;
    player.speedBoostTimer = 190;
    player.speed = Math.max(player.speed, player.baseMaxSpeed * 1.45);
    SoundFX.play('horn');
    triggerWorldScreenShake(4.0);
    logEvent('⚔️ Ramm-Vorstoß! Volle Wucht voraus!');
  }
};

window.areShipsHostile = function(shipA, shipB) {
  if (isShipProtectedByBoarding(shipA) || isShipProtectedByBoarding(shipB)) return false;
  if (shipA.faction === shipB.faction && !shipA.isGhost && !shipB.isGhost) return false;

  if (shipA.isGhost || shipB.isGhost) {
    if (shipA.isGhost && shipB.isGhost) return false;
    const nonGhost = shipA.isGhost ? shipB : shipA;
    const ghost = shipA.isGhost ? shipA : shipB;
    if (nonGhost.faction === 'player') {
      const canBefriendGhosts = getPlayerReputationTier(game.reputation || 0).canEnterEnclave || !!(game.captain && game.captain.isGhostCaptain);
      return !canBefriendGhosts || !!ghost.provokedByPlayer;
    }
    return true;
  }

  if (shipA.faction === 'player' || shipB.faction === 'player') {
    const other = shipA.faction === 'player' ? shipB : shipA;
    if (other.namedCaptainId && game.captainRelations && game.captainRelations[other.namedCaptainId] !== undefined) {
      if (game.captainRelations[other.namedCaptainId] >= 25 && !other.provokedByPlayer) return false;
      if (game.captainRelations[other.namedCaptainId] <= -40) return true;
    }
    const nightMistStealth = player.ghostAbility === 'mist_cloak' && isNightTime() && Math.hypot(other.x - player.x, other.y - player.y) > 320;
    if (nightMistStealth && !other.provokedByPlayer) return false;
    if (other.isMerchant && !other.isSilverFleet && !other.isMissionTarget && !other.provokedByPlayer) return false;
    if (player.falseFlag === other.faction && !other.provokedByPlayer && !other.isBountyHunter && Math.hypot(other.x - player.x, other.y - player.y) > 230) return false;
    if ((game.reputation || 0) <= -75 && other.faction !== 'pirates' && !other.isMerchant) return true;
    return (game.rep[other.faction] || 0) < -30 || other.provokedByPlayer || other.isBountyHunter || other.isMissionTarget;
  }

  return ((FACTIONS[shipA.faction] && FACTIONS[shipA.faction].relations[shipB.faction]) || 0) < -30;
};

function updateWhirlpools() {
  if (game.time % WHIRLPOOL_CONFIG.spawnIntervalTicks === 0 && Math.random() < WHIRLPOOL_CONFIG.spawnChance) {
    spawnRandomWhirlpool();
  }
  const stormShield = (player.figurehead === 'fh_mermaid' || player.figurehead === 'fh_hydra') ? 0.62 : 1.0;

  let maxPlayerProx = 0;
  for (let i = whirlpools.length - 1; i >= 0; i--) {
    const wp = whirlpools[i];
    wp.life--;
    wp.spinAngle = (wp.spinAngle || 0) + WHIRLPOOL_CONFIG.spinRate * wp.spinDir;
    if (wp.life <= 0) { whirlpools.splice(i, 1); continue; }

    if (!isShipProtectedByBoarding(player)) {
      const dp = Math.hypot(player.x - wp.x, player.y - wp.y);
      if (dp < wp.r * 2.2) maxPlayerProx = Math.max(maxPlayerProx, 1 - dp / (wp.r * 2.2));
      if (dp < wp.r && dp > 4) {
        const pullFactor = (1 - dp / wp.r) * WHIRLPOOL_CONFIG.pullStrength * stormShield;
        const toCenter = Math.atan2(wp.y - player.y, wp.x - player.x);
        const tangent = toCenter + wp.spinDir * (Math.PI * 0.42);
        player.x += Math.cos(tangent) * pullFactor * 1.4 + Math.cos(toCenter) * pullFactor * 0.7;
        player.y += Math.sin(tangent) * pullFactor * 1.4 + Math.sin(toCenter) * pullFactor * 0.7;
        player.angle += wp.spinDir * 0.015 * (1 - dp / wp.r);

        if (dp < wp.r * 0.42 && game.time % 26 === 0) {
          const mods = getOfficerModifiers();
          const pilotFactor = Math.max(0.30, (1 - (mods.reefDamageReduction || 0)) * stormShield);
          const dmg = Math.max(2, Math.round(WHIRLPOOL_CONFIG.coreDamage * pilotFactor));
          player.hull = Math.max(0, player.hull - dmg);
          SoundFX.play('whirlpool_roar');
          triggerWorldScreenShake(5.0);
          spawnWorldCombatText(player.x, player.y, `🌀 -${dmg}`, '#38bdf8', 15);
          logEvent(t('whirlpoolWarn'));
          if (player.hull <= 0) { handlePlayerDefeatOrRansom('Dein Schiff wurde in den Schlund eines Mahlstroms gerissen!'); return; }
          updateHUD();
        }
      }
    }

    for (let j = ships.length - 1; j >= 0; j--) {
      const s = ships[j];
      if (s.isGhost || isShipProtectedByBoarding(s)) continue;
      const ds = Math.hypot(s.x - wp.x, s.y - wp.y);
      if (ds < wp.r && ds > 4) {
        const pf = (1 - ds / wp.r) * WHIRLPOOL_CONFIG.pullStrength;
        const tc = Math.atan2(wp.y - s.y, wp.x - s.x);
        s.x += Math.cos(tc) * pf * 0.85; s.y += Math.sin(tc) * pf * 0.85;
        s.angle += wp.spinDir * 0.013;
      }
    }
  }
  window.playerWhirlpoolProximity = maxPlayerProx;
}

function updateSeaMonsters() {
  if (!game || game.worldMode !== 'mythology' || (game.isMultiplayer && game.mpMode === 'deathmatch')) return;
  if (seaMonsters.length < 5 && game.time % 900 === 0) spawnSeaMonster();

  for (let i = seaMonsters.length - 1; i >= 0; i--) {
    const m = seaMonsters[i];
    m.tentaclePhase += 0.08;
    if (m.attackCooldown > 0) m.attackCooldown--;

    const dp = Math.hypot(player.x - m.x, player.y - m.y);
    if (dp < 650 && !isShipProtectedByBoarding(player)) {
      m.angle += angleDiff(Math.atan2(player.y - m.y, player.x - m.x), m.angle) * 0.05;
      m.speed = 1.4;
      if (dp < 95 && m.attackCooldown <= 0) {
        m.attackCooldown = 105;
        SoundFX.play('splinter');
        triggerWorldScreenShake(7.5);
        player.hull = Math.max(0, player.hull - 36);
        player.sail = Math.max(10, player.sail - 20);
        player.crew = Math.max(2, player.crew - 2);
        if (game.activePassenger) game.activePassenger.tookDamage = true;
        spawnWorldCombatText(player.x, player.y, '🐙 -36', '#ef4444', 16);
        if (player.hull <= 0) { handlePlayerDefeatOrRansom('Ein Riesenkrake hat dein Schiff in die Tiefe gezogen!'); return; }
        updateHUD();
      }
    } else {
      m.speed = 0.8;
      if (Math.random() < 0.02) m.angle += (Math.random() - 0.5) * 1.2;
    }

    const nx = m.x + Math.cos(m.angle) * m.speed, ny = m.y + Math.sin(m.angle) * m.speed;
    if (!getCollidingLand(nx, ny)) { m.x = Math.max(200, Math.min(WORLD_W - 200, nx)); m.y = Math.max(200, Math.min(WORLD_H - 200, ny)); }
    else m.angle += Math.PI * 0.6;
  }
}

function checkBountyHunters() {
  if (game.isMultiplayer && game.mpMode !== 'open_world') return;
  if (game.bountyCooldown > 0) { game.bountyCooldown--; return; }
  const badPersonalRep = (game.reputation || 0) <= -65;
  const hostileFactions = Object.keys(FACTIONS).filter(fk => (game.rep[fk] || 0) <= -55 || (badPersonalRep && fk !== 'pirates'));
  if (hostileFactions.length === 0 || ships.some(s => s.isBountyHunter && Math.hypot(s.x - player.x, s.y - player.y) < 2800)) {
    game.bountyCooldown = 2800; return;
  }

  const fk = hostileFactions[Math.floor(Math.random() * hostileFactions.length)];
  const spawnAngle = Math.random() * Math.PI * 2;
  const sx = Math.max(300, Math.min(WORLD_W - 300, player.x + Math.cos(spawnAngle) * 1350));
  const sy = Math.max(300, Math.min(WORLD_H - 300, player.y + Math.sin(spawnAngle) * 1350));

  if (!getCollidingLand(sx, sy) && !getShoalLand(sx, sy)) {
    spawnWorldShip({
      faction: fk, clsKey: ((game.rep[fk] || 0) < -80 || (game.reputation || 0) <= -85) ? 'frigate' : 'corvette',
      x: sx, y: sy, name: `${td(FACTIONS[fk], 'short')} – Kopfgeldjäger`, isBountyHunter: true, skipEscorts: true
    });
  }
  game.bountyCooldown = 7200;
}

window.getEffectiveModeSwitchSeconds = function() {
  const mods = getOfficerModifiers();
  const shantyBonus = hasCaptainPerk('perk_accord_shanty') ? -0.4 : 0;
  return Math.max(0.8, Math.min(5.5, 3.0 + (mods.modeSwitchSec || 0) + shantyBonus));
};

window.toggleCombatMode = function() {
  if (!game || isSimulationHalted() || player.modeTransitionTimer > 0) return;
  const frames = Math.round(getEffectiveModeSwitchSeconds() * 60);
  player.modeTransitionMax = frames;
  player.modeTransitionTimer = frames;
  player.targetCombatMode = !player.combatMode;
};

function updateModeTransition() {
  if (player.modeTransitionTimer <= 0) return;
  player.modeTransitionTimer--;

  const btn = document.getElementById('modeBtn');
  const title = document.getElementById('modeTitle');
  const sub = document.getElementById('modeSub');
  if (player.modeTransitionTimer > 0) {
    title.textContent = `⏳ ${(player.modeTransitionTimer / 60).toFixed(1)}s`;
    sub.textContent = '...';
    return;
  }
  player.combatMode = player.targetCombatMode;
  if (player.combatMode) {
    btn.classList.add('combat'); title.textContent = t('combatMode'); sub.textContent = t('combatSub'); SoundFX.play('sword');
  } else {
    btn.classList.remove('combat'); title.textContent = t('travelMode'); sub.textContent = t('travelSub');
  }
  if (window.updateHornigoldTutorialProgress) updateHornigoldTutorialProgress();
}

window.selectAmmo = function(type) {
  if (!player) return;
  const changed = player.ammoType !== type;
  player.ammoType = type;
  document.getElementById('ammoBtn1').classList.toggle('active', type === 'round');
  document.getElementById('ammoBtn2').classList.toggle('active', type === 'chain');
  document.getElementById('ammoBtn3').classList.toggle('active', type === 'grape');

  if (changed) {
    const cStats = getPlayerEquippedCannonStats();
    const ammoObj = AMMO_TYPES[type] || AMMO_TYPES.round;
    const reloadTime = Math.round(player.reloadMax * cStats.avgReloadMult * (ammoObj.reloadScale || 1.0));
    for (let i = 0; i < player.portCannons.length; i++) player.portCannons[i] = reloadTime;
    for (let i = 0; i < player.stbdCannons.length; i++) player.stbdCannons[i] = reloadTime;
    player.portFireDelay = Math.max(player.portFireDelay || 0, 45);
    player.stbdFireDelay = Math.max(player.stbdFireDelay || 0, 45);
  }
};

window.useOfficerSkill = function(skill) {
  if (!game || isSimulationHalted()) return;
  if (skill === 'salvo' && hasOfficerRole('gunner') && player.skillCooldowns.salvo <= 0) {
    for (let i = 0; i < player.portCannons.length; i++) player.portCannons[i] = 0;
    for (let i = 0; i < player.stbdCannons.length; i++) player.stbdCannons[i] = 0;
    if (player.portCannonDamage) for (let i = 0; i < player.portCannonDamage.length; i++) player.portCannonDamage[i] = 0;
    if (player.stbdCannonDamage) for (let i = 0; i < player.stbdCannonDamage.length; i++) player.stbdCannonDamage[i] = 0;
    player.skillCooldowns.salvo = 1800;
    if (!player.combatMode && player.modeTransitionTimer <= 0) toggleCombatMode();
    SoundFX.play('sword');
  }

  if (skill === 'repair' && (hasOfficerRole('carpenter') || hasOfficerRole('shipwright')) && player.skillCooldowns.repair <= 0) {
    const canFixHull = player.hull < player.maxHull && (player.cargo.timber || 0) >= 1;
    const canFixSail = player.sail < player.maxSail && (player.cargo.canvas || 0) >= 1;
    if (!canFixHull && !canFixSail) return;

    if (canFixHull) {
      const useT = Math.min(2, Math.floor(player.cargo.timber));
      player.cargo.timber = Math.round((player.cargo.timber - useT) * 10) / 10;
      player.hull = Math.min(player.maxHull, player.hull + player.maxHull * (0.22 * useT));
    }
    if (canFixSail) {
      player.cargo.canvas = Math.round((player.cargo.canvas - 1) * 10) / 10;
      player.sail = Math.min(player.maxSail, player.sail + player.maxSail * 0.45);
    }
    player.onFire = 0;
    player.ghostFire = Math.floor((player.ghostFire || 0) * 0.4);
    player.skillCooldowns.repair = 1800;
    spawnWorldCombatText(player.x, player.y, '🔨 +HP', '#2ecc71', 15);
    updateHUD();
  }
};

window.handleEscapeKeyCloseModals = function() {
  if (window.spyglassState && spyglassState.active) { toggleSpyglass(false); return true; }
  const closeMap = [
    ['shipInvOverlay', 'toggleShipInventoryModal'],
    ['mpLobbyOverlay', 'closeMultiplayerLobby'],
    ['optionsOverlay', 'closeOptionsModal'],
    ['blackjackOverlay', 'closeBlackjackModal'],
    ['zilchOverlay', 'closeZilchModal'],
    ['logbookOverlay', 'toggleLogbookModal'],
    ['enclaveOverlay', 'closeEnclaveModal'],
    ['portOverlay', 'closePortModal'],
    ['villageOverlay', 'closeVillageModal'],
    ['talkOverlay', 'closeCaptainTalkModal'],
    ['exploreOverlay', 'closeLandExploration'],
    ['hideoutOverlay', 'closeHideoutModal'],
    ['captainOverlay', 'toggleCaptainModal'],
    ['mapOverlay', 'toggleWorldMap']
  ];
  for (const [id, fn] of closeMap) {
    const el = document.getElementById(id);
    if (el && el.classList.contains('active') && typeof window[fn] === 'function') {
      window[fn]();
      return true;
    }
  }
  if (document.getElementById('boardingOverlay').classList.contains('active') && window.boardingState && boardingState.mode !== 'mutiny') {
    executeBoardingTurn('retreat');
    return true;
  }
  return false;
};

window.addEventListener('keydown', e => {
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    if (e.key === 'Escape') e.target.blur();
    if (e.key === 'Enter' && e.target.id === 'proximityShoutInput') { e.preventDefault(); sendProximityShout(); }
    return;
  }

  const k = e.key.toLowerCase();
  keys[k] = true;

  if (e.key === 'Escape') {
    if (handleEscapeKeyCloseModals()) { e.preventDefault(); return; }
  }

  if (!game || game.isGameOver || !document.getElementById('mainMenuOverlay').classList.contains('hidden')) return;

  if (k === 'i') { toggleShipInventoryModal(); return; }
  if (k === 'k') { toggleCaptainModal(); return; }
  if (k === 'm') { toggleWorldMap(); return; }
  if (k === 'l') { toggleLogbookModal(); return; }

  if (isSimulationHalted()) return;

  if (e.key === 'Enter' && !isAnyModalOverlayOpen()) {
    const shoutIn = document.getElementById('proximityShoutInput');
    if (shoutIn) { e.preventDefault(); shoutIn.focus(); return; }
  }

  if (k === 'z' && !isAnyModalOverlayOpen()) { toggleSpyglass(); return; }
  if (k === '1') selectAmmo('round');
  if (k === '2') selectAmmo('chain');
  if (k === '3') selectAmmo('grape');
  if (k === '4') useOfficerSkill('salvo');
  if (k === '5') useOfficerSkill('repair');
  if (k === 'r') useSpecialEquipmentAction();
  if (k === 'c') toggleCombatMode();
  if (k === 'n') toggleFireCadence();
  if (k === 't') cycleFalseFlag();
  if (k === 'x') extinguishShipFire();
  if (k === '+') adjustZoom(0.15);
  if (k === '-') adjustZoom(-0.15);

  if (!isAnyModalOverlayOpen()) {
    if (k === 'f') {
      if (currentPort) openPortModal();
      else if (currentVillage) openVillageModal();
      else if (currentBasePlot) openHideoutModal();
      else if (window.nearWololoShrine && window.openWololoModal) openWololoModal();
      else if (window.nearGhostEnclave) openEnclaveModal();
    }
    if (k === 'h' && currentBasePlot) openHideoutModal();
    if (k === 'v' && currentSiegePort) startFortSiegeBoarding();
    if (k === 'b' && currentBoardTarget) startBoardingCombat();
    if (k === 'u' && currentTalkTarget) requestCaptainHail();
    if (k === 'g' && (currentExploreSite || window.nearHostilePortForSneak || window.nearAnyCoastForRowboat)) {
      openLandExploration();
    }

    if ((k === 'w' || k === 'arrowup') && !player.inBoardingLock) {
      player.sailSetting = Math.min(3, player.sailSetting + 1);
      if (window.updateHornigoldTutorialProgress) updateHornigoldTutorialProgress();
    }
    if ((k === 's' || k === 'arrowdown') && !player.inBoardingLock) {
      player.sailSetting = Math.max(0, player.sailSetting - 1);
    }
  }
});

window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('mousedown', e => {
  if (e.button === 0) mouse.left = true;
  if (e.button === 2) mouse.right = true;
});
canvas.addEventListener('mouseup', e => {
  if (e.button === 0) mouse.left = false;
  if (e.button === 2) mouse.right = false;
});

window.angleDiff = function(target, current) {
  let d = target - current;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};

function getWindMultiplier(shipAngle, hasNavigator = false, ghostSailLvl = 0) {
  const diff = Math.abs(angleDiff(shipAngle, wind.angle));
  const beamBonus = Math.sin(diff) * 0.35;
  const minHeadwind = Math.min(0.75, (hasNavigator ? 0.54 : 0.34) + ghostSailLvl * 0.10);
  const headwindPenalty = ((1 + Math.cos(diff)) / 2) * (1.0 - minHeadwind);
  return (minHeadwind + headwindPenalty + beamBonus) * (0.75 + wind.speed * 0.25);
}

// ============================================================================
// SYMMETRISCH ABGEDICHTETES BACKBORD- & STEUERBORD-KANONENFEUER (Kein Spam!)
// ============================================================================
window.fireShipCannonOrBroadside = function(ship, side, isPlayerControlled, forceBroadside = false) {
  if (isShipProtectedByBoarding(ship)) return false;
  if (!ship.combatMode || ship.cannonExtendPct < 0.75) return false;
  if (ship === player && player.modeTransitionTimer > 0) return false;

  const isPlayerShip = ship === player;
  const cStats = isPlayerShip ? getPlayerEquippedCannonStats() : null;

  // Exakte Aufteilung der bemannten Kanonen auf Backbord (-1) & Steuerbord (+1)
  let sideCap = ship.cannonsPerSide;
  if (isPlayerShip) {
    const totalManned = cStats.mannedCount;
    sideCap = side === -1 ? Math.ceil(totalManned / 2) : Math.floor(totalManned / 2);
    sideCap = Math.min(ship.cannonsPerSide, sideCap);
  } else {
    sideCap = getShipMannedCannonsPerSide(ship, false);
  }

  if (sideCap <= 0) return false;

  // Sicherstellen, dass Array-Längen exakt zu cannonsPerSide passen!
  while (ship.portCannons.length < ship.cannonsPerSide) ship.portCannons.push(0);
  while (ship.stbdCannons.length < ship.cannonsPerSide) ship.stbdCannons.push(0);

  const ammo = AMMO_TYPES[ship.ammoType || 'round'] || AMMO_TYPES.round;
  const isGrapeShot = ammo.id === 'grape';
  const arr = side === -1 ? ship.portCannons : ship.stbdCannons;
  const dmgArr = side === -1 ? (ship.portCannonDamage || []) : (ship.stbdCannonDamage || []);
  // Kartätschen (Schrot) feuern IMMER als geschlossene Breitseiten-Salve mit striktem Nachlade-Cooldown (kein Dauerfeuer-Spam mehr möglich!)
  const isBroadside = forceBroadside || isGrapeShot || (isPlayerShip && player.fireCadence === 'broadside');

  const indicesToFire = [];
  if (isBroadside) {
    for (let i = 0; i < sideCap; i++) {
      if ((arr[i] || 0) <= 0 && (dmgArr[i] || 0) <= 0) indicesToFire.push(i);
    }
    // Bei Kartätschen mindestens die halbe bemannte Batterie abwarten, damit nicht einzelne nachgeladene Rohre gespammt werden!
    const minReqVolley = isGrapeShot ? Math.max(1, Math.ceil(sideCap * 0.5)) : 1;
    if (indicesToFire.length < minReqVolley) return false;
  } else {
    const startIdx = (side === -1 ? (ship.nextPortIndex || 0) : (ship.nextStbdIndex || 0)) % sideCap;
    for (let offset = 0; offset < sideCap; offset++) {
      const idx = (startIdx + offset) % sideCap;
      if ((arr[idx] || 0) <= 0 && (dmgArr[idx] || 0) <= 0) {
        indicesToFire.push(idx);
        if (side === -1) ship.nextPortIndex = (idx + 1) % sideCap;
        else ship.nextStbdIndex = (idx + 1) % sideCap;
        break;
      }
    }
    if (indicesToFire.length === 0) return false;
  }

  const ammoReloadMult = ammo.reloadScale || 1.0;
  const effectiveReload = isPlayerShip
    ? Math.max(135, Math.round(ship.reloadMax * cStats.avgReloadMult * ammoReloadMult))
    : Math.max(135, Math.round(ship.reloadMax * ammoReloadMult));
  indicesToFire.forEach(idx => { arr[idx] = effectiveReload; });
  if (isGrapeShot) {
    // Alle übrigen Rohre derselben Seite erhalten ebenfalls Sperrzeit, um Schrot-Spam komplett auszuschließen
    for (let i = 0; i < sideCap; i++) arr[i] = Math.max(arr[i] || 0, Math.round(effectiveReload * 0.85));
    if (side === -1) ship.portFireDelay = Math.max(ship.portFireDelay || 0, 150);
    else ship.stbdFireDelay = Math.max(ship.stbdFireDelay || 0, 150);
  }

  const isGhostVolley = !!(ship.isGhost || (isPlayerShip && cStats.hasGhostCannons));
  const ghostFireChance = ship.isGhost ? 0.35 : (isPlayerShip ? (cStats.ghostFireChance || 0) : 0);

  if (isPlayerShip) {
    SoundFX.play(isGhostVolley ? 'ghost_cannon' : (isBroadside && indicesToFire.length >= 2 ? 'broadside' : 'cannon'));
    triggerWorldScreenShake(isBroadside && indicesToFire.length >= 2 ? Math.min(8.5, 2.6 + indicesToFire.length * 0.85) : 2.0);
    if (player.falseFlag) {
      player.falseFlag = null;
      document.getElementById('flagTitle').textContent = t('ownFlag');
      document.getElementById('flagSub').textContent = '!';
    }
  } else if (isPlayerControlled && Math.hypot(ship.x - player.x, ship.y - player.y) < 1100) {
    SoundFX.play('cannon');
  }

  const usableLength = ship.length * 0.66;
  const normalAngle = ship.angle + side * (Math.PI / 2);
  const forwardX = Math.cos(ship.angle), forwardY = Math.sin(ship.angle);
  const sideX = Math.cos(normalAngle), sideY = Math.sin(normalAngle);

  const pellets = ammo.pellets;
  const mods = isPlayerShip ? getOfficerModifiers() : { damageMult: 0, rangeMult: 0 };

  const rawBaseDmg = isPlayerShip ? cStats.avgDamage : (ship.baseDamage || ship.dmg || 14);
  const upgradeDmgBonus = isPlayerShip ? (((player.upgrades && player.upgrades.damage) || 0) * 0.03) : 0;
  const dmgMultiplier = Math.max(0.5, 1.0 + (mods.damageMult || 0) + upgradeDmgBonus);
  const rangeMult = isPlayerShip
    ? (ammo.id === 'grape' ? 1.0 : ((player.rangeBonus || 1) * cStats.avgRangeMult + (mods.rangeMult || 0)))
    : 1.0;

  for (const chosenIndex of indicesToFire) {
    const tPos = ship.cannonsPerSide === 1 ? 0 : (chosenIndex / (ship.cannonsPerSide - 1)) - 0.5;
    const spawnX = ship.x + forwardX * (tPos * usableLength) + sideX * (ship.width * 0.58);
    const spawnY = ship.y + forwardY * (tPos * usableLength) + sideY * (ship.width * 0.58);
    const baseFan = tPos * 0.08;

    for (let p = 0; p < pellets; p++) {
      const pelletAngleOffset = pellets === 1 ? (Math.random() - 0.5) * ammo.spread : ((p / (pellets - 1)) - 0.5) * ammo.spread + (Math.random() - 0.5) * 0.04;
      const fireAngle = normalAngle + baseFan + pelletAngleOffset;
      const bSpeed = ammo.speed * (0.96 + Math.random() * 0.08);

      bullets.push({
        x: spawnX, y: spawnY,
        vx: Math.cos(fireAngle) * bSpeed + forwardX * (ship.speed * 0.25),
        vy: Math.sin(fireAngle) * bSpeed + forwardY * (ship.speed * 0.25),
        owner: ship, ownerFaction: isPlayerControlled ? 'player' : ship.faction,
        isBroadsideShot: isBroadside && indicesToFire.length >= 2,
        isGhostShot: isGhostVolley, ghostFireChance,
        ammoType: ammo.id,
        damage: (rawBaseDmg * dmgMultiplier) / (pellets > 1 ? 2.4 : 1),
        hullMult: ammo.hullMult, sailMult: ammo.sailMult, crewMult: ammo.crewMult,
        radius: ammo.id === 'grape' ? 3.5 : 5.2,
        spin: Math.random() * Math.PI * 2,
        life: Math.floor(ammo.life * rangeMult)
      });
    }

    particles.push({ x: spawnX + sideX * 4, y: spawnY + sideY * 4, vx: sideX * 1.4, vy: sideY * 1.4, life: 9, maxLife: 9, size: 9.5, color: isGhostVolley ? '#6ee7b7' : '#fef08a', isGlow: true });
    for (let k = 0; k < 5; k++) {
      const pAngle = normalAngle + (Math.random() - 0.5) * 0.65;
      particles.push({
        x: spawnX, y: spawnY,
        vx: Math.cos(pAngle) * (0.9 + Math.random() * 1.8) + Math.cos(wind.angle) * 0.35,
        vy: Math.sin(pAngle) * (0.9 + Math.random() * 1.8) + Math.sin(wind.angle) * 0.35,
        life: 32 + Math.random() * 20, maxLife: 52, size: 5 + Math.random() * 4.5, grow: 0.16,
        color: isGhostVolley ? 'rgba(52, 211, 153, 0.55)' : 'rgba(226, 232, 240, 0.62)'
      });
    }
  }
  return true;
}

function hitRotatedShip(bx, by, bRadius, ship, hitboxScale = 0.88) {
  const dx = bx - ship.x, dy = by - ship.y;
  const cos = Math.cos(-ship.angle), sin = Math.sin(-ship.angle);
  return Math.abs(dx * cos - dy * sin) <= (ship.length * 0.5) * hitboxScale + bRadius &&
         Math.abs(dx * sin + dy * cos) <= (ship.width * 0.5) * hitboxScale + bRadius;
}

function applyProjectileDamage(target, proj) {
  if (isShipProtectedByBoarding(target)) return;
  const isPlayerTarget = target === player;
  const mods = isPlayerTarget ? getOfficerModifiers() : { crewLossReduction: 0 };
  const surgeonFactor = Math.max(0.25, 1.0 - (mods.crewLossReduction || 0));

  // Fokus-Feuer-Dämpfung (Diminishing Returns, wenn mehrere KI-Schiffe binnen 2s auf den Spieler treffen!)
  let focusMult = 1.0;
  if (isPlayerTarget && proj.owner && proj.owner !== player) {
    player.recentAttackers = (player.recentAttackers || []).filter(a => (game.time - a.tick) <= 120);
    const existing = player.recentAttackers.find(a => a.ref === proj.owner);
    if (existing) existing.tick = game.time;
    else player.recentAttackers.push({ ref: proj.owner, tick: game.time });
    const numAtk = player.recentAttackers.length;
    if (numAtk === 2) focusMult = 0.75;
    else if (numAtk >= 3) focusMult = 0.55;
  }

  const hullDmg = proj.damage * proj.hullMult * focusMult;
  const sailDmg = proj.damage * proj.sailMult * focusMult;
  const crewDmg = (proj.damage * proj.crewMult) * 0.25 * surgeonFactor * focusMult;

  target.hull = Math.max(0, target.hull - hullDmg);
  target.sail = Math.max(10, target.sail - sailDmg);
  target.crew = Math.max(2, target.crew - crewDmg);

  if (isPlayerTarget) {
    if (game.activePassenger && hullDmg >= 5) game.activePassenger.tookDamage = true;
    triggerWorldScreenShake(Math.min(9.5, 2.2 + hullDmg * 0.16));
    SoundFX.play(hullDmg > 16 ? 'splinter' : 'hit');
  }

  if (proj.ownerFaction === 'player' || isPlayerTarget) {
    if (proj.ammoType === 'chain' && sailDmg >= 6) spawnWorldCombatText(proj.x, proj.y, `⛵ -${Math.round(sailDmg)}`, '#74b9ff', 13);
    else if (proj.ammoType === 'grape' && crewDmg >= 0.8) spawnWorldCombatText(proj.x, proj.y, `👥 -${Math.max(1, Math.round(crewDmg))}`, '#f87171', 13);
    else if (hullDmg >= 3) spawnWorldCombatText(proj.x, proj.y, `-${Math.round(hullDmg)}`, isPlayerTarget ? '#ff7675' : (proj.isGhostShot ? '#6ee7b7' : '#fde047'), isPlayerTarget ? 15 : 13.5);
  }

  if (proj.owner === player && !isPlayerTarget && ships.includes(target)) game.playerFocusTarget = target;
  if (proj.owner && proj.owner.ghostAbility === 'soul_drain') {
    proj.owner.hull = Math.min(proj.owner.maxHull, proj.owner.hull + hullDmg * 0.18);
    target.morale = Math.max(10, (target.morale || 80) - 1.8);
  }

  if (proj.ammoType === 'round' && Math.random() < 0.20 && target.cannonsPerSide > 0) {
    target.portCannonDamage = target.portCannonDamage || initCannonsArray(target.cannonsPerSide);
    target.stbdCannonDamage = target.stbdCannonDamage || initCannonsArray(target.cannonsPerSide);
    const localY = (proj.x - target.x) * Math.sin(-target.angle) + (proj.y - target.y) * Math.cos(-target.angle);
    const dmgArr = localY < 0 ? target.portCannonDamage : target.stbdCannonDamage;
    const cIdx = Math.floor(Math.random() * target.cannonsPerSide);
    if ((dmgArr[cIdx] || 0) <= 0) dmgArr[cIdx] = (7 + Math.floor(Math.random() * 9)) * 60;
  }

  if (proj.isBroadsideShot) target.morale = Math.max(10, (target.morale || 80) - (hasCaptainPerk('perk_broadsides') ? 3.5 : 2.4));

  if (proj.ghostFireChance && Math.random() < proj.ghostFireChance) {
    target.ghostFire = 480;
  } else {
    const fireChance = (proj.owner === player && hasCaptainPerk('perk_rum_alchemy')) ? 0.14 : 0.06;
    if (proj.ammoType === 'round' && Math.random() < fireChance && !target.onFire) target.onFire = 420;
  }

  if (proj.ownerFaction === 'player' && !isPlayerTarget) {
    SoundFX.play(hullDmg > 16 ? 'splinter' : 'hit');
    if (!target.provokedByPlayer && !(player.fleet || []).includes(target)) {
      const wasFriendly = !areShipsHostile(target, player);
      target.provokedByPlayer = true;
      if (!target.isGhost && game.rep[target.faction] !== undefined) {
        game.rep[target.faction] = Math.max(-100, game.rep[target.faction] - (wasFriendly ? 12 : 6));
        if (wasFriendly) changePlayerReputation(-6);
      }
      updateHUD();
    }
  }

  for (let k = 0; k < 6; k++) {
    particles.push({
      x: proj.x, y: proj.y, vx: (Math.random() - 0.5) * 5.2, vy: (Math.random() - 0.5) * 5.2,
      life: 18 + Math.random() * 10, maxLife: 28, size: k < 3 ? 3.8 : 2.6,
      color: proj.isGhostShot ? '#34d399' : (k < 3 ? '#f59e0b' : '#92400e'), isGlow: k < 2
    });
  }
  if (isPlayerTarget) updateHUD();
}

function updateShipPhysics(ship, isPlayer) {
  const wb = getActiveWorldBounds();
  if (ship.boardingInvulnTimer && ship.boardingInvulnTimer > 0) ship.boardingInvulnTimer--;
  if (ship.inBoardingLock) { ship.speed *= 0.65; ship.angularVel = 0; return; }

  ship.cannonExtendPct += ((ship.combatMode ? 1.0 : 0.0) - ship.cannonExtendPct) * 0.10;

  if (ship.onFire > 0) {
    ship.onFire--;
    if (game.time % 20 === 0) {
      ship.hull = Math.max(2, ship.hull - 2.6); ship.sail = Math.max(10, ship.sail - 2.2); ship.crew = Math.max(2, ship.crew - 0.18);
      particles.push({ x: ship.x + (Math.random() - 0.5) * 20, y: ship.y + (Math.random() - 0.5) * 20, vx: (Math.random() - 0.5) * 1.5, vy: -1.5, life: 26, maxLife: 26, size: 5.5, color: '#ef4444', isGlow: true });
      if (isPlayer) updateHUD();
    }
  }
  if (ship.ghostFire > 0) {
    ship.ghostFire--;
    if (game.time % 18 === 0) {
      ship.hull = Math.max(2, ship.hull - 3.4); ship.sail = Math.max(10, ship.sail - 2.8); ship.crew = Math.max(2, ship.crew - 0.22);
      particles.push({ x: ship.x + (Math.random() - 0.5) * 22, y: ship.y + (Math.random() - 0.5) * 22, vx: (Math.random() - 0.5) * 1.6, vy: -1.6, life: 28, maxLife: 28, size: 6.0, color: '#10b981', isGlow: true });
      if (isPlayer) updateHUD();
    }
  }

  const sailHealthRatio = Math.max(0.15, ship.sail / ship.maxSail);
  const alloc = isPlayer && window.getLiveCrewAllocation ? getLiveCrewAllocation() : { sailCrewFactor: Math.max(0.25, ship.crew / ship.maxCrew), gunCrewFactor: Math.max(0.25, ship.crew / ship.maxCrew) };
  const mods = isPlayer ? getOfficerModifiers() : {};
  const hasNav = isPlayer && hasOfficerRole('navigator');
  const ghostSailLvl = isPlayer ? ((player.upgrades && player.upgrades.ghost_sails) || 0) : (ship.isGhost ? 2 : 0);

  const windMult = getWindMultiplier(ship.angle, hasNav, ghostSailLvl);
  const sailStageMult = isPlayer ? (ship.sailSetting / 3) : 0.85;
  const officerSpeedMult = Math.max(0.6, 1.0 + (mods.speedMult || 0));
  const travelModeBonus = ship.combatMode ? 1.0 : 1.18;
  const sprintMult = (isPlayer && player.speedBoostTimer > 0) ? 1.40 : ((!isPlayer && ship.isFleeing) ? 1.14 : 1.0);
  const moraleSpeedFactor = 0.75 + 0.25 * ((ship.morale || 80) / 100);
  const cargoWeightFactor = isPlayer ? getCargoWeightFactor() : 0.92;
  const groundedPenalty = (ship.groundedTimer && ship.groundedTimer > 0) ? 0.25 : 1.0;

  const targetSpeed = ship.baseMaxSpeed * officerSpeedMult * travelModeBonus * sprintMult * moraleSpeedFactor * cargoWeightFactor * groundedPenalty * sailStageMult * sailHealthRatio * alloc.sailCrewFactor * windMult;
  ship.speed += (targetSpeed - ship.speed) * 0.015;

  // Spitzen-Wendigkeit beschnitten (max. 0.0175 rad/Frame), damit Schiffe sich wuchtig steuern!
  const speedTurnFactor = Math.min(1.05, Math.max(0.18, ship.speed / (ship.baseMaxSpeed * 0.55)));
  const peglegPenalty = (isPlayer && hasCaptainPerk('perk_pegleg_stash')) ? -0.02 : 0;
  const officerTurnMult = Math.max(0.5, Math.min(1.30, 1.0 + (mods.turnMult || 0) + peglegPenalty));
  const maxTurn = Math.min(0.0175, ship.baseTurnRate * officerTurnMult * speedTurnFactor * (0.55 + 0.45 * alloc.sailCrewFactor));

  if (isPlayer) {
    let rudderInput = 0;
    if (!isAnyModalOverlayOpen()) {
      if (keys['a'] || keys['arrowleft']) rudderInput -= 1;
      if (keys['d'] || keys['arrowright']) rudderInput += 1;
    }
    ship.rudder += (rudderInput - ship.rudder) * 0.065;
    ship.angularVel += (ship.rudder * maxTurn - ship.angularVel) * 0.075;
    ship.angle += ship.angularVel;
  }

  if (ship.groundedTimer && ship.groundedTimer > 0) ship.groundedTimer--;

  // Meeresströmungs-Schub (Golfstrom / Karibikstrom)
  const curVec = getOceanCurrentVectorAt(ship.x, ship.y);
  const curBoost = (isPlayer && player.figurehead === 'fh_neptune') ? 1.30 : 1.0;
  const moveVx = Math.cos(ship.angle) * ship.speed + (ship.sailSetting === 0 && isPlayer ? 0 : curVec.vx * curBoost);
  const moveVy = Math.sin(ship.angle) * ship.speed + (ship.sailSetting === 0 && isPlayer ? 0 : curVec.vy * curBoost);

  const bowX = ship.x + Math.cos(ship.angle) * (ship.length * 0.65 + 22);
  const bowY = ship.y + Math.sin(ship.angle) * (ship.length * 0.65 + 22);
  const nextX = ship.x + moveVx;
  const nextY = ship.y + moveVy;

  const pilotReduction = isPlayer ? Math.min(0.80, (mods.reefDamageReduction || 0) + (hasCaptainPerk('perk_iron_keel') ? 0.45 : 0)) : 0;

  const reefHit = getCollidingCoralReef(nextX, nextY) || getCollidingCoralReef(bowX, bowY);
  if (reefHit && !ship.isGhost && ship.ghostAbility !== 'soul_drain') {
    ship.speed *= 0.55;
    if (game.time % 32 === 0 && ship.speed > 0.35) {
      const reefDmg = Math.max(3, Math.round(14 * (1 - pilotReduction)));
      ship.hull = Math.max(8, ship.hull - reefDmg);
      ship.groundedTimer = 55;
      if (isPlayer) {
        SoundFX.play('splinter'); triggerWorldScreenShake(5.0);
        spawnWorldCombatText(player.x, player.y, `🪸 -${reefDmg}`, '#ef4444', 14);
        updateHUD();
      }
    }
  }

  const shoalLand = getShoalLand(nextX, nextY) || getShoalLand(bowX, bowY);
  if (shoalLand && ship.speed > 0.65 && !ship.isGhost && (!isPlayer || !hasCaptainPerk('perk_klabautermann_tea'))) {
    ship.speed *= 0.72;
    if (game.time % 45 === 0) {
      const groundDmg = Math.max(2, Math.round(ship.speed * 5.5 * (1 - pilotReduction)));
      ship.hull = Math.max(10, ship.hull - groundDmg);
      ship.groundedTimer = 45;
      if (isPlayer) { SoundFX.play('hit'); triggerWorldScreenShake(3.2); updateHUD(); }
    }
  }

  // Echte Kollisions-Hitbox für Küsten-Leuchttürme!
  if (!(game.isMultiplayer && game.mpMode === 'deathmatch')) {
    for (const lp of PORTS) {
      if (lp.hasLighthouse && lp.lighthouseX !== undefined) {
        const dLh = Math.min(Math.hypot(nextX - lp.lighthouseX, nextY - lp.lighthouseY), Math.hypot(bowX - lp.lighthouseX, bowY - lp.lighthouseY));
        if (dLh < 30 + ship.width * 0.45) {
          const pushLh = Math.atan2(ship.y - lp.lighthouseY, ship.x - lp.lighthouseX);
          ship.x += Math.cos(pushLh) * 4.2;
          ship.y += Math.sin(pushLh) * 4.2;
          if (isPlayer && ship.speed > 0.45 && game.time % 24 === 0) {
            const lhDmg = Math.max(3, Math.round(ship.speed * 7));
            ship.hull = Math.max(8, ship.hull - lhDmg);
            SoundFX.play('hit'); triggerWorldScreenShake(4.0);
            spawnWorldCombatText(player.x, player.y, `🗼 -${lhDmg}`, '#f59e0b', 14);
            updateHUD();
          }
          ship.speed *= 0.30;
          if (!isPlayer) ship.angle = pushLh + 0.5;
          break;
        }
      }
    }
  }

  const hitLand = getCollidingLand(nextX, nextY) || getCollidingLand(bowX, bowY);
  if (hitLand) {
    const pushAngle = Math.atan2(ship.y - hitLand.cy, ship.x - hitLand.cx);
    ship.x += Math.cos(pushAngle) * 3.5;
    ship.y += Math.sin(pushAngle) * 3.5;
    ship.speed *= 0.35;
    ship.groundedTimer = 75;
    if (!isPlayer) ship.angle = pushAngle + (Math.random() - 0.5) * 0.4;
  } else {
    ship.x = Math.max(60, Math.min(wb.w - 60, nextX));
    ship.y = Math.max(60, Math.min(wb.h - 60, nextY));
  }

  const gunnerRepairBoost = (isPlayer && hasOfficerRole('gunner')) ? 1.25 : 1.0;
  ship.portCannonDamage = ship.portCannonDamage || initCannonsArray(ship.cannonsPerSide);
  ship.stbdCannonDamage = ship.stbdCannonDamage || initCannonsArray(ship.cannonsPerSide);
  for (let i = 0; i < ship.cannonsPerSide; i++) {
    if (ship.portCannonDamage[i] > 0) ship.portCannonDamage[i] = Math.max(0, ship.portCannonDamage[i] - gunnerRepairBoost);
    if (ship.stbdCannonDamage[i] > 0) ship.stbdCannonDamage[i] = Math.max(0, ship.stbdCannonDamage[i] - gunnerRepairBoost);
  }

  const doubleRationBoost = (isPlayer && player.rationLevel === 'double') ? 0.08 : 0;
  const rumAlchemyReload = (isPlayer && hasCaptainPerk('perk_rum_alchemy')) ? 0.06 : 0;
  const reloadSpeed = (0.28 + 0.72 * alloc.gunCrewFactor) * Math.max(0.5, 1.0 + (mods.reloadMult || 0) + rumAlchemyReload + doubleRationBoost) * (0.6 + 0.4 * ((ship.morale || 80) / 100));

  for (let i = 0; i < ship.portCannons.length; i++) {
    if ((ship.portCannonDamage[i] || 0) <= 0 && ship.portCannons[i] > 0) ship.portCannons[i] = Math.max(0, ship.portCannons[i] - reloadSpeed);
  }
  for (let i = 0; i < ship.stbdCannons.length; i++) {
    if ((ship.stbdCannonDamage[i] || 0) <= 0 && ship.stbdCannons[i] > 0) ship.stbdCannons[i] = Math.max(0, ship.stbdCannons[i] - reloadSpeed);
  }

  if (ship.portFireDelay > 0) ship.portFireDelay--;
  if (ship.stbdFireDelay > 0) ship.stbdFireDelay--;

  if (game.time % 5 === 0 && ship.speed > 0.25) {
    wakes.push({
      x: ship.x - Math.cos(ship.angle) * (ship.length * 0.48),
      y: ship.y - Math.sin(ship.angle) * (ship.length * 0.48),
      size: ship.width * 0.38, life: 44, maxLife: 44
    });
  }
}

function updatePlayerEscortFleet() {
  const fleet = player.fleet || [];
  if (fleet.length === 0) return;
  const admiralBonus = hasCaptainPerk('perk_admiral') ? 1.12 : 1.0;
  const order = game.fleetOrder || 'formation';
  const chosenAmmo = game.fleetAmmo || 'round';

  for (let idx = fleet.length - 1; idx >= 0; idx--) {
    const esc = fleet[idx];
    if (esc.hull <= 0) { handleEscortShipSinking(idx); continue; }

    esc.ammoType = chosenAmmo;
    esc.combatMode = (order === 'attack' || order === 'cover') ? true : player.combatMode;
    esc.cannonExtendPct += ((esc.combatMode ? 1.0 : 0.0) - esc.cannonExtendPct) * 0.12;

    const sideOffset = idx === 0 ? -1 : 1;
    const formAngle = player.angle + Math.PI + sideOffset * 0.45;
    const formDist = order === 'cover' ? 190 : (120 + idx * 35);
    const goalX = player.x + Math.cos(formAngle) * formDist, goalY = player.y + Math.sin(formAngle) * formDist;

    let bestEnemy = null, bestDist = order === 'attack' ? 880 : 520;
    if (order === 'attack' && game.playerFocusTarget && ships.includes(game.playerFocusTarget) && !isShipProtectedByBoarding(game.playerFocusTarget)) {
      const df = Math.hypot(game.playerFocusTarget.x - esc.x, game.playerFocusTarget.y - esc.y);
      if (df < 1100) { bestEnemy = game.playerFocusTarget; bestDist = df; }
    }
    if (!bestEnemy) {
      for (const s of ships) {
        if (areShipsHostile(s, player) && !isShipProtectedByBoarding(s)) {
          const d = Math.hypot(s.x - esc.x, s.y - esc.y);
          if (d < bestDist) { bestDist = d; bestEnemy = s; }
        }
      }
    }

    let desiredAngle, targetSpd;
    if (order === 'formation' && !player.combatMode) {
      desiredAngle = Math.atan2(goalY - esc.y, goalX - esc.x);
      targetSpd = Math.hypot(goalX - esc.x, goalY - esc.y) > 45 ? Math.min(3.0, player.speed * 1.18 + 0.5) : player.speed * 0.92;
    } else if (bestEnemy && esc.combatMode) {
      if (order === 'cover' && chosenAmmo !== 'grape') esc.ammoType = 'chain';
      const isEscGrape = esc.ammoType === 'grape';
      const orbitThreshold = isEscGrape ? 155 : 280;
      const maxFireDist = isEscGrape ? 245 : 480;
      const toEnemy = Math.atan2(bestEnemy.y - esc.y, bestEnemy.x - esc.x);
      desiredAngle = bestDist < orbitThreshold ? toEnemy + sideOffset * (Math.PI / 2) : toEnemy;
      targetSpd = bestDist > (isEscGrape ? 140 : 220) ? 2.15 : 1.5;

      esc.baseDamage = (esc.dmg || 14) * admiralBonus;
      if (bestDist < maxFireDist && Math.abs(angleDiff(toEnemy, esc.angle - Math.PI / 2)) < 0.40 && esc.portFireDelay <= 0) {
        if (fireShipCannonOrBroadside(esc, -1, true, isEscGrape)) esc.portFireDelay = isEscGrape ? 145 : 24;
      }
      if (bestDist < maxFireDist && Math.abs(angleDiff(toEnemy, esc.angle + Math.PI / 2)) < 0.40 && esc.stbdFireDelay <= 0) {
        if (fireShipCannonOrBroadside(esc, 1, true, isEscGrape)) esc.stbdFireDelay = isEscGrape ? 145 : 24;
      }
    } else {
      desiredAngle = Math.atan2(goalY - esc.y, goalX - esc.x);
      targetSpd = Math.hypot(goalX - esc.x, goalY - esc.y) > 45 ? Math.min(3.0, player.speed * 1.15 + 0.5) : player.speed * 0.9;
    }

    const diff = angleDiff(desiredAngle, esc.angle);
    esc.angle += Math.sign(diff) * Math.min(0.016, Math.abs(diff));
    esc.speed += (targetSpd - esc.speed) * 0.08;

    const nx = esc.x + Math.cos(esc.angle) * esc.speed, ny = esc.y + Math.sin(esc.angle) * esc.speed;
    if (!getCollidingLand(nx, ny)) { esc.x = nx; esc.y = ny; }

    for (let i = 0; i < esc.portCannons.length; i++) if (esc.portCannons[i] > 0) esc.portCannons[i] = Math.max(0, esc.portCannons[i] - 0.85);
    for (let i = 0; i < esc.stbdCannons.length; i++) if (esc.stbdCannons[i] > 0) esc.stbdCannons[i] = Math.max(0, esc.stbdCannons[i] - 0.85);
    if (esc.portFireDelay > 0) esc.portFireDelay--;
    if (esc.stbdFireDelay > 0) esc.stbdFireDelay--;
  }
}

window.handleEscortShipSinking = function(escIndex) {
  const esc = player.fleet[escIndex];
  if (!esc) return;
  SoundFX.play('splash'); triggerWorldScreenShake(6);
  spawnSinkingWreck(esc);
  const cmdOff = player.officers.find(o => o.uid === esc.commanderUid || o.assignedShipUid === esc.uid);
  if (cmdOff) { cmdOff.assignedShipUid = null; cmdOff.morale = Math.max(25, cmdOff.morale - 25); }
  player.fleet.splice(escIndex, 1);
  renderOfficerHudBar(); syncFleetOrdersUI(); updateHUD();
};

function updateCrewSuppliesAndMorale() {
  FISHING_VILLAGES.forEach(fv => {
    if (fv.raidCooldown && fv.raidCooldown > 0) {
      fv.raidCooldown--;
      if (fv.raidCooldown === 0) { fv.foodStock = 12; fv.crewAvail = 4; }
    }
  });

  if (player.sailSetting === 0 && (currentPort || currentVillage || currentBasePlot || window.nearGhostEnclave)) return;

  player.supplyTimer++;
  if (player.supplyTimer < 2200) return; // Entschleunigter Wirtschafts-Zyklus passend zur ruhigeren Spieluhr!
  player.supplyTimer = 0;

  if (window.runHideoutDailyProduction) runHideoutDailyProduction();
  if (window.payDailyCrewAndOfficerWages) payDailyCrewAndOfficerWages();

  PORTS.forEach(p => {
    p.tavernRoundBought = false;
    if (p.tavernCrewAvail !== undefined && p.tavernCrewAvail < 12 && Math.random() < 0.35) p.tavernCrewAvail++;
    if (!p.marketPricePressure) return;
    GOODS.forEach(g => {
      const cur = p.marketPricePressure[g.id] || 1.0;
      p.marketPricePressure[g.id] = cur + (1.0 - cur) * 0.08;
      if (!g.enclaveOnly && p.marketStock && p.marketStock[g.id] >= 0 && p.marketStock[g.id] < 25) {
        p.marketStock[g.id] = Math.min(40, p.marketStock[g.id] + 1);
      }
    });
  });

  const mods = getOfficerModifiers();
  const rationDef = (window.RATION_LEVELS && RATION_LEVELS[player.rationLevel]) || { foodMult: 1.0, rumMult: 1.0, moraleShift: 3 };
  const crewFactor = Math.max(0.25, player.crew / 68);
  const rumAlchemyPenalty = hasCaptainPerk('perk_rum_alchemy') ? 0.10 : 0;

  const foodNeed = Math.max(0.10, crewFactor * 0.42 * rationDef.foodMult * Math.max(0.3, 1.0 + (mods.foodConsumptionMult || 0)));
  const rumNeed  = Math.max(0.08, crewFactor * 0.32 * rationDef.rumMult * Math.max(0.3, 1.0 + (mods.rumConsumptionMult || 0) + rumAlchemyPenalty));

  if (player.cargo.food >= foodNeed) {
    player.cargo.food = Math.round((player.cargo.food - foodNeed) * 10) / 10;
  } else {
    player.cargo.food = 0;
    const starved = Math.max(1, Math.round(player.crew * 0.06));
    player.crew = Math.max(3, player.crew - starved);
    player.morale = Math.max(0, player.morale - 10);
    clampCrewEquipmentToCrewSize();
    logEvent(`💀 -${starved} 👥 (Hungersnot!)`);
  }

  const shantyRegen = hasCaptainPerk('perk_accord_shanty') ? 0.25 : 0;
  if (player.cargo.rum >= rumNeed) {
    player.cargo.rum = Math.round((player.cargo.rum - rumNeed) * 10) / 10;
    if (player.cargo.food > 0) {
      player.morale = Math.max(8, Math.min(100, player.morale + rationDef.moraleShift + ((mods.moraleRegen || 0) + shantyRegen) * 5));
    }
  } else {
    player.cargo.rum = 0;
    player.morale = Math.max(5, player.morale - 8);
  }

  if (player.morale < 18 && player.crew >= 8 && !player.inBoardingLock) {
    player.mutinyTimer = (player.mutinyTimer || 0) + 1;
    if (player.mutinyTimer >= 2) { player.mutinyTimer = 0; triggerMutinyCombat(); return; }
  } else player.mutinyTimer = 0;

  updateShipDiseases();

  player.officers.forEach(off => {
    let relShift = (player.morale - 60) * 0.06;
    player.officers.forEach(other => { if (other.uid !== off.uid) relShift += getOfficerRelation(off, other) * 0.04; });
    off.morale = Math.max(15, Math.min(100, Math.round(off.morale + relShift)));
  });

  renderOfficerHudBar();
  updateHUD();
}

function updateSharpshooterSniper() {
  const mods = getOfficerModifiers();
  if (!mods.sniperActive || !player.combatMode || isShipProtectedByBoarding(player)) return;
  if (player.sniperCooldown > 0) { player.sniperCooldown--; return; }

  let bestTarget = null, bestDist = 310;
  for (const s of ships) {
    if (areShipsHostile(s, player) && !isShipProtectedByBoarding(s) && s.crew > 3) {
      const d = Math.hypot(s.x - player.x, s.y - player.y);
      if (d < bestDist) { bestDist = d; bestTarget = s; }
    }
  }
  if (bestTarget) {
    player.sniperCooldown = 160;
    bestTarget.crew = Math.max(2, bestTarget.crew - 1.5);
    spawnWorldCombatText(bestTarget.x, bestTarget.y - 12, '🎯 -2 👥', '#fde047', 12);
  }
}

function updatePortFortressesAndLighthouses() {
  const night = isNightTime();
  for (const p of PORTS) {
    // Leuchttürme drehen sich nur nachts – und deutlich langsamer (+0.0042 statt +0.014)!
    if (p.hasLighthouse && p.lighthouseHp > 0 && night) {
      p.beamAngle = ((p.beamAngle || 0) + 0.0042) % (Math.PI * 2);
    }
    if (p.fortCooldown > 0) p.fortCooldown--;
    if (p.fortHp > 0 && p.fortHp < p.maxFortHp && game.time % 140 === 0) p.fortHp = Math.min(p.maxFortHp, p.fortHp + 8);
    if (p.fortHp <= 0 || isShipProtectedByBoarding(player) || (game.isMultiplayer && game.mpMode === 'deathmatch')) continue;

    const disguised = player.falseFlag === p.faction && Math.hypot(player.x - p.x, player.y - p.y) > 260;
    const isHostileToPlayer = ((game.rep[p.faction] || 0) < -30 || ((game.reputation || 0) <= -80 && p.faction !== 'pirates')) && !disguised;
    if (isHostileToPlayer && p.fortCooldown <= 0 && Math.hypot(player.x - p.x, player.y - p.y) < 600) {
      p.fortCooldown = 115;
      const aimAngle = Math.atan2(player.y - p.y, player.x - p.x);
      [-0.06, 0.06].forEach(spread => {
        bullets.push({
          x: p.x + Math.cos(aimAngle) * 35, y: p.y + Math.sin(aimAngle) * 35,
          vx: Math.cos(aimAngle + spread) * 8.8, vy: Math.sin(aimAngle + spread) * 8.8,
          owner: p, ownerFaction: p.faction, ammoType: 'round', damage: p.fortDmg || 48,
          hullMult: 1.0, sailMult: 0.45, crewMult: 0.3, radius: 6.5, spin: 0, life: 115
        });
      });
      SoundFX.play('cannon');
    }
  }

  // Eigene Stützpunkt-Küstenbatterie & Sternbastion (feuert auf Feinde, Kopfgeldjäger & Seemonster + kann zurückbeschossen werden!)
  if (game.hideout && game.hideout.foundedPlotId && !(game.isMultiplayer && game.mpMode === 'deathmatch')) {
    const fortLvl = window.getHideoutBuildingLevel ? getHideoutBuildingLevel('coastal_fort') : 0;
    if (fortLvl > 0) {
      const plot = BASE_PLOTS.find(b => b.id === game.hideout.foundedPlotId);
      if (plot) {
        game.hideout.maxFortHp = fortLvl * 650;
        if (game.hideout.fortHp === undefined) game.hideout.fortHp = game.hideout.maxFortHp;
        if (game.hideout.fortHp < game.hideout.maxFortHp && game.time % 120 === 0) {
          game.hideout.fortHp = Math.min(game.hideout.maxFortHp, game.hideout.fortHp + 4 * fortLvl);
        }
        if ((game.hideout.fortCooldown || 0) > 0) game.hideout.fortCooldown--;

        if (game.hideout.fortHp > 0 && (game.hideout.fortCooldown || 0) <= 0) {
          const fortOff = window.findStationedOfficerForBuilding ? findStationedOfficerForBuilding('coastal_fort') : null;
          const offMult = fortOff ? getOfficerProdEfficiencyMult(HIDEOUT_BUILDINGS.find(b => b.id === 'coastal_fort'), fortOff) : 1.0;
          const range = (540 + fortLvl * 95) * (fortOff && fortOff.roleId === 'sharpshooter' ? 1.15 : 1.0);

          let bestTarget = null, bestDist = range;
          for (const s of ships) {
            if (!isShipProtectedByBoarding(s) && areShipsHostile(s, player)) {
              const d = Math.hypot(s.x - plot.x, s.y - plot.y);
              if (d < bestDist) { bestDist = d; bestTarget = s; }
            }
          }
          if (!bestTarget) {
            for (const m of seaMonsters) {
              const d = Math.hypot(m.x - plot.x, m.y - plot.y);
              if (d < bestDist) { bestDist = d; bestTarget = m; }
            }
          }

          if (bestTarget) {
            game.hideout.fortCooldown = Math.max(55, Math.round((118 - fortLvl * 14) / Math.max(0.8, offMult)));
            const aimAng = Math.atan2(bestTarget.y - plot.y, bestTarget.x - plot.x);
            const shots = fortLvl >= 3 ? [-0.08, 0, 0.08] : [-0.05, 0.05];
            const shotDmg = Math.round((24 + fortLvl * 11) * offMult);

            shots.forEach(sp => {
              const bx = plot.x + Math.cos(aimAng) * 42;
              const by = plot.y + Math.sin(aimAng) * 42;
              bullets.push({
                x: bx, y: by,
                vx: Math.cos(aimAng + sp) * 9.2, vy: Math.sin(aimAng + sp) * 9.2,
                owner: plot, ownerFaction: 'player', isBroadsideShot: fortLvl >= 2,
                ammoType: 'round', damage: shotDmg,
                hullMult: 1.0, sailMult: 0.45, crewMult: 0.25, radius: 5.8, spin: 0, life: Math.round(range / 8.2)
              });
              particles.push({ x: bx, y: by, vx: Math.cos(aimAng) * 2, vy: Math.sin(aimAng) * 2, life: 14, maxLife: 14, size: 8, color: '#fef08a', isGlow: true });
            });
            if (Math.hypot(player.x - plot.x, player.y - plot.y) < 1500) SoundFX.play('cannon');
          }
        }
      }
    }
  }
}

function updateStorms() {
  const wb = getActiveWorldBounds();
  playerInStormNow = false;
  const wVx = Math.cos(wind.angle) * (0.50 * wind.speed), wVy = Math.sin(wind.angle) * (0.50 * wind.speed);
  const stormShield = (player.figurehead === 'fh_mermaid' || player.figurehead === 'fh_hydra') ? 0.62 : 1.0;

  for (const st of storms) {
    if (!st.isBarrier) {
      st.x = (st.x + wVx * (0.8 + st.intensity * 0.25) + wb.w) % wb.w;
      st.y = (st.y + wVy * (0.8 + st.intensity * 0.25) + wb.h) % wb.h;
    }
    st.rotAngle += 0.008 * st.intensity;

    st.lightningTimer--;
    if (st.lightningTimer <= 0) {
      st.flashAlpha = 0.92;
      st.lightningTimer = Math.max(36, Math.floor((145 - st.intensity * 42) + Math.random() * 120));
      st.boltPts = [];
      let bx = st.x + (Math.random() - 0.5) * st.r * 0.6, by = st.y - st.r * 0.35;
      st.boltPts.push([bx, by]);
      for (let seg = 0; seg < 6; seg++) { bx += (Math.random() - 0.5) * 75; by += 35 + Math.random() * 35; st.boltPts.push([bx, by]); }
      if (Math.hypot(player.x - st.x, player.y - st.y) < st.r * 1.4) {
        SoundFX.play('thunder'); triggerWorldScreenShake(3.0 * st.intensity);
      }
    }
    if (st.flashAlpha > 0) st.flashAlpha = Math.max(0, st.flashAlpha - 0.06);

    if (Math.hypot(player.x - st.x, player.y - st.y) < st.r && !isShipProtectedByBoarding(player)) {
      playerInStormNow = true;
      if (player.onFire > 0) player.onFire = 0;
      if (game.time % 22 === 0) {
        const isAnchored = player.sailSetting === 0;
        const sailFactor = st.isBarrier ? (isAnchored ? 0.60 : (0.78 + (player.sailSetting / 3) * 0.65)) : (isAnchored ? 0.16 : (0.35 + (player.sailSetting / 3) * 1.0));
        const bulkheadFactor = player.specialEquipment === 'spanish_bulkheads' ? 0.65 : 1.0;
        const ghostHullLvl = (player.upgrades && player.upgrades.ghost_hull) || 0;
        const ghostShipResist = player.ghostAbility === 'soul_drain' ? 0.35 : (player.ghostAbility === 'mist_cloak' ? 0.50 : 1.0);
        const dmgMult = st.intensity * sailFactor * bulkheadFactor * ghostShipResist * Math.pow(0.65, ghostHullLvl) * stormShield;

        player.sail = Math.max(14, player.sail - 1.2 * dmgMult * (st.isBarrier ? 2.2 : 1.0));
        player.hull = Math.max(0, player.hull - (st.isBarrier ? 4.4 : 1.0) * dmgMult);
        if (player.hull <= 0) { handlePlayerDefeatOrRansom('Dein Schiff ist im tobenden Orkan zerschellt!'); return; }
        updateHUD();
      }
    }
  }
}

function updateFloatingBarrels() {
  for (let i = floatingBarrels.length - 1; i >= 0; i--) {
    const fb = floatingBarrels[i];
    fb.life--;
    if (fb.life <= 0) { floatingBarrels.splice(i, 1); continue; }
    for (const s of ships) {
      if (!isShipProtectedByBoarding(s) && Math.hypot(s.x - fb.x, s.y - fb.y) < s.width + fb.radius + 10) {
        s.hull = Math.max(0, s.hull - fb.dmg); s.sail = Math.max(10, s.sail - fb.dmg * 0.6);
        s.speed *= 0.25; s.onFire = 240; s.provokedByPlayer = true;
        SoundFX.play('cannon'); triggerWorldScreenShake(6);
        spawnWorldCombatText(s.x, s.y, `🧨 -${fb.dmg}`, '#ef4444', 16);
        floatingBarrels.splice(i, 1); break;
      }
    }
  }
}

// ============================================================================
// HAUPT-SIMULATIONSSCHRITT (Spieluhr läuft 3.3x ruhiger!)
// ============================================================================
window.stepFixedSimulation = function() {
  if (!game || isSimulationHalted()) return;
  const wb = getActiveWorldBounds();
  game.time++;
  game.timeOfDay = (game.timeOfDay + (1 / TICKS_PER_GAME_DAY)) % 1.0;

  if (window.NetClient && NetClient.isConnected()) NetClient.tickSendInputs(keys, mouse);
  if (window.updateSpyglassSimulation) updateSpyglassSimulation(canvas, mouse);
  if (window.incomingHailRequest) {
    window.incomingHailRequest.timer--;
    if (window.incomingHailRequest.timer <= 0) { window.incomingHailRequest = null; renderIncomingHailBanner(); }
  }

  if (window.updateHideoutConstruction) updateHideoutConstruction(1 / 60);
  if (game.time % 60 === 0) syncGhostShipsToDayNight();
  if (game.time % 30 === 0 && window.updateHornigoldTutorialProgress) updateHornigoldTutorialProgress();

  if (game.customWaypoint && Math.hypot(player.x - game.customWaypoint.x, player.y - game.customWaypoint.y) < 260) {
    game.customWaypoint = null;
    logEvent('📍 Zielmarkierung erreicht!');
  }

  if (game.time % 20 === 0) updateFogOfWar(false);
  updateModeTransition();

  camera.zoom += ((camera.targetZoom || 1.0) - (camera.zoom || 1.0)) * 0.14;
  if (camera.shake > 0) { camera.shake *= 0.87; if (camera.shake < 0.2) camera.shake = 0; }

  if (player.specialEquipCooldown > 0) player.specialEquipCooldown--;
  if (player.speedBoostTimer > 0) player.speedBoostTimer--;

  if (game.activeMission && game.activeMission.type === 'recon') {
    const tp = PORTS.find(p => p.id === game.activeMission.targetPortId);
    if (tp && Math.hypot(player.x - tp.x, player.y - tp.y) < 460) {
      const ms = game.activeMission;
      game.gold += ms.rewardGold;
      game.rankPts[ms.faction] = (game.rankPts[ms.faction] || 0) + ms.rewardRankPts;
      game.rep[ms.faction] = Math.min(100, game.rep[ms.faction] + ms.rewardRep);
      changePlayerReputation(5);
      SoundFX.play('coin');
      grantCaptainXP(ms.rewardXp, `🔭 +${ms.rewardGold} 🪙!`);
      game.activeMission = null;
      updateHUD();
    }
  }

  if (game.silverFleetTimer > 0 && (!game.isMultiplayer || game.mpMode === 'open_world')) {
    game.silverFleetTimer--;
    if (game.silverFleetTimer <= 0) {
      if (!ships.some(s => s.isSilverFleet)) spawnSilverFleetConvoy();
      game.silverFleetTimer = 6400 + Math.floor(Math.random() * 3600);
    }
  }

  wind.changeTimer--;
  if (wind.changeTimer <= 0) {
    wind.targetAngle += (Math.random() - 0.5) * 1.1;
    wind.targetSpeed = 0.7 + Math.random() * 0.6;
    wind.changeTimer = 800 + Math.random() * 800;
  }
  wind.angle += angleDiff(wind.targetAngle, wind.angle) * 0.0025;
  wind.speed += (wind.targetSpeed - wind.speed) * 0.0035;

  updateStorms();
  updateWhirlpools();
  updateSeaMonsters();
  checkBountyHunters();
  updatePortFortressesAndLighthouses();
  updateSharpshooterSniper();
  updateFloatingBarrels();

  if (player.ramCooldown > 0) player.ramCooldown--;
  if (player.skillCooldowns.salvo > 0) player.skillCooldowns.salvo--;
  if (player.skillCooldowns.repair > 0) player.skillCooldowns.repair--;

  if (game.time % 60 === 0) {
    const mods = getOfficerModifiers();
    const klabBonus = hasCaptainPerk('perk_klabautermann_tea') ? 1.4 : 0;
    const ghostNightRegen = (isNightTime() && (player.isGhostShip || (player.upgrades && player.upgrades.ghost_hull > 0))) ? (2.2 + (((player.upgrades && player.upgrades.ghost_hull) || 0) * 1.2)) : 0;
    const voodooNightSail = (isNightTime() && window.hasVoodooPower && hasVoodooPower('voodoo_wind_loa')) ? 2.4 : 0;

    let didRegen = false;
    if (klabBonus + ghostNightRegen > 0 && player.hull < player.maxHull) { player.hull = Math.min(player.maxHull, player.hull + klabBonus + ghostNightRegen); didRegen = true; }
    if (klabBonus + voodooNightSail > 0 && player.sail < player.maxSail) { player.sail = Math.min(player.maxSail, player.sail + klabBonus + voodooNightSail); didRegen = true; }

    if ((mods.hullRegen || 0) > 0 && player.hull < player.maxHull && (player.cargo.timber || 0) >= 0.05) {
      const healed = Math.min(player.maxHull - player.hull, mods.hullRegen * 1.35);
      player.hull += healed;
      player.cargo.timber = Math.max(0, Math.round((player.cargo.timber - (healed / 55)) * 100) / 100);
      didRegen = true;
    }
    if ((mods.sailRegen || 0) > 0 && player.sail < player.maxSail && (player.cargo.canvas || 0) >= 0.05) {
      const healedS = Math.min(player.maxSail - player.sail, mods.sailRegen * 1.45);
      player.sail += healedS;
      player.cargo.canvas = Math.max(0, Math.round((player.cargo.canvas - (healedS / 60)) * 100) / 100);
      didRegen = true;
    }
    if (didRegen) updateHUD();
  }

  updateCrewSuppliesAndMorale();
  updateShipPhysics(player, true);
  updatePlayerEscortFleet();

  const spyOffX = (window.spyglassState && spyglassState.lookOffsetX) || 0;
  const spyOffY = (window.spyglassState && spyglassState.lookOffsetY) || 0;
  camera.x += ((player.x + spyOffX) - camera.x) * 0.12;
  camera.y += ((player.y + spyOffY) - camera.y) * 0.12;

  // Kanonen-Feuereingabe mit sauberem, symmetrischem Mindest-Intervall (inkl. Schrot-Salven-Sperre!)
  if (!isAnyModalOverlayOpen() && !spyglassState.active) {
    const isGrape = player.ammoType === 'grape';
    const singlePacing = Math.max(26, Math.round(145 / Math.max(2, player.cannonsPerSide)));
    const fireInterval = isGrape ? 150 : (player.fireCadence === 'broadside' ? 52 : singlePacing);
    if ((keys['q'] || mouse.left || keys[' ']) && player.portFireDelay <= 0) {
      if (player.combatMode && player.modeTransitionTimer <= 0 && fireShipCannonOrBroadside(player, -1, true)) {
        player.portFireDelay = Math.max(player.portFireDelay || 0, fireInterval);
      }
    }
    if ((keys['e'] || mouse.right || keys[' ']) && player.stbdFireDelay <= 0) {
      if (player.combatMode && player.modeTransitionTimer <= 0 && fireShipCannonOrBroadside(player, 1, true)) {
        player.stbdFireDelay = Math.max(player.stbdFireDelay || 0, fireInterval);
      }
    }
  }

  // Häfen, Feindhafen-Einschleichen & Beiboot-Landgang prüfen!
  currentPort = null;
  currentSiegePort = null;
  window.nearHostilePortForSneak = null;
  const activePorts = (game.isMultiplayer && game.mpMode === 'deathmatch') ? [PORTS[0]] : PORTS;

  for (const p of activePorts) {
    const d = Math.hypot(player.x - p.x, player.y - p.y);
    if (d < 380) {
      if (p.fortHp <= 0) {
        currentSiegePort = p;
      } else {
        const isHostile = !(game.isMultiplayer && game.mpMode === 'deathmatch') &&
                          ((game.rep[p.faction] || 0) < -30 && player.falseFlag !== p.faction);
        if (isHostile) window.nearHostilePortForSneak = p;
        else currentPort = p;
      }
      break;
    } else if (d < 520 && (game.rep[p.faction] || 0) < -20) {
      window.nearHostilePortForSneak = p;
    }
  }

  const dockEl = document.getElementById('dockPrompt');
  if (currentPort) {
    dockEl.textContent = (game.isMultiplayer && game.mpMode === 'deathmatch')
      ? `🛡️ Safe-Zone Dock anlaufen [F]`
      : `⚓ ${currentPort.name} (${td(FACTIONS[currentPort.faction], 'short')}) [F]`;
    dockEl.classList.add('visible');
  } else dockEl.classList.remove('visible');

  currentVillage = null;
  if (!currentPort && !(game.isMultiplayer && game.mpMode === 'deathmatch')) {
    for (const fv of FISHING_VILLAGES) {
      if (Math.hypot(player.x - fv.x, player.y - fv.y) < 215) { currentVillage = fv; break; }
    }
  }
  const vilEl = document.getElementById('villagePrompt');
  if (vilEl) {
    if (currentVillage) {
      vilEl.textContent = `${currentVillage.isVoodooVillage ? '🔮' : '🐟'} ${td(currentVillage, 'name')} [F]`;
      vilEl.className = `prompt-btn ${currentVillage.isVoodooVillage ? 'voodoo' : 'explore'} visible`;
    } else vilEl.classList.remove('visible');
  }

  const siegeEl = document.getElementById('siegePrompt');
  if (currentSiegePort) { siegeEl.textContent = `🏰 ${currentSiegePort.name} [V]`; siegeEl.classList.add('visible'); }
  else siegeEl.classList.remove('visible');

  // Basis-Bauplätze (nur eigene Kolonie anzeigen, sobald man eine besitzt!)
  currentBasePlot = null;
  if (!(game.isMultiplayer && game.mpMode === 'deathmatch') && typeof BASE_PLOTS !== 'undefined') {
    const ownedId = game.hideout && game.hideout.foundedPlotId;
    for (const bp of BASE_PLOTS) {
      if (ownedId && bp.id !== ownedId) continue;
      if (Math.hypot(player.x - bp.x, player.y - bp.y) < 245) { currentBasePlot = bp; break; }
    }
  }
  nearHideout = !!currentBasePlot;
  const hideEl = document.getElementById('hideoutPrompt');
  if (hideEl) {
    if (currentBasePlot) {
      const isOwn = game.hideout && game.hideout.foundedPlotId === currentBasePlot.id;
      hideEl.textContent = `${isOwn ? '🏴‍☠️' : '🏗️'} ${isOwn ? (game.hideout.customBaseName || td(currentBasePlot, 'name')) : td(currentBasePlot, 'name')} [F / H]`;
      hideEl.classList.add('visible');
    } else hideEl.classList.remove('visible');
  }

  window.nearWololoShrine = !!(game.wololoEnabled && typeof WOLOLO_SHRINE !== 'undefined' && !(game.isMultiplayer) && Math.hypot(player.x - WOLOLO_SHRINE.x, player.y - WOLOLO_SHRINE.y) < 250);
  window.nearGhostEnclave = (game.worldMode === 'mythology') && !(game.isMultiplayer && game.mpMode === 'deathmatch') && Math.hypot(player.x - GHOST_ENCLAVE.x, player.y - GHOST_ENCLAVE.y) < 260;
  const encEl = document.getElementById('enclavePrompt');
  if (encEl) {
    if (window.nearWololoShrine) {
      encEl.textContent = `⛩️ ${td(WOLOLO_SHRINE, 'name')} [F]`;
      encEl.classList.add('visible');
    } else if (window.nearGhostEnclave) {
      const repOk = getPlayerReputationTier(game.reputation || 0).canEnterEnclave || !!(game.captain && game.captain.isGhostCaptain);
      encEl.textContent = repOk ? `👻 ${td(GHOST_ENCLAVE, 'name')} [F]` : `👻 ${td(GHOST_ENCLAVE, 'name')} (🔒 ≤ -85) [F]`;
      encEl.classList.add('visible');
    } else encEl.classList.remove('visible');
  }

  currentBoardTarget = null;
  currentTalkTarget = null;
  let bestBoardDist = player.specialEquipment === 'boarding_grapnels' ? 155 : 112;
  let bestTalkDist = 260;

  for (const s of [...ships, ...Object.values(window.remotePlayers || {})]) {
    if (!s || isShipProtectedByBoarding(s)) continue;
    const d = Math.hypot(player.x - s.x, player.y - s.y);
    if (d < bestBoardDist && !s.isRemotePlayer) { bestBoardDist = d; currentBoardTarget = s; }
    if (d < bestTalkDist && !s.isGhost) { bestTalkDist = d; currentTalkTarget = s; }

    if (!s.isRemotePlayer && !isShipProtectedByBoarding(player) && d < (player.width + s.width) * 0.9 && player.ramCooldown <= 0 && player.speed > 1.2) {
      player.ramCooldown = 90;
      const hasIronRam = player.specialEquipment === 'eq_corsair_ram';
      const ramDmg = Math.round(player.speed * 14 * (player.maxHull / 280) * (hasIronRam ? 1.70 : 1.0));
      s.hull = Math.max(0, s.hull - ramDmg);
      player.hull = Math.max(10, player.hull - Math.round(ramDmg * (hasIronRam ? 0.09 : 0.25)));
      player.speed *= 0.4; s.speed *= 0.4;
      s.provokedByPlayer = true; game.playerFocusTarget = s;
      SoundFX.play('splinter'); triggerWorldScreenShake(7.5);
      spawnWorldCombatText(s.x, s.y, `💥 RAM -${ramDmg}`, '#fb923c', 15);
      updateHUD();
    }
  }

  const boardEl = document.getElementById('boardPrompt');
  if (currentBoardTarget && !player.inBoardingLock) {
    const kn = isShipIdentifiedByPlayer(currentBoardTarget) ? `"${currentBoardTarget.name}"` : 'Schiff';
    boardEl.textContent = `⚔️ Entern: ${kn} [B]`;
    boardEl.classList.add('visible');
  } else boardEl.classList.remove('visible');

  const hailEl = document.getElementById('hailPrompt');
  if (hailEl) {
    if (currentTalkTarget && !player.inBoardingLock) {
      const kn = isShipIdentifiedByPlayer(currentTalkTarget) ? (currentTalkTarget.captainName || currentTalkTarget.name) : 'Fremdes Schiff';
      hailEl.textContent = `📯 Kontaktanfrage: ${kn} [U]`;
      hailEl.classList.add('visible');
    } else hailEl.classList.remove('visible');
  }

  // Schatzbucht (auch nach looted für Proviant!), Feindhafen-Schleichen & Küsten-Beiboot!
  currentExploreSite = null;
  window.nearAnyCoastForRowboat = null;
  if (!(game.isMultiplayer && game.mpMode === 'deathmatch')) {
    for (const site of EXPLORATION_SITES) {
      if (site.mapBought && (!site.looted || (site.forageLeft || 0) > 0) && Math.hypot(player.x - site.x, player.y - site.y) < 225) {
        currentExploreSite = site; site.discovered = true; break;
      }
    }
    if (!currentExploreSite && !currentPort && !currentVillage && !window.nearHostilePortForSneak) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        const landHit = getShoalLand(player.x + Math.cos(a) * 145, player.y + Math.sin(a) * 145) ||
                        getCollidingLand(player.x + Math.cos(a) * 145, player.y + Math.sin(a) * 145);
        if (landHit && !landHit.isGhostIsle) { window.nearAnyCoastForRowboat = landHit; break; }
      }
    }
  }

  const expEl = document.getElementById('explorePrompt');
  if (currentExploreSite) {
    expEl.textContent = `🏝️ ${td(currentExploreSite, 'name')} [G]`;
    expEl.classList.add('visible');
  } else if (window.nearHostilePortForSneak) {
    expEl.textContent = `🕶️ Nach ${window.nearHostilePortForSneak.name} einschleichen [G]`;
    expEl.classList.add('visible');
  } else if (window.nearAnyCoastForRowboat) {
    expEl.textContent = t('rowboatCoastPrompt');
    expEl.classList.add('visible');
  } else {
    expEl.classList.remove('visible');
  }

  if ((!game.isMultiplayer || game.mpMode === 'open_world') && ships.length < 44 && game.time % 140 === 0) {
    spawnWorldShip();
  }

  // Engagement-Cap berechnen: Maximal 3 feindliche Kriegsschiffe dürfen den Spieler auf offener See gleichzeitig angreifen!
  const besiegedPort = PORTS.find(p => p.fortHp < p.maxFortHp && Math.hypot(player.x - p.x, player.y - p.y) < 680);
  const silverFleetProvoked = ships.some(sh => sh.isSilverFleet && sh.provokedByPlayer);
  const hostileCandidates = ships
    .filter(sh => !sh.inBoardingLock && !(sh.isMerchant && !sh.isSilverFleet && !sh.isMissionTarget) && areShipsHostile(sh, player))
    .sort((a, b) => {
      const prioA = (a.provokedByPlayer || a.isMissionTarget || a.isBountyHunter) ? -2000 : 0;
      const prioB = (b.provokedByPlayer || b.isMissionTarget || b.isBountyHunter) ? -2000 : 0;
      return (Math.hypot(a.x - player.x, a.y - player.y) + prioA) - (Math.hypot(b.x - player.x, b.y - player.y) + prioB);
    });
  const allowedAttackers = new Set();
  for (const cand of hostileCandidates) {
    const bypassCap = (cand.isSilverFleet && silverFleetProvoked) || (besiegedPort && cand.faction === besiegedPort.faction && Math.hypot(cand.x - besiegedPort.x, cand.y - besiegedPort.y) < 750);
    if (bypassCap || allowedAttackers.size < 3) allowedAttackers.add(cand);
  }

  // KI-Schiffe
  for (let i = ships.length - 1; i >= 0; i--) {
    const s = ships[i];
    if (s.inBoardingLock) { updateShipPhysics(s, false); continue; }
    s.isFleeing = false;

    const dpToPlayer = Math.hypot(player.x - s.x, player.y - s.y);
    const pureMerchant = s.isMerchant && !s.isSilverFleet && !s.isMissionTarget && !s.isBountyHunter && !s.isGhost;
    const merchantScared = pureMerchant && (s.provokedByPlayer || (((game.rep[s.faction] || 0) < -35 || (game.reputation || 0) <= -50) && dpToPlayer < 560 && player.falseFlag !== s.faction));

    let target = null, bestDist = s.isBountyHunter ? 1750 : (s.isGhost ? 1250 : 680);
    if (!pureMerchant && allowedAttackers.has(s) && areShipsHostile(s, player) && !isShipProtectedByBoarding(player)) {
      if (dpToPlayer < bestDist) { bestDist = dpToPlayer; target = player; }
      for (const esc of (player.fleet || [])) {
        const de = Math.hypot(esc.x - s.x, esc.y - s.y);
        if (de < bestDist) { bestDist = de; target = esc; }
      }
    }
    if (!pureMerchant) {
      for (let j = 0; j < ships.length; j++) {
        if (i !== j && !isShipProtectedByBoarding(ships[j]) && areShipsHostile(s, ships[j])) {
          const d = Math.hypot(ships[j].x - s.x, ships[j].y - s.y);
          if (d < bestDist) { bestDist = d; target = ships[j]; }
        }
      }
    }

    let desiredAngle;
    if (merchantScared) {
      // HÄNDLER-FLUCHTVERHALTEN: Setzt volle Segel Richtung nächstem Heimathafen und feuert nur auf <240px zur Selbstverteidigung!
      s.isFleeing = true;
      s.combatMode = dpToPlayer < 245 && s.provokedByPlayer;
      let safePort = null, safeDist = Infinity;
      for (const hp of PORTS) {
        if (hp.faction === s.faction) {
          const dh = Math.hypot(hp.x - s.x, hp.y - s.y);
          if (dh > 260 && dh < safeDist) { safeDist = dh; safePort = hp; }
        }
      }
      const awayFromPlayer = Math.atan2(s.y - player.y, s.x - player.x);
      if (safePort && dpToPlayer > 360) {
        const seaAng = safePort.seaAngle !== undefined ? safePort.seaAngle : 0;
        s.destX = safePort.x + Math.cos(seaAng) * 360;
        s.destY = safePort.y + Math.sin(seaAng) * 360;
        desiredAngle = Math.atan2(s.destY - s.y, s.destX - s.x);
      } else {
        desiredAngle = awayFromPlayer;
      }

      if (s.combatMode && dpToPlayer < 240 && !isShipProtectedByBoarding(player)) {
        const toPl = Math.atan2(player.y - s.y, player.x - s.x);
        if (Math.abs(angleDiff(toPl, s.angle - Math.PI / 2)) < 0.40 && s.portFireDelay <= 0) {
          if (fireShipCannonOrBroadside(s, -1, false, false)) s.portFireDelay = 30;
        }
        if (Math.abs(angleDiff(toPl, s.angle + Math.PI / 2)) < 0.40 && s.stbdFireDelay <= 0) {
          if (fireShipCannonOrBroadside(s, 1, false, false)) s.stbdFireDelay = 30;
        }
      }
    } else if (target) {
      s.combatMode = true;
      const toTarget = Math.atan2(target.y - s.y, target.x - s.x);
      desiredAngle = (bestDist < 380 && bestDist > 150) ? toTarget + s.orbitDir * (Math.PI / 2) : (bestDist <= 150 ? toTarget + s.orbitDir * (Math.PI * 0.75) : toTarget);

      if (bestDist < 540) {
        const useBroadside = s.cannonsPerSide >= 6 && Math.random() < 0.35;
        if (Math.abs(angleDiff(toTarget, s.angle - Math.PI / 2)) < 0.36 && s.portFireDelay <= 0) {
          if (fireShipCannonOrBroadside(s, -1, false, useBroadside)) s.portFireDelay = useBroadside ? 36 : 22;
        }
        if (Math.abs(angleDiff(toTarget, s.angle + Math.PI / 2)) < 0.36 && s.stbdFireDelay <= 0) {
          if (fireShipCannonOrBroadside(s, 1, false, useBroadside)) s.stbdFireDelay = useBroadside ? 36 : 22;
        }
      }
    } else if (s.leaderShip && ships.includes(s.leaderShip)) {
      s.combatMode = s.leaderShip.combatMode;
      desiredAngle = Math.atan2(s.leaderShip.y + (s.formationOffset ? s.formationOffset.y : 80) - s.y, s.leaderShip.x + (s.formationOffset ? s.formationOffset.x : 80) - s.x);
    } else {
      s.combatMode = false;
      if (Math.hypot(s.destX - s.x, s.destY - s.y) < 360 && !s.isMissionTarget) {
        const nextPort = PORTS[Math.floor(Math.random() * PORTS.length)];
        const seaAng = nextPort.seaAngle !== undefined ? nextPort.seaAngle : 0;
        s.destX = nextPort.x + Math.cos(seaAng) * 420;
        s.destY = nextPort.y + Math.sin(seaAng) * 420;
      }
      desiredAngle = Math.atan2(s.destY - s.y, s.destX - s.x);
    }

    const feelerAngles = [0, -0.48, 0.48, -0.95, 0.95];
    let avoidX = 0, avoidY = 0, foundHazard = false;
    for (const fa of feelerAngles) {
      const probeAng = s.angle + fa;
      for (const dist of [150, 260, 390]) {
        const px = s.x + Math.cos(probeAng) * dist, py = s.y + Math.sin(probeAng) * dist;
        const landHit = getCollidingLand(px, py) || (!s.isGhost && getShoalLand(px, py));
        if (landHit) {
          const awayAng = Math.atan2(s.y - landHit.cy, s.x - landHit.cx);
          avoidX += Math.cos(awayAng) * (440 / dist); avoidY += Math.sin(awayAng) * (440 / dist);
          foundHazard = true;
        }
        if (!s.isGhost) {
          const reefHit = getCollidingCoralReef(px, py, 35);
          if (reefHit) {
            const awayReef = Math.atan2(s.y - reefHit.y, s.x - reefHit.x);
            avoidX += Math.cos(awayReef) * (480 / dist); avoidY += Math.sin(awayReef) * (480 / dist);
            foundHazard = true;
          }
          for (const wp of whirlpools) {
            if (Math.hypot(px - wp.x, py - wp.y) < wp.r + 55) {
              const awayWp = Math.atan2(s.y - wp.y, s.x - wp.x);
              avoidX += Math.cos(awayWp) * (500 / dist); avoidY += Math.sin(awayWp) * (500 / dist);
              foundHazard = true;
            }
          }
        }
      }
    }
    if (foundHazard) desiredAngle = Math.atan2(avoidY, avoidX);

    const diff = angleDiff(desiredAngle, s.angle);
    const maxTurn = Math.min(0.016, s.baseTurnRate * (0.6 + 0.4 * Math.max(0.2, s.crew / s.maxCrew)));
    s.angularVel += (Math.sign(diff) * Math.min(maxTurn, Math.abs(diff)) - s.angularVel) * 0.075;
    s.angle += s.angularVel;
    updateShipPhysics(s, false);
  }

  // Projektile
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx; b.y += b.vy; b.spin += 0.22; b.life--;

    let hitStructure = false;
    for (const p of activePorts) {
      if (!(game.isMultiplayer && game.mpMode === 'deathmatch') && b.ownerFaction === 'player' && p.fortHp > 0 && Math.hypot(b.x - p.x, b.y - p.y) < 75) {
        const fDmg = b.damage * b.hullMult * (b.isGhostShot ? 1.25 : 1.0);
        p.fortHp = Math.max(0, p.fortHp - fDmg);
        game.rep[p.faction] = Math.max(-100, (game.rep[p.faction] || 0) - 3);
        SoundFX.play('hit');
        spawnWorldCombatText(b.x, b.y, `🏰 -${Math.round(fDmg)}`, '#f59e0b', 14);
        bullets.splice(i, 1); hitStructure = true;
        break;
      }
      // Echte Projektil-Hitbox für Küsten-Leuchttürme (r = 32px)!
      if (!(game.isMultiplayer && game.mpMode === 'deathmatch') && p.hasLighthouse && p.lighthouseX !== undefined && Math.hypot(b.x - p.lighthouseX, b.y - p.lighthouseY) < 32) {
        if (b.ownerFaction === 'player' && p.lighthouseHp > 0) {
          const lDmg = Math.max(4, Math.round(b.damage * b.hullMult));
          p.lighthouseHp = Math.max(0, p.lighthouseHp - lDmg);
          SoundFX.play('hit');
          spawnWorldCombatText(b.x, b.y, p.lighthouseHp <= 0 ? `🗼 ZERSTÖRT!` : `🗼 -${lDmg}`, '#fde047', 13.5);
          if (p.lighthouseHp <= 0) logEvent(`🗼 Der Leuchtturm von ${p.name} liegt in Trümmern – sein Nachtfeuer ist erloschen!`);
        }
        bullets.splice(i, 1); hitStructure = true;
        break;
      }
    }
    if (!hitStructure && b.ownerFaction !== 'player' && game.hideout && game.hideout.foundedPlotId && (game.hideout.fortHp || 0) > 0) {
      const ownPlot = BASE_PLOTS.find(bp => bp.id === game.hideout.foundedPlotId);
      if (ownPlot && Math.hypot(b.x - ownPlot.x, b.y - ownPlot.y) < 72) {
        const bDmg = Math.max(4, Math.round(b.damage * b.hullMult));
        game.hideout.fortHp = Math.max(0, game.hideout.fortHp - bDmg);
        spawnWorldCombatText(b.x, b.y, `🏰 -${bDmg}`, '#ef4444', 13);
        bullets.splice(i, 1); hitStructure = true;
      }
    }
    if (hitStructure) continue;

    const hitLand = getCollidingLand(b.x, b.y, true);
    if (hitLand || b.life <= 0) {
      for (let sp = 0; sp < (hitLand ? 3 : 5); sp++) {
        particles.push({ x: b.x, y: b.y, vx: (Math.random() - 0.5) * 2.2, vy: (Math.random() - 0.5) * 2.2, life: 16 + sp * 3, maxLife: 28, size: 3.8, color: hitLand ? '#d97706' : 'rgba(224, 242, 254, 0.78)' });
      }
      bullets.splice(i, 1); continue;
    }

    if (b.ownerFaction !== 'player' && !isShipProtectedByBoarding(player) && hitRotatedShip(b.x, b.y, b.radius, player, 0.75)) {
      applyProjectileDamage(player, b);
      bullets.splice(i, 1);
      if (player.hull <= 0) handlePlayerDefeatOrRansom('Dein Flaggschiff wurde im Kanonenhagel versenkt!');
      continue;
    }

    let hitEscort = false;
    for (let eIdx = (player.fleet || []).length - 1; eIdx >= 0; eIdx--) {
      const esc = player.fleet[eIdx];
      if (b.ownerFaction !== 'player' && hitRotatedShip(b.x, b.y, b.radius, esc, 0.82)) {
        applyProjectileDamage(esc, b);
        bullets.splice(i, 1); hitEscort = true;
        if (esc.hull <= 0) handleEscortShipSinking(eIdx);
        break;
      }
    }
    if (hitEscort) continue;

    let hitMonster = false;
    for (let m = seaMonsters.length - 1; m >= 0; m--) {
      const mon = seaMonsters[m];
      if (Math.hypot(b.x - mon.x, b.y - mon.y) < 38) {
        mon.hull -= b.damage;
        spawnWorldCombatText(mon.x, mon.y, `-${Math.round(b.damage)}`, '#6ee7b7', 14);
        bullets.splice(i, 1); hitMonster = true;
        if (mon.hull <= 0) {
          flotsam.push({ x: mon.x, y: mon.y, gold: 450, goodId: 'spices', goodAmt: 10, foodBonus: 6, rumBonus: 3, survivors: 0, faction: 'pirates', life: 1800 });
          grantCaptainXP(90, '🐙 +450 🪙!');
          seaMonsters.splice(m, 1);
        }
        break;
      }
    }
    if (hitMonster) continue;

    let hitRemote = false;
    for (const rp of Object.values(window.remotePlayers || {})) {
      if (b.owner === rp || isShipProtectedByBoarding(rp)) continue;
      if (hitRotatedShip(b.x, b.y, b.radius, rp, 0.85)) {
        if (b.ownerFaction === 'player') SoundFX.play(b.damage > 16 ? 'splinter' : 'hit');
        for (let k = 0; k < 6; k++) {
          particles.push({
            x: b.x, y: b.y, vx: (Math.random() - 0.5) * 5.2, vy: (Math.random() - 0.5) * 5.2,
            life: 18 + Math.random() * 10, maxLife: 28, size: 3.4,
            color: b.isGhostShot ? '#34d399' : '#f59e0b', isGlow: k < 2
          });
        }
        bullets.splice(i, 1);
        hitRemote = true;
        break;
      }
    }
    if (hitRemote) continue;

    for (let j = ships.length - 1; j >= 0; j--) {
      const s = ships[j];
      if (b.owner === s || isShipProtectedByBoarding(s)) continue;
      if (hitRotatedShip(b.x, b.y, b.radius, s, 0.88)) {
        applyProjectileDamage(s, b);
        bullets.splice(i, 1);
        if (s.hull <= 0) {
          const mods = getOfficerModifiers();
          const lootMult = Math.max(0.5, 1.0 + (mods.lootMult || 0));
          const goodDef = GOODS.find(g => g.id === s.lootGood) || GOODS[0];
          SoundFX.play('splash');
          spawnSinkingWreck(s);
          if (b.ownerFaction === 'player') {
            triggerWorldScreenShake(6.5);
            spawnWorldCombatText(s.x, s.y - 18, `💀 VERSENKT!`, '#ffd700', 16);
          }
          flotsam.push({
            x: s.x, y: s.y,
            gold: (game.isMultiplayer && game.mpMode === 'deathmatch') ? 250 : Math.round(s.gold * 0.45 * lootMult),
            goodId: goodDef.canFloat !== false ? s.lootGood : 'timber',
            goodAmt: goodDef.canFloat !== false ? Math.round(s.lootAmount * lootMult) : 3,
            foodBonus: 2, rumBonus: 1, survivors: s.isGhost ? 0 : 3, faction: s.faction, life: 1800
          });
          if (b.ownerFaction === 'player') {
            if (!s.isGhost && game.rep[s.faction] !== undefined) {
              game.rep[s.faction] = Math.max(-100, game.rep[s.faction] - 15);
              if (!s.isMissionTarget) changePlayerReputation(s.isMerchant ? -14 : -7);
            }
            if (game.activeMission && s.isMissionTarget) {
              const ms = game.activeMission;
              if (ms.type === 'capture_only') game.activeMission = null;
              else if (ms.type === 'hunt') {
                game.gold += ms.rewardGold;
                game.rankPts[ms.faction] = (game.rankPts[ms.faction] || 0) + ms.rewardRankPts;
                game.rep[ms.faction] = Math.min(100, game.rep[ms.faction] + ms.rewardRep);
                grantCaptainXP(ms.rewardXp, `🏆 +${ms.rewardGold} 🪙!`);
                game.activeMission = null;
              }
            } else grantCaptainXP(s.isGhost ? 95 : 28);
            updateHUD();
          }
          if (game.playerFocusTarget === s) game.playerFocusTarget = null;
          ships.splice(j, 1);
        }
        break;
      }
    }
  }

  for (let i = flotsam.length - 1; i >= 0; i--) {
    const f = flotsam[i];
    const dist = Math.hypot(player.x - f.x, player.y - f.y);
    if (dist < 175) { f.x += ((player.x - f.x) / dist) * 5.5; f.y += ((player.y - f.y) / dist) * 5.5; }
    if (dist < player.width + 22) {
      const wasTutCrate = !!f.isTutorialCrate;
      if (f.isMissionRescue && game.activeMission && game.activeMission.type === 'rescue') {
        const ms = game.activeMission;
        game.gold += ms.rewardGold;
        game.rankPts[ms.faction] = (game.rankPts[ms.faction] || 0) + ms.rewardRankPts;
        game.rep[ms.faction] = Math.min(100, game.rep[ms.faction] + ms.rewardRep);
        SoundFX.play('coin');
        grantCaptainXP(ms.rewardXp, `🚣 +${ms.rewardGold} 🪙!`);
        game.activeMission = null;
        flotsam.splice(i, 1); updateHUD(); continue;
      }
      game.gold += f.gold;
      let freeSpace = Math.max(0, Math.floor(getMaxCargo() - getCargoTotal()));
      const takenGood = Math.min(freeSpace, f.goodAmt);
      if (takenGood > 0) { player.cargo[f.goodId] = (player.cargo[f.goodId] || 0) + takenGood; freeSpace -= takenGood; }
      const takenFood = Math.min(freeSpace, f.foodBonus || 0);
      if (takenFood > 0) { player.cargo.food += takenFood; freeSpace -= takenFood; }
      const takenRum = Math.min(freeSpace, f.rumBonus || 0);
      if (takenRum > 0) { player.cargo.rum += takenRum; freeSpace -= takenRum; }

      SoundFX.play('coin');
      spawnWorldCombatText(player.x, player.y - 16, `+${f.gold} 🪙`, '#ffd700', 14);
      flotsam.splice(i, 1);
      if (wasTutCrate && window.updateHornigoldTutorialProgress) updateHornigoldTutorialProgress();
      updateHUD(); continue;
    }
    f.life--;
    if (f.life <= 0) flotsam.splice(i, 1);
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    if (p.grow) p.size += p.grow;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (let i = wakes.length - 1; i >= 0; i--) {
    wakes[i].life--;
    if (wakes[i].life <= 0) wakes.splice(i, 1);
  }

  const wx = Math.cos(wind.angle) * (2.2 * wind.speed), wy = Math.sin(wind.angle) * (2.2 * wind.speed);
  for (const s of windStreaks) { s.x = (s.x + wx + wb.w) % wb.w; s.y = (s.y + wy + wb.h) % wb.h; }

  if (window.updateLiveHUD) updateLiveHUD();
};