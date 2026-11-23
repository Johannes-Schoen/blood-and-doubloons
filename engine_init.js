// ============================================================================
// engine_init.js - Teil 1 der Engine: Canvas-Setup, schadensabhängiger Shake,
//                  Crew-Effektivität & Rumpf-Umbau, geschlechterkonsistente
//                  Porträts, Schmuggel ohne 'weapons' & Deathmatch-Archipel
// ============================================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
canvas.addEventListener('contextmenu', e => e.preventDefault());

const keys = {};
const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, left: false, right: false };

window.game = null;
window.player = null;
window.camera = { x: 11600, y: 4720, zoom: 1.0, targetZoom: 1.0, shake: 0 };
window.wind = null;
window.ships = [];
window.remotePlayers = {};
window.seaMonsters = [];
window.bullets = [];
window.floatingBarrels = [];
window.flotsam = [];
window.particles = [];
window.wakes = [];
window.windStreaks = [];
window.storms = [];
window.whirlpools = [];
window.currentPort = null;
window.currentVillage = null;
window.currentTalkTarget = null;
window.currentBasePlot = null;
window.currentPortTab = 'shipyard';
window.officerHudCollapsed = false;
let chatterTimeout = null;
let playerInStormNow = false;
window.playerWhirlpoolProximity = 0;

window.adjustZoom = function(delta) {
  if (!window.camera) return;
  camera.targetZoom = Math.max(0.45, Math.min(1.65, (camera.targetZoom || 1.0) + delta));
};

window.triggerWorldScreenShake = function(amount = 5) {
  if (!window.camera) return;
  let dmgMult = 1.0;
  if (window.player && player.maxHull > 0) {
    const damageRatio = Math.max(0, Math.min(1, 1 - (player.hull / player.maxHull)));
    dmgMult = 1.0 + damageRatio * 1.75;
  }
  camera.shake = Math.min(28, Math.max(camera.shake || 0, amount * dmgMult));
};

window.toggleOfficerHudCollapse = function() {
  window.officerHudCollapsed = !window.officerHudCollapsed;
  const bar = document.getElementById('officerHudBar');
  const btn = document.getElementById('collapseOffBtn');
  if (bar) bar.classList.toggle('collapsed', window.officerHudCollapsed);
  if (btn) btn.textContent = window.officerHudCollapsed ? '👥▸' : '👥▾';
};

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  adjustZoom(e.deltaY < 0 ? 0.10 : -0.10);
}, { passive: false });

window.initCannonsArray = function(count) {
  const arr = [];
  for (let i = 0; i < count; i++) arr.push(0);
  return arr;
};

window.logEvent = function(msg) {
  const el = document.getElementById('eventLog');
  if (el) el.textContent = msg;
  if (window.addLogbookEntry) addLogbookEntry(msg);
};

window.showCrewChatter = function(speakerName, text, svgHtml) {
  const box = document.getElementById('chatterBox');
  if (!box) return;
  document.getElementById('chatterPortrait').innerHTML = svgHtml || renderPortraitSprite(SPECIAL_PORTRAITS.boatswain, false);
  document.getElementById('chatterSpeaker').textContent = speakerName;
  document.getElementById('chatterText').textContent = `"${text}"`;
  box.classList.add('visible');

  if (chatterTimeout) { clearTimeout(chatterTimeout); chatterTimeout = null; }
  chatterTimeout = setTimeout(() => { box.classList.remove('visible'); chatterTimeout = null; }, 6500);
};

window.setFleetOrder = function(order) { if (window.game) { game.fleetOrder = order; syncFleetOrdersUI(); } };
window.setFleetAmmo = function(ammo) {
  if (!window.game || !window.player) return;
  game.fleetAmmo = ammo;
  (player.fleet || []).forEach(esc => { esc.ammoType = ammo; });
  syncFleetOrdersUI();
};

window.syncFleetOrdersUI = function() {
  if (!window.game || !window.player) return;
  const bar = document.getElementById('fleetOrdersBar');
  if (!bar) return;
  bar.classList.toggle('visible', (player.fleet || []).length > 0);
  const curOrd = game.fleetOrder || 'formation';
  const curAmmo = game.fleetAmmo || 'round';
  const toggleCls = (id, cond) => { const el = document.getElementById(id); if (el) el.classList.toggle('active', cond); };
  toggleCls('fCmd_form', curOrd === 'formation');
  toggleCls('fCmd_attack', curOrd === 'attack');
  toggleCls('fCmd_cover', curOrd === 'cover');
  toggleCls('fAmmo_round', curAmmo === 'round');
  toggleCls('fAmmo_chain', curAmmo === 'chain');
  toggleCls('fAmmo_grape', curAmmo === 'grape');
};

// ============================================================================
// KANONEN-BEMANNUNG MIT CREW-EFFEKTIVITÄT & LIVE-FOKUS-REGLER!
// ============================================================================
window.getPlayerEquippedCannonStats = function() {
  if (!player || !player.cargo) {
    return { totalSlots: 6, equippedCount: 6, mannedCount: 6, mannedPerSide: 3, avgDamage: 11, avgReloadMult: 1.0, avgRangeMult: 1.0, ghostFireChance: 0, hasGhostCannons: false, summary: '6× 6-Pfünder' };
  }
  const totalSlots = player.cannonsPerSide * 2;
  let remaining = totalSlots;
  let totalDmg = 0, totalReload = 0, totalRange = 0, totalGhostChance = 0, equippedCount = 0;
  let hasGhostCannons = false;
  const parts = [];

  const sortedTypes = [...CANNON_TYPES].sort((a, b) => b.damage - a.damage);
  for (const ct of sortedTypes) {
    const owned = Math.floor(player.cargo[ct.id] || 0);
    if (owned > 0 && remaining > 0) {
      const use = Math.min(owned, remaining);
      equippedCount += use; remaining -= use;
      totalDmg += use * ct.damage;
      totalReload += use * ct.reloadMult;
      totalRange += use * ct.rangeMult;
      totalGhostChance += use * (ct.ghostFireChance || 0);
      if (ct.isGhostCannon) hasGhostCannons = true;
      parts.push(`${use}× ${td(ct, 'shortName')}`);
    }
  }

  // Berücksichtigt Oberbootsmann (+35% Crew-Effektivität) UND den Live-Schieberegler (Geschütz-Fokus)!
  const alloc = window.getLiveCrewAllocation ? getLiveCrewAllocation() : { effectiveHandsForGuns: Math.ceil(player.crew) };
  const maxMannableByCrew = Math.max(2, Math.floor(Math.max(0, alloc.effectiveHandsForGuns - 2) / 1.8));
  const mannedCount = Math.min(equippedCount, maxMannableByCrew);
  const mannedPerSide = Math.min(player.cannonsPerSide, Math.ceil(mannedCount / 2));

  const avgDamage = equippedCount > 0 ? (totalDmg / equippedCount) : 8;
  const avgReloadMult = equippedCount > 0 ? (totalReload / equippedCount) : 1.0;
  const avgRangeMult = equippedCount > 0 ? (totalRange / equippedCount) : 1.0;

  const voodooCannonCurse = window.hasVoodooPower && hasVoodooPower('voodoo_soul_cannons') ? 0.18 : 0;
  const ghostFireChance = Math.min(0.65, (equippedCount > 0 ? (totalGhostChance / equippedCount) : 0) + voodooCannonCurse);
  if (voodooCannonCurse > 0) hasGhostCannons = true;

  return {
    totalSlots, equippedCount, equippedPerSide: Math.floor(equippedCount / 2),
    mannedCount, mannedPerSide, avgDamage, avgReloadMult, avgRangeMult,
    ghostFireChance, hasGhostCannons,
    summary: parts.length > 0 ? parts.join(', ') : 'Keine Kanonen!'
  };
};

