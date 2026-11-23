// ============================================================================
// i18n.js - Mehrsprachigkeit (DE / EN / ES / FR) für "1714 - Blood and Doubloons"
//           Inkl. Oberbootsmann, Schiffsinventar [I], Beiboot-Landgang,
//           Entdecker-Gilde & bereinigter Warenliste (ohne 'weapons')
// ============================================================================

window.currentLang = localStorage.getItem('blood_doubloons_1714_lang') || localStorage.getItem('karibik_1670_lang') || 'de';

const LANGUAGES = [
  { code: 'de', name: 'Deutsch', flag: '<span class="flag-badge flag-de"></span>' },
  { code: 'en', name: 'English', flag: '<span class="flag-badge flag-en"></span>' },
  { code: 'es', name: 'Español', flag: '<span class="flag-badge flag-es"></span>' },
  { code: 'fr', name: 'Français', flag: '<span class="flag-badge flag-fr"></span>' }
];

window.formatI18n = function(str, vars) {
  if (!str || !vars) return str || '';
  return String(str).replace(/\{(\w+)\}/g, (match, k) => (vars[k] !== undefined ? vars[k] : match));
};

window.tr = function(de, en, es, fr, vars = null) {
  const lang = window.currentLang || 'de';
  let chosen = de;
  if (lang === 'en' && en) chosen = en;
  else if (lang === 'es' && es) chosen = es;
  else if (lang === 'fr' && fr) chosen = fr;
  return vars ? formatI18n(chosen, vars) : chosen;
};

