// ============================================================================
// adventures_voodoo.js - 1714 - Blood and Doubloons
//                        1. 5 komplett eigenständige, verzweigende Schatzsuche-
//                           Story-Kampagnen mit wechselnden Schauplatz-Gemälden
//                           & GARANTIERTEN einzigartigen Schatz-Relikten
//                           (Galionsfiguren, [R]-Schiffsequipment & Duell-Waffen!)
//                        2. Verborgener Voodoo-Priester (Geist-Verwandlung & Loa)
//                        3. 3-Schritte-Onboarding-Tutorial (Benjamin Hornigold)
// ============================================================================

const LANDMARK_DEFS = {
  twin_palms: {
    id: 'twin_palms', icon: '🌴',
    name_de: 'Gekreuzte Zwillingspalmen am weißen Riff',
    name_en: 'Crossed Twin Palms by the White Reef',
    wrongTrap_de: 'Ein verborgenes Fallnetz und angespitzte Bambuspfähle schnellen aus dem Unterholz!',
    wrongTrap_en: 'A hidden snare and sharpened bamboo stakes whip out from the brush!'
  },
  cannon_wreck: {
    id: 'cannon_wreck', icon: '💣',
    name_de: 'Halb im Sand versunkener Bronzekanonen-Lauf',
    name_en: 'Half-Buried Bronze Cannon Barrel',
    wrongTrap_de: 'Alte Stolperdrähte früherer Bukaniere zünden eine vergrabene Schwarzpulver-Mine!',
    wrongTrap_en: 'Old buccaneer tripwires detonate a buried black-powder charge!'
  },
  obsidian_monolith: {
    id: 'obsidian_monolith', icon: '🗿',
    name_de: 'Schwarzer Obsidian-Monolith mit Schlangenrelief',
    name_en: 'Black Obsidian Monolith with Serpent Carving',
    wrongTrap_de: 'Du trittst auf eine nachgebende Steinplatte – Giftpfeile zischen aus steinernen Fratzen!',
    wrongTrap_en: 'You step onto a sinking stone slab—poison darts hiss from carved stone jaws!'
  },
  skull_arch: {
    id: 'skull_arch', icon: '💀',
    name_de: 'Verwitterter Felsbogen in Form eines Totenschädels',
    name_en: 'Weathered Skull-Shaped Rock Arch',
    wrongTrap_de: 'Der falsche Felspfad bricht unter den Stiefeln weg – scharfes Geröll reißt Männer in die Tiefe!',
    wrongTrap_en: 'The wrong cliff ledge crumbles beneath your boots—loose rock drags sailors down!'
  },
  waterfall_cave: {
    id: 'waterfall_cave', icon: '🌊',
    name_de: 'Schäumender Dschungel-Wasserfall vor einer Grotte',
    name_en: 'Foaming Jungle Waterfall Hiding a Grotto',
    wrongTrap_de: 'Tückischer Treibsand und hungrige Kaimane lauern im falschen Flussarm!',
    wrongTrap_en: 'Treacherous quicksand and snapping caimans lurk in the wrong creek!'
  },
  bat_cenote: {
    id: 'bat_cenote', icon: '🦇',
    name_de: 'Moosbewachsene Kalkstein-Cenote voller Fledermäuse',
    name_en: 'Mossy Limestone Cenote Swarming with Bats',
    wrongTrap_de: 'Giftige Sumpfgase und Skorpione steigen aus der falschen Erdspalte auf!',
    wrongTrap_en: 'Choking marsh fumes and scorpions pour out of the wrong fissure!'
  }
};

window.getLandmarkText = function(lmKey) {
  const def = LANDMARK_DEFS[lmKey] || LANDMARK_DEFS.twin_palms;
  return `${def.icon} ${tr(def.name_de, def.name_en)}`;
};

// ============================================================================
// ZUORDNUNG DER 14 SCHATZORTE ZU 5 VERZWEIGENDEN STORY-KAMPAGNEN & RELIKTEN
// ============================================================================
const SITE_CAMPAIGN_MAP = {
  // 1. Gezeitengrotte & Silberflotten-Wracks
  site_florida:       { campaign: 'shipwreck', relicPool: ['fh_hydra', 'pistol_duckfoot', 'eq_corsair_ram'] },
  site_antigua:       { campaign: 'shipwreck', relicPool: ['eq_corsair_ram', 'fh_hydra', 'coat_conquistador'] },
  site_keywest:       { campaign: 'shipwreck', relicPool: ['fh_hydra', 'eq_smuggler_keel', 'pistol_duckfoot'] },

  // 2. Maya-Sonnenpyramide & Blutcenote
  site_yucatan:       { campaign: 'maya',      relicPool: ['fh_sungod', 'blade_obsidian', 'relic_eldorado'] },
  site_mosquito:      { campaign: 'maya',      relicPool: ['blade_obsidian', 'fh_sungod', 'eq_greek_fire'] },

  // 3. Inquisitions-Katakomben & Festungskrypten
  site_puertorico:    { campaign: 'catacombs', relicPool: ['eq_greek_fire', 'coat_conquistador', 'pistol_duckfoot'] },
  site_hispaniola:    { campaign: 'catacombs', relicPool: ['pistol_duckfoot', 'eq_smuggler_keel', 'blade_obsidian'] },
  site_margarita:     { campaign: 'catacombs', relicPool: ['coat_conquistador', 'eq_greek_fire', 'fh_crimson_queen'] },

  // 4. Verborgene Korsaren-Schmugglerbucht & Rivalen-Lager
  site_cuba:          { campaign: 'corsair',   relicPool: ['eq_smuggler_keel', 'fh_crimson_queen', 'pistol_duckfoot'] },
  site_curacao:       { campaign: 'corsair',   relicPool: ['fh_crimson_queen', 'eq_corsair_ram', 'eq_smuggler_keel'] },
  site_jamaica:       { campaign: 'corsair',   relicPool: ['pistol_duckfoot', 'eq_smuggler_keel', 'fh_crimson_queen'] },

  // 5. Nebelschlucht, Asphaltsee & Konquistadoren-Goldmine
  site_darien:        { campaign: 'goldmine',  relicPool: ['coat_conquistador', 'relic_eldorado', 'fh_sungod'] },
  site_trin:          { campaign: 'goldmine',  relicPool: ['relic_eldorado', 'eq_greek_fire', 'coat_conquistador'] },
  site_trinidad_isle: { campaign: 'goldmine',  relicPool: ['eq_greek_fire', 'relic_eldorado', 'eq_corsair_ram'] }
};

// Alle 10 legendären Schatz-Relikte auflösen & bei Bergung direkt ins Inventar legen!
function awardGuaranteedTreasureRelic(siteId, qualityScore) {
  ensureShipAndCaptainInventory();
  const cfg = SITE_CAMPAIGN_MAP[siteId] || { relicPool: ['blade_obsidian', 'fh_sungod', 'eq_greek_fire'] };
  const allTreasureRelics = [
    ...cfg.relicPool,
    'eq_greek_fire', 'eq_smuggler_keel', 'eq_corsair_ram',
    'fh_sungod', 'fh_hydra', 'fh_crimson_queen',
    'blade_obsidian', 'pistol_duckfoot', 'coat_conquistador', 'relic_eldorado'
  ];

  const isOwned = (id) => {
    if (id.startsWith('fh_')) return (player.ownedFigureheads || []).includes(id);
    if (id.startsWith('eq_')) return (player.ownedSpecialEquipment || []).includes(id);
    return (game.captain.inventory.owned || []).includes(id);
  };

  let chosenId = allTreasureRelics.find(id => !isOwned(id));

  // Falls alle 10 einzigartigen Schatz-Relikte bereits geborgen wurden: hochstufiges unbesessenes Laden-Item oder fetter Edelstein-Bonus!
  if (!chosenId && window.CAPTAIN_ITEMS) {
    const unownedShop = CAPTAIN_ITEMS.filter(it => !it.treasureOnly && !game.captain.inventory.owned.includes(it.id));
    if (unownedShop.length > 0) chosenId = unownedShop[unownedShop.length - 1].id;
  }
  if (!chosenId && window.FIGUREHEAD_DEFS) {
    const unownedFh = FIGUREHEAD_DEFS.filter(f => !f.enclaveOnly && !f.treasureOnly && !(player.ownedFigureheads || []).includes(f.id));
    if (unownedFh.length > 0) chosenId = unownedFh[0].id;
  }

  if (!chosenId) {
    const gemGold = 650;
    game.gold += gemGold;
    return {
      title: '💎 Königliche Smaragd-Schatulle',
      sub: `Alle Relikte bereits im Besitz – Sonderschatz im Wert von +${gemGold} 🪙!`,
      autoEquipped: false
    };
  }

  // 1. Galionsfigur
  if (chosenId.startsWith('fh_') && window.FIGUREHEAD_DEFS) {
    const fh = FIGUREHEAD_DEFS.find(f => f.id === chosenId);
    if (fh) {
      player.ownedFigureheads.push(fh.id);
      let eqNote = 'Im Schiffs-Inventar [I] freigeschaltet!';
      if (!player.figurehead) {
        player.figurehead = fh.id;
        recalcPlayerDerivedStats();
        eqNote = 'Sofort am Bugspriet montiert! (Wechselbar mit Taste [I])';
      }
      return { title: `${fh.icon} Galionsfigur: ${tr(fh.name_de, fh.name_en)}`, sub: `${fh.desc_de} — ${eqNote}` };
    }
  }

  // 2. Schiffs-Spezialausrüstung [Taste R]
  if (chosenId.startsWith('eq_') && typeof SPECIAL_SHIP_EQUIPMENT !== 'undefined') {
    const eq = SPECIAL_SHIP_EQUIPMENT.find(e => e.id === chosenId);
    if (eq) {
      player.ownedSpecialEquipment.push(eq.id);
      let eqNote = 'Im Schiffs-Inventar [I] für jedes Dock freigeschaltet!';
      if (!player.specialEquipment) {
        player.specialEquipment = eq.id;
        player.specialEquipCooldown = 0;
        recalcPlayerDerivedStats();
        eqNote = 'Sofort in Slot [R] eingebaut! (Im Dock wechselbar über [I])';
      }
      return { title: `⚙️ Schiffs-Equipment [R]: ${td(eq, 'name')}`, sub: `${td(eq, 'desc')} — ${eqNote}` };
    }
  }

  // 3. Kapitäns-Ausrüstung fürs Duell & Einschleichen
  if (window.CAPTAIN_ITEMS) {
    const it = CAPTAIN_ITEMS.find(x => x.id === chosenId);
    if (it) {
      game.captain.inventory.owned.push(it.id);
      let eqNote = 'Im Kapitäns-Inventar [I] verfügbar!';
      if (!game.captain.inventory.equipped[it.slot]) {
        game.captain.inventory.equipped[it.slot] = it.id;
        eqNote = `Sofort im Slot [${it.slot.toUpperCase()}] angelegt!`;
      }
      return { title: `${it.icon} Kapitäns-Relikt: ${tr(it.name_de, it.name_en)}`, sub: `${it.desc_de} — ${eqNote}` };
    }
  }

  return null;
}

