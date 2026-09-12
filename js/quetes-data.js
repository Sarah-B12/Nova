/* ===========================================================
   QUETES-DATA — Données pures des quêtes (carte de Silène). Ordre IMPOSÉ.
   Donneur unique de cette carte : le VIEUX SORN (bourru, sarcastique, un passé
   trouble avec le Protocole — on le découvre au fil des étapes).

   SITE = { indice, cible:{x,y,r}, leurres:[...], image?, arrivee, defi }
     - arrivee     : string OU tableau de répliques (dialogue multi-lignes).
     - image       : ambiance de l'étape (facultatif) — voir dossiers ci-dessous.
     - defi.type="enigme" → { texte, question, reponses:[...], indice, reussite? }
         · texte    : mise en scène (string ou tableau).
         · reussite : réplique(s) de Sorn quand on réussit (facultatif).
   Récompense = { credits, pa, objets:{id:qte}, flags:{clef:valeur} }.

   IMAGES (à déposer par toi) :
     images/quetes/<donneur>.png       → bannière du donneur au comptoir. ⚠ Le nom
         de fichier est DÉRIVÉ du champ `donneur` par quetes.js (~ligne 486) :
         minuscules, accents retirés, tout caractère non alphanumérique en «_».
         « Vieux Sorn » → vieux_sorn.png · « Kessa » → kessa.png
         Pour imposer un autre chemin, ajouter `donneurImg` sur la quête.
     images/quetes/<questid>/<n>.png   → ambiance de l'étape n (ex. images/quetes/q1/1.png).
   Monde : 2400 × 1600. Coordonnées approximatives, à ajuster.
   =========================================================== */
/* ⚠ v0.58 — LA CADENCE DU PÉRIMÈTRE. Q3 (corolles) et Q5 (allumage de la
   navette) disent reproduire LA MÊME séquence, mais le moteur tirait une suite
   au hasard à chaque partie : l'« écho long de l'arc » n'existait pas. Et Q5
   était un défi `memoire` SANS info, question ni réponse — impossible à
   réussir, donc Q5 bloquée pour tout le monde. Indices des symboles ◤◥◣◢.
   Ne pas changer sans relire Q3, Q4 et Q5. */
const CADENCE_PERIMETRE = [0, 2, 1, 3, 2];