window.getShipMannedCannonsPerSide = function(ship, isPlayerShip) {
  if (isPlayerShip) return getPlayerEquippedCannonStats().mannedPerSide;
  const maxByCrew = Math.max(1, Math.floor(Math.max(0, ship.crew - 2) / 4));
  return Math.min(ship.cannonsPerSide, maxByCrew);
};

window.recalculateFactionTerritories = function() {
  Object.keys(FACTIONS).forEach(fk => {
    const facPorts = PORTS.filter(p => p.faction === fk);
    if (facPorts.length === 0) return;
    let sumX = 0, sumY = 0;
    facPorts.forEach(p => { sumX += p.x; sumY += p.y; });
    const cx = sumX / facPorts.length, cy = sumY / facPorts.length;
    let maxDist = 2000;
    facPorts.forEach(p => { const d = Math.hypot(p.x - cx, p.y - cy) + 1250; if (d > maxDist) maxDist = d; });
    FACTIONS[fk].territoryCenter = { x: Math.round(cx), y: Math.round(cy), r: Math.min(8200, Math.round(maxDist)) };
  });
};

// ============================================================================
// GOUVERNEURS-AUFTRÄGE (Schmuggel nutzt edlen Havanna-Tabak statt 'weapons'!)
// ============================================================================
window.generatePortMissions = function(port) {
  const fac = FACTIONS[port.faction];
  const otherPorts = PORTS.filter(p => p.id !== port.id);
  const sameFacPorts = otherPorts.filter(p => p.faction === port.faction);
  const destPort = otherPorts[Math.floor(Math.random() * otherPorts.length)];
  const friendlyDest = sameFacPorts.length > 0 ? sameFacPorts[Math.floor(Math.random() * sameFacPorts.length)] : destPort;

  const enemyFactions = Object.keys(FACTIONS).filter(fk => fk !== port.faction && (fac.relations[fk] || 0) < -30);
  const enemyFac = enemyFactions[Math.floor(Math.random() * enemyFactions.length)] || 'pirates';
  const enemyPorts = PORTS.filter(p => p.faction === enemyFac);
  const spyPort = enemyPorts.length > 0 ? enemyPorts[Math.floor(Math.random() * enemyPorts.length)] : destPort;

  const tradeGood = destPort.imports[Math.floor(Math.random() * destPort.imports.length)] || 'sugar';
  const goodObj = GOODS.find(g => g.id === tradeGood) || GOODS[0];
  const distGold = Math.floor(Math.hypot(destPort.x - port.x, destPort.y - port.y) * 0.03);
  const enemyShort = td(FACTIONS[enemyFac], 'short');

  const allTemplates = [
    {
      id: 'ms_courier_' + port.id + '_' + Math.floor(Math.random() * 9999),
      type: 'courier', faction: port.faction,
      title: `📦 Eildepesche nach ${destPort.name}`,
      desc: `Überbringt versiegelte Gouverneurs-Papiere sicher auf dem Seeweg in den Hafen von ${destPort.name}.`,
      targetPortId: destPort.id, targetPortName: destPort.name,
      rewardGold: 240 + distGold, rewardRankPts: 18, rewardRep: 12, rewardXp: 45
    },
    {
      id: 'ms_vip_' + port.id + '_' + Math.floor(Math.random() * 9999),
      type: 'vip', faction: port.faction,
      title: `🎩 Kron-Gesandter nach ${friendlyDest.name}`,
      desc: `Eskortiert einen hochrangigen Diplomaten an Bord Eures Schiffes unversehrt nach ${friendlyDest.name}.`,
      targetPortId: friendlyDest.id, targetPortName: friendlyDest.name,
      rewardGold: 320 + Math.floor(Math.hypot(friendlyDest.x - port.x, friendlyDest.y - port.y) * 0.035),
      rewardRankPts: 24, rewardRep: 16, rewardXp: 60
    },
    {
      id: 'ms_hunt_' + port.id + '_' + Math.floor(Math.random() * 9999),
      type: 'hunt', faction: port.faction,
      title: `⚔️ Feindjagd: ${enemyShort} (${destPort.name})`,
      desc: `Spürt das feindliche Kriegsschiff (${enemyShort}) vor ${destPort.name} auf und versenkt oder kapert es!`,
      enemyFaction: enemyFac,
      spawnX: destPort.x + Math.cos(destPort.seaAngle || 1.5) * 450,
      spawnY: destPort.y + Math.sin(destPort.seaAngle || 1.5) * 450,
      targetPortName: destPort.name,
      rewardGold: 490, rewardRankPts: 30, rewardRep: 20, rewardXp: 80
    },
    {
      id: 'ms_capture_' + port.id + '_' + Math.floor(Math.random() * 9999),
      type: 'capture_only', faction: port.faction,
      title: `⛓️ Prisen-Befehl vor ${spyPort.name}`,
      desc: `Kapert die feindliche Korvette (${enemyShort}) vor ${spyPort.name} lebend per Enterkampf [B] – NICHT versenken!`,
      enemyFaction: enemyFac,
      spawnX: spyPort.x + Math.cos(spyPort.seaAngle || 1.5) * 450,
      spawnY: spyPort.y + Math.sin(spyPort.seaAngle || 1.5) * 450,
      targetPortName: spyPort.name,
      rewardGold: 640, rewardRankPts: 36, rewardRep: 24, rewardXp: 95
    },
    {
      id: 'ms_supply_' + port.id + '_' + Math.floor(Math.random() * 9999),
      type: 'supply', faction: port.faction,
      title: `⚖️ 8× ${td(goodObj, 'name')} ➔ ${destPort.name}`,
      desc: `Beschafft mindestens 8 Kisten ${td(goodObj, 'name')} und liefert sie nach ${destPort.name}.`,
      goodId: tradeGood, goodName: td(goodObj, 'name'), amount: 8,
      targetPortId: destPort.id, targetPortName: destPort.name,
      rewardGold: Math.round(goodObj.basePrice * 8 * 1.65) + 160,
      rewardRankPts: 22, rewardRep: 15, rewardXp: 55
    },
    {
      id: 'ms_smuggle_' + port.id + '_' + Math.floor(Math.random() * 9999),
      type: 'smuggle', faction: port.faction,
      title: `🕶️ Schmuggel nach ${spyPort.name}`,
      desc: `Schmuggelt 6 Ballen Kolonial-Seide (🧵) — per falscher Flagge [T] oder Beiboot [G] — nach ${spyPort.name}.`,
      goodId: 'silk', goodName: 'Kolonial-Seide', amount: 6,
      targetPortId: spyPort.id, targetPortName: spyPort.name,
      rewardGold: 860, rewardRankPts: 32, rewardRep: 20, rewardXp: 85
    },
    {
      id: 'ms_recon_' + port.id + '_' + Math.floor(Math.random() * 9999),
      type: 'recon', faction: port.faction,
      title: `🔭 Küsten-Aufklärung vor ${spyPort.name}`,
      desc: `Segelt bis auf Sichtweite (<460px) an die feindliche Festung von ${spyPort.name} heran.`,
      targetPortId: spyPort.id, targetPortName: spyPort.name,
      rewardGold: 360 + Math.floor(Math.hypot(spyPort.x - port.x, spyPort.y - port.y) * 0.025),
      rewardRankPts: 22, rewardRep: 15, rewardXp: 60
    },
    {
      id: 'ms_rescue_' + port.id + '_' + Math.floor(Math.random() * 9999),
      type: 'rescue', faction: port.faction,
      title: `🚣 Seenot-Rettung vor ${destPort.name}`,
      desc: `Findet das SOS-Rettungsfloß vor ${destPort.name} und nehmt die Schiffbrüchigen an Bord.`,
      spawnX: destPort.x + Math.cos(destPort.seaAngle || 1.5) * 420,
      spawnY: destPort.y + Math.sin(destPort.seaAngle || 1.5) * 420,
      targetPortName: destPort.name,
      rewardGold: 420, rewardRankPts: 25, rewardRep: 18, rewardXp: 65
    }
  ];

  for (let i = allTemplates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allTemplates[i], allTemplates[j]] = [allTemplates[j], allTemplates[i]];
  }
  port.missions = allTemplates.slice(0, 4);
};

