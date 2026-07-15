from __future__ import annotations

import html
import json
import math
import re
import shutil
from datetime import date
from pathlib import Path
from typing import Any

IMAGE_SUFFIXES = {".webp", ".png", ".jpg", ".jpeg", ".svg", ".avif"}
IGNORED_DIRECTORY_NAMES = {".git", "__MACOSX", "node_modules", "dist"}
IGNORED_TOUR_SUFFIXES = {
    ".dxf", ".dwg", ".obj", ".plan", ".zip", ".7z", ".rar", ".toml", ".md", ".txt"
}
WORD_NUMBERS = {
    "zero": 0,
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
}


class RawProjectError(ValueError):
    pass


def slugify(value: str) -> str:
    value = value.strip().lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "project"


def titleize(value: str) -> str:
    cleaned = re.sub(r"[_-]+", " ", value)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned.title()


def _iter_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in IGNORED_DIRECTORY_NAMES or part.startswith(".") for part in path.relative_to(root).parts):
            continue
        files.append(path)
    return files


def _directory_score(folder: Path) -> int:
    try:
        files = [p for p in folder.iterdir() if p.is_file()]
    except OSError:
        return -1
    score = 0
    for path in files:
        suffix = path.suffix.lower()
        name = path.name.lower()
        if suffix == ".html":
            score += 12 if any(word in name for word in ("walkthrough", "interactive", "viewer", "tour")) else 7
        elif suffix == ".glb":
            score += 8
        elif suffix == ".dxf":
            score += 3
        elif name in {"readme.txt", "readme.md"}:
            score += 4
        elif name.startswith("cover") and suffix in IMAGE_SUFFIXES:
            score += 6
    return score


def find_raw_root(project_folder: Path) -> Path:
    candidates: list[tuple[int, int, Path]] = []
    base_parts = len(project_folder.parts)
    for folder in [project_folder, *[p for p in project_folder.rglob("*") if p.is_dir()]]:
        relative_parts = len(folder.parts) - base_parts
        if relative_parts > 3:
            continue
        if any(part in IGNORED_DIRECTORY_NAMES or part.startswith(".") for part in folder.relative_to(project_folder).parts):
            continue
        score = _directory_score(folder)
        if score > 0:
            candidates.append((score, -relative_parts, folder))
    if not candidates:
        raise RawProjectError("does not contain a recognizable walkthrough package")
    candidates.sort(key=lambda item: (item[0], item[1]), reverse=True)
    return candidates[0][2]


def _best_file(files: list[Path], suffix: str, keywords: tuple[str, ...]) -> Path | None:
    candidates = [p for p in files if p.suffix.lower() == suffix]
    if not candidates:
        return None
    return max(
        candidates,
        key=lambda p: (
            sum(1 for word in keywords if word in p.name.lower()),
            -len(p.relative_to(p.parents[len(p.parts) - 1]).parts) if len(p.parts) else 0,
            p.stat().st_size,
        ),
    )


def discover_raw_files(raw_root: Path) -> dict[str, Any]:
    files = _iter_files(raw_root)
    readmes = [p for p in files if p.name.lower() in {"readme.txt", "readme.md"}]
    covers = [
        p for p in files
        if p.suffix.lower() in IMAGE_SUFFIXES and p.stem.lower() in {"cover", "project-cover", "hero", "featured"}
    ]
    if not covers:
        covers = [p for p in files if p.suffix.lower() in IMAGE_SUFFIXES and "cover" in p.stem.lower()]
    viewers = [p for p in files if p.suffix.lower() == ".html"]
    glbs = [p for p in files if p.suffix.lower() == ".glb"]
    dxfs = sorted([p for p in files if p.suffix.lower() == ".dxf"], key=lambda p: p.name.lower())

    def viewer_score(path: Path) -> tuple[int, int]:
        name = path.name.lower()
        score = sum(5 for word in ("walkthrough", "interactive", "viewer", "tour") if word in name)
        return score, path.stat().st_size

    def glb_score(path: Path) -> tuple[int, int]:
        name = path.name.lower()
        score = sum(5 for word in ("walkable", "model", "house", "property") if word in name)
        return score, path.stat().st_size

    viewer = max(viewers, key=viewer_score) if viewers else None
    glb = max(glbs, key=glb_score) if glbs else None
    cover = min(covers, key=lambda p: (len(p.relative_to(raw_root).parts), p.name.lower())) if covers else None
    readme = min(readmes, key=lambda p: (len(p.relative_to(raw_root).parts), p.name.lower())) if readmes else None
    collision = next((p for p in files if p.name.lower() == "collision.json"), None)

    return {
        "all": files,
        "readme": readme,
        "cover": cover,
        "viewer": viewer,
        "glb": glb,
        "dxfs": dxfs,
        "collision": collision,
    }