// ============================================================================
// DIE 5 VERZWEIGENDEN STORY-KAMPAGNEN (Jede mit eigenem Flair & Entscheidungen!)
// ============================================================================
const TREASURE_CAMPAIGN_TEMPLATES = {
  shipwreck: {
    title_de: 'Das Gezeiten-Wrack der Silberflotte',
    scenes: { 1: 'shipyard_beach', 2: 'exp_shipwreck', 3: 'exp_shipwreck', 4: 'exp_catacombs', 5: 'exp_shipwreck', 6: 'exp_shipwreck' },
    intro_de: 'Nur bei tiefster Ebbe ragt das zerschmetterte Kastell der gesunkenen Schatzgaleone aus der türkisfarbenen Korallengrotte. Die Flut kehrt in zwei Stunden zurück – jede Fehlentscheidung kann deinen Trupp unter Wasser einschließen!',
    act2: {
      heading: '🌊 Akt 2/5 – Die messerscharfe Korallenbarriere vor dem Rumpf:',
      story: 'Zwischen eurem Beiboot und dem aufgerissenen Batteriedeck des Wracks brodelt der Sog unterseeischer Felsspalten. Zwischen den Spanten schimmern silberne Leuchter, doch Muränen und loses Takelwerk lauern im Schwall.',
      options: [
        {
          key: 'carpenter_bridge',
          reqCargo: { id: 'timber', amt: 1 },
          label: '🪵 Aus 1× Schiffsholz Plankenstege über die Riffscherben schlagen (Sicherer Übergang & trockenes Pulver: +20% Fallenschutz)',
          resolve(st, site) {
            player.cargo.timber -= 1;
            st.trapDisarmBonus += 0.20;
            st.clueUnlocked = true;
            SoundFX.play('sail_flap');
            st.log.unshift('🪵 Deine Zimmerleute verkeilen stabile Laufplanken zwischen den Korallenblöcken. Dabei entdeckt ihr das eingravierte Wappen des Zahlmeisters an der Bordwand!');
          }
        },
        {
          key: 'free_dive',
          label: '🌊 Durch den überfluteten Stückpforten-Spalt tauchen (Stark mit Seemannschaft / Küstenlotse; birgt reiche Nebenbeute!)',
          resolve(st, site) {
            const chance = 0.48 + game.captain.skills.seamanship * 0.09 + (hasOfficerRole('pilot') || hasOfficerRole('boatswain') ? 0.26 : 0);
            if (Math.random() < chance) {
              st.bonusGoldMult += 0.25;
              st.clueUnlocked = true;
              SoundFX.play('coin');
              st.log.unshift('🌊 Meisterhaft getaucht! Im Schlamm unter der Stückpforte bergt ihr einen versiegelten Lederbeutel mit Smaragden (+25% Beute) und findet den Schlüsselring des Offiziers!');
            } else {
              applyAdventureHazardDamage(site, 0.95, 'Eine Grundwelle schleudert zwei Taucher gegen rostiges Geschützeisen und messerscharfe Muschelbänke!');
            }
          }
        },
        {
          key: 'blast_hull',
          label: '💣 Ein Loch oberhalb der Wasserlinie in die morsche Bordwand sprengen (Schnell, aber lockt Plünderer in der Nähe an)',
          resolve(st, site) {
            SoundFX.play('cannon');
            st.alertedRivals = true;
            st.bonusGoldMult += 0.10;
            st.log.unshift('💣 Krachend fliegt die Eichenplanke auseinander! Der Zugang zum Mitteldeck liegt offen (+10% Tempo-Bonus), doch das Echo hallt weit über die Bucht...');
          }
        }
      ]
    },
    act3: {
      portrait: 'freibeuter:7',
      portraitBorder: '#f59e0b',
      heading: '🏴‍☠️ Akt 3/5 – Rivalisierende Wrackplünderer an der Grotte!',
      story: 'Plötzlich schiebt sich eine bewaffnete Schaluppe vor den Höhleneingang! Der einäugige Kaperfahrer „El Tuerto“ richtet Drehbassen auf deinen Landungstrupp: „Halbe-Halbe bei allem Gold im Wrack, Kapitän – oder die Flut spült eure Knochen ans Riff!“',
      options: [
        {
          key: 'duel_leader',
          label: '🤺 „El Tuerto“ zum 1-gegen-1-Ehrenduell auf der nassen Galeonenplanke herausfordern (Nutzt deine Kapitäns-Duellwerte!)',
          resolve(st, site) {
            const ds = window.getCaptainDuelStats ? getCaptainDuelStats() : { slash: 16, thrust: 16, parry: 16, openerDmg: 0 };
            const power = ds.slash + ds.thrust + ds.parry + ds.openerDmg * 0.8;
            SoundFX.play('sword');
            if (power >= 56 || Math.random() < (0.38 + power * 0.007)) {
              st.bonusGoldMult += 0.30;
              changePlayerReputation(6);
              st.log.unshift('🤺 Mit einer blitzschnellen Finte schlägst du El Tuerto den Enterdegen aus der Faust! Seine eingeschüchterte Crew überlässt euch sogar ihre geborgenen Silberbarren (+30% Schatzbonus & +6 Ruf)!');
            } else {
              applyAdventureHazardDamage(site, 1.0, 'El Tuerto streift dich mit einem tückischen Parierdolch, ehe deine Männer das Gefecht entscheiden!');
              st.bonusGoldMult += 0.12;
            }
          }
        },
        {
          key: 'parley_share',
          label: '🤝 Taktischen Pakt schließen: Sie sichern die Seeseite mit Seilwinden, erhalten dafür 18% vom Münzgold – aber das Hauptrelikt gehört dir allein!',
          resolve(st, site) {
            if (st.alertedRivals && game.captain.skills.commerce < 3 && !hasOfficerRole('merchant')) {
              player.morale = Math.max(15, player.morale - 6);
              st.bonusGoldMult -= 0.18;
              st.trapDisarmBonus += 0.25;
              st.log.unshift('🤝 Zähneknirschend akzeptiert deine Crew den Handel (-18% Münzanteil, -6% Moral), doch El Tuertos Flaschenzüge sichern euch gegen jede Falle (+25% Schutz).');
            } else {
              st.bonusGoldMult -= 0.12;
              st.trapDisarmBonus += 0.30;
              SoundFX.play('card');
              st.log.unshift('🤝 Geschickt verhandelt! Für nur 12% Münzanteil halten euch die Wracktaucher den Rücken frei und verraten euch die Pulverfalle in der Kapitänskajüte!');
            }
          }
        },
        {
          key: 'broadside_ambush',
          label: '🔫 Sofort aus den oberen Stückpforten des Wracks das Feuer eröffnen! (Stark bei guter Crew-Bewaffnung / Oberkanonier)',
          resolve(st, site) {
            const cs = getCrewCombatStats();
            SoundFX.play('broadside');
            if (cs.rangedBonus >= 0.20 || hasOfficerRole('gunner')) {
              st.bonusGoldMult += 0.22;
              st.log.unshift('🔫 Verheerende Salve aus erhöhter Deckung! Die Plünderer kappen panisch ihre Leinen und lassen eine Kiste Dublonen am Strand zurück (+22% Beute)!');
            } else {
              applyAdventureHazardDamage(site, 1.15, 'Heftiger Schusswechsel zwischen den Korallenfelsen, bevor die Rivalen abdrehen!');
            }
          }
        }
      ]
    },
    act4: {
      heading: '🗝️ Akt 4/5 – Die geflutete Schatzkajüte des Flottenadmirals:',
      story: 'Das steigende Meerwasser reicht euch bereits bis zur Brust! Hinter einem schmiedeeisernen Gitter ruht der eisenbeschlagene Kron-Tresor, gekoppelt an ein gespanntes Steinschloss-Uhrwerk.',
      options: [
        {
          key: 'use_clue_or_pick',
          label: '🔍 Das Uhrwerk feinmechanisch blockieren & aufschließen (Garantiert erfolgreich mit geborgenem Schlüsselring oder Quartiermeister!)',
          resolve(st, site) {
            if (st.clueUnlocked || hasOfficerRole('quartermaster') || hasOfficerRole('navigator') || Math.random() < 0.55) {
              st.bonusGoldMult += 0.25;
              st.trapDisarmBonus += 0.25;
              SoundFX.play('coin');
              st.log.unshift('🗝️ Klickend rastet der Bronzebolzen ein – das Zündrad steht still! Ihr öffnet außerdem das Geheimfach des Admirals (+25% Beute)!');
            } else {
              applyAdventureHazardDamage(site, 1.05, 'Die Feder schnappt über! Eine wasserdichte Pechkapsel entzündet sich im engen Schott!');
            }
          }
        },
        {
          key: 'winch_tear',
          label: '⛓️ Mit Ankertauen und Brechstangen das gesamte Eisengitter aus den morschen Spanten reißen (Kraftakt für große/starke Crew)',
          resolve(st, site) {
            if (getEffectiveHealthyCrew() >= 28 || hasOfficerRole('boatswain')) {
              st.bonusGoldMult += 0.15;
              st.log.unshift('⛓️ Unter rhythmischem „Hau-Ruck!“ deines Bootsmanns bricht das korrodierte Gitter samt Falle aus der Wand (+15% Beute)!');
            } else {
              player.morale = Math.max(12, player.morale - 7);
              applyAdventureHazardDamage(site, 0.90, 'Ein geborstener Deckenbalken schlägt ins Wasser, während die Flut bedrohlich steigt (-7% Moral)!');
            }
          }
        },
        {
          key: 'quick_grab',
          label: '⏳ Keine Zeit verlieren: Nur die Haupttruhe durch die Gitterstäbe wuchten, bevor die Grotte vollläuft (Sicher, -10% Münzgold)',
          resolve(st, site) {
            st.bonusGoldMult = Math.max(0.80, st.bonusGoldMult - 0.10);
            st.trapDisarmBonus += 0.20;
            st.log.unshift('⏳ Diszipliniert verzichtet ihr auf lose Silberkelche und bringt den Trupp trocken vor der Flutwelle in die innere Nische.');
          }
        }
      ]
    }
  },

  maya: {
    title_de: 'Das Sonnenlabyrinth der Gefiederten Schlange',
    scenes: { 1: 'shipyard_beach', 2: 'exp_goldmine', 3: 'exp_maya_temple', 4: 'exp_maya_temple', 5: 'exp_maya_temple', 6: 'exp_maya_temple' },
    intro_de: 'Überwucherte Kalksteinstufen ragen aus dem dampfenden Urwald empor. Laut deiner Karte bewachen astronomische Spiegel und uralte Opferfallen hier ein Heiligtum aus purem Gold und Vulkanglas!',
    act2: {
      heading: '🐊 Akt 2/5 – Die heilige Opfer-Cenote im Dschungel:',
      story: 'Der Dschungelpfad endet vor einem tiefblauen Kalkstein-Kratersee. Alte Goldketten schimmern auf einem Sims unter der Wasserkante, während über euch eine halb verrottete Lianenbrücke zum Stufentempel schwingt.',
      options: [
        {
          key: 'repair_bridge',
          reqCargo: { id: 'canvas', amt: 1 },
          label: '⛵ Mit 1× Segeltuch & frischem Tauwerk die Hängebrücke verstärken (Kein Absturzrisiko & +20% Fallenschutz)',
          resolve(st, site) {
            player.cargo.canvas -= 1;
            st.trapDisarmBonus += 0.20;
            SoundFX.play('sail_flap');
            st.log.unshift('⛵ Mit straff gespanntem Segeltuch sichert deine Crew die Hängebrücke und überquert die Cenote ohne einen einzigen Kratzer!');
          }
        },
        {
          key: 'dive_cenote',
          label: '💎 In die kristallklare Cenote hinabtauchen, um die Opfergaben auf dem Felssims zu bergen (Hoher Gewinn, aber gefährlich!)',
          resolve(st, site) {
            if (Math.random() < 0.52 + game.captain.skills.survival * 0.08) {
              st.bonusGoldMult += 0.32;
              st.clueUnlocked = true;
              SoundFX.play('coin');
              st.log.unshift('💎 Zwischen alten Knochen am Grund bergt ihr eine goldene Sonnenscheibe mit eingravierten Maya-Zahlen (+32% Beute & Rätsel-Schlüssel)!');
            } else {
              applyAdventureHazardDamage(site, 1.05, 'Unterwasserströmungen und schnappende Sumpfschildkröten ziehen deine Schwimmer in eine dunkle Felsspalte!');
            }
          }
        },
        {
          key: 'jungle_detour',
          label: '🌿 Einen Bogen durch das dichte Dornendickicht schlagen (Kostet -6% Moral, vermeidet aber die Brücke)',
          resolve(st, site) {
            player.morale = Math.max(12, player.morale - 6);
            if (!hasOfficerRole('surgeon') && Math.random() < 0.35) {
              applyAdventureHazardDamage(site, 0.75, 'Fiebermücken und Dornenranken setzen der Vorhut zu!');
            } else {
              st.log.unshift('🌿 Mit Macheten schlagt ihr euch schweißgebadet zum Fuß der Stufenpyramide durch (-6% Moral).');
            }
          }
        }
      ]
    },
    act3: {
      portrait: 'native_chief',
      portraitBorder: '#2ecc71',
      heading: '🪶 Akt 3/5 – Die Jaguar-Wächter auf der Tempellichtung:',
      story: 'Auf der obersten Terrasse treten bemalte Krieger mit Obsidian-Speeren und ein greiser Schamane aus dem Schatten der Schlangensäulen hervor. Sie prüfen jedes eurer Zeichen mit wachsamen Blicken!',
      options: [
        {
          key: 'gift_trade',
          reqGoldOrRum: true,
          label: '🤝 Ehrerbietig 2× 🍾 Rum (oder 45 🪙) darbringen und schwören, nur die spanische Raubkiste anzurühren (+Heilkräuter, +Ruf & Tempel-Geheimnis!)',
          resolve(st, site) {
            if ((player.cargo.rum || 0) >= 2) player.cargo.rum -= 2;
            else game.gold -= 45;
            const free = Math.max(0, Math.floor(getMaxCargo() - getCargoTotal()));
            const med = Math.min(free, 4);
            if (med > 0) player.cargo.medicine = (player.cargo.medicine || 0) + med;
            st.clueUnlocked = true;
            st.trapDisarmBonus += 0.30;
            st.bonusGoldMult += 0.15;
            changePlayerReputation(8);
            SoundFX.play('coin');
            st.log.unshift(`🤝 Der Schamane segnet deinen Landungstrupp, schenkt euch ${med}× Heilkräuter (🍋) und nennt die heilige Stellung des Sonnenkalenders (+8 Ruf)!`);
          }
        },
        {
          key: 'astronomy_parley',
          label: '🧭 Mit Sextant und Sternenkunde beweisen, dass ihr Gelehrte der See seid (Stark mit Navigator / Schiffsgeistlicher / Führungskraft)',
          resolve(st, site) {
            if (hasOfficerRole('navigator') || hasOfficerRole('priest') || game.captain.skills.leadership >= 3 || Math.random() < 0.55) {
              st.clueUnlocked = true;
              st.trapDisarmBonus += 0.22;
              changePlayerReputation(5);
              st.log.unshift('🧭 Beeindruckt von eurer Kenntnis der Gestirne gewähren euch die Wächter freien Zutritt zur inneren Pyramide (+5 Ruf)!');
            } else {
              player.morale = Math.max(12, player.morale - 6);
              applyAdventureHazardDamage(site, 0.85, 'Eure Gesten werden als Frevel gedeutet – Warnspeere zwingen euch durch einen dornigen Seiteneingang!');
            }
          }
        },
        {
          key: 'plunder_altar',
          label: '⚔️ Mit Musketendonner stürmen und auch den goldenen Tempelschmuck vom Altar reißen (+38% Extra-Gold, aber -26 Reputation & harter Kampf!)',
          resolve(st, site) {
            SoundFX.play('broadside');
            changePlayerReputation(-26, '🩸 Heiligen Tempel geplündert!');
            st.bonusGoldMult += 0.38;
            const cs = getCrewCombatStats();
            if (cs.rangedBonus < 0.28) {
              applyAdventureHazardDamage(site, 1.20, 'Erbitterter Kampf auf den steilen Pyramidenstufen (-26 Ruf, aber reiche Goldbeute)!');
            } else {
              st.log.unshift('⚔️ Eure schwer bewaffnete Garde erstürmt die Terrasse im Handstreich und rafft den Altarschmuck zusammen (+38% Gold, -26 Ruf)!');
            }
          }
        }
      ]
    },
    act4: {
      heading: '☀️ Akt 4/5 – Die Spiegelkammer des Kinich Ahau:',
      story: 'Ein gleißender Sonnenstrahl fällt durch den Pyramidenschacht auf drei drehbare Kupferspiegel. Nur die richtige Ausrichtung öffnet den Schlangenrachen zur Schatzkammer, ohne die Deckensteine auszulösen!',
      options: [
        {
          key: 'align_sun',
          label: '☀️ Die Kupferspiegel nach dem Kalender-Zyklus der Tagundnachtgleiche ausrichten (Ideal mit Hinweis des Schamanen / Cenoten-Scheibe / Navigator!)',
          resolve(st, site) {
            if (st.clueUnlocked || hasOfficerRole('navigator') || game.captain.skills.commerce >= 3 || Math.random() < 0.50) {
              st.bonusGoldMult += 0.25;
              st.trapDisarmBonus += 0.25;
              SoundFX.play('card');
              st.log.unshift('☀️ Goldenes Licht flutet das Schlangenauge! Lautlos gleitet der Altarblock zur Seite und gibt eine unberührte Schatzkammer frei (+25% Bonus)!');
            } else {
              applyAdventureHazardDamage(site, 1.05, 'Gebündeltes Feuerlicht zündet Pechrinnen am Boden – heißer Rauch treibt euch hustend durch das Portal!');
            }
          }
        },
        {
          key: 'wedge_jaws',
          label: '🔨 Das steinerne Maul mit Eisenkeilen und Kanonenkugeln mechanisch blockieren (Solide mit Zimmermann / Festungsbaumeister)',
          resolve(st, site) {
            if (hasOfficerRole('carpenter') || hasOfficerRole('master_builder') || Math.random() < 0.62) {
              st.trapDisarmBonus += 0.18;
              st.log.unshift('🔨 Knirschend halten eure Eisenkeile dem tonnenschweren Gegengewicht stand – der Weg ins Allerheiligste ist frei!');
            } else {
              applyAdventureHazardDamage(site, 0.95, 'Ein Keil splittert unter dem Steindruck weg und verletzt die vordersten Matrosen!');
            }
          }
        },
        {
          key: 'powder_breach',
          label: '💣 Die Seitenwand neben dem Altar aufsprengen (Schnell, verschüttet aber 10% der kleineren Münzgefäße)',
          resolve(st, site) {
            SoundFX.play('cannon');
            st.bonusGoldMult = Math.max(0.78, st.bonusGoldMult - 0.10);
            st.log.unshift('💣 Staub und Kalksteinsplitter wirbeln auf – durch die gesprengte Bresche steigt ihr direkt in die Schatzgruft!');
          }
        }
      ]
    }
  },

  catacombs: {
    title_de: 'Das Geheimnis der Inquisitions-Katakomben',
    scenes: { 1: 'shipyard_beach', 2: 'exp_catacombs', 3: 'exp_catacombs', 4: 'exp_catacombs', 5: 'exp_catacombs', 6: 'exp_catacombs' },
    intro_de: 'Unter den zerfallenen Grundmauern einer alten Küstenbastion führen feuchte Kalksteinstufen tief in vergessene Katakomben hinab. Hier ließ ein abtrünniger Großinquisitor seine geheime Kriegskasse einmauern!',
    act2: {
      heading: '🕯️ Akt 2/5 – Das Gewölbe der drei Eisengitter:',
      story: 'Im flackernden Fackelschein teilt sich das unterirdische Gewölbe. Aus dem linken Gang weht kühle Meeresluft, in der Mitte liegen verrostete Hellebarden gefallener Söldner, rechts prangt ein lateinisches Buß-Siegel.',
      options: [
        {
          key: 'latin_inscription',
          label: '📜 Die lateinische Mauerinschrift entziffern (Stark mit Schiffsgeistlichem, Gelehrtem Handelssinn oder Navigator)',
          resolve(st, site) {
            if (hasOfficerRole('priest') || hasOfficerRole('merchant') || game.captain.skills.commerce >= 3 || Math.random() < 0.54) {
              st.clueUnlocked = true;
              st.trapDisarmBonus += 0.25;
              st.bonusGoldMult += 0.18;
              SoundFX.play('card');
              st.log.unshift('📜 „Nur der Demütige schreitet unter dem Kreuz hindurch!“ Ihr umgeht eine tückische Fallgrube und findet ein goldenes Reliquiar (+18% Beute & Chiffre-Hinweis)!');
            } else {
              applyAdventureHazardDamage(site, 0.95, 'Falsch übersetzt! Eine schwingende Sensenklinge fährt aus dem Gewölbebogen herab!');
            }
          }
        },
        {
          key: 'follow_draft',
          label: '💨 Dem frischen Luftzug durch das Seiten-Ossuarium folgen (Gute Orientierung mit Ausguck / Seemannschaft)',
          resolve(st, site) {
            if (hasOfficerRole('lookout') || game.captain.skills.seamanship >= 3 || Math.random() < 0.65) {
              st.bonusGoldMult += 0.12;
              st.log.unshift('💨 Der Luftzug führt euch sicher um das Hauptlabyrinth herum direkt in die Vorhalle der Schatzkrypta (+12% Beute)!');
            } else {
              player.morale = Math.max(12, player.morale - 7);
              st.log.unshift('🦇 Tausende aufgeschreckte Fledermäuse löschen fast eure Fackeln im engen Knochengang (-7% Moral)!');
            }
          }
        },
        {
          key: 'loot_mercenaries',
          label: '🗡️ Die Skelette der gefallenen Söldner im Mittelgang filzen (+22% Extra-Silber, aber hohes Fallenrisiko!)',
          resolve(st, site) {
            st.bonusGoldMult += 0.22;
            if (Math.random() < 0.58) {
              applyAdventureHazardDamage(site, 1.05, 'Jetzt wisst ihr, woran die Söldner starben: Verborgene Armbrust-Selbstschüsse lösen in der Wand aus (+22% Beute, aber Verwundete)!');
            } else {
              SoundFX.play('coin');
              st.log.unshift('🗡️ Vorsichtig zieht ihr prall gefüllte Geldkatzen mit Enterhaken zu euch heran, ohne die Druckplatten zu berühren (+22% Beute)!');
            }
          }
        }
      ]
    },
    act3: {
      portrait: 'kolonial:11',
      portraitBorder: '#38bdf8',
      heading: '⛓️ Akt 3/5 – Der eingekerkerte Festungsbaumeister:',
      story: 'Hinter einem rostigen Kerkerverschlag regt sich eine ausgemergelte Gestalt in zerrissener spanischer Uniform! „Wasser... um Gottes Willen! Der Gouverneur ließ mich hier unten zum Sterben zurück, nachdem ich seine Schatzkammer versiegelt habe!“',
      options: [
        {
          key: 'rescue_architect',
          reqCargo: { id: 'food', amt: 1 },
          label: '🍖 Dem Gefangenen 1× Proviant & Wasser reichen und seine Ketten sprengen (+8 Ruf, exakter Bauplan aller Krypta-Fallen!)',
          resolve(st, site) {
            player.cargo.food -= 1;
            st.clueUnlocked = true;
            st.trapDisarmBonus += 0.38;
            st.bonusGoldMult += 0.20;
            changePlayerReputation(8);
            SoundFX.play('card');
            st.log.unshift('⛓️ Dankbar zeichnet der gerettete Baumeister mit Kohle jeden einzelnen Stolperdraht und Geheimtresor auf deine Karte (+38% Fallenschutz, +20% Beute & +8 Ruf)!');
          }
        },
        {
          key: 'bribe_or_press',
          label: '🏴‍☠️ Ihn zwingen, vorauszugehen und die Fallen für euch auszulösen (+15% Tempo, kostet aber -14 Reputation)',
          resolve(st, site) {
            changePlayerReputation(-14, '☠️ Gefangenen als menschlichen Schutzschild missbraucht!');
            st.trapDisarmBonus += 0.22;
            st.bonusGoldMult += 0.15;
            st.log.unshift('☠️ Unter vorgehaltener Pistole führt euch der zitternde Baumeister bis vor die Schatzkrypta (-14 Ruf).');
          }
        },
        {
          key: 'ignore_prisoner',
          label: '🔒 Keine Risiken eingehen – könnte eine Finte sein! Weiterziehen und die Nebennischen durchsuchen',
          resolve(st, site) {
            st.bonusGoldMult += 0.10;
            st.log.unshift('🔒 Ihr lasst die Zelle verschlossen und plündert stattdessen silberne Kerzenleuchter aus der Sakristei (+10% Beute).');
          }
        }
      ]
    },
    act4: {
      heading: '⚙️ Akt 4/5 – Der Schwarzpulver-Sarkophag des Großinquisitors:',
      story: 'Unter dem steinernen Sarkophag lagern sechs Fässer feinstes Kronpulver, verbunden mit einem Luntenschloss am Deckel! Ein falscher Handgriff jagt die halbe Krypta in die Luft.',
      options: [
        {
          key: 'disarm_flint',
          label: '🔧 Das Luntenschloss nach Bauplan kappen & das trockene Pulver sogar mitbergen (Perfekt mit Hinweis des Baumeisters oder Oberkanonier!)',
          resolve(st, site) {
            if (st.clueUnlocked || hasOfficerRole('gunner') || hasOfficerRole('master_builder') || Math.random() < 0.50) {
              st.bonusGoldMult += 0.28;
              st.trapDisarmBonus += 0.25;
              SoundFX.play('coin');
              st.log.unshift('🔧 Meisterstück! Ihr trennt den Feuerstein sauber vom Zündpfännchen und sichert obendrein kostbare Grabbeigaben des Inquisitors (+28% Beute)!');
            } else {
              applyAdventureHazardDamage(site, 1.20, 'Funkenflug am Sarkophag! Eine Stichflamme versengt deinen Trupp, bevor ihr Sand darüber werfen könnt!');
            }
          }
        },
        {
          key: 'soak_rum_water',
          label: '🪣 Die Zündrinne unter dem Spalt mit Wasser und nassem Lehm fluten (Sicherer Weg, +15% Fallenschutz)',
          resolve(st, site) {
            st.trapDisarmBonus += 0.18;
            st.log.unshift('🪣 Das durchtränkte Schwarzpulver wird zu harmlosem Schlamm – gefahrlos stemmt deine Crew den Sarkophagdeckel auf!');
          }
        },
        {
          key: 'distant_shot',
          label: '🔫 Aus sicherer Deckung gezielt in die Lunte schießen und kontrolliert sprengen (-12% beschädigte Münzen, aber kein Fallenrisiko)',
          resolve(st, site) {
            SoundFX.play('cannon');
            st.bonusGoldMult = Math.max(0.75, st.bonusGoldMult - 0.12);
            st.log.unshift('💥 Hinter dicken Kalksteinpfeilern wartet ihr die Druckwelle ab – die Schatzkammer dahinter liegt offen!');
          }
        }
      ]
    }
  },

  corsair: {
    title_de: 'Das Henkerslager des Korsarenkönigs',
    scenes: { 1: 'shipyard_beach', 2: 'shipyard_beach', 3: 'tavern_pirates', 4: 'exp_catacombs', 5: 'exp_shipwreck', 6: 'exp_shipwreck' },
    intro_de: 'Hinter einem Kranz aus Schiffswracks liegt die geheime Zuflucht des verschollenen Korsarenkapitäns „Roter Roche“. Er war berüchtigt dafür, seine eigene verräterische Mannschaft mit tödlichen Rätselfallen zu richten!',
    act2: {
      heading: '💀 Akt 2/5 – Der Pfad der drei Galgenkäfige:',
      story: 'Drei eiserne Skelettkäfige baumeln im Seewind über der Dschungelschlucht. Jedes Skelett hält eine Bleitafel mit einer anderen Kompasspeilung in den knöchernen Fingern.',
      options: [
        {
          key: 'read_riddle',
          label: '🧭 Den alten Korsaren-Spruch auf den Bleitafeln kombinieren: „Der Lügner blickt nach Gold, der Steuermann nach dem Nordstern“',
          resolve(st, site) {
            if (game.captain.skills.seamanship >= 2 || hasOfficerRole('navigator') || hasOfficerRole('quartermaster') || Math.random() < 0.60) {
              st.clueUnlocked = true;
              st.bonusGoldMult += 0.20;
              st.trapDisarmBonus += 0.20;
              SoundFX.play('card');
              st.log.unshift('🧭 Scharf kombiniert! Im Brustkorb des mittleren Skeletts findet ihr zudem Roches Messing-Chiffrierscheibe (+20% Beute & Code-Schlüssel)!');
            } else {
              applyAdventureHazardDamage(site, 0.95, 'Falsche Peilung! Ein vergrabenes Entermesser-Pendel schwingt aus dem Gebüsch!');
            }
          }
        },
        {
          key: 'shoot_chains',
          label: '🔫 Alle drei Käfige aus der Distanz herunterschießen und im Sand untersuchen (Stark mit Scharfschütze / Geschützkunst)',
          resolve(st, site) {
            SoundFX.play('cannon');
            if (hasOfficerRole('sharpshooter') || game.captain.skills.gunnery >= 3 || Math.random() < 0.58) {
              st.clueUnlocked = true;
              st.bonusGoldMult += 0.16;
              st.log.unshift('🔫 Drei Schüsse, drei gebrochene Ketten! Aus den Trümmern bergt ihr Roches Chiffrierscheibe und einen Goldring (+16% Beute)!');
            } else {
              player.morale = Math.max(12, player.morale - 6);
              st.log.unshift('🔫 Querschläger pfeifen euch um die Ohren und der Lärm schreckt das halbe Inselinnere auf (-6% Moral).');
            }
          }
        },
        {
          key: 'climb_ridge',
          label: '🧗 Über den Felskamm oberhalb der Galgen klettern (Sicher mit Bootsmann, +10% Beute)',
          resolve(st, site) {
            if (hasOfficerRole('boatswain') || Math.random() < 0.62) {
              st.bonusGoldMult += 0.10;
              st.log.unshift('🧗 Über den luftigen Felskamm umgeht ihr sämtliche Stolperdrähte der Schlucht (+10% Beute)!');
            } else {
              applyAdventureHazardDamage(site, 0.85, 'Scharfkantiger Korallenkalk reißt einem Kletterer das Seil durch!');
            }
          }
        }
      ]
    },
    act3: {
      portrait: 'piratinnen:5',
      portraitBorder: '#ef4444',
      heading: '🍻 Akt 3/5 – Die verbarrikadierte Schmuggler-Spelunke in der Höhle:',
      story: 'In einer ausgebauten Felshöhle stoßt ihr auf eine versprengte Gruppe desertierter Bukaniere unter Führung der scharfzüngigen Anne de la Croix. Sie belagern das gepanzerte Schott zu Roches Schatzkammer – bekommen es aber ohne deine Karte nicht auf!',
      options: [
        {
          key: 'recruit_deserters',
          reqGoldOrRum: true,
          label: '🍻 Ein Fass Rum aufschlagen (2× 🍾 oder 40 🪙) und Anne samt ihren besten Leuten für deine eigene Crew anwerben!',
          resolve(st, site) {
            if ((player.cargo.rum || 0) >= 2) player.cargo.rum -= 2;
            else game.gold -= 40;
            const space = Math.max(0, player.maxCrew - Math.ceil(player.crew));
            const joined = Math.min(space, 5);
            if (joined > 0) player.crew += joined;
            player.morale = Math.min(100, player.morale + 8);
            st.trapDisarmBonus += 0.25;
            SoundFX.play('coin');
            st.log.unshift(`🍻 Jubel unter den Bukanieren! ${joined > 0 ? `+${joined} erfahrene Seeleute schließen sich deiner Crew an` : 'Deine Crew feiert ausgelassen'} (+8% Moral) und Anne zeigt euch die Schießscharten am Schott!`);
          }
        },
        {
          key: 'deceive_code',
          label: '🃏 Ihnen eine falsche Kartenpeilung verkaufen und das echte Schott öffnen, sobald sie abziehen (Stark mit Handel / Silberzunge!)',
          resolve(st, site) {
            if (game.captain.skills.commerce >= 3 || hasOfficerRole('quartermaster') || Math.random() < 0.55) {
              st.bonusGoldMult += 0.28;
              SoundFX.play('card');
              st.log.unshift('🃏 Meisterbluff! Gierig stürmt Annes Bande zum falschen Strandabschnitt – und lässt sogar ihre eigene Beutekiste unbewacht zurück (+28% Beute)!');
            } else {
              applyAdventureHazardDamage(site, 1.10, 'Anne durchschaut deinen Bluff sofort – Pistolen blitzen in der rauchigen Höhle auf!');
            }
          }
        },
        {
          key: 'storm_barricade',
          label: '⚔️ Mit gezogenen Entermessern kurzen Prozess machen (Volle Beute +25%, erfordert kampfstarke Crew)',
          resolve(st, site) {
            SoundFX.play('sword');
            const cs = getCrewCombatStats();
            st.bonusGoldMult += 0.25;
            if (cs.meleeBonus >= 0.24 || hasCaptainPerk('perk_boarding_master')) {
              st.log.unshift('⚔️ Dein Entertrupp fegt über die Fass-Barrikade hinweg! Die Deserteure werfen ihre Waffen weg (+25% Beute)!');
            } else {
              applyAdventureHazardDamage(site, 1.10, 'Wildes Handgemenge zwischen Rumfässern und Schiffsplanken (+25% Beute, aber Verwundete)!');
            }
          }
        }
      ]
    },
    act4: {
      heading: '💣 Akt 4/5 – Kapitän Roches Dreifach-Radschloss:',
      story: 'Das schwere Schiffsschott im Fels trägt drei Buchstabenwalzen. Aus einem Rohr darüber riecht es verräterisch nach siedendem Pech und griechischem Feuer!',
      options: [
        {
          key: 'cipher_unlock',
          label: '🗝️ Mit der Chiffrierscheibe den Wahlspruch „MORS TYRANNIS“ einstellen (Sicherster Weg & +24% Schatzbonus!)',
          resolve(st, site) {
            if (st.clueUnlocked || game.captain.skills.leadership >= 3 || Math.random() < 0.52) {
              st.bonusGoldMult += 0.24;
              st.trapDisarmBonus += 0.25;
              SoundFX.play('coin');
              st.log.unshift('🗝️ Klackend entriegelt sich die eiserne Pforte! Selbst Roches geheime Waffen- und Reliktkammer dahinter öffnet sich unversehrt (+24% Bonus)!');
            } else {
              applyAdventureHazardDamage(site, 1.15, 'Ein Bolzen schlägt fehl – brennendes Pech tropft zischend vor das Schott!');
            }
          }
        },
        {
          key: 'plug_nozzle',
          label: '🛡️ Die Pechdüsen mit nassen Mänteln und Holzkeilen verstopfen, bevor ihr das Schloss aufbrecht',
          resolve(st, site) {
            st.trapDisarmBonus += 0.22;
            st.bonusGoldMult += 0.08;
            st.log.unshift('🛡️ Kluge Vorsicht! Als die Falle auslöst, bleibt das Pech im verstopften Rohr stecken und ihr stemmt das Schott auf (+8% Bonus)!');
          }
        },
        {
          key: 'cannon_ram',
          label: '🪵 Mit einem schweren Rammbalken aus sicherem Winkel aufstoßen (-5% Moral durch Erschöpfung)',
          resolve(st, site) {
            player.morale = Math.max(12, player.morale - 5);
            st.log.unshift('🪵 Nach zehn wuchtigen Stößen gibt das verrostete Schloss nach (-5% Moral).');
          }
        }
      ]
    }
  },

  goldmine: {
    title_de: 'Die Verlorene Goldmine von El Dorado',
    scenes: { 1: 'shipyard_beach', 2: 'exp_goldmine', 3: 'exp_goldmine', 4: 'exp_catacombs', 5: 'exp_maya_temple', 6: 'exp_maya_temple' },
    intro_de: 'Steil windet sich der Maultierpfad der alten Konquistadoren über brodelnde Schwefelquellen und Asphaltgruben hinauf in die Nebelschlucht. Tief im Berg wartet ein verschütteter Königstransport!',
    act2: {
      heading: '🌋 Akt 2/5 – Die Nebelschlucht & der kochende Schwefelfluss:',
      story: 'Unter euch dampft ein vulkanischer Strom und blubbernder Naturasphalt. Nur eine schwankende Konquistadoren-Seilbrücke und ein alter Lastenkran führen hinüber zum vergoldeten Stollenportal!',
      options: [
        {
          key: 'rig_crane',
          reqCargo: { id: 'timber', amt: 1 },
          label: '🏗️ Mit 1× Schiffsholz den alten spanischen Lastenkran reparieren und die Mannschaft per Seilgondel übersetzen (+20% Beutekapazität!)',
          resolve(st, site) {
            player.cargo.timber -= 1;
            st.bonusGoldMult += 0.20;
            st.trapDisarmBonus += 0.20;
            SoundFX.play('sail_flap');
            st.log.unshift('🏗️ Der instandgesetzte Lastenkran trägt deinen gesamten Trupp sicher über den Abgrund – und ermöglicht später den Abtransport extra schwerer Silberkisten (+20% Beute)!');
          }
        },
        {
          key: 'single_file_bridge',
          label: '🧗 Einzeln und angeseilt über die morsche Hängebrücke balancieren (Stark mit Seemannschaft / Bootsmann)',
          resolve(st, site) {
            if (hasOfficerRole('boatswain') || game.captain.skills.seamanship >= 3 || Math.random() < 0.62) {
              st.bonusGoldMult += 0.12;
              st.log.unshift('🧗 Schritt für Schritt bringt ihr jeden einzelnen Mann sicher über den dampfenden Abgrund (+12% Bonus)!');
            } else {
              applyAdventureHazardDamage(site, 1.0, 'Zwei Trittbretter brechen weg – heiße Schwefeldämpfe und Seilverbrennungen zeichnen den Trupp!');
            }
          }
        },
        {
          key: 'tar_shallows',
          label: '🔥 Am flachen Uferrand des Asphaltsees entlangmarschieren (Keine Absturzgefahr, kostet aber -7% Moral durch Hitze & Dämpfe)',
          resolve(st, site) {
            player.morale = Math.max(12, player.morale - 7);
            st.clueUnlocked = true;
            st.log.unshift('🔥 Trotz beißender Dämpfe (-7% Moral) entdeckt ihr am Uferrand den halb versunkenen Kurierkoffer des Minenaufsehers samt Stollenkarte!');
          }
        }
      ]
    },
    act3: {
      portrait: 'native_peace',
      portraitBorder: '#fbbf24',
      heading: '⛏️ Akt 3/5 – Die geflohenen Minenarbeiter vor dem Stollen:',
      story: 'Vor dem Stollenmundloch lagert eine Gruppe entflohener Indio- und Cimarrón-Bergleute, die sich vor spanischen Strafexpeditionen in den Bergen verstecken. Sie kennen jeden Stützpfeiler im Berg!',
      options: [
        {
          key: 'free_and_supply',
          reqCargo: { id: 'food', amt: 2 },
          label: '🤝 Ihnen 2× Proviant überlassen und Freiheit garantieren (+10 Ruf, sichere Führung bis zur Königskammer & Goldadern-Fund!)',
          resolve(st, site) {
            player.cargo.food -= 2;
            st.clueUnlocked = true;
            st.trapDisarmBonus += 0.35;
            st.bonusGoldMult += 0.25;
            changePlayerReputation(10);
            SoundFX.play('coin');
            st.log.unshift('🤝 Der dankbare Steiger führt euch auf geheimen Fördergängen an allen Einsturzstellen vorbei und zeigt euch eine unberührte Goldader (+25% Beute & +10 Ruf)!');
          }
        },
        {
          key: 'offer_passage',
          label: '⛵ Ihnen freie Überfahrt nach Nassau anbieten – wer will, darf für faire Heuer auf deinem Schiff anheuern!',
          resolve(st, site) {
            const space = Math.max(0, player.maxCrew - Math.ceil(player.crew));
            const joined = Math.min(space, 4);
            if (joined > 0) player.crew += joined;
            st.clueUnlocked = true;
            st.trapDisarmBonus += 0.22;
            changePlayerReputation(6);
            SoundFX.play('card');
            st.log.unshift(`⛵ Handschlag unter freien Männern! ${joined > 0 ? `+${joined} kräftige Bergleute schließen sich deiner Crew an` : 'Sie danken dir herzlich'} (+6 Ruf) und warnen euch vor dem Grubengas im Mittelstollen!`);
          }
        },
        {
          key: 'seize_gold_dust',
          label: '⚔️ Ihre ausgewaschenen Goldstaub-Säckchen mit Gewalt beschlagnahmen (+32% Gold, aber -22 Reputation & Gegenwehr)',
          resolve(st, site) {
            SoundFX.play('sword');
            changePlayerReputation(-22, '🩸 Geflohene Bergleute ausgeraubt!');
            st.bonusGoldMult += 0.32;
            applyAdventureHazardDamage(site, 0.95, 'Steinschleudern und Spitzhacken treffen deinen Trupp im engen Felsvorhof (-22 Ruf)!');
          }
        }
      ]
    },
    act4: {
      heading: '🪨 Akt 4/5 – Der einsturzgefährdete Königsstollen & das Grubengas:',
      story: 'Tief im Berg glitzern bereits die mit dem Wappen Kastiliens beschlagenen Schatztruhen hinter einer angebrochenen Stützwand. Doch eure Fackeln flackern bläulich – schweres Grubengas sammelt sich unter der Decke!',
      options: [
        {
          key: 'douse_and_shore',
          label: '🪵 Sofort offene Flammen löschen und mit Stempelhölzern nach Bergmannsart abstützen (Ideal mit Stollenkarte / Steiger-Warnung / Baumeister!)',
          resolve(st, site) {
            if (st.clueUnlocked || hasOfficerRole('master_builder') || hasOfficerRole('carpenter') || Math.random() < 0.55) {
              st.bonusGoldMult += 0.26;
              st.trapDisarmBonus += 0.30;
              SoundFX.play('coin');
              st.log.unshift('🪵 Besonnen gehandelt! Im Schein abgedeckter Blendlaternen stützt ihr den Firstbalken ab und räumt die gesamte Königskammer leer (+26% Beute)!');
            } else {
              applyAdventureHazardDamage(site, 1.05, 'Im Halbdunkel gibt ein Stützstempel nach – Geröll schrammt über Schultern und Helme!');
            }
          }
        },
        {
          key: 'rope_drag',
          label: '⛓️ Enterhaken aus dem belüfteten Hauptgang auswerfen und die Truhen herausziehen',
          resolve(st, site) {
            st.bonusGoldMult += 0.10;
            st.trapDisarmBonus += 0.15;
            st.log.unshift('⛓️ Mit langen Tauen schleift ihr die schweren Eisentruhen aus der Gefahrenzone (+10% Bonus)!');
          }
        },
        {
          key: 'ignite_gas_clear',
          label: '🔥 Das Gas aus der Deckung heraus kontrolliert abfackeln (Riskant ohne Oberkanonier, bringt aber Zugang zu hinteren Erzkisten +20%)',
          resolve(st, site) {
            SoundFX.play('cannon');
            if (hasOfficerRole('gunner') || Math.random() < 0.52) {
              st.bonusGoldMult += 0.20;
              st.log.unshift('🔥 Ein kurzes Fauchen brennt das Grubengas sauber weg und legt im hinteren Stollen weiteres Silbererz frei (+20% Beute)!');
            } else {
              applyAdventureHazardDamage(site, 1.25, 'Die Verpuffung reißt loses Deckengestein mit sich herab!');
            }
          }
        }
      ]
    }
  }
};

