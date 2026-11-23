// ============================================================================
// psychotest.js - Mehrsprachige Seemanns-Prüfung (DE/EN/ES/FR),
//                 Nationen- & Geister-Schiffsequipment (alle 6 Fraktionen!),
//                 Dynamischer Markt, Animiertes Blackjack & Zilch (4:3 Porträts)
// ============================================================================

const SPECIAL_SHIP_EQUIPMENT = [
  {
    id: 'powder_barrels',
    name: '🧨 Schwimmende Sprengstofffässer', name_en: '🧨 Floating Powder Barrels', name_es: '🧨 Barriles Explosivos Flotantes', name_fr: '🧨 Barils de Poudre Flottants',
    faction: 'pirates', availablePorts: ['nassau', 'tortuga', 'providencia', 'inagua'], cost: 380,
    desc: 'Piraten-Erfindung: Wirft mit Taste [R] ein brennendes Pulverfass ins Kielwasser ab (12s Abklingzeit), das Verfolger schwer beschädigt und verlangsamt!',
    desc_en: 'Pirate invention: Press [R] to drop a burning powder keg into your wake (12s cooldown) to heavily damage and slow pursuers!',
    desc_es: 'Invento pirata: ¡Pulsa [R] para soltar un barril ardiente en tu estela (12s recarga) que daña y frena a perseguidores!',
    desc_fr: 'Invention pirate: Appuyez sur [R] pour larguer un baril ardent dans votre sillage (12s recharge)!',
    mods: {}
  },
  {
    id: 'bow_chasers',
    name: '🎯 Schwere Bug-Jagdkanone', name_en: '🎯 Heavy Bow Chaser', name_es: '🎯 Cañón de Caza de Proa', name_fr: '🎯 Canon de Chasse de Proue',
    faction: 'england', availablePorts: ['portroyal', 'antigua', 'bridgetown', 'stkitts'], cost: 460,
    desc: 'Royal-Navy-Jagdgeschütz im Bug: Feuert mit Taste [R] direkt nach vorn (profitiert voll von deinen Geschütz-Upgrades und Kanonen!).',
    desc_en: 'Royal Navy bow gun: Press [R] to fire straight ahead (scales with your reload upgrades and equipped cannons!).',
    desc_es: 'Cañón de proa de la Royal Navy: ¡Pulsa [R] para disparar hacia adelante (mejora con tus cañones)!',
    desc_fr: 'Canon de proue Royal Navy: Appuyez sur [R] pour tirer droit devant!',
    mods: { damageMult: 0.06 }
  },
  {
    id: 'french_studsails',
    name: '⛵ Französische Leesegel & Kupferbeschlag', name_en: '⛵ French Studding Sails & Coppering', name_es: '⛵ Alas Francesas y Forro de Cobre', name_fr: '⛵ Bonnettes Françaises & Doublage Cuivre',
    faction: 'france', availablePorts: ['portauprince', 'martinique', 'guadeloupe', 'leogane'], cost: 420,
    desc: 'Französische Schiffbaukunst: +10% Segelgeschwindigkeit, +12% Ruder-Wendigkeit und Taste [R] gibt einen kurzen Wind-Sprintschub!',
    desc_en: 'French naval engineering: +10% speed, +12% rudder agility and [R] grants a rapid wind sprint boost!',
    desc_es: 'Ingeniería francesa: +10% velocidad, +12% giro y [R] otorga un impulso rápido de viento.',
    desc_fr: 'Ingénierie française: +10% vitesse, +12% barre et [R] donne une accélération rapide!',
    mods: { speedMult: 0.10, turnMult: 0.12 }
  },
  {
    id: 'spanish_bulkheads',
    name: '🛡️ Spanische Schatzkammer-Spanten', name_en: '🛡️ Spanish Treasure Bulkheads', name_es: '🛡️ Mamparos del Tesoro Español', name_fr: '🛡️ Cloisons aux Trésors Espagnoles',
    faction: 'spain', availablePorts: ['havanna', 'cartagena', 'sanjuan', 'portobelo', 'campeche'], cost: 450,
    desc: 'Massiver Galeonen-Ausbau: +110 Max. Rumpf-HP, +30 Frachtraum und -40% Sturmschaden.',
    desc_en: 'Reinforced galleon framing: +110 Max Hull HP, +30 cargo space and -40% storm damage.',
    desc_es: 'Refuerzo de galeón: +110 PV Casco Máx., +30 bodega y -40% daño de tormenta.',
    desc_fr: 'Renfort de galion: +110 PV Coque Max, +30 cale et -40% dégâts de tempête.',
    mods: { hullBonus: 110, cargoBonus: 30 }
  },
  {
    id: 'dutch_cargo_crane',
    name: '🏗️ Niederländischer WIC-Ladekran', name_en: '🏗️ Dutch WIC Salvage Crane', name_es: '🏗️ Grúa de Carga WIC Holandesa', name_fr: '🏗️ Palan de Charge WIC Néerlandais',
    faction: 'netherlands', availablePorts: ['willemstad', 'nieuw_middelburg', 'oranjestad_reef'], cost: 410,
    desc: 'Kaufmanns-Mechanik der WIC: +22 Frachtraum, +6% Handelspreise & Taste [R] zieht sämtliches Treibgut im Umkreis von 560px sofort an Bord!',
    desc_en: 'WIC merchant engineering: +22 cargo space, +6% trade prices & [R] hauls all flotsam within 560px straight aboard!',
    desc_es: 'Ingeniería mercante WIC: +22 bodega, +6% precios y [R] recoge todo resto flotante en 560px al instante.',
    desc_fr: 'Ingénierie WIC: +22 cale, +6% prix & [R] hisse immédiatement toutes les épaves à moins de 560px!',
    mods: { cargoBonus: 22, tradeBonus: 0.06 }
  },
  {
    id: 'danish_oak_swivels',
    name: '💥 Dänisch-Norwegische Drehbasse-Batterie', name_en: '💥 Danish-Norwegian Swivel Battery', name_es: '💥 Batería de Pedreros Danesa', name_fr: '💥 Batterie de Pierriers Danoise',
    faction: 'denmark', availablePorts: ['charlotte_amalie', 'christiansvaern'], cost: 440,
    desc: 'Nordische Reling-Geschütze & Eichenschild: +45 Max. Rumpf-HP, +10% Enter-Fernkampf & Taste [R] feuert eine 360°-Schrotsalve gegen nahe Feinde!',
    desc_en: 'Nordic rail guns & oak bulwarks: +45 Max Hull HP, +10% boarding ranged & [R] fires a 360° grape-shot blast!',
    desc_es: 'Pedreros nórdicos: +45 PV Casco, +10% fuego de abordaje y [R] dispara metralla en 360°.',
    desc_fr: 'Pierriers nordiques: +45 PV Coque, +10% tir d’abordage & [R] tire une salve à 360°!',
    mods: { hullBonus: 45, boardingRangedBonus: 0.10 }
  },
  {
    id: 'boarding_grapnels',
    name: '⛓️ Schwere Enterhaken & Sturmbrücken', name_en: '⛓️ Heavy Grappling Irons & Bridges', name_es: '⛓️ Garfios Pesados y Pasarelas', name_fr: '⛓️ Grappins Lourds & Passerelles',
    faction: 'pirates', availablePorts: ['tortuga', 'nassau', 'santodomingo', 'cayman'], cost: 390,
    desc: 'Erhöht die Enter-Reichweite [B] um 45%, +15% Nahkampfkraft im Entergefecht und -0.5s Rüstzeit.',
    desc_en: 'Increases boarding range [B] by 45%, +15% boarding melee power and -0.5s mode switch.',
    desc_es: 'Aumenta el alcance de abordaje [B] un 45%, +15% combate cuerpo a cuerpo y -0.5s cambio de modo.',
    desc_fr: 'Augmente la portée d’abordage [B] de 45%, +15% mêlée et -0.5s transition.',
    mods: { boardingMeleeBonus: 0.15, modeSwitchSec: -0.5 }
  },
  {
    id: 'ghost_lantern',
    name: '🟢 Seelenfeuer-Geisterlaterne', name_en: '🟢 Soulfire Ghost Lantern', name_es: '🟢 Linterna Fantasma de Fuego de Almas', name_fr: '🟢 Lanterne Spectrale Feu-d’Âme',
    faction: 'pirates', enclaveOnly: true, availablePorts: [], cost: 880,
    desc: 'Nur in der Geister-Enklave! +25% Sichtweite nachts & Taste [R] entfesselt einen Geisterfeuer-Schockring (setzt nahe Feinde in Grünes Feuer)!',
    desc_en: 'Ghost Enclave relic! +25% sight range & [R] unleashes a spectral shockwave igniting nearby foes with Green Ghost Fire!',
    desc_es: '¡Reliquia del Enclave! +25% visión y [R] desata un anillo espectral que prende Fuego Fantasma Verde.',
    desc_fr: 'Relique de l’Enclave! +25% vue & [R] libère une onde spectrale allumant un Feu Spectral Vert!',
    mods: { sightMult: 0.25, damageMult: 0.08 }
  },
  // === EINZIGARTIGE SCHATZSUCHE-RELIKTE FÜR DEN SCHIFFS-EQUIPMENT-SLOT [R] ===
  {
    id: 'eq_greek_fire',
    name: '🔥 Byzantinischer Pech- & Feuerwerfer', name_en: '🔥 Byzantine Greek-Fire Siphon',
    faction: 'pirates', treasureOnly: true, availablePorts: [], cost: 950,
    desc: 'Schatz-Relikt! +10% Kanonenschaden & Taste [R] schleudert flüssiges Griechisches Feuer auf nahe Verfolger (<320px: sofortiger schwerer Deckbrand & -65 Rumpf-HP)!',
    desc_en: 'Treasure Relic! +10% cannon damage & [R] hurls liquid Greek Fire onto nearby foes (<320px: instant heavy deck blaze & -65 Hull HP)!',
    mods: { damageMult: 0.10 }
  },
  {
    id: 'eq_smuggler_keel',
    name: '📦 Schmugglers Geheimboden & Bleikiel', name_en: '📦 Smuggler’s False Hold & Lead Keel',
    faction: 'pirates', treasureOnly: true, availablePorts: [], cost: 920,
    desc: 'Schatz-Relikt! +42 versteckter Frachtraum, +9% Segeltempo, +10% Wendigkeit & Taste [R] zündet eine dichte Rauchwand + Fluchtsprint!',
    desc_en: 'Treasure Relic! +42 hidden cargo hold, +9% speed, +10% turn & [R] deploys a dense smoke screen + escape sprint!',
    mods: { cargoBonus: 42, speedMult: 0.09, turnMult: 0.10 }
  },
  {
    id: 'eq_corsair_ram',
    name: '⚔️ Kaltgeschmiedeter Korsaren-Rammsporn', name_en: '⚔️ Cold-Forged Corsair Iron Ram',
    faction: 'pirates', treasureOnly: true, availablePorts: [], cost: 980,
    desc: 'Schatz-Relikt! +95 Max. Rumpf-HP, +70% vernichtender Rammschaden (-65% Eigenschaden beim Rammen) & Taste [R] startet einen wuchtigen Ramm-Vorstoß!',
    desc_en: 'Treasure Relic! +95 Max Hull HP, +70% devastating ram damage (-65% self-damage) & [R] triggers a ferocious ramming surge!',
    mods: { hullBonus: 95, boardingMeleeBonus: 0.12 }
  }
];

