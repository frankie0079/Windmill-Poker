import re, os

# Read approved header
with open(r'C:\DEV\sandbox\Superpowers-Trial_one\approved_header.html', 'r', encoding='utf-8') as f:
    HEADER = f.read()

# Read any page for footer template
with open(r'C:\DEV\sandbox\Superpowers-Trial_one\.superpowers\brainstorm\2619-1777306653\content\spieler-profil.html', 'r', encoding='utf-8') as f:
    full = f.read()

tabs_start = full.find('<!-- Bottom Tabs -->')
raw_footer = full[tabs_start:]

# Reset all tabs inactive
raw_footer = raw_footer.replace(
    'color:#C94A2B;font-weight:600;border-top:2px solid #C94A2B;margin-top:-2px',
    'color:#3A4747'
)
# Activate Admin tab
raw_footer = raw_footer.replace(
    'color:#3A4747">\n      <div style="font-size:18px;margin-bottom:2px">\u2699\ufe0f</div>Admin',
    'color:#C94A2B;font-weight:600;border-top:2px solid #C94A2B;margin-top:-2px">\n      <div style="font-size:18px;margin-bottom:2px">\u2699\ufe0f</div>Admin'
)

# Admin page: input flow for a new game day
# Step 1: Date + select players
# Step 2: Enter results per round (scroll picker mockup)
# Show Step 2 as the main view since that's the interesting UI

players = ["Frank", "Peter", "Friedl", "Werner", "Rainer", "Jochen", "Torben", "Ciano"]

# Build player checkboxes (Step 1 collapsed, Step 2 open)
player_checks = ""
for p in players:
    player_checks += f'''          <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(14,26,26,0.1)">
            <div style="width:20px;height:20px;border:2px solid #0E1A1A;border-radius:4px;background:#1E4A3C;display:flex;align-items:center;justify-content:center">
              <span style="color:#F2E7CE;font-size:12px;font-weight:700">\u2713</span>
            </div>
            <span style="font-family:'Oswald',sans-serif;font-weight:600;font-size:13px">{p}</span>
          </div>
'''

# Build scroll picker for round 1 (showing Frank's input)
picker_values = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

def make_picker_row(name, selected_val):
    # Show 3 values: before, selected, after
    idx = picker_values.index(selected_val) if selected_val in picker_values else 0
    before = picker_values[idx - 1] if idx > 0 else ""
    after = picker_values[idx + 1] if idx < len(picker_values) - 1 else ""
    return f'''        <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(14,26,26,0.1)">
          <span style="font-family:'Oswald',sans-serif;font-weight:600;font-size:13px;width:70px">{name}</span>
          <div style="display:flex;align-items:center;gap:0;background:#FFFCF4;border:2px solid #0E1A1A;border-radius:6px;overflow:hidden;width:100px">
            <div style="flex:1;text-align:center;padding:2px 0;font-family:'Oswald',sans-serif;font-size:10px;color:#C4A882">{before}\u20ac</div>
            <div style="flex:1;text-align:center;padding:4px 0;font-family:'Oswald',sans-serif;font-size:16px;font-weight:700;color:#C94A2B;background:rgba(201,74,43,0.08);border-left:1px solid rgba(14,26,26,0.1);border-right:1px solid rgba(14,26,26,0.1)">{selected_val}\u20ac</div>
            <div style="flex:1;text-align:center;padding:2px 0;font-family:'Oswald',sans-serif;font-size:10px;color:#C4A882">{after}\u20ac</div>
          </div>
        </div>
'''

# Simulated round 1 results
round1_data = [
    ("Frank", 50), ("Peter", 0), ("Friedl", 40), ("Werner", 50),
    ("Rainer", 0), ("Jochen", 20), ("Torben", 0), ("Ciano", 0),
]

picker_rows = ""
for name, val in round1_data:
    picker_rows += make_picker_row(name, val)

# Topf = 8 players * 20€ = 160€. Sum of selected = 50+0+40+50+0+20+0+0 = 160. Valid!
topf = len(round1_data) * 20
current_sum = sum(v for _, v in round1_data)
check_color = "#1E4A3C" if current_sum == topf else "#C94A2B"
check_icon = "\u2713" if current_sum == topf else "\u2717"

admin = f"""
  <!-- Admin -->
  <style>
    .scroll-warm::-webkit-scrollbar {{ width: 4px; height: 4px; }}
    .scroll-warm::-webkit-scrollbar-track {{ background: transparent; }}
    .scroll-warm::-webkit-scrollbar-thumb {{ background: #C4A882; border-radius: 4px; }}
    .scroll-warm::-webkit-scrollbar-thumb:hover {{ background: #A8906A; }}
  </style>
  <div style="padding:12px">

    <!-- Title -->
    <div style="font-family:'Alfa Slab One',serif;font-size:18px;color:#1E4A3C;margin-bottom:10px">Neuer Spieltag</div>

    <!-- Step 1: Date + Players (collapsed summary) -->
    <div style="background:#FFFCF4;border:2px solid #0E1A1A;border-radius:8px;padding:10px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-family:'Oswald',sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:#6A7575;font-weight:600">Datum</div>
          <div style="font-family:'Oswald',sans-serif;font-size:16px;font-weight:700">27.04.26</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:'Oswald',sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:#6A7575;font-weight:600">Spieler</div>
          <div style="font-family:'Oswald',sans-serif;font-size:16px;font-weight:700">8 Spieler</div>
        </div>
      </div>
    </div>

    <!-- Step 2: Round input -->
    <div style="background:#FFFCF4;border:2px solid #C94A2B;border-radius:8px;overflow:hidden;margin-bottom:8px">

      <!-- Round tabs -->
      <div style="display:flex;border-bottom:2px solid rgba(14,26,26,0.15)">
        <div style="flex:1;text-align:center;padding:8px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#F2E7CE;background:#C94A2B">1. Runde</div>
        <div style="flex:1;text-align:center;padding:8px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#6A7575">2. Runde</div>
      </div>

      <!-- Picker area -->
      <div class="scroll-warm" style="padding:8px 12px;max-height:240px;overflow-y:auto">
{picker_rows}
      </div>

      <!-- Validation -->
      <div style="padding:8px 12px;border-top:2px solid rgba(14,26,26,0.15);display:flex;justify-content:space-between;align-items:center">
        <span style="font-family:'Oswald',sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6A7575;font-weight:600">Topf: {topf}\u20ac</span>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;color:{check_color}">{current_sum}\u20ac / {topf}\u20ac</span>
          <span style="color:{check_color};font-size:16px;font-weight:700">{check_icon}</span>
        </div>
      </div>
    </div>

    <!-- Save button -->
    <button style="width:100%;padding:12px;background:#1E4A3C;color:#F2E7CE;border:2px solid #0E1A1A;border-radius:8px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.14em;cursor:pointer">Spieltag speichern</button>

  </div>

  """

final = HEADER + admin + raw_footer

content_dir = r'C:\DEV\sandbox\Superpowers-Trial_one\.superpowers\brainstorm\2619-1777306653\content'
for f in os.listdir(content_dir):
    os.remove(os.path.join(content_dir, f))

out = os.path.join(content_dir, 'admin.html')
with open(out, 'w', encoding='utf-8') as f:
    f.write(final)

print('Done:', out)