def _read_text(path: Path | None) -> str:
    if not path:
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def infer_title(raw_root: Path, files: dict[str, Any], readme_text: str) -> str:
    for line in readme_text.splitlines():
        line = line.strip(" \t#*=-")
        if not line:
            continue
        line = re.split(r"\s+[—–-]\s+(?:DELIVERABLES|PACKAGE|FILES|README)\b", line, maxsplit=1, flags=re.I)[0]
        if 2 <= len(line) <= 100 and not re.fullmatch(r"(?:MAIN|SUPPORTING) FILES", line, re.I):
            return titleize(line)

    for key in ("viewer", "glb"):
        path = files.get(key)
        if path:
            stem = path.stem
            stem = re.sub(
                r"(?i)(?:[-_ ]+(?:interactive|keyboard|turn|walkthrough|walkable|model|viewer|tour|complete|package))+$",
                "",
                stem,
            )
            if stem:
                return titleize(stem)
    return titleize(raw_root.name)


def _section(text: str, heading: str) -> str:
    lines = text.splitlines()
    start = None
    for index, line in enumerate(lines):
        if line.strip().upper() == heading.upper():
            start = index + 1
            break
    if start is None:
        return ""
    collected: list[str] = []
    for line in lines[start:]:
        stripped = line.strip()
        if collected and stripped and stripped == stripped.upper() and re.fullmatch(r"[A-Z0-9 /&()'’-]+", stripped):
            break
        if stripped:
            collected.append(stripped)
        elif collected:
            break
    return " ".join(collected).strip()


def infer_summary(title: str, readme_text: str) -> str:
    summary = _section(readme_text, "MODEL CONCEPT")
    if summary:
        return summary
    paragraphs = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n", readme_text) if p.strip()]
    for paragraph in paragraphs:
        if len(paragraph) >= 80 and not paragraph.upper().startswith(("DESKTOP", "MOBILE", "MAIN FILES", "SUPPORTING FILES")):
            return paragraph
    return f"Explore the floor plans and interactive 3D walkthrough for {title}."


def _number(token: str | None) -> int | None:
    if token is None:
        return None
    token = token.lower().strip()
    if token in WORD_NUMBERS:
        return WORD_NUMBERS[token]
    try:
        return int(token.replace(",", ""))
    except ValueError:
        return None


def infer_facts(text: str) -> dict[str, Any]:
    lower = text.lower()
    square_feet = None
    match = re.search(r"([0-9][0-9,]{2,})\s*(?:square\s*feet|sq\.?\s*ft\.?)", lower)
    if match:
        square_feet = int(match.group(1).replace(",", ""))

    number_token = r"(?:\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)"
    bedrooms = None
    match = re.search(rf"\b({number_token})[-\s]+bedroom", lower)
    if match:
        bedrooms = _number(match.group(1))

    full_bathrooms = None
    half_bathrooms = None
    match = re.search(r"\b(\d+(?:\.\d+)?)\s*(?:bathrooms?|baths?)\b", lower)
    if match:
        baths = float(match.group(1))
        full_bathrooms = int(math.floor(baths))
        half_bathrooms = 1 if baths - full_bathrooms >= 0.4 else 0

    garage = None
    match = re.search(rf"\b({number_token})[-\s]*car\s+garage\b", lower)
    if match:
        garage = _number(match.group(1))

    stories = None
    match = re.search(rf"\b({number_token})[-\s]*(?:story|stories)\b", lower)
    if match:
        stories = _number(match.group(1))

    return {
        "square_feet": square_feet or 0,
        "bedrooms": bedrooms or 0,
        "full_bathrooms": full_bathrooms or 0,
        "half_bathrooms": half_bathrooms or 0,
        "garage": garage or 0,
        "stories": stories or 0,
        "lot_size": "",
    }


