// Parmate player app — FAQ categories and articles (data only).
// Loaded by index.html with a plain <script src> (no defer/async/module).
// ── Menu cluster: FAQ (shared data for faq + faqtopic) ──
var _FAQ_CATEGORIES = {
    whs:     { en: 'WHS & Handicaps',  nl: 'WHS & Handicaps' },
    playing: { en: 'Playing a Round',  nl: 'Een ronde spelen' },
    teams:   { en: 'Teams & Buddies',  nl: 'Teams & Buddies' },
    account: { en: 'Account',          nl: 'Account' }
  };
var _FAQ_CAT_ORDER = ['whs','playing','teams','account'];
// v32 (21 Oct 2026): the complete FAQ, identical to parmate-faq-complete.json for Firestore (faq_articles).
// Shown only while faq_articles in Firestore is empty; once Firestore has articles, those are shown instead.
var _FAQ_ARTICLES = [
  {
    "id": "scramble-calc",
    "categoryId": "whs",
    "question_en": "How does Parmate calculate a scramble team handicap?",
    "question_nl": "Hoe berekent Parmate een scramble teamhandicap?",
    "readTime": 2,
    "order": 1,
    "isPopular": true,
    "body_en": [
      {
        "type": "p",
        "text": "Parmate builds the team handicap in two steps: first a Course Handicap for every player, then a percentage per player, added up."
      },
      {
        "type": "h3",
        "text": "Step 1: Course Handicap per player"
      },
      {
        "type": "formula",
        "text": "Course HCP = Index × (Slope ÷ 113) + (Rating − Par)"
      },
      {
        "type": "p",
        "text": "Each player uses the Rating, Slope and Par of the tee they play. Over 9 holes, half the Handicap Index is used."
      },
      {
        "type": "h3",
        "text": "Step 2: the scramble allowance"
      },
      {
        "type": "steps",
        "items": [
          "Players are sorted from the lowest to the highest Course Handicap.",
          "Each player's Course Handicap is multiplied by their percentage, for example 35% for the lowest and 15% for the highest in a 2-player team.",
          "The results are added up and rounded to a whole number. That is your team handicap."
        ]
      },
      {
        "type": "tip",
        "text": "Parmate uses the exact Course Handicaps, before rounding, so the team handicap is as accurate as possible."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Parmate berekent de teamhandicap in twee stappen: eerst een Course Handicap per speler, daarna een percentage per speler, deze twee worden bij elkaar opgeteld."
      },
      {
        "type": "h3",
        "text": "Stap 1: Course Handicap per speler"
      },
      {
        "type": "formula",
        "text": "Course HCP = Index × (Slope ÷ 113) + (Rating − Par)"
      },
      {
        "type": "p",
        "text": "Elke speler gebruikt de Rating, Slope en Par van de tee die de speler speelt. Over 9 holes telt de helft van de Handicap-index."
      },
      {
        "type": "h3",
        "text": "Stap 2: de verdeling"
      },
      {
        "type": "steps",
        "items": [
          "De spelers worden van de laagste naar de hoogste Course Handicap geranked.",
          "De Course Handicap van elke speler wordt vermenigvuldigd met zijn of haar percentage, bijvoorbeeld 35% voor de laagste en 15% voor de hoogste in een team van 2.",
          "De uitkomsten worden opgeteld en afgerond op een heel getal en dat is jullie teamhandicap."
        ]
      },
      {
        "type": "tip",
        "text": "Parmate rekent met de exacte Course Handicaps, voor het afronden. Zo wordt je teamhandicap zo nauwkeurig mogelijk bepaald."
      }
    ]
  },
  {
    "id": "allowances",
    "categoryId": "whs",
    "question_en": "Which scramble allowances can I choose?",
    "question_nl": "Welke Team Handicap verdeling kan ik kiezen?",
    "readTime": 2,
    "order": 2,
    "isPopular": false,
    "body_en": [
      {
        "type": "p",
        "text": "The allowance decides how much of each player's handicap counts toward the team handicap. You choose it on the Scramble Format screen. The WHS recommendation for your team size is selected for you."
      },
      {
        "type": "h3",
        "text": "2 players"
      },
      {
        "type": "steps",
        "items": [
          "35% / 15% (WHS recommendation)",
          "25% / 20%",
          "20% / 15%"
        ]
      },
      {
        "type": "h3",
        "text": "3 players"
      },
      {
        "type": "steps",
        "items": [
          "30% / 20% / 10% (WHS recommendation)",
          "20% / 15% / 10%",
          "15% / 12% / 10%"
        ]
      },
      {
        "type": "h3",
        "text": "4 players"
      },
      {
        "type": "steps",
        "items": [
          "25% / 20% / 15% / 10% (WHS recommendation)",
          "20% / 15% / 10% / 5%",
          "15% / 12% / 10% / 7%"
        ]
      },
      {
        "type": "p",
        "text": "Does your competition use other percentages? Tap Custom and enter your own percentage per player in the pop-up. Tap the i next to the title for a short explanation of every option."
      },
      {
        "type": "tip",
        "text": "The first percentage always goes to the player with the lowest Course Handicap, the last to the highest."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "De verdeling bepaalt hoeveel van ieders handicap meetelt voor de teamhandicap. Je kiest de verdeling op het scherm Scramble Formaat. Het WHS-advies voor jouw teamgrootte staat al voor je geselecteerd."
      },
      {
        "type": "h3",
        "text": "2 spelers"
      },
      {
        "type": "steps",
        "items": [
          "35% / 15% (WHS-advies)",
          "25% / 20%",
          "20% / 15%"
        ]
      },
      {
        "type": "h3",
        "text": "3 spelers"
      },
      {
        "type": "steps",
        "items": [
          "30% / 20% / 10% (WHS-advies)",
          "20% / 15% / 10%",
          "15% / 12% / 10%"
        ]
      },
      {
        "type": "h3",
        "text": "4 spelers"
      },
      {
        "type": "steps",
        "items": [
          "25% / 20% / 15% / 10% (WHS-advies)",
          "20% / 15% / 10% / 5%",
          "15% / 12% / 10% / 7%"
        ]
      },
      {
        "type": "p",
        "text": "Gebruikt jullie wedstrijd andere percentages? Klik op Eigen en vul in het pop-upvenster per speler je eigen percentage in. Klik op de i naast de titel voor een korte uitleg van elke keuze."
      },
      {
        "type": "tip",
        "text": "Het eerste percentage gaat altijd naar de speler met de laagste Course Handicap, het laatste naar de hoogste."
      }
    ]
  },
  {
    "id": "tee-diff",
    "categoryId": "whs",
    "question_en": "Why is my Course Handicap different per tee?",
    "question_nl": "Waarom verschilt mijn Course Handicap per tee?",
    "readTime": 1,
    "order": 3,
    "isPopular": false,
    "body_en": [
      {
        "type": "p",
        "text": "Every tee has its own Course Rating and Slope. Parmate uses them in the Course Handicap formula, so the same Handicap Index gives a different Course Handicap per tee."
      },
      {
        "type": "formula",
        "text": "Course HCP = Index × (Slope ÷ 113) + (Rating − Par)"
      },
      {
        "type": "p",
        "text": "A higher Slope gives you more strokes. The (Rating − Par) part corrects for a tee that plays harder or easier than its par."
      },
      {
        "type": "tip",
        "text": "Ladies' tees have their own Rating and Slope. See \"Are the ladies' tee ratings used automatically?\"."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Elke tee heeft een eigen Course Rating en Slope. Parmate gebruikt die in de formule voor de Course Handicap, dus dezelfde Handicap-index geeft per tee een andere Course Handicap."
      },
      {
        "type": "formula",
        "text": "Course HCP = Index × (Slope ÷ 113) + (Rating − Par)"
      },
      {
        "type": "p",
        "text": "Een hogere Slope geeft je meer slagen. Het deel (Rating − Par) corrigeert voor een tee die moeilijker of makkelijker speelt dan de par."
      },
      {
        "type": "tip",
        "text": "Dames Tees hebben een eigen Rating en Slope. Zie \"Worden de damestees automatisch gebruikt?\"."
      }
    ]
  },
  {
    "id": "m1-strokes",
    "categoryId": "whs",
    "question_en": "How are handicap strokes given in a 1vs1 match?",
    "question_nl": "Hoe worden handicapslagen verdeeld in een 1vs1 match?",
    "readTime": 2,
    "order": 4,
    "isPopular": false,
    "body_en": [
      {
        "type": "p",
        "text": "Parmate follows the WHS rules for singles match play."
      },
      {
        "type": "formula",
        "text": "Course HCP = Index × (Slope ÷ 113) + (Rating − Par)"
      },
      {
        "type": "steps",
        "items": [
          "Each player's Course Handicap is worked out for the tee they play. Over 9 holes, half the Handicap Index is used.",
          "In a net match the full Course Handicap counts as the Playing Handicap (100%).",
          "The player with the lower Playing Handicap plays off 0. The other player receives the difference.",
          "Strokes fall on the hardest holes first (lowest stroke index). With more strokes than holes, the hardest holes get a second stroke."
        ]
      },
      {
        "type": "p",
        "text": "Playing from different tees is covered by the (Rating − Par) part of each player's Course Handicap. In a gross match nobody receives strokes."
      },
      {
        "type": "tip",
        "text": "On the scorecard, \"● 1 stroke\" next to a name shows who receives a stroke on that hole."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Parmate volgt de WHS-regels voor matchplay (singles)."
      },
      {
        "type": "formula",
        "text": "Course HCP = Index × (Slope ÷ 113) + (Rating − Par)"
      },
      {
        "type": "steps",
        "items": [
          "Voor elke speler wordt de Course Handicap berekend voor de tee die hij of zij speelt. Over 9 holes telt de helft van de Handicap-index.",
          "In een netto match telt de volledige Course Handicap als Playing Handicap (100%).",
          "De speler met de laagste Playing Handicap speelt vanaf 0. De ander krijgt het verschil aan slagen mee.",
          "De slagen vallen eerst op de moeilijkste holes (laagste stroke index). Zijn er meer slagen dan holes, dan krijgen de moeilijkste holes een tweede slag."
        ]
      },
      {
        "type": "p",
        "text": "Spelen jullie van verschillende tees, dan zit het verschil al in het deel (Rating − Par) van ieders Course Handicap. In een bruto match krijgt niemand slagen."
      },
      {
        "type": "tip",
        "text": "Op de scorekaart zie je bij een naam \"● 1 slag\" staan als die speler op die hole een slag meekrijgt."
      }
    ]
  },
  {
    "id": "ladies-tees",
    "categoryId": "whs",
    "question_en": "Are the ladies' tee ratings used automatically?",
    "question_nl": "Worden de damestees automatisch gebruikt?",
    "readTime": 2,
    "order": 5,
    "isPopular": false,
    "body_en": [
      {
        "type": "p",
        "text": "Yes, when both of these are true:"
      },
      {
        "type": "steps",
        "items": [
          "Your gender is set to Female in your profile (menu → Personal Information).",
          "The course has ladies' tee ratings in the Parmate database."
        ]
      },
      {
        "type": "p",
        "text": "If one of them is missing, the men's Rating and Slope are used. In the Solo Round setup you can check which ratings are used: they are shown under the course name."
      },
      {
        "type": "h3",
        "text": "Your 1vs1 opponent"
      },
      {
        "type": "p",
        "text": "When the course has ladies' tees, the opponent step shows Tees for: Men / Ladies, pre-filled from your buddy's profile. You can change it before you start."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Ja, wanneer allebei deze settings kloppen:"
      },
      {
        "type": "steps",
        "items": [
          "In je profiel staat Vrouw als geslacht (menu → Persoonlijke gegevens).",
          "De baan heeft waarden voor de Dames Tees in de Parmate database."
        ]
      },
      {
        "type": "p",
        "text": "Ontbreekt een van de twee, dan worden de Rating en Slope van de herentees gebruikt. In de setup van een Solo Ronde zie je welke waarden gebruikt worden: ze staan onder de baannaam."
      },
      {
        "type": "h3",
        "text": "Je tegenstander in een 1vs1"
      },
      {
        "type": "p",
        "text": "Heeft de baan Dames Tees, dan zie je bij de tegenstander Tees voor: Heren / Dames, alvast ingevuld vanuit het profiel van je buddy. Je kunt het aanpassen voordat je start."
      }
    ]
  },
  {
    "id": "start-round",
    "categoryId": "playing",
    "question_en": "How do I start a Team Round?",
    "question_nl": "Hoe start ik een Team Ronde?",
    "readTime": 2,
    "order": 1,
    "isPopular": true,
    "body_en": [
      {
        "type": "p",
        "text": "A Team Round is a scramble round for your own team of 2, 3 or 4 players, with a team handicap calculated for you."
      },
      {
        "type": "steps",
        "items": [
          "Tap PLAY GOLF and choose Team Round.",
          "Choose your course and the holes you play.",
          "Team details: type a team name or pick a saved team, choose the team size and add buddies or guests.",
          "Choose Tee: pick the tee for every player.",
          "Scramble Format: the WHS recommendation is selected; choose another allowance if your competition uses one.",
          "Check the Game Summary and the Team Handicap, then tap START SCORECARD."
        ]
      },
      {
        "type": "tip",
        "text": "The Team Handicap screen shows every player's share, so the whole team can see how the team handicap was built."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Een Team Ronde is een scrambleronde voor je eigen team van 2, 3 of 4 spelers, waarbij Parmate de teamhandicap voor je berekent."
      },
      {
        "type": "steps",
        "items": [
          "Klik op PLAY GOLF en kies Team Ronde.",
          "Kies je baan en de holes die je speelt.",
          "Teamdetails: typ een teamnaam of kies een opgeslagen team, kies de teamgrootte en voeg buddies of gasten toe.",
          "Kies Tee: kies de tee voor elke speler.",
          "Scramble Formaat: het WHS-advies staat geselecteerd; kies een andere verdeling als jullie wedstrijd die gebruikt.",
          "Controleer het Speloverzicht en de Team Handicap en klik op SCOREKAART STARTEN."
        ]
      },
      {
        "type": "tip",
        "text": "Op het scherm Team Handicap zie je het aandeel van elke speler. Zo ziet het hele team hoe de teamhandicap tot stand komt."
      }
    ]
  },
  {
    "id": "match-code",
    "categoryId": "playing",
    "question_en": "How do I play a Team Match against another team?",
    "question_nl": "Hoe speel ik een Team Match tegen een ander team?",
    "readTime": 2,
    "order": 2,
    "isPopular": false,
    "body_en": [
      {
        "type": "p",
        "text": "In a Team Match two scramble teams play against each other, each with its own team handicap, and follow each other's scores live."
      },
      {
        "type": "steps",
        "items": [
          "Tap PLAY GOLF and choose Team Match.",
          "Set up your own team, tees and scramble format, just like a Team Round.",
          "Opponent Team: enter the other team's name, size and players.",
          "Check both team handicaps and tap Create Match Code.",
          "Let the other team scan the QR code, or share the 5-character code."
        ]
      },
      {
        "type": "p",
        "text": "Each team enters its own scores on its own phone, and both teams see the match live. The other team has no Parmate account at hand? Tap Continue without them and play the match on your phone only."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "In een Team Match spelen twee scrambleteams tegen elkaar, elk met een eigen teamhandicap, en volgen ze elkaars scores live."
      },
      {
        "type": "steps",
        "items": [
          "Klik op PLAY GOLF en kies Team Match.",
          "Stel je eigen team, tees en scramble formaat in, net als bij een Team Ronde.",
          "Tegenstander: vul de naam, de grootte en de spelers van het andere team in.",
          "Controleer beide teamhandicaps en klik op Matchcode aanmaken.",
          "Laat het andere team de QR-code scannen, of deel de code van 5 tekens."
        ]
      },
      {
        "type": "p",
        "text": "Elk team voert de eigen scores in op de eigen telefoon, en beide teams zien de match live. Heeft het andere team geen Parmate account bij de hand? Klik op Ga verder zonder hen en speel de match alleen op jouw telefoon."
      }
    ]
  },
  {
    "id": "join-match",
    "categoryId": "playing",
    "question_en": "How do I join a Team Match with a code or QR?",
    "question_nl": "Hoe doe ik mee aan een Team Match met een code of QR?",
    "readTime": 1,
    "order": 3,
    "isPopular": false,
    "body_en": [
      {
        "type": "p",
        "text": "The team that set up the match gets a QR code and a 5-character code. To join:"
      },
      {
        "type": "steps",
        "items": [
          "Tap PLAY GOLF and choose Join Match, or open the menu and tap Join game.",
          "Tap Scan QR Code and scan the code on the other phone, or type the 5-character code.",
          "Confirm, and the match opens with your team's scorecard."
        ]
      },
      {
        "type": "tip",
        "text": "You need to be signed in to join. Opening the QR link signs you in first and then takes you straight to the match."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Het team dat de match heeft opgezet, krijgt een QR-code en een code van 5 tekens. Zo doe je mee:"
      },
      {
        "type": "steps",
        "items": [
          "Klik op PLAY GOLF en kies Match joinen, of open het menu en klik op Deelnemen aan game.",
          "Klik op Scan QR-code en scan de code op de andere telefoon, of typ de code van 5 tekens.",
          "Bevestig, en de match opent met de scorekaart van jouw team."
        ]
      },
      {
        "type": "tip",
        "text": "Je moet ingelogd zijn om mee te doen. Open je de QR-link, dan log je eerst in en kom je daarna meteen in de match."
      }
    ]
  },
  {
    "id": "edit-scores",
    "categoryId": "playing",
    "question_en": "Can I change a score?",
    "question_nl": "Kan ik een score aanpassen?",
    "readTime": 1,
    "order": 4,
    "isPopular": false,
    "body_en": [
      {
        "type": "p",
        "text": "Yes, as long as the round or match is not saved yet. Tap the hole in the row of dots, or open All holes, and enter the score again."
      },
      {
        "type": "p",
        "text": "A saved round or match can no longer be changed. You can still open it in Game History to share it, or delete it with 🗑 DELETE."
      },
      {
        "type": "tip",
        "text": "Check the full scorecard with All holes before you save."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Ja, zolang de ronde of match nog niet is opgeslagen. Klik op de hole in de rij met bolletjes, of open Alle holes, en voer de score opnieuw in."
      },
      {
        "type": "p",
        "text": "Een opgeslagen ronde of match kun je niet meer aanpassen. Je kunt hem nog wel openen in Spelhistorie om hem te delen, of verwijderen met 🗑 VERWIJDEREN."
      },
      {
        "type": "tip",
        "text": "Controleer de volledige scorekaart via Alle holes voordat je opslaat."
      }
    ]
  },
  {
    "id": "m1-start",
    "categoryId": "playing",
    "question_en": "How do I start a 1vs1 match?",
    "question_nl": "Hoe start ik een 1vs1 match?",
    "readTime": 2,
    "order": 5,
    "isPopular": true,
    "body_en": [
      {
        "type": "p",
        "text": "1vs1 Match Play is a head-to-head match between you and one opponent, played hole by hole with WHS-correct handicap strokes. It is free for everyone."
      },
      {
        "type": "steps",
        "items": [
          "Tap PLAY GOLF and choose 1vs1 Match Play.",
          "Choose your course and the holes you play.",
          "Under You, check your Handicap Index and choose your tee.",
          "Tap Choose opponent and pick a buddy, or type a name under \"or add a guest\" and tap Next.",
          "Enter your opponent's Handicap Index and tee, then tap Done.",
          "Choose Net (with handicap strokes) or Gross (no strokes).",
          "Tap START."
        ]
      },
      {
        "type": "tip",
        "text": "Before you start, the setup shows who receives strokes and how many, so you both know where you stand on the first tee."
      },
      {
        "type": "p",
        "text": "Playing against a Parmate buddy? Then you can both follow the match live on your own phone. See \"How does live scoring work in a 1vs1 match?\"."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "1vs1 Matchplay is een match tussen jou en één tegenstander, hole voor hole gespeeld met handicapslagen volgens de WHS. Gratis voor iedereen."
      },
      {
        "type": "steps",
        "items": [
          "Klik op PLAY GOLF en kies 1vs1 Matchplay.",
          "Kies je baan en de holes die je speelt.",
          "Controleer onder Jij je Handicap-index en kies je tee.",
          "Klik op Kies tegenstander en kies een buddy, of typ een naam onder \"of voeg een gast toe\" en klik op Volgende.",
          "Vul de Handicap-index en tee van je tegenstander in en klik op Klaar.",
          "Kies Netto (met handicapslagen) of Bruto (zonder slagen).",
          "Klik op START."
        ]
      },
      {
        "type": "tip",
        "text": "Voordat je start, zie je wie slagen meekrijgt en hoeveel. Zo weten jullie op de eerste tee meteen waar je staat."
      },
      {
        "type": "p",
        "text": "Speel je tegen een Parmate buddy? Dan kunnen jullie de match allebei live volgen op je eigen telefoon. Zie \"Hoe werkt live scoren in een 1vs1 match?\"."
      }
    ]
  },
  {
    "id": "m1-scoring",
    "categoryId": "playing",
    "question_en": "How do I enter scores in a 1vs1 match?",
    "question_nl": "Hoe voer ik scores in bij een 1vs1 match?",
    "readTime": 2,
    "order": 6,
    "isPopular": false,
    "body_en": [
      {
        "type": "p",
        "text": "You score one hole at a time. Tap a player's score box, enter the strokes and tap OK. Parmate then asks for the other player's score and moves on to the next hole."
      },
      {
        "type": "steps",
        "items": [
          "Enter 0 for a player who picked up: they lose the hole, unless both players picked up.",
          "Tap Concede to give the hole away. Tap Conceded to undo it.",
          "The bar at the top shows who is up and how many holes are left, including dormie.",
          "Tap All holes for the full scorecard with the match score after every hole."
        ]
      },
      {
        "type": "h3",
        "text": "When the match ends"
      },
      {
        "type": "p",
        "text": "The match is over as soon as the leader can no longer be caught, for example 3&2. Finish all square after the last hole? Choose Play extra hole (sudden death: the first hole that is not halved wins) or Halve the match. Then tap SAVE MATCH."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Je scoort hole voor hole. Klik op het scorevak van een speler, voer het aantal slagen in en klik op OK. Parmate vraagt daarna om de score van de andere speler en gaat door naar de volgende hole."
      },
      {
        "type": "steps",
        "items": [
          "Vul 0 in voor een speler die de bal heeft opgepakt: die verliest de hole, tenzij jullie allebei hebben opgepakt.",
          "Klik op Opgeven om de hole op te geven. Klik op Opgegeven om dat terug te draaien.",
          "De balk bovenaan laat zien wie er voor staat en hoeveel holes er nog over zijn, ook bij dormie.",
          "Klik op Alle holes voor de volledige scorekaart met de matchstand na elke hole."
        ]
      },
      {
        "type": "h3",
        "text": "Als de match afgelopen is"
      },
      {
        "type": "p",
        "text": "De match is voorbij zodra de koploper niet meer kan worden ingehaald, bijvoorbeeld 3&2. Staan jullie na de laatste hole gelijk? Kies Extra hole spelen (sudden death: de eerste hole die niet gelijk eindigt, beslist) of Match eindigen op een gelijkspel. Klik daarna op MATCH OPSLAAN."
      }
    ]
  },
  {
    "id": "m1-live",
    "categoryId": "playing",
    "question_en": "How does live scoring work in a 1vs1 match?",
    "question_nl": "Hoe werkt live scoren in een 1vs1 match?",
    "readTime": 3,
    "order": 7,
    "isPopular": true,
    "body_en": [
      {
        "type": "p",
        "text": "When your opponent is a Parmate buddy, you both follow and fill in the same scorecard, each on your own phone."
      },
      {
        "type": "steps",
        "items": [
          "In the 1vs1 setup, pick your buddy as opponent. The switch \"Live scoring with [name]\" is on by default.",
          "Tap START. You can start scoring straight away; you don't have to wait for your buddy.",
          "Your buddy gets an invite with Join, Not now or Decline. If their app was closed, the invite appears the next time they open Parmate, and it also waits in the notifications (bell).",
          "Once your buddy has joined, both phones show the same scorecard and both of you can enter scores for both players. Holes played before joining are already there.",
          "When the match is over, each player taps SAVE MATCH to save their own copy. Your history shows the result from your side, for example Won 3&2 or Lost 3&2."
        ]
      },
      {
        "type": "tip",
        "text": "If one of you changes a score the other entered, the other phone shows a message and \"changed by [name]\" on that hole."
      },
      {
        "type": "p",
        "text": "Live scoring only works between buddies. Handicaps, tees and strokes can't be changed once the match has started."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Is je tegenstander een Parmate buddy, dan volgen en vullen jullie samen dezelfde scorekaart in, ieder op de eigen telefoon."
      },
      {
        "type": "steps",
        "items": [
          "Kies in de 1vs1 setup je buddy als tegenstander. De schakelaar \"Live scoren met [naam]\" staat standaard aan.",
          "Klik op START. Je kunt meteen beginnen met scoren; je hoeft niet op je buddy te wachten.",
          "Je buddy krijgt een uitnodiging met Deelnemen, Niet nu of Afwijzen. Was de app gesloten, dan verschijnt de uitnodiging zodra je buddy Parmate weer opent. Hij staat ook klaar bij de meldingen (bel).",
          "Zodra je buddy meedoet, tonen beide telefoons dezelfde scorekaart en kunnen jullie allebei de scores van beide spelers invoeren. Holes die al gespeeld zijn, staan er gewoon in.",
          "Is de match voorbij, dan klikt ieder op MATCH OPSLAAN om de eigen versie op te slaan. In je historie zie je de uitslag vanaf jouw kant, bijvoorbeeld Gewonnen 3&2 of Verloren 3&2."
        ]
      },
      {
        "type": "tip",
        "text": "Past een van jullie een score aan die de ander had ingevoerd, dan krijgt de andere telefoon een melding en staat er \"aangepast door [naam]\" bij die hole."
      },
      {
        "type": "p",
        "text": "Live scoren werkt alleen tussen buddies. Handicaps, tees en slagen kun je niet meer wijzigen als de match eenmaal gestart is."
      }
    ]
  },
  {
    "id": "m1-live-sync",
    "categoryId": "playing",
    "question_en": "My buddy's live scorecard isn't up to date. What can I do?",
    "question_nl": "De live scorekaart van mijn buddy loopt achter. Wat nu?",
    "readTime": 2,
    "order": 8,
    "isPopular": false,
    "body_en": [
      {
        "type": "p",
        "text": "Live scores travel over the internet, so a phone that is locked, in a pocket or without signal can fall behind for a moment. Parmate catches up by itself:"
      },
      {
        "type": "steps",
        "items": [
          "When the phone is unlocked or Parmate is opened again, the scorecard fetches the latest scores straight away.",
          "While the live scorecard is on screen and nothing has come in for 30 seconds, Parmate checks for new scores itself.",
          "Join and Continue always open the latest version of the match."
        ]
      },
      {
        "type": "tip",
        "text": "Scores you enter without signal are sent as soon as the connection is back, as long as you keep Parmate open."
      },
      {
        "type": "p",
        "text": "Did your buddy already save the match while your phone was locked? You can still open it from the notifications (bell) and save your own copy."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Live scores gaan via internet. Een telefoon die vergrendeld is, in een broekzak zit of geen bereik heeft, kan daardoor even achterlopen. Parmate haalt dat zelf in:"
      },
      {
        "type": "steps",
        "items": [
          "Zodra de telefoon ontgrendeld wordt of Parmate weer geopend wordt, haalt de scorekaart meteen de laatste scores op.",
          "Staat de live scorekaart open en komt er 30 seconden niets binnen, dan kijkt Parmate zelf of er nieuwe scores zijn.",
          "Deelnemen en Verdergaan openen altijd de nieuwste versie van de match."
        ]
      },
      {
        "type": "tip",
        "text": "Scores die je zonder bereik invoert, worden verstuurd zodra er weer verbinding is, zolang je Parmate open laat staan."
      },
      {
        "type": "p",
        "text": "Heeft je buddy de match al opgeslagen terwijl jouw telefoon vergrendeld was? Dan kun je hem nog steeds openen via de meldingen (bel) en je eigen versie opslaan."
      }
    ]
  },
  {
    "id": "m1-live-leave",
    "categoryId": "playing",
    "question_en": "How do I cancel or leave a live 1vs1 match?",
    "question_nl": "Hoe annuleer of verlaat ik een live 1vs1 match?",
    "readTime": 1,
    "order": 9,
    "isPopular": false,
    "body_en": [
      {
        "type": "p",
        "text": "Open the notifications (bell). Every live match you are part of is listed under Live 1vs1."
      },
      {
        "type": "steps",
        "items": [
          "Started the match yourself? Tap Cancel. Your buddy can no longer score in it and keeps the scores that are on their phone.",
          "Invited by a buddy? Tap Decline, or Leave once you have joined. Your buddy keeps scoring on their own phone.",
          "Tap Continue to go back to the live scorecard."
        ]
      },
      {
        "type": "tip",
        "text": "Tapping BACK on the live scorecard doesn't end the match. It keeps running; open it again with Continue in the bell."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Open de meldingen (bel). Elke live match waar je aan meedoet, staat onder Live 1vs1."
      },
      {
        "type": "steps",
        "items": [
          "Heb je de match zelf gestart? Klik op Annuleren. Je buddy kan er dan niet meer in scoren en houdt de scores die op zijn of haar telefoon staan.",
          "Ben je uitgenodigd door een buddy? Klik op Afwijzen, of op Verlaten als je al meedoet. Je buddy scoort gewoon verder op de eigen telefoon.",
          "Klik op Verdergaan om terug te gaan naar de live scorekaart."
        ]
      },
      {
        "type": "tip",
        "text": "Klik je op TERUG in de live scorekaart, dan stopt de match niet. Hij loopt door; open hem weer met Verdergaan bij de meldingen."
      }
    ]
  },
  {
    "id": "solo-start",
    "categoryId": "playing",
    "question_en": "How do I start a Solo Round?",
    "question_nl": "Hoe start ik een Solo Ronde?",
    "readTime": 2,
    "order": 10,
    "isPopular": false,
    "body_en": [
      {
        "type": "p",
        "text": "A Solo Round is a round on your own, played with your full Course Handicap. It is free for everyone."
      },
      {
        "type": "steps",
        "items": [
          "Tap PLAY GOLF and choose Solo Round.",
          "Choose your course and the holes you play.",
          "Check your Handicap Index and choose your tee.",
          "Choose Stroke play or Stableford.",
          "Tap START and enter your score hole by hole.",
          "After the last hole, tap SAVE ROUND."
        ]
      },
      {
        "type": "tip",
        "text": "The setup shows your Course HCP for the tee you picked, plus the Rating and Slope under the course name, so you know your strokes before you tee off."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Een Solo Ronde speel je in je eentje, met je volledige Course Handicap. Gratis voor iedereen."
      },
      {
        "type": "steps",
        "items": [
          "Klik op PLAY GOLF en kies Solo Ronde.",
          "Kies je baan en de holes die je speelt.",
          "Controleer je Handicap-index en kies je tee.",
          "Kies Strokeplay of Stableford.",
          "Klik op START en voer hole voor hole je score in.",
          "Klik na de laatste hole op RONDE OPSLAAN."
        ]
      },
      {
        "type": "tip",
        "text": "In de setup zie je je Course HCP voor de gekozen tee, en de Rating en Slope onder de baannaam. Zo weet je al voor de eerste tee hoeveel slagen je krijgt."
      }
    ]
  },
  {
    "id": "solo-formats",
    "categoryId": "playing",
    "question_en": "Stroke play or Stableford: how is a Solo Round scored?",
    "question_nl": "Strokeplay of Stableford: hoe wordt een Solo Ronde geteld?",
    "readTime": 2,
    "order": 11,
    "isPopular": false,
    "body_en": [
      {
        "type": "h3",
        "text": "Stroke play"
      },
      {
        "type": "p",
        "text": "Every stroke counts. Parmate shows your gross score and your net score: gross minus the handicap strokes you receive."
      },
      {
        "type": "h3",
        "text": "Stableford"
      },
      {
        "type": "p",
        "text": "You score points per hole on your net score: net par is 2 points, net birdie 3, net bogey 1, and so on."
      },
      {
        "type": "formula",
        "text": "Points = 2 + (Par + strokes received − strokes taken), never below 0"
      },
      {
        "type": "p",
        "text": "Enter 0 when you pick up: that hole scores 0 points."
      },
      {
        "type": "tip",
        "text": "Your handicap strokes fall on the hardest holes first (lowest stroke index)."
      }
    ],
    "body_nl": [
      {
        "type": "h3",
        "text": "Strokeplay"
      },
      {
        "type": "p",
        "text": "Elke slag telt. Parmate toont je bruto score en je netto score: bruto min de handicapslagen die je meekrijgt."
      },
      {
        "type": "h3",
        "text": "Stableford"
      },
      {
        "type": "p",
        "text": "Je scoort punten per hole op je netto score: netto par is 2 punten, netto birdie 3, netto bogey 1, enzovoort."
      },
      {
        "type": "formula",
        "text": "Punten = 2 + (Par + meegekregen slagen − gespeelde slagen), nooit lager dan 0"
      },
      {
        "type": "p",
        "text": "Vul 0 in als je de bal oppakt: die hole levert dan 0 punten op."
      },
      {
        "type": "tip",
        "text": "Je handicapslagen vallen eerst op de moeilijkste holes (laagste stroke index)."
      }
    ]
  },
  {
    "id": "resume-round",
    "categoryId": "playing",
    "question_en": "I left my round or match. How do I continue?",
    "question_nl": "Ik heb mijn ronde of match verlaten. Hoe ga ik verder?",
    "readTime": 1,
    "order": 12,
    "isPopular": false,
    "body_en": [
      {
        "type": "p",
        "text": "Parmate keeps your scores when you leave a scorecard before saving."
      },
      {
        "type": "steps",
        "items": [
          "Solo Round, Team Round or a 1vs1 on one phone: tap the banner, or open the notifications (bell) and tap Resume.",
          "Live 1vs1: open the notifications (bell) and tap Continue under Live 1vs1."
        ]
      },
      {
        "type": "tip",
        "text": "Starting a new round or match replaces a round that was waiting to be resumed."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Parmate bewaart je scores als je een scorekaart verlaat voordat je hebt opgeslagen."
      },
      {
        "type": "steps",
        "items": [
          "Solo Ronde, Team Ronde of een 1vs1 op één telefoon: klik op de banner, of open de meldingen (bel) en klik op Hervatten.",
          "Live 1vs1: open de meldingen (bel) en klik op Verdergaan onder Live 1vs1."
        ]
      },
      {
        "type": "tip",
        "text": "Start je een nieuwe ronde of match, dan vervangt die een ronde die nog klaarstond om te hervatten."
      }
    ]
  },
  {
    "id": "history-share",
    "categoryId": "playing",
    "question_en": "Where do I find my 1vs1 and Solo results, and can I share them?",
    "question_nl": "Waar vind ik mijn 1vs1 en Solo uitslagen, en kan ik ze delen?",
    "readTime": 1,
    "order": 13,
    "isPopular": false,
    "body_en": [
      {
        "type": "p",
        "text": "Saved matches and rounds are in Game History, under the 1vs1 and Solo tabs. Your last five also appear on Home."
      },
      {
        "type": "steps",
        "items": [
          "Tap a match or round to open the full scorecard.",
          "Tap ↗ SHARE to make a share card for WhatsApp, Instagram and more."
        ]
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Opgeslagen matches en rondes vind je in Spelhistorie, onder de tabbladen 1vs1 en Solo. Je laatste vijf staan ook op Home."
      },
      {
        "type": "steps",
        "items": [
          "Klik op een match of ronde om de volledige scorekaart te openen.",
          "Klik op ↗ DELEN om een deelkaart te maken voor WhatsApp, Instagram en meer."
        ]
      }
    ]
  },
  {
    "id": "find-buddy",
    "categoryId": "teams",
    "question_en": "How do I add a buddy?",
    "question_nl": "Hoe voeg ik een buddy toe?",
    "readTime": 1,
    "order": 1,
    "isPopular": false,
    "body_en": [
      {
        "type": "p",
        "text": "Buddies are Parmate players you play with. You can add them to teams and play a live 1vs1 with them."
      },
      {
        "type": "steps",
        "items": [
          "Open the menu and tap Find Buddies.",
          "Search by nickname or email address.",
          "Tap + buddy next to the right player. They get a buddy request.",
          "Once they accept, you appear in each other's buddy list."
        ]
      },
      {
        "type": "p",
        "text": "Did they already send you a request? Then you see Accept instead, and one tap makes you buddies. Can't find someone? They need to save their profile first."
      },
      {
        "type": "tip",
        "text": "A free account can have up to 5 buddies. Pro has no limit."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Buddies zijn Parmate spelers met wie je speelt. Je kunt ze toevoegen aan teams en een live 1vs1 met ze spelen."
      },
      {
        "type": "steps",
        "items": [
          "Open het menu en klik op Buddies zoeken.",
          "Zoek op bijnaam of e-mailadres.",
          "Klik op + buddy bij de juiste speler. Die krijgt een buddyverzoek.",
          "Zodra het verzoek is geaccepteerd, staan jullie in elkaars buddylijst."
        ]
      },
      {
        "type": "p",
        "text": "Heeft die speler jou al een verzoek gestuurd? Dan zie je Accepteren, en met één klik zijn jullie buddies. Kun je iemand niet vinden? Dan moet die speler eerst zijn of haar profiel opslaan."
      },
      {
        "type": "tip",
        "text": "Met een gratis account kun je maximaal 5 buddies hebben. Met Pro is er geen limiet."
      }
    ]
  },
  {
    "id": "add-guest",
    "categoryId": "teams",
    "question_en": "How do I add a guest player?",
    "question_nl": "Hoe voeg ik een gastspeler toe?",
    "readTime": 1,
    "order": 2,
    "isPopular": true,
    "body_en": [
      {
        "type": "p",
        "text": "Guests are players who don't have Parmate. They count toward your team like any other player."
      },
      {
        "type": "steps",
        "items": [
          "In Team details, tap Add guest.",
          "Enter the guest's name, Handicap Index and gender.",
          "Choose a tee for the guest, just like for the other players."
        ]
      },
      {
        "type": "tip",
        "text": "The gender decides whether the men's or ladies' tee ratings are used for the guest."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Gasten zijn spelers zonder Parmate. Ze tellen mee in je team, net als elke andere speler."
      },
      {
        "type": "steps",
        "items": [
          "Klik in Teamdetails op Gast toevoegen.",
          "Vul de naam, de Handicap-index en het geslacht van de gast in.",
          "Kies een tee voor de gast, net als voor de andere spelers."
        ]
      },
      {
        "type": "tip",
        "text": "Het geslacht bepaalt of voor de gast de waarden van de heren- of de damestees gebruikt worden."
      }
    ]
  },
  {
    "id": "set-main",
    "categoryId": "teams",
    "question_en": "What is a main team?",
    "question_nl": "Wat is een hoofdteam?",
    "readTime": 1,
    "order": 3,
    "isPopular": false,
    "body_en": [
      {
        "type": "p",
        "text": "Your main team is the team you play with most. It is shown at the top of My Teams and with ★ MAIN on Home."
      },
      {
        "type": "steps",
        "items": [
          "Open My Teams and tap the team.",
          "Tap Set as Main."
        ]
      },
      {
        "type": "tip",
        "text": "The first team you create automatically becomes your main team."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Je hoofdteam is het team waarmee je het vaakst speelt. Het staat bovenaan in Mijn Teams en met ★ MAIN op Home."
      },
      {
        "type": "steps",
        "items": [
          "Open Mijn Teams en klik op het team.",
          "Klik op Instellen als Main."
        ]
      },
      {
        "type": "tip",
        "text": "Het eerste team dat je aanmaakt, wordt automatisch je hoofdteam."
      }
    ]
  },
  {
    "id": "m1-guest",
    "categoryId": "teams",
    "question_en": "Can I play a 1vs1 against someone who doesn't use Parmate?",
    "question_nl": "Kan ik een 1vs1 spelen tegen iemand zonder Parmate?",
    "readTime": 1,
    "order": 4,
    "isPopular": false,
    "body_en": [
      {
        "type": "p",
        "text": "Yes. In the 1vs1 setup, tap Choose opponent, type their name under \"or add a guest\" and tap Next. Enter their Handicap Index and tee, and you are ready to play."
      },
      {
        "type": "p",
        "text": "With a guest, only you enter the scores, on your phone. Live scoring needs a Parmate buddy on the other side."
      },
      {
        "type": "tip",
        "text": "Invite them to Parmate and add each other as buddies. Next time you can both follow the match live."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Ja. Klik in de 1vs1 setup op Kies tegenstander, typ de naam onder \"of voeg een gast toe\" en klik op Volgende. Vul de Handicap-index en tee in en je kunt starten."
      },
      {
        "type": "p",
        "text": "Met een gast voer alleen jij de scores in, op je eigen telefoon. Voor live scoren moet je tegenstander een Parmate buddy zijn."
      },
      {
        "type": "tip",
        "text": "Nodig je tegenstander uit voor Parmate en voeg elkaar toe als buddy. Dan kunnen jullie de volgende keer allebei live meekijken."
      }
    ]
  },
  {
    "id": "profile-complete",
    "categoryId": "account",
    "question_en": "Why does Parmate ask me to complete my profile?",
    "question_nl": "Waarom vraagt Parmate me mijn profiel compleet te maken?",
    "readTime": 1,
    "order": 1,
    "isPopular": false,
    "body_en": [
      {
        "type": "p",
        "text": "Your name and username help buddies find you, and your gender decides which tee ratings are used in your handicap calculations."
      },
      {
        "type": "steps",
        "items": [
          "Tap Complete profile in the message, or open the menu → Personal Information.",
          "Fill in the outlined fields and tap SAVE."
        ]
      },
      {
        "type": "p",
        "text": "Once everything is saved, the message doesn't come back. Tap Later and it waits a day before asking again."
      }
    ],
    "body_nl": [
      {
        "type": "p",
        "text": "Met je naam en gebruikersnaam kunnen buddies je vinden, en je geslacht bepaalt welke teewaarden gebruikt worden bij je handicapberekening."
      },
      {
        "type": "steps",
        "items": [
          "Klik in de melding op Profiel aanvullen, of open het menu → Persoonlijke gegevens.",
          "Vul de gemarkeerde velden in en klik op OPSLAAN."
        ]
      },
      {
        "type": "p",
        "text": "Is alles opgeslagen, dan komt de melding niet meer terug. Klik je op Later, dan wacht hij een dag voordat hij het opnieuw vraagt."
      }
    ]
  },
  {
    "id": "change-email",
    "categoryId": "account",
    "question_en": "How do I change my email address?",
    "question_nl": "Hoe wijzig ik mijn e-mailadres?",
    "readTime": 1,
    "order": 2,
    "isPopular": false,
    "body_en": [
      {
        "type": "steps",
        "items": [
          "Open the menu and tap Account Settings.",
          "Tap the pencil next to Email Address.",
          "Enter your new address and your current password, then tap Send Link.",
          "Open the email we send to your new address and click the link."
        ]
      },
      {
        "type": "p",
        "text": "Your address only changes once you click that link; until then your current address stays active. We also send a message to your old address, so you can undo the change if it was not you. You may need to sign in again with your new address."
      },
      {
        "type": "tip",
        "text": "Sign in with Google? Then your email address comes from your Google account. Email support@theninthtee.eu if you would like to use a different address."
      }
    ],
    "body_nl": [
      {
        "type": "steps",
        "items": [
          "Open het menu en klik op Accountinstellingen.",
          "Klik op het potloodje naast E-mailadres.",
          "Vul je nieuwe adres en je huidige wachtwoord in en klik op Link versturen.",
          "Open de e-mail die we naar je nieuwe adres sturen en klik op de link."
        ]
      },
      {
        "type": "p",
        "text": "Je adres verandert pas als je op die link klikt; tot die tijd blijft je huidige adres actief. We sturen ook een bericht naar je oude adres, zodat je de wijziging ongedaan kunt maken als jij het niet was. Daarna moet je misschien opnieuw inloggen met je nieuwe adres."
      },
      {
        "type": "tip",
        "text": "Log je in met Google? Dan komt je e-mailadres van je Google-account. Mail naar support@theninthtee.eu als je een ander adres wilt gebruiken."
      }
    ]
  },
  {
    "id": "delete-account",
    "categoryId": "account",
    "question_en": "How do I delete my account?",
    "question_nl": "Hoe verwijder ik mijn account?",
    "readTime": 1,
    "order": 3,
    "isPopular": false,
    "body_en": [
      {
        "type": "steps",
        "items": [
          "Open the menu and tap Account Settings.",
          "Tap Remove Account and confirm."
        ]
      },
      {
        "type": "p",
        "text": "We then permanently delete your account and all your data within 30 days, in line with our privacy policy. This cannot be undone."
      }
    ],
    "body_nl": [
      {
        "type": "steps",
        "items": [
          "Open het menu en klik op Accountinstellingen.",
          "Klik op Account verwijderen en bevestig."
        ]
      },
      {
        "type": "p",
        "text": "We verwijderen je account en al je gegevens daarna binnen 30 dagen definitief, volgens ons privacybeleid. Dit kun je niet ongedaan maken."
      }
    ]
  }
];
