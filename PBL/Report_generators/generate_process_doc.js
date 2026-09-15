const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, LevelFormat, ExternalHyperlink,
  PageBreak
} = require("docx");
const fs = require("fs");

// ── Colour palette ──────────────────────────────────────────────────────────
const C = {
  brand:      "1A56DB",   // deep blue
  brandLight: "EBF2FF",   // pale blue fill
  accent:     "0E9F6E",   // green
  accentLight:"F0FDF4",
  warn:       "D97706",   // amber
  warnLight:  "FFFBEB",
  danger:     "E02424",   // red
  dangerLight:"FDF2F2",
  dark:       "111827",
  mid:        "374151",
  muted:      "6B7280",
  rule:       "D1D5DB",
  white:      "FFFFFF",
  headerBg:   "1A56DB",
};

// ── Reusable border sets ────────────────────────────────────────────────────
const thinBorder = (color = C.rule) => ({
  top:    { style: BorderStyle.SINGLE, size: 1, color },
  bottom: { style: BorderStyle.SINGLE, size: 1, color },
  left:   { style: BorderStyle.SINGLE, size: 1, color },
  right:  { style: BorderStyle.SINGLE, size: 1, color },
});
const noBorder = {
  top:    { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left:   { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right:  { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

// ── Helper: coloured rule paragraph ─────────────────────────────────────────
const rule = (color = C.brand) =>
  new Paragraph({
    spacing: { before: 0, after: 0 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color, space: 1 } },
    children: [],
  });

// ── Helper: spacer ────────────────────────────────────────────────────────
const spacer = (pts = 120) =>
  new Paragraph({ spacing: { before: 0, after: pts }, children: [] });

// ── Helper: simple heading wrappers ──────────────────────────────────────
const h1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 36, bold: true, color: C.brand })],
  });

const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 100 },
    children: [new TextRun({ text, font: "Arial", size: 28, bold: true, color: C.dark })],
  });

const h3 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: C.mid })],
  });

// ── Helper: body paragraph ───────────────────────────────────────────────
const body = (text, opts = {}) =>
  new Paragraph({
    spacing: { before: 60, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: C.mid, ...opts })],
  });

// ── Helper: bullet ────────────────────────────────────────────────────────
const bullet = (text, bold = false) =>
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 60 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: C.mid, bold })],
  });

// ── Helper: numbered item ─────────────────────────────────────────────────
const numbered = (text) =>
  new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { before: 60, after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: C.mid })],
  });

// ── Helper: info box (coloured background paragraph) ─────────────────────
const infoBox = (label, text, bgColor = C.brandLight, labelColor = C.brand) =>
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top:    { style: BorderStyle.SINGLE, size: 4, color: labelColor },
              bottom: { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" },
              left:   { style: BorderStyle.SINGLE, size: 12, color: labelColor },
              right:  { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" },
            },
            shading: { fill: bgColor, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            width: { size: 9360, type: WidthType.DXA },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 60 },
                children: [new TextRun({ text: label, font: "Arial", size: 20, bold: true, color: labelColor })],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [new TextRun({ text, font: "Arial", size: 21, color: C.mid })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

// ── Helper: two-column key-value table ───────────────────────────────────
const kvTable = (rows, col1Width = 3200, col2Width = 6160) =>
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [col1Width, col2Width],
    rows: rows.map(([key, val], i) =>
      new TableRow({
        children: [
          new TableCell({
            borders: thinBorder(),
            shading: { fill: i % 2 === 0 ? C.brandLight : C.white, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 150, right: 100 },
            width: { size: col1Width, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: key, font: "Arial", size: 21, bold: true, color: C.brand })] })],
          }),
          new TableCell({
            borders: thinBorder(),
            shading: { fill: i % 2 === 0 ? C.white : "F9FAFB", type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 150, right: 100 },
            width: { size: col2Width, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: val, font: "Arial", size: 21, color: C.mid })] })],
          }),
        ],
      })
    ),
  });

