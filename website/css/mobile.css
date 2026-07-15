/*
OROVIAN OASIS SHOWCASE — MOBILE / TABLET VISUAL LAYER 2.8

EDIT THIS FILE for phone- and tablet-only visual changes.
It is loaded with media="(max-width: 880px)", so these rules do not affect desktop.
The shared HTML, content, prices, routes, and project data remain synchronized.

BREAKPOINT MAP
- Up to 880px: tablet and mobile layout
- Up to 560px: compact phone layout
*/

:root{
  --mobile-edge:17px;
  --mobile-section-gap:44px;
  --mobile-control-size:44px;
}

html.mobile-view{--mobile-vh:100svh}
html.mobile-view body.mobile-menu-open{overflow:hidden}
html.mobile-view .menu-popover{max-height:min(72svh,620px);overflow:auto;overscroll-behavior:contain}

/* ===== TABLET + MOBILE: 880px AND BELOW ===== */
@media(max-width:880px){
  .header-row{grid-template-columns:1fr auto 1fr}
  .menu-word{display:none}
  .contact-cta span{display:none}
  .contact-cta{width:48px;padding:0}
  .contact-cta svg{margin:auto}

  .hero h1{font-size:clamp(3.4rem,15vw,6.6rem)}
  .float-token{display:none}
  .two-col{grid-template-columns:1fr}
  .purchase-panel{position:relative;top:auto}

  /* Homepage and generated project cards are intentionally centered on mobile. */
  .showcase-hero,.showcase-hero .hero-shell,
  .section-heading,.project-card,.project-card .card-body,.project-card h3,.project-card p,
  .project-card .price,.lane-card,.ribbon-panel{text-align:center}
  .project-card .facts,.project-card .actions,.lane-card .actions{justify-content:center}

  .ribbon-panel{align-items:center;flex-direction:column}
  .ribbon-panel>div{width:100%}
  .ribbon-panel h2{margin-inline:auto}
  .ribbon-panel .button{align-self:center;margin-inline:auto}

  .footer-grid{grid-template-columns:1fr;text-align:center}
  .footer-brand{flex-direction:column;align-items:center;text-align:center}
  .footer-brand p{margin-inline:auto}
  .footer-actions{text-align:center}
  .social-links{justify-content:center}
  .footer-contact{justify-content:center}
  .footer-bottom{flex-direction:column;align-items:center;text-align:center}

  .showcase-hero{min-height:72svh;padding-bottom:34px}
  .build-shape{opacity:.18}
  .shape-house{left:-8%}
  .shape-crane{right:-6%}
  .shape-plan{left:-9%;bottom:4%}
  .shape-tower{right:-5%}
  .trace-light{opacity:.95}

  .contact-modal{padding:16px}
  .contact-modal-card{width:min(600px,100%);padding:30px 22px;text-align:center}
  .contact-choice{text-align:left}
  .contact-form{grid-template-columns:repeat(2,minmax(0,1fr));text-align:center}
  .contact-form-wide{grid-column:1/-1}
  .contact-form label>span{text-align:center}
  .contact-form input,.contact-form select,.contact-form textarea{text-align:left}
  .contact-form-actions{justify-content:center;flex-direction:column}
  .contact-form-status{text-align:center}
}

/* More obvious mobile bounce while keeping every structure near its original position. */
@media(max-width:880px) and (prefers-reduced-motion:no-preference){
  .shape-house{animation-name:mobile-blueprint-bounce-a;animation-duration:4.6s}
  .shape-crane{animation-name:mobile-blueprint-bounce-b;animation-duration:5.1s}
  .shape-plan{animation-name:mobile-blueprint-bounce-c;animation-duration:4.8s}
  .shape-tower{animation-name:mobile-blueprint-bounce-d;animation-duration:5.4s}
  @keyframes mobile-blueprint-bounce-a{0%,100%{translate:0 0}28%{translate:10px -24px}56%{translate:-7px -12px}80%{translate:6px 5px}}
  @keyframes mobile-blueprint-bounce-b{0%,100%{translate:0 0}22%{translate:-10px -20px}52%{translate:7px -29px}78%{translate:-5px 6px}}
  @keyframes mobile-blueprint-bounce-c{0%,100%{translate:0 0}30%{translate:13px -22px}59%{translate:-9px -27px}83%{translate:5px 5px}}
  @keyframes mobile-blueprint-bounce-d{0%,100%{translate:0 0}25%{translate:-9px -26px}54%{translate:8px -15px}81%{translate:-5px 6px}}
}

