// ============================================================================
// data.js - 1714 - Blood and Doubloons
//           Geschlechtergetrennte Namen, Bootsmann, gesenkte Heuer/Upkeep,
//           entschleunigte Seegefechte (höhere Nachladezeit & ruhigere Ruder),
//           Meeresströmungen, Entdecker-Gilde-Ziele & kompakte Deathmatch-Map
// ============================================================================

const WORLD_W = 24000;
const WORLD_H = 24000;

// Kompakte Deathmatch-Arena-Welt (viele kleine Inseln & Untiefen auf engem Raum!)
const DM_WORLD_W = 4800;
const DM_WORLD_H = 4800;

const FOW_COLS = 160;
const FOW_ROWS = 160;
const FOW_CELL = 150;
let fowGrid = new Uint8Array(FOW_COLS * FOW_ROWS);

// Gesenkte laufende Heuer (vorher 0.55 -> jetzt 0.28 pro Mann/Tag) & längere Spieltage!
const CREW_DAILY_WAGE = 0.28;
const TICKS_PER_GAME_DAY = 24000; // Vorher 7200 -> Spieluhr läuft mehr als 3x ruhiger!

const WHIRLPOOL_CONFIG = {
  maxCount: 3,
  spawnIntervalTicks: 2400,
  spawnChance: 0.30,
  minRadius: 190,
  maxRadius: 270,
  lifeMin: 4000,
  lifeMax: 6800,
  pullStrength: 0.88,
  spinRate: 0.036,
  coreDamage: 10
};

// ============================================================================
// HISTORISCHE MEERESSTRÖMUNGEN (Karibikstrom, Yukatanstrom & Golfstrom)
// ============================================================================
const OCEAN_CURRENTS = [
  { id: 'cur_antilles_south', name_de: 'Südlicher Antillenstrom', name_en: 'South Antilles Current', x1: 21500, y1: 18500, x2: 14500, y2: 16200, width: 1350, speed: 0.52 },
  { id: 'cur_caribbean_main', name_de: 'Karibischer Hauptstrom', name_en: 'Caribbean Main Current', x1: 14500, y1: 16200, x2: 6500, y2: 13200, width: 1500, speed: 0.56 },
  { id: 'cur_yucatan', name_de: 'Yukatan-Strömung', name_en: 'Yucatán Current', x1: 6500, y1: 13200, x2: 4900, y2: 6800, width: 1300, speed: 0.62 },
  { id: 'cur_florida_gulf', name_de: 'Golfstrom (Floridastraße)', name_en: 'Gulf Stream (Florida Strait)', x1: 5200, y1: 6200, x2: 10400, y2: 2600, width: 1250, speed: 0.72 },
  { id: 'cur_bahamas_drift', name_de: 'Bahamas-Passatstrom', name_en: 'Bahamas Trade Drift', x1: 18800, y1: 6800, x2: 12600, y2: 4400, width: 1200, speed: 0.46 }
];

// ============================================================================
// ENTDECKER-GILDE: 14 UNMARKIERTE NATURWUNDER, RUINEN & KREATUREN (Fernglas [Z])
// ============================================================================
const DISCOVERY_WONDERS = [
  { id: 'disc_flamingos', x: 15450, y: 5220, icon: '🦩', reward: 280, name_de: 'Rote Flamingo-Kolonie von Inagua', name_en: 'Scarlet Flamingo Colony of Inagua' },
  { id: 'disc_blue_hole', x: 11850, y: 3980, icon: '🕳️', reward: 340, name_de: 'Tiefblaues Unterwasser-Loch (Blue Hole)', name_en: 'Abyssal Sapphire Blue Hole' },
  { id: 'disc_pelée_volcano', x: 21450, y: 13120, icon: '🌋', reward: 390, name_de: 'Rauchender Krater der Montagne Pelée', name_en: 'Smoking Crater of Mount Pelée' },
  { id: 'disc_tulum_cliffs', x: 2920, y: 11450, icon: '🏛️', reward: 420, name_de: 'Klippen-Wachtempel der alten Maya', name_en: 'Ancient Maya Cliffside Watchtemple' },
  { id: 'disc_manatee_bay', x: 7150, y: 3920, icon: '🦭', reward: 290, name_de: 'Seekuh-Herde in den Mangroven Floridas', name_en: 'Manatee Pod in Florida Mangroves' },
  { id: 'disc_biolum_lagoon', x: 18850, y: 9420, icon: '✨', reward: 380, name_de: 'Nachtleuchtende Lagune von Puerto Rico', name_en: 'Bioluminescent Lagoon of Puerto Rico' },
  { id: 'disc_giant_turtles', x: 7650, y: 10080, icon: '🐢', reward: 270, name_de: 'Riesenschildkröten-Bank von Cayman', name_en: 'Giant Sea Turtle Rookery of Cayman' },
  { id: 'disc_guadeloupe_falls', x: 21650, y: 12350, icon: '🌊', reward: 330, name_de: 'Donnernde Carbet-Dschungelfälle', name_en: 'Thundering Carbet Jungle Falls' },
  { id: 'disc_whale_breach', x: 17050, y: 7850, icon: '🐋', reward: 360, name_de: 'Buckelwal-Bucht vor Samaná', name_en: 'Humpback Whale Grounds of Samaná' },
  { id: 'disc_salt_pyramids', x: 14680, y: 18850, icon: '💎', reward: 310, name_de: 'Glitzernde Salzpfannen von Bonaire', name_en: 'Glistening Salt Pans of Bonaire' },
  { id: 'disc_spanish_hulk', x: 9850, y: 6180, icon: '⚓', reward: 350, name_de: 'Versteinertes Galeonen-Gerippe (1628)', name_en: 'Petrified 1628 Treasure Galleon Ribs' },
  { id: 'disc_emerald_arch', x: 18250, y: 12450, icon: '🪨', reward: 320, name_de: 'Granit-Felsenlabyrinth von Virgin Gorda', name_en: 'Granite Boulder Labyrinth of Virgin Gorda' },
  { id: 'disc_scarlet_macaws', x: 4350, y: 17200, icon: '🦜', reward: 340, name_de: 'Scharlach-Ara-Klippen der Moskitoküste', name_en: 'Scarlet Macaw Cliffs of Mosquito Coast' },
  { id: 'disc_catatumbo', x: 13650, y: 20150, icon: '⚡', reward: 450, name_de: 'Ewiges Wetterleuchten von Maracaibo', name_en: 'Eternal Catatumbo Lightning of Maracaibo' }
];

const RANK_TITLES = [
  { idx: 0, name: 'Unbekannter', minPts: 0, discount: 0 },
  { idx: 1, name: 'Kaperfahrer', minPts: 30, discount: 0.05 },
  { idx: 2, name: 'Leutnant zur See', minPts: 75, discount: 0.10 },
  { idx: 3, name: 'Fregattenkapitän', minPts: 135, discount: 0.16 },
  { idx: 4, name: 'Kommodore', minPts: 210, discount: 0.22 },
  { idx: 5, name: 'Admiral der Krone', minPts: 310, discount: 0.28 }
];

const FACTIONS = {
  england: {
    id: 'england', name: 'Königreich Großbritannien', short: 'Großbritannien',
    color: '#e74c3c', sailColor: '#f5f6fa', hullColor: '#7b241c',
    territoryCenter: { x: 17200, y: 12400, r: 6000 },
    desc: 'Disziplinierte Royal Navy nach dem Act of Union (1707), stark um Jamaika, Antigua und Barbados.',
    perkDesc: 'Vorteil: +10% Kanonenschaden & -12% Werftkosten in britischen Häfen. Nachteil: -10% Frachtraum & feindlich gegenüber Spanien/Piraten.',
    mods: { damageMult: 0.10, cargoBonus: -10 },
    shipMods: { dmgMult: 1.12, reloadMult: 0.94, cargoMult: 0.86, speedMult: 0.96, crewMult: 1.0 },
    relations: { spain: -65, france: -50, netherlands: 20, denmark: 10, pirates: -90 }
  },
  spain: {
    id: 'spain', name: 'Spanisches Weltreich', short: 'Spanien',
    color: '#f1c40f', sailColor: '#f7dc6f', hullColor: '#7d6608',
    territoryCenter: { x: 7600, y: 13200, r: 8000 },
    desc: 'Beherrscht das Festland, Kuba und die Silberflotten von 1714 mit riesigen Laderäumen.',
    perkDesc: 'Vorteil: +20% Frachtraum & +8% Verkaufspreise für Silber/Handelswaren. Nachteil: -6% Segelgeschwindigkeit.',
    mods: { cargoBonus: 20, tradeBonus: 0.08, speedMult: -0.06 },
    shipMods: { cargoMult: 1.30, hullMult: 1.12, speedMult: 0.90, turnMult: 0.90, dmgMult: 0.96, crewMult: 1.0 },
    relations: { england: -65, france: 15, netherlands: -55, denmark: -15, pirates: -95 }
  },
  france: {
    id: 'france', name: 'Königreich Frankreich', short: 'Frankreich',
    color: '#3498db', sailColor: '#85c1e9', hullColor: '#1b4f72',
    territoryCenter: { x: 16800, y: 8400, r: 5200 },
    desc: 'Schnelle, wendige Korvetten und Fregatten um Saint-Domingue, Guadeloupe und Martinique.',
    perkDesc: 'Vorteil: +9% Segelgeschwindigkeit & +8% Ruder-Wendigkeit. Nachteil: -16 Max. Rumpf-HP.',
    mods: { speedMult: 0.09, turnMult: 0.08, hullBonus: -16 },
    shipMods: { speedMult: 1.12, turnMult: 1.10, hullMult: 0.92, cargoMult: 0.95, dmgMult: 1.0, crewMult: 0.95 },
    relations: { england: -50, spain: 15, netherlands: -45, denmark: 0, pirates: -75 }
  },
  netherlands: {
    id: 'netherlands', name: 'Republik der Niederlande (WIC)', short: 'Niederlande',
    color: '#f97316', sailColor: '#ffedd5', hullColor: '#9a3412',
    territoryCenter: { x: 13500, y: 15800, r: 4400 },
    desc: 'Reiche Kaufleute der Westindien-Kompanie auf Curaçao, Nieuw Middelburg und dem Oranjestad-Atoll mit bauchigen Fleuten.',
    perkDesc: 'Vorteil: +14% bessere Handelspreise, +15 Frachtraum & -15% Werft-Upgradekosten. Nachteil: -6% Enterkampf-Stärke.',
    mods: { tradeBonus: 0.14, cargoBonus: 15, shipyardDiscount: 0.15, boardingMeleeBonus: -0.06 },
    shipMods: { cargoMult: 1.26, speedMult: 1.03, turnMult: 1.02, hullMult: 0.98, dmgMult: 0.98, crewMult: 0.92 },
    relations: { england: 20, spain: -55, france: -45, denmark: 25, pirates: -65 }
  },
  denmark: {
    id: 'denmark', name: 'Dänemark-Norwegen', short: 'Dänemark',
    color: '#fb7185', sailColor: '#ffe4e6', hullColor: '#881337',
    territoryCenter: { x: 17100, y: 14600, r: 3900 },
    desc: 'Wehrhafte Freihäfen der Dänisch-Westindischen Kompanie um Charlotte Amalie und Christiansværn aus schwerer nordischer Eiche.',
    perkDesc: 'Vorteil: +55 Max. Rumpf-HP, +8% Nachladetempo & neutraler Handelszugang. Nachteil: -5% Höchstgeschwindigkeit.',
    mods: { hullBonus: 55, reloadMult: 0.08, speedMult: -0.05 },
    shipMods: { hullMult: 1.18, dmgMult: 1.06, reloadMult: 0.95, speedMult: 0.95, cargoMult: 1.05, crewMult: 1.0 },
    relations: { england: 10, spain: -15, france: 0, netherlands: 25, pirates: -60 }
  },
  pirates: {
    id: 'pirates', name: 'Republik der Piraten (Flying Gang)', short: 'Piraten',
    color: '#2ecc71', sailColor: '#2c3e50', hullColor: '#17202a',
    territoryCenter: { x: 12400, y: 4400, r: 4800 },
    desc: 'Freibeuter von 1714 unter Hornigold, Vane & Bonny in Nassau und Tortuga. Riesige Entermannschaften!',
    perkDesc: 'Vorteil: +14% Enterkampf-Stärke, +12 Max. Crew & +14% Kaperbeute. Nachteil: -10% Kolonial-Handelspreise.',
    mods: { boardingMeleeBonus: 0.14, crewCapBonus: 12, lootMult: 0.14, tradeBonus: -0.10 },
    shipMods: { crewMult: 1.24, speedMult: 1.04, hullMult: 0.93, cargoMult: 0.88, dmgMult: 0.95 },
    relations: { england: -90, spain: -95, france: -75, netherlands: -65, denmark: -60 }
  }
};

const CANNON_TYPES = [
  { id: 'cannon_6pdr', name: '6-Pfünder Eisenkanone', shortName: '6-Pfünder', basePrice: 58, pirateMultiplier: 1.55, damage: 11, reloadMult: 0.94, rangeMult: 0.95, ghostFireChance: 0, isGhostCannon: false, reqRankIdx: 0, reqAllegiance: false, icon: '💣', desc: 'Leichtes Standard-Eisengeschütz. Frei erwerbbar in jedem Hafen mit Gießerei-Vorrat.' },
  { id: 'cannon_12pdr', name: '12-Pfünder Feldschlange', shortName: '12-Pfünder', basePrice: 125, pirateMultiplier: 1.65, damage: 17, reloadMult: 1.02, rangeMult: 1.05, ghostFireChance: 0, isGhostCannon: false, reqRankIdx: 1, reqAllegiance: true, icon: '💣', desc: 'Solide Marine-Kanone. Erfordert Beitritt zur Hafen-Fraktion UND Rang "Kaperfahrer".' },
  { id: 'cannon_18pdr', name: '18-Pfünder Bronzekanone', shortName: '18-Pfünder', basePrice: 225, pirateMultiplier: 1.75, damage: 25, reloadMult: 1.12, rangeMult: 1.12, ghostFireChance: 0, isGhostCannon: false, reqRankIdx: 2, reqAllegiance: true, icon: '🔥', desc: 'Schweres Bronzegeschütz für Fregatten. Erfordert Beitritt zur Hafen-Fraktion UND Rang "Leutnant zur See".' },
  { id: 'cannon_32pdr', name: '32-Pfünder Königskartaune', shortName: '32-Pfünder', basePrice: 390, pirateMultiplier: 1.90, damage: 36, reloadMult: 1.24, rangeMult: 1.22, ghostFireChance: 0, isGhostCannon: false, reqRankIdx: 3, reqAllegiance: true, icon: '💥', desc: 'Schwerste Festungs- & Linienschiff-Artillerie! Erfordert Beitritt zur Hafen-Fraktion UND Rang "Fregattenkapitän".' },
  { id: 'cannon_ghost_18', name: 'Geisterkanone: 18-Pfünder Seelenheuler', shortName: '18Pf-Geist', basePrice: 540, pirateMultiplier: 1.0, damage: 31, reloadMult: 1.0, rangeMult: 1.18, ghostFireChance: 0.26, isGhostCannon: true, enclaveOnly: true, reqRankIdx: 0, reqAllegiance: false, icon: '🟢', desc: 'Nur in der Geister-Enklave! Verschießt grün schimmernde Geisterkugeln mit 26% Chance auf Grünes Geisterfeuer!' },
  { id: 'cannon_ghost_36', name: 'Geisterkanone: 36-Pfünder Abyss-Schlund', shortName: '36Pf-Geist', basePrice: 920, pirateMultiplier: 1.0, damage: 46, reloadMult: 1.14, rangeMult: 1.28, ghostFireChance: 0.40, isGhostCannon: true, enclaveOnly: true, reqRankIdx: 0, reqAllegiance: false, icon: '👻', desc: 'Schwerste Höllen-Artillerie der Verdammten! Gewaltiger Schaden & 40% Chance auf Grünes Geisterfeuer!' }
];

