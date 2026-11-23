player.baseMaxHull = Math.max(120, sp.maxHull - bonusDiff);
            player.maxHull = sp.maxHull;
          }
          player.hull = sp.hull;
          player.sail = sp.sail;
          player.crew = sp.crew;
          player.inBoardingLock = !!sp.inBoardingLock;
          game.gold = sp.gold;
          // Sanfte Positionskorrektur nur bei starker Abweichung (> 95px Rubberband-Schutz)
          if (Math.hypot(sp.x - player.x, sp.y - player.y) > 95) {
            player.x = player.x * 0.6 + sp.x * 0.4;
            player.y = player.y * 0.6 + sp.y * 0.4;
          }
          updateHUD();
        } else {
          seenIds.add(sp.id);
          const fac = FACTIONS[sp.faction] || FACTIONS.pirates;
          const tpl = SHIP_CLASSES[sp.clsKey] || SHIP_CLASSES.sloop;
          let rp = window.remotePlayers[sp.id];
          if (!rp) {
            rp = {
              sessionId: sp.id,
              isRemotePlayer: true,
              x: sp.x, y: sp.y, angle: sp.angle, speed: sp.speed || 0,
              clsKey: sp.clsKey || 'sloop',
              faction: sp.faction || 'pirates',
              falseFlag: sp.falseFlag || null,
              name: sp.shipName || td(tpl, 'name'),
              captainName: sp.name || 'Kapitän',
              captainPortraitId: sp.portraitId || 'freibeuter:4',
              length: tpl.length, width: tpl.width,
              cannonsPerSide: sp.cannonsPerSide || tpl.cannonsPerSide,
              portCannons: initCannonsArray(sp.cannonsPerSide || tpl.cannonsPerSide),
              stbdCannons: initCannonsArray(sp.cannonsPerSide || tpl.cannonsPerSide),
              hull: sp.hull, maxHull: sp.maxHull || tpl.hull,
              sail: sp.sail || tpl.sail, maxSail: tpl.sail,
              crew: sp.crew || tpl.crew, maxCrew: tpl.crew,
              hullColor: fac.hullColor, sailColor: fac.sailColor, flagColor: fac.color,
              combatMode: !!sp.combatMode,
              cannonExtendPct: sp.combatMode ? 1 : 0,
              inBoardingLock: !!sp.inBoardingLock
            };
            window.remotePlayers[sp.id] = rp;
          } else {
            rp.x += (sp.x - rp.x) * 0.35;
            rp.y += (sp.y - rp.y) * 0.35;
            rp.angle = sp.angle;
            rp.speed = sp.speed || 0;
            rp.hull = sp.hull;
            rp.maxHull = sp.maxHull || rp.maxHull;
            rp.sail = sp.sail || rp.sail;
            rp.clsKey = sp.clsKey || rp.clsKey;
            rp.falseFlag = sp.falseFlag || null;
            rp.combatMode = !!sp.combatMode;
            rp.cannonExtendPct = sp.combatMode ? 1 : 0;
            rp.inBoardingLock = !!sp.inBoardingLock;
          }
        }
      });

      Object.keys(window.remotePlayers).forEach(id => {
        if (!seenIds.has(id)) delete window.remotePlayers[id];
      });
    });

    // Sicht- & hörbare Kanonenschüsse anderer Online-Spieler
    this.room.onMessage('cannon_fired', data => {
      if (!data || data.shooterId === this.sessionId) return;
      const rp = window.remotePlayers[data.shooterId];
      if (!rp) return;
      const side = data.side === -1 ? -1 : 1;
      rp.ammoType = data.ammoType || 'round';
      rp.combatMode = true;
      rp.cannonExtendPct = 1.0;
      for (let i = 0; i < rp.portCannons.length; i++) rp.portCannons[i] = 0;
      for (let i = 0; i < rp.stbdCannons.length; i++) rp.stbdCannons[i] = 0;

      if (window.fireShipCannonOrBroadside) {
        fireShipCannonOrBroadside(rp, side, false, !!data.isBroadside);
      }
      if (Math.hypot(rp.x - player.x, rp.y - player.y) < 1500) {
        SoundFX.play(data.isBroadside ? 'broadside' : 'cannon');
      }
    });

    // Öffentlicher Proximity-Sprachrohr-Ruf eines anderen Spielers
    this.room.onMessage('proximity_shout', data => {
      if (!data || data.fromId === this.sessionId) return;
      const rp = window.remotePlayers[data.fromId];
      if (!rp) return;
      if (Math.hypot(rp.x - player.x, rp.y - player.y) <= 1350) {
        SoundFX.play('horn');
        pushProximityShoutBubble(rp, rp.x, rp.y, data.senderName || rp.captainName, data.text, '#38bdf8');
      }
    });

    // Eingehende Kontaktanfrage [U]
    this.room.onMessage('hail_request', data => {
      if (!data) return;
      receiveIncomingHailRequest(data.fromId, data.fromName || 'Fremder Kapitän');
    });

    // Antwort auf unsere Kontaktanfrage [U]
    this.room.onMessage('hail_response', data => {
      if (!data) return;
      window.pendingHailRequest = null;
      if (data.accepted) {
        const rp = window.remotePlayers[data.fromId];
        if (rp) {
          window.currentTalkTarget = rp;
          openCaptainTalkModal();
        }
      } else {
        SoundFX.play('hit');
        logEvent(t('hailRequestDeclined'));
      }
    });

    // Private Nachricht im geöffneten Gesprächsfenster
    this.room.onMessage('direct_msg', data => {
      if (!data) return;
      SoundFX.play('card');
      logEvent(`📨 ${data.fromName}: „${data.text}“`);
    });

    // Kill-Prämie im Deathmatch / Liga-Ergebnis
    this.room.onMessage('kill_reward', data => {
      if (!data) return;
      SoundFX.play('coin');
      spawnWorldCombatText(player.x, player.y - 24, `💀 KILL +${data.bounty} 🪙!`, '#ffd700', 17);
      logEvent(`🏆 ${data.victimName} versenkt! Kopfgeld: +${data.bounty} 🪙 (Nutze die Safe-Zone zum Aufrüsten!)`);
    });

    this.room.onLeave(() => {
      this.room = null;
      this.sessionId = null;
      window.remotePlayers = {};
      logEvent('🔌 Verbindung zum Multiplayer-Server getrennt.');
    });
  },

  // Sendet ausschließlich Eingaben (keine lokalen HP/Gold-Werte -> Cheat-sicher!)
  tickSendInputs(keys, mouse) {
    if (!this.isConnected() || (game.time % 3 !== 0)) return;
    let rudder = 0;
    if (keys['a'] || keys['arrowleft']) rudder -= 1;
    if (keys['d'] || keys['arrowright']) rudder += 1;

    const modalOpen = window.isAnyModalOverlayOpen && isAnyModalOverlayOpen();
    const spyActive = window.spyglassState && spyglassState.active;
    const canFire = !modalOpen && !spyActive;

    this.room.send('input', {
      seq: ++this.inputSeq,
      rudder,
      sailSetting: player.sailSetting,
      combatMode: !!player.combatMode,
      fireCadence: player.fireCadence || 'single',
      ammoType: player.ammoType,
      falseFlag: player.falseFlag,
      firePort: canFire && !!(keys['q'] || mouse.left || keys[' ']),
      fireStbd: canFire && !!(keys['e'] || mouse.right || keys[' '])
    });
  },

  sendProximityShout(text) { if (this.isConnected()) this.room.send('shout', { text }); },
  sendHailRequest(targetSessionId) { if (this.isConnected()) this.room.send('hail_req', { targetId: targetSessionId }); },
  respondHailRequest(requesterId, accepted) { if (this.isConnected()) this.room.send('hail_res', { targetId: requesterId, accepted: !!accepted }); },
  sendDirectMessage(targetId, text) { if (this.isConnected()) this.room.send('direct_msg', { targetId, text }); },
  sendBoardingState(active, targetId) { if (this.isConnected()) this.room.send('boarding_lock', { active: !!active, targetId }); },
  sendShipRefit(clsKey, factionId) { if (this.isConnected()) this.room.send('refit_ship', { clsKey, faction: factionId }); },
  sendBaseClaim(plotId, baseName) { if (this.isConnected()) this.room.send('claim_base', { plotId, baseName }); },

  disconnect() {
    if (this.room) {
      try { this.room.leave(); } catch (e) {}
      this.room = null;
      this.sessionId = null;
    }
    window.remotePlayers = {};
  }
};