/* ===== COMPACT PHONES: 560px AND BELOW ===== */
@media(max-width:560px){
  .site-header{padding-top:10px}
  .header-row{min-height:64px;padding:6px 8px}
  .brand-orbit{width:60px;height:60px}
  .brand-disc{width:50px;height:50px}
  .brand-disc img{width:45px;height:45px}
  .menu-trigger,.contact-cta{min-height:44px}
  .menu-trigger{padding:0 12px}
  .contact-cta{width:44px}

  .hero{padding-top:145px}
  .showcase-hero{min-height:70svh;padding-top:132px;padding-bottom:28px}
  .showcase-hero h1{font-size:clamp(3rem,15vw,4.8rem)}
  .showcase-hero h1 span{font-size:.24em;line-height:1.25}
  .showcase-hero p{font-size:.96rem}

  .featured-section{padding-top:20px}
  .section{padding:44px 0}
  .card-body{padding:20px}
  .lane-card{min-height:330px}
  .ribbon-panel{padding:25px}

  .footer-brand img{width:58px;height:58px}
  .footer-brand strong{font-size:1.55rem}
  .footer-bottom{font-size:.76rem}

  .shape-plan,.shape-tower{display:none}
  .trace-light{width:8px;height:8px}
  .trace-light-c{display:none}

  .contact-modal{padding:10px}
  .contact-modal-card{max-height:calc(100dvh - 12px);overflow:hidden;padding:22px 17px 18px;border-radius:27px}
  .contact-modal-logo{width:66px;height:66px;margin-bottom:10px}
  .contact-modal-logo img{width:60px;height:60px}
  .contact-modal-card h2{font-size:clamp(1.9rem,9.5vw,2.7rem);margin-top:7px;margin-bottom:7px}
  .contact-modal-copy{margin-bottom:14px;font-size:.86rem;line-height:1.42}
  .contact-modal-close{right:12px;top:12px;width:38px;height:38px}
  .contact-choice{padding:13px 14px}
  .contact-choice-icon{width:43px;height:43px;border-radius:14px}
  .call-text-actions{grid-template-columns:1fr 1fr}
  .contact-form{gap:8px 9px;margin-top:8px}
  .contact-form input,.contact-form select,.contact-form textarea{padding:9px 8px;font-size:.86rem}
  .contact-form textarea{min-height:70px}
  .contact-form-actions .button{min-height:40px;padding-inline:15px}
}

@media(max-width:560px) and (max-height:700px){
  .contact-form-card{padding:14px 14px 15px}
  .contact-form-card .contact-modal-logo{width:48px;height:48px;margin-bottom:4px}
  .contact-form-card .contact-modal-logo img{width:43px;height:43px}
  .contact-form-card .eyebrow{font-size:.58rem;letter-spacing:.13em}
  .contact-form-card h2{font-size:1.65rem;margin:3px 0 4px}
  .contact-form-card .contact-modal-copy{display:none}
  .contact-form{gap:6px 8px;margin-top:6px}
  .contact-form label{gap:2px;font-size:.69rem}
  .contact-form input,.contact-form select,.contact-form textarea{padding:7px 8px;font-size:.8rem}
  .contact-form textarea{min-height:54px}
  .contact-form-actions{gap:4px}
  .contact-form-actions .button{min-height:36px;font-size:.8rem}
  .contact-form-status{font-size:.7rem}
}

/* Add future mobile-only overrides below this line. */

/* ==========================================================
   MOBILE 2.5 — FOOTER ORBIT, LEGAL ROW + COMPACT ABOUT DIALOG
   ========================================================== */
@media(max-width:880px){
  .footer-logo-orbit{width:84px;height:84px}
  .footer-logo-orbit .logo-orbit-disc{width:68px;height:68px}
  .footer-note{text-align:center;margin-top:26px}
  .footer-bottom{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:7px;text-align:center}
  .footer-bottom a:first-child{justify-self:start}
  .footer-bottom a:last-child{justify-self:end}
  .footer-bottom>span{justify-self:center}
  .about-modal-card{width:min(620px,100%);padding:26px 22px}
}

