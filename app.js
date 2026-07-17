/* =========================================================
   PoW Coach v2 — Faucet Edition ⚡ (Silexperience)
   ========================================================= */
/* MediaPipe est chargé en IMPORT DYNAMIQUE (loadModel) : si le CDN est bloqué
   (DNS filtrant, Brave, réseau d'entreprise), seule la caméra est indisponible —
   avant, l'import statique faisait échouer tout le module → écran blanc total. */
let MP=null; // { PoseLandmarker, FilesetResolver, DrawingUtils } une fois chargé

const CFG = window.POW_CONFIG;

/* ---------- i18n ---------- */
const I18N = {
fr:{ sub:"Proof of Workout — ta sueur vaut des sats. La caméra analyse tes gestes en direct.",
  sports:"Disciplines", goals:"Objectifs de la semaine", perfectL:"sat / geste parfait", comboL:"combos boostés", goalL:"sats / objectif",
  reps:"reps", sec:"sec", hits:"coups", week:"cette semaine", form:"FORME", stop:"■ Terminer", cam:"⟳ Caméra",
  langTitle:"🌐 Langue du coach", later:"Plus tard", createW:"Créer le retrait", creating:"Création…",
  pcTitle:"⚡ Réclamer tes sats", pcText:(n)=>`Solde gagné : <b style="color:var(--acc2)">${n} sats</b>. Choisis comment recevoir :`,
  claimSub:"Scanne avec n'importe quel wallet Lightning", copy:"Copier LNURL", close:"Fermer", copied:"LNURL copié ✔", copyFail:"Copie impossible", credited:"validés", loginToEarn:"⚡ Connecte-toi (bouton 👤) pour gagner des sats",
  account:"👤 Mon compte", accOutText:"Connecte-toi avec ton wallet Lightning (LNURL-auth) pour sauvegarder ta progression et retirer tes sats sur plusieurs appareils. Aucun email, aucun mot de passe — juste ta signature.", accLogin:"Se connecter", accLoggedTitle:"👤 Mon compte", accLnaddrLabel:"Adresse Lightning (pour recevoir)", accLogout:"Déconnexion", accSave:"Enregistrer", saved:"Enregistré ✔", loginTitle:"⚡ Connexion Lightning", loginSub:"Scanne avec ton wallet compatible LNURL-auth (Phoenix, Zeus, Breez…)", loginWaiting:"En attente de la signature du wallet…", loginOpen:"📲 Ouvrir dans mon wallet", loginOk:"Connecté ✔", loginExpired:"Challenge expiré, réessaie", loginCancel:"Annuler", cancel:"Annuler", close:"Fermer", mLnaddr:"⚡ Adresse Lightning", mLnurl:"📷 QR / LNURL", lnaddrLabel:"Ton adresse Lightning", lnaddrHint:"Paiement automatique et instantané vers cette adresse (ex : nom@walletofsatoshi.com).", lnurlNote:"Un bon de retrait LNURL sera généré : scanne le QR avec n'importe quel wallet.", payDo:"Recevoir", paidOk:(n)=>`⚡ ${n} sats envoyés !`, paidSub:"Vérifie ton wallet Lightning", authRequired:"Connecte-toi d'abord pour retirer", noLnaddr:"Entre ton adresse Lightning",
  tabTrain:"🏋️ Entraîner", tabStats:"📊 Stats", tabBoard:"🏆 Classement", tabChallenge:"🎯 Défis",
  statReps:"reps au total", statStreak:"jours de suite", statSats:"sats gagnés", statPerfect:"parfaits",
  week7:"7 derniers jours", byDisc:"Par discipline", noStats:"Entraîne-toi pour voir tes stats apparaître 💪",
  boardIntro:"Classement mondial par reps totales, via Nostr. Publie ton score pour y figurer.",
  boardRefresh:"↻ Rafraîchir", boardLoading:"Chargement du classement…", boardEmpty:"Sois le premier à publier ton score ⚡",
  publish:"📡 Publier mon score", publishing:"Publication…", published:(n)=>`Publié sur ${n} relays ✔`, pubFail:"Aucun relay n'a répondu",
  askNick:"Ton pseudo pour le classement :",
  newChallenge:"Nouveau défi", chalEx:"Exercice", chalTarget:"Objectif (reps)", chalCreate:"Créer le défi", chalAny:"🔥 Toutes disciplines",
  noChallenge:"Aucun défi en cours. Crée-en un et partage-le !", chalCreated:"Défi créé 🎯", chalShare:"Partager", chalImported:"Défi importé 🎯",
  chalShareText:(t,e)=>`Je te défie : ${t} ${e} cette semaine sur PoW Coach ⚡`,
  chalImgTitle:"DÉFI DE LA SEMAINE", chalImgSub:"Relève-le sur PoW Coach ⚡",
  noSats:"Aucun sat à réclamer — au boulot ! 💪", minClaim:(n)=>`Minimum ${n} sats pour réclamer`, notCfg:"⚠ Faucet non configuré par le propriétaire",
  capHit:"Plafond journalier atteint — reviens demain ⚡", capLock:(t)=>`Plafond de sats atteint 🔒 reviens dans ${t}`,
  introTitle:"⚡ Bienvenue sur PoW Coach", introBody:"Bouge ton corps, gagne des sats. La caméra compte tes répétitions et te récompense en vrais bitcoins ⚡. Connecte un wallet Lightning (bouton 👤) pour gagner et retirer. Gratuit, sans pub, sans inscription.", introGo:"C'est parti 💪",
  faucetDry:"⚡ Faucet momentanément à sec — reviens bientôt 🙏", faucetLow:"⚡ Faucet bientôt vide",
  diffLabel:"Difficulté", diffEasy:"Facile", diffNormal:"Normal", diffHard:"Difficile",
  restBtn:"Minuteur de repos", restTitle:"Repos", restSkip:"Terminer", restDone:"Repos terminé — go ! 💪",
  guidedL:"Guidée", freeL:"Libre", guidedTag:"Séance",
  setsFmt:(c,s,r,t)=>`SÉRIE ${c}/${s} · ${r}/${t}`,
  wsTitle:"🏁 Récap séance", wsPerfectL:"parfaits", wsForm:"forme moy", wsCombo:"combo max", wsDur:"minutes",
  wsFaults:"À corriger", wsNoFaults:"Aucune faute détectée 💪", wsNext:(n)=>`🎯 Prochain objectif : ${n} par série`,
  faultL:{valgus:"Genoux qui rentrent",shallow:"Amplitude trop courte",rushed:"Reps trop rapides",partial:"Amplitude incomplète",high:"Poing trop haut",low:"Poing trop bas",fatigue:"Perte de vitesse (fatigue)"},
  aiTitle:"🧠 Analyse du coach", aiLoading:"Le coach analyse ta séance…", aiLogin:"Connecte-toi (👤) pour l'analyse IA de tes séances",
  planBtn:"🧠 Plan de la semaine", planTitle:"🧠 Ton plan de la semaine", planLoading:"Le coach prépare ton plan…",
  personaL:"Style du coach", personaCoach:"Coach", personaDrill:"Sergent", personaZen:"Zen", personaNerd:"Nerd",
  sessBtn:"⚡ Générer une séance", sessLoading:"Le coach programme ta séance…", sessLaunch:"▶ Lancer cette séance", sessRest:"repos", sessAgain:"↻ Une autre",
  progStep:(i,n)=>`Étape ${i}/${n}`, progNext:(e)=>`Suivant : ${e}`, progDone:"Programme terminé — bravo 🔥", progRest:(s)=>`Repos ${s}s puis exercice suivant`,
  postureBtn:"📸 Posture IA", postureTitle:"📸 Analyse de posture", postureLoading:"Le coach regarde ta posture…", posturePrivacy:"🔒 Visage flouté sur l'appareil — jamais envoyé", postureStart:"Démarre la séance pour analyser ta posture",
  ghostBeat:"Fantôme battu ! Record personnel !", ghostL:(g,m)=>`👻 ${g} · toi ${m}`,
  wsVel:(d)=>`📉 Vitesse −${d}% en fin de série (fatigue)`,
  statClaims:"Derniers retraits", claimsEmpty:"Aucun retrait pour l'instant", claimQr:"QR",
  statTransp:"Transparence du faucet", transpEmpty:"Indisponible", transpToday:(a,b)=>`Distribué aujourd'hui : ${a}${b?(' / '+b):''} sats`,
  zapTip:"Zap cet athlète ⚡",
  installIOS:"📲 Appuie sur Partager puis « Sur l'écran d'accueil »", installAndroid:"📲 Menu ⋮ du navigateur → « Installer l'application »",
  err:"❌ ", errWithdraw:"LNbits inaccessible — extension Withdraw activée ?",
  loading:"⚡ Chargement du modèle IA…", alignPose:"Prends la position (imite la silhouette)", alignHold:"Ne bouge plus…", camOn:"📷 Activation caméra…", camFail:"⚠ Caméra inaccessible.\nAutorise la caméra (HTTPS requis).",
  goalDone:(n)=>`✔ +${n} sats`, sessionSats:(n)=>`+${n} sats cette session`,
  combo:"COMBO", comboBroken:"COMBO PERDU",
  coach:{ frame:"Place-toi entièrement dans le cadre", lost:"Personne détectée — recule un peu",
    squat_down:"Descends, dos droit", squat_deeper:"Descends encore un peu", squat_depth:"Profondeur parfaite 💪",
    push_line:"Gaine ! Corps bien aligné", push_up:"Pousse fort !", push_down:"Descends poitrine au sol",
    lunge_up:"Genou à 90°, remonte", lunge_step:"Grand pas en avant",
    plank_hold:"Alignement parfait, tiens bon 🔥", plank_fix:"Serre les abdos, hanches alignées", plank_bad:"Hanches trop hautes ou trop basses",
    warrior_hold:"Posture de guerrier 🙏", warrior_fix:"Bras à l'horizontale, genou avant fléchi", warrior_bad:"Fléchis le genou avant, tends les bras",
    tree_hold:"Racines solides 🌳", tree_fix:"Monte le pied, hanches de niveau", tree_bad:"Lève un pied contre la jambe opposée",
    bridge_up:"Monte les hanches, serre les fessiers", bridge_down:"Redescends lentement",
    jacks:"Bras au ciel, jambes écartées, rythme !", jsq_up:"Explose vers le haut ! 🚀", jsq_down:"Descends et saute",
    punch_full:"Extension complète 🔥", punch_ext:"Allonge davantage le bras", punch_guard:"Garde haute, frappe sec et ramène", punch_high:"Poing trop haut — épaule, coude et poing à l'horizontale", punch_low:"Poing trop bas — remonte à hauteur d'épaule",
    knee_hit:"Genou puissant ! Hanche engagée", knee_up:"Monte le genou au-dessus de la hanche",
    burpee_down:"Descends en planche", burpee_back:"Remonte vite, dos droit", burpee_up:"Explose ! 🤢",
    situp_down:"Redescends contrôlé", situp_up:"Monte le buste, expire",
    climber_go:"Genoux à la poitrine, rythme !", climber_hit:"Bien ! Hanches stables",
    torso:"Buste et bras visibles face caméra",
    valgus:"Pousse les genoux vers l'extérieur !", rushed:"Plus lent — contrôle la descente", partial:"Amplitude complète !",
    fatigue:"Fatigue détectée — reps propres ou stop !" },
  voice:{ start:"C'est parti !", getReady:"Prépare-toi", perfect:"Parfait !", combo:(n)=>`Combo ${n} !`, comboBroken:"Combo perdu", tooHigh:"Trop haut", tooLow:"Trop bas",
    goal:"Objectif de la semaine atteint ! Félicitations !", milestone:(n,u)=>`${n} ${u==='sec'?'secondes':u==='coups'?'coups':'répétitions'}`, cap:"Plafond du jour atteint",
    setDone:(n)=>`Série ${n} terminée ! Repos.`, setGo:(n)=>`Série ${n}, c'est parti !`, allDone:"Séance terminée, bravo !",
    fatigue:"Attention, tu perds de la vitesse. Reps propres ou arrête.", ghostBeat:"Fantôme battu ! Record personnel !" },
  run:{ title:"Course & Marche", start:"Démarrer", stop:"Terminer", ready:"Prêt à partir", paused:"En pause", running:"Course", walking:"Marche",
    durL:"durée", paceL:"allure /km", gpsWait:"📡 Recherche GPS…", gpsReady:"GPS prêt ✓", gpsOk:"GPS ✓", gpsWeak:"⚠ Signal GPS faible", gpsDenied:"⚠ Autorise la localisation", noGeo:"GPS non disponible sur cet appareil",
    hrConnect:"Connecter cardio", hrUnsupported:"Bluetooth non supporté (Android Chrome requis)", hrOk:"Cardio connecté ❤️", hrFail:"Cardio non connecté",
    voiceKm:(n)=>`${n} kilomètre${n>1?'s':''} !`, voiceDone:(km)=>`Séance terminée. ${km} kilomètres. Bravo !`,
    gpxFail:"Fichier GPX illisible", gpxEmpty:"Aucun point GPS dans ce fichier", gpxBusy:"Termine la séance en cours d'abord", gpxOk:(km)=>`📁 Trace importée : ${km} km (visualisation, sans sats)`,
    cfgTitle:"⚙ Profil sportif", weightL:"Poids (kg)", ageL:"Âge", summaryTitle:"🏁 Séance terminée", movingTime:"temps mobile", avgPace:"allure moy", bestKm:"meilleur km", calories:"calories", hr:"FC moy/max", splits:"Allure par km", share:"Partager", runsTitle:"🏃 Mes courses", runsEmpty:"Aucune course encore — lace tes baskets ! 👟", kmGoal:"Objectif km de la semaine !",
    publishRun:"Publier sur Nostr", privacyNote:"🔒 Tracé anonymisé : forme seule, sans lieu ni carte (départ/arrivée masqués)", runboardTitle:"🗺️ Tracés récents (Nostr)", runboardEmpty:"Aucun tracé publié — sois le premier ⚡", relayL:"Relais Nostr perso (optionnel)", relayHint:"Ajouté aux relais par défaut (ex : relais 21pay). wss:// requis." } },
en:{ sub:"Proof of Workout — your sweat earns sats. The camera analyzes your form live.",
  sports:"Disciplines", goals:"This week's goals", perfectL:"sat / perfect rep", comboL:"boosted combos", goalL:"sats / goal",
  reps:"reps", sec:"sec", hits:"hits", week:"this week", form:"FORM", stop:"■ Finish", cam:"⟳ Camera",
  langTitle:"🌐 Coach language", later:"Later", createW:"Create withdrawal", creating:"Creating…",
  pcTitle:"⚡ Claim your sats", pcText:(n)=>`Earned balance: <b style="color:var(--acc2)">${n} sats</b>. Choose how to receive:`,
  claimSub:"Scan with any Lightning wallet", copy:"Copy LNURL", close:"Close", copied:"LNURL copied ✔", copyFail:"Copy failed", credited:"credited", loginToEarn:"⚡ Sign in (👤 button) to earn sats",
  account:"👤 My account", accOutText:"Sign in with your Lightning wallet (LNURL-auth) to save your progress and withdraw across devices. No email, no password — just your signature.", accLogin:"Sign in", accLoggedTitle:"👤 My account", accLnaddrLabel:"Lightning Address (to receive)", accLogout:"Log out", accSave:"Save", saved:"Saved ✔", loginTitle:"⚡ Lightning login", loginSub:"Scan with your LNURL-auth wallet (Phoenix, Zeus, Breez…)", loginWaiting:"Waiting for wallet signature…", loginOpen:"📲 Open in my wallet", loginOk:"Connected ✔", loginExpired:"Challenge expired, try again", loginCancel:"Cancel", cancel:"Cancel", close:"Close", mLnaddr:"⚡ Lightning Address", mLnurl:"📷 QR / LNURL", lnaddrLabel:"Your Lightning Address", lnaddrHint:"Automatic instant payment to this address (e.g. name@walletofsatoshi.com).", lnurlNote:"An LNURL withdrawal voucher will be generated: scan the QR with any wallet.", payDo:"Receive", paidOk:(n)=>`⚡ ${n} sats sent!`, paidSub:"Check your Lightning wallet", authRequired:"Sign in first to withdraw", noLnaddr:"Enter your Lightning Address",
  tabTrain:"🏋️ Train", tabStats:"📊 Stats", tabBoard:"🏆 Ranking", tabChallenge:"🎯 Challenges",
  statReps:"total reps", statStreak:"day streak", statSats:"sats earned", statPerfect:"perfect",
  week7:"Last 7 days", byDisc:"By discipline", noStats:"Train to see your stats appear 💪",
  boardIntro:"Global ranking by total reps, via Nostr. Publish your score to appear.",
  boardRefresh:"↻ Refresh", boardLoading:"Loading ranking…", boardEmpty:"Be the first to publish your score ⚡",
  publish:"📡 Publish my score", publishing:"Publishing…", published:(n)=>`Published to ${n} relays ✔`, pubFail:"No relay responded",
  askNick:"Your nickname for the ranking:",
  newChallenge:"New challenge", chalEx:"Exercise", chalTarget:"Target (reps)", chalCreate:"Create challenge", chalAny:"🔥 All disciplines",
  noChallenge:"No active challenge. Create one and share it!", chalCreated:"Challenge created 🎯", chalShare:"Share", chalImported:"Challenge imported 🎯",
  chalShareText:(t,e)=>`I challenge you: ${t} ${e} this week on PoW Coach ⚡`,
  chalImgTitle:"CHALLENGE OF THE WEEK", chalImgSub:"Take it on PoW Coach ⚡",
  noSats:"No sats to claim — get to work! 💪", minClaim:(n)=>`Minimum ${n} sats to claim`, notCfg:"⚠ Faucet not configured by owner",
  capHit:"Daily cap reached — come back tomorrow ⚡", capLock:(t)=>`Sats cap reached 🔒 come back in ${t}`,
  introTitle:"⚡ Welcome to PoW Coach", introBody:"Move your body, earn sats. The camera counts your reps and rewards you in real Bitcoin ⚡. Connect a Lightning wallet (👤 button) to earn and withdraw. Free, no ads, no signup.", introGo:"Let's go 💪",
  faucetDry:"⚡ Faucet temporarily dry — come back soon 🙏", faucetLow:"⚡ Faucet running low",
  diffLabel:"Difficulty", diffEasy:"Easy", diffNormal:"Normal", diffHard:"Hard",
  restBtn:"Rest timer", restTitle:"Rest", restSkip:"Done", restDone:"Rest over — go! 💪",
  guidedL:"Guided", freeL:"Free", guidedTag:"Session",
  setsFmt:(c,s,r,t)=>`SET ${c}/${s} · ${r}/${t}`,
  wsTitle:"🏁 Session recap", wsPerfectL:"perfect", wsForm:"avg form", wsCombo:"max combo", wsDur:"minutes",
  wsFaults:"To fix", wsNoFaults:"No faults detected 💪", wsNext:(n)=>`🎯 Next target: ${n} per set`,
  faultL:{valgus:"Knees caving in",shallow:"Range too shallow",rushed:"Rushed reps",partial:"Partial range",high:"Fist too high",low:"Fist too low",fatigue:"Velocity loss (fatigue)"},
  aiTitle:"🧠 Coach analysis", aiLoading:"Coach is reviewing your session…", aiLogin:"Sign in (👤) to get AI analysis of your sessions",
  planBtn:"🧠 Weekly plan", planTitle:"🧠 Your weekly plan", planLoading:"Coach is building your plan…",
  personaL:"Coach style", personaCoach:"Coach", personaDrill:"Sergeant", personaZen:"Zen", personaNerd:"Nerd",
  sessBtn:"⚡ Generate a workout", sessLoading:"Coach is programming your session…", sessLaunch:"▶ Start this workout", sessRest:"rest", sessAgain:"↻ Another one",
  progStep:(i,n)=>`Step ${i}/${n}`, progNext:(e)=>`Next: ${e}`, progDone:"Program complete — well done 🔥", progRest:(s)=>`Rest ${s}s, then next exercise`,
  postureBtn:"📸 AI Posture", postureTitle:"📸 Posture check", postureLoading:"Coach is checking your posture…", posturePrivacy:"🔒 Face blurred on-device — never uploaded", postureStart:"Start the session to analyze your posture",
  ghostBeat:"Ghost beaten! New personal record!", ghostL:(g,m)=>`👻 ${g} · you ${m}`,
  wsVel:(d)=>`📉 Velocity −${d}% late in the set (fatigue)`,
  statClaims:"Recent withdrawals", claimsEmpty:"No withdrawals yet", claimQr:"QR",
  statTransp:"Faucet transparency", transpEmpty:"Unavailable", transpToday:(a,b)=>`Paid out today: ${a}${b?(' / '+b):''} sats`,
  zapTip:"Zap this athlete ⚡",
  installIOS:"📲 Tap Share, then “Add to Home Screen”", installAndroid:"📲 Browser ⋮ menu → “Install app”",
  err:"❌ ", errWithdraw:"LNbits unreachable — is the Withdraw extension enabled?",
  loading:"⚡ Loading AI model…", alignPose:"Get into position (match the silhouette)", alignHold:"Hold still…", camOn:"📷 Starting camera…", camFail:"⚠ Camera unavailable.\nAllow camera access (HTTPS required).",
  goalDone:(n)=>`✔ +${n} sats`, sessionSats:(n)=>`+${n} sats this session`,
  combo:"COMBO", comboBroken:"COMBO LOST",
  coach:{ frame:"Get fully inside the frame", lost:"No one detected — step back a bit",
    squat_down:"Go down, back straight", squat_deeper:"Go a little deeper", squat_depth:"Perfect depth 💪",
    push_line:"Core tight! Keep your body aligned", push_up:"Push hard!", push_down:"Chest down to the floor",
    lunge_up:"Knee at 90°, come back up", lunge_step:"Big step forward",
    plank_hold:"Perfect alignment, hold it 🔥", plank_fix:"Squeeze your core, align your hips", plank_bad:"Hips too high or too low",
    warrior_hold:"Warrior stance 🙏", warrior_fix:"Arms level, front knee bent", warrior_bad:"Bend the front knee, extend your arms",
    tree_hold:"Solid roots 🌳", tree_fix:"Raise your foot, level your hips", tree_bad:"Lift one foot against the opposite leg",
    bridge_up:"Lift your hips, squeeze the glutes", bridge_down:"Lower back down slowly",
    jacks:"Arms up, legs wide, keep the rhythm!", jsq_up:"Explode upward! 🚀", jsq_down:"Squat down and jump",
    punch_full:"Full extension 🔥", punch_ext:"Extend the arm further", punch_guard:"Guard up, snap and retract", punch_high:"Fist too high — keep shoulder, elbow and fist level", punch_low:"Fist too low — bring it to shoulder height",
    knee_hit:"Powerful knee! Drive the hip", knee_up:"Raise the knee above your hip",
    burpee_down:"Drop to plank", burpee_back:"Back up fast, chest tall", burpee_up:"Explode! 🤢",
    situp_down:"Lower down with control", situp_up:"Curl up, breathe out",
    climber_go:"Knees to chest, keep the pace!", climber_hit:"Good! Hips steady",
    torso:"Torso and arms visible, face the camera",
    valgus:"Push your knees outward!", rushed:"Slow down — control the descent", partial:"Full range of motion!",
    fatigue:"Fatigue detected — clean reps or stop!" },
  voice:{ start:"Let's go!", getReady:"Get ready", perfect:"Perfect!", combo:(n)=>`Combo ${n}!`, comboBroken:"Combo lost", tooHigh:"Too high", tooLow:"Too low",
    goal:"Weekly goal reached! Congratulations!", milestone:(n,u)=>`${n} ${u==='sec'?'seconds':u==='hits'?'hits':'reps'}`, cap:"Daily cap reached",
    setDone:(n)=>`Set ${n} done! Rest.`, setGo:(n)=>`Set ${n}, let's go!`, allDone:"Session complete, well done!",
    fatigue:"Careful, you're losing speed. Clean reps or stop.", ghostBeat:"Ghost beaten! New personal record!" },
  run:{ title:"Run & Walk", start:"Start", stop:"Finish", ready:"Ready to go", paused:"Paused", running:"Running", walking:"Walking",
    durL:"time", paceL:"pace /km", gpsWait:"📡 Locating GPS…", gpsReady:"GPS ready ✓", gpsOk:"GPS ✓", gpsWeak:"⚠ Weak GPS signal", gpsDenied:"⚠ Allow location", noGeo:"GPS not available on this device",
    hrConnect:"Connect heart rate", hrUnsupported:"Bluetooth not supported (needs Android Chrome)", hrOk:"Heart rate connected ❤️", hrFail:"Heart rate not connected",
    voiceKm:(n)=>`${n} kilometer${n>1?'s':''}!`, voiceDone:(km)=>`Workout done. ${km} kilometers. Well done!`,
    gpxFail:"Unreadable GPX file", gpxEmpty:"No GPS points in this file", gpxBusy:"Finish the current session first", gpxOk:(km)=>`📁 Track imported: ${km} km (view only, no sats)`,
    cfgTitle:"⚙ Athlete profile", weightL:"Weight (kg)", ageL:"Age", summaryTitle:"🏁 Workout done", movingTime:"moving time", avgPace:"avg pace", bestKm:"best km", calories:"calories", hr:"HR avg/max", splits:"Pace per km", share:"Share", runsTitle:"🏃 My runs", runsEmpty:"No run yet — lace up! 👟", kmGoal:"Weekly km goal reached!",
    publishRun:"Publish to Nostr", privacyNote:"🔒 Anonymized route: shape only, no place or map (start/finish hidden)", runboardTitle:"🗺️ Recent routes (Nostr)", runboardEmpty:"No route published yet — be first ⚡", relayL:"Custom Nostr relay (optional)", relayHint:"Added to the default relays (e.g. 21pay relay). wss:// required." } },
es:{ sub:"Proof of Workout — tu sudor vale sats. La cámara analiza tus gestos en vivo.",
  sports:"Disciplinas", goals:"Objetivos de la semana", perfectL:"sat / gesto perfecto", comboL:"combos mejorados", goalL:"sats / objetivo",
  reps:"reps", sec:"seg", hits:"golpes", week:"esta semana", form:"FORMA", stop:"■ Terminar", cam:"⟳ Cámara",
  langTitle:"🌐 Idioma del coach", later:"Más tarde", createW:"Crear retiro", creating:"Creando…",
  pcTitle:"⚡ Reclama tus sats", pcText:(n)=>`Saldo ganado: <b style="color:var(--acc2)">${n} sats</b>. Elige cómo recibir:`,
  claimSub:"Escanea con cualquier wallet Lightning", copy:"Copiar LNURL", close:"Cerrar", copied:"LNURL copiado ✔", copyFail:"No se pudo copiar", credited:"validados", loginToEarn:"⚡ Inicia sesión (botón 👤) para ganar sats",
  account:"👤 Mi cuenta", accOutText:"Inicia sesión con tu wallet Lightning (LNURL-auth) para guardar tu progreso y retirar en varios dispositivos. Sin email, sin contraseña — solo tu firma.", accLogin:"Iniciar sesión", accLoggedTitle:"👤 Mi cuenta", accLnaddrLabel:"Dirección Lightning (para recibir)", accLogout:"Cerrar sesión", accSave:"Guardar", saved:"Guardado ✔", loginTitle:"⚡ Acceso Lightning", loginSub:"Escanea con tu wallet LNURL-auth (Phoenix, Zeus, Breez…)", loginWaiting:"Esperando la firma del wallet…", loginOpen:"📲 Abrir en mi wallet", loginOk:"Conectado ✔", loginExpired:"Challenge expirado, reintenta", loginCancel:"Cancelar", cancel:"Cancelar", close:"Cerrar", mLnaddr:"⚡ Dirección Lightning", mLnurl:"📷 QR / LNURL", lnaddrLabel:"Tu dirección Lightning", lnaddrHint:"Pago automático e instantáneo a esta dirección (ej: nombre@walletofsatoshi.com).", lnurlNote:"Se generará un vale de retiro LNURL: escanea el QR con cualquier wallet.", payDo:"Recibir", paidOk:(n)=>`⚡ ¡${n} sats enviados!`, paidSub:"Revisa tu wallet Lightning", authRequired:"Inicia sesión para retirar", noLnaddr:"Introduce tu dirección Lightning",
  tabTrain:"🏋️ Entrenar", tabStats:"📊 Stats", tabBoard:"🏆 Ranking", tabChallenge:"🎯 Retos",
  statReps:"reps totales", statStreak:"días seguidos", statSats:"sats ganados", statPerfect:"perfectos",
  week7:"Últimos 7 días", byDisc:"Por disciplina", noStats:"Entrena para ver tus stats 💪",
  boardIntro:"Ranking mundial por reps totales, vía Nostr. Publica tu puntuación para aparecer.",
  boardRefresh:"↻ Actualizar", boardLoading:"Cargando ranking…", boardEmpty:"Sé el primero en publicar tu puntuación ⚡",
  publish:"📡 Publicar mi puntuación", publishing:"Publicando…", published:(n)=>`Publicado en ${n} relays ✔`, pubFail:"Ningún relay respondió",
  askNick:"Tu apodo para el ranking:",
  newChallenge:"Nuevo reto", chalEx:"Ejercicio", chalTarget:"Objetivo (reps)", chalCreate:"Crear reto", chalAny:"🔥 Todas las disciplinas",
  noChallenge:"Sin retos activos. ¡Crea uno y compártelo!", chalCreated:"Reto creado 🎯", chalShare:"Compartir", chalImported:"Reto importado 🎯",
  chalShareText:(t,e)=>`Te reto: ${t} ${e} esta semana en PoW Coach ⚡`,
  chalImgTitle:"RETO DE LA SEMANA", chalImgSub:"Acéptalo en PoW Coach ⚡",
  noSats:"Sin sats que reclamar — ¡a entrenar! 💪", minClaim:(n)=>`Mínimo ${n} sats para reclamar`, notCfg:"⚠ Faucet no configurado por el propietario",
  capHit:"Límite diario alcanzado — vuelve mañana ⚡", capLock:(t)=>`Límite de sats alcanzado 🔒 vuelve en ${t}`,
  introTitle:"⚡ Bienvenido a PoW Coach", introBody:"Mueve tu cuerpo, gana sats. La cámara cuenta tus repeticiones y te recompensa en bitcoin real ⚡. Conecta una wallet Lightning (botón 👤) para ganar y retirar. Gratis, sin anuncios, sin registro.", introGo:"¡Vamos! 💪",
  faucetDry:"⚡ Faucet temporalmente sin fondos — vuelve pronto 🙏", faucetLow:"⚡ Faucet casi vacío",
  diffLabel:"Dificultad", diffEasy:"Fácil", diffNormal:"Normal", diffHard:"Difícil",
  restBtn:"Temporizador de descanso", restTitle:"Descanso", restSkip:"Terminar", restDone:"¡Descanso terminado — vamos! 💪",
  guidedL:"Guiada", freeL:"Libre", guidedTag:"Sesión",
  setsFmt:(c,s,r,t)=>`SERIE ${c}/${s} · ${r}/${t}`,
  wsTitle:"🏁 Resumen de sesión", wsPerfectL:"perfectas", wsForm:"forma media", wsCombo:"combo máx", wsDur:"minutos",
  wsFaults:"A corregir", wsNoFaults:"Sin fallos detectados 💪", wsNext:(n)=>`🎯 Próximo objetivo: ${n} por serie`,
  faultL:{valgus:"Rodillas hacia dentro",shallow:"Rango muy corto",rushed:"Reps apresuradas",partial:"Rango incompleto",high:"Puño muy alto",low:"Puño muy bajo",fatigue:"Pérdida de velocidad (fatiga)"},
  aiTitle:"🧠 Análisis del coach", aiLoading:"El coach analiza tu sesión…", aiLogin:"Inicia sesión (👤) para el análisis IA de tus sesiones",
  planBtn:"🧠 Plan semanal", planTitle:"🧠 Tu plan semanal", planLoading:"El coach prepara tu plan…",
  personaL:"Estilo del coach", personaCoach:"Coach", personaDrill:"Sargento", personaZen:"Zen", personaNerd:"Nerd",
  sessBtn:"⚡ Generar una sesión", sessLoading:"El coach programa tu sesión…", sessLaunch:"▶ Empezar esta sesión", sessRest:"descanso", sessAgain:"↻ Otra",
  progStep:(i,n)=>`Paso ${i}/${n}`, progNext:(e)=>`Siguiente: ${e}`, progDone:"Programa terminado — ¡bravo! 🔥", progRest:(s)=>`Descanso ${s}s y siguiente ejercicio`,
  postureBtn:"📸 Postura IA", postureTitle:"📸 Análisis de postura", postureLoading:"El coach mira tu postura…", posturePrivacy:"🔒 Cara difuminada en el dispositivo — nunca enviada", postureStart:"Empieza la sesión para analizar tu postura",
  ghostBeat:"¡Fantasma superado! ¡Récord personal!", ghostL:(g,m)=>`👻 ${g} · tú ${m}`,
  wsVel:(d)=>`📉 Velocidad −${d}% al final de la serie (fatiga)`,
  statClaims:"Retiros recientes", claimsEmpty:"Aún no hay retiros", claimQr:"QR",
  statTransp:"Transparencia del faucet", transpEmpty:"No disponible", transpToday:(a,b)=>`Repartido hoy: ${a}${b?(' / '+b):''} sats`,
  zapTip:"Zap a este atleta ⚡",
  installIOS:"📲 Pulsa Compartir y « Añadir a pantalla de inicio »", installAndroid:"📲 Menú ⋮ del navegador → « Instalar aplicación »",
  err:"❌ ", errWithdraw:"LNbits inaccesible — ¿extensión Withdraw activada?",
  loading:"⚡ Cargando modelo IA…", alignPose:"Ponte en posición (imita la silueta)", alignHold:"No te muevas…", camOn:"📷 Activando cámara…", camFail:"⚠ Cámara no disponible.\nPermite la cámara (HTTPS requerido).",
  goalDone:(n)=>`✔ +${n} sats`, sessionSats:(n)=>`+${n} sats esta sesión`,
  combo:"COMBO", comboBroken:"COMBO PERDIDO",
  coach:{ frame:"Colócate por completo en el encuadre", lost:"Nadie detectado — aléjate un poco",
    squat_down:"Baja, espalda recta", squat_deeper:"Baja un poco más", squat_depth:"Profundidad perfecta 💪",
    push_line:"¡Aprieta el core! Cuerpo alineado", push_up:"¡Empuja fuerte!", push_down:"Pecho hacia el suelo",
    lunge_up:"Rodilla a 90°, sube", lunge_step:"Gran paso adelante",
    plank_hold:"Alineación perfecta, aguanta 🔥", plank_fix:"Aprieta el abdomen, caderas alineadas", plank_bad:"Caderas muy altas o muy bajas",
    warrior_hold:"Postura de guerrero 🙏", warrior_fix:"Brazos horizontales, rodilla delantera flexionada", warrior_bad:"Flexiona la rodilla delantera, extiende los brazos",
    tree_hold:"Raíces firmes 🌳", tree_fix:"Sube el pie, caderas niveladas", tree_bad:"Apoya un pie contra la pierna opuesta",
    bridge_up:"Sube las caderas, aprieta glúteos", bridge_down:"Baja lentamente",
    jacks:"¡Brazos arriba, piernas abiertas, ritmo!", jsq_up:"¡Explota hacia arriba! 🚀", jsq_down:"Baja y salta",
    punch_full:"Extensión completa 🔥", punch_ext:"Extiende más el brazo", punch_guard:"Guardia alta, golpea y retrae", punch_high:"Puño muy alto — hombro, codo y puño en horizontal", punch_low:"Puño muy bajo — súbelo a la altura del hombro",
    knee_hit:"¡Rodillazo potente! Empuja la cadera", knee_up:"Sube la rodilla por encima de la cadera",
    burpee_down:"Baja a plancha", burpee_back:"Sube rápido, pecho alto", burpee_up:"¡Explota! 🤢",
    situp_down:"Baja con control", situp_up:"Sube el torso, exhala",
    climber_go:"¡Rodillas al pecho, ritmo!", climber_hit:"¡Bien! Caderas firmes",
    torso:"Torso y brazos visibles frente a la cámara",
    valgus:"¡Empuja las rodillas hacia fuera!", rushed:"Más lento — controla la bajada", partial:"¡Rango completo!",
    fatigue:"¡Fatiga detectada — reps limpias o para!" },
  voice:{ start:"¡Vamos!", getReady:"Prepárate", perfect:"¡Perfecto!", combo:(n)=>`¡Combo ${n}!`, comboBroken:"Combo perdido", tooHigh:"Muy alto", tooLow:"Muy bajo",
    goal:"¡Objetivo semanal logrado! ¡Felicidades!", milestone:(n,u)=>`${n} ${u==='sec'?'segundos':u==='hits'?'golpes':'repeticiones'}`, cap:"Límite diario alcanzado",
    setDone:(n)=>`¡Serie ${n} terminada! Descansa.`, setGo:(n)=>`¡Serie ${n}, vamos!`, allDone:"¡Sesión terminada, bravo!",
    fatigue:"Ojo, pierdes velocidad. Reps limpias o para.", ghostBeat:"¡Fantasma superado! ¡Récord personal!" },
  run:{ title:"Correr & Andar", start:"Empezar", stop:"Terminar", ready:"Listo", paused:"En pausa", running:"Corriendo", walking:"Andando",
    durL:"tiempo", paceL:"ritmo /km", gpsWait:"📡 Buscando GPS…", gpsReady:"GPS listo ✓", gpsOk:"GPS ✓", gpsWeak:"⚠ Señal GPS débil", gpsDenied:"⚠ Permite la ubicación", noGeo:"GPS no disponible en este dispositivo",
    hrConnect:"Conectar pulso", hrUnsupported:"Bluetooth no soportado (requiere Android Chrome)", hrOk:"Pulso conectado ❤️", hrFail:"Pulso no conectado",
    voiceKm:(n)=>`¡${n} kilómetro${n>1?'s':''}!`, voiceDone:(km)=>`Sesión terminada. ${km} kilómetros. ¡Bien hecho!`,
    gpxFail:"Archivo GPX ilegible", gpxEmpty:"Sin puntos GPS en el archivo", gpxBusy:"Termina la sesión actual primero", gpxOk:(km)=>`📁 Ruta importada: ${km} km (solo visual, sin sats)`,
    cfgTitle:"⚙ Perfil deportivo", weightL:"Peso (kg)", ageL:"Edad", summaryTitle:"🏁 Sesión terminada", movingTime:"tiempo activo", avgPace:"ritmo medio", bestKm:"mejor km", calories:"calorías", hr:"FC med/máx", splits:"Ritmo por km", share:"Compartir", runsTitle:"🏃 Mis carreras", runsEmpty:"Sin carreras aún — ¡a correr! 👟", kmGoal:"¡Objetivo km semanal!",
    publishRun:"Publicar en Nostr", privacyNote:"🔒 Ruta anonimizada: solo la forma, sin lugar ni mapa (inicio/fin ocultos)", runboardTitle:"🗺️ Rutas recientes (Nostr)", runboardEmpty:"Sin rutas publicadas — sé el primero ⚡", relayL:"Relé Nostr propio (opcional)", relayHint:"Añadido a los relés por defecto (ej: relé 21pay). wss:// requerido." } }
};
const VOICE_LANG = { fr:'fr-FR', en:'en-US', es:'es-ES' };

