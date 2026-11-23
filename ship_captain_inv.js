// ============================================================================
// ship_captain_inv.js - 1. Schiffsinventar (Galionsfiguren, Rationsstufen,
//                          Live-Crew-Fokus-Regler auf See & Rumpf-Umbau)
//                       2. Kapitäns-Inventar (Waffen/Rüstung fürs 1v1-Duell)
//                       3. Passagier-Missionen, Entdecker-Gilde & Investitionen
// ============================================================================

const FIGUREHEAD_DEFS = [
  {
    id: 'fh_lion', icon: '🦁', cost: 420, color: '#fbbf24',
    name_de: 'Vergoldeter Königslöwe', name_en: 'Gilded Royal Lion',
    desc_de: '+12% Startmoral im Entergefecht & +8% Kapitäns-Einschüchterung im Duell.',
    desc_en: '+12% boarding morale & +8% duel intimidation.',
    mods: { boardingMeleeBonus: 0.10, moraleRegen: 0.18 }
  },
  {
    id: 'fh_mermaid', icon: '🧜‍♀️', cost: 460, color: '#38bdf8',
    name_de: 'Geschnitzte Sturm-Sirene', name_en: 'Carved Storm Siren',
    desc_de: '-35% Sturm- und Strudelschaden sowie +6% Segelgeschwindigkeit.',
    desc_en: '-35% storm & whirlpool damage and +6% sailing speed.',
    mods: { speedMult: 0.06, stormShield: 0.35 }
  },
  {
    id: 'fh_neptune', icon: '🔱', cost: 520, color: '#2dd4bf',
    name_de: 'Dreizack des Neptun', name_en: 'Neptune’s Trident',
    desc_de: '+30% Schub in Meeresströmungen, -40% Riffschaden & +8% Wendigkeit.',
    desc_en: '+30% ocean current boost, -40% reef damage & +8% rudder turn.',
    mods: { currentBoost: 0.30, reefDamageReduction: 0.40, turnMult: 0.08 }
  },
  {
    id: 'fh_eagle', icon: '🦅', cost: 480, color: '#f59e0b',
    name_de: 'Bronzener Seeadler', name_en: 'Bronze Sea Eagle',
    desc_de: '+25% Sichtweite, +35% schnellere Fernglas-Analyse & +6% Kanonenreichweite.',
    desc_en: '+25% sight range, +35% faster spyglass scan & +6% gun range.',
    mods: { sightMult: 0.25, spyglassSpeed: 0.35, rangeMult: 0.06 }
  },
  {
    id: 'fh_reaper', icon: '💀', cost: 890, color: '#10b981', enclaveOnly: true,
    name_de: 'Smaragd-Sensenmann (Enklave)', name_en: 'Emerald Reaper (Enclave)',
    desc_de: 'Jagt Feinden blankes Entsetzen ein: Senkt feindliche Moral beim Entern um 18% & +10% Kanonenschaden!',
    desc_en: 'Strikes terror: -18% enemy boarding morale & +10% cannon damage!',
    mods: { damageMult: 0.10, boardingMeleeBonus: 0.14 }
  },
  // === EINZIGARTIGE SCHATZSUCHE-GALIONSFIGUREN ===
  {
    id: 'fh_sungod', icon: '☀️', cost: 960, color: '#fde047', treasureOnly: true,
    name_de: 'Goldener Sonnengott Kinich Ahau', name_en: 'Golden Sun-God Kinich Ahau',
    desc_de: 'Schatz-Relikt! +12% Segeltempo, +30% Strömungsschub, +18% bessere Handelspreise & +0.35 Moral-Erholung!',
    desc_en: 'Treasure Relic! +12% sailing speed, +30% current boost, +18% trade prices & +0.35 morale regen!',
    mods: { speedMult: 0.12, tradeBonus: 0.18, moraleRegen: 0.35 }
  },
  {
    id: 'fh_hydra', icon: '🐙', cost: 980, color: '#a855f7', treasureOnly: true,
    name_de: 'Schwarze Tiefsee-Hydra', name_en: 'Abyssal Black Hydra',
    desc_de: 'Schatz-Relikt! +90 Max. Rumpf-HP, -38% Sturm-/Strudelschaden, -50% Riffschaden & +12% Kanonenschaden!',
    desc_en: 'Treasure Relic! +90 Max Hull HP, -38% storm/whirlpool damage, -50% reef damage & +12% cannon damage!',
    mods: { hullBonus: 90, reefDamageReduction: 0.50, damageMult: 0.12 }
  },
  {
    id: 'fh_crimson_queen', icon: '👑', cost: 940, color: '#fb7185', treasureOnly: true,
    name_de: 'Blutrote Korsaren-Königin', name_en: 'Crimson Corsair Queen',
    desc_de: 'Schatz-Relikt! +20% Enterkampf-Stärke, +10% Nachladetempo & +22% Kaperbeute aus Prisen!',
    desc_en: 'Treasure Relic! +20% boarding melee, +10% reload speed & +22% plunder from prizes!',
    mods: { boardingMeleeBonus: 0.20, reloadMult: 0.10, lootMult: 0.22 }
  }
];

