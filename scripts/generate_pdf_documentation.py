"""
CommitCosmos Complete Engineering Specification & System Documentation Generator
Uses ReportLab 5.x to produce a pixel-perfect, publication-grade 9-page PDF matching
the exact structure, double borders, typography, quote boxes, tables, and screenshot figures
of ContinuityGuardian_System_Documentation.pdf.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether
)
from reportlab.pdfgen import canvas

BASE_DIR = r"D:\Freshstart\Comsphere"
DOC_DIR = os.path.join(BASE_DIR, "doc")
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
IMAGES_DIR = os.path.join(DOC_DIR, "images")
PDF_OUT_DOC = os.path.join(DOC_DIR, "CommitCosmos_System_Documentation.pdf")
PDF_OUT_PUBLIC = os.path.join(PUBLIC_DIR, "CommitCosmos_System_Documentation.pdf")



class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute total page count and draw
    exact double border, running headers, and running footers on every page.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_decorations(self, total_pages):
        self.saveState()

        # Double border rectangle (exact points matching ContinuityGuardian)
        # Outer border: Dark Navy #1e1b4b
        self.setStrokeColor(HexColor("#1e1b4b"))
        self.setLineWidth(1.5)
        self.rect(36, 36, 540, 720)

        # Inner border: Violet #7c3aed
        self.setStrokeColor(HexColor("#7c3aed"))
        self.setLineWidth(1.0)
        self.rect(39, 39, 534, 714)

        page_num = self._pageNumber
        if page_num > 1:
            # Running header text
            self.setFont("Helvetica-Bold", 8.5)
            self.setFillColor(HexColor("#1e1b4b"))
            self.drawString(50, 765, "CommitCosmos — Complete Engineering Specification & System Documentation")

            self.setFont("Helvetica", 8.5)
            self.setFillColor(HexColor("#64748b"))
            self.drawRightString(562, 765, "Lead Architect: V.A. Sai Venkatesh")

            # Horizontal line below header
            self.setStrokeColor(HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(50, 760, 562, 760)

            # Horizontal line above footer
            self.line(50, 30, 562, 30)

            # Running footer text
            self.setFont("Helvetica", 7.5)
            self.setFillColor(HexColor("#64748b"))
            self.drawString(50, 20, "CONFIDENTIAL & PROPRIETARY — CommitCosmos Enterprise Edition v1.0")
            self.drawRightString(562, 20, f"Page {page_num} of {total_pages}")
        else:
            # Page 1 footer
            self.setStrokeColor(HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(50, 30, 562, 30)

            self.setFont("Helvetica", 7.5)
            self.setFillColor(HexColor("#64748b"))
            self.drawString(50, 20, "CONFIDENTIAL & PROPRIETARY — CommitCosmos Enterprise Edition v1.0")
            self.drawRightString(562, 20, f"Page 1 of {total_pages}")

        self.restoreState()


def create_quote_box(title, text, border_color="#8b5cf6", bg_color="#faf5ff", title_color="#6d28d9", text_color="#4c1d95"):
    """Creates a stylized architect quote box matching ContinuityGuardian."""
    content = [
        Paragraph(f"<b>★ {title}</b>", ParagraphStyle(
            "QuoteTitle", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=HexColor(title_color)
        )),
        Spacer(1, 3),
        Paragraph(f"<i>\"{text}\"</i>", ParagraphStyle(
            "QuoteBody", fontName="Courier-Oblique", fontSize=8.0, leading=10.5, textColor=HexColor(text_color)
        ))
    ]
    t = Table([[content]], colWidths=[508])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor(bg_color)),
        ('BOX', (0, 0), (-1, -1), 1.5, HexColor(border_color)),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    return t


def build_pdf():
    os.makedirs(DOC_DIR, exist_ok=True)
    doc = SimpleDocTemplate(
        PDF_OUT_DOC,
        pagesize=letter,
        leftMargin=52,
        rightMargin=52,
        topMargin=48,
        bottomMargin=46
    )

    story = []

    # Typography Styles
    title_style = ParagraphStyle("DocTitle", fontName="Helvetica-Bold", fontSize=19, leading=22, textColor=HexColor("#1e1b4b"))
    subtitle_style = ParagraphStyle("DocSubtitle", fontName="Helvetica", fontSize=9.0, leading=13.0, textColor=HexColor("#475569"))
    section_h1 = ParagraphStyle("SectionH1", fontName="Helvetica-Bold", fontSize=13.5, leading=16.5, textColor=HexColor("#1e1b4b"))
    section_h2 = ParagraphStyle("SectionH2", fontName="Helvetica-Bold", fontSize=11.0, leading=14.0, textColor=HexColor("#6d28d9"))
    body_p = ParagraphStyle("BodyP", fontName="Helvetica", fontSize=8.3, leading=12.0, textColor=HexColor("#334155"))
    bullet_p = ParagraphStyle("BulletP", fontName="Helvetica", fontSize=8.0, leading=11.0, textColor=HexColor("#334155"), leftIndent=12)
    tbl_cell = ParagraphStyle("TblCell", fontName="Helvetica", fontSize=7.8, leading=10.0, textColor=HexColor("#1e293b"))
    tbl_cell_bold = ParagraphStyle("TblCellBold", fontName="Helvetica-Bold", fontSize=7.8, leading=10.0, textColor=HexColor("#0f172a"))
    tbl_header = ParagraphStyle("TblHdr", fontName="Helvetica-Bold", fontSize=8.0, leading=10.0, textColor=white)
    code_cell = ParagraphStyle("CodeCell", fontName="Courier", fontSize=7.2, leading=9.2, textColor=HexColor("#0f172a"))

    # =========================================================================
    # PAGE 1: COVER & EXECUTIVE OVERVIEW
    # =========================================================================
    logo_path = os.path.join(IMAGES_DIR, "commitcosmos_logo.png")
    if os.path.exists(logo_path):
        story.append(Image(logo_path, width=64, height=64, hAlign='CENTER'))
        story.append(Spacer(1, 8))

    story.append(Paragraph("CommitCosmos — Complete Engineering<br/>Specification & System Documentation", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Real-Time 3D Git Galaxy Visualizer, Webhook Event Stream Ingestion Engine, Fibonacci Celestial Coordinates & Autonomous Cinematic Navigation Suite", subtitle_style))
    story.append(Spacer(1, 10))

    # Specification Metadata Table
    meta_data = [
        [Paragraph("Lead Engineer & Architect:", tbl_cell_bold), Paragraph("V.A. SAI VENKATESH", tbl_cell_bold)],
        [Paragraph("System Architecture:", tbl_cell_bold), Paragraph("Next.js 15 App Router, React Three Fiber / Three.js, Neon Lakebase Postgres (Drizzle ORM), GitHub Webhooks API (HMAC-SHA256), Web Audio API", tbl_cell)],
        [Paragraph("Production Web Stack:", tbl_cell_bold), Paragraph("Obsidian Deep Space UI/UX, Selective Bloom Shaders, InstancedMesh GPU Pipeline, TanStack Query v5, Zustand 5", tbl_cell)],
        [Paragraph("Target Domain:", tbl_cell_bold), Paragraph("Developer Tooling, Open-Source Telemetry, Real-time Git Observability, Developer Portfolio & Visual Analytics", tbl_cell)],
        [Paragraph("Document Classification:", tbl_cell_bold), Paragraph("Enterprise Engineering Specification v1.0 (September 2026)", tbl_cell)]
    ]
    t_meta = Table(meta_data, colWidths=[140, 368])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 9))

    # Lead Architect Vision Box
    vision_text = (
        "Traditional 2D Git contribution grids are flat, static, and fundamentally uninspiring: they treat a 10,000-line "
        "architectural triumph identically to a one-character markdown typo. A developer's journey deserves cinematic grandeur. "
        "CommitCosmos transforms git commits into a living 3D universe: every repository ignites as a galactic cluster, every commit "
        "radiates as an astronomically classified star along Fibonacci spiral coordinates, and branches intertwine as radiant "
        "constellation filaments. By uniting Three.js GPU instancing, Neon Lakebase Postgres, and sub-50ms HMAC-SHA256 webhook ingestion, "
        "we deliver real-time developer observability that feels like exploring deep space."
    )
    story.append(create_quote_box(
        "LEAD ARCHITECT SYSTEM VISION — V.A. Sai Venkatesh (Lead Architect)",
        vision_text,
        border_color="#f59e0b",
        bg_color="#fffbeb",
        title_color="#b45309",
        text_color="#78350f"
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Executive Overview: The Git Observability & Developer Experience Crisis", section_h1))
    story.append(Spacer(1, 5))
    story.append(Paragraph(
        "Modern software engineering generates immense telemetry: millions of lines committed, pull requests merged, and issues closed daily. "
        "Yet the standard industry interface for visualizing this heroic human effort remains the rudimentary 52-week monochromatic GitHub green grid. "
        "This flat representation completely fails to convey <b>commit velocity</b>, <b>code magnitude</b>, <b>language polyglot diversity</b>, "
        "<b>branch topology</b>, or the collaborative pulse of distributed engineering teams.",
        body_p
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "CommitCosmos resolves this deficit by synthesizing real-time event-driven infrastructure with WebGL astrophysics. As developers push "
        "code, GitHub webhooks trigger an asynchronous event ingestion pipeline that parses commit diffs, categorizes language AST distributions, "
        "and updates an immutable astronomical ledger in Neon Postgres. The frontend renders thousands of stellar bodies at a steady 60 FPS using "
        "GPU InstancedMesh batching, procedural glow shaders, interactive raycast HUDs, and an autonomous cinematic orbital camera.",
        body_p
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: ARCHITECTURE & CS FOUNDATIONS
    # =========================================================================
    story.append(Paragraph("System Architecture & Computer Science Foundations", section_h1))
    story.append(Spacer(1, 3))
    story.append(Paragraph(
        "CommitCosmos is structured across four resilient architectural tiers: Edge Ingestion, Event Verification, Persistent Lakebase Ledger, and 3D Celestial Projection.",
        body_p
    ))
    story.append(Spacer(1, 6))

    # CS Patterns Table
    cs_headers = [Paragraph("Computer Science Pattern", tbl_header), Paragraph("Implementation & File Location", tbl_header), Paragraph("Engineering Rationale", tbl_header)]
    cs_rows = [
        [
            Paragraph("<b>Fibonacci Sphere Lattice Algorithm</b>", tbl_cell),
            Paragraph("<code>lib/galaxy/coordinates.ts</code><br/><code>calculateSphericalCoords()</code>", code_cell),
            Paragraph("Solves the Thomson problem of uniform star distribution on a sphere using the golden ratio spiral, eliminating polar clumping and coordinate singularity.", tbl_cell)
        ],
        [
            Paragraph("<b>HMAC-SHA256 Constant-Time Verification</b>", tbl_cell),
            Paragraph("<code>app/api/webhooks/github/route.ts</code><br/><code>crypto.timingSafeEqual()</code>", code_cell),
            Paragraph("Guarantees cryptographic authenticity of incoming GitHub payloads and eliminates timing side-channel attacks during webhook signature validation.", tbl_cell)
        ],
        [
            Paragraph("<b>Repository Pattern with Drizzle ORM</b>", tbl_cell),
            Paragraph("<code>db/repositories/</code><br/>(user, project, branch, commit)", code_cell),
            Paragraph("Decouples business logic from database operations over Neon Lakebase Postgres; enables pooled WebSocket connections with scale-to-zero serverless efficiency.", tbl_cell)
        ],
        [
            Paragraph("<b>InstancedMesh GPU Buffer Batching</b>", tbl_cell),
            Paragraph("<code>components/galaxy/StarField.tsx</code><br/><code>THREE.InstancedMesh</code>", code_cell),
            Paragraph("Renders up to 10,000 commit stars in a single draw call with per-instance dynamic matrices, spectral colors, and glow sizes, sustaining 60 FPS on mobile.", tbl_cell)
        ],
        [
            Paragraph("<b>Dual-Store Reactive State Topology</b>", tbl_cell),
            Paragraph("<code>store/galaxyStore.ts</code><br/>TanStack Query v5 + Zustand 5", code_cell),
            Paragraph("Bifurcates high-frequency 60Hz render state (camera orbit, hover HUD, timeline scrubber) from cached remote REST state, preventing unnecessary React re-renders.", tbl_cell)
        ],
    ]
    t_cs = Table([cs_headers] + cs_rows, colWidths=[120, 145, 243])
    t_cs.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#0f172a')),
        ('BOX', (0, 0), (-1, -1), 1, HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, HexColor('#f8fafc')]),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_cs)
    story.append(Spacer(1, 9))

    story.append(Paragraph("Celestial Spectral Classification & Git AST Mapping", section_h2))
    story.append(Spacer(1, 4))

    spectral_headers = [
        Paragraph("Language / Event Class", tbl_header),
        Paragraph("Astronomical Analog", tbl_header),
        Paragraph("Hex Spectrum", tbl_header),
        Paragraph("Stellar Temp", tbl_header),
        Paragraph("Visual Representation & Particle Dynamics", tbl_header)
    ]
    spectral_rows = [
        [
            Paragraph("<b>TypeScript / JavaScript</b>", tbl_cell_bold),
            Paragraph("Class O Blue Supergiant", tbl_cell),
            Paragraph("<code>#38bdf8</code> (Cyan)", code_cell),
            Paragraph("28,000 K", tbl_cell),
            Paragraph("High-energy stellar flare, pulsing cyan core with ion tail", tbl_cell)
        ],
        [
            Paragraph("<b>Python / AI Data</b>", tbl_cell_bold),
            Paragraph("Class G Solar Star", tbl_cell),
            Paragraph("<code>#fbbf24</code> (Amber)", code_cell),
            Paragraph("5,800 K", tbl_cell),
            Paragraph("Stable golden emission, active corona turbulence and sunspots", tbl_cell)
        ],
        [
            Paragraph("<b>Rust / Go / C++</b>", tbl_cell_bold),
            Paragraph("Class B Blue-White Giant", tbl_cell),
            Paragraph("<code>#818cf8</code> (Indigo)", code_cell),
            Paragraph("18,000 K", tbl_cell),
            Paragraph("Intense ultraviolet halo, compact high-mass relativistic core", tbl_cell)
        ],
        [
            Paragraph("<b>HTML / CSS / Markdown</b>", tbl_cell_bold),
            Paragraph("Class M Red Dwarf", tbl_cell),
            Paragraph("<code>#f87171</code> (Coral)", code_cell),
            Paragraph("3,200 K", tbl_cell),
            Paragraph("Extended planetary nebula, diffuse chromatic gas envelope", tbl_cell)
        ],
        [
            Paragraph("<b>PR Merge / Release</b>", tbl_cell_bold),
            Paragraph("Pulsar / Supernova Milestone", tbl_cell),
            Paragraph("<code>#ec4899</code> (Gold)", code_cell),
            Paragraph("100,000 K", tbl_cell),
            Paragraph("Expanding shockwave halo ring, relativistic jet rays along axis", tbl_cell)
        ]
    ]
    t_spectral = Table([spectral_headers] + spectral_rows, colWidths=[95, 105, 80, 58, 170])
    t_spectral.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#7c3aed')),
        ('BOX', (0, 0), (-1, -1), 1, HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, HexColor('#faf5ff')]),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_spectral)
    story.append(PageBreak())

    # =========================================================================
    # HELPER FOR FEATURE PAGES 3 TO 7
    # =========================================================================
    def add_feature_page(title, img_filename, quote_title, quote_text, why_needed, workflow_steps, extra_table=None):
        story.append(Paragraph(title, section_h1))
        story.append(Spacer(1, 2))

        # Accent horizontal line below title
        t_line = Table([[""]], colWidths=[508], rowHeights=[1.5])
        t_line.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), HexColor('#7c3aed'))]))
        story.append(t_line)
        story.append(Spacer(1, 6))

        # Single wide screenshot (508 x 205 pt)
        img_path = os.path.join(IMAGES_DIR, img_filename)
        if os.path.exists(img_path):
            img_table = Table([[Image(img_path, width=508, height=205)]], colWidths=[508])
            img_table.setStyle(TableStyle([
                ('BOX', (0, 0), (-1, -1), 1, HexColor('#cbd5e1')),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ]))
            story.append(img_table)
        story.append(Spacer(1, 6))

        # Feature quote box
        story.append(create_quote_box(quote_title, quote_text))
        story.append(Spacer(1, 7))

        # Why it is needed
        story.append(Paragraph("Why It Is Needed:", section_h2))
        story.append(Spacer(1, 3))
        story.append(Paragraph(why_needed, body_p))
        story.append(Spacer(1, 6))

        # Operational Procedures & Workflow
        story.append(Paragraph("Operational Procedures & Workflow:", section_h2))
        story.append(Spacer(1, 3))
        for step in workflow_steps:
            story.append(Paragraph(step, bullet_p))
            story.append(Spacer(1, 1.5))

        if extra_table:
            story.append(Spacer(1, 4))
            story.append(extra_table)

        story.append(PageBreak())

    # =========================================================================
    # PAGE 3: PART I.1 - 3D CELESTIAL ENGINE & FIBONACCI SPHERE TOPOLOGY
    # =========================================================================
    add_feature_page(
        title="Part I.1: 3D Celestial Engine & Fibonacci Sphere Topology",
        img_filename="Screenshot 2026-09-17 114338.png",
        quote_title="3D Celestial Lattice Mathematics — V.A. Sai Venkatesh (Lead Architect)",
        quote_text=(
            "Mathematical uniformity is critical when rendering hundreds of commits in 3D space. Naive spherical coordinates "
            "clump stars heavily at the poles, ruining visual depth. By calculating polar elevation via arccos(1 - 2i/N) and azimuthal rotation "
            "via the Golden Ratio phi = (1 + sqrt(5))/2, we achieve perfect Poisson-like stellar dispersion while preserving branch constellation filaments."
        ),
        why_needed=(
            "Software repositories contain complex chronological histories. CommitCosmos maps every commit to a distinct 3D star whose radius represents "
            "code churn magnitude, whose chromatic spectrum reflects the dominant programming language, and whose orbital constellation filaments connect "
            "parent and child commits. Users interact via OrbitControls, smooth raycasting hover tooltips, and a temporal timeline scrubber."
        ),
        workflow_steps=[
            "1. Client browser initializes WebGL 2.0 canvas via Three.js and React Three Fiber at <code>/u/[username]</code>.",
            "2. Engine computes 3D celestial coordinates using the Fibonacci sphere algorithm across total stars <i>N</i>.",
            "3. Interactive raycaster identifies hover targets, illuminating the Star Tooltip HUD with SHA, author, and commit message.",
            "4. Dragging the Timeline Scrubber filters commits chronologically, playing back historical repository evolution."
        ]
    )

    # =========================================================================
    # PAGE 4: PART I.2 - REAL-TIME INGESTION & HMAC-SHA256 WEBHOOK PIPELINE
    # =========================================================================
    add_feature_page(
        title="Part I.2: Real-time Ingestion & HMAC-SHA256 Webhook Pipeline",
        img_filename="Screenshot 2026-09-17 114312.png",
        quote_title="Cryptographic Webhook Security & Zero-Lag Ingestion — V.A. Sai Venkatesh (Lead Architect)",
        quote_text=(
            "Every developer push should immediately ignite new stars in the galaxy without manual page reloads or polling. Our webhook pipeline "
            "processes GitHub ping and push payloads in sub-50ms, verifies HMAC-SHA256 signatures with timingSafeEqual to defeat side-channel attacks, "
            "and idempotently records commits via composite database unique constraints."
        ),
        why_needed=(
            "Git activity happens continuously. Traditional platforms rely on expensive polling jobs that exhaust API quotas and introduce multi-minute "
            "delays. CommitCosmos provides an automated, secure webhook architecture that ingests push events, extracts author metadata, maps changed files "
            "to language classifications, and broadcasts updates instantly to the 3D celestial sky."
        ),
        workflow_steps=[
            "1. Operator navigates to GitHub Repository Settings -> Webhooks and inputs the CommitCosmos payload endpoint.",
            "2. Configures content type as <code>application/json</code> and enters the cryptographically generated Webhook Secret.",
            "3. Selects 'Just the push event' and saves; GitHub dispatches an immediate handshake ping verified by the backend.",
            "4. Subsequent git pushes automatically dispatch push events, igniting radiant stars in the repository cluster within 50ms."
        ]
    )

    # =========================================================================
    # PAGE 5: PART I.3 - COSMIC OBSERVATORY & REPOSITORY CLUSTERS
    # =========================================================================
    add_feature_page(
        title="Part I.3: Cosmic Observatory & Repository Cluster Synchronization",
        img_filename="Screenshot 2026-09-17 114246.png",
        quote_title="Observatory Mission Control Architecture — V.A. Sai Venkatesh (Lead Architect)",
        quote_text=(
            "The Observatory serves as command central for developer telemetry. It aggregates commit velocities, active streaks, language distributions, "
            "and multi-repository clusters into a high-density, unified pane with instantaneous on-demand sync capabilities and deep-linking into 3D space."
        ),
        why_needed=(
            "Professional software engineers work across multiple repositories concurrently. The Observatory consolidates scattered codebases into cohesive "
            "galactic clusters. It calculates daily streak achievements, tracks total stellar mass, and provides automated GitHub synchronization to recover "
            "any commits made during offline periods."
        ),
        workflow_steps=[
            "1. Access <code>/dashboard</code> to view aggregated galactic telemetry: Total Stars, Streak Days, and Connected Repositories.",
            "2. Review repository cluster cards displaying language badges, branch counts, and last-synchronized timestamps.",
            "3. Click 'Sync with GitHub' to trigger an on-demand delta synchronization fetching recent commits via the GitHub REST API.",
            "4. Select 'View Galaxy' on any repository card to transition seamlessly into the 3D celestial visualization mode."
        ]
    )

    # =========================================================================
    # PAGE 6: PART I.4 - LANDING EXPERIENCE, DEVELOPER ONBOARDING & PROTOSTAR
    # =========================================================================
    # Page 6 custom layout with 2 side-by-side or stacked images
    story.append(Paragraph("Part I.4: Landing Experience, Developer Onboarding & Protostar State", section_h1))
    story.append(Spacer(1, 2))
    t_line2 = Table([[""]], colWidths=[508], rowHeights=[1.5])
    t_line2.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), HexColor('#7c3aed'))]))
    story.append(t_line2)
    story.append(Spacer(1, 6))

    # Two screenshots side-by-side in a table: Landing Hero (Screenshot 114221) & Protostar Core (Screenshot 114152)
    hero_img = os.path.join(IMAGES_DIR, "Screenshot 2026-09-17 114221.png")
    proto_img = os.path.join(IMAGES_DIR, "Screenshot 2026-09-17 114152.png")
    
    img_row = []
    if os.path.exists(hero_img):
        img_row.append(Image(hero_img, width=250, height=135))
    else:
        img_row.append(Paragraph("Landing Hero", tbl_cell))
    if os.path.exists(proto_img):
        img_row.append(Image(proto_img, width=250, height=135))
    else:
        img_row.append(Paragraph("Protostar Core", tbl_cell))

    t_dual_img = Table([img_row], colWidths=[254, 254])
    t_dual_img.setStyle(TableStyle([
        ('BOX', (0, 0), (0, 0), 1, HexColor('#cbd5e1')),
        ('BOX', (1, 0), (1, 0), 1, HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(t_dual_img)
    story.append(Spacer(1, 6))

    # Caption for dual image
    captions = [
        Paragraph("<b>Figure 4a:</b> Public Landing Hero & Particle Atmosphere", ParagraphStyle("Cap1", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=HexColor("#475569"), alignment=1)),
        Paragraph("<b>Figure 4b:</b> Protostar Core & Initial Ignition Onboarding State", ParagraphStyle("Cap2", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=HexColor("#475569"), alignment=1))
    ]
    t_caps = Table([captions], colWidths=[254, 254])
    story.append(t_caps)
    story.append(Spacer(1, 6))

    story.append(create_quote_box(
        "Embryonic Onboarding & Stellar Accretion — V.A. Sai Venkatesh (Lead Architect)",
        "First impressions dictate developer engagement. The landing page captures the imagination with an interactive particle cosmos, "
        "while our embryonic Protostar Core ensures zero-commit repositories feel alive from day one. Instead of facing an empty, depressing "
        "blank canvas, newly connected repositories pulse with warm accretion energy, guiding the developer toward their inaugural commit ignition."
    ))
    story.append(Spacer(1, 7))

    story.append(Paragraph("Why It Is Needed:", section_h2))
    story.append(Spacer(1, 3))
    story.append(Paragraph(
        "A major failure mode in developer analytics tools is the 'empty state problem': when a user signs up with a fresh repository, "
        "most dashboards display a broken, desolate screen. CommitCosmos solves this through the 'Protostar Core' state — a procedural glowing "
        "stellar nursery that prompts the user with the exact Git commands and webhook setup instructions needed to trigger stellar ignition.",
        body_p
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph("Operational Procedures & Workflow:", section_h2))
    story.append(Spacer(1, 3))
    steps_p6 = [
        "1. Prospective developer visits <code>https://commitcosmos.vercel.app</code> and explores the interactive 3D particle hero.",
        "2. Clicks 'Explore Galaxy' or 'Connect GitHub' to initiate GitHub OAuth 2.0 authentication with minimal required scopes.",
        "3. New accounts without commits land on the <b>Protostar Core</b>, displaying live accretion shaders and setup guidance.",
        "4. Executing <code>git commit</code> and <code>git push</code> ignites the protostar into a radiant stellar system."
    ]
    for s in steps_p6:
        story.append(Paragraph(s, bullet_p))
        story.append(Spacer(1, 1.5))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 7: PART I.5 - CINEMATIC TOUR, TIMELINE SCRUBBER & COSMIC PERSONA
    # =========================================================================
    story.append(Paragraph("Part I.5: Autonomous Cinematic Tour, Timeline Scrubber & Cosmic Persona", section_h1))
    story.append(Spacer(1, 2))
    t_line5 = Table([[""]], colWidths=[508], rowHeights=[1.5])
    t_line5.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), HexColor('#7c3aed'))]))
    story.append(t_line5)
    story.append(Spacer(1, 6))

    # Gallery / Settings view (Screenshot 114439) with mobile/HUD callouts
    main_hud_img = os.path.join(IMAGES_DIR, "Screenshot 2026-09-17 114439.png")
    hud_callout1 = os.path.join(IMAGES_DIR, "Screenshot 2026-09-17 114406.png")
    hud_callout2 = os.path.join(IMAGES_DIR, "Screenshot 2026-09-17 114418.png")

    # Main image (508 x 140 pt)
    if os.path.exists(main_hud_img):
        t_main = Table([[Image(main_hud_img, width=508, height=135)]], colWidths=[508])
        t_main.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(t_main)
        story.append(Spacer(1, 4))

    # Secondary row: 2 small HUD callouts side-by-side with architectural descriptions
    callout_row = []
    if os.path.exists(hud_callout1) and os.path.exists(hud_callout2):
        cell_1 = [
            Image(hud_callout1, width=56, height=56, hAlign='CENTER'),
            Spacer(1, 2),
            Paragraph("<b>Mobile Control HUD</b><br/>Compact touch-friendly orbit & tour controls", ParagraphStyle("C1", fontName="Helvetica", fontSize=7.0, leading=8.5, alignment=1))
        ]
        cell_2 = [
            Image(hud_callout2, width=46, height=56, hAlign='CENTER'),
            Spacer(1, 2),
            Paragraph("<b>Cosmic Persona Menu</b><br/>Profile switcher, settings & audio synthesis", ParagraphStyle("C2", fontName="Helvetica", fontSize=7.0, leading=8.5, alignment=1))
        ]
        t_hud = Table([[cell_1, cell_2]], colWidths=[254, 254])
        t_hud.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        story.append(t_hud)
        story.append(Spacer(1, 4))

    story.append(create_quote_box(
        "Cinematic Narrative & Acoustic Synthesis — V.A. Sai Venkatesh (Lead Architect)",
        "CommitCosmos is designed as both a deep analytical tool and a cinematic showcase. The autonomous tour flies the camera smoothly "
        "through commit clusters, while the timeline scrubber allows developers to witness their software evolve over weeks, months, and years. "
        "Paired with real-time generative space drone audio synthesized via the Web Audio API, coding history becomes an immersive sensory experience."
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph("Why It Is Needed:", section_h2))
    story.append(Spacer(1, 3))
    story.append(Paragraph(
        "Software demos, hackathon submissions, and investor pitches require compelling presentation tools. Static code reviews fail to captivate. "
        "CommitCosmos provides an autonomous cinematic tour with Catmull-Rom spline camera interpolation, temporal playback filtering, and "
        "synthesizer audio nodes mapped to commit frequency, turning routine git logs into captivating presentation experiences.",
        body_p
    ))
    story.append(Spacer(1, 5))

    story.append(Paragraph("Operational Procedures & Workflow:", section_h2))
    story.append(Spacer(1, 3))
    steps_p7 = [
        "1. Toggle 'Cinematic Tour' mode to initiate automated spline-interpolated orbital camera flight around star clusters.",
        "2. Scrub the Timeline Slider to isolate specific development epochs, release sprints, or historical bug bashes.",
        "3. Access the Cosmic Persona dropdown menu to configure dark/neon themes, manage API keys, and toggle audio synthesis.",
        "4. Click 'Share Galaxy' to generate an embeddable URL or dynamic OpenGraph preview card for social media and portfolios."
    ]
    for s in steps_p7:
        story.append(Paragraph(s, bullet_p))
        story.append(Spacer(1, 1.5))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 8: PART II - COMPLETE REST API SPECIFICATION & RESILIENCE
    # =========================================================================
    story.append(Paragraph("Part II: Complete REST API Specification", section_h1))
    story.append(Spacer(1, 2))
    t_line8 = Table([[""]], colWidths=[508], rowHeights=[1.5])
    t_line8.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), HexColor('#7c3aed'))]))
    story.append(t_line8)
    story.append(Spacer(1, 6))

    story.append(Paragraph("Core Production Endpoints", section_h2))
    story.append(Spacer(1, 4))

    api_headers = [Paragraph("Method & Path", tbl_header), Paragraph("Subsystem", tbl_header), Paragraph("Description & Engineering Operation", tbl_header)]
    api_rows = [
        [
            Paragraph("<b>GET</b> <code>/api/galaxy/[username]</code>", code_cell),
            Paragraph("Celestial Engine", tbl_cell_bold),
            Paragraph("Returns complete 3D celestial dataset: computed Fibonacci coordinates, star radii, language spectra, branches, and streak achievements.", tbl_cell)
        ],
        [
            Paragraph("<b>POST</b> <code>/api/webhooks/github</code>", code_cell),
            Paragraph("Ingestion Pipeline", tbl_cell_bold),
            Paragraph("Ingests incoming GitHub push/ping events; verifies HMAC-SHA256 signature with constant-time equality; extracts commits and updates Neon Postgres.", tbl_cell)
        ],
        [
            Paragraph("<b>POST</b> <code>/api/repos/sync</code>", code_cell),
            Paragraph("Observatory", tbl_cell_bold),
            Paragraph("Dispatches on-demand delta synchronization fetching missing commits via GitHub Octokit API; supports batch repository reconciliation.", tbl_cell)
        ],
        [
            Paragraph("<b>GET</b> <code>/api/stats/[username]</code>", code_cell),
            Paragraph("Analytics Engine", tbl_cell_bold),
            Paragraph("Calculates aggregate developer statistics: total stars, stellar mass, active streak, longest streak, and language distribution percentages.", tbl_cell)
        ],
        [
            Paragraph("<b>GET</b> <code>/api/badge/[username]</code>", code_cell),
            Paragraph("Badge Service", tbl_cell_bold),
            Paragraph("Renders dynamic, cache-controlled SVG shield badges for embedding live galaxy star counts and streaks directly into GitHub READMEs.", tbl_cell)
        ],
        [
            Paragraph("<b>GET</b> <code>/api/og</code>", code_cell),
            Paragraph("Social Graph", tbl_cell_bold),
            Paragraph("Generates dynamic 1200x630 OpenGraph preview cards rendering the user's active galaxy constellation for Twitter/LinkedIn card embeds.", tbl_cell)
        ],
        [
            Paragraph("<b>GET</b> <code>/api/teams</code>", code_cell),
            Paragraph("Team Collaboration", tbl_cell_bold),
            Paragraph("Retrieves multi-tenant team spaces, member rosters, shared cluster federations, and collective team star contribution aggregates.", tbl_cell)
        ],
    ]
    t_api = Table([api_headers] + api_rows, colWidths=[140, 95, 273])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#0f172a')),
        ('BOX', (0, 0), (-1, -1), 1, HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, HexColor('#f8fafc')]),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_api)
    story.append(Spacer(1, 9))

    story.append(Paragraph("HTTP Status Code & Resilience Dictionary", section_h2))
    story.append(Spacer(1, 4))

    status_headers = [Paragraph("Status Code", tbl_header), Paragraph("Condition & Trigger Cause", tbl_header), Paragraph("Platform Resilience & Handling Mechanism", tbl_header)]
    status_rows = [
        [
            Paragraph("<b>200 OK</b>", tbl_cell_bold),
            Paragraph("Successful query, sync dispatch, or webhook verification", tbl_cell),
            Paragraph("Returns structured JSON payload with execution telemetry, caching headers, and sanitized entity representations.", tbl_cell)
        ],
        [
            Paragraph("<b>400 Bad Request</b>", tbl_cell_bold),
            Paragraph("Missing required parameters (e.g. missing username or invalid payload)", tbl_cell),
            Paragraph("FastAPI/Next.js edge returns descriptive JSON schema error identifying missing fields without leaking internal stack frames.", tbl_cell)
        ],
        [
            Paragraph("<b>401 Unauthorized</b>", tbl_cell_bold),
            Paragraph("Missing or invalid HMAC-SHA256 signature in X-Hub-Signature-256 header", tbl_cell),
            Paragraph("Rejects incoming webhook immediately via crypto.timingSafeEqual comparison; logs security telemetry for intrusion detection.", tbl_cell)
        ],
        [
            Paragraph("<b>422 Unprocessable</b>", tbl_cell_bold),
            Paragraph("Malformed git payload or unsupported repository event action", tbl_cell),
            Paragraph("Gracefully drops unhandled events (e.g. branch deletion) and responds with informative diagnostic status.", tbl_cell)
        ],
        [
            Paragraph("<b>500 Server Error</b>", tbl_cell_bold),
            Paragraph("Unexpected database exception or missing GITHUB_TOKEN secret", tbl_cell),
            Paragraph("Surfaces sanitized error message, reports trace to error monitoring, and prompts operator verification of environment variables.", tbl_cell)
        ],
        [
            Paragraph("<b>503 Unavailable</b>", tbl_cell_bold),
            Paragraph("Neon serverless database cold start or temporary network partition", tbl_cell),
            Paragraph("System initiates automated exponential backoff retry; serves cached read-replica fixtures to maintain 100% frontend availability.", tbl_cell)
        ]
    ]
    t_status = Table([status_headers] + status_rows, colWidths=[85, 150, 273])
    t_status.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#0891b2')),
        ('BOX', (0, 0), (-1, -1), 1, HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, HexColor('#f0fdf4')]),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_status)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 9: PART III - DATA ARCHITECTURE & DEPLOYMENT
    # =========================================================================
    story.append(Paragraph("Part III: Cloud Data Architecture & Deployment", section_h1))
    story.append(Spacer(1, 2))
    t_line9 = Table([[""]], colWidths=[508], rowHeights=[1.5])
    t_line9.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), HexColor('#7c3aed'))]))
    story.append(t_line9)
    story.append(Spacer(1, 6))

    story.append(Paragraph("Drizzle ORM Schema: Neon Lakebase Postgres Models", section_h2))
    story.append(Spacer(1, 4))

    db_headers = [Paragraph("Entity Table", tbl_header), Paragraph("Key Fields & Types", tbl_header), Paragraph("Description & Astronomical Role", tbl_header), Paragraph("Constraints & Indexing", tbl_header)]
    db_rows = [
        [
            Paragraph("<code>users</code>", code_cell),
            Paragraph("id (UUID), githubId (BigInt), githubUsername (Text), avatarUrl (Text)", tbl_cell),
            Paragraph("Core developer profile; root anchor for galactic systems and auth sessions.", tbl_cell),
            Paragraph("Primary Key id, Unique index on githubUsername", tbl_cell)
        ],
        [
            Paragraph("<code>projects</code>", code_cell),
            Paragraph("id (UUID), userId (FK), repoUrl (Text), repoName (Text), teamId (FK)", tbl_cell),
            Paragraph("Connected Git repository representing an independent galactic cluster.", tbl_cell),
            Paragraph("Unique (userId, repoUrl), index on teamId", tbl_cell)
        ],
        [
            Paragraph("<code>branches</code>", code_cell),
            Paragraph("id (UUID), projectId (FK), branchName (Text), isDefault (Boolean)", tbl_cell),
            Paragraph("Git branch primitive representing orbital planes and constellation paths.", tbl_cell),
            Paragraph("Unique (projectId, branchName)", tbl_cell)
        ],
        [
            Paragraph("<code>commits</code>", code_cell),
            Paragraph("id (UUID), projectId (FK), branchId (FK), sha (Text), magnitude (Int)", tbl_cell),
            Paragraph("Individual commit entities rendered as 3D stars with spectral temperature.", tbl_cell),
            Paragraph("Unique (projectId, sha), index on committedAt", tbl_cell)
        ],
        [
            Paragraph("<code>sky_state</code>", code_cell),
            Paragraph("userId (PK, FK), totalStars (Int), clusterCount (Int), updatedAt (TS)", tbl_cell),
            Paragraph("High-performance cached counters for instantaneous galaxy initialization.", tbl_cell),
            Paragraph("Primary Key userId", tbl_cell)
        ],
        [
            Paragraph("<code>streaks</code>", code_cell),
            Paragraph("userId (PK, FK), currentStreak (Int), longestStreak (Int), lastActiveDate", tbl_cell),
            Paragraph("Chronological activity streak tracker unlocking celestial rewards.", tbl_cell),
            Paragraph("Primary Key userId", tbl_cell)
        ],
        [
            Paragraph("<code>constellations</code>", code_cell),
            Paragraph("id (UUID), userId (FK), name (Text), streakLength (Int), unlockedAt", tbl_cell),
            Paragraph("Milestone constellation achievements linking clusters across galaxy.", tbl_cell),
            Paragraph("Indexed on userId", tbl_cell)
        ],
    ]
    t_db = Table([db_headers] + db_rows, colWidths=[75, 140, 165, 128])
    t_db.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#059669')),
        ('BOX', (0, 0), (-1, -1), 1, HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, HexColor('#f0fdf4')]),
        ('TOPPADDING', (0, 0), (-1, -1), 3.0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.0),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_db)
    story.append(Spacer(1, 7))

    story.append(Paragraph("Production Multi-Cloud Deployment Architecture", section_h2))
    story.append(Spacer(1, 3))

    deploy_text = (
        "<b>Edge Presentation Tier (Vercel Global Edge Network):</b><br/>"
        "• Built on Next.js 15 App Router with zero-cold-start edge middleware and automatic static asset compression.<br/>"
        "• Three.js WebGL canvas client bundles dynamically code-split with lazy loading for sub-100ms First Contentful Paint.<br/>"
        "• Global Anycast edge routing ensures worldwide CDN response latency under 35ms for all static and cached assets.<br/><br/>"
        "<b>Persistent Lakebase Tier (Neon Serverless Postgres):</b><br/>"
        "• Serverless Postgres with instant compute autoscaling and scale-to-zero efficiency during idle periods.<br/>"
        "• Point-in-time branch snapshots enabling isolated staging environments without cloning production storage volumes.<br/>"
        "• Drizzle ORM connection pooling over WebSocket channels, eliminating TCP connection overhead on serverless routes.<br/><br/>"
        "<b>Security & Ingestion Tier (GitHub Webhooks + Crypto Timing-Safe Engine):</b><br/>"
        "• Direct inbound webhook handling on edge endpoints with constant-time HMAC-SHA256 signature verification.<br/>"
        "• Idempotent upsert transactions preventing duplicate commit ingestion during network retries."
    )
    story.append(Paragraph(deploy_text, body_p))
    story.append(Spacer(1, 7))

    # Architectural Sign-off Box
    signoff_text = (
        "CommitCosmos represents a complete, mathematically rigorous transformation of git observability. "
        "By fusing Three.js WebGL GPU instancing, the Fibonacci celestial sphere distribution, cryptographic HMAC-SHA256 "
        "webhook streaming, and Neon Lakebase Postgres persistence, the platform turns ordinary developer commits into an inspiring, "
        "interactive galaxy that celebrates software craftsmanship."
    )
    story.append(create_quote_box(
        "ARCHITECTURAL SIGN-OFF — V.A. Sai Venkatesh (Lead Architect)",
        signoff_text,
        border_color="#059669",
        bg_color="#ecfdf5",
        title_color="#047857",
        text_color="#064e3b"
    ))

    # Build the document with NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF at: {PDF_OUT_DOC}")

    import shutil
    shutil.copy2(PDF_OUT_DOC, PDF_OUT_PUBLIC)
    print(f"Successfully mirrored PDF to: {PDF_OUT_PUBLIC}")


if __name__ == "__main__":
    build_pdf()