// ============================================================================
// STATE & LOGIK DES GROSSEN SCHATZSUCHE-TEXTADVENTURES
// ============================================================================
window.treasureAdvState = null;

window.startTreasureTextAdventure = function(site) {
  if (!site) return;
  const lm1 = site.landmark1 || 'twin_palms';
  const lm2 = site.landmark2 || 'skull_arch';

  const stage1Pool = ['twin_palms', 'cannon_wreck', 'obsidian_monolith'];
  const stage5Pool = ['skull_arch', 'waterfall_cave', 'bat_cenote'];
  if (!stage1Pool.includes(lm1)) stage1Pool[0] = lm1;
  if (!stage5Pool.includes(lm2)) stage5Pool[0] = lm2;

  const cfg = SITE_CAMPAIGN_MAP[site.id] || { campaign: 'maya' };
  const campKey = cfg.campaign || 'maya';
  const tpl = TREASURE_CAMPAIGN_TEMPLATES[campKey] || TREASURE_CAMPAIGN_TEMPLATES.maya;
  const siteTitle = td(site, 'name');

  window.treasureAdvState = {
    siteId: site.id,
    campaignKey: campKey,
    stage: site.looted ? 6 : 1,
    lm1,
    lm2,
    stage1Choices: [...stage1Pool].sort(() => Math.random() - 0.5),
    stage5Choices: [...stage5Pool].sort(() => Math.random() - 0.5),
    clueUnlocked: false,
    alertedRivals: false,
    bonusGoldMult: 1.0,
    trapDisarmBonus: 0,
    totalDead: 0,
    totalWounded: 0,
    foundRelicInfo: site.lastRelicInfo || null,
    finalLootSummary: site.lastReport || tr('Schatz bereits geborgen – Küste kann noch nach Vorräten abgesucht werden.', 'Treasure already looted — shore can still be foraged.'),
    log: [
      site.looted
        ? `🏝️ Die Schatzkammer von „${siteTitle}“ ist bereits geleert, aber am Strand wachsen noch frische Früchte und Limetten.`
        : `📜 <strong>${tpl.title_de}:</strong> ${tpl.intro_de}`
    ]
  };
};

