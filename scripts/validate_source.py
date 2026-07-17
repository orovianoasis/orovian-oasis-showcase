from __future__ import annotations

import json
import re
import sys
import tomllib
from pathlib import Path

from raw_project import RawProjectError, inspect_raw_project

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []

required_files = [
    "website/index.html",
    "website/_layout.html",
    "website/listing.html",
    "website/project.html",
    "website/floor-plans.html",
    "website/tour-placeholder.html",
    "website/privacy.html",
    "website/terms.html",
    "website/404.html",
    "website/css/site.css",
    "website/css/mobile.css",
    "website/js/site.js",
    "website/js/contact.js",
    "website/js/mobile.js",
    "content/site.toml",
    "content/navigation.toml",
    "assets/brand/logo-tight.webp",
    "assets/brand/logo-badge.webp",
    "assets/brand/favicon.png",
    "scripts/build_site.py",
    "scripts/raw_project.py",
    "scripts/build_walkthroughs.py",
    "scripts/dae_to_glb_blender.py",
    "walkthrough-system/viewer-template.html",
    "walkthrough-system/viewer.bundle.js",
    "walkthrough-system/package.json",
]
for relative in required_files:
    path = ROOT / relative
    if not path.is_file() or path.stat().st_size == 0:
        errors.append(f"missing or empty source file: {relative}")

layout = (ROOT / "website/_layout.html")
if layout.exists():
    text = layout.read_text(encoding="utf-8", errors="replace")
    for token in ("{{CONTENT}}", "{{NAV}}", "{{ROOT}}css/site.css", "{{ROOT}}css/mobile.css", "{{ROOT}}js/site.js", "{{ROOT}}js/contact.js", "{{ROOT}}js/mobile.js"):
        if token not in text:
            errors.append(f"website/_layout.html is missing required token: {token}")

home = ROOT / "website/index.html"
if home.exists() and "{{PROJECT_GRID}}" not in home.read_text(encoding="utf-8", errors="replace"):
    errors.append("website/index.html is missing {{PROJECT_GRID}}")

for toml_path in [ROOT / "content/site.toml", ROOT / "content/navigation.toml"]:
    if toml_path.exists():
        try:
            with toml_path.open("rb") as handle:
                tomllib.load(handle)
        except Exception as exc:
            errors.append(f"invalid TOML {toml_path.relative_to(ROOT)}: {exc}")

projects = ROOT / "content/projects"
if projects.exists():
    seen_slugs: set[str] = set()
    for folder in sorted(projects.iterdir()):
        if not folder.is_dir() or folder.name.startswith("_"):
            continue
        project_file = folder / "project.toml"
        if not project_file.exists():
            try:
                raw_root, files, warnings = inspect_raw_project(folder)
                slug = re.sub(r"[^a-z0-9]+", "-", raw_root.name.lower()).strip("-")
                if slug in seen_slugs:
                    errors.append(f"{folder.name}: generated duplicate slug: {slug}")
                seen_slugs.add(slug)
                print(f"AUTO PROJECT {slug}: one-folder package recognized")
                for warning in warnings:
                    print(f"AUTO PROJECT {slug}: {warning}")
            except RawProjectError as exc:
                errors.append(f"{folder.name}: {exc}")
            continue
        try:
            with project_file.open("rb") as handle:
                project = tomllib.load(handle)
        except Exception as exc:
            errors.append(f"{folder.name}: invalid project.toml: {exc}")
            continue
        slug = project.get("slug", "")
        if slug != folder.name:
            errors.append(f"{folder.name}: slug must match folder name")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
            errors.append(f"{folder.name}: invalid slug")
        if slug in seen_slugs:
            errors.append(f"{folder.name}: duplicate slug: {slug}")
        seen_slugs.add(slug)


if errors:
    print("\n".join("ERROR: " + error for error in errors))
    sys.exit(1)
print("Source structure validation passed.")