const QUETES = [
  {
    id:"q1",
    nom:"Le relais de Braise",
    donneur:"Vieux Sorn",
    // ⚠ Coordonnées approximatives (monde 2400×1600) — à ajuster en jouant.
    // Fil rouge : les quatre balises rediffusent un même vieil ordre, en morceaux.
    //   « TOUTES UNITÉS — MAINTENIR LE PÉRIMÈTRE JUSQU'À L'EMBARQUEMENT
    //     DU PERSONNEL NON ÉVACUÉ. »
    // Le joueur n'apprend qu'une chose ici : ce n'est pas du bruit, c'est UN
    // texte, et ce texte est un ordre. Le mot semé est « embarquement » —
    // Sorn le désamorce trop vite à la balise 4.
    // ⚠ CANON v2 : l'évacuation date d'environ TROIS CENTS ans. Sorn n'est
    //    pas un témoin mais un DESCENDANT (voir LORE_Protocole.md §5) : il ne
    //    sait rien, il a hérité d'un métier et d'une honte sans objet.
    // AUCUN défi ratable ici : première quête, on ne verrouille jamais un débutant.
    intro:[
      "Un vieux bonhomme voûté te jauge de son unique œil valide — l'autre disparaît sous un bandeau d'implants qui grésille par intermittence. « Encore un bleu qui croit qu'on survit ici avec du courage et un joli sac. »",
      "Il crache par terre, puis désigne du menton un boîtier fumant sur son établi. « J'ai réveillé un vieux relais du Protocole. Il recrache d'anciennes coordonnées — quatre balises. Moi, mes genoux rendent l'âme avant la première. »",
      "« Réparer ces saloperies, c'est le métier de ma famille. Mon père, son père, et ainsi de suite jusqu'à un type dont il ne reste qu'un nom sur un registre. » Il hausse une épaule. « On n'a jamais su pourquoi on faisait ça. On le fait. »",
      "« Toi, tu vas suivre ces balises et me rapporter ce qu'elles disent. Je te paie, et personne ne pleure. Enfin… si tu reviens. » Un rictus fend sa barbe grise. « Ce que je ne garantis pas, gamin. »",
      "Il te tend une oreillette cabossée. « Je te guide d'ici. Préviens-toi tout de suite : mon décodeur crache des zones, pas des points. Je te dirai où chercher, à toi de fouiller le coin. »",
      "« Et note ce que tu trouves. » Il désigne vaguement ton poignet. « T'as un carnet là-dedans — Communication, onglet Carnet. Ces balises disent des choses par bouts, et les bouts, ça se perd. Moi j'ai passé ma vie à regretter ce que j'ai pas écrit. »"
    ],
    etapes:[

      /* ---- 1. La Braise et l'écume — ÉNIGME (essais illimités) ---- */
      { indice:"Nord. Là où la roche de la Forge plonge dans l'eau — un point chaud à portée de l'écume. Fouille ce coin-là, j'ai pas mieux.",
        cible:{ x:1050, y:140, r:80 }, leurres:[ {x:1850,y:170,r:80}, {x:300,y:780,r:80}, {x:1500,y:1420,r:80} ],
        image:"images/quetes/q1/1.png",
        arrivee:[
          "La roche tiède fume doucement sous tes bottes. Un relais à demi enfoui clignote dans la caillasse ; une voix synthétique en jaillit, distordue, puis se stabilise sur une phrase qu'elle répète en boucle : « …toutes unités… toutes unités… »",
          "Ta radio crachote. « T'es arrivé ? Étonnant. Le relais va te poser une devinette débile — le Protocole adore ça, il teste avant de parler. Débrouille-toi, j'ai pas que ça à faire. »"
        ],
        /* ⚠ Était une devinette (« je grandis en dévorant… ») : contenu
           interchangeable, aucun lien avec Silène ni le Protocole. Devient
           une TRANSCRIPTION — le premier geste du joueur est de recoudre ce
           que la balise crache mal. Essais illimités. */
        defi:{ type:"enigme",
          texte:"La litanie se brouille, revient, se brouille encore. Le relais ne pose aucune question : il attend qu'on lui confirme ce qu'il vient de dire.",
          question:"« RÉPÉTEZ LA BRIBE REÇUE. » — deux mots.",
          reponses:["toutes unites","toutes unités","toutes unite","toutes unité","unites","unités"],
          indice:"Écoute encore. La voix les répète en boucle depuis que tu es arrivé.",
          reussite:[
            "Le relais accuse réception — deux tons secs, comme un fonctionnaire qui coche une case — puis s'affaisse et se met à fondre. Sous tes doigts, pourtant, le métal reste étrangement froid. De la coulée figée émerge un carré de papier, intact, couvert de coordonnées tracées à la main.",
            "Tu essuies la bouillasse tiède sur ta combinaison et déplies le feuillet. La radio grésille. « Toutes unités… » Sorn mâchonne le mot. « C'est un début de phrase, ça. Y en a d'autres, forcément. » Une pause. « Ça pointe vers le froid. Là où même l'eau renonce à geler. On se rapproche, gamin. »"
          ] } },

      /* ---- 2. La borne givrée — ATTENTE (non ratable) ---- */
      { indice:"Le froid, maintenant. Lisière sud de la cité de glace, là où l'eau refuse encore de prendre. Cherche dans ce secteur.",
        cible:{ x:1960, y:600, r:80 }, leurres:[ {x:700,y:300,r:80}, {x:1150,y:1050,r:80}, {x:2000,y:1300,r:80} ],
        image:"images/quetes/q1/2.png",
        arrivee:[
          "Une borne émerge de la neige, prise dans une gangue de glace épaisse comme un poing. L'écran vit encore dessous, vert pâle, mais aucune commande ne répond.",
          "« Elle est gelée jusqu'aux entrailles », grogne Sorn. « Force pas, tu la casseras. Ces trucs-là se réchauffent tout seuls quand on les sollicite — mets la main dessus et attends. Va faire un tour si t'as la bougeotte, elle t'attendra. »",
          "Sa voix baisse d'un cran. « La Toundra… il paraît qu'on avait de la famille là-bas. Très loin en arrière. » Un silence de givre. « Chez nous on n'en parle pas. Va savoir pourquoi. …Bref. »"
        ],
        defi:{ type:"attente", duree:45000,
          texte:["Tu poses la paume sur la gangue. Sous la glace, quelque chose se remet lentement à tourner.",
                 "Lance le réchauffage, puis laisse-la travailler — tu peux t'éloigner et revenir."],
          reussite:[
            "La borne dégèle d'un coup dans un cliquetis mécanique. L'écran s'anime et débite une bribe d'un vieux message, la même voix que la première balise, deux mots plus loin : « …maintenir le périmètre… »",
            "Une plaque de glace glisse et révèle un renfoncement où pulse une graine luminescente, gravée de nouvelles coordonnées.",
            "« Maintenir le périmètre, maintenir le périmètre… » Sorn souffle par le nez. « Trois siècles qu'ils montent la garde devant une porte que plus personne ne franchira. Voilà ce que c'est, le Protocole : des chiens qui attendent un maître mort. »",
            "Il ajoute, plus bas : « Deuxième morceau. Ça se recolle, ton machin. »"
          ] } },

      /* ---- 3. Le relais éventré — LIVRAISON (non ratable) ---- */
      { indice:"Sud-ouest, vers les vieilles galeries. Et remue-toi : à ce compte-là, un autre charognard sera passé avant toi.",
        cible:{ x:760, y:1320, r:80 }, leurres:[ {x:1400,y:400,r:80}, {x:1750,y:900,r:80}, {x:980,y:640,r:80} ],
        image:"images/quetes/q1/3.png",
        arrivee:[
          "Celle-ci a été ouverte au pied-de-biche, il y a longtemps. Les entrailles pendent, le boîtier est vide de tout ce qui avait de la valeur. Un voyant s'obstine pourtant à clignoter, patient.",
          "« Ah. » Sorn a un petit rire sans joie. « Y a plus vieux charognard que moi sur cette caillasse, on dirait. Elle veut parler, mais il lui manque de quoi. Trouve-lui de quoi refermer son circuit — de la Voltane, de la Silite. Ça se mine, ou ça s'achète au marché si t'es fainéant. »"
        ],
        defi:{ type:"livraison",
          objets:{ voltane:2, silite:1 },
          texte:"Le logement de la carte est béant. Deux fragments de Voltane et un peu de Silite refermeraient le circuit.",
          // (la livraison n'est pas ratable : on complète ou on revient plus tard)
          reussite:[
            "Tu cales les composants dans le logement. Le relais avale le courant d'un coup et parle, la même voix, quelques mots plus loin : « …jusqu'à l'embarquement… »",
            "Puis il recrache une dernière série de coordonnées — vers l'ouest, vers l'anneau. La radio reste muette une seconde de trop.",
            "« Vers l'ouest ? » La voix de Sorn a changé de texture. « Bon. Vas-y. Mais tu t'approches pas de l'anneau, t'entends ? Tu restes au seuil. »"
          ] } },

      /* ---- 4. Le seuil — ÉNIGME retournée (essais illimités) ---- */
      { indice:"Ouest. Jusqu'à voir l'anneau — et pas un pas de plus. Tu t'arrêtes au seuil, c'est pas négociable.",
        cible:{ x:620, y:1000, r:80 }, leurres:[ {x:1300,y:1250,r:80}, {x:900,y:220,r:80}, {x:1700,y:1150,r:80} ],
        image:"images/quetes/q1/4.png",
        arrivee:[
          "L'anneau du Protocole occupe tout l'horizon, violet et silencieux. La dernière balise est plantée là, face à lui, comme une sentinelle qui aurait oublié de mourir.",
          "Elle ne pose pas de devinette. Elle affiche les trois bribes que tu as ramassées, bout à bout, avec un trou à la fin — et elle attend que tu combles le trou."
        ],
        /* ⚠ Était « quel est le nom de ce secteur ? », dont la réponse était
           affichée en haut de l'écran en permanence : ce n'était pas une
           épreuve. Devient la RECOUTURE des trois bribes — le joueur découvre
           que ce n'était pas du bruit mais un seul ordre. Essais illimités.
           La contradiction SILÈNE / MAAR-3 est déplacée dans la réussite :
           c'est une révélation, pas une question. */
        defi:{ type:"enigme",
          texte:"TOUTES UNITÉS — MAINTENIR LE PÉRIMÈTRE JUSQU'À ██████████ DU PERSONNEL NON ÉVACUÉ.",
          question:"« Les trois balises disaient la même phrase. De quoi le Protocole attend-il la fin ? »",
          reponses:["embarquement","l embarquement","l'embarquement","embarquer","embarcation"],
          indice:"La troisième balise l'a prononcé. Un seul mot.",
          reussite:[
            "Le mot se met en place et la phrase se referme sur elle-même. Ce n'était pas quatre machines cassées : c'était une seule, répétée quatre fois, depuis si longtemps qu'elle s'est fêlée en route.",
            "TOUTES UNITÉS — MAINTENIR LE PÉRIMÈTRE JUSQU'À L'EMBARQUEMENT DU PERSONNEL NON ÉVACUÉ.",
            "L'écran ne s'éteint pas. Il ajoute une ligne, comme s'il se parlait à lui-même :",
            "SILÈNE — TERME NON RÉPERTORIÉ. STATION : MAAR-3. ORDRE EN COURS.",
            "« En cours. » Sorn a un rire sec. « Trois cents ans, et le truc dit encore “en cours”. »",
            "Puis, trop vite, sans que tu aies rien demandé : « Et l'embarquement, t'emballe pas. C'est le mot qu'ils collaient sur tout, à l'époque. Embarquement des cargaisons, embarquement des équipes, embarquement de la soupe. Ça veut rien dire. »",
            "Il enchaîne aussitôt, un ton plus haut : « Silène non répertorié, forcément. Ces machines connaissent que les matricules. MAAR-3, MAAR-12, va savoir. C'est des machines. »",
            "« Bon. T'as ce que je voulais. Rentre. »"
          ] } }
    ],
    recompense:{ credits:120, xp:25, flags:{} }
  },

  {
    id:"q2",
    nom:"L'écho du Protocole",
    donneur:"Vieux Sorn",
    // Q2 = la quête où Sorn est OBLIGÉ de parler. Révélations en escalier :
    //   1. il connaît les codes (savoir de famille) · 2. son NOM est sur un
    //   registre vieux de trois siècles · 3. il y est barré (« déserteur »)
    //   · 4. son aïeul n'a pas fui : il a EXÉCUTÉ, puis déserté trois jours après.
    // ⚠ Sorn DÉCOUVRE tout ça en même temps que le joueur. Il n'a jamais su.
    // ⚠ Les 80 non-embarqués sont une révélation de Q4 : ne PAS les citer ici.
    // ⚠ Le signataire de l'ordre reste ILLISIBLE. (La piste « Maar = Mère » est
    //    ABANDONNÉE — voir LORE_Protocole.md. Le mystère porte sur le Protocole.)
    intro:[
      "Sorn ne lève pas les yeux de son établi quand tu pousses la porte. Il démonte le même connecteur depuis un moment, et le remonte, et le redémonte.",
      "« Le truc, à l'anneau. Ce qu'il t'a sorti. » Il repose son tournevis, très lentement. « Un ordre qui tourne encore. Ça veut dire que quelqu'un l'a signé, et que personne ne l'a jamais annulé. »",
      "« Je veux savoir qui. » Il te regarde enfin, et pour une fois il n'y a aucune moquerie dedans. « Trois endroits. Tu me rapportes ce que tu trouves, et tu poses pas de questions. Marché conclu ? »"
    ],
    etapes:[

      /* ---- 1. L'atelier enseveli — CADENAS (ratable, mais rendu facile par Sorn) ---- */
      { indice:"Toundra, à l'écart de la cité. Sous la neige, un poste de maintenance. Personne l'a rouvert depuis. Personne.",
        cible:{ x:2050, y:250, r:80 }, leurres:[ {x:1200,y:900,r:80}, {x:600,y:1300,r:80}, {x:1650,y:520,r:80} ],
        image:"images/quetes/q2/1.png",
        arrivee:[
          "Une trappe affleure sous la poudreuse, marquée d'un sigle du Protocole à demi effacé. Le sas est verrouillé par un cadenas à glyphes, de ceux qu'on ouvrait au chalumeau faute de mieux.",
          "« Perds pas ton temps à le forcer. » Sorn s'est manifesté avant même que tu ne demandes. Un silence. « Ils utilisaient jamais plus de trois glyphes. Et toujours dans le même petit jeu. Essaie, tu verras. »",
          "Tu ne lui demandes pas comment il le sait. Il dirait que c'est un savoir de famille, et il aurait raison sans savoir pourquoi."
        ],
        /* ⚠ Les quatre glyphes sont ceux du Protocole, repris tels quels dans
           l'épreuve de Q4 : le joueur les manipule ici sans les comprendre et
           en apprend le sens deux quêtes plus tard. Rétroactivement, ce cadenas
           devient un indice. Ne pas les changer sans changer Q4. */
        /* ⚠ v0.73 — CES QUATRE SYMBOLES SONT CEUX DE Q4. Le cadenas du poste (Q2) se
             manipule « à l'aveugle » ; en Q4, le joueur apprend leur sens. Les
             deux listes doivent rester IDENTIQUES, sans quoi le texte d'arrivée
             de Q4 (« quatre d'entre eux te sont familiers ») devient faux.
             ⛨ et ⛔ ont été remplacés : ils s'affichaient en emoji couleur sur
             iOS et Android, alors que le reste du jeu est en trait. */
        defi:{ type:"cadenas", longueur:3, symboles:["▣","⌁","⚑","⊘"], essais:8,
          texte:["Trois logements, quatre glyphes possibles. Le sas te dira, à chaque tentative, combien sont bien placés."],
          reussite:[
            "Le sas cède avec un soupir d'air comprimé vieux de trois cents ans. À l'intérieur : un établi, des outils rangés au carré, une combinaison pliée sur un tabouret. Quelqu'un est parti d'ici en pensant revenir.",
            "Tu ramasses un carnet de maintenance. Des relevés, des dates, des signatures abrégées.",
            "« Alors ? » La voix de Sorn est trop neutre. « …Bon. Y a un registre d'équipe quelque part au nord-ouest. Va le chercher. »"
          ] } },

      /* ---- 2. Le registre d'équipe — ORDRE (ratable) ---- */
      { indice:"À l'opposé, maintenant. L'angle le plus reculé du nord-ouest, loin de tout. Y avait de l'administratif là-bas.",
        cible:{ x:430, y:380, r:80 }, leurres:[ {x:1600,y:1200,r:80}, {x:1150,y:700,r:80}, {x:2100,y:500,r:80} ],
        image:"images/quetes/q2/2.png",
        arrivee:[
          "Un bloc administratif écrasé sous son propre toit. Dans ce qui fut un bureau, une console de registre tient encore debout, alimentée par on ne sait quoi.",
          "L'écran demande la reconstitution du journal de bord avant de délivrer la fiche d'équipe — une vérification de routine, pour un personnel qui n'existe plus depuis trois siècles."
        ],
        /* ⚠ v0.53 — l'épreuve demandait l'ordre d'AFFECTATION de sept noms, dont
           trois paires de postes identiques : rien à l'écran ne permettait de
           trancher (8 combinaisons possibles), et `ordre` est dans DEFIS_UNTRY,
           donc UN essai par jour. Remplacé par une chaîne de causes : chaque
           entrée nomme la précédente, l'ordre se lit dans le texte. */
        defi:{ type:"ordre",
          texte:["Six entrées de journal flottent à l'écran, dispersées par trois siècles de mémoire corrompue. La console refuse d'ouvrir la fiche d'équipe tant que la chronologie n'est pas rétablie."],
          consigne:"Remets les entrées dans l'ordre où elles ont été écrites.",
          elements:[
            "Relevé de routine 93487627. Rien à signaler sur le secteur nord.",
            "Relevé de routine 93487628. Le relais 12 émet une porteuse qui n'est pas au catalogue. Vareck demande une inspection.",
            "Inspection faite: ce n'est pas une panne, c'est un ordre. Nous n'avons pas l'habilitation pour le lire.",
            "Habilitations vérifiées. Demande de consigne transmise à l'autorité. En attente de réponse.",
            "Réponse reçue. Évacuation immédiate. Ne rien emporter, ne rien éteindre.",
            "Poste fermé jusqu'à nouvel ordre. Sept noms au registre, six passages au sas."
          ],
          reussite:[
            "La console valide et affiche la fiche complète de l'équipe. Ton regard s'arrête à la deuxième ligne.",
            "SORN, E. — TECHNICIEN RELAIS — STATUT : DÉSERTION. RADIÉ. NE PAS RÉINTÉGRER.",
            "Tu appelles. Pas de réponse. Tu appelles encore. Quand la radio se rallume enfin, la voix est méconnaissable de platitude : « Lis-moi la ligne. Mot pour mot. »",
            "Tu la lis. Le silence qui suit dure le temps d'un trajet entier.",
            "« Chez nous, on disait qu'il s'était sauvé. Un lâche, dans la famille, on fait avec. » Un raclement de gorge. « On disait pas qu'il était technicien relais. Ça, on l'a jamais dit. »",
            "Puis, trop vite : « Y a un péage mort dans les vieilles galeries du sud-ouest. Il lui faut de la monnaie. Vas-y. »"
          ] } },

      /* ---- 3. Le péage mort — PAIEMENT (non ratable) ---- */
      { indice:"Vieilles galeries du sud-ouest. Un portique qui réclame encore son dû. Prends de la monnaie.",
        /* ⚠ v0.61 — la cible était en (820,500), dans le NORD-ouest, sur l'autre
           filon : l'indice envoie au sud-ouest, aux « vieilles galeries » de Q1
           (760,1320). Un joueur qui suivait l'indice ne pouvait pas trouver. */
        cible:{ x:700, y:1260, r:80 }, leurres:[ {x:1450,y:1100,r:80}, {x:1900,y:250,r:80}, {x:1000,y:1350,r:80} ],
        image:"images/quetes/q2/3.png",
        arrivee:[
          "Le portique se dresse au milieu de nulle part, barrant une galerie qui ne mène plus à rien. Un lecteur de crédits clignote, patient, impeccablement entretenu par ses propres automatismes.",
          "REDEVANCE D'ACCÈS — PERSONNEL AUTORISÉ UNIQUEMENT. Trois cents ans que la machine facture le passage à des ouvriers qui ne viendront pas.",
          "« Paie », lâche Sorn. « Discute pas avec une caisse enregistreuse. Elle a pas d'avis, elle a une consigne. C'est pire. »"
        ],
        defi:{ type:"paiement", cout:80,
          texte:["Le lecteur attend. La somme est dérisoire ; c'est l'obstination qui glace."],
          reussite:[
            "Le portique s'ouvre sur un couloir de service, et derrière, une antenne relais toujours en fonction — celle qui rediffuse l'ordre à tout le secteur depuis le début.",
            "« Voilà. » Sorn a repris sa voix normale, ou presque. « C'est de là que ça part. Va au bout, gamin. Autant que ce soit toi. »"
          ] } },

      /* ---- 4. L'émetteur — ÉNIGME (essais illimités : on ne bloque jamais un final) ---- */
      { indice:"Le seuil de l'anneau. Un peu au nord de la balise que tu connais. …Vas-y. Autant que ce soit toi.",
        cible:{ x:560, y:900, r:80 }, leurres:[ {x:1750,y:700,r:80}, {x:1100,y:1300,r:80}, {x:2050,y:1000,r:80} ],
        image:"images/quetes/q2/4.png",
        arrivee:[
          "L'émetteur est une colonne noire plantée face à l'anneau. Aucune arme, aucune défense : juste une voix qui répète un ordre depuis trois cents ans, dans le vide.",
          "Un terminal de service s'allume à ton approche. VÉRIFICATION D'IDENTITÉ REQUISE POUR CONSULTATION DE L'ORDRE PERMANENT.",
          "Il demande le nom du technicien de garde le jour de la fermeture du périmètre. Tu as lu le registre. Tu sais."
        ],
        defi:{ type:"enigme",
          texte:"NOM DU TECHNICIEN DE GARDE — FERMETURE DU PÉRIMÈTRE.",
          question:"« Qui était de garde ce jour-là ? »",
          reponses:["sorn","e. sorn","sorn, e.","vieux sorn","e sorn"],
          indice:"Deuxième ligne du registre d'équipe.",
          reussite:[
            "IDENTITÉ CONFIRMÉE. ORDRE PERMANENT — SCELLEMENT DU PÉRIMÈTRE. EXÉCUTANT : SORN, E. SIGNATAIRE : [DONNÉE CORROMPUE]. STATUT : JAMAIS ANNULÉ.",
            "Exécutant. Pas témoin, pas suspect. Celui qui a fait le geste.",
            "« Il l'a fait. » La voix de Sorn arrive sans prévenir, très calme, et c'est cette platitude qui inquiète. « On m'a raconté toute mon enfance qu'il avait détalé. Il a pas détalé. Il a fermé la boucle, proprement, parce qu'on le lui avait demandé. »",
            "« Et il a déserté trois jours après. » Un long silence. « Trois jours. Qu'est-ce qu'on comprend, en trois jours, pour lâcher un poste qu'on vient de tenir ? »",
            "« Le signataire est illisible. Évidemment. » Un rire bref, pas drôle du tout. « Trois siècles que ma famille répare leurs relais sans savoir pourquoi. J'ai la moitié de la réponse et elle me plaît pas. »",
            "Un cliquetis : il te vire ta paie avant que tu dises quoi que ce soit. « Rentre. Et va pas t'imaginer qu'on est amis. »"
          ] } }
    ],
    recompense:{ credits:250, xp:40, pa:1, flags:{} }
  },

  {
    id:"q3",
    nom:"La fleur qui n'aurait pas dû",
    donneur:"Adaya",
    /* ⚠ v0.67 — « Serre du Rhizome » était faux : la quête se prend au comptoir
       de SA PROPRE cité, quelle que soit la faction du joueur. Adaya y vient,
       puis emmène le joueur à sa serre (étape 1, cible = Le Rhizome). */
    donneurLieu:"Comptoir",
    // Première quête sans Sorn : Adaya porte le nom de la 3e ligne du registre
    // de Q2. ⚠ CANON v2 — elle n'est PAS un témoin (trois siècles) mais une
    // DESCENDANTE. Sa mémoire de famille dit « on était dehors et on est
    // rentré à pied » ; celle des Sorn dit « il s'est sauvé ». Les deux
    // décrivent le même jour et ne se recoupent pas. Elles ne se parlent
    // jamais : le joueur est leur seul lien.
    // Premier défi « choix » de la campagne (site 3) : savoir / vivant / profit.
    // Gains SEULEMENT (pas de malus tant que les joueurs n'ont rien accumulé).
    // Le moteur gère pourtant les valeurs négatives : à envisager plus tard.
    intro:[
      /* ⚠ v0.67 — l'intro se passait « sous la verrière » alors qu'on prend la quête
       au comptoir de sa propre cité : Adaya vient au comptoir, et c'est l'étape 1
       qui emmène le joueur à sa serre, au Rhizome. */
    "La vieille femme t'attend au comptoir, un bocal serré contre elle et de la terre noire encore sous les ongles. Elle ne se retourne pas tout de suite.",
      "« Adaya. » Elle s'essuie enfin les paumes. « On m'a dit qu'un bleu était allé fouiller un registre d'équipe au nord-ouest. Un registre où il y a mon nom, figure-toi. Troisième ligne. Trois cents ans avant moi, mais c'est le même. »",
      "Elle te laisse encaisser, puis désigne du menton un bocal posé sur l'établi : une tige pâle, luminescente, qui pulse doucement dans son bouillon.",
      "« Ça, ça pousse le long de l'ancien périmètre. Exactement le long. Sur une terre où rien ne prend depuis trois siècles. » Elle te regarde. « J'aimerais comprendre avant de mourir. Tu m'aides ? »",
      "« Mais pas ici. » Elle rassemble son bocal dans un linge. « Mon matériel est au Rhizome, sous verrière. Rejoins-moi là-bas : on monte le bain d'analyse, et après seulement tu iras dehors. »",
    "Elle t'accroche une oreillette au col — la même camelote que celle de Sorn, en mieux entretenue. « Je te guide. Je serai précise sur le pourquoi, approximative sur le où. La carte date d'avant. »"
    ],
    etapes:[

      /* ---- 1. La serre obstinée — LIVRAISON (non ratable) ---- */
      { indice:"Rejoins-moi au Rhizome, sous la grande verrière — c'est là qu'est mon matériel. Apporte de quoi monter le bain d'analyse.",
        cible:{ x:1250, y:770, r:90 }, leurres:[ {x:1900,y:400,r:80}, {x:700,y:1250,r:80}, {x:1500,y:150,r:80} ],
        image:"images/quetes/q3/1.png",
        arrivee:[
          "Les serres du Rhizome bourdonnent d'insectes pollinisateurs relâchés là depuis des générations. Adaya a monté sa paillasse entre deux rangs de ferragave, comme si de rien n'était.",
          "« Avant de courir dehors, on prépare le bain. Sans milieu de culture, ton échantillon sera bon à jeter en deux heures. »"
        ],
        defi:{ type:"livraison",
          objets:{ sylve:3, sporelle:2 },
          texte:["Il lui faut de la Sylve pour le substrat et de la Sporelle pour la culture. Ça pousse dans le coin, ou ça s'achète."],
          reussite:[
            "Elle broie, filtre, verse. Ses gestes ont la précision d'un métier qu'on n'oublie pas.",
            "« Chez nous, on raconte toujours la même histoire aux gosses. » Elle ne lève pas les yeux de sa pipette. « Celle-là était dehors ce jour-là, relevé de sondes, secteur nord. Elle a vu le périmètre se fermer d'un coup, comme une paupière. Et plus de radio. »",
            "« Elle est rentrée à pied. Onze jours. » Un temps. « Douze étaient partis ce matin-là. On n'a jamais dit combien sont revenus — ça, c'est la partie qu'on saute. »",
            "Elle bouche le flacon d'un coup sec. « Bon. Le tracé, maintenant. »"
          ] } },

      /* ---- 2. Le tracé — SEQUENCE (ratable) ---- */
      { indice:"Entre nos champs et l'anneau, à mi-chemin. Cherche la ligne de floraison — tu la rateras pas, elle est trop droite pour être honnête.",
        cible:{ x:900, y:880, r:80 }, leurres:[ {x:1600,y:1250,r:80}, {x:2000,y:700,r:80}, {x:1150,y:300,r:80} ],
        image:"images/quetes/q3/2.png",
        arrivee:[
          "La silène court sur le sol nu, en un ruban pâle qui file vers l'horizon sans dévier d'un mètre. Rien dans la nature ne pousse aussi droit.",
          "« Les pieds s'allument en cascade, l'un après l'autre », grésille Adaya. « Relève l'ordre. Si c'est un signal, il se répète. Si c'est du hasard, on le saura aussi. »"
        ],
        /* ⚠ Cette séquence EST le rythme du périmètre — le cycle d'appel que le
           Protocole rejoue depuis trois siècles. Le joueur la reproduit ici
           sans le savoir, la reconnaît en Q4 et l'exécute de ses mains en Q5
           (défi `sequence`, même CADENCE_PERIMETRE). Ne pas la traiter comme un Simon Says décoratif. */
        defi:{ type:"sequence", longueur:5, cadence:CADENCE_PERIMETRE,
          texte:["Les corolles s'illuminent l'une après l'autre, puis s'éteignent. Reproduis la séquence."],
          reussite:[
            "Le motif se répète, identique, à la seconde près. Ce n'est pas une plante qui pousse : c'est une plante qui bat la mesure.",
            "Un long silence dans l'oreillette. « …Répète-moi ça. » Adaya te fait recommencer deux fois. Puis, très bas : « Elles suivent une horloge. Pas une saison, petit — une horloge. »",
            "« Et les Nomades ont un chant de route qui fait exactement ce trajet. Personne chez eux ne sait pourquoi. Ils le chantent, c'est tout. »",
            "« Il y a un creux, plus loin, où elles sont vieilles et serrées. Va voir. Et écoute-moi bien : ce que tu ramènes de là-bas, c'est toi qui décides. »"
          ] } },

      /* ---- 3. La souche mère — CHOIX (Cercles) ---- */
      { indice:"Suis le ruban jusqu'à un creux abrité. C'est le plus vieux massif du secteur. Et le seul.",
        cible:{ x:640, y:760, r:80 }, leurres:[ {x:1350,y:1150,r:80}, {x:1800,y:520,r:80}, {x:520,y:1400,r:80} ],
        image:"images/quetes/q3/3.png",
        arrivee:[
          "Le creux respire. Des centaines de tiges enchevêtrées, certaines épaisses comme un bras, pulsent ensemble dans une lumière laiteuse. Au centre, une souche unique dont tout le reste semble partir.",
          "« Trois façons de faire, et je te mentirai pas sur les prix », dit Adaya. « Tu prélèves la souche, j'ai ma réponse et le massif meurt. Tu relèves sans toucher, j'ai des bribes et il vit. Ou tu ramasses ce qui se vend, et tu manges ce mois-ci. »",
          "« Je te demanderai pas de te justifier. »"
        ],
        defi:{ type:"choix",
          texte:["La souche pulse sous ta paume, tiède. Ce que tu fais maintenant, personne ne le verra jamais."],
          options:[
            { texte:"Prélever la souche entière — la réponse, quel qu'en soit le prix.",
              cercles:{ assembleurs:5 },
              journal:"Tu as tranché la souche. Le massif s'éteint derrière toi, tige après tige." },
            { texte:"Relever sans prélever — des données incomplètes, un massif vivant.",
              cercles:{ racines:5 },
              journal:"Tu as tout noté et rien pris. Le creux respire encore." },
            { texte:"Récolter tout ce qui se monnaie et vendre le reste au plus offrant.",
              cercles:{ eclats:5 },
              journal:"Ton sac est plein et ta conscience légère. Le creux, lui, ne s'en remettra pas." }
          ],
          reussite:[
            "Tu remontes du creux. La lumière du massif — ce qu'il en reste — décroît lentement derrière toi.",
            "« Rentre », dit Adaya. « On analyse. »"
          ] } },

      /* ---- 4. Le verdict — ATTENTE (non ratable) ---- */
      { indice:"Reviens à la serre. Et prends ton temps, l'analyse en prendra aussi.",
        cible:{ x:1250, y:770, r:90 }, leurres:[ {x:800,y:400,r:80}, {x:1700,y:1100,r:80}, {x:2100,y:800,r:80} ],
        image:"images/quetes/q3/4.png",
        arrivee:[
          "Adaya travaille sans un mot pendant que la centrifugeuse hurle. Dehors, la nuit tombe sur les serres.",
          "« Deux heures, au moins. Assieds-toi, ou va faire un tour. Je t'appelle. »"
        ],
        // ⚠ v0.66 : 60000 ms = 1 min (valeur de test oubliée). L'analyse de la
        // centrifugeuse dure 2 h — le joueur peut s'éloigner et revenir.
        defi:{ type:"attente", duree:2*3600*1000,
          texte:["La centrifugeuse tourne. Rien à faire qu'attendre — tu peux t'éloigner et revenir."],
          reussite:[
            "« La plante n'est pas d'ici. » Adaya pose ses lunettes. « Enfin — elle n'est pas d'ici comme le reste n'est pas d'ici. Elle est arrivée avec nous. Elle a juste mieux tenu le coup. »",
            "« Et elle ne compte pas les jours : elle suit quelque chose. » Adaya tapote son relevé. « Les vagues reviennent au même intervalle, encore et encore, sans jamais aboutir à rien. Ça ne descend pas vers une date. Ça tourne. »",
            "« Quelque chose, là-bas, recommence la même chose depuis trois cents ans. Je saurai pas te dire quoi, pas avec ce que j'ai, pas avec ce qu'il me reste de temps. »",
            "Elle range ses flacons un long moment. Puis, sans se retourner : « Il reste un Sorn ? Du technicien relais, celui de la deuxième ligne. »",
            "Tu réponds. Elle hoche la tête, une seule fois, et ne demande rien d'autre — ni où, ni comment, ni pourquoi les deux familles ne se sont jamais adressé la parole en trois siècles.",
            "« Reviens quand tu veux, petit. La serre est ouverte. »"
          ] } }
    ],
    recompense:{ credits:350, xp:55, pa:1, flags:{} }
  },

  {
    id:"q4",
    nom:"Ce qui dormait",
    donneur:"Vieux Sorn",
    // ⚠ CANON v2 — l'intervalle de la silène (Q3) n'est PAS un compte à rebours
    // (un décompte de trois siècles n'a pas de sens) : c'est un CYCLE D'APPEL.
    // Périodiquement, le Protocole rouvre le quai, diffuse l'appel, attend,
    // referme. Depuis trois cents ans. Personne ne vient. Il recommence.
    // Sorn n'y était pas : il le DÉDUIT, comme le joueur.
    // ⚠ CONTRÔLE DE NIVEAU : combat puissance 22 au site 3.
    //   Base 10/10/10 + 3 pts/niveau -> victoire nette vers le niveau 5 en spécialisé,
    //   arrachée dès 16, échec sous 16 (personnage qui n'a rien dépensé).
    // Le manifeste du site 4 amorce Q5 : une navette encore enregistrée à quai.
    intro:[
      "Sorn t'attend debout, ce qui ne lui ressemble pas. Il a un papier à la main — le relevé d'Adaya, transmis par tu ne sais quel détour.",
      "« Elle dit que ta fleur bat la mesure. Elle a raison. » Il pose le papier. « Et moi j'ai passé la nuit dessus. »",
      "« Une horloge, ça tourne en rond. Celle-là aussi. Sauf qu'une horloge, ça sert à savoir l'heure — et ce truc-là, il sert à appeler quelqu'un. » Il laisse le mot tomber tout seul. « À intervalle fixe. Encore. Et encore. »",
      "« Et ça appelle vers un endroit précis. » Il décroche l'oreillette du clou, et sa main tremble un peu. « L'embarquement, gamin. Le mot que je t'avais dit de laisser tomber. Tu vas y aller, et après ça on n'en parle plus jamais. »"
    ],
    etapes:[

      /* ---- 1. Le point de convergence — GLYPHES (ratable) ---- */
      { indice:"Reprends le ruban de fleurs et remonte-le vers l'ouest, là où il se resserre. La signalétique du Protocole tient encore debout par là.",
        cible:{ x:760, y:660, r:80 }, leurres:[ {x:1500,y:1150,r:80}, {x:1950,y:480,r:80}, {x:1050,y:1400,r:80} ],
        image:"images/quetes/q4/1.png",
        arrivee:[
          "Les tiges se resserrent en un faisceau qui ne laisse plus de doute sur la direction. À l'endroit où elles convergent, des panneaux de service émergent du sol, leurs pictogrammes encore lisibles sous la poussière.",
          "Quatre d'entre eux te sont familiers. Tu les as manipulés à l'aveugle, sur le cadenas du poste enseveli, sans savoir qu'ils voulaient dire quelque chose.",
          "« Ces symboles, c'est le seul héritage propre de ma famille », grogne Sorn. « On me les a appris avant l'alphabet, et personne n'a jamais su me dire pourquoi. Apparie-les, ils t'indiqueront la porte de service. »"
        ],
        defi:{ type:"glyphes",
          texte:["Six panneaux de service, six glyphes du Protocole. Rends à chacun son sens."],
          consigne:"Associe chaque pictogramme à sa signification.",
          paires:[
            { picto:"▣", glyphe:"ΛΞ", sens:"Périmètre" },
            { picto:"⌁", glyphe:"ΘΘ", sens:"Alimentation" },
            { picto:"⚑", glyphe:"ΨΔ", sens:"Point de rassemblement" },
            { picto:"◷", glyphe:"ΞΞ", sens:"Départ programmé" },
            { picto:"✚", glyphe:"ΦΛ", sens:"Poste médical" },
            { picto:"⊘", glyphe:"ΔΔ", sens:"Accès restreint" }
          ],
          distracteurs:["Zone de forage","Réfectoire","Quarantaine"],
          reussite:[
            "Les panneaux racontent tous la même chose : ici, on rassemblait, on soignait, et on partait. À heure fixe.",
            "Une flèche à demi effacée pointe vers un talus. Dessous, une porte de service, close.",
            "« Voilà. » La voix de Sorn s'est éteinte d'un cran. « Le hangar est derrière. »"
          ] } },

      /* ---- 2. La pile morte — LIVRAISON (non ratable) ---- */
      { indice:"La porte de service est juste à côté, mais elle n'a plus de jus depuis trois cents ans. Trouve de quoi la réveiller.",
        cible:{ x:700, y:600, r:80 }, leurres:[ {x:1400,y:900,r:80}, {x:1800,y:1300,r:80}, {x:1200,y:200,r:80} ],
        image:"images/quetes/q4/2.png",
        arrivee:[
          "La porte est intacte, ce qui est déjà une information : personne n'est entré ici depuis la fermeture. Le boîtier d'alimentation pend, vidé de sa cellule.",
          "« Trois Voltane et un lingot, ça suffira à lui redonner le goût de s'ouvrir », dit Sorn. « Prends ton temps. Elle est pas pressée, elle. »"
        ],
        defi:{ type:"livraison",
          objets:{ voltane:3, fab_lingot_de_voltane:1 },
          texte:["Le boîtier réclame de la Voltane brute et un lingot pour tenir la charge."],
          reussite:[
            "La porte remonte de trente centimètres et se bloque en grinçant. Assez pour passer, pas assez pour être rassurant.",
            "De l'autre côté : un hall d'embarquement. Des bancs alignés. Des sacs, encore posés dessous."
          ] } },

      /* ---- 3. La sentinelle — COMBAT (contrôle de niveau) ---- */
      { indice:"Entre dans le hall. Et gamin — quoi que tu croises là-dedans, ça fait que son boulot. Ça change rien, mais je préfère que tu le saches.",
        cible:{ x:680, y:560, r:80 }, leurres:[ {x:1600,y:400,r:80}, {x:900,y:1250,r:80}, {x:2000,y:950,r:80} ],
        image:"images/quetes/q4/3.png",
        arrivee:[
          "Elle est au fond du hall, immobile depuis si longtemps que la poussière a fait d'elle une statue. Ton pas la réveille. Elle se déplie sans hâte, sans colère, et se met en travers du couloir.",
          "Sous la poussière, la silhouette est blindée, close, sans visage. Impossible de dire s'il y a un mécanisme là-dedans ou quelqu'un. Tu ne le sauras pas aujourd'hui.",
          "ACCÈS RESTREINT. ÉVACUATION EN COURS. VEUILLEZ REJOINDRE LE POINT DE RASSEMBLEMENT.",
          "« Elle croit encore que l'embarquement a lieu aujourd'hui », souffle Sorn. « Trois cents ans qu'elle attend qu'on lui dise que c'est fini. Personne l'a jamais fait. Personne peut. »"
        ],
        defi:{ type:"combat",
          nom:"Sentinelle d'embarquement",
          puissance:22,
          gain:2,
          xp:10,
          texte:["Elle ne t'attaquera pas la première. Elle ne te laissera pas passer non plus. Elle applique une consigne, et la consigne n'a pas de date de fin."],
          reussite:[
            "La sentinelle se replie enfin, ou s'effondre, ou se tait — selon la manière dont tu t'y es pris. Le couloir est libre.",
            "Sorn ne dit rien pendant que tu enjambes ce qu'il en reste."
          ] } },

      /* ---- 4. Le manifeste — ÉNIGME (essais illimités : jamais de verrou sur un final) ---- */
      { indice:"Au bout du couloir, le poste d'embarquement. C'est là que tout s'est joué. Vas-y.",
        cible:{ x:640, y:520, r:80 }, leurres:[ {x:1300,y:1000,r:80}, {x:1850,y:650,r:80}, {x:1100,y:1450,r:80} ],
        image:"images/quetes/q4/4.png",
        arrivee:[
          "Le poste d'embarquement est resté ouvert, registres compris. Sur l'écran principal, le manifeste de la dernière rotation clignote encore, jamais clôturé.",
          "PERSONNEL RECENSÉ : 1 324.   EMBARQUÉS : 1 244.   NON EMBARQUÉS : ___.",
          "CLÔTURE IMPOSSIBLE — SAISIE MANQUANTE. La machine attend depuis trois cents ans qu'un opérateur lui donne le chiffre. Les deux autres sont là, sous tes yeux, depuis le début."
        ],
        /* ⚠ Le chiffre 80 est une RÉVÉLATION de cette quête, pas un acquis :
           il ne peut donc pas être demandé de mémoire. L'écran affiche le
           recensé et les embarqués — le joueur soustrait. Comprendre l'écran
           EST la solution. (L'ancien indice renvoyait à une réplique de Q2
           qui n'existe plus : les 80 y étaient annoncés trop tôt.) */
        defi:{ type:"enigme",
          texte:"NON EMBARQUÉS — SAISIE REQUISE POUR CLÔTURE.",
          question:"« Combien de personnes ne sont jamais montées à bord ? »",
          reponses:["80","quatre-vingts","quatre vingts","quatre-vingt","80 personnes"],
          indice:"Recensés moins embarqués. Les deux nombres sont affichés au-dessus.",
          reussite:[
            "Quatre-vingts. Tu saisis le chiffre, et il te paraît d'abord petit — jusqu'à ce que tu penses aux bancs du hall, et aux sacs encore posés dessous.",
            "Le registre se clôt dans un déclic minuscule, et l'écran affiche, pour la première fois depuis trois cents ans : ROTATION CLÔTURÉE.",
            "« Quatre-vingts. » Sorn répète le mot comme s'il le pesait. « Ils avaient jusqu'au soir pour rentrer. Après la coupure, ils avaient plus rien pour se faire rappeler. »",
            "Un silence. « Voilà ce qu'il a compris en trois jours. »",
            "Puis, en dessous, une ligne que personne n'était là pour lire :",
            "APPAREIL DE RÉSERVE — NAVETTE MAAR-3/07 — STATUT : À QUAI. ENTRETIEN AUTOMATIQUE ACTIF. EN ATTENTE D'ÉQUIPAGE.",
            "« …Répète. » La voix de Sorn n'est plus la même. « Répète ce que tu viens de lire, gamin. Lentement. »",
            "Un silence très long. Puis, presque pour lui-même : « Y en a une qui est jamais partie. »"
          ] } }
    ],
    recompense:{ credits:500, xp:80, pa:1, flags:{} }
  },

  {
    id:"q5",
    nom:"L'appareil de réserve",
    donneur:"Vieux Sorn",
    // Dernière vérité : c'est le NOM des Sorn qui est radié (« NE PAS
    // RÉINTÉGRER », lu en Q2), pas l'homme. Un registre vieux de trois siècles
    // refuse encore un patronyme. Il n'a jamais cherché la navette parce que
    // la trouver l'obligerait à constater qu'il ne peut pas monter dedans.
    // ⚠ C'est ici que tombe la révélation majeure de l'arc (étape 2) : le
    //    Protocole est fait d'HOMMES. Tout le fil « c'est des machines »,
    //    semé dès Q1 par Sorn lui-même, se paie là.
    intro:[
      "Sorn n'a pas dormi. Ça se voit à sa façon de tenir sa tasse à deux mains.",
      "« Un appareil de réserve, c'était dans les procédures. Une navette qu'on laisse à quai au cas où. » Il tapote le carnet de maintenance que tu lui as rapporté du poste enseveli. « C'est écrit là-dedans, en marge. Je l'ai lu à quinze ans. J'ai jamais cherché. »",
      "Il repose la tasse. « Le quai est sous l'anneau. C'est pour ça qu'ils le gardent, tu comprends ? Ils gardent pas un secret. Ils gardent une zone d'embarquement, parce que personne a jamais déclaré l'évacuation terminée. »",
      "« Toi tu viens de clôturer la rotation. Donc y a une place d'équipage qui s'est ouverte. » Il te regarde. « Va la prendre. »"
    ],
    etapes:[

      /* ---- 1. Le quai scellé — PIRATAGE (ratable) ---- */
      { indice:"Reprends les couloirs de service du hall. Ça descend, ça passe sous l'anneau. T'entres pas dedans, tu passes dessous — nuance.",
        cible:{ x:600, y:480, r:80 }, leurres:[ {x:1450,y:800,r:80}, {x:1900,y:1200,r:80}, {x:1000,y:180,r:80} ],
        image:"images/quetes/q5/1.png",
        arrivee:[
          "Le couloir descend longtemps. Puis il débouche sur un volume immense, éclairé par des veilleuses qui n'ont jamais cessé de fonctionner : un quai d'embarquement, sous des centaines de tonnes de structure.",
          "Le sas terminal est scellé par une procédure toujours active. « Cherche le canal de maintenance, pas la porte », dit Sorn. « Ils laissaient toujours une voie de service. » Un temps. « …Je le sais, c'est tout. »"
        ],
        defi:{ type:"piratage",
          texte:["Le sas refuse l'accès. Un canal de maintenance reste ouvert, mal protégé — il n'a jamais servi."],
          reussite:[
            "Le sas s'ouvre sur le quai. Elle est là, posée sur ses béquilles, bâchée, minuscule sous la voûte : la navette de réserve.",
            "Sorn ne dit rien pendant un long moment. Puis : « Elle est propre. L'entretien automatique a tenu trois cents ans. » Sa voix se casse à peine. « Ces machines-là aussi, elles ont fait leur boulot. »"
          ] } },

      /* ---- 2. Le dépôt de pièces — PAIEMENT ---- */
      { indice:"Y a un dépôt corporatif à l'étage au-dessus. Il facture encore. Prends de quoi payer, il négocie pas.",
        cible:{ x:660, y:420, r:80 }, leurres:[ {x:1250,y:1100,r:80}, {x:1750,y:300,r:80}, {x:2050,y:900,r:80} ],
        image:"images/quetes/q5/2.png",
        arrivee:[
          "Le dépôt a survécu à tout, y compris à la fin du monde qui l'employait. Derrière une vitre blindée, des rechanges alignés au cordeau, et un terminal de facturation d'une politesse insupportable.",
          "La coursive qui y mène surplombe le quai. Tu y arrives au mauvais moment — ou au bon.",
          "En bas, une lumière ambre s'allume sur toute la longueur du quai. Puis une seconde. Puis une troisième, et la cadence s'installe : celle que tu as reproduite sur les corolles, à la fleur près.",
          "APPEL D'EMBARQUEMENT — PERSONNEL NON ÉVACUÉ — PRÉSENTEZ-VOUS AU POINT DE RASSEMBLEMENT.",
          "Ils sont onze. Ils se rangent le long de la ligne jaune, à intervalles réguliers, et ils attendent. Personne ne vient. Ils attendent quand même, le temps qu'il faut, parce que c'est le temps prévu.",
          "Puis les lumières s'éteignent dans l'ordre inverse, et l'un d'eux fait un geste. Ils décrochent leurs casques.",
          "Il y a des visages dessous. Un homme âgé, deux très jeunes. L'un se frotte les yeux. Un autre dit quelque chose et deux épaules se secouent de rire — tu n'entends rien, la vitre est trop épaisse, mais on rit pareil partout.",
          "Dans ton oreillette, Sorn ne dit rien du tout. Pendant très longtemps.",
          "Puis : « …J'ai passé ma vie à dire que c'était des machines. »",
          "L'entretien automatique de la navette a consommé ses stocks depuis des décennies. Il lui faut des joints, un régulateur, une cellule neuve.",
          "« Paie. » Sa voix est enrouée. « Le dépôt, lui, c'est bien une machine. Elles ont pas d'avis, elles ont un tarif. »"
        ],
        defi:{ type:"paiement", cout:800,
          texte:["Le terminal affiche la note. Elle est salée, et parfaitement indifférente à ta situation."],
          reussite:[
            "Le bras de service délivre les pièces une à une, avec des précautions dérisoires, et te souhaite une bonne rotation.",
            "Tu remontes les bras chargés. La navette, elle, n'a pas bougé d'un millimètre depuis trois cents ans."
          ] } },

      /* ---- 3. Le réveil — SÉQUENCE (ratable) ---- */
      { indice:"Retourne au quai et monte à bord. Elle va te demander de répéter sa séquence d'allumage — c'est sa façon de vérifier qu'elle a un équipage.",
        cible:{ x:600, y:480, r:80 }, leurres:[ {x:1350,y:700,r:80}, {x:1850,y:1000,r:80}, {x:950,y:1300,r:80} ],
        image:"images/quetes/q5/3.png",
        arrivee:[
          "L'habitacle sent le plastique neuf et l'air recyclé mille fois. Les sièges n'ont jamais été occupés. Sur la console, un mot manuscrit, scotché puis oublié : « pour la dernière rotation ».",
          "Tu poses les pièces. La navette s'éveille, teste ses circuits un par un, puis affiche une séquence lumineuse et attend."
        ],
        /* ⚠ C'est la MÊME cadence que les corolles de Q3 et que l'appel vu à
           l'étape 2 : le joueur exécute de ses mains le geste que le Protocole
           répète dans le vide depuis trois siècles. Écho long de l'arc. */
        defi:{ type:"sequence", longueur:5, cadence:CADENCE_PERIMETRE,
          texte:["VÉRIFICATION D'ÉQUIPAGE. RÉPÉTEZ LA SÉQUENCE D'ALLUMAGE."],
          reussite:[
            "Tes doigts la connaissent avant toi. C'est la cadence des corolles, celle du quai, celle qu'ils battent en bas depuis trois cents ans — la navette et les fleurs et les hommes suivent tous la même horloge, et tu viens de la reproduire sans y penser.",
            "Les réacteurs de manœuvre s'amorcent dans un souffle grave qui fait vibrer tout le quai. Au-dessus, une trappe de plafond commence à s'écarter sur un morceau de ciel.",
            "« Elle marche. » Sorn a un rire bref, incrédule. « Bon sang, elle marche. »"
          ] } },

      /* ---- 4. Le rôle d'équipage — CHOIX (narratif + Cercles) ---- */
      { indice:"Reste à bord. Elle va te demander un cap. Réfléchis avant de répondre — c'est le genre de question qu'on te pose une fois.",
        cible:{ x:600, y:480, r:80 }, leurres:[ {x:1500,y:1250,r:80}, {x:2000,y:600,r:80}, {x:1100,y:250,r:80} ],
        image:"images/quetes/q5/4.png",
        arrivee:[
          "RÔLE D'ÉQUIPAGE — POSTE VACANT. INSCRIPTION ACCEPTÉE. La navette vient de t'enregistrer sans cérémonie, comme elle l'aurait fait il y a trois cents ans.",
          "CAP DE ROTATION — SAISIE REQUISE.",
          "Derrière toi, Sorn s'est approché du sas. Tu l'entends poser la main sur le lecteur d'identité."
        ],
        defi:{ type:"choix",
          texte:["Trois caps s'affichent. Aucun n'est recommandé — la machine n'a pas d'avis là-dessus non plus."],
          options:[
            { texte:"Une autre station. Si celle-ci s'appelle MAAR-3, les autres existent quelque part.",
              cercles:{ assembleurs:5 },
              journal:"Cap enregistré : les autres stations." },
            { texte:"Le champ d'astéroïdes. Ce qui se mine là-haut vaut cher ici.",
              cercles:{ eclats:5 },
              journal:"Cap enregistré : le champ d'astéroïdes." },
            { texte:"L'orbite de l'anneau. Le voir enfin d'en haut.",
              cercles:{ veilleurs:5 },
              journal:"Cap enregistré : l'orbite de l'anneau." }
          ],
          reussite:[
            "CAP ENREGISTRÉ. ROTATION EN ATTENTE DE DÉPART.",
            "Derrière toi, le lecteur d'identité émet un bip bref. SORN, E. — IDENTITÉ RADIÉE. ACCÈS REFUSÉ. NE PAS RÉINTÉGRER.",
            "Ce n'est pas lui qu'on refuse. C'est un nom, sur un registre qu'aucun vivant n'a signé, tenu par une administration morte depuis trois siècles. La machine ne fait pas la différence. Elle n'a jamais eu à la faire.",
            "Sorn retire sa main sans un mot. Il hoche la tête, une fois, comme on valide un calcul dont on connaissait déjà le résultat.",
            "« Bon. » Il redescend la passerelle. « J'ai des relais à réparer, moi. »",
            "Il ne se retourne pas. Sur la console, le mot manuscrit est toujours scotché là : « pour la dernière rotation ». Ce n'était pas la dernière."
          ] } }
    ],
    recompense:{ credits:800, xp:120, pa:2, flags:{ permisVaisseau:true, espace1:true } }
  }

  // Quête finale de la carte Silène : Q5 accorde le permis de vaisseau + ouvre l'espace (flag espace1).
  // La DERNIÈRE portera flags:{ permisVaisseau:true } (+ un flag type espace1:true
  // pour révéler l'onglet de la 1re carte spatiale, quand elle existera).
];
