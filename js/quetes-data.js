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
     images/quetes/sorn.png            → bannière fixe du Vieux Sorn (comptoir).
     images/quetes/<questid>/<n>.png   → ambiance de l'étape n (ex. images/quetes/q1/1.png).
   Monde : 2400 × 1600. Coordonnées approximatives, à ajuster.
   =========================================================== */
const QUETES = [
  {
    id:"q1",
    nom:"Le relais de Braise",
    donneur:"Vieux Sorn",
    intro:[
      "Un vieux bonhomme voûté te jauge de son unique œil valide — l'autre disparaît sous un bandeau d'implants qui grésille par intermittence. « Encore un bleu qui croit qu'on survit ici avec du courage et un joli sac. »",
      "Il crache par terre, puis désigne du menton un boîtier fumant sur son établi. « J'ai réveillé un vieux relais du Protocole. Il recrache d'anciennes coordonnées — quatre balises. Moi, mes genoux rendent l'âme avant la première. »",
      "« Toi, tu vas les suivre et me rapporter ce qu'elles disent. Je te paie, et personne ne pleure. Enfin… si tu reviens. » Un rictus fend sa barbe grise. « Ce que je ne garantis pas, gamin. »"
    ],
    etapes:[
      { indice:"Cherche près d'un point chaud mais à portée de l'écume : là où la roche de la Forge plonge vers l'océan, au nord.",
        cible:{ x:1050, y:140, r:80 }, leurres:[ {x:1850,y:170,r:80}, {x:300,y:780,r:80}, {x:1500,y:1420,r:80} ],
        image:"images/quetes/q1/1.png",
        arrivee:[
          "La roche tiède fume doucement sous tes bottes. Un relais à demi enfoui clignote dans la caillasse ; une voix synthétique en jaillit, distordue.",
          "Ta radio crachote. « T'es arrivé ? Étonnant. Le relais va te poser une devinette débile — le Protocole adore ça, il teste avant de parler. Débrouille-toi, j'ai pas que ça à faire. »"
        ],
        defi:{ type:"enigme",
          texte:"Le relais module sa question dans un français d'un autre âge :",
          question:"« Je grandis en dévorant, je meurs en buvant. Que suis-je ? »",
          reponses:["le feu","feu","la flamme","flamme"],
          indice:"Il danse en permanence sur les pentes d'Ignis.",
          reussite:[
            "À peine ta réponse prononcée, le relais s'affaisse et se met à fondre — pourtant, sous tes doigts, le métal reste étrangement froid. De la coulée figée émerge un carré de papier, intact, couvert de coordonnées tracées à la main.",
            "Tu essuies la bouillasse tiède sur ta combinaison et déplies doucement le feuillet. La radio grésille. « Fais voir… ouais. Ça pointe vers le froid, ça. Là où même l'eau renonce à geler. » Sorn marque une pause. « On se rapproche, gamin. »"
          ] } },

      { indice:"Descends là où l'eau refuse de geler malgré le froid : à la lisière sud de la cité de glace.",
        cible:{ x:1960, y:600, r:80 }, leurres:[ {x:700,y:300,r:80}, {x:1150,y:1050,r:80}, {x:2000,y:1300,r:80} ],
        image:"images/quetes/q1/2.png",
        arrivee:[
          "Une borne givrée émerge de la neige, l'écran encore vivant malgré les décennies d'abandon.",
          "Sorn, dans la radio, plus bas : « La Toundra… j'y ai laissé des choses, autrefois. Des gens, surtout. » Un silence de givre. « …Bref. Fais parler cette borne et arrête de m'écouter divaguer. »"
        ],
        defi:{ type:"enigme",
          texte:"La borne réclame un code de passage :",
          question:"« Combien de factions se partagent Silène ? (en chiffres) »",
          reponses:["5","cinq"],
          indice:"Ignis, le Rhizome, la Toundra, le Rouage, les Nomades.",
          reussite:[
            "La borne givrée avale ta réponse dans un cliquetis mécanique, puis dégèle d'un coup : une plaque de glace glisse et révèle un renfoncement où pulse une graine luminescente, gravée de nouvelles coordonnées.",
            "« Une graine ? » La voix de Sorn se fait songeuse. « Elles nous envoient au vert, maintenant. Là où l'air se cultive tout seul. » Un reniflement. « Prends soin de ce truc — il vaut sûrement plus cher que toi. »"
          ] } },

      { indice:"Enfonce-toi au cœur vert du monde, là où l'air lui-même se cultive.",
        cible:{ x:1250, y:900, r:80 }, leurres:[ {x:400,y:400,r:80}, {x:1900,y:900,r:80}, {x:800,y:1300,r:80} ],
        image:"images/quetes/q1/3.png",
        arrivee:[
          "Sous la canopée luminescente, une console de sève palpite au rythme lent d'un cœur endormi.",
          "La voix de Sorn se fait presque douce. « Le Rhizome. Les seuls, sur ce caillou, à recycler l'air sans te le facturer. Si un jour tu manques d'O₂, souviens-toi d'eux — pas de moi. »"
        ],
        defi:{ type:"enigme",
          texte:"La console de sève murmure une énigme :",
          question:"« Dans le bio-dôme, qu'est-ce qui recycle l'air que tu respires ? »",
          reponses:["les plantes","la flore","photosynthese","la photosynthese","les plantes du bio-dome"],
          indice:"Elles font ce que fait l'aptitude Photosynthèse.",
          reussite:[
            "La console de sève frémit ; une sève dorée sourd de ses jointures et dessine lentement, sur l'écorce, une carte qui palpite comme une veine vivante. Un dernier point y bat, loin vers l'est.",
            "« Ah. » Sorn n'a pas l'air ravi. « Le dernier point, c'est chez les charognards. La ferraille, la rouille, les carcasses. » Il soupire dans la radio. « Termine ça et rentre. J'ai… des choses à te dire. »"
          ] } },

      { indice:"Termine là où tout se démonte et se répare : parmi les carcasses dressées à l'est.",
        cible:{ x:2050, y:1050, r:80 }, leurres:[ {x:600,y:600,r:80}, {x:1300,y:200,r:80}, {x:1000,y:1400,r:80} ],
        image:"images/quetes/q1/4.png",
        arrivee:[
          "Au pied d'une tour de ferraille grinçante, un terminal du Rouage s'éveille dans une gerbe d'étincelles.",
          "Sorn : « Les charognards du Rouage. Ils rendent la moitié de ce qu'on démonte. Le Protocole, lui, ne rend jamais rien. » Sa voix se durcit d'un coup. « Jamais. »"
        ],
        defi:{ type:"enigme",
          texte:"Le terminal grince sa dernière question :",
          question:"« Démolir une structure en récupère la moitié. Comment nomme-t-on le fait de tout réutiliser ainsi ? »",
          reponses:["recyclage","le recyclage","recycler"],
          indice:"C'est aussi le nom d'un nœud d'aptitude du Rouage.",
          reussite:[
            "Le terminal du Rouage crache une dernière ligne de données puis s'éteint dans un grésillement. Les quatre balises ont parlé. Dans ta main, le papier, la graine et un éclat de circuit s'assemblent presque comme les morceaux d'une même phrase.",
            "Long silence sur la radio. Puis, plus bas que d'habitude : « …C'est bon. Tu as tout. Rentre au comptoir, gamin. On parlera. Pour de vrai, cette fois. »"
          ] } }
    ],
    recompense:{ credits:600, pa:1, objets:{ fab_kit_de_soin:1 }, flags:{} }
  },

  {
    id:"q2",
    nom:"L'écho du Protocole",
    donneur:"Vieux Sorn",
    intro:[
      "Sorn t'attend, adossé à son établi, plus sombre que d'habitude. « Assieds-toi. Non — reste debout, tu me fatigues rien qu'à te regarder. »",
      "« Ton relais n'a pas fait que cracher des chiffres. Il a prévenu quelqu'un. Le Protocole s'agite. » Il tapote le bandeau qui grésille sur son œil. « Je le sens. Là-dedans. Ne me demande pas comment. »",
      "« Trois endroits à vérifier. Tu approches l'anneau sans entrer — j'insiste là-dessus — et tu me rapportes ce que tu trouves. Cette fois, ce n'est pas pour l'argent, gamin. C'est pour tout le monde. »"
    ],
    etapes:[
      { indice:"Approche l'anneau violet sans jamais entrer : reste sur le fil, au sud-ouest.",
        cible:{ x:650, y:1000, r:80 }, leurres:[ {x:1400,y:300,r:80}, {x:1900,y:700,r:80}, {x:1000,y:1450,r:80} ],
        image:"images/quetes/q2/1.png",
        arrivee:[
          "L'air crépite d'électricité statique ; tes poils se hérissent. Une balise clandestine attend, à un souffle de l'anneau violet interdit.",
          "La voix de Sorn est tendue comme jamais. « N'entre pas. Quoi qu'elle te montre, quoi qu'elle te promette — n'entre pas dans cet anneau. J'ai vu ce que ça fait aux gens. J'ai vu. »"
        ],
        defi:{ type:"enigme",
          texte:"La balise pose sa question d'une voix glaçante :",
          question:"« Quel est le nom de l'ennemi commun à toutes les factions ? »",
          reponses:["le protocole","protocole"],
          indice:"Tu ne peux même pas entrer dans sa zone sur la carte.",
          reussite:[
            "La balise s'éteint net dès ta réponse, comme si le simple mot l'avait blessée. Un ultime spasme lumineux crache une série de coordonnées vers le nord-ouest lointain.",
            "« Bien. Maintenant éloigne-toi de cet anneau. Doucement. » Sorn respire fort dans la radio. « Le prochain point… je le connais. Trop bien. Vas-y. Tu comprendras. »"
          ] } },

      { indice:"File à l'opposé, dans l'angle le plus reculé du nord-ouest, loin de tout.",
        cible:{ x:430, y:380, r:80 }, leurres:[ {x:1600,y:1200,r:80}, {x:1150,y:700,r:80}, {x:2100,y:500,r:80} ],
        image:"images/quetes/q2/2.png",
        arrivee:[
          "Un vieux poste d'observation, oublié depuis des années, tient encore debout contre le vent, ses antennes ployées.",
          "Sorn, presque un murmure : « Ce poste… c'est moi qui l'ai monté. Avant. Quand je croyais encore qu'on pouvait les surveiller sans finir comme eux. » Un rire amer racle la radio. « Regarde le message et ne me pose pas de questions. »"
        ],
        defi:{ type:"enigme",
          texte:"Un message enregistré tourne en boucle sur un écran fissuré :",
          question:"« Face au Protocole, les factions oublient leurs querelles et forment une… ? »",
          reponses:["coalition","une coalition","alliance","une alliance"],
          indice:"On la monte au Centre, dans les Guerres de faction… sauf contre lui.",
          reussite:[
            "L'écran fissuré du vieux poste s'illumine une dernière fois, puis rend l'âme dans une gerbe d'étincelles. À côté, sur le mur, une inscription à demi effacée : deux initiales, gravées au couteau. Tu n'oses pas demander.",
            "La radio reste muette un long moment. Puis : « …Rejoins le campement du sud. Je t'y attends. En personne. Il est temps qu'on se regarde en face, toi et moi. »"
          ] } },

      { indice:"Rejoins le grand campement du sud pour transmettre tout ce que tu as appris.",
        cible:{ x:1250, y:1400, r:80 }, leurres:[ {x:500,y:700,r:80}, {x:1800,y:300,r:80}, {x:2000,y:1100,r:80} ],
        image:"images/quetes/q2/3.png",
        arrivee:[
          "Sous les tentes des Nomades, une carte de Silène est étalée, criblée d'épingles rouges. Et pour la première fois, Sorn est là — en personne, plus petit et plus vieux que sa voix ne le laissait croire.",
          "« Alors te voilà. Vivant. » Il te dévisage un long moment de son œil valide. « Tu commences à comprendre pourquoi je reste planqué ici à filer des courses aux bleus, hein ? Une dernière question. Prouve-moi que tu sais disparaître quand il le faut. »"
        ],
        defi:{ type:"enigme",
          texte:"Il croise les bras, attendant :",
          question:"« Voler et pirater relèvent de quelle voie d'aptitude commune à tous ? »",
          reponses:["ombre","la voie ombre","voie ombre","l'ombre"],
          indice:"C'est la voie où vivent Discrétion et Intrusion.",
          reussite:[
            "Sorn t'écoute donner ta réponse, hoche lentement la tête, et pour la première fois quelque chose comme un sourire passe sur son visage buriné. Il replie sa carte criblée d'épingles d'un geste sec.",
            "« L'Ombre. Oui. Garde ça précieusement — un jour, ça te sauvera la peau. » Il te fourre une fiole et une poignée de crédits dans la main sans te regarder. « Va. Tu es prêt pour la suite. Presque. Reviens me voir quand tu te sentiras… plus léger. »"
          ] } }
    ],
    recompense:{ credits:800, pa:1, objets:{ fab_stimulant:1 }, flags:{} }
  },

  {
    id:"q3",
    nom:"Les relais muets",
    donneur:"Vieux Sorn",
    intro:[
      "Sorn t'attend, une carte gribouillée déroulée sur l'établi. « J'ai décidé un truc, gamin : je vais te sortir de ce caillou. Mais pas les mains vides. »",
      "Il pose un doigt calleux sur un chapelet de points. « Le Protocole a fait taire tout un réseau de vieux relais. Si on les rallume, on entend ce qu'il trame — et ça, ça vaut un aller simple pour les étoiles. Cinq points. Cinq emmerdes. »",
      "« Et cette fois, pas de deuxième chance sur les mécanismes : tu foires, tu reviens le lendemain. Le Protocole ne pardonne pas deux fois. Compris ? »"
    ],
    etapes:[
      { indice:"Premier relais, à l'est de la Forge : il est mort faute de pièces. Apporte-lui de quoi respirer.",
        cible:{ x:1600, y:500, r:80 }, leurres:[ {x:500,y:300,r:80}, {x:1100,y:1200,r:80}, {x:2050,y:1300,r:80} ],
        image:"images/quetes/q3/1.png",
        arrivee:[
          "Le relais gît, éventré, un bac de maintenance ouvert à côté. Rien ne clignote.",
          "Radio : « Colle-lui les composants et le câblage que je t'ai dit. Sans ça, il reste aussi muet qu'une pierre. »"
        ],
        defi:{ type:"livraison",
          texte:"Le bac attend les pièces manquantes.",
          objets:{ fab_composant_simple:2, fab_cablage:1 },
          reussite:[
            "Tu enfonces les pièces, refermes le bac d'un coup de paume. Le relais crachote, une diode s'allume, verte et hésitante.",
            "« Ha ! Il vit. » Sorn semble presque surpris. « Le suivant est brouillé, dans la plaine à l'ouest. Faudra le forcer, celui-là. »"
          ] } },

      { indice:"Deuxième relais, dans la plaine à l'ouest : sa sécurité est encore vivante. Il faudra la forcer.",
        cible:{ x:700, y:600, r:80 }, leurres:[ {x:1500,y:200,r:80}, {x:1900,y:900,r:80}, {x:1100,y:1400,r:80} ],
        image:"images/quetes/q3/2.png",
        arrivee:[
          "Ce relais-ci bourdonne, hostile. Un pare-feu matériel clignote au rythme d'un curseur qui balaie une réglette lumineuse.",
          "« Sécurité à l'ancienne », grésille Sorn. « Faut taper pile dans la fenêtre quand elle passe. Trois fois. Et je te préviens : tu n'auras qu'un essai. »"
        ],
        defi:{ type:"piratage", manches:3, vitesse:1400,
          texte:"Le pare-feu attend. Une seule tentative.",
          reussite:[
            "Trois arrêts nets, pile dans le vert. Le pare-feu s'effondre dans un couinement électronique.",
            "« …Propre. » Un silence appréciateur. « Le troisième relais a recraché un mot, mais en glyphes du Protocole. Direction le sud. »"
          ] } },

      { indice:"Troisième relais, enfoui dans le désert au sud : il parle, mais dans la langue du Protocole.",
        cible:{ x:1400, y:1250, r:80 }, leurres:[ {x:400,y:900,r:80}, {x:1900,y:400,r:80}, {x:2100,y:1100,r:80} ],
        image:"images/quetes/q3/3.png",
        arrivee:[
          "À demi ensablée, la balise n'affiche pas un mot mais trois glyphes du Protocole, chacun gravé à côté d'un pictogramme.",
          "« Le Protocole ne parle pas notre langue, gamin, il parle en symboles », marmonne Sorn. « Regarde les pictos à côté, déduis le sens de chaque glyphe. Et réfléchis avant de valider — un seul essai. »"
        ],
        defi:{ type:"glyphes",
          texte:"Trois glyphes, trois pictogrammes pour t'aider à en déduire le sens.",
          consigne:"Associe chaque glyphe à son sens en t'aidant du pictogramme.",
          paires:[
            { glyphe:"⟑", picto:"📡", sens:"signal" },
            { glyphe:"⌇", picto:"⚠", sens:"danger" },
            { glyphe:"⟿", picto:"➜", sens:"aller" }
          ],
          distracteurs:["eau","dormir","feu"],
          reussite:[
            "Dès la dernière association juste, les trois glyphes s'alignent et s'illuminent : SIGNAL — DANGER — ALLER. La balise émet une longue note grave, une position s'inscrit sur ton écran.",
            "« ‹ Signal. Danger. Aller. › » Sorn répète, sombre. « Charmant programme. Le quatrième relais est loin, à l'est — il lance un scan long. Va falloir patienter, gamin. »"
          ] } },

      { indice:"Quatrième relais, une antenne isolée à l'est : elle lance un scan longue portée. Il faudra attendre.",
        cible:{ x:2000, y:800, r:80 }, leurres:[ {x:600,y:1200,r:80}, {x:1200,y:300,r:80}, {x:900,y:900,r:80} ],
        image:"images/quetes/q3/4.png",
        arrivee:[
          "Une antenne squelettique fend le ciel. Dès que tu l'actives, elle entame un balayage lent de l'horizon.",
          "« Rien à forcer ici », dit Sorn. « Juste à attendre que ça scanne. Prends un café. Enfin… si t'as un café. »"
        ],
        defi:{ type:"attente", duree:30000,
          texte:"Le scan longue portée doit tourner un moment.",
          reussite:[
            "Le scan s'achève dans un bip clair. L'antenne recrache les coordonnées du dernier nœud — le nœud central.",
            "« Nous y voilà. Le cœur du réseau. » La voix de Sorn se tend un peu. « Dernière étape. Il faut l'amorcer dans le bon ordre, sinon il se re-verrouille pour de bon. »"
          ] } },

      { indice:"Nœud central, au cœur du monde : amorce-le dans le bon ordre pour réveiller tout le réseau.",
        cible:{ x:1250, y:750, r:80 }, leurres:[ {x:400,y:400,r:80}, {x:1900,y:1300,r:80}, {x:700,y:1300,r:80} ],
        image:"images/quetes/q3/5.png",
        arrivee:[
          "Le nœud central pulse d'une lumière profonde, quatre phases d'amorçage affichées en désordre sur sa console.",
          "« Écoute-moi bien : d'abord tu l'alimentes, ensuite tu vérifies, puis tu synchronises, et seulement là tu émets. Remets ça dans l'ordre. Un essai. »"
        ],
        defi:{ type:"ordre",
          texte:"Remets les phases d'amorçage dans le bon ordre.",
          consigne:"Clique les phases dans l'ordre correct.",
          elements:["Alimentation","Diagnostic","Synchronisation","Émission"],
          reussite:[
            "Les quatre phases s'enclenchent l'une après l'autre. Le nœud s'illumine d'un coup, et au loin, un à un, tous les relais te répondent en écho. Le réseau respire.",
            "Long silence radio. Puis, presque doux : « …Tu as réveillé Silène tout entière, gamin. Reviens au comptoir. On approche du but. »"
          ] } }
    ],
    recompense:{ credits:600, pa:1, objets:{ fab_recharge_d_oxygene:2 }, flags:{} }
    },

  {
    id:"q4",
    nom:"Le port fantôme",
    donneur:"Vieux Sorn",
    intro:[
      "Sorn déplie une image granuleuse sur l'établi : une carcasse de spatioport, hérissée d'antennes mortes. « Voilà où se joue ton permis, gamin. Un vieux port que le Protocole a fait sien. »",
      "« Personne n'en revient. Mais toi, tu vas y entrer, repérer, et ressortir — sans te faire cramer. Six étapes. Et à la fin… » Il hésite. « À la fin, tu sauras des choses sur moi que j'aurais préféré garder. »",
      "« Rappelle-toi : sur les mécanismes, un seul essai par jour. Le Protocole ne laisse pas de seconde chance. »"
    ],
    etapes:[
      { indice:"Un passeur t'attend dans un trou perdu au sud-ouest : il te rapproche du port, mais pas gratuitement.",
        cible:{ x:800, y:1200, r:80 }, leurres:[ {x:1600,y:300,r:80}, {x:2000,y:900,r:80}, {x:1200,y:600,r:80} ],
        image:"images/quetes/q4/1.png",
        arrivee:[
          "Sous une bâche crasseuse, un contrebandier édenté te toise. Il tapote sa main tendue.",
          "« Paie-le », grésille Sorn. « C'est un charognard, mais c'est le seul à connaître un passage vers le port. »"
        ],
        defi:{ type:"paiement", cout:500, texte:"« La route est chère, l'ami. »",
          reussite:[ "Le passeur empoche les crédits, crache par terre, et pointe un sas rouillé dans la falaise. « Par là. Et m'oublie. »", "« Bien. Le sas extérieur, maintenant. Verrouillé, forcément. »" ] } },

      { indice:"Le sas extérieur du port, à l'ouest : forcé par un vieux verrou à symboles.",
        cible:{ x:650, y:850, r:80 }, leurres:[ {x:1500,y:1200,r:80}, {x:1900,y:400,r:80}, {x:1100,y:1400,r:80} ],
        image:"images/quetes/q4/2.png",
        arrivee:[
          "Le sas est scellé par un cadran à symboles, gravé et usé. Aucune indication.",
          "« Un verrou à combinaison. Tâtonne : il te dira ce qui est bien placé. Mais pas éternellement. »"
        ],
        defi:{ type:"cadenas", longueur:4, symboles:["●","■","▲","◆","★","⬢"], essais:8,
          texte:"Trouve la combinaison du sas.",
          reussite:[ "Le dernier symbole s'enclenche. Le sas s'ouvre dans un souffle d'air vicié.", "« Tu es dedans. » La voix de Sorn se fait basse. « Fais gaffe aux patrouilles, maintenant. Observe avant de bouger. »" ] } },

      { indice:"Une coursive de garde, au nord : mémorise le passage des sentinelles avant de t'y risquer.",
        cible:{ x:1000, y:400, r:80 }, leurres:[ {x:1800,y:1000,r:80}, {x:400,y:1300,r:80}, {x:2100,y:600,r:80} ],
        image:"images/quetes/q4/3.png",
        arrivee:[
          "Un panneau d'affichage clignote encore, listant les rondes. Il va s'éteindre d'une seconde à l'autre.",
          "« Lis vite et retiens », souffle Sorn. « Tu n'auras pas deux fois l'horaire. »"
        ],
        defi:{ type:"memoire", duree:7000,
          texte:"L'horaire des rondes s'affiche brièvement.",
          info:["Ronde NORD : passage à 2 h","Ronde EST : passage à 5 h","Ronde SUD : passage à 9 h","Ronde OUEST : passage à 11 h"],
          question:"À quelle heure passe la ronde de l'EST ?",
          reponses:["5","5h","5 h"],
          reussite:[ "Tu te glisses entre deux rondes, pile dans le creux. Personne.", "« Impeccable. La grille d'alarme est juste devant. Là, va falloir être rapide. »" ] } },

      { indice:"La grille d'alarme, au cœur du port : désactive-la vite, très vite.",
        cible:{ x:1300, y:1000, r:80 }, leurres:[ {x:500,y:400,r:80}, {x:1900,y:1300,r:80}, {x:2050,y:200,r:80} ],
        image:"images/quetes/q4/4.png",
        arrivee:[
          "Un boîtier d'alarme pulse en rouge, un curseur balayant sa réglette à toute allure.",
          "« Quatre coupures, et vite », presse Sorn. « Rate une seule fenêtre et tout le port te tombe dessus. »"
        ],
        defi:{ type:"piratage", manches:4, vitesse:1050,
          texte:"Désactive l'alarme — quatre fenêtres, rapides.",
          reussite:[ "Le boîtier s'éteint dans un dernier couinement. Silence. Tu respires.", "« …Toujours vivant. Étonnant. Le bureau des permis est tout près. Il te faudra une puce. »" ] } },

      { indice:"Le bureau des permis, à l'est du port : dépose une puce falsifiée dans le lecteur.",
        cible:{ x:1750, y:700, r:80 }, leurres:[ {x:600,y:1200,r:80}, {x:1200,y:200,r:80}, {x:900,y:1400,r:80} ],
        image:"images/quetes/q4/5.png",
        arrivee:[
          "Un lecteur de puces attend, œil rouge clignotant. Il faut lui glisser une fausse identité.",
          "« Assemble-la avec ce que tu as », dit Sorn. « Un circuit, du câblage. Rien de sorcier pour toi, maintenant. »"
        ],
        defi:{ type:"livraison",
          texte:"Le lecteur réclame les composants d'une puce falsifiée.",
          objets:{ fab_circuit_imprime:1, fab_cablage:2 },
          reussite:[ "La puce s'insère. Le lecteur vire au vert, une porte blindée coulisse au fond.", "« Ça a marché. » Un long silence. « Derrière, ce sont les archives. Ce que tu vas y lire… ne me juge pas trop vite, gamin. »" ] } },

      { indice:"La salle des archives, derrière la porte blindée : la vérité t'y attend.",
        cible:{ x:750, y:1050, r:80 }, leurres:[ {x:1600,y:500,r:80}, {x:2000,y:1100,r:80}, {x:1300,y:1350,r:80} ],
        image:"images/quetes/q4/6.png",
        arrivee:[
          "Des écrans poussiéreux s'allument à ton passage. Des dossiers du Protocole, par milliers. Et un, épinglé, avec une photo : un homme plus jeune, un œil intact, un uniforme du Protocole. C'est Sorn.",
          "La radio reste muette un long moment. Puis, d'une voix cassée : « …Oui. J'ai porté leur uniforme. Avant de comprendre. Avant de fuir. Les initiales, sur le mur… c'était ma coéquipière. Ils l'ont gardée, elle. Pose ta question, et finissons-en. »"
        ],
        defi:{ type:"enigme",
          texte:"Le terminal des archives te teste une dernière fois, comme pour vérifier que tu as compris.",
          question:"« Qu'est-ce que le Protocole ne rend jamais, selon Sorn ? »",
          reponses:["rien","jamais rien"],
          indice:"Il te l'a dit devant le terminal du Rouage.",
          reussite:[ "« Rien. Exact. » Les écrans s'éteignent un à un. « Tu as tout vu. Rentre au comptoir, gamin. Il ne reste plus qu'une chose à faire — la plus folle. »" ] } }
    ],
    recompense:{ credits:1000, pa:1, objets:{ fab_kit_de_soin:1 }, flags:{} }
  },

  {
    id:"q5",
    nom:"Le dernier lancement",
    donneur:"Vieux Sorn",
    intro:[
      "Sorn t'attend, debout, presque droit pour une fois. « On y est. Un vieux pas de tir, une navette qui tient encore, et le verrou orbital du Protocole entre toi et les étoiles. »",
      "« Sept étapes. La dernière te donnera ton permis — et ta liberté. Moi, je reste. Non, ne discute pas. Quelqu'un doit garder l'œil ouvert ici. »",
      "« Allez. Rallume cette carcasse et fais-moi mentir : reviens vivant, une dernière fois. »"
    ],
    etapes:[
      { indice:"Le pas de tir abandonné, au sud-ouest : synchronise la console de lancement.",
        cible:{ x:900, y:1150, r:80 }, leurres:[ {x:1700,y:400,r:80}, {x:1300,y:900,r:80}, {x:2000,y:1250,r:80} ],
        image:"images/quetes/q5/1.png",
        arrivee:[
          "La console de lancement crépite, quatre voyants attendant une séquence de synchronisation.",
          "« Suis le rythme qu'elle te montre. Répète-le, de plus en plus long. Une erreur et tout se recale. »"
        ],
        defi:{ type:"sequence", longueur:5, symboles:["◤","◥","◣","◢"],
          texte:"Reproduis la séquence de synchronisation.",
          reussite:[ "Les quatre voyants passent au vert d'un coup. La console vibre, réveillée.", "« Synchronisée. Va au cœur du réacteur — c'est verrouillé dans leur langue. »" ] } },

      { indice:"Le cœur du réacteur, à l'ouest : contourne le verrou du Protocole.",
        cible:{ x:600, y:700, r:80 }, leurres:[ {x:1500,y:1200,r:80}, {x:1900,y:500,r:80}, {x:1100,y:1400,r:80} ],
        image:"images/quetes/q5/2.png",
        arrivee:[
          "Le sas du réacteur affiche quatre glyphes du Protocole, chacun près d'un pictogramme à demi effacé.",
          "« Encore leurs symboles. Tu commences à les connaître. Déduis, et ne te trompe pas. »"
        ],
        defi:{ type:"glyphes",
          texte:"Quatre glyphes verrouillent le réacteur.",
          consigne:"Associe chaque glyphe à son sens à l'aide du pictogramme.",
          paires:[
            { glyphe:"⟑", picto:"📡", sens:"signal" },
            { glyphe:"⌇", picto:"⚠", sens:"danger" },
            { glyphe:"⟿", picto:"➜", sens:"aller" },
            { glyphe:"⍚", picto:"🔒", sens:"verrou" }
          ],
          distracteurs:["eau","feu","dormir","manger"],
          reussite:[ "Les quatre glyphes s'éteignent l'un après l'autre. Le cœur du réacteur s'ouvre en grondant.", "« Dedans. Bien. La tour de contrôle t'attend — et son alarme, plus vicieuse que les autres. »" ] } },

      { indice:"La tour de contrôle, au centre-est : aligne la fenêtre de tir avant qu'ils ne t'alignent.",
        cible:{ x:1400, y:900, r:80 }, leurres:[ {x:500,y:500,r:80}, {x:2050,y:1200,r:80}, {x:1000,y:200,r:80} ],
        image:"images/quetes/q5/3.png",
        arrivee:[
          "L'écran de tir clignote frénétiquement, un curseur filant sur sa réglette.",
          "« Cinq fois, et vite. C'est la dernière alarme entre toi et l'orbite. Ne la rate pas. »"
        ],
        defi:{ type:"piratage", manches:5, vitesse:900,
          texte:"Aligne la fenêtre de tir — cinq fois, rapides.",
          reussite:[ "Le dernier verrou d'alarme cède. La tour est à toi.", "« …Cinq sur cinq. T'es plus le bleu que j'ai connu. Va faire le plein — ça va être long. »" ] } },

      { indice:"Les soutes à carburant, au sud-est : lance la pressurisation et attends le plein.",
        cible:{ x:1900, y:1200, r:80 }, leurres:[ {x:600,y:900,r:80}, {x:1200,y:400,r:80}, {x:400,y:1300,r:80} ],
        image:"images/quetes/q5/4.png",
        arrivee:[
          "Les cuves grondent, la pressurisation s'amorce. Rien à faire qu'attendre — longtemps.",
          "« Patiente. Et profites-en pour regarder le ciel. Bientôt, il sera à toi. »"
        ],
        defi:{ type:"attente", duree:45000,
          texte:"Pressurisation et plein en cours.",
          reussite:[ "Un voyant vert : pleins faits, soutes pressurisées. La navette frémit.", "« Prête à voler. Reste le verrou orbital. Le plus dur. Concentre-toi, gamin. »" ] } },

      { indice:"Le verrou orbital, tout au sud : la dernière sécurité du Protocole.",
        cible:{ x:700, y:1250, r:80 }, leurres:[ {x:1600,y:600,r:80}, {x:2000,y:300,r:80}, {x:1300,y:1000,r:80} ],
        image:"images/quetes/q5/5.png",
        arrivee:[
          "Un cadran massif, cinq symboles à trouver, gravés dans un alliage noir. La serrure finale.",
          "« C'est leur meilleur verrou. Cinq symboles. Prends ton temps — mais pas trop, ils vont finir par te repérer. »"
        ],
        defi:{ type:"cadenas", longueur:5, symboles:["●","■","▲","◆","★","⬢","✦"], essais:8,
          texte:"Force le verrou orbital — cinq symboles.",
          reussite:[ "Le cadran tourne enfin. Un grondement sourd : le ciel s'ouvre au-dessus du pas de tir.", "« …Il a cédé. » La voix de Sorn tremble. « Encore un pas, gamin. Un seul. »" ] } },

      { indice:"La rampe de lancement, au nord : le dernier péage avant les étoiles.",
        cible:{ x:1100, y:500, r:80 }, leurres:[ {x:500,y:1200,r:80}, {x:1900,y:1100,r:80}, {x:1500,y:200,r:80} ],
        image:"images/quetes/q5/6.png",
        arrivee:[
          "Un dernier automate de péage bloque la rampe, réclamant sa dîme absurde jusqu'au bout.",
          "« Même mourant, le Protocole fait payer. Règle, et grimpe dans ce cockpit. »"
        ],
        defi:{ type:"paiement", cout:800, texte:"« Taxe de lancement. Non négociable. »",
          reussite:[ "L'automate s'écarte. La rampe est libre. La navette t'attend, gueule ouverte.", "« Monte. » La radio grésille, émue. « Une dernière question, et tu t'envoles. »" ] } },

      { indice:"Le cockpit, au bout de la rampe : monte, et lance le compte à rebours.",
        cible:{ x:820, y:1000, r:80 }, leurres:[ {x:1700,y:500,r:80}, {x:1200,y:1300,r:80}, {x:2000,y:800,r:80} ],
        image:"images/quetes/q5/7.png",
        arrivee:[
          "Tu t'installes aux commandes. Les instruments s'allument, un à un, comme un cœur qui repart. Au loin, sur la rampe, une silhouette voûtée te regarde partir, une main levée.",
          "« Alors voilà. » La voix de Sorn, une dernière fois. « Tu vas y arriver. Quelqu'un doit garder l'œil ouvert ici-bas — ce sera moi. Réponds-moi juste ça, et décolle. »"
        ],
        defi:{ type:"enigme",
          texte:"Sur ton écran, une dernière ligne clignote, de la main de Sorn.",
          question:"« Qui reste garder l'œil ouvert sur Silène ? »",
          reponses:["sorn","le vieux sorn","vieux sorn"],
          indice:"Il vient de te le dire.",
          reussite:[ "Tu tapes son nom. L'écran s'illumine : PERMIS DE VOL ACCORDÉ. Les moteurs rugissent, la navette s'arrache du sol, et Silène rapetisse sous toi jusqu'à n'être qu'une bille bleutée. Les étoiles, enfin.", "« …Bonne route, gamin. » Un dernier grésillement, puis le silence. Tu as ton permis. L'espace t'attend." ] } }
    ],
    recompense:{ credits:2000, pa:2, objets:{ fab_navette_legere:1 }, flags:{ permisVaisseau:true, espace1:true } }
  }

  // Quête finale de la carte Silène : Q5 accorde le permis de vaisseau + ouvre l'espace (flag espace1).
  // La DERNIÈRE portera flags:{ permisVaisseau:true } (+ un flag type espace1:true
  // pour révéler l'onglet de la 1re carte spatiale, quand elle existera).
];
