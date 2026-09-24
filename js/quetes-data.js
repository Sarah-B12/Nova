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
    nom:"Les quatre balises",
    donneur:"Vieux Sorn",
    // ⚠ Coordonnées approximatives (monde 2400×1600) — à ajuster en jouant.
    // Fil rouge : les quatre balises rediffusent un même vieil ordre, en morceaux.
    //   « TOUTES UNITÉS — MAINTENIR LE PÉRIMÈTRE JUSQU'À L'EMBARQUEMENT
    //     DU PERSONNEL NON ÉVACUÉ. »
    // Le joueur n'apprend qu'une chose ici : ce n'est pas du bruit, c'est UN
    // texte, et ce texte est un ordre. Le mot semé est « embarquement » —
    // Sorn le désamorce trop vite à la balise 4.
    // ⚠ CANON v3 (21/09) : l'évacuation date d'environ TROIS CENTS ans. Sorn
    //    n'est pas un témoin mais un DESCENDANT (LORE.md §11) : il a hérité d'un
    //    métier — réparer les relais POUR ÉCOUTER — dont la raison s'est perdue,
    //    et de « l'ancien », la langue des machines, que sa famille est seule à
    //    parler encore. Il TRADUIT ce que disent les balises.
    // AUCUN défi ratable ici : première quête, on ne verrouille jamais un débutant.
    intro:[
      "Un vieux bonhomme voûté te jauge de son unique œil valide — l'autre disparaît sous un bandeau d'implants qui grésille par intermittence. « Encore un bleu qui croit qu'on survit ici avec du courage et un joli sac. »",
      "Il crache par terre, puis désigne du menton un boîtier fumant sur son établi. « J'ai réveillé un vieux relais du Protocole. Il recrache d'anciennes coordonnées — quatre balises. Moi, mes genoux rendent l'âme avant la première. »",
      "« Réparer ces saloperies, c'est le métier de ma famille. Mon père, son père, et ainsi de suite jusqu'à un type dont il ne reste qu'un nom sur un registre. » Il hausse une épaule. « Mon grand-père disait : on répare pas pour parler, on répare pour écouter. Écouter quoi, il savait plus. On le fait quand même. »",
      "Il tapote le boîtier. « Et ça cause en ancien, ces bestioles. La langue des machines. Chez nous on l'apprend au berceau, va savoir pourquoi — personne d'autre la parle depuis des siècles. Je te traduirai au vol. »",
      "« Toi, tu vas suivre ces balises et me rapporter ce qu'elles disent. Je te paie, et personne ne pleure. Enfin… si tu reviens. » Un rictus fend sa barbe grise. « Ce que je ne garantis pas, gamin. »",
      "Il te tend une oreillette cabossée. « Je te guide d'ici. Préviens-toi tout de suite : mon décodeur crache des zones, pas des points. Je te dirai où chercher, à toi de fouiller le coin. »",
      "« Et note ce que tu trouves. » Il désigne vaguement ton poignet. « T'as un carnet là-dedans — Communication, onglet Carnet. Ces balises disent des choses par bouts, et les bouts, ça se perd. Moi j'ai passé ma vie à regretter ce que j'ai pas écrit. »"
    ],
    etapes:[

      /* ---- 1. La Forge et l'écume — ÉNIGME (essais illimités) ---- */
      { indice:"Nord. Là où la roche de la Forge plonge dans l'eau — un point chaud à portée de l'écume. Fouille ce coin-là, j'ai pas mieux.",
        cible:{ x:1050, y:140, r:80 }, leurres:[ {x:1850,y:170,r:80}, {x:300,y:780,r:80}, {x:1500,y:1420,r:80} ],
        image:"images/quetes/q1/1.png",
        arrivee:[
          "La roche tiède fume doucement sous tes bottes. Un relais à demi enfoui clignote dans la caillasse ; une voix synthétique en jaillit, distordue, dans une langue que tu n'as jamais entendue : des consonnes sèches, des voyelles plates, une grammaire de formulaire. Elle se stabilise sur deux mots qu'elle répète en boucle.",
          "« Toutes unités », traduit Sorn dans ton oreille, sans même réfléchir. « Elle dit : toutes unités. Encore et encore. »",
          "Ta radio crachote. « Bien, t'y es. Le relais va vouloir que tu lui répètes ce qu'il vient de dire — c'est comme ça qu'ils vérifient qu'on les a reçus. Réponds, je lui passe ta voix en ancien. »"
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
            "Le relais accuse réception — deux tons secs, comme un fonctionnaire qui coche une case — puis son écran se vide et n'affiche plus qu'une ligne : les coordonnées du relais suivant de la chaîne. Un relais ne sait faire que ça — renvoyer au suivant.",
            "Tu relèves les coordonnées. La radio grésille. « Toutes unités… » Sorn mâchonne le mot. « C'est un début de phrase, ça. Y en a d'autres, forcément. » Une pause. « Ça pointe vers le froid. Là où même l'eau renonce à geler. » Un temps. « Tu sais ce qui me fait drôle ? J'ai réparé des relais toute ma vie. J'en ai jamais entendu un parler. »"
          ] } },

      /* ---- 2. La borne givrée — ATTENTE (non ratable) ---- */
      { indice:"Le froid, maintenant. Lisière sud de la cité de glace, là où la neige cesse d'être poudreuse et commence à crisser. Cherche dans ce secteur.",
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
            "Puis elle déroule, ligne après ligne, les coordonnées du relais suivant, et se rendort.",
            "« Maintenir le périmètre, maintenir le périmètre… » Sorn souffle par le nez. « Trois siècles qu'ils montent la garde devant une porte que plus personne ne franchira. Voilà ce que c'est, le Protocole : des chiens qui attendent un maître mort. » Il crache, tu l'entends très bien. « Et qui mordent ceux qui passent trop près. »",
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
          "L'anneau du Protocole occupe tout l'horizon, violet et silencieux. Aucune silhouette sur la crête, aucun mouvement — et c'est pire que s'il y en avait. On raconte dans toutes les cités que les gens qu'on emmène d'ici ne reviennent pas.",
          "La dernière balise est plantée là, face à lui, comme un piquet de garde qu'on aurait oublié de relever.",
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
            "« Bon. T'as ce que je voulais. Rentre. » Puis, plus bas, alors que tu crois la liaison coupée : « Toutes unités. C'est à qui qu'ils parlent, bon sang, depuis trois cents ans ? »"
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
    // ⚠ Les 80 réfractaires sont une révélation de Q4 : ne PAS les citer ici.
    //    Le journal laisse seulement voir que la septième n'est pas rentrée — et
    //    qu'elle l'a DIT (CANON v3 : les 80 sont restés EXPRÈS, LORE.md §5).
    // ⚠ Le signataire de l'ordre reste ILLISIBLE. (La piste « Maar = Mère » est
    //    ABANDONNÉE — voir LORE.md §12. Le mystère porte sur le Protocole.)
    intro:[
      "Sorn ne lève pas les yeux de son établi quand tu pousses la porte. Il démonte le même connecteur depuis un moment, et le remonte, et le redémonte.",
      "« Le truc, à l'anneau. Ce qu'il t'a sorti. » Il repose son tournevis, très lentement. « Un ordre qui tourne encore. Ça veut dire que quelqu'un l'a signé, et que personne ne l'a jamais annulé. »",
      "« Et c'est en ancien, cet ordre. » Il fait tourner le tournevis entre ses doigts. « Toute ma vie je me suis demandé pourquoi on apprenait aux gosses une langue que personne parle. Maintenant je sais au moins une chose : c'est la leur. Celle du Protocole. »",
      "« Je veux savoir qui l'a donné. » Il te regarde enfin, et pour une fois il n'y a aucune moquerie dedans. « Trois endroits. Tu me rapportes ce que tu trouves, et tu poses pas de questions. Marché conclu ? »"
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
            "Le sas cède avec un soupir d'air comprimé vieux de trois cents ans. À l'intérieur : un établi, des outils rangés au carré, une combinaison pliée sur un tabouret. Sept patères au mur, six vides. Une tasse sur la table, le fond noirci par trois siècles. Quelqu'un est parti d'ici en pensant revenir.",
            "Tu ramasses un carnet de maintenance. Des relevés, des dates, des signatures abrégées — et dans la marge, d'une écriture pressée, un croquis de relais avec une flèche : « écouter ici ».",
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
            "Relevé de routine 93487628. Le relais 9 émet une porteuse qui n'est pas au catalogue. Vareck demande une inspection.",
            "Inspection faite: ce n'est pas une panne, c'est un ordre. Nous n'avons pas l'habilitation pour le lire.",
            "Habilitations vérifiées. Demande de consigne transmise à l'autorité. En attente de réponse.",
            "Réponse reçue. Évacuation immédiate. Ne rien emporter, ne rien éteindre.",
            "Poste fermé jusqu'à nouvel ordre. Sept noms au registre, six passages au sas. La septième a répondu par radio depuis le relevé nord : elle ne rentre pas."
          ],
          reussite:[
            "La console valide et affiche la fiche complète de l'équipe. Ton regard s'arrête à la deuxième ligne.",
            "SORN, E. — TECHNICIEN RELAIS — STATUT : DÉSERTION. RADIÉ. NE PAS RÉINTÉGRER.",
            "Tu appelles. Pas de réponse. Tu appelles encore. Quand la radio se rallume enfin, la voix est méconnaissable de platitude : « Lis-moi la ligne. Mot pour mot. »",
            "Tu la lis. Le silence qui suit dure le temps d'un trajet entier.",
            "Tu remarques, en dessous, la troisième ligne : un nom de femme, et à côté du statut, un seul mot — ABSENTE. Pas « radiée ». Absente, comme on note quelqu'un qu'on attend encore.",
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
          "Un terminal de service s'allume à ton approche. QUESTION DE CONTRÔLE REQUISE POUR CONSULTATION DE L'ORDRE PERMANENT.",
          "Il demande le nom du technicien de garde le jour de la fermeture du périmètre. Tu as lu le registre. Tu sais."
        ],
        defi:{ type:"enigme",
          texte:"NOM DU TECHNICIEN DE GARDE — FERMETURE DU PÉRIMÈTRE.",
          question:"« Qui était de garde ce jour-là ? »",
          reponses:["sorn","e. sorn","sorn, e.","vieux sorn","e sorn"],
          indice:"Deuxième ligne du registre d'équipe.",
          reussite:[
            "RÉPONSE CONFORME. ORDRE PERMANENT — SCELLEMENT DU PÉRIMÈTRE. EXÉCUTANT : SORN, E. SIGNATAIRE : [DONNÉE CORROMPUE]. STATUT : JAMAIS ANNULÉ.",
            "Exécutant. Pas témoin, pas suspect. Celui qui a fait le geste — quand la dernière relève est passée, c'est sa main qui a fermé le périmètre derrière elle.",
            "« Il l'a fait. » La voix de Sorn arrive sans prévenir, très calme, et c'est cette platitude qui inquiète. « On m'a raconté toute mon enfance qu'il avait détalé. Il a pas détalé. Il a fermé la boucle, proprement, parce qu'on le lui avait demandé. »",
            "« Et il a déserté trois jours après. » Un long silence. « Trois jours. Qu'est-ce qu'on comprend, en trois jours, pour lâcher un poste qu'on vient de tenir ? »",
            "« Le signataire est illisible. Évidemment. » Un rire bref, pas drôle du tout. « Trois siècles que ma famille répare leurs relais pour écouter on sait pas quoi. Et le premier d'entre nous, c'est lui qui a fermé leur porte. J'ai la moitié de la réponse, et elle me plaît pas. »",
            "Un cliquetis : il te vire ta paie avant que tu dises quoi que ce soit. « Rentre. Et va pas t'imaginer qu'on est amis. »"
          ] } }
    ],
    recompense:{ credits:250, xp:40, pa:1, flags:{} }   // v1.01 : PA (répartition irrégulière, voir APT en tête d'aptitudes-data)
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
    // DESCENDANTE. CANON v3 : son ancêtre a REFUSÉ de rentrer (une des 80) ;
    // la famille le raconte encore, mais le POURQUOI est « la partie qu'on
    // saute ». Celle des Sorn dit « il s'est sauvé ». Les deux familles ne se
    // parlent jamais : le joueur est leur seul lien.
    // La ligne a DEUX bras depuis la souche : l'ouest vers l'anneau (remonté en
    // Q4) et l'est, que personne ne suit — un interdit transmis sans raison
    // (reste des 80, qui cachaient les bêtes au bout ; révélé en Q15).
    // ✅ v0.97 — BOUTURE : Adaya la confie à la fin (LORE.md §10). Objet LIÉ
    //    (serveur : objets_lies + trigger). Remise en tout-ou-rien (quetes.js).
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
      "« Ça, ça pousse en ligne. Une seule ligne, droite comme un fil tendu, qui traverse le secteur sans se soucier du relief. Nulle part ailleurs. Et ça pulse. » Elle fait tourner le bocal : la lueur monte, retombe, remonte. « Trois siècles qu'on vit à côté, et personne s'est jamais demandé pourquoi. »",
      "« J'aimerais comprendre avant de mourir. Tu m'aides ? »",
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
            "« Chez nous, on raconte toujours la même histoire aux gosses. » Elle ne lève pas les yeux de sa pipette. « Celle-là était dehors ce jour-là, relevé de sondes, tout au bord nord. L'ordre est tombé dans la radio : rentrer au quai, ne rien emporter. Et elle a répondu non. »",
            "« Pas \"j'arrive pas à temps\". Non. » Elle pèse le mot. « Après, elle a entendu le périmètre se fermer, d'un coup, comme une paupière. Et puis plus de radio. Elle a marché onze jours pour revenir ici — pas au quai. Ici, aux serres. »",
            "« Pourquoi elle a dit non, ça, c'est la partie qu'on saute. Ma grand-mère la sautait, sa mère aussi. Je crois qu'au bout d'un moment, plus personne l'a sue. »",
            "Elle bouche le flacon d'un coup sec. « Bon. Le tracé, maintenant. »"
          ] } },

      /* ---- 2. Le tracé — SEQUENCE (ratable) ---- */
      { indice:"Entre nos champs et l'anneau, à mi-chemin. Cherche la ligne de floraison — tu la rateras pas, elle est trop droite pour être honnête.",
        cible:{ x:900, y:1079, r:80 }, leurres:[ {x:1600,y:1250,r:80}, {x:2000,y:700,r:80}, {x:1150,y:300,r:80} ],
        image:"images/quetes/q3/2.png",
        arrivee:[
          "La silène court sur le sol nu, en un ruban pâle qui file vers l'horizon sans dévier d'un mètre. Rien dans la nature ne pousse aussi droit. De près, chaque tige porte une corolle close, et sous la peau des pétales, une lueur attend son tour.",
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
            "« Il y a un creux, vers l'ouest, où elles sont vieilles et serrées. Va voir. Et écoute-moi bien : ce que tu ramènes de là-bas, c'est toi qui décides. »"
          ] } },

      /* ---- 3. La souche mère — CHOIX (Cercles) ---- */
      { indice:"Suis le ruban jusqu'à un creux abrité. C'est le plus vieux massif du secteur. Et le seul.",
        cible:{ x:700, y:1062, r:80 }, leurres:[ {x:1350,y:1150,r:80}, {x:1800,y:520,r:80}, {x:520,y:1400,r:80} ],
        image:"images/quetes/q3/3.png",
        arrivee:[
          "Le creux respire. Des centaines de tiges enchevêtrées, certaines épaisses comme un bras, pulsent ensemble dans une lumière laiteuse. Au centre, une souche unique dont tout le reste semble partir.",
          "Et elle part dans deux directions. Un bras file vers l'ouest, vers l'anneau, bien net, bien battu. L'autre file vers l'est, droit vers l'horizon — et là, pas une trace de pas, pas une tige cassée. Comme si personne n'avait jamais osé le suivre.",
          "« Le bras est ? » Adaya hésite, et c'est la première fois. « On le suit pas. On l'apprend aux gosses avant de leur apprendre à nager : la ligne de l'est, on la laisse tranquille. » Un temps. « Me demande pas pourquoi. Je te l'ai dit, chez nous, y a des parties qu'on saute. »",
          "« Trois façons de faire, et je te mentirai pas sur les prix », dit Adaya. « Tu prélèves la souche, j'ai ma réponse et le massif meurt. Tu relèves sans toucher, j'ai des bribes et il vit. Ou tu ramasses ce qui se vend, et tu manges ce mois-ci. »",
          "« Je te demanderai pas de te justifier. »"
        ],
        defi:{ type:"choix",
          texte:["La souche pulse sous ta paume, tiède. Ce que tu fais maintenant, personne ne le verra jamais."],
          options:[
            { texte:"Prélever la souche entière — la réponse, quel qu'en soit le prix.",
              cercles:{ assembleurs:5 }, flags:{ q3Souche:"tranchee" },   // v1.00 : relu en Q15 étape 1
              journal:"Tu as tranché la souche. Le massif s'éteint derrière toi, tige après tige." },
            { texte:"Relever sans prélever — des données incomplètes, un massif vivant.",
              cercles:{ racines:5 }, flags:{ q3Souche:"relevee" },
              journal:"Tu as tout noté et rien pris. Le creux respire encore." },
            { texte:"Récolter tout ce qui se monnaie et vendre le reste au plus offrant.",
              cercles:{ eclats:5 }, flags:{ q3Souche:"pillee" },
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
            "« Et ça pulse des deux côtés de la souche, pareil. » Elle fronce les sourcils sur son relevé. « Comme si la ligne était tenue par ses deux bouts. L'ouest, on sait où il mène. L'est… » Elle ne finit pas.",
            "Elle range ses flacons un long moment. Puis, sans se retourner : « Il reste un Sorn ? Du technicien relais, celui de la deuxième ligne. »",
            "Tu réponds. Elle hoche la tête, une seule fois, et ne demande rien d'autre — ni où, ni comment, ni pourquoi les deux familles ne se sont jamais adressé la parole en trois siècles.",
            "Elle ouvre un tiroir, en sort un petit bocal de verre épais cerclé de métal, et y couche une tige pâle prélevée sur la souche, dans un fond de terreau. Elle visse le couvercle, le rafistole d'un tour de fil de fer, et te le met dans les mains.",
            "« Garde-la sur toi. Pas au coffre, pas dans une soute : sur toi. » Elle referme tes doigts dessus. « Elle s'allume quand quelque chose passe dans la ligne. Ici, elle s'éteindra jamais tout à fait. Si un jour tu vas quelque part où elle s'allume alors qu'elle devrait pas… » Elle hausse les épaules. « Tu sauras que c'est pas qu'ici que ça parle. »",
            "« Et la vends pas. » Un vrai sourire, le premier. « De toute façon, personne en voudrait. Moi je l'ai jamais trouvée jolie. Juste têtue. »",
            "« Reviens quand tu veux, petit. La serre est ouverte. »"
          ] } }
    ],
    recompense:{ credits:350, xp:55, objets:{ bouture:1 }, flags:{} }   // v1.01 : plus de PA
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
    // CANON v3 (LORE.md §5) : les 80 ne sont pas des retardataires mais des
    // RÉFRACTAIRES — ils ont refusé l'évacuation. La réponse d'AREPO à leur
    // sujet est CORROMPUE (la silène l'a brouillée) : il ne reste que « maintenir
    // le périmètre jusqu'à l'embarquement du personnel non évacué ». Le joueur
    // voit le trou ; il ne sait pas ce qu'il contenait (radier et partir).
    // L'automate du hall s'appelle l'HUISSIER (« la Sentinelle » est une bête, §7).
    intro:[
      "Sorn t'attend debout, ce qui ne lui ressemble pas. Il a un papier à la main — le relevé d'Adaya, transmis par tu ne sais quel détour.",
      "« Elle dit que ta fleur bat la mesure. Elle a raison. » Il pose le papier. « Et moi j'ai passé la nuit dessus. »",
      "« Une horloge, ça tourne en rond. Celle-là aussi. Sauf qu'une horloge, ça sert à savoir l'heure — et ce truc-là, il sert à appeler quelqu'un. » Il laisse le mot tomber tout seul. « À intervalle fixe. Encore. Et encore. »",
      "« Et ça appelle vers un endroit précis. » Il décroche l'oreillette du clou, et sa main tremble un peu. « L'embarquement, gamin. Le mot que je t'avais dit de laisser tomber. Tu vas y aller, et après ça on n'en parle plus jamais. »"
    ],
    etapes:[

      /* ---- 1. Le point de convergence — GLYPHES (ratable) ---- */
      { indice:"Reprends le ruban de fleurs et remonte-le vers l'ouest, là où il se resserre. La signalétique du Protocole tient encore debout par là.",
        cible:{ x:640, y:1057, r:80 }, leurres:[ {x:1500,y:1150,r:80}, {x:1950,y:480,r:80}, {x:1050,y:1400,r:80} ],
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
            "Une flèche à demi effacée pointe vers un talus. Dessous, une porte de service, close. Sur le linteau, gravé dans l'ancien, un mot que Sorn te traduit d'une voix blanche : « Départs ».",
            "« Voilà. » La voix de Sorn s'est éteinte d'un cran. « Le hangar est derrière. »"
          ] } },

      /* ---- 2. La pile morte — LIVRAISON (non ratable) ---- */
      { indice:"La porte de service est juste à côté, mais elle n'a plus de jus depuis trois cents ans. Trouve de quoi la réveiller.",
        cible:{ x:598, y:1054, r:80 }, leurres:[ {x:1400,y:900,r:80}, {x:1800,y:1300,r:80}, {x:1200,y:200,r:80} ],
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
            "De l'autre côté : un hall d'embarquement. Des bancs alignés. Des sacs, encore posés dessous, bouclés, étiquetés — laissés là parce que l'ordre disait de ne rien emporter.",
            "Au mur, un tableau d'affichage figé sur une seule ligne, qui n'a jamais changé : PROCHAIN DÉPART — EN ATTENTE DE CONFIRMATION."
          ] } },

      /* ---- 3. L'Huissier — COMBAT (contrôle de niveau) ---- */
      { indice:"Entre dans le hall. Et gamin — quoi que tu croises là-dedans, ça fait que son boulot. Ça change rien, mais je préfère que tu le saches.",
        cible:{ x:580, y:1053, r:80 }, leurres:[ {x:1600,y:400,r:80}, {x:900,y:1250,r:80}, {x:2000,y:950,r:80} ],
        image:"images/quetes/q4/3.png",
        arrivee:[
          "Il est au fond du hall, derrière un pupitre de contrôle, immobile depuis si longtemps que la poussière a fait de lui une statue. Ton pas le réveille. Il se déplie sans hâte, sans colère, et se met en travers du couloir.",
          "Sous la poussière, la silhouette est blindée, close, sans visage, un tampon encreur encore vissé au bout d'un bras. Impossible de dire s'il y a un mécanisme là-dedans ou quelqu'un. Tu ne le sauras pas aujourd'hui.",
          "ACCÈS RESTREINT. ÉVACUATION EN COURS. VEUILLEZ REJOINDRE LE POINT DE RASSEMBLEMENT.",
          "« Il croit encore que l'embarquement a lieu aujourd'hui », souffle Sorn. « Trois cents ans qu'il attend qu'on lui dise que c'est fini. Personne l'a jamais fait. Personne peut. »"
        ],
        defi:{ type:"combat",
          nom:"Huissier d'embarquement",
          puissance:22,
          gain:2,
          xp:10,
          texte:["Il ne t'attaquera pas le premier. Il ne te laissera pas passer non plus. Il applique une consigne, et la consigne n'a pas de date de fin."],
          reussite:[
            "L'Huissier se replie enfin, ou s'effondre, ou se tait — selon la manière dont tu t'y es pris. Le couloir est libre. Le tampon roule jusqu'à tes pieds. Sur la semelle, à l'envers, un seul mot : EMBARQUÉ.",
            "Sorn ne dit rien pendant que tu enjambes ce qu'il en reste."
          ] } },

      /* ---- 4. Le manifeste — ÉNIGME (essais illimités : jamais de verrou sur un final) ---- */
      { indice:"Au bout du couloir, le poste d'embarquement. C'est là que tout s'est joué. Vas-y.",
        cible:{ x:568, y:1062, r:80 }, leurres:[ {x:1300,y:1000,r:80}, {x:1850,y:650,r:80}, {x:1100,y:1450,r:80} ],
        image:"images/quetes/q4/4.png",
        arrivee:[
          "Le poste d'embarquement est resté ouvert, registres compris. Sur l'écran principal, le manifeste de la dernière rotation clignote encore, jamais clôturé.",
          "PERSONNEL RECENSÉ : 1 324.   EMBARQUÉS : 1 244.   RÉFRACTAIRES : ___.",
          "MOTIF DE NON-EMBARQUEMENT : REFUS D'ÉVACUATION. INSTRUCTIONS DEMANDÉES À LA DIRECTION.",
          "CLÔTURE IMPOSSIBLE — SAISIE MANQUANTE. La machine attend depuis trois cents ans qu'un opérateur lui donne le chiffre. Les deux autres sont là, sous tes yeux, depuis le début."
        ],
        /* ⚠ Le chiffre 80 est une RÉVÉLATION de cette quête, pas un acquis :
           il ne peut donc pas être demandé de mémoire. L'écran affiche le
           recensé et les embarqués — le joueur soustrait. Comprendre l'écran
           EST la solution. (L'ancien indice renvoyait à une réplique de Q2
           qui n'existe plus : les 80 y étaient annoncés trop tôt.) */
        defi:{ type:"enigme",
          texte:"RÉFRACTAIRES — SAISIE REQUISE POUR CLÔTURE.",
          question:"« Combien de personnes ont refusé de partir ? »",
          reponses:["80","quatre-vingts","quatre vingts","quatre-vingt","80 personnes"],
          indice:"Recensés moins embarqués. Les deux nombres sont affichés au-dessus.",
          reussite:[
            "Quatre-vingts. Tu saisis le chiffre, et il te paraît d'abord petit — jusqu'à ce que tu penses aux bancs du hall : quatre-vingts places que personne n'est venu prendre.",
            "Le registre se clôt dans un déclic minuscule, et l'écran affiche, pour la première fois depuis trois cents ans : ROTATION CLÔTURÉE.",
            "Sous le mot, la réponse de la direction s'affiche enfin — ou ce qu'il en reste :",
            "INSTRUCTIONS POUR LE PERSONNEL RÉFRACTAIRE : ████████ [DONNÉE CORROMPUE] ████████. EN ATTENDANT : MAINTENIR LE PÉRIMÈTRE JUSQU'À L'EMBARQUEMENT DU PERSONNEL NON ÉVACUÉ.",
            "La phrase des quatre balises. Elle n'était pas le début de l'ordre. C'était ce qui restait quand le reste a disparu.",
            "« Réfractaires. » Sorn répète le mot comme s'il le pesait. « Ils ont pas raté l'heure, gamin. Ils ont dit non. Quatre-vingts gens de la maison, qui connaissaient les procédures mieux que personne, et qui ont dit non. » Un temps. « Faut une sacrée raison pour ça. »",
            "« Et mon aïeul a fermé la porte derrière les autres. Et trois jours après, il est sorti les rejoindre. » Un silence. « Voilà ce qu'il a compris en trois jours : leur raison. Et c'est la seule chose qu'il nous a pas laissée. »",
            "Puis, en dessous, une ligne que personne n'était là pour lire :",
            "APPAREIL DE RÉSERVE — NAVETTE MAAR-3/07 — STATUT : À QUAI. ENTRETIEN AUTOMATIQUE ACTIF. EN ATTENTE D'ÉQUIPAGE.",
            "« …Répète. » La voix de Sorn n'est plus la même. « Répète ce que tu viens de lire, gamin. Lentement. »",
            "Un silence très long. Puis, presque pour lui-même : « Y en a une qui est jamais partie. »"
          ] } }
    ],
    recompense:{ credits:500, xp:80, flags:{} }   // v1.01 : plus de PA
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
    // CANON v3 : ceux qu'ils « enlèvent » dans les cités, ils les EMBARQUENT —
    //    ils appliquent l'ordre reçu. Sorn le comprend ici ; le POURQUOI des 80
    //    (les bêtes, le bouclier) reste pour Q15.
    intro:[
      "Sorn n'a pas dormi. Ça se voit à sa façon de tenir sa tasse à deux mains.",
      "« Un appareil de réserve, c'était dans les procédures. Une navette qu'on laisse à quai au cas où. » Il pose côte à côte le carnet que tu as rapporté du poste enseveli et un autre, aux pages gondolées, passé de main en main depuis trois siècles — celui de sa famille. « C'est écrit dans les deux, en marge. Le mien, je l'ai lu à quinze ans. J'ai jamais cherché. »",
      "Il repose la tasse. « Le quai est sous l'anneau. C'est pour ça qu'ils le gardent, tu comprends ? Ils gardent pas un secret. Ils gardent une zone d'embarquement, parce que personne a jamais déclaré l'évacuation terminée. »",
      "« Et tu sais ce que ça veut dire, pour nous ? » Il fixe un point au-dessus de ton épaule. « Personnel non évacué. C'est nous. Les petits-enfants des quatre-vingts. Sur leurs registres, on est toujours des employés en retard. »",
      "« Toi tu viens de clôturer la rotation. Donc y a une place d'équipage qui s'est ouverte. » Il te regarde. « Va la prendre. »"
    ],
    etapes:[

      /* ---- 1. Le quai scellé — PIRATAGE (ratable) ---- */
      { indice:"Reprends les couloirs de service du hall. Ça descend, ça passe sous l'anneau. T'entres pas dedans, tu passes dessous — nuance.",
        cible:{ x:572, y:1062, r:80 }, leurres:[ {x:1450,y:800,r:80}, {x:1900,y:1200,r:80}, {x:1000,y:180,r:80} ],
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
        cible:{ x:585, y:1035, r:80 }, leurres:[ {x:1250,y:1100,r:80}, {x:1750,y:300,r:80}, {x:2050,y:900,r:80} ],
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
          "Encore un silence. Quand il reprend, c'est à peine un souffle. « Mon cousin, il y a vingt ans. La petite des Varn, l'hiver dernier. Tous ceux qu'ils ont pris chez nous, on disait qu'ils les avaient enlevés. » Il avale sa salive. « Ils les ont pas enlevés. Ils les ont embarqués. Pour eux, c'est un retour à la maison. »",
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
        cible:{ x:572, y:1062, r:80 }, leurres:[ {x:1350,y:700,r:80}, {x:1850,y:1000,r:80}, {x:950,y:1300,r:80} ],
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
      /* ⚠ v0.91 — ce choix portait sur un CAP (autre station / astéroïdes /
         orbite de l'anneau). Il était démenti dans la minute : le premier vol
         dépose toujours le joueur à la base. Ce n'est pas le choix qu'il fallait
         retirer mais la PROMESSE — la navette n'a qu'une destination enregistrée
         depuis trois siècles, et c'est Triptolème. Le joueur remplit donc un MOTIF
         DE ROTATION : une case de formulaire, pour une administration morte.
         Le cap verrouillé s'affiche sous son nom AREPO (LORE.md §9) :
         ça explique mécaniquement l'atterrissage imposé et ça sème l'écart
         officiel/courant sans qu'aucun personnage ait à l'expliquer (règle R2). */
      { indice:"Reste à bord. Elle va te demander de justifier la rotation. Réfléchis avant de répondre — c'est le genre de question qu'on te pose une fois.",
        cible:{ x:572, y:1062, r:80 }, leurres:[ {x:1500,y:1250,r:80}, {x:2000,y:600,r:80}, {x:1100,y:250,r:80} ],
        image:"images/quetes/q5/4.png",
        arrivee:[
          "RÔLE D'ÉQUIPAGE — POSTE VACANT. INSCRIPTION ACCEPTÉE. La navette vient de t'enregistrer sans cérémonie, comme elle l'aurait fait il y a trois cents ans.",
          "CAP DE ROTATION — VERROUILLÉ. DESTINATION : RELAIS TRIPTOLÈME-1.",
          "Elle ne te demande pas où aller. Elle le sait depuis trois siècles, et ça n'a jamais changé. Ce qu'elle veut, c'est la case d'à côté.",
          "MOTIF DE ROTATION — SAISIE REQUISE.",
          "Derrière toi, Sorn s'est approché du sas. Tu l'entends poser la main sur le lecteur d'identité."
        ],
        defi:{ type:"choix",
          texte:["Trois motifs s'affichent. Aucun n'est recommandé — la machine n'a pas d'avis là-dessus non plus. Personne ne lira jamais ta réponse."],
          options:[
            { texte:"RELÈVE TECHNIQUE. Une machine de trois cents ans qui marche encore : tu veux savoir comment elle est faite.",
              cercles:{ assembleurs:5 },
              journal:"Motif de rotation : relève technique." },
            { texte:"TRANSPORT DE FRET. Ce qui se ramasse là-haut vaut cher ici, et tu comptes bien le redescendre.",
              cercles:{ eclats:5 },
              journal:"Motif de rotation : transport de fret." },
            { texte:"RECONNAISSANCE. Voir l'anneau d'en haut, une bonne fois, et noter ce qu'il y a autour.",
              cercles:{ veilleurs:5 },
              journal:"Motif de rotation : reconnaissance." }
          ],
          reussite:[
            "MOTIF ENREGISTRÉ. ROTATION EN ATTENTE DE DÉPART. DESTINATION : RELAIS TRIPTOLÈME-1.",
            "Le nom ne te dit rien. Il est écrit là comme une évidence, dans la typographie soignée d'une entreprise qui classait des mondes.",
            "Derrière toi, le lecteur d'identité émet un bip bref. SORN, E. — IDENTITÉ RADIÉE. ACCÈS REFUSÉ. NE PAS RÉINTÉGRER.",
            "Ce n'est pas lui qu'on refuse. C'est un nom, sur un registre qu'aucun vivant n'a signé, tenu par une administration partie depuis trois siècles. La machine ne fait pas la différence. Elle n'a jamais eu à la faire.",
            "Sorn retire sa main sans un mot. Il hoche la tête, une fois, comme on valide un calcul dont on connaissait déjà le résultat.",
            "« Bon. » Il redescend la passerelle. « J'ai des relais à écouter, moi. » Il s'arrête sur la dernière marche, sans se retourner. « Si t'entends quelque chose, là-haut — n'importe quoi, en ancien — tu me le dis. Mon grand-père disait qu'un jour, il y aurait quelque chose à entendre. »",
            "Il ne se retourne pas. Sur la console, le mot manuscrit est toujours scotché là : « pour la dernière rotation ». Ce n'était pas la dernière.",
            "ÉTAT DE COQUE : DÉGRADÉ. STOCKS D'ENTRETIEN : ÉPUISÉS. AUTONOMIE DE SERVICE ESTIMÉE : 10 JOURS.",
            "Elle t'emmènera là-haut. Elle ne t'y gardera pas. D'ici là, il faudra t'en payer une vraie — ou apprendre à en construire une."
          ] } }
    ],
    /* ⚠ v0.91 — le permis seul obligeait à attendre qu'un Constructeur mette un
       vaisseau au marché. La Navette de réserve débloque le vol TOUT DE SUITE,
       et disparaît en dix jours : le métier de Constructeur garde sa clientèle,
       et le joueur découvre l'orbite avant de devoir payer. */
    recompense:{ credits:800, xp:120, pa:1, objets:{ navette_reserve:1 }, flags:{ permisVaisseau:true, espace1:true } }
  },

  /* ===========================================================
     Q6 — LA CARCASSE (v0.97). Première quête de Triptolème.
     Donneuse : GALM, ferrailleuse qui vit dans la Carcasse (TR-217). Elle parle
     peu, ne demande pas d'où tu viens, ne dit pas d'où elle vient.
     Le joueur apprend : la maison a un NOM — AREPO (carré SATOR gravé).
     Fil de Sorn : une révision de relais signée SORN, E., datée d'AVANT le
     scellement — l'aïeul montait en orbite pour son service (LORE.md §11).
     Sorn répond par radio : ses relais portent jusqu'ici (c'est leur métier).
     ⚠ Toutes les étapes sont en ORBITE : `cible:{ lieu:"epave" }` (moteur v0.97).
       Leurres : d'autres lieux du secteur. `lieuPrise:"carcasse"` : la quête se
       prend chez Galm, pas au comptoir d'une cité.
     ⚠ Pas de PA en récompense (décision du 21/09 : on en gagne trop).
     =========================================================== */
  {
    id:"q6",
    nom:"La Carcasse",
    donneur:"Galm",
    donneurLieu:"La Carcasse",
    lieuPrise:"carcasse",
    intro:[
      "Une femme sort de sous une plaque de coque, sur le dos, un chalumeau éteint à la main et des lunettes de soudeur relevées sur le front. Elle te détaille de la tête aux bottes, puis ta coque, plus longtemps.",
      "« Choc de sortie d'atmosphère. Trois plaques, un rivet sauté. » Elle se relève sans te tendre la main. « Galm. Je rafistole. Je découpe. Je revends. Je pose pas de questions, et j'aime pas qu'on m'en pose. »",
      "Elle désigne du pouce le fond de la Carcasse, là où la coque se referme sur elle-même comme un poing. « Y a un compartiment, là-derrière. Scellé. Trois siècles que personne l'a ouvert, et moi, seule, je peux pas étayer la cloison et couper en même temps. »",
      "« Tu m'apportes de quoi étayer et de quoi alimenter le chalumeau. Tu tiens la cloison pendant que je coupe. Ce qu'il y a derrière, on partage. » Elle rabat ses lunettes. « Et si c'est vide, je t'aurai quand même fait perdre ta journée. Ça arrive. »"
    ],
    etapes:[

      /* ---- 1. La cloison — LIVRAISON (non ratable) ---- */
      { indice:"Reviens à la Carcasse avec deux lingots de cendrite pour les étais et de la Voltane pour le chalumeau. Ça se trouve en bas, sur Silène.",
        cible:{ lieu:"epave" }, leurres:[ { lieu:"base" }, { lieu:"asteroides" }, { lieu:"antenne" } ],
        image:"images/quetes/q6/1.png",
        arrivee:[
          "Galm a déjà dégagé l'accès. Au bout d'une coursive où l'on avance courbé, une cloison noire, sans poignée, sans soudure visible, barre le passage. Au toucher, elle est tiède — comme si quelque chose, derrière, tournait encore.",
          "« Tu vois ? Même pas un joint. Ils faisaient du beau travail, les anciens. » Elle frappe du plat de la main. « Ça sonne creux. Allez, pose ce que t'as apporté. »"
        ],
        defi:{ type:"livraison",
          objets:{ fab_lingot_de_cendrite:2, voltane:3 },
          texte:["Deux lingots de cendrite pour étayer la cloison, trois fragments de Voltane pour la cellule du chalumeau."],
          reussite:[
            "Vous calez les étais à deux. Galm branche la Voltane, règle la flamme au bleu, et attaque la cloison en silence. Il faut une heure pour y ouvrir un trou d'homme. L'air qui en sort sent le métal froid et la poussière très ancienne.",
            "Galm passe la tête la première. Un temps. Puis, d'une voix qui a perdu un peu de son aplomb : « …Viens voir. »"
          ] } },

      /* ---- 2. Le carré — ÉNIGME (essais illimités) ---- */
      { indice:"Dans le compartiment de la Carcasse. Galm t'attend devant la plaque.",
        cible:{ lieu:"epave" }, leurres:[ { lieu:"base" }, { lieu:"asteroides" }, { lieu:"antenne" } ],
        image:"images/quetes/q6/2.png",
        arrivee:[
          "Le compartiment est un local technique, pas plus grand qu'une cabine. Tout y est rangé, sanglé, étiqueté. Et au mur, face à l'entrée, une plaque de métal gris qui n'a pas pris une trace de rouille en trois siècles.",
          "Dessus, gravées profond, vingt-cinq lettres en carré. Cinq lignes de cinq. La quatrième a été rongée par une fuite de liquide de refroidissement : il n'en reste qu'une traînée brillante.",
          "S A T O R · A R E P O · T E N E T · █ █ █ █ █ · R O T A S",
          "« C'est pas de l'ancien, ça », dit Galm. « C'est des lettres. Mais ça veut rien dire. » Elle penche la tête. « Sauf que ça se lit pareil dans tous les sens. Regarde la première et la dernière. »"
        ],
        defi:{ type:"enigme",
          texte:"Le carré se lit de gauche à droite, de droite à gauche, de haut en bas, de bas en haut. La dernière ligne est la première à l'envers.",
          question:"« Quelle était la quatrième ligne ? » — cinq lettres.",
          reponses:["opera","o p e r a","o.p.e.r.a"],
          indice:"La dernière ligne est la première, lue à l'envers. La quatrième est donc la deuxième, lue à l'envers.",
          reussite:[
            "O P E R A. La ligne se referme, et le carré avec elle : le même mot vers l'avant, vers l'arrière, vers le haut, vers le bas. Un objet parfait, qui ne dit rien d'autre que sa propre perfection.",
            "Galm passe le pouce sur la deuxième ligne. « AREPO… » Elle fronce les sourcils, sort un boulon de sa poche, le fait tourner à la lumière. Sur la tête, en tout petit, à peine lisible : AREPO. « Je croyais que c'était une marque de boulons. J'en ai des caisses. C'est gravé sur tout ce que je découpe ici. Tout. »",
            "Elle regarde la plaque, puis la Carcasse autour d'elle, comme si elle la voyait pour la première fois. « C'est pas une marque de boulons. C'est à qui c'était. »",
            "Sous le carré, une ligne plus petite, en ancien. Tu ne la lis pas. Mais un mot revient deux fois, que Sorn t'a appris à reconnaître : SATOR. Et le long de la paroi du fond, derrière des panneaux sanglés, un faisceau de câbles part vers une jonction de relais."
          ] } },

      /* ---- 3. La jonction — ATTENTE (non ratable) : Sorn déchiffre ---- */
      { indice:"Au fond du compartiment de la Carcasse, la jonction de relais. Appelle Sorn — ses relais portent jusqu'ici, c'est leur métier.",
        cible:{ lieu:"epave" }, leurres:[ { lieu:"base" }, { lieu:"asteroides" }, { lieu:"antenne" } ],
        image:"images/quetes/q6/3.png",
        arrivee:[
          "La jonction est vieille, et elle a été réparée. Pas remplacée : réparée, à la main. Un manchon de fil de cuivre serré en torsade, trois tours, puis un nœud plat, puis trois tours dans l'autre sens. Une étiquette de service est fixée dessus, couverte d'ancien.",
          "Tu appelles Sorn. Grésillement, long. Puis sa voix, lointaine, comme au fond d'un puits : « …Gamin ? T'es où, là ? T'as une voix de boîte de conserve. »",
          "Tu lui décris le manchon. Trois tours, le nœud, trois tours à l'envers.",
          "Le silence dure si longtemps que tu crois la liaison coupée. Puis : « Lis-moi l'étiquette. Lettre par lettre. Je te la traduis. Ça va me prendre un moment, c'est de l'ancien de service, plein d'abréviations. Bouge pas. »"
        ],
        defi:{ type:"attente", duree:30*60*1000,
          texte:["Tu épelles l'étiquette, signe après signe, pendant que Sorn note à l'autre bout. Il te fait répéter, recommencer, vérifier. Tu peux t'éloigner et revenir : il rappellera."],
          reussite:[
            "« Bon. » La voix de Sorn a changé de texture. « RÉVISION DE JONCTION — RELAIS ORBITAL — TECHNICIEN : SORN, E. » Un temps. « Et la date, c'est un compte de jours de service. Deux cent douze jours avant la clôture du secteur. »",
            "« Deux cent douze jours avant. » Il répète. « Avant qu'il ferme la porte. Avant tout. Il était là-haut, gamin. Il montait faire son travail, comme un type normal, dans un vaisseau d'AREPO, et il réparait leurs jonctions. »",
            "« Ce nœud-là. » Tu l'entends respirer. « Trois tours, le plat, trois tours à l'envers. C'est notre marque. Mon père la faisait. Moi aussi. Je l'ai apprise avant de savoir lacer mes bottes. Personne m'a jamais dit qu'elle venait de lui. »",
            "Galm, qui a tout écouté appuyée contre la paroi, ne dit rien. Puis elle décroche une lampe et la pose près de la jonction, pour qu'elle ne soit plus dans le noir."
          ] } },

      /* ---- 4. La plaque — CHOIX (Cercles) ---- */
      { indice:"Retourne dans le compartiment de la Carcasse. Galm veut savoir ce qu'on fait de la plaque.",
        cible:{ lieu:"epave" }, leurres:[ { lieu:"base" }, { lieu:"asteroides" }, { lieu:"antenne" } ],
        image:"images/quetes/q6/4.png",
        arrivee:[
          "Galm a décroché la plaque du mur. Elle la tient à deux mains, et pour la première fois elle a l'air de ne pas savoir quoi faire d'un morceau de métal.",
          "« On avait dit : on partage. » Elle te la tend. « Moi j'en sais rien. Ça vaut de l'argent, ça, là-haut comme en bas — un métal qui rouille pas en trois siècles, les collectionneurs du Perchoir se battraient pour. Mais c'est toi qui décides. »"
        ],
        defi:{ type:"choix",
          texte:["La plaque est froide et lourde. Personne ne saura jamais ce que tu en as fait — sauf Galm, qui ne le dira à personne."],
          options:[
            { texte:"La laisser à Galm. Qu'elle la vende : c'est son métier, et le métal ne sert à rien accroché à un mur.",
              cercles:{ eclats:5 },
              journal:"Tu as laissé la plaque à Galm. Quelqu'un, au Perchoir, l'accrochera au-dessus d'un comptoir sans savoir ce qu'elle dit." },
            { texte:"La démonter, pour comprendre comment un métal tient trois siècles sans rouiller.",
              cercles:{ assembleurs:5 },
              journal:"Tu as démonté la plaque avec Galm. Sous la gravure, un alliage que personne ici ne sait refaire." },
            { texte:"La remettre en place, et relever chaque lettre dans ton carnet. Elle est à sa place ici.",
              cercles:{ veilleurs:5 },
              journal:"Tu as remis la plaque à son mur et recopié le carré, lettre par lettre. Il est dans ton carnet, maintenant." }
          ],
          reussite:[
            "Galm hoche la tête, une seule fois, sans commenter. Elle rallume son chalumeau.",
            "« AREPO. » Elle essaie le mot, comme on essaie une pièce qui ne s'emboîte pas encore. « Ça sonne comme quelque chose qui existe toujours, tu trouves pas ? Les choses mortes, ça sonne pas comme ça. »",
            "Dans ton oreillette, Sorn n'a plus rien dit depuis un moment. Puis, juste avant de couper : « Il y a d'autres jonctions, là-haut. Au Muet, forcément. S'il est monté ici, il est monté là-bas aussi. »",
            "« Reviens quand tu veux », dit Galm sans se retourner. « J'ai toujours quelque chose à découper. »"
          ] } }
    ],
    recompense:{ credits:900, xp:140, flags:{} }
  },

  /* ===========================================================
     Q7 — LE MUET (v0.97). Relais Triptolème-2.
     Donneur : SORN, par radio (la quête se prend à La Carcasse, chez Galm).
     Le joueur apprend : le réseau relie sol et espace ; la RÉPONSE d'AREPO à la
     question des réfractaires est restée coincée ici, EN BOUILLIE ; le parasite
     qui l'a mangée bat au rythme de la silène.
     Fil de Sorn : l'ENREGISTREUR DE TRAFIC que Sorn, E. a branché pendant son
     service (le croquis « écouter ici » du carnet de Q2) — « qui écoute entend ».
     La bouture s'ALLUME, pour la première fois hors de Silène (data.js).
     ⚠ Le texte de la réponse reste illisible ici : il ne survit que « … LE
       SECTEUR ». Reconstitution complète en Q14 (LORE.md §5, §11).
     ⚠ Pas de PA. Deux défis ratables (cadenas, séquence), pas plus.
     =========================================================== */
  {
    id:"q7",
    nom:"Le Muet",
    donneur:"Vieux Sorn",
    donneurImg:"images/quetes/vieux_sorn.png",
    donneurLieu:"par radio, depuis La Carcasse",
    lieuPrise:"carcasse",
    intro:[
      "Galm te tend son casque radio sans lever les yeux de son établi. « C'est pour toi. Le vieux. Il appelle depuis ce matin, il me rend dingue. »",
      "La voix de Sorn, lointaine, pleine de grésillements : « Gamin. Le carnet du poste enseveli — celui que tu m'as rapporté. Y a un croquis dans la marge, un relais, avec une flèche. \"Écouter ici.\" J'ai cru toute ma vie que c'était un relais de Silène. »",
      "« C'en est pas un. J'ai comparé avec la jonction de la Carcasse. Le même montage, la même antenne en parapluie. C'est le Muet. » Un temps. « Le relais qui émet encore, là-haut, vers on sait pas quoi. Les équipages disent qu'il parle tout seul. »",
      "« Mon grand-père répétait une phrase. \"Qui écoute entend.\" Je croyais que c'était un proverbe. » Sa voix baisse. « Va voir ce qu'il y a d'accroché à ce relais. Moi je peux pas. Toi, si. »"
    ],
    etapes:[

      /* ---- 1. Le sas du relais — CADENAS (ratable, Sorn aide) ---- */
      { indice:"Le Muet — le Relais Triptolème-2, tout au nord du secteur. Il y a un sas de maintenance.",
        cible:{ lieu:"antenne" }, leurres:[ { lieu:"base" }, { lieu:"epave" }, { lieu:"asteroides" } ],
        image:"images/quetes/q7/1.png",
        arrivee:[
          "Le Muet est une tour d'antennes plantée sur rien, hérissée de paraboles tournées vers le vide. Il émet : tu le sens dans les dents, une vibration sourde qui fait trembler l'habitacle.",
          "Et dans ton sac, quelque chose s'allume. La bouture d'Adaya. La tige pâle, éteinte depuis que tu as quitté Silène, luit à travers le verre, d'une lueur laiteuse qui monte et retombe. Comme en bas.",
          "« Elle s'allume ? » La voix de Sorn a un raté. « Là-haut ? Adaya a dit qu'elle réagissait au signal. Alors y a du signal, ici. Le même qu'en bas. » Un silence. « Bon. Le sas. Il a un cadenas à glyphes, forcément. Même petit jeu que le poste : trois glyphes, pas plus. »"
        ],
        defi:{ type:"cadenas", longueur:3, symboles:["▣","⌁","⚑","⊘"], essais:8,
          texte:["Trois logements, les quatre glyphes que tu connais maintenant. Le sas te dira, à chaque tentative, combien sont bien placés."],
          reussite:[
            "Le sas s'ouvre sur une coursive circulaire qui entoure le mât central. Des baies de câbles, des voyants qui clignotent depuis trois siècles pour personne. Et au bout, fixé au mât par des colliers de cuivre torsadés — trois tours, le plat, trois tours à l'envers — un boîtier gris, pas plus gros qu'une caisse à outils.",
            "Une plaque, en ancien. Sorn la déchiffre d'une traite, cette fois : « ENREGISTREUR DE TRAFIC. POSE : SORN, E. » Sa voix se serre. « Il l'a branché lui-même. »"
          ] } },

      /* ---- 2. Le parasite — SÉQUENCE (ratable) : le rythme de la silène ---- */
      { indice:"Au Muet, devant l'enregistreur de trafic. Il faut filtrer le parasite avant de pouvoir écouter.",
        cible:{ lieu:"antenne" }, leurres:[ { lieu:"base" }, { lieu:"epave" }, { lieu:"asteroides" } ],
        image:"images/quetes/q7/2.png",
        arrivee:[
          "L'enregistreur fonctionne encore. Il a enregistré sans interruption pendant trois cents ans, en boucle, sur une bande qui s'efface à mesure qu'elle se réécrit. Mais quand tu branches ton casque, tu n'entends qu'une chose.",
          "Un battement. Régulier. Cinq impulsions, puis un silence, puis les cinq mêmes. Il recouvre tout, comme une pluie sur un toit de tôle.",
          "Tu le connais. Tes doigts le connaissent avant toi : les corolles de la ligne, les veilleuses du quai, la séquence d'allumage de la navette. La bouture, dans ton sac, pulse exactement au même tempo.",
          "« Le filtre », dit Sorn. « Y a un filtre de phase sur le côté. Si tu lui donnes le motif du parasite, il le retranche. Tu le connais, ce motif ? » Un temps. « Évidemment que tu le connais. »"
        ],
        defi:{ type:"sequence", longueur:5, cadence:CADENCE_PERIMETRE,
          texte:["LE FILTRE DE PHASE ATTEND LE MOTIF DU PARASITE. REPRODUISEZ-LE."],
          reussite:[
            "Le battement recule, se tasse, disparaît sous le seuil. Et derrière, comme quand on essuie une vitre, apparaît ce qu'il couvrait : des voix, des tonalités de service, des blocs de données. Trois siècles de trafic.",
            "« C'est ta fleur », dit Sorn, très bas. « Le parasite. C'est ta fleur qui bat la mesure, jusqu'ici. Adaya avait raison : elle compte pas les jours. Elle répète. » Il laisse passer un temps. « Rembobine. Tout au début. Je veux entendre ce qu'il a entendu. »"
          ] } },

      /* ---- 3. La bande — ATTENTE (non ratable) : l'enregistreur rembobine ---- */
      { indice:"Au Muet. Laisse l'enregistreur remonter la bande jusqu'au début.",
        cible:{ lieu:"antenne" }, leurres:[ { lieu:"base" }, { lieu:"epave" }, { lieu:"asteroides" } ],
        image:"images/quetes/q7/3.png",
        arrivee:[
          "La bande remonte. Lentement : l'enregistreur n'a jamais été fait pour revenir en arrière de trois cents ans. Les compteurs défilent à l'envers, et à chaque bloc de journal, une ligne s'affiche, en ancien.",
          "Sorn traduit à mesure, d'une voix de plus en plus basse. Il faudra du temps. Tu peux t'éloigner et revenir."
        ],
        defi:{ type:"attente", duree:20*60*1000,
          texte:["L'enregistreur rembobine trois siècles. Sorn traduit les entrées du journal au fur et à mesure."],
          reussite:[
            "INSTALLATION — SORN, E. — J-212. « Je laisse tourner. Qui écoute entend. »",
            "« Qui écoute entend », répète Sorn. « C'est pas un proverbe. C'est lui. C'est la première chose qu'il a écrite ici. »",
            "J-5 — PARASITE SUR TOUTE LA BANDE. SOURCE : SOL, SECTEUR MAAR-3. CAUSE INCONNUE.",
            "J-3 — DIRECTION → MAAR-3 : ORDRE D'ÉVACUATION. RASSEMBLER LE PERSONNEL AU QUAI. NE RIEN EMPORTER. NE RIEN ÉTEINDRE.",
            "J-1 — QUAI → DIRECTION : PERSONNEL RÉFRACTAIRE : 80. REFUS D'ÉVACUATION. INSTRUCTIONS DEMANDÉES.",
            "J-0 — DIRECTION → QUAI : RÉPONSE REÇUE AVEC ERREURS. Et, sous la ligne, ce que l'enregistreur a pu en garder :",
            "« PERSONNEL RÉFRACTAIRE : ██████ ; ██████ ; ██████ LE SECTEUR. »",
            "Trois mots mangés par le battement. Un seul survit, à la fin : le secteur. Quoi, le secteur ? Tenir le secteur, quitter le secteur, garder le secteur — la phrase ne le dit plus.",
            "« Ils ont demandé ce qu'on faisait des quatre-vingts », dit Sorn. « Et la réponse est arrivée en bouillie. Trois cents ans qu'ils attendent la fin d'une phrase. » Un long silence. « Et lui, il a tout entendu passer. Il savait que la réponse était cassée. C'est peut-être ça qu'il a compris, en trois jours. »",
            "Après J-0, plus aucune entrée manuelle. Seulement l'automate, qui note depuis trois siècles, à intervalle fixe, la même ligne : APPEL D'EMBARQUEMENT — PERSONNEL NON ÉVACUÉ. TRAFIC SANS RÉPONSE."
          ] } },

      /* ---- 4. L'enregistreur — CHOIX (Cercles) ---- */
      { indice:"Au Muet. Décide de ce que tu fais de l'enregistreur de Sorn, E.",
        cible:{ lieu:"antenne" }, leurres:[ { lieu:"base" }, { lieu:"epave" }, { lieu:"asteroides" } ],
        image:"images/quetes/q7/4.png",
        arrivee:[
          "L'enregistreur a repris sa place dans la boucle. Il a déjà recommencé à écrire par-dessus la bande : le battement, les appels du quai, le trafic sans réponse.",
          "« C'est à toi de voir », dit Sorn. « Moi, j'ai entendu ce que j'avais à entendre. »"
        ],
        defi:{ type:"choix",
          texte:["Le boîtier gris ronronne contre le mât, tenu par ses colliers de cuivre. Personne d'autre que toi ne l'a touché depuis trois siècles."],
          options:[
            { texte:"Recopier les fragments d'ancien, signe par signe, pour que Sorn puisse un jour traduire la phrase entière.",
              cercles:{ langues:5 },
              journal:"Tu as recopié les fragments de la réponse dans ton carnet. Sorn dit qu'il lui faudra du temps. Il a l'air d'en avoir envie, pour une fois." },
            { texte:"Le laisser tourner, tel qu'il l'a laissé. Qui écoute entend : quelqu'un d'autre en aura peut-être besoin.",
              cercles:{ racines:5 },
              journal:"Tu as laissé l'enregistreur tourner. Il écoute toujours, pour personne — ou pour quelqu'un." },
            { texte:"Emporter la cartouche d'enregistrement. Trois siècles de trafic d'AREPO, au Perchoir, ça vaut une fortune.",
              cercles:{ eclats:5 },
              journal:"Tu as détaché la cartouche. L'enregistreur s'est tu, pour la première fois en trois siècles." }
          ],
          reussite:[
            "Tu refermes le sas derrière toi. Dans ton sac, la bouture pulse encore un moment, puis s'éteint à mesure que tu t'éloignes du Muet.",
            "« Gamin. » La voix de Sorn, avant de couper. « \"Le secteur.\" Si ça voulait dire ce que je crois que ça veut dire… » Il ne finit pas. « Y a une planète, dans ton coin. Celle que les équipages appellent la Braise. On dit qu'elle a pas toujours été comme ça. »",
            "La liaison se coupe. Le Muet, derrière toi, continue d'émettre vers le vide."
          ] } }
    ],
    recompense:{ credits:1000, xp:160, flags:{} }
  },

  /* ===========================================================
     Q8 — LA DESCENTE (v0.98). La Braise (officiel : Souci), sous-carte.
     Donneuse : GALM (prise à La Carcasse). Six étapes : une en orbite, cinq au sol.
     Le joueur apprend : survivre en bas (O₂ ×2, zone chaude, retour au vaisseau
     payant) — et la planète n'a pas toujours été morte : une carotte de sol
     montre de la VERDURE, puis UNE couche de cendre uniforme, partout à la même
     profondeur. Rien de naturel. (Q9 dira : stérilisée — « fermer le secteur ».)
     ⚠ La BOUTURE reste ÉTEINTE aux Solfatares, malgré le signal : ce qui émet
       ici est une machine, rien de vivant (décision du 21/09, LORE.md §10).
     ⚠ Trois nouveaux mini-jeux : traversee (2), triangulation (3), tuyauterie (4).
     ⚠ Pas de PA.
     =========================================================== */
  {
    id:"q8",
    nom:"La descente",
    donneur:"Galm",
    donneurLieu:"La Carcasse",
    lieuPrise:"carcasse",
    intro:[
      "Galm a étalé sur son établi une carte qui n'en est pas une : un relevé thermique de La Braise, jauni, découpé dans une vieille coque. Des taches rouges partout, et une seule zone bleue, minuscule, au milieu d'une plaine.",
      "« Y a une balise, là-dessous. Une balise d'AREPO — tu sais lire le mot, maintenant. » Elle tapote une tache au nord-est. « Elle émet depuis toujours. Les pilotes du Perchoir la captent en passant, et ils changent de cap. Personne descend sur la Braise. »",
      "« Pourquoi ? » Elle hausse les épaules. « Parce qu'il y a pas d'air. Parce que ça brûle. Parce que les rares qui y sont allés en sont revenus avec les bottes fondues et rien dans les poches. » Elle te regarde. « Et parce que personne s'est jamais demandé pourquoi une planète entière ressemble à une cendre qu'on aurait oubliée sur un feu. »",
      "« Ton vieux, à la radio, il a dit un truc. \"Le secteur.\" Il a pas fini sa phrase, mais moi j'ai compris qu'il voulait savoir ce qu'il y a en bas. » Elle roule le relevé. « Je t'équipe le vaisseau pour qu'il tienne au sol. Toi, tu descends. Et tu emportes de l'air — beaucoup. »"
    ],
    etapes:[

      /* ---- 1. Les patins — LIVRAISON (non ratable), en orbite ---- */
      { indice:"À La Carcasse : Galm doit isoler les patins de ton vaisseau avant la descente. Apporte deux lingots de cendrite et de la givrite, pour le froid.",
        cible:{ lieu:"epave" }, leurres:[ { lieu:"base" }, { lieu:"asteroides" }, { lieu:"antenne" } ],
        image:"images/quetes/q8/1.png",
        arrivee:[
          "Galm a déjà démonté une trappe sous ton vaisseau. Elle est couchée dessous, une lampe entre les dents, et elle parle sans l'enlever.",
          "« Tes patins, ils fondent en dix minutes, là-bas. Faut les doubler. Du lingot pour la structure, de la givrite pour isoler : ça garde le froid, ce truc, même au fond d'un four. » Elle recrache la lampe. « Et t'as pris des recharges d'O₂ ? Là-bas, chaque pas te coûte le double. Ton vaisseau, c'est le seul endroit où tu respires. »"
        ],
        defi:{ type:"livraison",
          objets:{ fab_lingot_de_cendrite:2, givrite:3 },
          texte:["Deux lingots de cendrite pour la structure, trois fragments de givrite pour l'isolant."],
          reussite:[
            "Galm soude, gaine, colle, en jurant à voix basse. Quand elle sort de sous la coque, elle a de la givrite jusque dans les cheveux.",
            "« Voilà. Tes patins tiendront. Toi, je garantis rien. » Elle essuie ses mains. « Descends. Pose-toi dans la plaine — c'est la tache bleue de mon relevé, le seul endroit plat. Et reviens à ton vaisseau avant d'être à sec. Là-bas, personne viendra te chercher. »"
          ] } },

      /* ---- 2. Les Failles — TRAVERSÉE (ratable) ---- */
      { indice:"Descends sur La Braise (en orbite, au-dessus de la planète : onglet « La Braise »). Puis rejoins Les Failles, au centre : c'est le seul chemin vers le nord.",
        cible:{ carte:"braise", lieu:"failles" }, leurres:[ { carte:"braise", lieu:"solfatares" }, { carte:"braise", lieu:"cuvette" }, { carte:"braise", lieu:"aiguilles" } ],
        image:"images/quetes/q8/2.png",
        arrivee:[
          "La croûte de lave refroidie s'étend devant toi, noire, crevassée, et sous chaque fissure une lueur orange respire lentement. Le sol craque sous tes bottes comme de la glace au printemps.",
          "Il n'y a pas de chemin. Il y a des plaques qui tiennent, et des plaques qui ne tiennent pas. De loin, elles se ressemblent toutes.",
          "Ta radio grésille — Galm, depuis l'orbite, la voix hachée : « …la chaleur, tu la sens au travers des semelles, non ? Les plaques solides sont plus froides. Ton détecteur te dira combien de points chauds touchent chaque plaque que t'as déjà franchie. Sers-t'en. »"
        ],
        defi:{ type:"traversee", colonnes:6, lignes:7, lave:10, plaques:3,
          texte:["Traverse la croûte jusqu'au bord nord. Chaque plaque franchie t'indique combien de plaques brûlantes la touchent."],
          reussite:[
            "Tu poses le pied sur la roche ferme, de l'autre côté, et tu t'aperçois que tu retenais ta respiration — ce qui, avec l'O₂ que tu as, n'est pas idiot.",
            "Derrière toi, la croûte se referme sur tes traces, comme si tu n'étais jamais passé. Devant, au nord-est, un panache jaune monte d'un cratère. Et dans ton casque, faible, régulier : un bip."
          ] } },

      /* ---- 3. Les Solfatares — TRIANGULATION (ratable) ---- */
      { indice:"Aux Solfatares, au nord-est : le signal de la balise vient de là. Relève-le en plusieurs points pour trouver où creuser.",
        cible:{ carte:"braise", x:2078, y:391, r:300 }, leurres:[ { carte:"braise", lieu:"aiguilles" }, { carte:"braise", lieu:"cuvette" } ],
        image:"images/quetes/q8/3.png",
        arrivee:[
          "Le cratère fume jaune. Des croûtes de soufre craquent sous tes pas, et l'air — s'il y en avait — piquerait les yeux. Le bip est là, partout à la fois, trop faible pour dire d'où il vient.",
          "Tu sors le bocal d'Adaya de ton sac. Au Muet, pour moins que ça, la tige s'était allumée. Ici, elle reste grise. Terne. Quoi qu'il y ait dans ce signal, rien là-dedans n'est vivant.",
          "« Ton détecteur a un mode relevé », grésille Galm. « Bouge, relève, bouge, relève. Plus c'est fort, plus t'es près. Et fais pas trop de tours : chaque pas te coûte de l'air. »"
        ],
        defi:{ type:"triangulation", minReleves:3, fouilles:3, precision:70,
          texte:["Quelque part sous le soufre, une balise émet. Relève sa force en plusieurs points des Solfatares, puis fouille là où elle est la plus forte."],
          reussite:[
            "Sous une croûte de soufre, ta pioche dégage un cylindre de métal gris, pas plus haut qu'un bras. Il émet toujours — et sur sa tête, gravée, une grille de lettres que tu reconnais au premier coup d'œil. Le carré. SATOR, AREPO, TENET.",
            "À côté, une plaque : SONDE DE SOL — SECTEUR SOUCI-2. Et une flèche, qui pointe vers le sud-ouest. « Souci », répète Galm dans la radio. « C'est comme ça qu'ils l'appelaient ? C'est une fleur, ça. On donne pas un nom de fleur à un four. »"
          ] } },

      /* ---- 4. La Cuvette — TUYAUTERIE (non ratable) ---- */
      { indice:"La sonde pointe vers La Cuvette, au sud-ouest. C'est loin : vérifie ton air avant de partir.",
        cible:{ carte:"braise", lieu:"cuvette" }, leurres:[ { carte:"braise", lieu:"aiguilles" }, { carte:"braise", lieu:"solfatares" }, { carte:"braise", lieu:"failles" } ],
        image:"images/quetes/q8/4.png",
        arrivee:[
          "La Cuvette est un cratère trop rond pour être tout à fait naturel. Au fond, à demi fondue, une borne d'AREPO penche comme un arbre mort. Son écran vit encore, mais il clignote en rouge : SURCHAUFFE — MÉMOIRE EN DANGER.",
          "Autour, un réseau de conduits de refroidissement éventrés, tordus par la chaleur. Le liquide est encore là, dans un réservoir enterré — il ne sait simplement plus par où passer.",
          "« Si tu remets le circuit en état, elle refroidira assez pour parler », dit Galm. « Sinon, elle va cuire ce qui lui reste de cervelle. »"
        ],
        defi:{ type:"tuyauterie", colonnes:5, lignes:5,
          texte:["Remets les tronçons de conduit dans le bon sens pour amener le liquide de refroidissement du réservoir jusqu'à la borne."],
          reussite:[
            "Le liquide file dans le circuit en sifflant. La borne se couvre de givre, par plaques, et son écran passe du rouge au vert pâle.",
            "MÉMOIRE STABILISÉE. RELEVÉ DE SOL DISPONIBLE — CAROTTE DE RÉFÉRENCE, SECTEUR SOUCI-2. Un tiroir s'ouvre au pied de la borne : une longue carotte de sol, découpée en tranches, sous verre."
          ] } },

      /* ---- 5. La carotte — ORDRE (ratable) ---- */
      { indice:"À La Cuvette, devant la borne : remets la carotte de sol dans l'ordre pour que la borne affiche son relevé.",
        cible:{ carte:"braise", lieu:"cuvette" }, leurres:[ { carte:"braise", lieu:"aiguilles" }, { carte:"braise", lieu:"solfatares" }, { carte:"braise", lieu:"failles" } ],
        image:"images/quetes/q8/5.png",
        arrivee:[
          "Les tranches de la carotte ont glissé dans leur étui, pêle-mêle. La borne demande qu'on les remette en place avant de lire : de la plus ancienne, tout au fond, à la plus récente, en surface.",
          "« C'est comme les couches d'un mur », dit Galm. « Ce qui est dessous est arrivé avant. Commence par la roche. »"
        ],
        defi:{ type:"ordre",
          texte:["Six tranches de sol. Remets-les de la plus profonde (la plus ancienne) à la plus haute (la plus récente)."],
          consigne:"Du fond de la carotte jusqu'à la surface.",
          elements:[
            "Roche mère : basalte nu, froid, sans rien dedans.",
            "Premier sol : un limon fin, posé sur la roche. Encore stérile.",
            "Terre noire, grasse, pleine de fibres : un sol qui vit.",
            "Racines serrées, pollen jaune-orange par millions, des graines entières.",
            "Une seule couche de cendre fine, grise, régulière — posée sur les racines d'un coup.",
            "Croûte vitrifiée : le sol d'aujourd'hui, noir et fondu."
          ],
          reussite:[
            "La borne valide. Sur l'écran, la carotte se redessine, et sous chaque couche une ligne de texte apparaît. SEMIS SOUCI : GERMINATION CONFORME. CROISSANCE CONFORME. FLORAISON : NON CONFORME — ÉCART DE COULEUR 3 %, HORS TOLÉRANCE.",
            "Puis, sous la couche de cendre : ESSAI CLOS. SECTEUR FERMÉ. Rien d'autre. Pas de cause, pas de date. Juste ça.",
            "La Braise était verte. Orange, plutôt : couverte de fleurs. Et puis une couche de cendre, une seule, partout à la même profondeur — pas une éruption, pas un incendie qui avance. Quelque chose qui est tombé sur toute la planète en même temps.",
            "« \"Secteur fermé\" », dit Galm, très bas, dans la radio. « C'est les mots de ton vieux, ça. \"Le secteur.\" » Un silence. « Remonte. J'aime pas savoir ça toute seule. »"
          ] } },

      /* ---- 6. Remonter — CHOIX (Cercles) ---- */
      { indice:"Retourne à ton vaisseau, à l'aire d'atterrissage. Avant de décoller, décide de ce que tu remontes.",
        cible:{ carte:"braise", lieu:"atterrissage" }, leurres:[ { carte:"braise", lieu:"aiguilles" }, { carte:"braise", lieu:"solfatares" }, { carte:"braise", lieu:"cuvette" } ],
        image:"images/quetes/q8/6.png",
        arrivee:[
          "Ton vaisseau est là où tu l'as laissé, couvert d'une fine pellicule de cendre. Dans le sas, avant de refermer, tu vides tes poches sur le banc.",
          "Tu as ramené de la Cuvette plus que tu ne peux en garder. Il faut choisir."
        ],
        defi:{ type:"choix",
          texte:["La cendre de La Braise colle à tout. Ce que tu remontes, tu l'auras sous les yeux longtemps."],
          options:[
            { texte:"Les graines calcinées de la couche de racines. Pour Adaya : elle saura dire ce que c'était.",
              cercles:{ racines:5 },
              journal:"Tu as gardé une poignée de graines noires, intactes sous la cendre. Adaya voudra les voir." },
            { texte:"Le module de mémoire de la borne. Démonté, il dira peut-être comment AREPO « ferme » un secteur.",
              cercles:{ assembleurs:5 },
              journal:"Tu as démonté le module de mémoire de la borne. Il est lourd, et il est tiède." },
            { texte:"Rien. Seulement noter la profondeur de la couche de cendre, et le texte de la borne, mot pour mot.",
              cercles:{ veilleurs:5 },
              journal:"Tu as tout noté et rien pris. ESSAI CLOS. SECTEUR FERMÉ. C'est dans ton carnet." }
          ],
          reussite:[
            "Le sas se referme. Tu retires ton casque, et l'air du bord a le goût du métal chaud — le meilleur air du monde.",
            "Galm, dans la radio, quand tu décolles : « Ton vieux Sorn, il faudra lui dire. Pour la couche de cendre. » Un temps. « Moi je lui dirai pas. C'est pas à moi de lui apprendre ce que \"fermer\" veut dire. »"
          ] } }
    ],
    recompense:{ credits:1100, xp:180, pa:1, flags:{} }   // v1.01 : PA (1re descente)
  },

  /* ===========================================================
     Q9 — CE QUE VEUT DIRE FERMER (v0.98). La Braise, Champ d'aiguilles.
     Donneur : SORN, par radio (prise à La Carcasse) — Galm a refusé de lui dire
     (fin de Q8) : c'est au joueur.
     Le joueur apprend : c'est AREPO qui brûle, DÉLIBÉRÉMENT, par procédure :
     personnel embarqué → confirmation → fermeture. Le mot mangé au Muet (Q7,
     « ██ LE SECTEUR ») était FERMER. Silène aurait fini ainsi — la confirmation
     n'est jamais arrivée chez nous.
     ⚠ NE PAS dire pourquoi elle n'est pas arrivée (la silène, Q14-Q15), ni
       pourquoi les 80 ont refusé (les bêtes, Q15). Sorn s'arrête à « si ».
     ⚠ Mini-jeux : labyrinthe (1), piratage (2), attente (3), glyphes (4),
       énigme (5), choix (6). Pas de PA.
     =========================================================== */
  {
    id:"q9",
    nom:"Ce que veut dire fermer",
    donneur:"Vieux Sorn",
    donneurImg:"images/quetes/vieux_sorn.png",
    donneurLieu:"par radio, depuis La Carcasse",
    lieuPrise:"carcasse",
    intro:[
      "Galm te tend son casque sans un mot, et s'en va trier des boulons à l'autre bout de l'atelier. Elle a décidé de ne pas entendre.",
      "Tu racontes à Sorn. La carotte, la terre noire, le pollen, et la couche de cendre, une seule, partout à la même profondeur. « ESSAI CLOS. SECTEUR FERMÉ. » Il ne t'interrompt pas une fois.",
      "Quand tu as fini, il reste si longtemps silencieux que tu vérifies la liaison. Puis : « \"Le secteur\". Au Muet, il manquait des mots devant. » Sa voix est plate, comme en Q2, quand il a lu la ligne de son aïeul. « Je veux savoir lequel. »",
      "« La borne de ta Cuvette, elle a parlé d'une station, non ? Dans les aiguilles, au nord-ouest. Une station qui ferme. » Un temps. « Va voir comment on ferme une planète, gamin. Moi je peux pas. Et je crois que j'ai besoin de le savoir avant de dormir encore une nuit sur Silène. »"
    ],
    etapes:[

      /* ---- 1. Le Champ d'aiguilles — LABYRINTHE (non ratable) ---- */
      { indice:"Sur La Braise, le Champ d'aiguilles, au nord-ouest. La station est quelque part au milieu. Prends de l'air : c'est loin du vaisseau.",
        cible:{ carte:"braise", lieu:"aiguilles" }, leurres:[ { carte:"braise", lieu:"solfatares" }, { carte:"braise", lieu:"cuvette" }, { carte:"braise", lieu:"failles" } ],
        image:"images/quetes/q9/1.png",
        arrivee:[
          "Les aiguilles d'obsidienne montent deux fois plus haut que ton vaisseau, serrées comme les dents d'un peigne. Entre elles, des couloirs de cendre qui tournent, se referment, repartent. La fumée des Solfatares a dérivé jusqu'ici : tu ne vois pas à dix mètres.",
          "Ta radio crache, puis se tait, puis crache encore. L'obsidienne mange le signal. « …pas le temps de… tourner en rond… » dit Sorn, par morceaux. Tu vas devoir te repérer seul."
        ],
        defi:{ type:"labyrinthe", colonnes:6, lignes:7,
          texte:["Traverse le Champ d'aiguilles jusqu'à la station. Tu ne vois que ce que tu as déjà approché."],
          reussite:[
            "Les aiguilles s'écartent d'un coup sur une clairière de cendre, parfaitement ronde. Au centre, un bâtiment bas, sans fenêtre, en métal gris qui n'a pas pris une trace de rouille. Sur la porte, gravé : le carré. Et en dessous, une plaque.",
            "STATION DE FERMETURE — SECTEUR SOUCI. La radio revient, assez pour que tu entendes Sorn respirer."
          ] } },

      /* ---- 2. La porte — PIRATAGE (ratable) ---- */
      { indice:"Au Champ d'aiguilles, devant la station de fermeture. Le lecteur de la porte est à moitié mort.",
        cible:{ carte:"braise", lieu:"aiguilles" }, leurres:[ { carte:"braise", lieu:"solfatares" }, { carte:"braise", lieu:"cuvette" }, { carte:"braise", lieu:"failles" } ],
        image:"images/quetes/q9/2.png",
        arrivee:[
          "La porte est scellée, mais elle n'a pas oublié qu'elle était une porte : son lecteur clignote, capricieux, comme un vieux qui cherche ses mots.",
          "« Un lecteur de service », dit Sorn. « Ils laissaient toujours une voie de maintenance. Tu te souviens, au quai ? Pareil. Le signal passe et repasse : attrape-le au bon moment. »"
        ],
        defi:{ type:"piratage", manches:3,
          texte:["Le lecteur de la porte a un canal de maintenance, mal protégé. Il faut le saisir trois fois de suite."],
          reussite:[
            "La porte s'efface dans le mur sans un bruit. L'intérieur est propre. Pas une cendre. Pas une trace de chaleur. On a brûlé une planète entière autour de cette pièce, et elle n'a pas pris un degré.",
            "Une salle de contrôle. Un pupitre. Un journal de bord, allumé depuis trois siècles, qui attend quelqu'un pour le lire."
          ] } },

      /* ---- 3. Le journal — ATTENTE (non ratable) : Sorn traduit ---- */
      { indice:"Dans la station de fermeture du Champ d'aiguilles. Lis le journal à Sorn : il traduit.",
        cible:{ carte:"braise", lieu:"aiguilles" }, leurres:[ { carte:"braise", lieu:"solfatares" }, { carte:"braise", lieu:"cuvette" }, { carte:"braise", lieu:"failles" } ],
        image:"images/quetes/q9/3.png",
        arrivee:[
          "Le journal est en ancien, en lignes courtes, datées en jours de service. Tu les épelles une par une. Sorn traduit, et à chaque ligne sa voix baisse un peu.",
          "Ça prend du temps. Tu peux t'éloigner et revenir : le journal ne va nulle part."
        ],
        defi:{ type:"attente", duree:20*60*1000,
          texte:["Tu lis le journal de la station, ligne après ligne. Sorn traduit."],
          reussite:[
            "J-40 — ESSAI SOUCI : FLORAISON NON CONFORME. RECOMMANDATION : FERMETURE.",
            "J-38 — DIRECTION → SOUCI : ORDRE D'ÉVACUATION. RASSEMBLER LE PERSONNEL AU QUAI. NE RIEN EMPORTER.",
            "J-2 — QUAI → DIRECTION : PERSONNEL EMBARQUÉ : 212 SUR 212. DEMANDE DE CONFIRMATION.",
            "J-1 — DIRECTION → QUAI : CONFIRMATION REÇUE. VAISSEAU EN APPROCHE.",
            "J-0 — DÉPART DU DERNIER VAISSEAU. STATION ARMÉE.",
            "J-0 + 6 H — FERMETURE EXÉCUTÉE. DURÉE : 41 MIN. SURFACE TRAITÉE : 100 %.",
            "« Quarante et une minutes », dit Sorn. « Deux cent douze personnes montent dans un vaisseau, le vaisseau s'en va, et six heures après, quarante et une minutes, et plus rien. » Il ne crie pas. C'est pire.",
            "« J-38, l'ordre d'évacuation. J-2, tout le monde embarqué. J-1, confirmation. » Tu l'entends tourner des pages — le carnet de famille, sûrement. « Chez nous aussi, y a eu l'ordre d'évacuation. Chez nous aussi, ils ont demandé la confirmation. Et chez nous, la réponse est arrivée en bouillie. »",
            "« Plus bas, sur le pupitre, y a un schéma. Des pictogrammes. Montre-les-moi. »"
          ] } },

      /* ---- 4. Le schéma — GLYPHES (ratable) ---- */
      { indice:"Dans la station de fermeture : le schéma de la procédure, en pictogrammes. Rends à chacun son sens.",
        cible:{ carte:"braise", lieu:"aiguilles" }, leurres:[ { carte:"braise", lieu:"solfatares" }, { carte:"braise", lieu:"cuvette" }, { carte:"braise", lieu:"failles" } ],
        image:"images/quetes/q9/4.png",
        arrivee:[
          "Sur le pupitre, gravé sous verre, un schéma : une suite de pictogrammes reliés par des flèches, comme une recette. Six étapes. À côté de chacune, un mot en ancien.",
          "« Je connais certains mots », dit Sorn. « Pas tous. Aide-moi à les mettre en face des images. »"
        ],
        defi:{ type:"glyphes",
          texte:["Six pictogrammes, six mots de l'ancien. Rends à chacun son sens pour lire la procédure."],
          consigne:"Associe chaque pictogramme à sa signification.",
          paires:[
            { picto:"▲", glyphe:"ΣΛ", sens:"Évacuation" },
            { picto:"▦", glyphe:"ΠΔ", sens:"Personnel embarqué" },
            { picto:"◎", glyphe:"ΩΘ", sens:"Confirmation" },
            { picto:"◑", glyphe:"ΞΘ", sens:"Délai" },   /* ⚠ pas ◷ : en Q4, ◷ = « Départ programmé » */
            { picto:"⌁", glyphe:"ΘΘ", sens:"Alimentation" },
            { picto:"✕", glyphe:"ΧΧ", sens:"Fermeture" }
          ],
          distracteurs:["Irrigation","Récolte","Quarantaine"],
          reussite:[
            "La procédure se lit d'un trait, maintenant : ÉVACUATION → PERSONNEL EMBARQUÉ → CONFIRMATION → DÉLAI → ALIMENTATION → FERMETURE.",
            "« Pas de fermeture sans confirmation », dit Sorn, lentement, comme on lit une règle au tableau. « Et pas de confirmation sans le personnel embarqué. » Il répète la dernière flèche pour lui-même. « Fermeture. »",
            "Sous le schéma, une dernière ligne, en plus petit, qui ne s'est pas effacée : le texte exact de l'ordre final, celui que la station a reçu avant de s'armer. Il y manque un mot, rongé par une goutte de soudure. Mais toi, ce texte, tu l'as déjà lu. Au Muet."
          ] } },

      /* ---- 5. L'ordre — ÉNIGME (essais illimités) ---- */
      { indice:"Dans la station de fermeture : l'ordre final, sous le schéma. Il y manque un mot — celui qui manquait au Muet.",
        cible:{ carte:"braise", lieu:"aiguilles" }, leurres:[ { carte:"braise", lieu:"solfatares" }, { carte:"braise", lieu:"cuvette" }, { carte:"braise", lieu:"failles" } ],
        image:"images/quetes/q9/5.png",
        arrivee:[
          "PERSONNEL : EMBARQUÉ. CONFIRMATION : REÇUE. ██████ LE SECTEUR.",
          "Au Muet, la réponse de la direction se terminait pareil : « … LE SECTEUR ». Tu as maintenant, sous les yeux, la procédure entière, et le nom de la dernière étape."
        ],
        defi:{ type:"enigme",
          texte:"Le mot rongé est la dernière étape du schéma, à l'infinitif, comme un ordre.",
          question:"« Quel mot manque devant « le secteur » ? »",
          reponses:["fermer","fermer le secteur","ferme","fermez"],
          indice:"La dernière flèche du schéma. Écrite comme un ordre : « … le secteur ».",
          reussite:[
            "FERMER LE SECTEUR.",
            "Tu le dis à voix haute, dans le casque. Et à l'autre bout, très loin, sur Silène, tu entends quelque chose que tu n'avais jamais entendu : Sorn qui s'assoit.",
            "« Fermer. » Il le dit sans colère. « Pas quitter. Pas garder. Fermer. Comme ici. » Un long silence. « Ils ont demandé la confirmation, chez nous. Si elle était passée, si la réponse était arrivée entière… » Il ne finit pas. Il n'a pas besoin.",
            "« Silène aurait fini comme ta Braise. Les champs, les serres d'Adaya, la ligne, les gosses. Quarante et une minutes. » Puis, plus bas : « Et on vit dessus depuis trois cents ans sans savoir qu'on est en sursis. »"
          ] } },

      /* ---- 6. La station — CHOIX (Cercles) ---- */
      { indice:"Dans la station de fermeture. Avant de repartir, décide de ce que tu en fais.",
        cible:{ carte:"braise", lieu:"aiguilles" }, leurres:[ { carte:"braise", lieu:"solfatares" }, { carte:"braise", lieu:"cuvette" }, { carte:"braise", lieu:"failles" } ],
        image:"images/quetes/q9/6.png",
        arrivee:[
          "Le pupitre affiche toujours la même ligne, depuis trois siècles : STATUT — EN VEILLE. PRÊTE POUR LE PROCHAIN ORDRE.",
          "Prête. Pour le prochain ordre. Elle n'a plus rien à brûler ici, mais elle attend quand même. Comme le quai. Comme l'Huissier. Comme tout ce qu'AREPO a laissé derrière elle."
        ],
        defi:{ type:"choix",
          texte:["La station attend. Toi, tu as encore de l'air pour un moment. Ce que tu fais ici, personne ne le verra — sauf Sorn, qui écoute."],
          options:[
            { texte:"Recopier le journal et l'ordre, mot pour mot, en ancien, pour que Sorn les ait sous les yeux.",
              cercles:{ langues:5 },
              journal:"Tu as recopié le journal de la station et l'ordre final. Sorn dit qu'il les lira à Adaya. Il a dit « à Adaya », sans s'en rendre compte." },
            { texte:"Arracher ce qui se revend — le pupitre, les câbles, le métal qui ne rouille pas. Qu'elle ne soit plus prête pour rien.",
              cercles:{ eclats:5 },
              journal:"Tu as dépouillé la station. Elle ne sera plus jamais prête pour quoi que ce soit." },
            { texte:"Ne toucher à rien, et graver sur la porte ce qui s'est passé ici, pour ceux qui viendront après.",
              cercles:{ veilleurs:5 },
              journal:"Tu as gravé sur la porte : « Ici, on a fermé une planète en fleurs. 41 minutes. » Quelqu'un le lira." }
          ],
          reussite:[
            "Tu ressors dans la cendre. Les aiguilles se referment derrière toi comme si la station n'avait jamais existé.",
            "« Gamin. » Sorn, avant de couper. « Un truc me tourne dans la tête. \"Pas de confirmation sans le personnel embarqué.\" » Un temps. « Chez nous, il en manquait quatre-vingts, sur le manifeste. » Il ne dit pas la suite. Il ne la connaît pas encore. Toi non plus."
          ] } }
    ],
    recompense:{ credits:1200, xp:200, flags:{} }
  },

  /* ===========================================================
     Q10 — LES RELEVÉS DE NUIT (v0.98). Le Gravier (officiel : Jachère haute).
     Donneuse : GALM (prise à La Carcasse). Tout en ORBITE.
     Le joueur apprend : les sondes d'AREPO SURVEILLENT LES CULTURES depuis trois
     siècles et émettent vers un bureau qui ne répond plus. Vue d'en haut, la nuit,
     la ligne de silène n'est pas un périmètre : c'est un CHEMIN à DEUX BOUTS. Le
     bout ouest finit sous l'anneau ; le bout est finit sur une tache de lumière
     que personne n'a jamais vue d'en bas.
     ⚠ La sonde du Gravier est la SONDE ORTIE (nouvelle ; Bardane et Chardon
       dérivent ailleurs, LORE.md §9). Une machine, pour de vrai.
     ⚠ NE PAS dire ce qu'il y a au bout de l'est (les bêtes, Q15). Juste : de la
       lumière, qui bat comme la ligne.
     ⚠ Triangulation EN ORBITE : chaque relevé se fait après un vol (carburant,
       énergie, risque de sonde). Zone large autour du Gravier. Pas de PA.
     =========================================================== */
  {
    id:"q10",
    nom:"Les relevés de nuit",
    donneur:"Galm",
    donneurLieu:"La Carcasse",
    lieuPrise:"carcasse",
    intro:[
      "Galm te montre un morceau de métal tordu, pas plus grand qu'une main, gravé du carré. « Un mineur du Gravier me l'a vendu. Il l'a arraché à une carcasse, là-bas, coincée entre deux cailloux. » Elle le retourne. Sur l'autre face : SONDE ORTIE.",
      "« Une sonde. Comme celles qui dérivent partout dans le secteur et qui te tombent dessus quand tu voles. » Elle hausse les épaules. « Sauf que celle-là, elle bouge plus. Et d'après le mineur, elle bipe encore. »",
      "« Ton vieux dit que les machines d'AREPO notaient tout. » Elle pose le morceau de métal devant toi. « Une sonde, ça regarde en bas. Ça fait trois cents ans qu'elle regarde en bas. Va voir ce qu'elle a vu. »"
    ],
    etapes:[

      /* ---- 1. Le signal — TRIANGULATION en orbite (ratable) ---- */
      { indice:"Au Gravier, tout en bas à droite du secteur. La sonde bipe quelque part dans les cailloux : relève son signal en plusieurs points, puis fouille.",
        cible:{ carte:"espace", x:2113, y:1393, r:300 }, leurres:[ { lieu:"base" }, { lieu:"epave" }, { lieu:"antenne" } ],
        image:"images/quetes/q10/1.png",
        arrivee:[
          "Le Gravier tourne sur lui-même, lentement, comme il le fait depuis toujours : des roches grosses comme des collines qui se frôlent sans jamais se toucher tout à fait. Ou presque. Ta coque le sait.",
          "Le bip est là, faible, noyé dans le crépitement des cristaux. Galm, à la radio : « Il te faut plusieurs relevés. Et fais gaffe en te faufilant : chaque saut entre deux cailloux, c'est du carburant et de la tôle. »"
        ],
        defi:{ type:"triangulation", minReleves:3, fouilles:3, precision:80,
          texte:["La sonde est coincée quelque part dans le Gravier. Déplace-toi dans le champ de roches, relève la force du bip en plusieurs points, puis fouille là où il est le plus fort."],
          reussite:[
            "Entre deux roches qui l'ont prise en tenaille, une carcasse cylindrique, hérissée d'antennes brisées. Sur le flanc, sous une croûte de cristal de Nyx : le carré. SONDE ORTIE — RELEVÉ DES CULTURES — SECTEUR MAAR-3.",
            "MAAR-3. Silène. Elle regardait Silène. Et au moment où tes projecteurs l'éclairent, un de ses bras se déplie avec un gémissement de métal."
          ] } },

      /* ---- 2. Le bras de défense — COMBAT (contrôle de niveau) ---- */
      { indice:"Au Gravier, contre la carcasse de la sonde Ortie. Son bras de défense s'est réveillé.",
        cible:{ carte:"espace", x:2113, y:1393, r:300 }, leurres:[ { lieu:"base" }, { lieu:"epave" }, { lieu:"antenne" } ],
        image:"images/quetes/q10/2.png",
        arrivee:[
          "Le bras de défense de la sonde s'est mis en garde. Il n'a pas de visage, pas de voix, pas d'hésitation : une machine qui protège une machine. Pour une fois, c'en est vraiment une.",
          "PROTECTION DE L'ÉQUIPEMENT — INTRUSION DÉTECTÉE. Galm : « Celle-là, tu peux la casser sans remords. Elle a jamais été quelqu'un. »"
        ],
        defi:{ type:"combat",
          nom:"Bras de défense de la sonde Ortie",
          puissance:40,
          gain:3,
          xp:14,
          texte:["Le bras frappe à intervalles réguliers, comme un métronome. Il protégera la sonde tant qu'il lui restera du courant."],
          reussite:[
            "Le bras se tord, grince, et retombe contre la coque, inerte. Dans le silence, le bip de la sonde continue, imperturbable. Elle n'a pas remarqué qu'on l'avait défendue.",
            "Une trappe de maintenance, sur le flanc. Derrière, un lecteur, qui attend un code."
          ] } },

      /* ---- 3. Le code — MÉMOIRE (ratable) ---- */
      { indice:"Au Gravier, devant la trappe de la sonde Ortie. Son lecteur affiche un code de maintenance, un court instant.",
        cible:{ carte:"espace", x:2113, y:1393, r:300 }, leurres:[ { lieu:"base" }, { lieu:"epave" }, { lieu:"antenne" } ],
        image:"images/quetes/q10/3.png",
        arrivee:[
          "Le lecteur s'allume quand tu approches la main, affiche une ligne, et l'efface presque aussitôt, comme s'il regrettait. Un code de maintenance, pour le technicien de passage. Il y a trois siècles qu'il n'y a plus de technicien de passage.",
          "« Il va l'afficher une fois », dit Galm. « Retiens-le. Les machines d'AREPO répètent pas deux fois. »"
        ],
        defi:{ type:"memoire", duree:6000,
          info:["CODE DE MAINTENANCE", "ORT — 7 — 44 — SOUCHE"],
          texte:["Le lecteur affiche son code de maintenance, puis l'efface."],
          question:"« Quel était le dernier mot du code ? »",
          reponses:["souche","la souche"],
          reussite:[
            "« Souche », répète Galm. « Drôle de mot pour un code. » Tu ne dis rien. Tu penses au creux d'Adaya, aux tiges épaisses comme des bras, à la souche d'où tout semblait partir.",
            "La trappe s'ouvre. Derrière, la mémoire de la sonde, intacte, froide, pleine."
          ] } },

      /* ---- 4. La mémoire — ATTENTE (non ratable) ---- */
      { indice:"Au Gravier, branché à la mémoire de la sonde Ortie. Laisse les relevés se copier.",
        cible:{ carte:"espace", x:2113, y:1393, r:300 }, leurres:[ { lieu:"base" }, { lieu:"epave" }, { lieu:"antenne" } ],
        image:"images/quetes/q10/4.png",
        arrivee:[
          "Trois siècles de relevés. La sonde regardait Silène chaque nuit, à la même heure, et elle a tout gardé. La copie prend du temps. Tu peux t'éloigner et revenir.",
          "Sur l'écran de contrôle, pendant que la copie avance, défilent les en-têtes : RELEVÉ DES CULTURES — MAAR-3 — NUIT — ÉMIS VERS : BUREAU DES CULTURES, TRIPTOLÈME."
        ],
        defi:{ type:"attente", duree:15*60*1000,
          texte:["La mémoire de la sonde se copie dans ton vaisseau."],
          reussite:[
            "COPIE TERMINÉE. Et une dernière ligne, qui ne fait pas partie des relevés : BUREAU DES CULTURES — DERNIÈRE RÉPONSE REÇUE : IL Y A 109 573 NUITS. ÉMISSION MAINTENUE.",
            "Cent neuf mille nuits. Trois cents ans. La sonde envoie chaque nuit ce qu'elle voit à un bureau qui ne répond plus, et elle continue, parce que personne ne lui a dit d'arrêter.",
            "« Ouvre une nuit au hasard », dit Galm. « Je veux voir ce qu'elle regarde. »"
          ] } },

      /* ---- 5. Le relevé — ÉNIGME (essais illimités) ----
         ⚠ v0.98b — l'ancienne question (« combien de bouts ? ») était trop
         facile. On lit maintenant la TRAJECTOIRE d'une vague sur une nuit :
         elle part de l'anneau, file vers l'est à vitesse constante (40 km par
         10 min), touche le bout est… et REVIENT, plus faible. Le joueur doit
         extrapoler l'heure de son retour sous l'anneau. Réponse : 22 h 20.
         Ce que ça sème (sans le dire) : quelque chose, à l'est, RENVOIE la
         vague — la ligne relie deux émetteurs (LORE.md §4). */
      { indice:"Au Gravier, devant les relevés de la sonde Ortie. Regarde une nuit de Silène vue d'en haut.",
        cible:{ carte:"espace", x:2113, y:1393, r:300 }, leurres:[ { lieu:"base" }, { lieu:"epave" }, { lieu:"antenne" } ],
        image:"images/quetes/q10/5.png",
        arrivee:[
          "Silène, la nuit, vue de très haut. Le noir des plaines, les lueurs des cités, l'anneau violet. Et un fil de lumière pâle qui traverse le secteur, droit, sur cent soixante kilomètres : il plonge sous l'anneau à l'ouest, passe par un point plus brillant au milieu — le creux, la souche — et s'arrête net à l'est.",
          "D'en bas, Adaya l'appelle « l'ancien périmètre ». D'en haut, ça ne fait le tour de rien : c'est un chemin, avec deux bouts.",
          "La sonde a noté, cette nuit-là, où se trouvait le point le plus lumineux du fil, toutes les dix minutes. Distance comptée depuis l'anneau :",
          "21 h 00 — 0 km (sous l'anneau) · 21 h 10 — 40 km · 21 h 20 — 80 km (la souche) · 21 h 30 — 120 km · 21 h 40 — 160 km (le bout est)",
          "21 h 50 — 120 km, lueur plus faible · 22 h 00 — 80 km, plus faible encore. Puis la bande de la sonde saute : trois relevés manquent."
        ],
        defi:{ type:"enigme",
          texte:"La vague part de l'anneau, file vers l'est toujours à la même vitesse, touche le bout… et repart dans l'autre sens. La sonde a perdu la suite.",
          question:"« À quelle heure la vague revenue de l'est repasse-t-elle sous l'anneau ? »",
          reponses:["22h20","22 h 20","22:20","22h 20","22 h20","2220","22.20","22h20m","22 heures 20"],
          indice:"Elle avance de 40 km toutes les dix minutes. À 22 h 00, elle est à 80 km de l'anneau, en revenant.",
          reussite:[
            "22 h 20. Tu fais défiler les nuits suivantes pour vérifier : la sonde a parfois gardé le relevé manquant. 22 h 20, sous l'anneau, une lueur faible. Chaque nuit. Aller, retour, à la minute près.",
            "Une vague part de l'anneau — l'appel du quai, la cadence que tu connais. Elle court jusqu'au bout de l'est. Et de là-bas, quelque chose la renvoie. Plus faible, mais la renvoie. Comme quand on crie dans un puits et que le puits répond.",
            "« Un écho », dit Galm, qui a suivi ton doigt sur l'écran. « Ou une réponse. » Elle agrandit le bout est. La sonde n'a pas plus de détail : une tache pâle, dans un repli de terrain, qui s'allume quand la vague arrive. Rien d'autre.",
            "« Un chemin, ça mène quelque part », dit-elle. « Et celui-là, on dirait que quelqu'un décroche au bout. »"
          ] } },

      /* ---- 6. Les relevés — CHOIX (Cercles) ---- */
      { indice:"Au Gravier, auprès de la sonde Ortie. Décide de ce que tu fais de ses relevés.",
        cible:{ carte:"espace", x:2113, y:1393, r:300 }, leurres:[ { lieu:"base" }, { lieu:"epave" }, { lieu:"antenne" } ],
        image:"images/quetes/q10/6.png",
        arrivee:[
          "Tu as les relevés dans ton vaisseau. La sonde, elle, continue d'émettre : chaque nuit, vers un bureau qui ne répond plus, ce qu'elle voit de Silène.",
          "« Qu'est-ce que tu en fais ? » demande Galm. « Moi je dis ça, je dis rien. »"
        ],
        defi:{ type:"choix",
          texte:["Trois siècles de nuits de Silène, dans ton vaisseau. Ce qui en sortira dépend de toi."],
          options:[
            { texte:"Les envoyer à Adaya. Elle a passé sa vie à regarder la ligne d'en bas ; elle mérite de la voir d'en haut.",
              cercles:{ racines:5 },
              journal:"Tu as envoyé les relevés à Adaya. Elle n'a répondu qu'un mot : « Merci. » Puis, une heure plus tard : « Deux bouts. »" },
            { texte:"Démonter l'optique de la sonde : voir comment AREPO regardait ses champs d'aussi haut.",
              cercles:{ assembleurs:5 },
              journal:"Tu as démonté l'optique de la sonde Ortie. Elle voyait assez fin pour compter les tiges de la ligne." },
            { texte:"Déchiffrer les en-têtes des relevés : où ils partaient, qui devait les lire, et depuis quand personne ne les lit plus.",
              cercles:{ langues:5 },
              journal:"Tu as déchiffré les en-têtes : BUREAU DES CULTURES, TRIPTOLÈME. Une adresse. Quelque part, il y a eu quelqu'un pour lire ça." }
          ],
          reussite:[
            "Tu repousses la trappe. La sonde Ortie reprend sa veille, coincée entre ses deux roches, les yeux tournés vers Silène.",
            "Dans ta radio, avant que tu repartes, une voix que tu n'attendais pas : Sorn. Galm a dû lui passer les relevés. « Deux bouts », dit-il simplement. « Et personne chez nous va jamais à l'est. » Un temps. « Faudra bien que quelqu'un y aille, un jour. »"
          ] } }
    ],
    recompense:{ credits:1300, xp:220, flags:{} }
  },

  /* ===========================================================
     Q11 — LE BER (v0.98). La Cassée (officiel : Triptolème-4).
     Donneuse : GALM (prise à La Carcasse). Tout en ORBITE, lieu planete_cassee.
     La Cassée n'est pas une planète : c'est le PORT DU SECTEUR, entièrement
     construit, où AREPO armait ses vaisseaux. On l'a « ouvert » en le désarmant ;
     son réacteur brûle encore à l'intérieur (desc. d'espace-data.js).
     Le joueur trouve, dans son ber, le VAISSEAU D'ÉVACUATION AFFECTÉ À MAAR-3 :
     prêt, équipage à bord, EN ATTENTE DE CONFIRMATION — qui n'est jamais venue.
     Délai dépassé → dossier classé → port désarmé. C'est le vaisseau que le
     Protocole attend depuis trois siècles.
     ⚠ Le MOTIF du classement reste masqué (LORE.md §2 : réservé) — « accès
       direction » : c'est le Bureau des Cultures (Q10, Q15).
     ⚠ Le vaisseau NE PEUT PAS être utilisé (mis en sommeil, réacteur du port mort).
     ⚠ Mini-jeux : traversée (débris), tuyauterie (écluse), labyrinthe
       (coursives), ordre (journal), attente (Sorn), choix. Pas de PA.
     =========================================================== */
  {
    id:"q11",
    nom:"Le ber",
    donneur:"Galm",
    donneurLieu:"La Carcasse",
    lieuPrise:"carcasse",
    intro:[
      "Galm a punaisé les relevés de la sonde Ortie au-dessus de son établi, et en dessous, une photo floue de La Cassée, prise de loin : une sphère fendue en deux, et dans la fente, une lueur rouge.",
      "« Tout le monde l'appelle une planète. » Elle tapote la photo. « Regarde les bords de la fente. C'est droit. C'est des poutres. Une planète, ça casse pas en poutres. » Elle a l'air presque vexée. « Ce truc a été construit. Par qui, tu devines. »",
      "« Les pilotes disent que ça brûle encore, là-dedans. Qu'on s'approche pas à cause des débris. » Elle jette un œil aux relevés, au mot souligné trois fois : CONFIRMATION. « Moi je dis qu'un endroit aussi gros, c'était pas pour rien. Et qu'on bâtit pas un truc pareil pour le laisser brûler. Sauf si on y est obligé. »",
      "« Va voir. Et rapporte-moi des photos du dedans. Pour une fois, c'est moi qui veux savoir. »"
    ],
    etapes:[

      /* ---- 1. Les débris — TRAVERSÉE (ratable) ---- */
      { indice:"La Cassée, à l'est du secteur. Un champ de débris l'entoure : il faut le traverser pour atteindre la fente.",
        cible:{ lieu:"planete_cassee" }, leurres:[ { lieu:"base" }, { lieu:"epave" }, { lieu:"asteroides" } ],
        image:"images/quetes/q11/1.png",
        arrivee:[
          "De près, La Cassée n'a rien d'une planète. C'est une coque, grande comme un monde, faite de plaques et de poutres, fendue du pôle à l'équateur. Dans la fente, tout au fond, une lueur rouge qui ne vacille pas.",
          "Autour, un anneau de débris tourne lentement : des morceaux de coque, des poutres, des plaques qui se heurtent sans bruit. Certains dérivent, inoffensifs. D'autres tournent encore sur eux-mêmes, assez vite pour trancher une coque.",
          "« Ton capteur de proximité », dit Galm. « Il te dit combien de débris tournent autour de chaque trou que t'as déjà traversé. Faufile-toi. »"
        ],
        defi:{ type:"traversee", colonnes:6, lignes:7, lave:11, plaques:3,
          texte:["Traverse l'anneau de débris jusqu'à la fente. Chaque passage franchi t'indique combien de débris en rotation le bordent."],
          reussite:[
            "Tu passes la dernière rangée de débris et la fente s'ouvre devant toi, immense : des centaines de mètres de poutres arrachées, de ponts suspendus dans le vide, de hangars éventrés. Et partout, gravé sur les poutres, le carré.",
            "Au fond, au-dessus de la lueur rouge, un quai d'amarrage encore entier. Sa porte d'écluse est fermée."
          ] } },

      /* ---- 2. L'écluse — TUYAUTERIE (non ratable) ---- */
      { indice:"Dans la fente de La Cassée, au quai d'amarrage. L'écluse est sans courant : il faut lui en ramener.",
        cible:{ lieu:"planete_cassee" }, leurres:[ { lieu:"base" }, { lieu:"epave" }, { lieu:"asteroides" } ],
        image:"images/quetes/q11/2.png",
        arrivee:[
          "L'écluse est intacte, mais morte. À côté, un tableau de distribution arraché : des barres de conduction tordues, dispersées, qui ne relient plus rien à rien. Plus bas, la lueur rouge du réacteur envoie encore assez d'énergie pour faire vivre une porte — si on la lui amène.",
          "« Du courant, de l'eau, c'est pareil », dit Galm. « Ça passe là où c'est relié. Refais-lui un chemin. »"
        ],
        defi:{ type:"tuyauterie", colonnes:5, lignes:5,
          texte:["Remets les barres de conduction dans le bon sens pour amener le courant du réacteur jusqu'à l'écluse."],
          reussite:[
            "L'écluse s'éveille dans un claquement sec. Les voyants passent au vert, un par un, et la porte s'ouvre sur l'intérieur de La Cassée.",
            "Une plaque, sur le linteau, que ton traducteur de fortune arrive à lire : PORT DU SECTEUR TRIPTOLÈME — ARMEMENT ET RELÈVE DES VAISSEAUX."
          ] } },

      /* ---- 3. Les coursives — LABYRINTHE (non ratable) ---- */
      { indice:"Dans La Cassée : les coursives du port se sont effondrées. Trouve un chemin jusqu'aux bers.",
        cible:{ lieu:"planete_cassee" }, leurres:[ { lieu:"base" }, { lieu:"epave" }, { lieu:"asteroides" } ],
        image:"images/quetes/q11/3.png",
        arrivee:[
          "Les coursives du port montaient autrefois en spirale vers les bers, là où l'on amarrait les vaisseaux. Le désarmement les a tordues, pliées, fermées. Certaines finissent dans le vide. D'autres sur un mur.",
          "Ta lampe n'éclaire pas loin. La lueur rouge, en dessous, remonte par les grilles du sol."
        ],
        defi:{ type:"labyrinthe", colonnes:6, lignes:7,
          texte:["Traverse les coursives effondrées jusqu'aux bers. Tu ne vois que ce que tu as déjà approché."],
          reussite:[
            "La dernière coursive débouche sur une galerie immense, en demi-cercle, où s'alignent des bers vides : des berceaux de métal assez grands pour y coucher un vaisseau chacun. Vides. Tous.",
            "Sauf un."
          ] } },

      /* ---- 4. Le vaisseau — ORDRE (ratable) : le journal du ber ---- */
      { indice:"Dans La Cassée, au dernier ber occupé. Le journal du vaisseau est brouillé : remets-le dans l'ordre.",
        cible:{ lieu:"planete_cassee" }, leurres:[ { lieu:"base" }, { lieu:"epave" }, { lieu:"asteroides" } ],
        image:"images/quetes/q11/4.png",
        arrivee:[
          "Il est là, couché dans son ber, énorme : un vaisseau d'évacuation, trapu, fait pour porter beaucoup de monde et aller loin. Pas une égratignure. Ses hublots sont éteints. Sur sa coque, en grandes lettres : AFFECTATION — MAAR-3.",
          "Silène. Il était pour Silène.",
          "Sur le pupitre du ber, le journal du vaisseau s'est brouillé à l'arrêt : six entrées dans le désordre. La console demande de les remettre en place avant d'afficher le reste."
        ],
        defi:{ type:"ordre",
          texte:["Six entrées du journal du vaisseau. Remets-les dans l'ordre où elles ont été écrites."],
          consigne:"Chaque entrée suit la précédente : lis les causes.",
          elements:[
            "Vaisseau affecté à l'évacuation du secteur MAAR-3. Armement en cours.",
            "Armement terminé. Équipage à bord. Prêt au départ.",
            "En attente de la confirmation de MAAR-3 : personnel embarqué.",
            "Délai de confirmation dépassé. Relance envoyée à MAAR-3.",
            "Aucune réponse à la relance. Dossier transmis à la direction.",
            "Direction : dossier classé. Équipage rappelé. Vaisseau mis en sommeil. Désarmement du port ordonné."
          ],
          reussite:[
            "Le journal se remet en place, et tu le lis d'un trait, comme on lit une lettre qui ne vous était pas adressée.",
            "Il était prêt. L'équipage était à bord. Il a attendu la confirmation. Il a relancé. Personne n'a répondu — ou plutôt, la réponse est partie de Silène, et elle est arrivée en bouillie au Muet, et jamais jusqu'ici.",
            "Et quelqu'un, dans un bureau, a classé le dossier. On a rappelé l'équipage, couché le vaisseau dans son ber, et ouvert le port en deux pour qu'il ne serve plus.",
            "Trois cents ans que le Protocole attend un vaisseau. Il est là. Il n'a jamais quitté son berceau."
          ] } },

      /* ---- 5. Le classement — ATTENTE (non ratable) : Sorn traduit ---- */
      { indice:"Dans La Cassée, au ber du vaisseau de MAAR-3. Sorn veut entendre la dernière page.",
        cible:{ lieu:"planete_cassee" }, leurres:[ { lieu:"base" }, { lieu:"epave" }, { lieu:"asteroides" } ],
        image:"images/quetes/q11/5.png",
        arrivee:[
          "Tu appelles Sorn, et tu lui lis le journal. Quand tu arrives à « vaisseau mis en sommeil », il te demande de t'arrêter. Puis de continuer.",
          "Sous le journal, une dernière page, en ancien de direction — un ancien plus serré, plus sec. Il te la fait épeler signe par signe. Ça prend du temps. Tu peux t'éloigner et revenir."
        ],
        defi:{ type:"attente", duree:20*60*1000,
          texte:["Tu épelles la décision de classement. Sorn traduit."],
          reussite:[
            "DOSSIER MAAR-3 — DÉCISION DE CLASSEMENT. RELEVÉS DES CULTURES : MAINTENUS. VAISSEAU : EN SOMMEIL. RÉACTIVATION : SUR CONFIRMATION MAAR-3 UNIQUEMENT.",
            "MOTIF DU CLASSEMENT : [ACCÈS DIRECTION — BUREAU DES CULTURES].",
            "« Masqué », dit Sorn. « Évidemment. » Un rire, bref, sans rien dedans. « Ils ont gardé les sondes pour regarder nos champs, tu te rends compte ? Le vaisseau, ils l'ont couché. Les champs, ils ont continué de les regarder. »",
            "« Réactivation sur confirmation uniquement. » Il répète. « Il attend, lui aussi. Comme eux, en bas. Comme la station de ta Braise. Tout le monde attend la même phrase, et elle viendra jamais. » Un long silence. « Bureau des Cultures. C'est là que ça se décide, tout ça. »"
          ] } },

      /* ---- 6. Le vaisseau endormi — CHOIX (Cercles) ---- */
      { indice:"Dans La Cassée, près du vaisseau de MAAR-3. Avant de repartir, décide de ce que tu fais.",
        cible:{ lieu:"planete_cassee" }, leurres:[ { lieu:"base" }, { lieu:"epave" }, { lieu:"asteroides" } ],
        image:"images/quetes/q11/6.png",
        arrivee:[
          "Le vaisseau dort. Tu poses la main sur sa coque : elle est froide, mais sous tes doigts, très loin, un ronronnement — ses systèmes de veille, qui tournent au ralenti depuis trois siècles, en attendant qu'on les réveille.",
          "« Photos », dit Galm à la radio. « T'avais promis. » Puis, plus bas : « Et après, tu fais ce que tu veux. »"
        ],
        defi:{ type:"choix",
          texte:["Personne n'est venu ici depuis que l'équipage est parti. Ce que tu fais maintenant, le vaisseau ne s'en souviendra pas."],
          options:[
            { texte:"Tout photographier, le ber, la coque, le journal, et le rapporter à Galm comme promis. Rien d'autre.",
              cercles:{ veilleurs:5 },
              journal:"Tu as rapporté les photos à Galm. Elle les a épinglées au-dessus de son établi, à côté des relevés. Elle ne les regarde pas souvent. Elle sait qu'elles sont là." },
            { texte:"Ouvrir une trappe de service et étudier comment ce vaisseau est fait. Il a tenu trois siècles en sommeil.",
              cercles:{ assembleurs:5 },
              journal:"Tu as passé des heures dans les entrailles du vaisseau. Tout est prêt, tout est propre. Il suffirait d'une phrase pour qu'il parte." },
            { texte:"Graver sur sa coque, sous « AFFECTATION — MAAR-3 », une seule ligne : « Ils attendent encore. »",
              cercles:{ racines:5 },
              journal:"Tu as gravé la ligne sur la coque. Si quelqu'un revient un jour réveiller ce vaisseau, il saura qu'il y a des gens au bout." }
          ],
          reussite:[
            "Tu retraverses les coursives, l'écluse, les débris. Derrière toi, La Cassée reprend sa lente rotation, avec son vaisseau endormi au fond et sa lueur rouge qui ne vacille pas.",
            "Galm, quand tu t'amarres à la Carcasse, t'attend sur la passerelle, les bras croisés. « Alors ? » Tu lui dis. Elle écoute jusqu'au bout. Puis elle hoche la tête, lentement. « Un vaisseau entier. Pour eux. Qui dort depuis trois cents ans à deux heures de vol du Perchoir. » Elle rentre dans son atelier sans rien ajouter, et tu l'entends, pour la première fois, ne pas découper quoi que ce soit."
          ] } }
    ],
    recompense:{ credits:1400, xp:240, flags:{} }
  },

  /* ===========================================================
     Q12 — LE GRENIER (v0.99). Le Suaire (officiel : Gypsophila), sous-carte.
     « Le contraire exact » de La Braise : ce qu'AREPO détruit par le feu là-bas,
     elle le CONSERVE par le froid ici. Le Suaire est le GRENIER DU SECTEUR, la
     réserve de semences SATOR : les graines de tous les essais, gelées, intactes.
     Donneuse : ADAYA, par radio — ce sont les relais de SORN qui la portent jusqu'à
     l'orbite (après Q9, les deux familles recommencent à se parler). Prise à La
     Carcasse. Sept étapes : une en orbite, six au sol.
     Q12 s'arrête AU SEUIL : la salle des archives (le manifeste) est pour Q13.
     ⚠ Ne PAS évoquer les bêtes ici (Q13 : la note de terrain ; Q15 : les bêtes).
     ⚠ Pas de PA.
     =========================================================== */
  {
    id:"q12",
    nom:"Le Grenier",
    donneur:"Adaya",
    donneurLieu:"par radio, depuis La Carcasse",
    lieuPrise:"carcasse",
    intro:[
      "Galm te tend son casque avec une drôle de tête. « C'est pas le vieux. C'est une femme. Elle dit qu'elle passe par ses relais à lui. » Elle hausse un sourcil. « Ils se parlent, maintenant ? »",
      "« Petit. » La voix d'Adaya, lointaine, mais nette. « C'est Sorn qui m'a branchée. Il est venu jusqu'à la serre avec sa caisse à outils, il a posé un relais sur mon toit, et il est reparti sans presque rien dire. Trois cents ans que nos familles se croisent sans se parler, et il débarque avec un relais. » Un temps. « Il m'a lu ce que tu as trouvé. La Braise. Les quarante et une minutes. »",
      "« J'ai une question que personne ne s'est jamais posée. » Tu l'entends tourner son relevé de la sonde Ortie. « AREPO essaie des graines sur des planètes. Elle garde ce qui prend, elle brûle ce qui rate. Mais avant de semer — où est-ce qu'elle GARDE ses graines ? On ne transporte pas des semences entre les étoiles dans une poche. Il faut un endroit froid. Très froid. »",
      "« Les équipages appellent la planète blanche le Suaire. Un drap sur un mort. » Elle a un petit rire. « Moi je trouve qu'un drap, ça couvre aussi ce qu'on veut garder propre. Va voir ce qu'il y a dessous. Et habille-toi chaudement. »"
    ],
    etapes:[

      /* ---- 1. La combinaison — LIVRAISON (non ratable), en orbite ---- */
      { indice:"À La Carcasse : Galm doit doubler ta combinaison contre le froid du Suaire. Apporte deux lingots de Voltane pour les résistances et de la filaine pour l'isolant.",
        cible:{ lieu:"epave" }, leurres:[ { lieu:"base" }, { lieu:"asteroides" }, { lieu:"antenne" } ],
        image:"images/quetes/q12/1.png",
        arrivee:[
          "Galm a étalé ta combinaison sur l'établi comme un patient sur une table d'opération. « Là-bas, le froid te bouffe les doigts en dix minutes. Faut des résistances dans les gants, dans les bottes, dans le col. Et de l'isolant partout. »",
          "« Et ton vaisseau », ajoute-t-elle, « c'est toujours le seul endroit où tu respires. Froid ou chaud, ça change rien : emporte des recharges. »"
        ],
        defi:{ type:"livraison",
          objets:{ fab_lingot_de_voltane:2, filaine:4 },
          texte:["Deux lingots de Voltane pour les résistances chauffantes, quatre de filaine pour doubler l'isolant."],
          reussite:[
            "Galm coud, soude, branche. Quand tu enfiles la combinaison, elle est chaude comme un lit. « Te plains pas si ça gratte. »",
            "Adaya, à la radio : « Pose-toi dans la plaine de neige, au milieu. Et cherche le lac. Sur les relevés de la sonde, il y a un lac bleu au sud-est qui ne gèle jamais tout à fait. Un lac qui ne gèle pas, sur une planète de glace, c'est qu'il y a quelque chose de chaud dessous. »"
          ] } },

      /* ---- 2. La Grande Crevasse — TRAVERSÉE (ratable) ---- */
      { indice:"Descends sur Le Suaire (en orbite au-dessus de la planète : onglet « Le Suaire »). Puis franchis la Grande Crevasse : le lac est de l'autre côté.",
        cible:{ carte:"suaire", lieu:"crevasse" }, leurres:[ { carte:"suaire", lieu:"lac" }, { carte:"suaire", lieu:"verriere" }, { carte:"suaire", lieu:"dents" } ],
        image:"images/quetes/q12/2.png",
        arrivee:[
          "La Grande Crevasse coupe le glacier en deux, d'un horizon à l'autre. Au fond, rien : un bleu qui devient noir. Par-dessus, la neige a jeté des ponts — des langues blanches, lisses, qui ont l'air solides. Certaines le sont.",
          "« Les ponts de neige, ça se voit pas », dit Galm depuis l'orbite. « Ton détecteur te dira combien de ponts creux touchent chaque bloc que t'as franchi. Le reste, c'est tes jambes. »"
        ],
        defi:{ type:"traversee", colonnes:6, lignes:7, lave:10, plaques:3,
          texte:["Franchis la crevasse de bloc en bloc. Chaque bloc solide t'indique combien de ponts creux le bordent."],
          reussite:[
            "Tu prends pied sur l'autre lèvre de la crevasse, et tu te retournes : le dernier pont que tu as évité vient de s'effondrer dans le vide, sans un bruit.",
            "Devant toi, au sud-est, le glacier descend en pente douce vers une tache d'un bleu impossible. Le lac."
          ] } },

      /* ---- 3. Le Lac bleu — TRIANGULATION (ratable) ---- */
      { indice:"Au Lac bleu, au sud-est. Sous la glace, quelque chose est plus chaud que le reste : relève la température en plusieurs points pour trouver où.",
        cible:{ carte:"suaire", x:1560, y:1090, r:280 }, leurres:[ { carte:"suaire", lieu:"verriere" }, { carte:"suaire", lieu:"dents" }, { carte:"suaire", lieu:"pics" } ],
        image:"images/quetes/q12/3.png",
        arrivee:[
          "La glace du lac est si claire qu'on voit dedans, sur des mètres. Des bulles figées, des lignes de fracture, et tout au fond, une ombre régulière. Trop régulière. Comme un toit.",
          "Ta combinaison a un capteur thermique. « Plus tu es près de ce qui chauffe, plus ça monte », dit Adaya. « Et quand tu l'as trouvé, tu fores là, pas à côté. On creuse pas la glace au hasard, elle se venge. »",
          "Tu jettes un œil à ton sac. La bouture est grise, éteinte. Ici, il n'y a que du froid, et des machines qui dorment."
        ],
        defi:{ type:"triangulation", minReleves:3, fouilles:3, precision:70,
          texte:["Relève la température de la glace en plusieurs points du lac, puis désigne l'endroit où forer."],
          reussite:[
            "Là. Sous tes bottes, la glace est tiède — tiède, sur une planète où rien n'est tiède. Et dessous, à trois mètres, l'ombre régulière a des angles. Une coupole.",
            "« C'est construit », dit Adaya, et sa voix tremble un peu. « Évidemment que c'est construit. »"
          ] } },

      /* ---- 4. Le forage — ATTENTE (non ratable) ---- */
      { indice:"Au Lac bleu, à l'endroit tiède. Fore la glace jusqu'à la coupole.",
        cible:{ carte:"suaire", x:1560, y:1090, r:280 }, leurres:[ { carte:"suaire", lieu:"verriere" }, { carte:"suaire", lieu:"dents" }, { carte:"suaire", lieu:"pics" } ],
        image:"images/quetes/q12/4.png",
        arrivee:[
          "Tu déplies la foreuse thermique que Galm t'a glissée dans le sac « au cas où ». Elle mord la glace dans un nuage de vapeur, lentement, trop lentement.",
          "Trois mètres de glace, ça prend du temps. Tu peux remonter à ton vaisseau respirer, et revenir. La foreuse travaille seule."
        ],
        defi:{ type:"attente", duree:25*60*1000,
          texte:["La foreuse creuse un puits dans la glace, jusqu'à la coupole."],
          reussite:[
            "La foreuse s'arrête d'elle-même, en butée sur du métal. Au fond du puits, une trappe ronde, sans rouille, gravée du carré. Et autour de la trappe, une inscription en ancien que tu commences à reconnaître : un mot, un seul, répété sur tout le pourtour.",
            "« Lis-le-moi », dit Adaya. Tu épelles. Il y a un long silence, puis la voix de Sorn — il est là, à côté d'elle, dans la serre : « GRENIER. Ça veut dire grenier. »"
          ] } },

      /* ---- 5. La trappe — ÉNIGME (essais illimités) ---- */
      { indice:"Au fond du puits, au Lac bleu : la trappe du Grenier demande un mot de passe.",
        cible:{ carte:"suaire", x:1560, y:1090, r:280 }, leurres:[ { carte:"suaire", lieu:"verriere" }, { carte:"suaire", lieu:"dents" }, { carte:"suaire", lieu:"pics" } ],
        image:"images/quetes/q12/5.png",
        arrivee:[
          "La trappe a un clavier, et une question, sur un écran pas plus grand qu'une main : ACCÈS RÉSERVÉ AU PERSONNEL DU PROGRAMME. NOM DU PROGRAMME ?",
          "Tu as vu ce mot. Sous le carré de la Carcasse, en petit, en ancien, deux fois. C'est la première ligne du carré."
        ],
        defi:{ type:"enigme",
          texte:"Le programme d'ensemencement d'AREPO porte le nom de la première ligne du carré.",
          question:"« NOM DU PROGRAMME ? »",
          reponses:["sator","programme sator","le programme sator"],
          indice:"Première ligne du carré gravé à la Carcasse. Le semeur.",
          reussite:[
            "SATOR. ACCÈS AUTORISÉ. La trappe pivote sur un souffle d'air glacé, plus froid encore que dehors, et une échelle descend dans le noir.",
            "« Le semeur », dit Sorn, doucement. « Le semeur Arepo mène sa charrue. » Un temps. « C'est dans le carnet, en marge, depuis toujours. Je croyais que c'était une comptine. »"
          ] } },

      /* ---- 6. Les galeries — LABYRINTHE (non ratable) ---- */
      { indice:"Sous le Lac bleu, dans les galeries du Grenier. Trouve la grande salle.",
        cible:{ carte:"suaire", x:1560, y:1090, r:280 }, leurres:[ { carte:"suaire", lieu:"verriere" }, { carte:"suaire", lieu:"dents" }, { carte:"suaire", lieu:"pics" } ],
        image:"images/quetes/q12/6.png",
        arrivee:[
          "L'échelle débouche sur un réseau de galeries creusées dans la glace, voûtées, éclairées par des veilleuses bleues qui n'ont jamais cessé de fonctionner. Le froid est si vif qu'il brûle.",
          "Les galeries se ressemblent toutes. Certaines finissent sur un mur de glace. D'autres descendent encore."
        ],
        defi:{ type:"labyrinthe", colonnes:6, lignes:7,
          texte:["Traverse les galeries du Grenier jusqu'à la grande salle. Tu ne vois que ce que tu as déjà approché."],
          reussite:[
            "La dernière galerie s'ouvre sur une salle si grande que ta lampe n'en trouve pas le fond. Des rayonnages, à perte de vue, montent jusqu'à la voûte. Et sur chaque rayonnage, alignés au millimètre, des milliers de bocaux de verre, givrés, étiquetés.",
            "Des graines. Des graines partout. Toutes les graines qu'AREPO a jamais voulu semer dans ce secteur, rangées dans le froid, et qui attendent.",
            "Tu lis une étiquette, au hasard, à la lampe. SILÈNE — LOT D'ORIGINE — MAAR-3. Celle d'à côté : ANCOLIE — MAAR-12. Plus loin : SOUCI — ESSAI CLOS. Dans la radio, Adaya ne dit plus rien du tout."
          ] } },

      /* ---- 7. Le seuil — CHOIX (Cercles) ---- */
      { indice:"Dans la grande salle du Grenier, sous le Lac bleu. Décide de ce que tu fais avant de remonter.",
        cible:{ carte:"suaire", x:1560, y:1090, r:280 }, leurres:[ { carte:"suaire", lieu:"verriere" }, { carte:"suaire", lieu:"dents" }, { carte:"suaire", lieu:"pics" } ],
        image:"images/quetes/q12/7.png",
        arrivee:[
          "Au fond de la salle, derrière une vitre givrée, une porte blindée, plus petite, marquée d'une plaque : ARCHIVES — MANIFESTES DE SEMIS. Scellée. Elle ne s'ouvrira pas aujourd'hui : ton air baisse, et la porte a son propre verrou.",
          "Devant toi, le rayon de la silène. Des dizaines de bocaux. LOT D'ORIGINE. La plante d'Adaya, telle qu'AREPO l'a semée, avant la ligne, avant le rythme, avant tout.",
          "« Petit », dit Adaya, et c'est presque un murmure. « Fais ce que tu crois juste. »"
        ],
        defi:{ type:"choix",
          texte:["Le froid ronge ta combinaison. Il faut remonter. Ce que tu laisses ici y restera encore trois cents ans."],
          options:[
            { texte:"Prendre un seul bocal de silène d'origine, pour Adaya. Une graine d'avant tout le reste.",
              cercles:{ racines:5 },
              journal:"Tu as emporté un bocal de silène d'origine. Adaya a pleuré à la radio, sans essayer de le cacher." },
            { texte:"Ne toucher à rien, et relever chaque rangée : quelles espèces, combien, lesquelles portent « essai clos ».",
              cercles:{ veilleurs:5 },
              journal:"Tu as relevé les rayonnages, rangée après rangée. La liste est longue. Beaucoup d'« essai clos »." },
            { texte:"Remplir ton sac de bocaux rares. Des graines d'AREPO, gelées depuis trois siècles : des collectionneurs paieraient une fortune.",
              cercles:{ eclats:5 },
              journal:"Tu as rempli ton sac de bocaux. Le rayonnage, derrière toi, a des trous, maintenant." }
          ],
          reussite:[
            "Tu remontes l'échelle, et la trappe se referme d'elle-même au-dessus de toi, sur son souffle d'air glacé. Le Grenier se rendort sous son lac.",
            "« Les archives », dit Sorn dans la radio, quand tu retrouves ton vaisseau. « La porte du fond. Les manifestes de semis. » Un temps. « Si c'est là qu'ils écrivaient ce qu'ils semaient, c'est peut-être là qu'ils écrivaient aussi ce qu'ils comptaient brûler. »",
            "Adaya ne dit rien. Mais tu l'entends respirer, et elle ne coupe pas la liaison."
          ] } }
    ],
    recompense:{ credits:1500, xp:260, pa:1, flags:{} }   // v1.01 : PA (2e descente)
  },

  /* ===========================================================
     Q13 — LE MANIFESTE (v0.99). Le Suaire, sous le Lac bleu : les Archives du
     Grenier. Donneuse : ADAYA, avec SORN à côté d'elle (radio). Prise à La Carcasse.
     Le joueur apprend :
       1. le MANIFESTE DE SEMIS du secteur : Silène (MAAR-3), non conforme —
          FERMETURE PLANIFIÉE, « en attente de confirmation : personnel embarqué » ;
          Ancolie (MAAR-12), conforme ; Souci (La Braise), essai clos, fermé ;
       2. le CHEPTEL D'APPOINT : cuprin, cuirasson, toisard, nourrin — importés
          pour le personnel, « origine : hors secteur » (les bêtes des enclos ne
          viennent pas de Maar, LORE.md §2) ;
       3. une NOTE DE TERRAIN, signée VARECK (le chef d'équipe du journal de Q2),
          classée sans suite : « bras est — organismes mobiles observés : cinq ».
     ⚠ Ne PAS dire ce que sont ces organismes (Q15), ni pourquoi la confirmation
       n'est pas arrivée (Q14). ⚠ Pas de PA.
     =========================================================== */
  {
    id:"q13",
    nom:"Le manifeste",
    donneur:"Adaya",
    donneurLieu:"par radio, depuis La Carcasse",
    lieuPrise:"carcasse",
    intro:[
      "Cette fois, quand Galm te tend le casque, ce sont deux voix qui se chevauchent, puis se taisent pour laisser parler l'autre. Adaya, et Sorn. Ensemble, dans la serre.",
      "« Les archives », dit Adaya. « La porte du fond. Il faut savoir ce qu'il y a dedans. » « Ce qu'ils écrivaient avant de semer », ajoute Sorn. « Et avant de brûler. »",
      "Un silence. Puis Adaya, plus bas : « Petit, j'ai planté une des graines d'origine que tu m'as montrées au Grenier — enfin, j'ai essayé, en pensée. Toute la nuit. Et je me suis demandé : s'ils gardaient tout, les graines, les lots, les étiquettes… ils gardaient aussi ce qu'ils avaient décidé pour nous. »",
      "« Va lire », dit Sorn. « On t'écoute. Tous les deux. »"
    ],
    etapes:[

      /* ---- 1. La porte des archives — CADENAS (ratable, Sorn aide) ---- */
      { indice:"Sur Le Suaire, sous le Lac bleu, au fond de la grande salle du Grenier : la porte des Archives.",
        cible:{ carte:"suaire", x:1560, y:1090, r:280 }, leurres:[ { carte:"suaire", lieu:"verriere" }, { carte:"suaire", lieu:"dents" }, { carte:"suaire", lieu:"pics" } ],
        image:"images/quetes/q13/1.png",
        arrivee:[
          "Tu redescends l'échelle, retraverses les galeries, retrouves la grande salle et ses milliers de bocaux. Au fond, derrière la vitre givrée, la porte blindée : ARCHIVES — MANIFESTES DE SEMIS.",
          "Son verrou est un cadenas à glyphes, comme au poste enseveli, comme au Muet. « Même petit jeu », dit Sorn. « Trois glyphes. Ils ont jamais changé, en trois siècles. Eux non plus. »"
        ],
        defi:{ type:"cadenas", longueur:3, symboles:["▣","⌁","⚑","⊘"], essais:8,
          texte:["Trois logements, les quatre glyphes de la maison. Le verrou te dira, à chaque tentative, combien sont bien placés."],
          reussite:[
            "La porte glisse sur un souffle de froid sec. Derrière, une pièce basse, des casiers d'acier jusqu'au plafond, chacun étiqueté d'un nom de secteur. Tout est rangé. Tout est gelé. Et sur un pupitre, un terminal de catalogue qui s'éveille en te voyant."
          ] } },

      /* ---- 2. Le catalogue — MÉMOIRE (ratable) ---- */
      { indice:"Dans les Archives du Grenier : le terminal de catalogue va t'indiquer où est rangé le dossier de Silène.",
        cible:{ carte:"suaire", x:1560, y:1090, r:280 }, leurres:[ { carte:"suaire", lieu:"verriere" }, { carte:"suaire", lieu:"dents" }, { carte:"suaire", lieu:"pics" } ],
        image:"images/quetes/q13/2.png",
        arrivee:[
          "Tu tapes MAAR-3. Le terminal réfléchit, longtemps, puis affiche une ligne — et commence déjà à l'effacer : il est réglé pour économiser son écran, et il n'a pas été réglé par quelqu'un de patient.",
          "« Retiens », dit Adaya. « Moi j'ai jamais eu de mémoire pour les chiffres. »"
        ],
        defi:{ type:"memoire", duree:6000,
          info:["DOSSIER MAAR-3 (SILÈNE)", "TRAVÉE NORD — CASIER 212"],
          texte:["Le terminal affiche l'emplacement du dossier de Silène, puis l'efface."],
          question:"« Quel est le numéro du casier ? »",
          reponses:["212","casier 212"],
          reussite:[
            "Casier 212. Deux cent douze, comme le personnel de La Braise ; comme les jours de la jonction de Sorn, E. « Ils aimaient bien ce chiffre, on dirait », dit Galm, qui écoute depuis l'orbite. Personne ne rit.",
            "Le casier s'ouvre au toucher. Dedans, un dossier épais, gelé en bloc, sa couverture blanche de givre. Il faudra le laisser dégeler avant de l'ouvrir, sans le déchirer."
          ] } },

      /* ---- 3. Le dégel — ATTENTE (non ratable) : Sorn traduit ---- */
      { indice:"Dans les Archives du Grenier : laisse dégeler le dossier de Silène, et lis-le à Sorn.",
        cible:{ carte:"suaire", x:1560, y:1090, r:280 }, leurres:[ { carte:"suaire", lieu:"verriere" }, { carte:"suaire", lieu:"dents" }, { carte:"suaire", lieu:"pics" } ],
        image:"images/quetes/q13/3.png",
        arrivee:[
          "Tu poses le dossier sur la plaque chauffante du pupitre, réglée au plus bas. Le givre fond en perles. Les pages se décollent une à une. Sorn traduit à mesure que tu épelles.",
          "Ça prend du temps. Remonte respirer si tu dois : le dossier ne bougera pas."
        ],
        defi:{ type:"attente", duree:25*60*1000,
          texte:["Le dossier dégèle, page après page. Sorn traduit le manifeste de semis du secteur."],
          reussite:[
            "MANIFESTE DE SEMIS — SECTEUR TRIPTOLÈME — PROGRAMME SATOR.",
            "SOUCI (planète d'essai) — FLORAISON NON CONFORME. ESSAI CLOS. SECTEUR FERMÉ.",
            "ANCOLIE (MAAR-12) — GERMINATION, CROISSANCE, FLORAISON : CONFORMES. SECTEUR LIVRABLE.",
            "SILÈNE (MAAR-3) — COMPORTEMENT NON CONFORME : CROISSANCE LINÉAIRE, ACTIVITÉ RYTHMIQUE, CAUSE NON IDENTIFIÉE. RECOMMANDATION : FERMETURE.",
            "Et plus bas, une rubrique à part, que Sorn lit sans comprendre d'abord : CHEPTEL D'APPOINT — CUPRIN, CUIRASSON, TOISARD, NOURRIN. USAGE : PERSONNEL (ALIMENTATION, LAINE, CUIR). ORIGINE : HORS SECTEUR. RÉSERVE D'EMBRYONS : RAYON 9.",
            "« Le cuprin », dit Adaya, lentement. « Mon cuprin. Celui que j'ai dans mon enclos, que ma mère avait, et sa mère avant. » Un silence. « Il vient pas d'ici non plus. Rien vient d'ici. On est tous arrivés dans les mêmes caisses. »",
            "« Tourne la page », dit Sorn. « Celle de Silène. Y a une suite. »"
          ] } },

      /* ---- 4. La décision — ÉNIGME (essais illimités) ---- */
      { indice:"Dans les Archives du Grenier : la page de la décision sur Silène.",
        cible:{ carte:"suaire", x:1560, y:1090, r:280 }, leurres:[ { carte:"suaire", lieu:"verriere" }, { carte:"suaire", lieu:"dents" }, { carte:"suaire", lieu:"pics" } ],
        image:"images/quetes/q13/4.png",
        arrivee:[
          "DÉCISION — SECTEUR MAAR-3 (SILÈNE) : FERMETURE PLANIFIÉE. PROCÉDURE STANDARD : ÉVACUATION, PERSONNEL EMBARQUÉ, CONFIRMATION, DÉLAI, FERMETURE.",
          "STATUT : EN ATTENTE. Et sous le statut, une case, vide depuis trois siècles, qui attend toujours d'être cochée.",
          "Tu la reconnais. Tu l'as vue à la station de La Braise, cochée. Tu l'as vue au Muet, arrivée en bouillie. Tu l'as vue dans le ber de La Cassée, jamais reçue."
        ],
        defi:{ type:"enigme",
          texte:"La procédure est la même qu'à La Braise. Toutes les étapes avant la fermeture ont été lancées, sauf une.",
          question:"« Qu'est-ce qui manque pour que Silène soit fermée ? »",
          reponses:["confirmation","la confirmation","une confirmation","la confirmation du personnel embarque","la confirmation du personnel embarqué","personnel embarque","personnel embarqué"],
          indice:"Tu l'as vue cochée à la station de fermeture, jamais reçue au ber de La Cassée.",
          reussite:[
            "EN ATTENTE DE CONFIRMATION : PERSONNEL EMBARQUÉ.",
            "Adaya ne dit rien. Sorn non plus. Tu entends seulement, très loin, dans la serre, le bourdonnement des pollinisateurs — importés, eux aussi, sûrement.",
            "Puis Sorn : « Planifiée. Pas \"envisagée\". Pas \"à étudier\". Planifiée. » Il respire. « Silène est sur une liste depuis trois cents ans. Il manque une case. Une seule. »",
            "« Et entre les pages », dit Adaya d'une voix étrange, « y a quelque chose de collé. Du papier. Écrit à la main. »"
          ] } },

      /* ---- 5. La note de terrain — ORDRE (ratable) ---- */
      { indice:"Dans les Archives du Grenier : une note manuscrite déchirée, collée dans le dossier de Silène. Remets les morceaux dans l'ordre.",
        cible:{ carte:"suaire", x:1560, y:1090, r:280 }, leurres:[ { carte:"suaire", lieu:"verriere" }, { carte:"suaire", lieu:"dents" }, { carte:"suaire", lieu:"pics" } ],
        image:"images/quetes/q13/5.png",
        arrivee:[
          "Une feuille de carnet, déchirée en bandes, écrite au crayon, collée à la hâte entre deux pages officielles. Le froid a décollé les morceaux. Il y en a six, et un tampon, rouge, par-dessus : CLASSÉ SANS SUITE.",
          "« De l'écriture de terrain », dit Sorn, qui l'a reconnue avant toi. « Pas de l'ancien de bureau. Quelqu'un de chez nous. »"
        ],
        defi:{ type:"ordre",
          texte:["Six morceaux d'une note de terrain. Remets-les dans l'ordre : chacun reprend là où le précédent s'arrête."],
          consigne:"Suis le fil de la phrase, d'un morceau au suivant.",
          elements:[
            "Relevé de terrain — équipe de la ligne, bras est.",
            "Au bout du bras est, dans un repli, la lueur ne vient pas des tiges.",
            "Elle vient de quelque chose qui bouge, et qui s'arrête quand on approche.",
            "Organismes mobiles observés : cinq. Marques lumineuses, même rythme que la ligne.",
            "Nous demandons un délai avant toute fermeture, le temps de confirmer.",
            "Signé : Vareck, chef d'équipe. Copie au quai."
          ],
          reussite:[
            "Tu lis la note d'un trait. Puis tu relis la dernière ligne. Vareck.",
            "« Vareck », dit Sorn. « Le poste enseveli. Le journal. \"Le relais 9 émet une porteuse qui n'est pas au catalogue — Vareck demande une inspection.\" » Tu l'entends feuilleter. « C'est lui. Le chef d'équipe de mon aïeul. De la même équipe que ta… » Il s'interrompt.",
            "« Que mon aïeule », finit Adaya. « Troisième ligne du registre. » Un long silence entre eux deux, que tu n'oses pas rompre. « Ils étaient ensemble, sur le terrain. Ils ont vu quelque chose au bout de la ligne. Ils ont demandé du temps. »",
            "« Et quelqu'un, dans un bureau, a mis un tampon dessus », dit Sorn. « Classé sans suite. »"
          ] } },

      /* ---- 6. Le froid — TUYAUTERIE (non ratable) ---- */
      { indice:"Dans les Archives du Grenier : la salle se réchauffe depuis que tu as ouvert la porte. Remets le circuit de froid en état avant de repartir.",
        cible:{ carte:"suaire", x:1560, y:1090, r:280 }, leurres:[ { carte:"suaire", lieu:"verriere" }, { carte:"suaire", lieu:"dents" }, { carte:"suaire", lieu:"pics" } ],
        image:"images/quetes/q13/6.png",
        arrivee:[
          "La porte ouverte, la plaque chauffante, ton propre souffle : la salle a pris deux degrés. Sur les casiers, le givre commence à perler. Un voyant orange clignote au-dessus du pupitre : CONSERVATION MENACÉE.",
          "« Si ça dégèle, tout pourrit », dit Adaya, soudain très pratique. « Les graines, les dossiers. Trois siècles de mémoire. Répare leur froid, petit. Même si c'est le leur. »"
        ],
        defi:{ type:"tuyauterie", colonnes:5, lignes:5,
          texte:["Remets les tronçons du circuit de froid dans le bon sens, du groupe frigorifique jusqu'aux casiers."],
          reussite:[
            "Le liquide froid repart dans le circuit avec un long soupir. Le voyant repasse au bleu. Sur les casiers, les perles de givre se figent à nouveau.",
            "CONSERVATION RÉTABLIE. Le Grenier peut dormir encore trois cents ans."
          ] } },

      /* ---- 7. La note — CHOIX (Cercles) ---- */
      { indice:"Dans les Archives du Grenier. Décide de ce que tu fais de la note de Vareck.",
        cible:{ carte:"suaire", x:1560, y:1090, r:280 }, leurres:[ { carte:"suaire", lieu:"verriere" }, { carte:"suaire", lieu:"dents" }, { carte:"suaire", lieu:"pics" } ],
        image:"images/quetes/q13/7.png",
        arrivee:[
          "La note de Vareck est posée devant toi, recollée, lisible. Six bandes de papier, et un tampon rouge qui a décidé pour tout le monde.",
          "« Organismes mobiles », répète Adaya. « Cinq. Au bout du bras est. » Et plus bas, pour elle-même : « Le bras qu'on suit pas. »"
        ],
        defi:{ type:"choix",
          texte:["C'est la seule trace, en trois siècles, de ce que l'équipe de Vareck a vu. Ce que tu en fais, les deux familles le sauront."],
          options:[
            { texte:"L'emporter, et la remettre à Adaya et à Sorn, ensemble. Elle est à leurs familles plus qu'à AREPO.",
              cercles:{ racines:5 },
              journal:"Tu as rapporté la note de Vareck. Adaya et Sorn l'ont posée sur la table de la serre, entre eux deux, et l'ont regardée longtemps." },
            { texte:"La recopier mot pour mot, en ancien et en traduction, et laisser l'original dans son dossier, à sa place.",
              cercles:{ langues:5 },
              journal:"Tu as recopié la note, et remis l'original à sa place, sous son tampon. Il y a maintenant deux exemplaires de ce que Vareck a vu." },
            { texte:"Arracher le tampon « classé sans suite », et laisser la note ouverte sur le pupitre, pour le prochain qui viendra.",
              cercles:{ veilleurs:5 },
              journal:"Tu as arraché le tampon. La note de Vareck est ouverte sur le pupitre des Archives, lisible pour qui descendra." }
          ],
          reussite:[
            "Tu refermes la porte des Archives derrière toi. Le Grenier, ses graines, ses embryons, ses dossiers, retournent au froid.",
            "« Il y a un endroit », dit Sorn, quand tu retrouves ton vaisseau, « où tous ces morceaux vont ensemble. La réponse coincée au Muet. La procédure de La Braise. Le vaisseau qui dort. La note de Vareck. » Un temps. « Le Perchoir. Le relais de la base. C'est là que tout passait. Si quelqu'un a entendu ce que Vareck et les autres ont décidé ensuite, c'est lui. »"
          ] } }
    ],
    recompense:{ credits:1600, xp:280, flags:{} }
  },

  /* ===========================================================
     Q14 — QUI ÉCOUTE ENTEND (v0.99). Le Perchoir (officiel : Relais Triptolème-1).
     Donneur : SORN, EN PERSONNE — Galm est allée le chercher sur Silène ; c'est sa
     première fois en orbite. Prise à La Carcasse, étapes au Perchoir.
     Le joueur :
       1. reconstitue la VRAIE réponse d'AREPO (LORE.md §5) avec les morceaux de
          Q7 (Muet), Q9 (Braise), Q11 (ber), Q13 (Vareck) : « personnel
          réfractaire : RADIER ; embarquer le reste ; confirmer ; partir ; FERMER » ;
       2. trouve la DERNIÈRE TRACE de Sorn, E. : une émission partie de Silène par
          ses relais, après sa désertion (il ne pouvait plus monter, il pouvait
          émettre — §11), stockée au Perchoir : « Ce qui vit au bout du bras est
          n'est pas un défaut. Ils sont cinq. Si on part, ça brûle. On reste. » ;
       3. RELANCE l'émission EN PHASE avec la cadence de la silène — c'est pour ça
          que la réponse avait été mangée : le brouillage bat la cadence ; en phase,
          ça passe. Elle part sur tout le réseau. 42-U1F L'ENTEND : un accusé de
          réception s'affiche une fois, et s'efface (2e anomalie, §11).
     ⚠ Le terminal refuse Sorn (nom radié) : c'est le joueur qui fait tout.
     ⚠ Ne pas dire CE QUE sont les bêtes (Q15). ⚠ Pas de PA.
     =========================================================== */
  {
    id:"q14",
    nom:"Qui écoute entend",
    donneur:"Vieux Sorn",
    donneurImg:"images/quetes/vieux_sorn.png",
    donneurLieu:"La Carcasse",
    lieuPrise:"carcasse",
    intro:[
      "Il y a quelqu'un d'assis sur la caisse à boulons de Galm, un casque de vol trop grand sur les genoux. Tu mets une seconde à le reconnaître : tu ne l'avais jamais vu ailleurs que derrière son établi.",
      "« Elle est venue me chercher », dit Sorn, sans se lever, en désignant Galm du menton. « Elle m'a pas laissé le choix. » Galm hausse les épaules : « Il m'a dit oui en trois secondes. »",
      "Il regarde par le hublot. La planète en dessous, l'anneau violet minuscule, et les points de lumière des cités. « Toute ma vie, j'ai réparé des relais. Jamais vu d'où ils parlent. » Il se tait longtemps. « Mon grand-père disait : un jour il y aura quelque chose à entendre. »",
      "« Le Perchoir. Le relais de la base. Tout passait par là. La réponse d'AREPO, la note de Vareck, tout. Si mon aïeul a dit quelque chose, après, c'est là que ça dort. » Il se lève enfin, et ses mains tremblent un peu. « On y va. Toi devant. Moi je sais pas marcher dans ces trucs. »"
    ],
    etapes:[

      /* ---- 1. La salle du relais — PIRATAGE (ratable) ---- */
      { indice:"Au Perchoir : la salle du relais, derrière une porte de service. Sorn te suit.",
        cible:{ lieu:"base" }, leurres:[ { lieu:"epave" }, { lieu:"antenne" }, { lieu:"asteroides" } ],
        image:"images/quetes/q14/1.png",
        arrivee:[
          "Derrière l'auberge et le comptoir du Perchoir, un couloir que personne n'emprunte, et au bout, une porte de service gravée du carré : RELAIS TRIPTOLÈME-1 — PERSONNEL AUTORISÉ.",
          "Sorn pose sa main sur le lecteur, par réflexe, comme on salue. Le lecteur bipe. SORN — IDENTITÉ RADIÉE. ACCÈS REFUSÉ. NE PAS RÉINTÉGRER.",
          "Il retire sa main. Il ne dit rien. Puis, doucement : « Même ici. » Et à toi : « Le canal de maintenance. Comme au quai. Fais-le, toi. »"
        ],
        defi:{ type:"piratage", manches:3,
          texte:["Le lecteur de la porte a un canal de maintenance. Saisis-le trois fois de suite."],
          reussite:[
            "La porte s'ouvre sur une salle ronde, basse, bourdonnante : le cœur du relais, là où tous les messages du secteur passaient, et passent encore. Des baies de mémoire, du sol au plafond. Un terminal central, allumé.",
            "Sorn entre derrière toi comme on entre dans une église. Il touche une baie, du bout des doigts. « Trois cents ans », murmure-t-il. « Et ça tourne. »"
          ] } },

      /* ---- 2. La réponse — ORDRE (ratable) : reconstituer la vraie réponse ---- */
      { indice:"Au Perchoir, dans la salle du relais : le terminal accepte enfin les fragments de la réponse d'AREPO. Remets-les dans l'ordre.",
        cible:{ lieu:"base" }, leurres:[ { lieu:"epave" }, { lieu:"antenne" }, { lieu:"asteroides" } ],
        image:"images/quetes/q14/2.png",
        arrivee:[
          "Le terminal a gardé, lui aussi, la réponse de la direction au quai de MAAR-3 — en morceaux, comme au Muet. Mais ici, il accepte qu'on les recolle : il te demande de les remettre dans l'ordre de la procédure.",
          "Tu les connais, ces morceaux. Le « … LE SECTEUR » du Muet. La procédure de la station de La Braise. La case vide du vaisseau de La Cassée. La demande de délai de Vareck.",
          "« Doucement », dit Sorn. « Je veux lire chaque mot. »"
        ],
        defi:{ type:"ordre",
          texte:["Six fragments de la réponse d'AREPO au quai de MAAR-3. Remets-les dans l'ordre de la procédure que tu as lue à La Braise."],
          consigne:"De l'objet de la réponse jusqu'à la dernière étape de la procédure.",
          elements:[
            "DIRECTION → QUAI MAAR-3. OBJET : PERSONNEL RÉFRACTAIRE (80). DEMANDE DE DÉLAI : REJETÉE.",
            "PERSONNEL RÉFRACTAIRE : RADIER. IL NE COMPTE PLUS AU MANIFESTE.",
            "EMBARQUER LE RESTE DU PERSONNEL.",
            "CONFIRMER : PERSONNEL EMBARQUÉ.",
            "PARTIR À L'ARRIVÉE DU VAISSEAU.",
            "FERMER LE SECTEUR."
          ],
          reussite:[
            "La réponse se recolle sous tes yeux, entière pour la première fois en trois siècles : DEMANDE DE DÉLAI REJETÉE. PERSONNEL RÉFRACTAIRE : RADIER. EMBARQUER LE RESTE. CONFIRMER. PARTIR. FERMER LE SECTEUR.",
            "« Radier », dit Sorn. Sa voix est blanche. « Les rayer. Comme mon nom. Rayés, les quatre-vingts ne comptaient plus. Le reste était embarqué. Donc on pouvait confirmer. Donc on pouvait fermer. » Il s'assoit sur le bord d'une baie. « Avec eux dehors. Sur Silène. Quarante et une minutes. »",
            "« Et ce qui est arrivé au quai », dit-il encore, plus lentement, « c'est la phrase sans son début. \"Maintenir le périmètre jusqu'à l'embarquement du personnel non évacué.\" La ligne qui disait de les radier a été mangée. Alors ils ont jamais pu les radier. Alors ils les attendent. » Il regarde ses mains. « Voilà pourquoi ils nous prennent. Ils ont reçu la moitié d'un ordre. »"
          ] } },

      /* ---- 3. L'archive — ATTENTE (non ratable) : chercher Sorn, E. ---- */
      { indice:"Au Perchoir, dans la salle du relais : cherche, dans trois siècles de trafic, une émission venue de Silène et signée Sorn, E.",
        cible:{ lieu:"base" }, leurres:[ { lieu:"epave" }, { lieu:"antenne" }, { lieu:"asteroides" } ],
        image:"images/quetes/q14/3.png",
        arrivee:[
          "« Après », dit Sorn. « Après la porte fermée. Il pouvait plus monter, il avait déserté. Mais il avait ses relais. Il a passé sa vie à les réparer, pour écouter. » Un temps. « Et peut-être pour parler, une fois. »",
          "Tu lances la recherche : émissions en provenance de MAAR-3, signées SORN. Trois siècles de trafic à passer au crible. Les baies bourdonnent. Ça prendra du temps. Sorn ne bouge pas de devant l'écran."
        ],
        defi:{ type:"attente", duree:30*60*1000,
          texte:["Le relais fouille trois siècles de trafic à la recherche d'une émission de Sorn, E."],
          reussite:[
            "UNE CORRESPONDANCE. ÉMISSION MANUELLE — ORIGINE : MAAR-3, RELAIS DE SURFACE 9 — SIGNATAIRE : SORN, E. (RADIÉ). DESTINATAIRE : DIRECTION. STATUT : NON TRANSMISE — BROUILLAGE. CONSERVÉE.",
            "« Le relais 9 », dit Sorn. « Celui du journal du poste. Celui qui a reçu l'ordre. Il s'en est servi pour répondre. » Il avale sa salive. « Non transmise. Ça aussi, ils l'ont mangé. »",
            "Le message est là, en ancien, abîmé par trois siècles et par le brouillage. Il y manque un mot. Sorn lit ce qu'il peut, à voix haute, lentement."
          ] } },

      /* ---- 4. Le message — ÉNIGME (essais illimités) ---- */
      { indice:"Au Perchoir : le dernier message de Sorn, E. Il y manque un mot, que tu connais depuis les Archives du Suaire.",
        cible:{ lieu:"base" }, leurres:[ { lieu:"epave" }, { lieu:"antenne" }, { lieu:"asteroides" } ],
        image:"images/quetes/q14/4.png",
        arrivee:[
          "« À la direction. Ici Sorn, E., technicien relais, radié. Je vous écris depuis dehors. »",
          "« Ce qui vit au bout du bras est n'est pas un défaut. Vareck vous l'a écrit, vous avez tamponné. Ils sont ██████. Nous les avons comptés. »",
          "« Si on part, ça brûle. Nous restons. Tant que nous serons dehors, vous ne pourrez pas fermer. Qui écoute entend. »",
          "Sorn s'arrête sur le mot qui manque. Il le connaît, lui aussi. Il attend que tu le dises."
        ],
        defi:{ type:"enigme",
          texte:"Le mot manquant est un nombre. La note de Vareck, aux Archives, l'avait déjà écrit.",
          question:"« Ils sont combien ? »",
          reponses:["cinq","5","ils sont cinq"],
          indice:"« Organismes mobiles observés : … » — la note de terrain de Vareck.",
          reussite:[
            "« Cinq. » Sorn le répète, et sa voix casse sur le mot. « Ils sont cinq. Nous les avons comptés. »",
            "Il lit le message une deuxième fois, en entier, sans que tu lui demandes. Puis une troisième. Galm, qui s'est glissée dans l'embrasure de la porte sans que personne l'entende, ne dit rien.",
            "« Il a pas détalé », dit Sorn, à personne. « Il a jamais détalé. Il est sorti rester avec eux. Ils sont restés dehors exprès, pour que ça brûle pas. Et ça a jamais brûlé. » Un long silence. « Trois cents ans qu'on a honte d'un homme qui a sauvé tout le monde. »",
            "Puis, plus bas : « Ce message, il est jamais arrivé. Mangé, comme l'autre. Moi je veux qu'il parte. Une fois. Qu'il soit entendu, même par personne. »"
          ] } },

      /* ---- 5. L'émission — SÉQUENCE (ratable) : émettre EN PHASE ---- */
      { indice:"Au Perchoir : relance le message de Sorn, E. sur tout le réseau. Pour passer à travers le brouillage, il faut émettre en phase avec lui.",
        cible:{ lieu:"base" }, leurres:[ { lieu:"epave" }, { lieu:"antenne" }, { lieu:"asteroides" } ],
        image:"images/quetes/q14/5.png",
        arrivee:[
          "Le terminal accepte de réémettre. Mais il affiche aussi, en rouge, ce qui a mangé le message il y a trois siècles : BROUILLAGE PÉRIODIQUE — SOURCE : SOL, MAAR-3.",
          "Le battement. La cadence de la silène. Au Muet, tu l'as filtrée en la reproduisant. « Si tu émets à contretemps, elle te mange », dit Sorn, qui a compris avant toi. « Si tu émets avec elle… » Il n'ose pas finir. « Mets-toi dans son rythme. Qu'elle te porte au lieu de te couvrir. »"
        ],
        defi:{ type:"sequence", longueur:5, cadence:CADENCE_PERIMETRE,
          texte:["SYNCHRONISATION DE PHASE. RÉPÉTEZ LA CADENCE DU BROUILLAGE."],
          reussite:[
            "Tu tapes la cadence, et le message part dessus, comme une barque sur une vague. ÉMISSION EN COURS — TOUT LE RÉSEAU — MAAR-3 ET TRIPTOLÈME. Le relais porte la voix d'un homme mort depuis trois siècles jusqu'aux balises de la Forge, au Muet, à la station de La Braise, aux relais de surface de Silène. Partout.",
            "« Qui écoute entend », dit Sorn, les yeux fermés.",
            "Et puis, une demi-seconde, une ligne qui n'a rien à faire là, en bas de l'écran, et que tu es seul à voir parce que Sorn a les yeux fermés :"
          ] } },

      /* ---- 6. L'accusé de réception — MÉMOIRE (ratable) : l'anomalie 42-U1F ---- */
      { indice:"Au Perchoir : une ligne vient de s'afficher en bas de l'écran du relais. Elle ne restera pas.",
        cible:{ lieu:"base" }, leurres:[ { lieu:"epave" }, { lieu:"antenne" }, { lieu:"asteroides" } ],
        image:"images/quetes/q14/6.png",
        arrivee:[
          "Quelqu'un a répondu. Pas la direction. Pas une machine : les machines d'AREPO n'accusent pas réception de ce genre de message. Quelqu'un, quelque part sur le réseau, a entendu, et a voulu que l'émetteur le sache.",
          "La ligne est déjà en train de s'effacer. Tu n'auras qu'un regard."
        ],
        defi:{ type:"memoire", duree:5000,
          info:["ACCUSÉ DE RÉCEPTION — MANUEL", "ORIGINE : QUAI MAAR-3 — OPÉRATEUR : 42-U1F"],
          texte:["Une ligne d'accusé de réception s'affiche en bas de l'écran, puis s'efface."],
          question:"« Quel était le matricule de l'opérateur ? »",
          reponses:["42-u1f","42u1f","42 u1f","42-u1-f"],
          reussite:[
            "42-U1F. Un matricule du quai. Du Protocole. Quelqu'un, là-bas, sous l'anneau, a entendu Sorn, E. dire « nous restons » — et a répondu « reçu », à la main.",
            "Tu ne le dis pas à Sorn. Pas encore. Tu ne saurais pas quoi lui dire. Tu le notes dans ton carnet, en bas d'une page, et tu refermes le carnet."
          ] } },

      /* ---- 7. Le message — CHOIX (Cercles) ---- */
      { indice:"Au Perchoir, dans la salle du relais. Décide de ce que devient le message de Sorn, E.",
        cible:{ lieu:"base" }, leurres:[ { lieu:"epave" }, { lieu:"antenne" }, { lieu:"asteroides" } ],
        image:"images/quetes/q14/7.png",
        arrivee:[
          "L'émission est terminée. Le relais reprend son bourdonnement ordinaire. Sorn a rouvert les yeux ; il a l'air plus jeune, et plus fatigué, et les deux à la fois.",
          "« Ce qu'on en fait maintenant », dit-il, « c'est toi qui vois. Moi j'ai eu ce que je voulais. Il est parti. »"
        ],
        defi:{ type:"choix",
          texte:["Le message de Sorn, E. est dans la mémoire du relais. Tu peux le laisser dormir, le faire entendre, ou le garder."],
          options:[
            { texte:"Le traduire en langue de tous les jours et l'envoyer dans toutes les cités de Silène. Que chacun sache ce que les quatre-vingts ont fait.",
              cercles:{ langues:5 },
              journal:"Tu as fait traduire le message de Sorn, E. et l'as envoyé dans toutes les cités. Au Rhizome, quelqu'un l'a affiché sur la porte des serres." },
            { texte:"Le brancher en boucle sur le relais, en phase avec la cadence, pour qu'il passe sur le réseau à chaque cycle d'appel.",
              cercles:{ assembleurs:5 },
              journal:"Tu as branché le message en boucle. À chaque cycle d'appel, maintenant, il passe sur le réseau, porté par la vague." },
            { texte:"Le garder pour Sorn et Adaya seulement. Les quatre-vingts ont tenu leur secret trois siècles ; ce n'est pas à toi de le crier.",
              cercles:{ veilleurs:5 },
              journal:"Tu as gardé le message pour les deux familles. Le secret des quatre-vingts reste un secret — mais il a, enfin, des gardiens qui savent pourquoi." }
          ],
          reussite:[
            "Galm ramène Sorn à la Carcasse, puis sur Silène. Sur la passerelle, avant de monter, il se retourne vers toi.",
            "« Le bras est », dit-il. « Cinq. Au bout. Toute ma vie on m'a appris à pas y aller, sans me dire pourquoi. Maintenant je sais pourquoi. » Il a un drôle de sourire. « Et c'est pour ça qu'il faut y aller. Pas moi. Mes genoux. Toi. »",
            "« Emporte la bouture d'Adaya. Là-bas, elle devrait se réveiller. »"
          ] } }
    ],
    recompense:{ credits:1700, xp:300, pa:1, flags:{} }   // v1.01 : PA (l'émission)
  },

  /* ===========================================================
     Q15 — LE BRAS EST (v1.00). Donneur : Sorn, AU COMPTOIR (sur Silène).
     Cadrage : PASSATION « 0quatervicies ». Canon : LORE §4 (la silène
     transmet), §7 (les cinq bêtes), §10 (la bouture).
     1 souche (scène, variantes q3Souche) · 2 chasse chaud/froid (cachée) ·
     3 affût 5 jours · 4 calques · 5 pas de loup · 6 choix de la bête + nom ·
     7 serre d'Adaya (scène). Pas de PA. Cercle +10.
     ⚠ Rien d'humain au bout du bras : les 80 ont gardé le secret jusque dans
       le terrain. ⚠ Loin de la ligne, une bête « se tait » (§7).
     =========================================================== */
  {
    id:"q15",
    nom:"Le bras est",
    donneur:"Vieux Sorn",
    donneurImg:"images/quetes/vieux_sorn.png",
    intro:[
      "Sorn est derrière son établi, comme avant, les mains dans un relais éventré. Seul le casque de vol trop grand, posé sur l'étagère entre deux boîtiers, dit que ce n'était pas un rêve.",
      "« T'as la bouture ? » Tu la sors du sac. Ici, elle ne s'éteint jamais tout à fait : une lueur laiteuse qui monte et retombe, derrière le verre rafistolé. Il hoche la tête. « Bien. »",
      "« Le bras est. » Il pose un doigt sur sa vieille carte, à droite de la souche, là où il n'y a rien de dessiné. « Chez nous, on l'apprenait aux gosses avant de leur apprendre à lire : la ligne de l'est, on la laisse tranquille. Chez Adaya pareil. Dans toutes les familles. Personne savait pourquoi. »",
      "« Maintenant on sait. Ils étaient cinq, au bout. Et quatre-vingts personnes ont menti trois cents ans pour que personne aille les déranger. » Il se racle la gorge. « Et c'est toi qui vas y aller. Faut croire que c'est ça, écouter. »",
      "« Cette fois je te guide pas. Pas de balise, pas de coordonnées : personne a jamais relevé ce coin. Tu pars de la souche, et tu laisses la bouture faire. Plus elle bat vite, plus t'es près. Si elle ralentit, t'as pris le mauvais chemin. »",
      "« C'est loin. Y a pas de cité sur ce bras, à part le Rouage qui passe à côté. Prends de l'air, des Recharges, et garde un œil sur l'anneau : le Protocole patrouille partout où y a pas de mur. »",
      "Il retourne à son relais. Puis, sans lever les yeux : « Et si tu les trouves… fais pas le malin. Elles ont attendu trois siècles sans nous. Elles peuvent attendre encore un peu que tu mérites de les voir. »",
      "« Adaya dit qu'elle t'attendra à la serre. Moi aussi, d'ailleurs. » Un temps. « Ça fait jaser, au Rhizome. Un Sorn chez les Adaya. Qu'ils jasent. »"
    ],
    etapes:[

      /* ---- 1. La souche — SCÈNE (texte ET image selon le choix de Q3) ---- */
      { indice:"Le creux de la souche, là où la ligne se sépare en deux. C'est de là que part le bras est.",
        cible:{ x:700, y:1062, r:80 }, leurres:[ {x:1350,y:1150,r:80}, {x:520,y:1400,r:80} ],
        image:{ selon:"q3Souche", defaut:"relevee", valeurs:{
          tranchee:"images/quetes/q15/1_tranchee.png", relevee:"images/quetes/q15/1_relevee.png", pillee:"images/quetes/q15/1_pillee.png" } },
        arrivee:{ selon:"q3Souche", defaut:"relevee", valeurs:{
          relevee:[
            "Le creux respire, comme la première fois. Les tiges pulsent ensemble, serrées autour de la souche que tu as laissée intacte. Tes relevés d'alors sont toujours dans ton carnet ; tu n'en as plus besoin.",
            "Tu poses le bocal sur la souche. Un moment, la bouture et le massif battent ensemble, la petite lueur dans la grande. Puis la bouture change de rythme : plus vite, plus lent, plus vite encore, comme une main qui tire sur ta manche.",
            "Vers l'est. Le bras file droit vers l'horizon, et là-bas, pas une trace de pas, pas une tige cassée. Tu seras le premier depuis trois siècles."
          ],
          tranchee:[
            "Le creux est gris. Là où pulsait le massif, il ne reste que des tiges sèches, cassantes sous la semelle, et au centre la plaie nette de la souche que tu as tranchée. Rien n'a repoussé.",
            "Et pourtant, de chaque côté du creux, la ligne pulse. Le bras ouest vers l'anneau, le bras est vers l'horizon : les deux battent au même rythme, comme si rien ne leur manquait. Ce n'est pas ici que ça se décidait. Ça ne l'a jamais été.",
            "Dans ton sac, la bouture — prélevée ici, sur ce qui n'existe plus — change de rythme : plus vite, plus lent, plus vite encore, comme une main qui tire sur ta manche. Vers l'est."
          ],
          pillee:[
            "Le creux ne s'en est pas remis. Des tiges arrachées, des racines retournées, des trous là où tu as récolté ce qui se vendait. Entre les pierres, quelques massifs chétifs ont repoussé, pâles, obstinés.",
            "Mais la ligne, elle, n'a rien perdu. De part et d'autre du creux, elle pulse, droite, régulière, comme si personne ne l'avait jamais touchée.",
            "Dans ton sac, la bouture change de rythme : plus vite, plus lent, plus vite encore, comme une main qui tire sur ta manche. Vers l'est, où il n'y a pas une trace de pas."
          ] } },
        defi:{ type:"scene", bouton:"Suivre le bras est →" } },

      /* ---- 2. La chasse — CHAUD/FROID (non ratable, AUCUN repère) ---- */
      { indice:"Suis le bras est. Aucune carte, aucun repère : la bouture, seulement. Plus elle bat vite, plus tu es près.",
        cache:true, cible:{ x:2150, y:1180, r:80 },   // v1.02 : 50 → 80 (≈ 13 px au doigt sur téléphone : introuvable)
        image:"images/quetes/q15/2.png",
        arrivee:[
          "La bouture ne bat plus : elle tremble, d'une lueur continue, si vive que tu la vois à travers la toile du sac.",
          "Tu es au bout. La ligne s'arrête ici, au pied d'une barre de rochers bas, dans une cuvette que rien ne signale. Autour, des massifs de silène plus vieux et plus épais qu'à la souche, serrés comme des haies."
        ],
        defi:{ type:"chasse", bouton:"Écarter les tiges",
          texte:[ "Quelque part dans ces massifs, il y a ce que les quatre-vingts ont protégé." ],
          reussite:[
            "Tu fouilles les massifs un à un. Des tiges, des racines, de la poussière. Pas de campement, pas d'outil, pas une inscription. Les quatre-vingts n'ont rien laissé ici. Pas même leur trace.",
            "Une vague passe : la ligne s'allume sous tes pieds, court jusqu'au bout, et s'arrête contre les rochers. Rien ne lui répond.",
            "Mais dans la poussière, entre deux massifs, il y a des empreintes. Petites. Fraîches. De cinq sortes différentes. Et toutes s'éloignent de toi."
          ] } },

      /* ---- 3. L'affût — 5 JOURS de jeu différents (non ratable) ---- */
      { indice:"Au bout du bras est : reviens tenir l'affût, un jour après l'autre. Elles savent que tu es là.",
        cible:{ x:2150, y:1180, r:80 },
        image:"images/quetes/q15/3.png",
        arrivee:[
          "La cuvette est silencieuse. Les empreintes sont là, dans la poussière, et chaque fois que tu reviens, ce ne sont plus les mêmes. Elles ne sont pas parties. Elles attendent que tu partes.",
          "« Elles ont attendu trois siècles sans nous », disait Sorn."
        ],
        defi:{ type:"affut", jours:5, bouton:"Tenir l'affût",
          texte:[ "Tu t'installes contre les rochers, immobile, la bouture posée devant toi. Les vagues passent, la ligne s'allume et s'éteint. Rien d'autre ne s'allume." ],
          nuits:[
            "Première nuit d'affût. Les vagues passent, une à une. Rien. Au matin, des empreintes fraîches font le tour de ton abri, à bonne distance.",
            "Deuxième nuit. Une fois, au passage d'une vague, une lueur s'allume entre deux massifs, et s'éteint aussitôt. Tu ne bouges pas.",
            "Troisième nuit. Quelque chose s'est approché pendant que tu somnolais : il y a des empreintes à un pas de ta main. La bouture, elle, est restée allumée toute la nuit.",
            "Quatrième nuit. À chaque vague, un froissement, toujours au même endroit. On t'observe. Tu fais semblant de ne pas le savoir.",
            "Cinquième nuit. Tu ne fais plus semblant de rien. Tu attends."
          ],
          reussite:[
            "La vague arrive de l'ouest, comme toutes les autres, et court le long de la ligne jusqu'au bout.",
            "Et cette fois, au bout, quelque chose s'allume.",
            "Puis une deuxième lueur. Une troisième. Cinq, entre les massifs, à hauteur de genou, à hauteur d'épaule : des points de lumière laiteuse, la même que celle de la silène, posés sur des formes qui respirent.",
            "La vague les touche, et elles s'allument toutes ensemble. Puis la vague repart vers l'ouest, plus faible, dans l'autre sens.",
            "Tu repenses aux relevés de la sonde Ortie : une vague qui revient, plus faible. Comme si quelqu'un décrochait, au bout."
          ] } },

      /* ---- 4. Les calques — la silène TRANSMET (ratable) ---- */
      { indice:"Au bout du bras est : la vague revient plus faible. Superpose ce que tu as relevé.",
        cible:{ x:2150, y:1180, r:80 },
        image:"images/quetes/q15/4.png",
        arrivee:[
          "Les cinq lueurs se sont éteintes avec la vague. Elles se rallumeront à la prochaine : tu as le temps de comprendre.",
          "Tu ouvres ton carnet. Tout y est, noté depuis des mois : la cadence de l'appel, relevée sous l'anneau ; le battement des corolles de la ligne ; et maintenant ces cinq lueurs qui répondent.",
          "Trois signaux. Tu les as toujours pris pour trois choses différentes. Et celui des bêtes arrive après la vague, plus faible — renvoyé, comme un écho qu'on entendrait à l'envers."
        ],
        defi:{ type:"calques",
          texte:[ "Trois relevés, sur trois bandes transparentes : l'appel du quai, la lueur de la silène, les marques des bêtes." ],
          reussite:[
            "Les trois signaux n'en font plus qu'un.",
            "L'appel part du quai. La silène le porte, d'un bout à l'autre de la ligne : ce sont ça, ses vagues. Au bout, les bêtes le reçoivent et le renvoient, à l'envers. Et la silène le reporte, jusqu'au quai.",
            "Elle n'a jamais rien voulu. Elle ne pousse pas en ligne parce qu'elle choisit : elle pousse le long de ce qu'elle transporte. Un relais vivant, tendu entre deux émetteurs qui ne savent pas qu'ils se parlent.",
            "AREPO a vu une plante qui poussait droit et battait comme une horloge, et a écrit : non conforme, cause non identifiée. Les quatre-vingts, eux, étaient allés voir au bout."
          ] } },

      /* ---- 5. Le pas de loup — casse-tête au tour par tour (ratable) ---- */
      { indice:"Au bout du bras est : approche-toi d'elles sans qu'elles te voient.",
        cible:{ x:2150, y:1180, r:80 },
        image:"images/quetes/q15/5.png",
        arrivee:[
          "Maintenant tu sais quand elles regardent. À chaque vague, quand elles répondent, leurs têtes se tournent, chacune à sa façon, chacune de son côté. Entre deux vagues, les massifs de silène sont les seuls endroits où se cacher.",
          "Elles se sont rassemblées au fond de la cuvette, là où la ligne finit. Il faut aller jusqu'à elles."
        ],
        defi:{ type:"loup",
          texte:[ "Les massifs de silène te cachent. Chaque vague fait tourner leurs regards." ],
          reussite:[
            "Tu es au milieu d'elles.",
            "Aucune ne fuit.",
            "Elles sont cinq, et aucune ne ressemble aux autres. Aux articulations, sous le poil, l'écaille ou la plume, des marques s'allument et s'éteignent au rythme de la ligne. De près, tu entends ce que tu n'avais jamais entendu : à chaque vague, elles font un son. Très bas. Presque rien.",
            "Quatre-vingts personnes ont menti trois siècles pour ça. Tu comprends pourquoi."
          ],
          /* Niveau trouvé par recherche (plus court chemin : 24 coups, dont 3 attentes).
             ⚠ Toute modification : revérifier qu'il reste soluble (test BFS). */
          niveau:{ w:7, h:9, dep:{x:3,y:8}, cib:{x:3,y:1},
            obs:["1,3","1,2","3,5","2,5","5,6","4,3","6,4","0,6","4,5","1,5","2,1"],
            betes:[ {x:3,y:0,cyc:["E","S","O","S"]}, {x:1,y:1,cyc:["S","S","O","E"]}, {x:5,y:1,cyc:["S","S","O","E"]},
                    {x:0,y:3,cyc:["E","S","O","S"]}, {x:6,y:3,cyc:["S","S","O","E"]} ] } } },

      /* ---- 6. Le choix de la bête — CHOIX (Cercles, +10) puis son NOM ---- */
      { indice:"Au bout du bras est : elles se sont habituées à toi. L'une d'elles s'approche.",
        cible:{ x:2150, y:1180, r:80 },
        image:"images/quetes/q15/6.png",
        arrivee:[
          "Une vague passe. Les cinq s'allument, et l'une d'elles fait un pas vers toi. Puis une autre. Puis toutes, chacune à sa façon, curieuses de ce qu'il y a dans ton sac : la bouture, qui bat au même rythme qu'elles.",
          "Tu ne peux pas les emmener toutes. Tu ne sais même pas si tu as le droit d'en emmener une. « Ne rien emporter », disait l'ordre d'AREPO.",
          "Mais les quatre-vingts ne sont pas restés pour qu'elles se cachent jusqu'à la fin du monde."
        ],
        defi:{ type:"choix",
          texte:[ "L'une d'elles te suivra, si tu la choisis. Laquelle ?" ],
          nommer:"Elle reste près de toi, à la lisière de la lueur. Les quatre autres se sont déjà fondues dans les massifs. Il lui faut un nom : si les quatre-vingts lui en avaient donné un, il s'est perdu avec le reste.",
          options:[
            { bete:"chaume", cercles:{ racines:10 },
              texte:"Le Chaume : un lièvre aux oreilles comme des feuilles, qui n'a pas bougé d'un pouce depuis ton arrivée. Il tient sa place, et te regarde comme on regarde quelqu'un qui arrive chez soi.",
              journal:"Le Chaume a quitté la ligne à ta suite, sans se presser, comme on rentre chez soi." },
            { bete:"braisillon", cercles:{ eclats:10 },
              texte:"Le Braisillon : un lézard turquoise et or qui fouille les rochers et en ressort avec des éclats brillants, qu'il laisse tomber à tes pieds. Pour lui, rien de ce qui est cassé n'est perdu.",
              journal:"Le Braisillon a quitté la ligne à ta suite, un éclat de roche entre les dents." },
            { bete:"sentinelle", cercles:{ veilleurs:10 },
              texte:"La Sentinelle : un grand échassier bleu et violet, perché sur un rocher, qui n'a rien manqué de tes cinq nuits d'affût. Elle regarde, elle retient, elle n'intervient pas.",
              journal:"La Sentinelle a quitté la ligne à ta suite, et se retourne de temps en temps vers le bout du bras, comme pour s'en souvenir." },
            { bete:"goupille", cercles:{ assembleurs:10 },
              texte:"La Goupille : un renard blanc, noir et jaune, qui a déjà ouvert ton sac, sorti ton carnet, et s'acharne sur le couvercle du bocal de la bouture pour voir comment il tient.",
              journal:"La Goupille a quitté la ligne à ta suite, le museau dans ton sac." },
            { bete:"iris", cercles:{ langues:10 },
              texte:"L'Iris : un félin violet à la queue de lames souples, qui répond à chaque vague par un son bas, et qui, quand tu parles, se tait pour t'écouter.",
              journal:"L'Iris a quitté la ligne à ta suite, et répond à ta voix comme elle répondait aux vagues." }
          ],
          reussite:[
            "Tu reprends le bras est dans l'autre sens. À mesure que tu t'éloignes du bout, les marques de ta bête pâlissent, puis s'éteignent. Loin de la ligne, elle se tait.",
            "Elle ne s'arrête pas pour autant. Elle te suit.",
            "Derrière toi, une vague arrive au bout du bras, et quatre lueurs lui répondent."
          ] } },

      /* ---- 7. La serre d'Adaya — SCÈNE ---- */
      { indice:"Rentre à la serre d'Adaya, au Rhizome. Sorn y est. Ils t'attendent tous les deux.",
        cible:{ x:1250, y:770, r:90 },
        image:"images/quetes/q15/7.png",
        arrivee:[
          "La serre est ouverte. Adaya est à sa paillasse, Sorn assis sur un seau retourné entre deux rangs, le casque de vol sur les genoux. Ils se disputaient à voix basse. Ils s'arrêtent net en te voyant.",
          "En voyant ce qui te suit.",
          "Personne ne dit rien. Adaya retire ses lunettes, lentement. Sorn se lève, et ses genoux craquent.",
          "Ta bête fait le tour de la serre : les bocaux, les rangs, le petit relais que Sorn a vissé au montant de la porte. Quand elle passe devant la bouture, une lueur remonte sous ses marques, un instant, puis retombe.",
          "« Ils sont cinq », dit Sorn. « Nous les avons comptés. » Il a la voix de quelqu'un qui récite. « J'ai cru toute ma vie que c'était une façon de parler. »",
          "Adaya s'accroupit. La bête s'approche et renifle ses mains, longtemps. « Mon aïeule a répondu non, à la radio », dit-elle sans lever les yeux. « Chez nous, on disait qu'elle avait perdu la tête. » Un rire bref. « Elle avait pas perdu la tête. Elle savait pour qui elle restait. »",
          "Sorn regarde la bête comme on regarde une lettre qu'on n'osait plus attendre. « Défectueuse », dit-il. « Recommandation : fermeture. Ils auraient dû la voir, ceux-là. Savoir ce qu'ils allaient brûler. »",
          "« Ils sont partis, Sorn. Depuis trois siècles. »",
          "« Les sondes parlent encore à quelqu'un, là-haut. » Il ne dit rien de plus. Il n'en a pas besoin.",
          "Tu sors la bouture du sac et tu la lui tends. Adaya la prend, fait tourner le bocal dans la lumière de la lampe. « Elle t'a ramené », dit-elle. « C'est tout ce que je lui demandais. » Elle dévisse le couvercle rafistolé et plante la tige dans un pot, au bout d'un rang, entre deux plantes qui ne sont pas d'ici non plus.",
          "Adaya se relève en s'essuyant les mains. « Pas aujourd'hui. Aujourd'hui, il y a une bête dans ma serre, et j'ai du thé. » Elle te désigne une caisse. « Assieds-toi, petit. Et présente-nous. »"
        ],
        defi:{ type:"scene", bouton:"Rendre la bouture et terminer", rendre:"bouture" } }
    ],
    recompense:{ credits:1800, xp:320, pa:1, flags:{} }   // v1.01 : PA (la bête)
  }

  // Quête finale de la carte Silène : Q5 accorde le permis de vaisseau + ouvre l'espace (flag espace1).
  // La DERNIÈRE portera flags:{ permisVaisseau:true } (+ un flag type espace1:true
  // pour révéler l'onglet de la 1re carte spatiale, quand elle existera).
];