// HINWEIS: 'weapons' (Musketen & Schwarzpulver) als Handelsware komplett entfernt!
//          Crew-Waffen werden nur in der Rüstkammer gekauft; Schmuggel läuft über edlen Kolonial-Kakao/Tabak/Kanonen.
const GOODS = [
  { id: 'food', name: 'Schiffsproviant (Pökelfleisch & Zwieback)', basePrice: 12, icon: '🍖', isSupply: true, canFloat: true, weight: 1.0 },
  { id: 'rum', name: 'Karibischer Rum (Mannschafts-Ration)', basePrice: 26, icon: '🍾', isSupply: true, canFloat: true, weight: 1.0 },
  { id: 'medicine', name: 'Limetten, Chinarinde & Heilkräuter', basePrice: 38, icon: '🍋', isSupply: true, canFloat: true, weight: 0.8 },
  { id: 'timber', name: 'Mahagoni & Schiffsholz', basePrice: 22, icon: '🪵', isSupply: true, canFloat: true, weight: 1.2 },
  { id: 'canvas', name: 'Segeltuch & Hanftauwerk', basePrice: 28, icon: '⛵', isSupply: true, canFloat: true, weight: 0.9 },
  { id: 'sugar', name: 'Rohrzucker', basePrice: 19, icon: '🎋', canFloat: true, weight: 1.1 },
  { id: 'cotton', name: 'Kolonial-Baumwolle', basePrice: 32, icon: '☁️', canFloat: true, weight: 0.8 },
  { id: 'coffee', name: 'Karibischer Kaffee', basePrice: 44, icon: '☕', canFloat: true, weight: 1.0 },
  { id: 'tobacco', name: 'Havanna-Tabak', basePrice: 48, icon: '🍂', canFloat: true, weight: 0.9 },
  { id: 'spices', name: 'Kakao & Gewürze', basePrice: 56, icon: '🌶️', canFloat: true, weight: 0.9 },
  { id: 'indigo', name: 'Königs-Indigo & Farbstoffe', basePrice: 68, icon: '🏺', canFloat: false, weight: 1.3 },
  { id: 'silk', name: 'Kolonial-Seide', basePrice: 84, icon: '🧵', canFloat: true, weight: 0.8 },
  { id: 'silver', name: 'Spanisches Silber', basePrice: 175, icon: '🥈', canFloat: false, weight: 1.8 },
  { id: 'cannon_6pdr', name: 'Geschütz: 6-Pfünder Eisenkanone', basePrice: 58, icon: '💣', isCannon: true, cannonTier: 0, canFloat: false, weight: 1.6 },
  { id: 'cannon_12pdr', name: 'Geschütz: 12-Pfünder Feldschlange', basePrice: 125, icon: '💣', isCannon: true, cannonTier: 1, canFloat: false, weight: 1.8 },
  { id: 'cannon_18pdr', name: 'Geschütz: 18-Pfünder Bronzekanone', basePrice: 225, icon: '🔥', isCannon: true, cannonTier: 2, canFloat: false, weight: 2.1 },
  { id: 'cannon_32pdr', name: 'Geschütz: 32-Pfünder Königskartaune', basePrice: 390, icon: '💥', isCannon: true, cannonTier: 3, canFloat: false, weight: 2.5 },
  { id: 'cannon_ghost_18', name: 'Geisterkanone: 18-Pfünder Seelenheuler', basePrice: 540, icon: '🟢', isCannon: true, enclaveOnly: true, cannonTier: 4, canFloat: false, weight: 1.7 },
  { id: 'cannon_ghost_36', name: 'Geisterkanone: 36-Pfünder Abyss-Schlund', basePrice: 920, icon: '👻', isCannon: true, enclaveOnly: true, cannonTier: 5, canFloat: false, weight: 2.2 }
];

const CREW_EQUIPMENT = {
  armor: [
    { id: 'leather', name: 'Salzgegerbte Lederwämser', defBonus: 0.20, costPerUnit: 16, desc: 'Schützt Matrosen vor Splittern und leichten Säbelhieben (+20% Verteidigung im Enterkampf & bei Schatzfallen).' },
    { id: 'cuirass', name: 'Spanische Brustpanzer & Morion', defBonus: 0.45, costPerUnit: 38, desc: 'Geschmiedete Stahlkürasse für deine Entermannschaft (+45% Verteidigung im Enterkampf & bei Schatzfallen).' }
  ],
  melee: [
    { id: 'cutlass', name: 'Korsaren-Entermesser & Enterbeile', atkBonus: 0.25, costPerUnit: 18, desc: 'Schwere Klingen für den Sturmangriff an Deck (+25% Nahkampfschaden).' },
    { id: 'rapier', name: 'Toledo-Klingen & Halbpiken', atkBonus: 0.50, costPerUnit: 42, desc: 'Erstklassige Fechtwaffen und Enterpiken (+50% Nahkampfschaden).' }
  ],
  ranged: [
    { id: 'pistol', name: 'Steinschlosspistolen-Gurt', rngBonus: 0.25, costPerUnit: 22, desc: 'Jeder Matrose trägt zwei geladene Pistolen für die erste Salve (+25% Fernkampfschaden).' },
    { id: 'musket', name: 'Marine-Musketen & Donnerbüchsen', rngBonus: 0.55, costPerUnit: 48, desc: 'Verheerende Musketensalven vor dem Entern (+55% Fernkampfschaden).' }
  ]
};

const DISEASES = {
  scurvy: { id: 'scurvy', name: 'Skorbut', desc: 'Vitaminmangel auf langer Fahrt! Wird durch Limetten/Heilkräuter (🍋) oder Landgang geheilt.', crewLossRate: 0.7, moraleLoss: 6 },
  yellowFever: { id: 'yellowFever', name: 'Gelbfieber', desc: 'Tropisches Sumpffieber! Ein Schiffschirurg oder Heilkräuter (🍋) dämmen das Fieber ein.', crewLossRate: 1.2, moraleLoss: 10 },
  flux: { id: 'flux', name: 'Roter Ruhr-Fluss', desc: 'Verdorbenes Brackwasser in den Fässern! Senkt die Kampfkraft im Entergefecht um 25%.', crewLossRate: 0.9, moraleLoss: 8 }
};

const MAX_OFFICERS = 4;
const MAX_ESCORT_SHIPS = 2;

// ============================================================================
// OFFIZIERSROLLEN (Gesenkter Sold + neuer BOOTSMANN für Crew-Effektivität!)
// ============================================================================
const OFFICER_ROLES = [
  { roleId: 'prize_officer', title: 'Prisen-Offizier & Flottenkapitän', hatType: 'plume', hatColor: '#b91c1c', baseCost: 160, baseSalary: 8, forbiddenGroups: ['speed', 'turn'], roleDesc: 'ZWINGEND ERFORDERLICH als Kommandant für ein Begleitschiff! +8% Enterkampf & +6% Segeltempo.', mods: { speedMult: 0.06, boardingMeleeBonus: 0.08, canCommandEscort: 1, treasureBonus: 0.12 } },
  { roleId: 'boatswain', title: 'Oberbootsmann (Deckmeister)', hatType: 'bandana', hatColor: '#b45309', baseCost: 145, baseSalary: 6, forbiddenGroups: ['reload', 'speed'], roleDesc: 'CREW-EFFEKTIVITÄT +35%: Deine Mannschaft benötigt deutlich weniger Männer für Segelmanöver und zum Bedienen der Kanonen! Ideal bei dezimierter Crew.', mods: { crewEfficiency: 0.35, moraleRegen: 0.20, modeSwitchSec: -0.4, boardingMeleeBonus: 0.06 } },
  { roleId: 'gunner', title: 'Oberkanonier', hatType: 'bandana', hatColor: '#991b1b', baseCost: 150, baseSalary: 7, forbiddenGroups: ['reload', 'damage'], roleDesc: 'Artillerie-Leiter: +10% Nachladetempo, +8% Kanonenschaden, -0.3s Rüstzeit & repariert ausgefallene Geschütze schneller. Schaltet [4] Pulver-Salve frei.', mods: { reloadMult: 0.10, damageMult: 0.08, modeSwitchSec: -0.3, treasureBonus: 0.10 } },
  { roleId: 'carpenter', title: 'Schiffszimmermann', hatType: 'cap', hatColor: '#78350f', baseCost: 145, baseSalary: 6, forbiddenGroups: ['hull'], roleDesc: 'Repariert auf See den Rumpf mit Holz (🪵), beschleunigt Baustellen um +25% & schaltet [5] Not-Reparatur frei.', mods: { hullRegen: 1.8, hullBonus: 50, shipyardDiscount: 0.12, treasureBonus: 0.08 } },
  { roleId: 'sailmaker', title: 'Segelflicker', hatType: 'bandana', hatColor: '#1e40af', baseCost: 130, baseSalary: 5, forbiddenGroups: ['speed'], roleDesc: 'Repariert auf See beschädigte Segel mit Segeltuch (⛵) & +6% Segeltempo.', mods: { sailRegen: 2.0, speedMult: 0.06, shipyardDiscount: 0.08, treasureBonus: 0.05 } },
  { roleId: 'shipwright', title: 'Schiffbaumeister', hatType: 'tricorne', hatColor: '#5c3a21', baseCost: 180, baseSalary: 9, forbiddenGroups: ['hull'], roleDesc: 'KANN EIGENE BASEN GRÜNDEN! +75 Max. Rumpf-HP, See-Reparatur (🪵), +20% Bautempo in Basen & -25% Werftkosten.', mods: { canFoundBase: 1, hullBonus: 75, shipyardDiscount: 0.25, hullRegen: 1.1, treasureBonus: 0.08 } },
  { roleId: 'master_builder', title: 'Festungs- & Koloniebaumeister', hatType: 'wig', hatColor: '#92400e', baseCost: 175, baseSalary: 8, forbiddenGroups: ['hull'], roleDesc: 'KANN EIGENE BASEN GRÜNDEN! +35% Bautempo auf allen Basis-Baustellen, -15% Baukosten & +45 Max. Rumpf-HP.', mods: { canFoundBase: 1, baseBuildDiscount: 0.15, hullBonus: 45, shipyardDiscount: 0.10, treasureBonus: 0.10 } },
  { roleId: 'pilot', title: 'Küstenlotse', hatType: 'cap', hatColor: '#0f766e', baseCost: 145, baseSalary: 6, forbiddenGroups: ['turn', 'sight'], roleDesc: 'UNTIEFEN- & STRÖMUNGS-EXPERTE: Markiert Sandbänke, Riffe, Strudel & Meeresströmungen, -55% Riffschaden & +10% Wendigkeit!', mods: { shoalRadar: 1, reefDamageReduction: 0.55, turnMult: 0.10, sightMult: 0.18, speedMult: 0.04 } },
  { roleId: 'navigator', title: 'Navigator & Kartograph', hatType: 'tricorne', hatColor: '#1e3a8a', baseCost: 160, baseSalary: 7, forbiddenGroups: ['speed'], roleDesc: 'Zeichnet die Seekarte [M] (inkl. Meeresströmungen!), aktiviert Kompass-Wegpunkte & +8% Tempo.', mods: { speedMult: 0.08, sightMult: 0.20, canMap: 1, treasureBonus: 0.20 } },
  { roleId: 'helmsman', title: 'Steuermann', hatType: 'tricorne', hatColor: '#1f2937', baseCost: 135, baseSalary: 6, forbiddenGroups: ['turn', 'speed'], roleDesc: 'Rudermeister: +12% Ruder-Wendigkeit und +5% Geschwindigkeit in Gefechtsmanövern.', mods: { turnMult: 0.12, speedMult: 0.05, treasureBonus: 0.06 } },
  { roleId: 'lookout', title: 'Ausguck-Offizier', hatType: 'bandana', hatColor: '#d97706', baseCost: 120, baseSalary: 5, forbiddenGroups: ['damage'], roleDesc: 'Adlerauge im Krähennest: +45% Sichtradius, schnellere Fernglas-Entdeckungen & warnt vor Dschungelfallen.', mods: { sightMult: 0.45, spyglassSpeed: 0.45, rangeMult: 0.06, treasureBonus: 0.18 } },
  { roleId: 'sharpshooter', title: 'Ausguck & Scharfschütze', hatType: 'plume', hatColor: '#14532d', baseCost: 160, baseSalary: 7, forbiddenGroups: ['damage'], roleDesc: 'Musketen-Schütze im Mastkorb: +25% Sichtweite, schaltet Feinde per Muskete aus & +25% Jagdausbeute bei Landgängen.', mods: { sightMult: 0.25, sniperActive: 1, boardingRangedBonus: 0.12, treasureBonus: 0.18, forageBonus: 0.25 } },
  { roleId: 'quartermaster', title: 'Quartiermeister', hatType: 'tricorne', hatColor: '#713f12', baseCost: 150, baseSalary: 7, forbiddenGroups: ['loot'], roleDesc: '+24 Frachtraum, +15% Crew-Effektivität, +12% Kaperbeute, +12% Enterkampf & -0.4s Rüstzeit.', mods: { cargoBonus: 24, crewEfficiency: 0.15, lootMult: 0.12, crewCapBonus: 8, boardingMeleeBonus: 0.12, modeSwitchSec: -0.4, treasureBonus: 0.15, forageBonus: 0.20 } },
  { roleId: 'merchant', title: 'Fernhändler & Faktor', hatType: 'plume', hatColor: '#581c87', baseCost: 145, baseSalary: 6, forbiddenGroups: ['loot'], roleDesc: '+10% bessere Handelspreise, +18 Frachtraum, erleichtert Tauschhandel mit Ureinwohnern & deckt Betriebs-Effektivität auf!', mods: { tradeBonus: 0.10, cargoBonus: 18, merchantIntel: 1, treasureBonus: 0.08 } },
  { roleId: 'surgeon', title: 'Schiffschirurg', hatType: 'wig', hatColor: '#e5e7eb', baseCost: 155, baseSalary: 7, forbiddenGroups: ['food'], roleDesc: 'Studierter Mediziner: -35% Besatzungsverluste, heilt Verletzte & sammelt bei Landgängen mehr Heilkräuter (+30%).', mods: { crewLossReduction: 0.35, diseaseResist: 0.45, woundedHealRate: 1.8, treasureBonus: 0.18, forageBonus: 0.30 } },
  { roleId: 'barber', title: 'Feldscher', hatType: 'cap', hatColor: '#7f1d1d', baseCost: 115, baseSalary: 5, forbiddenGroups: [], roleDesc: 'Rauer Wundarzt: -22% Besatzungsverluste im Gefecht und versorgt Verletzte nach Landgängen (+15%).', mods: { crewLossReduction: 0.22, diseaseResist: 0.25, woundedHealRate: 1.1, treasureBonus: 0.12, forageBonus: 0.15 } },
  { roleId: 'cook', title: 'Schiffskoch (Smutje)', hatType: 'cap', hatColor: '#f8fafc', baseCost: 115, baseSalary: 5, forbiddenGroups: ['food'], roleDesc: 'Saubere Kombüse: -20% Nahrungsverbrauch, +45% mehr Proviant/Limetten beim Landgang & hebt die Moral.', mods: { foodConsumptionMult: -0.20, moraleRegen: 0.30, diseaseResist: 0.20, treasureBonus: 0.05, forageBonus: 0.45 } },
  { roleId: 'priest', title: 'Schiffspriester', hatType: 'priest', hatColor: '#111827', baseCost: 125, baseSalary: 5, forbiddenGroups: ['rum'], roleDesc: 'Segnet die Mannschaft (+0.4 Moral-Erholung, -16% Rumbedarf) & vermittelt friedlich bei Ureinwohnern.', mods: { moraleRegen: 0.4, rumConsumptionMult: -0.16, treasureBonus: 0.12 } }
];