// Wendet Liga-Budget-Ausrüstung oder Deathmatch-Startwerte auf das Spielerschiff an
window.applyArenaLoadoutLocally = function(mode) {
  const fac = mpLobbyState.faction || 'pirates';
  const nassau = PORTS.find(p => p.id === 'nassau') || PORTS[0];
  const seaAng = nassau.seaAngle || Math.PI / 2;

  if (mode === 'league_pvp') {
    const ld = mpLobbyState.loadout;
    const fStats = getFactionShipStats(ld.clsKey, fac);
    player.shipName = fStats.name;
    player.clsKey = ld.clsKey;
    player.shipFaction = fac;
    player.length = fStats.length; player.width = fStats.width;
    player.cannonsPerSide = fStats.cannonsPerSide;
    player.portCannons = initCannonsArray(fStats.cannonsPerSide);
    player.stbdCannons = initCannonsArray(fStats.cannonsPerSide);
    player.portCannonDamage = initCannonsArray(fStats.cannonsPerSide);
    player.stbdCannonDamage = initCannonsArray(fStats.cannonsPerSide);
    player.baseMaxSpeed = fStats.baseSpeed; player.baseTurnRate = fStats.turnRate;
    player.reloadMax = fStats.reload; player.baseDamage = fStats.dmg;
    player.baseMaxHull = fStats.hull; player.maxSail = fStats.sail; player.sail = fStats.sail;
    player.baseMaxCrew = fStats.crew; player.crew = fStats.crew;
    player.baseCargoCap = fStats.cargoCap;
    player.specialEquipment = ld.specialEquip || null;
    player.combatMode = true; player.cannonExtendPct = 1.0;

    CANNON_TYPES.forEach(ct => { player.cargo[ct.id] = 0; });
    player.cargo[ld.cannonId || 'cannon_12pdr'] = fStats.cannonsPerSide * 2;
    player.cargo.timber = 6; player.cargo.canvas = 4; player.cargo.food = 12; player.cargo.rum = 10;

    player.officers = [];
    if (ld.officer1) player.officers.push(generateRandomOfficer(fac, ld.officer1));
    if (ld.officer2 && ld.officer2 !== ld.officer1) player.officers.push(generateRandomOfficer(fac, ld.officer2));
    game.gold = 0;
  } else if (mode === 'deathmatch') {
    game.gold = 400; // Startkapital; jeder Kill bringt +250 Gold für die Safe-Zone Nassau!
    player.combatMode = true; player.cannonExtendPct = 1.0;
    player.x = nassau.x + Math.cos(seaAng) * 520;
    player.y = nassau.y + Math.sin(seaAng) * 520;
  }

  recalcPlayerDerivedStats();
  player.hull = player.maxHull;
  rebuildCannonPips();
  renderOfficerHudBar();
  updateHUD();
};