function populatePortTavernsAndMissions() {
  if (window.initDynamicMarkets) initDynamicMarkets();
  PORTS.forEach((port, idx) => {
    port.treasureMapBought = false;
    port.assignedSiteId = EXPLORATION_SITES[idx % EXPLORATION_SITES.length].id;
    if (window.rebuildPortShipyardOffersForFaction) rebuildPortShipyardOffersForFaction(port);
    if (window.generatePortPassengerOffer) generatePortPassengerOffer(port);

    port.tavernOfficers = [];
    for (let i = 0; i < 4; i++) port.tavernOfficers.push(generateRandomOfficer(port.faction));
    if (port.id === 'nassau' || port.id === 'tortuga') {
      if (!port.tavernOfficers.some(o => o.roleId === 'navigator')) {
        port.tavernOfficers[0] = generateRandomOfficer('pirates', 'navigator');
        port.tavernOfficers[0].cost = 110;
      }
      if (!port.tavernOfficers.some(o => o.roleId === 'boatswain')) {
        port.tavernOfficers[1] = generateRandomOfficer('pirates', 'boatswain');
      }
      if (!port.tavernOfficers.some(o => o.roleId === 'master_builder' || o.roleId === 'shipwright')) {
        port.tavernOfficers[2] = generateRandomOfficer('pirates', 'master_builder');
      }
    }
    generatePortMissions(port);
  });
}

function initStormsAndWhirlpools() {
  storms = [];
  whirlpools = [];
  if (game && game.isMultiplayer && game.mpMode === 'deathmatch') {
    storms.push({ x: 1100, y: 2100, r: 420, intensity: 0.55, label: 'Schauer', isBarrier: false, rotAngle: 0, lightningTimer: 90, flashAlpha: 0, boltPts: [] });
    return;
  }
  const stormConfigs = [
    { x: 11600, y: 5400, r: 650, intensity: 0.45, label_de: 'Tropischer Schauer' },
    { x: 8800, y: 9200, r: 950, intensity: 0.85, label_de: 'Schwerer Sturm' },
    { x: 16200, y: 6900, r: 1050, intensity: 1.15, label_de: 'Karibischer Hurrikan' },
    { x: 15200, y: 14800, r: 780, intensity: 0.55, label_de: 'Böenfront' },
    { x: 5400, y: 16200, r: 1050, intensity: 1.0, label_de: 'Gewittersturm' },
    { x: 19500, y: 17500, r: 700, intensity: 0.40, label_de: 'Steife Brise & Regen' },
    { x: 12500, y: 11500, r: 880, intensity: 0.75, label_de: 'Tropensturm' }
  ];
  stormConfigs.forEach(sc => {
    storms.push({ x: sc.x, y: sc.y, r: sc.r, intensity: sc.intensity, label: sc.label_de, labelObj: sc, isBarrier: false, rotAngle: Math.random() * Math.PI * 2, lightningTimer: Math.floor(Math.random() * 120), flashAlpha: 0, boltPts: [] });
  });
  if (game && game.worldMode === 'mythology') {
    MYTH_STORM_BARRIER.forEach(bs => {
      storms.push({ x: bs.x, y: bs.y, r: bs.r, intensity: bs.intensity, label: bs.label_de, labelObj: bs, isBarrier: true, rotAngle: Math.random() * Math.PI * 2, lightningTimer: Math.floor(Math.random() * 80), flashAlpha: 0, boltPts: [] });
    });
  }
}