const GHOST_OFFICER_TEMPLATES = [
  {
    roleId: 'prize_officer', portraitId: 'geister:0', name: 'Davy Jones’ Erster Maat',
    title: '👻 Verfluchter Geister-Kommandant', title_en: '👻 Cursed Ghost Commander', title_es: '👻 Comandante Fantasma Maldito', title_fr: '👻 Commandant Fantôme Maudit',
    hatType: 'tricorne', hatColor: '#065f46', cost: 680, salary: 12,
    roleDesc: 'ENKLAVE-GEISTEROFFIZIER: Kommandiert Begleitschiffe, +25% Crew-Effektivität, +24% Schaden & +32% Enterkampf!',
    roleDesc_en: 'ENCLAVE GHOST OFFICER: Commands escorts, +25% crew efficiency, +24% cannon damage & +32% boarding!',
    roleDesc_es: 'OFICIAL FANTASMA: Comanda escoltas, +25% eficacia, +24% daño y +32% abordaje.',
    roleDesc_fr: 'OFFICIER FANTÔME: Commande les escortes, +25% efficacité, +24% dégâts & +32% abordage.',
    mods: { canCommandEscort: 1, crewEfficiency: 0.25, damageMult: 0.24, boardingMeleeBonus: 0.32, modeSwitchSec: -0.9, treasureBonus: 0.30 },
    greatPosTrait: { id: 'abyssal_wrath', group: 'damage', name: 'Zorn der Tiefe', name_en: 'Abyssal Wrath', desc: '+18% Kanonenschaden & +20% Kaperbeute', desc_en: '+18% Cannon Damage & +20% Plunder', mods: { damageMult: 0.18, lootMult: 0.20 } },
    heavyNegTrait: { id: 'dread_chill', group: 'morale', name: 'Totenkälte an Deck', name_en: 'Graveyard Chill', desc: '-0.55 Moral-Erholung & -18% Kolonial-Handelspreise', desc_en: '-0.55 Morale Regen & -18% Trade Prices', mods: { moraleRegen: -0.55, rumConsumptionMult: 0.28, tradeBonus: -0.18 } }
  },
  {
    roleId: 'navigator', portraitId: 'geister:13', name: 'Klabautermann von Nebelwrack',
    title: '👻 Geister-Lotse & Sturmwandler', title_en: '👻 Ghost Pilot & Stormwalker',
    hatType: 'plume', hatColor: '#115e59', cost: 640, salary: 11,
    roleDesc: 'ENKLAVE-GEISTEROFFIZIER: Seekarte, Lotsen-Untiefenradar, +55% Sichtweite, +18% Tempo & +2.6 Geister-Selbstreparatur!',
    roleDesc_en: 'ENCLAVE GHOST OFFICER: Map, Shoal Radar, +55% sight range, +18% speed & +2.6 spectral repair!',
    mods: { canMap: 1, shoalRadar: 1, reefDamageReduction: 0.65, sightMult: 0.55, speedMult: 0.18, hullRegen: 2.6, sailRegen: 2.6, treasureBonus: 0.35 },
    greatPosTrait: { id: 'phantom_gale', group: 'speed', name: 'Geisterwind im Tuch', name_en: 'Phantom Gale', desc: '+14% Segelgeschwindigkeit & +14% Wendigkeit', desc_en: '+14% Speed & +14% Turn', mods: { speedMult: 0.14, turnMult: 0.14 } },
    heavyNegTrait: { id: 'rotting_stores', group: 'food', name: 'Fäulnishauch im Laderaum', name_en: 'Blighted Hold', desc: '+35% Nahrungsverbrauch & -25% Seuchenresistenz', desc_en: '+35% Food Usage & -25% Disease Resist', mods: { foodConsumptionMult: 0.35, diseaseResist: -0.25 } }
  },
  {
    roleId: 'gunner', portraitId: 'geister:2', name: 'Skelett-Geschützmeister Mordecai',
    title: '👻 Seelenfeuer-Oberkanonier', title_en: '👻 Soulfire Master Gunner',
    hatType: 'bandana', hatColor: '#047857', cost: 720, salary: 13,
    roleDesc: 'ENKLAVE-GEISTEROFFIZIER: +22% Nachladetempo, +22% Schaden, Scharfschütze im Mastkorb & [4] Pulver-Salve!',
    roleDesc_en: 'ENCLAVE GHOST OFFICER: +22% reload speed, +22% cannon damage, mast sniper & [4] Salvo!',
    mods: { reloadMult: 0.22, damageMult: 0.22, sniperActive: 1, modeSwitchSec: -0.8, treasureBonus: 0.25 },
    greatPosTrait: { id: 'hellfire_barrage', group: 'reload', name: 'Rastlose Knochenhände', name_en: 'Relentless Bone-Hands', desc: '+16% Nachladetempo & +15% Reichweite', desc_en: '+16% Reload & +15% Range', mods: { reloadMult: 0.16, rangeMult: 0.15 } },
    heavyNegTrait: { id: 'soul_toll', group: 'hull', name: 'Blutzoll der Geschütze', name_en: 'Blood Toll', desc: '-65 Max. Rumpf-HP & +25% Besatzungsverluste', desc_en: '-65 Hull HP & +25% Crew Loss', mods: { hullBonus: -65, crewLossReduction: -0.25 } }
  },
  {
    roleId: 'carpenter', portraitId: 'geister:11', name: 'Meister Geisterspant',
    title: '👻 Verfluchter Wrack-Baumeister', title_en: '👻 Cursed Wreck-Builder',
    hatType: 'cap', hatColor: '#064e3b', cost: 650, salary: 11,
    roleDesc: 'ENKLAVE-GEISTEROFFIZIER: Kann Basen gründen, +130 Max. Rumpf-HP, +3.2 Rumpf-Regeneration, +40% Bautempo & [5] Not-Reparatur!',
    roleDesc_en: 'ENCLAVE GHOST OFFICER: Can found Bases, +130 Max Hull HP, +3.2 hull regen, +40% build speed & [5] Repair!',
    mods: { canFoundBase: 1, hullBonus: 130, hullRegen: 3.2, shipyardDiscount: 0.25, treasureBonus: 0.15 },
    greatPosTrait: { id: 'undying_timbers', group: 'hull', name: 'Unsterbliches Treibholz', name_en: 'Undying Driftwood', desc: '+90 Max. Rumpf-HP & +1.5 Segel-Regeneration', desc_en: '+90 Hull HP & +1.5 Sail Regen', mods: { hullBonus: 90, sailRegen: 1.5 } },
    heavyNegTrait: { id: 'barnacle_drag', group: 'speed', name: 'Schwere Riff-Verkrustung', name_en: 'Barnacle Crust', desc: '-12% Segelgeschwindigkeit & -12% Wendigkeit', desc_en: '-12% Speed & -12% Turn', mods: { speedMult: -0.12, turnMult: -0.12 } }
  }
];

const NAMED_CAPTAINS = [
  { id: 'cap_pir_1', name: 'Kapitän Benjamin Hornigold', gender: 'm', faction: 'pirates', clsKey: 'frigate', shipName: 'Ranger of Nassau', homePort: 'nassau', seed: 401, portraitId: 'freibeuter:4', personality: 'Gründervater der Flying Gang von 1714 & Dein Lehrmeister', baseRelation: 40 },
  { id: 'cap_pir_2', name: 'Charles Vane', gender: 'm', faction: 'pirates', clsKey: 'corvette', shipName: 'Lark', homePort: 'tortuga', seed: 402, portraitId: 'freibeuter:2', personality: 'Skrupelloser Freibeuter von Nassau', baseRelation: 15 },
  { id: 'cap_pir_3', name: 'Kapitänin Anne Bonny', gender: 'f', faction: 'pirates', clsKey: 'brigantine', shipName: 'Revenge', homePort: 'providencia', seed: 403, portraitId: 'piratinnen:6', personality: 'Furchtlose Korsarin der Karibik', baseRelation: 25 },
  { id: 'cap_eng_1', name: 'Kommodore Woodes Rogers', gender: 'm', faction: 'england', clsKey: 'frigate', shipName: 'HMS Delicia', homePort: 'portroyal', seed: 101, portraitId: 'kolonial:1', personality: 'Berühmter Freibeuter & Piratenjäger der Krone', baseRelation: 5 },
  { id: 'cap_eng_2', name: 'Kapitän Maynard', gender: 'm', faction: 'england', clsKey: 'corvette', shipName: 'HMS Pearl', homePort: 'antigua', seed: 102, portraitId: 'kolonial:9', personality: 'Pflichtbewusster Offizier der Royal Navy', baseRelation: 0 },
  { id: 'cap_spa_1', name: 'Almirante Don Juan Esteban de Ubilla', gender: 'm', faction: 'spain', clsKey: 'galleon', shipName: 'Nuestra Señora de la Regla', homePort: 'havanna', seed: 201, portraitId: 'kolonial:6', personality: 'Befehlshaber der Silberflotte von 1714', baseRelation: -10 },
  { id: 'cap_spa_2', name: 'Capitán Rodrigo de Córdoba', gender: 'm', faction: 'spain', clsKey: 'frigate', shipName: 'Guarda Costa Real', homePort: 'cartagena', seed: 202, portraitId: 'kolonial:2', personality: 'Unnachgiebiger Küstenwächter Spaniens', baseRelation: -15 },
  { id: 'cap_fra_1', name: 'Capitaine Jacques Cassard', gender: 'm', faction: 'france', clsKey: 'frigate', shipName: 'Le Neptune', homePort: 'portauprince', seed: 301, portraitId: 'kolonial:0', personality: 'Gefeierter französischer Korsar aus Nantes', baseRelation: 10 },
  { id: 'cap_ned_1', name: 'Commandeur Pieter van Hoorn', gender: 'm', faction: 'netherlands', clsKey: 'flute', shipName: 'Gouden Leeuw', homePort: 'willemstad', seed: 501, portraitId: 'kolonial:13', personality: 'Wohlhabender Konvoiführer der Niederländischen WIC', baseRelation: 15 },
  { id: 'cap_ned_2', name: 'Kapitein Laurens Prins', gender: 'm', faction: 'netherlands', clsKey: 'corvette', shipName: 'Zeelandia', homePort: 'nieuw_middelburg', seed: 502, portraitId: 'freibeuter:10', personality: 'Waghalsiger niederländischer Freibeuter', baseRelation: 10 },
  { id: 'cap_den_1', name: 'Kommandør Peter Tordenskjold', gender: 'm', faction: 'denmark', clsKey: 'frigate', shipName: 'Løvendals Gallej', homePort: 'charlotte_amalie', seed: 601, portraitId: 'kolonial:10', personality: 'Donnerschild der dänisch-norwegischen Flotte', baseRelation: 15 }
];

// STRIKT GETRENNTE MÄNNLICHE & WEIBLICHE VORNAMEN FÜR KORREKTE PORTRÄTS!
const FIRST_NAMES_MALE = [
  'Jack', 'Bartholomew', 'Henry', 'Edward', 'Charles', 'Jean-Luc', 'Diego', 'Alonso',
  'Francois', 'Piet', 'William', 'Hector', 'Rodrigo', 'Gaspard', 'Barnaby', 'Samuel', 'Thomas', 'Richard',
  'Christopher', 'Nathaniel', 'Benjamin', 'Sebastian', 'Mateo', 'Alejandro', 'Esteban', 'Hernan', 'Vasco', 'Lorenzo',
  'Pierre', 'Armand', 'Guillaume', 'Etienne', 'Henri', 'Jacques', 'Claude', 'Louis', 'Bastien', 'Remy',
  'Hendrik', 'Cornelis', 'Willem', 'Dirk', 'Jan', 'Michiel', 'Laurens', 'Joost', 'Pieter', 'Stede',
  'Søren', 'Mikkel', 'Niels', 'Christian', 'Jørgen', 'Holger', 'Torben', 'Rasmus', 'Ivar', 'Magnus'
];

