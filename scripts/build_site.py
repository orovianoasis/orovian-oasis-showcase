from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import sys
import tomllib
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content"
WEBSITE = ROOT / "website"
ASSETS = ROOT / "assets"
CATEGORY_PATHS = {"concept-home":"concept-homes", "transformation":"transformations", "property":"properties"}
CATEGORY_LABELS = {"concept-home":"Concept Home", "transformation":"Transformation", "property":"Property"}


def read_toml(path: Path):
    with path.open("rb") as f:
        return tomllib.load(f)


def esc(value):
    return html.escape(str(value or ""), quote=True)


def money(project, site):
    p = project.get("pricing", {})
    if not site.get("show_prices", True) or not p.get("show", True):
        return "Contact for pricing"
    if p.get("display_text"):
        return esc(p["display_text"])
    amount = p.get("amount", 0)
    currency = p.get("currency") or site.get("default_currency", "USD")
    symbols = {"USD":"$", "CAD":"C$", "EUR":"€", "GBP":"£"}
    symbol = symbols.get(currency, currency + " ")
    try: amount_text = f"{float(amount):,.0f}" if float(amount).is_integer() else f"{float(amount):,.2f}"
    except Exception: amount_text = str(amount)
    return esc(" ".join(x for x in [p.get("prefix", ""), symbol + amount_text, p.get("suffix", "")] if x))


def facts_html(project):
    f = project.get("facts", {})
    bits=[]
    mapping=[("square_feet","sq. ft."),("bedrooms","beds"),("full_bathrooms","full baths"),("half_bathrooms","half baths"),("garage","car garage"),("stories","stories")]
    for key,label in mapping:
        value=f.get(key)
        if value not in (None, "", 0, 0.0):
            if key == "square_feet": value=f"{int(value):,}"
            bits.append(f'<span class="fact">{esc(value)} {label}</span>')
    if f.get("lot_size"): bits.append(f'<span class="fact">{esc(f["lot_size"])}</span>')
    return "".join(bits)


def relative_root(depth):
    return "../" * depth


def nav_html(nav, root_prefix):
    out=[]
    for item in nav.get("items", []):
        url=item.get("url", "#")
        if url.startswith("/"):
            url=root_prefix + url.lstrip("/")
        attrs=' target="_blank" rel="noopener"' if item.get("external") else ""
        out.append(f'<a href="{esc(url)}"{attrs}>{esc(item.get("label"))}</a>')
    return "".join(out)


def resolved_site_url(value, root_prefix, fallback):
    url = str(value or fallback).strip()
    if url.startswith("/"):
        return root_prefix + url.lstrip("/")
    return url


def social_html(site):
    social = site.get("social", {})
    icons = {
        "instagram": '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></svg>',
        "facebook": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4.5c-.7-.1-1.7-.2-2.8-.2-2.8 0-4.7 1.7-4.7 4.9V12H6.4v4h3.1v7h4.2v-7h3.1l.5-4h-3.6V9.6c0-1.1.3-1.6 1.3-1.6Z" fill="currentColor" stroke="none"/></svg>',
        "youtube": '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none"/></svg>',
        "tiktok": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4v10.2a4.2 4.2 0 1 1-3.5-4.1V14a1.8 1.8 0 1 0 1.2 1.7V4h2.3Zm0 0c.4 2.2 1.7 3.5 4 3.9v3.3c-1.6-.1-3-.6-4-1.5"/></svg>'
    }
    labels = {"instagram":"Instagram", "facebook":"Facebook", "youtube":"YouTube", "tiktok":"TikTok"}
    parts=[]
    for key in ("instagram", "youtube", "tiktok", "facebook"):
        url = str(social.get(key, "") or "").strip()
        label = labels[key]
        if url:
            parts.append(f'<a class="social-link" href="{esc(url)}" target="_blank" rel="noopener" aria-label="{label}">{icons[key]}</a>')
        else:
            parts.append(f'<span class="social-link is-placeholder" title="Add the {label} URL in content/site.toml" aria-label="{label} link not configured">{icons[key]}</span>')
    return "".join(parts)