/* ---------- persistance ---------- */
const mem={};
const store={ get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v);}catch(e){return k in mem?mem[k]:d;}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){mem[k]=v;}} };

/* ---------- état ---------- */
const S={ lang:store.get('powlang','fr'), voice:store.get('powvoice',true),
  balance:store.get('powbalance',0), week:store.get('powweek',null), claimed:store.get('powclaimed',{}),
  day:store.get('powday',null), // {date, earned}
  token:store.get('powtoken',''), pubkey:store.get('powpubkey',''), lnaddr:store.get('powlnaddr',''),
  method:store.get('powmethod','lnaddress'),
  stats:store.get('powstats',null), // {totalReps, totalPerfect, totalSats, streak, lastDay, byDisc:{}, hist:{}}
  challenges:store.get('powchallenges',[]), // défis actifs
  nick:store.get('pownick',''),
  facing:'user', running:false, landmarker:null, ctx:null, drawer:null,
  ex:null, engine:null, combo:0, comboTier:0, sessionSats:0, lastLnurl:'', lastVoice:0,
  loginK1:'', loginTimer:null, tab:'train',
  repLog:[], wsToken:null, serverMode:false, lockUntil:0,
  persona:store.get('powpersona','coach'), // style du coach IA (coach/drill/zen/nerd)
  program:null,                          // séance IA en cours {titre,steps,idx,rest}
  vel:[], velDrop:0, vbtBuf:[], lastRepT0:0, // VBT : vitesse concentrique par rep
  repForms:[], ghost:null, ghostRec:[], ghostIdx:0, ghostBeaten:false, // fantôme (record perso)
  lastLandmarks:null,                    // dernière pose (pour la photo posture floutée)
  cal:(location.search.indexOf('cal=1')>=0||location.hash.indexOf('cal')>=0) };
const L=()=>I18N[S.lang];
const API=()=>CFG.API_BASE||''; // même origine si vide

/* ---------- solde serveur (scoring vérifié côté serveur) ----------
   Si le backend a le DO + SESSION_SECRET, /balance renvoie server:true et le
   solde fait autorité côté serveur. Sinon on reste en mode legacy (solde local). */
// verrou d'earn (cooldown après plafond) : ms restantes avant de pouvoir regagner
function earnLockLeft(){ return S.lockUntil ? Math.max(0, S.lockUntil - Date.now()) : 0; }
function fmtDur(ms){ const m=Math.ceil(ms/60000); if(m<60)return m+' min';
  const h=Math.floor(m/60), mm=m%60; return mm?`${h}h${String(mm).padStart(2,'0')}`:`${h}h`; }
async function refreshBalance(){
  try{
    // token en en-tête (pas en query : les URLs finissent dans les logs/historique)
    const r=await fetch(API()+'/balance',{headers:S.token?{Authorization:'Bearer '+S.token}:{}});
    const d=await r.json();
    S.serverMode=!!d.server;
    if(S.serverMode && S.token){ S.balance=d.balance||0; store.set('powbalance',S.balance);
      S.lockUntil=d.lockUntil||0; if(typeof renderHome==='function')renderHome(); }
  }catch(e){}
}
// démarre une séance notée serveur (jeton signé). Sans connexion → pas de scoring serveur.
async function startServerSession(exId){
  S.wsToken=null;S.repLog=[];
  if(!(S.serverMode&&S.token))return;
  try{
    const r=await fetch(API()+'/session/start',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({exId,diff:curDiff(),token:S.token})}); // difficulté signée → même seuil côté serveur
    const d=await r.json(); if(d.sessionId)S.wsToken=d.sessionId;
  }catch(e){}
}
// fin de séance : envoie le journal, le serveur recalcule et crédite le solde
async function submitServerSession(){
  const tok=S.wsToken,log=S.repLog;S.wsToken=null;S.repLog=[];
  if(!tok||!log.length)return;
  try{
    const r=await fetch(API()+'/session/submit',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({sessionId:tok,reps:log,token:S.token})});
    const d=await r.json();
    if(typeof d.balance==='number'){S.balance=d.balance;store.set('powbalance',S.balance);renderHome();}
    if(typeof d.lockUntil==='number')S.lockUntil=d.lockUntil;
    if(d.credited>0)toast('+'+d.credited+' ⚡ '+(L().credited||'validés'));
    if(d.bonus>0)toast('🏆 +'+d.bonus+' ⚡'); // bonus hebdo crédité par le serveur
    if(d.locked&&earnLockLeft()>0)toast(L().capLock(fmtDur(earnLockLeft()))); // plafond atteint → cooldown
  }catch(e){}
}
// relays testés à l'écriture (kind 30078). bitcoiner.social retiré : ne répond
// plus aux EVENT (timeout systématique constaté), remplacé par offchain.pub.
const DEFAULT_RELAYS=['wss://relay.damus.io','wss://nos.lol','wss://relay.primal.net','wss://offchain.pub'];
// relais perso optionnel (ex: relais 21pay) ajouté à la liste de publication/lecture
function RELAYS(){ const x=(store.get('powrelay','')||'').trim();
  return x&&/^wss:\/\//.test(x)?DEFAULT_RELAYS.concat(x):DEFAULT_RELAYS; }

/* ---------- stats à vie ---------- */
function ensureStats(){
  if(!S.stats) S.stats={totalReps:0,totalPerfect:0,totalSats:0,streak:0,lastDay:'',byDisc:{},hist:{}};
  return S.stats;
}
function bumpStat(discId,perfect,sats){
  const st=ensureStats(),today=new Date().toISOString().slice(0,10);
  st.totalReps++; if(perfect)st.totalPerfect++; st.totalSats+=sats||0;
  st.byDisc[discId]=(st.byDisc[discId]||0)+1;
  st.hist[today]=(st.hist[today]||0)+1;
  // streak : jours consécutifs avec ≥1 rep
  if(st.lastDay!==today){
    const y=new Date(Date.now()-864e5).toISOString().slice(0,10);
    st.streak = st.lastDay===y ? st.streak+1 : 1;
    st.lastDay=today;
  }
  store.set('powstats',st);
}

/* ---------- voix du coach ---------- */
let voices=[];
function loadVoices(){ voices=speechSynthesis.getVoices(); }
if('speechSynthesis' in window){ loadVoices(); speechSynthesis.onvoiceschanged=loadVoices; }
function say(text,{force=false}={}){
  if(!S.voice || !('speechSynthesis' in window) || !text) return;
  const now=Date.now();
  if(!force && now-S.lastVoice<1400) return;  // anti-spam
  S.lastVoice=now;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text.replace(/[⚡🔥💪🙏🌳🚀]/g,''));
  u.lang=VOICE_LANG[S.lang]; u.rate=1.08; u.pitch=1.0; u.volume=1;
  const v=voices.find(v=>v.lang===u.lang)||voices.find(v=>v.lang.startsWith(S.lang));
  if(v) u.voice=v;
  speechSynthesis.speak(u);
}
window.toggleVoice=()=>{ S.voice=!S.voice; store.set('powvoice',S.voice);
  document.getElementById('btn-voice').classList.toggle('off',!S.voice);
  document.getElementById('btn-voice').textContent=S.voice?'🔊':'🔇';
  if(S.voice) say(L().voice.start,{force:true}); else speechSynthesis.cancel(); };

/* ---------- semaine ISO + plafond journalier ----------
   Semaine calculée en UTC — identique à isoWeek() du serveur (_shared.js).
   Avant : calendrier LOCAL → autour de minuit (ex lundi 00h30 à Paris = dimanche
   22h30 UTC), client et serveur comptaient des semaines différentes (W30 vs W29)
   et les objectifs hebdo se désynchronisaient de l'affichage. */
function weekId(){const d=new Date();const t=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()));
  const day=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-day);
  const y0=new Date(Date.UTC(t.getUTCFullYear(),0,1));
  return t.getUTCFullYear()+'-W'+Math.ceil((((t-y0)/864e5)+1)/7);}
function ensureWeek(){const id=weekId();
  if(!S.week||S.week.id!==id){S.week={id,progress:{}};S.claimed={};persist();}}
function ensureDay(){const d=new Date().toISOString().slice(0,10);
  if(!S.day||S.day.date!==d){S.day={date:d,earned:0};store.set('powday',S.day);}}
function persist(){store.set('powweek',S.week);store.set('powclaimed',S.claimed);
  store.set('powbalance',S.balance);store.set('powday',S.day);}
function capLeft(){ensureDay();return Math.max(0,CFG.DAILY_CAP_SATS-S.day.earned);}

/* =========================================================
   GÉOMÉTRIE & MOTEURS (messages = clés i18n)
   ========================================================= */
function ang(a,b,c){const v1={x:a.x-b.x,y:a.y-b.y},v2={x:c.x-b.x,y:c.y-b.y};
  const dot=v1.x*v2.x+v1.y*v2.y,m=Math.hypot(v1.x,v1.y)*Math.hypot(v2.x,v2.y);
  return m===0?180:Math.acos(Math.min(1,Math.max(-1,dot/m)))*180/Math.PI;}
const avg=(a,b)=>(a+b)/2;
let VIS_MIN=0.3; // seuil de confiance des points (abaissé : MediaPipe perd les bras en position basse)
const vis=(P,ids)=>ids.every(i=>P[i]&&(P[i].visibility===undefined||P[i].visibility>VIS_MIN));
const visMinOf=(P,ids)=>Math.min(...ids.map(i=>P[i]?(P[i].visibility===undefined?1:P[i].visibility):0));
const gs=(val,ideal,tol)=>Math.max(0,Math.round(100*Math.exp(-((val-ideal)**2)/(2*tol*tol))));
const kneeAngle=P=>avg(ang(P[23],P[25],P[27]),ang(P[24],P[26],P[28]));
const elbowAngle=P=>avg(ang(P[11],P[13],P[15]),ang(P[12],P[14],P[16]));
const bodyLine=P=>avg(ang(P[11],P[23],P[27]),ang(P[12],P[24],P[28]));
const hipAngle=P=>avg(ang(P[11],P[23],P[25]),ang(P[12],P[24],P[26]));