window.spawnRandomWhirlpool = function() {
  const wb = getActiveWorldBounds();
  if ((window.whirlpools || []).length >= WHIRLPOOL_CONFIG.maxCount) return;
  for (let tries = 0; tries < 14; tries++) {
    const wx = 800 + Math.random() * (wb.w - 1600);
    const wy = 800 + Math.random() * (wb.h - 1600);
    if (getCollidingLand(wx, wy) || getShoalLand(wx, wy) || getCollidingCoralReef(wx, wy, 120)) continue;
    if (player && Math.hypot(player.x - wx, player.y - wy) < 650) continue;

    const life = WHIRLPOOL_CONFIG.lifeMin + Math.floor(Math.random() * (WHIRLPOOL_CONFIG.lifeMax - WHIRLPOOL_CONFIG.lifeMin));
    whirlpools.push({
      x: wx, y: wy,
      r: WHIRLPOOL_CONFIG.minRadius + Math.random() * (WHIRLPOOL_CONFIG.maxRadius - WHIRLPOOL_CONFIG.minRadius),
      spinAngle: Math.random() * Math.PI * 2,
      spinDir: Math.random() < 0.5 ? 1 : -1,
      life, maxLife: life
    });
    return;
  }
};

window.updateFogOfWar = function(forceInitialReveal = false) {
  if (game.isMultiplayer && game.mpMode === 'deathmatch') return;
  if (!forceInitialReveal && !canDrawMap()) return;
  const mods = getOfficerModifiers();
  const sightRadius = forceInitialReveal ? 1100 : 1250 * (1 + (mods.sightMult || 0));
  const cellRadius = Math.ceil(sightRadius / FOW_CELL);
  const pCol = Math.floor(player.x / FOW_CELL), pRow = Math.floor(player.y / FOW_CELL);

  let newlyDiscovered = 0;
  for (let r = Math.max(0, pRow - cellRadius); r <= Math.min(FOW_ROWS - 1, pRow + cellRadius); r++) {
    for (let c = Math.max(0, pCol - cellRadius); c <= Math.min(FOW_COLS - 1, pCol + cellRadius); c++) {
      if (Math.hypot(c * FOW_CELL + 75 - player.x, r * FOW_CELL + 75 - player.y) <= sightRadius) {
        const idx = r * FOW_COLS + c;
        if (fowGrid[idx] === 0) { fowGrid[idx] = 1; newlyDiscovered++; }
      }
    }
  }
  if (!forceInitialReveal && newlyDiscovered >= 14 && game.time > 30) grantCaptainXP(3);
};

window.spawnNamedCaptains = function() {
  NAMED_CAPTAINS.forEach(nc => {
    if (ships.some(s => s.namedCaptainId === nc.id)) return;
    const home = PORTS.find(p => p.id === nc.homePort) || PORTS[0];
    const seaAng = home.seaAngle !== undefined ? home.seaAngle : Math.PI / 2;
    const ship = spawnWorldShip({
      faction: nc.faction, clsKey: nc.clsKey,
      x: home.x + Math.cos(seaAng) * 380 + (Math.random() - 0.5) * 160,
      y: home.y + Math.sin(seaAng) * 380 + (Math.random() - 0.5) * 160,
      name: `${nc.shipName}`, skipEscorts: false
    });
    ship.namedCaptainId = nc.id;
    ship.gender = nc.gender || 'm';
    ship.captainName = nc.name;
    ship.captainSeed = nc.seed;
    ship.captainPortraitId = nc.portraitId || pickPortraitForFactionCaptain(nc.faction, nc.seed, false, ship.gender);
    ship.captainPersonality = nc.personality;
  });
};

window.syncGhostShipsToDayNight = function() {
  if (!game || game.worldMode !== 'mythology' || (game.isMultiplayer && game.mpMode === 'deathmatch')) return;
  const night = isNightTime();
  if (!night) {
    for (let i = ships.length - 1; i >= 0; i--) if (ships[i].isGhost && !ships[i].inBoardingLock) ships.splice(i, 1);
  } else if (ships.filter(s => s.isGhost).length < 2 && Math.random() < 0.014) {
    const ang = Math.random() * Math.PI * 2, dist = 1400 + Math.random() * 2400;
    const gx = Math.max(600, Math.min(WORLD_W - 600, player.x + Math.cos(ang) * dist));
    const gy = Math.max(600, Math.min(WORLD_H - 600, player.y + Math.sin(ang) * dist));
    if (!getCollidingLand(gx, gy) && !getShoalLand(gx, gy)) {
      spawnWorldShip({ faction: 'pirates', clsKey: 'ghostship', isGhost: true, x: gx, y: gy, name: td(SHIP_CLASSES.ghostship, 'name'), skipEscorts: true });
    }
  }
};

window.spawnSilverFleetConvoy = function() {
  const existing = ships.find(s => s.isSilverFleet);
  if (existing) return existing;

  const startPorts = PORTS.filter(p => p.id === 'cartagena' || p.id === 'portobelo' || p.id === 'maracaibo');
  const origin = startPorts[Math.floor(Math.random() * startPorts.length)] || PORTS[0];
  const havanna = PORTS.find(p => p.id === 'havanna') || PORTS[2];
  const seaAng = origin.seaAngle !== undefined ? origin.seaAngle : -Math.PI / 2;
  const sx = origin.x + Math.cos(seaAng) * 420, sy = origin.y + Math.sin(seaAng) * 420;

  const flagship = spawnWorldShip({
    faction: 'spain', clsKey: 'galleon', x: sx, y: sy,
    name: 'Nuestra Señora de 1714', isSilverFleet: true, skipEscorts: true
  });
  flagship.hull = 1650; flagship.maxHull = 1650;
  flagship.gold = 1550; flagship.lootGood = 'silver'; flagship.lootAmount = 30;
  flagship.destX = havanna.x + Math.cos(havanna.seaAngle || 0) * 380;
  flagship.destY = havanna.y + Math.sin(havanna.seaAngle || 0) * 380;

  [
    { cls: 'frigate', name: 'San Felipe', ox: 120, oy: -90 },
    { cls: 'frigate', name: 'Santa Teresa', ox: -110, oy: 85 },
    { cls: 'corvette', name: 'Santiago', ox: 110, oy: 95 }
  ].forEach(ec => {
    const guard = spawnWorldShip({ faction: 'spain', clsKey: ec.cls, x: sx + ec.ox, y: sy + ec.oy, name: ec.name, isSilverFleet: true, skipEscorts: true });
    guard.leaderShip = flagship; guard.formationOffset = { x: ec.ox, y: ec.oy };
    guard.destX = flagship.destX; guard.destY = flagship.destY;
  });

  logEvent(`🥈 WELT-EVENT 1714: Spanische Schatzgaleone ist von ${origin.name} Richtung Havanna ausgelaufen!`);
  return flagship;
};

