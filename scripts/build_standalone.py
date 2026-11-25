"""Build one HTML file that opens directly, with no server or internet needed."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
rows = json.loads((DIST / 'data/bridges_2024.json').read_text())
assert len(rows) == 813 and len({row['bin'] for row in rows}) == 813
data_js = 'window.BRIDGE_DATA = ' + json.dumps(rows, separators=(',', ':')) + ';\n'
(DIST / 'data/bridges.js').write_text(data_js)
html = (DIST / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + (DIST / 'styles.css').read_text() + '\n</style>')
for name in ['data/bridges.js', 'model.js', 'chart-motion.js', 'app.js']:
    code = (DIST / name).read_text().replace('</script', '<\\/script')
    html = html.replace(f'<script src="{name}"></script>', '<script>\n' + code + '\n</script>')
# The selected-record download also exports the whole inventory after Reset.
html = html.replace('<a href="data/bridges_2024.csv" download>Download the full CSV</a>', 'Use Reset, then Download selected records, for the full CSV.')
html = re.sub(r'<p class="project-downloads">.*?</p>', '', html)
target = ROOT / 'Counting_Crossings.html'
target.write_text(html)
(DIST / 'Counting_Crossings.html').write_text(html)
# GitHub Pages serves the generated root entry, not dist/index.html.
(ROOT / 'index.html').write_text(html)
print(f'Built {target.name}: {len(rows)} records, no runtime dependencies.')