function repEngine(o){let state='up',count=0,fb=0,lastRep=0,reached=false,minV=Infinity,bottom=null;
  const MIN_MS=350; // anti-rebond : pas 2 reps en moins de 350ms
  return{type:'reps',count:()=>count,analyze(P){
    const vm=+visMinOf(P,o.need).toFixed(2);
    if(!vis(P,o.need))return{form:null,msg:'frame',dbg:{vis:vm}};
    // gate optionnel : bloque le comptage tant que la POSTURE n'est pas la bonne
    if(o.gate&&!o.gate(P)){state='up';reached=false;return{form:0,msg:o.gateMsg||'frame',dbg:{vis:vm}};}
    const v=o.value(P),form=o.form(P,v);let msg=o.coach(P,v,state);
    const now=performance.now();
    const dbg={v:Math.round(v),st:state,n:count,vis:vm}; // calibrage
    if(state==='up'&&v<o.downAt){state='down';fb=form;reached=false;minV=v;bottom=o.probe?o.probe(P):null;}
    else if(state==='down'){fb=Math.max(fb,form);
      if(v<o.downAt-8)reached=true; // exige une VRAIE descente (marge sous le seuil)
      if(o.probe&&v<minV){minV=v;bottom=o.probe(P);} // photo de la posture au point bas
      if(v>o.upAt&&reached&&now-lastRep>MIN_MS){state='up';lastRep=now;count++;
        // diagnostic de faute sur la posture au point bas (ex : valgus du genou)
        const repFault=o.diagnose?o.diagnose(bottom,fb):null;
        return{rep:true,repForm:fb,form,msg,repFault,dbg:{v:Math.round(v),st:'up',n:count,vis:vm}};}
      if(v>o.upAt)state='up';}
    return{form,msg,dbg};}};}
/* Pompe vue de FACE : amplitude verticale épaules→poignets, normalisée par la
   largeur d'épaules. Calibré sur données réelles (2026-07-12) :
   - vraie pompe : d descend de ~0.85 (haut) à ~0.15 (poitrine au sol), vis 0.9+
   - fausse (tête seule / debout) : d reste 0.5–0.8 (petite amplitude) OU vis basse
   Anti-faux-positifs : (1) GATE visibilité strict (épaules+poignets ≥ 0.55, sinon
   MediaPipe invente les positions et elles gigotent), (2) seuils FIXES exigeant une
   VRAIE descente profonde (deepest < DEEP) avant de compter, (3) rejet des glitchs
   (saut d > 0.6/frame), (4) 1 rep / 1.2 s max. */
function pushupEngine(){
  let count=0,state='up',lastRep=0,ds=null,warm=0,deepest=9;
  const MIN_MS=1200,need=[11,12,15,16],VMIN=0.55;
  const DOWN=0.42, UP=0.68, DEEP=0.32; // seuils fixes (amplitude normalisée)
  return{type:'reps',count:()=>count,analyze(P){
    const vm=+visMinOf(P,need).toFixed(2);
    // (1) gate visibilité : épaules + poignets BIEN vus, sinon on ne compte rien
    const seen=need.every(i=>P[i]&&(P[i].visibility===undefined||P[i].visibility>=VMIN));
    if(!seen){ state='up'; ds=null; return{form:null,msg:'frame',dbg:{vis:vm,st:'wait',n:count}}; }
    const shY=(P[11].y+P[12].y)/2, wrY=(P[15].y+P[16].y)/2;
    const sw=Math.hypot(P[11].x-P[12].x,P[11].y-P[12].y)||1e-3;
    const d=(wrY-shY)/sw;
    if(ds===null){ ds=d; warm=0; deepest=9;
      return{form:40,msg:'push_down',dbg:{d:+d.toFixed(2),st:state,n:count,vis:vm}}; }
    // (3) rejet glitch : une vraie pompe bouge d de < 0.2/frame ; on jette les sauts
    if(Math.abs(d-ds)>0.6 || d>3 || d<-0.5)
      return{form:state==='down'?70:40,msg:state==='down'?'push_up':'push_down',
        dbg:{d:+ds.toFixed(2),st:state,n:count,vis:vm,skip:1}};
    ds=ds*0.6+d*0.4; warm++;
    const now=performance.now(), dbg={d:+ds.toFixed(2),dp:+deepest.toFixed(2),st:state,n:count,vis:vm};
    if(warm<6) return{form:40,msg:'push_down',dbg};
    if(state==='up'){ if(ds<DOWN){ state='down'; deepest=ds; } }
    else { deepest=Math.min(deepest,ds);
      if(ds>UP){ // remontée
        if(deepest<DEEP && now-lastRep>MIN_MS){ state='up'; lastRep=now; count++;
          const f=Math.round(55+Math.max(0,Math.min(1,(0.5-deepest)/0.4))*45);
          return{rep:true,repForm:f,form:f,msg:'push_up',dbg:{...dbg,st:'up',n:count}}; }
        const wasPartial=deepest<DOWN; // vraie tentative de descente, mais pas assez profonde
        state='up';
        if(wasPartial)return{form:40,msg:'partial',fault:'partial',dbg};
      } } // remonté sans vraie descente → pas de rep
    return{form:state==='down'?70:40,msg:state==='down'?'push_up':'push_down',dbg};
  }};
}
/* Burpee : squat → planche → squat (mouvement composé). v = hauteur de hanche
   relative aux épaules ×100 : ≈25 debout, ≈0 en planche. La forme juge la ligne
   du corps en planche + le contrôle (seuils initiaux, calibrables via ?cal=1). */
function burpeeEngine(){let state='up',count=0,lastRep=0,fb=0;
  const MIN_MS=2200;
  return{type:'reps',count:()=>count,analyze(P){
    if(!vis(P,[11,12,23,24,25,26,27,28]))return{form:null,msg:'frame'};
    const v=(avg(P[23].y,P[24].y)-avg(P[11].y,P[12].y))*100,now=performance.now();
    const line=gs(bodyLine(P),178,20);
    const dbg={v:Math.round(v),st:state,n:count};
    if(state==='up'&&v<8){state='down';fb=line;}
    else if(state==='down'){fb=Math.max(fb,line);
      if(v>20&&now-lastRep>MIN_MS){state='up';lastRep=now;count++;
        const f=Math.round(Math.max(35,fb)*.7+gs(v,28,10)*.3);
        return{rep:true,repForm:f,form:f,msg:'burpee_up',dbg:{...dbg,n:count}};}}
    return{form:state==='down'?Math.max(35,line):55,msg:state==='down'?'burpee_back':'burpee_down',dbg};}};}
/* Sit-up de PROFIL : angle du buste par rapport au sol (≈0° allongé → ≥40° en haut). */
function situpEngine(){let state='up',count=0,lastRep=0,fb=0;
  const MIN_MS=1400;
  return{type:'reps',count:()=>count,analyze(P){
    if(!vis(P,[11,12,23,24]))return{form:null,msg:'frame'};
    const shx=avg(P[11].x,P[12].x),shy=avg(P[11].y,P[12].y),hpx=avg(P[23].x,P[24].x),hpy=avg(P[23].y,P[24].y);
    const v=Math.abs(Math.atan2(shy-hpy,shx-hpx))*180/Math.PI,now=performance.now();
    const dbg={v:Math.round(v),st:state,n:count};
    if(state==='up'&&v<12){state='down';fb=0;}
    else if(state==='down'){fb=Math.max(fb,gs(v,55,20));
      if(v>38&&now-lastRep>MIN_MS){state='up';lastRep=now;count++;
        const f=Math.max(40,fb);
        return{rep:true,repForm:f,form:f,msg:'situp_up',dbg:{...dbg,n:count}};}}
    return{form:Math.max(30,fb),msg:state==='down'?'situp_up':'situp_down',dbg};}};}
/* Mountain climbers : genou ramené vers la poitrine en alternance, hanches stables.
   v = distance genou→épaule la plus courte, normalisée par la longueur du torse. */
function climberEngine(){let armed=true,count=0,lastRep=0;
  const MIN_MS=480;
  return{type:'reps',count:()=>count,analyze(P){
    if(!vis(P,[11,12,23,24,25,26]))return{form:null,msg:'frame'};
    const tl=Math.hypot(avg(P[11].x,P[12].x)-avg(P[23].x,P[24].x),avg(P[11].y,P[12].y)-avg(P[23].y,P[24].y))||1e-3;
    const v=Math.min(Math.hypot(P[25].x-P[11].x,P[25].y-P[11].y)/tl,Math.hypot(P[26].x-P[12].x,P[26].y-P[12].y)/tl);
    const now=performance.now(),hips=gs(Math.abs(avg(P[23].y,P[24].y)-avg(P[11].y,P[12].y))*100,15,15);
    const dbg={v:+v.toFixed(2),n:count};
    if(armed&&v<0.85&&now-lastRep>MIN_MS){armed=false;lastRep=now;count++;
      const f=Math.round(60+Math.max(30,hips)*.4);
      return{rep:true,repForm:f,form:f,msg:'climber_hit',dbg:{...dbg,n:count}};}
    if(v>1.05)armed=true;
    return{form:Math.max(35,hips),msg:'climber_go',dbg};}};}
function holdEngine(o){let sec=0,last=null;
  return{type:'hold',count:()=>Math.floor(sec),analyze(P,now){
    if(!vis(P,o.need)){last=null;return{form:null,msg:'frame'};}
    const form=o.form(P),good=form>=55;
    if(good){if(last!==null){const prev=Math.floor(sec);sec+=(now-last)/1000;
        if(Math.floor(sec)>prev)return{tick:true,tickForm:form,form,msg:o.coach(P,form)};}
      last=now;}else last=null;
    return{form,msg:good?o.coach(P,form):o.badMsg};}};}
/* Boxe (de PROFIL) : un coup compte quand le bras s'étend (coude > 140°) ET que
   le poing reste À HAUTEUR d'épaule (épaule-coude-poing horizontal, |Δy| < OK).
   Si le bras s'étend mais que le poing est trop haut/bas → on NE compte pas et on
   renvoie un `fault` ('high'/'low') pour le retour vocal ("trop haut"/"trop bas"). */
function punchEngine(){let armed={l:true,r:true},count=0;
  const HI=-0.12, LO=0.33; // bande "horizontale" ASYMÉTRIQUE (calibrée sur data) : poing un peu bas = ok, poing haut = faute
  return{type:'reps',count:()=>count,analyze(P){
    if(!vis(P,[11,12,13,14,15,16]))return{form:null,msg:'torso',dbg:{vis:+visMinOf(P,[11,12,13,14,15,16]).toFixed(2)}};
    const eL=ang(P[11],P[13],P[15]),eR=ang(P[12],P[14],P[16]);
    const dyL=P[15].y-P[11].y, dyR=P[16].y-P[12].y; // <0 poing AU-DESSUS de l'épaule ; >0 EN DESSOUS
    const guard=avg(gs(Math.min(eL,eR),55,35),60);let hit=null,fault=null;
    const dbg={eL:Math.round(eL),eR:Math.round(eR),dyL:+dyL.toFixed(2),dyR:+dyR.toFixed(2),n:count};
    if(armed.l&&eL>140){armed.l=false; if(dyL>HI&&dyL<LO)hit=eL; else fault=dyL<HI?'high':'low';}
    if(armed.r&&eR>140){armed.r=false; if(dyR>HI&&dyR<LO)hit=eR; else fault=dyR<HI?'high':'low';}
    if(eL<130)armed.l=true;if(eR<130)armed.r=true;
    if(hit){count++;const f=gs(hit,165,25);
      return{rep:true,repForm:f,form:f,msg:f>=90?'punch_full':'punch_ext',dbg:{...dbg,n:count}};}
    if(fault)return{form:guard,msg:'punch_'+fault,fault,dbg};
    return{form:guard,msg:'punch_guard',dbg};}};}

/* =========================================================
   CATALOGUE — noms/tips localisés {fr,en,es}
   ========================================================= */
const SPORTS=[
 {id:'muscu',em:'🏋️',theme:'muscu',
  name:{fr:'Musculation',en:'Strength',es:'Fuerza'},
  desc:{fr:'Squats, pompes, fentes',en:'Squats, push-ups, lunges',es:'Sentadillas, flexiones, zancadas'},ex:[
  {id:'squat',em:'🦵',unit:'reps',goal:100,
   name:{fr:'Squats',en:'Squats',es:'Sentadillas'},
   tip:{fr:'De face ou de profil, corps entier visible',en:'Front or side view, full body visible',es:'De frente o de perfil, cuerpo completo visible'},
   make:()=>repEngine({need:[11,12,23,24,25,26,27,28],value:kneeAngle,downAt:105,upAt:160,
     form:(P,v)=>{const d=gs(v,85,22),b=gs(hipAngle(P),70,45);return Math.round(d*.7+b*.3);},
     // photo du point bas : écart genoux vs chevilles → détection du valgus (genoux qui rentrent)
     probe:P=>({kd:Math.abs(P[25].x-P[26].x),ad:Math.abs(P[27].x-P[28].x)}),
     diagnose:b=>(b&&b.ad>0.06&&b.kd<b.ad*0.75)?'valgus':null, // seulement de face (ad significatif)
     coach:(P,v,st)=>st==='down'?(v<85?'squat_depth':'squat_deeper'):'squat_down'})},
  {id:'pushup',em:'💥',unit:'reps',goal:60,
   name:{fr:'Pompes',en:'Push-ups',es:'Flexiones'},
   tip:{fr:'Téléphone posé face à toi, corps tendu',en:'Phone facing you, body straight',es:'Teléfono frente a ti, cuerpo recto'},
   make:()=>pushupEngine()},
  {id:'lunge',em:'🚶',unit:'reps',goal:60,
   name:{fr:'Fentes',en:'Lunges',es:'Zancadas'},
   tip:{fr:'De profil, alterne les jambes',en:'Side view, alternate legs',es:'De perfil, alterna las piernas'},
   make:()=>repEngine({need:[23,24,25,26,27,28],
     value:P=>Math.min(ang(P[23],P[25],P[27]),ang(P[24],P[26],P[28])),downAt:100,upAt:160,
     form:(P,v)=>gs(v,90,20),coach:(P,v,st)=>st==='down'?'lunge_up':'lunge_step'})}]},
 {id:'gainage',em:'🛡️',theme:'gainage',
  name:{fr:'Gainage',en:'Core',es:'Core'},
  desc:{fr:'Planche chronométrée',en:'Timed plank',es:'Plancha cronometrada'},ex:[
  {id:'plank',em:'➖',unit:'sec',goal:300,
   name:{fr:'Planche',en:'Plank',es:'Plancha'},
   tip:{fr:'Téléphone au sol, profil complet',en:'Phone on the floor, full side view',es:'Teléfono en el suelo, perfil completo'},
   make:()=>holdEngine({need:[11,12,23,24,27,28],form:P=>gs(bodyLine(P),178,12),
     coach:(P,f)=>f>=90?'plank_hold':'plank_fix',badMsg:'plank_bad'})}]},
 {id:'yoga',em:'🧘',theme:'yoga',
  name:{fr:'Yoga',en:'Yoga',es:'Yoga'},
  desc:{fr:'Guerrier II, arbre',en:'Warrior II, tree',es:'Guerrero II, árbol'},ex:[
  {id:'warrior',em:'⚔️',unit:'sec',goal:120,
   name:{fr:'Guerrier II',en:'Warrior II',es:'Guerrero II'},
   tip:{fr:"De face, bras à l'horizontale",en:'Front view, arms horizontal',es:'De frente, brazos horizontales'},
   make:()=>holdEngine({need:[11,12,13,14,15,16,23,24,25,26,27,28],
     form:P=>{const k=gs(Math.min(ang(P[23],P[25],P[27]),ang(P[24],P[26],P[28])),95,25);
       const a=gs(avg(Math.abs(P[15].y-P[11].y),Math.abs(P[16].y-P[12].y))*100,0,8);
       const e=gs(elbowAngle(P),175,15);return Math.round(k*.4+a*.35+e*.25);},
     coach:(P,f)=>f>=90?'warrior_hold':'warrior_fix',badMsg:'warrior_bad'})},
  {id:'tree',em:'🌳',unit:'sec',goal:120,
   name:{fr:'Arbre',en:'Tree pose',es:'Árbol'},
   tip:{fr:'De face, un pied contre la jambe opposée',en:'Front view, one foot on the opposite leg',es:'De frente, un pie contra la pierna opuesta'},
   make:()=>holdEngine({need:[23,24,25,26,27,28],
     form:P=>{const lift=Math.abs(P[27].y-P[28].y);const r=gs(lift*100,18,10);
       const h=gs(Math.abs(P[23].y-P[24].y)*100,0,4);return Math.round(r*.6+h*.4);},
     coach:(P,f)=>f>=90?'tree_hold':'tree_fix',badMsg:'tree_bad'})}]},
 {id:'pilates',em:'🌀',theme:'pilates',
  name:{fr:'Pilates',en:'Pilates',es:'Pilates'},
  desc:{fr:'Pont fessier',en:'Glute bridge',es:'Puente de glúteos'},ex:[
  {id:'bridge',em:'🌉',unit:'reps',goal:80,
   name:{fr:'Pont fessier',en:'Glute bridge',es:'Puente de glúteos'},
   tip:{fr:'Allongé de profil, téléphone au sol',en:'Lying down, side view, phone on floor',es:'Tumbado de perfil, teléfono en el suelo'},
   make:()=>repEngine({need:[11,12,23,24,25,26],value:hipAngle,downAt:130,upAt:165,
     form:(P,v)=>gs(hipAngle(P),175,15),coach:(P,v,st)=>st==='down'?'bridge_up':'bridge_down'})},
  {id:'situp',em:'🎯',unit:'reps',goal:60,
   name:{fr:'Abdos (sit-ups)',en:'Sit-ups',es:'Abdominales'},
   tip:{fr:'Allongé de profil, téléphone au sol',en:'Lying on your side view, phone on floor',es:'Tumbado de perfil, teléfono en el suelo'},
   make:()=>situpEngine()}]},
 {id:'street',em:'🤸',theme:'street',
  name:{fr:'Street Workout',en:'Street Workout',es:'Street Workout'},
  desc:{fr:'Jumping jacks, squats sautés',en:'Jumping jacks, jump squats',es:'Jumping jacks, sentadillas con salto'},ex:[
  {id:'jacks',em:'⭐',unit:'reps',goal:150,
   name:{fr:'Jumping Jacks',en:'Jumping Jacks',es:'Jumping Jacks'},
   tip:{fr:'De face, corps entier visible',en:'Front view, full body visible',es:'De frente, cuerpo completo visible'},
   make:()=>repEngine({need:[11,12,15,16,27,28],
     value:P=>{const arms=(avg(P[15].y,P[16].y)<avg(P[11].y,P[12].y)-0.05)?1:0;
       const legs=Math.abs(P[27].x-P[28].x);return arms&&legs>0.22?50:170;},
     downAt:100,upAt:160,form:()=>95,coach:()=>'jacks'})},
  {id:'jsquat',em:'🚀',unit:'reps',goal:60,
   name:{fr:'Squats sautés',en:'Jump squats',es:'Sentadillas con salto'},
   tip:{fr:'De face ou de profil',en:'Front or side view',es:'De frente o de perfil'},
   make:()=>repEngine({need:[23,24,25,26,27,28],value:kneeAngle,downAt:110,upAt:165,
     probe:P=>({kd:Math.abs(P[25].x-P[26].x),ad:Math.abs(P[27].x-P[28].x)}),
     diagnose:b=>(b&&b.ad>0.06&&b.kd<b.ad*0.75)?'valgus':null,
     form:(P,v)=>gs(v,90,25),coach:(P,v,st)=>st==='down'?'jsq_up':'jsq_down'})},
  {id:'burpee',em:'🤢',unit:'reps',goal:40,
   name:{fr:'Burpees',en:'Burpees',es:'Burpees'},
   tip:{fr:'Corps entier visible, recule bien',en:'Full body visible, step back',es:'Cuerpo completo visible, retrocede'},
   make:()=>burpeeEngine()},
  {id:'climber',em:'⛰️',unit:'reps',goal:80,
   name:{fr:'Mountain climbers',en:'Mountain climbers',es:'Escaladores'},
   tip:{fr:'Téléphone au sol, de profil',en:'Phone on the floor, side view',es:'Teléfono en el suelo, de perfil'},
   make:()=>climberEngine()}]},
 {id:'boxe',em:'🥊',theme:'boxe',
  name:{fr:'Boxe anglaise',en:'Boxing',es:'Boxeo'},
  desc:{fr:'Jab & cross',en:'Jab & cross',es:'Jab y cross'},ex:[
  {id:'jab',em:'👊',unit:'hits',goal:300,
   name:{fr:'Jab & Cross',en:'Jab & Cross',es:'Jab y Cross'},
   tip:{fr:'De profil, garde haute',en:'Side view, guard up',es:'De perfil, guardia alta'},
   make:punchEngine}]},
 {id:'thai',em:'🦿',theme:'thai',
  name:{fr:'Boxe thaï',en:'Muay Thai',es:'Muay Thai'},
  desc:{fr:'Coups de genou, directs',en:'Knee strikes, punches',es:'Rodillazos, directos'},ex:[
  {id:'knee',em:'🦵',unit:'hits',goal:100,
   name:{fr:'Coups de genou',en:'Knee strikes',es:'Rodillazos'},
   tip:{fr:'De face ou léger profil',en:'Front or slight side view',es:'De frente o perfil ligero'},
   make:()=>repEngine({need:[23,24,25,26],
     value:P=>Math.min(P[25].y-P[23].y,P[26].y-P[24].y)<-0.02?60:170,downAt:100,upAt:160,
     form:P=>gs(Math.min(P[25].y-P[23].y,P[26].y-P[24].y)*100,-12,8),
     coach:(P,v,st)=>st==='down'?'knee_hit':'knee_up'})},
  {id:'punch2',em:'👊',unit:'hits',goal:300,
   name:{fr:'Directs',en:'Straight punches',es:'Directos'},
   tip:{fr:'De profil, garde haute',en:'Side view, guard up',es:'De perfil, guardia alta'},
   make:punchEngine}]},
 {id:'running',em:'🏃',theme:'running',run:true,
  name:{fr:'Course & Marche',en:'Run & Walk',es:'Correr & Andar'},
  desc:{fr:'GPS + carte OpenStreetMap',en:'GPS + OpenStreetMap',es:'GPS + OpenStreetMap'},ex:[]}
];
const findEx=id=>{for(const s of SPORTS)for(const e of s.ex)if(e.id===id)return{...e,sport:s};};

/* =========================================================
   UI
   ========================================================= */
const $=id=>document.getElementById(id);
const THEME_C={muscu:'#FF6B00',gainage:'#00D4FF',yoga:'#A78BFA',pilates:'#FF4FA3',street:'#B8FF29',boxe:'#FF2244',thai:'#FFC531',running:'#3DFFA0'};
function setTheme(t){document.body.dataset.theme=t;}
function show(n){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  $('screen-'+n).classList.add('active');}
window.closeModal=id=>$(id).classList.remove('show');
function toast(m){const t=$('toast');t.textContent=m;t.classList.remove('show');void t.offsetWidth;t.classList.add('show');}
window.goHome=()=>{setTheme('muscu');renderHome();show('home');};

function applyLangStatic(){
  const T=L();
  $('home-sub').textContent=T.sub;
  $('st-sports').textContent=T.sports; $('st-goals').textContent=T.goals;
  // onglets
  $('nt-train').textContent=T.tabTrain;$('nt-stats').textContent=T.tabStats;
  $('nt-board').textContent=T.tabBoard;$('nt-challenge').textContent=T.tabChallenge;
  $('stat-reps-l').textContent=T.statReps;$('stat-streak-l').textContent=T.statStreak;
  $('stat-sats-l').textContent=T.statSats;$('stat-perfect-l').textContent=T.statPerfect;
  $('st-week7').textContent=T.week7;$('st-bydisc').textContent=T.byDisc;
  $('board-intro').textContent=T.boardIntro;$('board-refresh').textContent=T.boardRefresh;
  $('board-publish').textContent=T.publish;
  $('fi-perfect').textContent='+'+CFG.SATS_PERFECT; $('fi-perfect-l').textContent=T.perfectL;
  $('fi-combo').textContent='x'+(CFG.COMBO_TIERS[0]?.at||5); $('fi-combo-l').textContent=T.comboL;
  $('fi-goal').textContent='+'+CFG.SATS_WEEKLY_GOAL; $('fi-goal-l').textContent=T.goalL;
  $('btn-stop').textContent=T.stop; $('btn-cam').textContent=T.cam;
  const pb=$('btn-posture'); if(pb)pb.textContent=T.postureBtn;
  const pt=$('po-title'); if(pt)pt.textContent=T.postureTitle;
  $('ring-lbl').textContent=T.form; $('lang-title').textContent=T.langTitle;
  $('acc-title').textContent=T.account;
  $('btn-lang').textContent=S.lang.toUpperCase();
  $('btn-voice').textContent=S.voice?'🔊':'🔇'; $('btn-voice').classList.toggle('off',!S.voice);
  ['fr','en','es'].forEach(l=>$('lb-'+l).classList.toggle('sel',l===S.lang));
  document.documentElement.lang=S.lang;
}
window.openLang=()=>$('modal-lang').classList.add('show');
window.setLang=l=>{S.lang=l;store.set('powlang',l);closeModal('modal-lang');
  applyLangStatic();renderHome();say(L().voice.start,{force:true});renderDiff();renderGuided();maybeIntro();};

