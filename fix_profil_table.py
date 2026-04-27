import re, os

# Read approved header
with open(r'C:\DEV\sandbox\Superpowers-Trial_one\approved_header.html', 'r', encoding='utf-8') as f:
    HEADER = f.read()

# Read profil page for footer
with open(r'C:\DEV\sandbox\Superpowers-Trial_one\.superpowers\brainstorm\2619-1777306653\content\spieler-profil.html', 'r', encoding='utf-8') as f:
    full = f.read()

tabs_start = full.find('<!-- Bottom Tabs -->')
FOOTER = full[tabs_start:]

# Game data (chronological). Tagessieg = Frank was top winner that day
# For mockup: 100€, 90€, 80€ are clearly Tagessiege
game_days = [
    ("01", "2025", "16.01.25", 40, False),
    ("02", "2025", "06.02.25", 60, False),
    ("02", "2025", "27.02.25", 0, False),
    ("03", "2025", "20.03.25", 50, False),
    ("04", "2025", "24.04.25", 100, True),   # Tagessieg
    ("05", "2025", "22.05.25", 40, False),
    ("10", "2025", "16.10.25", 0, False),
    ("11", "2025", "18.11.25", 70, False),
    ("12", "2025", "05.12.25", 80, True),    # Tagessieg
    ("01", "2026", "15.01.26", 70, False),
    ("02", "2026", "19.02.26", 30, False),
    ("03", "2026", "05.03.26", 90, True),    # Tagessieg
]

max_val = max(v for _, _, _, v, _ in game_days)

# Bar chart
bars_html = ""
prev_year = None
for month, year, date, val, sieg in game_days:
    pct = max(int((val / max_val) * 100), 5) if val > 0 else 5
    if val == 0:
        color = "#6A7575"
    elif sieg:
        color = "#C94A2B"
    else:
        color = "#E9B63A"

    if prev_year and year != prev_year:
        bars_html += '        <div style="min-width:2px;background:#0E1A1A;height:100%;opacity:0.25;align-self:stretch;margin:0 2px"></div>\n'

    show_year = year if year != prev_year else ""
    year_color = "#0E1A1A" if show_year else "transparent"

    bars_html += f'''        <div style="min-width:28px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%">
          <div style="width:100%;background:{color};border-radius:3px 3px 0 0;height:{pct}%"></div>
          <div style="font-size:9px;color:#6A7575;margin-top:3px;font-family:'Oswald',sans-serif">{month}</div>
          <div style="font-size:7px;color:{year_color};font-family:'Oswald',sans-serif;letter-spacing:0.02em">{show_year}</div>
        </div>
'''
    prev_year = year

# Table rows (newest first) - red ONLY for Tagessieg, gray for 0, black otherwise
rows_html = ""
for _, _, date, val, sieg in reversed(game_days):
    if sieg:
        val_style = "color:#C94A2B;font-weight:700;"
    elif val == 0:
        val_style = "color:#6A7575;"
    else:
        val_style = ""
    rows_html += f'''      <tr style="font-family:'Oswald',sans-serif;font-weight:600">
        <td style="padding:6px 2px;border-bottom:1px solid rgba(14,26,26,0.15)">{date}</td>
        <td style="padding:6px 14px 6px 2px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;{val_style}font-size:13px">{val}\u20ac</td>
      </tr>
'''

profil = f"""
  <!-- Spieler Profil -->
  <style>
    .scroll-warm::-webkit-scrollbar {{ width: 4px; height: 4px; }}
    .scroll-warm::-webkit-scrollbar-track {{ background: transparent; }}
    .scroll-warm::-webkit-scrollbar-thumb {{ background: #C4A882; border-radius: 4px; }}
    .scroll-warm::-webkit-scrollbar-thumb:hover {{ background: #A8906A; }}
  </style>
  <div style="padding:12px">

    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <span style="font-size:18px;cursor:pointer;color:#6A7575">\u25c0</span>
      <span style="font-family:'Alfa Slab One',serif;font-size:24px;color:#1E4A3C">Frank</span>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:6px">
      <div style="flex:1;text-align:center">
        <span style="background:#C94A2B;color:#F2E7CE;padding:3px 10px;border-radius:5px;font-family:'Oswald',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.06em">PLATZ 1</span>
      </div>
      <div style="flex:1;text-align:center"></div>
      <div style="flex:1;text-align:center">
        <span style="background:#1E4A3C;color:#F2E7CE;padding:3px 10px;border-radius:5px;font-family:'Oswald',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.06em">PLATZ 1</span>
      </div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:14px">
      <div style="flex:1;background:#FFFCF4;border:2px solid #0E1A1A;border-radius:8px;padding:10px;text-align:center">
        <div style="font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;color:#C94A2B;letter-spacing:0.04em">590\u20ac</div>
        <div style="font-family:'Oswald',sans-serif;font-size:9px;text-transform:uppercase;letter-spacing:0.14em;color:#6A7575;margin-top:2px">Gesamt</div>
      </div>
      <div style="flex:1;background:#FFFCF4;border:2px solid #0E1A1A;border-radius:8px;padding:10px;text-align:center">
        <div style="font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;color:#0E1A1A">11</div>
        <div style="font-family:'Oswald',sans-serif;font-size:9px;text-transform:uppercase;letter-spacing:0.14em;color:#6A7575;margin-top:2px">Spieltage</div>
      </div>
      <div style="flex:1;background:#FFFCF4;border:2px solid #0E1A1A;border-radius:8px;padding:10px;text-align:center">
        <div style="font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;color:#1E4A3C;letter-spacing:0.04em">53,64\u20ac</div>
        <div style="font-family:'Oswald',sans-serif;font-size:9px;text-transform:uppercase;letter-spacing:0.14em;color:#6A7575;margin-top:2px">\u20ac/Spieltag</div>
      </div>
    </div>

    <div style="font-family:'Oswald',sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:#6A7575;font-weight:600;margin-bottom:6px">Entwicklung</div>
    <div class="scroll-warm" style="background:#FFFCF4;border:2px solid #0E1A1A;border-radius:8px;padding:10px 10px 6px;margin-bottom:14px;overflow-x:auto">
      <div style="display:flex;align-items:flex-end;gap:4px;height:80px;min-width:max-content">
{bars_html}      </div>
    </div>

    <div style="font-family:'Oswald',sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:#6A7575;font-weight:600;margin-bottom:6px">Spieltage</div>
    <div class="scroll-warm" style="max-height:180px;overflow-y:auto">
      <table style="width:100%;border-collapse:collapse;font-size:12px">
{rows_html}      </table>
    </div>

  </div>

  """

final = HEADER + profil + FOOTER

content_dir = r'C:\DEV\sandbox\Superpowers-Trial_one\.superpowers\brainstorm\2619-1777306653\content'
for f in os.listdir(content_dir):
    os.remove(os.path.join(content_dir, f))

out = os.path.join(content_dir, 'spieler-profil.html')
with open(out, 'w', encoding='utf-8') as f:
    f.write(final)

print('Done')