function applyAdventureHazardDamage(site, severity = 1.0, reasonText = '') {
  const st = window.treasureAdvState;
  const cStats = getCrewCombatStats();
  const hasTreasurePerk = hasCaptainPerk('perk_treasure_hunter');
  const hasLookout = hasOfficerRole('lookout') || hasOfficerRole('navigator') || hasOfficerRole('pilot');
  const protection = Math.min(0.80, cStats.armorBonus * 0.65 + (hasTreasurePerk ? 0.25 : 0) + (hasLookout ? 0.15 : 0) + (st ? st.trapDisarmBonus : 0));

  const risk = (site.riskLevel || 1) * severity;
  let wounded = Math.max(1, Math.round((1 + risk * 1.20) * (1 - protection * 0.7)));
  let dead = 0;
  if (risk >= 1.70 && Math.random() < 0.38 * (1 - protection)) {
    dead = Math.max(1, Math.round(risk * 0.60 * (1 - protection)));
  }

  if (dead > 0 && player.crew > 4) {
    dead = Math.min(dead, Math.floor(player.crew - 4));
    player.crew -= dead;
    clampCrewEquipmentToCrewSize();
  } else dead = 0;

  if (wounded > 0) {
    player.woundedCrew = Math.min(Math.max(0, player.crew - 2), (player.woundedCrew || 0) + wounded);
  }

  if (st) {
    st.totalDead += dead;
    st.totalWounded += wounded;
    SoundFX.play('hit');
    st.log.unshift(`💥 ${reasonText} (-${dead} 💀, +${wounded} 🩸)`);
  }
  updateHUD();
}