window.initDynamicMarkets = function() {
  PORTS.forEach((port, idx) => {
    port.marketStock = {};
    port.marketPricePressure = {};
    port.tavernCrewAvail = 7 + (idx % 6) * 2;
    port.tavernRoundBought = false;

    GOODS.forEach((g, gIdx) => {
      if (g.enclaveOnly) {
        port.marketStock[g.id] = -1;
      } else if (g.isCannon) {
        if (port.faction === 'pirates') {
          port.marketStock[g.id] = g.cannonTier <= 1 ? (6 + (idx % 4) * 2) : (g.cannonTier === 2 ? 4 : -1);
        } else {
          if (g.cannonTier === 0) port.marketStock[g.id] = 14;
          else if (g.cannonTier === 1) port.marketStock[g.id] = 10;
          else if (g.cannonTier === 2) port.marketStock[g.id] = (port.maxFortHp >= 3000 || port.exports.includes(g.id)) ? 8 : 4;
          else port.marketStock[g.id] = (port.maxFortHp >= 3400 || port.exports.includes(g.id)) ? 6 : -1;
        }
      } else if (g.isSupply || port.exports.includes(g.id) || port.imports.includes(g.id)) {
        port.marketStock[g.id] = port.exports.includes(g.id) ? 45 : 25;
      } else {
        const hash = (idx * 17 + gIdx * 31) % 10;
        port.marketStock[g.id] = hash < 4 ? -1 : (12 + hash * 2);
      }
      port.marketPricePressure[g.id] = 1.0;
    });
  });
};

