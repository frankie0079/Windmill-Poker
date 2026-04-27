"""
Rebuild ALL pages from a single source of truth for header + footer.
Header and footer are extracted from the approved spieler-profil-v7.html.
"""
import re, os

# === 1. Read the approved profil page as source of truth ===
with open(r'C:\DEV\sandbox\Superpowers-Trial_one\.superpowers\brainstorm\2619-1777306653\content\spieler-profil-v7.html', 'r', encoding='utf-8') as f:
    approved = f.read()

# Extract header: everything before "<!-- Spieler Profil -->"
header_end = approved.find('<!-- Spieler Profil -->')
HEADER = approved[:header_end]

# Extract footer: from "<!-- Bottom Tabs -->" to end of the card + body + html
tabs_start = approved.find('<!-- Bottom Tabs -->')
# Need the raw footer without any active tab set - make all inactive
raw_footer = approved[tabs_start:]

# Reset all tabs to inactive
raw_footer = raw_footer.replace(
    'color:#C94A2B;font-weight:600;border-top:2px solid #C94A2B;margin-top:-2px',
    'color:#3A4747'
)

def make_footer(active_tab):
    """Return footer HTML with the given tab active."""
    f = raw_footer
    icons = {
        'Ranking': '\U0001f4ca',
        'Spieltage': '\U0001f4c5',
        'Spieler': '\U0001f464',
        'Admin': '\u2699\ufe0f',
    }
    icon = icons[active_tab]
    f = f.replace(
        f'color:#3A4747">\n      <div style="font-size:18px;margin-bottom:2px">{icon}</div>{active_tab}',
        f'color:#C94A2B;font-weight:600;border-top:2px solid #C94A2B;margin-top:-2px">\n      <div style="font-size:18px;margin-bottom:2px">{icon}</div>{active_tab}'
    )
    return f

# Save header as reusable file
with open(r'C:\DEV\sandbox\Superpowers-Trial_one\approved_header.html', 'w', encoding='utf-8') as f:
    f.write(HEADER)
print('Saved approved_header.html')

# === 2. Read existing ranking content from v13 ===
with open(r'C:\DEV\sandbox\Superpowers-Trial_one\.superpowers\brainstorm\1598-1777301666\content\ranking-aloha-v13.html', 'r', encoding='utf-8') as f:
    rk = f.read()

# Extract ranking middle content (between header and bottom tabs)
rk_toggle = rk.find('<!-- Toggle -->')
rk_tabs = rk.find('<!-- Bottom Tabs -->')
ranking_content = rk[rk_toggle:rk_tabs]