const I18N = {
  de: {
    gameTitle: '1714 - BLOOD AND DOUBLOONS',
    hull: '🛡️ Rumpf:', sail: '⛵ Segel:', crew: '🏴‍☠️ Crew:', morale: '🍻 Moral:',
    portSide: 'Backbord (Q)', stbdSide: 'Steuerbord (E)', fleet: 'Flotte:',
    reputationLabel: '☠️ Ruf:', wagesLabel: '💰 Heuer/Tag:',
    mapBtn: '🗺️ (M)', logbookBtn: '📖 (L)', shipInvBtn: '🧰 (I)',
    spyglassBtn: '🔭 [Z] Fernglas', spyglassSub: 'Schiffe & Wunder',
    shoutPlaceholder: 'Nachricht per Sprachrohr rufen [Enter]...',
    shoutBtn: '📣 Rufen', micBtnOff: '🎙️ Stumm', micBtnOn: '🎙️ Funk aktiv',
    hailRequestSent: '📯 Kontaktanfrage gesendet – warte auf Antwort...',
    hailRequestDeclined: '✖ Kontaktanfrage wurde abgelehnt!',
    hailIncomingTitle: '📯 Eingehende Kontaktanfrage:',
    acceptBtn: '✓ Annehmen', declineBtn: '✖ Ablehnen',
    boardingProtected: '🛡️ ENTERSCHUTZ AKTIV',
    whirlpoolWarn: '🌀 MEERESSTRUDEL! Vollzeug & Gegenruder!',
    rowboatCoastPrompt: '🚣 Beiboot aussetzen (Proviant suchen) [G]',
    sneakPortPrompt: '🕶️ Im Beiboot einschleichen [G]',
    travelMode: '🧭 [C] Reise', travelSub: '+18% Tempo',
    combatMode: '⚔️ [C] Kampf', combatSub: 'Feuerbereit',
    singleFire: '💥 [N] Einzel', singleSub: 'Gezielt',
    broadside: '🔥 [N] Salve', broadsideSub: 'Moral-Schock!',
    ammo1: '[1] Voll', ammo1Sub: 'Rumpf & Fort',
    ammo2: '[2] Kette', ammo2Sub: 'Segel',
    ammo3: '[3] Schrot', ammo3Sub: 'Kurzdistanz',
    skill4: '[4] Salve', skill5: '[5] Not-Rep.',
    ownFlag: '🏴‍☠️ [T] Flagge', noDisguise: 'Keine Tarnung',
    fleetLabel: '⛵ Flotte:', fleetForm: '🛡️ Formation', fleetAttack: '⚔️ Ziel angreifen', fleetCover: '💨 Flucht decken',
    fleetAmmoRound: '💣 Voll', fleetAmmoChain: '⛓️ Kette', fleetAmmoGrape: '🧨 Schrot',
    tabShipyard: '🔨 Werft & Dock', tabArmory: '⚔️ Bewaffnung', tabMarket: '⚖️ Kontor', tabTavern: '🍺 Taverne & Gilde', tabGov: '📜 Gouverneur',
    closePort: '⛵ Anker lichten & Auslaufen',
    optionsTitle: '⚙️ Optionen, Audio & Sprache',
    soundLabel: '🔊 Kampf- & Menü-Soundeffekte', soundMute: '🔇 Effekte stummgeschaltet', soundUnmute: '🔊 Soundeffekte aktiv',
    ambientLabel: '🌊 Meeresrauschen, Strudel & Segel', ambientMute: '🔇 Umgebungsgeräusche aus', ambientUnmute: '🌊 Meeresrauschen & Segel aktiv',
    tipsLabel: '⌨️ Steuerungstipps am unteren Bildschirmrand', tipsShow: 'Steuerungstipps eingeblendet', tipsHide: 'Steuerungstipps ausgeblendet',
    langLabel: '🌍 Spielsprache auswählen:', closeBtn: 'Schließen (Esc)',
    buyTab: 'Ankauf', sellTab: 'Verkauf', quickSupply: 'Schnell-Verproviantierung',
    halfLoad: 'Halbe Ladung', fullLoad: 'Ganze Ladung',
    waitUntilBtn: '⏳ Bis Uhrzeit warten', renameShipBtn: '✒️ Umbenennen',
    abandonMissionBtn: '✖ Auftrag aufgeben (-6 Ruf)',
    controlsBar: '<strong>W/S</strong>: Segel | <strong>A/D</strong>: Ruder | <strong>I</strong>: Schiff/Kapitän | <strong>Z</strong>: Fernglas | <strong>G</strong>: Beiboot/Landgang | <strong>Q/E</strong>: Feuer | <strong>B</strong>: Entern | <strong>U</strong>: Funk | <strong>F</strong>: Hafen | <strong>M</strong>: Karte',
    tipsBtn: '⌨️ Tipps',
    mpSectionLabel: '🌐 Mehrspieler (Colyseus Online)',
    mpOpenWorld: '🌍 Open World Karibik', mpLeaguePvp: '🏆 Liga-PvP Arena (Budget)', mpDeathmatch: '💀 Deathmatch Archipel (Kompakt)',
    saveSlotsTitle: '💾 Einzelspieler-Speicherstände (3 Slots)',
    emptySlot: 'Leerer Speicherplatz', saveBtn: 'Speichern', loadBtn: 'Laden', deleteBtn: 'Löschen',
    repHonorable: 'Ehrenhafter Kapitän', repPrivateer: 'Rauer Freibeuter', repNotorious: 'Berüchtigter Pirat',
    repDread: 'Blutiger Schrecken', repDamned: 'Verfluchte Seele (Tiefststand)',
    ghostFireWarn: '🟢 GEISTERFEUER!',
    waypointClickHint: '🧭 Navigator aktiv: Linksklick setzt Zielmarkierung (Blau = Meeresströmungen).',
    choosePortraitBtn: '🖼️ Porträt wählen (4:3)', activeBadge: '✓ Aktiv'
  },
  en: {
    gameTitle: '1714 - BLOOD AND DOUBLOONS',
    hull: '🛡️ Hull:', sail: '⛵ Sails:', crew: '🏴‍☠️ Crew:', morale: '🍻 Morale:',
    portSide: 'Port (Q)', stbdSide: 'Starboard (E)', fleet: 'Fleet:',
    reputationLabel: '☠️ Rep:', wagesLabel: '💰 Wages/Day:',
    mapBtn: '🗺️ (M)', logbookBtn: '📖 (L)', shipInvBtn: '🧰 (I)',
    spyglassBtn: '🔭 [Z] Spyglass', spyglassSub: 'Ships & Wonders',
    shoutPlaceholder: 'Shout via speaking trumpet [Enter]...',
    shoutBtn: '📣 Shout', micBtnOff: '🎙️ Muted', micBtnOn: '🎙️ Voice On',
    hailRequestSent: '📯 Hail request sent — awaiting reply...',
    hailRequestDeclined: '✖ Hail request was declined!',
    hailIncomingTitle: '📯 Incoming Hail Request:',
    acceptBtn: '✓ Accept', declineBtn: '✖ Decline',
    boardingProtected: '🛡️ BOARDING SANCTUARY',
    whirlpoolWarn: '🌀 MAELSTROM! Full sail & hard rudder!',
    rowboatCoastPrompt: '🚣 Launch Rowboat (Forage Shore) [G]',
    sneakPortPrompt: '🕶️ Sneak into Hostile Town [G]',
    travelMode: '🧭 [C] Travel', travelSub: '+18% Speed',
    combatMode: '⚔️ [C] Combat', combatSub: 'Guns ready',
    singleFire: '💥 [N] Single', singleSub: 'Aimed',
    broadside: '🔥 [N] Salvo', broadsideSub: 'Morale shock!',
    ammo1: '[1] Round', ammo1Sub: 'Hull & Fort',
    ammo2: '[2] Chain', ammo2Sub: 'Sails',
    ammo3: '[3] Grape', ammo3Sub: 'Short range',
    skill4: '[4] Salvo', skill5: '[5] Repair',
    ownFlag: '🏴‍☠️ [T] Flag', noDisguise: 'No disguise',
    fleetLabel: '⛵ Fleet:', fleetForm: '🛡️ Formation', fleetAttack: '⚔️ Attack Target', fleetCover: '💨 Cover Retreat',
    fleetAmmoRound: '💣 Round', fleetAmmoChain: '⛓️ Chain', fleetAmmoGrape: '🧨 Grape',
    tabShipyard: '🔨 Shipyard', tabArmory: '⚔️ Armament', tabMarket: '⚖️ Market', tabTavern: '🍺 Tavern & Guild', tabGov: '📜 Governor',
    closePort: '⛵ Weigh Anchor & Set Sail',
    optionsTitle: '⚙️ Options, Audio & Language',
    soundLabel: '🔊 Combat & UI Sound Effects', soundMute: '🔇 Sound effects muted', soundUnmute: '🔊 Sound effects active',
    ambientLabel: '🌊 Ocean Waves, Maelstroms & Sails', ambientMute: '🔇 Ambient sounds muted', ambientUnmute: '🌊 Ocean & sail audio active',
    tipsLabel: '⌨️ Controls Hint Bar at bottom', tipsShow: 'Controls hints visible', tipsHide: 'Controls hints hidden',
    langLabel: '🌍 Select Game Language:', closeBtn: 'Close (Esc)',
    buyTab: 'Purchase', sellTab: 'Sale', quickSupply: 'Quick Provisioning',
    halfLoad: 'Half Load', fullLoad: 'Full Load',
    waitUntilBtn: '⏳ Wait until hour', renameShipBtn: '✒️ Rename',
    abandonMissionBtn: '✖ Abandon Mission (-6 Rep)',
    controlsBar: '<strong>W/S</strong>: Sails | <strong>A/D</strong>: Rudder | <strong>I</strong>: Ship/Captain | <strong>Z</strong>: Spyglass | <strong>G</strong>: Rowboat | <strong>Q/E</strong>: Fire | <strong>B</strong>: Board | <strong>U</strong>: Hail | <strong>F</strong>: Dock | <strong>M</strong>: Map',
    tipsBtn: '⌨️ Tips',
    mpSectionLabel: '🌐 Multiplayer (Colyseus Online)',
    mpOpenWorld: '🌍 Open World Caribbean', mpLeaguePvp: '🏆 League PvP Arena (Budget)', mpDeathmatch: '💀 Deathmatch Archipelago (Compact)',
    saveSlotsTitle: '💾 Singleplayer Saves (3 Slots)',
    emptySlot: 'Empty Save Slot', saveBtn: 'Save', loadBtn: 'Load', deleteBtn: 'Delete',
    repHonorable: 'Honorable Captain', repPrivateer: 'Rough Privateer', repNotorious: 'Notorious Pirate',
    repDread: 'Bloody Terror', repDamned: 'Damned Soul (Rock Bottom)',
    ghostFireWarn: '🟢 GHOST FIRE!',
    waypointClickHint: '🧭 Navigator active: Left-click sets waypoint (Blue arrows = Ocean Currents).',
    choosePortraitBtn: '🖼️ Choose Portrait (4:3)', activeBadge: '✓ Active'
  },
  es: { gameTitle: '1714 - BLOOD AND DOUBLOONS', closeBtn: 'Cerrar (Esc)', activeBadge: '✓ Activo' },
  fr: { gameTitle: '1714 - BLOOD AND DOUBLOONS', closeBtn: 'Fermer (Esc)', activeBadge: '✓ Actif' }
};