@media(max-width:560px){
  .brand-orbit{width:60px;height:60px}
  .brand-orbit .logo-orbit-disc{width:50px;height:50px}
  .footer-logo-orbit{width:76px;height:76px}
  .footer-logo-orbit .logo-orbit-disc{width:61px;height:61px}
  .contact-modal-logo.logo-orbit{width:72px;height:72px;margin-bottom:8px}
  .contact-modal-logo .logo-orbit-disc{width:58px;height:58px}
  .contact-form-card .contact-modal-logo.logo-orbit{width:52px;height:52px;margin-bottom:3px}
  .contact-form-card .contact-modal-logo .logo-orbit-disc{width:42px;height:42px}
  .footer-bottom{font-size:clamp(.58rem,2.35vw,.72rem);gap:5px}
  .footer-bottom a{letter-spacing:-.02em}
  .footer-note{font-size:.72rem}
  .about-modal-card{padding:20px 16px 18px}
  .about-modal-card h2{font-size:clamp(1.75rem,8.8vw,2.45rem);margin:6px 0 8px}
  .about-modal-card .contact-modal-copy{font-size:.82rem;line-height:1.4;margin-bottom:10px}
  .about-pillars{grid-template-columns:1fr;gap:6px;margin:10px 0}
  .about-pillars span{min-height:0;padding:8px 10px;font-size:.75rem}
  .about-intake{min-height:40px;font-size:.82rem}
}

@media(max-width:380px){
  .footer-bottom{font-size:.56rem;gap:3px}
  .footer-bottom a{font-weight:700}
}


/* ==========================================================
   MOBILE 2.6 — HEADER LOGO, VISIBLE ORBS + CARD CENTERING
   ========================================================== */
@media(max-width:880px){
  .site-header .header-row{
    grid-template-columns:48px minmax(0,1fr) 48px;
    overflow:visible;
  }
  .site-header .menu-trigger,
  .site-header .contact-cta{
    width:48px;
    min-width:48px;
    max-width:48px;
    padding:0;
    justify-content:center;
  }
  .site-header .brand-orbit{
    position:relative;
    width:68px;
    height:68px;
    min-width:68px;
    max-width:68px;
    justify-self:center;
    align-self:center;
    overflow:visible;
    transform:none !important;
  }
  .site-header .brand-orbit .logo-orbit-disc{
    width:54px;
    height:54px;
    min-width:54px;
    max-width:54px;
    margin:0;
  }
  .site-header .brand-orbit .logo-orbit-ring{
    display:block;
    inset:0;
    opacity:1;
    overflow:visible;
  }
  .site-header .brand-orbit .logo-orbit-ring:before,
  .site-header .brand-orbit .logo-orbit-ring:after{
    display:block;
    opacity:1;
  }

  .featured-section .project-card,
  .featured-section .project-card .card-body,
  .featured-section .project-card .badge,
  .featured-section .project-card h3,
  .featured-section .project-card p,
  .featured-section .project-card .price{
    text-align:center;
  }
  .featured-section .project-card .badge{
    margin-left:auto;
    margin-right:auto;
  }
  .featured-section .project-card .facts,
  .featured-section .project-card .actions{
    justify-content:center;
  }
  .featured-section .project-card .card-media img{
    object-position:center center;
  }

  .about-modal-card .contact-modal-logo.logo-orbit{
    margin-inline:auto;
    left:auto;
    right:auto;
  }
}

@media(max-width:560px){
  .site-header .header-row{
    grid-template-columns:44px minmax(0,1fr) 44px;
  }
  .site-header .menu-trigger,
  .site-header .contact-cta{
    width:44px;
    min-width:44px;
    max-width:44px;
  }
  .site-header .brand-orbit{
    width:62px;
    height:62px;
    min-width:62px;
    max-width:62px;
  }
  .site-header .brand-orbit .logo-orbit-disc{
    width:49px;
    height:49px;
    min-width:49px;
    max-width:49px;
  }
  .site-header .brand-orbit .logo-orbit-ring:before{
    width:8px;
    height:8px;
    left:2px;
    top:11px;
  }
  .site-header .brand-orbit .logo-orbit-ring:after{
    width:7px;
    height:7px;
    right:3px;
    bottom:8px;
  }
}


