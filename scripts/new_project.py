from __future__ import annotations
import argparse, re, shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
MAP={"concept-home":"concept-home-template","transformation":"transformation-template","property":"property-template"}
p=argparse.ArgumentParser(); p.add_argument("slug"); p.add_argument("category",choices=MAP); p.add_argument("--title",default="New Project")
a=p.parse_args()
if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*",a.slug): raise SystemExit("Slug must use lowercase letters, numbers, and hyphens only.")
src=ROOT/"content/project-templates"/MAP[a.category]; dst=ROOT/"content/projects"/a.slug
if dst.exists(): raise SystemExit(f"Already exists: {dst}")
shutil.copytree(src,dst)
path=dst/"project.toml"; text=path.read_text(encoding="utf-8").replace(f'slug = "{MAP[a.category]}"',f'slug = "{a.slug}"',1).replace('published = false','published = false',1)
start=text.find('[identity]')
if start>=0:
    before=text[:start]; after=text[start:]
    after=re.sub(r'title = ".*?"',f'title = "{a.title.replace(chr(34), chr(39))}"',after,count=1)
    text=before+after
path.write_text(text,encoding="utf-8")
print(f"Created {dst}")
print("Edit project.toml, replace assets, then set published = true when ready.")