def contact_values(site):
    contact = site.get("contact", {})
    email = str(contact.get("email", "") or "").strip()
    phone_display = str(contact.get("phone_display", "") or "").strip()
    phone_href = str(contact.get("phone_href", "") or "").strip()
    text_href = str(contact.get("text_href", "") or "").strip()
    endpoint = str(contact.get("form_endpoint", "") or "").strip()
    if phone_display and not phone_href:
        number = re.sub(r"[^0-9+]", "", phone_display)
        phone_href = f"tel:{number}" if number else ""
    if phone_display and not text_href:
        number = re.sub(r"[^0-9+]", "", phone_display)
        text_href = f"sms:{number}" if number else ""
    return {
        "email": email,
        "phone_display": phone_display,
        "phone_href": phone_href,
        "text_href": text_href,
        "endpoint": endpoint,
    }


def quick_contact_html(site):
    contact = contact_values(site)
    parts = []
    if contact["email"]:
        parts.append(
            f'<a class="contact-choice" href="mailto:{esc(contact["email"])}"><span class="contact-choice-icon" aria-hidden="true">✉️</span><span><strong>Email</strong><small>{esc(contact["email"])}</small></span></a>'
        )
    else:
        parts.append(
            '<span class="contact-choice is-disabled" title="Add contact.email in content/site.toml"><span class="contact-choice-icon" aria-hidden="true">✉️</span><span><strong>Email</strong><small>Add address in site.toml</small></span></span>'
        )

    phone_links = []
    phone_label = contact["phone_display"] or "Choose call or text"
    if contact["phone_href"]:
        phone_links.append(f'<a href="{esc(contact["phone_href"])}">📞 Call</a>')
    if contact["text_href"]:
        phone_links.append(f'<a href="{esc(contact["text_href"])}">💬 Text</a>')
    if phone_links:
        parts.append(
            '<details class="contact-choice-group"><summary class="contact-choice"><span class="contact-choice-icon" aria-hidden="true">☎️</span><span><strong>Call / Text</strong><small>'
            + esc(phone_label)
            + '</small></span></summary><div class="call-text-actions">'
            + ''.join(phone_links)
            + '</div></details>'
        )
    else:
        parts.append(
            '<span class="contact-choice is-disabled" title="Add phone links in content/site.toml"><span class="contact-choice-icon" aria-hidden="true">☎️</span><span><strong>Call / Text</strong><small>Add number in site.toml</small></span></span>'
        )
    return ''.join(parts)


def apply_base(content, *, site, nav, root_prefix, title, description, og_image, canonical, head_extra=""):
    base=(WEBSITE/"_layout.html").read_text(encoding="utf-8")
    contact = contact_values(site)
    form_action = contact["endpoint"] or (f'mailto:{contact["email"]}' if contact["email"] else "#contact-us")
    legal = site.get("legal", {})
    privacy_url = resolved_site_url(legal.get("privacy_url"), root_prefix, "/privacy/")
    terms_url = resolved_site_url(legal.get("terms_url"), root_prefix, "/terms/")
    replacements={
        "{{PAGE_TITLE}}":esc(title), "{{PAGE_DESCRIPTION}}":esc(description), "{{OG_IMAGE}}":esc(og_image),
        "{{CANONICAL_URL}}":esc(canonical), "{{ROOT}}":root_prefix, "{{HEAD_EXTRA}}":head_extra,
        "{{NAV}}":nav_html(nav, root_prefix), "{{CONTENT}}":content, "{{MAIN_SITE_URL}}":esc(site.get("main_site_url", "#")),
        "{{SOCIAL_LINKS}}":social_html(site), "{{QUICK_CONTACT_ACTIONS}}":quick_contact_html(site),
        "{{CONTACT_EMAIL}}":esc(contact["email"]), "{{CONTACT_FORM_ENDPOINT}}":esc(contact["endpoint"]),
        "{{CONTACT_FORM_ACTION}}":esc(form_action), "{{PRIVACY_URL}}":esc(privacy_url), "{{TERMS_URL}}":esc(terms_url)
    }
    for k,v in replacements.items(): base=base.replace(k,v)
    return base