/* ==========================================================
   MOBILE 2.7 — CATEGORY LISTING ALIGNMENT + OVERFLOW FIX
   Long titles stay on-canvas and category pages remain one column.
   ========================================================== */
@media(max-width:880px){
  html,body{width:100%;max-width:100%;overflow-x:clip}
  .listing-hero{
    min-height:auto;
    padding-top:142px;
    padding-bottom:42px;
    overflow-x:clip;
  }
  .listing-hero .hero-shell{
    width:calc(100% - (var(--mobile-edge) * 2));
    max-width:none;
    min-width:0;
    margin-inline:auto;
    text-align:center;
  }
  .listing-hero h1{
    display:block;
    width:100%;
    max-width:100%;
    margin:16px auto 18px;
    padding:.08em .04em .15em;
    font-size:clamp(2.55rem,11.8vw,5.2rem);
    line-height:.96;
    letter-spacing:-.045em;
    white-space:normal;
    overflow-wrap:normal;
    word-break:normal;
    text-align:center;
  }
  .listing-hero p{
    width:100%;
    max-width:680px;
    margin-inline:auto;
    padding-inline:0;
    line-height:1.62;
    text-align:center;
    overflow-wrap:break-word;
  }
  .listing-hero + .section,
  .listing-hero + .section .shell,
  .listing-hero + .section .grid,
  .listing-hero + .section .empty{
    min-width:0;
    max-width:100%;
  }
  .listing-hero + .section .grid{grid-template-columns:minmax(0,1fr)}
}

@media(max-width:380px){
  .listing-hero h1{font-size:clamp(2.35rem,11.4vw,3.1rem)}
  .listing-hero p{font-size:.94rem}
}


/* ==========================================================
   MOBILE 2.8 — TRANSFORMATIONS FULL-WIDTH REPAIR
   This block is intentionally last so older responsive patches cannot override it.
   ========================================================== */
@media(max-width:880px){
  html,body{width:100%;max-width:100%;overflow-x:hidden}
  main,.listing-hero,.listing-hero + .section{width:100%;max-width:100%;overflow-x:hidden}
  .listing-hero{
    min-height:auto;
    padding:138px 0 36px;
  }
  .listing-hero .hero-shell{
    width:min(100% - 34px,720px);
    max-width:calc(100% - 34px);
    margin-inline:auto;
    padding-inline:2px;
  }
  .listing-hero .eyebrow{
    max-width:100%;
    line-height:1.45;
    overflow-wrap:anywhere;
  }
  .listing-hero h1{
    display:block;
    width:100%;
    max-width:100%;
    margin:15px auto 18px;
    padding:.05em .08em .14em;
    line-height:.98;
    letter-spacing:-.05em;
    white-space:normal;
    overflow:visible;
    overflow-wrap:normal;
    word-break:normal;
    text-align:center;
  }
  .listing-transformations h1{
    font-size:clamp(2.1rem,9.25vw,4.35rem);
    letter-spacing:-.058em;
  }
  .listing-hero p{
    width:100%;
    max-width:680px;
    margin-inline:auto;
    padding-inline:2px;
    text-align:center;
  }
  .listing-pulse{margin-top:25px}
  .listing-hero + .section{padding:34px 0 48px}
  .listing-hero + .section .shell{
    width:calc(100% - 34px);
    max-width:calc(100% - 34px);
    margin-inline:auto;
  }
  .listing-hero + .section .grid{
    width:100%;
    grid-template-columns:minmax(0,1fr);
  }
  .listing-hero + .section .empty{
    width:100%;
    max-width:100%;
    padding:clamp(34px,10vw,54px) 20px;
    margin:0 auto;
    overflow-wrap:anywhere;
  }
}
@media(max-width:380px){
  .listing-transformations h1{font-size:clamp(2rem,8.9vw,2.35rem)}
}

/* ==========================================================
   MOBILE 3.3 — COMPACT PROJECT FILTERS
   ========================================================== */
