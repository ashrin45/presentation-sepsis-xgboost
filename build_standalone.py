"""
Construit un index_standalone.html auto-suffisant : tout le CSS et le JS inlinés,
et le contenu de deck.json injecté dans window.deckData avant le data-loader.
Le fichier produit s'ouvre depuis le disque par double-clic, hors ligne.

Usage:
    python build_standalone.py
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / 'index.html'
DST = ROOT / 'index_standalone.html'
DATA = ROOT / 'assets' / 'data' / 'deck.json'


def read(path):
    return path.read_text(encoding='utf-8')


def inline_css(html):
    pattern = re.compile(r'<link\s+rel="stylesheet"\s+href="([^"]+)">')
    def repl(m):
        css_path = ROOT / m.group(1)
        return f'<style>\n{read(css_path)}\n</style>'
    return pattern.sub(repl, html)


def inline_js(html):
    pattern = re.compile(r'<script\s+src="([^"]+)"(\s+defer)?\s*></script>')
    def repl(m):
        src = m.group(1)
        js_path = ROOT / src
        content = read(js_path)
        # data-loader.js fait un fetch ; on le neutralise en injectant deckData en dur
        if src.endswith('data-loader.js'):
            deck_json = read(DATA)
            return (
                f'<script>\n'
                f'window.deckData = {deck_json};\n'
                f'window.deckDataReady = Promise.resolve(window.deckData);\n'
                f'document.addEventListener("DOMContentLoaded", () => '
                f'document.dispatchEvent(new CustomEvent("deckdataready", '
                f'{{ detail: window.deckData }})));\n'
                f'</script>'
            )
        return f'<script>\n{content}\n</script>'
    return pattern.sub(repl, html)


def main():
    html = read(SRC)
    html = inline_css(html)
    html = inline_js(html)
    DST.write_text(html, encoding='utf-8')
    size_kb = DST.stat().st_size / 1024
    print(f'OK  {DST.name}  ({size_kb:.0f} Ko)')


if __name__ == '__main__':
    main()