def infer_category(text: str) -> str:
    lowered = text.lower()
    if any(term in lowered for term in ("rehab", "fix-and-flip", "fix and flip", "renovation", "before and after", "transformation")):
        return "transformation"
    if any(term in lowered for term in ("mls", "listing", "for sale", "listed property")):
        return "property"
    return "concept-home"


def _floor_level(path: Path, project_slug: str) -> str:
    stem = slugify(path.stem)
    if stem.startswith(project_slug + "-"):
        stem = stem[len(project_slug) + 1:]
    if "drawing-index" in stem or stem == "index":
        return "Drawing Index"
    if any(term in stem for term in ("ground-floor", "main-floor", "first-floor")):
        return "Ground Floor"
    if any(term in stem for term in ("upper-floor", "second-floor", "level-2")):
        return "Upper Floor"
    if "basement" in stem:
        return "Basement"
    return titleize(stem)


def inspect_raw_project(project_folder: Path) -> tuple[Path, dict[str, Any], list[str]]:
    raw_root = find_raw_root(project_folder)
    files = discover_raw_files(raw_root)
    if not files["cover"] and raw_root != project_folder:
        outer_covers = [
            path for path in project_folder.iterdir()
            if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES and path.stem.lower() in {"cover", "project-cover", "hero", "featured"}
        ]
        if outer_covers:
            files["cover"] = sorted(outer_covers, key=lambda path: path.name.lower())[0]
    warnings: list[str] = []
    if not files["viewer"]:
        raise RawProjectError("is missing the walkthrough HTML file")
    if not files["glb"]:
        viewer_text = _read_text(files["viewer"])
        if not ("webgl" in viewer_text.lower() and ("collisions" in viewer_text.lower() or "id=\"data\"" in viewer_text.lower())):
            raise RawProjectError("is missing a GLB model and the HTML does not appear self-contained")
        warnings.append("no GLB found; using the self-contained walkthrough HTML")
    if not files["cover"]:
        warnings.append("cover.webp not found; a generated placeholder will be used")
    if not files["dxfs"]:
        warnings.append("no DXF floor plans found")
    return raw_root, files, warnings