def load_projects(strict=True):
    projects=[]; errors=[]; seen=set()
    root=CONTENT/"projects"
    for folder in sorted(root.iterdir() if root.exists() else []):
        if not folder.is_dir() or folder.name.startswith("_"): continue
        path=folder/"project.toml"
        if not path.exists():
            errors.append(f"{folder.name}: missing project.toml")
            continue
        try: p=read_toml(path)
        except Exception as exc:
            errors.append(f"{folder.name}: TOML error: {exc}")
            continue
        slug=p.get("slug","")
        if slug != folder.name: errors.append(f"{folder.name}: slug must match folder name")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug): errors.append(f"{folder.name}: invalid slug")
        if slug in seen: errors.append(f"{folder.name}: duplicate slug")
        seen.add(slug)
        if p.get("category") not in CATEGORY_PATHS: errors.append(f"{folder.name}: invalid category")
        ident=p.get("identity",{})
        for required in ("title","summary"):
            if not ident.get(required): errors.append(f"{folder.name}: identity.{required} is required")
        if p.get("published"):
            media=p.get("media",{})
            for field in ("cover","card","share"):
                rel=media.get(field,"")
                if rel and not (folder/rel).is_file(): errors.append(f"{folder.name}: media.{field} not found: {rel}")
            for item in p.get("floor_plans",[]):
                for field in ("image","pdf","dxf"):
                    rel=item.get(field,"")
                    if rel and not (folder/rel).is_file(): errors.append(f"{folder.name}: floor_plans.{field} not found: {rel}")
            if p.get("tour",{}).get("enabled"):
                for required in ("viewer.html","house.glb","collision.json","manifest.json"):
                    target=folder/"tour"/required
                    if not target.is_file() or target.stat().st_size==0: errors.append(f"{folder.name}: enabled tour missing or empty {required}")
        p["_source"]=folder
        projects.append(p)
    if errors and strict:
        raise SystemExit("\n".join("ERROR: "+e for e in errors))
    for e in errors: print("WARNING:", e)
    return projects


def card_html(project, site, root_prefix=""):
    category=CATEGORY_PATHS[project["category"]]
    ident=project.get("identity",{}); media=project.get("media",{})
    url=f'{root_prefix}{category}/{project["slug"]}/'
    image=f'{root_prefix}{category}/{project["slug"]}/{media.get("card") or media.get("cover") or "assets/placeholders/project-card.svg"}'
    return f'''<article class="card project-card" data-reveal data-tilt><a class="card-media" href="{esc(url)}"><img src="{esc(image)}" alt="{esc(ident.get("title"))}"><span class="media-sheen" aria-hidden="true"></span></a><div class="card-body">
<span class="badge">{esc(project.get("status_label", project.get("status", "")))}</span><h3>{esc(ident.get("title"))}</h3>
<p class="muted">{esc(ident.get("location"))}</p><p>{esc(ident.get("summary"))}</p><div class="facts">{facts_html(project)}</div>
<div class="price">{money(project,site)}</div><div class="actions"><a class="button primary" href="{esc(url)}">👁️ View Project</a></div></div></article>'''


def project_grid(projects, site, root_prefix=""):
    if not projects: return '<div class="empty">No published projects in this section yet.</div>'
    return '<div class="grid">'+''.join(card_html(p,site,root_prefix) for p in projects)+'</div>'


def copy_project_assets(project, destination):
    src=project["_source"]
    for name in ("assets","floor-plans"):
        source=src/name
        if source.exists(): shutil.copytree(source,destination/name,dirs_exist_ok=True)


def cta_buttons(project, site):
    pricing=project.get("pricing",{}); buttons=[]
    checkout=pricing.get("checkout_url")
    inquiry=pricing.get("inquiry_url") or site.get("contact",{}).get("inquiry_url")
    if checkout: buttons.append(f'<a class="button primary" href="{esc(checkout)}" target="_blank" rel="noopener">{esc(pricing.get("checkout_label") or site.get("commerce",{}).get("default_checkout_label","Purchase"))}</a>')
    if inquiry: buttons.append(f'<a class="button" href="{esc(inquiry)}">{esc(pricing.get("inquiry_label") or site.get("commerce",{}).get("default_inquiry_label","Request Details"))}</a>')
    return ''.join(buttons) or '<span class="muted">Purchase and inquiry links have not been added.</span>'


