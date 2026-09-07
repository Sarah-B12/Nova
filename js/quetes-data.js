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
const QUETES = [
  {
    id:"q1",
    nom:"Le relais de Braise",
    donneur:"Vieux Sorn",
    // ⚠ Coordonnées approximatives (monde 2400×1600) — à ajuster en jouant.
    // Fil rouge : les quatre balises rediffusent un même vieil ordre, en morceaux.
    //   « …toutes unités… maintenir le périmètre… jusqu'au retour… de la mère. »
    // Sorn l'explique trop vite à la balise 2, et se tait à la balise 4.
    // AUCUN défi ratable ici : première quête, on ne verrouille jamais un débutant.
    intro:[
      "Un vieux bonhomme voûté te jauge de son unique œil valide — l'autre disparaît sous un bandeau d'implants qui grésille par intermittence. « Encore un bleu qui croit qu'on survit ici avec du courage et un joli sac. »",
      "Il crache par terre, puis désigne du menton un boîtier fumant sur son établi. « J'ai réveillé un vieux relais du Protocole. Il recrache d'anciennes coordonnées — quatre balises. Moi, mes genoux rendent l'âme avant la première. »",
      "« Toi, tu vas les suivre et me rapporter ce qu'elles disent. Je te paie, et personne ne pleure. Enfin… si tu reviens. » Un rictus fend sa barbe grise. « Ce que je ne garantis pas, gamin. »",
      "Il te tend une oreillette cabossée. « Je te guide d'ici. Préviens-toi tout de suite : mon décodeur crache des zones, pas des points. Je te dirai où chercher, à toi de fouiller le coin. »"
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
        defi:{ type:"enigme",
          texte:"Le relais interrompt sa litanie et module sa question dans un français d'un autre âge :",
          question:"« Je grandis en dévorant, je meurs en buvant. Que suis-je ? »",
          reponses:["le feu","feu","la flamme","flamme"],
          indice:"Il danse en permanence sur les pentes d'Ignis.",
          reussite:[
            "À peine ta réponse prononcée, le relais s'affaisse et se met à fondre — pourtant, sous tes doigts, le métal reste étrangement froid. De la coulée figée émerge un carré de papier, intact, couvert de coordonnées tracées à la main.",
            "Tu essuies la bouillasse tiède sur ta combinaison et déplies le feuillet. La radio grésille. « Fais voir… ouais. Ça pointe vers le froid. Là où même l'eau renonce à geler. » Une pause. « On se rapproche, gamin. »"
          ] } },

      /* ---- 2. La borne givrée — ATTENTE (non ratable) ---- */
      { indice:"Le froid, maintenant. Lisière sud de la cité de glace, là où l'eau refuse encore de prendre. Cherche dans ce secteur.",
        cible:{ x:1960, y:600, r:80 }, leurres:[ {x:700,y:300,r:80}, {x:1150,y:1050,r:80}, {x:2000,y:1300,r:80} ],
        image:"images/quetes/q1/2.png",
        arrivee:[
          "Une borne émerge de la neige, prise dans une gangue de glace épaisse comme un poing. L'écran vit encore dessous, vert pâle, mais aucune commande ne répond.",
          "« Elle est gelée jusqu'aux entrailles », grogne Sorn. « Force pas, tu la casseras. Ces trucs-là se réchauffent tout seuls quand on les sollicite — mets la main dessus et attends. Va faire un tour si t'as la bougeotte, elle t'attendra. »",
          "Sa voix baisse d'un cran. « La Toundra… j'y ai laissé des choses, autrefois. Des gens, surtout. » Un silence de givre. « …Bref. »"
        ],
        defi:{ type:"attente", duree:45000,
          texte:["Tu poses la paume sur la gangue. Sous la glace, quelque chose se remet lentement à tourner.",
                 "Lance le réchauffage, puis laisse-la travailler — tu peux t'éloigner et revenir."],
          reussite:[
            "La borne dégèle d'un coup dans un cliquetis mécanique. L'écran s'anime et débite une bribe d'un vieux message, la même voix que la première balise, deux mots plus loin : « …maintenir le périmètre… »",
            "Une plaque de glace glisse et révèle un renfoncement où pulse une graine luminescente, gravée de nouvelles coordonnées.",
            "« Maintenir le périmètre, maintenir le périmètre… » Sorn souffle par le nez. « Quarante ans qu'ils montent la garde devant une porte que plus personne ne franchira. Voilà ce que c'est, le Protocole : des chiens qui attendent un maître mort. »"
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
            "Tu cales les composants dans le logement. Le relais avale le courant d'un coup et parle, la même voix, deux mots plus loin encore : « …jusqu'au retour… »",
            "Puis il recrache une dernière série de coordonnées — vers l'ouest, vers l'anneau. La radio reste muette une seconde de trop.",
            "« Vers l'ouest ? » La voix de Sorn a changé de texture. « Bon. Vas-y. Mais tu t'approches pas de l'anneau, t'entends ? Tu restes au seuil. »"
          ] } },

      /* ---- 4. Le seuil — ÉNIGME retournée (essais illimités) ---- */
      { indice:"Ouest. Jusqu'à voir l'anneau — et pas un pas de plus. Tu t'arrêtes au seuil, c'est pas négociable.",
        cible:{ x:620, y:1000, r:80 }, leurres:[ {x:1300,y:1250,r:80}, {x:900,y:220,r:80}, {x:1700,y:1150,r:80} ],
        image:"images/quetes/q1/4.png",
        arrivee:[
          "L'anneau du Protocole occupe tout l'horizon, violet et silencieux. La dernière balise est plantée là, face à lui, comme une sentinelle qui aurait oublié de mourir.",
          "Elle ne pose pas de devinette. Elle demande une identification, et l'écran attend, curseur clignotant, le nom de la station où tu te trouves."
        ],
        defi:{ type:"enigme",
          texte:"IDENTIFICATION REQUISE. NOMMEZ LA STATION.",
          question:"« Quel est le nom de ce secteur ? »",
          reponses:["silene","silène","secteur silene","secteur silène"],
          indice:"C'est écrit en haut de ton écran depuis le premier jour.",
          reussite:[
            "Tu tapes le seul nom que tu connaisses. L'écran le digère une seconde de trop, puis répond :",
            "SILÈNE — TERME NON RÉPERTORIÉ. STATION : MAAR-3. DERNIER ORDRE : MAINTENIR JUSQU'AU RETOUR DE LA MÈRE.",
            "« La mère, la base-mère », lâche Sorn sans que tu aies rien demandé. « Le vaisseau de la corpo. Ils appelaient tous ça comme ça, à l'époque. Rien de mystique, gamin, arrête de faire cette tête. »",
            "Il enchaîne aussitôt, un ton plus haut : « Et Silène non répertorié, forcément. Les machines connaissent que les matricules. MAAR-3, MAAR-12, va savoir. C'est des machines. »",
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
    //   1. il connaît les codes · 2. il est sur un registre d'équipe
    //   3. il y est barré (« déserteur ») · 4. il a obéi, et des gens sont restés dehors.
    // ⚠ Le signataire de l'ordre reste ILLISIBLE : le lien Maar/Mère ne se dévoile pas ici.
    intro:[
      "Sorn ne lève pas les yeux de son établi quand tu pousses la porte. Il démonte le même connecteur depuis un moment, et le remonte, et le redémonte.",
      "« Le truc, à l'anneau. Ce qu'il t'a sorti. » Il repose son tournevis, très lentement. « Un ordre qui tourne encore. Ça veut dire que quelqu'un l'a signé, et que personne ne l'a jamais annulé. »",
      "« Je veux savoir qui. » Il te regarde enfin, et pour une fois il n'y a aucune moquerie dedans. « Trois endroits. Tu me rapportes ce que tu trouves, et tu poses pas de questions. Marché ? »"
    ],
    etapes:[

      /* ---- 1. L'atelier enseveli — CADENAS (ratable, mais rendu facile par Sorn) ---- */
      { indice:"Toundra, à l'écart de la cité. Sous la neige, un poste de maintenance. Personne l'a rouvert depuis. Personne.",
        cible:{ x:2050, y:250, r:80 }, leurres:[ {x:1200,y:900,r:80}, {x:600,y:1300,r:80}, {x:1650,y:520,r:80} ],
        image:"images/quetes/q2/1.png",
        arrivee:[
          "Une trappe affleure sous la poudreuse, marquée d'un sigle du Protocole à demi effacé. Le sas est verrouillé par un cadenas à glyphes, de ceux qu'on ouvrait au chalumeau faute de mieux.",
          "« Perds pas ton temps à le forcer. » Sorn s'est manifesté avant même que tu ne demandes. Un silence. « Ils utilisaient jamais plus de trois glyphes. Et toujours dans le même petit jeu. Essaie, tu verras. »",
          "Tu ne lui demandes pas comment il le sait. Il ne te le dirait pas."
        ],
        defi:{ type:"cadenas", longueur:3, symboles:["●","■","▲","◆"], essais:8,
          texte:["Trois logements, quatre glyphes possibles. Le sas te dira, à chaque tentative, combien sont bien placés."],
          reussite:[
            "Le sas cède avec un soupir d'air comprimé vieux de quarante ans. À l'intérieur : un établi, des outils rangés au carré, une combinaison pliée sur un tabouret. Quelqu'un est parti d'ici en pensant revenir.",
            "Tu ramasses un carnet de maintenance. Des relevés, des dates, des signatures abrégées.",
            "« Alors ? » La voix de Sorn est trop neutre. « …Bon. Y a un registre d'équipe quelque part au nord-ouest. Va le chercher. »"
          ] } },

      /* ---- 2. Le registre d'équipe — ORDRE (ratable) ---- */
      { indice:"À l'opposé, maintenant. L'angle le plus reculé du nord-ouest, loin de tout. Y avait de l'administratif là-bas.",
        cible:{ x:430, y:380, r:80 }, leurres:[ {x:1600,y:1200,r:80}, {x:1150,y:700,r:80}, {x:2100,y:500,r:80} ],
        image:"images/quetes/q2/2.png",
        arrivee:[
          "Un bloc administratif écrasé sous son propre toit. Dans ce qui fut un bureau, une console de registre tient encore debout, alimentée par on ne sait quoi.",
          "L'écran demande la reconstitution de l'ordre d'affectation de l'équipe de maintenance — une vérification de routine, pour un personnel qui n'existe plus depuis quarante ans."
        ],
        defi:{ type:"ordre",
          texte:["Sept noms flottent à l'écran, dans le désordre. La console attend leur ordre d'affectation."],
          consigne:"Du premier affecté au dernier arrivé.",
          elements:["Vareck, D. — chef d'équipe","Sorn, E. — technicien relais","Adaya, P. — technicienne","Loew, M. — logistique","Trebbe, S. — logistique","Nyandu, K. — apprenti","Ivar, R. — apprenti"],
          reussite:[
            "La console valide et affiche la fiche complète de l'équipe. Ton regard s'arrête à la deuxième ligne.",
            "SORN, E. — TECHNICIEN RELAIS — STATUT : DÉSERTION. RADIÉ. NE PAS RÉINTÉGRER.",
            "Tu appelles. Pas de réponse. Tu appelles encore. La radio reste muette pendant tout le trajet du retour, et quand elle se rallume enfin, c'est pour dire, très vite : « Y a un péage mort dans les vieilles galeries du sud-ouest. Il lui faut de la monnaie. Vas-y. »",
            "Et rien d'autre."
          ] } },

      /* ---- 3. Le péage mort — PAIEMENT (non ratable) ---- */
      { indice:"Vieilles galeries du sud-ouest. Un portique qui réclame encore son dû. Prends de la monnaie.",
        cible:{ x:820, y:500, r:80 }, leurres:[ {x:1450,y:1100,r:80}, {x:1900,y:250,r:80}, {x:1000,y:1350,r:80} ],
        image:"images/quetes/q2/3.png",
        arrivee:[
          "Le portique se dresse au milieu de nulle part, barrant une galerie qui ne mène plus à rien. Un lecteur de crédits clignote, patient, impeccablement entretenu par ses propres automatismes.",
          "REDEVANCE D'ACCÈS — PERSONNEL AUTORISÉ UNIQUEMENT. Quarante ans que la machine facture le passage à des ouvriers qui ne viendront pas.",
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
          "L'émetteur est une colonne noire plantée face à l'anneau. Aucune arme, aucune défense : juste une voix qui répète un ordre depuis quarante ans, dans le vide.",
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
            "« C'est moi qui ai coupé le relais de la Toundra. » La voix arrive sans prévenir, très calme. « On m'a dit de fermer la boucle, j'ai fermé la boucle. C'est mon travail. C'était mon travail. »",
            "« Y avait quatre-vingts personnes dehors. Elles avaient jusqu'au soir pour rentrer. Après ma coupure, elles avaient plus rien pour se faire rappeler. »",
            "Un long silence, puis un rire bref, pas drôle du tout. « J'ai déserté trois jours plus tard. Trois jours. Tu vois le courage. »",
            "« Voilà. T'es content ? » Un cliquetis : il te vire ta paie avant que tu répondes. « Rentre. Et va pas t'imaginer qu'on est amis. »"
          ] } }
    ],
    recompense:{ credits:250, xp:40, pa:1, flags:{} }
  },

  {
    id:"q3",
    nom:"La fleur qui n'aurait pas dû",
    donneur:"Adaya",
    donneurLieu:"Serre des Cultivateurs",
    // Première quête sans Sorn : Adaya, 3e ligne du registre d'équipe de Q2.
    // Elle était DEHORS le jour de la fermeture. Elle est rentrée à pied.
    // Premier défi « choix » de la campagne (site 3) : savoir / vivant / profit.
    // Gains SEULEMENT (pas de malus tant que les joueurs n'ont rien accumulé).
    // Le moteur gère pourtant les valeurs négatives : à envisager plus tard.
    intro:[
      "La vieille femme t'attend sous la verrière, les mains dans un bac de terreau noir. Elle ne se retourne pas tout de suite.",
      "« Adaya. » Elle s'essuie enfin les paumes. « On m'a dit qu'un bleu était allé fouiller un registre d'équipe au nord-ouest. Un registre où j'ai un nom, figure-toi. Troisième ligne. »",
      "Elle te laisse encaisser, puis désigne du menton un bocal posé sur l'établi : une tige pâle, luminescente, qui pulse doucement dans son bouillon.",
      "« Ça, ça pousse le long de l'ancien périmètre. Exactement le long. Sur une terre où rien ne prend depuis quarante ans. » Elle te regarde. « J'aimerais comprendre avant de mourir. Tu m'aides ? »",
      "Elle t'accroche une oreillette au col — la même camelote que celle de Sorn, en mieux entretenue. « Je te guide. Je serai précise sur le pourquoi, approximative sur le où. La carte date d'avant. »"
    ],
    etapes:[

      /* ---- 1. La serre obstinée — LIVRAISON (non ratable) ---- */
      { indice:"Reste au vert, chez nous, dans les cultures : il me manque de quoi monter un bain d'analyse. Fouille les serres du secteur.",
        cible:{ x:1250, y:770, r:90 }, leurres:[ {x:1900,y:400,r:80}, {x:700,y:1250,r:80}, {x:1500,y:150,r:80} ],
        image:"images/quetes/q3/1.png",
        arrivee:[
          "Les serres des Cultivateurs bourdonnent d'insectes pollinisateurs relâchés là depuis des générations. Adaya a monté sa paillasse entre deux rangs de ferragave, comme si de rien n'était.",
          "« Avant de courir dehors, on prépare le bain. Sans milieu de culture, ton échantillon sera bon à jeter en deux heures. »"
        ],
        defi:{ type:"livraison",
          objets:{ sylve:3, sporelle:2 },
          texte:["Il lui faut de la Sylve pour le substrat et de la Sporelle pour la culture. Ça pousse dans le coin, ou ça s'achète."],
          reussite:[
            "Elle broie, filtre, verse. Ses gestes ont la précision d'un métier qu'on n'oublie pas.",
            "« J'étais dehors, ce jour-là. Relevé de sondes, secteur nord. » Elle ne lève pas les yeux de sa pipette. « J'ai vu le périmètre se fermer d'un coup, comme une paupière. Et plus de radio. »",
            "« Je suis rentrée à pied. Onze jours. » Un temps. « On était douze à partir ce matin-là. »",
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
        defi:{ type:"sequence", longueur:5,
          texte:["Les corolles s'illuminent l'une après l'autre, puis s'éteignent. Reproduis la séquence."],
          reussite:[
            "Le motif se répète, identique, à la seconde près. Ce n'est pas une plante qui pousse : c'est une plante qui compte.",
            "Un long silence dans l'oreillette. « …Répète-moi ça. » Adaya te fait recommencer deux fois. Puis, très bas : « Elles suivent une horloge. »",
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
        defi:{ type:"attente", duree:60000,
          texte:["La centrifugeuse tourne. Rien à faire qu'attendre — tu peux t'éloigner et revenir."],
          reussite:[
            "« La plante n'est pas d'ici. » Adaya pose ses lunettes. « Enfin — elle n'est pas d'ici comme le reste n'est pas d'ici. Elle est arrivée avec nous. Elle a juste mieux tenu le coup. »",
            "« Et elle compte quelque chose. Un intervalle. Je saurai pas te dire quoi, pas avec ce que j'ai, pas avec ce qu'il me reste de temps. »",
            "Elle range ses flacons un long moment. Puis, sans se retourner : « E. Sorn. Le technicien relais. Il est vivant ? »",
            "Tu réponds. Elle hoche la tête, une seule fois, et ne demande rien d'autre — ni où, ni comment, ni pourquoi il n'est jamais venu.",
            "« Reviens quand tu veux, petit. La serre est ouverte. »"
          ] } }
    ],
    recompense:{ credits:350, xp:55, pa:1, flags:{} }
  },

  {
    id:"q4",
    nom:"Ce qui dormait",
    donneur:"Vieux Sorn",
    // L'intervalle de la silène (Q3) n'est pas une horloge : c'est un compte à rebours
    // qui converge vers le poste d'embarquement de l'évacuation.
    // ⚠ CONTRÔLE DE NIVEAU : combat puissance 22 au site 3.
    //   Base 10/10/10 + 3 pts/niveau -> victoire nette vers le niveau 5 en spécialisé,
    //   arrachée dès 16, échec sous 16 (personnage qui n'a rien dépensé).
    // Le manifeste du site 4 amorce Q5 : une navette encore enregistrée à quai.
    intro:[
      "Sorn t'attend debout, ce qui ne lui ressemble pas. Il a un papier à la main — le relevé d'Adaya, transmis par tu ne sais quel détour.",
      "« Elle dit que ta fleur compte un intervalle. Elle a raison. » Il pose le papier. « Sauf que c'est pas une horloge, gamin. Une horloge, ça tourne en rond. Ça, ça descend. »",
      "Il te laisse trouver le mot tout seul, et comme tu ne le trouves pas assez vite : « Un compte à rebours. Qui converge quelque part. »",
      "« Et je sais où ça converge, parce que j'y étais. » Il décroche l'oreillette du clou. « L'embarquement. Tu vas y aller, et moi je vais te guider, et après ça on n'en parle plus jamais. »"
    ],
    etapes:[

      /* ---- 1. Le point de convergence — GLYPHES (ratable) ---- */
      { indice:"Reprends le ruban de fleurs et remonte-le vers l'ouest, là où il se resserre. La signalétique du Protocole tient encore debout par là.",
        cible:{ x:760, y:660, r:80 }, leurres:[ {x:1500,y:1150,r:80}, {x:1950,y:480,r:80}, {x:1050,y:1400,r:80} ],
        image:"images/quetes/q4/1.png",
        arrivee:[
          "Les tiges se resserrent en un faisceau qui ne laisse plus de doute sur la direction. À l'endroit où elles convergent, des panneaux de service émergent du sol, leurs pictogrammes encore lisibles sous la poussière.",
          "« Je connais ces symboles par cœur », grogne Sorn. « J'aurais préféré mourir sans les revoir. Apparie-les, ils t'indiqueront la porte de service. »"
        ],
        defi:{ type:"glyphes",
          texte:["Six panneaux de service, six glyphes du Protocole. Rends à chacun son sens."],
          consigne:"Associe chaque pictogramme à sa signification.",
          paires:[
            { picto:"⛨", glyphe:"ΛΞ", sens:"Périmètre" },
            { picto:"⌁", glyphe:"ΘΘ", sens:"Alimentation" },
            { picto:"⚑", glyphe:"ΨΔ", sens:"Point de rassemblement" },
            { picto:"⏱", glyphe:"ΞΞ", sens:"Départ programmé" },
            { picto:"⚕", glyphe:"ΦΛ", sens:"Poste médical" },
            { picto:"⛔", glyphe:"ΔΔ", sens:"Accès restreint" }
          ],
          distracteurs:["Zone de forage","Réfectoire","Quarantaine"],
          reussite:[
            "Les panneaux racontent tous la même chose : ici, on rassemblait, on soignait, et on partait. À heure fixe.",
            "Une flèche à demi effacée pointe vers un talus. Dessous, une porte de service, close.",
            "« Voilà. » La voix de Sorn s'est éteinte d'un cran. « Le hangar est derrière. »"
          ] } },

      /* ---- 2. La pile morte — LIVRAISON (non ratable) ---- */
      { indice:"La porte de service est juste à côté, mais elle n'a plus de jus depuis quarante ans. Trouve de quoi la réveiller.",
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
          "ACCÈS RESTREINT. ÉVACUATION EN COURS. VEUILLEZ REJOINDRE LE POINT DE RASSEMBLEMENT.",
          "« Elle croit encore que l'embarquement a lieu aujourd'hui », souffle Sorn. « Quarante ans qu'elle attend qu'on lui dise que c'est fini. Personne l'a jamais fait. »"
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
          "EMBARQUÉS : 1 244. NON EMBARQUÉS : ___. CLÔTURE IMPOSSIBLE — SAISIE MANQUANTE.",
          "La machine attend depuis quarante ans qu'un opérateur lui donne le chiffre pour pouvoir refermer son registre."
        ],
        defi:{ type:"enigme",
          texte:"NON EMBARQUÉS — SAISIE REQUISE POUR CLÔTURE.",
          question:"« Combien de personnes sont restées dehors ? »",
          reponses:["80","quatre-vingts","quatre vingts","quatre-vingt","80 personnes"],
          indice:"Sorn te l'a dit lui-même, à l'émetteur : elles avaient jusqu'au soir pour rentrer.",
          reussite:[
            "Tu saisis le chiffre. Le registre se clôt dans un déclic minuscule, et l'écran affiche, pour la première fois depuis quarante ans : ROTATION CLÔTURÉE.",
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
    // Dernière vérité de Sorn : il est RADIÉ (« NE PAS RÉINTÉGRER », lu en Q2).
    // Il n'a jamais cherché la navette parce que la trouver l'obligerait à
    // constater qu'il ne peut pas monter dedans. Il ne demandera rien.
    intro:[
      "Sorn n'a pas dormi. Ça se voit à sa façon de tenir sa tasse à deux mains.",
      "« Un appareil de réserve, c'était dans les procédures. Une navette qu'on laisse à quai au cas où. » Il hausse les épaules, trop vite. « Je savais qu'il devait y en avoir une. J'ai jamais cherché. »",
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
            "Sorn ne dit rien pendant un long moment. Puis : « Elle est propre. L'entretien automatique a tenu quarante ans. » Sa voix se casse à peine. « Ces machines-là aussi, elles ont fait leur boulot. »"
          ] } },

      /* ---- 2. Le dépôt de pièces — PAIEMENT ---- */
      { indice:"Y a un dépôt corporatif à l'étage au-dessus. Il facture encore. Prends de quoi payer, il négocie pas.",
        cible:{ x:660, y:420, r:80 }, leurres:[ {x:1250,y:1100,r:80}, {x:1750,y:300,r:80}, {x:2050,y:900,r:80} ],
        image:"images/quetes/q5/2.png",
        arrivee:[
          "Le dépôt a survécu à tout, y compris à la fin du monde qui l'employait. Derrière une vitre blindée, des rechanges alignés au cordeau, et un terminal de facturation d'une politesse insupportable.",
          "L'entretien automatique de la navette a consommé ses stocks depuis des décennies. Il lui faut des joints, un régulateur, une cellule neuve.",
          "« Paie », soupire Sorn. « Comme le péage. Elles ont pas d'avis, elles ont un tarif. »"
        ],
        defi:{ type:"paiement", cout:800,
          texte:["Le terminal affiche la note. Elle est salée, et parfaitement indifférente à ta situation."],
          reussite:[
            "Le bras de service délivre les pièces une à une, avec des précautions dérisoires, et te souhaite une bonne rotation.",
            "Tu remontes les bras chargés. La navette, elle, n'a pas bougé d'un millimètre depuis quarante ans."
          ] } },

      /* ---- 3. Le réveil — MÉMOIRE (ratable) ---- */
      { indice:"Retourne au quai et monte à bord. Elle va te demander de répéter sa séquence d'allumage — c'est sa façon de vérifier qu'elle a un équipage.",
        cible:{ x:600, y:480, r:80 }, leurres:[ {x:1350,y:700,r:80}, {x:1850,y:1000,r:80}, {x:950,y:1300,r:80} ],
        image:"images/quetes/q5/3.png",
        arrivee:[
          "L'habitacle sent le plastique neuf et l'air recyclé mille fois. Les sièges n'ont jamais été occupés. Sur la console, un mot manuscrit, scotché puis oublié : « pour la dernière rotation ».",
          "Tu poses les pièces. La navette s'éveille, teste ses circuits un par un, puis affiche une séquence lumineuse et attend."
        ],
        defi:{ type:"memoire",
          texte:["VÉRIFICATION D'ÉQUIPAGE. RÉPÉTEZ LA SÉQUENCE D'ALLUMAGE."],
          reussite:[
            "Les réacteurs de manœuvre s'amorcent dans un souffle grave qui fait vibrer tout le quai. Au-dessus, une trappe de plafond commence à s'écarter sur un morceau de ciel.",
            "« Elle marche. » Sorn a un rire bref, incrédule. « Bon sang, elle marche. »"
          ] } },

      /* ---- 4. Le rôle d'équipage — CHOIX (narratif + Cercles) ---- */
      { indice:"Reste à bord. Elle va te demander un cap. Réfléchis avant de répondre — c'est le genre de question qu'on te pose une fois.",
        cible:{ x:600, y:480, r:80 }, leurres:[ {x:1500,y:1250,r:80}, {x:2000,y:600,r:80}, {x:1100,y:250,r:80} ],
        image:"images/quetes/q5/4.png",
        arrivee:[
          "RÔLE D'ÉQUIPAGE — POSTE VACANT. INSCRIPTION ACCEPTÉE. La navette vient de t'enregistrer sans cérémonie, comme elle l'aurait fait il y a quarante ans.",
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
            "Derrière toi, le lecteur d'identité émet un bip bref. IDENTITÉ RADIÉE — ACCÈS REFUSÉ. STATUT : DÉSERTION.",
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