def auto_project_from_folder(project_folder: Path) -> tuple[dict[str, Any], list[str]]:
    raw_root, files, warnings = inspect_raw_project(project_folder)
    readme_text = _read_text(files["readme"])
    title = infer_title(raw_root, files, readme_text)
    summary = infer_summary(title, readme_text)
    combined_text = "\n".join((readme_text, title, summary))
    slug = slugify(raw_root.name)
    category = infer_category(combined_text)
    cover = files["cover"]
    media_suffix = cover.suffix.lower() if cover else ".svg"
    media_path = f"assets/cover{media_suffix}"

    floor_plans = []
    for dxf in files["dxfs"]:
        canonical_stem = slugify(dxf.stem)
        floor_plans.append({
            "level": _floor_level(dxf, slug),
            "image": f"floor-plans/{canonical_stem}.svg",
            "pdf": "",
            "dxf": f"floor-plans/{canonical_stem}.dxf",
            "caption": "Automatically generated browser preview with the original DXF available for download.",
            "_source_dxf": dxf,
        })

    project = {
        "slug": slug,
        "category": category,
        "published": True,
        "featured": False,
        "status": "available",
        "status_label": "Available",
        "sort_order": 50,
        "updated": date.today().isoformat(),
        "identity": {
            "title": title,
            "subtitle": "Interactive property design package",
            "location": "Orovian Oasis",
            "year": date.today().year,
            "summary": summary,
        },
        "pricing": {
            "show": False,
            "currency": "USD",
            "amount": 0,
            "prefix": "",
            "suffix": "",
            "display_text": "",
            "checkout_url": "",
            "inquiry_url": "",
            "checkout_label": "Purchase Package",
            "inquiry_label": "Request Details",
        },
        "facts": infer_facts(combined_text),
        "media": {"cover": media_path, "card": media_path, "share": media_path},
        "tour": {
            "enabled": bool(files["viewer"]),
            "label": "Launch 3D Walkthrough",
            "path": "tour/",
            "open_new_tab": False,
        },
        "seo": {"title": "", "description": "", "canonical_url": "", "noindex": False},
        "concept": {
            "product_type": "Digital architectural concept",
            "license_type": "Contact Orovian Oasis for availability",
            "customizable": True,
            "construction_ready": False,
        },
        "floor_plans": floor_plans,
        "materials": [],
        "deliverables": [
            {"name": "Interactive 3D walkthrough", "included": bool(files["viewer"])},
            {"name": "Customer-facing floor plans", "included": bool(files["dxfs"])},
        ],
        "purchase_options": [],
        "_source": raw_root,
        "_project_folder": project_folder,
        "_raw": True,
        "_raw_files": files,
        "_raw_warnings": warnings,
    }
    return project, warnings


def _dxf_pairs(path: Path) -> list[tuple[int, str]]:
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    pairs: list[tuple[int, str]] = []
    for index in range(0, len(lines) - 1, 2):
        try:
            code = int(lines[index].strip())
        except ValueError:
            continue
        pairs.append((code, lines[index + 1].strip()))
    return pairs


def _dxf_entities(path: Path) -> list[tuple[str, dict[int, list[str]]]]:
    pairs = _dxf_pairs(path)
    in_entities = False
    entities: list[tuple[str, dict[int, list[str]]]] = []
    current_type: str | None = None
    current: dict[int, list[str]] = {}
    index = 0
    while index < len(pairs):
        code, value = pairs[index]
        if code == 0 and value == "SECTION" and index + 1 < len(pairs):
            next_code, next_value = pairs[index + 1]
            in_entities = next_code == 2 and next_value == "ENTITIES"
            index += 2
            continue
        if in_entities and code == 0 and value == "ENDSEC":
            if current_type:
                entities.append((current_type, current))
            break
        if in_entities and code == 0:
            if current_type:
                entities.append((current_type, current))
            current_type = value
            current = {}
        elif in_entities and current_type:
            current.setdefault(code, []).append(value)
        index += 1
    return entities


def _float(values: dict[int, list[str]], code: int, default: float = 0.0) -> float:
    try:
        return float(values.get(code, [str(default)])[0])
    except (ValueError, IndexError):
        return default


