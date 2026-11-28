# Guide pages, English and Dutch. Body HTML is inserted as is.
# Numbers in the examples were computed with the app's formula (see build.py check_examples).
# House rules: no dashes in visible copy. Dutch is a draft for Robbie's review.

UPDATED = '2026-11-28'
UPDATED_LABEL = {'en': '28 November 2026', 'nl': '28 november 2026'}

SRC = {
    'appc': dict(name='R&A, Rules of Handicapping, Appendix C: Handicap Allowances', url='https://www.randa.org/roh/appendices/appendix-c'),
    'rule6': dict(name='R&A, Rules of Handicapping, Rule 6: Playing Handicap calculation', url='https://www.randa.org/roh/interpretations/rule-6'),
    'usga62': dict(name='USGA, Rule 6.2a Standard Calculation', url='https://www.usga.org/handicapping/roh/Content/rules/6%202a%20Standard%20Calculation.htm'),
    'round': dict(name='USGA, Where does rounding occur?', url='https://www.usga.org/content/usga/home-page/handicapping/world-handicap-system/world-handicap-system-usga-golf-faqs/faqs---where-does-rounding-occur-.html'),
    'ncg': dict(name='National Club Golfer, What are the handicap allowances in golf?', url='https://www.nationalclubgolfer.com/whs/world-handicap-system-handicap-allowances/'),
    'ncg26': dict(name='Change to recommended handicap allowances, April 2026 (PDF via National Club Golfer)', url='https://www.nationalclubgolfer.com/wp-content/uploads/2026/04/change-to-recommended-handicap-allowances-v2.pdf'),
}

ALLOW_TABLE = {
'en': '''<div class="table-wrap"><table class="data">
<thead><tr><th scope="col">Team size</th><th scope="col">Lowest course handicap</th><th scope="col">2nd</th><th scope="col">3rd</th><th scope="col">Highest</th></tr></thead>
<tbody>
<tr><th scope="row">2 players</th><td>35%</td><td>15%</td><td></td><td></td></tr>
<tr><th scope="row">3 players</th><td>30%</td><td>20%</td><td>10%</td><td></td></tr>
<tr><th scope="row">4 players</th><td>25%</td><td>20%</td><td>15%</td><td>10%</td></tr>
</tbody></table></div>''',
'nl': '''<div class="table-wrap"><table class="data">
<thead><tr><th scope="col">Aantal spelers</th><th scope="col">Laagste baanhandicap</th><th scope="col">2e</th><th scope="col">3e</th><th scope="col">Hoogste</th></tr></thead>
<tbody>
<tr><th scope="row">2 spelers</th><td>35%</td><td>15%</td><td></td><td></td></tr>
<tr><th scope="row">3 spelers</th><td>30%</td><td>20%</td><td>10%</td><td></td></tr>
<tr><th scope="row">4 spelers</th><td>25%</td><td>20%</td><td>15%</td><td>10%</td></tr>
</tbody></table></div>''',
}