// Geschlechter-konsistentes Spawning für alle KI-Schiffskapitäne!
window.spawnWorldShip = function(customConfig = null) {
  const wb = getActiveWorldBounds();
  let homePort, destPort, factionKey;
  if (customConfig && customConfig.faction) {
    factionKey = customConfig.faction;
    const facPorts = PORTS.filter(p => p.faction === factionKey);
    homePort = facPorts[Math.floor(Math.random() * facPorts.length)] || PORTS[0];
  } else {
    homePort = PORTS[Math.floor(Math.random() * PORTS.length)];
    factionKey = homePort.faction;
  }

  const sameFacPorts = PORTS.filter(p => p.faction === factionKey && p.id !== homePort.id);
  const otherFacPorts = PORTS.filter(p => p.faction !== factionKey);
  if (!customConfig && Math.random() < 0.14 && otherFacPorts.length > 0) destPort = otherFacPorts[Math.floor(Math.random() * otherFacPorts.length)];
  else if (sameFacPorts.length > 0) destPort = sameFacPorts[Math.floor(Math.random() * sameFacPorts.length)];
  else destPort = PORTS[Math.floor(Math.random() * PORTS.length)];

  const fac = FACTIONS[factionKey] || FACTIONS.pirates;
  const homeSeaAng = homePort.seaAngle !== undefined ? homePort.seaAngle : Math.PI / 2;

  let x = customConfig && customConfig.x !== undefined ? customConfig.x : (homePort.x + Math.cos(homeSeaAng) * 420 + (Math.random() - 0.5) * 220);
  let y = customConfig && customConfig.y !== undefined ? customConfig.y : (homePort.y + Math.sin(homeSeaAng) * 420 + (Math.random() - 0.5) * 220);
  x = Math.max(250, Math.min(wb.w - 250, x));
  y = Math.max(250, Math.min(wb.h - 250, y));

  const hitLand = getCollidingLand(x, y) || getShoalLand(x, y);
  if (hitLand) {
    const pushAng = Math.atan2(y - hitLand.cy, x - hitLand.cx);
    x = hitLand.cx + Math.cos(pushAng) * 380;
    y = hitLand.cy + Math.sin(pushAng) * 380;
  }

  const isGhost = !!(customConfig && customConfig.isGhost);
  const capitalIds = new Set(['havanna', 'cartagena', 'portroyal', 'antigua', 'martinique', 'willemstad']);
  const isNearCapital = capitalIds.has(homePort.id);
  let clsKey = customConfig && customConfig.clsKey ? customConfig.clsKey : 'sloop';
  if (!customConfig) {
    const r = Math.random();
    if (factionKey === 'spain') {
      clsKey = r < 0.30 ? 'sloop' : (r < 0.56 ? 'brigantine' : (r < 0.78 ? 'flute' : (r < 0.90 ? 'galleon' : (isNearCapital && r > 0.96 ? 'manowar' : 'frigate'))));
    } else if (factionKey === 'england') {
      clsKey = r < 0.28 ? 'sloop' : (r < 0.58 ? 'brigantine' : (r < 0.82 ? 'corvette' : (isNearCapital && r > 0.95 ? 'manowar' : 'frigate')));
    } else if (factionKey === 'france') {
      clsKey = r < 0.28 ? 'sloop' : (r < 0.58 ? 'brigantine' : (r < 0.84 ? 'corvette' : (isNearCapital && r > 0.96 ? 'manowar' : 'frigate')));
    } else if (factionKey === 'netherlands') {
      clsKey = r < 0.42 ? 'flute' : (r < 0.70 ? 'sloop' : (r < 0.90 ? 'brigantine' : 'corvette'));
    } else if (factionKey === 'denmark') {
      clsKey = r < 0.34 ? 'sloop' : (r < 0.66 ? 'brigantine' : (r < 0.90 ? 'corvette' : 'frigate'));
    } else {
      clsKey = r < 0.44 ? 'sloop' : (r < 0.78 ? 'brigantine' : (r < 0.95 ? 'corvette' : 'frigate'));
    }
  }

  const fStats = isGhost ? SHIP_CLASSES.ghostship : getFactionShipStats(clsKey, factionKey);
  const tpl = SHIP_CLASSES[clsKey] || SHIP_CLASSES.sloop;
  const carriedGood = isGhost ? 'silver' : homePort.exports.filter(id => !id.startsWith('cannon_'))[0] || 'sugar';

  // Männlich / Weiblich exakt abstimmen!
  const isFemaleCap = !isGhost && (factionKey === 'pirates' ? Math.random() < 0.28 : Math.random() < 0.12);
  const gender = isFemaleCap ? 'f' : 'm';
  const fnPool = isFemaleCap ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE;
  const fn = fnPool[Math.floor(Math.random() * fnPool.length)];
  const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const cSeed = Math.floor(Math.random() * 8000) + 10;

  const destSeaAng = destPort.seaAngle !== undefined ? destPort.seaAngle : 0;
  const targetDestX = destPort.x + Math.cos(destSeaAng) * 380;
  const targetDestY = destPort.y + Math.sin(destSeaAng) * 380;

  const newShip = {
    x, y, faction: isGhost ? 'pirates' : factionKey, clsKey, isGhost, gender,
    ghostAbility: isGhost ? 'soul_drain' : null,
    isSilverFleet: !!(customConfig && customConfig.isSilverFleet),
    mustCaptureOnly: !!(customConfig && customConfig.mustCaptureOnly),
    name: customConfig && customConfig.name ? customConfig.name : (isGhost ? td(SHIP_CLASSES.ghostship, 'name') : fStats.name),
    captainName: `${isFemaleCap ? 'Kapitänin' : 'Kapitän'} ${fn} ${ln}`,
    captainSeed: cSeed,
    captainPortraitId: pickPortraitForFactionCaptain(factionKey, cSeed, isGhost, gender),
    isMerchant: customConfig ? false : !!(tpl.isMerchant || (clsKey === 'galleon' && Math.random() < 0.65)),
    isBountyHunter: !!(customConfig && customConfig.isBountyHunter),
    isMissionTarget: !!(customConfig && customConfig.isMissionTarget),
    missionId: customConfig ? customConfig.missionId : null,
    angle: Math.atan2(targetDestY - y, targetDestX - x),
    speed: fStats.baseSpeed * 0.65, angularVel: 0,
    combatMode: !!(isGhost || (customConfig && (customConfig.isBountyHunter || customConfig.isMissionTarget))),
    cannonExtendPct: 0, onFire: 0, ghostFire: 0, morale: 85,
    inBoardingLock: false, boardingInvulnTimer: 0,
    baseMaxSpeed: fStats.baseSpeed, baseTurnRate: fStats.turnRate,
    length: fStats.length, width: fStats.width, cannonsPerSide: fStats.cannonsPerSide,
    portCannons: initCannonsArray(fStats.cannonsPerSide),
    stbdCannons: initCannonsArray(fStats.cannonsPerSide),
    portCannonDamage: initCannonsArray(fStats.cannonsPerSide),
    stbdCannonDamage: initCannonsArray(fStats.cannonsPerSide),
    nextPortIndex: 0, nextStbdIndex: 0, portFireDelay: 0, stbdFireDelay: 0, singleFireInterval: 14,
    reloadMax: fStats.reload, dmg: fStats.dmg, ammoType: 'round',
    hull: fStats.hull, maxHull: fStats.hull, sail: fStats.sail, maxSail: fStats.sail,
    crew: fStats.crew, maxCrew: fStats.crew, cargoCap: fStats.cargoCap,
    hullColor: isGhost ? '#052e24' : fac.hullColor,
    sailColor: isGhost ? 'rgba(52, 211, 153, 0.65)' : fac.sailColor,
    flagColor: isGhost ? '#10b981' : fac.color,
    gold: (tpl.gold || 60) + Math.floor(Math.random() * 55),
    lootGood: carriedGood, lootAmount: Math.floor(4 + Math.random() * ((fStats.cargoCap || 40) * 0.25)),
    destX: targetDestX, destY: targetDestY,
    orbitDir: Math.random() < 0.5 ? 1 : -1,
    leaderShip: null, formationOffset: null, talkActionsDone: {},
    provokedByPlayer: !!(customConfig && (customConfig.isBountyHunter || customConfig.isMissionTarget))
  };

  ships.push(newShip);

  if (factionKey === 'pirates' && !isGhost && (!customConfig || !customConfig.skipEscorts) && ships.length < 44 && Math.random() < 0.35) {
    const numCorsairs = 1;
    for (let c = 0; c < numCorsairs; c++) {
      const side = c === 0 ? -1 : 1;
      const ox = side * 85, oy = -75 - c * 25;
      const corsair = spawnWorldShip({ faction: 'pirates', clsKey: 'sloop', x: x + ox, y: y + oy, name: td(SHIP_CLASSES.sloop, 'name'), skipEscorts: true });
      corsair.leaderShip = newShip; corsair.formationOffset = { x: ox, y: oy };
      corsair.destX = targetDestX; corsair.destY = targetDestY;
    }
  }
  return newShip;
};