const FIRST_NAMES_FEMALE = [
  'Anne', 'Mary', 'Grace', 'Charlotte', 'Jacquotte', 'Sadie', 'Christina',
  'Ines', 'Catalina', 'Valerie', 'Marguerite', 'Eleanor', 'Isabella', 'Sofia',
  'Beatriz', 'Claire', 'Helene', 'Hendrika', 'Astrid', 'Freja', 'Abigail', 'Rosita'
];

const FIRST_NAMES = [...FIRST_NAMES_MALE, ...FIRST_NAMES_FEMALE];

const LAST_NAMES = [
  'Rackham', 'Vane', 'Morgan', 'Teach', 'Bonny', 'Lafitte', 'Mendoza', 'de Soto', 'Bellamy', 'Roberts',
  'Levasseur', 'Blood', 'Kidd', 'Barbossa', 'Drake', 'Dampier', 'Valdez', 'Moreau', 'Hawkins', 'Frobisher',
  'Hornigold', 'Jennings', 'Hands', 'Knight', 'Swan', 'Sharp', 'Avery', 'Tew', 'England', 'Low',
  'van Hoorn', 'Prins', 'de Ruyter', 'Tromp', 'van der Decken', 'de Graaf', 'Pieterszoon', 'Barentsz',
  'Tordenskjold', 'Juel', 'Krabbe', 'Bjelke', 'Adeler', 'Gyldenløve', 'Rosenkrantz', 'Lindholm',
  'Toledo', 'Montoya', 'del Mar', 'Navarro', 'Spinola', 'Beauregard', 'Rochefort', 'du Casse', 'Cassard'
];

window.POSITIVE_TRAITS_POOL = [
  { id: 'sharpshooter', group: 'damage', name: 'Scharfer Blick', modKey: 'damageMult', min: 0.03, max: 0.06, fmt: v => `+${Math.round(v*100)}% ${tr('Kanonenschaden','Cannon Dmg','Daño Cañón','Dégâts Canon')}` },
  { id: 'master_fuse', group: 'damage', name: 'Pulverkenner', modKey: 'damageMult', min: 0.03, max: 0.07, fmt: v => `+${Math.round(v*100)}% ${tr('Durchschlagskraft','Penetration','Penetración','Pénétration')}` },
  { id: 'windwhisperer', group: 'speed', name: 'Windkundig', modKey: 'speedMult', min: 0.03, max: 0.06, fmt: v => `+${Math.round(v*100)}% ${tr('Segeltempo','Sailing Speed','Velocidad','Vitesse')}` },
  { id: 'streamlined', group: 'speed', name: 'Strömungsleser', modKey: 'speedMult', min: 0.02, max: 0.05, fmt: v => `+${Math.round(v*100)}% ${tr('Fahrt','Speed','Marcha','Allure')}` },
  { id: 'drillmaster', group: 'reload', name: 'Geschützdrill', modKey: 'reloadMult', min: 0.03, max: 0.07, fmt: v => `+${Math.round(v*100)}% ${tr('Nachladen','Reload','Recarga','Recharge')}` },
  { id: 'fast_hands', group: 'reload', name: 'Flinke Ladeschützen', modKey: 'reloadMult', min: 0.03, max: 0.06, fmt: v => `+${Math.round(v*100)}% ${tr('Ladetempo','Reload','Recarga','Recharge')}` },
  { id: 'quick_rig', group: 'modeswitch', name: 'Gefechtsbereit', modKey: 'modeSwitchSec', min: -0.6, max: -0.3, fmt: v => `${v.toFixed(1)}s ${tr('Rüstzeit','Mode Switch','Cambio Modo','Transition')}` },
  { id: 'ironration', group: 'food', name: 'Sparsam', modKey: 'foodConsumptionMult', min: -0.10, max: -0.04, fmt: v => `${Math.round(v*100)}% ${tr('Nahrungsbedarf','Food Usage','Comida','Vivres')}` },
  { id: 'prizemaster', group: 'loot', name: 'Beutegespür', modKey: 'lootMult', min: 0.04, max: 0.09, fmt: v => `+${Math.round(v*100)}% ${tr('Prisenbeute','Plunder','Botín','Butin')}` },
  { id: 'haggler', group: 'trade', name: 'Feilscher', modKey: 'tradeBonus', min: 0.03, max: 0.06, fmt: v => `+${Math.round(v*100)}% ${tr('Handelspreise','Trade Prices','Precios','Prix')}` },
  { id: 'popular', group: 'rum', name: 'Kameradschaftlich', modKey: 'rumConsumptionMult', min: -0.09, max: -0.04, fmt: v => `${Math.round(v*100)}% ${tr('Rumbedarf','Rum Usage','Ron','Rhum')}` },
  { id: 'stoutoak', group: 'hull', name: 'Seefest', modKey: 'hullBonus', min: 20, max: 50, isInt: true, fmt: v => `+${v} ${tr('Max. Rumpf-HP','Max Hull HP','PV Casco','PV Coque')}` },
  { id: 'helmskill', group: 'turn', name: 'Flinke Hand am Rad', modKey: 'turnMult', min: 0.03, max: 0.06, fmt: v => `+${Math.round(v*100)}% ${tr('Wendigkeit','Agility','Giro','Maniabilité')}` },
  { id: 'boarding_fury', group: 'boarding', name: 'Enter-Veteran', modKey: 'boardingMeleeBonus', min: 0.04, max: 0.09, fmt: v => `+${Math.round(v*100)}% ${tr('Enter-Nahkampf','Boarding Melee','Abordaje','Abordage')}` },
  { id: 'eagle_eyes', group: 'sight', name: 'Falkenauge', modKey: 'sightMult', min: 0.05, max: 0.12, fmt: v => `+${Math.round(v*100)}% ${tr('Sichtweite','Sight Range','Visión','Vue')}` }
];

window.NEGATIVE_TRAITS_POOL = [
  { id: 'drunkard', group: 'rum', name: 'Durstige Kehle', modKey: 'rumConsumptionMult', min: 0.04, max: 0.10, fmt: v => `+${Math.round(v*100)}% ${tr('Rumverbrauch','Rum Usage','Ron','Rhum')}` },
  { id: 'glutton', group: 'food', name: 'Großer Appetit', modKey: 'foodConsumptionMult', min: 0.04, max: 0.10, fmt: v => `+${Math.round(v*100)}% ${tr('Nahrungsverbrauch','Food Usage','Comida','Vivres')}` },
  { id: 'hothead', group: 'reload', name: 'Hitzkopf', modKey: 'reloadMult', min: -0.06, max: -0.02, fmt: v => `${Math.round(v*100)}% ${tr('Nachladetempo','Reload','Recarga','Recharge')}` },
  { id: 'rusty_drill', group: 'modeswitch', name: 'Träge Befehle', modKey: 'modeSwitchSec', min: 0.2, max: 0.6, fmt: v => `+${v.toFixed(1)}s ${tr('Rüstzeit','Mode Switch','Cambio Modo','Transition')}` },
  { id: 'leadfoot', group: 'turn', name: 'Schwerfällig', modKey: 'turnMult', min: -0.06, max: -0.03, fmt: v => `${Math.round(v*100)}% ${tr('Wendigkeit','Agility','Giro','Maniabilité')}` },
  { id: 'greedy', group: 'loot', name: 'Abzweiger', modKey: 'lootMult', min: -0.07, max: -0.03, fmt: v => `${Math.round(v*100)}% ${tr('Kaperbeute','Plunder','Botín','Butin')}` },
  { id: 'clumsy', group: 'damage', name: 'Feuchtes Pulver', modKey: 'damageMult', min: -0.05, max: -0.02, fmt: v => `${Math.round(v*100)}% ${tr('Kanonenschaden','Cannon Dmg','Daño','Dégâts')}` },
  { id: 'superstitious', group: 'speed', name: 'Abergläubisch', modKey: 'speedMult', min: -0.05, max: -0.02, fmt: v => `${Math.round(v*100)}% ${tr('Segeltempo','Speed','Velocidad','Vitesse')}` },
  { id: 'nearsighted', group: 'sight', name: 'Kurzsichtig', modKey: 'sightMult', min: -0.07, max: -0.03, fmt: v => `${Math.round(v*100)}% ${tr('Sichtweite','Sight','Visión','Vue')}` },
  { id: 'careless', group: 'hull', name: 'Sorglos mit Holz', modKey: 'hullBonus', min: -25, max: -10, isInt: true, fmt: v => `${v} ${tr('Max. Rumpf-HP','Max Hull HP','PV Casco','PV Coque')}` }
];

const POSITIVE_TRAITS_POOL = window.POSITIVE_TRAITS_POOL;
const NEGATIVE_TRAITS_POOL = window.NEGATIVE_TRAITS_POOL;

function rollRandomTraitFromPool(pool) {
  const tpl = pool[Math.floor(Math.random() * pool.length)];
  let val = tpl.min + Math.random() * (tpl.max - tpl.min);
  val = tpl.isInt ? Math.round(val) : Math.round(val * 100) / 100;
  return { id: tpl.id, group: tpl.group.trim(), name: tpl.name, modKey: tpl.modKey, val, desc: tpl.fmt(val), mods: { [tpl.modKey]: val } };
}

const CAPTAIN_TRAITS = [
  { id: 'drifter', name: 'Pflichtbewusster Freibeuter (Standard)', desc: '+3% Segeltempo, +3% Nachladetempo & +6 Frachtraum.', mods: { speedMult: 0.03, reloadMult: 0.03, cargoBonus: 6 } },
  { id: 'bloodthirsty', name: 'Blutdurstiger Korsar', desc: '+12% Schaden im Enterkampf & +6% Kanonenschaden, aber -7% Handelspreise.', mods: { damageMult: 0.06, boardingMeleeBonus: 0.12, tradeBonus: -0.07 } },
  { id: 'cartographer', name: 'Geborener Kartograph', desc: 'Zeichnet die Seekarte [M] auch ohne Navigator und hat +12% Sichtweite.', mods: { canMap: 1, sightMult: 0.12 } },
  { id: 'silver_tongue', name: 'Silberzunge', desc: '+9% bessere Handelspreise & +15% Rufgewinn bei Aufträgen, aber -20 Rumpf-HP.', mods: { tradeBonus: 0.09, hullBonus: -20 } },
  { id: 'iron_stomach', name: 'Eiserne Disziplin', desc: '-12% Nahrungs-/Rumverbrauch, -0.3s Rüstzeit & +20% Seuchenresistenz.', mods: { foodConsumptionMult: -0.12, rumConsumptionMult: -0.12, diseaseResist: 0.20, modeSwitchSec: -0.3 } },
  { id: 'night_owl', name: 'Geistersegler', desc: '+7% Höchstgeschwindigkeit & +6% Wendigkeit, aber -10 Frachtraum.', mods: { speedMult: 0.07, turnMult: 0.06, cargoBonus: -10 } },
  { id: 'master_gunner', name: 'Artillerie-Genie', desc: '+8% Nachladetempo & -0.4s Rüstzeit, aber -7% Enterkampf.', mods: { reloadMult: 0.08, modeSwitchSec: -0.4, boardingMeleeBonus: -0.07 } }
];

const CAPTAIN_PERKS = [
  { id: 'perk_broadsides', name: 'Donnernde Breitseite', reqLevel: 2, reqPerk: null, desc: '+8% Kanonenschaden, +6% Projektil-Reichweite & stärkere Moral-Schockwirkung.' },
  { id: 'perk_boarding_master', name: 'Schrecken der Decks', reqLevel: 2, reqPerk: null, desc: '+14% Nah- und Fernkampfkraft deiner Crew in Enterschlachten & Duellen.' },
  { id: 'perk_pegleg_stash', name: '🦿 Holzbein mit Geheimfach', reqLevel: 2, reqPerk: null, desc: '+15% Einschüchterung im Fechtduell, aber -2% Wendigkeit.' },
  { id: 'perk_scholar_parrot', name: '🦜 Beleidigender Gelehrten-Papagei', reqLevel: 2, reqPerk: null, desc: 'Feindliche Moral sinkt beim Entern um 12% & +6% Handelspreise.' },
  { id: 'perk_quarantine', name: 'Schiffshygiene & Zitrusration', reqLevel: 3, reqPerk: null, desc: '-35% Seuchenrisiko und +50% schnellere Heilung Verletzter.' },
  { id: 'perk_treasure_hunter', name: 'Schatzjäger der Antillen', reqLevel: 3, reqPerk: 'perk_pegleg_stash', desc: '+22% mehr Dublonen bei Schatzkarten & -25% Fallenrisiko.' },
  { id: 'perk_rum_alchemy', name: '🍾 Rum-Alchemie in den Kanonenrohren', reqLevel: 3, reqPerk: 'perk_broadsides', desc: '+12% Brandchance & +6% Nachladetempo, aber +10% Rumverbrauch.' },
  { id: 'perk_hypno_eyepatch', name: '👁️ Hypnotische Doppel-Augenklappe', reqLevel: 3, reqPerk: 'perk_scholar_parrot', desc: '+10% bessere Preise im Kontor & +15% Beziehung bei See-Gesprächen.' },
  { id: 'perk_admiral', name: 'Geborener Flottenführer', reqLevel: 4, reqPerk: 'perk_boarding_master', desc: '+12 Max. Besatzung, +12% Kampfkraft für Begleitschiffe & Offiziersharmonie.' },
  { id: 'perk_iron_keel', name: 'Kupferbeschlagener Tiefgang', reqLevel: 4, reqPerk: 'perk_quarantine', desc: '-45% Rumpfschaden an Riffen/Sandbänken und +75 Max. Rumpf-HP.' },
  { id: 'perk_accord_shanty', name: '🪗 Taktisches Gefechts-Akkordeon', reqLevel: 4, reqPerk: 'perk_boarding_master', desc: '+25% Moral-Regeneration & -0.4s Rüstzeit.' },
  { id: 'perk_klabautermann_tea', name: '👻 Teestunde mit dem Klabautermann', reqLevel: 5, reqPerk: 'perk_iron_keel', desc: 'Regeneriert auf See +1.4 Rumpf & Segel und warnt vor Untiefen!' }
];

