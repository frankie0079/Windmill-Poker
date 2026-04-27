import markdown2, os

with open(r'C:\DEV\sandbox\Superpowers-Trial_one\docs\superpowers\specs\2026-04-27-poker-score-tracker-design.md', 'r', encoding='utf-8') as f:
    md = f.read()

body = markdown2.markdown(md, extras=['tables', 'fenced-code-blocks'])

html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Work+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  body {{
    margin: 0; padding: 20px;
    background: #1a1a2e;
    display: flex; justify-content: center;
  }}
  .spec {{
    background: #F2E7CE;
    border-radius: 14px;
    border: 2px solid #0E1A1A;
    padding: 24px;
    max-width: 600px;
    width: 100%;
    font-family: 'Work Sans', sans-serif;
    color: #0E1A1A;
    font-size: 13px;
    line-height: 1.6;
  }}
  h1 {{ font-family: 'Oswald', sans-serif; font-size: 22px; color: #C94A2B; margin-top: 0; }}
  h2 {{ font-family: 'Oswald', sans-serif; font-size: 17px; color: #1E4A3C; border-bottom: 2px solid rgba(14,26,26,0.2); padding-bottom: 4px; margin-top: 24px; }}
  h3 {{ font-family: 'Oswald', sans-serif; font-size: 14px; color: #0E1A1A; margin-top: 16px; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0; }}
  th, td {{ padding: 6px 8px; border: 1px solid rgba(14,26,26,0.2); text-align: left; }}
  th {{ background: #E8D9B5; font-family: 'Oswald', sans-serif; font-weight: 600; }}
  code {{ background: rgba(14,26,26,0.06); padding: 1px 4px; border-radius: 3px; font-size: 12px; }}
  pre {{ background: rgba(14,26,26,0.06); padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 11px; }}
  pre code {{ background: none; padding: 0; }}
  ul, ol {{ padding-left: 20px; }}
  li {{ margin-bottom: 4px; }}
  hr {{ border: none; border-top: 2px solid rgba(14,26,26,0.15); margin: 20px 0; }}
</style>
</head>
<body>
<div class="spec">
{body}
</div>
</body>
</html>'''

content_dir = r'C:\DEV\sandbox\Superpowers-Trial_one\.superpowers\brainstorm\2619-1777306653\content'
for f in os.listdir(content_dir):
    os.remove(os.path.join(content_dir, f))

out = os.path.join(content_dir, 'design-spec.html')
with open(out, 'w', encoding='utf-8') as f:
    f.write(html)

print('Done:', out)