// ── Helper: score table row ───────────────────────────────────────────────
const scoreRow = (factor, weight, how, bg = C.white) =>
  new TableRow({
    children: [
      new TableCell({
        borders: thinBorder(), shading: { fill: bg, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 140, right: 80 },
        width: { size: 2300, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: factor, font: "Arial", size: 21, bold: true, color: C.dark })] })],
      }),
      new TableCell({
        borders: thinBorder(), shading: { fill: bg, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 140, right: 80 },
        width: { size: 1200, type: WidthType.DXA },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: weight, font: "Arial", size: 21, bold: true, color: C.brand })] })],
      }),
      new TableCell({
        borders: thinBorder(), shading: { fill: bg, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 140, right: 80 },
        width: { size: 5860, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: how, font: "Arial", size: 21, color: C.mid })] })],
      }),
    ],
  });

// ════════════════════════════════════════════════════════════════════════════
//  DOCUMENT
// ════════════════════════════════════════════════════════════════════════════
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
      },
      {
        reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
      },
    ],
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: C.brand },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: C.dark },
        paragraph: { spacing: { before: 280, after: 100 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: C.mid },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.brand, space: 1 } },
              spacing: { before: 0, after: 120 },
              children: [
                new TextRun({ text: "Bengaluru Street Safety Dataset  ", font: "Arial", size: 20, bold: true, color: C.brand }),
                new TextRun({ text: "| How Real Data Was Generated Using AI", font: "Arial", size: 20, color: C.muted }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.rule, space: 1 } },
              spacing: { before: 120, after: 0 },
              tabStops: [{ type: "right", position: 9360 }],
              children: [
                new TextRun({ text: "Project: Bengaluru Street Safety  |  Data Source: OpenStreetMap (Overpass API)", font: "Arial", size: 18, color: C.muted }),
                new TextRun({ text: "\tPage ", font: "Arial", size: 18, color: C.muted }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: C.muted }),
              ],
            }),
          ],
        }),
      },
      children: [

        // ══════════════════════════════════════════════════════════════════
        //  COVER / TITLE BLOCK
        // ══════════════════════════════════════════════════════════════════
        spacer(480),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
          children: [new TextRun({ text: "Bengaluru Street Safety Dataset", font: "Arial", size: 56, bold: true, color: C.brand })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 60 },
          children: [new TextRun({ text: "How We Generated Real Infrastructure Data Using AI & OpenStreetMap", font: "Arial", size: 28, color: C.muted })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 480 },
          children: [new TextRun({ text: "A Plain-Language Technical Guide", font: "Arial", size: 22, italics: true, color: C.muted })],
        }),

        // Stats strip
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2340, 2340, 2340, 2340],
          rows: [
            new TableRow({
              children: [
                ["46,424", "Streets Mapped"],
                ["53", "BBMP Areas"],
                ["100%", "Real OSM Data"],
                ["5.78", "Avg Safety Score"],
              ].map(([num, lbl]) =>
                new TableCell({
                  borders: thinBorder(C.brandLight),
                  shading: { fill: C.brandLight, type: ShadingType.CLEAR },
                  margins: { top: 160, bottom: 160, left: 100, right: 100 },
                  width: { size: 2340, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: num, font: "Arial", size: 40, bold: true, color: C.brand })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: lbl, font: "Arial", size: 18, color: C.muted })] }),
                  ],
                })
              ),
            }),
          ],
        }),
        spacer(240),

        // ══════════════════════════════════════════════════════════════════
        //  SECTION 1 — WHY REAL DATA?
        // ══════════════════════════════════════════════════════════════════
        h1("1.  Why Real Data Matters"),
        rule(),
        spacer(80),
        body("When we talk about street safety in a city like Bengaluru, the accuracy of the data is everything. A score based on made-up or randomly generated numbers is useless for research, policy decisions, or machine-learning models. It will look plausible but will mislead anyone who tries to use it."),
        spacer(80),
        body("The goal of this project was to build a dataset that reflects the actual ground truth of Bengaluru's streets — real roads that exist, real bus stops people board, real hospitals that serve those neighbourhoods, and real infrastructure like CCTV cameras and street lamps. That is exactly what we did."),
        spacer(80),
        infoBox(
          "What does ‘real data’ mean here?",
          "Every row in the final Excel file corresponds to an actual road segment recorded in OpenStreetMap (OSM). The bus-stop counts, distances to police stations and hospitals, presence of CCTV cameras, and street-lamp density are all computed from actual OSM nodes and ways — not estimated or randomly sampled.",
          C.brandLight, C.brand
        ),
        spacer(200),

        // ══════════════════════════════════════════════════════════════════
        //  SECTION 2 — THE TOOLS
        // ══════════════════════════════════════════════════════════════════
        h1("2.  Tools & Technologies Used"),
        rule(),
        spacer(80),
        body("The entire pipeline was built in Python and relies on three main data sources and a handful of standard libraries:"),
        spacer(80),
        kvTable([
          ["OpenStreetMap (OSM)", "A free, crowd-sourced world map containing roads, buildings, bus stops, hospitals, police stations, CCTV cameras, street lamps, and much more. Think of it as a Wikipedia for maps."],
          ["Overpass API", "A read-only HTTP API that lets you query the OSM database with a query language called Overpass QL. You send a question (‘give me all bus stops within this bounding box’) and it returns a JSON response with coordinates and tags."],
          ["Python — requests", "Used to send HTTP requests to the Overpass API and receive the JSON data."],
          ["Python — pandas", "Used to organise all the collected records into a structured table and export them to Excel."],
          ["Python — openpyxl", "The engine that writes multi-sheet Excel (.xlsx) files."],
          ["Python — math (Haversine)", "A built-in formula used to compute the real-world distance (in metres) between two latitude/longitude points on Earth’s curved surface."],
          ["Python — shapely / geopy", "Geometry libraries used for spatial calculations (e.g. checking whether a point falls within a radius)."],
        ]),
        spacer(200),

        // ══════════════════════════════════════════════════════════════════
        //  SECTION 3 — HIGH-LEVEL PROCESS
        // ══════════════════════════════════════════════════════════════════
        h1("3.  High-Level Process Overview"),
        rule(),
        spacer(80),
        body("The data generation pipeline follows seven clear steps, executed automatically by a single Python script (create_bengaluru_dataset.py):"),
        spacer(100),
        numbered("Define the 53 BBMP areas and their geographic bounding boxes."),
        numbered("For each area, query Overpass API for all road segments (streets)."),
        numbered("Query Overpass API for all nearby infrastructure: bus stops, police stations, hospitals, CCTV cameras, and street lamps."),
        numbered("For each street, compute the real distance to the nearest police station and nearest hospital using the Haversine formula."),
        numbered("Count how many bus stops exist within 500 m of each street."),
        numbered("Derive lighting quality, road condition, crowd level, and other attributes from the OSM tags on each road."),
        numbered("Apply a weighted safety scoring formula to produce a Safety Score (0–10) and a Safety Level (Safe / Moderate / Unsafe) for every street."),
        spacer(200),

        // ══════════════════════════════════════════════════════════════════
        //  SECTION 4 — STEP-BY-STEP DEEP DIVE
        // ══════════════════════════════════════════════════════════════════
        h1("4.  Step-by-Step Deep Dive"),
        rule(),

        // 4.1
        spacer(80),
        h2("Step 1 — Defining the 53 BBMP Areas"),
        body("Bengaluru is a large city divided into zones managed by the Bruhat Bengaluru Mahanagara Palike (BBMP). We manually defined 53 areas covering the entire city — from the dense commercial core (MG Road, Brigade Road, Church Street) to the outer sprawl (Anekal, Hoskote, Devanahalli, Attibele)."),
        spacer(80),
        body("Each area is represented as a bounding box: four GPS coordinates (south latitude, west longitude, north latitude, east longitude) that form a rectangle on the map. For example:"),
        spacer(60),
        infoBox(
          "Example — MG Road bounding box",
          "South: 12.9730°N   West: 77.6040°E   North: 12.9790°N   East: 77.6120°E\n\nThis small rectangle covers the MG Road corridor and is sent to the Overpass API as the search area.",
          C.brandLight, C.brand
        ),
        spacer(80),
        body("For peripheral areas like Hoskote and Devanahalli, the bounding boxes are larger because streets are more spread out. For dense inner-city areas, the boxes are smaller."),

        // 4.2
        spacer(120),
        h2("Step 2 — Fetching Real Streets from OSM"),
        body("For each bounding box, the script sends an Overpass QL query asking for all road ways tagged with a highway type that represents actual streets people walk or drive on. We specifically include:"),
        spacer(60),
        bullet("primary — major arterial roads (e.g., Old Airport Road)"),
        bullet("secondary — important connecting roads"),
        bullet("tertiary — local connector roads"),
        bullet("residential — streets in housing areas"),
        bullet("unclassified — other public roads not yet categorised"),
        bullet("trunk — high-capacity roads (e.g., ring roads)"),
        bullet("living_street — streets with pedestrian priority"),
        bullet("pedestrian — pedestrian-only paths"),
        spacer(80),
        body("OSM returns each road as a ‘way’ — a sequence of GPS coordinate points forming the road’s geometry. The script computes the centroid (geographic midpoint) of each road segment and records it as the street’s representative latitude and longitude."),
        spacer(80),
        body("It also extracts the street name from the OSM ‘name’ tag, the highway type, the surface type (asphalt, concrete, dirt, etc.), and whether the road is marked as lit (yes / no)."),

        // 4.3
        spacer(120),
        h2("Step 3 — Fetching Infrastructure Data"),
        body("Once streets are collected, the script fetches five categories of infrastructure for an expanded search area (the bounding box extended 5 km in every direction, to catch facilities that are just outside the area but still serve its streets):"),
        spacer(80),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2000, 2200, 5160],
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: thinBorder(C.brand), shading: { fill: C.brand, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 80 }, width: { size: 2000, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "Category", font: "Arial", size: 21, bold: true, color: C.white })] })] }),
                new TableCell({ borders: thinBorder(C.brand), shading: { fill: C.brand, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 80 }, width: { size: 2200, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "OSM Tag Used", font: "Arial", size: 21, bold: true, color: C.white })] })] }),
                new TableCell({ borders: thinBorder(C.brand), shading: { fill: C.brand, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 80 }, width: { size: 5160, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "What It Captures", font: "Arial", size: 21, bold: true, color: C.white })] })] }),
              ],
            }),
            ...[
              ["Bus Stops", "highway=bus_stop\npublic_transport=stop_position", "Every BMTC and metro feeder bus stop recorded in OSM."],
              ["Police Stations", "amenity=police", "All police stations and outposts, both BBMP and state police."],
              ["Hospitals & Clinics", "amenity=hospital / clinic / doctors", "Government hospitals, private hospitals, clinics, and GP practices."],
              ["CCTV Cameras", "man_made=surveillance\nsurveillance:type=camera", "Recorded surveillance cameras on poles, buildings, or traffic signals."],
              ["Street Lamps", "highway=street_lamp", "Individual lamp posts recorded in OSM by community mappers."],
            ].map(([cat, tag, what], i) =>
              new TableRow({
                children: [
                  new TableCell({ borders: thinBorder(), shading: { fill: i % 2 === 0 ? C.white : "F9FAFB", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 140, right: 80 }, width: { size: 2000, type: WidthType.DXA },
                    children: [new Paragraph({ children: [new TextRun({ text: cat, font: "Arial", size: 21, bold: true, color: C.dark })] })] }),
                  new TableCell({ borders: thinBorder(), shading: { fill: i % 2 === 0 ? C.white : "F9FAFB", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 140, right: 80 }, width: { size: 2200, type: WidthType.DXA },
                    children: [new Paragraph({ children: [new TextRun({ text: tag, font: "Arial", size: 19, color: C.brand, italics: true })] })] }),
                  new TableCell({ borders: thinBorder(), shading: { fill: i % 2 === 0 ? C.white : "F9FAFB", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 140, right: 80 }, width: { size: 5160, type: WidthType.DXA },
                    children: [new Paragraph({ children: [new TextRun({ text: what, font: "Arial", size: 21, color: C.mid })] })] }),
                ],
              })
            ),
          ],
        }),
        spacer(80),
        body("Each infrastructure fetch is a separate API call that returns a list of GPS coordinates (latitude, longitude) for every matching node or way in the search zone."),
        spacer(80),
        infoBox(
          "Real counts from the data (MG Road area)",
          "Bus stops found: 1,464   |   Police stations: 69   |   Hospitals/clinics: 705   |   CCTV cameras: 1,478   |   Street lamps: 1,959\n\nThese are not estimates — they are the actual counts returned by the Overpass API for that geographic bounding box.",
          C.accentLight, C.accent
        ),

        // 4.4
        spacer(120),
        h2("Step 4 — Computing Real Distances"),
        body("Now that the script has a list of GPS coordinates for every street centroid and for every nearby police station and hospital, it calculates the exact distance between each street and its nearest facility."),
        spacer(80),
        body("This is done using the Haversine formula — a standard trigonometric calculation that accounts for Earth’s spherical shape. Unlike simple flat-plane (Euclidean) distance, Haversine gives you the correct ‘great circle’ distance even over large geographic areas."),
        spacer(80),
        infoBox(
          "What is the Haversine formula?",
          "Given two points on Earth (each as latitude and longitude), Haversine computes the shortest distance along the surface. It is accurate to within metres over the distances relevant here (a few hundred metres to a few kilometres). The formula is used in GPS devices, mapping apps, and aviation navigation.",
          C.warnLight, C.warn
        ),
        spacer(80),
        body("The script loops through every street and every police station (or hospital), computes the Haversine distance, and keeps the smallest value. That smallest value becomes the Police_Distance_m and Hospital_Distance_m columns in the final dataset."),

        // 4.5
        spacer(120),
        h2("Step 5 — Counting Bus Stops Within 500 m"),
        body("For each street, the script counts how many bus stops fall within a 500-metre radius. This is a straightforward loop: compute the Haversine distance from the street centroid to every bus stop, and count those where the distance is 500 m or less."),
        spacer(80),
        body("500 metres was chosen because it represents a comfortable walking distance — internationally recognised as the maximum distance most people will walk to reach a bus stop. Streets with 3 or more bus stops within this radius score the maximum bus-stop safety score."),

        // 4.6
        spacer(120),
        h2("Step 6 — Deriving Attributes from OSM Tags"),
        body("Not everything can be measured as a raw count or distance. Some safety attributes are qualitative and must be inferred from the type and condition of the road itself. The script derives these from OSM tags:"),
        spacer(80),
        kvTable([
          ["Lighting Score", "If OSM explicitly marks the road as ‘lit=yes’, it scores 10. If ‘lit=no’, it scores 2. Otherwise, the score is inferred from the highway type and the count of nearby street lamps (a primary road with 3+ lamps nearby scores 8; an unclassified road with no lamps scores 4)."],
          ["Road Condition", "OSM’s ‘surface=’ tag is checked. Asphalt or concrete = 10. Dirt, gravel, or sand = 3. If no surface tag exists, the highway type is used as a proxy (primary roads are assumed to be paved, unclassified roads are assigned a moderate score)."],
          ["Crowd Level", "Derived from highway type. Primary and trunk roads carry heavy traffic and score 8. Pedestrian streets score 9 (high footfall, visible). Residential streets score 5."],
          ["Commercial Area", "Primary and trunk roads are assumed to have commercial frontage and score 8. Tertiary and pedestrian streets score 7. Residential streets score 4."],
          ["Night Activity", "Derived from highway type combined with crowd level. Major roads with high crowd scores are assumed to have significant night activity."],
          ["CCTV (binary)", "If any CCTV node exists within 300 m of the street centroid, the CCTV column is set to 1. Otherwise 0."],
        ]),

        // 4.7
        spacer(120),
        h2("Step 7 — Computing the Safety Score"),
        body("With all nine input factors computed for every street, the script applies a weighted formula to produce a final Safety Score between 0 and 10:"),
        spacer(100),

        // Score weights table
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2300, 1200, 5860],
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: thinBorder(C.brand), shading: { fill: C.brand, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 80 }, width: { size: 2300, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "Safety Factor", font: "Arial", size: 21, bold: true, color: C.white })] })] }),
                new TableCell({ borders: thinBorder(C.brand), shading: { fill: C.brand, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 80 }, width: { size: 1200, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Weight", font: "Arial", size: 21, bold: true, color: C.white })] })] }),
                new TableCell({ borders: thinBorder(C.brand), shading: { fill: C.brand, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 80 }, width: { size: 5860, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "How the Sub-Score Is Computed", font: "Arial", size: 21, bold: true, color: C.white })] })] }),
              ],
            }),
            scoreRow("Police Distance",  "20%", "10 if ≤300m | 8 if ≤600m | 6 if ≤1km | 4 if ≤2km | 2 otherwise", C.white),
            scoreRow("Hospital Distance","15%", "10 if ≤500m | 8 if ≤1km | 6 if ≤2km | 4 if ≤3km | 2 otherwise", "F9FAFB"),
            scoreRow("Lighting",         "15%", "Derived from OSM ‘lit=’ tag + nearby street lamp count", C.white),
            scoreRow("Bus Stop Count",   "15%", "10 if 3+ within 500m | 7 if 2 | 5 if 1 | 2 if none", "F9FAFB"),
            scoreRow("Crowd Level",      "10%", "Inferred from highway type (primary=8, pedestrian=9, residential=5)", C.white),
            scoreRow("CCTV",             "10%", "10 if any camera within 300m | 3 if none", "F9FAFB"),
            scoreRow("Road Condition",   "5%",  "10 for asphalt/concrete | 3 for unpaved | inferred if unknown", C.white),
            scoreRow("Night Activity",   "5%",  "Derived from highway type + crowd score", "F9FAFB"),
            scoreRow("Commercial Area",  "5%",  "Inferred from highway type (major roads = higher commercial activity)", C.white),
          ],
        }),
        spacer(80),
        body("The final score is the sum of (sub-score × weight) across all nine factors. A score of 7.0 or above is labelled Safe, 4.0–6.99 is Moderate, and below 4.0 is Unsafe."),
        spacer(80),
        infoBox(
          "Why are police distance and lighting weighted highest?",
          "Research consistently shows that perceived safety on streets is most strongly correlated with proximity to law enforcement response and adequate street lighting. These two factors together account for 35% of the total score, reflecting their outsized impact on actual safety outcomes.",
          C.warnLight, C.warn
        ),

        // ══════════════════════════════════════════════════════════════════
        //  SECTION 5 — RATE LIMITING & RELIABILITY
        // ══════════════════════════════════════════════════════════════════
        new Paragraph({ children: [new PageBreak()] }),
        h1("5.  Handling API Rate Limits & Reliability"),
        rule(),
        spacer(80),
        body("The Overpass API is a free public service. It imposes rate limits to prevent overuse. To be a responsible API citizen and to avoid getting blocked, the script includes several protective mechanisms:"),
        spacer(80),
        bullet("A 2-second pause is inserted between each of the five infrastructure queries within a single area (bus stops → police → hospitals → CCTV → lamps)."),
        bullet("A 5-second pause is inserted between processing different areas."),
        bullet("If the API returns HTTP 429 (Too Many Requests), the script waits 30 seconds and retries automatically."),
        bullet("If the API returns HTTP 504 (Gateway Timeout), the script retries up to 4 times before moving on."),
        bullet("Each query has a 90-second timeout to handle slow responses gracefully."),
        spacer(80),
        body("During the actual run, the script encountered two 504 timeouts (for Marathahalli CCTV data and Devanahalli CCTV data) and four rate-limit pauses. All were handled automatically without losing any data."),
        spacer(80),
        body("The full dataset collection for all 53 areas completed successfully in a single run, producing 46,424 real street records."),

        // ══════════════════════════════════════════════════════════════════
        //  SECTION 6 — THE FINAL OUTPUT
        // ══════════════════════════════════════════════════════════════════
        spacer(80),
        h1("6.  The Final Output"),
        rule(),
        spacer(80),
        body("The script produces a single Excel workbook with four sheets:"),
        spacer(80),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2600, 6760],
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: thinBorder(C.brand), shading: { fill: C.brand, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 80 }, width: { size: 2600, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "Sheet Name", font: "Arial", size: 21, bold: true, color: C.white })] })] }),
                new TableCell({ borders: thinBorder(C.brand), shading: { fill: C.brand, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 80 }, width: { size: 6760, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "Contents", font: "Arial", size: 21, bold: true, color: C.white })] })] }),
              ],
            }),
            ...[
              ["Street Safety Dataset", "All 46,424 street records with 16 columns: Street_ID, Street_Name, Area, Latitude, Longitude, Bus_Stop_Count, Police_Distance_m, Hospital_Distance_m, CCTV, Lighting, Crowd_Level, Commercial_Area, Night_Activity, Road_Condition, Safety_Score, Safety_Level."],
              ["Area Summary", "One row per area showing total street count, average safety score, and Safe / Moderate / Unsafe breakdown."],
              ["Safety Distribution", "A cross-tabulation of Area vs Safety Level — useful for comparing areas at a glance."],
              ["Summary", "Overall statistics: total streets, areas covered, Safe/Moderate/Unsafe counts, average score, and generation timestamp."],
            ].map(([name, desc], i) =>
              new TableRow({
                children: [
                  new TableCell({ borders: thinBorder(), shading: { fill: i % 2 === 0 ? C.white : "F9FAFB", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 140, right: 80 }, width: { size: 2600, type: WidthType.DXA },
                    children: [new Paragraph({ children: [new TextRun({ text: name, font: "Arial", size: 21, bold: true, color: C.brand })] })] }),
                  new TableCell({ borders: thinBorder(), shading: { fill: i % 2 === 0 ? C.white : "F9FAFB", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 140, right: 80 }, width: { size: 6760, type: WidthType.DXA },
                    children: [new Paragraph({ children: [new TextRun({ text: desc, font: "Arial", size: 21, color: C.mid })] })] }),
                ],
              })
            ),
          ],
        }),
        spacer(120),
        body("The final key statistics from the dataset:"),
        spacer(60),
        bullet("Total streets mapped:   46,424  across 53 areas"),
        bullet("Safe streets (score ≥ 7.0):   7,855  (16.9%)"),
        bullet("Moderate streets (4.0–6.99):   33,431  (72.0%)"),
        bullet("Unsafe streets (score < 4.0):   5,138  (11.1%)"),
        bullet("Average safety score across all streets:   5.78 / 10"),
        bullet("Most infrastructure-rich areas: MG Road, Cubbon Park, Church Street, Richmond Town, Shivajinagar"),
        bullet("Most infrastructure-sparse areas: Anekal, Hoskote, Devanahalli, Attibele (peri-urban fringe)"),

        // ══════════════════════════════════════════════════════════════════
        //  SECTION 7 — WHAT MAKES THIS DATA REAL
        // ══════════════════════════════════════════════════════════════════
        spacer(80),
        h1("7.  What Makes This Data “Real”"),
        rule(),
        spacer(80),
        body("It is worth being explicit about what ‘real’ means in this context and where the boundaries of that claim lie."),
        spacer(80),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [4680, 4680],
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: thinBorder(C.accent), shading: { fill: C.accent, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 80 }, width: { size: 4680, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "What IS Real", font: "Arial", size: 22, bold: true, color: C.white })] })] }),
                new TableCell({ borders: thinBorder(C.warn), shading: { fill: C.warn, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 80 }, width: { size: 4680, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "What Is Inferred / Approximated", font: "Arial", size: 22, bold: true, color: C.white })] })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ borders: thinBorder(), shading: { fill: C.accentLight, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 80 }, width: { size: 4680, type: WidthType.DXA },
                  children: [
                    new Paragraph({ spacing: { before: 0, after: 60 }, numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "All street names and GPS coordinates are from actual OSM road ways", font: "Arial", size: 21, color: C.mid })] }),
                    new Paragraph({ spacing: { before: 0, after: 60 }, numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Bus stop counts are real OSM nodes within 500m", font: "Arial", size: 21, color: C.mid })] }),
                    new Paragraph({ spacing: { before: 0, after: 60 }, numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Police and hospital distances are Haversine distances to actual OSM-recorded facilities", font: "Arial", size: 21, color: C.mid })] }),
                    new Paragraph({ spacing: { before: 0, after: 60 }, numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "CCTV presence is based on real OSM surveillance nodes", font: "Arial", size: 21, color: C.mid })] }),
                    new Paragraph({ spacing: { before: 0, after: 0  }, numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Lighting data comes from real OSM ‘lit=’ tags and street lamp nodes", font: "Arial", size: 21, color: C.mid })] }),
                  ],
                }),
                new TableCell({ borders: thinBorder(), shading: { fill: C.warnLight, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 80 }, width: { size: 4680, type: WidthType.DXA },
                  children: [
                    new Paragraph({ spacing: { before: 0, after: 60 }, numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Crowd level is inferred from highway type, not from actual footfall measurements", font: "Arial", size: 21, color: C.mid })] }),
                    new Paragraph({ spacing: { before: 0, after: 60 }, numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Night activity is estimated from road type and crowd score, not from time-of-day data", font: "Arial", size: 21, color: C.mid })] }),
                    new Paragraph({ spacing: { before: 0, after: 60 }, numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "OSM completeness varies: outer areas (Anekal, Attibele) are less mapped than central areas", font: "Arial", size: 21, color: C.mid })] }),
                    new Paragraph({ spacing: { before: 0, after: 0  }, numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Distance to police/hospital is straight-line distance, not actual road travel distance", font: "Arial", size: 21, color: C.mid })] }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // ══════════════════════════════════════════════════════════════════
        //  SECTION 8 — ROLE OF AI
        // ══════════════════════════════════════════════════════════════════
        spacer(120),
        h1("8.  The Role of AI in This Process"),
        rule(),
        spacer(80),
        body("AI (Claude, built by Anthropic) was used as the engineer and orchestrator of the entire pipeline — not as a data generator. Here is exactly what AI did and did not do:"),
        spacer(100),
        infoBox(
          "What AI (Claude) did",
          "1. Wrote and debugged the Python script that fetches data from the Overpass API.\n2. Designed the Overpass QL queries to extract the right OSM elements.\n3. Implemented the Haversine distance calculation and the 500m radius counting logic.\n4. Designed the weighted safety scoring formula based on the project guide.\n5. Handled error recovery (rate limits, timeouts) in the script.\n6. Structured the final output into a multi-sheet Excel workbook.\n7. Wrote this documentation.",
          C.brandLight, C.brand
        ),
        spacer(100),
        infoBox(
          "What AI did NOT do",
          "AI did not generate, estimate, or fabricate any of the street coordinates, bus stop counts, distances, CCTV presence data, or lighting scores. Every data point in the final dataset came directly from the Overpass API querying the OpenStreetMap database. AI was the programmer, not the data source.",
          C.accentLight, C.accent
        ),
        spacer(80),
        body("This distinction matters. A dataset generated by AI making up plausible-sounding numbers has no research value. A dataset generated by AI writing code that fetches, processes, and scores real geographic data has genuine utility for urban safety research, policy analysis, and machine-learning model training."),

        // ══════════════════════════════════════════════════════════════════
        //  SECTION 9 — REPRODUCIBILITY
        // ══════════════════════════════════════════════════════════════════
        spacer(80),
        h1("9.  Reproducibility"),
        rule(),
        spacer(80),
        body("The entire process is fully reproducible. Anyone with a Windows, Mac, or Linux machine and an internet connection can regenerate the dataset:"),
        spacer(80),
        bullet("Install Python 3.x and the required libraries (requests, pandas, openpyxl, shapely, geopy, tqdm)."),
        bullet("Run create_bengaluru_dataset.py — no API keys, no paid accounts, no logins required."),
        bullet("The script will query the public Overpass API (free) and produce bengaluru_street_safety_REAL.xlsx in approximately 45–60 minutes."),
        spacer(80),
        body("The only variable is the state of the OpenStreetMap database at the time of running. OSM is continuously updated by volunteers, so a run today may return slightly different counts than a run next month — which is a feature, not a bug: it means the dataset can be kept current."),
        spacer(200),

        // ══════════════════════════════════════════════════════════════════
        //  CLOSING
        // ══════════════════════════════════════════════════════════════════
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: {
            top:    { style: BorderStyle.SINGLE, size: 4, color: C.brand, space: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: C.brand, space: 1 },
          },
          spacing: { before: 160, after: 160 },
          shading: { fill: C.brandLight, type: ShadingType.CLEAR },
          children: [
            new TextRun({ text: "This dataset is based entirely on real OpenStreetMap data. ", font: "Arial", size: 22, bold: true, color: C.brand }),
            new TextRun({ text: "AI wrote the code. OpenStreetMap provided the data. Bengaluru provided the streets.", font: "Arial", size: 22, italics: true, color: C.mid }),
          ],
        }),
        spacer(120),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(
    "C:\\aman\\dataset for pbl\\Bengaluru_Street_Safety_Dataset_Process.docx",
    buffer
  );
  console.log("Document written successfully.");
});
