# SafeHer: 13-Slide Presentation Summary & Presenter Notes
**Department of Master of Computer Applications (MCA)**  
**BMS Institute of Technology and Management, Bengaluru**  
**Project Work Phase I (Subject Code: MMCA34) · Batch 2025–2027**  
**Project Guide:** Dr. M Sridevi  
**Presenters:**
- **Module 1 Lead:** Anusha K (USN: `1BY25MC017`) — *“Security provision through hotspot identification and risk assessment for women’s safety in public spaces”*
- **Module 2 Lead:** Aman Yadav (USN: `1BY25MC012`) — *“Women’s safety and dynamic security monitoring mobile application”*

---

## Generated Deliverables
1. **Primary PowerPoint Deck:** [`SafeHer_Phase1_Presentation.pptx`](file:///Users/anushak/Documents/3rd%20Semester/SafeHer_Phase1_Presentation.pptx)
2. **Alternate Location Deck:** [`SafeHer_12_Slide_Presentation.pptx`](file:///Users/anushak/Documents/3rd%20Semester/Ongoing/Interim_Presentation/SafeHer_12_Slide_Presentation.pptx)
3. **Printable Viva Speaker Guide (PDF):** [`SafeHer_12_Slide_Speaker_Guide.pdf`](file:///Users/anushak/Documents/3rd%20Semester/SafeHer_12_Slide_Speaker_Guide.pdf)
4. **Slide-by-Slide Explanation Script (PDF):** [`SafeHer_Slide_by_Slide_Explanation_Script.pdf`](file:///Users/anushak/Documents/3rd%20Semester/SafeHer_Slide_by_Slide_Explanation_Script.pdf)
5. **Python Deck Builder:** [`build_safeher_12slides.py`](file:///Users/anushak/Documents/3rd%20Semester/Ongoing/Interim_Presentation/build_safeher_12slides.py)

---

## Slide-by-Slide Overview & Verbatim Spoken Script

### Slide 1 – Title Slide
- **Visual Design:** Dark Royal Navy background (`#0C2340`) with gold accent framing (`#C4A35A`), BMSIT&M department header, dual-card breakdown for Module 1 & Module 2, Guide card (Dr. M Sridevi), and SDG 5 Target 5.2 badge.
- **What to say:**
  > Good morning, ma’am and respected evaluators.
  > 
  > We are from the Department of MCA, BMS Institute of Technology and Management.
  > 
  > Our complete project is titled **SafeHer: an integrated data-driven platform for women’s safety in public spaces**.
  > 
  > SafeHer bridges crowdsourced citizen reporting with backend geospatial analysis, hotspot identification, and risk assessment to provide authorities with proactive, preventive patrol intelligence rather than delayed reactions.
  > 
  > Our project is guided by **Dr. M Sridevi**.
  > 
  > It directly aligns with **SDG 5 – Gender Equality**, particularly **Target 5.2**, which focuses on eliminating all forms of violence against women and girls in public spaces.
  > 
  > To build this end-to-end system comprehensively, our project is divided into two complementary, interconnected modules:
  > 
  > **Module 1 is my module:** **“Security provision through hotspot identification and risk assessment for women’s safety in public spaces.”**
  > I am **Anusha K, 1BY25MC017**. My individual scope is the analytical core—handling data cleaning, spatial clustering on a 1 km grid, hotspot detection, multi-tier risk stratification, and analytical APIs.
  > 
  > The second module is **Module 2:** **“Women’s safety and dynamic security monitoring mobile application,”** which is handled by **Aman Yadav, 1BY25MC012**. His scope covers citizen mobile incident reporting and the authority administrative dashboard.
  > 
  > Both modules communicate seamlessly through REST APIs to deliver the unified SafeHer platform.

---

### Slide 2 – Introduction & Project Context
- **Visual Design:** Three-pillar card layout: 
  1. *The Existing Difficulty* (Fragmented registers, lack of spatial focus, delayed response, patrol allocation challenges).
  2. *The SafeHer Solution* (Incident reporting + location-based analysis + hotspot clustering + risk scoring).
  3. *Impact & Authority Value* (Actionable spatial intelligence, preventive patrolling, centralized monitoring).
- **What to say:**
  > The main objective of our project is to improve women’s safety in public spaces using a data-driven approach.
  > 
  > In the existing system, incidents may be reported through different sources, but it can be difficult to identify **where incidents are repeatedly occurring** and which locations require more attention.
  > 
  > Our project combines **incident reporting, location-based analysis, hotspot identification and risk assessment**.
  > 
  > The mobile application allows users to report safety-related incidents by providing details such as the **incident type, date, time, description and geographical location**.
  > 
  > The reported information is then processed and analysed.
  > 
  > Module 1 focuses on analysing the incidents and identifying **hotspots and risk levels**, while Module 2 focuses on the **mobile application and authority dashboard**.
  > 
  > The main purpose is to provide useful information for authorities so that they can take preventive actions such as **better monitoring and patrolling in repeatedly affected areas**.

---

### Slide 3 – Literature Survey & Research Foundation
- **Visual Design:** Four foundational pillars in a 2x2 grid:
  1. *Hotspot Theory & Spatial Concentration* (Sherman, 1989): Micro-place crime concentration justifies spatial hotspot mapping as an operational planning object.
  2. *GIS Crime Mapping & Patrol Allocation* (Chainey & Ratcliffe, 2005): Spatial clustering algorithms optimize patrol deployment; provides precedent for SafeHer's 1 km grid resolution.
  3. *Built Environment Determinants* (Nehme et al., 2017 & Safetipin Audits): Quantifies how street lighting, CCTV surveillance, and police station distance influence perceived safety.
  4. *Research Gap & The SafeHer Technological Advance*: Bridges the gap between reactive SOS panic buttons and delayed retrospective police records.
- **What to say:**
  > Now I will present the literature survey and theoretical foundation of our project.
  > 
  > Our work is grounded on well-established research in GIS crime mapping and environmental criminology.
  > 
  > First, research by **Sherman in 1989 on hotspot theory** proved that crime is not distributed evenly across a city, but concentrates heavily in specific micro-places. This justifies why hotspot identification is a scientifically valid planning tool.
  > 
  > Second, **Chainey and Ratcliffe in 2005** demonstrated that GIS-based hotspot detection allows law enforcement to allocate patrolling and civic resources efficiently. In SafeHer, we use a 1-kilometer spatial grid to evaluate spatial density and recurrence.
  > 
  > Third, environmental studies, such as **Nehme et al. in 2017 and Safetipin audit studies**, show that physical infrastructure like street lighting, CCTV surveillance, and police proximity strongly influence women’s perceived and actual safety.
  > 
  > Finally, the **research gap** we address is that existing mobile applications are mostly reactive SOS panic buttons, while official police records are delayed and coarse. SafeHer bridges this gap by providing a proactive, rule-based, street-level geospatial hotspot and risk assessment platform using crowdsourced community data.

---

### Slide 4 – Datasets and Resources
- **Visual Design:** Two-column data fusion cards:
  - *Source A:* Crowdsourced Incident Data (types, timestamps, descriptions, GPS coordinates).
  - *Source B:* Bengaluru Street Safety Dataset (`bengaluru_street_safety_REAL.xlsx`) & OpenStreetMap (Overpass API) infrastructure features (lighting, CCTV surveillance, police distance, bus stops, road class).
- **What to say:**
  > For our project, we use different types of data and resources.
  > 
  > The first important source is the **incident data**. This contains information related to reported incidents, including their location, date, time and type.
  > 
  > We also use geographical and public infrastructure information.
  > 
  > For geographical information, we use **OpenStreetMap** and related geographical resources.
  > 
  > The available Excel dataset is currently focused on **Bengaluru**.
  > 
  > The dataset contains information related to roads, streets and buildings, along with prototype or assumed infrastructure attributes such as lighting and surveillance.
  > 
  > These infrastructure attributes are used for the project analysis and demonstration.
  > 
  > In addition to the existing dataset, new incident information can come from the **mobile application**.
  > 
  > This allows the system to combine existing data with newly reported incidents.

---

### Slide 5 – Complete System Data Flow
- **Visual Design:** Full-width high-resolution architectural data pipeline diagram (`review-dataflow.png`) displayed cleanly across the canvas:
  - Mobile Intake $\rightarrow$ FastAPI Backend $\rightarrow$ Database $\rightarrow$ Module 1 Geospatial Analytics $\rightarrow$ Hotspot Classification $\rightarrow$ Authority Dashboard.
- **What to say:**
  > This slide shows the complete data flow of our project.
  > 
  > First, we have the **existing data** and the **new incident data collected through the mobile application**.
  > 
  > The incident information is sent through an **API** to the backend.
  > 
  > The backend stores the information in the database.
  > 
  > After that, Module 1 performs **data preprocessing and incident analysis**.
  > 
  > The data is analysed based on factors such as **incident type, date, time, location, frequency and recurrence**.
  > 
  > Then we perform **geospatial analysis** to understand where incidents are concentrated.
  > 
  > Based on this analysis, we identify **hotspots** and assign different **risk levels** such as Low, Medium and High.
  > 
  > The analytical results are then provided through APIs to the **Authority Dashboard**.
  > 
  > The dashboard allows authorities to view the information using maps, charts and filters.
  > 
  > The system can also support **alerts and preventive patrolling** based on repeated or concentrated historical incidents.

---

### Slide 6 – Architecture & Technology Stack
- **Visual Design:** Split-view layout:
  - *Left:* Full-stack 4-tier architectural block diagram (`safeher-architecture.png`).
  - *Right:* Six dedicated technology specification cards (Single-frame rows to guarantee zero collision):
    - *Mobile Client:* React Native / Flutter (GPS tracking, offline caching).
    - *Backend Services:* Python 3 & FastAPI (Asynchronous REST API, Swagger docs).
    - *Database Layer:* MongoDB / JSON Store (Geospatial indices, flexible incident schemas).
    - *Analytics & GIS:* Pandas, NumPy & GeoPandas (Grid snapping, hotspot clustering).
    - *Mapping & Visuals:* Leaflet, Folium & Matplotlib (OpenStreetMap tiles, risk markers).
    - *Authority Dashboard:* React / Next.js, HTML5 & CSS3 (Multi-parameter filtering suite).
- **What to say:**
  > This slide shows the architecture and technologies used in our project.
  > 
  > For the mobile application, we can use a cross-platform framework such as **Flutter or React Native**.
  > 
  > For the backend, we use **Python and FastAPI**.
  > 
  > The database layer uses **MongoDB** for storing incident information.
  > 
  > For data processing and analysis, we use libraries such as **Pandas, NumPy and GeoPandas**.
  > 
  > For geographical visualization, we use **OpenStreetMap** along with **Leaflet or Folium**.
  > 
  > For charts and analysis visualizations, we use **Matplotlib or Plotly**.
  > 
  > The authority dashboard can be developed using technologies such as **HTML, CSS, JavaScript and React**.
  > 
  > The communication between different components is handled using **REST APIs and JSON**.
  > 
  > We can use tools such as **Postman** for API testing, and development tools such as **VS Code and Android Studio**.

---

### Slide 7 – Project Modularization & Scope Division
- **Visual Design:** Hero two-paths diagram (`safeher-two-paths.png`) illustrating decoupled academic scope:
  - *Module 1 (Anusha K):* Analytical core, spatial clustering algorithms, hotspot identification, risk calculation, analytical APIs.
  - *Module 2 (Aman Yadav):* Mobile reporting client, backend ingestion endpoints, administrative authority dashboard.
- **What to say:**
  > Our project is divided into two major modules, but both modules work together as a single system.
  > 
  > **Module 1 is my module.**
  > 
  > It focuses on **incident analysis, geospatial analysis, hotspot identification and risk-level assessment**.
  > 
  > My module takes the available incident and geographical data, processes it, identifies areas where incidents are concentrated or repeatedly reported, and produces the analytical results.
  > 
  > **Module 2 is handled by Aman.**
  > 
  > It focuses on the **women’s safety mobile application and the authority dashboard**.
  > 
  > The mobile application allows users to submit incident reports.
  > 
  > The authority dashboard allows authorized personnel to monitor the reported incidents, view maps and charts, apply filters and see hotspot and risk information.
  > 
  > So, Module 1 provides the analytical results, while Module 2 provides the reporting and monitoring interface.

---

### Slide 8 – Module 1 Methodology (Methodology Deep Dive)
- **Visual Design:** Hero eight-stage analytical pipeline workflow diagram (`safeher-module1-flow.png`):
  - *Row 1:* 1. Data Integration $\rightarrow$ 2. Pre-processing $\rightarrow$ 3. Incident Analysis $\rightarrow$ 4. Geospatial Binning.
  - *Transition:* Prominent connecting pipeline flow from Step 04 directly down and over into Step 05 (`STAGE 04 --> STAGE 05`).
  - *Row 2:* 5. Hotspot Detection $\rightarrow$ 6. Risk Stratification $\rightarrow$ 7. Alert Generation $\rightarrow$ 8. Serving Layer (APIs & GeoJSON).
- **What to say:**
  > Now I will explain my module in more detail through its eight-stage analytical pipeline.
  > 
  > The first step is **data integration**, where we combine geographical context with incident reports received from the mobile application.
  > 
  > Second is **data preprocessing**, handling missing values, deduplication, and validating GPS coordinates within Karnataka.
  > 
  > Third is **incident analysis**, categorizing event types, temporal patterns across time of day and week, and recurrence.
  > 
  > Fourth is **geospatial binning**, mapping citizen reports onto a uniform 1-kilometer spatial grid.
  > 
  > From Step 4, the workflow flows directly into Step 5: **hotspot detection**, flagging areas with 3 or more incidents across distinct dates.
  > 
  > Sixth is **risk stratification**, assigning **Low, Medium, or High** risk tiers using rule-based criteria fusing incident density with infrastructure vulnerabilities.
  > 
  > Seventh is **alert generation**, ranking high-risk areas to produce a prioritized preventive patrol list for law enforcement.
  > 
  > Finally, eighth is the **serving layer**, publishing **GeoJSON and REST APIs** so that analytical results seamlessly feed the Authority Dashboard.

---

### Slide 9 – Module 1 Sample Analytical Results
- **Visual Design:** High-contrast empirical validation display:
  - *Left:* Visual hotspot map preview (`safeher-hotspots-map.png`) showing spatial distribution across surveyed areas.
  - *Right:* Three calibrated metric cards:
    - *Run Summary:* 1,079 reports evaluated, 534 incident-like records, 72 hotspot cells (~1 km), 55 patrol alerts.
    - *Risk Breakdown:* High Risk (30 cells), Medium Risk (19 cells), Low Risk (23 cells).
    - *Operational Value:* Instant visual clarity for police commanders without paper log sifting.
- **What to say:**
  > This slide shows the type of output produced by Module 1.
  > 
  > The purpose of this output is to make the incident analysis easier to understand visually.
  > 
  > Instead of looking at individual incident records, authorities can see where incidents are concentrated.
  > 
  > The hotspot information can be represented on a map, along with the corresponding risk level.
  > 
  > The system can categorize identified areas into **Low, Medium and High risk levels**.
  > 
  > This makes it easier for authorities to focus their attention on areas with repeated or concentrated incidents.
  > 
  > The results can also support **preventive patrolling and security planning**.
  > 
  > So, the main output of Module 1 is not just the raw incident data, but a more useful representation of the data through statistics, geographical information, hotspots and risk levels.

---

### Slide 10 – Module 2: Mobile App & Authority Dashboard
- **Visual Design:** Dual-component showcase:
  - *Left:* Live Authority Dashboard preview (`safeher-admin-dashboard.png`).
  - *Right:* Three structured cards:
    - *Citizen Mobile App:* Rapid GPS intake, feeling safe/unsafe ambient tracking, anonymous submissions.
    - *Dynamic Security Monitoring:* Live API streaming, automated pipeline re-clustering, adaptive risk mapping.
    - *Authority Monitoring:* Multi-parameter filtering, daily alert generation, targeted patrol guidance.
- **What to say:**
  > Now I will explain Module 2.
  > 
  > Module 2 focuses on the **Women’s Safety and Dynamic Security Monitoring Mobile Application**.
  > 
  > The application allows users to report women-safety-related incidents.
  > 
  > While submitting a report, the user can provide information such as the **incident type, date, time, description and geographical location**.
  > 
  > The information is sent through the API to the backend and stored in the database.
  > 
  > The important feature is that new reports can continuously enter the system.
  > 
  > This is why the system supports **dynamic security monitoring**.
  > 
  > The new incident information can then be processed by Module 1.
  > 
  > The Authority Dashboard provides authorized personnel with a centralized view of the information.
  > 
  > Authorities can view **incident statistics, geographical information, hotspots and risk levels**.
  > 
  > They can also filter the information based on factors such as **region or city, incident type, date, time and risk level**.
  > 
  > The system can also generate **daily alerts** based on recent or recurring incidents to support preventive patrolling.

---

### Slide 11 – Screens (System Interfaces & UX)
- **Visual Design:** Three live user interface screens shown side-by-side:
  1. *Mobile Incident Report Screen* (`safeher-app-report.png`) — Category, safety feeling, description, GPS.
  2. *Citizen Community Safety Map* (`safeher-app-map.png`) — Safe/unsafe pins, verified transit routes.
  3. *Authority Dashboard & Filters* (`safeher-dashboard-filters.png`) — Heatmaps, KPI counters, multi-factor filtering suite, and patrol priority list.
- **What to say:**
  > This slide shows the main screens or interfaces of our proposed system.
  > 
  > The first part is the **mobile application**.
  > 
  > The user can access the application and submit an incident report by providing the required information and geographical location.
  > 
  > The second part is the **Authority Dashboard**.
  > 
  > The dashboard provides a centralized interface for authorized personnel.
  > 
  > It can display incident information using **maps, charts and statistics**.
  > 
  > The authority can apply filters to focus on a particular region, incident type, date, time or risk level.
  > 
  > The hotspot and risk information generated by Module 1 can also be visualized on the dashboard.
  > 
  > This makes the system easier to use because the authority does not have to manually analyse individual incident records.

---

### Slide 12 – Conclusion & Project Contributions
- **Visual Design:** Four balanced conclusion synthesis cards:
  1. *Unified Two-Module Platform* (Analytical intelligence + intuitive citizen/authority interfaces).
  2. *Actionable Preventive Value* (From post-incident FIRs to proactive patrol dispatch).
  3. *Bengaluru Validation & State Scalability* (Tested on real street data, architected to scale across Karnataka).
  4. *SDG 5 Target 5.2 Alignment* (Concrete technological contribution to eliminating violence against women).
- **What to say:**
  > To conclude, our project combines **women-safety incident reporting with data analysis and security monitoring**.
  > 
  > Module 1 focuses on analysing historical incidents, performing geospatial analysis, identifying hotspots and assigning risk levels.
  > 
  > Module 2 provides the **mobile application and Authority Dashboard** through which incidents can be reported and monitored.
  > 
  > The two modules are connected through the backend and APIs.
  > 
  > The main benefit of the system is that it converts incident data into useful information such as **hotspots, risk levels, geographical visualizations and alerts**.
  > 
  > This information can help authorities understand areas where incidents are repeatedly or heavily concentrated and support **preventive patrolling and safety planning**.
  > 
  > Our current available dataset is focused on **Bengaluru**, while the overall system architecture can be extended to other regions or cities when suitable data is available.
  > 
  > The project contributes to **SDG 5 – Gender Equality**, especially by supporting efforts to address violence and improve safety for women in public spaces.
  > 
  > Thank you.

---

### Slide 13 – Thank You & Viva Defense
- **Visual Design:** Full royal navy background (`#0C2340`) with gold accent borders (`#C4A35A`), prominent "Thank You" banner, complete team credentials (Anusha K - 1BY25MC017 & Aman Yadav - 1BY25MC012), Guide acknowledgment (Dr. M Sridevi), and formal closing text.
- **What to say:**
  > Thank you, ma’am.
  > 
  > I am ready to answer any questions.