const RATION_LEVELS = {
  half: {
    id: 'half', icon: '🥣',
    name_de: 'Halbe Ration (Schmalhans)', name_en: 'Half Rations (Sparse)',
    foodMult: 0.62, rumMult: 0.62, moraleShift: -7,
    desc_de: '-38% Proviant- & Rumverbrauch auf langen Fahrten, aber die Moral sinkt spürbar (-7/Zyklus).'
  },
  normal: {
    id: 'normal', icon: '🍖',
    name_de: 'Normale Seemannskost', name_en: 'Standard Rations',
    foodMult: 1.0, rumMult: 1.0, moraleShift: 3,
    desc_de: 'Ausgewogener Verbrauch (100%) mit stabiler Moral-Erholung.'
  },
  double: {
    id: 'double', icon: '🍻',
    name_de: 'Festmahl & Extra-Rum', name_en: 'Double Rations & Extra Rum',
    foodMult: 1.48, rumMult: 1.50, moraleShift: 12,
    desc_de: '+50% Verbrauch, treibt die Moral vor schweren Schlachten rasch auf 100% (+12/Zyklus & +8% Ladetempo)!'
  }
};

// ============================================================================
// KAPITÄNS-INVENTAR (Beeinflusst direkt das Stein-Schere-Papier-Fechtduell!)
// ============================================================================
const CAPTAIN_ITEMS = [
  // Slot: blade (Stärkt besonders "Hoher Hieb")
  { id: 'blade_hanger', slot: 'blade', icon: '🗡️', cost: 180, slashBonus: 4, thrustBonus: 1, parryBonus: 1, name_de: 'Schwerer Marine-Enterdegen', name_en: 'Heavy Naval Cutlass', desc_de: '+4 Wucht bei „Hoher Hieb“, +1 Stich & +1 Parade im Kapitänsduell.' },
  { id: 'blade_toledo', slot: 'blade', icon: '⚔️', cost: 460, slashBonus: 3, thrustBonus: 6, parryBonus: 3, name_de: 'Meister-Rapier aus Toledo', name_en: 'Masterwork Toledo Rapier', desc_de: '+6 Präzision bei „Ausfallstich“, +3 Hieb & +3 Parade im Kapitänsduell.' },
  { id: 'blade_damascus', slot: 'blade', icon: '🏴‍☠️', cost: 780, slashBonus: 7, thrustBonus: 5, parryBonus: 4, name_de: 'Damaszener Korsarensäbel', name_en: 'Damascus Corsair Sabre', desc_de: 'Legendäre Klinge: +7 Hieb, +5 Stich & +4 Parade im Duell!' },

  // Slot: pistol (Stärkt "Ausfall & Pistolenschuss" + Duell-Eröffnung)
  { id: 'pistol_flint', slot: 'pistol', icon: '🔫', cost: 210, slashBonus: 0, thrustBonus: 4, parryBonus: 1, openerDmg: 10, name_de: 'Messing-Steinschlosspistole', name_en: 'Brass Flintlock Pistol', desc_de: 'Eröffnet jedes Duell mit -10 Gegner-HP & +4 auf Ausfall-Aktionen.' },
  { id: 'pistol_double', slot: 'pistol', icon: '💥', cost: 590, slashBonus: 2, thrustBonus: 6, parryBonus: 2, openerDmg: 20, name_de: 'Doppelläufige Duellpistole', name_en: 'Double-Barreled Duel Pistol', desc_de: 'Feuert zu Duellbeginn -20 Gegner-HP & gibt +6 auf Ausfall-Manöver!' },

  // Slot: coat (Stärkt "Parade & Konter" + Kapitäns-Ausdauer im Duell)
  { id: 'coat_leather', slot: 'coat', icon: '🧥', cost: 220, slashBonus: 0, thrustBonus: 0, parryBonus: 4, bonusHp: 20, name_de: 'Seeoffiziers-Lederrock', name_en: 'Sea Officer Buff Coat', desc_de: '+20 Kapitäns-Ausdauer & +4 auf „Parade & Finte“ im Duell.' },
  { id: 'coat_cuirass', slot: 'coat', icon: '🛡️', cost: 540, slashBonus: 1, thrustBonus: 0, parryBonus: 7, bonusHp: 45, name_de: 'Ziselierter Offiziers-Halbkürass', name_en: 'Engraved Officer Half-Cuirass', desc_de: '+45 Kapitäns-Ausdauer & +7 auf „Parade & Finte“ im Duell!' },

  // Slot: relic (Spezialboni für Fernglas, Schmuggel & Fechten)
  { id: 'relic_spyglass', slot: 'relic', icon: '🔭', cost: 340, slashBonus: 0, thrustBonus: 1, parryBonus: 1, spyMult: 0.50, name_de: 'Zeiss-Messingfernrohr (1714)', name_en: 'Precision Brass Spyglass', desc_de: '+50% schnellere Fernglas-Identifikation & größere Entdecker-Reichweite!' },
  { id: 'relic_gauntlet', slot: 'relic', icon: '🥊', cost: 390, slashBonus: 2, thrustBonus: 2, parryBonus: 5, name_de: 'Klingenbrecher-Fechthandschuh', name_en: 'Swordbreaker Gauntlet', desc_de: 'Fängt feindliche Klingen ab: +5 Parade, +2 Hieb & +2 Stich im Duell.' },
  { id: 'relic_seal', slot: 'relic', icon: '📜', cost: 480, slashBonus: 0, thrustBonus: 0, parryBonus: 2, sneakBonus: 0.30, name_de: 'Gefälschtes Kron-Siegel', name_en: 'Forged Royal Seal', desc_de: '+30% Erfolgschance beim heimlichen Einschleichen in feindliche Häfen!' },

  // === EINZIGARTIGE SCHATZSUCHE-RELIKTE FÜR DEN KAPITÄN ===
  { id: 'blade_obsidian', slot: 'blade', treasureOnly: true, icon: '🗡️', cost: 1100, slashBonus: 9, thrustBonus: 8, parryBonus: 5, name_de: 'Opferklinge des Gefiederten Gottes', name_en: 'Sacrificial Feathered-Serpent Blade', desc_de: 'Schatz-Relikt! Rasiermesserscharfer Vulkanglas-Säbel: +9 Hieb, +8 Stich & +5 Parade im Kapitänsduell!' },
  { id: 'pistol_duckfoot', slot: 'pistol', treasureOnly: true, icon: '🔫', cost: 1150, slashBonus: 3, thrustBonus: 8, parryBonus: 3, openerDmg: 32, name_de: 'Vierläufige Entenfuß-Salvenpistole', name_en: 'Four-Barreled Duckfoot Volley Pistol', desc_de: 'Schatz-Relikt! Feuert zu Duellbeginn eine verheerende 4-Lauf-Salve (-32 Gegner-HP!) & +8 auf Ausfall-Manöver!' },
  { id: 'coat_conquistador', slot: 'coat', treasureOnly: true, icon: '🛡️', cost: 1180, slashBonus: 3, thrustBonus: 2, parryBonus: 10, bonusHp: 65, name_de: 'Goldtauschierter Konquistadoren-Harnisch', name_en: 'Gold-Inlaid Conquistador Cuirass', desc_de: 'Schatz-Relikt! Meisterrüstung aus Sevilla: +65 Kapitäns-Ausdauer, +10 Parade & +3 Hieb im Duell!' },
  { id: 'relic_eldorado', slot: 'relic', treasureOnly: true, icon: '🧭', cost: 1120, slashBonus: 3, thrustBonus: 3, parryBonus: 4, spyMult: 0.65, sneakBonus: 0.35, name_de: 'Smaragd-Astrolabium von El Dorado', name_en: 'Emerald Astrolabe of El Dorado', desc_de: 'Schatz-Relikt! +65% Fernglas-Tempo, +35% Schmuggel-Schleichchance & +3/+3/+4 auf alle Duell-Manöver!' }
];