window.spawnSeaMonster = function() {
  let x = 2500 + Math.random() * (WORLD_W - 5000);
  let y = 2500 + Math.random() * (WORLD_H - 5000);
  if (getCollidingLand(x, y)) return;
  seaMonsters.push({ x, y, angle: Math.random() * Math.PI * 2, speed: 1.05, hull: 750, maxHull: 750, length: 70, width: 70, attackCooldown: 0, tentaclePhase: Math.random() * 10 });
};

// ============================================================================
// NEUES SPIEL INITIALISIEREN (Inkl. kompakter Deathmatch-Karte!)
// ============================================================================
window.initNewGameFromCreation = function(cState, isMultiplayerSession = false, mpMode = null) {
  fowGrid.fill(0);
  window.treasureAdvState = null;
  window.proximityShouts = [];
  if (window.spyglassState) spyglassState.active = false;

  EXPLORATION_SITES.forEach(s => {
    s.mapBought = false; s.discovered = false; s.looted = false; s.lastReport = '';
    s.forageLeft = 3;
  });

  PORTS.forEach(p => {
    p.faction = p.defaultFaction || p.faction;
    p.fortHp = p.maxFortHp;
    p.treasureMapBought = false;
    if (p.openWorldX !== undefined) {
      p.x = p.openWorldX; p.y = p.openWorldY;
      p.coastRotation = p.openWorldRot; p.seaAngle = p.openWorldSeaAng;
    }
  });

  FISHING_VILLAGES.forEach(fv => { fv.crewAvail = fv.maxCrewAvail; fv.foodStock = 14; fv.raidCooldown = 0; });
  window.sinkingWrecks = [];
  window.worldCombatTexts = [];

  LANDMASSES.forEach((land, idx) => buildOrganicLandmass(land, idx, WORLD_W, WORLD_H));
  DM_ARENA_ISLANDS.forEach((land, idx) => buildOrganicLandmass(land, idx + 100, DM_WORLD_W, DM_WORLD_H));
  alignPortsAndVillagesToCoastline();

  // Im Deathmatch Safe-Zone-Hafen exakt in die Mitte der kompakten 4800x4800-Karte legen!
  if (isMultiplayerSession && mpMode === 'deathmatch') {
    const dmPort = PORTS[0];
    dmPort.x = 2400; dmPort.y = 2480;
    dmPort.seaAngle = Math.PI / 2; dmPort.coastRotation = 0;
  }

  const capNameTrim = (cState.capName || 'Kapitän Edward Hawke').replace(/[<>"]/g, '').trim() || 'Kapitän Edward Hawke';
  const lowerCapName = capNameTrim.toLowerCase();
  const isCooperCheat = !isMultiplayerSession && lowerCapName.includes('cooper team');
  const isWololoCheat = !isMultiplayerSession && lowerCapName.includes('wololo');

  const chosenWorldMode = cState.worldMode || 'realistic';
  let chosenPortraitId = cState.portraitId || 'freibeuter:4';
  if (chosenWorldMode !== 'mythology' && String(chosenPortraitId).startsWith('geister:')) chosenPortraitId = 'freibeuter:4';
  const startsWithSpectralPortrait = chosenWorldMode === 'mythology' && String(chosenPortraitId).startsWith('geister:');

  const capRels = {};
  NAMED_CAPTAINS.forEach(nc => { capRels[nc.id] = nc.baseRelation || 0; });

  const nassau = PORTS[0];
  const nassauSeaAng = nassau.seaAngle !== undefined ? nassau.seaAngle : Math.PI / 2;

  game = {
    isMultiplayer: !!isMultiplayerSession,
    mpMode: mpMode || null,
    isGameOver: false,
    worldMode: chosenWorldMode,
    wololoEnabled: isWololoCheat,
    gold: isCooperCheat ? 100000 : 380,
    reputation: 0,
    conqueredPorts: {},
    fleetOrder: 'formation',
    fleetAmmo: 'round',
    playerFocusTarget: null,
    customWaypoint: null,
    logbook: [],
    visitedPortsLog: {},
    discoveries: { found: {}, turnedIn: {}, mapMilestoneClaimed: 0 },
    activePassenger: null,
    baseInvestmentGold: 0,
    allegianceCooldownUntil: 0,
    paused: false,
    time: 0,
    timeOfDay: 0.35,
    bountyCooldown: 2400,
    silverFleetTimer: 3200,
    activeMission: null,
    allegiance: null,
    captainRelations: capRels,
    enclaveOfficers: (chosenWorldMode === 'mythology' || isWololoCheat) ? [
      generateEnclaveGhostOfficer(0), generateEnclaveGhostOfficer(1),
      generateEnclaveGhostOfficer(2), generateEnclaveGhostOfficer(3)
    ] : [],
    hideout: {
      foundedPlotId: null,
      customBaseName: '',
      bankGold: 0,
      storedCargo: {},
      recruitsAvail: 0,
      stationedOfficers: [],
      upgrades: { warehouse: 0, tavern: 0, careenage: 0 },
      buildings: null
    },
    rep: { england: 0, spain: -15, france: 0, netherlands: 5, denmark: 5, pirates: 25 },
    rankPts: { england: 0, spain: 0, france: 0, netherlands: 0, denmark: 0, pirates: 15 },
    captain: {
      name: capNameTrim,
      gender: cState.gender || detectCharacterGender(capNameTrim),
      isGhostCaptain: startsWithSpectralPortrait,
      voodooPowers: [],
      inventory: { owned: [], equipped: { blade: null, pistol: null, coat: null, relic: null } },
      level: 1, xp: 0, xpNext: 100,
      skillPoints: 1, perkPoints: 0,
      trait: cState.chosenTrait || 'drifter',
      perks: [],
      portraitSeed: cState.portraitSeed || 42,
      portraitId: chosenPortraitId,
      svg: renderPortraitSprite(chosenPortraitId, startsWithSpectralPortrait),
      skills: { ...(cState.skills || { gunnery: 1, seamanship: 1, commerce: 1, leadership: 1, survival: 1 }) }
    }
  };

  ensureHideoutStructure();

  wind = { angle: -Math.PI * 0.45, targetAngle: -Math.PI * 0.45, speed: 1.10, targetSpeed: 1.0, changeTimer: 1000 };

  player = {
    x: nassau.x + Math.cos(nassauSeaAng) * 320,
    y: nassau.y + Math.sin(nassauSeaAng) * 320,
    shipName: td(SHIP_CLASSES.sloop, 'name'),
    clsKey: 'sloop', shipFaction: 'pirates', faction: 'player',
    isGhostShip: false, hasGhostVisual: startsWithSpectralPortrait, ghostAbility: null,
    falseFlag: null, figurehead: null, ownedFigureheads: [],
    rationLevel: 'normal', crewFocus: 0, hullSpaceShift: 0,
    shoreForageCooldowns: {},
    inBoardingLock: false, boardingInvulnTimer: 0,
    angle: nassauSeaAng, speed: 0.4, angularVel: 0, rudder: 0, sailSetting: 2,
    combatMode: false, fireCadence: 'single',
    modeTransitionTimer: 0, modeTransitionMax: 180, targetCombatMode: false, cannonExtendPct: 0,
    specialEquipment: null, specialEquipCooldown: 0, speedBoostTimer: 0, sniperCooldown: 0,
    ramCooldown: 0, groundedTimer: 0, onFire: 0, ghostFire: 0, mutinyTimer: 0,
    disease: null, woundedCrew: 0, prisoners: 0,
    prisonersByFaction: { england: 0, spain: 0, france: 0, netherlands: 0, denmark: 0, pirates: 0 },
    baseMaxSpeed: SHIP_CLASSES.sloop.baseSpeed,
    baseTurnRate: SHIP_CLASSES.sloop.turnRate,
    length: 52, width: 19, cannonsPerSide: 3,
    portCannons: initCannonsArray(3), stbdCannons: initCannonsArray(3),
    portCannonDamage: initCannonsArray(3), stbdCannonDamage: initCannonsArray(3),
    nextPortIndex: 0, nextStbdIndex: 0, singleFireInterval: 14, portFireDelay: 0, stbdFireDelay: 0,
    reloadMax: SHIP_CLASSES.sloop.reload, ammoType: 'round', baseDamage: 11, rangeBonus: 1.0,
    hull: 260, baseMaxHull: 280, maxHull: 280, sail: 195, maxSail: 210,
    crew: 24, baseMaxCrew: 44, maxCrew: 44, morale: 80, supplyTimer: 0, baseCargoCap: 65,
    cargo: {
      food: 9, rum: 7, medicine: 2, timber: 5, canvas: 4,
      sugar: 0, cotton: 0, coffee: 0, tobacco: 0, spices: 0, indigo: 0, silk: 0, silver: 0,
      cannon_6pdr: 6, cannon_12pdr: 0, cannon_18pdr: 0, cannon_32pdr: 0, cannon_ghost_18: 0, cannon_ghost_36: 0
    },
    armory: { leather: 8, cuirass: 0, cutlass: 10, rapier: 0, pistol: 6, musket: 0 },
    officers: [], fleet: [],
    skillCooldowns: { salvo: 0, repair: 0 },
    upgrades: { cannons: 0, reload: 0, damage: 0, sails: 0, hull: 0, cargo: 0 }
  };

  camera = { x: player.x, y: player.y, zoom: 1.0, targetZoom: 1.0, shake: 0 };

  populatePortTavernsAndMissions();
  recalculateFactionTerritories();
  initStormsAndWhirlpools();
  spawnRandomWhirlpool();

  ships = []; remotePlayers = {}; seaMonsters = []; bullets = []; floatingBarrels = []; flotsam = []; particles = []; wakes = []; windStreaks = [];

  const wb = getActiveWorldBounds();
  for (let i = 0; i < 95; i++) {
    windStreaks.push({ x: Math.random() * wb.w, y: Math.random() * wb.h, len: 45 + Math.random() * 65 });
  }

  if (!isMultiplayerSession || mpMode === 'open_world') {
    spawnNamedCaptains();
    for (let i = 0; i < 38; i++) spawnWorldShip();
    if (game.worldMode === 'mythology') for (let i = 0; i < 5; i++) spawnSeaMonster();
    if (!isMultiplayerSession && window.initHornigoldTutorial) initHornigoldTutorial();
  }

  updateFogOfWar(true);
  recalcPlayerDerivedStats();
  rebuildCannonPips();
  renderOfficerHudBar();
  syncFleetOrdersUI();
  applyLanguageToStaticDOM();
  updateHUD();
};

window.clampCrewEquipmentToCrewSize = function() {
  if (!player || !player.armory) return;
  const maxMen = Math.max(1, Math.ceil(player.crew));
  player.armory.cuirass = Math.min(maxMen, player.armory.cuirass || 0);
  player.armory.leather = Math.min(maxMen - player.armory.cuirass, player.armory.leather || 0);
  player.armory.rapier = Math.min(maxMen, player.armory.rapier || 0);
  player.armory.cutlass = Math.min(maxMen - player.armory.rapier, player.armory.cutlass || 0);
  player.armory.musket = Math.min(maxMen, player.armory.musket || 0);
  player.armory.pistol = Math.min(maxMen - player.armory.musket, player.armory.pistol || 0);
};

window.resetPlayerShipUpgradesOnDestruction = function() {
  const baseTpl = getFactionShipStats(player.clsKey || 'sloop', player.shipFaction || 'pirates');
  player.upgrades = { cannons: 0, reload: 0, damage: 0, sails: 0, hull: 0, cargo: 0 };
  player.hullSpaceShift = 0;
  if (!(game.captain && game.captain.isGhostCaptain) && !player.isGhostShip) player.hasGhostVisual = false;
  player.cannonsPerSide = baseTpl.cannonsPerSide;
  player.portCannons = initCannonsArray(baseTpl.cannonsPerSide);
  player.stbdCannons = initCannonsArray(baseTpl.cannonsPerSide);
  player.portCannonDamage = initCannonsArray(baseTpl.cannonsPerSide);
  player.stbdCannonDamage = initCannonsArray(baseTpl.cannonsPerSide);
  player.length = baseTpl.length; player.width = baseTpl.width;
  player.reloadMax = baseTpl.reload; player.baseDamage = baseTpl.dmg; player.rangeBonus = 1.0;
  player.maxSail = baseTpl.sail; player.baseMaxSpeed = baseTpl.baseSpeed;
  player.baseMaxHull = baseTpl.hull; player.baseCargoCap = baseTpl.cargoCap; player.baseMaxCrew = baseTpl.crew;
  player.specialEquipment = null;
  player.figurehead = null;
  recalcPlayerDerivedStats();
  rebuildCannonPips();
};

window.recalcPlayerDerivedStats = function() {
  const mods = getOfficerModifiers();
  const careenageLvl = (game.hideout && game.hideout.foundedPlotId && getHideoutBuildingLevel) ? getHideoutBuildingLevel('careenage') : 0;
  const careenageMult = 1 + careenageLvl * 0.08;
  const keelBonus = hasCaptainPerk('perk_iron_keel') ? 75 : 0;
  const shift = player.hullSpaceShift || 0; // -3..+3 (Kojen <-> Fracht)

  player.maxHull = Math.max(120, Math.round((player.baseMaxHull + (mods.hullBonus || 0) + keelBonus) * careenageMult));
  player.hull = Math.min(player.hull, player.maxHull);
  player.maxCrew = Math.max(14, player.baseMaxCrew + Math.round(mods.crewCapBonus || 0) - shift * 8);
  player.crew = Math.min(player.crew, player.maxCrew);
  player.woundedCrew = Math.min(Math.max(0, player.crew - 2), player.woundedCrew || 0);
  clampCrewEquipmentToCrewSize();
};

window.pointInPolygon = function(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1];
    const xj = pts[j][0], yj = pts[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi + 0.0001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

window.getCollidingLand = function(x, y, useStrictCoast = false) {
  const wb = getActiveWorldBounds();
  for (const land of wb.lands) {
    if (land.isGhostIsle && (!game || game.worldMode !== 'mythology')) continue;
    if (x >= land.bbox.minX && x <= land.bbox.maxX && y >= land.bbox.minY && y <= land.bbox.maxY) {
      const poly = (!useStrictCoast && land.collisionPts) ? land.collisionPts : land.pts;
      if (pointInPolygon(x, y, poly)) return land;
    }
  }
  return null;
};

window.getShoalLand = function(x, y) {
  const wb = getActiveWorldBounds();
  for (const land of wb.lands) {
    if (land.isGhostIsle && (!game || game.worldMode !== 'mythology')) continue;
    if (x >= land.bbox.minX && x <= land.bbox.maxX && y >= land.bbox.minY && y <= land.bbox.maxY) {
      if (land.shoalPts && pointInPolygon(x, y, land.shoalPts)) return land;
    }
  }
  return null;
};

window.getCargoTotal = function() {
  if (!player || !player.cargo) return 0;
  let goodsSum = 0, totalCannonsOwned = 0;
  for (const [k, v] of Object.entries(player.cargo)) {
    if (k.startsWith('cannon_')) totalCannonsOwned += v;
    else goodsSum += v;
  }
  const mountedSlots = (player.cannonsPerSide || 3) * 2;
  return goodsSum + Math.max(0, totalCannonsOwned - mountedSlots) + Math.floor(player.prisoners || 0);
};

window.getCargoWeightFactor = function() {
  let weightedSum = (player.prisoners || 0) * 1.1;
  let spareCannonAllowance = (player.cannonsPerSide || 3) * 2;
  GOODS.forEach(g => {
    let qty = player.cargo[g.id] || 0;
    if (qty > 0) {
      if (g.isCannon) {
        const mountedHere = Math.min(qty, spareCannonAllowance);
        spareCannonAllowance -= mountedHere;
        qty -= mountedHere;
      }
      if (qty > 0) weightedSum += qty * (g.weight || 1.0);
    }
  });
  return Math.max(0.62, 1.0 - Math.min(1.25, weightedSum / Math.max(25, getMaxCargo())) * 0.32);
};

window.getMaxCargo = function() {
  const mods = getOfficerModifiers();
  const shift = (player && player.hullSpaceShift) || 0;
  const fleetCargo = (player.fleet || []).reduce((sum, esc) => sum + (esc.cargoCap || 40), 0);
  const hideoutCargo = (game.hideout && game.hideout.foundedPlotId && getHideoutBuildingLevel ? getHideoutBuildingLevel('warehouse') : 0) * 45;
  return Math.max(20, player.baseCargoCap + fleetCargo + hideoutCargo + Math.round(mods.cargoBonus || 0) + shift * 12);
};