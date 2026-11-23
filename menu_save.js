// ============================================================================
// menu_save.js - Hauptmenü (SP + Multiplayer), Geschlechter-konsistente
//                Kapitänserstellung, Galionsfiguren- & Bootsmann-Modifikatoren,
//                Singleplayer-Pause & vollständige Speicherstände
// ============================================================================

const SAVE_SLOT_PREFIX = 'blood_doubloons_1714_save_slot_';
const AUTOSAVE_KEY = 'blood_doubloons_1714_autosave';
const LEGACY_SAVE_PREFIX = 'karibik_1670_save_v6_slot_';

let creationState = {
  step: 'title',
  worldMode: 'realistic',
  gender: 'm',
  capName: 'Kapitän Edward Hawke',
  portraitSeed: 42,
  portraitId: 'freibeuter:4',
  quizQuestions: [],
  quizIndex: 0,
  skippedQuiz: false,
  allowedTraits: ['cartographer', 'bloodthirsty', 'silver_tongue'],
  skills: { gunnery: 1, seamanship: 1, commerce: 1, leadership: 1, survival: 1 },
  traitVotes: {},
  chosenTrait: 'cartographer'
};

window.controlsHintVisible = true;
window._introTimers = [];

window.checkUnpauseGame = function() {
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
};

window.toggleControlsHint = function() {
  window.controlsHintVisible = !window.controlsHintVisible;
  const el = document.getElementById('controlsHint');
  if (el) el.classList.toggle('hidden', !window.controlsHintVisible);
  if (document.getElementById('optionsOverlay').classList.contains('active')) renderOptionsModal();
};