// Ermöglicht sofortiges Testen von Liga-Budget & Deathmatch gegen KI-Gegner ohne laufenden Node-Server!
window.startOfflineArenaPractice = function() {
  const mode = mpLobbyState.mode;
  if (mode === 'league_pvp') {
    const tier = MP_LEAGUE_TIERS.find(tObj => tObj.id === mpLobbyState.leagueTierId) || MP_LEAGUE_TIERS[1];
    const costObj = calcLeagueLoadoutCost(mpLobbyState.loadout, mpLobbyState.faction);
    if (costObj.total > tier.budget) {
      mpLobbyState.statusMsg = `⚠️ Budget überschritten (${costObj.total} / ${tier.budget} 🪙)!`;
      renderMultiplayerLobby();
      return;
    }
  }

  document.getElementById('mpLobbyOverlay').classList.remove('active');
  document.getElementById('mainMenuOverlay').classList.add('hidden');
  initNewGameFromCreation({ ...creationState, capName: mpLobbyState.capName }, true, mode);
  applyArenaLoadoutLocally(mode);

  // Gegner für das Übungsmatch spawnen
  ships.length = 0;
  const enemyFacs = ['england', 'spain', 'france', 'netherlands', 'denmark'].filter(f => f !== mpLobbyState.faction);
  const count = mode === 'league_pvp' ? 1 : 6;
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2;
    const dist = mode === 'league_pvp' ? 680 : (750 + Math.random() * 650);
    const eShip = spawnWorldShip({
      faction: enemyFacs[i % enemyFacs.length],
      clsKey: mode === 'league_pvp' ? mpLobbyState.loadout.clsKey : (i % 2 === 0 ? 'brigantine' : 'corvette'),
      x: player.x + Math.cos(ang) * dist,
      y: player.y + Math.sin(ang) * dist,
      isBountyHunter: true,
      skipEscorts: true
    });
    eShip.gold = 560; // ~250 🪙 Kill-Belohnung
  }

  logEvent(mode === 'league_pvp'
    ? '🏆 Liga-Duell gestartet! Gleiches Budget – möge der bessere Kapitän siegen!'
    : '💀 Deathmatch gestartet! Sammle Gold pro Kill und rüste in der Safe-Zone (Nassau [F]) auf!');
};