function renderHome(){
  ensureWeek();
  $('balance-val').textContent=S.balance;
  const T=L(),grid=$('sports-grid');grid.innerHTML='';
  SPORTS.forEach(sp=>{const b=document.createElement('button');b.className='card';
    b.style.setProperty('--c',THEME_C[sp.theme]);
    b.innerHTML=`<span class="em">${sp.em}</span><h3>${sp.name[S.lang]}</h3><p>${sp.desc[S.lang]}</p>`;
    b.onclick=()=>openSport(sp);grid.appendChild(b);});
  const gl=$('goals-list');gl.innerHTML='';
  SPORTS.flatMap(s=>s.ex).forEach(e=>{
    const p=S.week.progress[e.id]||0,pct=Math.min(100,Math.round(p/e.goal*100)),done=p>=e.goal;
    const d=document.createElement('div');d.className='goal'+(done?' done':'');
    d.innerHTML=`<div class="row"><span>${e.em} ${e.name[S.lang]}</span><b>${done?T.goalDone(CFG.SATS_WEEKLY_GOAL):p+' / '+e.goal+' '+T[e.unit]}</b></div>
      <div class="bar"><i style="width:${pct}%"></i></div>`;
    gl.appendChild(d);});
}
function openSport(sp){
  setTheme(sp.theme);
  if(sp.run){ openRun(); return; }   // course & marche → écran GPS/carte dédié
  $('sport-title').textContent=sp.name[S.lang];
  const l=$('exercise-list');l.innerHTML='';
  sp.ex.forEach(e=>{const p=S.week.progress[e.id]||0;
    const b=document.createElement('button');b.className='exrow';
    b.innerHTML=`<span class="em">${e.em}</span><div class="meta"><h3>${e.name[S.lang]}</h3>
      <p>${p} / ${e.goal} ${L()[e.unit]} ${L().week} · ${e.tip[S.lang]}</p></div><span class="go">▶</span>`;
    b.onclick=()=>startWorkout(e.id);l.appendChild(b);});
  show('sport');
}

/* =========================================================
   WORKOUT — caméra + boucle
   ========================================================= */
async function loadModel(){
  if(S.landmarker)return;
  if(!MP) MP=await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14");
  const fs=await MP.FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
  // modèle "full" = bien plus précis que "lite" sur les articulations
  S.landmarker=await MP.PoseLandmarker.createFromOptions(fs,{
    baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",delegate:"GPU"},
    runningMode:"VIDEO",numPoses:1,
    minPoseDetectionConfidence:0.6, minPosePresenceConfidence:0.6, minTrackingConfidence:0.6});
}
/* ---- lissage temporel des landmarks (One-Euro-like) : supprime le tremblement ---- */
let smoothLM=null;
function smoothLandmarks(P){
  if(!smoothLM || smoothLM.length!==P.length){ smoothLM=P.map(p=>({...p})); return smoothLM; }
  const a=0.5; // 0=figé, 1=brut ; 0.5 = bon compromis réactivité/stabilité
  for(let i=0;i<P.length;i++){
    smoothLM[i].x=smoothLM[i].x+a*(P[i].x-smoothLM[i].x);
    smoothLM[i].y=smoothLM[i].y+a*(P[i].y-smoothLM[i].y);
    smoothLM[i].z=(smoothLM[i].z||0)+a*((P[i].z||0)-(smoothLM[i].z||0));
    smoothLM[i].visibility=P[i].visibility;
  }
  return smoothLM;
}
async function startCamera(){
  const v=$('video');
  if(v.srcObject)v.srcObject.getTracks().forEach(t=>t.stop());
  const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:S.facing,width:{ideal:1280},height:{ideal:720}},audio:false});
  v.srcObject=stream;await v.play();
  const c=$('overlay');c.width=v.videoWidth;c.height=v.videoHeight;
  S.ctx=c.getContext('2d');S.drawer=MP?new MP.DrawingUtils(S.ctx):null;
  const mir=S.facing==='user'?'scaleX(-1)':'none';
  v.style.transform=mir;c.style.transform=mir;
}
window.flipCamera=async()=>{S.facing=S.facing==='user'?'environment':'user';
  store.set('powfacing',S.facing); // mémorise ton choix de caméra
  try{await startCamera();}catch(e){toast(L().camFail.split('\n')[0]);}};

/* =========================================================
   POSES GUIDES — silhouette cible en coordonnées normalisées (0..1)
   Squelette de départ que l'utilisateur doit imiter avant le GO.
   idx MediaPipe : 0 nez,11/12 épaules,13/14 coudes,15/16 poignets,
   23/24 hanches,25/26 genoux,27/28 chevilles
   ========================================================= */
function standPose(){ // debout de face, bras le long du corps
  return {0:[.5,.12],11:[.42,.28],12:[.58,.28],13:[.40,.45],14:[.60,.45],15:[.39,.60],16:[.61,.60],
    23:[.44,.55],24:[.56,.55],25:[.44,.75],26:[.56,.75],27:[.44,.93],28:[.56,.93]};
}
const GUIDES={
  squat:standPose(), jsquat:standPose(), lunge:standPose(), knee:standPose(), burpee:standPose(),
  situp:{0:[.14,.60],11:[.30,.56],12:[.30,.64],13:[.24,.66],14:[.24,.74],15:[.20,.72],16:[.20,.80],
    23:[.56,.44],24:[.56,.52],25:[.74,.60],26:[.74,.68],27:[.88,.74],28:[.88,.82]}, // allongé (base pont)
  climber:{0:[.14,.52],11:[.28,.48],12:[.28,.58],13:[.30,.62],14:[.30,.70],15:[.30,.74],16:[.30,.80],
    23:[.56,.50],24:[.56,.60],25:[.74,.52],26:[.74,.62],27:[.90,.54],28:[.90,.64]}, // planche
  jacks:{0:[.5,.12],11:[.40,.28],12:[.60,.28],13:[.30,.20],14:[.70,.20],15:[.24,.10],16:[.76,.10],
    23:[.44,.55],24:[.56,.55],25:[.38,.75],26:[.62,.75],27:[.34,.93],28:[.66,.93]},
  jab:{0:[.5,.14],11:[.40,.30],12:[.60,.30],13:[.34,.42],14:[.66,.42],15:[.42,.34],16:[.58,.34],
    23:[.43,.58],24:[.57,.58],25:[.43,.77],26:[.57,.77],27:[.43,.94],28:[.57,.94]},
  punch2:{0:[.5,.14],11:[.40,.30],12:[.60,.30],13:[.34,.42],14:[.66,.42],15:[.42,.34],16:[.58,.34],
    23:[.43,.58],24:[.57,.58],25:[.43,.77],26:[.57,.77],27:[.43,.94],28:[.57,.94]},
  pushup:{0:[.5,.24],11:[.40,.40],12:[.60,.40],13:[.37,.56],14:[.63,.56],15:[.40,.72],16:[.60,.72],
    23:[.43,.60],24:[.57,.60],25:[.44,.80],26:[.56,.80],27:[.44,.96],28:[.56,.96]},
  plank:{0:[.14,.52],11:[.28,.48],12:[.28,.58],13:[.30,.62],14:[.30,.70],15:[.30,.74],16:[.30,.80],
    23:[.56,.50],24:[.56,.60],25:[.74,.52],26:[.74,.62],27:[.90,.54],28:[.90,.64]},
  bridge:{0:[.14,.60],11:[.30,.56],12:[.30,.64],13:[.24,.66],14:[.24,.74],15:[.20,.72],16:[.20,.80],
    23:[.56,.44],24:[.56,.52],25:[.74,.60],26:[.74,.68],27:[.88,.74],28:[.88,.82]},
  warrior:{0:[.5,.16],11:[.42,.32],12:[.58,.32],13:[.26,.32],14:[.74,.32],15:[.12,.32],16:[.88,.32],
    23:[.44,.56],24:[.56,.56],25:[.30,.72],26:[.62,.78],27:[.22,.92],28:[.66,.94]},
  tree:{0:[.5,.12],11:[.42,.26],12:[.58,.26],13:[.36,.14],14:[.64,.14],15:[.42,.06],16:[.58,.06],
    23:[.45,.54],24:[.55,.54],25:[.45,.74],26:[.60,.60],27:[.45,.93],28:[.52,.62]}
};
// sens du mouvement par exercice → schéma animé (flèche/impact/tenue)
const EX_MOTION={squat:'v',jsquat:'v',lunge:'v',pushup:'v',knee:'v',jacks:'v',bridge:'v',burpee:'v',situp:'v',climber:'v',
  jab:'impact',punch2:'impact',plank:'hold',warrior:'hold',tree:'hold'};
/* Silhouette guide "pro" : corps PLEIN lumineux (torse rempli + membres en
   capsules épaisses + tête) au lieu d'un fil de fer, + un schéma de mouvement
   animé. 100% vectoriel (net à tout écran, aucune image externe à héberger). */
function drawGuide(exId,align){
  const g=GUIDES[exId]; if(!g)return;
  const cx=S.ctx,W=cx.canvas.width,H=cx.canvas.height,c=getComputedStyle(document.body);
  const on=align>=0.5, col=on?c.getPropertyValue('--grn').trim():c.getPropertyValue('--acc2').trim();
  const P=i=>g[i]?[g[i][0]*W,g[i][1]*H]:null, sc=W/400;
  const pulse=0.85+0.15*Math.sin(Date.now()/520); // respiration douce
  cx.save(); cx.lineCap='round'; cx.lineJoin='round';
  cx.shadowColor=col; cx.shadowBlur=22; cx.strokeStyle=col; cx.fillStyle=col;
  const s1=P(11),s2=P(12),h1=P(23),h2=P(24),nose=P(0);
  // torse rempli
  if(s1&&s2&&h1&&h2){ cx.globalAlpha=(on?0.28:0.18)*pulse;
    cx.beginPath();cx.moveTo(s1[0],s1[1]);cx.lineTo(s2[0],s2[1]);cx.lineTo(h2[0],h2[1]);cx.lineTo(h1[0],h1[1]);
    cx.closePath();cx.fill(); }
  // membres en capsules épaisses
  cx.globalAlpha=(on?0.9:0.68)*pulse;
  const seg=(a,b,w)=>{const A=P(a),B=P(b);if(!A||!B)return;cx.lineWidth=w*sc;cx.beginPath();cx.moveTo(A[0],A[1]);cx.lineTo(B[0],B[1]);cx.stroke();};
  seg(11,12,20);seg(11,23,20);seg(12,24,20);seg(23,24,22);           // tronc
  seg(11,13,17);seg(13,15,14);seg(12,14,17);seg(14,16,14);           // bras
  seg(23,25,22);seg(25,27,17);seg(24,26,22);seg(26,28,17);           // jambes
  // cou + tête pleine
  if(nose&&s1&&s2){ const nk=[(s1[0]+s2[0])/2,(s1[1]+s2[1])/2];
    cx.lineWidth=14*sc;cx.beginPath();cx.moveTo(nk[0],nk[1]);cx.lineTo(nose[0],nose[1]);cx.stroke();
    cx.beginPath();cx.arc(nose[0],nose[1],W*0.052,0,7);cx.fill(); }
  drawMotionHint(cx,exId,g,W,H,col,on);
  cx.restore();
}
function drawMotionHint(cx,exId,g,W,H,col,on){
  const m=EX_MOTION[exId]||'hold';
  const xs=[],ys=[]; for(const k in g){xs.push(g[k][0]*W);ys.push(g[k][1]*H);}
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const now=Date.now(),t=(now%1300)/1300;
  cx.save(); cx.strokeStyle=col; cx.fillStyle=col; cx.shadowColor=col; cx.shadowBlur=16;
  cx.lineCap='round'; cx.lineJoin='round'; const base=on?0.9:0.6;
  if(m==='v'){ // flèche verticale : descends puis remonte (3 chevrons qui défilent)
    const x=maxX+W*0.09, y0=minY+(maxY-minY)*0.12, y1=minY+(maxY-minY)*0.88, s=W*0.03;
    cx.globalAlpha=base*0.3; cx.lineWidth=6; cx.beginPath();cx.moveTo(x,y0);cx.lineTo(x,y1);cx.stroke();
    for(let i=0;i<3;i++){ const p=(t+i/3)%1, cy=y0+p*(y1-y0);
      cx.globalAlpha=base*(0.4+0.6*Math.sin(p*Math.PI)); cx.lineWidth=7;
      cx.beginPath();cx.moveTo(x-s,cy-s*0.7);cx.lineTo(x,cy);cx.lineTo(x+s,cy-s*0.7);cx.stroke(); }
  } else if(m==='impact'){ // boxe : cible d'impact pulsante devant le buste
    const cxp=(minX+maxX)/2, cyp=minY+(maxY-minY)*0.30, r=W*0.05*(1+0.25*Math.sin(now/220));
    cx.globalAlpha=base*0.8; cx.lineWidth=5;
    cx.beginPath();cx.arc(cxp,cyp,r,0,7);cx.stroke();
    cx.globalAlpha=base*0.5; cx.beginPath();cx.arc(cxp,cyp,r*1.7,0,7);cx.stroke();
    cx.globalAlpha=base; cx.beginPath();cx.arc(cxp,cyp,W*0.012,0,7);cx.fill();
  } else { // tenue : anneau qui respire autour du centre
    const cxp=(minX+maxX)/2, cyp=(minY+maxY)/2, r=Math.max(maxX-minX,maxY-minY)*0.5*(1+0.06*Math.sin(now/600));
    cx.globalAlpha=base*0.5; cx.lineWidth=5; cx.setLineDash([W*0.03,W*0.03]);
    cx.beginPath();cx.arc(cxp,cyp,r,0,7);cx.stroke();
  }
  cx.restore();
}
// score d'alignement (0..1) : compare la FORME de ta posture à la silhouette,
// invariant en position ET en taille. Tu n'as donc pas à te placer pile où la
// silhouette est dessinée : il suffit d'adopter la bonne POSTURE, n'importe où
// dans le cadre. Tous les points clés doivent être visibles (anti "à peine dans
// le cadre"). La tolérance (ALIGN_TOL) est réglable.
const ALIGN_TOL=0.95; // + grand = plus permissif (réglable)
function alignScore(P,exId){
  const g=GUIDES[exId]; if(!g)return 0;
  const ids=Object.keys(g).map(Number).filter(i=>i!==0);
  const pts=[],gpts=[];
  for(const i of ids){ // on juge la posture sur les points VISIBLES (robuste : hanches/chevilles souvent hors champ de face au sol)
    if(P[i]&&(P[i].visibility===undefined||P[i].visibility>=0.4)){ pts.push([P[i].x,P[i].y]);gpts.push(g[i]); }
  }
  const n=pts.length; if(n<5)return 0;
  const cen=a=>{let sx=0,sy=0;for(const p of a){sx+=p[0];sy+=p[1];}return[sx/a.length,sy/a.length];};
  const [pcx,pcy]=cen(pts),[gcx,gcy]=cen(gpts);
  const pc=pts.map(p=>[p[0]-pcx,p[1]-pcy]),gc=gpts.map(p=>[p[0]-gcx,p[1]-gcy]);
  const rms=a=>{let s=0;for(const p of a)s+=p[0]*p[0]+p[1]*p[1];return Math.sqrt(s/a.length)||1e-6;};
  const ps=rms(pc),gs2=rms(gc);
  let sum=0;
  for(let i=0;i<n;i++){const dx=pc[i][0]/ps-gc[i][0]/gs2,dy=pc[i][1]/ps-gc[i][1]/gs2;sum+=Math.hypot(dx,dy);}
  return Math.max(0,Math.min(1,1-(sum/n)/ALIGN_TOL));
}
// Exercices "de face" : on n'exige PAS d'imiter pile la silhouette pour lancer le
// compte à rebours — il suffit de FAIRE FACE à la caméra (épaules visibles,
// horizontales et écartées = pas de profil) avec au moins une main dans le cadre.
const FRONT_START=['pushup','jab','punch2'];
function frontReady(P){
  const s1=P[11],s2=P[12];
  if(!s1||!s2)return 0;
  if(s1.visibility!==undefined&&(s1.visibility<0.5||s2.visibility<0.5))return 0;
  const sw=Math.abs(s1.x-s2.x), dy=Math.abs(s1.y-s2.y);
  if(sw<0.10)return 0;        // épaules trop rapprochées → de profil
  if(dy>sw*0.6)return 0;      // épaules pas horizontales → pas de face
  const hand=(P[15]&&(P[15].visibility===undefined||P[15].visibility>0.3))
          || (P[16]&&(P[16].visibility===undefined||P[16].visibility>0.3));
  return hand?1:0;
}
// boxe : de FACE ou de PROFIL — il suffit que le buste + un bras soient bien vus
function boxReady(P){
  const v=(i)=>P[i]&&(P[i].visibility===undefined||P[i].visibility>0.4);
  const sh=v(11)&&v(12), armL=v(13)&&v(15), armR=v(14)&&v(16);
  return sh&&(armL||armR)?1:0;
}

let lastVideoTime=-1,smoothForm=0;
const GROUND_EX=['pushup','plank','bridge','situp','climber']; // téléphone au sol → caméra arrière
async function startWorkout(exId, progStep){
  ensureWeek();ensureDay();
  // cooldown : plafond de sats atteint → aucune séance rémunérée avant expiration
  if(S.serverMode && S.token && earnLockLeft()>0){ toast(L().capLock(fmtDur(earnLockLeft()))); return; }
  S.ex=findEx(exId);S.engine=S.ex.make();S.combo=0;S.comboTier=0;S.sessionSats=0;
  S.phase='align';S.countdown=0;smoothLM=null;S.alignHold=0;S.cdStarted=false;
  // stats de séance (récap + coach) et mode guidé (séries × reps avec repos auto)
  S.sessionStart=Date.now();S.sessionReps=0;S.sessionPerfect=0;S.formSum=0;S.maxCombo=0;S.faults={};S.lastRepT=0;
  S.vel=[];S.velDrop=0;S.vbtBuf=[];S.lastRepT0=0;S.repForms=[]; // VBT + dispersion forme
  // fantôme : ton record perso sur CET exercice (offsets en ms des reps enregistrées)
  const ghosts=store.get('powghost',{});
  S.ghost=ghosts[exId]||null;S.ghostRec=[];S.ghostIdx=0;S.ghostBeaten=false;
  S.guided= progStep ? {perSet:progStep.reps||progStep.sec,sets:progStep.sets,cur:1,inSet:0,waiting:false,done:false}
    : (store.get('powguided',true)&&SET_BASE[exId]&&S.ex.unit!=='sec')
    ?{perSet:targetFor(exId),sets:3,cur:1,inSet:0,waiting:false,done:false}:null;
  setsHUD();
  ghostUI(); postureBtnUI();
  startServerSession(exId); // ouvre la séance notée serveur (si connecté + serverMode)
  if(S.serverMode && !S.token) toast(L().loginToEarn); // nudge : connexion requise pour gagner
  // respecte le choix de caméra mémorisé (défaut : frontale). Le bouton ⟳ le change.
  S.facing=store.get('powfacing', GROUND_EX.includes(exId)?'environment':'user');
  if(S.cal){const cp=$('calpanel');if(cp)cp.style.display='block';}
  setTheme(S.ex.sport.theme);
  $('wk-exname').textContent=S.ex.name[S.lang];
  $('wk-tip').textContent=S.ex.tip[S.lang];
  $('wk-unit').textContent=L()[S.ex.unit];
  $('wk-count').textContent=S.week.progress[exId]||0;
  $('session-sats').textContent='';$('combo-chip').className='combo-chip';$('align-meter').classList.remove('show');
  show('workout');
  const pill=$('statuspill');pill.textContent=L().loading;pill.classList.add('show');pill.classList.remove('big');
  try{
    await loadModel();
    pill.textContent=L().camOn;
    await startCamera();
    pill.classList.remove('show');
    S.running=true;requestAnimationFrame(loop);
  }catch(e){console.error(e);pill.textContent=L().camFail;pill.classList.add('show');}
}
function loop(now){
  if(!S.running)return;
  const v=$('video');
  if(v.currentTime!==lastVideoTime&&v.videoWidth){
    lastVideoTime=v.currentTime;
    const res=S.landmarker.detectForVideo(v,now);
    S.ctx.clearRect(0,0,S.ctx.canvas.width,S.ctx.canvas.height);
    if(res.landmarks&&res.landmarks[0]){
      const P=smoothLandmarks(res.landmarks[0]);
      if(S.phase==='align') phaseAlign(P,now);
      else { $('align-meter').classList.remove('show'); drawSkeleton(P);
        S.lastLandmarks=P; vbtTrack(P,now); ghostTick(); handle(S.engine.analyze(P,now)); }
    }else{
      if(S.phase==='align'){ drawGuide(S.ex.id,0); $('statuspill').textContent=L().coach.frame;
        $('statuspill').classList.add('show'); $('align-meter').classList.remove('show'); S.alignHold=0; S.cdStarted=false; }
      else coachMsg('lost');
    }
  }
  requestAnimationFrame(loop);
}
/* phase d'alignement : imiter la silhouette pour lancer le compte à rebours */
function phaseAlign(P,now){
  let a=alignScore(P,S.ex.id);
  // pour les exos "de face", être simplement face caméra suffit à armer le départ
  if(S.ex.id==='pushup') a=Math.max(a,frontReady(P));
  else if(S.ex.id==='jab'||S.ex.id==='punch2') a=Math.max(a,boxReady(P)); // boxe : arme le départ de face OU de profil
  if(S.cal)calRecord('align',{dbg:{align:+a.toFixed(2)},form:Math.round(a*100)});
  drawGuide(S.ex.id,a);
  drawSkeleton(P,0.55);
  const pill=$('statuspill'),meter=$('align-meter');
  // jauge d'alignement visible pendant toute la phase (sauf compte à rebours)
  meter.classList.add('show');
  $('align-fill').style.width=Math.round(a*100)+'%';
  $('align-lbl').textContent=a>=0.5?'✓':(Math.round(a*100)+'%');
  if(a>=0.5){
    S.alignHold=(S.alignHold||0)+1;
    if(S.alignHold===1) say(L().voice.getReady,{force:true});
    const need=16;
    if(S.alignHold>=need){
      meter.classList.remove('show');
      if(!S.cdStarted){ S.cdStarted=true; S.cdVal=3; S.cdNext=now; }
      if(now>=S.cdNext){
        if(S.cdVal>0){ pill.textContent=String(S.cdVal); pill.classList.add('show','big');
          say(String(S.cdVal),{force:true}); if(navigator.vibrate)navigator.vibrate(20); S.cdVal--; S.cdNext=now+800; }
        else { pill.classList.remove('show','big'); S.cdStarted=false;
          S.phase='live'; coachMsg(null); say(L().voice.start,{force:true});
          if(navigator.vibrate)navigator.vibrate([60,40,120]); }
      }
    } else { pill.textContent=L().alignHold; pill.classList.add('show'); pill.classList.remove('big'); }
  } else {
    S.alignHold=0; S.cdStarted=false;
    pill.textContent=L().alignPose; pill.classList.add('show'); pill.classList.remove('big');
  }
}
function drawSkeleton(P,alpha){
  if(!S.drawer||!MP)return; // modèle non chargé (CDN bloqué) → pas de squelette, mais pas de crash
  const c=getComputedStyle(document.body);
  S.ctx.save();S.ctx.globalAlpha=alpha||1;S.ctx.shadowColor=c.getPropertyValue('--acc');S.ctx.shadowBlur=12;
  S.drawer.drawConnectors(P,MP.PoseLandmarker.POSE_CONNECTIONS,{color:c.getPropertyValue('--acc').trim(),lineWidth:4});
  S.drawer.drawLandmarks(P,{color:c.getPropertyValue('--acc2').trim(),radius:4});
  S.ctx.restore();
}
function coachMsg(key){$('coachmsg').textContent=key?(L().coach[key]||key):'';}
function setRing(f){
  const r=$('ring'),C=194.8;
  if(f===null){r.style.strokeDashoffset=C;$('ring-num').textContent='—';return;}
  smoothForm=smoothForm*0.7+f*0.3;
  const s=Math.round(smoothForm);
  r.style.strokeDashoffset=C*(1-s/100);
  r.style.stroke=s>=perfectThreshold()?'var(--grn)':s>=60?'var(--acc)':'var(--hot)';
  $('ring-num').textContent=s;
}
/* ---- fautes de forme : comptées pour le récap/coach + cue vocal throttlé ---- */
let lastFaultVoice=0;
function addFault(k){
  if(!k)return;
  S.faults[k]=(S.faults[k]||0)+1;
  const now=Date.now(); if(now-lastFaultVoice<2500)return; lastFaultVoice=now;
  const V=L().voice;
  const line=k==='high'?V.tooHigh:k==='low'?V.tooLow:(L().coach[k]||'');
  if(line){ say(line,{force:true}); if(navigator.vibrate)navigator.vibrate(80); }
  if(L().coach[k])coachMsg(k);
}
function handle(r){
  setRing(r.form);if(r.msg)coachMsg(r.msg);
  if(r.fault)addFault(r.fault);                          // faute immédiate (boxe haut/bas, pompe partielle)
  if(r.rep){ if(r.repFault)addFault(r.repFault); onScore(r.repForm); } // faute diagnostiquée au point bas (valgus…)
  if(r.tick)onScore(r.tickForm);
  if(S.cal)calRecord('live',r);
}