# === 3. Spieltage content (from gen_spieltage_v3.py output, but regenerate) ===
spieltage_content = """
  <!-- Spieltage Liste -->
  <div style="padding:10px">

    <button style="width:100%;padding:10px 12px;margin-bottom:6px;background:#FFFCF4;border:2px solid #0E1A1A;border-radius:8px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:600;color:#0E1A1A;display:flex;justify-content:space-between;align-items:center;cursor:pointer">
      <span>05.03.26</span>
      <span style="color:#6A7575;font-size:12px">8 Spieler \u25b6</span>
    </button>

    <button style="width:100%;padding:10px 12px;margin-bottom:6px;background:#FFFCF4;border:2px solid #0E1A1A;border-radius:8px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:600;color:#0E1A1A;display:flex;justify-content:space-between;align-items:center;cursor:pointer">
      <span>19.02.26</span>
      <span style="color:#6A7575;font-size:12px">8 Spieler \u25b6</span>
    </button>

    <div style="margin-bottom:6px;background:#FFFCF4;border:2px solid #C94A2B;border-radius:8px;overflow:hidden">
      <button style="width:100%;padding:10px 12px;background:transparent;border:none;font-family:'Oswald',sans-serif;font-size:14px;font-weight:600;color:#C94A2B;display:flex;justify-content:space-between;align-items:center;cursor:pointer">
        <span>15.01.26</span>
        <span style="font-size:12px">8 Spieler \u25bc</span>
      </button>
      <div style="padding:0 10px 10px">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <tr style="font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:0.1em;font-size:11px;color:#6A7575;font-weight:600">
            <td style="padding:4px 2px;border-bottom:2px solid rgba(14,26,26,0.35)">Spieler</td>
            <td style="padding:4px 2px;border-bottom:2px solid rgba(14,26,26,0.35);text-align:right">Gesamt</td>
            <td style="padding:4px 2px;border-bottom:2px solid rgba(14,26,26,0.35);text-align:right">R1</td>
            <td style="padding:4px 2px;border-bottom:2px solid rgba(14,26,26,0.35);text-align:right">R2</td>
          </tr>
          <tr style="font-family:'Oswald',sans-serif;font-weight:600;color:#C94A2B">
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15)">Frank</td>
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right">70\u20ac</td>
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right">20\u20ac</td>
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right">50\u20ac</td>
          </tr>
          <tr style="font-family:'Oswald',sans-serif;font-weight:600">
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15)">Werner</td>
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right">50\u20ac</td>
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right">50\u20ac</td>
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right">0\u20ac</td>
          </tr>
          <tr style="font-family:'Oswald',sans-serif;font-weight:600">
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15)">Ciano</td>
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right">50\u20ac</td>
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right">50\u20ac</td>
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right">0\u20ac</td>
          </tr>
          <tr style="font-family:'Oswald',sans-serif;font-weight:600">
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15)">Rainer</td>
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right">40\u20ac</td>
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right">0\u20ac</td>
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right">40\u20ac</td>
          </tr>
          <tr style="font-family:'Oswald',sans-serif;font-weight:600">
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15)">Torben</td>
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right">40\u20ac</td>
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right">40\u20ac</td>
            <td style="padding:5px 2px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right">0\u20ac</td>
          </tr>
          <tr style="font-family:'Oswald',sans-serif;font-weight:600">
            <td style="padding:5px 2px">Jens</td>
            <td style="padding:5px 2px;text-align:right">20\u20ac</td>
            <td style="padding:5px 2px;text-align:right">0\u20ac</td>
            <td style="padding:5px 2px;text-align:right">20\u20ac</td>
          </tr>
        </table>
      </div>
    </div>

    <button style="width:100%;padding:10px 12px;margin-bottom:6px;background:#FFFCF4;border:2px solid #0E1A1A;border-radius:8px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:600;color:#0E1A1A;display:flex;justify-content:space-between;align-items:center;cursor:pointer">
      <span>05.12.</span>
      <span style="color:#6A7575;font-size:12px">9 Spieler \u25b6</span>
    </button>

    <button style="width:100%;padding:10px 12px;margin-bottom:6px;background:#FFFCF4;border:2px solid #0E1A1A;border-radius:8px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:600;color:#0E1A1A;display:flex;justify-content:space-between;align-items:center;cursor:pointer">
      <span>18.11.</span>
      <span style="color:#6A7575;font-size:12px">8 Spieler \u25b6</span>
    </button>

    <button style="width:100%;padding:10px 12px;margin-bottom:6px;background:#FFFCF4;border:2px solid #0E1A1A;border-radius:8px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:600;color:#0E1A1A;display:flex;justify-content:space-between;align-items:center;cursor:pointer">
      <span>16.10.</span>
      <span style="color:#6A7575;font-size:12px">6 Spieler \u25b6</span>
    </button>

  </div>

  """

# === 4. Profil content (extract from approved) ===
profil_start = approved.find('<!-- Spieler Profil -->')
profil_end = approved.find('<!-- Bottom Tabs -->')
profil_content = approved[profil_start:profil_end]

# === 5. Write all three pages ===
output_dir = r'C:\DEV\sandbox\Superpowers-Trial_one\.superpowers\brainstorm\2619-1777306653\content'

# Clear output dir
for f in os.listdir(output_dir):
    os.remove(os.path.join(output_dir, f))

pages = {
    'ranking.html': (ranking_content, 'Ranking'),
    'spieltage.html': (spieltage_content, 'Spieltage'),
    'spieler-profil.html': (profil_content, 'Spieler'),
}

for filename, (content, active_tab) in pages.items():
    html = HEADER + content + make_footer(active_tab)
    path = os.path.join(output_dir, filename)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)

# Also update the old session ranking
old_ranking = os.path.join(r'C:\DEV\sandbox\Superpowers-Trial_one\.superpowers\brainstorm\1598-1777301666\content', 'ranking-aloha-v14.html')
with open(old_ranking, 'w', encoding='utf-8') as f:
    f.write(HEADER + ranking_content + make_footer('Ranking'))

# === 6. Verify all headers are identical ===
print('\n=== VERIFICATION ===')
for filename in ['ranking.html', 'spieltage.html', 'spieler-profil.html']:
    path = os.path.join(output_dir, filename)
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    m = re.search(r'<img\s+src=[^>]+style="([^"]+)"', c)
    m2 = re.search(r'<div style="(background:#C94A2B[^"]+)"', c)
    print(f'{filename}:')
    print(f'  IMG: {m.group(1) if m else "?"}')
    print(f'  HDR: {m2.group(1) if m2 else "?"}')

print('\nAll pages rebuilt from single header source.')