window.chooseTreasureAdventureOption = function(choiceKey) {
  const st = window.treasureAdvState;
  const site = currentExploreSite;
  if (!st || !site || site.looted) return;
  const tpl = TREASURE_CAMPAIGN_TEMPLATES[st.campaignKey] || TREASURE_CAMPAIGN_TEMPLATES.maya;

  // AKT 1: KÜSTEN-EINSTIEG LAUT SCHATZKARTE
  if (st.stage === 1) {
    if (choiceKey === st.lm1) {
      SoundFX.play('card');
      st.bonusGoldMult += 0.15;
      st.trapDisarmBonus += 0.10;
      st.log.unshift(`✨ Akt 1 gemeistert! Exakt bei „${getLandmarkText(st.lm1)}“ entdeckt dein Späher die alten Wegmarken und entschärft den ersten Stolperdraht (+15% Schatzbonus)!`);
    } else {
      const wrongDef = LANDMARK_DEFS[choiceKey] || LANDMARK_DEFS.twin_palms;
      applyAdventureHazardDamage(site, 1.0, tr(wrongDef.wrongTrap_de, wrongDef.wrongTrap_en));
    }
    st.stage = 2;
    renderExplorationModal();
    return;
  }

  // AKT 2, 3 & 4: KAMPAGNEN-SPEZIFISCHE VERZWEIGUNGEN
  if (st.stage === 2 || st.stage === 3 || st.stage === 4) {
    const actObj = st.stage === 2 ? tpl.act2 : (st.stage === 3 ? tpl.act3 : tpl.act4);
    const opt = actObj.options.find(o => o.key === choiceKey);
    if (!opt) return;

    if (opt.reqCargo && (player.cargo[opt.reqCargo.id] || 0) < opt.reqCargo.amt) return;
    if (opt.reqGoldOrRum && (player.cargo.rum || 0) < 2 && game.gold < 45) return;

    opt.resolve(st, site);
    st.stage++;
    updateHUD();
    renderExplorationModal();
    return;
  }

  // AKT 5: DAS ROTE KREUZ (✖) & GARANTIERTE RELIKT-SCHATZBERGUNG!
  if (st.stage === 5) {
    if (choiceKey === st.lm2) {
      st.bonusGoldMult += 0.25;
      st.log.unshift(`🗝️ Volltreffer am roten Kreuz! Direkt unter „${getLandmarkText(st.lm2)}“ legt deine Crew das Hauptgewölbe frei (+25% Meister-Bonus)!`);
    } else {
      const wrongDef = LANDMARK_DEFS[choiceKey] || LANDMARK_DEFS.skull_arch;
      st.bonusGoldMult = Math.max(0.75, st.bonusGoldMult - 0.12);
      applyAdventureHazardDamage(site, 1.10, tr(wrongDef.wrongTrap_de, wrongDef.wrongTrap_en));
    }

    site.looted = true;
    const mods = getOfficerModifiers();
    const hasTreasurePerk = hasCaptainPerk('perk_treasure_hunter');
    // Deutlich lukrativeres Basisgold (1.45x Aufwertung) + Entscheidungs-Multiplikator!
    const totalMult = 1.45 * st.bonusGoldMult * (1.0 + (mods.treasureBonus || 0) + (hasTreasurePerk ? 0.25 : 0));
    const goldFound = Math.round(site.gold * totalMult);
    game.gold += goldFound;

    const free = Math.max(0, Math.floor(getMaxCargo() - getCargoTotal()));
    const boostedAmt = Math.round(site.goodAmt * 1.35);
    const taken = Math.min(free, boostedAmt);
    if (taken > 0) player.cargo[site.goodId] = (player.cargo[site.goodId] || 0) + taken;

    // GARANTIERTES EINZIGARTIGES SCHATZ-RELIKT VERGEBEN!
    const relicReward = awardGuaranteedTreasureRelic(site.id, st.bonusGoldMult);
    st.foundRelicInfo = relicReward;
    site.lastRelicInfo = relicReward;

    const goodObj = GOODS.find(g => g.id === site.goodId);
    const summaryMsg = `🏆 ${td(site, 'name')}: +${goldFound} 🪙 & +${taken}× ${td(goodObj, 'name')}${relicReward ? ` + [${relicReward.title}]` : ''}!`;
    site.lastReport = summaryMsg;
    st.finalLootSummary = summaryMsg;
    st.stage = 6;

    SoundFX.play('coin');
    grantCaptainXP(150, summaryMsg);
    updateHUD();
    renderExplorationModal();
  }
};