window.openOptionsModal = function() {
  document.getElementById('optionsOverlay').classList.add('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
  renderOptionsModal();
};

window.closeOptionsModal = function() {
  document.getElementById('optionsOverlay').classList.remove('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
};

window.getSaveSlotMeta = function(slotIdx) {
  const raw = slotIdx === 'auto'
    ? localStorage.getItem(AUTOSAVE_KEY)
    : (localStorage.getItem(SAVE_SLOT_PREFIX + slotIdx) || localStorage.getItem(LEGACY_SAVE_PREFIX + slotIdx));
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    const dt = d.timestamp ? new Date(d.timestamp).toLocaleString() : '';
    const capObj = (d.game && d.game.captain) || {};
    return {
      slotIdx,
      capName: capObj.name || 'Kapitän',
      portraitId: capObj.portraitId || 'freibeuter:4',
      isGhostCaptain: !!capObj.isGhostCaptain,
      level: capObj.level || 1,
      gold: (d.game && d.game.gold) || 0,
      shipName: (d.player && d.player.shipName) || 'Schiff',
      worldMode: (d.game && d.game.worldMode) || 'realistic',
      reputation: (d.game && d.game.reputation) || 0,
      portName: d.autosavePortName || '',
      dateStr: dt
    };
  } catch (e) {
    return null;
  }
};

window.renderSaveSlotsGridHTML = function(allowSaveCurrent) {
  const isMp = !!(window.game && game.isMultiplayer);
  const canSave = allowSaveCurrent && !isMp && !(window.game && game.isGameOver);
  const autoMeta = getSaveSlotMeta('auto');
  return `
    ${autoMeta ? `
      <div class="card-box" style="background:#091622; border-color:#38bdf8; margin-top:8px; margin-bottom:8px; flex-direction:row; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <div style="display:flex; gap:10px; align-items:center;">
          ${renderPortraitBox(autoMeta.portraitId, 48, '#38bdf8', autoMeta.isGhostCaptain)}
          <div style="font-size:12px; color:#e2e8f0;">
            <strong style="color:#38bdf8;">🔄 Autosave${autoMeta.portName ? ` (${escapeHtml(autoMeta.portName)})` : ''}:</strong>
            <strong>${escapeHtml(autoMeta.capName)}</strong> (Lv.${autoMeta.level}) • 🚢 ${escapeHtml(autoMeta.shipName)} • 🪙 <span style="color:#ffd700;">${autoMeta.gold}</span>
            <div style="font-size:10px; color:#94a3b8;">${escapeHtml(autoMeta.dateStr)}</div>
          </div>
        </div>
        <button class="sm-btn" style="border-color:#38bdf8; color:#bae6fd; padding:5px 12px;" ${isMp ? 'disabled' : ''} onclick="loadGameFromSlot('auto')">📂 Autosave laden</button>
      </div>
    ` : ''}
    <div class="grid-3" style="margin-top:8px;">
      ${[1, 2, 3].map(idx => {
        const meta = getSaveSlotMeta(idx);
        return `
          <div class="card-box" style="background:#0a121b; border-color:${meta ? '#d4af37' : '#334155'};">
            <div>
              <div class="card-title">💾 Slot #${idx} ${meta ? (meta.worldMode === 'mythology' ? '👻' : '⚓') : ''}</div>
              ${meta ? `
                <div style="display:flex; gap:10px; align-items:center; margin:6px 0;">
                  ${renderPortraitBox(meta.portraitId, 52, '#d4af37', meta.isGhostCaptain)}
                  <div class="card-desc" style="color:#cbd5e1; margin:0;">
                    <strong>${escapeHtml(meta.capName)}</strong> (Lv.${meta.level})<br>
                    🚢 ${escapeHtml(meta.shipName)}<br>
                    🪙 <span style="color:#ffd700;">${meta.gold}</span> | ☠️ ${meta.reputation}
                  </div>
                </div>
                <div style="font-size:10px; color:#64748b; margin-bottom:6px;">${escapeHtml(meta.dateStr)}</div>
              ` : `
                <div class="card-desc" style="color:#64748b; min-height:54px; display:flex; align-items:center;">— ${t('emptySlot')} —</div>
              `}
            </div>
            <div style="display:flex; gap:5px; flex-wrap:wrap;">
              ${canSave ? `<button class="sm-btn" style="flex:1; border-color:#2ecc71; color:#a7f3d0;" onclick="saveGameToSlot(${idx})">💾 ${t('saveBtn')}</button>` : ''}
              <button class="sm-btn" style="flex:1;" ${!meta || isMp ? 'disabled' : ''} onclick="loadGameFromSlot(${idx})">📂 ${t('loadBtn')}</button>
              ${meta ? `<button class="sm-btn" style="border-color:#ef4444; color:#fecaca;" onclick="deleteSaveSlot(${idx})">🗑️</button>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
};

window.renderOptionsModal = function() {
  const body = document.getElementById('optionsBody');
  if (!body) return;
  const canSaveHere = !!(window.game && window.player && !game.isMultiplayer && document.getElementById('mainMenuOverlay').classList.contains('hidden'));

  body.innerHTML = `
    <div class="card-box" style="margin-bottom:12px; background:#091119;">
      <div class="card-title">${t('langLabel')}</div>
      <div class="lang-flag-bar" style="justify-content:flex-start; margin-top:8px;">
        ${LANGUAGES.map(l => `
          <button class="lang-btn ${window.currentLang === l.code ? 'active' : ''}" onclick="setGameLanguage('${l.code}')">
            <span style="font-size:18px;">${l.flag}</span><span>${l.name}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:12px;">
      <div class="card-box" style="background:#091119;">
        <div class="card-title">${t('soundLabel')}</div>
        <div style="margin-top:8px;">
          <button class="action-btn" style="width:100%;" onclick="toggleAudioMute()">
            <span>${SoundFX.muted ? t('soundMute') : t('soundUnmute')}</span><span>${SoundFX.muted ? '🔇' : '🔊'}</span>
          </button>
        </div>
      </div>

      <div class="card-box" style="background:#091119;">
        <div class="card-title">${t('ambientLabel')}</div>
        <div style="margin-top:8px;">
          <button class="action-btn" style="width:100%;" onclick="toggleAmbientAudio()">
            <span>${AmbientSeaAudio.muted ? t('ambientMute') : t('ambientUnmute')}</span><span>${AmbientSeaAudio.muted ? '🔇' : '🌊'}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="card-box" style="margin-bottom:12px; background:#091119;">
      <div class="card-title">${t('tipsLabel')}</div>
      <div style="margin-top:8px;">
        <button class="action-btn" style="width:100%;" onclick="toggleControlsHint()">
          <span>${window.controlsHintVisible ? t('tipsShow') : t('tipsHide')}</span><span>${window.controlsHintVisible ? '👁️' : '🚫'}</span>
        </button>
      </div>
    </div>

    <div class="card-box" style="background:#091119;">
      <div class="card-title">${t('saveSlotsTitle')}</div>
      ${renderSaveSlotsGridHTML(canSaveHere)}
    </div>
  `;
};

window.playGameIntro = function(onDoneCallback) {
  while (window._introTimers.length > 0) clearTimeout(window._introTimers.pop());
  const ov = document.getElementById('introOverlay');
  const wrap = document.getElementById('introMediaWrap');
  const txt = document.getElementById('introStoryText');
  if (!ov || !wrap || !txt) { if (onDoneCallback) onDoneCallback(); return; }

  window._introDoneCallback = onDoneCallback || null;
  wrap.innerHTML = '<img id="introGifImg" src="intro.gif" alt="Storm Intro">';
  ov.classList.remove('fading-out');
  ov.classList.add('active');
  SoundFX.init();
  SoundFX.play('thunder');

  txt.style.opacity = '1';
  txt.innerHTML = '„Karibik, Anno 1714. Nach dem Frieden von Utrecht sind die Kaperbriefe wertlos – und ein tosender Nachtorkan vor den Bahamas hat deine Schaluppe fast zerschmettert…“';

  window._introTimers.push(setTimeout(() => {
    txt.style.opacity = '0';
    window._introTimers.push(setTimeout(() => {
      SoundFX.play('thunder');
      txt.innerHTML = '„Mit zerrissenen Segeln und einer Handvoll Dublonen erreichst du im Morgengrauen die Bucht vor Nassau. Dein Weg zwischen Blut und Gold beginnt jetzt.“';
      txt.style.opacity = '1';
    }, 450));
  }, 4600));

  window._introTimers.push(setTimeout(() => skipGameIntro(), 9500));
};

window.skipGameIntro = function() {
  while (window._introTimers.length > 0) clearTimeout(window._introTimers.pop());
  const ov = document.getElementById('introOverlay');
  if (!ov || !ov.classList.contains('active')) return;
  ov.classList.add('fading-out');
  setTimeout(() => {
    ov.classList.remove('active');
    ov.classList.remove('fading-out');
    if (typeof window._introDoneCallback === 'function') {
      const cb = window._introDoneCallback;
      window._introDoneCallback = null;
      cb();
    }
    if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
  }, 650);
};

window.addEventListener('keydown', e => {
  const ov = document.getElementById('introOverlay');
  if (ov && ov.classList.contains('active') && (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter')) {
    e.preventDefault();
    skipGameIntro();
  }
}, true);

// ============================================================================
// HAUPTMENÜ & GESCHLECHTER-INTELLIGENTE CHARAKTERERSTELLUNG
// ============================================================================
window.openMainMenu = function() {
  creationState.step = 'title';
  document.getElementById('mainMenuOverlay').classList.remove('hidden');
  renderMainMenu();
};

window.selectWorldMode = function(mode) {
  creationState.worldMode = mode;
  if (mode !== 'mythology') {
    if (String(creationState.portraitId || '').startsWith('geister:')) creationState.portraitId = 'freibeuter:4';
    if (creationState.activeSheetTab === 'geister') creationState.activeSheetTab = 'freibeuter';
  }
  renderMainMenu();
};

window.startNewGameFlow = function() {
  if (window.NetClient && NetClient.isConnected()) NetClient.disconnect();
  creationState.step = 'quiz';
  creationState.quizIndex = 0;
  creationState.skippedQuiz = false;
  creationState.quizQuestions = typeof window.pickRandomPsychoQuestions === 'function' ? window.pickRandomPsychoQuestions(5) : [];
  creationState.skills = { gunnery: 0, seamanship: 0, commerce: 0, leadership: 0, survival: 0 };
  creationState.traitVotes = {};
  if (creationState.worldMode !== 'mythology' && String(creationState.portraitId || '').startsWith('geister:')) {
    creationState.portraitId = 'freibeuter:4';
    creationState.activeSheetTab = 'freibeuter';
  }
  renderMainMenu();
};

window.skipPsychoQuiz = function() {
  creationState.skippedQuiz = true;
  creationState.skills = { gunnery: 1, seamanship: 1, commerce: 1, leadership: 1, survival: 1 };
  creationState.chosenTrait = 'drifter';
  creationState.allowedTraits = ['drifter'];
  creationState.step = 'summary';
  renderMainMenu();
};

window.answerPsychoQuiz = function(ansIdx) {
  const qObj = creationState.quizQuestions[creationState.quizIndex];
  const ans = qObj ? qObj.answers[ansIdx] : null;
  if (ans) {
    creationState.skills[ans.skill] = (creationState.skills[ans.skill] || 0) + 1;
    creationState.traitVotes[ans.traitHint] = (creationState.traitVotes[ans.traitHint] || 0) + 1;
  }
  creationState.quizIndex++;
  if (creationState.quizIndex >= creationState.quizQuestions.length) {
    const poolIds = CAPTAIN_TRAITS.filter(trObj => trObj.id !== 'drifter').map(trObj => trObj.id);
    poolIds.sort((a, b) => (creationState.traitVotes[b] || 0) - (creationState.traitVotes[a] || 0));
    creationState.allowedTraits = poolIds.slice(0, 3);
    creationState.chosenTrait = creationState.allowedTraits[0] || 'cartographer';
    creationState.step = 'summary';
  }
  renderMainMenu();
};

window.setCreationGender = function(gender) {
  const nameInput = document.getElementById('capNameInput');
  if (nameInput && nameInput.value.trim()) creationState.capName = nameInput.value.trim();
  const prevGender = creationState.gender || 'm';
  creationState.gender = (gender === 'f') ? 'f' : 'm';

  if (prevGender !== creationState.gender) {
    randomizeCaptainName(true);
    rerollCaptainPortrait(true);
  }
  SoundFX.play('card');
  renderMainMenu();
};

window.rerollCaptainPortrait = function(silent = false) {
  const nameInput = document.getElementById('capNameInput');
  if (nameInput && nameInput.value.trim()) creationState.capName = nameInput.value.trim();
  const g = creationState.gender || 'm';

  let nextPid = creationState.portraitId;
  for (let tries = 0; tries < 8; tries++) {
    if (g === 'f') {
      const fSheets = ['piratinnen'];
      if (creationState.worldMode === 'mythology' && Math.random() < 0.18) fSheets.push('geister');
      const sh = fSheets[Math.floor(Math.random() * fSheets.length)];
      nextPid = `${sh}:${Math.floor(Math.random() * 16)}`;
    } else {
      const maleSheets = ['freibeuter', 'kolonial', 'crew', 'seebaeren', 'schmuggler'];
      if (creationState.worldMode === 'mythology') maleSheets.push('geister');
      const sh = maleSheets[Math.floor(Math.random() * maleSheets.length)];
      nextPid = `${sh}:${Math.floor(Math.random() * 16)}`;
    }
    if (nextPid !== creationState.portraitId) break;
  }
  creationState.portraitId = nextPid;
  if (!silent) {
    SoundFX.play('dice');
    renderMainMenu();
  }
};

window.randomizeCaptainName = function(silent = false) {
  const isFemale = (creationState.gender === 'f');
  const fnPool = isFemale ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE;
  const fn = fnPool[Math.floor(Math.random() * fnPool.length)];
  const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  creationState.capName = `${isFemale ? 'Kapitänin' : 'Kapitän'} ${fn} ${ln}`;
  if (!silent) {
    SoundFX.play('dice');
    renderMainMenu();
  }
};

window.selectStartTrait = function(traitId) {
  if (creationState.skippedQuiz && traitId !== 'drifter') return;
  const nameInput = document.getElementById('capNameInput');
  if (nameInput && nameInput.value.trim()) creationState.capName = nameInput.value.trim();
  creationState.chosenTrait = traitId;
  renderMainMenu();
};

window.finalizeCharacterAndStart = function() {
  const nameInput = document.getElementById('capNameInput');
  if (nameInput && nameInput.value.trim()) {
    creationState.capName = nameInput.value.replace(/[<>"]/g, '').trim().slice(0, 36);
  }
  document.getElementById('mainMenuOverlay').classList.add('hidden');
  initNewGameFromCreation(creationState, false, null);
  applyLanguageToStaticDOM();
  playGameIntro(() => {});
};

window.renderMainMenu = function() {
  const box = document.getElementById('mainMenuContent');
  if (!box) return;
  const canResume = !!(window.game && window.player && !game.isGameOver && player.hull > 0 && game.time > 0);
  const isMpRunning = !!(window.game && game.isMultiplayer);

  if (creationState.step === 'title') {
    box.classList.add('title-screen-layout');
    const isReal = creationState.worldMode === 'realistic';

    const autoMeta = getSaveSlotMeta('auto');
    const autoRowHtml = autoMeta ? `
      <div class="clean-slot-row has-save" style="border-color:#38bdf8;">
        <div class="clean-slot-info" title="Autosave${autoMeta.portName ? ' (' + escapeHtml(autoMeta.portName) + ')' : ''}: ${escapeHtml(autoMeta.capName)}">
          <strong style="color:#38bdf8;">🔄 Auto</strong> ${escapeHtml(autoMeta.capName)} <span style="color:#94a3b8;">(Lv.${autoMeta.level})</span>
        </div>
        <div class="clean-slot-actions">
          <button class="sm-btn" style="border-color:#38bdf8; color:#bae6fd;" onclick="loadGameFromSlot('auto')">${t('loadBtn')}</button>
        </div>
      </div>
    ` : '';

    const slotsHtml = [1, 2, 3].map(idx => {
      const meta = getSaveSlotMeta(idx);
      return `
        <div class="clean-slot-row ${meta ? 'has-save' : ''}">
          <div class="clean-slot-info" title="${meta ? `${escapeHtml(meta.capName)} • ${escapeHtml(meta.shipName)} • ${meta.gold} 🪙` : ''}">
            ${meta ? `<strong style="color:#ffd700;">#${idx}</strong> ${escapeHtml(meta.capName)} <span style="color:#94a3b8;">(Lv.${meta.level})</span>` : `<span style="color:#64748b;">#${idx} — Leer</span>`}
          </div>
          <div class="clean-slot-actions">
            ${canResume && !isMpRunning ? `<button class="sm-btn" style="border-color:#2ecc71; color:#a7f3d0;" onclick="saveGameToSlot(${idx})">💾</button>` : ''}
            <button class="sm-btn" ${!meta ? 'disabled' : ''} onclick="loadGameFromSlot(${idx})">${t('loadBtn')}</button>
            ${meta ? `<button class="sm-btn" style="border-color:#ef4444; color:#fecaca;" onclick="deleteSaveSlot(${idx})">🗑️</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    box.innerHTML = `
      <div class="clean-title-top"><h1>1714 - BLOOD AND DOUBLOONS</h1></div>
      <div class="clean-left-column">
        <div>
          <div class="clean-section-label">Einzelspieler (Welt)</div>
          <button class="clean-menu-btn ${isReal ? 'selected' : ''}" onclick="selectWorldMode('realistic')"><span>⚓ Historische Karibik 1714</span><span>${isReal ? '✓' : ''}</span></button>
          <button class="clean-menu-btn ${!isReal ? 'selected' : ''}" onclick="selectWorldMode('mythology')"><span>👻 Seemannsgarn</span><span>${!isReal ? '✓' : ''}</span></button>
        </div>

        <div>
          <div class="clean-section-label">${t('mpSectionLabel')}</div>
          <button class="clean-menu-btn" style="border-color:#38bdf8;" onclick="openMultiplayerLobby('open_world')"><span>${t('mpOpenWorld')}</span><span>🌐</span></button>
          <button class="clean-menu-btn" style="border-color:#f59e0b;" onclick="openMultiplayerLobby('league_pvp')"><span>${t('mpLeaguePvp')}</span><span>⚔️</span></button>
          <button class="clean-menu-btn" style="border-color:#ef4444;" onclick="openMultiplayerLobby('deathmatch')"><span>${t('mpDeathmatch')}</span><span>💀</span></button>
        </div>

        <div>
          <div class="clean-section-label">Spielstände (SP)</div>
          ${canResume ? `<button class="clean-menu-btn" style="border-color:#2ecc71; color:#a7f3d0; margin-bottom:7px;" onclick="resumeCurrentGame()"><span>▶ Spiel fortsetzen</span><span>⛵</span></button>` : ''}
          ${autoRowHtml}
          ${slotsHtml}
        </div>

        <div>
          <button class="clean-menu-btn" onclick="openOptionsModal()"><span>⚙️ Optionen</span><span>▸</span></button>
        </div>
      </div>

      <div class="clean-bottom-center">
        <button class="start-adventure-btn" onclick="startNewGameFlow()">Neues Abenteuer (Einzelspieler)</button>
      </div>
    `;
  } else if (creationState.step === 'quiz') {
    box.classList.remove('title-screen-layout');
    const qObj = creationState.quizQuestions[creationState.quizIndex];
    box.innerHTML = `
      <div class="modal-header">
        <h2 style="color:#ffd700; font-size:21px;">📜 Seemanns-Prüfung 1714 (${creationState.quizIndex + 1} / ${creationState.quizQuestions.length})</h2>
        <div style="display:flex; gap:6px;">
          <button class="sm-btn" style="border-color:#f59e0b; color:#fde047;" onclick="skipPsychoQuiz()">⏭️ Überspringen</button>
          <button class="sm-btn" onclick="openMainMenu()">Abbrechen</button>
        </div>
      </div>
      <div style="font-size:15px; color:#f8fafc; font-weight:bold; margin:16px 0 18px; line-height:1.45;">${getLocalizedQuestionText(qObj)}</div>
      <div>${(qObj ? qObj.answers : []).map((a, idx) => `<button class="quiz-option" onclick="answerPsychoQuiz(${idx})">${getLocalizedAnswerText(a)}</button>`).join('')}</div>
    `;
  } else if (creationState.step === 'summary') {
    box.classList.remove('title-screen-layout');
    const allowedSheets = getAvailableCaptainSheets(creationState.worldMode);
    const parsedCur = parsePortraitId(creationState.portraitId);
    if (!allowedSheets.includes(parsedCur.sheet)) rerollCaptainPortrait(true);
    if (creationState.gender === 'f' && parsedCur.sheet !== 'piratinnen' && parsedCur.sheet !== 'geister') rerollCaptainPortrait(true);
    if (creationState.gender !== 'f' && parsedCur.sheet === 'piratinnen') rerollCaptainPortrait(true);

    const isFem = creationState.gender === 'f';
    const isSpectralPicked = String(creationState.portraitId).startsWith('geister:');
    const availableTraitObjs = CAPTAIN_TRAITS.filter(trObj => creationState.allowedTraits.includes(trObj.id));

    box.innerHTML = `
      <div class="modal-header">
        <h2 style="color:#ffd700; font-size:21px;">🎖️ Kapitän erstellen</h2>
        <button class="sm-btn" onclick="startNewGameFlow()">🎲 Neue Fragen</button>
      </div>

      <div class="grid-2" style="margin-bottom:14px;">
        <div class="card-box">
          <div style="display:flex; gap:16px; align-items:center;">
            <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
              ${renderPortraitBox(creationState.portraitId, 128, isSpectralPicked ? '#10b981' : '#ffd700', isSpectralPicked)}
              <button class="action-btn" style="width:100%; justify-content:center; padding:6px 10px;" onclick="rerollCaptainPortrait()">
                🎲 Zufalls-Porträt
              </button>
            </div>
            <div style="flex:1;">
              <label style="font-size:11.5px; color:#94a3b8;">Geschlecht wählen:</label>
              <div style="display:flex; gap:6px; margin:4px 0 10px;">
                <button class="tab-btn ${!isFem ? 'active' : ''}" style="padding:6px;" onclick="setCreationGender('m')">♂ Männlich</button>
                <button class="tab-btn ${isFem ? 'active' : ''}" style="padding:6px;" onclick="setCreationGender('f')">♀ Weiblich</button>
              </div>

              <label style="font-size:11.5px; color:#94a3b8;">Name deines Kapitäns:</label>
              <input id="capNameInput" type="text" value="${escapeHtml(creationState.capName)}" oninput="creationState.capName = this.value" style="width:100%; background:#081018; border:1px solid #d4af37; color:#ffd700; padding:7px 9px; border-radius:5px; font-weight:bold; margin-top:3px;">
              <div style="display:flex; gap:6px; margin-top:8px;">
                <button class="sm-btn" style="padding:5px 10px;" onclick="randomizeCaptainName()">🎲 Zufallsname (${isFem ? 'Weiblich' : 'Männlich'})</button>
              </div>
            </div>
          </div>
          <div style="margin-top:12px; padding-top:8px; border-top:1px solid #1e293b; font-size:12.5px; color:#cbd5e1;">
            💥 Artillerie: <strong>${creationState.skills.gunnery}</strong> &nbsp;|&nbsp;
            ⛵ Seemannschaft: <strong>${creationState.skills.seamanship}</strong> &nbsp;|&nbsp;
            ⚖️ Handel: <strong>${creationState.skills.commerce}</strong> &nbsp;|&nbsp;
            🎖️ Führung: <strong>${creationState.skills.leadership}</strong> &nbsp;|&nbsp;
            🛡️ Überleben: <strong>${creationState.skills.survival}</strong>
          </div>
        </div>

        <div class="card-box">
          <div class="card-title">🧬 Charakter-Trait wählen</div>
          <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
            ${availableTraitObjs.map(trObj => `
              <div onclick="selectStartTrait('${trObj.id}')" style="padding:8px 10px; border-radius:6px; cursor:pointer; border:1px solid ${creationState.chosenTrait === trObj.id ? '#ffd700' : '#334155'}; background:${creationState.chosenTrait === trObj.id ? '#2c2112' : '#091119'};">
                <div style="color:#ffd700; font-weight:bold; font-size:12.5px;">${creationState.chosenTrait === trObj.id ? '✓ ' : ''}${td(trObj, 'name')}</div>
                <div style="color:#94a3b8; font-size:11px;">${td(trObj, 'desc')}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <div style="text-align:right; border-top:1px solid #334155; padding-top:12px;">
        <button class="primary-btn" onclick="finalizeCharacterAndStart()">⛵ Segel setzen &amp; 1714 beginnen!</button>
      </div>
    `;
  }
};

window.resumeCurrentGame = function() {
  document.getElementById('mainMenuOverlay').classList.add('hidden');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
};

// ============================================================================
// SPEICHERN & LADEN (Inkl. Inventar, Entdeckungen, Galionsfigur & Rationen)
// ============================================================================
window.saveGameToStorage = function() { openOptionsModal(); };

window.saveGameToSlot = function(slotIdx = 1, isAutoSave = false, autoPortName = '') {
  if (!window.game || !window.player || game.isMultiplayer || game.isGameOver) return;
  ensureHideoutStructure();
  ensureShipAndCaptainInventory();
  try {
    let activeMissionShipData = null, activeMissionFlotsamData = null;
    if (game.activeMission) {
      const mShip = ships.find(s => s.isMissionTarget);
      if (mShip) {
        activeMissionShipData = {
          faction: mShip.faction, clsKey: mShip.clsKey, x: mShip.x, y: mShip.y,
          hull: mShip.hull, sail: mShip.sail, crew: mShip.crew, name: mShip.name,
          mustCaptureOnly: !!mShip.mustCaptureOnly, missionId: mShip.missionId
        };
      }
      const mFlot = flotsam.find(f => f.isMissionRescue);
      if (mFlot) activeMissionFlotsamData = { ...mFlot };
    }

    let silverFleetSaveData = null;
    const sfLead = ships.find(s => s.isSilverFleet && !s.leaderShip);
    if (sfLead) {
      silverFleetSaveData = {
        x: sfLead.x, y: sfLead.y, hull: sfLead.hull, sail: sfLead.sail, crew: sfLead.crew,
        destX: sfLead.destX, destY: sfLead.destY
      };
    }

    const cleanGame = { ...window.game };
    delete cleanGame.playerFocusTarget;

    const saveObj = {
      timestamp: Date.now(), slotIdx, autosavePortName: autoPortName || '', activeMissionShipData, activeMissionFlotsamData, silverFleetSaveData,
      game: {
        ...cleanGame,
        captain: { ...window.game.captain, svg: undefined },
        hideout: { ...window.game.hideout, stationedOfficers: (game.hideout.stationedOfficers || []).map(o => ({ ...o, svg: undefined })) },
        enclaveOfficers: (game.enclaveOfficers || []).map(o => ({ ...o, svg: undefined }))
      },
      player: { ...window.player, officers: player.officers.map(o => ({ ...o, svg: undefined })) },
      ports: PORTS.map(p => ({
        id: p.id, faction: p.faction, fortHp: p.fortHp, lighthouseHp: p.lighthouseHp,
        treasureMapBought: p.treasureMapBought, tavernCrewAvail: p.tavernCrewAvail,
        tavernRoundBought: p.tavernRoundBought, marketStock: p.marketStock,
        marketPricePressure: p.marketPricePressure, missions: p.missions,
        passengerOffer: p.passengerOffer,
        tavernOfficers: (p.tavernOfficers || []).map(o => ({ ...o, svg: undefined }))
      })),
      villages: FISHING_VILLAGES.map(fv => ({ id: fv.id, crewAvail: fv.crewAvail, foodStock: fv.foodStock, raidCooldown: fv.raidCooldown || 0 })),
      fowGrid: Array.from(fowGrid),
      explorationSites: EXPLORATION_SITES.map(s => ({ id: s.id, mapBought: !!s.mapBought, discovered: s.discovered, looted: s.looted, forageLeft: s.forageLeft, lastReport: s.lastReport }))
    };

    const storageKey = (slotIdx === 'auto' || isAutoSave) ? AUTOSAVE_KEY : (SAVE_SLOT_PREFIX + slotIdx);
    localStorage.setItem(storageKey, JSON.stringify(saveObj));
    if (!isAutoSave) {
      SoundFX.play('coin');
      logEvent(`💾 Slot #${slotIdx} erfolgreich gespeichert!`);
    } else {
      logEvent(`🔄 Autosave gesichert (${autoPortName || 'Hafen'})!`);
    }
    if (document.getElementById('optionsOverlay').classList.contains('active')) renderOptionsModal();
    if (!document.getElementById('mainMenuOverlay').classList.contains('hidden')) renderMainMenu();
  } catch (err) { logEvent('⚠️ ' + err.message); }
};

window.triggerPortAutoSave = function(locationName = 'Hafen') {
  if (!window.game || !window.player || game.isMultiplayer || game.isGameOver) return;
  saveGameToSlot('auto', true, locationName);
};

window.deleteSaveSlot = function(slotIdx) {
  localStorage.removeItem(SAVE_SLOT_PREFIX + slotIdx);
  localStorage.removeItem(LEGACY_SAVE_PREFIX + slotIdx);
  if (document.getElementById('optionsOverlay').classList.contains('active')) renderOptionsModal();
  if (!document.getElementById('mainMenuOverlay').classList.contains('hidden')) renderMainMenu();
};

window.rebuildPortShipyardOffersForFaction = function(port) {
  const fac = port.faction;
  let pool = ['sloop', 'brigantine', 'corvette', 'frigate'];
  if (fac === 'spain') pool = ['flute', 'brigantine', 'galleon', 'manowar'];
  else if (fac === 'england') pool = ['brigantine', 'corvette', 'frigate', 'manowar'];
  else if (fac === 'france') pool = ['sloop', 'corvette', 'frigate', 'manowar'];
  else if (fac === 'netherlands') pool = ['flute', 'brigantine', 'corvette', 'galleon'];
  else if (fac === 'denmark') pool = ['brigantine', 'corvette', 'frigate', 'manowar'];
  port.shipyardOffers = pool.map(clsKey => getFactionShipStats(clsKey, fac));
};

window.loadGameFromSlot = function(slotIdx = 1) {
  const raw = slotIdx === 'auto'
    ? localStorage.getItem(AUTOSAVE_KEY)
    : (localStorage.getItem(SAVE_SLOT_PREFIX + slotIdx) || localStorage.getItem(LEGACY_SAVE_PREFIX + slotIdx));
  if (!raw) return;
  try {
    if (window.NetClient && NetClient.isConnected()) NetClient.disconnect();
    if (window.clearBlackjackTimer) clearBlackjackTimer();
    window.treasureAdvState = null;

    const data = JSON.parse(raw);
    initNewGameFromCreation({ ...creationState, worldMode: (data.game && data.game.worldMode) || 'realistic' }, false, null);

    window.game = data.game;
    game.isMultiplayer = false; game.mpMode = null; game.isGameOver = false;
    game.reputation = game.reputation !== undefined ? game.reputation : 0;
    game.conqueredPorts = game.conqueredPorts || {};
    game.fleetOrder = game.fleetOrder || 'formation';
    game.fleetAmmo = game.fleetAmmo || 'round';
    game.logbook = game.logbook || [];
    game.visitedPortsLog = game.visitedPortsLog || {};
    game.discoveries = game.discoveries || { found: {}, turnedIn: {}, mapMilestoneClaimed: 0 };
    game.captainRelations = game.captainRelations || {};
    if (game.wololoEnabled === undefined) {
      game.wololoEnabled = !!(game.captain && String(game.captain.name || '').toLowerCase().includes('wololo'));
    }

    Object.keys(FACTIONS).forEach(fk => {
      if (game.rep[fk] === undefined) game.rep[fk] = 0;
      if (game.rankPts[fk] === undefined) game.rankPts[fk] = 0;
    });

    const isGhostCap = !!(game.captain && game.captain.isGhostCaptain);
    if (!game.captain.portraitId) game.captain.portraitId = isGhostCap ? 'geister:0' : 'freibeuter:4';
    game.captain.svg = renderPortraitSprite(game.captain.portraitId, isGhostCap);

    if (game.enclaveOfficers) {
      game.enclaveOfficers.forEach((o, idx) => {
        if (!o.portraitId) o.portraitId = `geister:${(idx * 3) % 16}`;
        o.svg = renderPortraitSprite(o.portraitId, true);
      });
    }

    Object.assign(window.player, data.player);
    delete player.cargo.weapons; // Legacy-Ware bereinigen
    player.inBoardingLock = false; player.boardingInvulnTimer = 0;
    player.fleet = player.fleet || [];
    player.woundedCrew = player.woundedCrew || 0;
    player.ghostFire = player.ghostFire || 0;
    player.prisoners = player.prisoners || 0;
    player.prisonersByFaction = player.prisonersByFaction || {};
    player.modeTransitionTimer = 0;
    player.fireCadence = player.fireCadence || 'single';
    player.portCannonDamage = player.portCannonDamage || initCannonsArray(player.cannonsPerSide);
    player.stbdCannonDamage = player.stbdCannonDamage || initCannonsArray(player.cannonsPerSide);

    player.officers.forEach(o => {
      o.salary = o.salary || 6;
      const g = detectCharacterGender(o.name, o.gender);
      if (!o.portraitId) o.portraitId = pickPortraitForRole(o.roleId, o.faction, o.portraitSeed || 50, !!o.isGhostOfficer, g);
      o.svg = renderPortraitSprite(o.portraitId, !!o.isGhostOfficer);
    });

    ensureHideoutStructure();
    ensureShipAndCaptainInventory();

    const tutStillNeedsCrate = !!(game.tutorial && game.tutorial.active && game.tutorial.step <= 2);
    if (!tutStillNeedsCrate) {
      for (let i = flotsam.length - 1; i >= 0; i--) if (flotsam[i].isTutorialCrate) flotsam.splice(i, 1);
    }

    if (data.ports) {
      data.ports.forEach(sp => {
        const port = PORTS.find(p => p.id === sp.id);
        if (port) {
          port.faction = sp.faction || port.defaultFaction;
          port.fortHp = sp.fortHp;
          if (sp.lighthouseHp !== undefined) port.lighthouseHp = sp.lighthouseHp;
          port.treasureMapBought = !!sp.treasureMapBought;
          if (sp.tavernCrewAvail !== undefined) port.tavernCrewAvail = sp.tavernCrewAvail;
          if (sp.tavernRoundBought !== undefined) port.tavernRoundBought = sp.tavernRoundBought;
          if (sp.marketStock) { delete sp.marketStock.weapons; port.marketStock = sp.marketStock; }
          if (sp.marketPricePressure) port.marketPricePressure = sp.marketPricePressure;
          if (sp.passengerOffer) port.passengerOffer = sp.passengerOffer;
          if (Array.isArray(sp.missions)) port.missions = sp.missions.filter(m => m.goodId !== 'weapons');
          if (Array.isArray(sp.tavernOfficers)) {
            port.tavernOfficers = sp.tavernOfficers.map(o => {
              const g = detectCharacterGender(o.name, o.gender);
              const pid = o.portraitId || pickPortraitForRole(o.roleId, o.faction, o.portraitSeed || 50, !!o.isGhostOfficer, g);
              return { ...o, portraitId: pid, svg: renderPortraitSprite(pid, !!o.isGhostOfficer) };
            });
          }
          rebuildPortShipyardOffersForFaction(port);
        }
      });
    }

    if (data.villages) {
      data.villages.forEach(sv => {
        const fv = FISHING_VILLAGES.find(v => v.id === sv.id);
        if (fv) { fv.crewAvail = sv.crewAvail; fv.foodStock = sv.foodStock; fv.raidCooldown = sv.raidCooldown || 0; }
      });
    }
    if (data.fowGrid && data.fowGrid.length === fowGrid.length) fowGrid.set(data.fowGrid);
    if (data.explorationSites) {
      data.explorationSites.forEach(savedSite => {
        const site = EXPLORATION_SITES.find(s => s.id === savedSite.id);
        if (site) {
          site.mapBought = !!savedSite.mapBought; site.discovered = savedSite.discovered;
          site.looted = savedSite.looted;
          if (savedSite.forageLeft !== undefined) site.forageLeft = savedSite.forageLeft;
          if (savedSite.lastReport) site.lastReport = savedSite.lastReport;
        }
      });
    }

    if (game.activeMission) {
      const ms = game.activeMission;
      if (ms.type === 'hunt' || ms.type === 'capture_only') {
        const mCfg = data.activeMissionShipData;
        const spawned = spawnWorldShip({
          faction: (mCfg && mCfg.faction) || ms.enemyFaction || 'spain',
          clsKey: (mCfg && mCfg.clsKey) || (ms.type === 'capture_only' ? 'corvette' : 'frigate'),
          x: (mCfg && mCfg.x) || ms.spawnX, y: (mCfg && mCfg.y) || ms.spawnY,
          name: (mCfg && mCfg.name) || ms.title, isMissionTarget: true,
          mustCaptureOnly: ms.type === 'capture_only', missionId: ms.id, skipEscorts: true
        });
        if (mCfg && mCfg.hull) spawned.hull = mCfg.hull;
        if (mCfg && mCfg.sail) spawned.sail = mCfg.sail;
        if (mCfg && mCfg.crew) spawned.crew = mCfg.crew;
      } else if (ms.type === 'rescue') {
        flotsam.push(data.activeMissionFlotsamData ? { ...data.activeMissionFlotsamData, isMissionRescue: true } : { x: ms.spawnX, y: ms.spawnY, gold: 50, goodId: 'food', goodAmt: 2, survivors: 4, faction: ms.faction, isMissionRescue: true, life: 9200 });
      }
    }

    if (data.silverFleetSaveData && window.spawnSilverFleetConvoy) {
      const sf = spawnSilverFleetConvoy();
      if (sf) {
        const dx = data.silverFleetSaveData.x - sf.x;
        const dy = data.silverFleetSaveData.y - sf.y;
        ships.forEach(s => {
          if (s.isSilverFleet) {
            s.x += dx; s.y += dy;
            s.destX = data.silverFleetSaveData.destX || s.destX;
            s.destY = data.silverFleetSaveData.destY || s.destY;
          }
        });
        sf.hull = data.silverFleetSaveData.hull || sf.hull;
        sf.sail = data.silverFleetSaveData.sail || sf.sail;
        sf.crew = data.silverFleetSaveData.crew || sf.crew;
      }
    }

    recalculateFactionTerritories();
    camera.x = player.x; camera.y = player.y;
    document.getElementById('mainMenuOverlay').classList.add('hidden');
    document.getElementById('optionsOverlay').classList.remove('active');
    document.getElementById('gameOverOverlay').classList.remove('active');
    if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
    applyLanguageToStaticDOM();
    recalcPlayerDerivedStats();
    rebuildCannonPips();
    renderOfficerHudBar();
    if (window.syncFleetOrdersUI) syncFleetOrdersUI();
    if (window.renderTutorialBanner) renderTutorialBanner();
    updateHUD();
  } catch (err) { logEvent('⚠️ ' + err.message); }
};

window.loadGameFromStorage = function() { loadGameFromSlot(1); };

// ============================================================================
// MODIFIKATOREN (inkl. Galionsfiguren & Oberbootsmann!)
// ============================================================================
window.hasOfficerRole = function(roleId) { return player && player.officers && player.officers.some(o => o.roleId === roleId); };
window.hasCaptainPerk = function(perkId) { return game && game.captain && (game.captain.perks || []).includes(perkId); };
window.hasVoodooPower = function(powerId) { return game && game.captain && (game.captain.voodooPowers || []).includes(powerId); };
window.canDrawMap = function() { return getOfficerModifiers().canMap > 0; };
window.hasNavigatorForWaypoints = function() { return hasOfficerRole('navigator'); };

window.getOfficerModifiers = function() {
  const cap = game.captain;
  const perks = cap.perks || [];
  const voodooList = cap.voodooPowers || [];
  const capTrait = CAPTAIN_TRAITS.find(tObj => tObj.id === cap.trait);
  const ghostSailLvl = (player && player.upgrades && player.upgrades.ghost_sails) || 0;

  const repVal = game.reputation || 0;
  const repTradeMod = repVal >= 30 ? 0.05 : (repVal <= -65 ? -0.06 : (repVal <= -25 ? -0.02 : 0));

  const totals = {
    reloadMult: cap.skills.gunnery * 0.04,
    damageMult: cap.skills.gunnery * 0.04 + (perks.includes('perk_broadsides') ? 0.08 : 0),
    speedMult: cap.skills.seamanship * 0.03 + ghostSailLvl * 0.04,
    turnMult: cap.skills.seamanship * 0.03,
    cargoBonus: cap.skills.commerce * 8,
    lootMult: cap.skills.commerce * 0.05,
    tradeBonus: cap.skills.commerce * 0.03 + repTradeMod + (perks.includes('perk_scholar_parrot') ? 0.06 : 0) + (perks.includes('perk_hypno_eyepatch') ? 0.10 : 0),
    crewLossReduction: cap.skills.survival * 0.05,
    foodConsumptionMult: -cap.skills.survival * 0.03,
    rumConsumptionMult: 0,
    hullRegen: cap.skills.survival * 0.15,
    sailRegen: 0,
    crewEfficiency: 0,
    crewCapBonus: cap.skills.leadership * 4 + (perks.includes('perk_admiral') ? 12 : 0),
    hullBonus: cap.skills.survival * 22,
    sightMult: 0,
    spyglassSpeed: 0,
    shoalRadar: 0,
    reefDamageReduction: 0,
    canFoundBase: 0,
    baseBuildDiscount: 0,
    rangeMult: perks.includes('perk_broadsides') ? 0.06 : 0,
    sniperActive: 0,
    merchantIntel: 0,
    shipyardDiscount: 0,
    moraleRegen: cap.skills.leadership * 0.10,
    canMap: 0,
    modeSwitchSec: 0,
    treasureBonus: 0,
    forageBonus: 0,
    diseaseResist: perks.includes('perk_quarantine') ? 0.35 : 0,
    woundedHealRate: perks.includes('perk_quarantine') ? 1.0 : 0,
    boardingMeleeBonus: perks.includes('perk_boarding_master') ? 0.14 : 0,
    boardingRangedBonus: perks.includes('perk_boarding_master') ? 0.14 : 0
  };

  if (capTrait && capTrait.mods) for (const [k, v] of Object.entries(capTrait.mods)) totals[k] = (totals[k] || 0) + v;
  if (game.allegiance && FACTIONS[game.allegiance] && FACTIONS[game.allegiance].mods) {
    for (const [k, v] of Object.entries(FACTIONS[game.allegiance].mods)) totals[k] = (totals[k] || 0) + v;
  }
  if (player && player.specialEquipment) {
    const eqObj = SPECIAL_SHIP_EQUIPMENT.find(e => e.id === player.specialEquipment);
    if (eqObj && eqObj.mods) for (const [k, v] of Object.entries(eqObj.mods)) totals[k] = (totals[k] || 0) + v;
  }
  // Montierte Galionsfigur einrechnen!
  if (player && player.figurehead && window.FIGUREHEAD_DEFS) {
    const fhObj = FIGUREHEAD_DEFS.find(f => f.id === player.figurehead);
    if (fhObj && fhObj.mods) for (const [k, v] of Object.entries(fhObj.mods)) totals[k] = (totals[k] || 0) + v;
  }
  voodooList.forEach(vid => {
    const vp = VOODOO_POWERS.find(x => x.id === vid);
    if (vp && vp.mods) for (const [k, v] of Object.entries(vp.mods)) totals[k] = (totals[k] || 0) + v;
  });

  const binaryKeys = new Set(['canMap', 'sniperActive', 'merchantIntel', 'shoalRadar', 'canFoundBase']);
  player.officers.forEach(off => {
    const moraleEfficiency = 0.6 + 0.5 * (off.morale / 100);
    const roleMods = off.customMods || (OFFICER_ROLES.find(r => r.roleId === off.roleId) || {}).mods;
    if (roleMods) {
      for (const [k, v] of Object.entries(roleMods)) {
        totals[k] = (totals[k] || 0) + (typeof v === 'number' && Math.abs(v) < 5 && !binaryKeys.has(k) ? v * moraleEfficiency : v);
      }
    }
    if (off.posTrait && off.posTrait.mods) for (const [k, v] of Object.entries(off.posTrait.mods)) totals[k] = (totals[k] || 0) + v;
    if (off.negTrait && off.negTrait.mods) for (const [k, v] of Object.entries(off.negTrait.mods)) totals[k] = (totals[k] || 0) + v;
  });

  return totals;
};

window.getOfficerRelation = function(offA, offB) {
  if (!offA || !offB || offA.uid === offB.uid) return 0;
  if (hasCaptainPerk('perk_admiral')) return 40;
  if (offA.isGhostOfficer !== offB.isGhostOfficer) return -20;
  let score = 10;
  if (offA.faction === offB.faction) score += 35;
  else score += Math.round(((FACTIONS[offA.faction] && FACTIONS[offA.faction].relations[offB.faction]) || 0) * 0.45);
  return Math.max(-100, Math.min(100, score));
};

window.getRankForFaction = function(factionId) {
  const pts = (game.rankPts && game.rankPts[factionId]) || 0;
  let current = RANK_TITLES[0];
  for (const r of RANK_TITLES) if (pts >= r.minPts) current = r;
  return current;
};

window.grantCaptainXP = function(amount, reason = '') {
  const cap = game.captain;
  cap.xp += amount;
  let leveledUp = false;
  while (cap.xp >= cap.xpNext) {
    cap.xp -= cap.xpNext; cap.level++; cap.skillPoints++;
    if (cap.level % 2 === 0) cap.perkPoints = (cap.perkPoints || 0) + 1;
    cap.xpNext = Math.round(cap.xpNext * 1.48);
    leveledUp = true;
  }
  if (leveledUp) { SoundFX.play('coin'); logEvent(`🎖️ LEVEL UP! ${cap.name} ➔ Lv.${cap.level} [K]!`); }
  else if (reason) logEvent(`${reason} (+${amount} XP)`);
  updateHUD();
};

window.toggleCaptainModal = function() {
  const overlay = document.getElementById('captainOverlay');
  overlay.classList.toggle('active');
  if (window.syncSingleplayerPauseState) syncSingleplayerPauseState();
  if (overlay.classList.contains('active')) renderCaptainModal();
};

window.renderCaptainModal = function() {
  if (window.applySceneBackgroundToModal) {
    const scKey = (window.game && game.allegiance && window.resolvePortSceneKey) ? resolvePortSceneKey({ faction: game.allegiance }, 'gov') : 'gov_pirates';
    applySceneBackgroundToModal('captainOverlay', scKey);
  }
  const cap = game.captain;
  const traitObj = CAPTAIN_TRAITS.find(tObj => tObj.id === cap.trait) || CAPTAIN_TRAITS[0];
  const eqObj = SPECIAL_SHIP_EQUIPMENT.find(e => e.id === player.specialEquipment);
  const cStats = getPlayerEquippedCannonStats();
  const repTier = getPlayerReputationTier(game.reputation || 0);
  const wages = getDailyWageBreakdown();

  const pBox = document.getElementById('capModalPortrait');
  if (pBox) { pBox.style.width = '76px'; pBox.style.height = '57px'; pBox.style.aspectRatio = '4 / 3'; pBox.innerHTML = cap.svg; }
  document.getElementById('capModalTitle').textContent = `${cap.isGhostCaptain ? '👻 ' : ''}${cap.name} (Lv.${cap.level})`;
  document.getElementById('capModalSub').innerHTML = `XP: ${cap.xp}/${cap.xpNext} | ${td(traitObj, 'name')} | ☠️ <span style="color:${repTier.color};">${game.reputation || 0}</span> | 💰 -${wages.total} 🪙/T`;

  const skillDefs = [
    { id: 'gunnery', name: '💥 Artillerie', desc: '+4% Dmg & +4% Reload' },
    { id: 'seamanship', name: '⛵ Seemannschaft', desc: '+3% Speed & +3% Turn' },
    { id: 'commerce', name: '⚖️ Kaufmannskunst', desc: '+8 Cargo & +3% Trade' },
    { id: 'leadership', name: '🎖️ Führung', desc: '+4 Crew & Morale' },
    { id: 'survival', name: '🛡️ Überleben', desc: '+22 Hull HP & -5% Loss' }
  ];

  const fleet = player.fleet || [];
  document.getElementById('captainModalBody').innerHTML = `
    <div class="card-box" style="margin-bottom:12px; background:#091119;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div class="card-title">⚓ Flotte (1 + ${fleet.length}/${MAX_ESCORT_SHIPS})</div>
        <div style="display:flex; gap:6px;">
          <button class="sm-btn" style="border-color:#38bdf8; color:#bae6fd;" onclick="document.getElementById('captainOverlay').classList.remove('active'); toggleShipInventoryModal();">🧰 Schiffs- &amp; Kapitäns-Inventar öffnen [I]</button>
          <button class="sm-btn" onclick="promptRenameShip()">${t('renameShipBtn')}</button>
        </div>
      </div>
      <div class="card-desc">
        <strong>${escapeHtml(player.shipName)}</strong> (${player.cannonsPerSide}K/Seite, ${Math.ceil(player.hull)}/${player.maxHull} HP) | 💣 <span style="color:#2ecc71;">${cStats.summary}</span> | [R]: <span style="color:#fde047;">${eqObj ? td(eqObj, 'name') : '—'}</span>
      </div>
    </div>

    <h3 style="color:#ffd700; font-size:14.5px; margin-bottom:7px;">📊 Kern-Attribute (${cap.skillPoints})</h3>
    <div class="grid-3" style="margin-bottom:14px;">
      ${skillDefs.map(sd => `
        <div class="card-box">
          <div><div class="card-title">${sd.name} (${cap.skills[sd.id]})</div><div class="card-desc">${sd.desc}</div></div>
          <button class="action-btn" ${cap.skillPoints <= 0 ? 'disabled' : ''} onclick="upgradeCaptainSkill('${sd.id}')"><span>+1</span><span>${cap.skillPoints > 0 ? '1 Pkt' : '0'}</span></button>
        </div>`).join('')}
    </div>

    <h3 style="color:#ffd700; font-size:14.5px; margin-bottom:7px;">⭐ Spezial-Perks (${cap.perkPoints || 0})</h3>
    <div class="grid-3">
      ${CAPTAIN_PERKS.map(pk => {
        const owned = hasCaptainPerk(pk.id);
        const hasReqPerk = !pk.reqPerk || hasCaptainPerk(pk.reqPerk);
        const reqPerkObj = pk.reqPerk ? CAPTAIN_PERKS.find(p => p.id === pk.reqPerk) : null;
        const canPick = !owned && (cap.perkPoints || 0) > 0 && cap.level >= pk.reqLevel && hasReqPerk;
        return `
          <div class="card-box" style="border-color:${owned ? '#2ecc71' : (hasReqPerk ? '#5a4628' : '#7f1d1d')};">
            <div>
              <div class="card-title">${td(pk, 'name')} (Lv.${pk.reqLevel})</div>
              <div class="card-desc">${td(pk, 'desc')}${!hasReqPerk && reqPerkObj ? `<br><span style="color:#ff7675;">🔒 ${td(reqPerkObj, 'name')}</span>` : ''}</div>
            </div>
            <button class="action-btn" ${!canPick ? 'disabled' : ''} onclick="unlockCaptainPerk('${pk.id}')"><span>${owned ? '✓' : (!hasReqPerk ? '🔒' : '★')}</span><span>★</span></button>
          </div>`;
      }).join('')}
    </div>
  `;
};

window.upgradeCaptainSkill = function(skillId) {
  if (game.captain.skillPoints <= 0) return;
  game.captain.skillPoints--;
  game.captain.skills[skillId]++;
  recalcPlayerDerivedStats(); renderOfficerHudBar(); updateHUD(); renderCaptainModal();
};

window.unlockCaptainPerk = function(perkId) {
  const cap = game.captain;
  const pk = CAPTAIN_PERKS.find(p => p.id === perkId);
  if (!pk || (cap.perkPoints || 0) <= 0 || cap.level < pk.reqLevel || hasCaptainPerk(perkId)) return;
  if (pk.reqPerk && !hasCaptainPerk(pk.reqPerk)) return;
  cap.perkPoints--;
  cap.perks = cap.perks || [];
  cap.perks.push(perkId);
  recalcPlayerDerivedStats(); renderOfficerHudBar(); updateHUD(); renderCaptainModal();
};