const DATA_I18N = {
  en: {
    boatswain: { title: 'Chief Boatswain', roleDesc: 'CREW EFFICIENCY +35%: Fewer sailors needed to handle sails and man cannons! Vital when crew is depleted.' },
    pilot: { title: 'Coastal Pilot', roleDesc: 'SHOAL & CURRENT SPECIALIST: Reveals sandbars, reefs, whirlpools & ocean currents, -55% reef damage & +10% turn!' },
    master_builder: { title: 'Fortress & Colony Architect', roleDesc: 'CAN FOUND BASES! +35% build speed on Base sites, -15% build costs & +45 Max Hull HP.' }
  }
};

window.t = function(key, vars = null) {
  const dict = I18N[window.currentLang] || I18N.de;
  const raw = dict[key] || I18N.de[key] || key;
  return vars ? formatI18n(raw, vars) : raw;
};

window.td = function(obj, field = 'name') {
  if (!obj) return '';
  const lang = window.currentLang || 'de';
  if (lang === 'de') return obj[field] || obj[field + '_de'] || '';
  if (obj[field + '_' + lang]) return obj[field + '_' + lang];
  const key = obj.i18nKey || obj.id || obj.roleId || obj.clsKey || (obj.idx !== undefined ? 'rank_' + obj.idx : null);
  if (key && DATA_I18N[lang] && DATA_I18N[lang][key] && DATA_I18N[lang][key][field]) {
    return DATA_I18N[lang][key][field];
  }
  return obj[field] || obj[field + '_de'] || '';
};