const PSYCHO_QUESTIONS_POOL = [
  {
    q: 'Ein schwerer Orkan hat dein Schiff vor den Bahamas fast zerschmettert. Als der Morgen graut, treibt ein leckgeschlagenes spanisches Handelsschiff vorbei. Dein Befehl?',
    q_en: 'A fierce hurricane off the Bahamas nearly shattered your ship. At dawn, a leaking Spanish merchantman drifts past. Your order?',
    q_es: 'Un feroz huracán frente a las Bahamas casi destroza tu barco. Al amanecer, pasa un mercante español haciendo agua. ¿Tu orden?',
    q_fr: 'Un ouragan près des Bahamas a presque brisé votre navire. À l’aube, un navire marchand espagnol prenant l’eau dérive. Votre ordre?',
    answers: [
      { text: '„Stückpforten auf! Wir schießen ihnen das Ruder weg und nehmen ihre Ladung!“', text_en: '"Open gunports! Shoot away their rudder and seize their cargo!"', text_es: '«¡Abrid portas! ¡Destrozad su timón y tomad su carga!»', text_fr: '«Ouvrez les sabords! Brisez leur gouvernail et prenez la cargaison!»', skill: 'gunnery', traitHint: 'bloodthirsty' },
      { text: '„Enterhaken bereithalten! Längsseits gehen und mit blankem Säbel rübersetzen!“', text_en: '"Ready grappling hooks! Come alongside with drawn cutlasses!"', text_es: '«¡Garfios listos! ¡Abordemos con el sable en mano!»', text_fr: '«Grappins prêts! À l’abordage sabre au clair!»', skill: 'leadership', traitHint: 'bloodthirsty' },
      { text: '„Signalflagge setzen: Wir helfen beim Pumpen – gegen die Hälfte ihrer Silberkisten!“', text_en: '"Hoist signal flags: We help pump water in exchange for half their silver!"', text_es: '«¡Izad bandera: ayudamos a achicar a cambio de la mitad de su plata!»', text_fr: '«Hissez le signal: nous aidons aux pompes contre la moitié de leur argent!»', skill: 'commerce', traitHint: 'silver_tongue' },
      { text: '„Kompass und Lot prüfen! Wir nutzen den Wind, um vor ihnen Nassau zu erreichen.“', text_en: '"Check compass and lead line! Ride the wind to reach Nassau ahead of them."', text_es: '«¡Revisad brújula y sonda! Usemos el viento para llegar antes a Nasáu.»', text_fr: '«Vérifiez boussole et sonde! Profitons du vent pour rallier Nassau.»', skill: 'seamanship', traitHint: 'cartographer' }
    ]
  },
  {
    q: 'In der Taverne von Tortuga bricht ein Streit über die Prisenbeute aus. Ein vernarbter Kanonier zieht sein Messer.',
    q_en: 'In Tortuga’s tavern, a brawl erupts over prize money. A scarred gunner draws his knife.',
    q_es: 'En la taberna de Tortuga estalla una disputa por el botín. Un artillero saca su cuchillo.',
    q_fr: 'Dans la taverne de la Tortue, une querelle éclate pour le butin. Un canonnier tire son couteau.',
    answers: [
      { text: 'Ich entwaffne ihn mit dem Pistolenknauf und sorge für eiserne Disziplin.', text_en: 'Disarm him with my pistol butt and enforce iron discipline.', text_es: 'Lo desarmo con la culata de mi pistola e impongo disciplina.', text_fr: 'Je le désarme d’un coup de crosse et impose une discipline de fer.', skill: 'leadership', traitHint: 'iron_stomach' },
      { text: 'Ich rechne ihm vor, dass mein nächster Handelsplan jedem das Doppelte einbringt.', text_en: 'Prove to him that my next trade route will double everyone’s share.', text_es: 'Le demuestro que mi próximo plan comercial duplicará su parte.', text_fr: 'Je lui prouve que mon prochain plan commercial doublera sa part.', skill: 'commerce', traitHint: 'silver_tongue' },
      { text: 'Ich spendiere ein Fass Rum und schicke ihn zum Geschützdrill an Deck.', text_en: 'Buy a barrel of rum and send him on deck for cannon drill.', text_es: 'Pago un barril de ron y lo envío a practicar con los cañones.', text_fr: 'J’offre un baril de rhum et l’envoie à l’exercice de tir.', skill: 'gunnery', traitHint: 'master_gunner' },
      { text: 'Ich lasse den Quartiermeister Rationen und Heuer streng prüfen.', text_en: 'Have the quartermaster strictly audit rations and wages.', text_es: 'Ordeno al contramaestre revisar estrictamente raciones y paga.', text_fr: 'Je fais contrôler strictement les rations et la solde.', skill: 'survival', traitHint: 'iron_stomach' }
    ]
  },
  {
    q: 'Nach drei Wochen Flaute zeigen die ersten Matrosen Skorbut und das Trinkwasser riecht faulig.',
    q_en: 'After three weeks becalmed, sailors show signs of scurvy and the water barrels turn foul.',
    q_es: 'Tras tres semanas de calma chicha, aparece el escorbuto y el agua huele mal.',
    q_fr: 'Après trois semaines de calme plat, le scorbut apparaît et l’eau croupit.',
    answers: [
      { text: 'Kombüse schrubben, Limetten austeilen und Regenwasser in Segeln auffangen!', text_en: 'Scrub the galley, ration limes and catch rainwater in the sails!', text_es: '¡Limpiar la cocina, repartir limas y recoger agua de lluvia!', text_fr: 'Nettoyer la coquerie, distribuer des citrons et recueillir la pluie!', skill: 'survival', traitHint: 'iron_stomach' },
      { text: 'Anhand der Sterne den kürzesten Kurs zur nächsten unerforschten Bucht zeichnen.', text_en: 'Chart the shortest course by the stars to an unexplored cove.', text_es: 'Trazar por las estrellas el rumbo más corto a una cala virgen.', text_fr: 'Tracer aux étoiles la route la plus courte vers une crique.', skill: 'seamanship', traitHint: 'cartographer' },
      { text: 'Nachts unter Vollzeug jede Brise ausnutzen, um das offene Meer zu überqueren.', text_en: 'Catch every night breeze under full canvas to cross the open sea.', text_es: 'Aprovechar cada brisa nocturna a toda vela.', text_fr: 'Profiter de chaque brisa nocturne toutes voiles dehors.', skill: 'seamanship', traitHint: 'night_owl' },
      { text: 'Das nächste Versorgungsschiff überfallen – egal unter welcher Flagge!', text_en: 'Raid the very next supply vessel—no matter what flag she flies!', text_es: '¡Asaltar el próximo barco de suministros sin importar su bandera!', text_fr: 'Attaquer le premier navire de ravitaillement venu!', skill: 'gunnery', traitHint: 'bloodthirsty' }
    ]
  },
  {
    q: 'Ein alter Einbeiniger bietet dir in einer Hafengasse eine vergilbte Schatzkarte für 100 Dublonen an.',
    q_en: 'In a dark port alley, an old peg-legged sailor offers you a yellowed treasure map for 100 doubloons.',
    q_es: 'En un callejón del puerto, un viejo marino ofrece un mapa del tesoro por 100 doblones.',
    q_fr: 'Dans une ruelle du port, un vieux marin propose une carte au trésor pour 100 doublons.',
    answers: [
      { text: 'Ich prüfe Breitengrade und Küstenlinien selbst auf Echtheit.', text_en: 'Inspect the latitudes and coastlines myself for authenticity.', text_es: 'Verifico yo mismo las latitudes y líneas costeras.', text_fr: 'J’examine moi-même les latitudes et le tracé des côtes.', skill: 'seamanship', traitHint: 'cartographer' },
      { text: 'Ich handle ihn mit geschickten Worten auf 40 Dublonen herunter.', text_en: 'Talk him down to 40 doubloons with silver-tongued bargaining.', text_es: 'Regateo con astucia hasta bajarlo a 40 doblones.', text_fr: 'Je négocie habilement pour faire baisser le prix à 40 doublons.', skill: 'commerce', traitHint: 'silver_tongue' },
      { text: 'Ich nehme die Karte und stelle sofort einen abgehärteten Landungstrupp zusammen.', text_en: 'Buy the map and assemble a hardened shore expedition.', text_es: 'Compro el mapa y preparo una expedición bien equipada.', text_fr: 'J’achète la carte et prépare une expédition endurcie.', skill: 'survival', traitHint: 'iron_stomach' },
      { text: 'Ich schüchtere ihn ein, bis er mir das Versteck verrät.', text_en: 'Intimidate him until he reveals the location for free.', text_es: 'Lo intimido hasta que me revele el escondite.', text_fr: 'Je l’intimide jusqu’à ce qu’il révèle la cachette.', skill: 'leadership', traitHint: 'bloodthirsty' }
    ]
  },
  {
    q: 'Eine königliche Fregatte mit 36 Kanonen taucht aus dem Nebel auf und fordert deine Übergabe.',
    q_en: 'A 36-gun royal frigate emerges from the fog and demands your surrender.',
    q_es: 'Una fragata real de 36 cañones surge de la niebla y exige tu rendición.',
    q_fr: 'Une frégate royale de 36 canons surgit de la brume et exige votre reddition.',
    answers: [
      { text: '„Kettenkugeln laden! Wir schießen ihnen die Masten weg und verschwinden im Wind!“', text_en: '"Load chain shot! Cripple their masts and vanish into the wind!"', text_es: '«¡Balas encadenadas! ¡Derribad sus mástiles y escapemos!»', text_fr: '«Boulets ramés! Abattez leurs mâts et filons dans le vent!»', skill: 'seamanship', traitHint: 'night_owl' },
      { text: '„Geschützpforten in Rekordzeit aufreißen und volle Breitseite auf die Wasserlinie!“', text_en: '"Run out the guns in record time and fire a full broadside into her waterline!"', text_es: '«¡Abrid portas al instante y disparad una andanada a la línea de flotación!»', text_fr: '«Sortez les pièces et tirez une bordée complète à la flottaison!»', skill: 'gunnery', traitHint: 'master_gunner' },
      { text: '„Falsche Flagge hissen und gefälschte Kaperbriefe des Gouverneurs vorzeigen!“', text_en: '"Hoist a false flag and present forged letters of marque!"', text_es: '«¡Izad bandera falsa y mostrad patentes de corso falsificadas!»', text_fr: '«Hissez un faux pavillon et montrez des lettres de marque!»', skill: 'commerce', traitHint: 'silver_tongue' },
      { text: '„Alle Mann in Deckung, Rumpf abstützen und auf Enterdistanz heranziehen!“', text_en: '"All hands brace for impact and close in to boarding range!"', text_es: '«¡Todos a cubierto, reforzad el casco y acercaos al abordaje!»', text_fr: '«À couvert, étayez la coque et approchez à portée d’abordage!»', skill: 'survival', traitHint: 'iron_stomach' }
    ]
  },
  {
    q: 'Du erbeutest eine spanische Galeone voller Seide und Silber. Wie nutzt du die Beute?',
    q_en: 'You capture a Spanish galleon laden with silk and silver. How do you use the prize?',
    q_es: 'Capturas un galeón español lleno de seda y plata. ¿Cómo aprovechas el botín?',
    q_fr: 'Vous capturez un galion espagnol chargé de soie et d’argent. Que faites-vous du butin?',
    answers: [
      { text: 'Pünktliche Heuer und gerechte Anteile für jeden Matrosen an Bord!', text_en: 'Pay full wages and fair shares to every sailor aboard!', text_es: '¡Paga puntual y partes justas para cada marinero a bordo!', text_fr: 'Solde ponctuelle et parts équitables pour chaque marin!', skill: 'leadership', traitHint: 'iron_stomach' },
      { text: 'Die Ladung wird im besten Import-Hafen zum Höchstpreis versteigert!', text_en: 'Auction the cargo at the highest-paying import port!', text_es: '¡Vender la carga en el mejor puerto importador al precio máximo!', text_fr: 'Vendre la cargaison au prix fort dans le meilleur port!', skill: 'commerce', traitHint: 'silver_tongue' },
      { text: 'Das Silber fließt sofort in schwere 18- und 32-Pfünder-Bronzekanonen!', text_en: 'Invest the silver straight into heavy 18- and 32-pounder bronze cannons!', text_es: '¡Invertir la plata en cañones pesados de bronce de 18 y 32 libras!', text_fr: 'Investir l’argent dans de lourds canons de 18 et 32 livres!', skill: 'gunnery', traitHint: 'master_gunner' },
      { text: 'Wir sichern uns zuerst die geheimen Seekarten und Logbücher des Kapitäns.', text_en: 'Claim the Spanish captain’s secret sea charts and logbooks first.', text_es: 'Aseguramos primero las cartas náuticas y bitácoras secretas.', text_fr: 'Nous prenons d’abord les cartes marines secrètes et le journal.', skill: 'seamanship', traitHint: 'cartographer' }
    ]
  },
  {
    q: 'Ein dichter Gewittersturm zieht vor gefährlichen Korallenriffen direkt auf deinen Kurs zu.',
    q_en: 'A violent thunderstorm rolls onto your course right ahead of razor-sharp coral reefs.',
    q_es: 'Una violenta tormenta eléctrica avanza hacia tu rumbo frente a arrecifes de coral.',
    q_fr: 'Un violent orage approche droit devant des récifs coralliens tranchants.',
    answers: [
      { text: 'Segel streichen, Anker werfen und den Zimmermann bereitstellen!', text_en: 'Strike sails, drop anchor and keep the carpenter ready!', text_es: '¡Arriar velas, echar el ancla y alistar al carpintero!', text_fr: 'Ferler les voiles, jeter l’ancre et préparer le charpentier!', skill: 'survival', traitHint: 'iron_stomach' },
      { text: 'Am Rand der Sturmfront entlangreiten, um Verfolger abzuschütteln!', text_en: 'Skirt the storm wall at high speed to shake off pursuers!', text_es: '¡Bordear el frente de tormenta para despistar perseguidores!', text_fr: 'Longer le front de l’orage pour semer les poursuivants!', skill: 'seamanship', traitHint: 'night_owl' },
      { text: 'Nach dem Lichtkegel des nächsten Leuchtturms navigieren und Riffe kartieren.', text_en: 'Navigate by the nearest lighthouse beam and chart the reefs.', text_es: 'Navegar guiado por el haz del faro y cartografiar los arrecifes.', text_fr: 'Naviguer au faisceau du phare et cartographier les récifs.', skill: 'seamanship', traitHint: 'cartographer' },
      { text: 'Geschütze verzurren, damit keine Kanone bei Seegang losbricht!', text_en: 'Lash down all cannons tightly so none break loose in heavy seas!', text_es: '¡Asegurar los cañones para que ninguno se suelte con el oleaje!', text_fr: 'Amarrer solidement les canons contre la houle!', skill: 'gunnery', traitHint: 'master_gunner' }
    ]
  },
  {
    q: 'Welche Eigenschaft schätzt du an deinem Flaggschiff und deiner eigenen Kolonie-Basis am meisten?',
    q_en: 'What quality do you value most in your flagship and your own Colony Base?',
    q_es: '¿Qué cualidad valoras más en tu buque insignia y en tu propia Base?',
    q_fr: 'Quelle qualité appréciez-vous le plus pour votre navire amiral et votre Base?',
    answers: [
      { text: 'Ein gewaltiges Batteriedeck und eine eigene Pulvermühle in der Basis!', text_en: 'A devastating gundeck and our own powder mill at the base!', text_es: '¡Una cubierta de artillería letal y un molino de pólvora propio!', text_fr: 'Un pont-batterie dévastateur et notre propre poudrerie!', skill: 'gunnery', traitHint: 'master_gunner' },
      { text: 'Schnelle Segel für Nachtfahrten und ein geheimes Kielhol-Dock.', text_en: 'Swift sails for night raids and a secret careenage drydock.', text_es: 'Velas rápidas para incursiones nocturnas y un dique seco.', text_fr: 'Des voiles rapides de nuit et un carénage secret.', skill: 'seamanship', traitHint: 'night_owl' },
      { text: 'Florierende Plantagen, Brennereien und riesige Laderäume für maximalen Gewinn.', text_en: 'Thriving plantations, distilleries and vast cargo holds for profit.', text_es: 'Plantaciones prósperas, destilerías y grandes bodegas.', text_fr: 'Plantations prospères, distilleries et vastes cales.', skill: 'commerce', traitHint: 'silver_tongue' },
      { text: 'Hundert furchtlose Korsaren, vor deren schwarzer Flagge jeder zittert!', text_en: 'A hundred fearless corsairs whose black flag makes empires tremble!', text_es: '¡Cien corsarios sin miedo cuya bandera negra hace temblar imperios!', text_fr: 'Cent corsaires intrépides dont le pavillon noir fait trembler!', skill: 'leadership', traitHint: 'bloodthirsty' }
    ]
  },
  {
    q: 'Bei Nacht hörst du unheimliche Gesänge und siehst grünes Geisterfeuer am Horizont.',
    q_en: 'At night, you hear eerie chants and spot emerald Ghost Fire glowing on the horizon.',
    q_es: 'De noche oyes cánticos espectrales y ves brillar Fuego Fantasma verde en el horizonte.',
    q_fr: 'La nuit, vous entendez des chants sinistres et voyez un Feu Spectral vert à l’horizon.',
    answers: [
      { text: 'Reiner Aberglaube! Ich bestimme per Sextant unsere exakte Position.', text_en: 'Mere superstition! Take a starsight with the sextant at once.', text_es: '¡Pura superstición! Determino nuestra posición con el sextante.', text_fr: 'Pure superstition! Je relève notre position au sextant.', skill: 'seamanship', traitHint: 'cartographer' },
      { text: 'Ich halte eine eiserne Ansprache, damit niemand seinen Posten verlässt.', text_en: 'Deliver a stern speech so not a single man abandons his post.', text_es: 'Doy un discurso férreo para que nadie abandone su puesto.', text_fr: 'Je tiens un discours de fer pour que chacun reste à son poste.', skill: 'leadership', traitHint: 'iron_stomach' },
      { text: 'Wir löschen alle Laternen und gleiten lautlos durch die Finsternis.', text_en: 'Douse all lanterns and glide silently through the darkness.', text_es: 'Apagamos los faroles y nos deslizamos en silencio.', text_fr: 'Éteignons les fanaux et glissons sans bruit dans l’ombre.', skill: 'seamanship', traitHint: 'night_owl' },
      { text: 'Kanonen laden – selbst Geisterpiraten sollen unsere Breitseite fürchten!', text_en: 'Run out the guns—even Ghost Pirates shall fear our broadside!', text_es: '¡Cargad cañones: hasta los fantasmas temerán nuestra andanada!', text_fr: 'Chargez les canons: même les spectres craindront nos bordées!', skill: 'gunnery', traitHint: 'bloodthirsty' }
    ]
  },
  {
    q: 'Wie soll man sich in hundert Jahren an deinen Namen in der Karibik erinnern?',
    q_en: 'How should the Caribbean remember your name a hundred years from now?',
    q_es: '¿Cómo deberá recordar el Caribe tu nombre dentro de cien años?',
    q_fr: 'Comment les Caraïbes devront-elles se souvenir de votre nom dans cent ans?',
    answers: [
      { text: 'Als den gefürchtetsten Piratenfürsten, der selbst vor den Verdammten keine Furcht kannte!', text_en: 'As the most feared Pirate Lord who stared down even the Damned!', text_es: '¡Como el Señor Pirata más temido, sin miedo ni a los Condenados!', text_fr: 'Comme le Seigneur Pirate le plus redouté des mers!', skill: 'leadership', traitHint: 'bloodthirsty' },
      { text: 'Als den großen Entdecker, der jeden Winkel und jedes Riff der Antillen kartierte.', text_en: 'As the great explorer who charted every reef and cove of the Antilles.', text_es: 'Como el gran explorador que cartografió cada rincón de las Antillas.', text_fr: 'Comme le grand explorateur ayant cartographié toutes les Antilles.', skill: 'seamanship', traitHint: 'cartographer' },
      { text: 'Als den reichsten Handelsfürsten und Herrn einer blühenden Kolonie-Insel.', text_en: 'As the wealthiest merchant prince and master of a thriving colony haven.', text_es: 'Como el príncipe mercader más rico y señor de una isla próspera.', text_fr: 'Comme le plus riche prince marchand et maître d’une colonie prospère.', skill: 'commerce', traitHint: 'silver_tongue' },
      { text: 'Als das ungreifbare Phantom der Meere, das kein Kriegsschiff je einholte.', text_en: 'As the elusive Phantom of the Seas whom no warship could ever catch.', text_es: 'Como el Fantasma de los Mares al que ningún buque pudo alcanzar.', text_fr: 'Comme le Fantôme insaisissable des mers.', skill: 'seamanship', traitHint: 'night_owl' }
    ]
  }
];