window.renderTreasureAdventureHTML = function(site) {
  if (!window.treasureAdvState || window.treasureAdvState.siteId !== site.id) {
    startTreasureTextAdventure(site);
  }
  const st = window.treasureAdvState;
  const tpl = TREASURE_CAMPAIGN_TEMPLATES[st.campaignKey] || TREASURE_CAMPAIGN_TEMPLATES.maya;

  // Dynamischen Schauplatz-Hintergrund passend zur aktuellen Etappe setzen!
  if (window.applySceneBackgroundToModal && tpl.scenes) {
    applySceneBackgroundToModal('exploreOverlay', tpl.scenes[st.stage] || 'exp_maya_temple');
  }

  const cStats = getCrewCombatStats();
  const forageLeft = site.forageLeft !== undefined ? site.forageLeft : 2;
  const freeCargo = Math.max(0, Math.floor(getMaxCargo() - getCargoTotal()));

  let choicesHtml = '';
  if (st.stage === 1) {
    choicesHtml = `
      <div class="card-box" style="margin-bottom:10px; border-color:#ffd700;">
        <div class="card-title" style="font-size:14.5px;">🧭 Akt 1/5 – Küsten-Landung (${tpl.title_de})</div>
        <div class="card-desc" style="color:#e2e8f0; font-size:12.5px; margin-bottom:0;">
          Drei Pfade führen vom Strand ins Innere. Vergleiche die Küsten-Landmarke oben auf deiner Schatzkarte, um nicht direkt in die Hinterhalte früherer Schatzsucher zu laufen!
        </div>
      </div>
      ${st.stage1Choices.map(ck => `
        <button class="adventure-choice-btn" onclick="chooseTreasureAdventureOption('${ck}')">
          Dem Pfad bei <strong>${getLandmarkText(ck)}</strong> ins Landesinnere folgen
        </button>
      `).join('')}
    `;
  } else if (st.stage === 2 || st.stage === 3 || st.stage === 4) {
    const actObj = st.stage === 2 ? tpl.act2 : (st.stage === 3 ? tpl.act3 : tpl.act4);
    const portraitHtml = actObj.portrait
      ? renderPortraitBox(SPECIAL_PORTRAITS[actObj.portrait] || actObj.portrait, 68, actObj.portraitBorder || '#ffd700', false)
      : '';

    choicesHtml = `
      <div class="card-box" style="margin-bottom:10px; border-color:${actObj.portraitBorder || '#38bdf8'};">
        <div style="display:flex; gap:12px; align-items:center;">
          ${portraitHtml}
          <div>
            <div class="card-title" style="font-size:14.5px; color:${actObj.portraitBorder || '#fde047'};">${actObj.heading}</div>
            <div class="card-desc" style="color:#f1f5f9; font-size:12.5px; margin:4px 0 0;">${actObj.story}</div>
          </div>
        </div>
      </div>
      ${actObj.options.map(opt => {
        let disabled = false;
        if (opt.reqCargo && (player.cargo[opt.reqCargo.id] || 0) < opt.reqCargo.amt) disabled = true;
        if (opt.reqGoldOrRum && (player.cargo.rum || 0) < 2 && game.gold < 45) disabled = true;
        return `
          <button class="adventure-choice-btn" ${disabled ? 'disabled' : ''} onclick="chooseTreasureAdventureOption('${opt.key}')">
            ${opt.label}
          </button>
        `;
      }).join('')}
    `;
  } else if (st.stage === 5) {
    choicesHtml = `
      <div class="card-box" style="margin-bottom:10px; border-color:#ffd700;">
        <div class="card-title" style="font-size:14.5px;">🗝️ Finale (Akt 5/5) – Das rote Kreuz (✖) im inneren Heiligtum!</div>
        <div class="card-desc" style="color:#e2e8f0; font-size:12.5px; margin-bottom:0;">
          Aktueller Beute-Multiplikator deiner Expedition: <strong style="color:#2ecc71;">${Math.round(st.bonusGoldMult * 100)}%</strong>. Drei Verstecke liegen vor euch – prüfe die zweite Landmarke deiner Karte!
        </div>
      </div>
      ${st.stage5Choices.map(ck => `
        <button class="adventure-choice-btn" onclick="chooseTreasureAdventureOption('${ck}')">
          ⛏️ Das Hauptgewölbe direkt unter <strong>${getLandmarkText(ck)}</strong> aufbrechen!
        </button>
      `).join('')}
    `;
  } else {
    const rel = st.foundRelicInfo;
    choicesHtml = `
      <div class="card-box" style="padding:16px; border:2px solid #ffd700; text-align:center; margin-bottom:12px;">
        <div style="font-size:16px; font-weight:bold; color:#fde047; margin-bottom:${rel ? '10px' : '0'};">${st.finalLootSummary}</div>
        ${rel ? `
          <div style="background:linear-gradient(90deg, rgba(120,53,15,0.65), rgba(30,41,59,0.85)); border:1.5px solid #fbbf24; border-radius:8px; padding:10px 14px; text-align:left; margin-top:6px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <strong style="color:#fef08a; font-size:14px;">✨ ${rel.title}</strong>
              <span class="relic-badge">EINZIGARTIGES RELIKT</span>
            </div>
            <div style="font-size:12px; color:#e2e8f0; margin-top:4px;">${rel.sub}</div>
          </div>
        ` : ''}
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="action-btn" style="flex:1; justify-content:center; padding:10px;" onclick="closeLandExploration(); toggleShipInventoryModal();">
          <span>🧰 Relikt im Schiffs- &amp; Kapitäns-Inventar [I] ansehen</span>
        </button>
        <button class="primary-btn" style="flex:1;" onclick="closeLandExploration();">
          ⛵ Mit der Beute zurück an Bord rudern!
        </button>
      </div>
    `;
  }

  return `
    <div style="background:linear-gradient(135deg, rgba(243,229,171,0.95), rgba(217,185,120,0.95)); color:#2c1810; border:3px solid #78350f; border-radius:8px; padding:11px 15px; margin-bottom:11px; box-shadow:0 6px 20px rgba(0,0,0,0.65); text-shadow:none;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; border-bottom:1px dashed #78350f; padding-bottom:5px; margin-bottom:5px;">
        <strong style="font-size:14px;">🗺️ Schatzkarte: ${tpl.title_de}</strong>
        <span style="font-size:12px; font-weight:bold;">⚠️ Gefahr ${site.riskLevel}/3 | 👥 ${cStats.healthyCrew} (${Math.floor(player.woundedCrew || 0)} 🩸) | 🍻 ${Math.round(player.morale)}% | 💰 Bonus: ${Math.round(st.bonusGoldMult * 100)}%</span>
      </div>
      <div style="font-size:12.5px; line-height:1.45;">
        <strong>1. Küsten-Einstieg:</strong> ${getLandmarkText(st.lm1)} &nbsp;|&nbsp;
        <strong>2. Schatz-Versteck (✖):</strong> ${getLandmarkText(st.lm2)}
        ${st.clueUnlocked ? ' &nbsp;|&nbsp; <strong style="color:#065f46;">🗝️ Geheimer Hinweis entdeckt!</strong>' : ''}
      </div>
    </div>

    <div class="card-box" style="margin-bottom:11px; max-height:125px; overflow-y:auto;">
      ${st.log.map(l => `<div style="font-size:12px; padding:4px 0; border-bottom:1px solid rgba(148,163,184,0.18); color:#f1f5f9;">${l}</div>`).join('')}
    </div>

    ${choicesHtml}

    <!-- Proviantsammeln funktioniert jederzeit – auch NACH abgeschlossener Schatzbergung! -->
    <div style="margin-top:12px; padding-top:9px; border-top:1px solid rgba(148,163,184,0.28); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <span style="font-size:12px; color:#a7f3d0;">
        🍋 Küsten-Vorräte sammeln (Freier Laderaum: <strong>${freeCargo}</strong>):
      </span>
      <button class="sm-btn" style="padding:5px 12px; font-size:11.5px; border-color:#2ecc71;" ${forageLeft <= 0 || freeCargo <= 0 ? 'disabled' : ''} onclick="performLandAction('forage')">
        🏝️ ${freeCargo <= 0 ? 'Laderaum voll!' : `Früchte & Limetten sammeln (${forageLeft}× übrig)`}
      </button>
    </div>
  `;
};