window.formatOfficerTrait = function(traitObj) {
  if (!traitObj) return '';
  if (traitObj.desc_en || traitObj.name_en) return `${td(traitObj, 'name')}: ${td(traitObj, 'desc')}`;
  const allPools = [...(window.POSITIVE_TRAITS_POOL || []), ...(window.NEGATIVE_TRAITS_POOL || [])];
  const tpl = allPools.find(p => p.id === traitObj.id);
  let val = traitObj.val;
  if (val === undefined && traitObj.mods) {
    const entries = Object.entries(traitObj.mods);
    if (entries.length > 0) val = entries[0][1];
  }
  const tName = tpl ? tpl.name : (traitObj.name || '');
  if (tpl && typeof tpl.fmt === 'function' && val !== undefined) return `${tName} (${tpl.fmt(val)})`;
  return traitObj.desc ? `${tName} (${traitObj.desc})` : tName;
};

window.getPlayerReputationTier = function(repScore) {
  if (repScore <= -85) return { id: 'damned', label: t('repDamned'), color: '#10b981', canEnterEnclave: true };
  if (repScore <= -50) return { id: 'dread', label: t('repDread'), color: '#ef4444', canEnterEnclave: false };
  if (repScore <= -15) return { id: 'notorious', label: t('repNotorious'), color: '#f97316', canEnterEnclave: false };
  if (repScore < 30)   return { id: 'privateer', label: t('repPrivateer'), color: '#fde047', canEnterEnclave: false };
  return { id: 'honorable', label: t('repHonorable'), color: '#38bdf8', canEnterEnclave: false };
};

