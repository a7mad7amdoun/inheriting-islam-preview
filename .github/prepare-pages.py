#!/usr/bin/env python3
"""Build the public review at its GitHub Pages subpath, without private tooling."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
import re
import shutil

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "_site"
BASE = "/inheriting-islam-preview/"
ORIGIN = "https://a7mad7amdoun.github.io"
files = json.loads((ROOT / ".review-files.json").read_text())
# The standalone artwork gallery is maintained separately from website exports.
# Including it here keeps future website refreshes from dropping its public URL.
gallery = ROOT / "artwork-library"
if gallery.exists():
    files = sorted(set(files) | {
        p.relative_to(ROOT).as_posix() for p in gallery.rglob("*") if p.is_file()
    })
if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir()

def prefix(value):
    if value.startswith("/") and not value.startswith(("//", BASE)):
        return BASE + value[1:]
    return value

def rewrite(text):
    # Quoted HTML/JSON/JS paths and quoted CSS URLs; do not alter JS regexes.
    text = re.sub(
        r'''(["'`])(/(?!/)[^"'`\s<>]*)\1''',
        lambda m: m[1] + prefix(m[2]) + m[1], text
    )
    # Every srcset candidate, not just the first image.
    text = re.sub(
        r'(srcset=")([^"]*)(")',
        lambda m: m[1] + ", ".join(
            " ".join([prefix(bits[0]), *bits[1:]])
            for entry in m[2].split(",") if (bits := entry.strip().split())
        ) + m[3], text
    )
    text = re.sub(r'url\((/(?!/)[^)\s]*)\)', lambda m: "url(" + prefix(m[1]) + ")", text)
    return text.replace("https://inheritingislam.com/", ORIGIN + BASE)

for name in files:
    rel = Path(name)
    assert not rel.is_absolute() and ".." not in rel.parts
    assert rel.parts[0] not in {"CNAME", ".git", ".github", "docs", "tools", "content", "_issued"}
    src, dst = ROOT / rel, OUT / rel
    assert src.is_file() and not src.is_symlink(), name
    dst.parent.mkdir(parents=True, exist_ok=True)
    if src.suffix in {".html", ".css", ".js", ".json", ".xml"}:
        dst.write_text(rewrite(src.read_text()))
    else:
        shutil.copy2(src, dst)
(OUT / "robots.txt").write_text("User-agent: *\nDisallow: /\n")

class Links(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if not value:
                continue
            candidates = []
            if key in {"href", "src", "data-logo-dark", "data-logo-light", "data-language-link"}:
                candidates.append(value)
            elif key == "srcset":
                candidates.extend(x.strip().split()[0] for x in value.split(","))
            for url in candidates:
                if not url.startswith("/") or url.startswith("//"):
                    continue
                assert url.startswith(BASE), f"Unprefixed path: {url}"
                path = unquote(urlsplit(url).path[len(BASE):])
                target = OUT / path
                if target.is_dir():
                    target /= "index.html"
                assert target.is_file(), f"Missing local target: {url}"

pages = list(OUT.rglob("*.html"))
for page in pages:
    text = page.read_text()
    Links().feed(text)
    assert 'name="robots" content="noindex,nofollow"' in text
for css in OUT.rglob("*.css"):
    for url in re.findall(r'''url\(["']?(/[^)"']+)''', css.read_text()):
        assert url.startswith(BASE), f"Unprefixed CSS URL: {url}"
        assert (OUT / unquote(url[len(BASE):])).is_file(), url
print(f"Prepared {len(pages)} public review pages. Navigation, images, fonts and theme-logo paths pass.")
