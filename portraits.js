// ============================================================================
// portraits.js - Sprite-Sheet-Porträtsystem (9 Bögen à 4x4 = 144 Charakterbilder)
//                Inkl. exaktem 4:3-Seitenverhältnis, strikter Männlich/Weiblich-
//                Erkennung (passend zum Vornamen!), Bootsmann & XSS-Schutz
// ============================================================================

window.escapeHtml = function(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const PORTRAIT_SHEETS = {
  freibeuter: {
    id: 'freibeuter', file: 'p_freibeuter.jfif', isGhost: false,
    label_de: 'Freibeuter & Kapitäne', label_en: 'Buccaneers & Captains',
    label_es: 'Bucaneros y Capitanes', label_fr: 'Flibustiers & Capitaines'
  },
  piratinnen: {
    id: 'piratinnen', file: 'p_piratinnen.jfif', isGhost: false,
    label_de: 'Piratinnen & Korsarinnen', label_en: 'Pirate Queens & Corsairs',
    label_es: 'Mujeres Piratas y Corsarias', label_fr: 'Femmes Pirates & Corsaires'
  },
  kolonial: {
    id: 'kolonial', file: 'p_kolonial.jfif', isGhost: false,
    label_de: 'Kolonialmarine & Adel', label_en: 'Colonial Navy & Nobles',
    label_es: 'Armada Colonial y Nobleza', label_fr: 'Marine Coloniale & Nobles'
  },
  crew: {
    id: 'crew', file: 'p_crew.jfif', isGhost: false,
    label_de: 'Seeleute & Decksmannschaft', label_en: 'Sailors & Deck Crew',
    label_es: 'Marineros y Tripulación', label_fr: 'Marins & Équipage'
  },
  seebaeren: {
    id: 'seebaeren', file: 'p_seebaeren.jfif', isGhost: false,
    label_de: 'Alte Seebären & Gelehrte', label_en: 'Old Sea Dogs & Scholars',
    label_es: 'Viejos Lobos de Mar y Eruditos', label_fr: 'Vieux Loups de Mer & Érudits'
  },
  schmuggler: {
    id: 'schmuggler', file: 'p_schmuggler.jfif', isGhost: false,
    label_de: 'Schmuggler & Halsabschneider', label_en: 'Smugglers & Cutthroats',
    label_es: 'Contrabandistas y Degolladores', label_fr: 'Contrebandiers & Coupe-Jarrets'
  },
  taverne: {
    id: 'taverne', file: 'p_taverne.jfif', isGhost: false,
    label_de: 'Taverne & Handwerker', label_en: 'Tavern Folk & Craftsmen',
    label_es: 'Gente de Taberna y Artesanos', label_fr: 'Gens de Taverne & Artisans'
  },
  inselvolk: {
    id: 'inselvolk', file: 'p_inselvolk.jfif', isGhost: false,
    label_de: 'Inselvolk & Entdecker', label_en: 'Islanders & Explorers',
    label_es: 'Isleños y Exploradores', label_fr: 'Insulaires & Explorateurs'
  },
  geister: {
    id: 'geister', file: 'p_geister.jfif', isGhost: true,
    label_de: '👻 Geister & Voodoo', label_en: '👻 Ghosts & Voodoo',
    label_es: '👻 Fantasmas y Vudú', label_fr: '👻 Fantômes & Vaudou'
  }
};

window.PORTRAIT_SHEETS = PORTRAIT_SHEETS;

// Bekannte weibliche Vornamen zur zuverlässigen Geschlechter-Erkennung
const FEMALE_FIRST_NAMES_SET = new Set([
  'anne', 'mary', 'grace', 'charlotte', 'jacquotte', 'sadie', 'christina',
  'ines', 'catalina', 'valerie', 'marguerite', 'eleanor', 'isabella', 'sofia',
  'beatriz', 'claire', 'helene', 'hendrika', 'astrid', 'freja', 'abigail', 'rosita'
]);

window.detectCharacterGender = function(fullName = '', explicitGender = null) {
  if (explicitGender === 'f' || explicitGender === 'm') return explicitGender;
  const cleaned = String(fullName || '')
    .toLowerCase()
    .replace(/^(kapitänin|kapitän|captain|capitán|capitaine|kommodore|almirante|commandeur|kommandør)\s+/i, '')
    .trim();
  const firstToken = cleaned.split(/\s+/)[0] || '';
  if (FEMALE_FIRST_NAMES_SET.has(firstToken) || /kapitänin/i.test(fullName)) return 'f';
  return 'm';
};

const COL_STARTS_PCT = [1.25, 25.95, 50.65, 75.35];
const ROW_STARTS_PCT = [1.65, 26.15, 50.65, 75.15];
const CELL_W_PCT = 23.40;
const CELL_H_PCT = 23.20;

window.parsePortraitId = function(portraitId) {
  if (typeof portraitId === 'string' && portraitId.includes(':')) {
    const [sheet, idxStr] = portraitId.split(':');
    const idx = Math.max(0, Math.min(15, parseInt(idxStr, 10) || 0));
    if (PORTRAIT_SHEETS[sheet]) {
      return { sheet, index: idx, id: `${sheet}:${idx}` };
    }
  }
  return { sheet: 'freibeuter', index: 4, id: 'freibeuter:4' };
};

window.renderPortraitSprite = function(portraitId, extraGlow = false) {
  const parsed = parsePortraitId(portraitId);
  const sheetDef = PORTRAIT_SHEETS[parsed.sheet] || PORTRAIT_SHEETS.freibeuter;
  const col = parsed.index % 4;
  const row = Math.floor(parsed.index / 4);

  const x0 = COL_STARTS_PCT[col];
  const y0 = ROW_STARTS_PCT[row];
  const bgSizeW = (100 / CELL_W_PCT) * 100;
  const bgSizeH = (100 / CELL_H_PCT) * 100;
  const posX = (x0 / (100 - CELL_W_PCT)) * 100;
  const posY = (y0 / (100 - CELL_H_PCT)) * 100;

  const isSpectral = sheetDef.isGhost || extraGlow;
  const filterStyle = isSpectral ? 'box-shadow: inset 0 0 12px rgba(16, 185, 129, 0.65);' : '';

  return `<div class="sprite-portrait" style="width:100%;height:100%;aspect-ratio:4/3;background-image:url('${sheetDef.file}');background-size:${bgSizeW.toFixed(2)}% ${bgSizeH.toFixed(2)}%;background-position:${posX.toFixed(2)}% ${posY.toFixed(2)}%;background-repeat:no-repeat;${filterStyle}"></div>`;
};

window.renderPortraitBox = function(portraitIdOrHtml, widthPx = 56, borderColor = '#d4af37', extraGlow = false) {
  const heightPx = Math.round((widthPx * 3) / 4);
  const inner = (typeof portraitIdOrHtml === 'string' && portraitIdOrHtml.trim().startsWith('<'))
    ? portraitIdOrHtml
    : renderPortraitSprite(portraitIdOrHtml, extraGlow);
  return `<div class="portrait-box" style="width:${widthPx}px;height:${heightPx}px;aspect-ratio:4/3;border-color:${borderColor};">${inner}</div>`;
};

// Strikt getrennte männliche & weibliche Porträt-Pools pro Rolle!
const ROLE_PORTRAIT_POOLS_MALE = {
  prize_officer:  ['freibeuter:0', 'freibeuter:7', 'freibeuter:10', 'freibeuter:15', 'kolonial:7', 'kolonial:9'],
  boatswain:      ['crew:10', 'crew:12', 'crew:15', 'freibeuter:6', 'seebaeren:13'],
  gunner:         ['crew:1', 'crew:2', 'crew:6', 'crew:12', 'freibeuter:2', 'freibeuter:11'],
  carpenter:      ['taverne:4', 'taverne:12', 'crew:7', 'seebaeren:13', 'freibeuter:14'],
  sailmaker:      ['crew:0', 'crew:7', 'crew:9', 'taverne:7'],
  shipwright:     ['seebaeren:3', 'seebaeren:8', 'taverne:12', 'kolonial:11'],
  master_builder: ['seebaeren:1', 'seebaeren:11', 'taverne:12', 'kolonial:4', 'kolonial:14'],
  navigator:      ['crew:0', 'seebaeren:3', 'seebaeren:9', 'kolonial:1', 'inselvolk:5'],
  pilot:          ['seebaeren:4', 'seebaeren:6', 'seebaeren:15', 'inselvolk:3', 'crew:14'],
  helmsman:       ['crew:10', 'crew:13', 'crew:15', 'freibeuter:4', 'freibeuter:8'],
  lookout:        ['crew:5', 'crew:11', 'inselvolk:9', 'schmuggler:2'],
  sharpshooter:  ['inselvolk:9', 'schmuggler:1', 'schmuggler:3', 'freibeuter:3'],
  quartermaster:  ['freibeuter:4', 'freibeuter:6', 'crew:15', 'taverne:0', 'schmuggler:10'],
  merchant:       ['taverne:3', 'taverne:15', 'seebaeren:9', 'kolonial:3'],
  surgeon:        ['seebaeren:0', 'seebaeren:2', 'seebaeren:8', 'kolonial:11'],
  barber:         ['seebaeren:0', 'taverne:6', 'schmuggler:6'],
  cook:           ['crew:4', 'taverne:6', 'taverne:0', 'taverne:11'],
  priest:         ['kolonial:11', 'seebaeren:2', 'seebaeren:14', 'inselvolk:0']
};

const ROLE_PORTRAIT_POOLS_FEMALE = {
  prize_officer:  ['piratinnen:0', 'piratinnen:6', 'piratinnen:8', 'piratinnen:15'],
  boatswain:      ['piratinnen:4', 'piratinnen:9', 'piratinnen:11', 'piratinnen:14'],
  gunner:         ['piratinnen:11', 'piratinnen:13', 'piratinnen:6', 'piratinnen:1'],
  carpenter:      ['piratinnen:4', 'piratinnen:14', 'piratinnen:9'],
  sailmaker:      ['piratinnen:4', 'piratinnen:5', 'piratinnen:12'],
  shipwright:     ['piratinnen:2', 'piratinnen:10', 'piratinnen:14'],
  master_builder: ['piratinnen:2', 'piratinnen:7', 'piratinnen:10'],
  navigator:      ['piratinnen:10', 'piratinnen:2', 'piratinnen:5', 'piratinnen:7'],
  pilot:          ['piratinnen:5', 'piratinnen:10', 'piratinnen:12'],
  helmsman:       ['piratinnen:0', 'piratinnen:8', 'piratinnen:15'],
  lookout:        ['piratinnen:5', 'piratinnen:12', 'piratinnen:13'],
  sharpshooter:  ['piratinnen:13', 'piratinnen:1', 'piratinnen:6'],
  quartermaster:  ['piratinnen:9', 'piratinnen:8', 'piratinnen:15'],
  merchant:       ['piratinnen:2', 'piratinnen:7', 'piratinnen:3'],
  surgeon:        ['piratinnen:3', 'piratinnen:7', 'piratinnen:10'],
  barber:         ['piratinnen:14', 'piratinnen:3'],
  cook:           ['piratinnen:3', 'piratinnen:14', 'piratinnen:4'],
  priest:         ['piratinnen:7', 'piratinnen:3', 'piratinnen:2']
};

const SPECIAL_PORTRAITS = {
  hornigold:      'freibeuter:4',
  vane:           'freibeuter:2',
  bonny:          'piratinnen:6',
  woodes_rogers:  'kolonial:1',
  maynard:        'kolonial:9',
  ubilla:         'kolonial:6',
  cordoba:        'kolonial:2',
  cassard:        'kolonial:0',
  van_hoorn:      'kolonial:13',
  laurens_prins:  'freibeuter:10',
  tordenskjold:   'kolonial:10',
  voodoo_elder:   'inselvolk:7',
  voodoo_bokor:   'geister:4',
  native_peace:   'inselvolk:0',
  native_chief:   'inselvolk:8',
  boatswain:      'crew:10',
  scholar_guild:  'seebaeren:9',
  ghost_off_0:    'geister:0',
  ghost_off_1:    'geister:13',
  ghost_off_2:    'geister:2',
  ghost_off_3:    'geister:11'
};

window.SPECIAL_PORTRAITS = SPECIAL_PORTRAITS;

// Wählt garantiert ein zum Geschlecht ('m' oder 'f') passendes Porträt!
window.pickPortraitForRole = function(roleId, faction = null, seed = 1, isGhost = false, gender = 'm') {
  if (isGhost) {
    const ghostPool = ['geister:0', 'geister:1', 'geister:2', 'geister:3', 'geister:5', 'geister:6', 'geister:7', 'geister:9', 'geister:10', 'geister:11', 'geister:13', 'geister:15'];
    return ghostPool[Math.abs(seed) % ghostPool.length];
  }
  if (gender === 'f') {
    const fPool = ROLE_PORTRAIT_POOLS_FEMALE[roleId] || ['piratinnen:0', 'piratinnen:2', 'piratinnen:6', 'piratinnen:10'];
    return fPool[Math.abs(seed) % fPool.length];
  }
  if (faction && faction !== 'pirates' && (roleId === 'prize_officer' || roleId === 'helmsman' || roleId === 'navigator' || roleId === 'master_builder') && (seed % 3 === 0)) {
    const maleKolonial = [0, 1, 2, 3, 4, 6, 7, 9, 10, 11, 13, 14];
    return `kolonial:${maleKolonial[Math.abs(seed) % maleKolonial.length]}`;
  }
  const mPool = ROLE_PORTRAIT_POOLS_MALE[roleId] || ['freibeuter:0', 'crew:1', 'seebaeren:3', 'schmuggler:2'];
  return mPool[Math.abs(seed) % mPool.length];
};

window.pickPortraitForFactionCaptain = function(faction, seed = 1, isGhost = false, gender = 'm') {
  if (isGhost) return `geister:${Math.abs(seed) % 16}`;
  if (gender === 'f') {
    return `piratinnen:${Math.abs(seed * 3) % 16}`;
  }
  if (faction === 'england' || faction === 'spain' || faction === 'france' || faction === 'netherlands' || faction === 'denmark') {
    const maleKolonial = [0, 1, 2, 3, 4, 6, 7, 9, 10, 11, 13, 14];
    return `kolonial:${maleKolonial[Math.abs(seed) % maleKolonial.length]}`;
  }
  const malePirateSheets = ['freibeuter', 'schmuggler', 'crew'];
  const sh = malePirateSheets[Math.abs(seed) % malePirateSheets.length];
  return `${sh}:${Math.abs(seed * 5) % 16}`;
};

window.getAvailableCaptainSheets = function(worldMode) {
  const list = ['freibeuter', 'piratinnen', 'kolonial', 'crew', 'seebaeren', 'schmuggler', 'taverne', 'inselvolk'];
  if (worldMode === 'mythology') list.push('geister');
  return list;
};

window.createPortraitSVG = function(seedOrId, hatType = 'tricorne', hatColor = '#1f3a60', isGhost = false) {
  if (typeof seedOrId === 'string' && seedOrId.includes(':')) {
    if (isGhost && !seedOrId.startsWith('geister:')) {
      const parsed = parsePortraitId(seedOrId);
      return renderPortraitSprite(`geister:${parsed.index}`, true);
    }
    return renderPortraitSprite(seedOrId, isGhost);
  }
  const numSeed = Math.abs(parseInt(seedOrId, 10) || 42);
  if (isGhost) return renderPortraitSprite(`geister:${numSeed % 16}`, true);
  return renderPortraitSprite(`freibeuter:${numSeed % 16}`, false);
};