window.getLocalizedQuestionText = function(qObj) {
  if (!qObj) return '';
  const lang = window.currentLang || 'de';
  if (lang !== 'de' && qObj['q_' + lang]) return qObj['q_' + lang];
  return qObj.q;
};

window.getLocalizedAnswerText = function(ansObj) {
  if (!ansObj) return '';
  const lang = window.currentLang || 'de';
  if (lang !== 'de' && ansObj['text_' + lang]) return ansObj['text_' + lang];
  return ansObj.text;
};

window.pickRandomPsychoQuestions = function(count = 5) {
  const copy = [...PSYCHO_QUESTIONS_POOL];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
};

// ============================================================================
// ANIMIERTES BLACKJACK-FENSTER (Mit 4:3-Croupier-Porträt)
// ============================================================================
window.bjState = {
  active: false, bet: 50, deck: [], playerHand: [], dealerHand: [],
  statusText: '', phase: 'idle', dealerTimer: null
};

window.clearBlackjackTimer = function() {
  if (bjState.dealerTimer) { clearTimeout(bjState.dealerTimer); bjState.dealerTimer = null; }
};

function createBlackjackDeck() {
  const suits = [{ s: '♠', color: '#0f172a' }, { s: '♥', color: '#dc2626' }, { s: '♦', color: '#dc2626' }, { s: '♣', color: '#0f172a' }];
  const faceJ = tr('B', 'J', 'J', 'V'), faceQ = tr('D', 'Q', 'Q', 'D');
  const ranks = [
    { r: '2', v: 2 }, { r: '3', v: 3 }, { r: '4', v: 4 }, { r: '5', v: 5 },
    { r: '6', v: 6 }, { r: '7', v: 7 }, { r: '8', v: 8 }, { r: '9', v: 9 },
    { r: '10', v: 10 }, { r: faceJ, v: 10 }, { r: faceQ, v: 10 }, { r: 'K', v: 10 }, { r: 'A', v: 11 }
  ];
  const deck = [];
  for (const st of suits) {
    for (const rk of ranks) deck.push({ rank: rk.r, suit: st.s, color: st.color, label: `${rk.r}${st.s}`, val: rk.v, isAce: rk.r === 'A' });
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

window.calcBlackjackScore = function(hand) {
  let sum = 0, aces = 0;
  for (const c of hand) { sum += c.val; if (c.isAce) aces++; }
  while (sum > 21 && aces > 0) { sum -= 10; aces--; }
  return sum;
};

window.openBlackjackModal = function() {
  clearBlackjackTimer();
  const ov = document.getElementById('blackjackOverlay');
  if (ov) {
    if (!bjState.statusText || bjState.phase === 'idle' || bjState.phase === 'dealer_turn') {
      bjState.phase = 'idle';
      bjState.statusText = tr('Wähle deinen Einsatz am grünen Filztisch!', 'Place your wager at the green felt table!', '¡Elige tu apuesta!', 'Choisissez votre mise!');
    }
    ov.classList.add('active');
    renderBlackjackModal();
  }
};

window.closeBlackjackModal = function() {
  if (bjState.phase === 'dealer_turn') { clearBlackjackTimer(); bjState.phase = 'idle'; }
  const ov = document.getElementById('blackjackOverlay');
  if (ov) ov.classList.remove('active');
  if (window.renderPortModal && document.getElementById('portOverlay').classList.contains('active')) renderPortModal();
};

window.startBlackjackRound = function(bet) {
  if (!window.game || game.gold < bet) return;
  clearBlackjackTimer();
  game.gold -= bet;
  SoundFX.play('card');
  bjState.bet = bet;
  bjState.deck = createBlackjackDeck();
  bjState.playerHand = [bjState.deck.pop(), bjState.deck.pop()];
  bjState.dealerHand = [bjState.deck.pop(), bjState.deck.pop()];
  bjState.phase = 'playing';

  const pScore = calcBlackjackScore(bjState.playerHand);
  if (pScore === 21) { standBlackjack(); return; }
  bjState.statusText = tr(`Einsatz: ${bet} 🪙. Deine Hand zählt ${pScore} Punkte.`, `Bet: ${bet} 🪙. Your hand totals ${pScore}.`, `Apuesta: ${bet} 🪙. Tu mano suma ${pScore}.`, `Mise: ${bet} 🪙. Votre main vaut ${pScore}.`);
  updateHUD();
  renderBlackjackModal();
};

window.hitBlackjack = function() {
  if (bjState.phase !== 'playing') return;
  SoundFX.play('card');
  bjState.playerHand.push(bjState.deck.pop());
  const pScore = calcBlackjackScore(bjState.playerHand);
  if (pScore > 21) {
    bjState.phase = 'done';
    bjState.statusText = tr(`💥 Überkauft (${pScore})! Einsatz von ${bjState.bet} 🪙 verloren.`, `💥 Bust (${pScore})! Lost ${bjState.bet} 🪙.`, `💥 ¡Te pasaste (${pScore})!`, `💥 Trop (${pScore})!`);
  } else if (pScore === 21) {
    standBlackjack(); return;
  } else {
    bjState.statusText = tr(`Deine Hand zählt ${pScore} Punkte.`, `Your hand totals ${pScore}.`, `Tu mano suma ${pScore}.`, `Votre main vaut ${pScore}.`);
  }
  renderBlackjackModal();
};

window.standBlackjack = function() {
  if (bjState.phase !== 'playing') return;
  clearBlackjackTimer();
  bjState.phase = 'dealer_turn';
  renderBlackjackModal();

  function dealerStep() {
    const ov = document.getElementById('blackjackOverlay');
    if (!ov || !ov.classList.contains('active') || bjState.phase !== 'dealer_turn') { bjState.dealerTimer = null; return; }

    if (calcBlackjackScore(bjState.dealerHand) < 17) {
      SoundFX.play('card');
      bjState.dealerHand.push(bjState.deck.pop());
      renderBlackjackModal();
      bjState.dealerTimer = setTimeout(dealerStep, 460);
    } else {
      bjState.dealerTimer = null;
      const pScore = calcBlackjackScore(bjState.playerHand);
      const dScore = calcBlackjackScore(bjState.dealerHand);
      bjState.phase = 'done';

      if (dScore > 21 || pScore > dScore) {
        const isNatural = pScore === 21 && bjState.playerHand.length === 2;
        const win = isNatural ? Math.round(bjState.bet * 2.5) : bjState.bet * 2;
        game.gold += win;
        SoundFX.play('coin');
        bjState.statusText = `🏆 ${isNatural ? 'BLACKJACK!' : '+' + win + ' 🪙'} (${pScore} : ${dScore})!`;
      } else if (pScore === dScore) {
        game.gold += bjState.bet;
        bjState.statusText = `⚖️ ${pScore} : ${dScore} (+${bjState.bet} 🪙)`;
      } else {
        bjState.statusText = `❌ ${pScore} : ${dScore}`;
      }
      updateHUD();
      renderBlackjackModal();
      if (window.renderPortModal && document.getElementById('portOverlay').classList.contains('active')) renderPortModal();
    }
  }
  bjState.dealerTimer = setTimeout(dealerStep, 400);
};

function renderPlayingCardHTML(card, hidden = false, delayIdx = 0) {
  if (hidden) return `<div class="bj-card hidden-card" style="animation-delay:${delayIdx * 0.08}s;"><div style="font-size:26px;">🏴‍☠️</div></div>`;
  return `
    <div class="bj-card" style="color:${card.color}; animation-delay:${delayIdx * 0.08}s;">
      <div style="font-size:13px; font-weight:bold; align-self:flex-start;">${card.rank}${card.suit}</div>
      <div style="font-size:26px; margin:auto;">${card.suit}</div>
      <div style="font-size:13px; font-weight:bold; align-self:flex-end; transform:rotate(180deg);">${card.rank}${card.suit}</div>
    </div>
  `;
}

window.renderBlackjackModal = function() {
  const body = document.getElementById('blackjackBody');
  if (!body) return;
  const leaveEl = document.getElementById('bjLeaveBtn');
  if (leaveEl) leaveEl.disabled = (bjState.phase === 'dealer_turn');

  const pScore = calcBlackjackScore(bjState.playerHand);
  const dScore = bjState.phase === 'playing' ? (bjState.dealerHand[0] ? bjState.dealerHand[0].val : 0) : calcBlackjackScore(bjState.dealerHand);

  body.innerHTML = `
    <div style="background:radial-gradient(circle at center, #14532d, #052e16); border:3px solid #d4af37; border-radius:12px; padding:20px; text-align:center; box-shadow:inset 0 0 40px rgba(0,0,0,0.75);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; font-size:14px;">
        <span>🪙 <strong style="color:#ffd700;">${game ? game.gold : 0}</strong></span>
        <span style="color:#fde047; font-weight:bold;">${tr('Einsatz:','Wager:','Apuesta:','Mise:')} ${bjState.bet} 🪙</span>
      </div>

      <div style="margin-bottom:18px;">
        <div style="display:flex; justify-content:center; align-items:center; gap:8px; color:#cbd5e1; font-size:13px; font-weight:bold; margin-bottom:8px;">
          ${renderPortraitBox('taverne:2', 48, '#d4af37', false)}
          <span>${tr('Croupier','Dealer','Crupier','Croupier')} (${bjState.dealerHand.length ? dScore : '—'})</span>
        </div>
        <div style="display:flex; justify-content:center; gap:10px; min-height:110px; align-items:center;">
          ${bjState.dealerHand.map((c, idx) => renderPlayingCardHTML(c, bjState.phase === 'playing' && idx === 1, idx)).join('')}
        </div>
      </div>

      <div style="margin:14px auto; padding:10px 16px; background:rgba(0,0,0,0.55); border:1px solid #d4af37; border-radius:8px; color:#fde047; font-weight:bold; font-size:14px;">
        ${bjState.statusText}
      </div>

      <div style="margin-top:16px;">
        <div style="color:#2ecc71; font-size:13px; font-weight:bold; margin-bottom:8px;">🏴‍☠️ ${tr('Deine Hand','Your Hand','Tu Mano','Votre Main')} (${bjState.playerHand.length ? pScore : '—'})</div>
        <div style="display:flex; justify-content:center; gap:10px; min-height:110px; align-items:center;">
          ${bjState.playerHand.map((c, idx) => renderPlayingCardHTML(c, false, idx)).join('')}
        </div>
      </div>

      <div style="display:flex; justify-content:center; gap:10px; margin-top:20px; flex-wrap:wrap;">
        ${bjState.phase === 'playing' ? `
          <button class="primary-btn" onclick="hitBlackjack()">🃏 Hit</button>
          <button class="action-btn" style="padding:10px 22px; font-size:14px;" onclick="standBlackjack()">✋ Stand</button>
        ` : (bjState.phase === 'dealer_turn' ? `<div style="color:#fde047; font-weight:bold;">...</div>` : `
          ${bjState.phase === 'done' ? `<button class="primary-btn" style="border-color:#fde047; background:#b45309; width:100%; margin-bottom:6px;" ${!game || game.gold < bjState.bet ? 'disabled' : ''} onclick="startBlackjackRound(${bjState.bet})">🔄 (${bjState.bet} 🪙)</button>` : ''}
          <button class="primary-btn" ${!game || game.gold < 50 ? 'disabled' : ''} onclick="startBlackjackRound(50)">🪙 50</button>
          <button class="primary-btn" ${!game || game.gold < 150 ? 'disabled' : ''} onclick="startBlackjackRound(150)">🪙 150</button>
          <button class="primary-btn" ${!game || game.gold < 400 ? 'disabled' : ''} onclick="startBlackjackRound(400)">🪙 400</button>
        `)}
      </div>
    </div>
  `;
};

// ============================================================================
// WÜRFELSPIEL ZILCH (Mit 4:3-Quartiermeister-Porträt)
// ============================================================================
window.zilchState = {
  phase: 'idle', bet: 60, targetScore: 2500, playerBank: 0, aiBank: 0, turnAccum: 0, aiLastRollSummary: '',
  dice: [
    { val: 1, locked: false, selected: false }, { val: 5, locked: false, selected: false },
    { val: 2, locked: false, selected: false }, { val: 3, locked: false, selected: false },
    { val: 4, locked: false, selected: false }, { val: 6, locked: false, selected: false }
  ],
  statusText: ''
};

window.evaluateZilchSelection = function(vals) {
  if (!vals || vals.length === 0) return { score: 0, valid: false, desc: '' };
  const counts = [0, 0, 0, 0, 0, 0, 0];
  vals.forEach(v => counts[v]++);

  if (vals.length === 6) {
    if (counts.slice(1).every(c => c === 1)) return { score: 1500, valid: true, desc: '1-6 (1500)' };
    const pairs = counts.slice(1).filter(c => c === 2).length;
    const quadsAndPair = counts.slice(1).some(c => c === 4) && counts.slice(1).some(c => c === 2);
    if (pairs === 3 || quadsAndPair) return { score: 1000, valid: true, desc: '3×2 (1000)' };
  }

  let score = 0, usedDice = 0;
  const parts = [];
  for (let face = 1; face <= 6; face++) {
    const c = counts[face];
    if (c >= 3) {
      const pts = (face === 1 ? 1000 : face * 100) * Math.pow(2, c - 3);
      score += pts; usedDice += c; parts.push(`${c}×[${face}] (${pts})`);
    } else if (c > 0 && (face === 1 || face === 5)) {
      const pts = c * (face === 1 ? 100 : 50);
      score += pts; usedDice += c; parts.push(`${c}×[${face}] (${pts})`);
    }
  }
  return { score, valid: score > 0 && usedDice === vals.length, maxPossibleScore: score, desc: parts.join(' + ') };
};

function hasAnyZilchScoringRoll(freeVals) {
  if (!freeVals || freeVals.length === 0) return false;
  if (freeVals.includes(1) || freeVals.includes(5)) return true;
  const counts = [0, 0, 0, 0, 0, 0, 0];
  freeVals.forEach(v => counts[v]++);
  if (counts.some(c => c >= 3)) return true;
  if (freeVals.length === 6) {
    if (counts.slice(1).every(c => c === 1)) return true;
    if (counts.slice(1).filter(c => c === 2).length === 3) return true;
  }
  return false;
}

window.openZilchModal = function() {
  const ov = document.getElementById('zilchOverlay');
  if (ov) {
    if (!zilchState.statusText || zilchState.phase === 'idle') {
      zilchState.statusText = tr('1 = 100 | 5 = 50 | Drilling = Auge×100 (1er = 1000) | Straße = 1500.', '1 = 100 | 5 = 50 | Triples = Face×100 (1s = 1000) | Straight = 1500.', '1 = 100 | 5 = 50 | Trío = Cara×100 | Escalera = 1500.', '1 = 100 | 5 = 50 | Brelan = Face×100 | Suite = 1500.');
    }
    ov.classList.add('active');
    renderZilchModal();
  }
};

window.closeZilchModal = function() {
  const ov = document.getElementById('zilchOverlay');
  if (ov) ov.classList.remove('active');
  if (window.renderPortModal && document.getElementById('portOverlay').classList.contains('active')) renderPortModal();
};

window.startZilchMatch = function(bet) {
  if (!window.game || game.gold < bet) return;
  game.gold -= bet;
  zilchState.bet = bet;
  zilchState.playerBank = 0; zilchState.aiBank = 0; zilchState.turnAccum = 0; zilchState.aiLastRollSummary = '';
  zilchState.dice.forEach(d => { d.locked = false; d.selected = false; });
  updateHUD();
  rollZilchDice(true);
};

window.rollZilchDice = function(isFirstRollOfTurn = false) {
  if (!isFirstRollOfTurn) {
    const selVals = zilchState.dice.filter(d => !d.locked && d.selected).map(d => d.val);
    const evalRes = evaluateZilchSelection(selVals);
    if (!evalRes.valid) return;
    zilchState.turnAccum += evalRes.score;
    zilchState.dice.forEach(d => { if (d.selected) { d.locked = true; d.selected = false; } });
    if (zilchState.dice.every(d => d.locked)) zilchState.dice.forEach(d => { d.locked = false; d.selected = false; });
  } else {
    zilchState.turnAccum = 0;
    zilchState.dice.forEach(d => { d.locked = false; d.selected = false; });
  }

  SoundFX.play('dice');
  const freeVals = [];
  zilchState.dice.forEach(d => {
    if (!d.locked) { d.val = 1 + Math.floor(Math.random() * 6); d.selected = false; freeVals.push(d.val); }
  });

  if (!hasAnyZilchScoringRoll(freeVals)) {
    zilchState.turnAccum = 0;
    zilchState.phase = 'player_zilch_pause';
    zilchState.statusText = `💀 ZILCH! (${freeVals.join(', ')})`;
    renderZilchModal();
    return;
  }

  zilchState.phase = 'rolled';
  zilchState.statusText = tr('Wähle mindestens einen punktenden Würfel aus.', 'Click at least one scoring die.', 'Selecciona al menos un dado con puntos.', 'Sélectionnez au moins un dé gagnant.');
  renderZilchModal();
};

window.toggleZilchDieSelect = function(idx) {
  if (zilchState.phase !== 'rolled') return;
  const d = zilchState.dice[idx];
  if (!d || d.locked) return;
  SoundFX.play('dice');
  d.selected = !d.selected;
  renderZilchModal();
};

window.bankZilchPoints = function() {
  if (zilchState.phase !== 'rolled') return;
  const selVals = zilchState.dice.filter(d => !d.locked && d.selected).map(d => d.val);
  const evalRes = evaluateZilchSelection(selVals);
  if (!evalRes.valid) return;

  const totalTurnPts = zilchState.turnAccum + evalRes.score;
  if (totalTurnPts < 300) return;

  zilchState.playerBank += totalTurnPts;
  zilchState.turnAccum = 0;

  if (zilchState.playerBank >= zilchState.targetScore) {
    const win = zilchState.bet * 2;
    game.gold += win;
    SoundFX.play('coin');
    zilchState.phase = 'done';
    zilchState.statusText = `🏆 +${win} 🪙 (${zilchState.playerBank} : ${zilchState.aiBank})!`;
    updateHUD();
    renderZilchModal();
    if (window.renderPortModal && document.getElementById('portOverlay').classList.contains('active')) renderPortModal();
    return;
  }
  executeZilchAiTurn(totalTurnPts);
};

window.executeZilchAiTurn = function(playerJustBanked = 0) {
  SoundFX.play('dice');
  let aiRound = 0, diceLeft = 6;
  const rollLog = [];
  let lastRolls = [1, 2, 3, 4, 5, 6];

  for (let step = 0; step < 3; step++) {
    const rolls = [];
    for (let i = 0; i < diceLeft; i++) rolls.push(1 + Math.floor(Math.random() * 6));
    lastRolls = rolls;

    if (!hasAnyZilchScoringRoll(rolls)) { aiRound = 0; rollLog.push(`[${rolls.join(',')}]→ZILCH`); break; }
    const counts = [0, 0, 0, 0, 0, 0, 0];
    rolls.forEach(v => counts[v]++);
    let gained = 0, used = 0;
    if (diceLeft === 6 && counts.slice(1).every(c => c === 1)) { gained = 1500; used = 6; }
    else {
      for (let f = 1; f <= 6; f++) {
        if (counts[f] >= 3) { gained += (f === 1 ? 1000 : f * 100) * Math.pow(2, counts[f] - 3); used += counts[f]; }
        else if (counts[f] > 0 && (f === 1 || f === 5)) { gained += counts[f] * (f === 1 ? 100 : 50); used += counts[f]; }
      }
    }
    aiRound += gained; diceLeft -= used;
    if (diceLeft <= 0) diceLeft = 6;
    rollLog.push(`+${gained}`);
    if (aiRound >= 450 || diceLeft <= 2) break;
  }

  for (let i = 0; i < 6; i++) {
    zilchState.dice[i].val = lastRolls[i % lastRolls.length] || 1;
    zilchState.dice[i].locked = false;
    zilchState.dice[i].selected = (zilchState.dice[i].val === 1 || zilchState.dice[i].val === 5);
  }

  zilchState.aiBank += aiRound;
  zilchState.aiLastRollSummary = rollLog.join(' | ');

  if (zilchState.aiBank >= zilchState.targetScore) {
    zilchState.phase = 'done';
    zilchState.statusText = `❌ ${zilchState.aiBank} (${zilchState.aiLastRollSummary})`;
    renderZilchModal();
    return;
  }

  zilchState.phase = 'ai_summary';
  zilchState.statusText = `${playerJustBanked > 0 ? `+${playerJustBanked} ✓ | ` : ''}⚓ ${zilchState.aiLastRollSummary} ➔ +${aiRound}`;
  renderZilchModal();
};

window.renderZilchModal = function() {
  const body = document.getElementById('zilchBody');
  if (!body) return;
  const selVals = zilchState.dice.filter(d => !d.locked && d.selected).map(d => d.val);
  const evalRes = evaluateZilchSelection(selVals);
  const potentialTotal = zilchState.turnAccum + (evalRes.valid ? evalRes.score : 0);
  const dieFaces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  body.innerHTML = `
    <div class="card-box" style="background:#0c141d; border:2px solid #d4af37; padding:18px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <div>🏴‍☠️ <span style="color:#2ecc71; font-size:18px; font-weight:bold;">${zilchState.playerBank} / ${zilchState.targetScore}</span></div>
        <div>🪙 <span style="color:#ffd700; font-weight:bold;">${zilchState.bet * 2} 🪙</span></div>
        <div style="display:flex; align-items:center; gap:8px;">
          ${renderPortraitBox('taverne:10', 48, '#d4af37', false)}
          <span style="color:#ef4444; font-size:18px; font-weight:bold;">${zilchState.aiBank} / ${zilchState.targetScore}</span>
        </div>
      </div>

      <div style="padding:10px; background:#070d14; border:1px solid #5a4628; border-radius:6px; color:#fde047; font-size:13px; margin-bottom:14px; text-align:center;">
        ${zilchState.statusText}
      </div>

      <div style="display:flex; justify-content:center; gap:12px; margin:16px 0; flex-wrap:wrap;">
        ${zilchState.dice.map((d, idx) => `
          <div onclick="toggleZilchDieSelect(${idx})" style="width:64px; height:64px; border-radius:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:${d.locked || zilchState.phase !== 'rolled' ? 'default' : 'pointer'}; background:${d.locked ? '#1e293b' : (d.selected ? '#2c2112' : '#0f172a')}; border:2.5px solid ${d.locked ? '#475569' : (d.selected ? '#ffd700' : '#6e512d')}; opacity:${d.locked ? '0.5' : '1'};">
            <div style="font-size:32px; line-height:1; color:${d.selected ? '#ffd700' : '#f8fafc'};">${dieFaces[d.val]}</div>
            <div style="font-size:9.5px; color:#94a3b8; margin-top:2px;">${zilchState.phase === 'ai_summary' ? 'AI' : (d.locked ? '🔒' : (d.selected ? '✓' : '•'))}</div>
          </div>
        `).join('')}
      </div>

      <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
        ${zilchState.phase === 'rolled' ? `
          <button class="primary-btn" ${!evalRes.valid ? 'disabled' : ''} onclick="rollZilchDice(false)">🎲 ${tr('Weiterwürfeln','Roll Again','Seguir','Relancer')}</button>
          <button class="action-btn" style="padding:10px 20px; font-size:13.5px;" ${!evalRes.valid || potentialTotal < 300 ? 'disabled' : ''} onclick="bankZilchPoints()">
            <span>🏦 ${potentialTotal} (Min. 300)</span>
          </button>
        ` : (zilchState.phase === 'player_zilch_pause' ? `
          <button class="primary-btn" style="background:#b45309; border-color:#fde047;" onclick="executeZilchAiTurn(0)">⚓ ${tr('Becher übergeben','Pass Cup','Pasar','Passer')}</button>
        ` : (zilchState.phase === 'ai_summary' ? `
          <button class="primary-btn" onclick="rollZilchDice(true)">🎲 ${tr('Dein Wurf!','Your Roll!','¡Tu Turno!','À vous!')}</button>
        ` : `
          <button class="primary-btn" ${!game || game.gold < 40 ? 'disabled' : ''} onclick="startZilchMatch(40)">🎲 40 🪙</button>
          <button class="primary-btn" ${!game || game.gold < 120 ? 'disabled' : ''} onclick="startZilchMatch(120)">🎲 120 🪙</button>
          <button class="primary-btn" ${!game || game.gold < 300 ? 'disabled' : ''} onclick="startZilchMatch(300)">🎲 300 🪙</button>
        `))}
      </div>
    </div>
  `;
};