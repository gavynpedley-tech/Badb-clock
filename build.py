#!/usr/bin/env python3
"""Bundle the app into one self-contained HTML file (BadbClock.html).

The output runs from anywhere — downloaded onto a phone, opened from a
file manager, no server needed — so everything is inlined: styles,
script, and the avatar as a data URI.
"""
import base64
import pathlib

root = pathlib.Path(__file__).parent
html = (root / "index.html").read_text()
css = (root / "style.css").read_text()
js = (root / "app.js").read_text()
avatar = base64.b64encode((root / "avatar.svg").read_bytes()).decode()
eating = base64.b64encode((root / "avatar-eating.svg").read_bytes()).decode()
icon = base64.b64encode((root / "icon.svg").read_bytes()).decode()

js = js.replace('img: "avatar.svg"', f'img: "data:image/svg+xml;base64,{avatar}"')
js = js.replace('src="avatar-eating.svg"', f'src="data:image/svg+xml;base64,{eating}"')
# No service worker in the single-file build — file:// can't register one.
js = js.replace(
    'if ("serviceWorker" in navigator) {\n  navigator.serviceWorker.register("sw.js").catch(() => {});\n}\n',
    "",
)

html = html.replace('<link rel="manifest" href="manifest.webmanifest">\n', "")
html = html.replace(
    '<link rel="icon" href="icon.svg" type="image/svg+xml">',
    f'<link rel="icon" href="data:image/svg+xml;base64,{icon}" type="image/svg+xml">',
)
html = html.replace(
    '<link rel="stylesheet" href="style.css">',
    "<style>\n" + css + "</style>",
)
html = html.replace(
    '<script src="app.js"></script>',
    "<script>\n" + js + "</script>",
)

out = root / "BadbClock.html"
out.write_text(html)
print(f"wrote {out} ({out.stat().st_size} bytes)")