window.applyLanguageToStaticDOM = function() {
  document.title = '1714 - Blood and Doubloons';
  const setTxt = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = t(key); };
  setTxt('hudLabelHull', 'hull'); setTxt('hudLabelSail', 'sail'); setTxt('hudLabelCrew', 'crew'); setTxt('hudLabelMorale', 'morale');
  setTxt('hudLabelPortSide', 'portSide'); setTxt('hudLabelStbdSide', 'stbdSide');
  setTxt('mapBtnHud', 'mapBtn'); setTxt('logBtnHud', 'logbookBtn'); setTxt('shipInvBtnHud', 'shipInvBtn');
  setTxt('spyglassTitle', 'spyglassBtn'); setTxt('spyglassSub', 'spyglassSub');
  setTxt('shoutSendBtn', 'shoutBtn');
  setTxt('ammoTitle1', 'ammo1'); setTxt('ammoSub1', 'ammo1Sub');
  setTxt('ammoTitle2', 'ammo2'); setTxt('ammoSub2', 'ammo2Sub');
  setTxt('ammoTitle3', 'ammo3'); setTxt('ammoSub3', 'ammo3Sub');
  setTxt('skillTitle4', 'skill4'); setTxt('skillTitle5', 'skill5');
  setTxt('fleetOrderLabel', 'fleetLabel'); setTxt('fCmd_form', 'fleetForm'); setTxt('fCmd_attack', 'fleetAttack'); setTxt('fCmd_cover', 'fleetCover');
  setTxt('fAmmo_round', 'fleetAmmoRound'); setTxt('fAmmo_chain', 'fleetAmmoChain'); setTxt('fAmmo_grape', 'fleetAmmoGrape');
  setTxt('tabBtn_shipyard', 'tabShipyard'); setTxt('tabBtn_armory', 'tabArmory'); setTxt('tabBtn_market', 'tabMarket'); setTxt('tabBtn_tavern', 'tabTavern'); setTxt('tabBtn_gov', 'tabGov');
  setTxt('btnClosePort', 'closePort'); setTxt('optionsModalTitle', 'optionsTitle'); setTxt('optionsCloseBtn', 'closeBtn'); setTxt('toggleControlsBtn', 'tipsBtn');

  const shoutIn = document.getElementById('proximityShoutInput');
  if (shoutIn) shoutIn.placeholder = t('shoutPlaceholder');
  const ctrlEl = document.getElementById('controlsHint');
  if (ctrlEl) ctrlEl.innerHTML = t('controlsBar');
  if (window.renderTutorialBanner) renderTutorialBanner();
};

window.setGameLanguage = function(langCode) {
  if (!I18N[langCode]) return;
  window.currentLang = langCode;
  localStorage.setItem('blood_doubloons_1714_lang', langCode);
  applyLanguageToStaticDOM();
  if (window.renderMainMenu && !document.getElementById('mainMenuOverlay').classList.contains('hidden')) renderMainMenu();
  if (window.renderOfficerHudBar) renderOfficerHudBar();
  if (window.updateHUD) updateHUD();
};