/* =========================================================
   VBT (Velocity-Based Training) — vitesse concentrique par rep.
   On bufferise la position des repères (~3 s) ; à chaque rep, on calcule la
   vitesse ascendante max (hanches ; poignets pour la boxe). Si la dernière rep
   perd >20 % vs la meilleure de la séance → faute "fatigue" (cue vocal) + la
   perte part au coach IA dans le récap. Méthode utilisée par les pros. */
function vbtTrack(P,now){
  if(S.phase!=='live'||!S.ex||S.ex.unit==='sec')return;
  S.vbtBuf.push({t:now,y:avg(P[23].y,P[24].y),wx:avg(P[15].x,P[16].x),wy:avg(P[15].y,P[16].y)});
  if(S.vbtBuf.length>120)S.vbtBuf.shift();
}
function vbtOnRep(nowT){
  const boxing=S.ex.sport&&(S.ex.sport.id==='boxe'||S.ex.sport.id==='thai');
  const win=S.vbtBuf.filter(p=>p.t>=(S.lastRepT0||S.sessionStart)&&p.t<=nowT);
  S.lastRepT0=nowT;
  if(win.length<3)return null;
  let vmax=0;
  for(let i=1;i<win.length;i++){const dt=(win[i].t-win[i-1].t)/1000;if(dt<=0)continue;
    // boxe : vitesse du poing (magnitude) ; sinon : vitesse verticale ascendante des hanches
    const v=boxing?Math.hypot(win[i].wx-win[i-1].wx,win[i].wy-win[i-1].wy)/dt
                  :(win[i-1].y-win[i].y)/dt;
    vmax=Math.max(vmax,v);}
  S.vel.push(+vmax.toFixed(3));
  if(S.vel.length<4)return null;
  const best=Math.max(...S.vel.slice(0,-1)),last=S.vel[S.vel.length-1];
  if(best>0.05&&last<best*0.8){
    const drop=Math.round((1-last/best)*100);
    if(drop>(S.velDrop||0))S.velDrop=drop;
    return drop;
  }
  return null;
}

/* =========================================================
   FANTÔME 👻 — ton record perso rejoué en direct (offsets ms des reps de ta
   meilleure séance sur cet exercice). 100 % local, zéro serveur. */
function ghostUI(){ const el=$('ghost-chip'); if(!el)return;
  el.style.display=(S.ghost&&S.ghost.offsets.length)?'block':'none';
  if(S.ghost)el.textContent=L().ghostL(0,0); }
function ghostTick(){
  if(!S.ghost||S.phase!=='live')return;
  const el=$('ghost-chip'); if(!el)return;
  const elapsed=Date.now()-S.sessionStart,off=S.ghost.offsets;
  while(S.ghostIdx<off.length&&off[S.ghostIdx]<=elapsed)S.ghostIdx++;
  el.textContent=L().ghostL(S.ghostIdx,S.sessionReps);
  if(!S.ghostBeaten&&S.sessionReps>off.length&&off.length>0){
    S.ghostBeaten=true; say(L().voice.ghostBeat,{force:true}); toast('👻🔥 '+L().ghostBeat); }
}
function ghostSave(exId,reps){
  if(reps<3||!S.ghostRec.length)return;
  const ghosts=store.get('powghost',{}),prev=ghosts[exId];
  if(prev&&prev.reps>=reps)return; // seulement si nouveau record
  ghosts[exId]={reps,offsets:S.ghostRec.slice(0,2000)}; store.set('powghost',ghosts);
}

/* =========================================================
   CALIBRAGE — enregistre les mesures brutes du mouvement pour réglage précis.
   Activé en ouvrant l'app avec ?cal=1. Un panneau montre les valeurs en direct
   et un bouton copie tout le journal (JSON) à coller au dev pour caler les seuils.
   ========================================================= */
const calLog=[];
function calRecord(ph,r){
  const d=r.dbg||{};
  const e={t:Date.now(),ph,ex:S.ex?S.ex.id:'',...d,form:(r.form==null?null:Math.round(r.form))};
  if(r.rep)e.REP=1;
  calLog.push(e); if(calLog.length>1500)calLog.shift();
  const el=$('calvals');
  if(el){ el.textContent=Object.entries(d).map(([k,v])=>k+':'+v).join(' ')
    +(r.form!=null?' form:'+Math.round(r.form):'')+' ·'+calLog.length; }
}
window.calCopy=async()=>{
  const payload={app:'powcoach',ex:S.ex?S.ex.id:'',facing:S.facing,n:calLog.length,log:calLog};
  try{ await navigator.clipboard.writeText(JSON.stringify(payload)); toast('📋 '+calLog.length+' mesures copiées'); }
  catch(e){ toast('Copie impossible'); }
};
window.calClear=()=>{ calLog.length=0; const el=$('calvals'); if(el)el.textContent='(vidé)'; toast('Mesures effacées'); };

/* =========================================================
   FAUCET — combos, plafond, paiement
   ========================================================= */
function comboSats(){
  let sats=CFG.SATS_PERFECT;
  for(const t of CFG.COMBO_TIERS) if(S.combo>=t.at) sats=t.sats;
  return sats;
}
function earn(sats){
  ensureDay();
  // mode serveur : le crédit réel est calculé/validé à la fin par le serveur.
  // Ici on ne fait qu'un retour VISUEL (estimation de séance), sans toucher au solde.
  if(S.serverMode){
    S.sessionSats+=sats;$('session-sats').textContent=L().sessionSats(S.sessionSats);
    return sats;
  }
  const grant=Math.min(sats,capLeft());
  if(grant>0){S.balance+=grant;S.day.earned+=grant;S.sessionSats+=grant;
    $('session-sats').textContent=L().sessionSats(S.sessionSats);
    persist();}
  if(grant<sats){coachMsg(null);$('coachmsg').textContent=L().capHit;say(L().voice.cap);}
  return grant;
}
function onScore(form){
  const id=S.ex.id,T=L(),nowT=Date.now();
  // journal de preuves pour le scoring serveur (le serveur recalcule les sats)
  if(S.wsToken && S.repLog.length<5000) S.repLog.push({t:nowT,form:Math.round(form)});
  const before=S.week.progress[id]||0;
  S.week.progress[id]=before+1;
  $('wk-count').textContent=S.week.progress[id];
  const perfect=form>=perfectThreshold();
  let gotSats=0;
  // stats de séance + tempo : une rep de force expédiée en <1,5 s = pas contrôlée
  S.sessionReps++;S.formSum+=form;if(perfect)S.sessionPerfect++;
  if(STRENGTH_RUSH.has(id)&&S.lastRepT&&nowT-S.lastRepT<1500)addFault('rushed');
  S.lastRepT=nowT;
  S.repForms.push(Math.round(form));
  if(S.ghostRec.length<2000)S.ghostRec.push(nowT-S.sessionStart); // trace fantôme
  if(S.ex.unit!=='sec'){ const drop=vbtOnRep(nowT); if(drop)addFault('fatigue'); } // VBT

  if(perfect){
    S.combo++;
    if(S.combo>S.maxCombo)S.maxCombo=S.combo;
    const sats=comboSats(),got=earn(sats);gotSats=got;
    if(got>0){satPop('+'+got+' ⚡',true);flash();}
    // palier de combo franchi ?
    const tier=CFG.COMBO_TIERS.filter(t=>S.combo>=t.at).length;
    if(tier>S.comboTier){S.comboTier=tier;showCombo(S.combo);say(T.voice.combo(S.combo),{force:true});
      if(navigator.vibrate)navigator.vibrate([40,50,40,50,90]);}
    else{say(T.voice.perfect);if(navigator.vibrate)navigator.vibrate(30);}
    const chip=$('combo-chip');chip.textContent=T.combo+' x'+S.combo;chip.className='combo-chip show';
  }else{
    if(S.combo>=(CFG.COMBO_TIERS[0]?.at||5)){
      const chip=$('combo-chip');chip.textContent=T.comboBroken;chip.className='combo-chip show broken';
      say(T.voice.comboBroken);setTimeout(()=>{chip.className='combo-chip';},1200);
    } else $('combo-chip').className='combo-chip';
    S.combo=0;S.comboTier=0;
    if(S.ex.unit!=='sec')satPop('+1',false);
  }
  // stats à vie + défis
  bumpStat(S.ex.sport.id,perfect,gotSats);
  bumpChallenges(id);
  // jalons vocaux (toutes les 10)
  if(S.week.progress[id]%10===0)say(T.voice.milestone(S.week.progress[id],S.ex.unit));
  // objectif hebdo
  if(before<S.ex.goal&&S.week.progress[id]>=S.ex.goal&&!S.claimed[id]){
    S.claimed[id]=true;
    const got=earn(CFG.SATS_WEEKLY_GOAL);
    satPop('🏆 +'+got+' ⚡',true);flash();
    $('coachmsg').textContent='🏆 '+T.voice.goal;
    say(T.voice.goal,{force:true});
    if(navigator.vibrate)navigator.vibrate([80,60,80,60,180]);
  }
  const bc=$('chip-balance');bc.classList.remove('bump');void bc.offsetWidth;bc.classList.add('bump');
  $('balance-val').textContent=S.balance;
  // séance guidée : fin de série → repos auto ; fin de dernière série → récap
  if(S.guided&&!S.guided.waiting&&!S.guided.done){
    const g=S.guided; g.inSet++; setsHUD();
    if(g.inSet>=g.perSet){
      if(g.cur<g.sets){ g.waiting=true; say(T.voice.setDone(g.cur),{force:true});
        if(navigator.vibrate)navigator.vibrate([80,60,80]); openRest(); startRest(S.program?S.program.rest:60); }
      else { g.done=true; say(T.voice.allDone,{force:true});
        setTimeout(()=>{ if(S.running)stopWorkout(); },1600); }
    }
  }
}
function bumpChallenges(exId){
  let changed=false;
  for(const c of S.challenges){
    if(c.done)continue;
    if(c.ex===exId||c.ex==='any'){ c.prog=(c.prog||0)+1; changed=true;
      if(c.prog>=c.target){ c.done=true; say(L().voice.goal,{force:true}); }
    }
  }
  if(changed)store.set('powchallenges',S.challenges);
}
function satPop(text,perfect){
  const el=document.createElement('div');el.className='satpop'+(perfect?' perfect':'');
  el.style.fontSize=perfect?'28px':'20px';
  el.style.left=(28+Math.random()*44)+'%';el.style.top=(34+Math.random()*22)+'%';
  el.textContent=text;
  document.querySelector('.cam-wrap').appendChild(el);
  setTimeout(()=>el.remove(),1600);
}
function flash(){const f=$('flash');f.classList.remove('on');void f.offsetWidth;f.classList.add('on');}
function showCombo(n){
  $('combo-x').textContent='x'+n;$('combo-t').textContent=L().combo;
  const c=$('combo');c.classList.remove('show');void c.offsetWidth;c.classList.add('show');
}
window.stopWorkout=()=>{S.running=false;S.phase='align';S.cdStarted=false;speechSynthesis.cancel();
  $('align-meter').classList.remove('show');$('statuspill').classList.remove('show','big');
  const v=$('video');if(v.srcObject)v.srcObject.getTracks().forEach(t=>t.stop());
  v.srcObject=null;
  // arrêt MANUEL en plein programme IA (pas une fin de série guidée) → on l'abandonne
  if(S.program&&!(S.guided&&S.guided.done))S.program=null;
  const sum=finishSummary();                       // récap + ajustement de la cible
  submitServerSession();goHome();
  if(sum)showWorkoutSummary(sum);};

/* =========================================================
   COACH — progression adaptative, séances guidées, récap, IA
   ========================================================= */
// taille de série de départ par exercice (reps/hits) — les tenues (sec) restent libres
const SET_BASE={squat:12,pushup:10,lunge:10,bridge:12,jsquat:8,knee:20,jab:30,punch2:30,jacks:30,burpee:8,situp:12,climber:20};
// exercices de force où une rep < 1,5 s est forcément expédiée
const STRENGTH_RUSH=new Set(['squat','jsquat','lunge','pushup','bridge']);
function targetFor(exId){ const t=store.get('powtargets',{});
  return Math.max(5,Math.min(100,parseInt(t[exId],10)||SET_BASE[exId]||12)); }
/* surcharge progressive : ≥70 % de parfaits et volume atteint → +10 % ;
   <40 % de parfaits → -10 % (la qualité prime sur le volume) */
function adjustTarget(sum){
  if(!SET_BASE[sum.ex]||sum.reps<5)return;
  const pct=Math.round(sum.perfect/sum.reps*100);
  const t=store.get('powtargets',{}),cur=targetFor(sum.ex);let next=cur;
  if(pct>=70&&sum.reps>=cur)next=Math.min(100,Math.ceil(cur*1.1));
  else if(pct<40)next=Math.max(5,Math.floor(cur*0.9));
  if(next!==cur){t[sum.ex]=next;store.set('powtargets',t);}
}
function setsHUD(){ const el=$('wk-sets'); if(!el)return;
  const g=S.guided; el.textContent=g?L().setsFmt(g.cur,g.sets,g.inSet,g.perSet):''; }
function guidedResume(){ const g=S.guided; if(!g||!g.waiting)return;
  g.waiting=false; g.cur++; g.inSet=0; setsHUD(); say(L().voice.setGo(g.cur),{force:true}); }
window.setGuided=(v)=>{ store.set('powguided',!!v); renderGuided(); };
function renderGuided(){ const seg=$('guided-seg'); if(!seg)return;
  const T=L(),on=store.get('powguided',true);
  const gl=$('guided-label'); if(gl)gl.textContent=T.guidedTag;
  const pb=$('plan-btn'); if(pb)pb.textContent=T.planBtn;
  seg.innerHTML=`<button class="${on?'on':''}" onclick="setGuided(true)">${T.guidedL}</button>`+
    `<button class="${on?'':'on'}" onclick="setGuided(false)">${T.freeL}</button>`; }
function finishSummary(){
  if(!S.ex||S.sessionReps<1)return null;
  const forms=S.repForms.slice().sort((a,b)=>a-b);
  const sum={ t:Date.now(), ex:S.ex.id, reps:S.sessionReps, perfect:S.sessionPerfect,
    avgForm:Math.round(S.formSum/Math.max(1,S.sessionReps)),
    durMin:Math.max(1,Math.round((Date.now()-S.sessionStart)/60000)),
    maxCombo:S.maxCombo, target:S.guided?S.guided.perSet:0, sats:S.sessionSats, faults:{...S.faults},
    velDrop:S.velDrop||0, // VBT : perte de vitesse max sur la séance (%)
    formMin:forms.length?forms[0]:0, formMax:forms.length?forms[forms.length-1]:0 };
  ghostSave(S.ex.id,S.sessionReps); // record perso éventuel → futur fantôme
  const l=store.get('powsessions',[]); l.unshift(sum); store.set('powsessions',l.slice(0,50));
  adjustTarget(sum);
  return sum;
}
function showWorkoutSummary(sum){
  const T=L(),ex=findEx(sum.ex);
  $('ws-title').textContent=T.wsTitle;
  $('ws-ex').textContent=ex?ex.em+' '+ex.name[S.lang]:sum.ex;
  $('ws-reps').textContent=sum.reps; $('ws-reps-l').textContent=T[(ex&&ex.unit)||'reps'];
  const pct=sum.reps?Math.round(sum.perfect/sum.reps*100):0;
  $('ws-perfect').textContent=pct+'%'; $('ws-perfect-l').textContent=T.wsPerfectL;
  $('ws-form').textContent=sum.avgForm; $('ws-form-l').textContent=T.wsForm;
  $('ws-combo').textContent='×'+sum.maxCombo; $('ws-combo-l').textContent=T.wsCombo;
  $('ws-dur').textContent=sum.durMin; $('ws-dur-l').textContent=T.wsDur;
  $('ws-sats').textContent='⚡'+sum.sats;
  const fw=$('ws-faults'),top=Object.entries(sum.faults||{}).sort((a,b)=>b[1]-a[1]).slice(0,2);
  fw.innerHTML= top.length
    ? `<div class="ws-faults-t">${T.wsFaults}</div>`+top.map(([k,n])=>
        `<div class="ws-fault"><span>${T.faultL[k]||k} <b>×${n}</b></span><small>${T.coach[k]||''}</small></div>`).join('')
    : `<p class="hint" style="text-align:center;margin:8px 0">${T.wsNoFaults}</p>`;
  let nextTxt=SET_BASE[sum.ex]?T.wsNext(targetFor(sum.ex)):'';
  if(sum.velDrop>0)nextTxt+=(nextTxt?'\n':'')+T.wsVel(sum.velDrop);
  $('ws-next').textContent=nextTxt;
  const ai=$('ws-ai');
  if(S.coachOn){ ai.style.display='block'; $('ws-ai-t').textContent=T.aiTitle;
    $('ws-ai-text').textContent=S.token?T.aiLoading:T.aiLogin;
    if(S.token)fetchDebrief(sum);
  } else ai.style.display='none';
  // mode programme (séance générée par l'IA) : le bouton devient "Suivant ▶"
  const closeB=$('ws-close'),prog=S.program;
  if(prog&&prog.idx<prog.steps.length-1){
    const nx=prog.steps[prog.idx+1],nEx=findEx(nx.exId);
    closeB.textContent='▶ '+T.progNext(nEx?nEx.name[S.lang]:nx.exId)+' ('+T.progStep(prog.idx+2,prog.steps.length)+')';
    closeB.onclick=()=>{ closeModal('modal-wksummary'); programNext(); };
  } else {
    if(prog){ closeB.textContent='🏁 '+T.progDone; toast(T.progDone); S.program=null; }
    else closeB.textContent=T.close;
    closeB.onclick=()=>closeModal('modal-wksummary');
  }
  $('modal-wksummary').classList.add('show');
}
/* ---- programme d'entraînement généré par l'IA (enchaînement d'exercices) ---- */
function startProgram(plan){
  S.program={titre:plan.titre,steps:plan.exercices.map(e=>({exId:e.ex,sets:e.series,reps:e.reps,sec:e.sec})),idx:0,rest:plan.repos||60};
  const st=S.program.steps[0];
  toast('🧠 '+plan.titre+' — '+T.progStep(1,S.program.steps.length));
  startWorkout(st.exId,{reps:st.reps,sec:st.sec,sets:st.sets});
}
window.programNext=()=>{
  const prog=S.program; if(!prog)return;
  prog.idx++; const st=prog.steps[prog.idx];
  startWorkout(st.exId,{reps:st.reps,sec:st.sec,sets:st.sets});
};
/* ---------- coach IA : streaming, personas, séances générées, posture ---------- */
window.setPersona=(p)=>{ S.persona=p; store.set('powpersona',p); renderPersona();
  store.set('powplan',null); }; // invalide le cache plan (le ton change)
function renderPersona(){ const seg=$('persona-seg'); if(!seg)return;
  const T=L(),names={coach:T.personaCoach,drill:T.personaDrill,zen:T.personaZen,nerd:T.personaNerd};
  const pl=$('persona-label'); if(pl)pl.textContent=T.personaL;
  seg.innerHTML=Object.keys(names).map(p=>
    `<button class="${S.persona===p?'on':''}" onclick="setPersona('${p}')">${names[p]}</button>`).join('');
}
/* Ratio de charge ACWR (sport-science) : moyenne 7 j vs 28 j d'après l'historique
   de reps. >150 = montée en charge trop rapide → le coach allège. */
function computeAcwr(){
  const st=ensureStats();let acute=0,chronic=0;
  for(let i=0;i<28;i++){const d=new Date(Date.now()-i*864e5).toISOString().slice(0,10);
    const v=st.hist[d]||0; if(i<7)acute+=v; chronic+=v;}
  const c=chronic/28; return c>0?Math.round((acute/7)/c*100):null;
}
/* Appel /coach/advise en STREAMING SSE (repli JSON si le serveur ne stream pas).
   onDelta(texte, done) est appelé à chaque morceau → le texte s'écrit en direct. */
async function streamAdvise(payload,onDelta){
  const r=await fetch(API()+'/coach/advise',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...payload,stream:true})});
  const ct=r.headers.get('Content-Type')||'';
  if(!r.ok||!ct.includes('event-stream')){
    const d=await r.json().catch(()=>({}));
    onDelta(d.text||d.error||'—',true); return;
  }
  const rd=r.body.getReader(),dec=new TextDecoder();
  let acc='',buf='';
  for(;;){
    const{done,value}=await rd.read(); if(done)break;
    buf+=dec.decode(value,{stream:true});
    let i; while((i=buf.indexOf('\n'))>=0){
      const line=buf.slice(0,i).trim(); buf=buf.slice(i+1);
      if(line.indexOf('data:')!==0)continue;
      const data=line.slice(5).trim();
      if(data==='[DONE]')continue;
      try{ const j=JSON.parse(data);
        const d=j.choices&&j.choices[0]&&j.choices[0].delta&&j.choices[0].delta.content;
        if(d){ acc+=d; onDelta(acc,false); } }catch(e){}
    }
  }
  onDelta(acc||'—',true);
}
async function fetchDebrief(sum){
  const el=$('ws-ai-text');
  try{
    const hist=store.get('powsessions',[]).slice(1,6)
      .map(s=>({...s,daysAgo:Math.max(0,Math.round((Date.now()-s.t)/864e5))}));
    await streamAdvise({token:S.token,type:'debrief',lang:S.lang,persona:S.persona,
      data:{last:{...sum,daysAgo:0},history:hist}},(txt)=>{ el.textContent=txt; });
  }catch(e){ el.textContent='—'; }
}
window.openPlan=async()=>{
  const T=L();
  if(!S.token){ toast(T.aiLogin); openAccount(); return; }
  $('plan-title').textContent=T.planTitle; $('plan-close').textContent=T.close;
  renderPersona(); renderSessionCard(null);
  const sb=$('sess-btn'); if(sb){ sb.textContent=T.sessBtn; sb.disabled=false; }
  const box=$('plan-text'),cached=store.get('powplan',null);
  $('modal-plan').classList.add('show');
  if(cached&&cached.week===weekId()&&cached.lang===S.lang&&cached.persona===S.persona){ box.textContent=cached.text; return; }
  box.textContent=T.planLoading;
  try{
    ensureWeek();
    const progress=SPORTS.flatMap(s=>s.ex).map(e=>({ex:e.id,done:S.week.progress[e.id]||0,goal:e.goal}));
    progress.push({ex:'run',done:Math.round((S.week.runKm||0)*10),goal:200}); // ticks de 100 m
    await streamAdvise({token:S.token,type:'plan',lang:S.lang,persona:S.persona,
      data:{progress,streak:ensureStats().streak,acwr:computeAcwr()}},(txt,done)=>{
      box.textContent=txt;
      if(done&&txt&&txt!=='—')store.set('powplan',{week:weekId(),lang:S.lang,persona:S.persona,text:txt});
    });
  }catch(e){ box.textContent='—'; }
};
/* ---- séance générée par l'IA → carte cliquable exécutable en mode guidé ---- */
function renderSessionCard(plan){
  const box=$('sess-card'); if(!box)return;
  if(!plan){ box.innerHTML=''; box.style.display='none'; return; }
  const T=L();
  box.style.display='block';
  box.innerHTML=`<div class="sess-title">${esc(plan.titre)}</div>`+
    plan.exercices.map(e=>{ const x=findEx(e.ex); const n=x?x.em+' '+x.name[S.lang]:e.ex;
      const dose=e.sec?e.sec+' '+T.sec:e.reps+' '+T.reps;
      return `<div class="sess-row"><span>${n}</span><b>${e.series} × ${dose}</b></div>`; }).join('')+
    `<div class="sess-rest">⏱ ${T.sessRest} ${plan.repos}s</div>`+
    `<button class="btn-acc" style="width:100%" onclick="launchSession()">${T.sessLaunch}</button>`;
  S.pendingSession=plan;
}
window.genSession=async()=>{
  const T=L(),sb=$('sess-btn');
  sb.disabled=true; sb.textContent=T.sessLoading;
  try{
    ensureWeek();
    const progress=SPORTS.flatMap(s=>s.ex).map(e=>({ex:e.id,done:S.week.progress[e.id]||0,goal:e.goal}));
    progress.push({ex:'run',done:Math.round((S.week.runKm||0)*10),goal:200});
    const r=await fetch(API()+'/coach/advise',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({token:S.token,type:'session',lang:S.lang,persona:S.persona,
        data:{progress,streak:ensureStats().streak,acwr:computeAcwr()}})});
    const d=await r.json();
    if(d.plan){ renderSessionCard(d.plan); sb.textContent=T.sessAgain; }
    else { toast(d.error||'—'); sb.textContent=T.sessBtn; }
  }catch(e){ toast('—'); sb.textContent=T.sessBtn; }
  sb.disabled=false;
};
window.launchSession=()=>{
  if(!S.pendingSession)return;
  closeModal('modal-plan');
  startProgram(S.pendingSession);
  S.pendingSession=null;
};