GUIDES = [
# 1 ------------------------------------------------------------------
dict(key='team', slugs={'en': 'scramble-team-handicap', 'nl': 'teamhandicap-scramble-berekenen'},
en=dict(
  title='How to calculate a scramble team handicap (WHS) | Parmate',
  description='Step by step: how to work out a WHS scramble team handicap for 2, 3 or 4 players, with the formula, the allowances and worked examples.',
  h1='How to calculate a scramble team handicap',
  lede='The World Handicap System way, step by step, with worked examples for teams of two, three and four players.',
  answer='''<ol>
<li>Work out each player’s <strong>course handicap</strong>: handicap index × slope ÷ 113 + (course rating − par), using the tee that player plays.</li>
<li><strong>Sort</strong> the players from lowest to highest course handicap.</li>
<li>Apply the <strong>scramble allowance</strong>: 35% and 15% for two players, 30%, 20% and 10% for three, 25%, 20%, 15% and 10% for four.</li>
<li><strong>Add</strong> the results and round once to the nearest whole number. That is the team handicap.</li>
</ol>''',
  body='''<h2>Step 1: course handicap for every player</h2>
<p>A handicap index says how good a golfer is in general. A course handicap says how many strokes that golfer gets on one particular course from one particular tee. Under the World Handicap System it is:</p>
<p class="formula-box">Course handicap = handicap index × (slope rating ÷ 113) + (course rating − par)</p>
<p>Every player uses the tee they actually play, so a team can mix tees, men and women. Do not round the course handicap yet: the WHS recommends applying the allowance to the unrounded course handicap, so there is only one rounding at the end.</p>

<h2>Step 2: sort the team from low to high</h2>
<p>The allowance depends on position, not on who is who. The player with the lowest course handicap gets the biggest percentage.</p>

<h2>Step 3: apply the scramble allowance</h2>
<p>These are the allowances the WHS recommends for a scramble in Appendix C of the Rules of Handicapping:</p>
{ALLOW}
<p>A competition committee may choose different percentages, for example for a social day. Parmate uses the WHS values by default and lets you set your own.</p>

<h2>Step 4: add up and round once</h2>
<p>Add the parts together and round to the nearest whole number. The result is the number of strokes the team gets for the round.</p>

<h2>Worked examples</h2>
<p>All examples use the same tee: course rating 70.2, slope 122, par 71.</p>
<h3>Two players: index 8.2 and 14.5</h3>
<div class="table-wrap"><table class="data"><thead><tr><th scope="col">Player</th><th scope="col">Index</th><th scope="col">Course handicap</th><th scope="col">Allowance</th><th scope="col">Counts for</th></tr></thead><tbody>
<tr><th scope="row">A</th><td>8.2</td><td>8.05</td><td>35%</td><td>2.82</td></tr>
<tr><th scope="row">B</th><td>14.5</td><td>14.85</td><td>15%</td><td>2.23</td></tr>
</tbody></table></div>
<p>2.82 + 2.23 = 5.05, so the <strong>team handicap is 5</strong>.</p>
<h3>Three players: index 6.4, 15.0 and 24.8</h3>
<p>Course handicaps 6.11, 15.39 and 25.98. With 30%, 20% and 10%: 1.83 + 3.08 + 2.60 = 7.51, so the <strong>team handicap is 8</strong>.</p>
<h3>Four players: index 4.2, 11.6, 18.9 and 30.5</h3>
<p>Course handicaps 3.73, 11.72, 19.61 and 32.13. With 25%, 20%, 15% and 10%: 0.93 + 2.34 + 2.94 + 3.21 = 9.43, so the <strong>team handicap is 9</strong>.</p>

<h2>Playing 9 holes</h2>
<p>For a 9 hole round, halve the handicap index and use the 9 hole course rating, slope and par: course handicap = (index ÷ 2) × (slope ÷ 113) + (course rating − par). Then apply the allowance in the same way. Example: index 14.5 on a 9 hole loop with rating 33.0, slope 119 and par 34 gives 7.25 × 1.053 − 1 = 6.63.</p>

<h2>Common mistakes</h2>
<ul>
<li><strong>Averaging the handicap indexes.</strong> (8.2 + 14.5) ÷ 2 = 11.35 has nothing to do with the WHS scramble handicap of 5.</li>
<li><strong>Using the index instead of the course handicap.</strong> Slope, course rating and par change the number, sometimes by several strokes.</li>
<li><strong>Rounding each player first.</strong> Rounding every part and then the total can move the team handicap by a stroke.</li>
<li><strong>Giving the big percentage to the wrong player.</strong> The lowest course handicap always gets the largest share.</li>
<li><strong>Forgetting plus handicaps.</strong> A plus handicap counts as a negative number in the formula.</li>
</ul>''',
  faq=[
    dict(q='Why does the best player count most?', a_html='In a scramble the team chooses the best shot every time, and that is usually the shot of the strongest player. Giving the lowest handicap the biggest percentage keeps the match fair between strong and weak teams.'),
    dict(q='Can players in one team use different tees?', a_html='Yes. Each player’s course handicap uses the rating, slope and par of their own tee, so men, women and different tees can play in one team.'),
    dict(q='Is this the same as a Texas scramble?', a_html='A Texas scramble is a scramble with a minimum number of drives per player. The handicap calculation is the same, unless the committee sets its own percentages.'),
  ],
  sources=['appc', 'round', 'ncg'],
),
nl=dict(
  title='Teamhandicap scramble berekenen (WHS) | Parmate',
  description='Stap voor stap: zo bereken je de WHS teamhandicap voor een scramble met 2, 3 of 4 spelers, met de formule, de verdeling en rekenvoorbeelden.',
  h1='Zo bereken je de teamhandicap voor een scramble',
  lede='Volgens het World Handicap System, stap voor stap, met rekenvoorbeelden voor teams van twee, drie en vier spelers.',
  answer='''<ol>
<li>Bereken voor elke speler de <strong>baanhandicap</strong>: handicap index × slope ÷ 113 + (course rating − par), vanaf de tee die die speler speelt.</li>
<li><strong>Rangschik</strong> de spelers van laagste naar hoogste baanhandicap.</li>
<li>Pas de <strong>scramble verdeling</strong> toe: 35% en 15% voor twee spelers, 30%, 20% en 10% voor drie, 25%, 20%, 15% en 10% voor vier.</li>
<li><strong>Tel</strong> de uitkomsten op en rond één keer af op een heel getal. Dat is de teamhandicap.</li>
</ol>''',
  body='''<h2>Stap 1: de baanhandicap voor elke speler</h2>
<p>Je handicap index zegt hoe goed je in het algemeen speelt. Je baanhandicap (course handicap) zegt hoeveel slagen je krijgt op één bepaalde baan, vanaf één bepaalde tee. Volgens het World Handicap System is dat:</p>
<p class="formula-box">Baanhandicap = handicap index × (slope rating ÷ 113) + (course rating − par)</p>
<p>Elke speler gebruikt de tee die hij echt speelt. Zo kun je in één team heren, dames en verschillende tees mengen. Rond de baanhandicap nog niet af: het WHS adviseert de verdeling toe te passen op de niet afgeronde baanhandicap, zodat er maar één keer wordt afgerond, aan het eind.</p>

<h2>Stap 2: rangschik het team van laag naar hoog</h2>
<p>Het percentage hangt af van de plek in het team, niet van wie het is. De speler met de laagste baanhandicap krijgt het hoogste percentage.</p>

<h2>Stap 3: pas de scramble verdeling toe</h2>
<p>Dit is de verdeling die het WHS adviseert voor een scramble, in Appendix C van de Rules of Handicapping:</p>
{ALLOW}
<p>Een wedstrijdcommissie mag andere percentages kiezen, bijvoorbeeld voor een clubdag. Parmate gebruikt standaard de WHS waarden en je kunt ook je eigen verdeling instellen.</p>

<h2>Stap 4: optellen en één keer afronden</h2>
<p>Tel de delen bij elkaar op en rond af op het dichtstbijzijnde hele getal. Dat is het aantal slagen dat het team voor de ronde krijgt.</p>

<h2>Rekenvoorbeelden</h2>
<p>Alle voorbeelden gebruiken dezelfde tee: course rating 70,2, slope 122, par 71.</p>
<h3>Twee spelers: index 8,2 en 14,5</h3>
<div class="table-wrap"><table class="data"><thead><tr><th scope="col">Speler</th><th scope="col">Index</th><th scope="col">Baanhandicap</th><th scope="col">Verdeling</th><th scope="col">Telt voor</th></tr></thead><tbody>
<tr><th scope="row">A</th><td>8,2</td><td>8,05</td><td>35%</td><td>2,82</td></tr>
<tr><th scope="row">B</th><td>14,5</td><td>14,85</td><td>15%</td><td>2,23</td></tr>
</tbody></table></div>
<p>2,82 + 2,23 = 5,05, dus de <strong>teamhandicap is 5</strong>.</p>
<h3>Drie spelers: index 6,4, 15,0 en 24,8</h3>
<p>Baanhandicaps 6,11, 15,39 en 25,98. Met 30%, 20% en 10%: 1,83 + 3,08 + 2,60 = 7,51, dus de <strong>teamhandicap is 8</strong>.</p>
<h3>Vier spelers: index 4,2, 11,6, 18,9 en 30,5</h3>
<p>Baanhandicaps 3,73, 11,72, 19,61 en 32,13. Met 25%, 20%, 15% en 10%: 0,93 + 2,34 + 2,94 + 3,21 = 9,43, dus de <strong>teamhandicap is 9</strong>.</p>

<h2>9 holes spelen</h2>
<p>Speel je 9 holes, deel dan de handicap index door twee en gebruik de course rating, slope en par van de 9 holes: baanhandicap = (index ÷ 2) × (slope ÷ 113) + (course rating − par). Daarna pas je de verdeling op dezelfde manier toe. Voorbeeld: index 14,5 op een 9 holes lus met rating 33,0, slope 119 en par 34 geeft 7,25 × 1,053 − 1 = 6,63.</p>

<h2>Veelgemaakte fouten</h2>
<ul>
<li><strong>Het gemiddelde van de handicaps nemen.</strong> (8,2 + 14,5) ÷ 2 = 11,35 heeft niets te maken met de WHS teamhandicap van 5.</li>
<li><strong>Rekenen met de index in plaats van de baanhandicap.</strong> Slope, course rating en par veranderen het getal, soms met een paar slagen.</li>
<li><strong>Elke speler eerst afronden.</strong> Als je elk deel én het totaal afrondt, kan de teamhandicap een slag verschuiven.</li>
<li><strong>Het hoge percentage aan de verkeerde speler geven.</strong> De laagste baanhandicap krijgt altijd het grootste deel.</li>
<li><strong>Plushandicaps vergeten.</strong> Een plushandicap telt in de formule als een negatief getal.</li>
</ul>''',
  faq=[
    dict(q='Waarom telt de beste speler het zwaarst?', a_html='Bij een scramble kiest het team steeds de beste bal, en dat is meestal de bal van de sterkste speler. Door de laagste handicap het hoogste percentage te geven, blijft het eerlijk tussen sterke en minder sterke teams.'),
    dict(q='Mogen spelers in één team van verschillende tees spelen?', a_html='Ja. De baanhandicap van elke speler gebruikt de rating, slope en par van zijn eigen tee, dus heren, dames en verschillende tees kunnen samen in één team.'),
    dict(q='Is dit hetzelfde als een Texas scramble?', a_html='Een Texas scramble is een scramble waarbij elke speler een minimum aantal drives moet laten gebruiken. De handicapberekening is hetzelfde, tenzij de commissie eigen percentages kiest.'),
  ],
  sources=['appc', 'round', 'ncg'],
)),
# 2 ------------------------------------------------------------------
dict(key='allow', slugs={'en': 'scramble-handicap-allowances', 'nl': 'verdeling-scramble-handicap'},
en=dict(
  title='Scramble handicap allowances explained (WHS) | Parmate',
  description='The WHS handicap allowances for a scramble: 35/15 for two players, 30/20/10 for three and 25/20/15/10 for four. What they mean and why they work.',
  h1='Scramble handicap allowances explained',
  lede='What 35/15, 30/20/10 and 25/20/15/10 mean, why the best player counts most, and when a committee may use something else.',
  answer='''<p>The World Handicap System recommends these allowances for a scramble, applied to each player’s course handicap after sorting from low to high:</p>
<ul><li><strong>2 players:</strong> 35% of the lowest, 15% of the highest.</li>
<li><strong>3 players:</strong> 30%, 20% and 10%.</li>
<li><strong>4 players:</strong> 25%, 20%, 15% and 10%.</li></ul>
<p>The parts are added and the total is rounded once to give the team handicap.</p>''',
  body='''<h2>The allowance table</h2>
{ALLOW}
<p>The percentages are recommendations in Appendix C of the Rules of Handicapping. They are designed to give every team the same chance of winning, whatever the mix of handicaps in the team.</p>

<h2>Why the lowest handicap gets the biggest share</h2>
<p>A scramble team plays the best shot every time. On most holes that is the drive, approach or putt of the strongest player, so the strong player’s ability carries the team far more than the others’. If you simply added up everybody’s handicap, teams with one very good player would get far too many strokes. Weighting the lowest handicap most corrects for that.</p>

<h2>What the percentages add up to</h2>
<p>A two player team gets 50% of its combined course handicaps in total, a three player team 60% and a four player team 70%. The more players, the more shots to choose from, so each extra player adds a smaller share.</p>

<h2>Can a committee use other percentages?</h2>
<p>Yes. The allowances are recommendations, and a committee can set its own for a competition, for example a society day where everyone should be in with a chance. In Parmate you pick the WHS values with one tap or set a custom split for each player.</p>
<p>In April 2026 an update to the recommended allowances gave committees more choice for <em>stroke play</em> formats only. It states that no change is made to the match play and scramble allowances, so the table above still applies.</p>

<h2>How the allowance is applied</h2>
<p>Apply the percentage to the <strong>unrounded</strong> course handicap and round only the team total. That way there is one rounding instead of several. See the full method in <a href="{TEAMPATH}">how to calculate a scramble team handicap</a>.</p>''',
  faq=[
    dict(q='What is the allowance for a 2 person scramble?', a_html='35% of the lower course handicap plus 15% of the higher course handicap, rounded once.'),
    dict(q='What is the allowance for a 4 person scramble?', a_html='25%, 20%, 15% and 10%, from the lowest to the highest course handicap, added up and rounded once.'),
    dict(q='Does the allowance apply to the handicap index or the course handicap?', a_html='To the course handicap. First turn each index into a course handicap for the tee played, then apply the percentage.'),
  ],
  sources=['appc', 'ncg', 'ncg26', 'round'],
),
nl=dict(
  title='Verdeling bij een scramble uitgelegd (WHS) | Parmate',
  description='De WHS verdeling voor een scramble: 35/15 voor twee spelers, 30/20/10 voor drie en 25/20/15/10 voor vier. Wat het betekent en waarom het werkt.',
  h1='De verdeling bij een scramble uitgelegd',
  lede='Wat 35/15, 30/20/10 en 25/20/15/10 betekenen, waarom de beste speler het zwaarst telt en wanneer een commissie iets anders mag kiezen.',
  answer='''<p>Het World Handicap System adviseert deze verdeling voor een scramble, toegepast op de baanhandicap van elke speler nadat je ze van laag naar hoog hebt gerangschikt:</p>
<ul><li><strong>2 spelers:</strong> 35% van de laagste, 15% van de hoogste.</li>
<li><strong>3 spelers:</strong> 30%, 20% en 10%.</li>
<li><strong>4 spelers:</strong> 25%, 20%, 15% en 10%.</li></ul>
<p>De delen worden opgeteld en het totaal wordt één keer afgerond. Dat is de teamhandicap.</p>''',
  body='''<h2>De tabel</h2>
{ALLOW}
<p>De percentages zijn adviezen uit Appendix C van de Rules of Handicapping. Ze zijn bedoeld om elk team dezelfde kans te geven om te winnen, hoe de handicaps in het team ook verdeeld zijn.</p>

<h2>Waarom de laagste handicap het grootste deel krijgt</h2>
<p>Een scramble team speelt steeds de beste bal. Op de meeste holes is dat de drive, de approach of de putt van de sterkste speler. Die speler draagt het team dus veel meer dan de anderen. Als je alle handicaps gewoon zou optellen, krijgen teams met één heel goede speler veel te veel slagen. Door de laagste handicap het zwaarst te laten tellen, wordt dat rechtgetrokken.</p>

<h2>Waar de percentages samen op uitkomen</h2>
<p>Een team van twee krijgt in totaal 50% van de opgetelde baanhandicaps, een team van drie 60% en een team van vier 70%. Hoe meer spelers, hoe meer ballen om uit te kiezen, dus elke extra speler telt voor een kleiner deel.</p>

<h2>Mag een commissie andere percentages kiezen?</h2>
<p>Ja. De verdeling is een advies en een commissie kan voor een wedstrijd zelf percentages vastleggen, bijvoorbeeld op een vriendendag waar iedereen kans moet maken. In Parmate kies je met één klik de WHS verdeling of stel je per speler een eigen verdeling in.</p>
<p>In april 2026 kregen commissies via een update van de geadviseerde verdelingen meer keuze, maar alleen voor <em>strokeplay</em> spelvormen. Daarin staat dat de verdelingen voor matchplay en scramble niet veranderen. De tabel hierboven geldt dus nog steeds.</p>

<h2>Hoe je de verdeling toepast</h2>
<p>Pas het percentage toe op de <strong>niet afgeronde</strong> baanhandicap en rond alleen het teamtotaal af. Dan rond je één keer af in plaats van meerdere keren. De volledige methode lees je in <a href="{TEAMPATH}">zo bereken je de teamhandicap voor een scramble</a>.</p>''',
  faq=[
    dict(q='Wat is de verdeling voor een scramble met twee spelers?', a_html='35% van de laagste baanhandicap plus 15% van de hoogste baanhandicap, één keer afgerond.'),
    dict(q='Wat is de verdeling voor een scramble met vier spelers?', a_html='25%, 20%, 15% en 10%, van de laagste naar de hoogste baanhandicap, opgeteld en één keer afgerond.'),
    dict(q='Geldt de verdeling voor de handicap index of voor de baanhandicap?', a_html='Voor de baanhandicap. Reken eerst elke index om naar een baanhandicap voor de gespeelde tee en pas daarna het percentage toe.'),
  ],
  sources=['appc', 'ncg', 'ncg26', 'round'],
)),
# 3 ------------------------------------------------------------------
dict(key='course', slugs={'en': 'course-handicap', 'nl': 'baanhandicap-berekenen'},
en=dict(
  title='Course handicap explained: the WHS formula with examples | Parmate',
  description='How to calculate your WHS course handicap from your handicap index, slope rating, course rating and par, for 18 and 9 holes, with worked examples.',
  h1='Course handicap explained',
  lede='How your handicap index becomes the number of strokes you get on a particular course and tee, for 18 and for 9 holes.',
  answer='''<p class="formula-box">Course handicap = handicap index × (slope ÷ 113) + (course rating − par)</p>
<p>For 9 holes, use half your handicap index and the 9 hole course rating, slope and par. The result is your course handicap for that tee. In competitions a handicap allowance may then turn it into a playing handicap.</p>''',
  body='''<h2>The four numbers you need</h2>
<ul>
<li><strong>Handicap index:</strong> your general playing level, kept up to date by your club or federation.</li>
<li><strong>Slope rating:</strong> how much harder the course is for a higher handicap golfer than for a scratch golfer. 113 is the standard; most courses sit between about 110 and 140.</li>
<li><strong>Course rating:</strong> what a scratch golfer is expected to score from that tee.</li>
<li><strong>Par:</strong> the par of the holes you play from that tee.</li>
</ul>
<p>You find slope, course rating and par on the scorecard, the handicap table in the clubhouse or the club website, separate for men and women and for every tee.</p>

<h2>Worked example, 18 holes</h2>
<p>Handicap index 14.5, tee with slope 122, course rating 70.2 and par 71:</p>
<p class="formula-box">14.5 × (122 ÷ 113) + (70.2 − 71) = 15.65 − 0.8 = 14.85</p>
<p>Rounded, the course handicap is 15.</p>

<h2>Worked example, 9 holes</h2>
<p>Same player, a 9 hole loop with slope 119, course rating 33.0 and par 34:</p>
<p class="formula-box">(14.5 ÷ 2) × (119 ÷ 113) + (33.0 − 34) = 7.64 − 1 = 6.63</p>
<p>Rounded, the 9 hole course handicap is 7.</p>

<h2>Course handicap and playing handicap</h2>
<p>The course handicap is what you get at 100%. Many formats use a handicap allowance on top: 35/15 in a two player scramble, for example. The result is called the playing handicap. The WHS recommends applying the allowance to the unrounded course handicap and rounding once at the end. In Parmate a Solo Round and a 1vs1 Match use 100%; team formats use the scramble allowance.</p>

<h2>Why course rating minus par is in the formula</h2>
<p>Since the introduction of the WHS, the difference between course rating and par is part of the course handicap. On a tee that plays harder than its par you get extra strokes, on an easier tee you get fewer. That makes it fair to compare players on different tees, men and women in the same round, and different loops of the same course.</p>''',
  faq=[
    dict(q='Is course handicap the same as baanhandicap?', a_html='Yes. In the Netherlands the course handicap is also called the baanhandicap. Many clubs show it in a table per tee.'),
    dict(q='Do women use different numbers?', a_html='Yes. Course rating and slope are rated separately for men and women, so use the values for your own tee and gender.'),
  ],
  sources=['usga62', 'rule6', 'round'],
),
nl=dict(
  title='Baanhandicap berekenen: de WHS formule met voorbeelden | Parmate',
  description='Zo bereken je je WHS baanhandicap (course handicap) uit je handicap index, slope rating, course rating en par, voor 18 en 9 holes, met rekenvoorbeelden.',
  h1='Zo bereken je je baanhandicap',
  lede='Hoe je handicap index het aantal slagen wordt dat je krijgt op een bepaalde baan en tee, voor 18 en voor 9 holes.',
  answer='''<p class="formula-box">Baanhandicap = handicap index × (slope ÷ 113) + (course rating − par)</p>
<p>Voor 9 holes gebruik je de helft van je handicap index en de course rating, slope en par van de 9 holes. De uitkomst is je baanhandicap voor die tee. In wedstrijden kan een verdeling daar nog een playing handicap van maken.</p>''',
  body='''<h2>De vier getallen die je nodig hebt</h2>
<ul>
<li><strong>Handicap index:</strong> je algemene speelniveau, bijgehouden door je club of de NGF.</li>
<li><strong>Slope rating:</strong> hoeveel moeilijker de baan is voor een golfer met een hogere handicap dan voor een scratch golfer. 113 is de standaard; de meeste banen liggen ongeveer tussen 110 en 140.</li>
<li><strong>Course rating:</strong> de score die een scratch golfer vanaf die tee zou moeten halen.</li>
<li><strong>Par:</strong> de par van de holes die je vanaf die tee speelt.</li>
</ul>
<p>Slope, course rating en par vind je op de scorekaart, in de handicaptabel in het clubhuis of op de website van de club, apart voor heren en dames en voor elke tee.</p>

<h2>Rekenvoorbeeld, 18 holes</h2>
<p>Handicap index 14,5, tee met slope 122, course rating 70,2 en par 71:</p>
<p class="formula-box">14,5 × (122 ÷ 113) + (70,2 − 71) = 15,65 − 0,8 = 14,85</p>
<p>Afgerond is de baanhandicap 15.</p>

<h2>Rekenvoorbeeld, 9 holes</h2>
<p>Dezelfde speler, een 9 holes lus met slope 119, course rating 33,0 en par 34:</p>
<p class="formula-box">(14,5 ÷ 2) × (119 ÷ 113) + (33,0 − 34) = 7,64 − 1 = 6,63</p>
<p>Afgerond is de baanhandicap voor 9 holes 7.</p>

<h2>Baanhandicap en playing handicap</h2>
<p>De baanhandicap is wat je krijgt bij 100%. Veel spelvormen gebruiken daarbovenop een verdeling, zoals 35/15 bij een scramble met twee spelers. De uitkomst heet de playing handicap. Het WHS adviseert de verdeling toe te passen op de niet afgeronde baanhandicap en pas aan het eind één keer af te ronden. In Parmate gebruiken een Solo Ronde en een 1vs1 Match 100%; teamspelvormen gebruiken de scramble verdeling.</p>

<h2>Waarom course rating min par in de formule zit</h2>
<p>Sinds de invoering van het WHS hoort het verschil tussen course rating en par bij de baanhandicap. Op een tee die moeilijker speelt dan zijn par krijg je extra slagen, op een makkelijkere tee minder. Zo kun je eerlijk spelers vergelijken die van verschillende tees spelen, heren en dames in dezelfde ronde, en verschillende lussen van dezelfde baan.</p>''',
  faq=[
    dict(q='Is de baanhandicap hetzelfde als de course handicap?', a_html='Ja. Course handicap is de Engelse term uit het WHS, in Nederland zeggen we vaak baanhandicap. Veel clubs tonen hem in een tabel per tee.'),
    dict(q='Gebruiken dames andere getallen?', a_html='Ja. Course rating en slope worden apart bepaald voor heren en dames. Gebruik dus de waarden voor je eigen tee en de Heren Tees of Dames Tees.'),
  ],
  sources=['usga62', 'rule6', 'round'],
)),
# 4 ------------------------------------------------------------------
dict(key='match', slugs={'en': 'match-play-handicap-strokes', 'nl': 'matchplay-handicapslagen'},
en=dict(
  title='Match play handicap strokes: who gets how many, and where | Parmate',
  description='How handicap strokes work in a WHS match play: 100% allowance in singles, the lowest handicap plays off zero, strokes by stroke index, and team matches.',
  h1='Match play handicap strokes explained',
  lede='Who gets strokes in a net match, how many, and on which holes. For a 1vs1 and for a team match.',
  answer='''<ol>
<li>Work out each player’s <strong>course handicap</strong> for the tee they play. In singles match play the WHS allowance is 100%, so this is also the playing handicap.</li>
<li>The player with the <strong>lowest</strong> playing handicap plays off <strong>zero</strong>.</li>
<li>The other player gets the <strong>difference</strong> in strokes.</li>
<li>The strokes fall on the holes with stroke index 1, 2, 3 and so on. A difference above 18 gives a second stroke, again from stroke index 1.</li>
</ol>''',
  body='''<h2>Example: a 1vs1 match</h2>
<p>Player A has index 8.2 and player B has index 22.4. They play the same tee: course rating 70.2, slope 122, par 71.</p>
<ul>
<li>A: 8.2 × 122 ÷ 113 − 0.8 = 8.05, so 8.</li>
<li>B: 22.4 × 122 ÷ 113 − 0.8 = 23.38, so 23.</li>
</ul>
<p>A plays off zero. B gets 23 − 8 = <strong>15 strokes</strong>: one on each of the holes with stroke index 1 to 15. On those holes B’s score counts one lower. The lower net score wins the hole.</p>

<h2>Where the stroke index comes in</h2>
<p>Every hole has a stroke index from 1 to 18. Stroke index 1 is where higher handicap golfers need the most help. Strokes are handed out in that order. In a 9 hole match the same order is used across the 9 holes you play.</p>

<h2>Different tees</h2>
<p>The course handicap already includes course rating minus par, so players on different tees, or men and women, can play a fair match. Work out each course handicap for that player’s own tee and compare.</p>

<h2>A team match</h2>
<p>When two scramble teams play a match, first work out each team handicap with the scramble allowance (35/15 for teams of two). Then the same rule applies: the team with the lowest team handicap plays off zero and the other team gets the difference, on the holes in stroke index order. This is how Parmate counts holes in a Team Match.</p>

<h2>Gross match play</h2>
<p>You can also play without handicap strokes, simply the lowest score on each hole. In Parmate this is the gross option of a 1vs1 Match.</p>

<h2>All square after 18</h2>
<p>If the match is level at the end, players or the committee decide: play extra holes until one side wins a hole, or call it a halved match. Parmate lets you choose either.</p>

<h2>How the score is told</h2>
<p>Match play counts holes, not strokes. "2 up" means one side has won two more holes. "3 and 2" means a side is 3 holes up with only 2 to play, so the match is over.</p>''',
  faq=[
    dict(q='What is the handicap allowance for singles match play?', a_html='100% of the course handicap in the WHS recommendations. The lower player plays off zero and the other gets the full difference.'),
    dict(q='What if the difference is more than 18 strokes?', a_html='Then the player gets one stroke on every hole and a second stroke on the holes with the lowest stroke indexes, starting again from stroke index 1.'),
  ],
  sources=['appc', 'rule6', 'ncg'],
),
nl=dict(
  title='Handicapslagen in matchplay: wie krijgt hoeveel slagen, en waar | Parmate',
  description='Zo werken handicapslagen in WHS matchplay: 100% bij singles, de laagste handicap speelt van nul, slagen volgens stroke index, en teammatches.',
  h1='Handicapslagen in matchplay uitgelegd',
  lede='Wie in een netto match slagen krijgt, hoeveel en op welke holes. Voor een 1vs1 en voor een teammatch.',
  answer='''<ol>
<li>Bereken voor elke speler de <strong>baanhandicap</strong> voor de tee die hij speelt. Bij singles matchplay is de WHS verdeling 100%, dus dat is ook de playing handicap.</li>
<li>De speler met de <strong>laagste</strong> playing handicap speelt van <strong>nul</strong>.</li>
<li>De andere speler krijgt het <strong>verschil</strong> in slagen.</li>
<li>De slagen vallen op de holes met stroke index 1, 2, 3 enzovoort. Is het verschil groter dan 18, dan krijg je een tweede slag, weer vanaf stroke index 1.</li>
</ol>''',
  body='''<h2>Voorbeeld: een 1vs1 match</h2>
<p>Speler A heeft index 8,2 en speler B index 22,4. Ze spelen van dezelfde tee: course rating 70,2, slope 122, par 71.</p>
<ul>
<li>A: 8,2 × 122 ÷ 113 − 0,8 = 8,05, dus 8.</li>
<li>B: 22,4 × 122 ÷ 113 − 0,8 = 23,38, dus 23.</li>
</ul>
<p>A speelt van nul. B krijgt 23 − 8 = <strong>15 slagen</strong>: één op elke hole met stroke index 1 tot en met 15. Op die holes telt de score van B één lager. De laagste netto score wint de hole.</p>

<h2>Waar de stroke index om de hoek komt kijken</h2>
<p>Elke hole heeft een stroke index van 1 tot 18. Stroke index 1 is de hole waar golfers met een hogere handicap de meeste hulp nodig hebben. De slagen worden in die volgorde uitgedeeld. In een match over 9 holes geldt dezelfde volgorde voor de 9 holes die je speelt.</p>

<h2>Verschillende tees</h2>
<p>In de baanhandicap zit het verschil tussen course rating en par al verwerkt. Spelers van verschillende tees, of heren en dames, kunnen dus een eerlijke match spelen. Bereken elke baanhandicap voor de eigen tee van de speler en vergelijk.</p>

<h2>Een teammatch</h2>
<p>Spelen twee scramble teams een match tegen elkaar, bereken dan eerst voor elk team de teamhandicap met de scramble verdeling (35/15 voor teams van twee). Daarna geldt dezelfde regel: het team met de laagste teamhandicap speelt van nul en het andere team krijgt het verschil, op de holes in de volgorde van de stroke index. Zo telt Parmate de holes in een Team Match.</p>

<h2>Bruto matchplay</h2>
<p>Je kunt ook zonder handicapslagen spelen: gewoon de laagste score per hole. In Parmate is dat de bruto optie van een 1vs1 Match.</p>

<h2>All square na 18 holes</h2>
<p>Staat de match aan het eind gelijk, dan beslissen de spelers of de commissie: extra holes spelen tot een van beide een hole wint, of de match eindigen op een gelijkspel. In Parmate kies je zelf.</p>

<h2>Hoe je de stand zegt</h2>
<p>Bij matchplay tel je holes, geen slagen. "2 up" betekent dat een kant twee holes meer heeft gewonnen. "3 en 2" betekent dat een kant 3 holes voor staat met nog maar 2 te spelen, dus de match is voorbij.</p>''',
  faq=[
    dict(q='Wat is de verdeling bij singles matchplay?', a_html='Volgens het WHS advies 100% van de baanhandicap. De laagste speler speelt van nul en de ander krijgt het volledige verschil.'),
    dict(q='En als het verschil groter is dan 18 slagen?', a_html='Dan krijgt de speler op elke hole een slag en een tweede slag op de holes met de laagste stroke index, weer vanaf stroke index 1.'),
  ],
  sources=['appc', 'rule6', 'ncg'],
)),
]