// ============================================================================
// 2. VOODOO-PRIESTER IM MYSTISCHEN DORF BOIS-CAÏMAN
// ============================================================================
window.canUnlockVoodooSecrets = function() {
  if (!window.game || !window.player || game.worldMode !== 'mythology') return false;
  const hasGhostShip = !!(player.isGhostShip || player.hasGhostVisual);
  const hasGhostOff = (player.officers || []).some(o => o.isGhostOfficer);
  const isGhostCap = !!(game.captain && (game.captain.isGhostCaptain || String(game.captain.portraitId || '').startsWith('geister:')));
  return hasGhostShip || hasGhostOff || isGhostCap;
};

window.buyVoodooPower = function(powerId) {
  if (!canUnlockVoodooSecrets()) return;
  const pDef = VOODOO_POWERS.find(p => p.id === powerId);
  if (!pDef || game.gold < pDef.cost) return;

  game.captain.voodooPowers = game.captain.voodooPowers || [];
  if (game.captain.voodooPowers.includes(powerId)) return;

  game.gold -= pDef.cost;
  game.captain.voodooPowers.push(powerId);

  if (pDef.isGhostTransformation) {
    game.captain.isGhostCaptain = true;
    if (!String(game.captain.portraitId || '').startsWith('geister:')) {
      const parsed = parsePortraitId(game.captain.portraitId);
      game.captain.portraitId = `geister:${parsed.index % 16}`;
    }
    game.captain.svg = renderPortraitSprite(game.captain.portraitId, true);
    player.hasGhostVisual = true;
    player.disease = null;
    changePlayerReputation(-35, '💀 Geist-Verwandlung vollzogen!');
  } else {
    logEvent(`🔮 ${td(pDef, 'name')}!`);
  }

  SoundFX.play('voodoo');
  recalcPlayerDerivedStats();
  renderOfficerHudBar();
  updateHUD();
  if (window.renderVillageModal) renderVillageModal();
};

