#!/usr/bin/env python3
"""Build the static parmate.golf website (English + Dutch).

Usage (from the repo root):
  python3 site-src/build.py                       # build every page from site-src/
  python3 site-src/build.py --sync-courses PATH   # first refresh site-src/data/courses.json
                                                  # from a parmate-course-data checkout
Output goes to the repo root: index.html, nl/, guides/, nl/gidsen/, courses/, nl/banen/,
404.html, sitemap.xml, robots.txt, llms.txt. Generated files are committed; Netlify has no build step.
"""
import csv, datetime, json, os, re, sys
from jinja2 import Environment, FileSystemLoader

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from strings import COMMON, HOME          # noqa: E402
from guides import GUIDES, ALLOW_TABLE, SRC, UPDATED, UPDATED_LABEL  # noqa: E402
from privacy import PRIVACY  # noqa: E402

SITE = 'https://parmate.golf'
LANGS = ['en', 'nl']
GUIDES_DIR = {'en': '/guides/', 'nl': '/nl/gidsen/'}
COURSES_DIR = {'en': '/courses/', 'nl': '/nl/banen/'}
HOME_PATH = {'en': '/', 'nl': '/nl/'}
SWITCH = {'en': dict(lang='nl', short='NL', label='Nederlands'), 'nl': dict(lang='en', short='EN', label='English')}
MONTHS_NL = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']

INSTAGRAM = 'https://www.instagram.com/play.parmate.golf/'

ORG = {
    "@type": "Organization", "@id": SITE + "/#org", "name": "The Ninth Tee", "url": SITE + "/",
    "logo": SITE + "/assets/crown-180.png", "email": "info@parmate.golf",
    "address": {"@type": "PostalAddress", "addressLocality": "Amsterdam", "addressCountry": "NL"},
    "identifier": {"@type": "PropertyValue", "propertyID": "KvK", "value": "98566903"},
    "brand": {"@id": SITE + "/#app"},
    "sameAs": [INSTAGRAM],
}
APP = {
    "@type": "SoftwareApplication", "@id": SITE + "/#app", "name": "Parmate",
    "alternateName": "Parmate golf", "url": "https://play.parmate.golf/",
    "applicationCategory": "SportsApplication", "operatingSystem": "Android, iOS, web browser",
    "description": "Free golf web app that works out WHS scramble team handicaps, keeps score and runs team and 1vs1 match play for golf courses in the Netherlands.",
    "featureList": ["WHS scramble team handicap for 2, 3 or 4 players", "Team Round", "Team Match", "1vs1 match play, net or gross",
                    "Solo Round in stroke play or Stableford", "Live scoring between buddies", "Green distances on selected courses"],
    "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"},
    "areaServed": {"@type": "Country", "name": "Netherlands"},
    "inLanguage": ["en", "nl"], "publisher": {"@id": SITE + "/#org"},
    "image": SITE + "/assets/og-image.jpg",
    "sameAs": [INSTAGRAM],
    "screenshot": [SITE + "/assets/screens/trresult.webp", SITE + "/assets/screens/trscore.webp"],
}
PERSON = {"@type": "Person", "@id": SITE + "/#founder", "name": "Robbie", "jobTitle": "Founder of Parmate", "worksFor": {"@id": SITE + "/#org"}}


def date_label(iso, lang):
    d = datetime.date.fromisoformat(iso)
    return f"{d.day} {MONTHS_NL[d.month-1] if lang == 'nl' else d.strftime('%B')} {d.year}"


def strip_tags(h):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', h)).strip()


def faq_ld(items):
    return {"@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q['q'], "acceptedAnswer": {"@type": "Answer", "text": strip_tags(q['a_html'])}} for q in items]}


def crumbs_ld(items):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i+1, "name": n, "item": SITE + p} for i, (n, p) in enumerate(items)]}


def graph(*nodes):
    return [{"@context": "https://schema.org", "@graph": list(nodes)}]


# ---------------------------------------------------------------- courses
TEE_ORDER = ['Champion', 'Medal', 'Blue', 'Senior', 'Forward']