def special_section(project):
    category=project["category"]
    if category=="transformation":
        t=project.get("transformation",{}); rows=[]
        for label,key in [("Stage","project_stage"),("Property type","property_type"),("Duration","duration")]:
            if t.get(key): rows.append(f'<li><b>{label}</b><br>{esc(t[key])}</li>')
        if t.get("public_financials"):
            for label,key in [("Acquisition","acquisition_price"),("Rehab budget","rehab_budget"),("After-repair value","after_repair_value")]:
                if t.get(key): rows.append(f'<li><b>{label}</b><br>${float(t[key]):,.0f}</li>')
        return f'<div class="panel" data-reveal><h2>Transformation</h2><ul class="list">{"".join(rows) or "<li>Project story coming soon.</li>"}</ul></div>'
    if category=="property":
        p=project.get("property",{}); rows=[]
        for label,key in [("Listing type","listing_type"),("MLS","mls_number"),("Agent","agent_name")]:
            if p.get(key): rows.append(f'<li><b>{label}</b><br>{esc(p[key])}</li>')
        return f'<div class="panel" data-reveal><h2>Property Details</h2><ul class="list">{"".join(rows) or "<li>Listing details coming soon.</li>"}</ul></div>'
    c=project.get("concept",{}); rows=[]
    for label,key in [("Product type","product_type"),("License","license_type")]:
        if c.get(key): rows.append(f'<li><b>{label}</b><br>{esc(c[key])}</li>')
    rows.append(f'<li><b>Customizable</b><br>{"Yes" if c.get("customizable") else "No"}</li>')
    return f'<div class="panel" data-reveal><h2>Design Package</h2><ul class="list">{"".join(rows)}</ul></div>'


def materials_section(project, site):
    if not site.get("show_materials",True): return ""
    items=project.get("materials",[])
    if not items: return ""
    rows=''.join(f'<li><b>{esc(x.get("category"))}: {esc(x.get("name"))}</b><br><span class="muted">{esc(x.get("description"))}</span></li>' for x in items)
    return f'<div class="panel" data-reveal><h2>Materials & Highlights</h2><ul class="list">{rows}</ul></div>'


def deliverables_section(project, site):
    if not site.get("show_purchase_options",True): return ""
    items=project.get("deliverables",[])
    if not items: return ""
    rows=''.join(f'<li>{"✓" if x.get("included") else "○"} {esc(x.get("name"))}</li>' for x in items)
    return f'<div class="panel" data-reveal><h2>Deliverables</h2><ul class="list">{rows}</ul></div>'