window.renderVoodooSanctumSectionHTML = function() {
  if (!window.game || game.worldMode !== 'mythology') return '';
  if (!canUnlockVoodooSecrets()) {
    return `
      <div class="card-box" style="margin-top:14px; border-color:#7e22ce;">
        <div style="display:flex; gap:12px; align-items:center;">
          ${renderPortraitBox(SPECIAL_PORTRAITS.voodoo_elder, 72, '#c084fc', false)}
          <div>
            <div class="card-title" style="color:#e9d5ff;">🕯️ Seltsamer Dorfältester vor der Schlangenhütte</div>
            <div class="card-desc" style="color:#d8b4fe; margin-bottom:0;">
              „Für bloße Sterbliche haben wir nur Räucherfisch, Kapitän... Kehrt wieder, wenn der Hauch der Geisterwelt an Eurem Schiff, Eurem Antlitz oder Euren Offizieren haftet.“
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const ownedPowers = (game.captain && game.captain.voodooPowers) || [];
  return `
    <div class="card-box" style="margin-top:14px; border:2px solid #c084fc;">
      <div style="display:flex; gap:12px; align-items:center; margin-bottom:10px;">
        ${renderPortraitBox(SPECIAL_PORTRAITS.voodoo_bokor, 80, '#c084fc', true)}
        <div>
          <div class="card-title" style="color:#e879f9; font-size:15.5px;">🔮 Bokor Papa Cimetière offenbart sein Voodoo-Heiligtum!</div>
          <div class="card-desc" style="color:#e9d5ff; margin-bottom:0;">„Tretet an das Loa-Feuer – ich kann Eure Seele vom Fleisch lösen und Euch dunkle Geisterkräfte lehren!“</div>
        </div>
      </div>
      <div class="grid-2">
        ${VOODOO_POWERS.map(vp => {
          const owned = ownedPowers.includes(vp.id);
          return `
            <div class="card-box" style="border-color:${owned ? '#2ecc71' : '#a855f7'};">
              <div><div class="card-title" style="color:${vp.isGhostTransformation ? '#6ee7b7' : '#f0abfc'};">${td(vp, 'name')}</div><div class="card-desc" style="color:#cbd5e1;">${td(vp, 'desc')}</div></div>
              <button class="action-btn" style="background:#581c87; border-color:#c084fc;" ${owned || game.gold < vp.cost ? 'disabled' : ''} onclick="buyVoodooPower('${vp.id}')">
                <span>${owned ? t('activeBadge') : 'Ritual vollziehen'}</span><span>${owned ? '' : vp.cost + ' 🪙'}</span>
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
};

// ============================================================================
// 3. ONBOARDING-TUTORIAL (Benjamin Hornigold)
// ============================================================================
window.initHornigoldTutorial = function() {
  if (!window.game || !window.player) return;
  game.tutorial = { active: true, step: 1 };
  const nassau = PORTS.find(p => p.id === 'nassau') || PORTS[0];
  const ang = (nassau.seaAngle || Math.PI / 2) + 0.25;
  flotsam.push({
    x: player.x + Math.cos(ang) * 240, y: player.y + Math.sin(ang) * 240,
    gold: 85, goodId: 'canvas', goodAmt: 3, foodBonus: 2, rumBonus: 2,
    survivors: 0, faction: 'pirates', isTutorialCrate: true, life: 28000
  });
  renderTutorialBanner();
};

window.skipHornigoldTutorial = function() {
  if (!window.game || !game.tutorial) return;
  game.tutorial.active = false;
  renderTutorialBanner();
};

window.updateHornigoldTutorialProgress = function() {
  if (!window.game || !game.tutorial || !game.tutorial.active) return;
  const tut = game.tutorial;

  if (tut.step === 1 && player.sailSetting >= 2 && player.combatMode) {
    tut.step = 2;
    SoundFX.play('coin');
    showCrewChatter('Benjamin Hornigold', 'Gut gemacht! Mit [Z] nutzt du das Fernglas, mit [I] dein Schiffs- & Kapitäns-Inventar. Steuere nun durch die Kiste voraus!', renderPortraitSprite(SPECIAL_PORTRAITS.hornigold, false));
    renderTutorialBanner();
  } else if (tut.step === 2 && !flotsam.some(f => f.isTutorialCrate)) {
    tut.step = 3;
    SoundFX.play('coin');
    showCrewChatter('Benjamin Hornigold', 'Prachtvoll! Laufe jetzt Nassau [F] an und heuere in der Taverne einen Navigator für deine Seekarte [M] an!', renderPortraitSprite(SPECIAL_PORTRAITS.hornigold, false));
    renderTutorialBanner();
  } else if (tut.step === 3) {
    const hasNav = hasOfficerRole('navigator');
    const cartographerHiredAny = canDrawMap() && player.officers && player.officers.length > 0;
    if (hasNav || cartographerHiredAny) {
      tut.active = false;
      game.gold += 150;
      grantCaptainXP(45, '🎓 Hornigolds Einführung abgeschlossen (+150 🪙)!');
      SoundFX.play('coin');
      renderTutorialBanner();
      updateHUD();
    }
  }
};

window.renderTutorialBanner = function() {
  const el = document.getElementById('tutorialBanner');
  if (!el) return;
  if (!window.game || !game.tutorial || !game.tutorial.active) { el.classList.remove('visible'); return; }

  const texts = {
    1: '🎓 <strong>Hornigold (1/3):</strong> Setze Segel mit <strong>[W]</strong>, drücke <strong>[C]</strong> für Kampfmodus (<strong>[Z]</strong> = Fernglas, <strong>[I]</strong> = Inventar)!',
    2: '🎓 <strong>Hornigold (2/3):</strong> Steuere mit <strong>[A / D]</strong> durch die schwimmende Vorratskiste vor Nassau!',
    3: '🎓 <strong>Hornigold (3/3):</strong> Segle nach <strong>Nassau [F]</strong> und heuere in der <strong>Taverne</strong> einen <strong>Navigator</strong> an (+150 🪙)!'
  };
  el.innerHTML = `<span>${texts[game.tutorial.step] || texts[3]}</span><button class="sm-btn" style="margin-left:8px;" onclick="skipHornigoldTutorial()">✖</button>`;
  el.classList.add('visible');
};