@media(max-width:880px){
  .listing-catalog{padding-top:24px}
  .project-filter-panel{padding:18px;border-radius:24px;margin-bottom:20px}
  .filter-heading{align-items:center;margin-bottom:14px}
  .filter-heading h2{font-size:clamp(1.8rem,8vw,2.5rem);text-align:left}
  .filter-heading .eyebrow{text-align:left}
  .filter-count{font-size:.72rem;padding:8px 10px}
  .filter-pills{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
  .filter-pill{padding:10px 11px;border-radius:17px}
  .filter-pill>span{font-size:.61rem;letter-spacing:.06em}
  .filter-pill input,.filter-pill select{min-height:34px;font-size:.88rem}
  .filter-reset{display:block;margin:13px auto 0}
  .project-price.contact-price{font-size:clamp(1.9rem,8vw,2.8rem)!important}
}
@media(max-width:430px){
  .filter-heading{align-items:flex-start}
  .filter-pills{grid-template-columns:minmax(0,1fr)}
  .filter-pill{padding:10px 13px}
}

/* ==========================================================
   MOBILE 3.4 — CAROUSELS + ULTRA-COMPACT FILTER DROPDOWN
   ========================================================== */
@media(max-width:880px){
  .project-filter-menu{width:min(390px,100%);margin-bottom:16px}
  .filter-menu-trigger{min-height:42px;padding:7px 12px}
  .filter-menu-panel{grid-template-columns:minmax(0,1fr);gap:7px;padding:10px;border-radius:18px}
  .filter-row{grid-template-columns:minmax(0,1fr) minmax(112px,.9fr);min-height:36px;padding:5px 7px}
  .filter-row>span{font-size:.67rem}
  .filter-row input,.filter-row select{font-size:.76rem}
  .project-carousel.carousel-ready.has-multiple .carousel-arrow{width:40px;height:40px;margin-top:-20px;font-size:1.65rem}
  .carousel-prev{left:10px}.carousel-next{right:10px}
  .project-carousel.carousel-ready.has-multiple .carousel-dots{bottom:9px;padding:6px 9px}
  .project-explore-panel .actions{flex-direction:column;align-items:center}
  .project-explore-panel .button{width:min(100%,310px)}
}
@media(max-width:430px){
  .filter-menu-panel{left:50%;right:auto;width:min(calc(100vw - 34px),390px);transform:translateX(-50%)}
  .filter-row{grid-template-columns:minmax(0,1fr) minmax(102px,.86fr)}
  .carousel-viewport{aspect-ratio:4/3}
  .card-carousel .carousel-viewport,.hero-carousel .carousel-viewport{aspect-ratio:4/3}
}

/* ==========================================================
   MOBILE 3.5 — SIDE-BY-SIDE HERO ACTIONS + PLAN VIEWER
   ========================================================== */
@media(max-width:880px){
  .project-hero-actions{width:min(100%,620px);padding-inline:0;gap:9px}
  .project-hero-actions.dual-action{grid-template-columns:repeat(2,minmax(0,1fr))}
  .project-hero-actions .button{min-height:46px;padding:8px 12px;font-size:.82rem;line-height:1.2}
  .floor-grid{grid-template-columns:1fr;align-items:start}
  .floor-card{width:100%;padding:20px}
  .floor-card-index{padding-bottom:18px}
  .floor-card-index .floor-plan-preview img{max-height:300px}
  .plan-lightbox{padding:8px}
  .plan-lightbox-card{height:calc(100dvh - 16px);padding:10px;border-radius:22px}
  .plan-lightbox-toolbar{align-items:flex-start;gap:9px;padding-bottom:8px}
  .plan-lightbox-toolbar .eyebrow{font-size:.58rem;letter-spacing:.12em}
  .plan-lightbox-toolbar h2{font-size:1.45rem}
  .plan-lightbox-controls{gap:5px}
  .plan-lightbox-controls button,.plan-lightbox-controls output{min-width:35px;min-height:35px;padding:5px 8px;font-size:.72rem}
  .plan-lightbox-help{font-size:.68rem;margin-top:7px}
}
@media(max-width:420px){
  .project-hero-actions{gap:7px}
  .project-hero-actions .button{padding-inline:7px;font-size:.72rem}
  .plan-lightbox-toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto}
  .plan-lightbox-controls output,.plan-lightbox-controls [data-plan-reset]{display:none}
}