window.FIGUREHEAD_DEFS = FIGUREHEAD_DEFS;
window.RATION_LEVELS = RATION_LEVELS;
window.CAPTAIN_ITEMS = CAPTAIN_ITEMS;

window.ensureShipAndCaptainInventory = function() {
  if (!window.player || !window.game) return;
  player.figurehead = player.figurehead || null;
  player.ownedFigureheads = player.ownedFigureheads || [];
  player.ownedSpecialEquipment = player.ownedSpecialEquipment || [];
  if (player.specialEquipment && !player.ownedSpecialEquipment.includes(player.specialEquipment)) {
    player.ownedSpecialEquipment.push(player.specialEquipment);
  }
  player.rationLevel = player.rationLevel || 'normal';
  // crewFocus: -100 = Voller Segel-Fokus | 0 = Ausgewogen | +100 = Voller Geschütz-Fokus
  if (player.crewFocus === undefined) player.crewFocus = 0;
  // hullSpaceShift: -3 (mehr Kojen, weniger Fracht) bis +3 (mehr Fracht, weniger Kojen)
  if (player.hullSpaceShift === undefined) player.hullSpaceShift = 0;

  game.captain.inventory = game.captain.inventory || {
    owned: [],
    equipped: { blade: null, pistol: null, coat: null, relic: null }
  };
  game.discoveries = game.discoveries || { found: {}, turnedIn: {} };
  game.activePassenger = game.activePassenger || null;
  game.baseInvestmentGold = game.baseInvestmentGold || 0;
};

window.getCaptainDuelStats = function() {
  ensureShipAndCaptainInventory();
  const eq = game.captain.inventory.equipped;
  const skills = game.captain.skills || { leadership: 1, gunnery: 1, survival: 1 };
  let maxHp = 100 + skills.survival * 10 + (game.captain.level || 1) * 5;
  let slash = 14 + skills.leadership * 2;
  let thrust = 14 + skills.gunnery * 2;
  let parry = 14 + skills.seamanship * 2;
  let openerDmg = 0;
  let spyBonus = 0;
  let sneakBonus = 0;

  if (hasCaptainPerk('perk_boarding_master')) { slash += 3; thrust += 3; parry += 2; }
  if (hasCaptainPerk('perk_pegleg_stash')) { slash += 2; parry += 2; }
  if (game.captain.isGhostCaptain) { maxHp += 30; slash += 4; thrust += 4; }

  Object.values(eq).forEach(itemId => {
    if (!itemId) return;
    const it = CAPTAIN_ITEMS.find(x => x.id === itemId);
    if (!it) return;
    maxHp += it.bonusHp || 0;
    slash += it.slashBonus || 0;
    thrust += it.thrustBonus || 0;
    parry += it.parryBonus || 0;
    openerDmg += it.openerDmg || 0;
    spyBonus += it.spyMult || 0;
    sneakBonus += it.sneakBonus || 0;
  });

  return { maxHp, slash, thrust, parry, openerDmg, spyBonus, sneakBonus };
};