const VOODOO_POWERS = [
  { id: 'voodoo_ghost_form', isGhostTransformation: true, cost: 1450, name: '💀 Ritual des Baron Samedi: Geist-Verwandlung!', name_en: '💀 Ritual of Baron Samedi: Become a Ghost Captain!', desc: 'Verwandelt Euren Kapitän in ein Geisterwesen! +20% Duell-Stärke, Seuchenimmunität, +30 Rumpf-HP & -35 Reputation.', desc_en: 'Spectral portrait, +20% duel power, plague immunity, +30 Hull HP & -35 Rep.', mods: { boardingMeleeBonus: 0.20, diseaseResist: 0.60, hullBonus: 30 } },
  { id: 'voodoo_wind_loa', cost: 680, name: '🌪️ Atem von Agwé (Geisterwind-Segnung)', name_en: '🌪️ Breath of Agwé', desc: '+12% Segelgeschwindigkeit, +10% Wendigkeit & Segel heilen nachts ohne Segeltuch!', desc_en: '+12% speed, +10% turn & night sail regen!', mods: { speedMult: 0.12, turnMult: 0.10 } },
  { id: 'voodoo_soul_cannons', cost: 820, name: '🟢 Fluch der Loa-Kugeln (Seelenbrand)', name_en: '🟢 Loa Shot Curse', desc: '+12% Kanonenschaden und 18% Chance auf Grünes Geisterfeuer!', desc_en: '+12% cannon damage & 18% Green Ghost Fire chance!', mods: { damageMult: 0.12 } },
  { id: 'voodoo_zombie_watch', cost: 740, name: '🧟 Untote Deckwache (Blutzoll-Schutz)', name_en: '🧟 Undead Deck Watch', desc: '+25% Crew-Effektivität, -30% Besatzungsverluste, +15 Max. Crew & -25% Nahrungsbedarf.', desc_en: '+25% crew efficiency, -30% losses, +15 Max Crew & -25% food usage.', mods: { crewEfficiency: 0.25, crewLossReduction: 0.30, crewCapBonus: 15, foodConsumptionMult: -0.25 } }
];

// ============================================================================
// SCHIFFSKLASSEN (Taktischeres Tempo: +42% höhere Nachladezeiten & sanftere Ruder!)
// ============================================================================
const SHIP_CLASSES = {
  sloop:        { name: 'Korsaren-Schaluppe', reqRankIdx: 0, cannonsPerSide: 3, maxCannonsPerSide: 6, defaultCannon: 'cannon_6pdr', length: 52, width: 19, hull: 280, sail: 210, crew: 24, baseSpeed: 2.25, turnRate: 0.0155, reload: 220, dmg: 11, cargoCap: 42, gold: 45, price: 340 },
  brigantine:   { name: 'Sturm-Brigantine', reqRankIdx: 1, cannonsPerSide: 5, maxCannonsPerSide: 9, defaultCannon: 'cannon_6pdr', length: 62, width: 21, hull: 450, sail: 285, crew: 38, baseSpeed: 2.16, turnRate: 0.0138, reload: 232, dmg: 13, cargoCap: 62, gold: 70, price: 680 },
  flute:        { name: 'Niederländische Handels-Fleute', reqRankIdx: 1, cannonsPerSide: 4, maxCannonsPerSide: 8, defaultCannon: 'cannon_6pdr', length: 66, width: 25, hull: 520, sail: 265, crew: 32, baseSpeed: 1.68, turnRate: 0.0102, reload: 250, dmg: 11, cargoCap: 115, gold: 95, price: 640, isMerchant: true },
  corvette:     { name: 'Schnelle Korvette', reqRankIdx: 2, cannonsPerSide: 6, maxCannonsPerSide: 11, defaultCannon: 'cannon_12pdr', length: 70, width: 22, hull: 620, sail: 340, crew: 48, baseSpeed: 2.12, turnRate: 0.0128, reload: 238, dmg: 17, cargoCap: 72, gold: 90, price: 1050 },
  frigate:      { name: 'Kriegs-Fregatte', reqRankIdx: 3, cannonsPerSide: 8, maxCannonsPerSide: 14, defaultCannon: 'cannon_18pdr', length: 80, width: 26, hull: 890, sail: 420, crew: 72, baseSpeed: 1.90, turnRate: 0.0108, reload: 248, dmg: 25, cargoCap: 88, gold: 135, price: 1680 },
  galleon:      { name: 'Schwere Galeone', reqRankIdx: 3, cannonsPerSide: 10, maxCannonsPerSide: 16, defaultCannon: 'cannon_18pdr', length: 92, width: 32, hull: 1320, sail: 490, crew: 105, baseSpeed: 1.48, turnRate: 0.0082, reload: 270, dmg: 25, cargoCap: 165, gold: 210, price: 2450, isMerchant: true },
  manowar:      { name: 'Linienschiff 1. Ranges', reqRankIdx: 4, cannonsPerSide: 13, maxCannonsPerSide: 20, defaultCannon: 'cannon_32pdr', length: 106, width: 36, hull: 1950, sail: 620, crew: 155, baseSpeed: 1.32, turnRate: 0.0068, reload: 285, dmg: 36, cargoCap: 115, gold: 320, price: 3650 },
  ghostship:    { name: 'Verfluchtes Geisterschiff', reqRankIdx: 5, cannonsPerSide: 16, maxCannonsPerSide: 22, defaultCannon: 'cannon_ghost_36', length: 110, width: 36, hull: 3200, sail: 880, crew: 210, baseSpeed: 1.52, turnRate: 0.0098, reload: 205, dmg: 44, cargoCap: 140, gold: 980, price: 6800, isMyth: true, isGhostAppearance: true, ghostAbility: 'soul_drain' },
  phantom_sloop:{
    name: 'Geister-Brigantine "Nebelgespenst"', reqRankIdx: 0, enclaveOnly: true, isMyth: true, isGhostAppearance: true, ghostAbility: 'mist_cloak',
    abilityDesc_de: 'Spezialfähigkeit: Geisternebel-Tarnung nachts, -50% Sturmschaden & Selbstheilung im Mondlicht!',
    abilityDesc_en: 'Special Ability: Spectral mist stealth at night, -50% storm damage & moonlight hull regeneration!',
    cannonsPerSide: 7, maxCannonsPerSide: 12, defaultCannon: 'cannon_ghost_18',
    length: 72, width: 23, hull: 1180, sail: 460, crew: 68, baseSpeed: 1.62, turnRate: 0.0132, reload: 210, dmg: 31, cargoCap: 95, gold: 400, price: 3400
  },
  dread_dutchman:{
    name: 'Geister-Galeone "Fliegender Seelenfänger"', reqRankIdx: 0, enclaveOnly: true, isMyth: true, isGhostAppearance: true, ghostAbility: 'soul_drain',
    abilityDesc_de: 'Spezialfähigkeit: Seelenraub-Breitseiten heilen eigenen Rumpf, -65% Sturmschaden & immun gegen Korallenriffe!',
    abilityDesc_en: 'Special Ability: Soul-Drain broadsides heal your hull, -65% storm damage & immune to coral reefs!',
    cannonsPerSide: 14, maxCannonsPerSide: 20, defaultCannon: 'cannon_ghost_36',
    length: 108, width: 35, hull: 2650, sail: 780, crew: 165, baseSpeed: 1.48, turnRate: 0.0096, reload: 215, dmg: 46, cargoCap: 155, gold: 800, price: 6200
  }
};

window.getFactionShipStats = function(clsKey, factionId) {
  const base = SHIP_CLASSES[clsKey] || SHIP_CLASSES.sloop;
  if (base.isGhostAppearance) {
    return {
      clsKey, factionId: 'pirates', reqRankIdx: 0, isGhostAppearance: true, ghostAbility: base.ghostAbility || null,
      name: td(base, 'name'), cannonsPerSide: base.cannonsPerSide, maxCannonsPerSide: base.maxCannonsPerSide,
      defaultCannon: base.defaultCannon, length: base.length, width: base.width, hull: base.hull, sail: base.sail,
      crew: base.crew, baseSpeed: base.baseSpeed, turnRate: base.turnRate, reload: base.reload, dmg: base.dmg,
      cargoCap: base.cargoCap, price: base.price
    };
  }
  const fm = (FACTIONS[factionId] && FACTIONS[factionId].shipMods) || {};
  const facShort = FACTIONS[factionId] ? td(FACTIONS[factionId], 'short') : 'Neutral';
  return {
    clsKey, factionId, reqRankIdx: base.reqRankIdx || 0, isGhostAppearance: false, ghostAbility: null,
    name: `${facShort} – ${td(base, 'name')}`,
    cannonsPerSide: base.cannonsPerSide,
    maxCannonsPerSide: base.maxCannonsPerSide || (base.cannonsPerSide + 6),
    defaultCannon: base.defaultCannon || 'cannon_6pdr',
    length: base.length, width: base.width,
    hull: Math.round(base.hull * (fm.hullMult || 1)),
    sail: base.sail,
    crew: Math.round(base.crew * (fm.crewMult || 1)),
    baseSpeed: Math.round(base.baseSpeed * (fm.speedMult || 1) * 100) / 100,
    turnRate: Math.round(base.turnRate * (fm.turnMult || 1) * 10000) / 10000,
    reload: Math.round(base.reload * (fm.reloadMult || 1)),
    dmg: Math.round(base.dmg * (fm.dmgMult || 1)),
    cargoCap: Math.round(base.cargoCap * (fm.cargoMult || 1)),
    price: Math.round((base.price || 600) * (factionId === 'spain' ? 1.05 : (factionId === 'netherlands' ? 0.96 : 1.0)))
  };
};

const UPGRADE_DEFS = [
  { id: 'cannons', name: 'Batteriedeck-Pforten erweitern (+2 Geschützplätze)', desc: '+1 Geschützpforte Backbord & Steuerbord', baseCost: 125, costMult: 1.75, max: 6 },
  { id: 'reload', name: 'Geschützdrill & Ladeschützen', desc: 'Verkürzt die Nachladezeit aller Bord- und Bugkanonen um 5%', baseCost: 95, costMult: 1.70, max: 6 },
  { id: 'damage', name: 'Pulverkammer & Richtkeile optimieren', desc: '+3% Zusatzschaden & +4% Reichweite', baseCost: 110, costMult: 1.75, max: 5 },
  { id: 'sails', name: 'Verstärkte Royal-Takelage', desc: '+30 Max. Segel-HP & +3.5% Höchstgeschwindigkeit', baseCost: 90, costMult: 1.65, max: 6 },
  { id: 'hull', name: 'Eichenspanten & Kupferbeplankung', desc: '+65 Max. Rumpf-HP & höhere Rammstoß-Wucht', baseCost: 105, costMult: 1.65, max: 8 },
  { id: 'cargo', name: 'Frachtraum & Quartiere erweitern', desc: '+14 Frachtraum & +6 Max. Besatzung', baseCost: 90, costMult: 1.60, max: 6 }
];

const GHOST_ENCLAVE_UPGRADES = [
  { id: 'ghost_hull', name: '👻 Ektoplasma-Moderplanken', baseCost: 750, costMult: 1.8, max: 3, desc: '+140 Max. Rumpf-HP pro Stufe, regeneriert nachts Rumpf & -35% Sturmschaden!' },
  { id: 'ghost_sails', name: '👻 Nebelschleier-Fetzensegel', baseCost: 680, costMult: 1.8, max: 3, desc: '+10% Gegenwind-Tempo & Geisterschimmer!' }
];

// ============================================================================
// FREIE KÜSTEN-BAUPLÄTZE & GEBÄUDE (Deutlich gesenkter Tages-Upkeep!)
// ============================================================================
const BASE_FOUNDING_REQ = {
  gold: 550,
  timber: 18,
  canvas: 8,
  food: 6,
  requiredRoles: ['master_builder', 'shipwright', 'carpenter']
};

const BASE_PLOTS = [
  { id: 'bp_skull_cove', x: 12840, y: 3680, name: 'Schädelbucht (Nord-Bahamas)', name_en: 'Skull Cove (North Bahamas)' },
  { id: 'bp_bimini', x: 10820, y: 3180, name: 'Westbucht von Bimini', name_en: 'West Bimini Cove' },
  { id: 'bp_abaco_north', x: 13880, y: 1980, name: 'Sturmklippe von Abaco', name_en: 'Abaco Storm Bluff' },
  { id: 'bp_florida_bay', x: 5250, y: 2650, name: 'Mangroven-Ankerplatz Florida', name_en: 'Florida Mangrove Anchorage' },
  { id: 'bp_cape_sable', x: 6780, y: 3920, name: 'Kap-Sable-Lagune', name_en: 'Cape Sable Lagoon' },
  { id: 'bp_cuba_west', x: 6320, y: 6380, name: 'Schmugglerbucht Cabo San Antonio', name_en: 'San Antonio Smuggler Bay' },
  { id: 'bp_cuba_north', x: 10250, y: 6350, name: 'Korallen-Atoll Cayo Romano', name_en: 'Cayo Romano Atoll' },
  { id: 'bp_guantanamo', x: 12450, y: 7750, name: 'Verborgene Ostbucht Kubas', name_en: 'Hidden East Cuba Bay' },
  { id: 'bp_cayman_brac', x: 7520, y: 9520, name: 'Schildkröten-Strand (Cayman)', name_en: 'Turtle Strand (Cayman)' },
  { id: 'bp_blue_lagoon', x: 11280, y: 10680, name: 'Blaue Lagune (Ost-Jamaika)', name_en: 'Blue Lagoon (East Jamaica)' },
  { id: 'bp_gonave', x: 14650, y: 7740, name: 'Nordkap von Hispaniola', name_en: 'North Hispaniola Cape' },
  { id: 'bp_turks_caicos', x: 16120, y: 4720, name: 'Salzbank der Turks-Inseln', name_en: 'Turks Salt Cay' },
  { id: 'bp_mona_passage', x: 18240, y: 8920, name: 'Klippenbucht der Mona-Passage', name_en: 'Mona Passage Cove' },
  { id: 'bp_virgin_gorda', x: 18420, y: 12280, name: 'Felsenbäder von Virgin Gorda', name_en: 'Virgin Gorda Baths' },
  { id: 'bp_barbuda', x: 21520, y: 9740, name: 'Riffbucht von Barbuda', name_en: 'Barbuda Reef Bay' },
  { id: 'bp_st_vincent', x: 22120, y: 13850, name: 'Vulkanbucht der Grenadinen', name_en: 'Volcano Cove (Grenadines)' },
  { id: 'bp_barbados_east', x: 22740, y: 16950, name: 'Atlantik-Klippe Ost-Barbados', name_en: 'East Barbados Cliff' },
  { id: 'bp_paria_gulf', x: 20520, y: 19450, name: 'Drachenmaul-Bucht (Trinidad)', name_en: 'Dragon’s Mouth Cove' },
  { id: 'bp_tortuga_salada', x: 17680, y: 19250, name: 'Perlenbank vor Margarita', name_en: 'Margarita Pearl Shoal' },
  { id: 'bp_aruba', x: 13320, y: 18250, name: 'Dünenbucht von Aruba', name_en: 'Aruba Dune Cove' },
  { id: 'bp_honduras_cape', x: 3480, y: 14650, name: 'Korsaren-Flussmündung Honduras', name_en: 'Honduras Corsair Estuary' },
  { id: 'bp_yucatan_north', x: 2250, y: 8780, name: 'Flamingo-Lagune von Yucatán', name_en: 'Yucatán Flamingo Lagoon' }
];