/* ---- photo posture : visage PIXELISÉ sur l'appareil (landmarks tête), jamais
   envoyé. Seule l'image floutée part au modèle vision (KIMI_VISION_MODEL). ---- */
function postureBtnUI(){ const b=$('btn-posture'); if(!b)return;
  b.style.display=(S.coachOn)?'inline-block':'none'; }
window.postureSnap=async()=>{
  const T=L();
  if(!S.running||S.phase!=='live'||!S.lastLandmarks){ toast(T.postureStart); return; }
  if(!S.token){ toast(T.aiLogin); openAccount(); return; }
  const v=$('video'); if(!v.videoWidth)return;
  const c=document.createElement('canvas');
  c.width=Math.min(640,v.videoWidth); c.height=Math.round(c.width*v.videoHeight/v.videoWidth);
  const x=c.getContext('2d'); x.drawImage(v,0,0,c.width,c.height);
  blurFaceRegion(x,c,S.lastLandmarks);
  const img=c.toDataURL('image/jpeg',0.72);
  $('po-img').src=img; $('po-text').textContent=T.postureLoading;
  $('po-privacy').textContent=T.posturePrivacy;
  $('modal-posture').classList.add('show');
  try{
    const r=await fetch(API()+'/coach/advise',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({token:S.token,type:'posture',lang:S.lang,persona:S.persona,
        data:{ex:S.ex.id,image:img}})});
    const d=await r.json();
    $('po-text').textContent=d.text||d.error||'—';
  }catch(e){ $('po-text').textContent='—'; }
};
/* Pixelise la zone tête (nez + oreilles, marge généreuse) sur le canvas. */
function blurFaceRegion(x,c,P){
  const nose=P[0]; if(!nose)return;
  const W=c.width,H=c.height;
  const ear=(P[7]&&P[8])?Math.abs(P[7].x-P[8].x)*W:W*0.18;
  const r=Math.max(W*0.09,ear*1.6);
  const cx=nose.x*W,cy=nose.y*H-r*0.35;
  // pixelisation : downscale ×12 puis upscale sans lissage → illisible
  const t=document.createElement('canvas'); t.width=t.height=12;
  t.getContext('2d').drawImage(c,Math.max(0,cx-r),Math.max(0,cy-r),r*2,r*2,0,0,12,12);
  x.save(); x.beginPath(); x.arc(cx,cy,r,0,7); x.clip();
  x.imageSmoothingEnabled=false;
  x.drawImage(t,0,0,12,12,cx-r,cy-r,r*2,r*2);
  x.restore();
}
// le coach IA est-il configuré côté serveur ? (KIMI_API_KEY) → affiche le bouton plan
async function checkCoach(){
  try{ const d=await (await fetch(API()+'/coach/advise')).json(); S.coachOn=!!d.enabled; }
  catch(e){ S.coachOn=false; }
  const b=$('plan-btn'); if(b)b.style.display=S.coachOn?'block':'none';
}

/* =========================================================
   COURSE & MARCHE — GPS + carte OpenStreetMap (Leaflet, open-source)
   Récompense par distance : 1 « tick » tous les 100 m parcourus (validés),
   rejoué et RE-VALIDÉ côté serveur (intervalle mini 20 s / 100 m = anti-triche
   véhicule/GPS). La course paie naturellement plus que la marche (ticks plus
   fréquents → combos). Cardio via Web Bluetooth (ceinture/bracelet BLE standard).
   ========================================================= */
const R={map:null,tile:null,poly:null,marker:null,startMark:null,finishMark:null,running:false,follow:true,
  pts:[],trk:[],segLayers:[],kmPins:[],dist:0,tickedDist:0,combo:0,sats:0,speedEMA:0,lastPt:null,lastT:0,lastKm:0,
  sm:null,movingMs:0,splits:[],lastSplitMs:0,kcal:0,hrSum:0,hrN:0,hrMax:0,
  startTs:0,elapsed:0,watchId:null,timer:null,hr:null,hrDevice:null,lastRun:null};
const RUN_KM_GOAL=20;                       // km/semaine → bonus hebdo (comme les reps)
function runWeight(){ return Math.max(30,Math.min(200,parseInt(store.get('powweight',70),10)||70)); }
function runAge(){ return Math.max(10,Math.min(99,parseInt(store.get('powage',30),10)||30)); }

/* ---- Wake Lock : garder l'écran allumé pendant la course ---- */
let wakeLock=null;
async function acquireWake(){ try{ if('wakeLock' in navigator) wakeLock=await navigator.wakeLock.request('screen'); }catch(e){} }
function releaseWake(){ try{ wakeLock&&wakeLock.release(); }catch(e){} wakeLock=null; }
document.addEventListener('visibilitychange',()=>{ if(R.running && document.visibilityState==='visible') acquireWake(); });

/* ---- couleur du tracé selon l'allure (bleu marche → rouge sprint) ---- */
const TRACE_COLORS=['#00D4FF','#3DFFA0','#B8FF29','#FFC531','#FF6B00'];
function paceIdx(mps){ return mps<1.4?0:mps<2.2?1:mps<3.3?2:mps<4.2?3:4; }
function paceColor(mps){ return TRACE_COLORS[paceIdx(mps)]; }
/* Anonymise un tracé GPS → forme RELATIVE (0..1), nord en haut, proportions
   réelles, SANS aucune coordonnée. Rogne ~100 m au départ ET à l'arrivée
   (zone de confidentialité anti-"maison au point de départ"). Décime à ≤150 pts.
   Sortie : [[x,y,idxAllure],…] — impossible d'en déduire un lieu. */
function anonymizeTrack(trk){
  if(!trk||trk.length<2)return [];
  const la0=trk[0].la, ln0=trk[0].ln, mLng=Math.cos(la0*Math.PI/180)*111320, mLat=110540;
  const pts=trk.map(p=>({x:(p.ln-ln0)*mLng, y:(p.la-la0)*mLat, c:paceIdx(p.v||0)}));
  let cum=0; const cd=[0];
  for(let i=1;i<pts.length;i++){ cum+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y); cd.push(cum); }
  const total=cum, TRIM=100; let kept=pts;
  if(total>4*TRIM) kept=pts.filter((p,i)=>cd[i]>=TRIM && cd[i]<=total-TRIM);
  if(kept.length<2) kept=pts;
  let minx=Infinity,miny=Infinity,maxx=-Infinity,maxy=-Infinity;
  for(const p of kept){ if(p.x<minx)minx=p.x; if(p.x>maxx)maxx=p.x; if(p.y<miny)miny=p.y; if(p.y>maxy)maxy=p.y; }
  const scale=Math.max(1e-6,Math.max(maxx-minx,maxy-miny));
  const step=Math.max(1,Math.ceil(kept.length/150)), out=[];
  const enc=p=>[ +((p.x-minx)/scale).toFixed(3), +((maxy-p.y)/scale).toFixed(3), p.c ]; // flip Y = nord en haut
  for(let i=0;i<kept.length;i+=step) out.push(enc(kept[i]));
  out.push(enc(kept[kept.length-1]));
  return out;
}
/* Dessine un tracé normalisé [[x,y,c],…] dans une boîte, colorié par allure. */
function drawTrace(ctx, track, x0,y0,w,h, lw){
  if(!track||track.length<2)return;
  let minx=1,miny=1,maxx=0,maxy=0;
  for(const p of track){ if(p[0]<minx)minx=p[0]; if(p[0]>maxx)maxx=p[0]; if(p[1]<miny)miny=p[1]; if(p[1]>maxy)maxy=p[1]; }
  const bw=Math.max(1e-6,maxx-minx), bh=Math.max(1e-6,maxy-miny), pad=0.12;
  const sc=Math.min(w*(1-pad)/bw, h*(1-pad)/bh);
  const ox=x0+(w-bw*sc)/2-minx*sc, oy=y0+(h-bh*sc)/2-miny*sc;
  ctx.lineWidth=lw||6; ctx.lineCap='round'; ctx.lineJoin='round';
  for(let i=1;i<track.length;i++){ const a=track[i-1],b=track[i];
    ctx.strokeStyle=TRACE_COLORS[b[2]||1];
    ctx.beginPath(); ctx.moveTo(ox+a[0]*sc,oy+a[1]*sc); ctx.lineTo(ox+b[0]*sc,oy+b[1]*sc); ctx.stroke(); }
  // point de départ (vert) + arrivée (rouge)
  ctx.fillStyle='#3DFFA0'; ctx.beginPath(); ctx.arc(ox+track[0][0]*sc,oy+track[0][1]*sc,(lw||6)*1.1,0,7); ctx.fill();
  const e=track[track.length-1]; ctx.fillStyle='#FF2244'; ctx.beginPath(); ctx.arc(ox+e[0]*sc,oy+e[1]*sc,(lw||6)*1.1,0,7); ctx.fill();
}
/* ---- zone de fréquence cardiaque (Karvonen simplifié, FCmax=220-âge) ---- */
function hrZone(hr){ const p=hr/(220-runAge());
  if(p<0.6)return{c:'#8A8A99',z:'Z1'}; if(p<0.7)return{c:'#00D4FF',z:'Z2'};
  if(p<0.8)return{c:'#3DFFA0',z:'Z3'}; if(p<0.9)return{c:'#FFC531',z:'Z4'}; return{c:'#FF2244',z:'Z5'}; }
function hrUI(hr){ const el=$('run-hr'); if(!el)return; const z=hrZone(hr);
  el.className='run-hr'; el.style.color=z.c; $('run-hr-val').textContent=hr+' bpm · '+z.z; }

function haversine(a,b){const E=6371000,r=Math.PI/180;
  const dLat=(b.lat-a.lat)*r,dLon=(b.lng-a.lng)*r,la1=a.lat*r,la2=b.lat*r;
  const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2*E*Math.asin(Math.min(1,Math.sqrt(h)));}
function fmtPace(mps){if(!mps||mps<0.4)return '—';const spk=1000/mps;
  return Math.floor(spk/60)+':'+String(Math.round(spk%60)).padStart(2,'0');}
function fmtPaceSpk(spk){if(!spk||spk<=0||!isFinite(spk))return '—';
  return Math.floor(spk/60)+':'+String(Math.round(spk%60)).padStart(2,'0');}
function fmtRunDur(ms){const s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),ss=s%60;
  return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(ss).padStart(2,'0');}
function comboSatsFor(n){let s=CFG.SATS_PERFECT;for(const t of CFG.COMBO_TIERS)if(n>=t.at)s=t.sats;return s;}

/* ⚠ Dans ce module, `L` est le helper i18n (const L=()=>I18N[...]) qui MASQUE le
   global Leaflet. On passe donc par `window.L` (alias LF) pour toute la carto. */
const LF=()=>window.L;
function runInitMap(){
  if(R.map||!LF())return;
  R.map=LF().map('run-map',{zoomControl:true,attributionControl:true}).setView([48.8566,2.3522],13);
  // fond sombre (CARTO dark) assorti au thème néon ; données © OpenStreetMap
  R.tile=LF().tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    {maxZoom:19,subdomains:'abcd',attribution:'© OpenStreetMap © CARTO'}).addTo(R.map);
  R.map.on('dragstart',()=>{R.follow=false;});
}
function runClearMap(){
  if(!R.map)return;
  if(R.poly){R.map.removeLayer(R.poly);R.poly=null;}
  R.segLayers.forEach(l=>R.map.removeLayer(l)); R.segLayers=[];
  R.kmPins.forEach(l=>R.map.removeLayer(l)); R.kmPins=[];
  if(R.startMark){R.map.removeLayer(R.startMark);R.startMark=null;}
  if(R.finishMark){R.map.removeLayer(R.finishMark);R.finishMark=null;}
}
function runMarker(lat,lng,center){
  if(!R.map)return;
  if(!R.marker)R.marker=LF().circleMarker([lat,lng],{radius:7,color:'#fff',weight:3,fillColor:'#3DFFA0',fillOpacity:1}).addTo(R.map);
  else R.marker.setLatLng([lat,lng]);
  if(center)R.map.setView([lat,lng],16);
}
function runStatUI(){
  const T=L().run,mps=R.speedEMA||0;
  $('run-dist').textContent=(R.dist/1000).toFixed(2);
  $('run-time').textContent=fmtRunDur(R.running?R.movingMs:R.elapsed);   // temps EN MOUVEMENT (chrono figé à l'arrêt)
  $('run-pace').textContent=fmtPace(mps);
  const chip=$('run-modechip'),em=$('run-mode-em'),lab=$('run-mode-l');
  if(!R.running){chip.className='run-mode';em.textContent='🏁';lab.textContent=T.ready;}
  else if(mps<0.6){chip.className='run-mode';em.textContent='⏸';lab.textContent=T.paused;}
  else if(mps>=2.2){chip.className='run-mode run';em.textContent='🏃';lab.textContent=T.running;}
  else{chip.className='run-mode walk';em.textContent='🚶';lab.textContent=T.walking;}
}
/* 1 tick = 100 m. COURSE (form 100) → combos ; MARCHE (form 80 < seuil) → base,
   pas de combo. Le serveur applique la même règle (seuil 92) → marche paie moins. */
function runTick(running){
  const form=running?100:80;
  if(S.wsToken && S.repLog.length<5000) S.repLog.push({t:Date.now(),form});
  let sats;
  if(running){ R.combo++; sats=comboSatsFor(R.combo); }
  else { R.combo=0; sats=CFG.SATS_PERFECT; }
  if(S.serverMode){ S.sessionSats+=sats; }
  else { const g=Math.min(sats,capLeft()); if(g>0){S.balance+=g;S.day.earned+=g;persist();} sats=g; }
  R.sats+=sats;
  bumpStat('running',running,sats);
  $('run-sats').textContent='⚡'+R.sats;
  $('balance-val').textContent=S.balance;
}
function checkRunGoal(){
  ensureWeek();
  if((S.week.runKm||0)>=RUN_KM_GOAL && !S.claimed['runkm']){
    S.claimed['runkm']=true; persist();
    const got=earn(CFG.SATS_WEEKLY_GOAL); R.sats+=got; $('run-sats').textContent='⚡'+R.sats;
    toast('🏆 +'+got+' ⚡ '+L().run.kmGoal); say(L().voice.goal,{force:true});
    if(navigator.vibrate)navigator.vibrate([80,60,80,60,180]);
  }
}
function onRunPos(pos){
  const c=pos.coords,pill=$('run-gpspill'),T=L().run;
  if(c.accuracy>40){ pill.textContent=T.gpsWeak; pill.className='run-gpspill warn'; return; }
  const now=pos.timestamp||Date.now();
  // lissage de position (EMA) → réduit le zigzag GPS qui gonfle la distance
  if(!R.sm) R.sm={lat:c.latitude,lng:c.longitude};
  else { R.sm.lat+=0.4*(c.latitude-R.sm.lat); R.sm.lng+=0.4*(c.longitude-R.sm.lng); }
  const pt={lat:R.sm.lat,lng:R.sm.lng};
  pill.textContent=T.gpsOk; pill.className='run-gpspill ok';
  if(!R.lastPt){
    R.lastPt=pt; R.lastT=now;
    if(R.map){ R.startMark=LF().circleMarker([pt.lat,pt.lng],{radius:8,color:'#fff',weight:3,fillColor:'#3DFFA0',fillOpacity:1}).addTo(R.map); R.map.setView([pt.lat,pt.lng],17); }
    runMarker(pt.lat,pt.lng,false); return;
  }
  const dt=(now-R.lastT)/1000; if(dt<=0)return;
  const d=haversine(R.lastPt,pt);
  let mps=(typeof c.speed==='number'&&c.speed>=0)?c.speed:d/dt;
  if(mps>8.33){ R.lastPt=pt; R.lastT=now; return; }          // >30 km/h → saut GPS / véhicule
  R.speedEMA=R.speedEMA?R.speedEMA*0.7+mps*0.3:mps;
  // quasi immobile OU déplacement sous le bruit GPS → ignoré (chrono figé, pas de distance)
  if(mps<0.6 || d<Math.max(1,c.accuracy*0.3)){ R.lastPt=pt; R.lastT=now; runStatUI(); return; }
  const running=R.speedEMA>=2.2;
  R.movingMs+=dt*1000;                                        // temps EN MOUVEMENT seulement
  R.dist+=d;
  if(R.trk.length<6000) R.trk.push({la:pt.lat,ln:pt.lng,v:R.speedEMA}); // pour le tracé (anonymisé au save)
  R.kcal+=runWeight()*(d/1000)*(running?0.95:0.5);           // kcal ≈ poids × km × facteur
  S.week.runKm=(S.week.runKm||0)+d/1000;                     // objectif hebdo course
  // tracé coloré par allure
  if(R.map){ const seg=LF().polyline([[R.lastPt.lat,R.lastPt.lng],[pt.lat,pt.lng]],{color:paceColor(R.speedEMA),weight:5,opacity:.92}).addTo(R.map); R.segLayers.push(seg); }
  runMarker(pt.lat,pt.lng,false); if(R.follow&&R.map)R.map.panTo([pt.lat,pt.lng]);
  R.lastPt=pt; R.lastT=now;
  while(R.dist-R.tickedDist>=100){ R.tickedDist+=100; runTick(running); }   // 1 tick / 100 m
  const km=Math.floor(R.dist/1000);
  if(km>R.lastKm){
    const splitMs=R.movingMs-R.lastSplitMs; R.lastSplitMs=R.movingMs; R.splits.push({km,ms:splitMs}); R.lastKm=km;
    if(R.map){ const pin=LF().marker([pt.lat,pt.lng],{icon:LF().divIcon({className:'km-pin',html:String(km),iconSize:[24,24]})}).addTo(R.map); R.kmPins.push(pin); }
    say(T.voiceKm(km),{force:true}); if(navigator.vibrate)navigator.vibrate([60,40,60]);
    checkRunGoal();
  }
  runStatUI();
}
function onRunErr(e){
  const pill=$('run-gpspill'),T=L().run;
  pill.textContent=e&&e.code===1?T.gpsDenied:T.gpsWeak; pill.className='run-gpspill warn';
}
function runStart(){
  const T=L().run;
  if(!('geolocation' in navigator)){ toast(T.noGeo); return; }
  if(S.serverMode && S.token && earnLockLeft()>0){ toast(L().capLock(fmtDur(earnLockLeft()))); return; }
  ensureDay(); ensureWeek();
  R.dist=0;R.tickedDist=0;R.combo=0;R.sats=0;R.pts=[];R.trk=[];R.lastPt=null;R.sm=null;R.speedEMA=0;R.lastKm=0;
  R.movingMs=0;R.splits=[];R.lastSplitMs=0;R.kcal=0;R.hrSum=0;R.hrN=0;R.hrMax=0;R.startTs=Date.now();R.running=true;
  S.sessionSats=0;
  runClearMap();                                    // repart d'une trace vierge
  startServerSession('run');                        // séance notée serveur (si connecté)
  if(S.serverMode && !S.token) toast(L().loginToEarn);
  acquireWake();                                    // écran allumé
  $('run-btn').textContent='■ '+T.stop; $('run-btn').className='run-stop';
  $('run-sats').textContent='⚡0';
  say(L().voice.start,{force:true});
  R.watchId=navigator.geolocation.watchPosition(onRunPos,onRunErr,{enableHighAccuracy:true,maximumAge:1000,timeout:20000});
  R.timer=setInterval(()=>{ if(R.running)runStatUI(); },1000);
  runStatUI();
}
function runStop(){
  if(!R.running)return;
  R.running=false; R.elapsed=R.movingMs; R.speedEMA=0;
  releaseWake();
  if(R.watchId!=null){ navigator.geolocation.clearWatch(R.watchId); R.watchId=null; }
  if(R.timer){ clearInterval(R.timer); R.timer=null; }
  submitServerSession();                            // le serveur recalcule et crédite
  if(R.map && R.lastPt) R.finishMark=LF().circleMarker([R.lastPt.lat,R.lastPt.lng],{radius:8,color:'#fff',weight:3,fillColor:'#FF2244',fillOpacity:1}).addTo(R.map);
  const T=L().run, km=(R.dist/1000).toFixed(2);
  $('run-btn').textContent='▶ '+T.start; $('run-btn').className='run-start';
  $('run-gpspill').textContent='🏁 '+km+' km · ⚡'+R.sats; $('run-gpspill').className='run-gpspill ok';
  say(T.voiceDone(km),{force:true});
  runStatUI();
  const run=saveRun(); showRunSummary(run);         // récap + historique
}
function saveRun(){
  const avgPace=R.movingMs>0 ? (R.movingMs/1000)/Math.max(0.001,R.dist/1000) : 0;   // s/km
  let best=Infinity; for(const s of R.splits) if(s.ms/1000<best) best=s.ms/1000;
  const run={ t:Date.now(), km:+(R.dist/1000).toFixed(2), ms:R.movingMs, sats:R.sats,
    pace:avgPace, best:isFinite(best)?best:0, kcal:Math.round(R.kcal),
    hrAvg:R.hrN?Math.round(R.hrSum/R.hrN):0, hrMax:R.hrMax||0,
    splits:R.splits.map(s=>({km:s.km,ms:s.ms})),
    track:anonymizeTrack(R.trk) };            // forme anonymisée (relative, sans géoloc)
  const l=store.get('powruns',[]); l.unshift(run); store.set('powruns',l.slice(0,30));
  const st=ensureStats(); st.runKm=+((st.runKm||0)+run.km).toFixed(2); store.set('powstats',st);
  persist();                                        // sauve S.week.runKm (objectif hebdo)
  R.lastRun=run; renderRuns();
  return run;
}
function openRun(){
  setTheme('running');
  const T=L().run;
  $('run-title').textContent='🏃 '+T.title;
  $('run-btn').textContent='▶ '+T.start; $('run-btn').className='run-start';
  $('run-time-l').textContent=T.durL; $('run-pace-l').textContent=T.paceL;
  $('run-gpspill').textContent=T.gpsWait; $('run-gpspill').className='run-gpspill';
  if(R.hr)hrUI(R.hr); else { $('run-hr').className='run-hr off'; $('run-hr-val').textContent=T.hrConnect; }
  show('run');
  requestAnimationFrame(()=>{
    runInitMap();
    if(R.map)R.map.invalidateSize();
    R.follow=true;
    if('geolocation' in navigator && !R.running){
      navigator.geolocation.getCurrentPosition(p=>{
        runMarker(p.coords.latitude,p.coords.longitude,true);
        $('run-gpspill').textContent=T.gpsReady; $('run-gpspill').className='run-gpspill ok';
      },()=>{ $('run-gpspill').textContent=T.gpsDenied; $('run-gpspill').className='run-gpspill warn'; },
      {enableHighAccuracy:true,timeout:10000});
    }
  });
  runStatUI();
}
/* ---- Cardio Bluetooth (service standard 0x180D) — Android Chrome ---- */
async function connectHR(){
  const T=L().run;
  if(!navigator.bluetooth){ toast(T.hrUnsupported); return; }
  try{
    const dev=await navigator.bluetooth.requestDevice({filters:[{services:['heart_rate']}],optionalServices:['battery_service']});
    const srv=await dev.gatt.connect();
    const ch=await (await srv.getPrimaryService('heart_rate')).getCharacteristic('heart_rate_measurement');
    await ch.startNotifications();
    ch.addEventListener('characteristicvaluechanged',e=>{
      const v=e.target.value, flags=v.getUint8(0);
      const hr=(flags&1)?v.getUint16(1,true):v.getUint8(1);
      R.hr=hr; hrUI(hr);
      if(R.running){ R.hrSum+=hr; R.hrN++; if(hr>R.hrMax)R.hrMax=hr; }   // avg/max pour le récap
    });
    dev.addEventListener('gattserverdisconnected',()=>{ R.hr=null;
      $('run-hr').className='run-hr off'; $('run-hr-val').textContent=L().run.hrConnect; });
    R.hrDevice=dev; toast(T.hrOk);
  }catch(e){ if(e&&e.name!=='NotFoundError') toast(T.hrFail); }
}
window.runToggle=()=>{ R.running?runStop():runStart(); };
window.runExit=()=>{ if(R.running)runStop(); goHome(); };
window.runRecenter=()=>{ R.follow=true; if(R.map&&R.marker)R.map.setView(R.marker.getLatLng(),16); };
window.connectHR=connectHR;

/* ---- Import GPX (Apple Santé / Huawei Health / Strava…) ----
   Pont pour tes données montre : on VISUALISE la trace + résumé (distance,
   durée, allure). PAS de sats : un fichier n'est pas vérifiable, et le serveur
   rejette de toute façon des horodatages hors fenêtre de séance. Honnête. */
