// ============================================================================
// port_ui.js - Hafen-Menü (Scroll-Reset nach oben, Singleplayer-Pause,
//              Passagier-Missionen, Entdecker-Gilde, Loyalitäts-Strafe &
//              Cooldown bei Fraktionswechsel, Silberflotten-Tipp bei Piraten)
// ============================================================================

let selectedIntelGood = 'silver';
let currentMarketSubTab = 'buy';
let talkStatusMessage = '';

function resetModalScrollTop(overlayId) {
  const ov = document.getElementById(overlayId);
  if (!ov) return;
  ov.scrollTop = 0;
  const card = ov.querySelector('.modal-card');
  if (card) card.scrollTop = 0;
}

window.switchMarketSubTab = function(subTab) {
  currentMarketSubTab = subTab;
  renderPortModal();
};

window.canPlayerBuyShipClass = function(clsKey, factionId) {
  if (window.game && game.isMultiplayer && game.mpMode === 'deathmatch') return { allowed: true, reason: '' };
  const tpl = SHIP_CLASSES[clsKey] || SHIP_CLASSES.sloop;
  const reqIdx = tpl.reqRankIdx || 0;
  if (reqIdx <= 0) return { allowed: true, reason: '' };

  const curRank = getRankForFaction(factionId);
  const rep = game.rep[factionId] || 0;
  const isSworn = game.allegiance === factionId;
  const reqTitle = td(RANK_TITLES[reqIdx] || RANK_TITLES[0], 'name');
  const reqRep = reqIdx * 15;

  if ((curRank.idx >= reqIdx && rep >= reqRep) || (isSworn && curRank.idx >= reqIdx - 1 && rep >= 10)) {
    return { allowed: true, reason: '' };
  }
  return { allowed: false, reason: `${reqTitle} & +${reqRep} ${td(FACTIONS[factionId], 'short')}` };
};

window.canPlayerBuyCannonType = function(cannonId, portFaction) {
  const cDef = CANNON_TYPES.find(c => c.id === cannonId);
  if (!cDef) return { allowed: false, reason: '' };
  if (cDef.enclaveOnly) return { allowed: false, reason: 'Nur in der Geister-Enklave!' };
  if (window.game && game.isMultiplayer && game.mpMode === 'deathmatch') return { allowed: true, reason: '' };
  if (cDef.reqRankIdx <= 0 && !cDef.reqAllegiance) return { allowed: true, reason: '' };

  const curRank = getRankForFaction(portFaction);
  const isSworn = game.allegiance === portFaction;
  const reqTitle = td(RANK_TITLES[cDef.reqRankIdx] || RANK_TITLES[0], 'name');
  const facShort = td(FACTIONS[portFaction], 'short');

  if (cDef.reqAllegiance && (!isSworn || curRank.idx < cDef.reqRankIdx)) {
    return { allowed: false, reason: `Beitritt zu ${facShort} + Rang „${reqTitle}“` };
  }
  if (curRank.idx < cDef.reqRankIdx) return { allowed: false, reason: `${reqTitle} (${facShort})` };
  return { allowed: true, reason: '' };
};

window.calcCurrentFlagshipTradeInValue = function() {
  let val = Math.round((player.baseMaxHull * 0.25) + (player.cannonsPerSide * 38));
  if (player.upgrades) {
    UPGRADE_DEFS.forEach(def => {
      const lvl = player.upgrades[def.id] || 0;
      if (lvl > 0) val += lvl * Math.round(def.baseCost * 0.45);
    });
  }
  if (player.specialEquipment) {
    const eq = SPECIAL_SHIP_EQUIPMENT.find(e => e.id === player.specialEquipment);
    if (eq) val += Math.round(eq.cost * 0.40);
  }
  return val;
};

window.trimExcessCargoCannonsAfterShipSwap = function(portForPricing = null) {
  let overflow = Math.ceil(getCargoTotal() - getMaxCargo());
  if (overflow <= 0) return 0;
  let refundedGold = 0;
  const weakFirst = [...CANNON_TYPES].sort((a, b) => a.damage - b.damage);
  const mountedSlots = (player.cannonsPerSide || 3) * 2;
  let totalCannons = CANNON_TYPES.reduce((s, ct) => s + Math.floor(player.cargo[ct.id] || 0), 0);
  let unmounted = Math.max(0, totalCannons - mountedSlots);

  for (const ct of weakFirst) {
    if (overflow <= 0 || unmounted <= 0) break;
    const owned = Math.floor(player.cargo[ct.id] || 0);
    if (owned > 0) {
      const sellCnt = Math.min(owned, overflow, unmounted);
      if (sellCnt > 0) {
        player.cargo[ct.id] -= sellCnt;
        const unitSell = portForPricing ? getPortGoodPrice(portForPricing, ct.id, false) : Math.round(ct.basePrice * 0.7);
        refundedGold += sellCnt * unitSell;
        overflow -= sellCnt;
        unmounted -= sellCnt;
      }
    }
  }
  if (refundedGold > 0) game.gold += refundedGold;
  return refundedGold;
};

window.getEffectiveUpgradeMax = function(upId) {
  const def = UPGRADE_DEFS.find(u => u.id === upId);
  if (!def) return 0;
  if (upId === 'cannons' && window.player) {
    const fStats = getFactionShipStats(player.clsKey || 'sloop', player.shipFaction || 'pirates');
    const maxAllowedUpgrades = Math.max(0, (fStats.maxCannonsPerSide || (fStats.cannonsPerSide + def.max)) - fStats.cannonsPerSide);
    return Math.min(def.max, maxAllowedUpgrades);
  }
  return def.max;
};

window.buyOrSwapPortShip = function(clsKey) {
  if (!currentPort) return;
  const check = canPlayerBuyShipClass(clsKey, currentPort.faction);
  if (!check.allowed) { logEvent(`⚠️ ${check.reason}`); return; }

  const fStats = getFactionShipStats(clsKey, currentPort.faction);
  const mods = getOfficerModifiers();

  let nonCannonGoods = Math.floor(player.prisoners || 0);
  for (const [k, v] of Object.entries(player.cargo || {})) {
    if (!k.startsWith('cannon_')) nonCannonGoods += v;
  }
  const fleetCargo = (player.fleet || []).reduce((sum, esc) => sum + (esc.cargoCap || 40), 0);
  const hideoutCargo = (game.hideout && game.hideout.foundedPlotId && window.getHideoutBuildingLevel ? getHideoutBuildingLevel('warehouse') : 0) * 45;
  const futureMaxCargo = Math.max(20, fStats.cargoCap + fleetCargo + hideoutCargo + Math.round(mods.cargoBonus || 0));

  if (Math.ceil(nonCannonGoods) > futureMaxCargo) {
    SoundFX.play('hit');
    logEvent(`⚠️ Zu viel Ladung an Bord (${Math.ceil(nonCannonGoods)} / ${futureMaxCargo} 📦)! Verkaufe oder lagere zuerst Waren ein.`);
    return;
  }
  const rnk = getRankForFaction(currentPort.faction);
  const totalDisc = Math.min(0.45, rnk.discount + (mods.shipyardDiscount || 0));

  const oldVal = calcCurrentFlagshipTradeInValue();
  const rawPrice = Math.round(fStats.price * (1 - totalDisc));
  const netCost = Math.max(0, rawPrice - oldVal);
  if (game.gold < netCost) return;
  game.gold -= netCost;

  player.shipName = fStats.name;
  player.clsKey = fStats.clsKey;
  player.shipFaction = fStats.factionId;
  player.isGhostShip = false;
  if (!(game.captain && game.captain.isGhostCaptain)) player.hasGhostVisual = false;
  player.ghostAbility = null;
  player.specialEquipment = null; player.specialEquipCooldown = 0;
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
  player.upgrades = { cannons: 0, reload: 0, damage: 0, sails: 0, hull: 0, cargo: 0 };

  const cStats = getPlayerEquippedCannonStats();
  const neededCannons = Math.max(0, (fStats.cannonsPerSide * 2) - cStats.equippedCount);
  if (neededCannons > 0) player.cargo.cannon_6pdr = (player.cargo.cannon_6pdr || 0) + neededCannons;

  recalcPlayerDerivedStats();
  trimExcessCargoCannonsAfterShipSwap(currentPort);
  player.hull = player.maxHull;
  if (game.isMultiplayer && game.mpMode === 'deathmatch') player.crew = player.maxCrew;
  rebuildCannonPips();
  if (window.NetClient && NetClient.isConnected()) NetClient.sendShipRefit(player.clsKey, player.shipFaction);
  SoundFX.play('coin');
  grantCaptainXP(35, `⚓ "${fStats.name}"`);
  updateHUD();
  renderPortModal();
};

window.installSpecialEquipment = function(eqId, cost) {
  if (game.gold < cost) return;
  const eq = SPECIAL_SHIP_EQUIPMENT.find(e => e.id === eqId);
  if (!eq) return;
  game.gold -= cost;
  player.specialEquipment = eq.id;
  player.ownedSpecialEquipment = player.ownedSpecialEquipment || [];
  if (!player.ownedSpecialEquipment.includes(eq.id)) player.ownedSpecialEquipment.push(eq.id);
  player.specialEquipCooldown = 0;
  recalcPlayerDerivedStats();
  SoundFX.play('coin');
  updateHUD();
  renderPortModal();
};