const HIDEOUT_LOCATION = BASE_PLOTS[0];
const HIDEOUT_MAX_POINTS = 18;

const HIDEOUT_BUILDINGS = [
  {
    id: 'warehouse', icon: '📦', name: 'Schmuggler-Kontor & Schatzgewölbe', name_en: 'Smuggler Depot & Vault',
    max: 3, ptsPerLvl: 2, baseCost: 220, buildSecondsPerLvl: 34, upkeepGoldPerLvl: 5,
    outputs: { food: 3, canvas: 1 },
    desc_de: '+45 Depot-/Frachtraum pro Stufe, sichert Lösegeld bei Schiffbruch, empfängt Tribute & liefert Proviant.',
    desc_en: '+45 storage/cargo per level, secures ransom gold, receives tributes & yields provisions.',
    buildAffinities: { master_builder: 1.65, carpenter: 1.50, shipwright: 1.35, quartermaster: 1.25 },
    prodAffinities: { quartermaster: 1.50, merchant: 1.45, cook: 1.15 }
  },
  {
    id: 'tavern', icon: '🍺', name: 'Freibeuter-Schenke & Heuerbüro', name_en: 'Buccaneer Tavern & Recruiting',
    max: 3, ptsPerLvl: 2, baseCost: 250, buildSecondsPerLvl: 38, upkeepGoldPerLvl: 6,
    outputs: { recruits: 3, goldIncome: 48 },
    desc_de: 'Lockt kostenlose Rekruten an, hebt Moral auf 100% und bringt Zech-Einnahmen.',
    desc_en: 'Attracts free recruits, restores 100% morale and generates tavern coin.',
    buildAffinities: { master_builder: 1.60, carpenter: 1.45, quartermaster: 1.20 },
    prodAffinities: { cook: 1.40, quartermaster: 1.35, prize_officer: 1.25 }
  },
  {
    id: 'careenage', icon: '⚓', name: 'Kielhol-Dock & Trockenwerft', name_en: 'Careenage & Drydock',
    max: 3, ptsPerLvl: 3, baseCost: 320, buildSecondsPerLvl: 48, upkeepGoldPerLvl: 10,
    outputs: { canvas: 2 },
    desc_de: 'Kostenlose Flottenreparatur in der Basis, +8% Max-Rumpf/Stufe & fertigt Segeltuch/Tauwerk (⛵).',
    desc_en: 'Free fleet repair at Base, +8% Max Hull/lvl & produces Sailcloth (⛵).',
    buildAffinities: { master_builder: 1.65, shipwright: 1.60, carpenter: 1.55, sailmaker: 1.25 },
    prodAffinities: { shipwright: 1.55, carpenter: 1.45, sailmaker: 1.45 }
  },
  {
    id: 'lumber_camp', icon: '🪵', name: 'Mahagoni-Sägewerk', name_en: 'Mahogany Sawmill',
    max: 3, ptsPerLvl: 2, baseCost: 210, buildSecondsPerLvl: 32, upkeepGoldPerLvl: 7,
    outputs: { timber: 4 },
    desc_de: 'Schlägt Mahagoni- & Schiffsholz (🪵) für Rumpfreparaturen auf hoher See und den Export.',
    desc_en: 'Produces Mahogany & Ship Timber (🪵) for sea hull repairs and trade.',
    buildAffinities: { master_builder: 1.65, carpenter: 1.60, shipwright: 1.40 },
    prodAffinities: { carpenter: 1.55, master_builder: 1.40, shipwright: 1.35 }
  },
  {
    id: 'rum_distillery', icon: '🍾', name: 'Zuckerrohr-Plantage & Rum-Brennerei', name_en: 'Cane Plantation & Rum Distillery',
    max: 3, ptsPerLvl: 3, baseCost: 290, buildSecondsPerLvl: 42, upkeepGoldPerLvl: 11,
    outputs: { rum: 4, sugar: 3 },
    desc_de: 'Brennt feinsten Karibik-Rum für die Crew-Moral und erzeugt Rohrzucker für den Export.',
    desc_en: 'Distills Caribbean Rum and harvests Cane Sugar for export.',
    buildAffinities: { master_builder: 1.55, carpenter: 1.40, cook: 1.20 },
    prodAffinities: { cook: 1.55, merchant: 1.35, quartermaster: 1.20 }
  },
  {
    id: 'herb_garden', icon: '🍋', name: 'Kräuter- & Limettenhain', name_en: 'Medicinal Herb & Lime Grove',
    max: 3, ptsPerLvl: 2, baseCost: 240, buildSecondsPerLvl: 32, upkeepGoldPerLvl: 8,
    outputs: { medicine: 3, spices: 2 },
    desc_de: 'Erwirtschaftet Limetten/Heilkräuter gegen Seuchen sowie wertvolle Gewürze.',
    desc_en: 'Produces Limes/Medicinal Herbs against scurvy plus valuable Spices.',
    buildAffinities: { master_builder: 1.50, carpenter: 1.35, surgeon: 1.25 },
    prodAffinities: { surgeon: 1.60, barber: 1.40, cook: 1.35, priest: 1.20 }
  },
  {
    id: 'powder_mill', icon: '💣', name: 'Geschützgießerei & Waffenwerkstatt', name_en: 'Cannon Foundry & Gunsmith',
    max: 3, ptsPerLvl: 3, baseCost: 390, buildSecondsPerLvl: 50, upkeepGoldPerLvl: 15,
    outputs: { cannon_6pdr: 1 },
    desc_de: 'Gießt eigene Kanonen (6-Pfünder, ab Stufe 3 auch 12-Pfünder) für deine Flotte oder zum Verkauf!',
    desc_en: 'Casts naval cannons (6-pdr, plus 12-pdr at Lvl 3) for your fleet or export!',
    buildAffinities: { master_builder: 1.65, shipwright: 1.45, carpenter: 1.40, gunner: 1.35 },
    prodAffinities: { gunner: 1.65, sharpshooter: 1.40, master_builder: 1.30, shipwright: 1.25 }
  },
  {
    id: 'tobacco_coffee_estate', icon: '☕', name: 'Hochland-Kaffee & Tabakgut', name_en: 'Highland Coffee & Tobacco Estate',
    max: 3, ptsPerLvl: 3, baseCost: 320, buildSecondsPerLvl: 44, upkeepGoldPerLvl: 12,
    outputs: { coffee: 2, tobacco: 2 },
    desc_de: 'Erwirtschaftet edlen Hochland-Kaffee und Havanna-Tabak für lukrative Handelsfahrten.',
    desc_en: 'Produces fine Caribbean Coffee and Tobacco for lucrative trade runs.',
    buildAffinities: { master_builder: 1.55, carpenter: 1.40, merchant: 1.25 },
    prodAffinities: { merchant: 1.60, quartermaster: 1.35, priest: 1.10 }
  },
  {
    id: 'coastal_fort', icon: '🏰', name: 'Küstenbatterie & Sternbastion', name_en: 'Coastal Battery & Star Bastion',
    max: 3, ptsPerLvl: 3, baseCost: 360, buildSecondsPerLvl: 46, upkeepGoldPerLvl: 9,
    outputs: {},
    desc_de: 'Feuert automatisch schwere Salven auf feindliche Schiffe, Kopfgeldjäger & Seemonster vor deiner Kolonie (+650 Bastions-HP & mehr Reichweite/Schaden pro Stufe)!',
    desc_en: 'Automatically fires heavy salvos at hostile ships, bounty hunters & sea monsters near your colony (+650 Bastion HP & range/damage per level)!',
    buildAffinities: { master_builder: 1.75, gunner: 1.40, carpenter: 1.45, shipwright: 1.30 },
    prodAffinities: { gunner: 1.65, sharpshooter: 1.45, prize_officer: 1.25 }
  }
];

const GHOST_ENCLAVE = {
  id: 'ghost_enclave', x: 22350, y: 1950,
  name: 'Geisterpiraten-Enklave "Nebelwrack"', name_en: 'Ghost Pirate Enclave "Mistwreck"',
  reqMaxReputation: -85
};

// Geheimer Game-Testing-Schrein (erscheint südöstlich vor Nassau, wenn der Kapitän "wololo" heißt!)
const WOLOLO_SHRINE = {
  id: 'wololo_shrine',
  x: 12080,
  y: 4720,
  name: 'Schrein von Wololo (Test-Arsenal)',
  name_en: 'Shrine of Wololo (Test Arsenal)'
};

const MYTH_STORM_BARRIER = [
  { x: 18400, y: 150,  r: 1020, intensity: 1.65, label_de: 'Nordrand-Mahlstrom', label_en: 'North-Edge Maelstrom' },
  { x: 18650, y: 1450, r: 1020, intensity: 1.65, label_de: 'Äußerer Mahlstrom-Wall', label_en: 'Outer Maelstrom Wall' },
  { x: 19250, y: 2700, r: 1020, intensity: 1.70, label_de: 'Heulende Seelenfront', label_en: 'Howling Soul-Front' },
  { x: 20250, y: 3800, r: 1020, intensity: 1.65, label_de: 'Südlicher Nebelorkan', label_en: 'Southern Mist Hurricane' },
  { x: 21550, y: 4550, r: 1020, intensity: 1.65, label_de: 'Klippensturm der Verdammten', label_en: 'Damned Shoal Tempest' },
  { x: 22950, y: 4950, r: 1040, intensity: 1.65, label_de: 'Ostwall des Abgrunds', label_en: 'Eastern Abyssal Squall' },
  { x: 23950, y: 5050, r: 1050, intensity: 1.70, label_de: 'Ostrand-Todesfront', label_en: 'East-Edge Death Squall' },
  { x: 19950, y: 200,  r: 960, intensity: 2.05, label_de: 'Nordklippen-Knochenbrecher', label_en: 'North-Cliff Bonecrusher' },
  { x: 20250, y: 1550, r: 960, intensity: 2.05, label_de: 'Innerer Knochenbrecher-Orkan', label_en: 'Inner Bonecrusher Typhoon' },
  { x: 20950, y: 2750, r: 960, intensity: 2.10, label_de: 'Auge des Grünen Blitzes', label_en: 'Eye of the Green Lightning' },
  { x: 22150, y: 3550, r: 960, intensity: 2.05, label_de: 'Schlund von Davy Jones', label_en: 'Maw of Davy Jones' },
  { x: 23650, y: 3750, r: 1020, intensity: 2.05, label_de: 'Ostschlund der Verdammnis', label_en: 'Eastern Maw of Doom' }
];

const LANDMASSES = [
  { name: 'Yucatán & Mittelamerika', pts: [[0, 8400], [1500, 8500], [2500, 8900], [3360, 9900], [3520, 10900], [2960, 12200], [2840, 13500], [3500, 15000], [3960, 16700], [4700, 18500], [5500, 20300], [5900, 21700], [0, 24000]] },
  { name: 'Neugranada & Südamerika', pts: [[0, 21600], [3900, 21200], [6300, 20600], [8200, 20440], [10500, 20300], [12900, 20760], [14500, 20300], [16700, 21100], [19300, 21440], [22200, 21960], [24000, 22600], [24000, 24000], [0, 24000]] },
  { name: 'Halbinsel Florida', pts: [[3600, 0], [7300, 0], [7560, 1500], [7640, 2700], [7040, 3840], [6240, 4040], [5560, 3500], [5100, 2360], [4300, 1200]] },
  { name: 'Kuba', pts: [[6100, 6440], [7100, 5960], [8500, 5920], [9900, 6240], [11300, 6720], [12560, 7360], [12240, 8160], [11040, 8240], [9760, 7700], [8400, 7520], [6960, 7360], [6240, 6960]] },
  { name: 'Jamaika', pts: [[9300, 10700], [9960, 10400], [10960, 10440], [11440, 10900], [11160, 11360], [10200, 11440], [9440, 11240]] },
  { name: 'Hispaniola', pts: [[13700, 8100], [14700, 7720], [15960, 7680], [16960, 8160], [17240, 8840], [16300, 9360], [15240, 9480], [14240, 9240], [13720, 8760]] },
  { name: 'Tortuga', pts: [[14320, 6560], [14900, 6340], [15520, 6440], [15640, 6880], [15040, 7060], [14400, 6960]] },
  { name: 'Bahamas (Nassau)', pts: [[10700, 3100], [11500, 2760], [12360, 2900], [12680, 3520], [12240, 4020], [11360, 4060], [10760, 3700]] },
  { name: 'Eleuthera & Abaco (Nord-Bahamas)', pts: [[13200, 2100], [13950, 1950], [14400, 2400], [14100, 2950], [13350, 2750]] },
  { name: 'Inagua & Turks-Inseln', pts: [[15200, 4600], [15850, 4450], [16250, 4850], [15950, 5300], [15300, 5150]] },
  { name: 'Cayman-Inseln', pts: [[7400, 9600], [7950, 9450], [8250, 9850], [7850, 10150], [7350, 9950]] },
  { name: 'Puerto Rico', pts: [[18200, 8680], [19040, 8460], [19760, 8560], [19960, 9040], [19560, 9440], [18640, 9420], [18160, 9120]] },
  { name: 'St. Kitts & Antigua', pts: [[20900, 9900], [21500, 9680], [21960, 10100], [21840, 10900], [21300, 11120], [20800, 10700]] },
  { name: 'Guadeloupe & Dominica', pts: [[21200, 11600], [21800, 11450], [22150, 11900], [21950, 12450], [21350, 12350]] },
  { name: 'Martinique & St. Lucia', pts: [[21100, 13040], [21760, 12880], [22240, 13360], [22120, 14240], [21560, 14520], [21000, 14080]] },
  { name: 'Barbados', pts: [[21600, 16480], [22300, 16260], [22840, 16640], [22700, 17360], [22040, 17520], [21520, 17120]] },
  { name: 'Trinidad & Tobago', pts: [[20400, 19200], [21300, 18950], [21850, 19450], [21600, 20250], [20650, 20150]] },
  { name: 'Margarita-Insel', pts: [[17600, 19100], [18350, 18900], [18750, 19350], [18400, 19750], [17700, 19600]] },
  { name: 'Curaçao & Bonaire', pts: [[13300, 18080], [14040, 17860], [14720, 18100], [14760, 18720], [14100, 18960], [13320, 18700]] },
  { name: 'Providencia & San Andrés', pts: [[5600, 15200], [6150, 15000], [6450, 15450], [6100, 15900], [5550, 15700]] },
  { name: 'Nieuw Zeelandia', pts: [[11200, 14200], [11950, 13950], [12480, 14320], [12320, 14920], [11550, 15020], [11080, 14650]] },
  { name: 'Oranje-Riff & Sint Eustatius Süd', pts: [[14850, 13150], [15450, 12980], [15850, 13350], [15650, 13820], [14980, 13780]] },
  { name: 'Sankt-Thomas-Bank', pts: [[17400, 11850], [18080, 11650], [18520, 12050], [18320, 12580], [17550, 12520]] },
  { name: 'Christiansø & Nordisches Riff', pts: [[16750, 15450], [17480, 15220], [17920, 15650], [17680, 16220], [16920, 16150]] },
  { name: 'Schatten-Mangroven von Damballah', pts: [[9150, 15450], [9750, 15280], [10080, 15680], [9820, 16120], [9220, 16020]] },
  { name: 'Nebelwrack-Felsen', isGhostIsle: true, pts: [[22150, 1350], [22750, 1300], [23000, 1750], [22650, 2050], [22050, 1850]] }
];