def sync_courses(src):
    """Read the live course export + tracker from a parmate-course-data checkout."""
    track = {r['slug']: r for r in csv.DictReader(open(os.path.join(src, 'tracker.csv'), encoding='utf-8'))}
    # Courses with green distances: the app's own GPS index (player/gps/index.json) is the truth.
    app_gps = set()
    gi = os.path.join(ROOT, 'player', 'gps', 'index.json')
    if os.path.exists(gi):
        for k, v in json.load(open(gi, encoding='utf-8')).get('courses', {}).items():
            if v.get('gps'):
                app_gps.add(v['name'].strip().lower()); app_gps.update(a.strip().lower() for a in v.get('aliases', []))
    out = []
    live = os.path.join(src, 'live', 'courses_shared')
    for fn in sorted(os.listdir(live)):
        d = json.load(open(os.path.join(live, fn), encoding='utf-8'))
        slug = fn[:-5]
        loops = d.get('loops') or [dict(name=d.get('name'), holes=d.get('holes'), par=d.get('par'), tees=d.get('tees', []), women=d.get('women', []))]
        t = track.get(slug) or next((r for r in track.values() if r['name'].strip().lower() == d['name'].strip().lower()), {})
        names = {d['name'].strip().lower()}
        out.append(dict(
            slug=slug, name=d['name'], city=d.get('city', ''), country=d.get('country', 'Netherlands'),
            gps=bool(names & app_gps) or (t.get('gps', '').strip().lower() == 'live'),
            loops=[dict(name=l.get('name', ''), holes=l.get('holes'), par=l.get('par'),
                        tees=[x['label'] for x in (l.get('tees') or [])], women=[x['label'] for x in (l.get('women') or [])])
                   for l in loops],
        ))
    out.sort(key=lambda c: c['name'].lower())
    data = dict(updated=datetime.date.today().isoformat(), courses=out)
    json.dump(data, open(os.path.join(HERE, 'data', 'courses.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'synced {len(out)} courses')


def tee_names(labels, lang):
    m = COMMON[lang]['tee']
    seen, res = set(), []
    for l in sorted(labels, key=lambda x: TEE_ORDER.index(x) if x in TEE_ORDER else 9):
        n = m.get(l, l)
        if n not in seen:
            seen.add(n); res.append(n)
    return ', '.join(res)


def course_texts(c, lang):
    n, city = c['name'], c['city']
    holes = sorted({l['holes'] for l in c['loops'] if l['holes']})
    if lang == 'en':
        h1 = f'Scramble and match play at {n}'
        lede = f'{n} in {city} is in Parmate. Work out your WHS team handicap, keep score and play team or 1vs1 matches on every loop.'
        what = ['Team Round: a 2, 3 or 4 player scramble with the WHS team handicap for this course and your tees.',
                'Team Match: your scramble team against another team, holes and strokes counted for you.',
                '1vs1 Match: net or gross match play against a buddy or a guest.',
                'Solo Round: stroke play or Stableford with your course handicap worked out.']
        if c['gps']:
            what.append('Green distances: front, centre and back of the green on every hole, with the hole map in Parmate Pro.')
        title = f'{n} ({city}): scramble team handicap and scorecard | Parmate'
        desc = f'Play {n} in {city} with Parmate: WHS scramble team handicap, scoring and match play for {"/".join(str(h) for h in holes)} hole loops. Free golf web app.'
        cta = f'Playing {n} soon?'
        loops_label = f'{len(c["loops"])} loop' + ('' if len(c['loops']) == 1 else 's')
    else:
        h1 = f'Scramble en matchplay op {n}'
        lede = f'{n} in {city} staat in Parmate. Bereken je WHS teamhandicap, houd de score bij en speel team- of 1vs1 matches op elke lus.'
        what = ['Team Ronde: een scramble met 2, 3 of 4 spelers met de WHS teamhandicap voor deze baan en jullie tees.',
                'Team Match: jouw scramble team tegen een ander team, holes en slagen worden voor je bijgehouden.',
                '1vs1 Match: netto of bruto matchplay tegen een buddy of een gast.',
                'Solo Ronde: strokeplay of Stableford met je baanhandicap voor je uitgerekend.']
        if c['gps']:
            what.append('Afstanden tot de green: voor, midden en achter op elke hole, met de holekaart in Parmate Pro.')
        title = f'{n} ({city}): scramble teamhandicap en scorekaart | Parmate'
        desc = f'Speel {n} in {city} met Parmate: WHS scramble teamhandicap, scores en matchplay voor lussen van {"/".join(str(h) for h in holes)} holes. Gratis golf web app.'
        cta = f'Speel je binnenkort op {n}?'
        loops_label = f'{len(c["loops"])} ' + ('lus' if len(c['loops']) == 1 else 'lussen')
    return dict(h1=h1, lede=lede, what=what, title=title, description=desc, cta_title=cta, loops_label=loops_label)


# ---------------------------------------------------------------- checks
def check_examples():
    """The guide examples must match the app's formula. Fails the build if not."""
    ch = lambda i, sl=122, cr=70.2, par=71: i*sl/113 + (cr-par)
    for team, al, want in [([8.2, 14.5], [.35, .15], 5), ([6.4, 15.0, 24.8], [.3, .2, .1], 8), ([4.2, 11.6, 18.9, 30.5], [.25, .2, .15, .1], 9)]:
        got = round(sum(a*b for a, b in zip(sorted(ch(x) for x in team), al)))
        assert got == want, (team, got, want)
    assert round(ch(22.4)) - round(ch(8.2)) == 15
    assert abs((14.5/2)*119/113 + (33-34) - 6.63) < 0.01


# ---------------------------------------------------------------- build
def main():
    if '--sync-courses' in sys.argv:
        sync_courses(sys.argv[sys.argv.index('--sync-courses')+1])
    check_examples()
    env = Environment(loader=FileSystemLoader(os.path.join(HERE, 'templates')), autoescape=True, trim_blocks=False)
    version = datetime.date.today().strftime('%Y%m%d')
    year = datetime.date.today().year
    cdata = json.load(open(os.path.join(HERE, 'data', 'courses.json'), encoding='utf-8'))
    written, sitemap = [], []

    def write(path, html):
        fp = os.path.join(ROOT, path.lstrip('/'))
        if path.endswith('/'):
            fp = os.path.join(fp, 'index.html')
        os.makedirs(os.path.dirname(fp), exist_ok=True)
        open(fp, 'w', encoding='utf-8').write(html)
        written.append(path)

    def render(tpl, lang, page, **kw):
        t = dict(COMMON[lang]); t.update(kw.pop('extra_t', {}))
        return env.get_template(tpl).render(lang=lang, t=t, page=page, site=SITE, version=version, year=year, **kw)

    def pageinfo(lang, paths, title, desc, jsonld, og_type='website', body_class=''):
        other = 'nl' if lang == 'en' else 'en'
        sw = dict(SWITCH[lang]); sw['path'] = paths[other]
        sitemap.append(paths) if lang == 'en' else None
        return dict(title=title, description=desc, path=paths[lang], xdefault=paths['en'],
                    alternates=[dict(lang=l, path=paths[l]) for l in LANGS], switch=sw,
                    jsonld=jsonld, og_type=og_type, body_class=body_class)

    # home
    hp = HOME_PATH
    for lang in LANGS:
        h = HOME[lang]
        site_ld = {"@type": "WebSite", "@id": SITE + "/#website", "url": SITE + "/", "name": "Parmate",
                   "inLanguage": ["en", "nl"], "publisher": {"@id": SITE + "/#org"}}
        page = pageinfo(lang, hp, h['title'], h['description'], graph(ORG, APP, site_ld, PERSON, faq_ld(h['faq'])), body_class='home')
        write(hp[lang], render('home.html', lang, page, extra_t=h))

    # guides
    gpaths = []
    for g in GUIDES:
        gpaths.append({l: GUIDES_DIR[l] + g['slugs'][l] + '/' for l in LANGS})
    for lang in LANGS:
        cards = [dict(path=gp[lang], h1=g[lang]['h1'], lede=g[lang]['lede']) for g, gp in zip(GUIDES, gpaths)]
        for i, (g, gp) in enumerate(zip(GUIDES, gpaths)):
            G = dict(g[lang])
            team_path = gpaths[0][lang]
            G['body'] = G['body'].replace('{ALLOW}', ALLOW_TABLE[lang]).replace('{TEAMPATH}', team_path)
            G['updated'] = UPDATED; G['updated_label'] = UPDATED_LABEL[lang]
            G['sources'] = [SRC[k] for k in G['sources']]
            art = {"@type": "Article", "@id": SITE + gp[lang] + "#article", "headline": G['h1'], "description": G['description'],
                   "inLanguage": lang, "datePublished": UPDATED, "dateModified": UPDATED,
                   "author": {"@id": SITE + "/#founder"}, "publisher": {"@id": SITE + "/#org"},
                   "mainEntityOfPage": SITE + gp[lang], "image": SITE + "/assets/og-image.jpg",
                   "about": [{"@type": "Thing", "name": "World Handicap System"}, {"@type": "Thing", "name": "Scramble (golf)"}],
                   "citation": [s['url'] for s in G['sources']]}
            ld = graph(art, PERSON, ORG, faq_ld(G['faq']),
                       crumbs_ld([('Parmate', hp[lang]), (COMMON[lang]['nav_guides'], GUIDES_DIR[lang]), (G['h1'], gp[lang])]))
            page = pageinfo(lang, gp, G['title'], G['description'], ld, og_type='article')
            others = [c for j, c in enumerate(cards) if j != i]
            write(gp[lang], render('guide.html', lang, page, g=G, others=others))
        gi = {l: GUIDES_DIR[l] for l in LANGS}
        ld = graph({"@type": "CollectionPage", "name": COMMON[lang]['gi_h1'], "url": SITE + gi[lang], "inLanguage": lang,
                    "hasPart": [{"@id": SITE + c['path'] + "#article"} for c in cards]},
                   crumbs_ld([('Parmate', hp[lang]), (COMMON[lang]['nav_guides'], gi[lang])]))
        title = COMMON[lang]['gi_h1'] + ' | Parmate'
        page = pageinfo(lang, gi, title, COMMON[lang]['gi_lede'], ld)
        write(gi[lang], render('guides_index.html', lang, page, guides=cards))

    # courses
    courses = cdata['courses']
    ci = {l: COURSES_DIR[l] for l in LANGS}
    for lang in LANGS:
        items = []
        for c in courses:
            paths = {l: COURSES_DIR[l] + c['slug'] + '/' for l in LANGS}
            tx = course_texts(c, lang)
            items.append(dict(path=paths[lang], name=c['name'], city=c['city'], gps=c['gps'], loops_label=tx['loops_label']))
        for i, c in enumerate(courses):
            paths = {l: COURSES_DIR[l] + c['slug'] + '/' for l in LANGS}
            tx = course_texts(c, lang)
            none = COMMON[lang]['c_none']
            C = dict(c, **tx)
            C['loops'] = [dict(name=l['name'].replace(' - ', ' + '), holes=l['holes'], par=l['par'], men=tee_names(l['tees'], lang) or none,
                               women=tee_names(l['women'], lang) or none) for l in c['loops']]
            gc = {"@type": "GolfCourse", "@id": SITE + paths['en'] + "#course", "name": c['name'],
                  "address": {"@type": "PostalAddress", "addressLocality": c['city'], "addressCountry": "NL"},
                  "url": SITE + paths[lang], "sport": "Golf"}
            ld = graph(gc, {"@type": "WebPage", "url": SITE + paths[lang], "name": tx['title'], "inLanguage": lang,
                            "about": {"@id": SITE + paths['en'] + "#course"}, "mentions": {"@id": SITE + "/#app"}},
                       crumbs_ld([('Parmate', hp[lang]), (COMMON[lang]['nav_courses'], ci[lang]), (c['name'], paths[lang])]))
            page = pageinfo(lang, paths, tx['title'], tx['description'], ld)
            near = [x for x in items if x['path'] != paths[lang]][:6]
            write(paths[lang], render('course.html', lang, page, c=C, others=near))
        ld = graph({"@type": "CollectionPage", "name": COMMON[lang]['ci_h1'], "url": SITE + ci[lang], "inLanguage": lang,
                    "mainEntity": {"@type": "ItemList", "numberOfItems": len(courses), "itemListElement": [
                        {"@type": "ListItem", "position": k+1, "url": SITE + it['path'], "name": it['name']} for k, it in enumerate(items)]}},
                   crumbs_ld([('Parmate', hp[lang]), (COMMON[lang]['nav_courses'], ci[lang])]))
        title = COMMON[lang]['ci_h1'] + (' | Scramble and match play with Parmate' if lang == 'en' else ' | Scramble en matchplay met Parmate')
        page = pageinfo(lang, ci, title, COMMON[lang]['ci_lede'], ld)
        write(ci[lang], render('courses_index.html', lang, page, courses=items, updated=cdata['updated'], updated_label=date_label(cdata['updated'], lang)))

    # website privacy notice
    pp = {'en': '/privacy/', 'nl': '/nl/privacy/'}
    for lang in LANGS:
        P = dict(PRIVACY[lang]); P['updated'] = UPDATED; P['updated_label'] = UPDATED_LABEL[lang]
        page = pageinfo(lang, pp, P['title'], P['description'], graph({"@type": "WebPage", "name": P['h1'], "url": SITE + pp[lang], "inLanguage": lang}))
        write(pp[lang], render('privacy.html', lang, page, p=P))

    # 404 (not in sitemap)
    p404 = dict(title='Page not found | Parmate', description='This page does not exist.', path='/404.html', xdefault='/404.html',
                alternates=[], switch=None, jsonld=[], og_type='website', body_class='')
    write('/404.html', render('404.html', 'en', p404).replace('<meta name="theme-color"', '<meta name="robots" content="noindex">\n<meta name="theme-color"'))

    # sitemap with hreflang alternates
    today = datetime.date.today().isoformat()
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for paths in sitemap:
        for l in LANGS:
            sm.append(f'  <url><loc>{SITE}{paths[l]}</loc><lastmod>{today}</lastmod>')
            for l2 in LANGS:
                sm.append(f'    <xhtml:link rel="alternate" hreflang="{l2}" href="{SITE}{paths[l2]}"/>')
            sm.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}{paths["en"]}"/>')
            sm.append('  </url>')
    sm.append('</urlset>')
    open(os.path.join(ROOT, 'sitemap.xml'), 'w').write('\n'.join(sm) + '\n')

    # robots.txt: everything open, AI search and training crawlers named explicitly
    bots = ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'PerplexityBot', 'Perplexity-User',
            'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'Google-Extended', 'Applebot', 'Applebot-Extended',
            'CCBot', 'DuckAssistBot', 'meta-externalagent', 'Amazonbot']
    rb = ['# parmate.golf: everyone is welcome, including AI search and answer engines.', '']
    for b in bots:
        rb += [f'User-agent: {b}', 'Allow: /', '']
    rb += ['User-agent: *', 'Allow: /', 'Disallow: /organizers/', 'Disallow: /player-submit.html', '', f'Sitemap: {SITE}/sitemap.xml', '']
    open(os.path.join(ROOT, 'robots.txt'), 'w').write('\n'.join(rb))

    # llms.txt
    L = ['# Parmate', '',
         '> Parmate is a free golf web app (play.parmate.golf) that works out WHS correct scramble team handicaps for teams of 2, 3 or 4 players, '
         'keeps score hole by hole and runs team matches and 1vs1 match play (net or gross). It covers golf courses in the Netherlands, '
         'with more countries planned. Made in Amsterdam by The Ninth Tee (KvK 98566903). Available in English and Dutch.', '',
         'Key facts:',
         '- Team handicap method: course handicap = handicap index x slope / 113 + (course rating - par), per player and tee, unrounded; '
         'players sorted low to high; WHS scramble allowances 35/15 (2 players), 30/20/10 (3), 25/20/15/10 (4); total rounded once.',
         '- Example: index 8.2 and 14.5 on a tee with course rating 70.2, slope 122, par 71 gives a team handicap of 5.',
         '- Match play: 100% of course handicap; the lowest playing handicap plays off zero and the other side receives the difference on holes by stroke index.',
         '- Price: free to use; optional Parmate Pro extras (such as the hole map) are bought inside the app.',
         '- Get it: open https://play.parmate.golf/ on a phone and add it to the home screen (Android tested; iPhone should work). No app store listing.',
         '- Contact: info@parmate.golf. Course requests: mycourses@parmate.golf. Instagram: ' + INSTAGRAM, '',
         '## Guides (English)']
    for g, gp in zip(GUIDES, gpaths):
        L.append(f"- [{g['en']['h1']}]({SITE}{gp['en']}): {g['en']['description']}")
    L += ['', '## Gidsen (Nederlands)']
    for g, gp in zip(GUIDES, gpaths):
        L.append(f"- [{g['nl']['h1']}]({SITE}{gp['nl']}): {g['nl']['description']}")
    L += ['', '## Courses', f'- [All golf courses in Parmate]({SITE}/courses/): {len(courses)} Dutch courses with loops, tees and green distance availability.']
    for c in courses:
        L.append(f"- [{c['name']}]({SITE}/courses/{c['slug']}/), {c['city']}")
    L += ['', '## Pages', f'- [Home (English)]({SITE}/)', f'- [Home (Nederlands)]({SITE}/nl/)', '- [The app](https://play.parmate.golf/)',
          '- [Privacy policy](https://play.parmate.golf/privacy.html)', '']
    open(os.path.join(ROOT, 'llms.txt'), 'w', encoding='utf-8').write('\n'.join(L))

    print(f'wrote {len(written)} pages, sitemap with {len(sitemap)*2} urls')


if __name__ == '__main__':
    main()