window.swapFlagshipWithEscort = function(escortUid) {
  const idx = (player.fleet || []).findIndex(e => e.uid === escortUid);
  if (idx === -1) return;
  const esc = player.fleet[idx];

  const oldFlag = {
    name: player.shipName || 'Flaggschiff', clsKey: player.clsKey || 'sloop',
    shipFaction: player.shipFaction || 'pirates', isGhostShip: !!player.isGhostShip,
    hasGhostVisual: !!player.hasGhostVisual, ghostAbility: player.ghostAbility || null,
    specialEquipment: player.specialEquipment || null,
    upgrades: { ...(player.upgrades || { cannons: 0, reload: 0, damage: 0, sails: 0, hull: 0, cargo: 0 }) },
    length: player.length, width: player.width, cannonsPerSide: player.cannonsPerSide,
    baseMaxSpeed: player.baseMaxSpeed, baseTurnRate: player.baseTurnRate, rangeBonus: player.rangeBonus || 1.0,
    reloadMax: player.reloadMax, dmg: player.baseDamage,
    hull: Math.round(player.hull), maxHull: player.baseMaxHull,
    sail: Math.round(player.sail), maxSail: player.maxSail,
    crew: Math.min(esc.maxCrew, Math.ceil(player.crew)), maxCrew: player.baseMaxCrew, cargoCap: player.baseCargoCap
  };

  const tpl = SHIP_CLASSES[esc.clsKey] || SHIP_CLASSES.frigate;
  const isGhostCap = !!(game.captain && game.captain.isGhostCaptain);

  player.shipName = esc.name; player.clsKey = esc.clsKey;
  player.shipFaction = esc.shipFaction || 'pirates';
  player.isGhostShip = !!(esc.isGhost || tpl.isGhostAppearance);
  player.hasGhostVisual = !!(player.isGhostShip || esc.hasGhostVisual || isGhostCap);
  player.ghostAbility = esc.ghostAbility || tpl.ghostAbility || null;
  player.specialEquipment = esc.specialEquipment || null; player.specialEquipCooldown = 0;
  player.hullSpaceShift = 0;
  player.upgrades = esc.upgrades ? { ...esc.upgrades } : { cannons: 0, reload: 0, damage: 0, sails: 0, hull: 0, cargo: 0 };
  player.length = esc.length; player.width = esc.width; player.cannonsPerSide = esc.cannonsPerSide;
  player.portCannons = initCannonsArray(esc.cannonsPerSide); player.stbdCannons = initCannonsArray(esc.cannonsPerSide);
  player.portCannonDamage = initCannonsArray(esc.cannonsPerSide); player.stbdCannonDamage = initCannonsArray(esc.cannonsPerSide);
  player.baseMaxSpeed = esc.baseMaxSpeed || tpl.baseSpeed; player.baseTurnRate = esc.baseTurnRate || tpl.turnRate;
  player.rangeBonus = esc.rangeBonus || 1.0; player.reloadMax = esc.reloadMax || tpl.reload;
  player.baseDamage = esc.dmg || tpl.dmg;
  player.baseMaxHull = esc.maxHull; player.hull = Math.max(80, Math.round(esc.hull));
  player.maxSail = esc.maxSail; player.sail = Math.max(60, Math.round(esc.sail));
  player.baseMaxCrew = esc.maxCrew; player.baseCargoCap = esc.cargoCap || tpl.cargoCap || 60;

  Object.assign(esc, {
    name: oldFlag.name, clsKey: oldFlag.clsKey, shipFaction: oldFlag.shipFaction,
    isGhost: oldFlag.isGhostShip, hasGhostVisual: oldFlag.hasGhostVisual,
    ghostAbility: oldFlag.ghostAbility, specialEquipment: oldFlag.specialEquipment,
    upgrades: oldFlag.upgrades, length: oldFlag.length, width: oldFlag.width,
    cannonsPerSide: oldFlag.cannonsPerSide,
    portCannons: initCannonsArray(oldFlag.cannonsPerSide), stbdCannons: initCannonsArray(oldFlag.cannonsPerSide),
    baseMaxSpeed: oldFlag.baseMaxSpeed, baseTurnRate: oldFlag.baseTurnRate, rangeBonus: oldFlag.rangeBonus,
    reloadMax: oldFlag.reloadMax, dmg: oldFlag.dmg, hull: oldFlag.hull, maxHull: oldFlag.maxHull,
    sail: oldFlag.sail, maxSail: oldFlag.maxSail, crew: Math.min(oldFlag.maxCrew, Math.max(12, oldFlag.crew)),
    maxCrew: oldFlag.maxCrew, cargoCap: oldFlag.cargoCap
  });

  recalcPlayerDerivedStats();
  rebuildCannonPips();
  updateHUD();
  if (document.getElementById('captainOverlay').classList.contains('active')) renderCaptainModal();
  if (document.getElementById('portOverlay').classList.contains('active')) renderPortModal();
};

window.scuttleOrSellEscort = function(escortUid, isSellingInPort = false) {
  const idx = (player.fleet || []).findIndex(e => e.uid === escortUid);
  if (idx === -1) return;
  const esc = player.fleet[idx];
  const cmdOff = player.officers.find(o => o.uid === esc.commanderUid || o.assignedShipUid === esc.uid);
  if (cmdOff) cmdOff.assignedShipUid = null;
  if (isSellingInPort) {
    game.gold += Math.round((esc.maxHull * 0.25) + (esc.cannonsPerSide * 35));
    SoundFX.play('coin');
  }
  player.fleet.splice(idx, 1);
  renderOfficerHudBar();
  updateHUD();
  if (document.getElementById('captainOverlay').classList.contains('active')) renderCaptainModal();
  if (document.getElementById('portOverlay').classList.contains('active')) renderPortModal();
};

window.repairEscortInPort = function(escortUid, cost) {
  const esc = (player.fleet || []).find(e => e.uid === escortUid);
  if (!esc || game.gold < cost) return;
  game.gold -= cost;
  esc.hull = esc.maxHull; esc.sail = esc.maxSail; esc.crew = esc.maxCrew;
  SoundFX.play('coin');
  updateHUD();
  renderPortModal();
};

