"""Generate reusable walkthrough assets for raw Chief Architect COLLADA exports."""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path, PureWindowsPath
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PROJECTS = ROOT / "content" / "projects"
SYSTEM = ROOT / "walkthrough-system"
CACHE = ROOT / ".walkthrough-cache"
GENERATED_NAME = ".walkthrough-build"
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".webp"}
DETAILS_FILENAMES = ("property-details.json", "project-details.json")


def slugify(value: str) -> str:
    value = value.strip().lower().replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-") or "project"


def titleize(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[_-]+", " ", value)).strip().title()


def load_details(folder: Path) -> dict[str, Any]:
    for name in DETAILS_FILENAMES:
        candidates = [folder / name, *folder.glob(f"*/{name}")]
        for path in candidates:
            if path.is_file():
                value = json.loads(path.read_text(encoding="utf-8"))
                if not isinstance(value, dict):
                    raise ValueError(f"{path} must contain one JSON object")
                return value
    return {}


def has_existing_custom_tour(folder: Path) -> bool:
    html_files = [path for path in folder.rglob("*.html") if GENERATED_NAME not in path.parts]
    glb_files = [path for path in folder.rglob("*.glb") if GENERATED_NAME not in path.parts]
    return bool(html_files and glb_files)


def dae_candidates(folder: Path) -> list[Path]:
    return sorted(
        [path for path in folder.rglob("*") if path.is_file() and path.suffix.lower() == ".dae" and GENERATED_NAME not in path.parts],
        key=lambda path: (
            -sum(word in path.name.lower() for word in ("house", "model", "property", "walkthrough", "export")),
            len(path.relative_to(folder).parts),
            path.name.lower(),
        ),
    )


def _resolve_texture(dae: Path, project_folder: Path, raw_value: str) -> Path | None:
    value = urllib.parse.unquote(raw_value.strip()).replace("\\", "/")
    if value.startswith("file://"):
        parsed = urllib.parse.urlparse(value)
        value = parsed.path or parsed.netloc
    direct = Path(value)
    candidates: list[Path] = []
    if direct.is_absolute():
        candidates.append(direct)
    else:
        candidates.extend(((dae.parent / direct), (project_folder / direct)))
    basename = PureWindowsPath(value).name or Path(value).name
    if basename:
        candidates.extend(sorted(project_folder.rglob(basename), key=lambda path: (len(path.relative_to(project_folder).parts), path.as_posix().lower())))
        lower = basename.lower()
        candidates.extend(sorted(
            (path for path in project_folder.rglob("*") if path.is_file() and path.name.lower() == lower),
            key=lambda path: (len(path.relative_to(project_folder).parts), path.as_posix().lower()),
        ))
    seen: set[Path] = set()
    for candidate in candidates:
        candidate = candidate.resolve()
        if candidate in seen:
            continue
        seen.add(candidate)
        if candidate.is_file() and candidate.suffix.lower() in IMAGE_SUFFIXES:
            return candidate
    return None


def referenced_textures(dae: Path, project_folder: Path) -> list[Path]:
    results: list[Path] = []
    try:
        root = ET.parse(dae).getroot()
    except ET.ParseError:
        return results
    seen: set[Path] = set()
    for element in root.iter():
        if element.tag.rsplit("}", 1)[-1].lower() != "init_from" or not element.text:
            continue
        candidate = _resolve_texture(dae, project_folder, element.text)
        if candidate and candidate not in seen:
            seen.add(candidate)
            results.append(candidate)
    return sorted(results)


def prepare_dae(dae: Path, project_folder: Path, destination: Path) -> list[Path]:
    tree = ET.parse(dae)
    root = tree.getroot()
    resolved: list[Path] = []
    seen: set[Path] = set()
    for element in root.iter():
        if element.tag.rsplit("}", 1)[-1].lower() != "init_from" or not element.text:
            continue
        texture = _resolve_texture(dae, project_folder, element.text)
        if texture:
            element.text = texture.as_uri()
            if texture not in seen:
                seen.add(texture)
                resolved.append(texture)
    destination.parent.mkdir(parents=True, exist_ok=True)
    tree.write(destination, encoding="utf-8", xml_declaration=True)
    return sorted(resolved)


def fingerprint(dae: Path, project_folder: Path) -> str:
    digest = hashlib.sha256()
    files = [dae, *referenced_textures(dae, project_folder)]
    for path in files:
        digest.update(path.name.encode("utf-8", errors="replace"))
        with path.open("rb") as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                digest.update(chunk)
    converter = ROOT / "scripts" / "dae_to_glb_blender.py"
    if converter.is_file():
        digest.update(converter.read_bytes())
    digest.update(b"orovian-walkthrough-converter-v1")
    return digest.hexdigest()


def nested(details: dict[str, Any], key: str, default: Any = None) -> Any:
    walkthrough = details.get("walkthrough")
    if isinstance(walkthrough, dict) and key in walkthrough:
        return walkthrough[key]
    flat = f"walkthrough_{key}"
    return details.get(flat, default)


def walkthrough_config(folder: Path, details: dict[str, Any], model_file: str = "house.glb") -> dict[str, Any]:
    title = str(details.get("title") or (details.get("identity") or {}).get("title") or titleize(folder.name)).strip()
    config: dict[str, Any] = {
        "title": title,
        "model": model_file,
        "model_scale": nested(details, "model_scale", 1),
        "model_offset": nested(details, "model_offset", [0, 0, 0]),
        "model_rotation_degrees": nested(details, "model_rotation_degrees", [0, 0, 0]),
        "entry_position": nested(details, "entry_position", None),
        "entry_target": nested(details, "entry_target", None),
        "entry_fov": nested(details, "entry_fov", 70),
        "exterior_position": nested(details, "exterior_position", None),
        "exterior_target": nested(details, "exterior_target", None),
        "exterior_fov": nested(details, "exterior_fov", 76),
        "exterior_distance_scale": nested(details, "exterior_distance_scale", 0.92),
        "exterior_screen_fill": nested(details, "exterior_screen_fill", 0.90),
        "exterior_elevation_degrees": nested(details, "exterior_elevation_degrees", 19),
        "exterior_angle_degrees": nested(details, "exterior_angle_degrees", 0),
        "exterior_target_height_ratio": nested(details, "exterior_target_height_ratio", 0.42),
        "exterior_front_direction": nested(details, "exterior_front_direction", None),
        "door_match": nested(details, "door_match", ["(^|[_\\s-])door([_\\s-]|$)", "entry[_\\s-]?door", "interior[_\\s-]?door", "pivot[_\\s-]?door", "glass[_\\s-]?door"]),
        "door_exclude": nested(details, "door_exclude", ["garage[_\\s-]?door", "cabinet", "drawer", "doorway", "frame", "trim", "handle", "knob"]),
        "door_open_angle_degrees": nested(details, "door_open_angle_degrees", 88),
        "door_animation_seconds": nested(details, "door_animation_seconds", 0.55),
        "door_max_distance": nested(details, "door_max_distance", 12),
        "garage_door_match": nested(details, "garage_door_match", ["garage[_\\s-]?door", "overhead[_\\s-]?door", "sectional[_\\s-]?door", "roll[_\\s-]?up[_\\s-]?door"]),
        "garage_door_exclude": nested(details, "garage_door_exclude", ["frame", "trim", "track", "opener", "motor", "hardware", "handle", "knob"]),
        "garage_door_animation_seconds": nested(details, "garage_door_animation_seconds", 0.9),
        "garage_door_lift_ratio": nested(details, "garage_door_lift_ratio", 0.92),
        "garage_door_inset_ratio": nested(details, "garage_door_inset_ratio", 0.3),
        "garage_door_max_distance": nested(details, "garage_door_max_distance", 60),
        "roof_match": nested(details, "roof_match", ["roof", "roofing"]),
        "slab_match": nested(details, "slab_match", ["slab", "floor platform", "floor-platform", "floor system", "upper platform"]),
        "collision_exclude": nested(details, "collision_exclude", ["glass", "window", "curtain", "fixture", "furniture", "plant", "landscape"]),
        "eye_height": nested(details, "eye_height", 1.68),
        "player_radius": nested(details, "player_radius", 0.28),
        "walk_speed": nested(details, "walk_speed", 3.6),
        "run_speed": nested(details, "run_speed", 7.2),
        "fly_speed": nested(details, "fly_speed", 6.2),
        "step_height": nested(details, "step_height", 0.38),
        "max_drop": nested(details, "max_drop", 1.2),
        "background": nested(details, "background", "#8da8b6"),
    }
    return config


def run_blender(blender: str, dae: Path, glb: Path, report: Path) -> None:
    command = [
        blender,
        "--background",
        "--factory-startup",
        "--python",
        str(ROOT / "scripts" / "dae_to_glb_blender.py"),
        "--",
        str(dae),
        str(glb),
        str(report),
    ]
    print("CONVERT:", " ".join(command))
    subprocess.run(command, check=True)


def build_project(folder: Path, blender: str, force: bool = False) -> str:
    candidates = dae_candidates(folder)
    if not candidates:
        return "none"
    details = load_details(folder)
    prefer_dae = bool(nested(details, "prefer_dae", False))
    if has_existing_custom_tour(folder) and not force and not prefer_dae:
        return "existing"

    dae = candidates[0]
    key = fingerprint(dae, folder)
    cached = CACHE / key
    cached_glb = cached / "house.glb"
    cached_report = cached / "conversion-report.json"
    generated = folder / GENERATED_NAME
    if generated.exists():
        shutil.rmtree(generated)
    generated.mkdir(parents=True)

    if not cached_glb.is_file() or not cached_report.is_file() or force:
        cached.mkdir(parents=True, exist_ok=True)
        prepared_dae = cached / "prepared-model.dae"
        textures = prepare_dae(dae, folder, prepared_dae)
        print(f"TEXTURES: {folder.name} resolved {len(textures)} referenced image(s)")
        run_blender(blender, prepared_dae, cached_glb, cached_report)
    else:
        print(f"CACHE: {folder.name} uses {key[:12]}")

    shutil.copy2(cached_glb, generated / "house.glb")
    if cached_report.is_file():
        try:
            report_data = json.loads(cached_report.read_text(encoding="utf-8"))
            report_data["source"] = dae.relative_to(folder).as_posix()
            report_data["missing_images"] = [Path(value).name for value in report_data.get("missing_images", [])]
            (generated / "conversion-report.json").write_text(json.dumps(report_data, indent=2), encoding="utf-8")
        except Exception:
            shutil.copy2(cached_report, generated / "conversion-report.json")

    config = walkthrough_config(folder, details)
    title = config["title"]
    template = (SYSTEM / "viewer-template.html").read_text(encoding="utf-8")
    (generated / "viewer.html").write_text(template.replace("__PROJECT_TITLE__", html.escape(title, quote=True)), encoding="utf-8")
    shutil.copy2(SYSTEM / "viewer.bundle.js", generated / "viewer.bundle.js")
    (generated / "walkthrough-config.json").write_text(json.dumps(config, indent=2), encoding="utf-8")
    (generated / "collision.json").write_text(json.dumps({
        "generated": True,
        "mode": "runtime-bvh",
        "source": "house.glb",
        "note": "Floor following and collision are derived from the converted GLB in the browser.",
    }, indent=2), encoding="utf-8")
    manifest = {
        "generated": True,
        "generator": "Orovian Oasis Chief Architect DAE importer",
        "title": title,
        "viewer": "viewer.html",
        "model": "house.glb",
        "configuration": "walkthrough-config.json",
        "source_model": dae.relative_to(folder).as_posix(),
        "source_fingerprint": key,
    }
    (generated / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    (generated / "index.html").write_text(
        '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=viewer.html"><script>location.replace("viewer.html")</script>',
        encoding="utf-8",
    )
    print(f"GENERATED: {folder.name} from {dae.relative_to(folder)}")
    return "generated"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--projects", default=str(PROJECTS))
    parser.add_argument("--blender", default=os.environ.get("BLENDER_BIN", "blender"))
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()

    projects = Path(args.projects).resolve()
    CACHE.mkdir(parents=True, exist_ok=True)
    counts = {"generated": 0, "existing": 0, "none": 0, "failed": 0}
    errors: list[str] = []
    for folder in sorted(path for path in projects.iterdir() if path.is_dir() and not path.name.startswith(("_", "."))):
        try:
            result = build_project(folder, args.blender, args.force)
            counts[result] += 1
        except Exception as exc:
            counts["failed"] += 1
            errors.append(f"{folder.name}: {exc}")
    print("Walkthrough preparation:", ", ".join(f"{key}={value}" for key, value in counts.items()))
    if errors:
        for error in errors:
            print("ERROR:", error, file=sys.stderr)
        if args.strict:
            raise SystemExit(1)


if __name__ == "__main__":
    main()
