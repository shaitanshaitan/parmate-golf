# parmate.golf website source

The public website is generated from this folder. Netlify has no build step: the generated
HTML is committed in the repo root.

| Path | What |
| --- | --- |
| `build.py` | Builds every page, `sitemap.xml`, `robots.txt` and `llms.txt` |
| `strings.py` | Homepage and shared copy, English and Dutch |
| `guides.py` | The guide pages, English and Dutch, with sources |
| `templates/` | Jinja2 templates |
| `data/courses.json` | Course list, refreshed from the parmate-course-data repo |

Build (from the repo root):

    python3 site-src/build.py
    python3 site-src/build.py --sync-courses ../parmate-course-data   # also refresh the course list

Output: `index.html`, `nl/`, `guides/`, `nl/gidsen/`, `courses/`, `nl/banen/`, `404.html`,
`sitemap.xml`, `robots.txt`, `llms.txt`. Shared CSS and JS live in `assets/site.css` and `assets/site.js`.

Copy rules: no dashes in visible copy; informal "je" in Dutch; Dutch is reviewed by Robbie.
The build fails if the worked examples in the guides no longer match the app's formula.