// ============================================================================
// HAFEN ÖFFNEN (Scroll-Reset ganz nach oben + Passagier-Ankunft + SP-Pause!)
// ============================================================================
window.openPortModal = function() {
  if (!currentPort) return;
  player.sailSetting = 0;
  player.speed *= 0.2;

  if (!currentPort.passengerOffer && window.generatePortPassengerOffer) {
    generatePortPassengerOffer(currentPort);
  }
  if (window.checkCompletePassengerArrival) {
    checkCompletePassengerArrival(currentPort);
  }

  game.visitedPortsLog = game.visitedPortsLog || {};
  const hasMerchant = hasOfficerRole('merchant');
  game.visitedPortsLog[currentPort.id] = {
    knownTrade: hasMerchant || !!(game.visitedPortsLog[currentPort.id] && game.visitedPortsLog[currentPort.id].knownTrade),
    exportsText: currentPort.exports.map(id => td(GOODS.find(g => g.id === id), 'name')).filter(Boolean).join(', '),
    importsText: currentPort.imports.map(id => td(GOODS.find(g => g.id === id), 'name')).filter(Boolean).join(', ')
  };

  if (player.disease || (player.woundedCrew || 0) > 0) {
    player.disease = null;
    player.woundedCrew = 0;
  }

  if (game.activeMission && game.activeMission.targetPortId === currentPort.id) {
    const ms = game.activeMission;
    if (ms.type === 'courier' || ms.type === 'vip') {
      game.gold += ms.rewardGold;
      game.rankPts[ms.faction] = (game.rankPts[ms.faction] || 0) + ms.rewardRankPts;
      game.rep[ms.faction] = Math.min(100, game.rep[ms.faction] + ms.rewardRep);
      changePlayerReputation(6);
      SoundFX.play('coin');
      grantCaptainXP(ms.rewardXp, `📬 "${ms.title}" +${ms.rewardGold} 🪙!`);
      game.activeMission = null;
    } else if ((ms.type === 'supply' || ms.type === 'smuggle') && (player.cargo[ms.goodId] || 0) >= ms.amount) {
      player.cargo[ms.goodId] -= ms.amount;
      game.gold += ms.rewardGold;
      game.rankPts[ms.faction] = (game.rankPts[ms.faction] || 0) + ms.rewardRankPts;
      game.rep[ms.faction] = Math.min(100, game.rep[ms.faction] + ms.rewardRep);
      changePlayerReputation(ms.type === 'smuggle' ? -4 : 6);
      SoundFX.play('coin');
      grantCaptainXP(ms.rewardXp, `⚖️ "${ms.title}" +${ms.rewardGold} 🪙!`);
      game.activeMission = null;
    }
  }

  document.getElementById('portOverlay').classList.add('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
  renderPortModal();
  resetModalScrollTop('portOverlay'); // Garantiert immer ganz oben im Menü!
  if (window.triggerPortAutoSave) triggerPortAutoSave(currentPort.name);
};

window.closePortModal = function() {
  document.getElementById('portOverlay').classList.remove('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
  renderOfficerHudBar();
  if (window.updateHornigoldTutorialProgress) updateHornigoldTutorialProgress();
  updateHUD();
};

window.switchPortTab = function(tab) {
  currentPortTab = tab;
  ['shipyard', 'armory', 'market', 'tavern', 'gov'].forEach(tKey => {
    document.getElementById('tabBtn_' + tKey).classList.toggle('active', tKey === tab);
    document.getElementById('tab_' + tKey).classList.toggle('active', tKey === tab);
  });
  renderPortModal();
  resetModalScrollTop('portOverlay');
};

window.getPortCostDiscount = function(port) {
  const rankObj = getRankForFaction(port.faction);
  const allegianceBonus = (game.allegiance === port.faction && (port.faction === 'england' || port.faction === 'netherlands')) ? 0.12 : 0;
  return Math.min(0.45, (rankObj.discount || 0) + allegianceBonus);
};

window.getPortGoodPrice = function(port, goodId, isBuyingFromPort) {
  const good = GOODS.find(g => g.id === goodId);
  if (!good) return 10;
  let mult = 1.0;
  if (good.isCannon) {
    const cDef = CANNON_TYPES.find(c => c.id === goodId);
    if (port.faction === 'pirates') mult *= (cDef ? cDef.pirateMultiplier : 1.65);
    else if (port.exports.includes(goodId)) mult *= 0.82;
  } else {
    if (port.exports.includes(goodId)) mult = 0.68;
    else if (port.imports.includes(goodId)) mult = 1.42;
  }
  mult *= (port.marketPricePressure && port.marketPricePressure[goodId]) || 1.0;

  const mods = getOfficerModifiers();
  let tradeBonus = (mods.tradeBonus || 0) + getPortCostDiscount(port) * 0.5;
  if (port.faction === 'pirates' && (game.reputation || 0) <= -30) tradeBonus += 0.12;

  if (isBuyingFromPort) return Math.max(4, Math.round(good.basePrice * mult * Math.max(0.60, 1 - tradeBonus * 0.45)));
  return Math.max(3, Math.round(good.basePrice * mult * 0.88 * (1 + tradeBonus * 0.40)));
};

window.changeIntelGood = function(goodId) { selectedIntelGood = goodId; renderPortModal(); };

window.ransomPrisonersByFaction = function(prisonerFacId) {
  if (!currentPort) return;
  player.prisonersByFaction = player.prisonersByFaction || {};
  const count = player.prisonersByFaction[prisonerFacId] || 0;
  if (count <= 0) return;

  const govFac = currentPort.faction;
  let goldPerHead = 36, repGainGov = 0, repChangePrisonerFac = 0, rankPtsGain = 0;

  if (prisonerFacId === govFac) {
    goldPerHead = 30; repGainGov = count * 4; rankPtsGain = count * 3; changePlayerReputation(count * 2);
  } else {
    const rel = FACTIONS[govFac].relations[prisonerFacId] || 0;
    if (rel <= -50) { goldPerHead = 54; repGainGov = count * 3; repChangePrisonerFac = -count * 2; rankPtsGain = count * 4; }
    else { goldPerHead = 38; repGainGov = count * 2; repChangePrisonerFac = -count; rankPtsGain = count * 2; }
    changePlayerReputation(count);
  }

  const totalGold = count * goldPerHead;
  game.gold += totalGold;
  player.prisoners = Math.max(0, (player.prisoners || 0) - count);
  player.prisonersByFaction[prisonerFacId] = 0;

  game.rep[govFac] = Math.min(100, (game.rep[govFac] || 0) + repGainGov);
  game.rankPts[govFac] = (game.rankPts[govFac] || 0) + rankPtsGain;
  if (repChangePrisonerFac !== 0) game.rep[prisonerFacId] = Math.max(-100, (game.rep[prisonerFacId] || 0) + repChangePrisonerFac);

  SoundFX.play('coin');
  grantCaptainXP(count * 5, `⛓️ +${totalGold} 🪙!`);
  updateHUD();
  renderPortModal();
};

// ============================================================================
// FRAKTIONS-TREUE MIT SPERRFRIST & ILLOYALITÄTS-STRAFE BEI ALLEN KRONEN!
// ============================================================================
window.joinFactionAllegiance = function(factionId) {
  if (!currentPort || currentPort.faction !== factionId) return;
  if ((game.allegianceCooldownUntil || 0) > (game.time || 0)) {
    logEvent('⚠️ Kein Gouverneur traut deinem Wort! Warte noch bis zum Ablauf der Sperrfrist nach deinem letzten Treuebruch.');
    return;
  }
  if (game.allegiance && game.allegiance !== factionId) {
    logEvent('⚠️ Du stehst bereits im Dienst einer anderen Macht! Tritt dort zuerst aus.');
    return;
  }

  game.allegiance = factionId;
  game.allegianceCooldownUntil = (game.time || 0) + Math.round(TICKS_PER_GAME_DAY * 0.5);
  game.rep[factionId] = Math.min(100, (game.rep[factionId] || 0) + 12);
  Object.keys(FACTIONS).forEach(fk => {
    if (fk !== factionId && (FACTIONS[factionId].relations[fk] || 0) < -50) game.rep[fk] = Math.min(game.rep[fk], -25);
  });
  recalcPlayerDerivedStats();
  SoundFX.play('coin');
  grantCaptainXP(35, `👑 Kaperbrief unterzeichnet: ${td(FACTIONS[factionId], 'name')}!`);
  updateHUD();
  renderPortModal();
};

window.leaveFactionAllegiance = function() {
  if (!game.allegiance) return;
  const oldKey = game.allegiance;
  const oldFacName = td(FACTIONS[oldKey], 'name');

  // Harte Konsequenz wegen Eidbruchs / Illoyalität bei ALLEN Fraktionen + Sperrfrist!
  game.rep[oldKey] = Math.max(-100, (game.rep[oldKey] || 0) - 35);
  Object.keys(FACTIONS).forEach(fk => {
    if (fk !== oldKey) {
      game.rep[fk] = Math.max(-100, (game.rep[fk] || 0) - 12);
    }
  });
  changePlayerReputation(-15, `📜 Eidbruch gegenüber ${oldFacName}! Alle Kronen misstrauen deiner Loyalität (-35 / -12 Ruf)!`);

  game.allegiance = null;
  game.allegianceCooldownUntil = (game.time || 0) + TICKS_PER_GAME_DAY;
  SoundFX.play('hit');
  recalcPlayerDerivedStats();
  updateHUD();
  renderPortModal();
};

window.abandonActiveMission = function() {
  if (!window.game || !game.activeMission) return;
  const ms = game.activeMission;
  if (ms.faction && game.rep[ms.faction] !== undefined) game.rep[ms.faction] = Math.max(-100, game.rep[ms.faction] - 6);
  for (let i = ships.length - 1; i >= 0; i--) if (ships[i].isMissionTarget) ships.splice(i, 1);
  for (let i = flotsam.length - 1; i >= 0; i--) if (flotsam[i].isMissionRescue) flotsam.splice(i, 1);
  game.activeMission = null;
  SoundFX.play('hit');
  updateHUD();
  if (document.getElementById('portOverlay').classList.contains('active')) renderPortModal();
  if (document.getElementById('logbookOverlay').classList.contains('active')) renderLogbookModal();
};

window.getCategoryEquippedTotal = function(cat) {
  return (CREW_EQUIPMENT[cat] || []).reduce((sum, it) => sum + (player.armory[it.id] || 0), 0);
};

window.renderPortModal = function() {
  if (!currentPort) return;
  clampCrewEquipmentToCrewSize();
  ensureShipAndCaptainInventory();

  const fac = FACTIONS[currentPort.faction];
  const rnk = getRankForFaction(currentPort.faction);
  const rankDiscPct = Math.round(getPortCostDiscount(currentPort) * 100);
  const mods = getOfficerModifiers();
  const hasMerchant = mods.merchantIntel > 0;
  const isDmSafeZone = !!(game.isMultiplayer && game.mpMode === 'deathmatch');

  document.getElementById('portTitle').textContent = isDmSafeZone ? `🛡️ Safe-Zone Dock (${currentPort.name})` : `🏰 ${currentPort.name}`;
  let sceneBadge = '';
  if (window.applySceneBackgroundToModal && window.resolvePortSceneKey) {
    const scDef = applySceneBackgroundToModal('portOverlay', resolvePortSceneKey(currentPort, currentPortTab || 'shipyard'));
    if (scDef) sceneBadge = `<span style="color:#fde68a;">${tr(scDef.label_de, scDef.label_en)}</span> &nbsp;•&nbsp; `;
  }
  document.getElementById('portSubtitle').innerHTML = `${sceneBadge}<strong style="color:${fac.color}">${td(fac, 'name')}</strong> | <strong>${td(rnk, 'name')}</strong> (-${rankDiscPct}%) | Ruf: ${game.rep[fac.id]} | ${game.isMultiplayer ? '⚡ Echtzeit' : '⏸️ Pausiert'}`;
  document.getElementById('portGold').textContent = game.gold;
  document.getElementById('portCargo').textContent = `${Math.ceil(getCargoTotal())} / ${getMaxCargo()}`;
  document.getElementById('portTimber').textContent = Math.floor(player.cargo.timber || 0);
  const pCanvasEl = document.getElementById('portCanvas');
  if (pCanvasEl) pCanvasEl.textContent = Math.floor(player.cargo.canvas || 0);
  document.getElementById('portFood').textContent = Math.floor(player.cargo.food || 0);
  document.getElementById('portRum').textContent = Math.floor(player.cargo.rum || 0);
  document.getElementById('portPrisoners').textContent = player.prisoners || 0;

  let specialHtml = renderWaitTimeWidgetHTML('renderPortModal');
  if (hasMerchant) {
    const expNames = currentPort.exports.map(id => td(GOODS.find(g => g.id === id), 'name')).filter(Boolean).join(', ');
    const impNames = currentPort.imports.map(id => td(GOODS.find(g => g.id === id), 'name')).filter(Boolean).join(', ');
    specialHtml += `<div style="margin-top:4px;">📉 <strong style="color:#2ecc71">${escapeHtml(expNames)}</strong> | 📈 <strong style="color:#ffd700">${escapeHtml(impNames)}</strong></div>`;
  }
  document.getElementById('portSpecialInfo').innerHTML = specialHtml;

  // 1. WERFT (+ Direktzugriff auf Galionsfiguren & Rumpf-Innenumbau!)
  const totalShipyardDisc = Math.min(0.45, getPortCostDiscount(currentPort) + (mods.shipyardDiscount || 0));
  const missingHull = Math.ceil(player.maxHull - player.hull);
  const missingSail = Math.ceil(player.maxSail - player.sail);
  const hullRepairCost = missingHull > 0 ? Math.max(15, Math.ceil(missingHull * 1.15 * (1 - totalShipyardDisc))) : 0;
  const sailRepairCost = missingSail > 0 ? Math.max(12, Math.ceil(missingSail * 0.95 * (1 - totalShipyardDisc))) : 0;
  const oldShipTradeInVal = calcCurrentFlagshipTradeInValue();
  const cStats = getPlayerEquippedCannonStats();
  const shipOfferList = isDmSafeZone
    ? ['sloop', 'brigantine', 'corvette', 'frigate', 'galleon', 'manowar'].map(ck => getFactionShipStats(ck, currentPort.faction))
    : (currentPort.shipyardOffers || []);

  document.getElementById('tab_shipyard').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#2ecc71; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
      <div>💡 Werftrabatt: <strong>-${Math.round(totalShipyardDisc * 100)}%</strong></div>
      <div style="display:flex; gap:6px;">
        <button class="sm-btn" style="border-color:#38bdf8; color:#bae6fd;" onclick="toggleShipInventoryModal()">🧰 Schiffsinventar, Galionsfigur &amp; Rumpf-Umbau [I]</button>
        <button class="sm-btn" onclick="promptRenameShip()">${t('renameShipBtn')} (${escapeHtml(player.shipName)})</button>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:14px;">
      <div class="card-box">
        <div><div class="card-title">🛠️ Rumpf überholen</div><div class="card-desc">${Math.ceil(player.hull)} / ${player.maxHull} HP</div></div>
        <button class="action-btn" ${missingHull <= 0 || game.gold < hullRepairCost ? 'disabled' : ''} onclick="repairShip('hull', ${hullRepairCost})">
          <span>${missingHull <= 0 ? '✓' : 'Reparieren'}</span><span>${missingHull <= 0 ? '' : `${hullRepairCost} 🪙`}</span>
        </button>
      </div>
      <div class="card-box">
        <div><div class="card-title">⛵ Segel erneuern</div><div class="card-desc">${Math.round((player.sail / player.maxSail) * 100)}%</div></div>
        <button class="action-btn" ${missingSail <= 0 || game.gold < sailRepairCost ? 'disabled' : ''} onclick="repairShip('sail', ${sailRepairCost})">
          <span>${missingSail <= 0 ? '✓' : 'Erneuern'}</span><span>${missingSail <= 0 ? '' : `${sailRepairCost} 🪙`}</span>
        </button>
      </div>
    </div>

    <div class="card-box" style="margin-bottom:14px; background:#091119; border-color:#d4af37;">
      <div class="card-title">🚢 Schiffskauf / Umstieg (Inzahlungnahme: ${oldShipTradeInVal} 🪙)</div>
      <div class="grid-2" style="margin-top:8px;">
        ${shipOfferList.map(sh => {
          const fStats = getFactionShipStats(sh.clsKey, currentPort.faction);
          const netPrice = Math.max(0, Math.round(fStats.price * (1 - totalShipyardDisc)) - oldShipTradeInVal);
          const isSame = player.clsKey === fStats.clsKey && player.shipFaction === fStats.factionId && !player.isGhostShip;
          const rankCheck = canPlayerBuyShipClass(fStats.clsKey, currentPort.faction);
          return `
            <div class="card-box" style="border-color:${rankCheck.allowed ? '#5a4628' : '#7f1d1d'};">
              <div>
                <div class="card-title">${escapeHtml(fStats.name)} (${fStats.cannonsPerSide}K)</div>
                <div class="card-desc">🛡️ <strong>${fStats.hull}</strong> | 📦 <strong>${fStats.cargoCap}</strong> | 👥 <strong>${fStats.crew}</strong> | ⛵ <strong>${(fStats.baseSpeed * 4.8).toFixed(1)} kn</strong></div>
              </div>
              <button class="action-btn" ${isSame || !rankCheck.allowed || game.gold < netPrice ? 'disabled' : ''} onclick="buyOrSwapPortShip('${fStats.clsKey}')">
                <span>${isSame ? '✓' : (!rankCheck.allowed ? rankCheck.reason : 'Übernehmen')}</span><span>${isSame ? '' : netPrice + ' 🪙'}</span>
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="grid-2">
      ${UPGRADE_DEFS.map(def => {
        const lvl = (player.upgrades && player.upgrades[def.id]) || 0;
        const effMax = getEffectiveUpgradeMax(def.id);
        const cost = Math.max(20, Math.round(Math.floor(def.baseCost * Math.pow(def.costMult, lvl)) * (1 - totalShipyardDisc)));
        const isMax = lvl >= effMax;
        return `
          <div class="card-box">
            <div><div class="card-title">${td(def, 'name')} (${lvl}/${effMax})</div><div class="card-desc">${td(def, 'desc')}</div></div>
            <button class="action-btn" ${isMax || game.gold < cost ? 'disabled' : ''} onclick="buyPortUpgrade('${def.id}')">
              <span>${isMax ? 'MAX ✓' : 'Einbauen'}</span><span>${isMax ? '' : cost + ' 🪙'}</span>
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // 2. BEWAFFNUNG
  const crewCount = Math.max(1, Math.ceil(player.crew));
  const localEquipment = SPECIAL_SHIP_EQUIPMENT.filter(e => !e.enclaveOnly && (!e.treasureOnly || (player.ownedSpecialEquipment || []).includes(e.id)) && (isDmSafeZone || e.availablePorts.includes(currentPort.id) || e.faction === currentPort.faction || (e.treasureOnly && (player.ownedSpecialEquipment || []).includes(e.id))));
  const curEqObj = SPECIAL_SHIP_EQUIPMENT.find(e => e.id === player.specialEquipment);
  const freeCargo = Math.max(0, Math.floor(getMaxCargo() - getCargoTotal()));

  document.getElementById('tab_armory').innerHTML = `
    <div class="card-box" style="margin-bottom:14px; background:#091119; border-color:#f59e0b;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div class="card-title">💣 Kanonen-Gießerei (${cStats.equippedCount}/${cStats.totalSlots})</div>
        <button class="sm-btn" onclick="switchShipInvTab('captain'); toggleShipInventoryModal();">🤺 Persönliche Kapitäns-Waffen &amp; Kürass kaufen [I]</button>
      </div>
      <div class="grid-2" style="margin-top:8px;">
        ${CANNON_TYPES.filter(ct => !ct.enclaveOnly).map(ct => {
          const stock = isDmSafeZone ? 20 : ((currentPort.marketStock && currentPort.marketStock[ct.id] !== undefined) ? currentPort.marketStock[ct.id] : 0);
          const buyP = getPortGoodPrice(currentPort, ct.id, true);
          const sellP = getPortGoodPrice(currentPort, ct.id, false);
          const owned = Math.floor(player.cargo[ct.id] || 0);
          const cCheck = canPlayerBuyCannonType(ct.id, currentPort.faction);
          const spaceAvail = Math.max(freeCargo, cStats.totalSlots - cStats.equippedCount);
          const availToBuy = stock > 0 && cCheck.allowed && spaceAvail >= 1 && game.gold >= buyP;
          return `
            <div class="card-box" style="border-color:${cCheck.allowed ? '#5a4628' : '#7f1d1d'};">
              <div>
                <div class="card-title">${ct.icon} ${td(ct, 'name')} (💥 ${ct.damage})</div>
                <div class="card-desc">${td(ct, 'desc')}<br><strong>${owned}</strong> ${!cCheck.allowed ? `| <span style="color:#ff7675;">🔒 ${cCheck.reason}</span>` : ''}</div>
              </div>
              <div style="display:flex; gap:6px;">
                <button class="action-btn" style="flex:1;" ${!availToBuy ? 'disabled' : ''} onclick="tradeGood('${ct.id}', 1, true)"><span>+1</span><span>${buyP} 🪙</span></button>
                <button class="action-btn" style="flex:1;" ${!availToBuy || spaceAvail < 2 || game.gold < buyP * 2 ? 'disabled' : ''} onclick="tradeGood('${ct.id}', 2, true)"><span>+2</span><span>${buyP * 2} 🪙</span></button>
                <button class="sm-btn" ${owned < 1 ? 'disabled' : ''} onclick="tradeGood('${ct.id}', 1, false)">-1 (${sellP}🪙)</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="card-box" style="margin-bottom:14px; background:#091119; border-color:#38bdf8;">
      <div class="card-title">⚙️ Equipment [R]: <span style="color:#fde047;">${curEqObj ? td(curEqObj, 'name') : '—'}</span></div>
      <div class="grid-2" style="margin-top:6px;">
        ${localEquipment.map(eq => {
          const isInstalled = player.specialEquipment === eq.id;
          const eqCost = Math.round(eq.cost * (1 - rnk.discount * 0.4));
          return `
            <div class="card-box" style="border-color:${isInstalled ? '#2ecc71' : '#5a4628'};">
              <div><div class="card-title">${td(eq, 'name')}</div><div class="card-desc">${td(eq, 'desc')}</div></div>
              <button class="action-btn" ${isInstalled || game.gold < eqCost ? 'disabled' : ''} onclick="installSpecialEquipment('${eq.id}', ${eqCost})">
                <span>${isInstalled ? t('activeBadge') : '[R]'}</span><span>${isInstalled ? '' : eqCost + ' 🪙'}</span>
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="grid-3">
      ${['armor', 'melee', 'ranged'].map(cat => {
        const catTotal = getCategoryEquippedTotal(cat);
        const missingInCat = Math.max(0, crewCount - catTotal);
        const catIcon = cat === 'armor' ? '🛡️' : (cat === 'melee' ? '🗡️' : '🔫');
        return `
          <div style="display:flex; flex-direction:column; gap:10px;">
            <h3 style="color:#ffd700; font-size:13.5px;">${catIcon} Crew: ${catTotal}/${crewCount}</h3>
            ${CREW_EQUIPMENT[cat].map(item => {
              const owned = player.armory[item.id] || 0;
              const buyCount = Math.min(5, missingInCat);
              const packCost = Math.max(1, Math.round(item.costPerUnit * (1 - rnk.discount * 0.5)) * buyCount);
              return `
                <div class="card-box">
                  <div><div class="card-title">${td(item, 'name')} (${owned})</div><div class="card-desc">${td(item, 'desc')}</div></div>
                  <button class="action-btn" ${missingInCat <= 0 || game.gold < packCost ? 'disabled' : ''} onclick="buyCrewEquipment('${cat}', '${item.id}', ${buyCount}, ${packCost})">
                    <span>${missingInCat <= 0 ? '100% ✓' : `+${buyCount}`}</span><span>${missingInCat <= 0 ? '' : packCost + ' 🪙'}</span>
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }).join('')}
    </div>
  `;

  // 3. KONTOR (Ohne 'weapons'!)
  const foodBuyP = getPortGoodPrice(currentPort, 'food', true);
  const rumBuyP = getPortGoodPrice(currentPort, 'rum', true);
  const timberBuyP = getPortGoodPrice(currentPort, 'timber', true);
  const canvasBuyP = getPortGoodPrice(currentPort, 'canvas', true);
  const cheapestPorts = PORTS.filter(p => p.exports.includes(selectedIntelGood)).map(p => `${p.name} (${getPortGoodPrice(p, selectedIntelGood, true)}🪙)`).join(', ');
  const bestSellPorts = PORTS.filter(p => p.imports.includes(selectedIntelGood)).map(p => `${p.name} (${getPortGoodPrice(p, selectedIntelGood, false)}🪙)`).join(', ');

  let htmlMarket = `
    <div class="${hasMerchant ? 'grid-2' : ''}" style="margin-bottom:12px;">
      <div class="card-box">
        <div class="card-title">🍖🍾🪵⛵ ${t('quickSupply')}</div>
        <div style="display:flex; gap:5px; flex-wrap:wrap; margin-top:8px;">
          <button class="action-btn" style="flex:1;" ${freeCargo < 1 || game.gold < foodBuyP ? 'disabled' : ''} onclick="tradeGood('food', 5, true)"><span>+5 🍖</span><span>${foodBuyP * 5}🪙</span></button>
          <button class="action-btn" style="flex:1;" ${freeCargo < 1 || game.gold < rumBuyP ? 'disabled' : ''} onclick="tradeGood('rum', 5, true)"><span>+5 🍾</span><span>${rumBuyP * 5}🪙</span></button>
          <button class="action-btn" style="flex:1;" ${freeCargo < 1 || game.gold < timberBuyP ? 'disabled' : ''} onclick="tradeGood('timber', 5, true)"><span>+5 🪵</span><span>${timberBuyP * 5}🪙</span></button>
          <button class="action-btn" style="flex:1;" ${freeCargo < 1 || game.gold < canvasBuyP ? 'disabled' : ''} onclick="tradeGood('canvas', 5, true)"><span>+5 ⛵</span><span>${canvasBuyP * 5}🪙</span></button>
        </div>
      </div>
      ${hasMerchant ? `
        <div class="card-box">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="card-title">🧭 Handels-Auskunft</div>
            <select style="background:#14202c; color:#ffd700; border:1px solid #d4af37; padding:3px 6px; border-radius:4px;" onchange="changeIntelGood(this.value)">
              ${GOODS.filter(g => !g.enclaveOnly).map(g => `<option value="${g.id}" ${g.id === selectedIntelGood ? 'selected' : ''}>${g.icon} ${td(g, 'name')}</option>`).join('')}
            </select>
          </div>
          <div class="card-desc" style="margin-top:6px;">📉 <span style="color:#2ecc71;">${cheapestPorts || '—'}</span><br>📈 <span style="color:#ffd700;">${bestSellPorts || '—'}</span></div>
        </div>
      ` : ''}
    </div>
    <div style="display:flex; gap:10px; margin-bottom:12px;">
      <button class="tab-btn ${currentMarketSubTab === 'buy' ? 'active' : ''}" onclick="switchMarketSubTab('buy')">${t('buyTab')}</button>
      <button class="tab-btn ${currentMarketSubTab === 'sell' ? 'active' : ''}" onclick="switchMarketSubTab('sell')">${t('sellTab')}</button>
    </div>
  `;

  if (currentMarketSubTab === 'buy') {
    const availableBuyGoods = GOODS.filter(g => !g.enclaveOnly && ((currentPort.marketStock && currentPort.marketStock[g.id] !== undefined) ? currentPort.marketStock[g.id] : 20) > 0);
    htmlMarket += `
      <table class="trade-table"><thead><tr><th>Ware</th><th>Vorrat</th><th>An Bord</th><th>Preis</th><th></th></tr></thead><tbody>
        ${availableBuyGoods.map(g => {
          const stock = currentPort.marketStock[g.id];
          const buyP = getPortGoodPrice(currentPort, g.id, true);
          const owned = Math.floor(player.cargo[g.id] || 0);
          const cCheck = g.isCannon ? canPlayerBuyCannonType(g.id, currentPort.faction) : { allowed: true };
          const spaceForGood = g.isCannon ? Math.max(freeCargo, cStats.totalSlots - cStats.equippedCount) : freeCargo;
          const maxBuyPossible = Math.min(stock, spaceForGood, Math.floor(game.gold / Math.max(1, buyP)));
          return `
            <tr>
              <td><strong>${g.icon} ${td(g, 'name')}</strong></td>
              <td><span class="badge badge-norm">${stock}</span></td>
              <td><strong>${owned}</strong></td>
              <td style="color:#ffd700; font-weight:bold;">${buyP} 🪙</td>
              <td>
                ${!cCheck.allowed ? `<span style="color:#ff7675; font-size:11px;">🔒 ${cCheck.reason}</span>` : `
                  <button class="sm-btn" ${maxBuyPossible < 1 ? 'disabled' : ''} onclick="tradeGood('${g.id}', 1, true)">+1</button>
                  <button class="sm-btn" ${maxBuyPossible < 1 ? 'disabled' : ''} onclick="tradeGood('${g.id}', 5, true)">+5</button>
                  <button class="sm-btn" ${maxBuyPossible < 1 ? 'disabled' : ''} onclick="tradeGood('${g.id}', ${maxBuyPossible}, true)">${t('fullLoad')}</button>
                `}
              </td>
            </tr>`;
        }).join('')}
      </tbody></table>`;
  } else {
    htmlMarket += `
      <table class="trade-table"><thead><tr><th>Ware</th><th>An Bord</th><th>Preis</th><th></th></tr></thead><tbody>
        ${GOODS.filter(g => (player.cargo[g.id] || 0) >= 1).map(g => {
          const sellP = getPortGoodPrice(currentPort, g.id, false);
          const owned = Math.floor(player.cargo[g.id] || 0);
          return `
            <tr>
              <td><strong>${g.icon} ${td(g, 'name')}</strong></td>
              <td><strong>${owned}</strong></td>
              <td style="color:#2ecc71; font-weight:bold;">${sellP} 🪙</td>
              <td>
                <button class="sm-btn" onclick="tradeGood('${g.id}', 1, false)">-1</button>
                <button class="sm-btn" ${owned < 5 ? 'disabled' : ''} onclick="tradeGood('${g.id}', 5, false)">-5</button>
                <button class="sm-btn" onclick="tradeGood('${g.id}', ${owned}, false)">${t('fullLoad')}</button>
              </td>
            </tr>`;
        }).join('')}
      </tbody></table>`;
  }
  document.getElementById('tab_market').innerHTML = htmlMarket;

  // 4. TAVERNE (Ohne Silberflotten-Button, dafür mit PASSAGIER-REISENDEN & ENTDECKER-GILDE!)
  const portCrewPrice = currentPort.crewCost || 4;
  const availTavernCrew = currentPort.tavernCrewAvail !== undefined ? currentPort.tavernCrewAvail : 8;
  const missingCrew = Math.max(0, player.maxCrew - Math.ceil(player.crew));
  const maxCanHireHere = Math.min(missingCrew, availTavernCrew, Math.floor(game.gold / Math.max(1, portCrewPrice)));
  const crewHire5 = Math.min(5, missingCrew, availTavernCrew);
  const tavernRoundCost = Math.max(15, Math.ceil(player.crew * 0.45));
  const localSite = EXPLORATION_SITES.find(s => s.id === currentPort.assignedSiteId && !s.mapBought && !s.looted) || EXPLORATION_SITES.find(s => !s.mapBought && !s.looted);
  const canBuyLocalMap = !currentPort.treasureMapBought && !!localSite;
  const mapCost = localSite ? (110 + (localSite.riskLevel || 1) * 45) : 140;
  const pOffer = currentPort.passengerOffer;
  const unredeemedWonders = DISCOVERY_WONDERS.filter(dw => game.discoveries.found[dw.id] && !game.discoveries.turnedIn[dw.id]).length;

  document.getElementById('tab_tavern').innerHTML = `
    <div class="grid-3" style="margin-bottom:14px;">
      <div class="card-box">
        <div>
          <div class="card-title">🍺 Matrosen anwerben</div>
          <div class="card-desc">👥 <strong>${Math.ceil(player.crew)} / ${player.maxCrew}</strong> | 🍻 <strong>${Math.round(player.morale)}%</strong> | 🪙 ${portCrewPrice}/Mann (${availTavernCrew})</div>
        </div>
        <div style="display:flex; gap:5px; flex-wrap:wrap;">
          <button class="action-btn" style="flex:1;" ${crewHire5 <= 0 || game.gold < crewHire5 * portCrewPrice ? 'disabled' : ''} onclick="hireCrew(${crewHire5})"><span>+${crewHire5}</span><span>${crewHire5 * portCrewPrice}🪙</span></button>
          <button class="action-btn" style="flex:1;" ${maxCanHireHere <= 0 ? 'disabled' : ''} onclick="hireCrew(${maxCanHireHere})"><span>+${maxCanHireHere}</span><span>${maxCanHireHere * portCrewPrice}🪙</span></button>
          <button class="action-btn" style="width:100%; margin-top:4px; border-color:#2ecc71;" ${currentPort.tavernRoundBought || game.gold < tavernRoundCost ? 'disabled' : ''} onclick="buyTavernRound(${tavernRoundCost})">
            <span>🍻 ${currentPort.tavernRoundBought ? '✓' : 'Lokalrunde'}</span><span>${currentPort.tavernRoundBought ? '' : tavernRoundCost + '🪙'}</span>
          </button>
        </div>
      </div>

      <!-- PASSAGIER-KABINE IN DER TAVERNE ANSPRECHEN + SCHATZKARTE -->
      <div class="card-box">
        <div>
          <div class="card-title">🎩 Passagiere &amp; Schatzkarte</div>
          <div class="card-desc">
            ${game.activePassenger
              ? `🛳️ An Bord: <strong>${escapeHtml(game.activePassenger.name)}</strong> ➔ <strong>${game.activePassenger.destPortName}</strong>`
              : (pOffer ? `Reisegast nach <strong>${pOffer.destPortName}</strong> (+${pOffer.baseFare} 🪙, +${pOffer.bonusIntact} 🪙 Bonus)` : 'Aktuell kein Reisegast in der Schenke.')}
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <button class="action-btn" style="border-color:#38bdf8;" ${!pOffer || !!game.activePassenger ? 'disabled' : ''} onclick="acceptPassengerInTavern()">
            <span>🎩 ${pOffer ? escapeHtml(pOffer.name) : 'Passagier an Bord'}</span><span>${pOffer ? `+${pOffer.baseFare}🪙` : '—'}</span>
          </button>
          <button class="action-btn" ${!canBuyLocalMap || game.gold < mapCost ? 'disabled' : ''} onclick="buyTreasureMap(${mapCost})">
            <span>🗺️ Schatzkarte kaufen</span><span>${canBuyLocalMap ? mapCost + '🪙' : '✓'}</span>
          </button>
        </div>
      </div>

      <div class="card-box" style="background:#091410; border-color:#d4af37;">
        <div>
          <div class="card-title">🧭 Entdecker-Gilde &amp; Würfel</div>
          <div class="card-desc">Neue Fernglas-Entdeckungen: <strong style="color:#2ecc71;">${unredeemedWonders}</strong></div>
        </div>
        <div style="display:flex; flex-direction:column; gap:5px;">
          <button class="action-btn" style="border-color:#2ecc71;" onclick="switchShipInvTab('guild'); toggleShipInventoryModal();">
            <span>🧭 Gilden-Vertreter sprechen</span><span>📜</span>
          </button>
          <div style="display:flex; gap:5px;">
            <button class="primary-btn" style="flex:1; padding:6px;" onclick="openBlackjackModal()">🃏 17&amp;4</button>
            <button class="action-btn" style="flex:1; justify-content:center;" onclick="openZilchModal()">🎲 Zilch</button>
          </div>
        </div>
      </div>
    </div>

    <h3 style="color:#ffd700; font-size:14px; margin-bottom:7px;">🚢 Offiziere an Bord (${player.officers.length} / ${MAX_OFFICERS})</h3>
    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; margin-bottom:14px;">
      ${[0, 1, 2, 3].map(slot => {
        const off = player.officers[slot];
        if (!off) return `<div class="card-box" style="border-style:dashed; opacity:0.65; justify-content:center; align-items:center; min-height:125px;"><div class="card-title">#${slot + 1}</div></div>`;
        const assignedShip = (player.fleet || []).find(e => e.uid === off.assignedShipUid || e.commanderUid === off.uid);
        const roleObj = OFFICER_ROLES.find(r => r.roleId === off.roleId) || off;
        return `
          <div class="card-box" style="border-color:${off.isGhostOfficer ? '#10b981' : (assignedShip ? '#38bdf8' : '#5a4628')};">
            <div>
              <div style="display:flex; gap:8px; align-items:center; margin-bottom:5px;">
                ${renderPortraitBox(off.svg, 56, '#d4af37', off.isGhostOfficer)}
                <div>
                  <div class="card-title" style="font-size:12px;">${escapeHtml(off.name)}</div>
                  <div style="font-size:10px; color:#38bdf8; font-weight:bold;">${off.isGhostOfficer ? td(off, 'title') : td(roleObj, 'title')}</div>
                </div>
              </div>
              <div class="trait-pos" style="font-size:10px;">➕ ${formatOfficerTrait(off.posTrait)}</div>
              <div class="trait-neg" style="font-size:10px;">➖ ${formatOfficerTrait(off.negTrait)}</div>
            </div>
            <button class="action-btn danger" ${assignedShip ? 'disabled' : ''} onclick="dismissOfficer('${off.uid}')"><span>${assignedShip ? '⛵' : 'Entlassen'}</span><span>✖</span></button>
          </div>`;
      }).join('')}
    </div>

    <h3 style="color:#ffd700; font-size:14px; margin-bottom:7px;">🍻 Offiziere in der Schenke</h3>
    <div class="grid-2">
      ${(currentPort.tavernOfficers || []).map(off => {
        const full = player.officers.length >= MAX_OFFICERS;
        const discCost = Math.round(off.cost * (1 - rnk.discount * 0.5));
        const ofac = FACTIONS[off.faction] || FACTIONS.pirates;
        const roleObj = OFFICER_ROLES.find(r => r.roleId === off.roleId) || off;
        return `
          <div class="card-box">
            <div>
              <div style="display:flex; gap:10px; align-items:center; margin-bottom:6px;">
                ${renderPortraitBox(off.svg, 64, '#d4af37', false)}
                <div>
                  <div class="card-title">${escapeHtml(off.name)}</div>
                  <div style="font-size:11px; color:#38bdf8; font-weight:bold;">${td(roleObj, 'title')} • <span style="color:${ofac.color}">${td(ofac, 'short')}</span></div>
                  <div style="font-size:10.5px; color:#fde047;">💰 ${off.salary || 6} 🪙/T</div>
                </div>
              </div>
              <div class="card-desc">${td(roleObj, 'roleDesc')}</div>
              <div class="trait-pos">➕ ${formatOfficerTrait(off.posTrait)}</div>
              <div class="trait-neg">➖ ${formatOfficerTrait(off.negTrait)}</div>
            </div>
            <button class="action-btn" ${full || game.gold < discCost ? 'disabled' : ''} onclick="hirePortOfficer('${off.uid}', ${discCost})">
              <span>${full ? '4/4' : 'Anheuern'}</span><span>${discCost} 🪙</span>
            </button>
          </div>`;
      }).join('')}
    </div>
  `;

  // 5. GOUVERNEUR (Mit Anzeige der Loyalitäts-Konsequenzen & Cooldown!)
  const prisoners = player.prisoners || 0;
  const pByFac = player.prisonersByFaction || {};
  const rep = game.rep[fac.id];
  const pardonCost = Math.max(550, 450 + Math.abs(rep) * 24);
  const isMemberHere = game.allegiance === fac.id;
  const onCooldown = (game.allegianceCooldownUntil || 0) > (game.time || 0);
  const maleGovPool = [0, 1, 2, 3, 4, 6, 7, 9, 10, 11, 13, 14];
  const govPortraitId = `kolonial:${maleGovPool[PORTS.indexOf(currentPort) % maleGovPool.length]}`;

  document.getElementById('tab_gov').innerHTML = `
    <div class="card-box" style="margin-bottom:14px; background:#091119; border-color:${fac.color};">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div style="display:flex; gap:12px; align-items:center; flex:1;">
          ${renderPortraitBox(govPortraitId, 76, fac.color, false)}
          <div>
            <div class="card-title" style="color:${fac.color}; font-size:16px;">👑 ${currentPort.name} — ${td(fac, 'name')}</div>
            <div class="card-desc" style="margin:5px 0;">
              ${td(fac, 'perkDesc')}<br>
              <small style="color:#fca5a5;">⚠️ Hinweis: Ein späterer Eidbruch kostet Ansehen bei ALLEN Kronen (-35 / -12 Ruf) und sperrt neue Kaperbriefe für 1 Tag!</small>
            </div>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px; min-width:250px;">
          ${isMemberHere
            ? `<button class="action-btn danger" onclick="leaveFactionAllegiance()"><span>👑 Kaperbrief niederlegen (-35/-12 Ruf!)</span><span>✖</span></button>`
            : `<button class="primary-btn" ${rep < -20 || onCooldown || !!game.allegiance ? 'disabled' : ''} onclick="joinFactionAllegiance('${fac.id}')">
                 👑 ${onCooldown ? '⏳ Sperrfrist aktiv' : (game.allegiance ? 'Bereits gebunden' : `${td(fac, 'short')} anschließen`)}
               </button>`}
          <button class="action-btn" ${rep >= 0 || game.gold < pardonCost ? 'disabled' : ''} onclick="buyPardon('${fac.id}', ${pardonCost})">
            <span>📜 Amnestie</span><span>${rep >= 0 ? '✓' : pardonCost + ' 🪙'}</span>
          </button>
        </div>
      </div>
    </div>

    ${game.activeMission ? `
      <div class="card-box" style="margin-bottom:14px; background:#1c1608; border-color:#ffd700; flex-direction:row; align-items:center; gap:10px;">
        <div style="flex:1;"><div class="card-title">📜 ${escapeHtml(game.activeMission.title)}</div><div class="card-desc" style="color:#f1f5f9; margin:0;">${escapeHtml(game.activeMission.desc)}</div></div>
        <button class="action-btn danger" onclick="abandonActiveMission()">${t('abandonMissionBtn')}</button>
      </div>` : ''}

    <div class="card-box" style="margin-bottom:14px; background:#091119;">
      <div class="card-title">⛓️ Gefangene übergeben (${prisoners})</div>
      <div style="display:grid; grid-template-columns:repeat(6, 1fr); gap:6px; margin-top:8px;">
        ${Object.values(FACTIONS).map(pf => {
          const cnt = pByFac[pf.id] || 0;
          const rate = pf.id === fac.id ? 30 : ((fac.relations[pf.id] || 0) <= -50 ? 54 : 38);
          return `<div class="card-box" style="border-color:${pf.color}; padding:6px;"><div style="font-size:11px; font-weight:bold; color:${pf.color};">${td(pf, 'short')}: ${cnt}</div><button class="sm-btn" style="width:100%; margin-top:5px;" ${cnt <= 0 ? 'disabled' : ''} onclick="ransomPrisonersByFaction('${pf.id}')">+${cnt * rate}🪙</button></div>`;
        }).join('')}
      </div>
    </div>

    <div class="grid-2">
      ${(currentPort.missions || []).map(ms => `
        <div class="card-box">
          <div>
            <div class="card-title">${escapeHtml(ms.title)}</div>
            <div class="card-desc" style="color:#cbd5e1;">${escapeHtml(ms.desc)}</div>
            <div style="font-size:11.5px; color:#2ecc71; font-weight:bold; margin-bottom:8px;">+${ms.rewardGold} 🪙 | +${ms.rewardRankPts} RP | +${ms.rewardXp} XP</div>
          </div>
          <button class="action-btn" ${game.activeMission ? 'disabled' : ''} onclick="acceptMission('${ms.id}')"><span>${game.activeMission ? '—' : 'Annehmen'}</span><span>📜</span></button>
        </div>
      `).join('')}
    </div>
  `;
};

window.buyCrewEquipment = function(cat, itemId, count, cost) {
  if (game.gold < cost) return;
  const canStillEquip = Math.max(0, Math.max(1, Math.ceil(player.crew)) - getCategoryEquippedTotal(cat));
  if (canStillEquip <= 0) return;
  game.gold -= cost;
  player.armory[itemId] = (player.armory[itemId] || 0) + Math.min(count, canStillEquip);
  clampCrewEquipmentToCrewSize();
  SoundFX.play('coin');
  updateHUD(); renderPortModal();
};

window.buyTreasureMap = function(cost) {
  if (!currentPort || currentPort.treasureMapBought) return;
  const site = EXPLORATION_SITES.find(s => s.id === currentPort.assignedSiteId && !s.mapBought && !s.looted) || EXPLORATION_SITES.find(s => !s.mapBought && !s.looted);
  if (!site || game.gold < cost) return;
  game.gold -= cost;
  currentPort.treasureMapBought = true;
  site.mapBought = true; site.discovered = true;
  const col = Math.floor(site.x / FOW_CELL), row = Math.floor(site.y / FOW_CELL);
  for (let r = Math.max(0, row - 3); r <= Math.min(FOW_ROWS - 1, row + 3); r++) {
    for (let c = Math.max(0, col - 3); c <= Math.min(FOW_COLS - 1, col + 3); c++) fowGrid[r * FOW_COLS + c] = 1;
  }
  SoundFX.play('coin');
  updateHUD(); renderPortModal();
};

window.acceptMission = function(missionId) {
  if (!currentPort || game.activeMission) return;
  const ms = currentPort.missions.find(m => m.id === missionId);
  if (!ms) return;
  game.activeMission = ms;
  currentPort.missions = currentPort.missions.filter(m => m.id !== missionId);

  if (ms.type === 'hunt' || ms.type === 'capture_only') {
    spawnWorldShip({
      faction: ms.enemyFaction, clsKey: ms.type === 'capture_only' ? 'corvette' : 'frigate',
      x: ms.spawnX, y: ms.spawnY,
      name: `${td(FACTIONS[ms.enemyFaction], 'short')}`,
      isMissionTarget: true, mustCaptureOnly: ms.type === 'capture_only', missionId: ms.id, skipEscorts: true
    });
  } else if (ms.type === 'rescue') {
    flotsam.push({ x: ms.spawnX, y: ms.spawnY, gold: 50, goodId: 'food', goodAmt: 2, survivors: 4, faction: ms.faction, isMissionRescue: true, life: 9200 });
  }
  updateHUD(); renderPortModal();
};

window.repairShip = function(type, cost) {
  if (game.gold < cost) return;
  if (type === 'hull') player.hull = player.maxHull;
  if (type === 'sail') player.sail = player.maxSail;
  game.gold -= cost;
  SoundFX.play('coin');
  updateHUD(); renderPortModal();
};

window.buyPortUpgrade = function(id) {
  const def = UPGRADE_DEFS.find(u => u.id === id);
  if (!def) return;
  player.upgrades = player.upgrades || {};
  const lvl = player.upgrades[id] || 0;
  const effMax = getEffectiveUpgradeMax(id);
  const mods = getOfficerModifiers();
  const totalDisc = Math.min(0.45, getPortCostDiscount(currentPort) + (mods.shipyardDiscount || 0));
  const cost = Math.max(20, Math.round(Math.floor(def.baseCost * Math.pow(def.costMult, lvl)) * (1 - totalDisc)));
  if (game.gold < cost || lvl >= effMax) return;

  game.gold -= cost;
  player.upgrades[id] = lvl + 1;

  if (id === 'cannons') {
    player.cannonsPerSide += 1;
    player.portCannons.push(0); player.stbdCannons.push(0);
    player.portCannonDamage.push(0); player.stbdCannonDamage.push(0);
    player.length += 2.6; player.width += 0.5;
    rebuildCannonPips();
  }
  if (id === 'reload') player.reloadMax = Math.max(95, Math.floor(player.reloadMax * 0.95));
  if (id === 'damage') player.rangeBonus += 0.04;
  if (id === 'sails') { player.maxSail += 30; player.sail = player.maxSail; player.baseMaxSpeed *= 1.035; }
  if (id === 'hull') { player.baseMaxHull += 65; recalcPlayerDerivedStats(); player.hull = Math.min(player.maxHull, player.hull + 65); }
  if (id === 'cargo') { player.baseCargoCap += 14; player.baseMaxCrew += 6; recalcPlayerDerivedStats(); }

  SoundFX.play('coin');
  grantCaptainXP(18);
  updateHUD(); renderPortModal();
};

window.tradeGood = function(goodId, amount, isBuying) {
  if (amount <= 0 || !currentPort) return;
  currentPort.marketStock = currentPort.marketStock || {};
  currentPort.marketPricePressure = currentPort.marketPricePressure || {};

  const gObj = GOODS.find(g => g.id === goodId);
  if (!gObj) return;
  if (isBuying && gObj.isCannon && !canPlayerBuyCannonType(goodId, currentPort.faction).allowed) return;
  const unitPrice = getPortGoodPrice(currentPort, goodId, isBuying);

  if (isBuying) {
    const isDm = !!(game.isMultiplayer && game.mpMode === 'deathmatch');
    const stock = isDm ? 40 : (currentPort.marketStock[goodId] !== undefined ? currentPort.marketStock[goodId] : 20);
    if (stock <= 0) return;
    const free = Math.max(0, Math.floor(getMaxCargo() - getCargoTotal()));
    const cStats = getPlayerEquippedCannonStats();
    const spaceAvail = gObj.isCannon ? Math.max(free, cStats.totalSlots - cStats.equippedCount) : free;
    const qty = Math.min(amount, stock, spaceAvail, Math.floor(game.gold / unitPrice));
    if (qty <= 0) return;

    game.gold -= qty * unitPrice;
    player.cargo[goodId] = (player.cargo[goodId] || 0) + qty;
    if (!isDm) currentPort.marketStock[goodId] = stock - qty;
    currentPort.marketPricePressure[goodId] = Math.min(1.65, (currentPort.marketPricePressure[goodId] || 1.0) + qty * 0.014);
  } else {
    const qty = Math.min(amount, Math.floor(player.cargo[goodId] || 0));
    if (qty <= 0) return;
    game.gold += qty * unitPrice;
    player.cargo[goodId] = Math.max(0, player.cargo[goodId] - qty);
    if (currentPort.marketStock[goodId] >= 0) currentPort.marketStock[goodId] += qty;
    currentPort.marketPricePressure[goodId] = Math.max(0.65, (currentPort.marketPricePressure[goodId] || 1.0) - qty * 0.012);
    grantCaptainXP(qty * 2);
  }
  SoundFX.play('coin');
  updateHUD(); renderPortModal();
};

window.hireCrew = function(amount) {
  if (!currentPort || amount <= 0) return;
  const pricePerMan = currentPort.crewCost || 4;
  const avail = currentPort.tavernCrewAvail !== undefined ? currentPort.tavernCrewAvail : 8;
  const qty = Math.min(amount, avail, Math.max(0, player.maxCrew - Math.ceil(player.crew)), Math.floor(game.gold / pricePerMan));
  if (qty <= 0) return;
  game.gold -= qty * pricePerMan;
  player.crew = Math.min(player.maxCrew, player.crew + qty);
  currentPort.tavernCrewAvail = Math.max(0, avail - qty);
  SoundFX.play('coin');
  updateHUD(); renderPortModal();
};

window.buyTavernRound = function(cost) {
  if (!currentPort || currentPort.tavernRoundBought || game.gold < cost) return;
  game.gold -= cost;
  player.morale = 100;
  player.officers.forEach(o => o.morale = 100);
  currentPort.tavernCrewAvail = (currentPort.tavernCrewAvail || 0) + 3 + Math.floor(Math.random() * 4);
  currentPort.tavernRoundBought = true;
  SoundFX.play('coin');
  renderOfficerHudBar(); updateHUD(); renderPortModal();
};

window.hirePortOfficer = function(uid, finalCost) {
  if (!currentPort || player.officers.length >= MAX_OFFICERS) return;
  const idx = currentPort.tavernOfficers.findIndex(o => o.uid === uid);
  if (idx === -1) return;
  const off = currentPort.tavernOfficers[idx];
  const cost = finalCost || off.cost;
  if (game.gold < cost) return;

  game.gold -= cost;
  currentPort.tavernOfficers.splice(idx, 1);
  player.officers.push(off);
  SoundFX.play('coin');
  recalcPlayerDerivedStats();
  renderOfficerHudBar();
  showCrewChatter(off.name, 'Melde mich zum Dienst an Bord, Kapitän!', off.svg);
  if (window.updateHornigoldTutorialProgress) updateHornigoldTutorialProgress();
  updateHUD(); renderPortModal();
};

window.dismissOfficer = function(uid) {
  const idx = player.officers.findIndex(o => o.uid === uid);
  if (idx === -1) return;
  if (player.officers[idx].assignedShipUid && (player.fleet || []).some(e => e.uid === player.officers[idx].assignedShipUid)) return;
  player.officers.splice(idx, 1);
  recalcPlayerDerivedStats();
  renderOfficerHudBar(); updateHUD(); renderPortModal();
};

window.buyPardon = function(factionId, cost) {
  if (game.gold < cost) return;
  game.gold -= cost;
  game.rep[factionId] = 0;
  ships.forEach(s => { if (s.faction === factionId) { s.provokedByPlayer = false; s.isBountyHunter = false; } });
  SoundFX.play('coin');
  updateHUD(); renderPortModal();
};

// ============================================================================
// FISCHERDÖRFER & SEE-GESPRÄCHE [U] (Inkl. Silberflotten-Tipp von Piraten!)
// ============================================================================
window.openVillageModal = function() {
  if (!currentVillage) return;
  player.sailSetting = 0;
  document.getElementById('villageOverlay').classList.add('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
  renderVillageModal();
  resetModalScrollTop('villageOverlay');
};

window.closeVillageModal = function() {
  document.getElementById('villageOverlay').classList.remove('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
  updateHUD();
};

window.buyVillageFood = function(amt) {
  if (!currentVillage) return;
  const qty = Math.min(amt, currentVillage.foodStock, Math.max(0, Math.floor(getMaxCargo() - getCargoTotal())), Math.floor(game.gold / currentVillage.foodPrice));
  if (qty <= 0) return;
  game.gold -= qty * currentVillage.foodPrice;
  player.cargo.food = (player.cargo.food || 0) + qty;
  currentVillage.foodStock -= qty;
  SoundFX.play('coin');
  updateHUD(); renderVillageModal();
};

window.hireVillageCrew = function(amt) {
  if (!currentVillage || amt <= 0) return;
  const qty = Math.min(amt, currentVillage.crewAvail, Math.max(0, player.maxCrew - Math.ceil(player.crew)), Math.floor(game.gold / currentVillage.crewCost));
  if (qty <= 0) return;
  game.gold -= qty * currentVillage.crewCost;
  player.crew = Math.min(player.maxCrew, player.crew + qty);
  currentVillage.crewAvail -= qty;
  SoundFX.play('coin');
  updateHUD(); renderVillageModal();
};

window.raidCurrentFishingVillage = function() {
  if (!currentVillage || (currentVillage.raidCooldown || 0) > 0) return;
  const vil = currentVillage;
  document.getElementById('villageOverlay').classList.remove('active');
  if (window.startVillageRaidBoarding) startVillageRaidBoarding(vil);
};

window.renderVillageModal = function() {
  if (!currentVillage) return;
  const fv = currentVillage;
  if (window.applySceneBackgroundToModal) {
    applySceneBackgroundToModal('villageOverlay', fv.isVoodooVillage ? 'village_voodoo' : 'village_fishing');
  }
  const free = Math.max(0, Math.floor(getMaxCargo() - getCargoTotal()));
  const missingCrew = Math.max(0, player.maxCrew - Math.ceil(player.crew));
  const maxHireNow = Math.min(fv.crewAvail, missingCrew, Math.floor(game.gold / Math.max(1, fv.crewCost)));
  const maxBuyFood5 = Math.min(5, fv.foodStock, free, Math.floor(game.gold / Math.max(1, fv.foodPrice)));
  const onRaidCooldown = (fv.raidCooldown || 0) > 0;
  const isVoodoo = !!fv.isVoodooVillage;
  const vilIdx = Math.max(0, FISHING_VILLAGES.indexOf(fv));
  const villagerPid = `inselvolk:${(vilIdx * 2 + 10) % 16}`;

  document.getElementById('villageTitle').textContent = `${isVoodoo ? '🔮' : '🐟'} ${td(fv, 'name')}`;
  document.getElementById('villageBody').innerHTML = `
    <div class="card-box" style="margin-bottom:14px; background:#091119;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; gap:12px; align-items:center;">
          ${renderPortraitBox(villagerPid, 68, '#2ecc71', false)}
          <div>
            <div class="card-title">${isVoodoo ? '🕯️' : '🏝️'} ${td(fv, 'name')}</div>
            <div style="font-size:12px; color:#cbd5e1; margin-top:4px;">🪙 <strong style="color:#ffd700;">${game.gold}</strong> | 📦 ${Math.ceil(getCargoTotal())}/${getMaxCargo()} | 👥 ${Math.ceil(player.crew)}/${player.maxCrew}</div>
          </div>
        </div>
        ${renderWaitTimeWidgetHTML('renderVillageModal')}
      </div>
    </div>

    <div class="grid-3">
      <div class="card-box">
        <div><div class="card-title">🍖 Räucherfisch (${fv.foodPrice}🪙)</div><div class="card-desc">Vorrat: <strong>${fv.foodStock}</strong></div></div>
        <div style="display:flex; gap:6px;">
          <button class="action-btn" style="flex:1;" ${fv.foodStock < 1 || free < 1 || game.gold < fv.foodPrice ? 'disabled' : ''} onclick="buyVillageFood(1)"><span>+1</span><span>${fv.foodPrice}🪙</span></button>
          <button class="action-btn" style="flex:1;" ${maxBuyFood5 < 1 ? 'disabled' : ''} onclick="buyVillageFood(${maxBuyFood5})"><span>+${Math.max(1, maxBuyFood5)}</span><span>${Math.max(1, maxBuyFood5) * fv.foodPrice}🪙</span></button>
        </div>
      </div>

      <div class="card-box">
        <div><div class="card-title">🚣 Fischer anheuern (${fv.crewCost}🪙)</div><div class="card-desc">Verfügbar: <strong>${fv.crewAvail}</strong></div></div>
        <div style="display:flex; gap:6px;">
          <button class="action-btn" style="flex:1;" ${maxHireNow < 1 ? 'disabled' : ''} onclick="hireVillageCrew(1)"><span>+1</span><span>${fv.crewCost}🪙</span></button>
          <button class="action-btn" style="flex:1;" ${maxHireNow < 1 ? 'disabled' : ''} onclick="hireVillageCrew(${maxHireNow})"><span>+${maxHireNow > 0 ? maxHireNow : fv.crewAvail}</span><span>${(maxHireNow > 0 ? maxHireNow : fv.crewAvail) * fv.crewCost}🪙</span></button>
        </div>
      </div>

      <div class="card-box" style="border-color:#ef4444; background:#1c0a0a;">
        <div><div class="card-title" style="color:#fca5a5;">🔥 Überfallen!</div><div class="card-desc">-28 Reputation</div></div>
        <button class="action-btn danger" ${onRaidCooldown ? 'disabled' : ''} onclick="raidCurrentFishingVillage()"><span>⚔️ ${onRaidCooldown ? '—' : '-28 Ruf'}</span><span>☠️</span></button>
      </div>
    </div>

    ${isVoodoo && window.renderVoodooSanctumSectionHTML ? renderVoodooSanctumSectionHTML() : ''}
  `;
};

window.openCaptainTalkModal = function() {
  if (!currentTalkTarget) return;
  currentTalkTarget.talkActionsDone = currentTalkTarget.talkActionsDone || {};
  talkStatusMessage = '„Kontaktanfrage angenommen! Was führt Euch längsseits unseres Schiffes, Kapitän?“';
  document.getElementById('talkOverlay').classList.add('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
  renderCaptainTalkModal();
};

window.closeCaptainTalkModal = function() {
  document.getElementById('talkOverlay').classList.remove('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
  updateHUD();
};

window.getCaptainRelationshipScore = function(ship) {
  if (!ship) return 0;
  if (ship.namedCaptainId && game.captainRelations && game.captainRelations[ship.namedCaptainId] !== undefined) {
    return game.captainRelations[ship.namedCaptainId];
  }
  return ship.tempRelation || (game.rep[ship.faction] || 0);
};

window.modifyCaptainRelationship = function(ship, delta) {
  const bonus = hasCaptainPerk('perk_hypno_eyepatch') ? Math.round(Math.abs(delta) * 0.15) : 0;
  const finalDelta = delta > 0 ? delta + bonus : delta;
  if (ship.namedCaptainId) game.captainRelations[ship.namedCaptainId] = Math.max(-100, Math.min(100, (game.captainRelations[ship.namedCaptainId] || 0) + finalDelta));
  else ship.tempRelation = Math.max(-100, Math.min(100, (ship.tempRelation || (game.rep[ship.faction] || 0)) + finalDelta));
};

window.captainTalkAction = function(act) {
  const s = currentTalkTarget;
  if (!s) return;
  s.talkActionsDone = s.talkActionsDone || {};
  if (s.talkActionsDone[act]) return;

  const rel = getCaptainRelationshipScore(s);
  if (act === 'news') {
    const richPort = PORTS[Math.floor(Math.random() * PORTS.length)];
    const expGood = GOODS.find(g => g.id === richPort.exports[0]) || GOODS[0];
    const impGood = GOODS.find(g => g.id === richPort.imports[0]) || GOODS[1];
    modifyCaptainRelationship(s, 4);
    s.talkActionsDone.news = true;
    talkStatusMessage = `🗣️ ${escapeHtml(s.captainName)}: "${richPort.name} ➔ 📉 ${td(expGood, 'name')} | 📈 ${td(impGood, 'name')}!" (+4)`;
  } else if (act === 'silver_rumor') {
    // Exklusiv bei Piratenkapitänen auf See: Verrät die Position der Spanischen Silberflotte!
    if (s.faction !== 'pirates' || game.gold < 40) return;
    game.gold -= 40;
    let silverShip = ships.find(sh => sh.isSilverFleet);
    if (!silverShip && window.spawnSilverFleetConvoy) silverShip = spawnSilverFleetConvoy();
    if (silverShip) {
      const col = Math.floor(silverShip.x / FOW_CELL), row = Math.floor(silverShip.y / FOW_CELL);
      for (let r = Math.max(0, row - 5); r <= Math.min(FOW_ROWS - 1, row + 5); r++) {
        for (let c = Math.max(0, col - 5); c <= Math.min(FOW_COLS - 1, col + 5); c++) fowGrid[r * FOW_COLS + c] = 1;
      }
      if (hasNavigatorForWaypoints()) {
        game.customWaypoint = { x: Math.round(silverShip.x), y: Math.round(silverShip.y) };
      }
      s.talkActionsDone.silver_rumor = true;
      SoundFX.play('coin');
      talkStatusMessage = `🥈 „Hört gut zu, Kamerad: Die spanische Schatzgaleone kreuzt aktuell bei (${Math.round(silverShip.x)}, ${Math.round(silverShip.y)}) – ich habe Euch das Gebiet auf der Seekarte [M] aufgedeckt!“`;
    }
  } else if (act === 'gift_rum') {
    if ((player.cargo.rum || 0) < 2) return;
    player.cargo.rum -= 2;
    modifyCaptainRelationship(s, 15);
    game.rep[s.faction] = Math.min(100, (game.rep[s.faction] || 0) + 4);
    s.talkActionsDone.gift_rum = true;
    SoundFX.play('coin');
    talkStatusMessage = `🍾 „Auf Euer Wohl, Kapitän! (+15 Beziehung)“`;
  } else if (act === 'buy_supplies') {
    if (game.gold < 45 || Math.max(0, Math.floor(getMaxCargo() - getCargoTotal())) < 2) return;
    game.gold -= 45;
    player.cargo.food = (player.cargo.food || 0) + 3;
    player.cargo.medicine = (player.cargo.medicine || 0) + 1;
    modifyCaptainRelationship(s, 5);
    s.talkActionsDone.buy_supplies = true;
    SoundFX.play('coin');
    talkStatusMessage = `📦 +3 🍖 & +1 🍋 (-45 🪙)`;
  } else if (act === 'buy_cargo') {
    const goodObj = GOODS.find(g => g.id === s.lootGood) || GOODS[0];
    const unitP = Math.max(8, Math.round(goodObj.basePrice * (rel >= 25 ? 0.78 : 0.92)));
    const qty = Math.min(4, s.lootAmount || 0, Math.max(0, Math.floor(getMaxCargo() - getCargoTotal())), Math.floor(game.gold / unitP));
    if (qty > 0) {
      game.gold -= qty * unitP;
      player.cargo[goodObj.id] = (player.cargo[goodObj.id] || 0) + qty;
      s.lootAmount -= qty;
      modifyCaptainRelationship(s, 8);
      s.talkActionsDone.buy_cargo = true;
      SoundFX.play('coin');
      talkStatusMessage = `⚖️ +${qty}× ${td(goodObj, 'name')} (${qty * unitP} 🪙)`;
    }
  }
  updateHUD(); renderCaptainTalkModal();
};

window.sendPrivateHailMessage = function() {
  const inp = document.getElementById('privateHailMsgInput');
  if (!inp || !currentTalkTarget) return;
  const txt = inp.value.replace(/[<>]/g, '').trim().slice(0, 140);
  inp.value = '';
  if (!txt) return;
  if (currentTalkTarget.isRemotePlayer && window.NetClient && NetClient.isConnected()) {
    NetClient.sendDirectMessage(currentTalkTarget.sessionId, txt);
  }
  talkStatusMessage = `📨 Du: „${escapeHtml(txt)}“`;
  renderCaptainTalkModal();
};

window.renderCaptainTalkModal = function() {
  const s = currentTalkTarget;
  if (!s) return;
  const done = s.talkActionsDone || {};
  const fac = FACTIONS[s.faction] || FACTIONS.pirates;
  const rel = getCaptainRelationshipScore(s);
  const relColor = rel >= 15 ? '#2ecc71' : (rel >= -10 ? '#fde047' : '#ff7675');
  const capPortraitId = s.captainPortraitId || pickPortraitForFactionCaptain(s.faction, s.captainSeed || 77, !!s.isGhost, s.gender || 'm');
  const goodObj = GOODS.find(g => g.id === s.lootGood) || GOODS[0];
  const unitP = Math.max(8, Math.round(goodObj.basePrice * (rel >= 25 ? 0.78 : 0.92)));

  document.getElementById('talkTitle').textContent = `🗣️ ${s.captainName || s.name}`;
  document.getElementById('talkBody').innerHTML = `
    <div class="card-box" style="margin-bottom:14px; background:#091119; border-color:${fac.color};">
      <div style="display:flex; gap:14px; align-items:center;">
        ${renderPortraitBox(capPortraitId, 80, fac.color, !!s.isGhost)}
        <div style="flex:1;">
          <div class="card-title" style="font-size:16px;">${escapeHtml(s.captainName || 'Kapitän')} ${s.namedCaptainId ? '⭐' : ''}</div>
          <div style="font-size:12px; color:${fac.color}; font-weight:bold;">"${escapeHtml(s.name)}" (${td(fac, 'name')})</div>
          <div style="font-size:12px; margin-top:4px;">❤️ <strong style="color:${relColor};">${rel > 0 ? '+' + rel : rel}</strong></div>
        </div>
      </div>
      <div style="margin-top:12px; padding:10px; background:#14202c; border-left:3px solid #38bdf8; color:#f8fafc; font-size:13px;">
        ${talkStatusMessage}
      </div>
    </div>

    ${s.isRemotePlayer ? `
      <div style="display:flex; gap:8px; margin-bottom:12px;">
        <input id="privateHailMsgInput" type="text" placeholder="Private Nachricht an Kapitän senden..." style="flex:1; background:#081018; border:1px solid #38bdf8; color:#f8fafc; padding:8px 10px; border-radius:6px;">
        <button class="primary-btn" onclick="sendPrivateHailMessage()">📨 Senden</button>
      </div>
    ` : `
      <div class="grid-2">
        <button class="action-btn" ${done.news ? 'disabled' : ''} onclick="captainTalkAction('news')"><span>🧭 Handelsrouten erfragen</span><span>${done.news ? '✓' : '+4'}</span></button>
        <button class="action-btn" ${done.gift_rum || (player.cargo.rum || 0) < 2 ? 'disabled' : ''} onclick="captainTalkAction('gift_rum')"><span>🍾 2× Rum spendieren</span><span>${done.gift_rum ? '✓' : '+15'}</span></button>
        <button class="action-btn" ${done.buy_supplies || game.gold < 45 ? 'disabled' : ''} onclick="captainTalkAction('buy_supplies')"><span>🍖 Not-Proviant (+3🍖, +1🍋)</span><span>${done.buy_supplies ? '✓' : '45 🪙'}</span></button>
        <button class="action-btn" ${done.buy_cargo || (s.lootAmount || 0) <= 0 || game.gold < unitP ? 'disabled' : ''} onclick="captainTalkAction('buy_cargo')"><span>⚖️ ${td(goodObj, 'name')} (${s.lootAmount || 0})</span><span>${done.buy_cargo ? '✓' : `${unitP} 🪙`}</span></button>
        ${s.faction === 'pirates' ? `
          <button class="action-btn" style="grid-column:1 / -1; border-color:#ffd700; background:#2c2112;" ${done.silver_rumor || game.gold < 40 ? 'disabled' : ''} onclick="captainTalkAction('silver_rumor')">
            <span>🥈 Nach dem geheimen Kurs der Spanischen Silberflotte fragen!</span>
            <span>${done.silver_rumor ? '✓ Auf [M] markiert' : '40 🪙'}</span>
          </button>
        ` : ''}
      </div>
    `}
  `;
};