def build(args):
    site=read_toml(CONTENT/"site.toml"); nav=read_toml(CONTENT/"navigation.toml")
    out=ROOT/args.output
    if args.clean and out.exists(): shutil.rmtree(out)
    out.mkdir(parents=True,exist_ok=True)
    shutil.copytree(WEBSITE/"css",out/"css",dirs_exist_ok=True)
    shutil.copytree(WEBSITE/"js",out/"js",dirs_exist_ok=True)
    shutil.copytree(ASSETS,out/"assets",dirs_exist_ok=True)
    (out/".nojekyll").write_text("",encoding="utf-8")
    if site.get("custom_domain"): (out/"CNAME").write_text(site["custom_domain"]+"\n",encoding="utf-8")
    projects=load_projects(args.strict)
    published=[p for p in projects if p.get("published") and not p.get("seo",{}).get("noindex")]
    published.sort(key=lambda p:(not p.get("featured",False),p.get("sort_order",100),p.get("identity",{}).get("title","")))
    base_url="https://"+site.get("custom_domain","").strip("/")

    home_template=(WEBSITE/"index.html").read_text(encoding="utf-8")
    featured=[p for p in published if p.get("featured")]
    content=home_template.replace("{{PROJECT_GRID}}",project_grid(featured or published[:6],site,""))
    page=apply_base(content,site=site,nav=nav,root_prefix="",title=site.get("seo",{}).get("title",site["site_name"]),description=site.get("seo",{}).get("description",""),og_image=base_url+site.get("seo",{}).get("image",""),canonical=base_url+"/")
    (out/"index.html").write_text(page,encoding="utf-8")

    legal_pages = [
        ("privacy", "Privacy Policy", "How Orovian Oasis handles information submitted through this showcase."),
        ("terms", "Terms & Conditions", "Terms governing use of the Orovian Oasis Showcase."),
    ]
    for slug, heading, description in legal_pages:
        folder = out / slug
        folder.mkdir(parents=True, exist_ok=True)
        body = (WEBSITE / f"{slug}.html").read_text(encoding="utf-8")
        legal_page = apply_base(
            body, site=site, nav=nav, root_prefix="../",
            title=f"{heading} | {site['site_name']}", description=description,
            og_image=base_url+site.get("seo",{}).get("image",""), canonical=f"{base_url}/{slug}/"
        )
        (folder / "index.html").write_text(legal_page, encoding="utf-8")

    listing_meta={
        "concept-home":("Concept Homes","Original designs, interactive walkthroughs, floor plans, materials, licensing, and customization."),
        "transformation":("Transformations","Fix-and-flip projects, rehabs, before-and-after stories, redesigned plans, and project outcomes."),
        "property":("Properties","Physical properties, availability, galleries, floor plans, virtual tours, and customer-facing actions.")}
    listing_template=(WEBSITE/"listing.html").read_text(encoding="utf-8")
    for category,path in CATEGORY_PATHS.items():
        folder=out/path; folder.mkdir(parents=True,exist_ok=True)
        heading,intro=listing_meta[category]
        subset=[p for p in published if p["category"]==category]
        body=listing_template.replace("{{EYEBROW}}","Orovian Oasis Showcase").replace("{{HEADING}}",heading).replace("{{INTRO}}",intro).replace("{{PROJECT_GRID}}",project_grid(subset,site,"../"))
        page=apply_base(body,site=site,nav=nav,root_prefix="../",title=f"{heading} | {site['site_name']}",description=intro,og_image=base_url+site.get("seo",{}).get("image",""),canonical=f"{base_url}/{path}/")
        (folder/"index.html").write_text(page,encoding="utf-8")

    project_template=(WEBSITE/"project.html").read_text(encoding="utf-8")
    floor_template=(WEBSITE/"floor-plans.html").read_text(encoding="utf-8")
    tour_placeholder=(WEBSITE/"tour-placeholder.html").read_text(encoding="utf-8")
    api=[]
    for p in published:
        category_path=CATEGORY_PATHS[p["category"]]; folder=out/category_path/p["slug"]
        folder.mkdir(parents=True,exist_ok=True); copy_project_assets(p,folder)
        ident=p.get("identity",{}); media=p.get("media",{})
        project_url=f"{base_url}/{category_path}/{p['slug']}/"
        floor_plans=p.get("floor_plans",[])
        tour=p.get("tour",{})
        explore=[]
        if floor_plans and site.get("show_floor_plans",True): explore.append('<a class="button primary" href="floor-plans/">View Floor Plans</a>')
        if tour.get("enabled"): explore.append(f'<a class="button" href="{esc(tour.get("path","tour/"))}"{" target=\"_blank\" rel=\"noopener\"" if tour.get("open_new_tab") else ""}>{esc(tour.get("label","Launch 3D Walkthrough"))}</a>')
        body=project_template
        replacements={
            "{{CATEGORY_LABEL}}":CATEGORY_LABELS[p["category"]],"{{PROJECT_TITLE}}":esc(ident.get("title")),"{{PROJECT_SUBTITLE}}":esc(ident.get("subtitle")),
            "{{COVER_URL}}":esc(media.get("cover","assets/cover.svg")),"{{SUMMARY}}":esc(ident.get("summary")),"{{FACTS}}":facts_html(p),
            "{{STATUS_LABEL}}":esc(p.get("status_label",p.get("status",""))),"{{PRICE}}":money(p,site),"{{CTA_BUTTONS}}":cta_buttons(p,site),
            "{{EXPLORE_BUTTONS}}":''.join(explore) or '<span class="muted">Additional project media is being prepared.</span>',
            "{{SPECIAL_SECTION}}":special_section(p),"{{MATERIALS_SECTION}}":materials_section(p,site),"{{DELIVERABLES_SECTION}}":deliverables_section(p,site)}
        for k,v in replacements.items(): body=body.replace(k,v)
        title=p.get("seo",{}).get("title") or f"{ident.get('title')} | {site['site_name']}"
        desc=p.get("seo",{}).get("description") or ident.get("summary","")
        og=project_url+media.get("share",media.get("cover","assets/cover.svg"))
        page=apply_base(body,site=site,nav=nav,root_prefix="../../",title=title,description=desc,og_image=og,canonical=project_url)
        (folder/"index.html").write_text(page,encoding="utf-8")

        fp_folder=folder/"floor-plans"; fp_folder.mkdir(exist_ok=True)
        cards=[]
        for item in floor_plans:
            image=Path(item.get("image","")); image_url="../"+image.as_posix() if image.parts and image.parts[0]=="floor-plans" else item.get("image","")
            links=[]
            if item.get("pdf"): links.append(f'<a class="button" href="../{esc(item["pdf"])}">Open PDF</a>')
            if item.get("dxf"): links.append(f'<a class="button" href="../{esc(item["dxf"])}">Download DXF</a>')
            cards.append(f'<article class="panel" data-reveal><h2>{esc(item.get("level"))}</h2><img src="{esc(image_url)}" alt="{esc(item.get("level"))} floor plan"><p class="muted">{esc(item.get("caption"))}</p><div class="actions">{"".join(links)}</div></article>')
        floor_body=floor_template.replace("{{PROJECT_TITLE}}",esc(ident.get("title"))).replace("{{INTRO}}","Customer-facing floor plans and available downloads.").replace("{{FLOOR_PLAN_CARDS}}",''.join(cards) or '<div class="empty">Floor plans have not been published yet.</div>')
        floor_page=apply_base(floor_body,site=site,nav=nav,root_prefix="../../../",title=f"Floor Plans — {ident.get('title')}",description=f"Floor plans for {ident.get('title')}",og_image=og,canonical=project_url+"floor-plans/")
        (fp_folder/"index.html").write_text(floor_page,encoding="utf-8")

        tour_src=p["_source"]/"tour"; tour_dest=folder/"tour"
        if tour.get("enabled") and (tour_src/"viewer.html").exists():
            shutil.copytree(tour_src,tour_dest,dirs_exist_ok=True)
            if not (tour_dest/"index.html").exists():
                (tour_dest/"index.html").write_text('<meta http-equiv="refresh" content="0;url=viewer.html"><script>location.replace("viewer.html")</script>',encoding="utf-8")
        else:
            tour_dest.mkdir(exist_ok=True)
            tour_body=tour_placeholder.replace("{{PROJECT_TITLE}}",esc(ident.get("title")))
            tour_page=apply_base(tour_body,site=site,nav=nav,root_prefix="../../../",title=f"3D Walkthrough — {ident.get('title')}",description=f"3D walkthrough for {ident.get('title')}",og_image=og,canonical=project_url+"tour/")
            (tour_dest/"index.html").write_text(tour_page,encoding="utf-8")

        public={k:v for k,v in p.items() if not k.startswith("_")}
        public["url"]=f"/{category_path}/{p['slug']}/"; public["price_display"]=html.unescape(money(p,site))
        api.append(public)

    api_dir=out/"api"; api_dir.mkdir(exist_ok=True)
    (api_dir/"catalog.json").write_text(json.dumps({"site":site.get("site_name"),"projects":api},indent=2),encoding="utf-8")
    for p in api:
        (api_dir/f'{p["slug"]}.json').write_text(json.dumps(p,indent=2),encoding="utf-8")

    urls=[base_url+"/", f"{base_url}/privacy/", f"{base_url}/terms/"]
    urls += [f"{base_url}/{x}/" for x in CATEGORY_PATHS.values()]
    for p in published:
        path=CATEGORY_PATHS[p["category"]]
        urls += [f"{base_url}/{path}/{p['slug']}/",f"{base_url}/{path}/{p['slug']}/floor-plans/",f"{base_url}/{path}/{p['slug']}/tour/"]
    (out/"sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'<url><loc>{esc(u)}</loc></url>\n' for u in urls)+'</urlset>\n',encoding="utf-8")
    (out/"robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {base_url}/sitemap.xml\n",encoding="utf-8")
    notfound=(WEBSITE/"404.html").read_text(encoding="utf-8")
    (out/"404.html").write_text(apply_base(notfound,site=site,nav=nav,root_prefix="",title="Page Not Found | "+site["site_name"],description="The requested page was not found.",og_image=base_url+site.get("seo",{}).get("image",""),canonical=base_url+"/404.html"),encoding="utf-8")
    print(f"Built {len(published)} published project(s) into {out}")


if __name__=="__main__":
    parser=argparse.ArgumentParser(); parser.add_argument("--output",default="dist"); parser.add_argument("--clean",action="store_true"); parser.add_argument("--strict",action="store_true")
    build(parser.parse_args())
