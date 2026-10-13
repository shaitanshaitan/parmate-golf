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
var _FAQ_ARTICLES = [
      {
        id: 'scramble-calc', categoryId: 'whs',
        question_en: 'How does Parmate calculate scramble handicaps?',
        question_nl: 'Hoe berekent Parmate scramble handicaps?',
        readTime: 2, order: 1, isPopular: true,
        body_en: [
          { type:'p', text:'Parmate calculates every team handicap using the official World Handicap System (WHS) formula, then applies the correct scramble allowances. This keeps your team handicap accurate and competition-ready.' },
          { type:'h3', text:'The WHS course handicap formula' },
          { type:'p', text:'For each player, Parmate first works out their course handicap from their WHS Index and the tee they are playing:' },
          { type:'formula', text:'Course HCP = Index × (Slope ÷ 113) + (Rating − Par)' },
          { type:'h3', text:'Applying scramble allowances' },
          { type:'p', text:'Once every player has a course handicap, Parmate sorts them from lowest to highest and applies the standard scramble allowance percentages:' },
          { type:'steps', items:['The lowest course handicap contributes 35%','The second-lowest contributes 15%','Third and fourth players contribute 15% each'] },
          { type:'tip', text:'The default allowances are 35% / 15%, but event organisers can adjust these in the Event Manager to match their competition rules.' }
        ],
        body_nl: []
      },
      {
        id: 'allowances', categoryId: 'whs',
        question_en: 'What are scramble allowances (35% / 15%)?',
        question_nl: 'Wat zijn scramble allowances (35% / 15%)?',
        readTime: 2, order: 2, isPopular: false,
        body_en: [
          { type:'p', text:'Scramble allowances decide how much of each player\u2019s handicap counts toward the combined team handicap.' },
          { type:'steps', items:['Lowest handicap: 35%','All others: 15% each'] },
          { type:'tip', text:'Players are always sorted lowest-first before allowances are applied.' }
        ],
        body_nl: []
      },
      {
        id: 'tee-diff', categoryId: 'whs',
        question_en: 'Why is my course handicap different per tee?',
        question_nl: 'Waarom verschilt mijn course handicap per tee?',
        readTime: 1, order: 3, isPopular: false,
        body_en: [
          { type:'p', text:'Each tee has its own Rating and Slope, so the same WHS Index produces a different course handicap depending on which tee you play.' }
        ],
        body_nl: []
      },
      {
        id: 'start-round', categoryId: 'playing',
        question_en: 'How do I start a team round?',
        question_nl: 'Hoe start ik een teamronde?',
        readTime: 2, order: 1, isPopular: true,
        body_en: [
          { type:'p', text:'Tap PLAY GOLF from the home screen and follow the setup steps.' },
          { type:'steps', items:['Choose your course','Pick your team and tees','Confirm the scramble format','Parmate builds your team scorecard'] }
        ],
        body_nl: []
      },
      {
        id: 'match-code', categoryId: 'playing',
        question_en: 'How do I create a match code?',
        question_nl: 'Hoe maak ik een matchcode aan?',
        readTime: 1, order: 2, isPopular: false,
        body_en: [
          { type:'p', text:'After setting up your team, tap Create Match Code. Share the 5-character code (or QR) with the opposing team so they can join.' }
        ],
        body_nl: []
      },
      {
        id: 'edit-scores', categoryId: 'playing',
        question_en: 'Can I edit scores after submitting?',
        question_nl: 'Kan ik scores aanpassen na inzenden?',
        readTime: 1, order: 3, isPopular: false,
        body_en: [
          { type:'p', text:'Yes — open the full scorecard and tap any hole to adjust the score before the round is finalised.' }
        ],
        body_nl: []
      },
      {
        id: 'add-guest', categoryId: 'teams',
        question_en: 'How do I add a guest player?',
        question_nl: 'Hoe voeg ik een gastspeler toe?',
        readTime: 1, order: 1, isPopular: true,
        body_en: [
          { type:'p', text:'Guest players are for teammates who don\u2019t have Parmate yet.' },
          { type:'steps', items:['When creating a team, tap the + Guest chip','Enter the guest\u2019s name and WHS handicap index','The guest counts toward your team size like any player'] }
        ],
        body_nl: []
      },
      {
        id: 'set-main', categoryId: 'teams',
        question_en: 'How do I set a main team?',
        question_nl: 'Hoe stel ik een hoofdteam in?',
        readTime: 1, order: 2, isPopular: false,
        body_en: [
          { type:'p', text:'Open any team from My Teams and tap Set as Main Team. Your main team is pre-filled when you start a new round.' }
        ],
        body_nl: []
      },
      {
        id: 'change-email', categoryId: 'account',
        question_en: 'How do I change my email address?',
        question_nl: 'Hoe wijzig ik mijn e-mailadres?',
        readTime: 1, order: 1, isPopular: false,
        body_en: [
          { type:'p', text:'Go to Account Settings and tap the edit icon next to your email.' },
          { type:'steps', items:['Enter your new email address','We send a 6-digit verification code to it','Enter the code to confirm the change'] }
        ],
        body_nl: []
      },
      {
        id: 'delete-account', categoryId: 'account',
        question_en: 'How do I delete my account?',
        question_nl: 'Hoe verwijder ik mijn account?',
        readTime: 1, order: 2, isPopular: false,
        body_en: [
          { type:'p', text:'Go to Account Settings and tap Remove Account. This permanently deletes your data in line with our privacy policy.' }
        ],
        body_nl: []
      }
    ];