// Kompaktes Insel-Labyrinth für den Deathmatch-Modus (4800x4800)
const DM_ARENA_ISLANDS = [
  { name: 'Zentral-Bastion (Safe-Zone)', pts: [[2180, 2050], [2550, 1980], [2680, 2240], [2480, 2440], [2160, 2360]] },
  { name: 'Nordwest-Atoll', pts: [[780, 820], [1180, 740], [1340, 1080], [980, 1260], [720, 1050]] },
  { name: 'Scharfschützen-Klippe', pts: [[3420, 780], [3880, 720], [4040, 1120], [3620, 1280], [3360, 1040]] },
  { name: 'Knochenriff-Insel', pts: [[1380, 1820], [1680, 1740], [1760, 2040], [1480, 2140]] },
  { name: 'Pulver-Eiland', pts: [[3080, 1780], [3420, 1720], [3520, 2060], [3160, 2160]] },
  { name: 'Südwest-Lagune', pts: [[820, 3420], [1280, 3300], [1460, 3720], [1020, 3920], [740, 3680]] },
  { name: 'Korsaren-Felsen', pts: [[2150, 3380], [2580, 3320], [2680, 3660], [2240, 3760]] },
  { name: 'Südost-Archipel', pts: [[3480, 3360], [3980, 3280], [4120, 3740], [3640, 3940], [3380, 3650]] },
  { name: 'Nord-Sandbank', pts: [[2180, 680], [2560, 640], [2640, 880], [2240, 920]] }
];

const DM_ARENA_REEFS = [
  { id: 'dm_r1', x: 1750, y: 1280, rx: 145, ry: 65, angle: 0.4 },
  { id: 'dm_r2', x: 2950, y: 1320, rx: 155, ry: 68, angle: -0.35 },
  { id: 'dm_r3', x: 1120, y: 2560, rx: 160, ry: 70, angle: 0.25 },
  { id: 'dm_r4', x: 3680, y: 2580, rx: 165, ry: 72, angle: -0.45 },
  { id: 'dm_r5', x: 1820, y: 3020, rx: 140, ry: 62, angle: -0.2 },
  { id: 'dm_r6', x: 2980, y: 2960, rx: 150, ry: 66, angle: 0.52 }
];

// Alle 30 Häfen (ohne 'weapons' in Exports/Imports + niedrigere Rekrutenpreise!)
const PORTS = [
  { id: 'nassau', name: 'Nassau', faction: 'pirates', x: 11600, y: 4300, crewCost: 4, hasLighthouse: true, exports: ['rum', 'timber', 'canvas'], imports: ['silk', 'silver', 'coffee'], fortHp: 2400, maxFortHp: 2400, fortDmg: 46, fortCooldown: 0 },
  { id: 'tortuga', name: 'Tortuga', faction: 'pirates', x: 14900, y: 6100, crewCost: 4, hasLighthouse: false, exports: ['rum', 'food', 'canvas'], imports: ['spices', 'sugar', 'indigo'], fortHp: 2400, maxFortHp: 2400, fortDmg: 46, fortCooldown: 0 },
  { id: 'providencia', name: 'Old Providence', faction: 'pirates', x: 6550, y: 15450, crewCost: 4, hasLighthouse: false, exports: ['rum', 'timber', 'medicine'], imports: ['silver', 'silk', 'tobacco'], fortHp: 2250, maxFortHp: 2250, fortDmg: 44, fortCooldown: 0 },
  { id: 'inagua', name: 'Great Inagua', faction: 'pirates', x: 15100, y: 4950, crewCost: 4, hasLighthouse: false, exports: ['food', 'canvas', 'timber'], imports: ['rum', 'silver', 'spices'], fortHp: 2200, maxFortHp: 2200, fortDmg: 44, fortCooldown: 0 },
  { id: 'havanna', name: 'Havanna', faction: 'spain', x: 7700, y: 5600, crewCost: 6, hasLighthouse: true, exports: ['tobacco', 'sugar', 'food', 'cannon_12pdr'], imports: ['spices', 'silk', 'canvas'], fortHp: 3800, maxFortHp: 3800, fortDmg: 54, fortCooldown: 0 },
  { id: 'santiago', name: 'Santiago de Cuba', faction: 'spain', x: 11500, y: 8600, crewCost: 5, hasLighthouse: false, exports: ['sugar', 'tobacco', 'medicine'], imports: ['silver', 'silk', 'timber'], fortHp: 3100, maxFortHp: 3100, fortDmg: 48, fortCooldown: 0 },
  { id: 'trinidad_cuba', name: 'Trinidad (WIC-Kontor)', faction: 'netherlands', x: 9200, y: 7950, crewCost: 5, hasLighthouse: false, exports: ['sugar', 'tobacco', 'canvas'], imports: ['rum', 'spices', 'indigo'], fortHp: 2800, maxFortHp: 2800, fortDmg: 46, fortCooldown: 0 },
  { id: 'staugustine', name: 'San Agustín (Florida)', faction: 'spain', x: 7750, y: 2600, crewCost: 5, hasLighthouse: false, exports: ['timber', 'food', 'cotton'], imports: ['sugar', 'rum', 'silver'], fortHp: 2950, maxFortHp: 2950, fortDmg: 48, fortCooldown: 0 },
  { id: 'campeche', name: 'Campeche', faction: 'spain', x: 3900, y: 11000, crewCost: 5, hasLighthouse: false, exports: ['timber', 'medicine', 'silver'], imports: ['rum', 'silk', 'cotton'], fortHp: 3200, maxFortHp: 3200, fortDmg: 50, fortCooldown: 0 },
  { id: 'portobelo', name: 'Portobelo (Panama)', faction: 'spain', x: 5850, y: 19800, crewCost: 6, hasLighthouse: true, exports: ['silver', 'spices', 'coffee'], imports: ['rum', 'silk', 'timber'], fortHp: 3900, maxFortHp: 3900, fortDmg: 55, fortCooldown: 0 },
  { id: 'cartagena', name: 'Cartagena', faction: 'spain', x: 7600, y: 20100, crewCost: 6, hasLighthouse: true, exports: ['silver', 'coffee', 'spices', 'cannon_18pdr'], imports: ['silk', 'tobacco', 'canvas'], fortHp: 4200, maxFortHp: 4200, fortDmg: 58, fortCooldown: 0 },
  { id: 'maracaibo', name: 'Maracaibo', faction: 'france', x: 13900, y: 19400, crewCost: 5, hasLighthouse: false, exports: ['coffee', 'silk', 'food'], imports: ['rum', 'silver', 'indigo'], fortHp: 3100, maxFortHp: 3100, fortDmg: 48, fortCooldown: 0 },
  { id: 'sanjuan', name: 'San Juan (Westindien)', faction: 'denmark', x: 19100, y: 8250, crewCost: 5, hasLighthouse: true, exports: ['sugar', 'rum', 'timber'], imports: ['silver', 'canvas', 'silk'], fortHp: 3400, maxFortHp: 3400, fortDmg: 50, fortCooldown: 0 },
  { id: 'santodomingo', name: 'Santo Domingo', faction: 'spain', x: 16200, y: 9650, crewCost: 5, hasLighthouse: true, exports: ['sugar', 'tobacco', 'indigo'], imports: ['spices', 'silver', 'canvas'], fortHp: 3400, maxFortHp: 3400, fortDmg: 50, fortCooldown: 0 },
  { id: 'portroyal', name: 'Port Royal (Kingston)', faction: 'england', x: 10300, y: 11700, crewCost: 6, hasLighthouse: true, exports: ['rum', 'canvas', 'cannon_18pdr'], imports: ['sugar', 'silver', 'tobacco'], fortHp: 3900, maxFortHp: 3900, fortDmg: 55, fortCooldown: 0 },
  { id: 'cayman', name: 'Grand Cayman', faction: 'england', x: 8350, y: 9800, crewCost: 5, hasLighthouse: false, exports: ['food', 'timber', 'medicine'], imports: ['rum', 'silk', 'sugar'], fortHp: 2650, maxFortHp: 2650, fortDmg: 45, fortCooldown: 0 },
  { id: 'eleuthera', name: 'Governor’s Harbour', faction: 'england', x: 14550, y: 2500, crewCost: 5, hasLighthouse: false, exports: ['cotton', 'timber', 'food'], imports: ['rum', 'spices', 'coffee'], fortHp: 2750, maxFortHp: 2750, fortDmg: 46, fortCooldown: 0 },
  { id: 'stkitts', name: 'St. Kitts', faction: 'england', x: 20500, y: 10400, crewCost: 5, hasLighthouse: false, exports: ['sugar', 'cotton', 'indigo'], imports: ['rum', 'silver', 'timber'], fortHp: 2950, maxFortHp: 2950, fortDmg: 48, fortCooldown: 0 },
  { id: 'antigua', name: 'English Harbour (Antigua)', faction: 'england', x: 22150, y: 10500, crewCost: 6, hasLighthouse: true, exports: ['canvas', 'rum', 'cannon_32pdr'], imports: ['sugar', 'tobacco', 'silver'], fortHp: 3650, maxFortHp: 3650, fortDmg: 54, fortCooldown: 0 },
  { id: 'bridgetown', name: 'Bridgetown (Barbados)', faction: 'england', x: 21200, y: 16900, crewCost: 5, hasLighthouse: true, exports: ['sugar', 'medicine', 'food'], imports: ['spices', 'silver', 'tobacco'], fortHp: 3450, maxFortHp: 3450, fortDmg: 52, fortCooldown: 0 },
  { id: 'portauprince', name: 'Port-au-Prince', faction: 'france', x: 13500, y: 8600, crewCost: 5, hasLighthouse: true, exports: ['silk', 'indigo', 'food', 'cannon_12pdr'], imports: ['tobacco', 'silver', 'cotton'], fortHp: 3400, maxFortHp: 3400, fortDmg: 50, fortCooldown: 0 },
  { id: 'leogane', name: 'Léogâne', faction: 'france', x: 14500, y: 9600, crewCost: 5, hasLighthouse: false, exports: ['coffee', 'sugar', 'silk'], imports: ['timber', 'spices', 'rum'], fortHp: 2900, maxFortHp: 2900, fortDmg: 47, fortCooldown: 0 },
  { id: 'guadeloupe', name: 'Basse-Terre (Guadeloupe)', faction: 'france', x: 20950, y: 12000, crewCost: 5, hasLighthouse: false, exports: ['sugar', 'coffee', 'indigo'], imports: ['rum', 'canvas', 'silver'], fortHp: 3200, maxFortHp: 3200, fortDmg: 49, fortCooldown: 0 },
  { id: 'martinique', name: 'Fort-de-France', faction: 'france', x: 20700, y: 13600, crewCost: 6, hasLighthouse: true, exports: ['coffee', 'medicine', 'spices', 'cannon_18pdr'], imports: ['rum', 'silver', 'timber'], fortHp: 3500, maxFortHp: 3500, fortDmg: 52, fortCooldown: 0 },
  { id: 'stlucia', name: 'Castries (St. Lucia)', faction: 'france', x: 20850, y: 14650, crewCost: 5, hasLighthouse: false, exports: ['timber', 'spices', 'food'], imports: ['silk', 'canvas', 'silver'], fortHp: 2850, maxFortHp: 2850, fortDmg: 46, fortCooldown: 0 },
  { id: 'willemstad', name: 'Willemstad (Curaçao)', faction: 'netherlands', x: 14050, y: 17750, crewCost: 5, hasLighthouse: true, exports: ['spices', 'canvas', 'silk', 'cannon_18pdr'], imports: ['tobacco', 'sugar', 'silver'], fortHp: 3550, maxFortHp: 3550, fortDmg: 52, fortCooldown: 0 },
  { id: 'nieuw_middelburg', name: 'Nieuw Middelburg', faction: 'netherlands', x: 11850, y: 13850, crewCost: 5, hasLighthouse: true, exports: ['canvas', 'indigo', 'cannon_12pdr'], imports: ['coffee', 'silver', 'rum'], fortHp: 3300, maxFortHp: 3300, fortDmg: 50, fortCooldown: 0 },
  { id: 'oranjestad_reef', name: 'Fort Oranje (Zentral-Atoll)', faction: 'netherlands', x: 15350, y: 12880, crewCost: 5, hasLighthouse: false, exports: ['cotton', 'canvas', 'spices'], imports: ['timber', 'coffee', 'sugar'], fortHp: 3050, maxFortHp: 3050, fortDmg: 48, fortCooldown: 0 },
  { id: 'charlotte_amalie', name: 'Charlotte Amalie (St. Thomas)', faction: 'denmark', x: 17950, y: 11550, crewCost: 5, hasLighthouse: true, exports: ['rum', 'timber', 'cannon_18pdr'], imports: ['silk', 'spices', 'silver'], fortHp: 3450, maxFortHp: 3450, fortDmg: 52, fortCooldown: 0 },
  { id: 'christiansvaern', name: 'Christiansværn (Nordisches Riff)', faction: 'denmark', x: 17350, y: 15120, crewCost: 5, hasLighthouse: true, exports: ['timber', 'food', 'canvas', 'cannon_32pdr'], imports: ['coffee', 'tobacco', 'indigo'], fortHp: 3600, maxFortHp: 3600, fortDmg: 54, fortCooldown: 0 }
];

PORTS.forEach(p => { p.defaultFaction = p.faction; });