function importGPX(){ if(R.running){ toast(L().run.gpxBusy); return; } $('gpx-file').click(); }
function onGPXFile(ev){
  const f=ev.target.files&&ev.target.files[0]; ev.target.value='';
  if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>{ try{ parseGPX(String(rd.result)); }catch(e){ toast(L().run.gpxFail); } };
  rd.onerror=()=>toast(L().run.gpxFail);
  rd.readAsText(f);
}
function parseGPX(text){
  const T=L().run;
  const doc=new DOMParser().parseFromString(text,'application/xml');
  if(doc.getElementsByTagName('parsererror').length){ toast(T.gpxFail); return; }
  let nodes=doc.getElementsByTagName('trkpt');
  if(!nodes.length) nodes=doc.getElementsByTagName('rtept');   // repli itinéraire
  const pts=[...nodes].map(p=>{ const tm=p.getElementsByTagName('time')[0];
    return { lat:parseFloat(p.getAttribute('lat')), lng:parseFloat(p.getAttribute('lon')),
      t:tm?Date.parse(tm.textContent):NaN }; })
    .filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng));
  if(pts.length<2){ toast(T.gpxEmpty); return; }
  let dist=0; for(let i=1;i<pts.length;i++){ const d=haversine(pts[i-1],pts[i]); if(d<200) dist+=d; } // ignore les gros sauts
  const times=pts.map(p=>p.t).filter(Number.isFinite);
  const dur=times.length>=2 ? (times[times.length-1]-times[0]) : 0;
  const mps=dur>0 ? dist/(dur/1000) : 0;
  runInitMap(); if(R.map)R.map.invalidateSize();
  runClearMap();
  R.pts=pts.map(p=>[p.lat,p.lng]);
  R.poly=LF().polyline(R.pts,{color:'#FFC531',weight:5,opacity:.92}).addTo(R.map); // trace importée = or
  runMarker(pts[pts.length-1].lat,pts[pts.length-1].lng,false);
  R.follow=false;
  try{ R.map.fitBounds(R.poly.getBounds(),{padding:[30,30]}); }catch(e){}
  // affichage résumé (sans sats)
  R.running=false; R.dist=dist; R.elapsed=dur; R.speedEMA=mps;
  runStatUI();
  $('run-gpspill').textContent='📁 '+(dist/1000).toFixed(2)+' km'+(dur?' · '+fmtRunDur(dur):'');
  $('run-gpspill').className='run-gpspill ok';
  toast(T.gpxOk((dist/1000).toFixed(2)));
}
window.importGPX=importGPX;
window.onGPXFile=onGPXFile;

/* ---- Récap post-course + historique ---- */
function showRunSummary(run){
  R.lastRun=run; const T=L().run;
  $('rs-title').textContent=T.summaryTitle;
  const cv=$('rs-trace'), g=cv.getContext('2d'); g.clearRect(0,0,cv.width,cv.height);
  if(run.track&&run.track.length>1){ cv.style.display='block'; drawTrace(g,run.track,0,0,cv.width,cv.height,5); }
  else cv.style.display='none';
  $('rs-privacy').textContent=T.privacyNote;
  $('rs-publish').textContent='📡 '+T.publishRun; $('rs-publish').disabled=false;
  $('rs-km').textContent=run.km.toFixed(2); $('rs-km-l').textContent='km';
  const set=(id,v,l)=>{ $(id).textContent=v; $(id+'-l').textContent=l; };
  set('rs-time',fmtRunDur(run.ms),T.movingTime);
  set('rs-pace',fmtPaceSpk(run.pace),T.avgPace);
  set('rs-best',run.best?fmtPaceSpk(run.best):'—',T.bestKm);
  set('rs-kcal',run.kcal||'—',T.calories);
  set('rs-hr',run.hrAvg?run.hrAvg+' / '+run.hrMax:'—',T.hr);
  set('rs-sats','⚡'+run.sats,'sats');
  const sp=$('rs-splits');
  sp.innerHTML=(run.splits&&run.splits.length)
    ? '<div class="rs-splits-t">'+T.splits+'</div>'+run.splits.map(s=>`<div class="rs-split"><span>KM ${s.km}</span><b>${fmtPaceSpk(s.ms/1000)}/km</b></div>`).join('')
    : '';
  $('rs-share').textContent='📤 '+T.share; $('rs-close').textContent=L().close;
  $('modal-runsummary').classList.add('show');
}
function renderRuns(){
  const wrap=$('runs-list'); if(!wrap)return; const T=L().run,l=store.get('powruns',[]);
  const ttl=$('st-runs'); if(ttl)ttl.textContent=T.runsTitle;
  if(!l.length){ wrap.innerHTML=`<p class="hint">${T.runsEmpty}</p>`; return; }
  wrap.innerHTML=l.map((r,i)=>{ const d=new Date(r.t), dd=d.toLocaleDateString(S.lang)+' '+d.toTimeString().slice(0,5);
    return `<button class="run-item" onclick="openRunItem(${i})">
      <span class="rk">🏃 ${r.km.toFixed(2)} km</span>
      <span class="rm">${fmtRunDur(r.ms)} · ${fmtPaceSpk(r.pace)}/km · ⚡${r.sats}</span>
      <span class="rd">${dd}</span></button>`; }).join('');
}
async function runImage(run){
  const W=1080,H=1080,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
  const acc='#3DFFA0',T=L().run;
  x.fillStyle='#0A0A0C';x.fillRect(0,0,W,H);
  const g=x.createRadialGradient(W/2,H*0.30,60,W/2,H*0.30,W*0.75);g.addColorStop(0,acc+'22');g.addColorStop(1,'transparent');x.fillStyle=g;x.fillRect(0,0,W,H);
  x.fillStyle='rgba(255,255,255,.02)';for(let y=0;y<H;y+=4)x.fillRect(0,y,W,2);
  x.strokeStyle=acc;x.lineWidth=6;x.strokeRect(40,40,W-80,H-80);
  x.textAlign='center';
  x.fillStyle=acc;x.font='700 56px Chakra Petch, monospace';x.shadowColor=acc;x.shadowBlur=26;x.fillText('POW · COACH ⚡',W/2,150);x.shadowBlur=0;
  x.fillStyle='#EDEDF2';x.font='700 34px Chakra Petch, monospace';x.fillText('🏃 '+T.title.toUpperCase(),W/2,215);
  const hasTrk=run.track&&run.track.length>1;
  if(hasTrk){ x.shadowColor=acc;x.shadowBlur=16; drawTrace(x,run.track,140,255,800,405,12); x.shadowBlur=0;
    x.fillStyle=acc;x.font='700 128px Chakra Petch, monospace';x.fillText(run.km.toFixed(2),W/2,792);
    x.fillStyle='#8A8A99';x.font='600 34px Chakra Petch, monospace';x.fillText('KILOMÈTRES',W/2,840);
  }else{
    x.fillStyle=acc;x.font='700 200px Chakra Petch, monospace';x.shadowColor=acc;x.shadowBlur=40;x.fillText(run.km.toFixed(2),W/2,560);x.shadowBlur=0;
    x.fillStyle='#8A8A99';x.font='600 44px Chakra Petch, monospace';x.fillText('KILOMÈTRES',W/2,625);
  }
  const yc=hasTrk?920:760, yl=hasTrk?958:800;
  const cells=[[fmtRunDur(run.ms),T.movingTime],[fmtPaceSpk(run.pace)+'/km',T.avgPace],['⚡'+run.sats,'sats']],cw=W/3;
  cells.forEach(([v,l],i)=>{ const cx=cw*i+cw/2;
    x.fillStyle='#EDEDF2';x.font='700 50px Chakra Petch, monospace';x.fillText(v,cx,yc);
    x.fillStyle='#8A8A99';x.font='400 26px Rajdhani, sans-serif';x.fillText(String(l).toUpperCase(),cx,yl); });
  if(run.hrAvg||run.kcal){ x.fillStyle=run.hrAvg?'#FF4FA3':'#FFC531';x.font='600 34px Chakra Petch, monospace';
    x.fillText((run.hrAvg?'❤️ '+run.hrAvg+'/'+run.hrMax+' bpm':'')+(run.hrAvg&&run.kcal?' · ':'')+(run.kcal?'🔥 '+run.kcal+' kcal':''),W/2,hasTrk?1004:850); }
  x.fillStyle='#8A8A99';x.font='400 24px Rajdhani, sans-serif';x.fillText('🔒 '+T.privacyNote.replace(/^🔒\s*/,''),W/2,hasTrk?1044:900);
  x.fillStyle=acc;x.font='700 32px Chakra Petch, monospace';x.fillText(location.host,W/2,H-52);
  return await new Promise(r=>cv.toBlob(r,'image/png'));
}
window.showRunSummary=showRunSummary;
window.openRunItem=(i)=>{ const l=store.get('powruns',[]); if(l[i])showRunSummary(l[i]); };
window.shareRun=async()=>{
  const run=R.lastRun; if(!run)return; const T=L().run;
  const blob=await runImage(run);
  const text=`🏃 ${run.km.toFixed(2)} km · ${fmtRunDur(run.ms)} · ⚡${run.sats} sats — PoW Coach`;
  const link=location.origin+location.pathname;
  try{
    if(navigator.share && blob){ const file=new File([blob],'powcoach-run.png',{type:'image/png'});
      await navigator.share({title:'PoW Coach ⚡',text:text+' '+link,files:[file]}); }
    else if(navigator.share){ await navigator.share({title:'PoW Coach ⚡',text,url:link}); }
    else { await navigator.clipboard.writeText(text+' '+link); toast(L().copied); if(blob)downloadBlob(blob,'powcoach-run.png'); }
  }catch(e){ try{await navigator.clipboard.writeText(text+' '+link);toast(L().copied);}catch(_){} }
};
/* ---- profil sportif (poids/âge) pour calories + zones FC ---- */
window.openRunCfg=()=>{ const T=L().run;
  $('rc-title').textContent=T.cfgTitle; $('rc-weight-l').textContent=T.weightL; $('rc-age-l').textContent=T.ageL;
  $('rc-relay-l').textContent=T.relayL; $('rc-relay-hint').textContent=T.relayHint;
  $('rc-save').textContent=L().accSave; $('rc-close').textContent=L().cancel;
  $('rc-weight').value=runWeight(); $('rc-age').value=runAge(); $('rc-relay').value=store.get('powrelay','');
  $('modal-runcfg').classList.add('show'); };
window.saveRunCfg=()=>{ store.set('powweight',parseInt($('rc-weight').value,10)||70);
  store.set('powage',parseInt($('rc-age').value,10)||30);
  let rl=($('rc-relay').value||'').trim(); if(rl&&!/^wss:\/\//.test(rl))rl=''; store.set('powrelay',rl);
  closeModal('modal-runcfg'); toast(L().saved); };

/* ---- Publier la course sur Nostr : forme ANONYMISÉE + métriques + sats.
   Événement REMPLAÇABLE (kind 30078, d=powcoach-run) → 1 seul/personne, ne
   s'accumule pas. Aucune coordonnée : seulement la forme relative. ---- */
window.publishRun=async()=>{
  const run=R.lastRun; if(!run)return; const T=L().run, Tb=L();
  const btn=$('rs-publish'); btn.disabled=true; btn.textContent=Tb.publishing;
  try{
    const nick=S.nick||prompt(Tb.askNick)||('runner'+Math.floor(Math.random()*9999));
    S.nick=nick.slice(0,20); store.set('pownick',S.nick);
    const content=JSON.stringify({ km:run.km, ms:run.ms, sats:run.sats, pace:Math.round(run.pace),
      kcal:run.kcal||0, hr:run.hrAvg||0, nick:S.nick, track:(run.track||[]).slice(0,300),
      zap:(store.get('powlnaddr','')||undefined) });
    const ev=await signEvent({ kind:30078, created_at:Math.floor(Date.now()/1000),
      tags:[['d','powcoach-run'],['n',S.nick],['km',String(run.km)],['t','powcoachrun']], content });
    let ok=0;const errs=[];
    await Promise.all(RELAYS().map(r=>publishTo(r,ev).then(()=>ok++).catch(e=>errs.push(e&&e.message||''))));
    toast(ok?Tb.published(ok):pubFailMsg(Tb,errs)); if(ok)loadRunBoard();
  }catch(e){ toast(Tb.err+(e.message||'')); }
  btn.disabled=false; btn.textContent='📡 '+T.publishRun;
};
async function loadRunBoard(){
  const T=L().run, wrap=$('runboard-list'); if(!wrap)return;
  const ttl=$('st-runboard'); if(ttl)ttl.textContent=T.runboardTitle;
  const evs=[];
  await Promise.all(RELAYS().map(r=>collectRelay(r,{kinds:[30078],"#t":["powcoachrun"],limit:100},evs)));
  const runs=new Map();
  for(const [pub,ev] of await newestVerified(evs)){ // signature Schnorr vérifiée
    let data={}; try{data=JSON.parse(ev.content);}catch(e){}
    runs.set(pub,{pub,nick:data.nick,km:+data.km||0,ms:+data.ms||0,pace:+data.pace||0,sats:+data.sats||0,
      hr:+data.hr||0,track:Array.isArray(data.track)?data.track.slice(0,300):[],zap:data.zap,ts:ev.created_at||0});
  }
  const arr=[...runs.values()].sort((a,b)=>b.km-a.km).slice(0,30), myPub=store.get('pownostrpub','');
  if(!arr.length){ wrap.innerHTML=`<p class="hint">${T.runboardEmpty}</p>`; return; }
  wrap.innerHTML='';
  arr.forEach(s=>{ const el=document.createElement('div'); el.className='rb-item'+(s.pub===myPub?' me':'');
    const canZap=s.zap&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.zap)&&s.pub!==myPub;
    el.innerHTML=`<canvas width="112" height="112"></canvas>
      <div class="rbi"><b>${esc(s.nick||'anon')} · ${(+s.km).toFixed(2)} km</b>
      <small>${fmtRunDur(s.ms)} · ${fmtPaceSpk(s.pace)}/km · ⚡${s.sats}${s.hr?' · ❤️'+s.hr:''}</small></div>
      ${canZap?`<button class="zap">⚡</button>`:''}`;
    if(canZap) el.querySelector('.zap').addEventListener('click',()=>zapAthlete(s.zap)); // anti-XSS : pas de données Nostr en onclick inline
    wrap.appendChild(el);
    const cv=el.querySelector('canvas'); if(s.track&&s.track.length>1) drawTrace(cv.getContext('2d'),s.track,0,0,112,112,3);
  });
}

/* =========================================================
   COMPTE — LNURL-auth (connexion par signature wallet)
   ========================================================= */
window.openAccount=()=>{
  const T=L();
  $('acc-title').textContent=T.account;
  const inN=!!S.token;
  $('acc-logged-out').style.display=inN?'none':'block';
  $('acc-logged-in').style.display=inN?'block':'none';
  if(inN){
    $('acc-pubkey').textContent=S.pubkey.slice(0,16)+'…';
    $('acc-pubkey-full').textContent=S.pubkey;
    $('acc-lnaddr-label').textContent=T.accLnaddrLabel;
    $('acc-lnaddr').value=S.lnaddr||'';
    $('acc-logout').textContent=T.accLogout;$('acc-save').textContent=T.accSave;
  }else{
    $('acc-out-text').textContent=T.accOutText;
    $('acc-close1').textContent=T.cancel;$('acc-login-btn').textContent=T.accLogin;
  }
  $('modal-account').classList.add('show');
};
window.saveAccount=()=>{ S.lnaddr=$('acc-lnaddr').value.trim(); store.set('powlnaddr',S.lnaddr);
  closeModal('modal-account');toast(L().saved);updateAccountBadge(); };
window.logout=()=>{ const oldTok=S.token; S.token='';S.pubkey='';store.set('powtoken','');store.set('powpubkey','');
  // invalide AUSSI la session côté serveur (sinon elle reste valide 30 j en KV)
  if(oldTok)fetch(API()+'/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({token:oldTok})}).catch(()=>{});
  if(S.serverMode){S.balance=0;store.set('powbalance',0);renderHome();} // solde serveur lié au compte
  closeModal('modal-account');updateAccountBadge();toast(L().accLogout); };
function updateAccountBadge(){ $('btn-account').textContent=S.token?'✅':'👤'; }

window.startLogin=async()=>{
  const T=L();
  closeModal('modal-account');
  try{
    const r=await fetch(API()+'/auth/challenge');
    const d=await r.json();
    if(!d.lnurl)throw new Error(d.error||'challenge');
    S.loginK1=d.k1;S.lastLoginLnurl=d.lnurl;
    $('login-title').textContent=T.loginTitle;$('login-sub').textContent=T.loginSub;
    $('login-status').textContent=T.loginWaiting;
    $('login-cancel').textContent=T.loginCancel;$('login-copy').textContent=T.copy;
    $('login-open').textContent=T.loginOpen;$('login-open').href='lightning:'+d.lnurl;
    $('login-qrbox').innerHTML='';
    new QRCode($('login-qrbox'),{text:d.encoded.toUpperCase(),width:220,height:220,correctLevel:QRCode.CorrectLevel.M});
    $('modal-login').classList.add('show');
    // polling
    let tries=0;
    S.loginTimer=setInterval(async()=>{
      tries++;
      if(tries>150){cancelLogin();return;} // ~5 min
      try{
        const pr=await fetch(API()+'/auth/poll?k1='+S.loginK1);
        const pd=await pr.json();
        if(pd.status==='ok'){
          clearInterval(S.loginTimer);
          S.token=pd.token;S.pubkey=pd.pubkey;
          store.set('powtoken',S.token);store.set('powpubkey',S.pubkey);
          refreshBalance(); // récupère le solde serveur si le scoring serveur est actif
          $('login-status').textContent=T.loginOk;
          if(navigator.vibrate)navigator.vibrate([60,40,120]);
          setTimeout(()=>{closeModal('modal-login');updateAccountBadge();openAccount();},700);
        }else if(pd.status==='expired'){ clearInterval(S.loginTimer);$('login-status').textContent=T.loginExpired; }
      }catch(e){}
    },2000);
  }catch(e){ toast(L().err+(e.message||'')); }
};
window.cancelLogin=()=>{ if(S.loginTimer)clearInterval(S.loginTimer); closeModal('modal-login'); };
window.copyLoginLnurl=async()=>{ try{await navigator.clipboard.writeText(S.lastLoginLnurl);toast(L().copied);}catch(e){toast(L().copyFail);} };
window.openLoginWallet=()=>{ if(S.lastLoginLnurl) window.location.href='lightning:'+S.lastLoginLnurl; };

/* ---------- Soutien / pourboire (tip jar) ----------
   Adresse Lightning du projet. Popup engageante toutes les 3 h d'usage ACTIF
   (jamais pendant une séance ni par-dessus un autre modal), + lien permanent. */
const TIP_LNADDR='tips_pow_coach@21pay.org';
const TIP_EVERY_MS=3*3600*1000;
let tipQRDone=false;
window.openTip=()=>{
  const box=$('tip-qrbox');
  if(!tipQRDone && box && window.QRCode){ try{ new QRCode(box,{text:TIP_LNADDR,width:200,height:200,correctLevel:QRCode.CorrectLevel.M}); tipQRDone=true; }catch(e){} }
  $('tip-open').href='lightning:'+TIP_LNADDR;
  $('modal-tip').classList.add('show');
};
window.openTipWallet=()=>{ window.location.href='lightning:'+TIP_LNADDR; };
window.copyTip=async()=>{ try{ await navigator.clipboard.writeText(TIP_LNADDR); toast('📋 '+TIP_LNADDR); }catch(e){ toast('Copy failed'); } };
function tipTick(){
  if(document.visibilityState!=='visible')return;
  let used=(+store.get('powtipused',0))+60000;
  store.set('powtipused',used);
  if(used>=TIP_EVERY_MS && !S.running && !document.querySelector('.modal.show')){ store.set('powtipused',0); openTip(); }
}
setInterval(tipTick,60000);

/* ---------- PWA : service worker + invite d'installation ---------- */
if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{})); }
let deferredPrompt=null;
function isStandalone(){ return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone===true; }
function hideInstall(){ const b=$('install-btn'); if(b)b.style.display='none'; }
if(isStandalone())hideInstall(); // déjà installée → pas de bouton
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferredPrompt=e; const b=$('install-btn'); if(b&&!isStandalone())b.style.display='block'; });
window.installApp=async()=>{
  if(deferredPrompt){ deferredPrompt.prompt(); try{await deferredPrompt.userChoice;}catch(e){} deferredPrompt=null; hideInstall(); return; }
  // Chrome ne re-propose pas l'auto-prompt après une désinstall → instructions manuelles
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  toast(ios?L().installIOS:L().installAndroid);
};
window.addEventListener('appinstalled',hideInstall);

/* ---------- état du faucet : bannière "à sec / bientôt vide" ---------- */
async function checkFaucet(){
  try{ const d=await (await fetch(API()+'/faucet')).json(); S.faucetData=d; renderTransparency(d);
    const b=$('faucet-banner'); if(!b)return;
    if(d.dry){ b.textContent=L().faucetDry; b.className='faucet-banner'; b.style.display='block'; }
    else if(d.low){ b.textContent=L().faucetLow; b.className='faucet-banner low'; b.style.display='block'; }
    else b.style.display='none';
  }catch(e){}
}

/* ---------- onboarding première visite ---------- */
window.closeIntro=()=>{ store.set('powseen',1); closeModal('modal-intro'); };
function maybeIntro(){ if(store.get('powseen'))return; const T=L();
  $('intro-title').textContent=T.introTitle; $('intro-body').textContent=T.introBody; $('intro-go').textContent=T.introGo;
  $('modal-intro').classList.add('show'); }

/* ---------- A. historique des retraits (local, appareil) ---------- */
function logClaim(amount,method){ const l=store.get('powclaims',[]); l.unshift({t:Date.now(),amount,method}); store.set('powclaims',l.slice(0,30)); }
function renderClaims(){ const wrap=$('claims-list'); if(!wrap)return; const T=L(),l=store.get('powclaims',[]);
  $('st-claims').textContent=T.statClaims;
  if(!l.length){ wrap.innerHTML=`<p class="hint">${T.claimsEmpty}</p>`; return; }
  wrap.innerHTML=l.map(c=>{ const d=new Date(c.t), dd=d.toLocaleDateString(S.lang)+' '+d.toTimeString().slice(0,5);
    const m=c.method==='lnaddress'?'⚡ LN Address':'🔳 '+T.claimQr;
    return `<div class="claim-item"><span class="amt">+${c.amount} sats</span><span class="meta">${m} · ${dd}</span></div>`; }).join(''); }

/* ---------- B. niveaux de difficulté (ajuste le seuil "parfait") ---------- */
const DIFFS=['easy','normal','hard'], DIFF_OFF={easy:-10,normal:0,hard:5};
function curDiff(){ return store.get('powdiff','normal'); }
function perfectThreshold(){ return Math.min(99,Math.max(60,(CFG.PERFECT_THRESHOLD||92)+(DIFF_OFF[curDiff()]||0))); }
window.setDiff=(d)=>{ store.set('powdiff',d); renderDiff(); };
function renderDiff(){ const seg=$('diff-seg'); if(!seg)return; const T=L(),cur=curDiff();
  const lab=$('diff-label'); if(lab)lab.textContent=T.diffLabel;
  const rb=$('rest-btn-l'); if(rb)rb.textContent=T.restBtn;
  seg.innerHTML=DIFFS.map(d=>`<button class="${d===cur?'on':''}" onclick="setDiff('${d}')">${T['diff'+d[0].toUpperCase()+d.slice(1)]}</button>`).join(''); }

/* ---------- C. minuteur de repos (autonome, n'interfère pas avec la caméra) ---------- */
let restTimer=null,restLeft=0;
window.openRest=()=>{ const T=L(); $('rest-title').textContent=T.restTitle; $('rest-skip').textContent=T.restSkip;
  $('rest-presets').innerHTML=[30,45,60,90].map(s=>`<button onclick="startRest(${s})">${s}s</button>`).join('');
  $('rest-count').textContent='--'; $('modal-rest').classList.add('show'); };
window.startRest=(s)=>{ clearInterval(restTimer); restLeft=s; $('rest-count').textContent=restLeft;
  if(navigator.vibrate)navigator.vibrate(20);
  restTimer=setInterval(()=>{ restLeft--; $('rest-count').textContent=restLeft>0?restLeft:'✓';
    if(restLeft<=0){ clearInterval(restTimer); if(navigator.vibrate)navigator.vibrate([80,60,80,60,180]);
      const guidedNext=S.guided&&S.guided.waiting; // séance guidée : la voix annonce la série, pas le repos
      if(!guidedNext){ say(L().restDone,{force:true}); toast(L().restDone); }
      setTimeout(()=>{ closeModal('modal-rest'); if(guidedNext)guidedResume(); },guidedNext?600:1200); } },1000); };
window.stopRest=()=>{ clearInterval(restTimer); closeModal('modal-rest'); guidedResume(); };

/* ---------- F. transparence du faucet (alimenté par /faucet) ---------- */
function renderTransparency(d){ const card=$('transp-card'); if(!card)return; const T=L();
  $('st-transp').textContent=T.statTransp;
  if(!d||typeof d.todaySpent!=='number'){ card.innerHTML=`<p class="hint">${T.transpEmpty}</p>`; return; }
  const b=d.dailyBudget||0, pct=b?Math.min(100,Math.round(d.todaySpent/b*100)):0;
  card.innerHTML=`<div>${T.transpToday(d.todaySpent,b||'')}</div>${b?`<div class="bar"><i style="width:${pct}%"></i></div>`:''}`; }