// Berechnet den Live-Effekt des Crew-Schiebereglers & des Bootsmanns bei dezimierter Mannschaft!
window.getLiveCrewAllocation = function() {
  if (!window.player) return { sailCrewFactor: 1, gunCrewFactor: 1, effMult: 1 };
  ensureShipAndCaptainInventory();
  const mods = getOfficerModifiers();
  const effMult = 1.0 + (mods.crewEfficiency || 0); // Bootsmann +35%, Quartiermeister +15%
  const healthy = getEffectiveHealthyCrew();
  const effectiveHands = healthy * effMult;

  const focus = (player.crewFocus || 0) / 100; // -1.0 (Segel) .. +1.0 (Kanonen)
  const sailWeight = 1.0 - focus * 0.55;       // bis zu 1.55x bei Segel-Fokus
  const gunWeight  = 1.0 + focus * 0.55;       // bis zu 1.55x bei Geschütz-Fokus

  const idealCrewForShip = Math.max(14, (SHIP_CLASSES[player.clsKey] || SHIP_CLASSES.sloop).crew);
  const sailCrewFactor = Math.min(1.12, Math.max(0.28, (effectiveHands * sailWeight) / (idealCrewForShip * 0.72)));
  const gunCrewFactor  = Math.min(1.18, Math.max(0.22, (effectiveHands * gunWeight) / (idealCrewForShip * 0.75)));

  return {
    sailCrewFactor,
    gunCrewFactor,
    effectiveHandsForGuns: Math.round(effectiveHands * gunWeight),
    effMult
  };
};

// ============================================================================
// AKTIONEN IM SCHIFFS- & KAPITÄNS-INVENTAR
// ============================================================================
window.setPlayerRationLevel = function(lvlKey) {
  ensureShipAndCaptainInventory();
  if (!RATION_LEVELS[lvlKey]) return;
  player.rationLevel = lvlKey;
  SoundFX.play('card');
  updateHUD();
  if (document.getElementById('shipInvOverlay').classList.contains('active')) renderShipInventoryModal();
};

window.setLiveCrewFocus = function(val) {
  ensureShipAndCaptainInventory();
  player.crewFocus = Math.max(-100, Math.min(100, parseInt(val, 10) || 0));
  const lbl = document.getElementById('liveCrewFocusValLabel');
  if (lbl) {
    lbl.textContent = player.crewFocus < -15
      ? `⛵ Segel-Fokus (${Math.abs(player.crewFocus)}%)`
      : (player.crewFocus > 15 ? `💣 Geschütz-Fokus (+${player.crewFocus}%)` : '⚖️ Ausgewogen (0%)');
  }
  updateHUD();
};

window.adjustHullSpaceShift = function(delta) {
  ensureShipAndCaptainInventory();
  const inDock = !!(currentPort || (currentBasePlot && game.hideout && game.hideout.foundedPlotId === currentBasePlot.id));
  if (!inDock) {
    logEvent(tr('⚠️ Rumpf-Innenumbau ist nur in einem Hafen oder deiner Kolonie-Basis möglich!', '⚠️ Hull interior conversion requires a port or your Colony Base!', '⚠️ ¡Solo en puerto o base!', '⚠️ Uniquement au port ou dans votre base!'));
    return;
  }
  const next = Math.max(-3, Math.min(3, (player.hullSpaceShift || 0) + delta));
  if (next === player.hullSpaceShift) return;
  if (game.gold < 65) return;
  game.gold -= 65;
  player.hullSpaceShift = next;
  recalcPlayerDerivedStats();
  SoundFX.play('coin');
  updateHUD();
  renderShipInventoryModal();
};

window.buyOrEquipFigurehead = function(fhId) {
  ensureShipAndCaptainInventory();
  const def = FIGUREHEAD_DEFS.find(f => f.id === fhId);
  if (!def) return;
  player.ownedFigureheads = player.ownedFigureheads || [];
  if (!player.ownedFigureheads.includes(fhId)) {
    if (def.treasureOnly) return;
    const inDock = !!(currentPort || window.nearGhostEnclave || (currentBasePlot && game.hideout && game.hideout.foundedPlotId));
    if (!inDock || game.gold < def.cost) return;
    game.gold -= def.cost;
    player.ownedFigureheads.push(fhId);
    SoundFX.play('coin');
  }
  player.figurehead = (player.figurehead === fhId) ? null : fhId;
  recalcPlayerDerivedStats();
  updateHUD();
  renderShipInventoryModal();
};

window.buyOrEquipCaptainItem = function(itemId) {
  ensureShipAndCaptainInventory();
  const item = CAPTAIN_ITEMS.find(x => x.id === itemId);
  if (!item) return;
  const inv = game.captain.inventory;
  if (!inv.owned.includes(itemId)) {
    if (item.treasureOnly) return;
    if (!currentPort && !currentVillage) {
      logEvent(tr('⚠️ Ausrüstung kann nur bei Händlern an Land erworben werden!', '⚠️ Gear can only be purchased ashore!', '⚠️ ¡Solo en tierra!', '⚠️ Uniquement à terre!'));
      return;
    }
    if (game.gold < item.cost) return;
    game.gold -= item.cost;
    inv.owned.push(itemId);
    SoundFX.play('coin');
  }
  inv.equipped[item.slot] = (inv.equipped[item.slot] === itemId) ? null : itemId;
  updateHUD();
  if (document.getElementById('shipInvOverlay').classList.contains('active')) renderShipInventoryModal();
  if (document.getElementById('portOverlay').classList.contains('active')) renderPortModal();
};

