#!/usr/bin/env python3
"""Patch standardized global nav into Keymakers HTML pages."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

NAV_LINK = 'class="hover:text-white transition-colors py-2"'
NAV_ACTIVE = 'aria-current="page" class="text-[#D4AF37] border-b-2 border-[#D4AF37] py-2"'

ITEMS = [
    ("stories", "./stories.html", "Stories"),
    ("community", "./community.html", "Community"),
    ("gathering", "./gathering.html", "The Gathering"),
    ("get-involved", "./get-involved.html", "Get Involved"),
    ("connectors", "./connectors.html", "Connectors"),
    ("about", "./about.html", "About WVF"),
]

def desktop_links(active: str) -> str:
    lines = []
    for key, href, label in ITEMS:
        if key == active:
            lines.append(f'<a href="{href}" {NAV_ACTIVE}>{label}</a>')
        else:
            lines.append(f'<a href="{href}" {NAV_LINK}>{label}</a>')
    return "\n".join(lines)


def mobile_links(active: str) -> str:
    rows = []
    for key, href, label in ITEMS:
        if key == active:
            rows.append(
                f'<li><a @click="mobileOpen = false" href="{href}" aria-current="page" class="block py-3 min-h-[44px] border-b border-white/10 text-[#D4AF37]">{label}</a></li>'
            )
        else:
            rows.append(
                f'<li><a @click="mobileOpen = false" href="{href}" class="block py-3 min-h-[44px] border-b border-white/10 hover:text-white">{label}</a></li>'
            )
    rows[-1] = rows[-1].replace("border-b border-white/10 ", "")
    return "\n".join(rows)


def nav_block(active: str, sticky_wrap: bool = True) -> str:
    header_open = (
        '<header class="sticky top-0 z-50 bg-[#062117]/95 backdrop-blur-sm border-b border-white/10">\n'
        if sticky_wrap
        else ""
    )
    header_close = "</header>\n" if sticky_wrap else ""
    nav_close_extra = "" if sticky_wrap else ""

    return f"""{header_open}<nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[4.5rem]">
<a href="./index.html" class="font-serif tracking-[0.2em] text-[#D4AF37] font-bold text-lg shrink-0">KEYMAKERS</a>

<div class="hidden xl:flex items-center gap-6 text-xs uppercase tracking-widest text-white/80">
{desktop_links(active)}
</div>

<a href="./share-your-key.html" class="hidden xl:inline-flex items-center justify-center bg-[#D4AF37] text-[#062117] font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full hover:bg-[#E5C158] min-h-[44px]">Share Your Key</a>

<button @click="mobileOpen = !mobileOpen" type="button" class="xl:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold" :aria-expanded="mobileOpen" aria-label="Toggle menu">
<svg x-show="!mobileOpen" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
<svg x-show="mobileOpen" x-cloak class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
</button>
</div>

<div x-show="mobileOpen" x-cloak x-transition.duration.200ms @click.outside="mobileOpen = false" class="xl:hidden px-4 pb-6 pt-2 bg-[#062117]/98 border-t border-white/10">
<ul class="flex flex-col text-sm font-semibold uppercase tracking-widest text-white/80">
{mobile_links(active)}
</ul>
<a @click="mobileOpen = false" href="./share-your-key.html" class="mt-5 block text-center rounded-full bg-[#D4AF37] text-[#062117] font-bold text-xs uppercase tracking-widest px-4 py-3 min-h-[44px] hover:bg-[#E5C158]">Share Your Key</a>
</div>
</nav>
{header_close}{nav_close_extra}"""


def replace_header(content: str, active: str) -> str:
    pattern = re.compile(
        r"<header[^>]*>.*?</header>\s*",
        re.DOTALL,
    )
    if not pattern.search(content):
        pattern = re.compile(
            r"<nav class=\"sticky top-0 z-50[^\"]*\".*?</nav>\s*",
            re.DOTALL,
        )
        return pattern.sub(nav_block(active, sticky_wrap=False), content, count=1)
    return pattern.sub(nav_block(active, sticky_wrap=True), content, count=1)


def patch_gathering_style(content: str, active: str) -> str:
    """gathering.html: nav inside header before hero section."""
    pattern = re.compile(
        r"(<header class=\"relative bg-\[#062117\][^>]*>\s*)<nav.*?</nav>\s*",
        re.DOTALL,
    )
    inner_nav = nav_block(active, sticky_wrap=False)
    return pattern.sub(r"\1" + inner_nav + "\n", content, count=1)


def patch_share_key(content: str) -> str:
    pattern = re.compile(
        r"<header class=\"relative bg-\[#062117\]\">\s*<nav.*?</nav>\s*",
        re.DOTALL,
    )
    inner_nav = nav_block("share-your-key", sticky_wrap=False).replace(
        'href="./share-your-key.html" class="hidden xl:inline-flex',
        'href="./share-your-key.html" aria-current="page" class="hidden xl:inline-flex ring-2 ring-white/30',
    )
    return pattern.sub(
        '<header class="relative bg-[#062117]">\n' + inner_nav + "\n",
        content,
        count=1,
    )


PAGES: dict[str, str] = {
    "get-involved.html": "get-involved",
    "about.html": "about",
    "connectors.html": "connectors",
    "stories.html": "stories",
    "community.html": "community",
}

def main() -> None:
    for filename, active in PAGES.items():
        path = ROOT / filename
        text = path.read_text(encoding="utf-8")
        text = replace_header(text, active)
        path.write_text(text, encoding="utf-8")
        print("patched", filename)

    gpath = ROOT / "gathering.html"
    gtext = patch_gathering_style(gpath.read_text(encoding="utf-8"), "gathering")
    gpath.write_text(gtext, encoding="utf-8")
    print("patched gathering.html")

    spath = ROOT / "share-your-key.html"
    spath.write_text(patch_share_key(spath.read_text(encoding="utf-8")), encoding="utf-8")
    print("patched share-your-key.html")


if __name__ == "__main__":
    main()