def _placeholder_svg(title: str, note: str) -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-label="{html.escape(title)}">
<rect width="1600" height="900" rx="42" fill="#f7f2ed"/>
<rect x="55" y="55" width="1490" height="790" rx="34" fill="none" stroke="#6e4cff" stroke-width="6" stroke-dasharray="18 16"/>
<path d="M270 620V360l260-155 260 155v260M505 620V455h105v165M790 620h510V330l-255-150-255 150" fill="none" stroke="#21162e" stroke-width="18" stroke-linejoin="round"/>
<text x="800" y="710" text-anchor="middle" font-family="Arial, sans-serif" font-size="62" font-weight="700" fill="#21162e">{html.escape(title)}</text>
<text x="800" y="775" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#5c5364">{html.escape(note)}</text>
</svg>'''


def render_dxf_to_svg(source: Path, destination: Path, title: str) -> None:
    try:
        entities = _dxf_entities(source)
        points: list[tuple[float, float]] = []
        primitives: list[tuple[str, Any]] = []
        for entity_type, values in entities:
            if entity_type == "LINE":
                x1, y1, x2, y2 = _float(values, 10), _float(values, 20), _float(values, 11), _float(values, 21)
                points.extend(((x1, y1), (x2, y2)))
                primitives.append(("line", (x1, y1, x2, y2)))
            elif entity_type == "CIRCLE":
                cx, cy, radius = _float(values, 10), _float(values, 20), abs(_float(values, 40))
                points.extend(((cx - radius, cy - radius), (cx + radius, cy + radius)))
                primitives.append(("circle", (cx, cy, radius)))
            elif entity_type == "ARC":
                cx, cy, radius = _float(values, 10), _float(values, 20), abs(_float(values, 40))
                start, end = _float(values, 50), _float(values, 51)
                if end < start:
                    end += 360
                arc_points = []
                steps = max(4, int((end - start) / 6) + 1)
                for step in range(steps + 1):
                    angle = math.radians(start + (end - start) * step / steps)
                    arc_points.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
                points.extend(arc_points)
                primitives.append(("polyline", arc_points))
            elif entity_type in {"TEXT", "MTEXT"}:
                x, y = _float(values, 10), _float(values, 20)
                text_value = " ".join(values.get(1, [])).strip()
                height = abs(_float(values, 40, 12.0)) or 12.0
                rotation = _float(values, 50, 0.0)
                if text_value:
                    estimated_width = max(height * 0.62 * len(text_value), height)
                    points.extend(((x, y - height), (x + estimated_width, y + height * 0.35)))
                    primitives.append(("text", (x, y, height, rotation, text_value)))
        if not points:
            raise ValueError("no supported DXF geometry")

        min_x = min(x for x, _ in points)
        max_x = max(x for x, _ in points)
        min_y = min(y for _, y in points)
        max_y = max(y for _, y in points)
        width = max(max_x - min_x, 1.0)
        height = max(max_y - min_y, 1.0)
        margin = max(width, height) * 0.06
        view_min_x = min_x - margin
        view_min_y = min_y - margin
        view_width = width + margin * 2
        view_height = height + margin * 2
        stroke = max(view_width, view_height) / 1100

        def sy(y: float) -> float:
            return max_y + min_y - y

        elements: list[str] = []
        for kind, data in primitives:
            if kind == "line":
                x1, y1, x2, y2 = data
                elements.append(f'<line x1="{x1:.4f}" y1="{sy(y1):.4f}" x2="{x2:.4f}" y2="{sy(y2):.4f}"/>')
            elif kind == "circle":
                cx, cy, radius = data
                elements.append(f'<circle cx="{cx:.4f}" cy="{sy(cy):.4f}" r="{radius:.4f}"/>')
            elif kind == "polyline":
                points_text = " ".join(f"{x:.4f},{sy(y):.4f}" for x, y in data)
                elements.append(f'<polyline points="{points_text}"/>')
            elif kind == "text":
                x, y, font_size, rotation, text_value = data
                safe = html.escape(text_value)
                elements.append(
                    f'<text x="{x:.4f}" y="{sy(y):.4f}" font-size="{font_size:.4f}" '
                    f'transform="rotate({-rotation:.4f} {x:.4f} {sy(y):.4f})">{safe}</text>'
                )

        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_min_x:.4f} {sy(max_y + margin):.4f} {view_width:.4f} {view_height:.4f}" role="img" aria-label="{html.escape(title)}">
<rect x="{view_min_x:.4f}" y="{sy(max_y + margin):.4f}" width="{view_width:.4f}" height="{view_height:.4f}" fill="#fbf8f4"/>
<g fill="none" stroke="#21162e" stroke-width="{stroke:.4f}" stroke-linecap="round" stroke-linejoin="round">
{''.join(element for element in elements if not element.startswith('<text'))}
</g>
<g fill="#21162e" font-family="Arial, sans-serif">{''.join(element for element in elements if element.startswith('<text'))}</g>
</svg>'''
    except Exception:
        svg = _placeholder_svg(title, "DXF download included")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(svg, encoding="utf-8")


