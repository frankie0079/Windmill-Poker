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
  <!-- Header with Logo -->
  <div style="background:#C94A2B;color:#F2E7CE;padding:4px 16px;display:flex;align-items:center;gap:10px;justify-content:center;">
    <img src="{logo_uri}"
         style="height:70px;width:auto;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35))">
    <span style="font-family:'Alfa Slab One',serif;font-size:22px;letter-spacing:0.02em;line-height:1;white-space:nowrap">WINDMILL POKER</span>
  </div>

  <!-- Toggle -->
  <div style="display:flex;margin:6px 10px;border:2px solid #0E1A1A;border-radius:6px;overflow:hidden;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:0.14em;font-size:12px;font-weight:600">
    <div style="flex:1;padding:7px;text-align:center;background:#1E4A3C;color:#F2E7CE">Moneylist</div>
    <div style="flex:1;padding:7px;text-align:center;color:#3A4747">\u20ac/Spieltag</div>
  </div>

  <!-- Table -->
  <div style="padding:0 10px 2px">
    <table style="width:100%;border-collapse:collapse;font-size:13px;font-family:'Work Sans',sans-serif">
      <tr style="font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:0.14em;font-size:13px;color:#6A7575;font-weight:600">
        <td style="padding:6px 3px;border-bottom:2px solid rgba(14,26,26,0.35)">#</td>
        <td style="padding:6px 3px;border-bottom:2px solid rgba(14,26,26,0.35)">Spieler</td>
        <td style="padding:6px 3px;border-bottom:2px solid rgba(14,26,26,0.35);text-align:right">Gewinn</td>
        <td style="padding:6px 3px;border-bottom:2px solid rgba(14,26,26,0.35);text-align:right">ST</td>
      </tr>
      <tr style="font-weight:700;color:#C94A2B">
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15)">
          <span style="background:#C94A2B;color:#F2E7CE;padding:1px 5px;border-radius:3px;font-family:'Oswald',sans-serif;font-size:11px;font-weight:600">1</span>
        </td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);font-family:'Oswald',sans-serif;font-weight:600">Frank</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;font-family:'Oswald',sans-serif;font-size:14px;letter-spacing:0.06em">590\u20ac</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;font-size:12px">11</td>
      </tr>
      <tr>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15)">
          <span style="background:#E8D9B5;padding:1px 5px;border-radius:3px;font-family:'Oswald',sans-serif;font-size:11px;font-weight:600">2</span>
        </td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);font-family:'Oswald',sans-serif;font-weight:600">Peter</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;font-family:'Oswald',sans-serif;font-weight:600">510\u20ac</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;color:#6A7575;font-size:12px">11</td>
      </tr>
      <tr>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15)">
          <span style="background:#E8D9B5;padding:1px 5px;border-radius:3px;font-family:'Oswald',sans-serif;font-size:11px;font-weight:600">3</span>
        </td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);font-family:'Oswald',sans-serif;font-weight:600">Friedl</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;font-family:'Oswald',sans-serif;font-weight:600">437\u20ac</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;color:#6A7575;font-size:12px">10</td>
      </tr>
      <tr>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15)">
          <span style="color:#6A7575;padding:1px 5px;font-family:'Oswald',sans-serif;font-size:11px">4</span>
        </td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);font-family:'Oswald',sans-serif;font-weight:600">Werner</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;font-family:'Oswald',sans-serif;font-weight:600">377\u20ac</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;color:#6A7575;font-size:12px">10</td>
      </tr>
      <tr>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15)">
          <span style="color:#6A7575;padding:1px 5px;font-family:'Oswald',sans-serif;font-size:11px">5</span>
        </td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);font-family:'Oswald',sans-serif;font-weight:600">Rainer</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;font-family:'Oswald',sans-serif;font-weight:600">360\u20ac</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;color:#6A7575;font-size:12px">9</td>
      </tr>
      <tr>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15)">
          <span style="color:#6A7575;padding:1px 5px;font-family:'Oswald',sans-serif;font-size:11px">6</span>
        </td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);font-family:'Oswald',sans-serif;font-weight:600">Jochen</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;font-family:'Oswald',sans-serif;font-weight:600">307\u20ac</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;color:#6A7575;font-size:12px">9</td>
      </tr>
      <tr>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15)">
          <span style="color:#6A7575;padding:1px 5px;font-family:'Oswald',sans-serif;font-size:11px">7</span>
        </td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);font-family:'Oswald',sans-serif;font-weight:600">Torben</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;font-family:'Oswald',sans-serif;font-weight:600">220\u20ac</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;color:#6A7575;font-size:12px">6</td>
      </tr>
      <tr>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15)">
          <span style="color:#6A7575;padding:1px 5px;font-family:'Oswald',sans-serif;font-size:11px">8</span>
        </td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);font-family:'Oswald',sans-serif;font-weight:600">J\u00f6rg</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;font-family:'Oswald',sans-serif;font-weight:600">180\u20ac</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;color:#6A7575;font-size:12px">4</td>
      </tr>
      <tr>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15)">
          <span style="color:#6A7575;padding:1px 5px;font-family:'Oswald',sans-serif;font-size:11px">9</span>
        </td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);font-family:'Oswald',sans-serif;font-weight:600">Ciano</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;font-family:'Oswald',sans-serif;font-weight:600">160\u20ac</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;color:#6A7575;font-size:12px">5</td>
      </tr>
      <tr>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15)">
          <span style="color:#6A7575;padding:1px 5px;font-family:'Oswald',sans-serif;font-size:11px">10</span>
        </td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);font-family:'Oswald',sans-serif;font-weight:600">Jens</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;font-family:'Oswald',sans-serif;font-weight:600">140\u20ac</td>
        <td style="padding:6px 3px;border-bottom:1px solid rgba(14,26,26,0.15);text-align:right;color:#6A7575;font-size:12px">7</td>
      </tr>
      <tr>
        <td style="padding:6px 3px">
          <span style="color:#6A7575;padding:1px 5px;font-family:'Oswald',sans-serif;font-size:11px">11</span>
        </td>
        <td style="padding:6px 3px;font-family:'Oswald',sans-serif;font-weight:600">Martin</td>
        <td style="padding:6px 3px;text-align:right;font-family:'Oswald',sans-serif;font-weight:600">0\u20ac</td>
        <td style="padding:6px 3px;text-align:right;color:#6A7575;font-size:12px">0</td>
      </tr>
    </table>
  </div>

  <!-- Bottom Tabs -->
  <div style="border-top:2px solid rgba(14,26,26,0.35);display:flex;background:#E8D9B5">
    <div style="flex:1;text-align:center;padding:10px 4px;font-size:10px;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:0.1em;color:#C94A2B;font-weight:600;border-top:2px solid #C94A2B;margin-top:-2px">
      <div style="font-size:18px;margin-bottom:2px">\U0001f4ca</div>Ranking
    </div>
    <div style="flex:1;text-align:center;padding:10px 4px;font-size:10px;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:0.1em;color:#3A4747">
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

outpath = r'C:\DEV\sandbox\Superpowers-Trial_one\.superpowers\brainstorm\1598-1777301666\content\ranking-aloha-v12.html'
with open(outpath, 'w', encoding='utf-8') as f:
    f.write(html)

print('Done:', outpath)
