from PIL import Image
import base64, io

img = Image.open('C:/DEV/sandbox/Superpowers-Trial_one/Logo_Windmill_Poker.png')
img.thumbnail((500, 500), Image.LANCZOS)
buf = io.BytesIO()
img.save(buf, format='PNG')
b64 = base64.b64encode(buf.getvalue()).decode()
logo_uri = f'data:image/png;base64,{b64}'

html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Oswald:wght@400;600;700&family=Work+Sans:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:24px;background:#1a1a2e;display:flex;justify-content:center">

<div style="
  background: #F2E7CE;
  background-image: radial-gradient(rgba(14,26,26,.04) 1px, transparent 1px), radial-gradient(rgba(14,26,26,.03) 1px, transparent 1px);
  background-size: 3px 3px, 7px 7px;
  border-radius: 14px;
  border: 2px solid #0E1A1A;
  overflow: hidden;
  font-family: 'Work Sans', sans-serif;
  color: #0E1A1A;
  width: 375px;
  max-width: 375px;
">
  <!-- Header -->
  <div style="background:#C94A2B;color:#F2E7CE;padding:4px 16px;display:flex;align-items:center;gap:10px;justify-content:center;">
    <img src="{logo_uri}"
         style="height:70px;width:auto;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35))">
    <span style="font-family:'Alfa Slab One',serif;font-size:22px;letter-spacing:0.02em;line-height:1;white-space:nowrap">WINDMILL POKER</span>
  </div>

  <!-- Spieltage Liste -->
  <div style="padding:10px">

    <!-- ST12 - geschlossen -->
    <button style="width:100%;padding:10px 12px;margin-bottom:6px;background:#FFFCF4;border:2px solid #0E1A1A;border-radius:8px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:600;color:#0E1A1A;display:flex;justify-content:space-between;align-items:center;cursor:pointer">
      <span>05.03.26</span>
      <span style="color:#6A7575;font-size:12px">8 Spieler \u25B6</span>
    </button>

    <!-- ST11 - geschlossen -->
    <button style="width:100%;padding:10px 12px;margin-bottom:6px;background:#FFFCF4;border:2px solid #0E1A1A;border-radius:8px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:600;color:#0E1A1A;display:flex;justify-content:space-between;align-items:center;cursor:pointer">
      <span>19.02.26</span>
      <span style="color:#6A7575;font-size:12px">8 Spieler \u25B6</span>
    </button>

    <!-- ST10 - OFFEN (aufgeklappt) -->
    <div style="margin-bottom:6px;background:#FFFCF4;border:2px solid #C94A2B;border-radius:8px;overflow:hidden">
      <button style="width:100%;padding:10px 12px;background:transparent;border:none;font-family:'Oswald',sans-serif;font-size:14px;font-weight:600;color:#C94A2B;display:flex;justify-content:space-between;align-items:center;cursor:pointer">
        <span>15.01.26</span>
        <span style="font-size:12px">8 Spieler \u25BC</span>
      </button>
      <!-- Detail-Tabelle -->
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

    <!-- ST9 - geschlossen -->
    <button style="width:100%;padding:10px 12px;margin-bottom:6px;background:#FFFCF4;border:2px solid #0E1A1A;border-radius:8px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:600;color:#0E1A1A;display:flex;justify-content:space-between;align-items:center;cursor:pointer">
      <span>05.12.</span>
      <span style="color:#6A7575;font-size:12px">9 Spieler \u25B6</span>
    </button>

    <!-- ST8 - geschlossen -->
    <button style="width:100%;padding:10px 12px;margin-bottom:6px;background:#FFFCF4;border:2px solid #0E1A1A;border-radius:8px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:600;color:#0E1A1A;display:flex;justify-content:space-between;align-items:center;cursor:pointer">
      <span>18.11.</span>
      <span style="color:#6A7575;font-size:12px">8 Spieler \u25B6</span>
    </button>

    <!-- ST7 - geschlossen -->
    <button style="width:100%;padding:10px 12px;margin-bottom:6px;background:#FFFCF4;border:2px solid #0E1A1A;border-radius:8px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:600;color:#0E1A1A;display:flex;justify-content:space-between;align-items:center;cursor:pointer">
      <span>16.10.</span>
      <span style="color:#6A7575;font-size:12px">6 Spieler \u25B6</span>
    </button>

  </div>

  <!-- Bottom Tabs -->
  <div style="border-top:2px solid rgba(14,26,26,0.35);display:flex;background:#E8D9B5">
    <div style="flex:1;text-align:center;padding:10px 4px;font-size:10px;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:0.1em;color:#3A4747">
      <div style="font-size:18px;margin-bottom:2px">\U0001f4ca</div>Ranking
    </div>
    <div style="flex:1;text-align:center;padding:10px 4px;font-size:10px;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:0.1em;color:#C94A2B;font-weight:600;border-top:2px solid #C94A2B;margin-top:-2px">
      <div style="font-size:18px;margin-bottom:2px">\U0001f4c5</div>Spieltage
    </div>
    <div style="flex:1;text-align:center;padding:10px 4px;font-size:10px;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:0.1em;color:#3A4747">
      <div style="font-size:18px;margin-bottom:2px">\U0001f464</div>Spieler
    </div>
    <div style="flex:1;text-align:center;padding:10px 4px;font-size:10px;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:0.1em;color:#3A4747">
      <div style="font-size:18px;margin-bottom:2px">\u2699\ufe0f</div>Admin
    </div>
  </div>
</div>

</body>
</html>'''

outpath = r'C:\DEV\sandbox\Superpowers-Trial_one\.superpowers\brainstorm\1598-1777301666\content\spieltage.html'
with open(outpath, 'w', encoding='utf-8') as f:
    f.write(html)

print('Done:', outpath)