// ============================================================================
// PASSAGIER-KABINEN & ENTDECKER-GILDE + KOLONIE-INVESTITIONEN
// ============================================================================
window.generatePortPassengerOffer = function(port) {
  const others = PORTS.filter(p => p.id !== port.id);
  const dest = others[Math.floor(Math.random() * others.length)];
  const isFemale = Math.random() < 0.42;
  const gender = isFemale ? 'f' : 'm';
  const fn = (isFemale ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE)[Math.floor(Math.random() * 14)];
  const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const dist = Math.hypot(dest.x - port.x, dest.y - port.y);
  const fare = Math.round(165 + dist * 0.032);
  const portraitId = isFemale ? `piratinnen:${(PORTS.indexOf(port) + 2) % 16}` : `kolonial:${(PORTS.indexOf(port) + 3) % 16}`;

  port.passengerOffer = {
    name: `${isFemale ? 'Señora' : 'Don'} ${fn} ${ln}`,
    gender,
    portraitId,
    destPortId: dest.id,
    destPortName: dest.name,
    baseFare: fare,
    bonusIntact: Math.round(fare * 0.35),
    startHullRatio: 1.0
  };
};

window.acceptPassengerInTavern = function() {
  if (!currentPort || !currentPort.passengerOffer || game.activePassenger) return;
  const pOff = currentPort.passengerOffer;
  pOff.tookDamage = false;
  game.activePassenger = pOff;
  currentPort.passengerOffer = null;
  SoundFX.play('coin');
  logEvent(tr(
    `🎩 Passagier ${pOff.name} an Bord genommen! Reiseziel: ${pOff.destPortName} (+${pOff.baseFare} 🪙, Bonus ohne Gefechtsschaden: +${pOff.bonusIntact} 🪙).`,
    `🎩 Passenger ${pOff.name} boarded for ${pOff.destPortName} (+${pOff.baseFare} 🪙, safe-voyage bonus: +${pOff.bonusIntact} 🪙)!`,
    `🎩 Pasajero ${pOff.name} a bordo rumbo a ${pOff.destPortName}.`,
    `🎩 Passager ${pOff.name} à bord vers ${pOff.destPortName}.`
  ));
  updateHUD();
  renderPortModal();
};

window.checkCompletePassengerArrival = function(port) {
  if (!game.activePassenger || game.activePassenger.destPortId !== port.id) return;
  const ps = game.activePassenger;
  const bonus = ps.tookDamage ? 0 : ps.bonusIntact;
  const total = ps.baseFare + bonus;
  game.gold += total;
  changePlayerReputation(4);
  SoundFX.play('coin');
  grantCaptainXP(40, `🎩 ${ps.name} sicher in ${port.name} abgesetzt (+${total} 🪙)!`);
  game.activePassenger = null;
};

window.turnInAllDiscoveriesAtGuild = function() {
  ensureShipAndCaptainInventory();
  let totalGold = 0;
  let count = 0;
  DISCOVERY_WONDERS.forEach(dw => {
    if (game.discoveries.found[dw.id] && !game.discoveries.turnedIn[dw.id]) {
      game.discoveries.turnedIn[dw.id] = true;
      totalGold += dw.reward;
      count++;
    }
  });

  // Zusätzlich Kartographie-Prämie pro 25% aufgedecktem Nebel des Krieges!
  let revealed = 0;
  for (let i = 0; i < fowGrid.length; i++) if (fowGrid[i] > 0) revealed++;
  const pct = Math.floor((revealed / fowGrid.length) * 100);
  const milestone = Math.floor(pct / 25); // 1..4
  const prevMilestone = game.discoveries.mapMilestoneClaimed || 0;
  if (milestone > prevMilestone) {
    const mapReward = (milestone - prevMilestone) * 320;
    totalGold += mapReward;
    game.discoveries.mapMilestoneClaimed = milestone;
  }

  if (totalGold <= 0) return;
  game.gold += totalGold;
  changePlayerReputation(count * 3 + 2);
  SoundFX.play('coin');
  grantCaptainXP(count * 35 + 20, `🧭 Entdecker-Gilde zahlt +${totalGold} 🪙 Prämie für deine Berichte & Seekarten!`);
  updateHUD();
  if (document.getElementById('portOverlay').classList.contains('active')) renderPortModal();
  if (document.getElementById('shipInvOverlay').classList.contains('active')) renderShipInventoryModal();
};

window.investInOwnColonyOrPort = function(amount) {
  ensureShipAndCaptainInventory();
  if (game.gold < amount) return;
  game.gold -= amount;
  game.baseInvestmentGold = (game.baseInvestmentGold || 0) + amount;
  SoundFX.play('coin');
  logEvent(`🏛️ +${amount} 🪙 in Infrastruktur investiert (Gesamt: ${game.baseInvestmentGold} 🪙 ➔ +${getColonyInvestmentBonusPoints()} max. Baupunkte & +${Math.round(getColonyInvestmentYieldBonus()*100)}% Ertrag)!`);
  updateHUD();
  if (document.getElementById('hideoutOverlay').classList.contains('active')) renderHideoutModal();
};

window.getColonyInvestmentBonusPoints = function() {
  const inv = (window.game && game.baseInvestmentGold) || 0;
  return Math.min(10, Math.floor(inv / 600) * 2); // bis zu +10 zusätzliche Baupunkte (18 -> 28)!
};

