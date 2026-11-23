// ============================================================================
// hideout_logbook.js - 1714 - Blood and Doubloons
//                      Freier Kolonie-Basisbau, LIVE heruntertickender Bau-Timer,
//                      Kolonie-Investitionen, Lösegeld-Tresor & Logbuch
// ============================================================================

let currentLogbookTab = 'chronicle';
let currentEnclaveTab = 'ships';
window.nearGhostEnclave = false;

window.formatClockFromTimeOfDay = function(tod) {
  const norm = ((tod % 1) + 1) % 1;
  const totalMinutes = Math.floor(norm * 24 * 60);
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mins = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${mins}`;
};

window.isNightTime = function() {
  if (!window.game) return false;
  const hour = Math.floor(((game.timeOfDay % 1 + 1) % 1) * 24);
  return hour >= 20 || hour < 5;
};

window.addLogbookEntry = function(msg, category = 'general') {
  if (!window.game) return;
  game.logbook = game.logbook || [];
  const dayNum = Math.floor((game.time || 0) / TICKS_PER_GAME_DAY) + 1;
  const clock = formatClockFromTimeOfDay(game.timeOfDay || 0.35);
  game.logbook.unshift({ day: dayNum, clock, text: msg, category });
  if (game.logbook.length > 85) game.logbook.length = 85;
};

window.changePlayerReputation = function(delta, reasonText = '') {
  if (!window.game || delta === 0) return;
  const oldVal = game.reputation !== undefined ? game.reputation : 0;
  // Ruf-Ausschläge um ~45% abgeschwächt für sanftere Eskalation!
  const scaledDelta = delta > 0 ? Math.max(1, Math.round(delta * 0.55)) : Math.min(-1, Math.round(delta * 0.55));
  const newVal = Math.max(-100, Math.min(100, oldVal + scaledDelta));
  game.reputation = newVal;
  if (reasonText) {
    const sign = scaledDelta > 0 ? `+${scaledDelta}` : `${scaledDelta}`;
    logEvent(`${reasonText} [${t('reputationLabel')} ${sign} ➔ ${newVal}]`);
  }
  if (window.updateHUD) updateHUD();
};

window.getDailyTributeIncome = function() {
  if (!window.game || !game.conqueredPorts) return 0;
  let sum = 0;
  for (const [pid, info] of Object.entries(game.conqueredPorts)) {
    const p = PORTS.find(x => x.id === pid);
    if (p && info && info.dailyTribute > 0) sum += info.dailyTribute;
  }
  return sum;
};

window.getDailyWageBreakdown = function() {
  if (!window.player || !window.game) return { crewWage: 0, officerSalary: 0, hideoutUpkeep: 0, tributeIncome: 0, total: 0 };
  const mainCrew = Math.ceil(player.crew || 0);
  const escortCrew = (player.fleet || []).reduce((s, e) => s + Math.ceil(e.crew || 0), 0);
  const crewWage = Math.round((mainCrew + escortCrew) * CREW_DAILY_WAGE);

  const shipOfficers = player.officers || [];
  const hideoutOfficers = (game.hideout && game.hideout.stationedOfficers) || [];
  const officerSalary = [...shipOfficers, ...hideoutOfficers].reduce((s, o) => s + (o.salary || 6), 0);

  let hideoutUpkeep = 0;
  if (game.hideout && game.hideout.foundedPlotId && game.hideout.buildings) {
    HIDEOUT_BUILDINGS.forEach(def => {
      const bState = game.hideout.buildings[def.id];
      if (bState && bState.level > 0) hideoutUpkeep += bState.level * def.upkeepGoldPerLvl;
    });
  }

  const tributeIncome = getDailyTributeIncome();
  return { crewWage, officerSalary, hideoutUpkeep, tributeIncome, total: crewWage + officerSalary + hideoutUpkeep };
};

window.payDailyCrewAndOfficerWages = function() {
  if (!window.game || !window.player) return;
  ensureHideoutStructure();

  const trib = getDailyTributeIncome();
  if (trib > 0) {
    if (game.hideout.foundedPlotId) game.hideout.bankGold = (game.hideout.bankGold || 0) + trib;
    else game.gold += trib;
  }

  const wages = getDailyWageBreakdown();
  const due = wages.crewWage + wages.officerSalary;
  if (due <= 0) return;

  if (game.gold >= due) {
    game.gold -= due;
  } else if (game.hideout.foundedPlotId && (game.hideout.bankGold || 0) >= due) {
    game.hideout.bankGold -= due;
  } else {
    game.gold = 0;
    player.morale = Math.max(5, player.morale - 14);
    player.officers.forEach(o => { o.morale = Math.max(15, o.morale - 15); });
    logEvent(`⚠️ ZAHLUNGSUNFÄHIG! Heuer (${due} 🪙) konnte nicht beglichen werden – Moral sinkt!`);
  }
};

window.promptRenameShip = function(escortUid = null) {
  if (!window.player) return;
  let targetObj = null;
  let currentName = player.shipName || 'Flaggschiff';
  if (escortUid) {
    targetObj = (player.fleet || []).find(e => e.uid === escortUid);
    if (!targetObj) return;
    currentName = targetObj.name;
  }
  const input = window.prompt('Neuer Schiffsname:', currentName);
  if (input === null) return;
  const clean = input.replace(/[<>"]/g, '').trim().slice(0, 34);
  if (!clean) return;
  if (targetObj) targetObj.name = clean;
  else player.shipName = clean;
  SoundFX.play('coin');
  if (document.getElementById('captainOverlay').classList.contains('active')) renderCaptainModal();
  if (document.getElementById('portOverlay').classList.contains('active')) renderPortModal();
  if (document.getElementById('enclaveOverlay').classList.contains('active')) renderEnclaveModal();
  updateHUD();
};

window.renderWaitTimeWidgetHTML = function(contextRefreshFnName) {
  if (window.game && game.isMultiplayer) {
    return `<span style="font-size:11.5px; color:#38bdf8; font-weight:bold;">🌐 ${formatClockFromTimeOfDay(game.timeOfDay)} (Live)</span>`;
  }
  const curClock = formatClockFromTimeOfDay(game ? game.timeOfDay : 0.5);
  const curHour = Math.floor(((game ? game.timeOfDay : 0.5) * 24) % 24);
  const defaultTarget = (curHour + 6) % 24;
  const hoursOptions = [];
  for (let h = 0; h < 24; h++) {
    hoursOptions.push(`<option value="${h}" ${h === defaultTarget ? 'selected' : ''}>${String(h).padStart(2, '0')}:00 ${h >= 20 || h < 5 ? '🌙' : '☀️'}</option>`);
  }
  return `
    <div style="display:inline-flex; align-items:center; gap:6px; background:#09131d; border:1px solid #5a4628; padding:5px 10px; border-radius:6px;">
      <span style="font-size:11.5px; color:#fde047;">🕒 ${curClock}</span>
      <select id="waitTargetHourSelect_${contextRefreshFnName}" style="background:#14202c; color:#ffd700; border:1px solid #d4af37; padding:3px 6px; border-radius:4px; font-size:11.5px; font-weight:bold;">
        ${hoursOptions.join('')}
      </select>
      <button class="sm-btn" onclick="waitUntilSelectedHour('${contextRefreshFnName}')">${t('waitUntilBtn')}</button>
    </div>
  `;
};

window.waitUntilSelectedHour = function(contextRefreshFnName) {
  if (!window.game || !window.player || game.isMultiplayer) return;
  const sel = document.getElementById('waitTargetHourSelect_' + contextRefreshFnName);
  const targetHour = sel ? parseInt(sel.value, 10) : 0;
  if (isNaN(targetHour)) return;

  const targetTod = (targetHour % 24) / 24;
  const curTod = ((game.timeOfDay % 1) + 1) % 1;
  let deltaTod = targetTod - curTod;
  if (deltaTod <= 0.005) deltaTod += 1.0;

  const ticksAdvanced = Math.round(deltaTod * TICKS_PER_GAME_DAY);
  game.time += ticksAdvanced;
  game.timeOfDay = targetTod;

  FISHING_VILLAGES.forEach(fv => {
    if (fv.raidCooldown && fv.raidCooldown > 0) {
      fv.raidCooldown = Math.max(0, fv.raidCooldown - ticksAdvanced);
      if (fv.raidCooldown === 0) { fv.foodStock = Math.max(fv.foodStock || 0, 12); fv.crewAvail = Math.max(fv.crewAvail || 0, 4); }
    }
  });

  updateHideoutConstruction(ticksAdvanced / 60);
  const econCycles = Math.floor(ticksAdvanced / 2200);
  for (let i = 0; i < econCycles; i++) {
    runHideoutDailyProduction();
    payDailyCrewAndOfficerWages();
  }
  if (window.syncGhostShipsToDayNight) syncGhostShipsToDayNight();
  SoundFX.play('sail_flap');
  updateHUD();
  if (contextRefreshFnName && typeof window[contextRefreshFnName] === 'function') window[contextRefreshFnName]();
};

// ============================================================================
// FREIER BASISBAU, INVESTITIONEN & LIVE-BAUTIMER!
// ============================================================================
window.ensureHideoutStructure = function() {
  if (!window.game) return;
  game.hideout = game.hideout || {};
  const h = game.hideout;
  if (h.foundedPlotId === undefined) {
    const hadOldUpgrades = h.upgrades && (h.upgrades.warehouse > 0 || h.upgrades.tavern > 0 || h.upgrades.careenage > 0);
    h.foundedPlotId = hadOldUpgrades ? 'bp_skull_cove' : null;
  }
  h.customBaseName = h.customBaseName || '';
  h.bankGold = h.bankGold || 0;
  h.storedCargo = h.storedCargo || {};
  h.recruitsAvail = h.recruitsAvail || 0;
  h.stationedOfficers = h.stationedOfficers || [];

  if (!h.buildings) {
    h.buildings = {};
    HIDEOUT_BUILDINGS.forEach(def => {
      const legacyLvl = (h.upgrades && h.upgrades[def.id]) || 0;
      h.buildings[def.id] = { level: legacyLvl, constructingTo: 0, buildRemainingSec: 0, buildTotalSec: 0, officerUid: null };
    });
  } else {
    HIDEOUT_BUILDINGS.forEach(def => {
      if (!h.buildings[def.id]) h.buildings[def.id] = { level: 0, constructingTo: 0, buildRemainingSec: 0, buildTotalSec: 0, officerUid: null };
    });
  }

  h.stationedOfficers.forEach(o => {
    const g = detectCharacterGender(o.name, o.gender);
    if (!o.portraitId) o.portraitId = pickPortraitForRole(o.roleId, o.faction, o.portraitSeed || 50, !!o.isGhostOfficer, g);
    o.svg = renderPortraitSprite(o.portraitId, !!o.isGhostOfficer);
  });

  const fortLvl = (h.buildings && h.buildings.coastal_fort && h.buildings.coastal_fort.level) || 0;
  h.maxFortHp = fortLvl * 650;
  if (h.fortHp === undefined || h.fortHp > h.maxFortHp) h.fortHp = h.maxFortHp;
  h.fortCooldown = h.fortCooldown || 0;
};

window.getMaxHideoutBuildPoints = function() {
  const bonus = window.getColonyInvestmentBonusPoints ? getColonyInvestmentBonusPoints() : 0;
  return HIDEOUT_MAX_POINTS + bonus;
};

window.canPlayerFoundBaseNow = function() {
  const mods = getOfficerModifiers();
  const hasBuilder = (mods.canFoundBase || 0) > 0 || hasOfficerRole('master_builder') || hasOfficerRole('shipwright');
  const req = BASE_FOUNDING_REQ;
  const hasGold = game.gold >= req.gold;
  const hasTimber = (player.cargo.timber || 0) >= req.timber;
  const hasCanvas = (player.cargo.canvas || 0) >= req.canvas;
  const hasFood = (player.cargo.food || 0) >= req.food;
  return { allowed: hasBuilder && hasGold && hasTimber && hasCanvas && hasFood, hasBuilder, hasGold, hasTimber, hasCanvas, hasFood };
};

window.foundPlayerColonyAtPlot = function(plotId) {
  ensureHideoutStructure();
  if (game.hideout.foundedPlotId) return;
  const plot = BASE_PLOTS.find(b => b.id === plotId);
  if (!plot || !canPlayerFoundBaseNow().allowed) return;

  const nameIn = document.getElementById('newColonyNameInput');
  const customName = nameIn ? nameIn.value.replace(/[<>"]/g, '').trim().slice(0, 32) : '';

  game.gold -= BASE_FOUNDING_REQ.gold;
  player.cargo.timber -= BASE_FOUNDING_REQ.timber;
  player.cargo.canvas -= BASE_FOUNDING_REQ.canvas;
  player.cargo.food -= BASE_FOUNDING_REQ.food;

  game.hideout.foundedPlotId = plot.id;
  game.hideout.customBaseName = customName || td(plot, 'name');
  game.hideout.buildings.warehouse.level = 1;

  if (window.NetClient && NetClient.isConnected()) NetClient.sendBaseClaim(plot.id, game.hideout.customBaseName);
  SoundFX.play('coin');
  grantCaptainXP(60, `🏗️ Kolonie gegründet: „${game.hideout.customBaseName}“!`);
  recalcPlayerDerivedStats();
  updateHUD();
  renderHideoutModal();
};

window.abandonEntirePlayerBase = function() {
  ensureHideoutStructure();
  if (!game.hideout.foundedPlotId) return;
  while (game.hideout.stationedOfficers.length > 0 && player.officers.length < MAX_OFFICERS) {
    const off = game.hideout.stationedOfficers.shift();
    off.assignedHideoutBuildingId = null;
    player.officers.push(off);
  }
  game.gold += (game.hideout.bankGold || 0);
  game.hideout.bankGold = 0;
  game.hideout.foundedPlotId = null;
  game.hideout.customBaseName = '';
  HIDEOUT_BUILDINGS.forEach(def => {
    game.hideout.buildings[def.id] = { level: 0, constructingTo: 0, buildRemainingSec: 0, buildTotalSec: 0, officerUid: null };
  });
  SoundFX.play('hit');
  recalcPlayerDerivedStats(); renderOfficerHudBar(); updateHUD(); renderHideoutModal();
};

window.getHideoutBuildingLevel = function(bId) {
  if (!window.game || !game.hideout || !game.hideout.foundedPlotId || !game.hideout.buildings || !game.hideout.buildings[bId]) return 0;
  return game.hideout.buildings[bId].level || 0;
};

window.getUsedHideoutBuildPoints = function() {
  ensureHideoutStructure();
  let used = 0;
  HIDEOUT_BUILDINGS.forEach(def => {
    const st = game.hideout.buildings[def.id];
    used += (st.constructingTo > st.level ? st.constructingTo : st.level) * def.ptsPerLvl;
  });
  return used;
};

window.findStationedOfficerForBuilding = function(bId) {
  ensureHideoutStructure();
  const st = game.hideout.buildings[bId];
  if (!st || !st.officerUid) return null;
  return game.hideout.stationedOfficers.find(o => o.uid === st.officerUid) || null;
};

window.getShipCrewConstructionBonusMult = function() {
  if (!window.player || !player.officers) return 1.0;
  let bonus = 1.0;
  if (player.officers.some(o => o.roleId === 'master_builder')) bonus += 0.35;
  const carp = player.officers.find(o => o.roleId === 'carpenter');
  if (carp) bonus += carp.isGhostOfficer ? 0.40 : 0.25;
  if (player.officers.some(o => o.roleId === 'shipwright')) bonus += 0.20;
  return bonus;
};

window.getOfficerBuildSpeedMult = function(def, officer, includeShipBonus = true) {
  const shipBonus = includeShipBonus ? getShipCrewConstructionBonusMult() : 1.0;
  if (!officer || !def) return shipBonus;
  let mult = (def.buildAffinities && def.buildAffinities[officer.roleId]) || 0.95;
  if (officer.isGhostOfficer && officer.roleId === 'carpenter') mult += 0.35;
  return Math.max(0.45, Math.min(2.8, mult * shipBonus));
};

window.getOfficerProdEfficiencyMult = function(def, officer) {
  const invYieldBonus = window.getColonyInvestmentYieldBonus ? getColonyInvestmentYieldBonus() : 0;
  if (!officer || !def) return 1.0 + invYieldBonus;
  let mult = (def.prodAffinities && def.prodAffinities[officer.roleId]) || 0.88;
  if (officer.isGhostOfficer) {
    if (def.id === 'powder_mill' || def.id === 'careenage') mult += 0.30;
    if (def.id === 'herb_garden' || def.id === 'rum_distillery') mult -= 0.30;
  }
  if (officer.posTrait && officer.posTrait.id === 'haggler') mult += 0.10;
  if (officer.negTrait && officer.negTrait.id === 'greedy') mult -= 0.18;
  return Math.max(0.35, Math.min(2.4, mult + invYieldBonus));
};

// BUGFIX: Aktualisiert Baufortschritt UND aktualisiert die Sekunden-Anzeige LIVE im geöffneten Fenster!
window.updateHideoutConstruction = function(dtSec) {
  if (!window.game || !game.hideout || !game.hideout.foundedPlotId || !game.hideout.buildings || dtSec <= 0) return;
  let anyCompleted = false;
  const hideoutModalOpen = document.getElementById('hideoutOverlay').classList.contains('active');

  HIDEOUT_BUILDINGS.forEach(def => {
    const st = game.hideout.buildings[def.id];
    if (st && st.constructingTo > st.level && st.buildRemainingSec > 0) {
      const off = findStationedOfficerForBuilding(def.id);
      const speedMult = getOfficerBuildSpeedMult(def, off, true);
      st.buildRemainingSec = Math.max(0, st.buildRemainingSec - dtSec * speedMult);

      if (st.buildRemainingSec <= 0) {
        st.level = st.constructingTo;
        st.constructingTo = 0; st.buildTotalSec = 0;
        if (def.id === 'coastal_fort') {
          game.hideout.maxFortHp = st.level * 650;
          game.hideout.fortHp = game.hideout.maxFortHp;
        }
        anyCompleted = true;
        SoundFX.play('coin');
        logEvent(`🏴‍☠️ ${td(def, 'name')} (Lv.${st.level}) fertiggestellt!`);
      } else if (hideoutModalOpen) {
        // Live-DOM-Update der Restsekunden & des Fortschrittsbalkens ohne Neuaufbau des Menüs!
        const timerSpan = document.getElementById('buildTimerSec_' + def.id);
        const barFill = document.getElementById('buildProgBar_' + def.id);
        if (timerSpan) {
          const estLeft = Math.ceil(st.buildRemainingSec / Math.max(0.4, speedMult));
          timerSpan.textContent = `${estLeft}s`;
        }
        if (barFill && st.buildTotalSec > 0) {
          const pct = Math.min(100, Math.max(0, (1 - st.buildRemainingSec / st.buildTotalSec) * 100));
          barFill.style.width = `${pct.toFixed(1)}%`;
        }
      }
    }
  });

  if (anyCompleted) {
    recalcPlayerDerivedStats();
    updateHUD();
    if (hideoutModalOpen) renderHideoutModal();
  }
};

window.runHideoutDailyProduction = function() {
  ensureHideoutStructure();
  const h = game.hideout;
  if (!h.foundedPlotId) return;
  const maxVaultCargo = 60 + getHideoutBuildingLevel('warehouse') * 55;

  HIDEOUT_BUILDINGS.forEach(def => {
    const st = h.buildings[def.id];
    if (!st || st.level <= 0) return;
    const upkeep = st.level * def.upkeepGoldPerLvl;
    if (h.bankGold >= upkeep) h.bankGold -= upkeep;
    else if (game.gold >= upkeep) game.gold -= upkeep;
    else return;

    const off = findStationedOfficerForBuilding(def.id);
    const effMult = getOfficerProdEfficiencyMult(def, off);

    for (const [outKey, baseAmt] of Object.entries(def.outputs || {})) {
      const rawProduced = baseAmt * st.level * effMult;
      const qty = Math.max(0, Math.floor(rawProduced + (Math.random() < (rawProduced % 1) ? 1 : 0)));
      if (qty <= 0) continue;
      if (outKey === 'goldIncome') h.bankGold += qty;
      else if (outKey === 'recruits') h.recruitsAvail = Math.min(st.level * 10, (h.recruitsAvail || 0) + qty);
      else {
        const curTotalStored = Object.values(h.storedCargo).reduce((a, b) => a + b, 0);
        const addQty = Math.min(Math.max(0, maxVaultCargo - curTotalStored), qty);
        if (addQty > 0) h.storedCargo[outKey] = (h.storedCargo[outKey] || 0) + addQty;
      }
    }
    if (def.id === 'powder_mill' && st.level >= 3 && Math.random() < 0.30 * effMult) {
      h.storedCargo.cannon_12pdr = (h.storedCargo.cannon_12pdr || 0) + 1;
    }
  });
};

window.startHideoutBuildingUpgrade = function(bId) {
  ensureHideoutStructure();
  if (!game.hideout.foundedPlotId) return;
  const def = HIDEOUT_BUILDINGS.find(b => b.id === bId);
  const st = game.hideout.buildings[bId];
  if (!def || !st || st.constructingTo > st.level || st.level >= def.max) return;
  if (getUsedHideoutBuildPoints() + def.ptsPerLvl > getMaxHideoutBuildPoints()) return;

  const mods = getOfficerModifiers();
  const disc = Math.min(0.35, mods.baseBuildDiscount || 0);
  const nextLvl = st.level + 1;
  const cost = Math.round(def.baseCost * Math.pow(1.6, st.level) * (1 - disc));
  if (game.gold < cost) return;

  game.gold -= cost;
  const totalSec = Math.round(def.buildSecondsPerLvl * (1 + st.level * 0.45));
  st.constructingTo = nextLvl;
  st.buildTotalSec = totalSec;
  st.buildRemainingSec = totalSec;

  SoundFX.play('coin');
  updateHUD();
  renderHideoutModal();
};

window.downgradeOrDemolishHideoutBuilding = function(bId, demolishAll = false) {
  ensureHideoutStructure();
  const def = HIDEOUT_BUILDINGS.find(b => b.id === bId);
  const st = game.hideout.buildings[bId];
  if (!def || !st) return;

  if (st.constructingTo > st.level) {
    game.gold += Math.round(def.baseCost * Math.pow(1.6, st.level) * 0.5);
    st.constructingTo = 0; st.buildRemainingSec = 0; st.buildTotalSec = 0;
    if (st.level === 0 && st.officerUid) recallOfficerFromHideoutBuilding(bId, true);
    updateHUD(); renderHideoutModal(); return;
  }
  if (st.level <= 0) return;
  st.level = demolishAll ? 0 : Math.max(0, st.level - 1);
  if (st.level === 0 && st.officerUid) recallOfficerFromHideoutBuilding(bId, true);
  recalcPlayerDerivedStats();
  SoundFX.play('hit');
  updateHUD(); renderHideoutModal();
};

window.assignOfficerToHideoutBuilding = function(bId, officerUid) {
  ensureHideoutStructure();
  const st = game.hideout.buildings[bId];
  if (!st) return;
  if (!officerUid) { recallOfficerFromHideoutBuilding(bId); return; }

  if (st.officerUid && st.officerUid !== officerUid) {
    const prevIdx = game.hideout.stationedOfficers.findIndex(o => o.uid === st.officerUid);
    if (prevIdx !== -1) {
      const prevOff = game.hideout.stationedOfficers.splice(prevIdx, 1)[0];
      prevOff.assignedHideoutBuildingId = null;
      player.officers.push(prevOff);
    }
    st.officerUid = null;
  }

  const shipIdx = player.officers.findIndex(o => o.uid === officerUid);
  if (shipIdx === -1 || player.officers[shipIdx].assignedShipUid) return;
  const off = player.officers.splice(shipIdx, 1)[0];
  off.assignedHideoutBuildingId = bId;
  game.hideout.stationedOfficers.push(off);
  st.officerUid = off.uid;

  recalcPlayerDerivedStats(); renderOfficerHudBar(); updateHUD(); renderHideoutModal();
};

window.recallOfficerFromHideoutBuilding = function(bId, silent = false) {
  ensureHideoutStructure();
  const st = game.hideout.buildings[bId];
  if (!st || !st.officerUid || player.officers.length >= MAX_OFFICERS) return;
  const idx = game.hideout.stationedOfficers.findIndex(o => o.uid === st.officerUid);
  if (idx !== -1) {
    const off = game.hideout.stationedOfficers.splice(idx, 1)[0];
    off.assignedHideoutBuildingId = null;
    player.officers.push(off);
  }
  st.officerUid = null;
  recalcPlayerDerivedStats(); renderOfficerHudBar(); updateHUD();
  if (!silent && document.getElementById('hideoutOverlay').classList.contains('active')) renderHideoutModal();
};

window.transferHideoutGoodToShip = function(goodId, qty) {
  ensureHideoutStructure();
  const avail = Math.floor((game.hideout.storedCargo && game.hideout.storedCargo[goodId]) || 0);
  const take = Math.min(avail, Math.max(0, Math.floor(getMaxCargo() - getCargoTotal())), qty);
  if (take <= 0) return;
  game.hideout.storedCargo[goodId] -= take;
  player.cargo[goodId] = (player.cargo[goodId] || 0) + take;
  SoundFX.play('coin');
  updateHUD(); renderHideoutModal();
};

window.depositShipGoodToHideout = function(goodId, qty) {
  ensureHideoutStructure();
  const maxVault = 60 + getHideoutBuildingLevel('warehouse') * 55;
  const curStored = Object.values(game.hideout.storedCargo).reduce((a, b) => a + b, 0);
  const move = Math.min(Math.floor(player.cargo[goodId] || 0), Math.max(0, maxVault - curStored), qty);
  if (move <= 0) return;
  player.cargo[goodId] -= move;
  game.hideout.storedCargo[goodId] = (game.hideout.storedCargo[goodId] || 0) + move;
  SoundFX.play('coin');
  updateHUD(); renderHideoutModal();
};

window.renderHideoutModal = function() {
  ensureHideoutStructure();
  if (window.applySceneBackgroundToModal) {
    const isFounded = !!(currentBasePlot && game.hideout && game.hideout.foundedPlotId === currentBasePlot.id);
    applySceneBackgroundToModal('hideoutOverlay', isFounded ? 'colony_cove' : 'shipyard_beach');
  }
  const h = game.hideout;
  const plot = currentBasePlot || BASE_PLOTS.find(b => b.id === h.foundedPlotId) || BASE_PLOTS[0];
  const titleEl = document.getElementById('hideoutTitle');

  if (!h.foundedPlotId || h.foundedPlotId !== plot.id) {
    if (titleEl) titleEl.textContent = `🏗️ ${td(plot, 'name')}`;
    const chk = canPlayerFoundBaseNow();
    const req = BASE_FOUNDING_REQ;

    document.getElementById('hideoutBody').innerHTML = `
      <div class="card-box" style="background:#09131d; border:2px solid #fbbf24; padding:18px;">
        <div class="card-title" style="font-size:17px; color:#fde047;">🏝️ Freier Küsten-Bauplatz für deine eigene Kolonie-Basis!</div>
        <div class="card-desc" style="font-size:13px; color:#e2e8f0; margin-top:8px;">
          Erfordert einen <strong>Festungs-/Koloniebaumeister</strong> oder <strong>Schiffbaumeister</strong> an Bord sowie Baumaterial im Frachtraum (Schenkt sofort Lagerhaus &amp; Schatzgewölbe Stufe 1!):
        </div>
        <div class="grid-2" style="margin:14px 0;">
          <div class="card-box" style="border-color:${chk.hasBuilder ? '#2ecc71' : '#ef4444'};">
            <div class="card-title">🎖️ Fachkundiger Baumeister an Bord</div>
            <div class="card-desc" style="color:${chk.hasBuilder ? '#2ecc71' : '#fca5a5'}; font-weight:bold;">
              ${chk.hasBuilder ? '✓ Bereit zur Grundsteinlegung!' : '✖ Fehlt! Heuere in einer Taverne einen Baumeister oder Schiffbaumeister an.'}
            </div>
          </div>
          <div class="card-box">
            <div class="card-title">🪵 Benötigte Gründungs-Rohstoffe</div>
            <div class="card-desc" style="font-size:12.5px; line-height:1.6;">
              🪙 Gold: <strong style="color:${chk.hasGold ? '#2ecc71' : '#ef4444'};">${game.gold} / ${req.gold}</strong> &nbsp;|&nbsp;
              🪵 Holz: <strong style="color:${chk.hasTimber ? '#2ecc71' : '#ef4444'};">${Math.floor(player.cargo.timber || 0)} / ${req.timber}</strong><br>
              ⛵ Segeltuch: <strong style="color:${chk.hasCanvas ? '#2ecc71' : '#ef4444'};">${Math.floor(player.cargo.canvas || 0)} / ${req.canvas}</strong> &nbsp;|&nbsp;
              🍖 Proviant: <strong style="color:${chk.hasFood ? '#2ecc71' : '#ef4444'};">${Math.floor(player.cargo.food || 0)} / ${req.food}</strong>
            </div>
          </div>
        </div>
        <div style="margin-bottom:14px;">
          <label style="font-size:12px; color:#94a3b8;">✒️ Name deiner neuen Kolonie:</label>
          <input id="newColonyNameInput" type="text" value="${escapeHtml(td(plot, 'name'))}" style="width:100%; margin-top:4px; background:#081018; border:1px solid #d4af37; color:#ffd700; padding:7px 10px; border-radius:6px; font-weight:bold;">
        </div>
        <button class="primary-btn" style="width:100%; font-size:15px;" ${!chk.allowed ? 'disabled' : ''} onclick="foundPlayerColonyAtPlot('${plot.id}')">
          🏗️ Grundstein legen &amp; Kolonie-Basis errichten!
        </button>
      </div>
    `;
    return;
  }

  if (titleEl) titleEl.textContent = `🏴‍☠️ ${escapeHtml(h.customBaseName || td(plot, 'name'))}`;
  const usedPts = getUsedHideoutBuildPoints();
  const maxPts = getMaxHideoutBuildPoints();
  const shipConstructMult = getShipCrewConstructionBonusMult();
  const shipBonusPct = Math.round((shipConstructMult - 1) * 100);
  const hasMerchant = hasOfficerRole('merchant');
  const wages = getDailyWageBreakdown();
  const mods = getOfficerModifiers();
  const buildDisc = Math.min(0.35, mods.baseBuildDiscount || 0);
  const ransomNeeded = Math.max(window.RANSOM_MIN_COST || 450, (game.captain.level || 1) * 180);
  const ransomCovered = (h.bankGold || 0) >= ransomNeeded;

  const cLvl = getHideoutBuildingLevel('careenage');
  const tLvl = getHideoutBuildingLevel('tavern');
  const fLvl = getHideoutBuildingLevel('coastal_fort');
  const maxVault = 60 + getHideoutBuildingLevel('warehouse') * 55;
  const curStored = Object.values(h.storedCargo || {}).reduce((a, b) => a + b, 0);
  const needsRepair = player.hull < player.maxHull || player.sail < player.maxSail || (player.fleet || []).some(e => e.hull < e.maxHull) || (fLvl > 0 && (h.fortHp || 0) < (h.maxFortHp || 0));
  const assignableShipOfficers = (player.officers || []).filter(o => !o.assignedShipUid);

  document.getElementById('hideoutBody').innerHTML = `
    <div class="card-box" style="margin-bottom:12px; background:#091119; border-color:#a855f7;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <div class="card-title" style="font-size:15px;">
            🏗️ Baupunkte: <span style="color:${usedPts >= maxPts ? '#ef4444' : '#2ecc71'};">${usedPts} / ${maxPts}</span>
            &nbsp;|&nbsp; 💰 Unterhalt/Tag: <span style="color:#fde047;">${wages.hideoutUpkeep} 🪙</span>
            ${wages.tributeIncome > 0 ? `&nbsp;|&nbsp; 👑 +${wages.tributeIncome} 🪙` : ''}
          </div>
          <div style="font-size:11.5px; color:#94a3b8; margin-top:3px;">
            🔨 Bautempo-Bonus: <strong style="color:#2ecc71;">+${shipBonusPct}%</strong>
            &nbsp;|&nbsp; 🏛️ Investiert: <strong style="color:#fde047;">${game.baseInvestmentGold || 0} 🪙</strong> (+${Math.round((getColonyInvestmentYieldBonus()||0)*100)}% Ertrag)
            ${fLvl > 0 ? `&nbsp;|&nbsp; 🏰 Bastion: <strong style="color:#38bdf8;">${Math.ceil(h.fortHp || 0)} / ${h.maxFortHp || 0} HP</strong>` : ''}
          </div>
        </div>
        <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
          <button class="sm-btn" style="border-color:#ffd700; color:#fde047;" ${game.gold < 300 ? 'disabled' : ''} onclick="investInOwnColonyOrPort(300)" title="Je 600 investierte Dublonen schenken +2 Baupunkte & mehr Ertrag!">🏛️ +300 🪙 investieren</button>
          <button class="sm-btn" style="border-color:#38bdf8; color:#bae6fd;" onclick="toggleShipInventoryModal()">🧰 Schiffsinventar &amp; Rumpf-Umbau [I]</button>
          ${renderWaitTimeWidgetHTML('renderHideoutModal')}
          <button class="sm-btn" style="border-color:#ef4444; color:#fecaca;" onclick="abandonEntirePlayerBase()">🏚️</button>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:8px; border-top:1px solid #263545; flex-wrap:wrap; gap:8px;">
        <div>
          🪙 Bordkasse: <strong style="color:#ffd700;">${game.gold}</strong> &nbsp;|&nbsp;
          🏦 Schatzgewölbe: <strong style="color:${ransomCovered ? '#2ecc71' : '#ef4444'};">${h.bankGold || 0} 🪙</strong>
          <span style="font-size:11px; color:${ransomCovered ? '#a7f3d0' : '#fca5a5'};">(${ransomCovered ? `✓ Lösegeld ${ransomNeeded}🪙 gesichert` : `⚠️ Mind. ${ransomNeeded}🪙 für Auslösung nötig!`})</span>
        </div>
        <div style="display:flex; gap:5px; flex-wrap:wrap;">
          <button class="sm-btn" onclick="hideoutBankAction(true, 100)">+100 🪙</button>
          <button class="sm-btn" onclick="hideoutBankAction(true, 500)">+500 🪙</button>
          <button class="sm-btn" onclick="hideoutBankAction(false, 100)">-100 🪙</button>
          <button class="sm-btn" onclick="hideoutBankAction(false, 999999)">Alles abheben</button>
          ${tLvl > 0 ? `<button class="sm-btn" style="border-color:#2ecc71; color:#a7f3d0;" onclick="claimHideoutRecruitsAndFeast()">🍻 +${h.recruitsAvail || 0} 👥</button>` : ''}
          ${cLvl > 0 ? `<button class="sm-btn" style="border-color:#38bdf8; color:#bae6fd;" ${!needsRepair ? 'disabled' : ''} onclick="useHideoutCareenageRepair()">🛠️ Gratis-Reparatur</button>` : ''}
        </div>
      </div>
    </div>

    <div class="card-box" style="margin-bottom:14px; background:#0b131c;">
      <div class="card-title">📦 Basis-Depot (${Math.ceil(curStored)} / ${maxVault}) — ⛵ ${Math.ceil(getCargoTotal())} / ${getMaxCargo()}</div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
        ${GOODS.filter(g => (h.storedCargo[g.id] || 0) > 0 || (player.cargo[g.id] || 0) >= 2).map(g => {
          const inVault = Math.floor(h.storedCargo[g.id] || 0);
          const onShip = Math.floor(player.cargo[g.id] || 0);
          return `
            <div style="background:#111d2b; border:1px solid #475569; border-radius:6px; padding:6px 9px; font-size:11.5px; display:flex; align-items:center; gap:6px;">
              <span>${g.icon} <strong>${td(g, 'name').split(' ')[0]}</strong>: <span style="color:#2ecc71;">${inVault}</span></span>
              <button class="sm-btn" ${inVault <= 0 ? 'disabled' : ''} onclick="transferHideoutGoodToShip('${g.id}', 999)">➔⛵</button>
              <button class="sm-btn" ${onShip <= 0 || curStored >= maxVault ? 'disabled' : ''} onclick="depositShipGoodToHideout('${g.id}', 5)">➔🏦</button>
            </div>
          `;
        }).join('') || `<span style="font-size:11.5px; color:#64748b;">—</span>`}
      </div>
    </div>

    <div class="grid-2">
      ${HIDEOUT_BUILDINGS.map(def => {
        const st = h.buildings[def.id];
        const isBuilding = st.constructingTo > st.level;
        const nextCost = Math.round(def.baseCost * Math.pow(1.6, st.level) * (1 - buildDisc));
        const stationOff = findStationedOfficerForBuilding(def.id);
        const canAffordPts = (usedPts + def.ptsPerLvl) <= maxPts;
        const canBuild = !isBuilding && st.level < def.max && canAffordPts && game.gold >= nextCost;

        const totalBuildSpeedMult = getOfficerBuildSpeedMult(def, stationOff, true);
        const pEffMult = stationOff ? getOfficerProdEfficiencyMult(def, stationOff) : (1.0 + (getColonyInvestmentYieldBonus()||0));
        const baseSec = Math.round(def.buildSecondsPerLvl * (1 + st.level * 0.45));
        const effectivePreviewSec = Math.ceil(baseSec / Math.max(0.4, totalBuildSpeedMult));
        const estSecLeft = isBuilding ? Math.ceil(st.buildRemainingSec / Math.max(0.4, totalBuildSpeedMult)) : 0;
        const progPct = (isBuilding && st.buildTotalSec > 0) ? Math.min(100, Math.max(0, (1 - st.buildRemainingSec / st.buildTotalSec) * 100)) : 0;

        return `
          <div class="card-box" style="border-color:${isBuilding ? '#f59e0b' : (st.level > 0 ? '#2ecc71' : '#5a4628')};">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div class="card-title">${def.icon} ${td(def, 'name')} (${st.level}/${def.max})</div>
                <span class="badge badge-norm">${def.ptsPerLvl} BP</span>
              </div>
              <div class="card-desc">
                ${tr(def.desc_de, def.desc_en)}<br>
                💰 <strong>${st.level * def.upkeepGoldPerLvl} 🪙/T</strong> | ⏳ <strong>~${effectivePreviewSec}s</strong>
              </div>
              ${isBuilding ? `
                <div style="margin-bottom:8px; padding:6px 8px; background:#231a0b; border:1px solid #f59e0b; border-radius:5px; font-size:11.5px; color:#fde047;">
                  <div style="display:flex; justify-content:space-between;">
                    <span>🚧 Bau auf Stufe ${st.constructingTo}</span>
                    <strong id="buildTimerSec_${def.id}">${estSecLeft}s</strong>
                  </div>
                  <div style="width:100%; height:6px; background:#0f172a; border-radius:3px; margin-top:4px; overflow:hidden;">
                    <div id="buildProgBar_${def.id}" style="width:${progPct.toFixed(1)}%; height:100%; background:#f59e0b; transition:width 0.25s linear;"></div>
                  </div>
                </div>
              ` : ''}
              <div style="background:#081018; border:1px solid #334155; border-radius:6px; padding:6px 8px; margin-bottom:8px; font-size:11px; display:flex; justify-content:space-between; align-items:center; gap:6px;">
                <div style="display:flex; align-items:center; gap:6px;">
                  ${stationOff ? renderPortraitBox(stationOff.svg, 36, '#d4af37', stationOff.isGhostOfficer) : ''}
                  <strong>🎖️</strong>
                </div>
                <select style="background:#14202c; color:#ffd700; border:1px solid #d4af37; padding:2px 6px; border-radius:4px; font-size:11px; flex:1;" onchange="assignOfficerToHideoutBuilding('${def.id}', this.value)">
                  <option value="">— Kein Verwalter —</option>
                  ${stationOff ? `<option value="${stationOff.uid}" selected>✓ ${escapeHtml(stationOff.name)} ${hasMerchant ? `(⚖️${Math.round((pEffMult-1)*100)}%)` : ''}</option>` : ''}
                  ${assignableShipOfficers.map(o => `<option value="${o.uid}">${escapeHtml(o.name)} (${td(OFFICER_ROLES.find(r=>r.roleId===o.roleId)||o, 'title')})</option>`).join('')}
                </select>
              </div>
            </div>
            <div style="display:flex; gap:6px;">
              ${isBuilding ? `
                <button class="sm-btn" style="border-color:#ef4444; color:#fecaca; flex:1;" onclick="downgradeOrDemolishHideoutBuilding('${def.id}', false)">✖ Abbrechen (50%)</button>
              ` : `
                <button class="action-btn" style="flex:2;" ${!canBuild ? 'disabled' : ''} onclick="startHideoutBuildingUpgrade('${def.id}')">
                  <span>${st.level >= def.max ? 'MAX ✓' : (st.level === 0 ? 'Errichten' : 'Ausbauen')}</span>
                  <span>${st.level >= def.max ? '' : `${nextCost} 🪙`}</span>
                </button>
                ${st.level > 0 ? `<button class="sm-btn" style="border-color:#f59e0b; color:#fde047;" onclick="downgradeOrDemolishHideoutBuilding('${def.id}', false)">-1</button>` : ''}
              `}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
};

window.toggleLogbookModal = function() {
  if (!window.game) return;
  const ov = document.getElementById('logbookOverlay');
  if (!ov) return;
  ov.classList.toggle('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
  if (ov.classList.contains('active')) renderLogbookModal();
};

window.switchLogbookTab = function(tab) { currentLogbookTab = tab; renderLogbookModal(); };

window.renderLogbookModal = function() {
  const body = document.getElementById('logbookBody');
  if (!body || !window.game) return;
  if (window.applySceneBackgroundToModal) applySceneBackgroundToModal('logbookOverlay', 'gov_pirates');
  const repScore = game.reputation || 0;
  const repTier = getPlayerReputationTier(repScore);
  const wages = getDailyWageBreakdown();
  const hasMerchant = hasOfficerRole('merchant');

  let contentHtml = '';
  if (currentLogbookTab === 'chronicle') {
    const entries = game.logbook || [];
    const ms = game.activeMission;
    contentHtml = `
      ${ms ? `
        <div class="card-box" style="margin-bottom:12px; background:#1c1608; border-color:#ffd700; flex-direction:row; align-items:center; gap:10px;">
          <div style="flex:1;"><div class="card-title">📜 ${escapeHtml(ms.title)}</div><div class="card-desc" style="color:#e2e8f0; margin:0;">${escapeHtml(ms.desc)} — 💰 +${ms.rewardGold} 🪙</div></div>
          <button class="action-btn danger" onclick="abandonActiveMission()">${t('abandonMissionBtn')}</button>
        </div>
      ` : ''}
      ${game.activePassenger ? `<div class="card-box" style="margin-bottom:12px; border-color:#38bdf8;"><div class="card-title">🎩 Passagier an Bord: ${escapeHtml(game.activePassenger.name)} ➔ ${game.activePassenger.destPortName} (+${game.activePassenger.baseFare} 🪙)</div></div>` : ''}
      <div class="card-box" style="max-height:360px; overflow-y:auto; background:#081018;">
        ${entries.length === 0 ? `<div style="color:#94a3b8;">—</div>` : entries.map(e => `
          <div style="padding:6px 4px; border-bottom:1px solid #1e293b; font-size:12px;">
            <span style="color:#fde047; font-weight:bold;">[Tag ${e.day} • ${e.clock}]</span>
            <span style="color:#f1f5f9; margin-left:6px;">${escapeHtml(e.text)}</span>
          </div>`).join('')}
      </div>
    `;
  } else if (currentLogbookTab === 'reputation') {
    contentHtml = `
      <div class="card-box" style="background:#091119; border-color:${repTier.color}; margin-bottom:12px;">
        <div class="card-title" style="font-size:16px; color:${repTier.color};">☠️ ${repScore} / 100 — ${repTier.label}</div>
      </div>
      <div class="card-box" style="background:#091119;">
        <div class="card-title">💰 Tägliche Bilanz</div>
        <div class="card-desc" style="font-size:12.5px; margin-top:6px;">
          🏴‍☠️ Heuer: -${wages.crewWage} 🪙 | 🎖️ Sold: -${wages.officerSalary} 🪙 | 🏗️ Kolonie: -${wages.hideoutUpkeep} 🪙 | 👑 Tribut: <strong style="color:#2ecc71;">+${wages.tributeIncome} 🪙</strong>
        </div>
      </div>
    `;
  } else {
    const visited = (game.visitedPortsLog && Object.keys(game.visitedPortsLog)) || [];
    contentHtml = `
      <div class="card-box" style="max-height:420px; overflow-y:auto; background:#081018;">
        ${visited.length === 0 ? `<div style="color:#94a3b8;">—</div>` : `<table class="trade-table"><thead><tr><th>Hafen</th><th>Fraktion</th><th>Export / Import</th></tr></thead><tbody>
          ${visited.map(pid => {
            const p = PORTS.find(x => x.id === pid);
            const info = game.visitedPortsLog[pid];
            if (!p) return '';
            return `<tr><td><strong>${p.name}</strong></td><td style="color:${FACTIONS[p.faction].color};">${td(FACTIONS[p.faction], 'short')}</td><td style="font-size:11.5px;">${info.knownTrade || hasMerchant ? `📉 <span style="color:#2ecc71;">${escapeHtml(info.exportsText)}</span> | 📈 <span style="color:#ffd700;">${escapeHtml(info.importsText)}</span>` : '—'}</td></tr>`;
          }).join('')}
        </tbody></table>`}
      </div>
    `;
  }

  body.innerHTML = `
    <div class="tabs-bar">
      <button class="tab-btn ${currentLogbookTab === 'chronicle' ? 'active' : ''}" onclick="switchLogbookTab('chronicle')">📜 Chronik</button>
      <button class="tab-btn ${currentLogbookTab === 'reputation' ? 'active' : ''}" onclick="switchLogbookTab('reputation')">☠️ Ruf &amp; Bilanz</button>
      <button class="tab-btn ${currentLogbookTab === 'trade' ? 'active' : ''}" onclick="switchLogbookTab('trade')">⚖️ Häfen</button>
    </div>
    ${contentHtml}
  `;
};

window.openEnclaveModal = function() {
  if (!window.game || game.worldMode !== 'mythology' || !window.nearGhostEnclave) return;
  const repTier = getPlayerReputationTier(game.reputation || 0);
  const isGhostCap = !!(game.captain && game.captain.isGhostCaptain);
  if (!repTier.canEnterEnclave && !isGhostCap) {
    SoundFX.play('ghost_cannon');
    logEvent('👻 ABGEWIESEN! Benötigt Ruf ≤ -85 oder Geist-Kapitän!');
    return;
  }
  document.getElementById('enclaveOverlay').classList.add('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
  renderEnclaveModal();
};

window.closeEnclaveModal = function() {
  window.wololoModalOpen = false;
  const titleEl = document.getElementById('enclaveTitle');
  if (titleEl) { titleEl.style.color = '#34d399'; titleEl.textContent = '👻 Geisterpiraten-Enklave'; }
  document.getElementById('enclaveOverlay').classList.remove('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
  renderOfficerHudBar();
  updateHUD();
};

window.switchEnclaveTab = function(tab) { currentEnclaveTab = tab; renderEnclaveModal(); };

window.buyEnclaveGhostShip = function(clsKey) {
  const fStats = getFactionShipStats(clsKey, 'pirates');
  const oldVal = Math.round((player.baseMaxHull * 0.25) + (player.cannonsPerSide * 38));
  const netCost = Math.max(0, fStats.price - oldVal);
  if (game.gold < netCost) return;

  game.gold -= netCost;
  const keptGhostHull = (player.upgrades && player.upgrades.ghost_hull) || 0;
  const keptGhostSails = (player.upgrades && player.upgrades.ghost_sails) || 0;

  player.shipName = fStats.name; player.clsKey = clsKey; player.shipFaction = 'pirates';
  player.isGhostShip = true; player.hasGhostVisual = true; player.ghostAbility = fStats.ghostAbility;
  player.hullSpaceShift = 0;
  player.length = fStats.length; player.width = fStats.width; player.cannonsPerSide = fStats.cannonsPerSide;
  player.portCannons = initCannonsArray(fStats.cannonsPerSide); player.stbdCannons = initCannonsArray(fStats.cannonsPerSide);
  player.portCannonDamage = initCannonsArray(fStats.cannonsPerSide); player.stbdCannonDamage = initCannonsArray(fStats.cannonsPerSide);
  player.baseMaxSpeed = Math.round((fStats.baseSpeed + keptGhostSails * 0.08) * 100) / 100;
  player.baseTurnRate = fStats.turnRate; player.reloadMax = fStats.reload; player.baseDamage = fStats.dmg;
  player.baseMaxHull = fStats.hull + keptGhostHull * 140;
  player.maxSail = fStats.sail + keptGhostSails * 65; player.sail = player.maxSail;
  player.baseMaxCrew = fStats.crew; player.baseCargoCap = fStats.cargoCap;
  player.upgrades = { cannons: 0, reload: 0, damage: 0, sails: 0, hull: 0, cargo: 0, ghost_hull: keptGhostHull, ghost_sails: keptGhostSails };

  const missing = Math.max(0, (fStats.cannonsPerSide * 2) - getPlayerEquippedCannonStats().equippedCount);
  if (missing > 0) player.cargo.cannon_ghost_18 = (player.cargo.cannon_ghost_18 || 0) + missing;

  recalcPlayerDerivedStats(); player.hull = player.maxHull;
  rebuildCannonPips(); SoundFX.play('ghost_cannon');
  updateHUD(); renderEnclaveModal();
};

window.buyEnclaveGhostUpgrade = function(upId) {
  const def = GHOST_ENCLAVE_UPGRADES.find(u => u.id === upId);
  if (!def) return;
  player.upgrades = player.upgrades || {};
  const lvl = player.upgrades[upId] || 0;
  const cost = Math.round(def.baseCost * Math.pow(def.costMult, lvl));
  if (lvl >= def.max || game.gold < cost) return;
  game.gold -= cost;
  player.upgrades[upId] = lvl + 1;
  player.hasGhostVisual = true;
  if (upId === 'ghost_hull') { player.baseMaxHull += 140; recalcPlayerDerivedStats(); player.hull = player.maxHull; }
  else if (upId === 'ghost_sails') { player.maxSail += 65; player.sail = player.maxSail; player.baseMaxSpeed = Math.round((player.baseMaxSpeed + 0.08) * 100) / 100; }
  SoundFX.play('ghost_cannon');
  updateHUD(); renderEnclaveModal();
};

window.buyEnclaveCannon = function(cannonId, qty) {
  const ct = CANNON_TYPES.find(c => c.id === cannonId);
  if (!ct) return;
  const free = Math.max(0, Math.floor(getMaxCargo() - getCargoTotal()));
  const cStats = getPlayerEquippedCannonStats();
  const buyQty = Math.min(qty, Math.max(free, cStats.totalSlots - cStats.equippedCount), Math.floor(game.gold / ct.basePrice));
  if (buyQty <= 0) return;
  game.gold -= buyQty * ct.basePrice;
  player.cargo[cannonId] = (player.cargo[cannonId] || 0) + buyQty;
  SoundFX.play('coin');
  updateHUD(); renderEnclaveModal();
};

window.hireEnclaveGhostOfficer = function(uid) {
  if (player.officers.length >= MAX_OFFICERS) return;
  const idx = (game.enclaveOfficers || []).findIndex(o => o.uid === uid);
  if (idx === -1) return;
  const off = game.enclaveOfficers[idx];
  if (game.gold < off.cost) return;
  game.gold -= off.cost;
  game.enclaveOfficers.splice(idx, 1);
  player.officers.push(off);
  recalcPlayerDerivedStats(); renderOfficerHudBar();
  SoundFX.play('ghost_cannon');
  updateHUD(); renderEnclaveModal();
};

window.enclaveSoulRepair = function(cost) {
  if (game.gold < cost) return;
  game.gold -= cost;
  player.hull = player.maxHull; player.sail = player.maxSail;
  player.onFire = 0; player.ghostFire = 0;
  (player.fleet || []).forEach(e => { e.hull = e.maxHull; e.sail = e.maxSail; });
  SoundFX.play('coin');
  updateHUD(); renderEnclaveModal();
};

window.renderEnclaveModal = function() {
  if (window.applySceneBackgroundToModal) applySceneBackgroundToModal('enclaveOverlay', 'ghost_enclave');
  const body = document.getElementById('enclaveBody');
  if (!body) return;
  const oldVal = Math.round((player.baseMaxHull * 0.25) + (player.cannonsPerSide * 38));
  const repCost = (player.hull < player.maxHull || player.sail < player.maxSail) ? 180 : 0;
  const freeCargo = Math.max(0, Math.floor(getMaxCargo() - getCargoTotal()));
  const cStats = getPlayerEquippedCannonStats();
  const spaceForCannons = Math.max(freeCargo, cStats.totalSlots - cStats.equippedCount);
  const ghostEquip = SPECIAL_SHIP_EQUIPMENT.find(e => e.id === 'ghost_lantern');

  let tabHtml = '';
  if (currentEnclaveTab === 'ships') {
    tabHtml = `
      <div class="card-box" style="margin-bottom:12px; border-color:#10b981; background:#041f18; flex-direction:row; justify-content:space-between; align-items:center;">
        <div class="card-title" style="color:#34d399;">🛠️ Geisterwerft-Überholung</div>
        <button class="primary-btn" style="background:#059669; border-color:#34d399;" ${repCost === 0 || game.gold < repCost ? 'disabled' : ''} onclick="enclaveSoulRepair(${repCost})">${repCost === 0 ? '✓ 100%' : `${repCost} 🪙`}</button>
      </div>
      <div class="grid-2" style="margin-bottom:14px;">
        ${['phantom_sloop', 'dread_dutchman'].map(k => {
          const tpl = SHIP_CLASSES[k];
          const net = Math.max(0, tpl.price - oldVal);
          const isCurrent = player.clsKey === k;
          return `<div class="card-box" style="border-color:#10b981; background:#051b16;"><div><div class="card-title" style="color:#6ee7b7;">👻 ${td(tpl, 'name')} (${tpl.cannonsPerSide}K)</div><div class="card-desc">🛡️ ${tpl.hull} | ⛵ ${(tpl.baseSpeed * 4.8).toFixed(1)} kn | 👥 ${tpl.crew}<br><span style="color:#34d399;">✨ ${tr(tpl.abilityDesc_de, tpl.abilityDesc_en)}</span></div></div><button class="action-btn" style="background:#065f46; border-color:#34d399;" ${isCurrent || game.gold < net ? 'disabled' : ''} onclick="buyEnclaveGhostShip('${k}')"><span>${isCurrent ? t('activeBadge') : '👻'}</span><span>${isCurrent ? '' : net + ' 🪙'}</span></button></div>`;
        }).join('')}
      </div>
      <div class="grid-3">
        ${GHOST_ENCLAVE_UPGRADES.map(def => {
          const lvl = (player.upgrades && player.upgrades[def.id]) || 0;
          const cost = Math.round(def.baseCost * Math.pow(def.costMult, lvl));
          const isMax = lvl >= def.max;
          return `<div class="card-box" style="border-color:#10b981;"><div><div class="card-title" style="color:#6ee7b7;">${td(def, 'name')} (${lvl}/${def.max})</div><div class="card-desc">${td(def, 'desc')}</div></div><button class="action-btn" style="background:#065f46; border-color:#34d399;" ${isMax || game.gold < cost ? 'disabled' : ''} onclick="buyEnclaveGhostUpgrade('${def.id}')"><span>${isMax ? 'MAX ✓' : '+1'}</span><span>${isMax ? '' : cost + ' 🪙'}</span></button></div>`;
        }).join('')}
        ${ghostEquip ? `<div class="card-box" style="border-color:#10b981;"><div><div class="card-title" style="color:#6ee7b7;">${td(ghostEquip, 'name')}</div><div class="card-desc">${td(ghostEquip, 'desc')}</div></div><button class="action-btn" style="background:#065f46; border-color:#34d399;" ${player.specialEquipment === 'ghost_lantern' || game.gold < ghostEquip.cost ? 'disabled' : ''} onclick="player.specialEquipment='ghost_lantern'; game.gold-=${ghostEquip.cost}; SoundFX.play('ghost_cannon'); updateHUD(); renderEnclaveModal();"><span>[R]</span><span>${ghostEquip.cost} 🪙</span></button></div>` : ''}
      </div>
    `;
  } else if (currentEnclaveTab === 'cannons') {
    tabHtml = `<div class="grid-2">${CANNON_TYPES.filter(c => c.enclaveOnly).map(ct => `<div class="card-box" style="border-color:#10b981; background:#051b16;"><div><div class="card-title" style="color:#6ee7b7;">${ct.icon} ${td(ct, 'name')} (💥 ${ct.damage})</div><div class="card-desc">${td(ct, 'desc')}<br><strong>${Math.floor(player.cargo[ct.id] || 0)}</strong></div></div><div style="display:flex; gap:6px;"><button class="action-btn" style="flex:1; background:#065f46; border-color:#34d399;" ${spaceForCannons < 1 || game.gold < ct.basePrice ? 'disabled' : ''} onclick="buyEnclaveCannon('${ct.id}', 1)"><span>+1</span><span>${ct.basePrice} 🪙</span></button><button class="action-btn" style="flex:1; background:#065f46; border-color:#34d399;" ${spaceForCannons < 2 || game.gold < ct.basePrice * 2 ? 'disabled' : ''} onclick="buyEnclaveCannon('${ct.id}', 2)"><span>+2</span><span>${ct.basePrice * 2} 🪙</span></button></div></div>`).join('')}</div>`;
  } else {
    tabHtml = `<div class="grid-2">${(game.enclaveOfficers || []).map(off => `<div class="card-box" style="border-color:#10b981; background:#051b16;"><div><div style="display:flex; gap:10px; align-items:center; margin-bottom:6px;">${renderPortraitBox(off.svg, 64, '#34d399', true)}<div><div class="card-title" style="color:#6ee7b7;">${escapeHtml(off.name)}</div><div style="font-size:11px; color:#34d399; font-weight:bold;">${td(off, 'title')} • 💰 ${off.salary} 🪙/T</div></div></div><div class="card-desc">${td(off, 'roleDesc')}</div><div class="trait-pos">➕ ${formatOfficerTrait(off.posTrait)}</div><div class="trait-neg">💀 ${formatOfficerTrait(off.negTrait)}</div></div><button class="action-btn" style="background:#065f46; border-color:#34d399;" ${player.officers.length >= MAX_OFFICERS || game.gold < off.cost ? 'disabled' : ''} onclick="hireEnclaveGhostOfficer('${off.uid}')"><span>👻</span><span>${off.cost} 🪙</span></button></div>`).join('')}</div>`;
  }

  body.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <div>🪙 <strong style="color:#ffd700;">${game.gold}</strong> | 🚢 <strong style="color:#6ee7b7;">${escapeHtml(player.shipName)}</strong></div>
      ${renderWaitTimeWidgetHTML('renderEnclaveModal')}
    </div>
    <div class="tabs-bar">
      <button class="tab-btn ${currentEnclaveTab === 'ships' ? 'active' : ''}" onclick="switchEnclaveTab('ships')">👻 Schiffe</button>
      <button class="tab-btn ${currentEnclaveTab === 'cannons' ? 'active' : ''}" onclick="switchEnclaveTab('cannons')">🟢 Kanonen</button>
      <button class="tab-btn ${currentEnclaveTab === 'officers' ? 'active' : ''}" onclick="switchEnclaveTab('officers')">💀 Offiziere</button>
    </div>
    ${tabHtml}
  `;
};

// ============================================================================
// WOLOLO GAME-TESTING-ARSENAL (Erscheint vor Nassau, wenn Kapitän "wololo" heißt)
// Funktioniert im Historischen 1714-Modus UND im Seemannsgarn-Modus komplett kostenlos!
// ============================================================================
let currentWololoTab = 'ships';
window.wololoModalOpen = false;

window.ensureWololoOfficerRoster = function() {
  if (!window.game) return;
  if (!game.wololoOfficers || game.wololoOfficers.length === 0) {
    game.wololoOfficers = OFFICER_ROLES.map(r => generateRandomOfficer('pirates', r.roleId));
    for (let gi = 0; gi < GHOST_OFFICER_TEMPLATES.length; gi++) {
      game.wololoOfficers.unshift(generateEnclaveGhostOfficer(gi));
    }
  } else {
    game.wololoOfficers.forEach(o => {
      if (!o.svg) o.svg = renderPortraitSprite(o.portraitId || 'freibeuter:0', !!o.isGhostOfficer);
    });
  }
};

window.openWololoModal = function() {
  if (!window.game || !game.wololoEnabled) return;
  window.wololoModalOpen = true;
  ensureWololoOfficerRoster();
  const titleEl = document.getElementById('enclaveTitle');
  if (titleEl) {
    titleEl.style.color = '#ffd700';
    titleEl.textContent = '⛩️ Schrein von Wololo – Kostenloses Game-Testing-Arsenal (0 🪙)';
  }
  document.getElementById('enclaveOverlay').classList.add('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
  renderWololoModal();
};

window.switchWololoTab = function(tab) {
  currentWololoTab = tab;
  renderWololoModal();
};

window.wololoClaimShip = function(clsKey, asEscort = false) {
  const tpl = SHIP_CLASSES[clsKey] || SHIP_CLASSES.sloop;
  const isGhost = !!tpl.isGhostAppearance;
  const fStats = getFactionShipStats(clsKey, isGhost ? 'pirates' : (player.shipFaction || 'pirates'));

  if (asEscort) {
    if ((player.fleet || []).length >= MAX_ESCORT_SHIPS) { logEvent('⚠️ Flottenlimit erreicht (Max. 2 Begleitschiffe)!'); return; }
    let freeOff = player.officers.find(o => {
      const rMods = o.customMods || (OFFICER_ROLES.find(r => r.roleId === o.roleId) || {}).mods || {};
      return rMods.canCommandEscort && !o.assignedShipUid && !(player.fleet || []).some(e => e.commanderUid === o.uid);
    });
    if (!freeOff) {
      if (player.officers.length < MAX_OFFICERS) {
        freeOff = generateRandomOfficer('pirates', 'prize_officer');
        player.officers.push(freeOff);
      } else {
        logEvent('⚠️ Kein freier Prisen-Offizier für Begleitschiff an Bord!');
        return;
      }
    }
    const escUid = 'esc_wololo_' + Date.now() + '_' + Math.floor(Math.random() * 999);
    freeOff.assignedShipUid = escUid;
    player.fleet.push({
      uid: escUid, name: fStats.name, clsKey,
      shipFaction: fStats.factionId || 'pirates', isGhost, hasGhostVisual: isGhost,
      ghostAbility: fStats.ghostAbility || null, specialEquipment: null,
      upgrades: { cannons: 0, reload: 0, damage: 0, sails: 0, hull: 0, cargo: 0 },
      commanderUid: freeOff.uid, commanderName: freeOff.name,
      x: player.x - 85, y: player.y + 65, angle: player.angle, speed: 0,
      length: fStats.length, width: fStats.width, cannonsPerSide: fStats.cannonsPerSide,
      portCannons: initCannonsArray(fStats.cannonsPerSide), stbdCannons: initCannonsArray(fStats.cannonsPerSide),
      nextPortIndex: 0, nextStbdIndex: 0, portFireDelay: 0, stbdFireDelay: 0, singleFireInterval: 10,
      baseMaxSpeed: fStats.baseSpeed, baseTurnRate: fStats.turnRate, rangeBonus: 1.0,
      reloadMax: fStats.reload, dmg: fStats.dmg,
      hull: fStats.hull, maxHull: fStats.hull, sail: fStats.sail, maxSail: fStats.sail,
      crew: fStats.crew, maxCrew: fStats.crew, cargoCap: fStats.cargoCap || 60,
      hullColor: isGhost ? '#064e3b' : '#1e3a5f',
      sailColor: isGhost ? 'rgba(52,211,153,0.65)' : '#f8fafc', flagColor: '#2ecc71',
      combatMode: player.combatMode, cannonExtendPct: player.cannonExtendPct
    });
    SoundFX.play(isGhost ? 'ghost_cannon' : 'coin');
    renderOfficerHudBar(); syncFleetOrdersUI(); updateHUD(); renderWololoModal();
    return;
  }

  player.shipName = fStats.name;
  player.clsKey = clsKey;
  player.shipFaction = fStats.factionId || 'pirates';
  player.isGhostShip = isGhost;
  player.hasGhostVisual = isGhost || !!(game.captain && game.captain.isGhostCaptain) || ((player.upgrades && (player.upgrades.ghost_hull || player.upgrades.ghost_sails)) > 0);
  player.ghostAbility = fStats.ghostAbility || null;
  player.hullSpaceShift = 0;
  player.length = fStats.length; player.width = fStats.width;
  player.cannonsPerSide = fStats.cannonsPerSide;
  player.portCannons = initCannonsArray(fStats.cannonsPerSide);
  player.stbdCannons = initCannonsArray(fStats.cannonsPerSide);
  player.portCannonDamage = initCannonsArray(fStats.cannonsPerSide);
  player.stbdCannonDamage = initCannonsArray(fStats.cannonsPerSide);
  player.baseMaxSpeed = fStats.baseSpeed; player.baseTurnRate = fStats.turnRate;
  player.reloadMax = fStats.reload; player.baseDamage = fStats.dmg; player.rangeBonus = 1.0;
  player.baseMaxHull = fStats.hull; player.maxSail = fStats.sail; player.sail = fStats.sail;
  player.baseMaxCrew = fStats.crew; player.baseCargoCap = fStats.cargoCap;
  player.upgrades = { cannons: 0, reload: 0, damage: 0, sails: 0, hull: 0, cargo: 0, ghost_hull: 0, ghost_sails: 0 };

  const defCan = fStats.defaultCannon || 'cannon_12pdr';
  const needed = Math.max(0, fStats.cannonsPerSide * 2 - getPlayerEquippedCannonStats().equippedCount);
  if (needed > 0) player.cargo[defCan] = (player.cargo[defCan] || 0) + needed;

  recalcPlayerDerivedStats();
  player.hull = player.maxHull;
  player.crew = player.maxCrew;
  rebuildCannonPips();
  SoundFX.play(isGhost ? 'ghost_cannon' : 'coin');
  updateHUD();
  renderWololoModal();
};

window.wololoMaxAllUpgrades = function(includeGhost = false) {
  player.upgrades = player.upgrades || {};
  UPGRADE_DEFS.forEach(def => {
    const maxL = window.getEffectiveUpgradeMax ? getEffectiveUpgradeMax(def.id) : def.max;
    while ((player.upgrades[def.id] || 0) < maxL) {
      player.upgrades[def.id] = (player.upgrades[def.id] || 0) + 1;
      if (def.id === 'cannons') {
        player.cannonsPerSide++;
        player.portCannons = initCannonsArray(player.cannonsPerSide);
        player.stbdCannons = initCannonsArray(player.cannonsPerSide);
        player.portCannonDamage = initCannonsArray(player.cannonsPerSide);
        player.stbdCannonDamage = initCannonsArray(player.cannonsPerSide);
      } else if (def.id === 'reload') player.reloadMax = Math.max(85, Math.round(player.reloadMax * 0.95));
      else if (def.id === 'damage') player.rangeBonus = Math.round(((player.rangeBonus || 1) + 0.04) * 100) / 100;
      else if (def.id === 'sails') { player.maxSail += 30; player.sail = player.maxSail; player.baseMaxSpeed = Math.round((player.baseMaxSpeed * 1.035) * 100) / 100; }
      else if (def.id === 'hull') player.baseMaxHull += 65;
      else if (def.id === 'cargo') { player.baseCargoCap += 14; player.baseMaxCrew += 6; }
    }
  });
  if (includeGhost) {
    GHOST_ENCLAVE_UPGRADES.forEach(gDef => {
      while ((player.upgrades[gDef.id] || 0) < gDef.max) {
        player.upgrades[gDef.id] = (player.upgrades[gDef.id] || 0) + 1;
        player.hasGhostVisual = true;
        if (gDef.id === 'ghost_hull') player.baseMaxHull += 140;
        if (gDef.id === 'ghost_sails') { player.maxSail += 65; player.baseMaxSpeed = Math.round((player.baseMaxSpeed + 0.08) * 100) / 100; }
      }
    });
  }
  recalcPlayerDerivedStats();
  player.hull = player.maxHull; player.sail = player.maxSail;
  rebuildCannonPips();
  SoundFX.play(includeGhost ? 'ghost_cannon' : 'coin');
  updateHUD();
  renderWololoModal();
};

window.wololoFillCannonBattery = function(cannonId) {
  CANNON_TYPES.forEach(ct => { player.cargo[ct.id] = 0; });
  player.cargo[cannonId] = (player.cannonsPerSide || 3) * 2;
  SoundFX.play(cannonId.includes('ghost') ? 'ghost_cannon' : 'cannon');
  updateHUD();
  renderWololoModal();
};

window.wololoAddGood = function(goodId, amt) {
  player.cargo[goodId] = Math.max(0, (player.cargo[goodId] || 0) + amt);
  SoundFX.play('coin');
  updateHUD();
  renderWololoModal();
};

window.wololoHireOfficer = function(uid) {
  if (player.officers.length >= MAX_OFFICERS) { logEvent('⚠️ Alle 4 Offiziersplätze belegt! Entlasse zuerst einen Offizier.'); return; }
  const idx = (game.wololoOfficers || []).findIndex(o => o.uid === uid);
  if (idx === -1) return;
  const picked = game.wololoOfficers[idx];
  player.officers.push(picked);
  // Sofort frischen Ersatz derselben Rolle nachgenerieren, damit das Test-Menü nie leer wird!
  if (picked.isGhostOfficer) {
    const gIdx = GHOST_OFFICER_TEMPLATES.findIndex(t => t.name === picked.name);
    game.wololoOfficers[idx] = generateEnclaveGhostOfficer(gIdx >= 0 ? gIdx : 0);
  } else {
    game.wololoOfficers[idx] = generateRandomOfficer('pirates', picked.roleId);
  }
  recalcPlayerDerivedStats(); renderOfficerHudBar();
  SoundFX.play(picked.isGhostOfficer ? 'ghost_cannon' : 'coin');
  updateHUD();
  renderWololoModal();
};

window.wololoDismissOfficer = function(uid) {
  const idx = player.officers.findIndex(o => o.uid === uid);
  if (idx === -1) return;
  if ((player.fleet || []).some(e => e.commanderUid === uid)) {
    logEvent('⚠️ Offizier kommandiert noch ein Begleitschiff!');
    return;
  }
  player.officers.splice(idx, 1);
  recalcPlayerDerivedStats(); renderOfficerHudBar(); updateHUD(); renderWololoModal();
};

window.wololoMaxCrewAndGear = function() {
  recalcPlayerDerivedStats();
  player.crew = player.maxCrew;
  player.woundedCrew = 0;
  player.disease = null;
  player.morale = 100;
  player.hull = player.maxHull;
  player.sail = player.maxSail;
  player.onFire = 0; player.ghostFire = 0;
  const men = Math.ceil(player.crew);
  player.armory = { leather: 0, cuirass: men, cutlass: 0, rapier: men, pistol: 0, musket: men };
  player.ownedFigureheads = (window.FIGUREHEAD_DEFS || []).map(f => f.id);
  player.ownedSpecialEquipment = (typeof SPECIAL_SHIP_EQUIPMENT !== 'undefined' ? SPECIAL_SHIP_EQUIPMENT : []).map(e => e.id);
  if (window.CAPTAIN_ITEMS && game.captain && game.captain.inventory) {
    CAPTAIN_ITEMS.forEach(it => {
      if (!game.captain.inventory.owned.includes(it.id)) game.captain.inventory.owned.push(it.id);
      game.captain.inventory.equipped[it.slot] = it.id;
    });
  }
  SoundFX.play('sword');
  updateHUD();
  renderWololoModal();
};

window.wololoToggleVoodoo = function(vpId) {
  game.captain.voodooPowers = game.captain.voodooPowers || [];
  if (vpId === 'voodoo_ghost_form') {
    game.captain.isGhostCaptain = !game.captain.isGhostCaptain;
    player.hasGhostVisual = game.captain.isGhostCaptain || player.isGhostShip;
    const pid = game.captain.isGhostCaptain ? 'geister:0' : 'freibeuter:4';
    game.captain.portraitId = pid;
    game.captain.svg = renderPortraitSprite(pid, game.captain.isGhostCaptain);
  }
  if (game.captain.voodooPowers.includes(vpId)) {
    game.captain.voodooPowers = game.captain.voodooPowers.filter(x => x !== vpId);
  } else {
    game.captain.voodooPowers.push(vpId);
  }
  recalcPlayerDerivedStats(); renderOfficerHudBar();
  SoundFX.play('ghost_cannon');
  updateHUD(); renderWololoModal();
};

window.renderWololoModal = function() {
  if (window.applySceneBackgroundToModal) applySceneBackgroundToModal('enclaveOverlay', 'ghost_enclave');
  const body = document.getElementById('enclaveBody');
  if (!body) return;
  ensureWololoOfficerRoster();
  const cStats = getPlayerEquippedCannonStats();

  let tabHtml = '';
  if (currentWololoTab === 'ships') {
    const allShipKeys = Object.keys(SHIP_CLASSES);
    tabHtml = `
      <div class="card-box" style="margin-bottom:12px; border-color:#ffd700; background:#1c1608; flex-direction:row; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div style="font-size:12.5px; color:#fef08a;">⚡ <strong>Schnell-Aktionen (0 🪙):</strong> Rüste dein aktuelles Flaggschiff sofort auf Maximum auf oder fülle Crew, Elite-Waffen &amp; Heilung!</div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="sm-btn" style="border-color:#2ecc71; color:#a7f3d0;" onclick="wololoMaxAllUpgrades(false)">🛠️ Alle Standard-Upgrades MAX</button>
          <button class="sm-btn" style="border-color:#34d399; color:#6ee7b7;" onclick="wololoMaxAllUpgrades(true)">👻 + Geister-Upgrades MAX</button>
          <button class="sm-btn" style="border-color:#ffd700; color:#fef08a;" onclick="wololoMaxCrewAndGear()">👥 Crew, Heilung &amp; Rüstkammer MAX</button>
        </div>
      </div>
      <div class="grid-2">
        ${allShipKeys.map(k => {
          const tpl = SHIP_CLASSES[k];
          const isGh = !!tpl.isGhostAppearance;
          const isCur = player.clsKey === k;
          return `
            <div class="card-box" style="border-color:${isGh ? '#10b981' : '#d4af37'}; background:${isGh ? '#051b16' : '#0b131e'};">
              <div>
                <div class="card-title" style="color:${isGh ? '#6ee7b7' : '#ffd700'};">${isGh ? '👻 ' : '🚢 '}${td(tpl, 'name')} (${tpl.cannonsPerSide}–${tpl.maxCannonsPerSide}K/Seite)</div>
                <div class="card-desc">🛡️ ${tpl.hull} HP | ⛵ ${(tpl.baseSpeed * 4.8).toFixed(1)} kn | 👥 ${tpl.crew} Crew | 📦 ${tpl.cargoCap}</div>
              </div>
              <div style="display:flex; gap:6px;">
                <button class="action-btn" style="flex:1;" ${isCur ? 'disabled' : ''} onclick="wololoClaimShip('${k}', false)"><span>${isCur ? '✓ Flaggschiff' : '⚓ Als Flaggschiff'}</span><span>0 🪙</span></button>
                <button class="sm-btn" style="border-color:#38bdf8; color:#bae6fd;" ${(player.fleet || []).length >= MAX_ESCORT_SHIPS ? 'disabled' : ''} onclick="wololoClaimShip('${k}', true)">+ Flotte</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else if (currentWololoTab === 'cannons') {
    tabHtml = `
      <h3 style="color:#ffd700; font-size:14px; margin-bottom:8px;">💣 Komplette Breitseiten-Bestückung (${cStats.equippedCount}/${cStats.totalSlots} aktiv: ${cStats.summary})</h3>
      <div class="grid-3" style="margin-bottom:14px;">
        ${CANNON_TYPES.map(ct => `
          <div class="card-box" style="border-color:${ct.enclaveOnly ? '#10b981' : '#5a4628'};">
            <div>
              <div class="card-title" style="color:${ct.enclaveOnly ? '#6ee7b7' : '#ffd700'};">${ct.icon} ${td(ct, 'name')}</div>
              <div class="card-desc">💥 Schaden: ${ct.damage} | Im Laderaum: <strong>${Math.floor(player.cargo[ct.id] || 0)}</strong></div>
            </div>
            <div style="display:flex; gap:5px;">
              <button class="action-btn" style="flex:1;" onclick="wololoFillCannonBattery('${ct.id}')"><span>Komplett bestücken</span><span>0 🪙</span></button>
              <button class="sm-btn" onclick="wololoAddGood('${ct.id}', 4)">+4</button>
            </div>
          </div>
        `).join('')}
      </div>

      <h3 style="color:#ffd700; font-size:14px; margin-bottom:8px;">⚙️ Spezialausrüstung [R] &amp; Galionsfiguren (inkl. Geisterlaterne)</h3>
      <div class="grid-3" style="margin-bottom:12px;">
        ${SPECIAL_SHIP_EQUIPMENT.map(eq => {
          const act = player.specialEquipment === eq.id;
          return `
            <div class="card-box" style="border-color:${act ? '#2ecc71' : '#334155'};">
              <div><div class="card-title">${td(eq, 'name')}</div><div class="card-desc">${td(eq, 'desc')}</div></div>
              <button class="action-btn" ${act ? 'disabled' : ''} onclick="player.specialEquipment='${eq.id}'; SoundFX.play('coin'); updateHUD(); renderWololoModal();"><span>${act ? '✓ Montiert' : 'Einbauen [R]'}</span><span>0 🪙</span></button>
            </div>
          `;
        }).join('')}
      </div>
      <div class="grid-3">
        ${(window.FIGUREHEAD_DEFS || []).map(fh => {
          const act = player.figurehead === fh.id;
          return `
            <div class="card-box" style="border-color:${act ? '#2ecc71' : '#334155'};">
              <div><div class="card-title">${fh.icon || '🔱'} ${td(fh, 'name')}</div><div class="card-desc">${td(fh, 'desc')}</div></div>
              <button class="action-btn" ${act ? 'disabled' : ''} onclick="player.ownedFigureheads = player.ownedFigureheads || []; if(!player.ownedFigureheads.includes('${fh.id}')) player.ownedFigureheads.push('${fh.id}'); player.figurehead='${fh.id}'; recalcPlayerDerivedStats(); updateHUD(); renderWololoModal();"><span>${act ? '✓ Am Bug' : 'Montieren'}</span><span>0 🪙</span></button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else if (currentWololoTab === 'goods') {
    tabHtml = `
      <div class="card-box" style="margin-bottom:12px; flex-direction:row; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>📦 Laderaum: <strong>${Math.ceil(getCargoTotal())} / ${getMaxCargo()}</strong> | 🪙 Gold: <strong style="color:#ffd700;">${game.gold}</strong></div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="sm-btn" style="border-color:#ffd700; color:#fef08a;" onclick="game.gold += 25000; SoundFX.play('coin'); updateHUD(); renderWololoModal();">+25.000 🪙 Gold</button>
          <button class="sm-btn" style="border-color:#ef4444; color:#fecaca;" onclick="GOODS.forEach(g => { if(!g.isCannon) player.cargo[g.id]=0; }); updateHUD(); renderWololoModal();">🗑️ Handelswaren leeren</button>
        </div>
      </div>
      <div class="grid-3">
        ${GOODS.filter(g => !g.isCannon).map(g => `
          <div class="card-box">
            <div>
              <div class="card-title">${g.icon} ${td(g, 'name')}</div>
              <div class="card-desc">An Bord: <strong style="color:#ffd700;">${Math.floor(player.cargo[g.id] || 0)}</strong></div>
            </div>
            <div style="display:flex; gap:5px;">
              <button class="sm-btn" style="flex:1; border-color:#2ecc71; color:#a7f3d0;" onclick="wololoAddGood('${g.id}', 10)">+10 (0 🪙)</button>
              <button class="sm-btn" style="flex:1; border-color:#38bdf8; color:#bae6fd;" onclick="wololoAddGood('${g.id}', 50)">+50 (0 🪙)</button>
              <button class="sm-btn" onclick="player.cargo['${g.id}']=0; updateHUD(); renderWololoModal();">0</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (currentWololoTab === 'officers') {
    tabHtml = `
      <div class="card-box" style="margin-bottom:12px; background:#09131d;">
        <div class="card-title">🎖️ Aktive Offiziere an Bord (${player.officers.length}/${MAX_OFFICERS}) – Zum Platzmachen anklicken:</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:6px;">
          ${player.officers.length === 0 ? '<span style="color:#94a3b8; font-size:12px;">Keine Offiziere an Bord.</span>' : player.officers.map(o => `
            <button class="sm-btn" style="border-color:#ef4444; color:#fecaca;" onclick="wololoDismissOfficer('${o.uid}')">✖ ${escapeHtml(o.name)} (${td(OFFICER_ROLES.find(r=>r.roleId===o.roleId)||o, 'title')})</button>
          `).join('')}
          <button class="sm-btn" style="border-color:#ffd700; color:#fef08a; margin-left:auto;" onclick="game.wololoOfficers=[]; ensureWololoOfficerRoster(); SoundFX.play('dice'); renderWololoModal();">🎲 Neue Offiziers-Traits würfeln</button>
        </div>
      </div>
      <div class="grid-2">
        ${(game.wololoOfficers || []).map(off => `
          <div class="card-box" style="border-color:${off.isGhostOfficer ? '#10b981' : '#5a4628'}; background:${off.isGhostOfficer ? '#051b16' : '#0b131e'};">
            <div>
              <div style="display:flex; gap:10px; align-items:center; margin-bottom:6px;">
                ${renderPortraitBox(off.svg, 58, off.isGhostOfficer ? '#34d399' : '#ffd700', off.isGhostOfficer)}
                <div>
                  <div class="card-title" style="color:${off.isGhostOfficer ? '#6ee7b7' : '#ffd700'};">${escapeHtml(off.name)}</div>
                  <div style="font-size:11px; color:#cbd5e1;">${off.isGhostOfficer ? td(off, 'title') : td(OFFICER_ROLES.find(r=>r.roleId===off.roleId)||off, 'title')}</div>
                </div>
              </div>
              <div class="card-desc">${td(off, 'roleDesc')}</div>
              <div class="trait-pos">➕ ${formatOfficerTrait(off.posTrait)}</div>
              <div class="trait-neg">➖ ${formatOfficerTrait(off.negTrait)}</div>
            </div>
            <button class="action-btn" ${player.officers.length >= MAX_OFFICERS ? 'disabled' : ''} onclick="wololoHireOfficer('${off.uid}')"><span>Anheuern</span><span>0 🪙</span></button>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    tabHtml = `
      <div class="grid-2" style="margin-bottom:14px;">
        <div class="card-box" style="border-color:#10b981;">
          <div class="card-title" style="color:#6ee7b7;">🔮 Seemannsgarn- &amp; Voodoo-Kräfte (auch im Realismus-Modus testbar!)</div>
          <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
            ${VOODOO_POWERS.map(vp => {
              const owned = (game.captain.voodooPowers || []).includes(vp.id);
              return `<button class="action-btn" style="border-color:${owned ? '#34d399' : '#475569'};" onclick="wololoToggleVoodoo('${vp.id}')"><span>${owned ? '✓ Aktiv: ' : ''}${td(vp, 'name')}</span><span>Toggle</span></button>`;
            }).join('')}
          </div>
        </div>
        <div class="card-box" style="border-color:#ffd700;">
          <div class="card-title">👑 Kapitäns-Level, Ruf &amp; Karten-Cheats</div>
          <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
            <button class="action-btn" onclick="grantCaptainXP(game.captain.xpNext); renderWololoModal();"><span>🎖️ Sofort +1 Kapitäns-Level (+Skill/Perk)</span><span>0 🪙</span></button>
            <button class="action-btn" onclick="fowGrid.fill(1); EXPLORATION_SITES.forEach(s => s.mapBought=true); SoundFX.play('card'); logEvent('🗺️ Gesamte Seekarte & alle 14 Schatzbuchten aufgedeckt!'); renderWololoModal();"><span>🗺️ Komplette Seekarte &amp; Schatzkarten aufdecken</span><span>0 🪙</span></button>
            <div style="display:flex; gap:6px;">
              <button class="sm-btn" style="flex:1; border-color:#38bdf8;" onclick="game.reputation = 80; updateHUD(); renderWololoModal();">☠️ Eigenruf +80 (Ehrenhaft)</button>
              <button class="sm-btn" style="flex:1; border-color:#10b981;" onclick="game.reputation = -95; updateHUD(); renderWololoModal();">☠️ Eigenruf -95 (Verdammt)</button>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="sm-btn" style="flex:1; border-color:#2ecc71;" onclick="Object.keys(FACTIONS).forEach(fk => { game.rep[fk]=85; game.rankPts[fk]=350; }); updateHUD(); renderWololoModal();">🕊️ Alle Nationen +85 &amp; Admiral</button>
              <button class="sm-btn" style="flex:1; border-color:#ef4444;" onclick="Object.keys(FACTIONS).forEach(fk => { if(fk!=='pirates') game.rep[fk]=-80; }); updateHUD(); renderWololoModal();">⚔️ Alle Großmächte feindlich (-80)</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  body.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
      <div>⛩️ <strong style="color:#ffd700;">Wololo Test-Modus</strong> | 🚢 <strong style="color:#6ee7b7;">${escapeHtml(player.shipName)}</strong> | 👥 <strong>${Math.ceil(player.crew)}/${player.maxCrew}</strong> | 🪙 <strong style="color:#ffd700;">${game.gold}</strong></div>
      <button class="sm-btn" style="border-color:#2ecc71; color:#a7f3d0;" onclick="wololoMaxCrewAndGear()">💚 Alles heilen &amp; Crew voll</button>
    </div>
    <div class="tabs-bar">
      <button class="tab-btn ${currentWololoTab === 'ships' ? 'active' : ''}" onclick="switchWololoTab('ships')">🚢 Alle 10 Schiffe &amp; Upgrades</button>
      <button class="tab-btn ${currentWololoTab === 'cannons' ? 'active' : ''}" onclick="switchWololoTab('cannons')">💣 Kanonen &amp; Ausrüstung</button>
      <button class="tab-btn ${currentWololoTab === 'goods' ? 'active' : ''}" onclick="switchWololoTab('goods')">📦 Waren &amp; Gold</button>
      <button class="tab-btn ${currentWololoTab === 'officers' ? 'active' : ''}" onclick="switchWololoTab('officers')">🎖️ Alle Offiziere (${player.officers.length}/4)</button>
      <button class="tab-btn ${currentWololoTab === 'cheats' ? 'active' : ''}" onclick="switchWololoTab('cheats')">🔮 Geister-Voodoo &amp; Ruf</button>
    </div>
    ${tabHtml}
  `;
};