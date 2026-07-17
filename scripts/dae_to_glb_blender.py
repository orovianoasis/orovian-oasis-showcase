"""Blender background script: convert one COLLADA/DAE scene to a self-contained GLB."""
from __future__ import annotations

import json
import math
import os
import sys
from pathlib import Path


def arguments() -> tuple[Path, Path, Path]:
    argv = sys.argv
    argv = argv[argv.index("--") + 1 :] if "--" in argv else []
    if len(argv) != 3:
        raise SystemExit("Usage: blender --background --python dae_to_glb_blender.py -- INPUT.dae OUTPUT.glb REPORT.json")
    return Path(argv[0]).resolve(), Path(argv[1]).resolve(), Path(argv[2]).resolve()


def main() -> None:
    input_path, output_path, report_path = arguments()
    if not input_path.is_file():
        raise SystemExit(f"DAE input not found: {input_path}")

    import bpy  # type: ignore
    from mathutils import Vector  # type: ignore

    output_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    os.chdir(input_path.parent)

    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Blender 3.x exposes the built-in COLLADA importer through wm.collada_import.
    if not hasattr(bpy.ops.wm, "collada_import"):
        raise RuntimeError(
            "This Blender build does not include COLLADA import. "
            "Use Blender 3.x (the GitHub workflow installs the compatible Ubuntu package)."
        )
    def supported(operator, values):
        try:
            identifiers = {item.identifier for item in operator.get_rna_type().properties}
            return {key: value for key, value in values.items() if key in identifiers}
        except Exception:
            return values

    import_args = supported(bpy.ops.wm.collada_import, {
        "filepath": str(input_path),
        "import_units": True,
        "fix_orientation": True,
    })
    bpy.ops.wm.collada_import(**import_args)

    try:
        bpy.ops.preferences.addon_enable(module="io_scene_gltf2")
    except Exception:
        pass
    if not hasattr(bpy.ops.export_scene, "gltf"):
        raise RuntimeError("Blender's glTF exporter is unavailable")

    # Web walkthroughs do not need Chief-exported cameras or lights.
    for obj in list(bpy.data.objects):
        if obj.type in {"CAMERA", "LIGHT"}:
            bpy.data.objects.remove(obj, do_unlink=True)

    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError("The DAE imported successfully but contained no mesh objects.")

    # Make external texture references absolute before the GLB exporter embeds them.
    missing_images: list[str] = []
    for image in bpy.data.images:
        if image.source != "FILE" or not image.filepath:
            continue
        raw = bpy.path.abspath(image.filepath, start=str(input_path.parent))
        image.filepath = raw
        try:
            image.reload()
        except Exception:
            if not Path(raw).is_file():
                missing_images.append(raw)

    # Calculate scene bounds for diagnostics and automatic camera defaults.
    minimum = Vector((math.inf, math.inf, math.inf))
    maximum = Vector((-math.inf, -math.inf, -math.inf))
    for obj in meshes:
        for corner in obj.bound_box:
            point = obj.matrix_world @ Vector(corner)
            minimum.x = min(minimum.x, point.x)
            minimum.y = min(minimum.y, point.y)
            minimum.z = min(minimum.z, point.z)
            maximum.x = max(maximum.x, point.x)
            maximum.y = max(maximum.y, point.y)
            maximum.z = max(maximum.z, point.z)

    export_args = dict(
        filepath=str(output_path),
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
        export_extras=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_texcoords=True,
        export_normals=True,
    )
    bpy.ops.export_scene.gltf(**supported(bpy.ops.export_scene.gltf, export_args))

    if not output_path.is_file() or output_path.stat().st_size < 100:
        raise RuntimeError("Blender did not produce a valid GLB file.")

    report = {
        "source": input_path.name,
        "output": output_path.name,
        "blender_version": bpy.app.version_string,
        "mesh_objects": len(meshes),
        "materials": len(bpy.data.materials),
        "images": len(bpy.data.images),
        "missing_images": missing_images,
        "bounds": {
            "min": [round(float(value), 6) for value in minimum],
            "max": [round(float(value), 6) for value in maximum],
        },
        "output_bytes": output_path.stat().st_size,
    }
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