window.getColonyInvestmentYieldBonus = function() {
  const inv = (window.game && game.baseInvestmentGold) || 0;
  return Math.min(0.60, (inv / 1000) * 0.12); // bis zu +60% Produktionsausstoß!
};

// ============================================================================
// MODAL-RENDERING: SCHIFFS- & KAPITÄNS-INVENTAR [Taste I]
// ============================================================================
let currentShipInvTab = 'ship';

window.equipOwnedSpecialEquipment = function(eqId) {
  ensureShipAndCaptainInventory();
  const inDock = !!(currentPort || window.nearGhostEnclave || (currentBasePlot && game.hideout && game.hideout.foundedPlotId));
  if (!inDock) {
    logEvent('⚠️ Schiffs-Spezialausrüstung [R] kann nur im Dock (Hafen, Kolonie-Basis oder Enklave) umgerüstet werden!');
    return;
  }
  if (!player.ownedSpecialEquipment.includes(eqId)) return;
  player.specialEquipment = (player.specialEquipment === eqId) ? null : eqId;
  player.specialEquipCooldown = 0;
  recalcPlayerDerivedStats();
  SoundFX.play('sword');
  updateHUD();
  renderShipInventoryModal();
};

window.toggleShipInventoryModal = function() {
  if (!window.game || !window.player) return;
  const ov = document.getElementById('shipInvOverlay');
  if (!ov) return;
  const willOpen = !ov.classList.contains('active');
  ov.classList.toggle('active', willOpen);
  if (willOpen) {
    syncSingleplayerPauseState();
    renderShipInventoryModal();
  } else {
    syncSingleplayerPauseState();
  }
};

window.switchShipInvTab = function(tab) {
  currentShipInvTab = tab;
  renderShipInventoryModal();
};