def _write_cover_placeholder(destination: Path, title: str) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(_placeholder_svg(title, "Add cover.webp to this property folder"), encoding="utf-8")


def stage_raw_project(project: dict[str, Any], destination: Path) -> None:
    raw_root: Path = project["_source"]
    files: dict[str, Any] = project["_raw_files"]
    title = project.get("identity", {}).get("title", project["slug"])

    assets_dir = destination / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)
    cover: Path | None = files.get("cover")
    if cover:
        shutil.copy2(cover, assets_dir / f"cover{cover.suffix.lower()}")
    else:
        _write_cover_placeholder(assets_dir / "cover.svg", title)

    floor_dir = destination / "floor-plans"
    floor_dir.mkdir(parents=True, exist_ok=True)
    for item in project.get("floor_plans", []):
        source: Path = item["_source_dxf"]
        dxf_destination = destination / item["dxf"]
        dxf_destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, dxf_destination)
        render_dxf_to_svg(source, destination / item["image"], f"{title} — {item['level']}")

    tour_dir = destination / "tour"
    tour_dir.mkdir(parents=True, exist_ok=True)
    cover_resolved = cover.resolve() if cover else None
    for source in files["all"]:
        if cover_resolved and source.resolve() == cover_resolved:
            continue
        if source.suffix.lower() in IGNORED_TOUR_SUFFIXES:
            continue
        relative = source.relative_to(raw_root)
        target = tour_dir / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)

    viewer: Path = files["viewer"]
    viewer_relative = viewer.relative_to(raw_root).as_posix()
    canonical_viewer = tour_dir / "viewer.html"
    if viewer_relative != "viewer.html":
        target_json = json.dumps(viewer_relative)
        canonical_viewer.write_text(
            '<!doctype html><meta charset="utf-8">'
            f'<meta http-equiv="refresh" content="0;url={html.escape(viewer_relative, quote=True)}">'
            f'<script>location.replace({target_json});</script>',
            encoding="utf-8",
        )

    glb: Path | None = files.get("glb")
    if glb:
        canonical_glb = tour_dir / "house.glb"
        if glb.relative_to(raw_root).as_posix() != "house.glb":
            shutil.copy2(glb, canonical_glb)

    viewer_text = _read_text(viewer)
    collision_source: Path | None = files.get("collision")
    collision_destination = tour_dir / "collision.json"
    if collision_source:
        try:
            json.loads(collision_source.read_text(encoding="utf-8"))
            shutil.copy2(collision_source, collision_destination)
        except Exception:
            collision_destination.write_text(json.dumps({
                "generated": True,
                "embedded_in": viewer_relative if "collision" in viewer_text.lower() else None,
                "note": "Original collision file was not valid JSON; the walkthrough HTML remains the source of truth.",
            }, indent=2), encoding="utf-8")
    else:
        collision_destination.write_text(json.dumps({
            "generated": True,
            "embedded_in": viewer_relative if "collision" in viewer_text.lower() else None,
            "note": "Generated automatically by the one-folder importer.",
        }, indent=2), encoding="utf-8")

    manifest = {
        "generated": True,
        "title": title,
        "viewer": "viewer.html",
        "original_viewer": viewer_relative,
        "model": "house.glb" if glb else "",
        "original_model": glb.relative_to(raw_root).as_posix() if glb else "",
        "source_folder": raw_root.name,
    }
    (tour_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    (tour_dir / "index.html").write_text(
        '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=viewer.html">'
        '<script>location.replace("viewer.html");</script>',
        encoding="utf-8",
    )