window.renderMultiplayerLobby = function() {
  const body = document.getElementById('mpLobbyBody');
  if (!body) return;
  const m = mpLobbyState.mode;
  const tier = MP_LEAGUE_TIERS.find(tObj => tObj.id === mpLobbyState.leagueTierId) || MP_LEAGUE_TIERS[1];
  const costObj = calcLeagueLoadoutCost(mpLobbyState.loadout, mpLobbyState.faction);
  const overBudget = costObj.total > tier.budget;

  const allowedShips = ['sloop', 'brigantine', 'flute', 'corvette', 'frigate', 'galleon', 'manowar'];
  const allowedCannons = CANNON_TYPES.filter(c => !c.enclaveOnly);
  const allowedEquips = SPECIAL_SHIP_EQUIPMENT.filter(e => !e.enclaveOnly);

  body.innerHTML = `
    <div class="tabs-bar">
      <button class="tab-btn ${m === 'open_world' ? 'active' : ''}" onclick="openMultiplayerLobby('open_world')">${t('mpOpenWorld')}</button>
      <button class="tab-btn ${m === 'league_pvp' ? 'active' : ''}" onclick="openMultiplayerLobby('league_pvp')">${t('mpLeaguePvp')}</button>
      <button class="tab-btn ${m === 'deathmatch' ? 'active' : ''}" onclick="openMultiplayerLobby('deathmatch')">${t('mpDeathmatch')}</button>
    </div>

    <div class="grid-2" style="margin-bottom:12px;">
      <div class="card-box" style="background:#091119;">
        <div class="card-title">🌐 Colyseus-Server &amp; Kapitän</div>
        <div style="margin-top:8px; display:flex; flex-direction:column; gap:8px;">
          <div>
            <label style="font-size:11px; color:#94a3b8;">WebSocket Server-Adresse:</label>
            <input type="text" value="${escapeHtml(mpLobbyState.serverUrl)}" oninput="mpLobbyState.serverUrl=this.value; localStorage.setItem('blood_doubloons_mp_url', this.value);" style="width:100%; background:#081018; border:1px solid #475569; color:#38bdf8; padding:6px 8px; border-radius:5px;">
          </div>
          <div style="display:flex; gap:8px;">
            <div style="flex:1;">
              <label style="font-size:11px; color:#94a3b8;">Kapitänsname:</label>
              <input type="text" value="${escapeHtml(mpLobbyState.capName)}" oninput="mpLobbyState.capName=this.value" style="width:100%; background:#081018; border:1px solid #d4af37; color:#ffd700; padding:6px 8px; border-radius:5px; font-weight:bold;">
            </div>
            <div style="flex:1;">
              <label style="font-size:11px; color:#94a3b8;">Flagge / Nation:</label>
              <select onchange="setMpLobbyField('faction', this.value)" style="width:100%; background:#081018; border:1px solid #d4af37; color:#f8fafc; padding:6px 8px; border-radius:5px;">
                ${Object.values(FACTIONS).map(f => `<option value="${f.id}" ${mpLobbyState.faction === f.id ? 'selected' : ''}>${td(f, 'short')}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="card-box" style="background:#091119; border-color:#38bdf8;">
        <div class="card-title">🛡️ Modus-Regeln &amp; Anti-Cheat</div>
        <div class="card-desc" style="color:#cbd5e1; font-size:12px; margin-top:6px;">
          ${m === 'open_world'
            ? '• Persistente 24.000×24.000 Karibik in Echtzeit ohne Pause.<br>• 22 freie Küsten-Bauplätze (Baumeister + Rohstoffe), Enterschutz & Fernglas-Aufklärung.<br>• Proximity-Sprachrohr für alle sichtbar + ablehnbare Kontaktanfragen [U].'
            : (m === 'league_pvp'
                ? '• Faire 1v1 / Team-Gefechte unter strikten Liga-Budget-Regeln.<br>• Jeder Kapitän hat exakt dasselbe Dublonen-Budget für Schiff, Kanonen, Equipment & Offiziere.<br>• Server prüft Budget & berechnet Treffer/HP zu 100 % autoritativ.'
                : '• Schnelle Drop-in-Action! Jeder Kill bringt sofort +250 🪙 Kopfgeld.<br>• Segle lebend in die geschützte Safe-Zone (Nassau-Ring [F]), um zu reparieren, Kanonen nachzurüsten oder ein größeres Kriegsschiff zu kaufen!')}
        </div>
      </div>
    </div>

    ${m === 'league_pvp' ? `
      <div class="card-box" style="margin-bottom:12px; background:#0b1520; border-color:${overBudget ? '#ef4444' : '#ffd700'};">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
          <div class="card-title">🏆 Liga-Budget-Konfigurator</div>
          <div style="font-size:15px; font-weight:bold; color:${overBudget ? '#ef4444' : '#2ecc71'};">
            💰 Kosten: ${costObj.total} / ${tier.budget} 🪙 ${overBudget ? '(ÜBERSCHRITTEN!)' : '✓'}
          </div>
        </div>

        <div class="grid-3" style="margin-bottom:10px;">
          ${MP_LEAGUE_TIERS.map(tObj => `
            <div onclick="setMpLobbyField('leagueTierId', '${tObj.id}')" style="padding:8px 10px; border-radius:6px; cursor:pointer; border:1.5px solid ${mpLobbyState.leagueTierId === tObj.id ? '#ffd700' : '#334155'}; background:${mpLobbyState.leagueTierId === tObj.id ? '#2c2112' : '#091119'};">
              <div style="font-weight:bold; color:#ffd700; font-size:12.5px;">${tObj.name} (${tObj.budget} 🪙)</div>
              <div style="font-size:11px; color:#94a3b8;">${tObj.desc}</div>
            </div>
          `).join('')}
        </div>

        <div class="grid-3">
          <div>
            <label style="font-size:11px; color:#94a3b8;">1. Schiffsklasse (${costObj.shipCost} 🪙):</label>
            <select onchange="setMpLobbyField('loadout.clsKey', this.value)" style="width:100%; background:#081018; color:#ffd700; border:1px solid #d4af37; padding:6px; border-radius:5px;">
              ${allowedShips.map(ck => `<option value="${ck}" ${mpLobbyState.loadout.clsKey === ck ? 'selected' : ''}>${td(SHIP_CLASSES[ck], 'name')} (${SHIP_CLASSES[ck].price}🪙)</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size:11px; color:#94a3b8;">2. Geschütze (${costObj.cannonCount}× = ${costObj.cannonCost} 🪙):</label>
            <select onchange="setMpLobbyField('loadout.cannonId', this.value)" style="width:100%; background:#081018; color:#ffd700; border:1px solid #d4af37; padding:6px; border-radius:5px;">
              ${allowedCannons.map(ct => `<option value="${ct.id}" ${mpLobbyState.loadout.cannonId === ct.id ? 'selected' : ''}>${td(ct, 'shortName')} (💥${ct.damage})</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size:11px; color:#94a3b8;">3. Spezial-Equipment [R] (${costObj.eqCost} 🪙):</label>
            <select onchange="setMpLobbyField('loadout.specialEquip', this.value)" style="width:100%; background:#081018; color:#ffd700; border:1px solid #d4af37; padding:6px; border-radius:5px;">
              <option value="">— Kein Equipment (0🪙) —</option>
              ${allowedEquips.map(eq => `<option value="${eq.id}" ${mpLobbyState.loadout.specialEquip === eq.id ? 'selected' : ''}>${td(eq, 'name')} (${eq.cost}🪙)</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="grid-2" style="margin-top:8px;">
          <div>
            <label style="font-size:11px; color:#94a3b8;">4. Erster Offizier:</label>
            <select onchange="setMpLobbyField('loadout.officer1', this.value)" style="width:100%; background:#081018; color:#f8fafc; border:1px solid #475569; padding:6px; border-radius:5px;">
              <option value="">— Keiner —</option>
              ${OFFICER_ROLES.map(r => `<option value="${r.roleId}" ${mpLobbyState.loadout.officer1 === r.roleId ? 'selected' : ''}>${td(r, 'title')} (${r.baseCost}🪙)</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size:11px; color:#94a3b8;">5. Zweiter Offizier:</label>
            <select onchange="setMpLobbyField('loadout.officer2', this.value)" style="width:100%; background:#081018; color:#f8fafc; border:1px solid #475569; padding:6px; border-radius:5px;">
              <option value="">— Keiner —</option>
              ${OFFICER_ROLES.map(r => `<option value="${r.roleId}" ${mpLobbyState.loadout.officer2 === r.roleId ? 'selected' : ''}>${td(r, 'title')} (${r.baseCost}🪙)</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
    ` : ''}

    ${mpLobbyState.statusMsg ? `<div style="padding:9px 12px; margin-bottom:12px; background:#1e1b2e; border:1px solid #f59e0b; border-radius:6px; color:#fde047; font-size:12.5px;">${escapeHtml(mpLobbyState.statusMsg)}</div>` : ''}

    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
      <button class="action-btn" onclick="startOfflineArenaPractice()">
        <span>🤖 Modus lokal mit KI-Gegnern testen (ohne Server)</span>
      </button>
      <button class="primary-btn" ${m === 'league_pvp' && overBudget ? 'disabled' : ''} onclick="NetClient.connectAndJoin('${m}')">
        🌐 Mit Colyseus-Server verbinden &amp; Segel setzen!
      </button>
    </div>
  `;
};