const CORAL_REEFS = [
  { id: 'reef_1', x: 11200, y: 4950, rx: 175, ry: 76, angle: 0.35 },
  { id: 'reef_2', x: 13550, y: 5550, rx: 205, ry: 86, angle: -0.42 },
  { id: 'reef_3', x: 6550, y: 4650, rx: 215, ry: 88, angle: 0.22 },
  { id: 'reef_4', x: 8900, y: 5250, rx: 185, ry: 72, angle: -0.18 },
  { id: 'reef_5', x: 12950, y: 7650, rx: 190, ry: 76, angle: 0.65 },
  { id: 'reef_6', x: 9650, y: 9650, rx: 210, ry: 85, angle: -0.55 },
  { id: 'reef_7', x: 11850, y: 11250, rx: 180, ry: 78, angle: 0.40 },
  { id: 'reef_8', x: 15600, y: 6950, rx: 165, ry: 68, angle: 0.15 },
  { id: 'reef_9', x: 17650, y: 8650, rx: 195, ry: 80, angle: -0.35 },
  { id: 'reef_10', x: 20250, y: 9450, rx: 190, ry: 76, angle: 0.52 },
  { id: 'reef_11', x: 20450, y: 12750, rx: 180, ry: 78, angle: -0.60 },
  { id: 'reef_12', x: 21150, y: 15650, rx: 200, ry: 82, angle: 0.28 },
  { id: 'reef_13', x: 19250, y: 18450, rx: 215, ry: 88, angle: -0.25 },
  { id: 'reef_14', x: 15350, y: 18350, rx: 190, ry: 78, angle: 0.45 },
  { id: 'reef_15', x: 11500, y: 19250, rx: 220, ry: 86, angle: -0.15 },
  { id: 'reef_16', x: 6850, y: 18950, rx: 180, ry: 74, angle: 0.38 },
  { id: 'reef_17', x: 4650, y: 13850, rx: 210, ry: 84, angle: -0.48 },
  { id: 'reef_18', x: 21250, y: 2450, rx: 180, ry: 76, angle: 0.62 }
];

const FISHING_VILLAGES = [
  { id: 'fv_abaco', name: 'Fischerdorf Abaco-Bucht', x: 13100, y: 2450, crewAvail: 4, maxCrewAvail: 6, crewCost: 3, foodStock: 14, foodPrice: 7, raidCooldown: 0 },
  { id: 'fv_cat_island', name: 'Fischerdorf Cat Island', x: 10550, y: 3450, crewAvail: 4, maxCrewAvail: 6, crewCost: 3, foodStock: 12, foodPrice: 7, raidCooldown: 0 },
  { id: 'fv_fl_keys', name: 'Muschelfischer der Keys', x: 6050, y: 4180, crewAvail: 5, maxCrewAvail: 6, crewCost: 3, foodStock: 15, foodPrice: 8, raidCooldown: 0 },
  { id: 'fv_pines', name: 'Langustendorf Isla de Pinos', x: 6000, y: 6750, crewAvail: 5, maxCrewAvail: 6, crewCost: 3, foodStock: 16, foodPrice: 7, raidCooldown: 0 },
  { id: 'fv_negril', name: 'Fischerhütten von Negril', x: 9150, y: 11050, crewAvail: 4, maxCrewAvail: 6, crewCost: 3, foodStock: 14, foodPrice: 7, raidCooldown: 0 },
  { id: 'fv_samana', name: 'Perlenfischer von Samaná', x: 17150, y: 8050, crewAvail: 4, maxCrewAvail: 6, crewCost: 3, foodStock: 12, foodPrice: 8, raidCooldown: 0 },
  { id: 'fv_cozumel', name: 'Küstendorf Cozumel', x: 3550, y: 9700, crewAvail: 5, maxCrewAvail: 6, crewCost: 3, foodStock: 18, foodPrice: 7, raidCooldown: 0 },
  { id: 'fv_bonaire', name: 'Salzfischer von Bonaire', x: 14900, y: 18450, crewAvail: 4, maxCrewAvail: 6, crewCost: 3, foodStock: 13, foodPrice: 8, raidCooldown: 0 },
  { id: 'fv_tobago', name: 'Bucht von Tobago', x: 21950, y: 19200, crewAvail: 4, maxCrewAvail: 6, crewCost: 3, foodStock: 15, foodPrice: 7, raidCooldown: 0 },
  { id: 'fv_dominica', name: 'Krabbenfischer von Dominica', x: 22300, y: 12200, crewAvail: 4, maxCrewAvail: 6, crewCost: 3, foodStock: 14, foodPrice: 7, raidCooldown: 0 },
  { id: 'fv_voodoo_bayou', isVoodooVillage: true, name: 'Pfahlbaudorf Bois-Caïman (Nebelmoor)', name_en: 'Stilt Village of Bois-Caïman', x: 9550, y: 15180, crewAvail: 5, maxCrewAvail: 6, crewCost: 3, foodStock: 16, foodPrice: 7, raidCooldown: 0 }
];

const EXPLORATION_SITES = [
  { id: 'site_florida', name: 'Schiffbruch-Bucht von Florida', x: 6300, y: 4200, mapBought: false, discovered: false, looted: false, riskLevel: 1, landmark1: 'twin_palms', landmark2: 'skull_arch', gold: 480, goodId: 'silver', goodAmt: 6, desc: 'Ein auf messerscharfen Korallen aufgelaufenes Schatzschiff der Silberflotte von 1714.' },
  { id: 'site_yucatan', name: 'Versunkener Maya-Tempel von Tulum', x: 3160, y: 12500, mapBought: false, discovered: false, looted: false, riskLevel: 3, landmark1: 'obsidian_monolith', landmark2: 'waterfall_cave', gold: 1080, goodId: 'silver', goodAmt: 14, desc: 'Überwucherte Stufenpyramiden im tiefen Dschungel.' },
  { id: 'site_cuba', name: 'Schmugglerhöhle der Isla de la Juventud', x: 6900, y: 7640, mapBought: false, discovered: false, looted: false, riskLevel: 2, landmark1: 'cannon_wreck', landmark2: 'bat_cenote', gold: 620, goodId: 'tobacco', goodAmt: 10, desc: 'Versteckte Kalksteinhöhle mit alten Pulverfallen am Eingang.' },
  { id: 'site_hispaniola', name: 'Verlassene Geister-Plantage', x: 17100, y: 9200, mapBought: false, discovered: false, looted: false, riskLevel: 1, landmark1: 'twin_palms', landmark2: 'bat_cenote', gold: 490, goodId: 'medicine', goodAmt: 12, desc: 'Alte Vorratslager voller Heilkräuter und versteckter Dublonen.' },
  { id: 'site_curacao', name: 'Totenkopf-Lagune vor Curaçao', x: 13160, y: 18400, mapBought: false, discovered: false, looted: false, riskLevel: 2, landmark1: 'cannon_wreck', landmark2: 'skull_arch', gold: 790, goodId: 'silver', goodAmt: 10, desc: 'Verborgenes Piratenversteck hinter scharfen Riffen.' },
  { id: 'site_darien', name: 'Goldgrube von Darién', x: 5100, y: 19100, mapBought: false, discovered: false, looted: false, riskLevel: 3, landmark1: 'obsidian_monolith', landmark2: 'skull_arch', gold: 1180, goodId: 'silver', goodAmt: 15, desc: 'Aufgegebene spanische Goldmine tief im Dschungel Panamas.' },
  { id: 'site_mosquito', name: 'Totensümpfe der Moskitoküste', x: 3700, y: 15700, mapBought: false, discovered: false, looted: false, riskLevel: 2, landmark1: 'twin_palms', landmark2: 'waterfall_cave', gold: 680, goodId: 'spices', goodAmt: 11, desc: 'Mangroven-Labyrinth mit einer versunkenen Kriegskasse.' },
  { id: 'site_trin', name: 'Orinoco-Schlucht', x: 19700, y: 21000, mapBought: false, discovered: false, looted: false, riskLevel: 3, landmark1: 'obsidian_monolith', landmark2: 'bat_cenote', gold: 1220, goodId: 'silk', goodAmt: 15, desc: 'Ein sagenhafter Schatz am südlichen Rand der Karibik.' },
  { id: 'site_puertorico', name: 'Katakomben von San Juan', x: 19300, y: 9520, mapBought: false, discovered: false, looted: false, riskLevel: 2, landmark1: 'cannon_wreck', landmark2: 'waterfall_cave', gold: 640, goodId: 'indigo', goodAmt: 9, desc: 'Alte Küstenbefestigung mit vermauerten Schatzkammern.' },
  { id: 'site_jamaica', name: 'Blutbucht von Montego', x: 9440, y: 10440, mapBought: false, discovered: false, looted: false, riskLevel: 1, landmark1: 'cannon_wreck', landmark2: 'skull_arch', gold: 460, goodId: 'rum', goodAmt: 12, desc: 'Altes Schmugglerlager an der Nordküste Jamaikas.' },
  { id: 'site_antigua', name: 'Wrack der Royal Sovereign', x: 21960, y: 10600, mapBought: false, discovered: false, looted: false, riskLevel: 2, landmark1: 'twin_palms', landmark2: 'waterfall_cave', gold: 740, goodId: 'silver', goodAmt: 11, desc: 'Das halb gesunkene Flaggschiff eines Gouverneurs.' },
  { id: 'site_keywest', name: 'Teufelsriff der Florida Keys', x: 5440, y: 3700, mapBought: false, discovered: false, looted: false, riskLevel: 2, landmark1: 'cannon_wreck', landmark2: 'bat_cenote', gold: 660, goodId: 'indigo', goodAmt: 10, desc: 'Tückische Sandbänke voller Schiffswracks.' },
  { id: 'site_trinidad_isle', name: 'Pechsee von La Brea (Trinidad)', x: 20450, y: 19850, mapBought: false, discovered: false, looted: false, riskLevel: 2, landmark1: 'obsidian_monolith', landmark2: 'skull_arch', gold: 820, goodId: 'silver', goodAmt: 12, desc: 'Versunkene Schatztruhen am Rand des schwarzen Asphaltsees.' },
  { id: 'site_margarita', name: 'Perlenbucht der Isla Margarita', x: 17850, y: 18850, mapBought: false, discovered: false, looted: false, riskLevel: 3, landmark1: 'twin_palms', landmark2: 'bat_cenote', gold: 1120, goodId: 'silk', goodAmt: 14, desc: 'Ein geheimes Perlen- und Silberdepot der Krone.' }
];

const AMMO_TYPES = {
  round: { id: 'round', name: 'Vollkugeln', hullMult: 1.0, sailMult: 0.2, crewMult: 0.15, speed: 8.0, life: 115, pellets: 1, spread: 0.03, reloadScale: 1.0 },
  chain: { id: 'chain', name: 'Kettenkugeln', hullMult: 0.25, sailMult: 1.5, crewMult: 0.1, speed: 7.0, life: 102, pellets: 1, spread: 0.04, reloadScale: 1.08 },
  grape: { id: 'grape', name: 'Kartätschen', hullMult: 0.15, sailMult: 0.25, crewMult: 1.45, speed: 6.4, life: 40, pellets: 5, spread: 0.25, reloadScale: 1.38 }
};

let officerUidCounter = 1;
// Generiert Offiziere mit garantiert konsistentem Geschlecht (Name <-> Porträt!)
function generateRandomOfficer(preferredFaction = null, forceRoleId = null) {
  const role = forceRoleId
    ? (OFFICER_ROLES.find(r => r.roleId === forceRoleId) || OFFICER_ROLES[0])
    : OFFICER_ROLES[Math.floor(Math.random() * OFFICER_ROLES.length)];

  const isFemale = Math.random() < 0.24;
  const gender = isFemale ? 'f' : 'm';
  const namePool = isFemale ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE;
  const firstName = namePool[Math.floor(Math.random() * namePool.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];

  const pos = rollRandomTraitFromPool(POSITIVE_TRAITS_POOL);
  const forbidden = new Set([...(role.forbiddenGroups || []), pos.group]);
  const compatPool = NEGATIVE_TRAITS_POOL.filter(nt => !forbidden.has(nt.group.trim()));
  const neg = rollRandomTraitFromPool(compatPool.length > 0 ? compatPool : NEGATIVE_TRAITS_POOL);

  const factionKeys = Object.keys(FACTIONS);
  const faction = preferredFaction && Math.random() < 0.6
    ? preferredFaction
    : factionKeys[Math.floor(Math.random() * factionKeys.length)];

  const seed = Math.floor(Math.random() * 9000) + 10;
  const portraitId = pickPortraitForRole(role.roleId, faction, seed, false, gender);
  const cost = Math.max(75, Math.round(role.baseCost + (Math.random() - 0.35) * 32));
  const salary = Math.max(4, Math.round((role.baseSalary || 6) + (Math.random() - 0.3) * 2));

  return {
    uid: 'off_' + (officerUidCounter++),
    roleId: role.roleId,
    gender,
    name: `${firstName} ${lastName}`,
    title: role.title,
    hatType: role.hatType,
    hatColor: role.hatColor,
    faction,
    isGhostOfficer: false,
    morale: 80 + Math.floor(Math.random() * 16),
    portraitSeed: seed,
    portraitId,
    svg: renderPortraitSprite(portraitId, false),
    roleDesc: role.roleDesc,
    cost,
    salary,
    posTrait: pos,
    negTrait: neg,
    assignedShipUid: null,
    assignedHideoutBuildingId: null
  };
}

window.generateEnclaveGhostOfficer = function(tplIdx = null) {
  const tpl = tplIdx !== null
    ? GHOST_OFFICER_TEMPLATES[tplIdx % GHOST_OFFICER_TEMPLATES.length]
    : GHOST_OFFICER_TEMPLATES[Math.floor(Math.random() * GHOST_OFFICER_TEMPLATES.length)];
  const seed = Math.floor(Math.random() * 9000) + 200;
  const portraitId = tpl.portraitId || pickPortraitForRole(tpl.roleId, 'pirates', seed, true, 'm');

  return {
    uid: 'ghost_off_' + (officerUidCounter++),
    roleId: tpl.roleId,
    gender: 'm',
    name: tpl.name,
    title: tpl.title, title_en: tpl.title_en, title_es: tpl.title_es, title_fr: tpl.title_fr,
    hatType: tpl.hatType, hatColor: tpl.hatColor, faction: 'pirates',
    isGhostOfficer: true, customMods: tpl.mods, morale: 100,
    portraitSeed: seed, portraitId,
    svg: renderPortraitSprite(portraitId, true),
    roleDesc: tpl.roleDesc, roleDesc_en: tpl.roleDesc_en, roleDesc_es: tpl.roleDesc_es, roleDesc_fr: tpl.roleDesc_fr,
    cost: tpl.cost || 680, salary: tpl.salary || 11,
    posTrait: { ...tpl.greatPosTrait }, negTrait: { ...tpl.heavyNegTrait },
    assignedShipUid: null, assignedHideoutBuildingId: null
  };
};