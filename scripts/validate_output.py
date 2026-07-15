from __future__ import annotations
import json, struct, sys
from pathlib import Path

root=Path(sys.argv[1] if len(sys.argv)>1 else "dist")
errors=[]
for required in ["index.html","404.html","api/catalog.json","sitemap.xml","robots.txt","css/site.css","js/site.js","js/contact.js","assets/brand/logo.webp","assets/brand/logo-tight.webp","privacy/index.html","terms/index.html"]:
    p=root/required
    if not p.exists() or p.stat().st_size==0: errors.append(f"missing or empty: {required}")
try:
    catalog=json.loads((root/"api/catalog.json").read_text(encoding="utf-8"))
except Exception as exc:
    errors.append(f"catalog JSON error: {exc}"); catalog={"projects":[]}
for project in catalog.get("projects",[]):
    url=project.get("url","").strip("/")
    folder=root/url
    for required in ["index.html","floor-plans/index.html","tour/index.html"]:
        p=folder/required
        if not p.exists() or p.stat().st_size==0: errors.append(f"{project.get('slug')}: missing {required}")
    if project.get("tour",{}).get("enabled"):
        tour=folder/"tour"
        for required in ("viewer.html","house.glb","collision.json","manifest.json"):
            target=tour/required
            if not target.exists() or target.stat().st_size==0: errors.append(f"{project.get('slug')}: enabled tour missing or empty {required}")
        for name in ("collision.json","manifest.json"):
            target=tour/name
            if target.exists():
                try: json.loads(target.read_text(encoding="utf-8"))
                except Exception as exc: errors.append(f"{project.get('slug')}: invalid {name}: {exc}")
        glb=tour/"house.glb"
        if glb.exists():
            header=glb.read_bytes()[:12]
            if len(header)!=12: errors.append(f"{project.get('slug')}: truncated GLB")
            else:
                magic,version,declared=struct.unpack("<III",header)
                if magic!=0x46546C67 or version!=2 or declared!=glb.stat().st_size: errors.append(f"{project.get('slug')}: invalid GLB 2.0 header")
if errors:
    print("\n".join("ERROR: "+x for x in errors)); raise SystemExit(1)
print(f"Output validation passed for {len(catalog.get('projects',[]))} project(s).")