/* ---------- E. zap d'un athlète (ouvre le wallet sur son adresse Lightning) ---------- */
window.zapAthlete=(a)=>{ if(a) window.location.href='lightning:'+a; };

/* =========================================================
   RETRAIT — Lightning Address (auto) ou LNURL-withdraw (QR)
   ========================================================= */
window.setMethod=(m)=>{ S.method=m;store.set('powmethod',m);
  $('mt-lnaddr').classList.toggle('sel',m==='lnaddress');
  $('mt-lnurl').classList.toggle('sel',m==='lnurl');
  $('lnaddr-field').style.display=m==='lnaddress'?'block':'none';
  $('lnurl-note').style.display=m==='lnurl'?'block':'none';
};
window.openClaim=()=>{
  const T=L();
  if(S.balance<=0){toast(T.noSats);return;}
  if(S.balance<CFG.MIN_CLAIM_SATS){toast(T.minClaim(CFG.MIN_CLAIM_SATS));return;}
  if(CFG.REQUIRE_AUTH && !S.token){toast(T.authRequired);openAccount();return;}
  $('pc-title').textContent=T.pcTitle;
  // on ne peut retirer qu'au plus MAX_CLAIM_SATS à la fois (limite serveur)
  $('pc-text').innerHTML=T.pcText(Math.min(S.balance,CFG.MAX_CLAIM_SATS||100));
  $('mt-lnaddr').textContent=T.mLnaddr;$('mt-lnurl').textContent=T.mLnurl;
  $('lnaddr-label').textContent=T.lnaddrLabel;$('lnaddr-hint').textContent=T.lnaddrHint;
  $('lnurl-note').textContent=T.lnurlNote;
  $('lnaddr-input').value=S.lnaddr||'';
  $('pc-later').textContent=T.later;$('btn-doclaim').textContent=T.payDo;
  setMethod(S.method||'lnaddress');
  $('modal-preclaim').classList.add('show');
};
window.doClaim=async()=>{
  const T=L(),amount=Math.min(S.balance,CFG.MAX_CLAIM_SATS||100),btn=$('btn-doclaim');
  const method=S.method||'lnaddress';
  let lnaddr='';
  if(method==='lnaddress'){
    lnaddr=$('lnaddr-input').value.trim();
    if(!lnaddr){toast(T.noLnaddr);return;}
    S.lnaddr=lnaddr;store.set('powlnaddr',lnaddr);
  }
  btn.disabled=true;btn.textContent=T.creating;
  try{
    const r=await fetch(API()+'/claim',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({amount,method,lnaddress:lnaddr,token:S.token})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.error||T.errWithdraw);
    closeModal('modal-preclaim');
    if(d.method==='lnaddress' && d.paid){
      logClaim(amount,'lnaddress');
      // solde serveur si fourni, sinon déduction locale (retrait partiel possible)
      S.balance=(typeof d.balance==='number')?d.balance:Math.max(0,S.balance-amount);persist();renderHome();
      $('claim-title').textContent=T.paidOk(amount);
      $('claim-sub').textContent=T.paidSub;
      $('qrbox').innerHTML='';$('claim-actions').style.display='flex';
      $('claim-copy').style.display='none';$('claim-close').textContent=T.close;
      $('modal-claim').classList.add('show');
      if(navigator.vibrate)navigator.vibrate([60,40,120,40,180]);
    }else if(d.lnurl){
      logClaim(amount,'lnurl');
      // QR à scanner — solde serveur si fourni, sinon déduction locale
      S.lastLnurl=d.lnurl;S.balance=(typeof d.balance==='number')?d.balance:Math.max(0,S.balance-amount);persist();renderHome();
      $('claim-title').textContent='⚡ '+amount+' SATS';
      $('claim-sub').textContent=T.claimSub;
      $('qrbox').innerHTML='';$('claim-actions').style.display='flex';
      $('claim-copy').style.display='';$('claim-copy').textContent=T.copy;$('claim-close').textContent=T.close;
      new QRCode($('qrbox'),{text:('lightning:'+d.lnurl).toUpperCase(),width:220,height:220,correctLevel:QRCode.CorrectLevel.M});
      $('modal-claim').classList.add('show');
    }
  }catch(e){toast(T.err+e.message);}
  btn.disabled=false;btn.textContent=T.payDo;
};
window.copyLnurl=async()=>{try{await navigator.clipboard.writeText(S.lastLnurl);toast(L().copied);}
  catch(e){toast(L().copyFail);}};

/* =========================================================
   ONGLETS
   ========================================================= */
window.setTab=(t)=>{ S.tab=t;
  ['train','stats','board','challenge'].forEach(x=>{
    $('tab-'+x).style.display = x===t?'block':'none';
    $('nt-'+x).classList.toggle('sel',x===t);
  });
  if(t==='stats')renderStats();
  if(t==='board')loadBoard();
  if(t==='challenge')renderChallenges();
};

/* =========================================================
   STATS + GRAPH (canvas maison, 0 dépendance)
   ========================================================= */
function renderStats(){
  const st=ensureStats(),T=L();
  $('stat-reps').textContent=st.totalReps;
  $('stat-streak').textContent=st.streak;
  $('stat-sats').textContent=st.totalSats;
  $('stat-perfect').textContent=st.totalReps?Math.round(st.totalPerfect/st.totalReps*100)+'%':'0%';
  // 7 derniers jours
  const days=[],vals=[];
  for(let i=6;i>=0;i--){ const d=new Date(Date.now()-i*864e5).toISOString().slice(0,10);
    days.push(d.slice(5)); vals.push(st.hist[d]||0); }
  drawBars($('chart7'),days,vals);
  // par discipline
  const wrap=$('disc-bars');wrap.innerHTML='';
  const max=Math.max(1,...Object.values(st.byDisc));
  SPORTS.forEach(sp=>{ const v=st.byDisc[sp.id]||0; if(v===0)return;
    const d=document.createElement('div');d.className='disc-bar';
    d.innerHTML=`<div class="l"><span>${sp.em} ${sp.name[S.lang]}</span><b>${v}</b></div>
      <div class="bar"><i style="width:${Math.round(v/max*100)}%;background:${THEME_C[sp.theme]}"></i></div>`;
    wrap.appendChild(d); });
  if(!wrap.children.length){ wrap.innerHTML=`<p class="hint">${T.noStats}</p>`; }
  renderRuns(); renderClaims(); renderTransparency(S.faucetData); checkFaucet(); // courses + retraits + transparence
}
function drawBars(cv,labels,vals){
  // hauteur LOGIQUE mémorisée : cv.height est réécrit en pixels physiques (×dpr)
  // au 1er rendu, la relire ferait gonfler le canvas à chaque affichage des Stats
  if(!cv.dataset.h)cv.dataset.h=cv.height;
  const dpr=window.devicePixelRatio||1, W=cv.clientWidth||cv.parentElement.clientWidth-28, H=+cv.dataset.h;
  cv.width=W*dpr;cv.height=H*dpr;const x=cv.getContext('2d');x.scale(dpr,dpr);
  if(!x.roundRect)x.roundRect=(a,b,w,h,r)=>{x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);
    x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath();};
  x.clearRect(0,0,W,H);
  const cs=getComputedStyle(document.body),acc=cs.getPropertyValue('--acc').trim(),
    dim=cs.getPropertyValue('--dim').trim(),max=Math.max(1,...vals);
  const pad=24,bw=(W-pad*2)/labels.length*0.6,gap=(W-pad*2)/labels.length;
  vals.forEach((v,i)=>{ const bh=(H-34)*(v/max),bx=pad+i*gap+(gap-bw)/2,by=H-24-bh;
    const g=x.createLinearGradient(0,by,0,H-24);g.addColorStop(0,acc);g.addColorStop(1,'transparent');
    x.fillStyle=g;x.beginPath();x.roundRect(bx,by,bw,bh,4);x.fill();
    if(v>0){x.fillStyle=acc;x.font='700 11px Chakra Petch';x.textAlign='center';x.fillText(v,bx+bw/2,by-4);}
    x.fillStyle=dim;x.font='10px Rajdhani';x.textAlign='center';x.fillText(labels[i],bx+bw/2,H-8); });
}

/* =========================================================
   LEADERBOARD NOSTR — publie/lit des scores (kind 30078, addressable)
   Chaque athlète publie son total de reps sous un tag d-identifiant "powcoach-score".
   Lecture agrégée depuis plusieurs relays via WebSocket brut (aucune lib).
   ========================================================= */
// clé Nostr locale (générée si absente) — identité du leaderboard
async function nostrKey(){
  let sk=store.get('pownostrsk','');
  if(!sk){ const a=new Uint8Array(32);crypto.getRandomValues(a);
    sk=[...a].map(b=>b.toString(16).padStart(2,'0')).join('');store.set('pownostrsk',sk); }
  return sk;
}
// secp256k1 schnorr : lib noble AUTO-HÉBERGÉE (vendor/, comme Leaflet/qrcode).
// Plus de dépendance CDN au moment de publier : certains réseaux/navigateurs
// (DNS filtrant, Brave…) bloquent jsdelivr, ce qui cassait la publication Nostr
// alors que le reste de l'app marchait. Précaché par le SW → signe même hors-ligne.
let nobleReady=null;
async function loadNoble(){
  if(nobleReady)return nobleReady;
  nobleReady=(async()=>{
    const m=await import('/vendor/noble-secp256k1.js'); // @noble/curves@1.8.1 (bundle local)
    const schnorr=m.schnorr||(m.default&&m.default.schnorr);
    const bytesToHex=b=>[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
    return {schnorr,bytesToHex};
  })();
  return nobleReady;
}
async function sha256hex(str){ const b=new TextEncoder().encode(str);
  const h=await crypto.subtle.digest('SHA-256',b);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join(''); }
async function signEvent(ev){
  const secp=await loadNoble();
  const sk=await nostrKey();
  ev.pubkey=secp.bytesToHex(secp.schnorr.getPublicKey(sk));
  store.set('pownostrpub',ev.pubkey);
  const serial=JSON.stringify([0,ev.pubkey,ev.created_at,ev.kind,ev.tags,ev.content]);
  ev.id=await sha256hex(serial);
  const sig=await secp.schnorr.sign(ev.id,sk);
  ev.sig=secp.bytesToHex(sig);
  return ev;
}
window.publishScore=async()=>{
  const T=L(),st=ensureStats();
  if(st.totalReps<1){toast(T.noStats);return;}
  const btn=$('board-publish');btn.disabled=true;btn.textContent=T.publishing;
  try{
    const nick=S.nick||prompt(T.askNick)||('athlete'+Math.floor(Math.random()*9999));
    S.nick=nick.slice(0,20);store.set('pownick',S.nick);
    const ev=await signEvent({ kind:30078, created_at:Math.floor(Date.now()/1000),
      tags:[['d','powcoach-score'],['n',S.nick],['reps',String(st.totalReps)],['streak',String(st.streak)],['t','powcoach']],
      content:JSON.stringify({reps:st.totalReps,streak:st.streak,perfect:st.totalPerfect,nick:S.nick,zap:(store.get('powlnaddr','')||undefined)}) }); // zap: adresse LN opt-in (si renseignée)
    let ok=0;const errs=[];
    await Promise.all(RELAYS().map(r=>publishTo(r,ev).then(()=>ok++).catch(e=>errs.push(e&&e.message||''))));
    toast(ok?T.published(ok):pubFailMsg(T,errs));
    loadBoard(true);
  }catch(e){toast(T.err+(e.message||''));}
  btn.disabled=false;btn.textContent=T.publish;
};
// message d'échec de publication : générique + 1re raison concrète remontée par un relay
function pubFailMsg(T,errs){ const r=(errs||[]).find(e=>e&&e!=='timeout'&&e!=='conn')||errs[0]||'';
  return T.pubFail+(r?' — '+String(r).slice(0,80):''); }
function publishTo(url,ev){ return new Promise((res,rej)=>{
  let ws; try{ ws=new WebSocket(url); }catch(e){ return rej(new Error('conn')); }
  // 8 s : les handshakes TLS+WS mobiles dépassent facilement les 4 s d'avant
  const to=setTimeout(()=>{try{ws.close();}catch(e){} rej(new Error('timeout'));},8000);
  ws.onopen=()=>ws.send(JSON.stringify(["EVENT",ev]));
  ws.onmessage=(m)=>{ try{const d=JSON.parse(m.data);
    if(d[0]==='OK'&&d[1]===ev.id){ clearTimeout(to);try{ws.close();}catch(e){}
      // NIP-20 : ["OK", id, true/false, raison] — un refus n'est PAS un succès
      d[2]===true?res():rej(new Error(String(d[3]||'refusé'))); }}catch(e){} };
  ws.onerror=()=>{clearTimeout(to);rej(new Error('conn'));};
}); }
window.loadBoard=async(force)=>{
  const T=L(),list=$('board-list');
  if(!force && list.dataset.loaded){return;}
  list.innerHTML=`<p class="hint">${T.boardLoading}</p>`;
  const evs=[];
  await Promise.all(RELAYS().map(r=>collectRelay(r,{kinds:[30078],"#t":["powcoach"],limit:200},evs)));
  const scores=new Map(); // pubkey -> {nick,reps,streak} — signatures vérifiées
  for(const [pub,ev] of await newestVerified(evs)){
    let data={}; try{data=JSON.parse(ev.content);}catch(e){}
    scores.set(pub,{pub,nick:data.nick,reps:parseInt(data.reps,10)||0,
      streak:parseInt(data.streak,10)||0,zap:data.zap,ts:ev.created_at||0});
  }
  loadRunBoard();                        // charge aussi les tracés de course publiés
  const arr=[...scores.values()].sort((a,b)=>b.reps-a.reps).slice(0,50);
  const myPub=store.get('pownostrpub','');
  list.innerHTML='';
  if(!arr.length){ list.innerHTML=`<p class="hint">${T.boardEmpty}</p>`; }
  arr.forEach((s,i)=>{ const row=document.createElement('div');
    row.className='board-row'+(i<3?' top'+(i+1):'')+(s.pub===myPub?' me':'');
    const canZap = s.zap && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.zap) && s.pub!==myPub;
    const zapBtn = canZap ? `<button class="zap" title="${T.zapTip}">⚡</button>` : '';
    row.innerHTML=`<div class="rank">${i<3?['🥇','🥈','🥉'][i]:'#'+(i+1)}</div>
      <div class="who"><b>${esc(s.nick||'anon')}</b><small>${s.pub.slice(0,12)}…</small></div>
      <div class="score">${s.reps} reps${s.streak>1?' · 🔥'+s.streak:''}</div>${zapBtn}`;
    // listener programmatique (jamais de données Nostr dans un onclick inline → anti-XSS)
    if(canZap) row.querySelector('.zap').addEventListener('click',()=>zapAthlete(s.zap));
    list.appendChild(row); });
  list.dataset.loaded='1';
};
/* ---- lecture des relays : collecte brute, puis VÉRIFICATION des événements ----
   Un relay (ou un homme du milieu WebSocket) peut renvoyer n'importe quoi : on ne
   fait confiance à un événement que si son id = sha256(sérialisation NIP-01) ET
   que sa signature Schnorr est valide pour son pubkey. "Dernier publié fait foi" :
   pour chaque pubkey on garde l'événement VÉRIFIÉ le plus récent. */
function collectRelay(url,filter,out){ return new Promise((res)=>{
  let ws;try{ws=new WebSocket(url);}catch(e){return res();}
  const sub='pow'+Math.random().toString(36).slice(2,8);
  const to=setTimeout(()=>{try{ws.close();}catch(e){}res();},4500);
  ws.onopen=()=>ws.send(JSON.stringify(["REQ",sub,filter]));
  ws.onmessage=(m)=>{ try{const d=JSON.parse(m.data);
    if(d[0]==='EVENT'&&d[2])out.push(d[2]);
    else if(d[0]==='EOSE'){ clearTimeout(to);try{ws.close();}catch(e){}res(); } }catch(e){} };
  ws.onerror=()=>{clearTimeout(to);res();};
}); }
async function verifyNostrEvent(ev){
  try{
    if(!ev||!/^[0-9a-f]{64}$/.test(ev.id||'')||!/^[0-9a-f]{64}$/.test(ev.pubkey||'')||!/^[0-9a-f]{128}$/.test(ev.sig||''))return false;
    const serial=JSON.stringify([0,ev.pubkey,ev.created_at,ev.kind,ev.tags,ev.content]);
    if(await sha256hex(serial)!==ev.id)return false;
    const secp=await loadNoble();
    return await secp.schnorr.verify(ev.sig,ev.id,ev.pubkey);
  }catch(e){return false;}
}
async function newestVerified(events){
  const seen=new Set(),byPub=new Map();
  for(const ev of events){ if(!ev||!ev.id||seen.has(ev.id))continue; seen.add(ev.id);
    const l=byPub.get(ev.pubkey)||[]; l.push(ev); byPub.set(ev.pubkey,l); }
  const out=new Map();
  await Promise.all([...byPub.entries()].map(async([pub,list])=>{
    list.sort((a,b)=>(b.created_at||0)-(a.created_at||0));
    // du plus récent au plus ancien : le 1er qui vérifie gagne (3 essais max,
    // pour qu'un spam de faux événements "récents" ne censure pas un vrai score)
    for(const ev of list.slice(0,3)){ if(await verifyNostrEvent(ev)){ out.set(pub,ev); return; } }
  }));
  return out;
}
const esc=s=>String(s||'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));

/* =========================================================
   DÉFIS HEBDO PARTAGEABLES — lien + image générée
   ========================================================= */
function renderChallenges(){
  const T=L();
  $('st-newchallenge').textContent=T.newChallenge;
  $('chal-ex-label').textContent=T.chalEx;$('chal-target-label').textContent=T.chalTarget;
  $('chal-create').textContent=T.chalCreate;
  // remplir le select
  const sel=$('chal-ex');sel.innerHTML='';
  const anyOpt=document.createElement('option');anyOpt.value='any';anyOpt.textContent=T.chalAny;sel.appendChild(anyOpt);
  SPORTS.flatMap(s=>s.ex).forEach(e=>{ const o=document.createElement('option');o.value=e.id;
    o.textContent=e.em+' '+e.name[S.lang];sel.appendChild(o); });
  // défis actifs
  const wrap=$('challenge-active');wrap.innerHTML='';
  if(!S.challenges.length){ wrap.innerHTML=`<p class="hint">${T.noChallenge}</p>`; }
  S.challenges.forEach((c,idx)=>{
    const ex=c.ex==='any'?null:findEx(c.ex);
    const name=c.ex==='any'?T.chalAny:(ex?ex.em+' '+ex.name[S.lang]:c.ex);
    // c.ex et c.target peuvent venir d'un lien de défi (hash) → toujours échapper
    const safeName=esc(name), prog=parseInt(c.prog,10)||0, tnum=parseInt(c.target,10)||1;
    const pct=Math.min(100,Math.round(prog/tnum*100));
    const d=document.createElement('div');d.className='chal-card';
    d.innerHTML=`<h3>${c.done?'✅ ':'🎯 '}${esc(c.title||name)}</h3>
      <div class="chal-prog">${safeName} · ${prog} / ${tnum}</div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="chal-actions">
        <button class="btn-ghost" onclick="shareChallenge(${idx})">📤 ${T.chalShare}</button>
        <button class="btn-stop" onclick="deleteChallenge(${idx})">🗑</button>
      </div>`;
    wrap.appendChild(d);
  });
}
window.createChallenge=()=>{
  const T=L(),ex=$('chal-ex').value,target=parseInt($('chal-target').value,10)||100;
  const c={ id:Math.random().toString(36).slice(2,9), ex, target, prog:0, done:false,
    week:weekId(), title:'', ts:Date.now() };
  S.challenges.unshift(c);store.set('powchallenges',S.challenges);
  renderChallenges();toast(T.chalCreated);
};
window.deleteChallenge=(i)=>{ S.challenges.splice(i,1);store.set('powchallenges',S.challenges);renderChallenges(); };
/* base64 UTF-8 safe — btoa() jette InvalidCharacterError sur tout caractère
   > U+00FF (ex l'emoji 🔥 de « Toutes disciplines ») : le partage d'un défi
   "toutes disciplines" était silencieusement cassé (throw avant le try/catch). */
const b64enc=s=>btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const b64dec=s=>new TextDecoder().decode(Uint8Array.from(atob(s),c=>c.charCodeAt(0)));
window.shareChallenge=async(i)=>{
  const T=L(),c=S.challenges[i];
  const ex=c.ex==='any'?null:findEx(c.ex);
  const exName=c.ex==='any'?T.chalAny:(ex?ex.name[S.lang]:c.ex);
  // lien de défi (paramètres dans le hash — l'app les lit au chargement)
  const link=location.origin+location.pathname+'#chal='+encodeURIComponent(b64enc(JSON.stringify({e:c.ex,t:c.target,n:exName})));
  // image générée
  const blob=await challengeImage(exName,c.target,T);
  try{
    if(navigator.share && blob){
      const file=new File([blob],'powcoach-defi.png',{type:'image/png'});
      await navigator.share({ title:'PoW Coach ⚡', text:T.chalShareText(c.target,exName)+' '+link, files:[file] });
    }else if(navigator.share){
      await navigator.share({ title:'PoW Coach ⚡', text:T.chalShareText(c.target,exName), url:link });
    }else{
      await navigator.clipboard.writeText(link);toast(T.copied);
      if(blob)downloadBlob(blob,'powcoach-defi.png');
    }
  }catch(e){ try{await navigator.clipboard.writeText(link);toast(T.copied);}catch(_){} }
};
function downloadBlob(blob,name){ const u=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000); }
async function challengeImage(exName,target,T){
  const W=1080,H=1080,cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const x=cv.getContext('2d');
  const cs=getComputedStyle(document.body),acc=cs.getPropertyValue('--acc').trim();
  // fond
  x.fillStyle='#0A0A0C';x.fillRect(0,0,W,H);
  const g=x.createRadialGradient(W/2,H*0.38,60,W/2,H*0.38,W*0.7);
  g.addColorStop(0,acc+'40');g.addColorStop(1,'transparent');x.fillStyle=g;x.fillRect(0,0,W,H);
  // scanlines
  x.fillStyle='rgba(255,255,255,.02)';for(let y=0;y<H;y+=4)x.fillRect(0,y,W,2);
  // cadre
  x.strokeStyle=acc;x.lineWidth=6;x.strokeRect(40,40,W-80,H-80);
  // titre
  x.fillStyle=acc;x.font='700 64px Chakra Petch, monospace';x.textAlign='center';
  x.shadowColor=acc;x.shadowBlur=30;x.fillText('POW · COACH ⚡',W/2,180);
  x.shadowBlur=0;
  // défi
  x.fillStyle='#EDEDF2';x.font='700 44px Chakra Petch, monospace';
  x.fillText(T.chalImgTitle,W/2,360);
  x.fillStyle=acc;x.font='700 180px Chakra Petch, monospace';x.shadowColor=acc;x.shadowBlur=40;
  x.fillText(String(target),W/2,560);x.shadowBlur=0;
  x.fillStyle='#EDEDF2';x.font='600 56px Chakra Petch, monospace';
  x.fillText(exName.toUpperCase(),W/2,650);
  // sous-titre
  x.fillStyle='#8A8A99';x.font='400 34px Rajdhani, sans-serif';
  x.fillText(T.chalImgSub,W/2,760);
  // pied
  x.fillStyle=acc;x.font='700 40px Chakra Petch, monospace';
  x.fillText(location.host,W/2,H-100);
  return await new Promise(r=>cv.toBlob(r,'image/png'));
}
// import d'un défi via lien (#chal=...)
function importChallengeFromHash(){
  const m=location.hash.match(/chal=([^&]+)/);
  if(!m)return;
  try{ const d=JSON.parse(b64dec(decodeURIComponent(m[1])));
    // valide strictement : exercice connu (ou "any") + objectif entier borné
    const known = d.e==='any' || !!findEx(d.e);
    const tgt = parseInt(d.t,10);
    if(known && Number.isFinite(tgt) && tgt>0 && tgt<=100000){
      if(!S.challenges.some(c=>c.ex===d.e&&c.target===tgt&&!c.done)){
        S.challenges.unshift({ id:Math.random().toString(36).slice(2,9), ex:d.e, target:tgt, prog:0, done:false,
          week:weekId(), title:'', ts:Date.now(), imported:true });
        store.set('powchallenges',S.challenges);
        toast(L().chalImported);
      }
    }
  }catch(e){}
  history.replaceState(null,'',location.pathname);
}

/* ---------- init ---------- */
ensureWeek();ensureDay();ensureStats();applyLangStatic();renderHome();updateAccountBadge();importChallengeFromHash();refreshBalance();checkFaucet();renderDiff();renderGuided();checkCoach();
if(!store.get('powlang-set',false)){store.set('powlang-set',true);$('modal-lang').classList.add('show');} // 1re visite : langue d'abord, l'intro suivra (setLang)
else maybeIntro();