window.renderShipInventoryModal = function() {
  ensureShipAndCaptainInventory();
  const body = document.getElementById('shipInvBody');
  if (!body) return;
  if (window.applySceneBackgroundToModal) {
    const scKey = currentShipInvTab === 'captain' ? 'armory_foundry' : (currentShipInvTab === 'guild' ? 'gov_merchant' : 'shipyard_stone');
    applySceneBackgroundToModal('shipInvOverlay', scKey);
  }

  const inDock = !!(currentPort || (currentBasePlot && game.hideout && game.hideout.foundedPlotId === currentBasePlot.id));
  const alloc = getLiveCrewAllocation();
  const duelStats = getCaptainDuelStats();
  const inv = game.captain.inventory;
  const ownedFh = player.ownedFigureheads || [];

  let tabHtml = '';
  if (currentShipInvTab === 'ship') {
    const shift = player.hullSpaceShift || 0;
    const focusLbl = player.crewFocus < -15
      ? `⛵ Segel-Fokus (${Math.abs(player.crewFocus)}%)`
      : (player.crewFocus > 15 ? `💣 Geschütz-Fokus (+${player.crewFocus}%)` : '⚖️ Ausgewogen (0%)');

    tabHtml = `
      <!-- LIVE-CREW-AUFGABENREGLER AUF HOHER SEE -->
      <div class="card-box" style="margin-bottom:12px; background:#09131d; border-color:#38bdf8;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div class="card-title">🎚️ Live-Aufgabenverteilung der Crew (Jederzeit auf See änderbar!)</div>
          <span id="liveCrewFocusValLabel" style="color:#fde047; font-weight:bold; font-size:13px;">${focusLbl}</span>
        </div>
        <div class="card-desc">
          Verteile deine kampffähigen Matrosen (${getEffectiveHealthyCrew()} Mann × ${(alloc.effMult).toFixed(2)} Effektivität) bei Verlusten gezielt zwischen Takelage und Batteriedeck:
        </div>
        <div style="display:flex; align-items:center; gap:12px; margin:6px 0;">
          <span style="font-size:12px; color:#38bdf8; font-weight:bold;">⛵ Segel &amp; Ruder</span>
          <input type="range" min="-100" max="100" step="10" value="${player.crewFocus || 0}" oninput="setLiveCrewFocus(this.value)" style="flex:1; accent-color:#ffd700; cursor:pointer;">
          <span style="font-size:12px; color:#ef4444; font-weight:bold;">💣 Geschütze</span>
        </div>
      </div>

      <!-- RATIONSSTUFEN & RUMPF-INNENUMBAU -->
      <div class="grid-2" style="margin-bottom:12px;">
        <div class="card-box">
          <div class="card-title">🍖🍾 Rationsstufen auf See (Moral-Steuerung)</div>
          <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
            ${Object.values(RATION_LEVELS).map(rl => {
              const act = player.rationLevel === rl.id;
              return `
                <button class="action-btn" style="background:${act ? '#2c2112' : '#0f172a'}; border-color:${act ? '#ffd700' : '#475569'}; text-align:left;" onclick="setPlayerRationLevel('${rl.id}')">
                  <span>${rl.icon} <strong>${tr(rl.name_de, rl.name_en)}</strong><br><small style="color:#94a3b8; font-weight:normal;">${rl.desc_de}</small></span>
                  <span>${act ? '✓' : ''}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <div class="card-box">
          <div class="card-title">🔨 Rumpf-Innenaufteilung (Frachtraum ↔ Kojen)</div>
          <div class="card-desc">
            Aktueller Umbau: <strong>${shift > 0 ? `+${shift * 12} 📦 / ${shift * -8} 👥` : (shift < 0 ? `${shift * 12} 📦 / +${Math.abs(shift) * 8} 👥` : 'Standard (0)')}</strong><br>
            ${inDock ? '<span style="color:#2ecc71;">✓ Im Hafen/Basis: Umbau für 65 🪙 pro Stufe verfügbar!</span>' : '<span style="color:#f59e0b;">🔒 Lege in einem Hafen oder deiner Basis an, um Wände umzubauen.</span>'}
          </div>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <button class="action-btn" style="flex:1;" ${!inDock || shift <= -3 || game.gold < 65 ? 'disabled' : ''} onclick="adjustHullSpaceShift(-1)">
              <span>👥 Mehr Kojen (+8 Crew / -12 📦)</span><span>65 🪙</span>
            </button>
            <button class="action-btn" style="flex:1;" ${!inDock || shift >= 3 || game.gold < 65 ? 'disabled' : ''} onclick="adjustHullSpaceShift(1)">
              <span>📦 Mehr Fracht (+12 📦 / -8 Crew)</span><span>65 🪙</span>
            </button>
          </div>
        </div>
      </div>

      <!-- SPEZIAL-SCHIFFSAUSRÜSTUNG [Taste R] (Inkl. geborgener Schatz-Relikte!) -->
      <h3 style="color:#38bdf8; font-size:14px; margin-bottom:8px;">⚙️ Freigeschaltete Schiffs-Spezialausrüstung [Taste R]</h3>
      <div class="grid-2" style="margin-bottom:14px;">
        ${(typeof SPECIAL_SHIP_EQUIPMENT !== 'undefined' ? SPECIAL_SHIP_EQUIPMENT : []).filter(eq => (player.ownedSpecialEquipment || []).includes(eq.id) || eq.treasureOnly).map(eq => {
          const owned = (player.ownedSpecialEquipment || []).includes(eq.id);
          const isEq = player.specialEquipment === eq.id;
          return `
            <div class="card-box" style="border-color:${isEq ? '#2ecc71' : (owned ? '#38bdf8' : '#334155')}; opacity:${owned ? '1' : '0.68'};">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                  <div class="card-title">${td(eq, 'name')}</div>
                  ${eq.treasureOnly ? '<span class="relic-badge">SCHATZ-RELIKT</span>' : ''}
                </div>
                <div class="card-desc">${td(eq, 'desc')}</div>
              </div>
              <button class="action-btn" ${!owned || !inDock ? 'disabled' : ''} onclick="equipOwnedSpecialEquipment('${eq.id}')">
                <span>${isEq ? '✓ Aktiv montiert (Im Dock ausbauen)' : (owned ? (inDock ? 'Jetzt in Slot [R] einbauen' : '🔒 Umbau nur im Dock') : '🗺️ Nur bei Schatzsuchen zu finden!')}</span>
                <span>${owned ? 'Besitz' : ''}</span>
              </button>
            </div>
          `;
        }).join('')}
      </div>

      <!-- GALIONSFIGUREN -->
      <h3 style="color:#ffd700; font-size:14px; margin-bottom:8px;">🔱 Galionsfigur am Bugspriet</h3>
      <div class="grid-2">
        ${FIGUREHEAD_DEFS.filter(f => !f.enclaveOnly || game.worldMode === 'mythology' || ownedFh.includes(f.id)).map(fh => {
          const owned = ownedFh.includes(fh.id);
          const equipped = player.figurehead === fh.id;
          const canBuy = owned || (!fh.treasureOnly && inDock && (!fh.enclaveOnly || window.nearGhostEnclave) && game.gold >= fh.cost);
          return `
            <div class="card-box" style="border-color:${equipped ? '#2ecc71' : (fh.treasureOnly && owned ? '#ffd700' : '#5a4628')}; opacity:${(!owned && fh.treasureOnly) ? '0.68' : '1'};">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                  <div class="card-title">${fh.icon} ${tr(fh.name_de, fh.name_en)}</div>
                  ${fh.treasureOnly ? '<span class="relic-badge">SCHATZ-RELIKT</span>' : ''}
                </div>
                <div class="card-desc">${tr(fh.desc_de, fh.desc_en)}</div>
              </div>
              <button class="action-btn" ${!canBuy ? 'disabled' : ''} onclick="buyOrEquipFigurehead('${fh.id}')">
                <span>${equipped ? '✓ Montiert (Abnehmen)' : (owned ? 'Am Bug montieren' : (fh.treasureOnly ? '🗺️ Nur bei Schatzsuchen zu finden!' : (inDock ? 'Schnitzen & Montieren' : '🔒 Nur im Dock')))}</span>
                <span>${owned || fh.treasureOnly ? '' : fh.cost + ' 🪙'}</span>
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else if (currentShipInvTab === 'captain') {
    const canShop = !!(currentPort || currentVillage);
    tabHtml = `
      <div class="card-box" style="margin-bottom:12px; background:#09131d; border-color:#ffd700;">
        <div style="display:flex; gap:14px; align-items:center;">
          ${renderPortraitBox(game.captain.svg, 76, '#ffd700', game.captain.isGhostCaptain)}
          <div>
            <div class="card-title" style="font-size:15px;">🤺 Deine Kampfwerte im 1-gegen-1-Kapitänsduell</div>
            <div class="card-desc" style="color:#e2e8f0; font-size:12.5px; margin:4px 0 0;">
              ❤️ Ausdauer: <strong>${duelStats.maxHp} HP</strong> &nbsp;|&nbsp;
              🗡️ Hoher Hieb: <strong style="color:#fb923c;">${duelStats.slash}</strong> &nbsp;|&nbsp;
              🤺 Ausfallstich: <strong style="color:#38bdf8;">${duelStats.thrust}</strong> &nbsp;|&nbsp;
              🛡️ Parade &amp; Finte: <strong style="color:#2ecc71;">${duelStats.parry}</strong>
              ${duelStats.openerDmg > 0 ? ` &nbsp;|&nbsp; 🔫 Eröffnungsschuss: <strong style="color:#fde047;">-${duelStats.openerDmg} HP</strong>` : ''}
            </div>
          </div>
        </div>
      </div>

      <div class="grid-2">
        ${CAPTAIN_ITEMS.map(it => {
          const owned = inv.owned.includes(it.id);
          const isEq = inv.equipped[it.slot] === it.id;
          return `
            <div class="card-box" style="border-color:${isEq ? '#2ecc71' : (owned ? '#d4af37' : '#475569')}; opacity:${(!owned && it.treasureOnly) ? '0.68' : '1'};">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; gap:4px;">
                  <div class="card-title">${it.icon} ${tr(it.name_de, it.name_en)}</div>
                  <div>${it.treasureOnly ? '<span class="relic-badge">RELIKT</span> ' : ''}<span class="badge badge-norm">${it.slot.toUpperCase()}</span></div>
                </div>
                <div class="card-desc">${it.desc_de}</div>
              </div>
              <button class="action-btn" ${!owned && (it.treasureOnly || !canShop || game.gold < it.cost) ? 'disabled' : ''} onclick="buyOrEquipCaptainItem('${it.id}')">
                <span>${isEq ? '✓ Angelegt (Ablegen)' : (owned ? 'Anlegen' : (it.treasureOnly ? '🗺️ Nur bei Schatzsuchen zu finden!' : (canShop ? 'Erwerben & Anlegen' : '🔒 Nur bei Händlern an Land')))}</span>
                <span>${owned || it.treasureOnly ? '' : it.cost + ' 🪙'}</span>
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    let revealed = 0;
    for (let i = 0; i < fowGrid.length; i++) if (fowGrid[i] > 0) revealed++;
    const mapPct = Math.round((revealed / fowGrid.length) * 100);
    const foundCount = Object.keys(game.discoveries.found || {}).length;
    const unredeemed = DISCOVERY_WONDERS.filter(dw => game.discoveries.found[dw.id] && !game.discoveries.turnedIn[dw.id]);

    tabHtml = `
      <div class="card-box" style="margin-bottom:12px; background:#09131d; border-color:#2ecc71;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; gap:12px; align-items:center;">
            ${renderPortraitBox(SPECIAL_PORTRAITS.scholar_guild, 68, '#2ecc71', false)}
            <div>
              <div class="card-title">🧭 Königliche Entdecker- &amp; Kartographen-Gilde</div>
              <div class="card-desc" style="margin:3px 0 0; color:#cbd5e1;">
                Kartierte Karibik: <strong>${mapPct}%</strong> &nbsp;|&nbsp;
                Entdeckte Naturwunder &amp; Ruinen (per Fernglas [Z]): <strong>${foundCount} / ${DISCOVERY_WONDERS.length}</strong>
              </div>
            </div>
          </div>
          <button class="primary-btn" ${!currentPort || (unredeemed.length === 0 && Math.floor(mapPct / 25) <= (game.discoveries.mapMilestoneClaimed || 0)) ? 'disabled' : ''} onclick="turnInAllDiscoveriesAtGuild()">
            📜 ${currentPort ? 'Berichte & Karten einreichen' : 'Im Hafen einreichbar'}
          </button>
        </div>
      </div>

      <div class="grid-2">
        ${DISCOVERY_WONDERS.map(dw => {
          const isFound = !!game.discoveries.found[dw.id];
          const isPaid = !!game.discoveries.turnedIn[dw.id];
          return `
            <div class="card-box" style="border-color:${isFound ? '#2ecc71' : '#334155'}; opacity:${isFound ? '1' : '0.68'};">
              <div class="card-title">${isFound ? dw.icon : '❓'} ${isFound ? tr(dw.name_de, dw.name_en) : 'Unentdecktes Naturwunder der Karibik'}</div>
              <div class="card-desc">
                ${isFound ? (isPaid ? '✅ Bereits bei der Gilde eingereicht' : `✨ Entdeckt! Wert bei Abgabe im Hafen: ${dw.reward} 🪙`) : 'Suche Küsten und Inseln mit dem Fernglas [Z] ab!'}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  body.innerHTML = `
    <div class="tabs-bar">
      <button class="tab-btn ${currentShipInvTab === 'ship' ? 'active' : ''}" onclick="switchShipInvTab('ship')">🚢 Schiffsinventar, Rationen &amp; Crew-Regler</button>
      <button class="tab-btn ${currentShipInvTab === 'captain' ? 'active' : ''}" onclick="switchShipInvTab('captain')">🤺 Kapitäns-Inventar (Fechtduell)</button>
      <button class="tab-btn ${currentShipInvTab === 'guild' ? 'active' : ''}" onclick="switchShipInvTab('guild')">🧭 Entdecker-Gilde (${Object.keys(game.discoveries.found || {}).length}/${DISCOVERY_WONDERS.length})</button>
    </div>
    ${tabHtml}
  `;
};