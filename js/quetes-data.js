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
          "L'anneau du Protocole occupe tout l'horizon, violet et silencieux. Aucune silhouette sur la crête, aucun mouvement — et c'est plus inquiétant que s'il y en avait. On raconte dans toutes les cités que les gens qu'on emmène d'ici ne reviennent pas.",
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
            /* v1.28 — ÉCRITURE PHONÉTIQUE (glyphes.js) : `sons` = les morceaux
               de son, dessinés en SVG. Q4 est la PIERRE DE ROSETTE : ne pas
               changer ces sons sans changer Q9 étape 4 et le LORE. */
            { picto:"▣", glyphe:"ΛΞ", sons:["PERI","METRE"],               sens:"Périmètre" },
            { picto:"⌁", glyphe:"ΘΠΩ", sons:["ALI","MENT","ATION"],        sens:"Alimentation" },
            { picto:"⚑", glyphe:"ΨΨΠ", sons:["POINT","RASSEMBLE","MENT"],  sens:"Point de rassemblement" },
            { picto:"◷", glyphe:"ΔΣΦΦ", sons:["DE","PART","PRO","GRAMME"], sens:"Départ programmé" },
            { picto:"✚", glyphe:"ΠΛΧ", sons:["POSTE","MEDI","CAL"],        sens:"Poste médical" },
            { picto:"⊘", glyphe:"ΔΣΧ", sons:["AC","CES","RESTREINT"],      sens:"Accès restreint" }
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
          "En bas, le quai s'illumine d'une lumière ambrée sur toute sa longueur. Puis une seconde. Puis une troisième, et la cadence s'installe : celle que tu as reproduite sur les corolles, à la fleur près.",
          "APPEL D'EMBARQUEMENT — PERSONNEL NON ÉVACUÉ — PRÉSENTEZ-VOUS AU POINT DE RASSEMBLEMENT.",
          "Ils sont treize. Ils se rangent le long de la ligne jaune, à intervalles réguliers, et ils attendent. Personne ne vient. Ils attendent quand même, le temps qu'il faut, parce que c'est le temps prévu.",
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
            "Elle t'emmènera là-haut. Elle ne t'y gardera pas. D'ici là, il faudra t'en payer une vraie — ou apprendre à en construire une. J'ai ouî-dire qu'il y a un ferailleur dans une carcasse en haut. Tu devrais y aller pour réparer ton engin."
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
            "Elle regarde la plaque, puis la Carcasse autour d'elle, comme si elle la voyait pour la première fois. « C'est pas une marque de boulons. C'est une marque d'appartenance. »",
            "Sous le carré, une ligne plus petite, en ancien. Tu ne la lis pas. Mais un mot revient deux fois, que Sorn t'a appris à reconnaître : SATOR. Et le long de la paroi du fond, derrière des panneaux sanglés, un faisceau de câbles part vers une jonction de relais."
          ] } },

      /* ---- 3. La jonction — ATTENTE (non ratable) : Sorn déchiffre ---- */
      { indice:"Au fond du compartiment de la Carcasse, la jonction de relais. Appelle Sorn — ses relais portent jusqu'ici, c'est leur métier.",
        cible:{ lieu:"epave" }, leurres:[ { lieu:"base" }, { lieu:"asteroides" }, { lieu:"antenne" } ],
        image:"images/quetes/q6/3.png",
        arrivee:[
          "La jonction est vieille, et elle a été réparée. Pas remplacée : réparée, à la main. Un manchon de fil de cuivre serré en torsade, trois tours, puis un nœud plat, puis trois tours dans l'autre sens. Une étiquette de service est fixée dessus, couverte de l'ancien language.",
          "Tu appelles Sorn. Grésillement, long. Puis sa voix, lointaine, comme au fond d'un puits : « …Gamin ? T'es où, là ? T'as une voix de boîte de conserve. »",
          "Tu lui décris le manchon. Trois tours, le nœud, trois tours à l'envers.",
          "Le silence dure si longtemps que tu crois la liaison coupée. Puis : « Lis-moi l'étiquette. Lettre par lettre. Je te la traduis. Ça va me prendre un moment, c'est de l'ancien de service, plein d'abréviations. Va faire un tour, je te rappelle. »"
        ],
        defi:{ type:"attente", duree:2*3600*1000,
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
          "« Elle s'allume ? » La voix de Sorn a un raté. « Là-haut ? Adaya a dit qu'elle réagissait au signal. Alors y a du signal, ici. Le même qu'en bas. » Un silence. « Bon. Le sas. Il a un cadenas à glyphes, forcément. Même petit jeu que le poste, mais en plus retors : quatre glyphes, cette fois. »"
        ],
        defi:{ type:"cadenas", longueur:4, symboles:["▣","⌁","⚑","⊘"], essais:7,   /* v1.36e : plus dur que Q2 (était 3 logements, 8 essais) */
          texte:["Quatre logements, les quatre glyphes que tu connais maintenant — et un même glyphe peut revenir. Le sas te dira, à chaque tentative, combien sont bien placés."],
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
          allume:220, pas:360,   /* v1.36e : même motif qu'avant (normal), mais le parasite bat plus vite (défaut 380 / 620 ms) */
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
        defi:{ type:"attente", duree:150*60*1000,
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
        defi:{ type:"traversee", colonnes:6, lignes:7, lave:13, plaques:3,
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
      "Quand tu as fini, il reste si longtemps silencieux que tu vérifies la liaison. Puis : « \"Le secteur\". Au Muet, il manquait des mots devant. » Sa voix est plate, alors qu'il lit la ligne de son aïeul. « Je veux savoir lequel. »",
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
        defi:{ type:"labyrinthe", colonnes:7, lignes:8,
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
        defi:{ type:"piratage", manches:4, vitesse:1800,
          texte:["Le lecteur de la porte a un canal de maintenance, mal protégé. Il faut le saisir quatre fois de suite."],
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
        defi:{ type:"attente", duree:3*3600*1000,
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
            /* v1.28 — chaque étape contient au moins un son appris en Q4 :
               ATION (×3 avec le leurre « Irrigation »), POINT et MENT, DÉ,
               Alimentation entier, PÉRI·MÈTRE. Évacuation / Confirmation ne se
               distinguent que par leur picto (▲ alerte, ✓ coche — la coche
               FINE : ✔ s'affiche en emoji couleur sur mobile). */
            { picto:"▲", glyphe:"ΨΠΩ", sons:["EVA","CU","ATION"],                       sens:"Évacuation" },
            { picto:"▦", glyphe:"ΨΞΘΠ", sons:["POINT","EM","BARQUE","MENT"],            sens:"Point d'embarquement" },
            { picto:"✓", glyphe:"ΩΦΩ", sons:["CON","FIRM","ATION"],                     sens:"Confirmation" },
            { picto:"◑", glyphe:"ΔΔ", sons:["DE","LAI"],                                sens:"Délai" },   /* ⚠ pas ◷ : en Q4, ◷ = « Départ programmé » */
            { picto:"⌁", glyphe:"ΘΠΩ", sons:["ALI","MENT","ATION"],                     sens:"Alimentation" },
            { picto:"✕", glyphe:"ΞΣΘΛΞ", sons:["FER","ME","TURE","PERI","METRE"],        sens:"Fermeture du périmètre" }
          ],
          distracteurs:["Irrigation","Récolte","Quarantaine"],
          reussite:[
            "La procédure se lit d'un trait, maintenant : ÉVACUATION → POINT D'EMBARQUEMENT → CONFIRMATION → DÉLAI → ALIMENTATION → FERMETURE DU PÉRIMÈTRE.",
            "« Pas de fermeture sans confirmation », dit Sorn, lentement, comme on lit une règle au tableau. « Et pas de confirmation sans l'embarquement. » Il répète la dernière flèche pour lui-même. « Fermeture. »",
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
              cercles:{ assembleurs:5 },
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
        defi:{ type:"attente", duree:210*60*1000,
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
        defi:{ type:"traversee", colonnes:6, lignes:8, lave:15, plaques:3, icone:"💥",   // v1.87g : textes propres (débris)
          brulant:"Un débris en rotation t'accroche de plein fouet : une plaque de blindage s'arrache.",
          pariForce:"Un débris t'accroche — mais rien sur ton capteur ne permettait de le voir venir : tu l'esquives d'un coup de rein, et ta plaque tient.",
          echec:"Un dernier débris arrache ta dernière plaque. Tu recules hors de l'anneau — nouvelle tentative dans 8 h.",
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
        defi:{ type:"labyrinthe", colonnes:7, lignes:8,
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
        defi:{ type:"attente", duree:4*3600*1000,
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
      { indice:"À La Carcasse : Galm doit doubler ta combinaison contre le froid du Suaire. Apporte deux câblages pour les résistances, deux biofils renforcés pour l'isolant et une cellule d'énergie pour les alimenter.",
        cible:{ lieu:"epave" }, leurres:[ { lieu:"base" }, { lieu:"asteroides" }, { lieu:"antenne" } ],
        image:"images/quetes/q12/1.png",
        arrivee:[
          "Galm a étalé ta combinaison sur l'établi comme un patient sur une table d'opération. « Là-bas, le froid te bouffe les doigts en dix minutes. Faut des résistances dans les gants, dans les bottes, dans le col. Et de l'isolant partout. »",
          "« Et ton vaisseau », ajoute-t-elle, « c'est toujours le seul endroit où tu respires. Froid ou chaud, ça change rien : emporte des recharges. »"
        ],
        defi:{ type:"livraison",
          objets:{ fab_cablage:2, fab_biofil_renforce:2, fab_cellule_d_energie:1 },   // v1.54 : objets de plus haut niveau (demande de l'autrice)
          texte:["Deux câblages pour les résistances chauffantes, deux biofils renforcés pour doubler l'isolant, une cellule d'énergie pour tout alimenter."],
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
        defi:{ type:"traversee", colonnes:7, lignes:8, lave:17, plaques:3, icone:"🕳",   // v1.87g : textes propres (ponts creux)
          brulant:"Le pont de neige s'effondre sous toi ; ton harnais te rattrape, mais une plaque y reste.",
          pariForce:"Le pont de neige s'effondre — mais rien ne permettait de le deviner : tu t'y attendais, et tu te rattrapes au bord. Ta plaque tient.",
          echec:"Le dernier pont cède, et ta dernière plaque avec. Tu remontes, les bras tremblants — nouvelle tentative dans 8 h.",
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
          "Tu déplies la foreuse thermique que Galm t'a glissée dans le sac « au cas où ». Tu ne t'atendais pas à la taille qu'elle ferait en la dépliant mais tu ne cherches pas plus loin. La foreuse mord la glace dans un nuage de vapeur, lentement, trop lentement.",
          "Trois mètres de glace, ça prend du temps. Tu peux remonter à ton vaisseau respirer, et revenir. La foreuse travaille seule."
        ],
        defi:{ type:"attente", duree:5*3600*1000,
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
        defi:{ type:"labyrinthe", colonnes:8, lignes:9,
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
        defi:{ type:"memoire", duree:8000   /* v1.19 : 6 → 8 s + bouton « Afficher » (retour testeur) */,
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
        defi:{ type:"attente", duree:6*3600*1000,
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
          /* ⚠ v1.29 — L'ORDRE SE LIT EN ANCIEN. Avant, la consigne renvoyait à
             la procédure de La Braise alors que les fragments ne la suivaient
             pas (le délai en tête, « radier » et « partir » absents) : le
             joueur qui obéissait échouait. Chaque fragment porte désormais, en
             glyphes, le nom de SON étape à La Braise (Q9E4) — sans l'Alimentation,
             que la réponse ne mentionne pas. L'en-tête reste sans glyphe. */
          texte:["Six fragments de la réponse d'AREPO au quai de MAAR-3. Chacun porte, en ancien, le nom de l'étape de la procédure de La Braise à laquelle il répond. Remets-les dans l'ordre de cette procédure."],
          consigne:"D'abord l'en-tête de la réponse, puis les étapes, dans l'ordre du schéma de La Braise. Lis les glyphes.",
          elements:[
            "DIRECTION → QUAI MAAR-3. OBJET : PERSONNEL RÉFRACTAIRE (80). DEMANDE DE DÉLAI : REJETÉE.",
            { sons:["EVA","CU","ATION"],               texte:"PERSONNEL RÉFRACTAIRE : RADIER. IL NE COMPTE PLUS AU MANIFESTE." },
            { sons:["POINT","EM","BARQUE","MENT"],     texte:"EMBARQUER LE RESTE DU PERSONNEL." },
            { sons:["CON","FIRM","ATION"],             texte:"CONFIRMER : PERSONNEL EMBARQUÉ." },
            { sons:["DE","LAI"],                       texte:"PARTIR À L'ARRIVÉE DU VAISSEAU." },
            { sons:["FER","ME","TURE","PERI","METRE"], texte:"FERMER LE SECTEUR." }
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
        defi:{ type:"attente", duree:8*3600*1000,
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
        defi:{ type:"memoire", duree:7000   /* v1.19 : 5 → 7 s + bouton « Afficher » */,
          info:["ACCUSÉ DE RÉCEPTION — MANUEL", "ORIGINE : QUAI MAAR-3 — OPÉRATEUR : 42-U1F"],
          texte:["Une ligne d'accusé de réception s'affiche en bas de l'écran, puis s'efface."],
          question:"« Quel était le matricule de l'opérateur ? »",
          reponses:["42-u1f","42u1f","42 u1f","42-u1-f"],
          reussite:[
            "42-U1F. Un matricule du quai. Du Protocole. Quelqu'un, là-bas, sous l'anneau, vient d'entendre Sorn, E. dire « nous restons » — l'émission que tu as relancée — et a répondu « reçu », à la main.",
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
      { indice:"Le creux de la souche, au milieu de la ligne : d'un côté le bras qui va à l'anneau, de l'autre le bras est.",   // v1.87b : la ligne ne se sépare pas (LORE §4)
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
        /* v1.34g — une bannière par bête choisie à l'étape 6 (etat.bete.espece).
           Sans bête connue (profil ancien, lecture en échec) : l'image commune. */
        image:{ selon:"bete.espece", defaut:"aucune", valeurs:{
          chaume:"images/quetes/q15/7_chaume.png", braisillon:"images/quetes/q15/7_braisillon.png",
          sentinelle:"images/quetes/q15/7_sentinelle.png", goupille:"images/quetes/q15/7_goupille.png",
          iris:"images/quetes/q15/7_iris.png", aucune:"images/quetes/q15/7.png" } },
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
  },

  /* ===========================================================
     v1.85 — LOT 1 DE L'ARC Q16 → Q30 (cadrage K1 → K39, LORE v5 §11,
     CADRAGE_Q16_Q30_DECISIONS.md, DOSSIER_LOT1_Q16_Q20.md).
     Q16 → Q19 : remonter le signal des sondes jusqu'au Bureau des Cultures ;
     trois sources (Chardon, La Cassée, le Perchoir), puis le saut préparé.
     Q20 : la Gorge, le détournement, Ancolie, 42-U1F.
     Épreuves nouvelles : quetes-jeux.js (ronde, nœud, crevasse, impossible, saut).
     =========================================================== */

  /* ---------------- Q16 — Celle qui ignore (texte validé le 17/10 ; réécrit le 18/10, v1.87b) ----------------
     ⚠ v1.87b — retour de l'autrice : textes « robotiques et saccadés ». Réécriture du
     TEXTE seul (épreuves, cibles, choix, ordre des options : inchangés). Règles :
     narration et paroles mêlées en vrais paragraphes, peu de « dit X », au plus un
     « Un temps » par quête, une seule réplique qui « tombe » par scène, Sorn gouailleur
     comme en Q1. Le joueur ne parle toujours pas. */
  {
    id:"q16",
    nom:"Celle qui ignore",
    donneur:"Vieux Sorn",
    donneurImg:"images/quetes/vieux_sorn.png",
    intro:[
      "Derrière l'établi de Sorn, personne. Un relais éventré attend sur le plan de travail, le fer à souder encore tiède à côté, et sous une vis on a coincé un bout de carton plié en deux. Dessus, l'écriture penchée de Sorn, qui appuie si fort qu'il a troué le carton par endroits : « Suis à la serre. Rapplique. Elle veut pas que je le fasse sans toi. — S. »",
      "Juste en dessous, d'une écriture plus petite et beaucoup plus droite, quelqu'un a ajouté : « Je ne veux pas qu'il le fasse du tout. Dépêche-toi, petit. — A. »"
    ],
    etapes:[

      /* ---- 0. La serre — SCÈNE : la dispute reprend ---- */
      { indice:"La serre d'Adaya, au Rhizome. Sorn y est. Ils t'attendent tous les deux.",
        cible:{ x:1250, y:770, r:90 },
        image:"images/quetes/q16/1.png",
        arrivee:[
          "La serre sent le thé froid et la terre mouillée. Ta bête file droit au bout du rang et se couche contre la bouture comme si elle rentrait chez elle ; ses marques se mettent à battre au rythme de la lueur du bocal. Sorn et Adaya ne t'ont pas entendu entrer. Ils se disputent, et pour une fois, ils ne prennent pas la peine de baisser la voix.",
          "« Trois cents ans qu'elles émettent, ces sondes », lance Sorn en tapant du plat de la main sur la paillasse. « <i>Émission maintenue</i>, que ça disait sur l'Ortie. Maintenue pour qui, hein ? S'il y a quelqu'un qui lit, là-haut, il sait ce qu'il y a au bout du bras. Il le sait depuis le début. »",
          "Adaya repose sa tasse, doucement, ce qui chez elle est plus inquiétant qu'un cri. « Et s'il lit, il sait aussi qu'on est encore là. <i>Fermeture planifiée, en attente de confirmation</i> : tu l'as entendu comme moi. Il leur manque une case, Sorn, une seule, et toi tu veux aller leur rappeler qu'on existe ? »",
          "Sorn ouvre la bouche, la referme, et finit par grogner qu'il veut juste savoir qui écoute, rien de plus. Adaya le regarde longtemps, puis se tourne vers toi, comme si c'était toi qu'il fallait convaincre. « Savoir, d'accord. Écouter, d'accord. Mais personne ne répond. Tu m'entends, petit ? Personne. »",
          "Sorn hoche la tête à contrecœur et décroche du montant de la porte le casque de radio qu'il a bricolé sur son petit relais. « Chardon. La sonde du nord, celle qui fait semblant de pas nous voir depuis toujours. L'Ortie est morte au Gravier, elle dira plus rien, mais celle-là émet encore. » Il te colle le casque dans les mains. « Va voir à qui elle cause. Et toi, tu dis rien. Rien du tout, t'as compris ? »"
        ],
        defi:{ type:"scene", bouton:"Prendre le casque et monter →" } },

      /* ---- 1. L'approche — RONDE (ratable) ---- */
      { indice:"Au nord de Triptolème, une sonde d'AREPO dérive, antennes tournées vers Silène. C'est Chardon. Approche-toi.",
        cible:{ lieu:"satellite2" }, leurres:[ { lieu:"satellite1" }, { lieu:"cailloux2" }, { lieu:"antenne" } ],
        image:"images/quetes/q16/2.png",
        arrivee:[
          "De près, Chardon est bien plus grande que l'Ortie, et elle est intacte : un long tronc de métal hérissé d'antennes, qui tourne sur lui-même avec la lenteur d'une chose qui n'a jamais été pressée. Sur son flanc, une plaque gravée du carré annonce SONDE CHARDON — RELEVÉ DES CULTURES — SECTEUR MAAR-3. Ses antennes balaient l'espace une à une, au rythme de la rotation, et sous chacune dort un bras replié. Tu as encore en tête celui de l'Ortie, et la façon dont il s'était déplié.",
          "Dans le casque, la voix de Sorn grésille, plus basse que d'habitude, comme s'il avait peur qu'elle l'entende : « Elle regarde Silène, pas toi. Tant que t'es pas dans son axe, t'existes pas. Alors tu la regardes tourner, tu comptes, et tu passes par où elle regardera pas. »"
        ],
        defi:{ type:"ronde", nom:"Antenne", nb:2, observe:9, avance:3,   // v1.88c : deux antennes (retour de l'autrice : trois, c'était trop dur)
          texte:[ "Deux antennes qui tournent, chacune sur son circuit. Tu les regardes faire, et tu comptes." ],
          consigne:"Observe la rotation des antennes, puis devine où sera chacune trois pas plus tard : c'est l'angle mort, et c'est là que tu t'arrimes.",
          echec:"Une antenne te balaie de plein fouet, et le bras en dessous commence à se déplier ; tu décroches juste à temps, le cœur dans la gorge. Nouvelle tentative dans 8 h.",
          reussite:[
            "Tu poses tes patins sur son flanc, juste sous la plaque, et tu attends, crispé. Rien. Elle continue de tourner, de regarder Silène, de compter ce qu'elle compte depuis trois siècles. Elle ne t'a pas vu ; elle ne voit jamais personne."
          ] } },

      /* ---- 2. Le panneau de service — CADENAS (ratable) ---- */
      { indice:"Contre la plaque de Chardon, le panneau de service. Il est verrouillé.",
        cible:{ lieu:"satellite2" }, leurres:[ { lieu:"satellite1" }, { lieu:"cailloux2" } ],
        image:"images/quetes/q16/3.png",
        arrivee:[
          "Contre la plaque, le panneau de service est fermé par une serrure à quatre logements. C'est la même qu'au quai, en plus grand, avec les mêmes pictogrammes : le périmètre, l'alimentation, le rassemblement, l'accès restreint. Trois siècles que personne ne l'a ouverte, et elle n'a pourtant rien oublié de sa combinaison."
        ],
        defi:{ type:"cadenas", longueur:4, symboles:["▣","⌁","⚑","⊘"], essais:7,
          texte:["Quatre logements, quatre pictogrammes. La serrure dit combien sont à la bonne place, et combien sont seulement dans la combinaison."],
          reussite:[
            "Le panneau cède avec un soupir de joint sec. Derrière, il y a une console minuscule, éteinte, et le voyant d'un canal de maintenance qui clignote doucement, patiemment, comme quelqu'un qui attend à un arrêt où plus rien ne passe depuis longtemps."
          ] } },

      /* ---- 3. Celle qui attend — PIRATAGE (ratable) ---- */
      { indice:"Dans le panneau de service de Chardon, son canal de maintenance. Elle ne parle qu'à son destinataire.",
        cible:{ lieu:"satellite2" }, leurres:[ { lieu:"satellite1" }, { lieu:"cailloux2" } ],
        image:"images/quetes/q16/4.png",
        arrivee:[
          "La console s'allume dès que tu l'effleures. Une seule ligne en ancien, que tu lis maintenant sans l'aide de personne : DEMANDE — CONFIRMATION. Elle veut savoir qui tu es. Elle attend cette réponse depuis 109 573 nuits, et elle a l'air prête à l'attendre encore autant.",
          "« On avait dit qu'on répondait pas », souffle Sorn dans le casque. Tu ne dis rien. Tu bascules l'écran de la console sur la retransmission de ton casque, pour qu'ils le voient eux aussi, et tu poses le doigt sur la ligne du bas : CANAL DE MAINTENANCE — PORTÉE : COQUE.",
          "Sorn la lit à mi-voix en détachant les mots, puis il comprend d'un coup et se met à parler plus vite. « Portée coque… Mais oui ! Ce canal-là, c'est juste pour la maintenance. Rien de ce qu'on lui dira sortira de sa carcasse : aucune chance qu'ils nous repèrent. » Il y a un long silence plein de grésillements, puis la voix d'Adaya, plus loin du micro, presque à regret : « … Alors vas-y, petit. »"
        ],
        defi:{ type:"piratage", manches:4, vitesse:1700,
          texte:["Le canal de maintenance accepte une identité si on la lui donne au bon moment. Saisis-le quatre fois de suite."],
          reussite:[
            "La console se tait une seconde, puis affiche CONFIRMATION REÇUE, et Chardon, pour la première fois depuis trois siècles, se met à parler à quelqu'un. Tu ne sais pas pour qui elle te prend. Tu préfères ne pas le savoir."
          ] } },

      /* ---- 4. Ce qu'elle mesure — ATTENTE (4 h) ---- */
      { indice:"Chardon vide sa mémoire dans la tienne. Laisse la copie se faire.",
        cible:{ lieu:"satellite2" }, leurres:[ { lieu:"satellite1" } ],
        image:"images/quetes/q16/5.png",
        arrivee:[
          "RELEVÉ DES CULTURES — SECTEUR MAAR-3. Les nuits défilent par milliers sur l'écran, plus vite que tu ne peux les lire, et chacune dit la même chose : la ligne, ses deux bras, la souche, les vagues. La copie va prendre du temps. Chardon n'a jamais été pressée, et elle ne va pas commencer pour toi."
        ],
        defi:{ type:"attente", duree:4*3600*1000,
          texte:["La copie avance, nuit après nuit."],
          reussite:[
            "La dernière nuit copiée est celle d'hier. Tout en bas du relevé, il y a une rubrique que l'Ortie n'avait pas, ou qu'elle n'a pas eu le temps d'écrire avant de s'éteindre : ORGANISMES MOBILES — BRAS EST. En face, un chiffre. Il a été de cinq pendant trois cents ans. Depuis quelques nuits, il est de quatre.",
            "Tu penses à ta bête, couchée contre la bouture au fond d'une serre, et dans le casque personne ne dit rien pendant un long moment. C'est Sorn qui craque le premier, tout bas : « Elle l'a vue partir. Elle a compté. » Adaya lui répond sur le même ton, comme on constate une chose qu'on savait déjà : « Elle compte, et personne ne lit. » Sorn marmonne encore qu'ils auraient dû la voir, ceux d'en haut, et cette fois personne ne lui répond."
          ] } },

      /* ---- 5. L'en-tête — GLYPHES (ratable) : deux sons nouveaux, DES et TIN ---- */
      { indice:"Dans la mémoire de Chardon : l'en-tête de son émission, en ancien. Lis-le.",
        cible:{ lieu:"satellite2" }, leurres:[ { lieu:"satellite1" } ],
        image:"images/quetes/q16/6.png",
        arrivee:[
          "Avant chaque relevé revient la même tête de page : quatre lignes en ancien, chacune précédée de son pictogramme, comme sur les panneaux du quai. Tu connais la plupart des sons, pas tous. « Lis-moi ça », fait Sorn, « et doucement, hein. Je veux pas en perdre un bout. »"
        ],
        defi:{ type:"glyphes",
          texte:["Quatre lignes d'en-tête, quatre pictogrammes. Rends à chacune son sens."],
          consigne:"Associe chaque ligne à sa signification. Les sons que tu ne connais pas se devinent par le reste.",
          paires:[
            /* ⚠ LORE §11 bis : DES et TIN sont NOUVEAUX (glyphes.js). « Destination »
               contient ATION, déjà connu. Ne jamais les réattribuer. */
            { picto:"✓", sons:["DE","MANDE","CON","FIRM","ATION"], sens:"Demande de confirmation" },
            { picto:"📡", sons:["RE","LAI"],                       sens:"Relais" },
            { picto:"❄", sons:["CON","SERV","ATION"],               sens:"Conservation" },
            { picto:"➹", sons:["DES","TIN","ATION"],                sens:"Destination" }
          ],
          distracteurs:["Quarantaine","Expédition","Réfectoire"],
          reussite:[
            "Demande de confirmation. Relais. Conservation. Et la dernière, DES·TIN·ATION : deux sons que tu n'avais jamais vus, que tu as devinés par le reste, et tu sais que tu as raison sans pouvoir dire comment. L'Ortie disait « Bureau des Cultures ». Chardon, elle, dit <b>où</b> il est : après <i>Destination</i>, il n'y a pas de nom mais un code, quatre glyphes que tu lis sans peine et qui ne veulent rien dire. TURE — PART — LAI — ME.",
            "« Ça veut rien dire », lâche Sorn, déçu comme un gamin. Adaya prend son temps avant de lui répondre : « Ça veut dire quelque chose à quelqu'un. Pas à nous, c'est tout. »",
            "Tu fouilles la mémoire de Chardon jusqu'au bout. Le code n'apparaît nulle part ailleurs, ni sur l'Ortie ni dans rien de ce que tu as lu depuis le début : une adresse qui ne mène à aucun endroit connu."
          ] } },

      /* ---- 6. À qui le confier — CHOIX de Cercle ---- */
      { indice:"Rentre à la serre d'Adaya, au Rhizome. Ils t'attendent.",
        cible:{ x:1250, y:770, r:90 },
        image:"images/quetes/q16/7.png",
        arrivee:[
          "Adaya a recopié le code à la craie sur le montant de la porte, juste sous le petit relais de Sorn. Elle l'a effacé du revers de la manche, puis recopié, et on voit encore la trace des deux essais l'un sous l'autre. Ta bête n'a pas quitté la bouture.",
          "Sorn, lui, tourne autour de la paillasse comme autour d'un moteur qui refuse de démarrer, jusqu'à ce qu'Adaya le coupe dans son élan : « Bon. Qu'est-ce qu'on en fait, de ce code ? »"
        ],
        defi:{ type:"choix",
          texte:["Le code de Chardon est dans ta mémoire. À qui le confier ?"],
          options:[
            { texte:"Le donner à Sorn. Il écoute depuis toujours ; c'est à lui de savoir qui est au bout.",
              cercles:{ veilleurs:5 },
              journal:"Tu as donné le code de Chardon à Sorn. Il l'a gravé à l'intérieur de son casque de vol, là où lui seul le verra." },
            { texte:"Le donner à Adaya. Tant que Silène est sur leur liste, c'est elle qui décide de ce qui sort de cette serre.",
              cercles:{ racines:5 },
              journal:"Tu as confié le code à Adaya. Elle l'a enfermé dans un bocal, au bout du rang, à côté de la bouture, et elle a revissé le couvercle deux fois." },
            { texte:"Le garder, et le démonter. Quatre sons, ça s'assemble forcément avec quelque chose.",
              cercles:{ assembleurs:5 },
              journal:"Tu as gardé le code pour toi. La nuit, tu retournes ces quatre sons dans tous les sens, et tu as toujours la même impression : il manque des pièces." }
          ],
          reussite:[
            "« Une adresse qui mène nulle part », marmonne Sorn en faisant le tour de la paillasse pour la troisième fois, « ou alors quelque part qu'on connaît pas, ce qui revient au même. » Adaya ne répond pas tout de suite. Elle frotte la craie restée sur ses doigts, longuement, puis elle lâche, sans le regarder : « Galm a vu La Cassée. C'est un port, là-haut. Et un port, ça sait toujours où il envoie les gens. »",
            "Sorn s'arrête net. « Parce que maintenant tu veux savoir, toi ? » Elle reprend sa tasse, froide depuis longtemps, et la repose sans y avoir bu. « Je veux savoir ce qu'on risque. C'est pas la même chose, et tu le sais très bien. »",
            "Quand tu ressors, ta bête se déplie de sous le rang et trotte derrière toi, comme si elle avait compris que la discussion était finie."
          ] } }
    ],
    recompense:{ credits:1900, xp:340, flags:{} }   // K35, K39 : pas de PA
  },

  /* ---------------- Q17 — Le rappel ---------------- */
  {
    id:"q17",
    nom:"Le rappel",
    donneur:"Galm",
    donneurLieu:"La Carcasse",
    lieuPrise:"carcasse",
    intro:[
      "Galm a un écouteur dans une oreille et une clé à molette dans la main. Elle ne lève pas la tête. « Le vieux m'a appelée. Il m'a lu un code. Quatre sons. » Elle serre un boulon. « Il m'a demandé si un port, ça sait où partent ses équipages. »",
      "« Ça sait. » Elle pose la clé. « Un port qui rappelle un équipage, il lui donne une route. Et une route, ça s'écrit quelque part : dans la capitainerie. Pas dans le vaisseau. Le vaisseau, lui, il dort. »",
      "Elle montre du menton, par le hublot, la tache sombre de La Cassée. « Le ber, tu connais. La capitainerie est derrière, au fond des coursives. Plus de courant depuis le désarmement. Le réacteur brûle encore, mais il est branché sur rien. »",
      "« Tu tires un câble du réacteur jusqu'aux registres, tu les rallumes, tu lis l'ordre de rappel. » Elle se remet au boulon. « Et tu me dis où ils sont allés. J'aime pas les endroits où des gens vont et d'où personne revient. »"
    ],
    etapes:[

      /* ---- 1. Les coursives — CREVASSE (ratable) ---- */
      { indice:"À La Cassée, derrière le ber : la capitainerie, au fond des coursives. Plus aucune lumière.",
        cible:{ lieu:"planete_cassee" }, leurres:[ { lieu:"epave" }, { lieu:"antenne" }, { lieu:"base" } ],
        image:"images/quetes/q17/1.png",
        arrivee:[
          "Le ber est comme tu l'as laissé : le vaisseau d'évacuation de MAAR-3, en sommeil, et sa case vide qui attend une confirmation. Tu passes à côté sans t'arrêter. Il dort ; ce n'est pas lui que tu viens voir.",
          "Derrière, les coursives du port. Le noir est total. Ta lampe de casque éclaire un pas devant toi, pas deux.",
          "Galm, dans la radio : « Garde la main sur la paroi et compte tes pas. Ta lampe tiendra pas toute la nuit. »"
        ],
        defi:{ type:"crevasse", n:9, rayon:1, marge:1.6,
          texte:["Des coursives effondrées, des portes soudées, des couloirs qui ne mènent nulle part. Quelque part en bas : la capitainerie."],
          consigne:"Trouve la sortie, en bas de la grille, avant que ta lampe ne faiblisse.",
          fini:"Une porte, au bout du couloir. Gravée du carré : CAPITAINERIE.",
          echec:"Ta lampe baisse. Tu rebrousses chemin à tâtons, la main sur la paroi. Nouvelle tentative plus tard.",
          reussite:[
            "La capitainerie est une salle basse, en demi-cercle, face à une baie qui donne sur les bers vides. Des pupitres, des registres, des sièges encore tournés vers la baie, comme si quelqu'un venait de se lever.",
            "Tout est éteint. Sous tes pieds, très loin, tu sens battre le réacteur."
          ] } },

      /* ---- 2. Le câble — NŒUD (non ratable) ---- */
      { indice:"Dans la capitainerie de La Cassée : rebranche les registres du port sur le réacteur.",
        cible:{ lieu:"planete_cassee" }, leurres:[ { lieu:"epave" }, { lieu:"antenne" } ],
        image:"images/quetes/q17/2.png",
        arrivee:[
          "Une gaine de câbles sort du plancher, arrachée net le jour du désarmement. De l'autre côté de la salle, la prise des registres. Entre les deux, des passages encombrés de pupitres, de poutres tombées, d'armatures tordues.",
          "« Le câble doit rien toucher », dit Galm. « Une paroi, une poutre, et il crame. Et toi avec, peut-être. Fais ça doucement. »"
        ],
        defi:{ type:"noeud",
          texte:["Trois tronçons, du réacteur jusqu'aux registres. Le passage se resserre à chaque fois."],
          consigne:"Guide le câble du doigt ou de la souris, du point plein au cercle, sans lever ni sortir du couloir.",
          glisse:"Le câble frôle une poutre : une gerbe d'étincelles. Tu recommences ce tronçon.",
          fini:"Le dernier tronçon claque dans sa prise.",
          reussite:[
            "Un bourdonnement monte du plancher. Les pupitres s'allument un à un, d'abord en rouge, puis en ambre. Sur la baie, une ligne de texte se dessine, en ancien : les sons que tu connais, les formes que Sorn récite.",
            "Les registres du port se réveillent. Ils ont gardé tout ce qu'on leur a confié. Jusqu'à la dernière ligne."
          ] } },

      /* ---- 3. L'ordre de rappel — ORDRE (ratable) ---- */
      { indice:"Dans la capitainerie de La Cassée : le registre a gardé l'ordre de rappel de l'équipage, en morceaux. Remets-le dans l'ordre.",
        cible:{ lieu:"planete_cassee" }, leurres:[ { lieu:"epave" } ],
        image:"images/quetes/q17/3.png",
        arrivee:[
          "Le dernier registre ouvert le jour du désarmement est en lambeaux : la mémoire s'est effritée en blocs, et les blocs se sont mélangés. Ils sont tous là. Plus dans l'ordre.",
          "Sorn, que Galm a branché sur la même fréquence, souffle : « Lis-moi tout. Même ce que tu comprends pas. »"
        ],
        defi:{ type:"ordre",
          /* v1.87d — retour de l'autrice : aucun fil entre les blocs, et la consigne
             (« du premier jour de l'attente ») faisait croire que l'attente venait
             en premier. Chaque bloc REPREND maintenant ce sur quoi le précédent
             s'arrête (attente → confirmation → direction → équipage → route →
             passage), comme un vrai journal de port. Même histoire, même ordre. */
          texte:["Six blocs du registre de la capitainerie, mélangés. Remets-les dans l'ordre."],
          consigne:"Chaque bloc reprend là où le précédent s'arrête : suis le fil, de l'armement du vaisseau jusqu'au passage.",
          echec:"Le registre ne reconnaît pas la suite : les blocs se brouillent à l'écran et la mémoire se referme. Nouvelle tentative dans 8 h.",
          elements:[
            "Vaisseau d'évacuation affecté à MAAR-3 : armé, équipage à bord, au ber. En attente de la confirmation du quai.",
            "Confirmation du quai : délai dépassé. Relance envoyée, sans réponse. Dossier transmis à la direction.",
            "Direction : dossier MAAR-3 classé. Vaisseau mis en sommeil au ber. Équipage sans affectation.",
            "Équipage sans affectation : rappelé par la direction. Route assignée. Port désarmé après son départ.",
            "Route assignée : Triptolème-4, puis Relais Triptolème-1, puis passage.",
            "Passage : point sans nom. Au-delà : destination de rappel. Retour : non prévu."
          ],
          reussite:[
            "Tu lis l'histoire d'un trait, à voix haute, pour Sorn. Le vaisseau attend. Personne ne confirme. On classe. On endort le vaisseau. On rappelle l'équipage. On éteint le port derrière lui.",
            "Puis la route. La Cassée, le Perchoir, et un « passage » sans nom, avec des coordonnées. Tu les reportes sur ta carte de Triptolème.",
            "Elles tombent au milieu de la Gorge.",
            "Galm ne dit rien pendant longtemps. Puis : « On m'a toujours dit que personne en revenait. » Un temps. « Eux, ils y allaient. »",
            "« Retour : non prévu », relit Sorn. « C'est pas pareil que \"personne en revient\". C'est pire, ou c'est mieux. Je sais pas encore. »"
          ] } },

      /* ---- 4. Ce qu'on fait du port — CHOIX de Cercle ---- */
      { indice:"Dans la capitainerie de La Cassée. Les registres sont rallumés. Décide de ce que tu en fais.",
        cible:{ lieu:"planete_cassee" }, leurres:[ { lieu:"epave" } ],
        image:"images/quetes/q17/4.png",
        arrivee:[
          "Le port bourdonne autour de toi pour la première fois depuis trois siècles. Sur la baie, la route clignote : Triptolème-4 — Relais Triptolème-1 — passage.",
          "« À toi de voir », dit Galm. « Moi, j'ai ce que je voulais : je sais où ils sont passés. »"
        ],
        defi:{ type:"choix",
          texte:["Les registres de La Cassée tournent sur le réacteur. Tu peux les laisser vivre, les rendormir, ou en emporter un morceau."],
          options:[
            { texte:"Laisser le port branché. Ce qui a été cassé peut reprendre ; un port qui se souvient vaut mieux qu'un port mort.",
              cercles:{ eclats:5 },
              journal:"Tu as laissé les registres de La Cassée sur le réacteur. Depuis, une lueur ambre brille derrière la baie de la capitainerie, et les pilotes du Perchoir se demandent ce que c'est." },
            { texte:"Débrancher le câble et laisser le port dormir. Tu as lu ce que tu voulais ; le reste ne t'appartient pas.",
              cercles:{ veilleurs:5 },
              journal:"Tu as rendormi le port de La Cassée. La route est dans ton carnet, et nulle part ailleurs." },
            { texte:"Démonter le lecteur du registre et le rapporter à Galm. Elle saura en tirer quelque chose.",
              cercles:{ assembleurs:5 },
              journal:"Tu as rapporté à Galm le lecteur de la capitainerie. Elle l'a posé sur son établi sans un mot, et l'a démonté jusqu'à la dernière vis." }
          ],
          reussite:[
            "Sur le chemin du retour, tu repasses devant le ber. Le vaisseau d'évacuation dort toujours, sa case vide tournée vers MAAR-3.",
            "Dans la radio, Sorn réfléchit tout haut : « Un code d'adresse, une route qui finit dans un trou. Il manque le morceau du milieu : comment on va de l'un à l'autre. » Un temps. « Le Perchoir. Tout passait par là. Il doit avoir une table, pour savoir où envoyer ce qu'on lui confie. »",
            "Galm : « Je te le remonte, ton vieux. Il commence à aimer ça, je crois. »"
          ] } }
    ],
    recompense:{ credits:2000, xp:350, flags:{} }
  },

  /* ---------------- Q18 — La table ---------------- */
  {
    id:"q18",
    nom:"La table",
    donneur:"Vieux Sorn",
    donneurImg:"images/quetes/vieux_sorn.png",
    donneurLieu:"La Carcasse",
    lieuPrise:"carcasse",
    intro:[
      "Sorn est assis sur la caisse à boulons, le casque de vol sur la tête cette fois, la sangle mal attachée. Il a un carnet sur les genoux, couvert de sa petite écriture : le code de Chardon, la route de La Cassée.",
      "« Deux morceaux », dit-il. « Une adresse qui dit rien, et une route qui finit dans le noir. Il manque ce qui les relie. »",
      "« Un relais, ça reçoit un message, ça regarde l'adresse, et ça sait à qui le passer. Pour ça, il a une table. Le Perchoir en a forcément une : tout le secteur passait par lui. » Il tapote le carnet. « Si on lui demande où il enverrait un message pour TURE-PART-LAI-ME, il va nous le dire. »",
      "Il se lève, et ses genoux craquent. « Toi devant. Moi je sais toujours pas marcher dans ces trucs. »"
    ],
    etapes:[

      /* ---- 1. La table d'acheminement — ÉNIGME ---- */
      { indice:"Au Perchoir, dans la salle du relais : la table d'acheminement du réseau.",
        cible:{ lieu:"base" }, leurres:[ { lieu:"epave" }, { lieu:"antenne" }, { lieu:"asteroides" } ],
        image:"images/quetes/q18/1.png",
        arrivee:[
          "La salle ronde du relais bourdonne comme la dernière fois. Sorn va droit au terminal central, sans toucher le lecteur de la porte. Il a retenu la leçon.",
          "La table d'acheminement s'affiche en colonnes, en ancien. Sorn lit les formes, toi les sons. À gauche, des adresses ; à droite, à qui passer le message. Des dizaines de lignes : les sondes, les relais de surface, La Cassée, le Muet.",
          "TURE-PART-LAI-ME n'y est pas.",
          "Tout en bas, une dernière ligne, plus ancienne que les autres : ADRESSE NON RÉPERTORIÉE — transmettre vers le dernier point de la route assignée.",
          "« Assignée », répète Sorn. « La route du rappel. Celle de La Cassée. »"
        ],
        defi:{ type:"enigme",
          texte:"Le relais ne connaît pas l'adresse de Chardon. Il applique sa dernière ligne.",
          question:"« Alors, où il l'envoie, le message ? »",
          reponses:["la gorge","gorge","dans la gorge","vers la gorge","le passage","passage","le passage sans nom","au passage","le point sans nom","point sans nom","le dernier point","dernier point de la route"],
          indice:"La route du rappel, à La Cassée : son dernier point n'avait pas de nom. Où tombaient ses coordonnées ?",
          reussite:[
            "« Dans la Gorge. » Sorn le dit doucement, comme s'il avait peur de la réveiller.",
            "« Trois cents ans que les sondes émettent, et trois cents ans que le Perchoir envoie tout ça dans un trou. » Il se gratte la tête. « Et personne a jamais répondu, sauf une fois, il y a 109 573 nuits. Faut bien que quelqu'un tienne l'adresse ouverte, de l'autre côté. »"
          ] } },

      /* ---- 2. Les trois morceaux — CALQUES (ratable) ---- */
      { indice:"Au Perchoir, dans la salle du relais : superpose les trois morceaux de l'adresse.",
        cible:{ lieu:"base" }, leurres:[ { lieu:"epave" }, { lieu:"antenne" } ],
        image:"images/quetes/q18/2.png",
        arrivee:[
          "Le terminal accepte qu'on lui donne des morceaux et qu'on les fasse glisser. Tu lui donnes les tiens : le code de Chardon, la dernière ligne de la table, et la route de La Cassée. Tu remarques que le relais ne prend pas la route par le début, comme toi tu l'avais lue au port : il la prend par son dernier point.",   // v1.87f : l'indice du retournement
          "Chacun, seul, ne vaut rien : un code sans lieu, un lieu sans entrée, une entrée sans adresse. Ensemble, ils devraient faire des coordonnées. À condition de les caler l'un sur l'autre.",
          "Sorn s'assied à côté de toi et ne dit plus rien. Il regarde tes mains."
        ],
        defi:{ type:"calques",
          /* v1.87f — choix de l'autrice : un retournement ici aussi, pour la difficulté.
             Justifié par l'histoire : la table « transmet vers le DERNIER point de la
             route » (ét. 1) ; le relais lit la route par la fin. La route est donc la
             3e bande, celle que ⇄ retourne. */
          noms:["Code de Chardon","Table du relais","Route du rappel"],
          texte:[ "Trois relevés sur trois bandes : le code de Chardon, la table du Perchoir, la route de La Cassée." ],
          reussite:[
            "Les trois bandes n'en font plus qu'une, et le terminal, pour la première fois, affiche une ligne complète : des coordonnées. Pas un nom, pas un lieu. Des chiffres.",
            "Tu les reportes sur ta carte. Elles traversent la Gorge de part en part, et tombent de l'autre côté, là où la carte n'a plus rien.",
            "« Le Bureau des Cultures », dit Sorn. « Il est là. Derrière. » Il rit, d'un rire bizarre. « Toute ma vie j'ai cru qu'AREPO était loin. Il était juste derrière un trou. »"
          ] } },

      /* ---- 3. Ce qu'on fait des coordonnées — CHOIX de Cercle ---- */
      { indice:"Au Perchoir, dans la salle du relais. Les coordonnées sont complètes. Décide à qui tu les confies.",
        cible:{ lieu:"base" }, leurres:[ { lieu:"epave" } ],
        image:"images/quetes/q18/3.png",
        arrivee:[
          "Les coordonnées brillent sur l'écran. Sorn a recopié chaque chiffre trois fois dans son carnet, en tirant la langue.",
          "« Bon », dit-il. « Maintenant on sait où. La question, c'est qui le sait. »"
        ],
        defi:{ type:"choix",
          texte:["Les coordonnées du Bureau des Cultures sont dans ta mémoire, et dans le carnet de Sorn. À qui les confier ?"],
          options:[
            { texte:"Les donner à Galm, pour qu'elle calcule la route du saut. Si quelqu'un doit y aller, il faut que le vaisseau tienne.",
              cercles:{ assembleurs:5 },
              journal:"Tu as donné les coordonnées à Galm. Elle a passé la nuit sur ses calculs, et le matin, elle avait l'air de quelqu'un qui n'aime pas ce qu'elle a trouvé." },
            { texte:"Les traduire en clair et les lire à Adaya, par radio. C'est elle qui avait peur ; c'est à elle de savoir la première.",
              cercles:{ langues:5 },
              journal:"Tu as lu les coordonnées à Adaya. Elle n'a rien dit. Puis : « Derrière un trou. Bien sûr. » Et elle a raccroché." },
            { texte:"Ne rien dire encore. Effacer l'écran du relais, et garder le carnet de Sorn fermé.",
              cercles:{ veilleurs:5 },
              journal:"Tu as effacé l'écran du relais. Les coordonnées existent en deux endroits : ta mémoire, et le carnet de Sorn, qu'il garde dans sa poche de poitrine." }
          ],
          reussite:[
            "Galm vient rechercher Sorn. Sur la passerelle, il s'arrête et te regarde, longtemps.",
            "« T'y vas, hein. » Ce n'est pas une question. « Je te dirais bien de pas y aller. Mais moi, toute ma vie, on m'a dit de pas aller au bout du bras est. » Il hausse les épaules. « Va voir Galm. Avant de sauter dans un trou, on vérifie ses rivets. »"
          ] } }
    ],
    recompense:{ credits:2100, xp:360, flags:{} }
  },

  /* ---------------- Q19 — Ce que la coque encaisse ---------------- */
  {
    id:"q19",
    nom:"Ce que la coque encaisse",
    donneur:"Galm",
    donneurLieu:"La Carcasse",
    lieuPrise:"carcasse",
    intro:[
      "Galm a étalé ses calculs sur l'établi, entre deux carters. Des courbes, des chiffres, des ratures. Elle a les yeux rouges.",
      "« J'ai fait les comptes. La Gorge, elle avale la lumière : elle avale le reste aussi. Un vaisseau qui entre comme ça, il ressort en petits morceaux, ou il ressort pas. » Elle tapote une courbe. « Sauf s'il entre exactement sur la route. Et s'il a une coque qui tient la torsion. »",
      "« Ta coque, elle tient pas. Je peux la doubler. Il me faut du câblage, des cellules, et du Cristal de Nyx pour les jointures : c'est la seule chose qui plie sans casser. » Elle repousse les papiers. « Et après, tu iras au bord, voir ce que ça donne. Pas dedans. Au bord. »",
      "Elle te regarde enfin. « Je te le dirai qu'une fois, alors écoute. Je sais pas ce qu'il y a derrière. Personne sait. Les registres s'arrêtent là. Si tu y vas, je peux pas venir te chercher. »"
    ],
    etapes:[

      /* ---- 1. La coque doublée — LIVRAISON ---- */
      { indice:"À La Carcasse : apporte à Galm de quoi doubler ta coque.",
        cible:{ lieu:"epave" }, leurres:[ { lieu:"base" }, { lieu:"planete_cassee" } ],
        image:"images/quetes/q19/1.png",
        arrivee:[
          "Galm a déjà démonté deux panneaux de ta coque. Ils sont posés contre la paroi comme des pages arrachées. « J'attends ton matériel. Moi je fournis la sueur. »"
        ],
        defi:{ type:"livraison",
          objets:{ fab_cablage:3, fab_cellule_d_energie:2, cristal:2 },
          texte:["Trois câblages, deux cellules d'énergie et deux Cristaux de Nyx. Le Cristal se trouve au Gravier, le reste se fabrique ou s'achète."],
          reussite:[
            "Galm travaille toute la nuit. Elle soude, elle gaine, elle jure. Elle glisse le Cristal dans les jointures, éclat par éclat, comme on sertit une bague.",
            "Au matin, ta coque a l'air d'un vieux manteau rapiécé. « C'est pas beau », dit Galm. « Mais ça plie. »"
          ] } },

      /* ---- 2. Le bord de la Gorge — TRAVERSÉE (ratable) ---- */
      { indice:"Au bord de la Gorge, à l'est, là où la lumière commence à se tordre. Approche, sans entrer.",
        cible:{ carte:"espace", x:1440, y:824, r:130 }, leurres:[ { lieu:"epave" }, { lieu:"base" } ],
        image:"images/quetes/q19/2.png",
        arrivee:[
          "Au bord de la Gorge, les étoiles glissent. Elles se tordent en arcs, se dédoublent, disparaissent derrière quelque chose qui n'a pas de forme. Ta coque gémit, doucement, comme une charpente dans le vent.",
          "Galm, dans la radio, la voix serrée : « Y a des courants. Des zones où ça tire, d'autres où ça tient. Tes capteurs te diront combien de zones qui tirent touchent chaque endroit que t'as déjà franchi. Avance jusqu'au bout de la route, et reviens. »"
        ],
        defi:{ type:"traversee", colonnes:7, lignes:9, lave:20, plaques:3, icone:"🌀",   // v1.87g : textes propres (courants)
          brulant:"Un courant te happe : la coque se tord, et une jointure de Cristal saute.",
          pariForce:"Un courant te happe — mais rien sur tes capteurs ne l'annonçait : tu redresses à temps, et la coque encaisse sans rien perdre.",
          echec:"Un dernier courant arrache ta dernière protection. Tu te dégages du bord à pleine poussée — nouvelle tentative dans 8 h.",
          texte:["Traverse le bord de la Gorge jusqu'au dernier point de la route. Chaque zone franchie t'indique combien de courants la touchent."],
          reussite:[
            "Tu touches le dernier point de la route, et tu tiens. La coque grince, les jointures de Cristal chauffent, mais rien ne casse.",
            "Devant toi, la Gorge. Pas un trou : une absence. Tu as l'impression qu'elle te regarde aussi.",
            "Tu fais demi-tour, lentement. Dans la radio, Galm respire de nouveau."
          ] } },

      /* ---- 3. Avant de sauter — CHOIX de Cercle ---- */
      { indice:"Rentre à La Carcasse. Galm t'attend.",
        cible:{ lieu:"epave" }, leurres:[ { lieu:"base" } ],
        image:"images/quetes/q19/3.png",
        arrivee:[
          "Galm vérifie chaque jointure, une à une, la joue contre la coque, comme on écoute un cœur. Puis elle se redresse.",
          "« Elle tiendra. » Un temps. « Toi, je sais pas. »",
          "« Quand tu seras prêt, tu me le dis, et je te donne la route. Pas avant. Une fois là-dedans, tu reviens pas comme tu veux. Peut-être que tu reviens pas du tout. Fais ce que t'as à faire avant. »"
        ],
        defi:{ type:"choix",
          texte:["Avant de sauter, il reste une chose à faire."],
          options:[
            { texte:"Laisser un mot à la serre, pour Sorn et Adaya. Dire où tu vas, et pourquoi. Qu'ils sachent, si tu ne reviens pas.",
              cercles:{ racines:5 },
              journal:"Tu as laissé un mot à la serre. Adaya l'a lu, l'a plié en quatre et l'a rangé dans le bocal du code de Chardon. Sorn ne l'a pas lu ; il a dit qu'il le lirait si tu ne revenais pas." },
            { texte:"Demander à Galm de te suivre au radar jusqu'au bord, et de noter tout ce qu'elle voit. Même si tu ne reviens pas, quelqu'un saura.",
              cercles:{ veilleurs:5 },
              journal:"Galm a promis de te suivre au radar jusqu'au bord. Elle a sorti un carnet neuf. Sur la première page, elle a écrit la date, et rien d'autre." },
            { texte:"Rester une nuit de plus à l'atelier et renforcer encore la coque, avec ce qu'il reste de Cristal.",
              cercles:{ eclats:5 },
              journal:"Tu as passé la nuit avec Galm sur ta coque. Au matin, il y avait un éclat de Cristal de plus à chaque jointure, et vous n'aviez dormi ni l'un ni l'autre." }
          ],
          reussite:[
            "Galm te tend un bout de papier : la route, recopiée à la main. Les coordonnées de Chardon, de La Cassée et du Perchoir, mises bout à bout.",
            "« Le saut, c'est quand tu veux. Mais quand tu entres, tu sors pas. Pas tout de suite. » Elle hésite. « Reviens me voir avant. Que je te le redise. »"
          ] } }
    ],
    recompense:{ credits:2200, xp:370, flags:{} }
  },

  /* ---------------- Q20 — La Gorge ---------------- */
  {
    id:"q20",
    nom:"La Gorge",
    donneur:"Galm",
    donneurLieu:"La Carcasse",
    lieuPrise:"carcasse",
    /* K19 + l'avertissement explicite (Q19, dossier §7) : affiché AVANT d'accepter. */
    avert:"⚠ <b>Point de non-retour, pour un temps.</b> Après cette quête, tu ne pourras plus voler hors de la planète Maar (Triptolème, La Braise, Le Suaire, La Carcasse, le Perchoir…) tant que tu n'auras pas réglé ce qui t'attend de l'autre côté. Tu pourras toujours revenir sur Silène. Emporte du carburant, des vivres, et de quoi te soigner.",
    intro:[
      "Galm ne dit pas bonjour. Elle fait le tour de ton vaisseau une dernière fois, en passant la main sur la coque comme sur l'encolure d'un animal.",
      "« Je te le redis, comme promis. Personne en est revenu pour le raconter. Peut-être parce que personne y est allé. Peut-être pas. » Elle te tend la route, recopiée à la main. « Tu entres sur la ligne, pas à côté. Tu tiens le cap. Tu lâches rien. »",
      "« Et si tu trouves le Bureau… » Elle cherche ses mots, et pour une fois, elle les trouve. « Dis-leur qu'ils ont oublié du monde, ici. Dis-leur qu'on les a pas oubliés, nous. »",
      "Elle recule de deux pas. « Va. »"
    ],
    etapes:[

      /* ---- 1. Le saut — SAUT : le détournement (K9) ---- */
      { indice:"La Gorge. Entre sur la route, exactement. Elle est ouverte, le temps de ce saut.",
        cible:{ lieu:"trou_noir" }, leurres:[ { lieu:"portail" }, { lieu:"base" } ],
        image:"images/quetes/q20/1.png",
        arrivee:[
          "La Gorge remplit tout le hublot. Il n'y a plus d'étoiles devant, seulement derrière, et elles glissent vers le bord comme de l'eau vers une bonde.",
          "Tu entres la route de Galm. Le vaisseau s'aligne. La coque se met à chanter, une note grave, continue, que tu sens dans les dents.",
          "Dans la radio, Galm, très loin : « … ligne… bien… tiens… » Puis plus rien."
        ],
        defi:{ type:"saut", carte:"ancolie", lieu:"chute", bouton:"Entrer dans la Gorge",
          texte:["Le dernier point de la route est devant toi."],
          reussite:[
            "Tu entres.",
            "Le noir. Une pression énorme, partout à la fois. Les chiffres de la route défilent sur l'écran de bord, un par un, comme prévu.",
            "Puis ils changent.",
            "Pas tous. Quelques chiffres, à la fin. Ils se réécrivent d'eux-mêmes, calmement, comme si quelqu'un tapait. Tu n'as rien touché. Le vaisseau vire. Tu tires sur les commandes : elles ne répondent plus.",
            "La pression lâche d'un coup. Une lumière bleue. Un sol qui monte beaucoup trop vite. Une fleur, une seule, très nette, contre le hublot.",
            "Le choc."
          ] } },

      /* ---- 2. La voix — SCÈNE ---- */
      { indice:"Tu es au sol. Quelque part. Reprends tes esprits.",
        cible:{ carte:"ancolie", lieu:"chute" },
        image:"images/quetes/q20/2.png",
        arrivee:[
          "Tu te réveilles la joue contre le tableau de bord. Le vaisseau est couché sur le flanc, au bout d'un long sillon de fleurs arrachées. Dehors, du bleu à perte de vue : des fleurs en cloche, bleu nuit, bleu glacier, qui se balancent au vent comme si de rien n'était.",
          "L'air entre par une fissure de la verrière. Tu respires. Il est bon, mais mince : tu as le souffle court avant même d'avoir bougé.",   // v1.87 : K47
          "Au loin, au milieu de la plaine, un bâtiment rond. Une seule lumière, qui clignote.",
          "Silence. Puis la radio de bord grésille.",
          "« … allô ? Ça marche, ce truc ? Attends. » Une toux. « Bonjour. Non. Bonsoir ? C'est quelle heure, chez vous ? Bon, peu importe. »",
          "La voix est jeune, enrhumée, et parle ta langue avec des cailloux dedans, comme quelqu'un qui l'a apprise à la radio. « Je me présente. 42-U1F. Maintenance. Enfin, je maintiens. Quand j'ai le temps. J'ai rarement le temps. »",
          "42-U1F. Tu as déjà lu ce matricule. Au Perchoir, au bas de l'accusé de réception de l'émission de Sorn, E. : OPÉRATEUR : 42-U1F. Quelqu'un avait entendu. Il t'a entendu.",
          "« Alors voilà. T'es en Ancolie. MAAR-12. Le coin le plus calme de Maar : y a personne. C'est moi qui t'ai posé là. Bon, posé… J'avais visé la station, hein. J'ai eu la plaine. À quelques kilomètres près, c'est pareil. »",   // v1.87l : K54
          "« Et ton calculateur de saut… bon. Il a pris un peu cher. J'ai réécrit ta route en plein saut, et j'ai pas tout remis comme c'était. Maintenant il connaît plus que Maar : Silène, Ancolie, et c'est tout. » Il renifle. « C'était pas prévu. Mais je vais pas te mentir, ça m'arrange. Moi, j'ai des trucs à faire et pas le temps. Toi, t'as un calculateur que je suis le seul à savoir réécrire. Donc on s'arrange : tu fais mes trucs, je te répare ton calculateur. Échange de bons procédés. C'est comme ça qu'on dit ? J'ai entendu ça dans une émission sur les semences. »"
        ],
        defi:{ type:"scene", bouton:"Ne rien répondre, et poser la main sur les commandes" } },

      /* ---- 3. Reprendre les commandes — IMPOSSIBLE (K15) ---- */
      { indice:"Au point de chute, dans ton vaisseau : reprends les commandes.",
        cible:{ carte:"ancolie", lieu:"chute" },
        image:"images/quetes/q20/3.png",
        arrivee:[
          "Tu ne dis rien. Ta main se pose sur les commandes. Un silence, à l'autre bout. Puis : « Ah. Ça, c'est un non. Tu dis rien, mais j'ai très bien entendu le non. » Un bruit de mastication. « Vas-y, essaie. Je regarde. »",
          "L'écran de bord affiche la console du calculateur de saut. Une ligne de commande défile, en caractères que tu sais lire : il suffirait de la retaper proprement pour que le calculateur retrouve ses routes, et toi les tiennes."
        ],
        defi:{ type:"impossible", essais:2, bouton:"Lâcher les commandes",
          colle:"« Copier-coller ? » Un petit rire enrhumé dans la radio. « Bien tenté. Chez nous aussi c'est interdit. Et chez nous aussi, ça marche pas. »",   // v1.87h
          texte:["Une ligne de commande défile sur l'écran de bord."],
          consigne:"Retape la ligne avant qu'elle ne sorte de l'écran.",
          commentaires:[
            "« Vas-y, vas-y. Prends ton temps. Enfin, prends pas ton temps, justement. »",
            "« Ah, t'as raté une virgule. Non, deux. Non, toutes. C'est pas moi, hein ! C'est lui. Il se réécrit tout seul depuis que je l'ai… un peu touché. »",
            "« Écoute, c'est pas contre toi. Moi-même j'y arrive pas comme ça, et c'est moi qui l'ai cassé. Faut le reprendre par le réseau, morceau par morceau. Rien n'est bien fait, ici. Rien. »"
          ],
          reussite:[
            "Tu lâches les commandes. L'écran s'éteint, poliment.",
            "« Voilà. Ça, c'est raisonnable. » Il a l'air sincèrement soulagé. « Bon. Tu vas faire quoi, maintenant ? »",
            "Tu détaches ton harnais, tu pousses la porte du sas à l'épaule, et tu sors dans les fleurs. Au loin, le bâtiment rond clignote.",
            "« Attends, tu pars ? Hé. Tu pars où ? Je te suis comment, moi ? » Un bruit de chaise qui recule. « Ils ont pas prévu de portage sur tablette, je fais comment, je transporte le terminal ?! »",
            "La radio grésille dans ton dos, de plus en plus faible. Tu marches."
          ] } },

      /* ---- 4. La station — SCÈNE : les automates (K16) ---- */
      { indice:"Le bâtiment rond, au milieu de l'ancolie. Marche jusqu'à lui.",
        cible:{ carte:"ancolie", lieu:"station" },
        image:"images/quetes/q20/4.png",
        arrivee:[
          "La marche est longue, et l'air est mince : tu t'arrêtes souvent pour reprendre ton souffle. L'ancolie t'arrive aux genoux, et chaque pas fait trembler des milliers de clochettes bleues. Rien ne bouge d'autre. Pas une bête, pas un oiseau. Personne.",
          "Le bâtiment est rond, bas, intact, comme neuf. Autour, des machines vont et viennent sans se presser : des caissons sur pattes, des bras sur rails, des disques qui roulent. Elles taillent l'ancolie le long des allées, frottent une vitre, redressent une balise. Elles ne te regardent pas.",
          "Sur le linteau de l'entrée, une plaque à demi couverte de pétales. Tu ne lis que la fin : … MAAR-12.",
          "Tu poses la main sur la porte. Un caisson pivote vers toi, un œil rouge s'allume. Une voix plate, sans souffle : PERSONNEL NON RÉPERTORIÉ — MAAR-12. ACCÈS : AUCUN.",
          "Tu essaies la porte de service. PERSONNEL NON RÉPERTORIÉ. Le panneau des réserves. ACCÈS : AUCUN. Une borne d'appel, au mur. Elle ne s'allume même pas.",
          "Puis, d'un haut-parleur au-dessus de la porte, une voix que tu connais : « Ah. Te revoilà. Ils ont des haut-parleurs, ici. Personne s'en sert jamais. »",
          "« Bouge pas. » Un cliquetis. Sur l'écran de la porte : OPÉRATEUR 42-U1F — AUTORISÉ. La porte s'ouvre. Le caisson éteint son œil rouge, et retourne tailler ses fleurs.",
          "« Tu vois ? Ici, ils m'écoutent. Toi, pour eux, t'existes pas. Moi, j'existe. Un peu. » Un temps. « J'essaie pas d'être méchant, hein. Je constate. »"
        ],
        defi:{ type:"scene", bouton:"Entrer" } },

      /* ---- 5. L'arrangement — CHOIX de Cercle ---- */
      { indice:"Dans la station d'Ancolie. 42-U1F attend ta réponse.",
        cible:{ carte:"ancolie", lieu:"station" },
        image:"images/quetes/q20/5.png",
        arrivee:[
          "Dedans, une grande salle ronde, propre, vide. Des bancs alignés face à une baie qui donne sur une aire lisse, balisée. Des écrans éteints. Tout attend quelque chose, et ça fait longtemps.",
          "« Bon. Récapitulons. » Il a l'air de lire une fiche. « Toi : un vaisseau qui sait plus sortir de Maar, et c'est un peu ma faute. Pas d'accès, personne à des jours de vol. Moi : des corvées en retard depuis… longtemps, et pas le droit de sortir. Procédure 7-B, sous-alinéa… euh. Ça se dit pas, chez vous. Disons : je peux pas. »",
          "« Alors tu fais mes trucs. Pas tous les jours, je suis pas un monstre. Et moi, à la fin, je te répare ton calculateur. En attendant, Silène, Ancolie, tu vas, tu viens, tu fais ta vie : ça, il sait encore faire. Le reste — Triptolème, ta ferrailleuse, ton trou noir — il sait plus. C'est la panne. » Un reniflement. « Et c'est aussi le prix. »",
          "Tu regardes les automates tailler l'ancolie, dehors, et le bouton éteint de la borne d'appel. Personne ne viendra. Tu le sais."
        ],
        defi:{ type:"choix",
          texte:["Tu n'as pas vraiment le choix. Mais tu peux choisir comment tu acceptes."],
          options:[
            { texte:"Hocher la tête vers le haut-parleur, les dents serrées. Tu feras ses corvées, et tu t'en souviendras.",
              cercles:{ racines:5 },
              journal:"Tu as accepté le marché de 42-U1F en serrant les dents. « Ouh là. Il fait peur, ton silence. Bon. On va bien s'entendre, je le sens. » Il n'avait pas l'air d'y croire." },
            { texte:"Accepter, puis rester planté sous le haut-parleur, bras croisés, jusqu'à ce qu'il dise qui il est, d'où il t'entend, et pourquoi toi.",
              cercles:{ langues:5 },
              journal:"Tu es resté sous le haut-parleur, bras croisés, jusqu'à ce que 42-U1F craque. « Quoi ? Tu veux que je parle ? Parler, je sais faire. C'est même la seule chose que je fais bien. Enfin, presque bien. »" },
            { texte:"Accepter tout de suite. Un matricule qui fait obéir les machines d'AREPO : ça peut servir, à qui sait s'en servir.",
              cercles:{ eclats:5 },
              journal:"Tu as accepté le marché de 42-U1F sans discuter. Il a eu l'air méfiant. « T'acceptes vite, toi. Ça me plaît pas. Enfin si. Mais non. »" }
          ],
          reussite:[
            "« Parfait. Super. Génial. » Un bruit de clavier. « Ton vaisseau, je te l'ai rangé devant la station, juste devant la baie. Gratuitement. Tu peux rentrer sur Silène quand tu veux. »",
            "Par la baie, tu le vois en effet se poser tout seul sur l'aire balisée, avec une délicatesse que tu ne lui as jamais connue. Les automates s'écartent pour le laisser passer.",
            "« Pour la première corvée, on verra demain. Enfin, demain chez toi. Moi, ici, c'est toujours un peu la même heure. » Un silence. Puis, plus bas, presque timide : « Merci, hein. Personne m'avait jamais dit oui. »",
            "La radio se coupe. Tu restes seul dans la grande salle ronde, au milieu des bancs vides tournés vers la baie."
          ] } }
    ],
    /* K12 : le cadeau du bloc, c'est Ancolie. K16 : vol sur Maar seulement (verrouMaar,
       levé en fin de Q30) — v1.87l, K54 : parce que 42-U1F a CASSÉ le calculateur de saut
       en détournant le vaisseau (il ne connaît plus que Maar), pas parce qu'il le
       retient ; il le réparera par le réseau à la fin de Q30. K39 : un PA, quête clé. */
    recompense:{ credits:2300, xp:400, pa:1, flags:{ ancolie:true, verrouMaar:true } }
  },

  /* ===========================================================
     v1.87 — LOT 2 DE L'ARC : Q21 → Q25, en Ancolie (K22, K33, K46 → K48).
     Donneur : 42-U1F, à la station d'Ancolie (lieuPrise:"station"), par l'écran ou la
     radio (silhouette grésillante). Le joueur l'appelle « Asulf » dès la fin de Q21
     (K25). Chaque quête : un acte principal en Ancolie + un fil comique (ce qu'il
     exige), livré à LA TRAPPE (Silène, au dos de l'anneau, côté mer : K46).
     ⚠ Le joueur ne parle jamais entre guillemets (v1.86f) : des gestes, des actes.
     ⚠ L'air d'Ancolie est mince (K47) : on ne respire qu'à la station.
     Épreuves : Q21 labyrinthe · tir · attente · Q22 traversée · réaction · livraison
     · Q23 triangulation · goupilles · (choix payé en sporelle) · Q24 rangement ·
     mémoire · livraison · Q25 attente · calques · énigme. Jamais deux fois le même
     type dans deux quêtes qui se suivent (hors choix, attente).
     =========================================================== */

  /* ---------------- Q21 — C-409 ---------------- */
  {
    id:"q21",
    nom:"C-409",
    donneur:"42-U1F",
    donneurImg:"images/quetes/asulf.png",
    donneurLieu:"La station d'Ancolie",
    lieuPrise:"station",
    intro:[
      "Sur l'écran au-dessus des bancs, une tache noire grésille, s'étire, prend forme : des épaules, une tête, rien de plus. Une combinaison close, vue à travers trois siècles de câbles. La silhouette te fait un petit signe de la main, avec un temps de retard sur le son.",
      "« Ah. T'es là. Bonjour. Bonsoir. J'ai toujours pas compris votre heure. » Il mâche. « Barre protéinée. Goût <i>nature</i>. Je sais pas ce que c'est, la nature, mais si c'est ça, vous avez pas de chance. »",
      "« Bon. Première corvée. Le conduit MAAR-12-C-409. Il passe sous la station, il porte le câble du réseau, et il est bouché. Je devais le nettoyer… » Il compte sur ses doigts. Il manque de doigts. « … depuis un certain temps. J'avais la flemme. J'ai toujours la flemme, remarque. C'est pour ça que t'es là. »",
      "« Tu le nettoies, je m'occupe de ton calculateur. Tu le nettoies pas, tu gardes… » Il cherche. « … les fleurs. Elles sont jolies, non ? Moi je les vois en gris. L'écran est en monochrome. Rien n'est bien fait. »",
      "« Les automates t'ouvriront la trappe de visite. Je leur ai dit que t'étais mon tournevis. Un tournevis autorisé. Enfin, presque. Leur parle pas, ils sont susceptibles. »"
    ],
    etapes:[

      /* ---- 1. Sous la station — LABYRINTHE (non ratable) ---- */
      { indice:"Dans la grande salle de la station, la trappe de visite des conduits. Descends trouver le C-409.",
        cible:{ carte:"ancolie", lieu:"station", r:160 },
        image:"images/quetes/q21/1.png",
        arrivee:[
          "Une trappe ronde s'ouvre dans le sol, entre deux bancs, avec un soupir de joint sec. Un caisson sur pattes recule d'un pas pour te laisser passer, son œil rouge éteint, l'air vaguement vexé.",
          "En dessous, il fait noir et sec. Des conduits partout, gros comme des troncs, qui se croisent, plongent, remontent. Sur chacun, un matricule peint au pochoir sous la poussière bleue : C-401, C-402, C-407…",
          "« C-409, c'est celui qui siffle », dit 42-U1F. « Enfin, qui sifflait. Il siffle plus, c'est pour ça qu'il est bouché. C'est logique, si tu y penses. J'y pense souvent. »"
        ],
        defi:{ type:"labyrinthe", colonnes:7, lignes:8,
          texte:["Sous la station, un dédale de conduits dans le noir, et de la poussière de pétales jusqu'aux chevilles."],
          consigne:"Quelque part sous la station, le conduit C-409 ◆ : à toi de le trouver.",
          bloque:"Un conduit te barre le passage : faut passer dessous, ou faire le tour. Avance case par case.",
          fini:"Une plaque, sous la poussière : MAAR-12-C-409.",
          reussite:[
            "Le C-409 est plus petit que les autres, et plus vieux. Une trappe de visite tous les dix pas, et derrière chaque trappe, le silence.",
            "Tu colles l'oreille contre le métal. Rien. Pas un souffle. Tu ouvres la première trappe.",
            "Le conduit est plein. Plein à ras bord, d'un bout à l'autre, de quelque chose de bleu."
          ] } },

      /* ---- 2. Le bouchon — TIR (ratable) ---- */
      { indice:"Sous la station, dans le conduit C-409. Débouche-le.",
        cible:{ carte:"ancolie", lieu:"station", r:160 },
        image:"images/quetes/q21/2.png",
        arrivee:[
          "De l'ancolie. Le conduit est plein d'ancolie. Des graines, montées avec l'air de la ventilation, ont germé dans le noir : trois siècles de tiges pâles, de racines en pelote, de pétales fanés tassés comme du feutre.",
          "« Oh. » Un silence. « Ah oui. Je comprends mieux pourquoi ça siffle plus. »",
          "Un automate t'a suivi jusqu'à la trappe. Au bout de son bras, un souffleur. Il te le tend sans te regarder, comme on tend un outil à quelqu'un qui n'est pas là.",
          "« Eux, ils nettoient pas les conduits. Les conduits, c'est le réseau. Le réseau, c'est la maintenance. La maintenance, c'est moi. » Un bruit de chaise. « Bon, maintenant c'est toi. Mets le souffleur en marche : la ventilation va pousser les pelotes vers toi. Éclate-les avant qu'elles se recollent. Elles se recollent. Je sais pas comment, mais elles se recollent. »"
        ],
        defi:{ type:"tir", cible:12, tirs:17, duree:30, couleur:"#8fb8ff",
          texte:["La ventilation pousse les pelotes de racines dans le conduit, une à une, de plus en plus vite."],
          consigne:"Éclate les pelotes au souffleur avant qu'elles ne sortent du conduit.",
          bouton:"Mettre le souffleur en marche",
          fini:"La dernière pelote éclate en pluie de pétales.",
          echec:"Les pelotes se recollent au fond du conduit, en un seul bouchon, plus serré qu'avant. Tu ressors couvert de bleu. Nouvelle tentative dans 8 h.",
          reussite:[
            "La dernière pelote éclate. Pendant une seconde, il ne se passe rien.",
            "Puis un souffle froid remonte le conduit d'un coup, comme si la station reprenait sa respiration, et le C-409 se met à siffler. Une note longue, un peu fausse.",
            "« Il siffle. » La voix de 42-U1F monte d'un ton. « Il siffle ! T'entends ? C'est beau. Enfin, c'est un sifflement. Mais c'est beau. »"
          ] } },

      /* ---- 3. Ce qui circule — ATTENTE (3 h) : la station est branchée au réseau (K23) ---- */
      { indice:"Dans le conduit C-409, la purge est lancée. Laisse le conduit se vider.",
        cible:{ carte:"ancolie", lieu:"station", r:160 },
        image:"images/quetes/q21/3.png",
        arrivee:[
          "La ventilation tourne à plein et chasse ce qui reste vers les grilles du fond. Au milieu du conduit, maintenant propre, apparaît ce que l'ancolie cachait : un câble gainé de verre, qui court le long de la paroi.",
          "Dedans, de la lumière passe. Par paquets. Régulière.",
          "« Tu peux remonter, hein », dit 42-U1F. « La purge, elle se fait toute seule. » Tu ne remontes pas."
        ],
        defi:{ type:"attente", duree:3*3600*1000,
          texte:["La purge vide le conduit, mètre après mètre. Le câble, lui, ne s'arrête jamais."],
          reussite:[
            "Tu as regardé passer la lumière pendant des heures. À la fin, tu ne la regardes plus : tu la lis.",
            "Chaque paquet porte une ligne en ancien, qui s'affiche une seconde sur le petit écran de la trappe de visite. APPEL. RELÈVE. RATIONS. APPEL. ACCUSÉ DE RÉCEPTION. Et en tête de chaque ligne, toujours la même adresse : QUAI MAAR-3.",
            "Le quai de Silène. Celui qui est sous l'anneau. Il parle jusqu'ici, à des jours de chez toi, par ce câble que l'ancolie étouffait.",
            "Les paquets vont et viennent à la même cadence que les vagues de la silène. La cadence de l'appel. Tu la connais par cœur.",
            "« Bah oui », dit 42-U1F, comme si tu avais posé une question. « Tout est branché. Les quais, les relais, les sondes. Ancolie aussi. C'est pour ça que c'était ma corvée : tout ce qui passe dans un câble, c'est à moi de l'entretenir. » Un temps. « Tout seul. Depuis… » Il cherche. « Depuis toujours, en fait. »"
          ] } },

      /* ---- 4. Un nom — CHOIX de Cercle (K25 : « Asulf ») ---- */
      { indice:"Remonte dans la grande salle de la station.",
        cible:{ carte:"ancolie", lieu:"station", r:160 },
        image:"images/quetes/q21/4.png",
        arrivee:[
          "Quand tu remontes, la silhouette t'attend sur l'écran, les bras croisés. Elle a l'air contente d'elle, autant qu'une tache noire peut l'être.",
          "Sur ta radio, le canal par lequel il te parle depuis la Gorge porte toujours le nom que l'appareil lui a donné : SOURCE INCONNUE — 42-U1F. Tu le regardes un moment. Quatre-deux-U-un-F. Ça ne se dit pas. Ça s'épelle.",
          "Tu effaces la ligne, et tu tapes à la place : ASULF.",
          "Un silence. Puis, à l'autre bout : « … Attends. Mon canal a changé de nom. » Une pause. « A. S. U. L. F. » Il le lit lettre par lettre, puis d'un coup : « Asulf. »",
          "« C'est moi, ça ? Quatre-deux… A. U, un… SUL. F. Oh. Oh, c'est malin. » Il le répète sur plusieurs tons, comme on essaie une veste. « Asulf. ASULF. Asulf ? »",
          "« Ça se prononce, au moins. Personne m'a jamais prononcé. » Puis, très vite : « C'est pas réglementaire, hein. Je le garde quand même. Le dis à personne. »"
        ],
        defi:{ type:"choix",
          texte:["Le C-409 siffle sous tes pieds. Il te reste des racines plein les poches, le souffleur de l'automate dans les mains, et trois heures de trafic dans la tête."],
          options:[
            { texte:"Recopier dans ton carnet ce qui passait dans le câble : les lignes, l'adresse du quai, la cadence.",
              cercles:{ veilleurs:5 },
              journal:"Tu as recopié dans ton carnet trois heures de trafic du conduit C-409 : des pages de APPEL, RELÈVE, RATIONS. Asulf a trouvé ça « un peu inquiétant, comme passe-temps »." },
            { texte:"Garder les racines d'ancolie tirées du conduit. Adaya voudra voir ce qui pousse ici.",
              cercles:{ racines:5 },
              journal:"Tu as gardé dans un bocal les racines d'ancolie tirées du conduit. Asulf : « Tu ramasses les déchets, toi ? Chez nous, ça fait un formulaire. Trois, même. »" },
            { texte:"Démonter le souffleur de l'automate pour voir comment c'est fait, et le remonter avant qu'il le réclame.",
              cercles:{ assembleurs:5 },
              journal:"Tu as démonté le souffleur de l'automate, puis tu l'as remonté. Il te reste une vis. Asulf : « Il en reste toujours une. C'est la règle. Personne sait d'où elle vient. »" }
          ],
          reussite:[
            "« Bon. » Asulf a repris sa voix de fiche. « Corvée numéro un : faite. Ton calculateur : toujours en panne, mais c'est noté. Silène, Ancolie, tu vas, tu viens. Le reste, quand j'aurai réparé. Le marché tient. »",
            "« Demain, je te trouve autre chose. J'ai une liste. » Un bruit de papier qu'il n'a sûrement pas. « Elle est longue. Elle est très longue. Tu vas adorer. »",
            "Sous tes pieds, le C-409 siffle sa note fausse. Dehors, les automates taillent l'ancolie le long des allées. Ta bête s'est couchée sous un banc, ses marques éteintes. Elle a l'air de bouder."
          ] } }
    ],
    recompense:{ credits:2400, xp:420, flags:{} }   // K35, K39 : pas de PA
  },

  /* ---------------- Q22 — La zone chaude ---------------- */
  {
    id:"q22",
    nom:"La zone chaude",
    donneur:"Asulf",
    donneurImg:"images/quetes/asulf.png",
    donneurLieu:"La station d'Ancolie",
    lieuPrise:"station",
    intro:[
      "« Asulf, au rapport. » Il a l'air très content de le dire. Il le redit. « Asulf, au rapport. Ça sonne bien. On dirait quelqu'un. »",
      "« Deuxième corvée. Il y a un relais de surface au pied du volcan, au nord-ouest. C'est lui qui porte la station jusqu'au réseau. Tous les après-midi, quand la roche chauffe, il décroche. Et quand il décroche, je perds la station. Les portes, les automates, les haut-parleurs. Tout. »",
      "Un temps. « Et ça, ça fait un rapport. <i>Relais MAAR-12, coupure, opérateur de maintenance : 42-U1F.</i> Avec mon matricule dessus. Et un rapport avec mon matricule dessus, quelqu'un pourrait le lire. Il pourrait se demander pourquoi la maintenance s'occupe d'un relais d'Ancolie. Il pourrait poser des questions. Je déteste les questions. »",
      "« Donc tu le répares. Sinon… » Il cherche une menace. Il la trouve. « Sinon, pas de calculateur. Toi tu restes coincé sur Maar, et moi je reste coincé avec mes rapports. Voilà. C'est du chantage. Je préfère le dire, comme ça on perd pas de temps. »",
      "Puis, beaucoup plus bas : « Et en rentrant… tu passes par chez toi ? Sur Silène ? J'ai entendu des trucs, à la radio. Des gens qui parlent de <i>rations chaudes</i>. Chaudes. » Un silence. « Exprès ? »",
      "« Au dos de l'anneau, côté mer, il y a une trappe de conduit. Personne passe jamais par là. Moi, j'y passe. Enfin, mes mains y passent. Trois rations chaudes, et je te pose plus jamais de question. » Un temps. « C'est faux. Je vais t'en poser plein. »"
    ],
    etapes:[

      /* ---- 1. La pente — TRAVERSÉE (ratable) : la zone chaude ---- */
      { indice:"Au nord-ouest d'Ancolie, au pied du volcan, le relais de surface. Monte jusqu'à lui.",
        cible:{ carte:"ancolie", x:640, y:520, r:120 }, leurres:[ { carte:"ancolie", lieu:"cratere" }, { carte:"ancolie", x:820, y:250, r:100 } ],
        image:"images/quetes/q22/1.png",
        arrivee:[
          "Au nord-ouest, l'ancolie s'éclaircit, roussit, puis cède. Le sol devient noir, fendu de veines orange qui battent doucement, comme un pouls. L'air tremble, et il est encore plus mince qu'en bas. Ta bête marche dans tes pas, ses marques éteintes.",
          "Le relais est là-haut, sur une crête : un mât planté dans la roche, à moitié couché, et un boîtier gravé du carré qui fume un peu.",
          "Entre lui et toi, une coulée refroidie. Refroidie dessus, en tout cas.",
          "« Fais attention où tu mets les pieds », dit Asulf. « Je dis ça, j'en sais rien. J'ai jamais mis les pieds nulle part. »"
        ],
        defi:{ type:"traversee", colonnes:7, lignes:9, lave:19, plaques:3,
          pariForce:"La croûte cède — mais rien ne permettait de le savoir : tu t'y attendais, et tu te rattrapes à temps. Ta plaque tient.",
          texte:["Une coulée dont la croûte cache des poches brûlantes. Chaque case franchie te dit combien de poches la touchent."],
          reussite:[
            "Tu poses la main sur le mât. Il est chaud comme une pierre de four.",
            "Sur le boîtier, une plaque : RELAIS DE SURFACE — MAAR-12/2. Sous elle, une petite lampe d'état, rouge, qui hésite."
          ] } },

      /* ---- 2. Le relais — RÉACTION EN CHAÎNE (ratable) ---- */
      { indice:"Au pied du volcan, le relais de surface MAAR-12/2. Relance ses bornes.",
        cible:{ carte:"ancolie", x:640, y:520, r:120 },
        image:"images/quetes/q22/2.png",
        arrivee:[
          "Le boîtier s'ouvre sur une grille de cellules reliées par des pistes de cuivre. La chaleur a cuit les soudures : par endroits, le cuivre a bleui ; ailleurs, il a fondu en perles.",
          "« Il faut relancer les bornes », dit Asulf. « Toutes. La notice dit : <i>Réamorçage par impulsion, propagation sur deux segments, au-delà perte de charge.</i> » Un temps. « Ça veut dire… tu donnes un coup de jus, et ça passe aux voisins. Pas trop loin. Deux voisins. Ou deux pistes. C'est pareil ? » Un temps. « C'est pas pareil. »",
          "« Et t'en as pas beaucoup, des coups de jus. Le relais a plus beaucoup de jus. C'est pour ça qu'il est en panne. Tout se tient. »"
        ],
        defi:{ type:"reaction", colonnes:7, lignes:5, impulsions:3, bornes:8, portee:2, essais:2,
          texte:["Des bornes à relancer, des pistes à moitié fondues, et à peine de quoi donner trois impulsions."],
          consigne:"Choisis où donner tes impulsions (touche un point ; encore une fois pour l'enlever), puis lance.",
          bouton:"Donner les impulsions",
          fini:"Toutes les bornes s'allument.",
          echec:"Les pistes crachent une gerbe d'étincelles, puis se taisent. Le cuivre a trop chauffé : il faut le laisser refroidir. Nouvelle tentative dans 8 h.",
          reussite:[
            "Les bornes s'allument une à une, ambre, puis vert. Le mât se redresse d'un cran en grinçant. La petite lampe d'état passe au vert, et ne bouge plus.",
            "Au centre de la plaine, très loin, une lumière de la station cesse de clignoter. Elle devient fixe.",
            "« Ah ! J'ai la station. J'ai tout. Les portes, les automates. J'ai même une caméra que je savais pas que j'avais. » Un temps. « Oh, c'est toi ? T'es tout petit, vu d'en haut. Et tout rouge. C'est normal, le rouge ? Vous êtes rouges, chez vous ? »",
            "Tu regardes tes mains. Elles sont noires de suie, et rouges de chaleur.",
            "« Bon. Maintenant… » Il a l'air de se tortiller sur sa chaise. « Les rations. »"
          ] } },

      /* ---- 3. Chaud — LIVRAISON à la trappe (K46) ---- */
      { indice:"Sur Silène, au dos de l'anneau, côté mer : la trappe de conduit. Trois rations chaudes.",
        cible:{ x:322, y:1050, r:80 }, leurres:[ { x:450, y:915, r:80 }, { x:452, y:1172, r:80 }, { x:660, y:1300, r:80 } ],
        image:"images/quetes/q22/3.png",
        arrivee:[
          "Le dos de l'anneau. Personne ne vient jamais de ce côté : le rempart d'un côté, la mer de l'autre, et entre les deux la bande de terre nue, entretenue au cordeau.",
          "Ta bête lève la tête. Ses marques se rallument, une à une, comme si elle rentrait chez elle.",
          "Au pied du mur, à moitié enfouie dans le talus, une trappe ronde, grande comme une assiette, gravée du carré. Ni poignée, ni serrure. Un déclic : elle s'entrouvre d'un doigt, de l'intérieur.",
          "« C'est moi », dit Asulf, très bas. « Enfin, c'est ma main. Enfin, c'est un bras de maintenance que je pilote. Il passe par les conduits. Moi je bouge pas, hein. Moi je suis à mon poste. » Un temps. « Mets-les là. Doucement. »"
        ],
        defi:{ type:"livraison", objets:{ fab_ration_chaude:3 },
          texte:["Trois rations chaudes. Les Biotech en fabriquent ; la Boutique en vend."],
          reussite:[
            "Un bras articulé, fin comme une patte d'insecte, sort de la trappe. Il prend les rations une à une, avec une délicatesse infinie, et la trappe se referme.",
            "Un long silence. Puis, dans la radio, un bruit d'emballage qu'on déchire.",
            "« … »",
            "« C'est chaud. »",
            "« C'est CHAUD. Ça brûle la langue. Pourquoi ça brûle la langue ? C'est voulu ? C'est complètement irresponsable. C'est génial. » Bruit de mastication. « Je vais en manger une autre. Juste pour vérifier. »"
          ] } },

      /* ---- 4. Pourquoi — CHOIX de Cercle ---- */
      { indice:"Au dos de l'anneau, devant la trappe. Asulf n'a pas fini de manger.",
        cible:{ x:322, y:1050, r:80 },
        image:"images/quetes/q22/4.png",
        arrivee:[
          "Il a mangé les trois. D'affilée. Après avoir juré qu'il en garderait pour demain.",
          "Puis il se tait longtemps. Quand il reparle, ce n'est plus sa voix de fiche.",
          "« Dis. Je te fais du chantage, et toi tu m'apportes à manger chaud. C'est pas logique. Chez nous, quand c'est pas logique, on ouvre un dossier. » Un temps. « J'ouvre pas de dossier. Je demande, c'est tout. »"
        ],
        defi:{ type:"choix",
          texte:["Il attend une réponse. Tu n'as pas l'intention de faire la conversation à une trappe."],
          options:[
            { texte:"Frapper deux coups sur la trappe, comme on frappe à une porte, et repartir.",
              cercles:{ racines:5 },
              journal:"Tu as frappé deux coups sur la trappe et tu es reparti. Derrière toi, après un long moment, deux petits coups ont répondu, de l'intérieur." },
            { texte:"Glisser dans la fente un mot griffonné : comment on réchauffe une ration.",
              cercles:{ langues:5 },
              journal:"Tu as glissé un mode d'emploi dans la trappe. Asulf : « <i>Mettre au chaud.</i> Au chaud OÙ ? Avec QUOI ? Ici rien n'est chaud. Rien n'est bien fait. » Il l'a gardé quand même." },
            { texte:"T'asseoir dos au rempart et attendre, sans rien dire, qu'il ait fini de parler tout seul.",
              cercles:{ veilleurs:5 },
              journal:"Tu t'es assis dos au rempart jusqu'à ce qu'Asulf se taise. Il a parlé longtemps, de barres protéinées surtout. Puis il a dit : « T'es encore là ? » Et il n'a plus rien dit, mais il n'a pas coupé." }
          ],
          reussite:[
            "« Bon. » Il renifle. « Demain, une corvée au froid. Prends… comment vous dites ? Un pull. Prends un pull. »",
            "La trappe se referme tout à fait. Ta bête reste à la regarder un moment, ses marques allumées, puis elle te suit."
          ] } }
    ],
    recompense:{ credits:2500, xp:440, flags:{} }
  },

  /* ---------------- Q23 — Ce qui brille sous la glace ---------------- */
  {
    id:"q23",
    nom:"Ce qui brille sous la glace",
    donneur:"Asulf",
    donneurImg:"images/quetes/asulf.png",
    donneurLieu:"La station d'Ancolie",
    lieuPrise:"station",
    intro:[
      "« Problème. » Asulf a sa voix de fiche, mais la fiche tremble un peu. « J'ai un automate en moins. »",
      "« Le numéro 7. Il entretient les balises d'approche, le long des allées, jusqu'au nord-est. Il y a trois jours, il est parti redresser la balise du bord des Glaces. Il est jamais revenu. Il émet encore, mais il dit n'importe quoi. Comme moi le matin. »",
      "« Moi, l'automate, je m'en fiche. Mais à l'inventaire, il en manque un. Et l'inventaire, c'est comme l'appel : on compte les machines, comme on se compte, nous. Si le compte est faux, quelqu'un recompte. Et si quelqu'un recompte… » Il ne finit pas.",
      "« Va me le chercher. Il fait froid, là-bas, paraît-il. Je sais pas ce que c'est, froid. Ici c'est toujours dix-neuf degrés. Réglementaire. »",
      "Puis, l'air de rien : « Et… sur Silène, ils parlent tout le temps d'un truc. La sporelle. C'est quoi, la sporelle ? Ça se mange ? Ça se boit ? » Un temps. « Chez nous, c'est interdit. Je viens de vérifier. Ça donne envie. »"
    ],
    etapes:[

      /* ---- 1. La balise du nord — TRIANGULATION (ratable) : source FIXE, au lac gelé ---- */
      { indice:"Au nord-est d'Ancolie, au bord des Glaces : l'automate n°7 émet encore. Trouve-le.",
        cible:{ carte:"ancolie", x:1850, y:480, r:300 },
        image:"images/quetes/q23/1.png",
        arrivee:[
          "Au nord-est, l'ancolie se fait rare, puis blanche de givre. Le vent descend des Glaces sans jamais s'arrêter. Ta bête se colle à tes jambes.",
          "« Il émet sur une fréquence de service », dit Asulf. « Je te la passe. Plus c'est fort, plus t'es près. C'est comme un jeu. Vous avez des jeux, chez vous ? Nous, on a l'appel. C'est pas un jeu. »"
        ],
        defi:{ type:"triangulation", source:{ x:1780, y:600 }, minReleves:3, fouilles:3, precision:70,
          texte:["L'automate émet, faiblement, quelque part sous la neige. Son signal se lit sur ta radio."],
          trouve:"Sous une croûte de neige, une patte de métal. Puis une autre.",
          echec:"Le vent a tout recouvert, et ton souffle est trop court pour chercher encore. Tu rentres. Nouvelle tentative dans 8 h.",
          reussite:[
            "L'automate n°7 est là, au bord d'un lac gelé, à demi enseveli. Un caisson sur six pattes, deux bras repliés, un œil rouge qui clignote faiblement. Ses pattes sont prises dans la glace jusqu'aux genoux.",
            "« Le 7 ! » Asulf a presque l'air ému. « Il est entier ? Dis-moi qu'il est entier. Il est inventorié. »"
          ] } },

      /* ---- 2. Sous la glace — GOUPILLES (ratable) : la Sélénite (K13, K48) ---- */
      { indice:"Au lac gelé, au nord-est d'Ancolie. Dégage l'automate.",
        cible:{ carte:"ancolie", x:1780, y:600, r:90 },
        image:"images/quetes/q23/2.png",
        arrivee:[
          "Il n'est pas tombé. Il travaillait. Autour de lui, la glace est taillée en marches, nettes, au millimètre, comme il taille l'ancolie le long des allées.",
          "Mais ce qu'il a dégagé, ce n'est pas une balise. Dans la glace bleue, des aiguilles pâles, laiteuses, fines comme des cheveux et longues comme la main, poussent en bouquets vers la surface. Quand le vent passe, elles brillent.",
          "Un automate entretient ce qui brille. C'est sa fonction. Il a creusé pour les atteindre, et la glace s'est refermée sur ses pattes.",
          "« Des cailloux qui brillent », dit Asulf. « Super. Passionnant. Moi je veux mon automate. Sors-le de là. Et casse rien, je te rappelle qu'il est inventorié. »"
        ],
        defi:{ type:"goupilles", nb:6, felures:2,
          texte:["Six pattes prises dans la glace, et des aiguilles tout autour, qui cassent pour un rien."],
          consigne:"Dégage chaque patte à petits coups, au bon moment : quand le curseur passe dans le vert.",
          libelle:"Patte", bouton:"Commencer", boutonCoup:"Frapper",
          fele:"La glace craque et une aiguille éclate en poussière blanche. La patte tient encore. Reprends depuis la première, plus doucement.",
          echec:"Un coup de trop : la glace se fend en étoile et se referme plus serrée. Laisse le froid la ressouder. Nouvelle tentative dans 8 h.",
          fini:"La dernière patte se libère.",
          reussite:[
            "La sixième patte se libère d'un coup. L'automate se redresse, chancelle, et… se remet aussitôt à tailler la glace, là où il en était.",
            "« Non non non non. Rentre. RENTRE. » Un bruit de clavier frénétique. L'automate s'arrête, pivote, et repart vers la station sans se presser, en boitant d'une patte.",
            "Tu restes au bord du lac. Les aiguilles sont toujours là. Tu en touches une du bout du gant : elle ploie, puis se fend d'un coup, en deux morceaux mats. Toute sa lumière est partie.",
            "Elles sont trop jeunes. Elles poussent : à la base des plus grandes, la glace s'écarte, couche après couche, comme une porte qu'on pousse très lentement.",
            "Tu sais ce que c'est. Du Cristal de Sélénite. Celui que les ateliers réclament pour leurs plus beaux ouvrages, et que personne, nulle part, n'a jamais trouvé.",
            "« Laisse tes cailloux », dit Asulf. « Les automates disent qu'ils poussent. Ils disent ça en code d'entretien : ça veut dire <i>pousse</i>, ou <i>fuite</i>, ou <i>joint de dilatation</i>. Je penche pour pousse. Quatre jours, à peu près. » Un temps. « Je suis pas jardinier. »"
          ] } },

      /* ---- 3. La sporelle — CHOIX de Cercle, payé en sporelle (fil comique, K1) ---- */
      { indice:"Sur Silène, la trappe au dos de l'anneau. Apporte trois brins de sporelle : Asulf veut goûter.",
        cible:{ x:322, y:1050, r:80 }, leurres:[ { x:450, y:915, r:80 }, { x:452, y:1172, r:80 }, { x:660, y:1300, r:80 } ],
        image:"images/quetes/q23/3.png",
        arrivee:[
          "Ta bête se rallume dès que tu poses le pied sur Silène. Au pied de l'anneau, la trappe est déjà entrouverte. Il guettait.",
          "« T'en as ? De la sporelle ? Montre. » Le bras de maintenance sort à moitié, puis rentre, puis ressort. « Je suis pas pressé. Je demande. »"
        ],
        defi:{ type:"choix",
          texte:["Trois brins de sporelle. Comment les lui donner ?"],
          options:[
            { texte:"Lui montrer d'abord, devant l'œil du bras, comment on la mâche : lentement, un brin à la fois.",
              cout:{ sporelle:3 }, cercles:{ langues:5 },
              journal:"Tu as montré à Asulf comment on mâche la sporelle. Il a mâché les trois brins d'un coup. « J'ai bien regardé, hein. J'ai juste pas écouté. »" },
            { texte:"Les lui glisser avec leur motte de terre, pour qu'il voie que ça pousse dans quelque chose.",
              cout:{ sporelle:3 }, cercles:{ racines:5 },
              journal:"Tu as donné à Asulf trois brins de sporelle dans leur motte. Il a gardé la terre. Il dit qu'elle sent « le dehors, en plus petit »." },
            { texte:"Glisser avec les brins les deux morceaux de l'aiguille que tu as cassée au lac. Ce qui est cassé, ça se garde.",
              cout:{ sporelle:3 }, cercles:{ eclats:5 },
              journal:"Tu as glissé l'aiguille cassée avec la sporelle. Asulf : « Un caillou mort ? Merci. » Le lendemain, il l'avait posée sur son écran. « Pour caler. Il est bancal, mon écran. Rien n'est bien fait. »" }
          ],
          reussite:[
            "Le bras attrape la sporelle et disparaît. Bruit de mastication. Long.",
            "« C'est… amer. » Un temps. « Non. C'est… » Un temps plus long. « Oh. Oh là. »",
            "Silence. Tu crois qu'il a coupé. Puis, d'une voix que tu ne lui connais pas, plus lente, presque rêveuse :",
            "« Dis. Dehors. Quand il pleut. Ça mouille partout ? Même sur la tête ? Même quand on veut pas ? »",
            "Tu lèves les yeux. Il ne pleut pas. Tu ne réponds rien, et il n'a pas l'air d'attendre de réponse.",
            "« … Oublie. Je demandais pour un ami. » Un temps. « J'ai pas d'ami. Bon. Demain, l'automate. Il boite. »"
          ] } }
    ],
    /* K48 : le gisement de Sélénite (au lac gelé) devient visible ; l'aiguille pousse (selenite.js). */
    recompense:{ credits:2600, xp:460, flags:{ seleniteConnue:true } }
  },

  /* ---------------- Q24 — Les automates ---------------- */
  {
    id:"q24",
    nom:"Les automates",
    donneur:"Asulf",
    donneurImg:"images/quetes/asulf.png",
    donneurLieu:"La station d'Ancolie",
    lieuPrise:"station",
    intro:[
      "« Le 7 boite. » Asulf a la voix de quelqu'un qui n'a pas dormi. « Il est rentré, il s'est mis dans un coin, et depuis hier il taille le même brin d'ancolie. Le même. Il en reste rien, du brin. Il taille l'air. »",
      "« Faut l'ouvrir et le remonter. Je te guide. J'ai la notice. » Bruit de pages. « Elle est en procédure. Je vais traduire. Je traduis bien. » Un temps. « Je traduis. »",
      "« Et après… » Plus bas. « … tu repasses par la trappe ? Avec… tu sais. La chose amère. Pour le moral de l'équipe. » Un temps. « L'équipe, c'est moi. »"
    ],
    etapes:[

      /* ---- 1. Le caisson — RANGEMENT (non ratable, casse-tête) ---- */
      { indice:"Dans la grande salle de la station, l'automate n°7. Remets-le en état.",
        cible:{ carte:"ancolie", lieu:"station", r:160 },
        image:"images/quetes/q24/1.png",
        arrivee:[
          "Dans un coin de la grande salle, l'automate n°7 taille le vide, patiemment, de la pointe de sa pince. Tu le couches sur le flanc. Il se laisse faire. Il continue de tailler, couché.",
          "Son capot s'ouvre sur un caisson presque vide. La moitié de ce qu'il avait dans le ventre est restée au lac ; les autres automates l'ont ramassée, et l'ont posée à côté de lui, en vrac, dans un bac.",
          "« La notice dit », lit Asulf, « <i>Réintégration des sous-ensembles selon gabarit, tolérance nulle, contrôle par la fonction.</i> » Un silence. « C'est-à-dire : tu mets tout dedans. Tout. Et si ça bouge, ça boite. »"
        ],
        defi:{ type:"rangement", colonnes:6, lignes:5, min:3, max:6,
          texte:["Des modules de toutes les formes, et un caisson qui n'a pas une case de trop."],
          consigne:"Remets tous les modules dans le caisson. Il n'y a pas de place perdue : s'il reste un trou, c'est qu'un module est mal tourné.",
          bute:"Ça ne rentre pas là : le module dépasse, ou il en chevauche un autre.",
          fini:"Le dernier module claque dans son logement.",
          reussite:[
            "Le dernier module claque dans son logement. Le capot se referme tout seul. L'automate cesse de tailler, d'un coup, comme on arrête de parler quand quelqu'un entre.",
            "Sur son flanc, un petit écran s'allume : REPRISE — CODE OPÉRATEUR REQUIS."
          ] } },

      /* ---- 2. Comment ils lisent — MÉMOIRE (ratable) : les matricules (K16 approfondi) ---- */
      { indice:"Dans la grande salle, l'automate n°7 attend son code de reprise.",
        cible:{ carte:"ancolie", lieu:"station", r:160 },
        image:"images/quetes/q24/2.png",
        arrivee:[
          "« Ah. Il veut le code. Je te le dicte. » Asulf se racle la gorge. « Mémo-Reprise-Unité-Sept, Opérateur-Maintenance, Bloc-B, Alinéa-Douze… » Il s'arrête. « Non. Ça, c'est le nom de la procédure. Le code, il est sur son écran. Il te le montrera une fois. Une seule. Il est comme ça. »",
          "« Et t'inquiète pas s'il te regarde pas. Il te voit pas. Ils lisent pas les têtes, eux. Ils lisent le réseau. Chez nous, chaque combinaison dit qui elle est, tout le temps, à toutes les machines. Le relais du volcan porte ça jusqu'ici. Moi, je suis dans ma combinaison, à des jours d'ici, et pour lui, je suis là, juste à côté. »",
          "Un temps. « Toi, t'as pas de combinaison qui parle. Pour eux, t'es du décor. Un décor qui bouge. »"
        ],
        defi:{ type:"memoire", duree:7000, compacte:true,
          texte:["L'écran de l'automate va afficher sa fiche, et son code de reprise. Une fois."],
          info:[
            "AUTOMATE 7 — ENTRETIEN DES BALISES — QUAI MAAR-12",
            "OPÉRATEUR LU : 42-U1F — PAR : RÉSEAU / RELAIS MAAR-12/2",
            "PERSONNEL PRÉSENT : 1",
            "CODE DE REPRISE : 7 — B — 12 — 409"
          ],
          question:"« Alors, le code ? »",
          reponses:["7-B-12-409"],
          fini:"L'automate accepte le code.",
          echec:"Le code ne passe pas. L'écran s'éteint, et l'automate se remet à tailler l'air. Il faudra qu'il se rendorme pour recommencer. Nouvelle tentative dans 8 h.",
          reussite:[
            "Le code passe. L'automate se redresse sur ses six pattes, sans boiter. Il fait un pas, deux, pivote… et s'arrête face au vide, juste à côté de toi, à hauteur d'homme.",
            "Son œil rouge s'allume, puis passe au vert. Une voix plate, sans souffle : OPÉRATEUR 42-U1F — PRÉSENT.",
            "Il salue l'air. L'endroit exact où, pour lui, Asulf est debout.",
            "Un long silence dans la radio.",
            "« Il croit que je suis là », dit Asulf. « À côté de toi. » Un temps. « C'est bête. Ça me fait plaisir. »"
          ] } },

      /* ---- 3. Encore — LIVRAISON à la trappe (fil comique) ---- */
      { indice:"Sur Silène, la trappe au dos de l'anneau. Quatre brins de sporelle, pour le moral de l'équipe.",
        cible:{ x:322, y:1050, r:80 }, leurres:[ { x:450, y:915, r:80 }, { x:452, y:1172, r:80 }, { x:660, y:1300, r:80 } ],
        image:"images/quetes/q24/3.png",
        arrivee:[
          "La trappe s'ouvre avant même que tu arrives au pied du mur. Le bras de maintenance est déjà dehors, la pince ouverte, qui attend. Ta bête s'est rallumée ; elle le regarde de travers.",
          "« T'en as ? Pose. Pose-les. »"
        ],
        defi:{ type:"livraison", objets:{ sporelle:4 },
          texte:["Quatre brins de sporelle."],
          reussite:[
            "La pince se referme sur la sporelle, et la trappe claque si vite qu'elle te pince presque les doigts.",
            "Mastication. Soupir. « Ça, c'est le dehors. » Un temps. « Enfin, je crois. J'y suis jamais allé, dehors. »",
            "« Dis. La prochaine fois, au lieu d'une corvée… tu me racontes un truc ? Un truc de dehors. N'importe quoi. Ce que t'as mangé. La couleur du ciel. Ici, le ciel, c'est un plafond. Il est beige. »"
          ] } },

      /* ---- 4. Des nouvelles du dehors — CHOIX : la quête « compétence » du lot (K35) ---- */
      { indice:"Au dos de l'anneau, devant la trappe. Asulf attend des nouvelles du dehors.",
        cible:{ x:322, y:1050, r:80 },
        image:"images/quetes/q24/4.png",
        arrivee:[
          "« Alors ? » Le bras ressort, lentement. Au bout, à côté de la pince, il y a un œil de caméra, tout petit, qui fait le point sur toi. « Vas-y. Raconte. »",
          "Tu ne racontes pas. Tu n'as jamais été doué pour ça. Mais tu peux montrer."
        ],
        defi:{ type:"choix",
          texte:["Qu'est-ce que tu lui montres du dehors ?"],
          options:[
            { texte:"Tenir ta radio ouverte face au vent, longtemps, pour qu'il entende la mer, et la silène qui frémit quand la vague passe.",
              cercles:{ langues:5 },
              journal:"Tu as tenu ta radio face au vent. Asulf n'a rien dit pendant tout ce temps. À la fin : « C'est ça, le bruit du dehors ? Ça fait peur. Refais-le demain. »" },
            { texte:"Arracher une motte de terre au talus et la tenir devant la caméra, pour qu'il voie tout ce qui grouille dedans.",
              cercles:{ racines:5 },
              journal:"Tu as montré à Asulf une motte de terre de Silène, et tout ce qui vit dedans. Il a crié. Puis il a demandé si on pouvait la garder." },
            { texte:"Soulever ta bête jusqu'à la caméra, pour qu'il voie ses marques s'allumer quand la vague passe.",
              cercles:{ veilleurs:5 },
              journal:"Tu as montré ta bête à Asulf, ses marques allumées. Il a mis longtemps à parler. « Elle brille. Pourquoi elle brille ? Elle est inventoriée ? » Tu n'as rien répondu. « Elle est pas inventoriée. Tant mieux. »" }
          ],
          reussite:[
            "« Bon. » Le bras rentre. « Tu sais quoi ? Moins de corvées. Plus de… ça. » Un temps. « J'ai dit ça ? J'ai pas dit ça. La corvée de demain est très importante. Elle est très longue. »",
            "Puis, plus bas : « Le réseau rame, depuis qu'on a débouché le C-409. Il passe plus de choses par la station. Faudra trier. » Un temps. « Pendant l'appel. Je pourrai pas t'aider, pendant l'appel. »"
          ] } }
    ],
    recompense:{ credits:2700, xp:480, flags:{} }
  },

  /* ---------------- Q25 — Radié (couche 2, K31) ---------------- */
  {
    id:"q25",
    nom:"Radié",
    donneur:"Asulf",
    donneurImg:"images/quetes/asulf.png",
    donneurLieu:"La station d'Ancolie",
    lieuPrise:"station",
    intro:[
      "« Petite corvée, aujourd'hui. Toute petite. » Asulf parle trop vite. « Depuis qu'on a débouché le C-409, il passe deux fois plus de trafic par la station. Et la station, elle garde tout ce qui passe, au cas où. Sa mémoire est pleine. Faut faire le tri. »",
      "« Ce soir, il y a l'appel. Pendant l'appel, tout le registre passe dans le câble, ligne par ligne, et la station en fait une copie. Et une copie de la copie. Tu regardes, tu repères les doubles, je les efface. Facile. »",
      "« Moi, pendant l'appel, je peux pas. Pendant l'appel, on répond. Tout le monde répond. On dit… » Un bruit, comme un sigle avalé. « … ça se dit pas chez vous. Disons qu'on dit : je suis là. Toutes les relèves. Toute ma vie. » Un temps. « Je serai occupé à exister. »"
    ],
    etapes:[

      /* ---- 1. L'appel — ATTENTE (2 h) ---- */
      { indice:"Dans la grande salle de la station, ce soir : l'appel passe dans le câble.",
        cible:{ carte:"ancolie", lieu:"station", r:160 },
        image:"images/quetes/q25/1.png",
        arrivee:[
          "La grande salle bourdonne. Sur tous les écrans à la fois, des lignes se mettent à défiler en ancien, plus vite que tu ne peux les lire : l'appel.",
          "Dans la radio, Asulf ne dit plus rien. Tu entends seulement, très loin derrière lui, d'autres voix, des centaines, qui répondent toutes la même chose, chacune à son tour."
        ],
        defi:{ type:"attente", duree:2*3600*1000,
          texte:["L'appel passe. Il prend son temps : il a trois siècles d'avance."],
          reussite:[
            "Ça ne s'arrête pas. Des milliers de lignes : des matricules, des relèves, des postes. Chaque ligne appelée, chaque ligne qui répond.",
            "Puis, après le dernier matricule, une autre liste commence, en caractères plus serrés. PERSONNEL NON ÉVACUÉ. Pas des matricules : des lignées. Des noms qui ont trois cents ans, et pour chacun, au bout, la même mention : À EMBARQUER.",
            "Ce sont les quatre-vingts. Et tous ceux qui sont nés d'eux. Quelque part dans ces lignes, il y a la tienne."
          ] } },

      /* ---- 2. Les doubles — CALQUES (ratable) : la cadence de l'appel ---- */
      { indice:"Dans la grande salle de la station : trie le registre. Superpose les trois copies de l'appel.",
        cible:{ carte:"ancolie", lieu:"station", r:160 },
        image:"images/quetes/q25/2.png",
        arrivee:[
          "La station a gardé l'appel en trois copies, mal calées : celle du câble, celle de sa mémoire, celle des réponses. Tant qu'elles ne se superposent pas, elle ne sait pas ce qui est en double.",
          "La cadence est la même dans les trois : celle de l'appel, celle de la silène, celle des bêtes. Tu la connais par cœur. Et les réponses reviennent comme est toujours revenu ce qui répond à l'appel, depuis le bout du bras est : en écho."   // v1.87f : l'indice du retournement
        ],
        defi:{ type:"calques",
          noms:["L'appel","La mémoire de la station","Les réponses"],   // v1.87f : « Les réponses » reviennent en écho, donc à l'envers (comme en Q15) : ⇄
          texte:["Trois copies de l'appel, sur trois bandes. Cale-les, et les doubles s'effaceront d'eux-mêmes."],
          reussite:[
            "Les trois bandes n'en font plus qu'une. Sur les écrans, les doubles s'éteignent par milliers, ligne après ligne, et la station pousse un long soupir de ventilation. Sa mémoire respire.",
            "Il ne reste qu'une ligne qui ne s'aligne avec rien.",
            "Elle est appelée à chaque cycle, dans la première liste. Elle ne répond jamais. Et pourtant, depuis trois cents ans, personne ne l'a effacée."
          ] } },

      /* ---- 3. Sorn, E. — ÉNIGME : la trace (R2, K31) ---- */
      { indice:"Dans la grande salle de la station : la ligne qui ne répond jamais.",
        cible:{ carte:"ancolie", lieu:"station", r:160 },
        image:"images/quetes/q25/3.png",
        arrivee:[
          "Tu l'ouvres. Elle est vieille. Plus vieille que les autres : elle a encore un nom.",
          "SORN, E. — TECHNICIEN RELAIS — DÉSERTION — IDENTITÉ RADIÉE — NE PAS RÉINTÉGRER.",
          "Tu connais ce nom. Tu l'as lu sur le registre du poste, au tout début. Le sas l'a refusé. Le lecteur du Perchoir aussi. Il est rayé partout.",
          "Mais au bout de la ligne, il y a un dernier champ, et celui-là n'est pas rayé. LIGNÉE : À EMBARQUER.",
          "Le nom ne compte plus, pour personne. Mais tout ce qui est né de lui est toujours sur la liste, comme tout le monde dehors. On ne l'appelle pas pour qu'il réponde. On l'appelle pour savoir qu'il manque.",
          "Dans la radio, l'appel est fini. Asulf est revenu. Il ne dit rien. Il regarde la même ligne que toi, sur son écran."
        ],
        defi:{ type:"enigme",
          texte:"Sorn, E. était du dedans, de garde au quai. Il est sorti sans embarquer.",
          question:"Et quelqu'un du dedans qui sortirait aujourd'hui sans embarquer, que deviendrait-il, dans ce registre ?",
          motsCles:["radi","raye","deserte","desertion","deserteur","ne pas reintegrer"],
          reponses:["comme sorn","comme lui","comme sorn e","la meme chose","pareil","comme sorn, e"],
          indice:"Relis la ligne de Sorn, E. Ce qu'on a écrit sur lui, on l'écrirait sur n'importe qui.",
          reussite:[
            "Radié. Comme lui. Sans nom, en plus : au-dedans, il n'y a plus de noms, rien que des matricules. Quatre signes, et trois mots derrière.",
            "Plus de porte, plus de ration, plus de relève. Et dehors, pour ce registre, rien qu'un non-évacué de plus : les machines qu'il entretient lui-même viendraient le chercher, comme elles cherchent tout le monde. Tu viens de le lire.",
            "Asulf ne dit rien pendant très longtemps.",
            "« Je savais », dit-il enfin. Sa voix n'a plus de cailloux dedans. « Enfin. Je savais pas que je savais. On le sait tous, je crois. On le dit pas. »",
            "« Lui, au moins, il a un nom. On le lui a laissé pour pouvoir le rayer. » Un temps. « Moi, ce serait juste quatre signes. »",
            "« J'allais faire une blague, là. » Un silence. « J'en ai pas. »"
          ] } },

      /* ---- 4. Ce qu'on en fait — CHOIX de Cercle ---- */
      { indice:"Dans la grande salle de la station. La ligne de Sorn, E. est toujours à l'écran.",
        cible:{ carte:"ancolie", lieu:"station", r:160 },
        image:"images/quetes/q25/4.png",
        arrivee:[
          "La ligne de Sorn, E. reste affichée sur l'écran du milieu. Les autres se sont éteints. Dans la grande salle, il n'y a plus que le bruit de la ventilation, et celui d'Asulf qui respire, très loin.",
          "Ta bête est venue se coucher contre tes pieds. Ses marques sont éteintes, comme toujours ici. Elle garde les yeux ouverts."
        ],
        defi:{ type:"choix",
          texte:["Que fais-tu de cette ligne ?"],
          options:[
            { texte:"La traduire en clair dans ton carnet, mot par mot, pour la porter un jour au vieux Sorn.",
              cercles:{ langues:5 },
              journal:"Tu as recopié en clair la ligne de Sorn, E. Asulf t'a regardé faire, puis : « Tu vas la lui donner ? Au vieux ? » Un temps. « T'as raison. Il a le droit de savoir qu'on l'appelle encore. »" },
            { texte:"Remonter la ligne dans la mémoire de la station, champ par champ, pour voir comment on raye un nom.",
              cercles:{ assembleurs:5 },
              journal:"Tu as démonté la ligne de Sorn, E. champ par champ. Une radiation, c'est trois mots et une date. Asulf : « C'est tout ? Trois siècles, pour trois mots ? Rien n'est bien fait. » Pour une fois, ça ne l'a pas fait rire." },
            { texte:"Éteindre l'écran, et rester assis dans la grande salle jusqu'au matin, pour qu'il ne soit pas seul.",
              cercles:{ racines:5 },
              journal:"Tu es resté dans la grande salle de la station jusqu'au matin. Asulf n'a presque rien dit. Vers l'aube, il a demandé : « T'es encore là ? » Tu as frappé deux fois sur le banc. « D'accord. »" }
          ],
          reussite:[
            "« Va voir tes vieux », dit Asulf au bout d'un moment. « Sur Silène. Celui qui porte le nom, et celle de la serre. Ils voudront savoir. »",
            "Un temps. « Moi, je bouge pas. » Un temps encore. « Je peux pas. Maintenant, tu sais. »"
          ] } }
    ],
    recompense:{ credits:2800, xp:500, flags:{} }   // K39 : pas de PA avant Q30
  }


  // Quête finale de la carte Silène : Q5 accorde le permis de vaisseau + ouvre l'espace (flag espace1).
  // La DERNIÈRE portera flags:{ permisVaisseau:true } (+ un flag type espace1:true
  // pour révéler l'onglet de la 1re carte spatiale, quand elle existera).
];
