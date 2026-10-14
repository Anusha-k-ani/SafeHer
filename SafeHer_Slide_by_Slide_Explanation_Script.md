# SafeHer: 13-Slide Spoken Script & Presentation Explanation Guide
**Presenter:** Anusha K (USN: `1BY25MC017`) · **Module 1 Lead**  
**Module 2 Lead:** Aman Yadav (USN: `1BY25MC012`)  
**Project Guide:** Dr. M Sridevi, Professor, Department of MCA  
**Institution:** BMS Institute of Technology & Management, Bengaluru  
**Subject:** Project Work Phase I (MMCA34) · Academic Batch 2025–2027  

---

## Important Instructions for Anusha K
1. **Tone & Manner:** Speak calmly, clearly, and authoritatively. Do not rush.
2. **Strict Academic Distinction:** The slides contain zero conversational script. All spoken words are spoken by YOU while the panel looks at crisp, high-impact visuals.
3. **Zero-Overlap Slide Visuals:** All slides in `SafeHer_Phase1_Presentation.pptx` are calibrated with zero bounding-box overlaps.

---

## Slide-by-Slide Script & Defense Pointers

### Slide 1 – Title Slide
- **Target Spoken Duration:** 45 seconds
- **What is shown on Screen:** Royal Navy & Gold cover displaying BMSIT&M Dept. of MCA, SafeHer brand, Complete Project Vision, Module 1 (Anusha K), Module 2 (Aman Yadav), Guide Dr. M Sridevi, and SDG 5 Target 5.2 badge.
- **Verbatim Spoken Lines:**
  > Good morning, ma’am and respected evaluators.
  >   >
  >   > We are from the Department of MCA, BMS Institute of Technology and Management.
  >   >
  >   > Our complete project is titled SafeHer: an integrated data-driven platform for women’s safety in public spaces.
  >   >
  >   > SafeHer bridges the gap between crowdsourced citizen reporting and law enforcement decision-making. It combines a mobile application for incident reporting with backend geospatial analysis, hotspot identification, and risk assessment to provide authorities with proactive, preventive patrol intelligence rather than delayed reactions.
  >   >
  >   > Our project is guided by Dr. M Sridevi.
  >   >
  >   > It directly aligns with United Nations Sustainable Development Goal 5 – Gender Equality, specifically Target 5.2, which focuses on eliminating all forms of violence against women and girls in public spaces.
  >   >
  >   > To build this complete system effectively, our project is divided into two complementary, interconnected modules:
  >   >
  >   > Module 1 is my module: “Security provision through hotspot identification and risk assessment for women’s safety in public spaces.”
  > I am Anusha K, 1BY25MC017. My individual scope is the analytical core—handling data cleaning, spatial clustering on a 1 km grid, hotspot detection, multi-tier risk stratification, and analytical APIs.
  >   >
  >   > The second module is Module 2: “Women’s safety and dynamic security monitoring mobile application,” which is handled by Aman Yadav, 1BY25MC012. His scope covers citizen mobile incident reporting and the authority administrative dashboard.
  >   >
  >   > Both modules communicate seamlessly through REST APIs to deliver the unified SafeHer platform.
- **Physical Delivery & Gestures:** Stand tall, maintain confident eye contact. First present the complete SafeHer project vision, guide Dr. M Sridevi, and SDG 5. Then clearly introduce the division into two modules, pointing to your Module 1 card for individual accountability and acknowledging Aman Yadav's Module 2 card.
- **Viva Defense Answer:** If asked why the project is divided into two modules: 'A complete public safety system requires both an end-user data collection and monitoring interface (Module 2) and an algorithmic geospatial analysis engine (Module 1). Dividing it into two decoupled modules allows deep, rigorous individual work while ensuring seamless integration via REST APIs.'

---

### Slide 2 – Introduction & Project Context
- **Target Spoken Duration:** 50 seconds
- **What is shown on Screen:** Three distinct analytical cards: Existing Difficulty (fragmented registers), The SafeHer Solution (4 integrated pillars), and Impact & Authority Value (targeted preventive patrolling).
- **Verbatim Spoken Lines:**
  > The main objective of our project is to improve women’s safety in public spaces using a data-driven approach.
  >   >
  >   > In the existing system, incidents may be reported through different sources, but it can be difficult to identify where incidents are repeatedly occurring and which locations require more attention.
  >   >
  >   > Our project combines incident reporting, location-based analysis, hotspot identification and risk assessment.
  >   >
  >   > The mobile application allows users to report safety-related incidents by providing details such as the incident type, date, time, description and geographical location.
  >   >
  >   > The reported information is then processed and analysed.
  >   >
  >   > Module 1 focuses on analysing the incidents and identifying hotspots and risk levels, while Module 2 focuses on the mobile application and authority dashboard.
  >   >
  >   > The main purpose is to provide useful information for authorities so that they can take preventive actions such as better monitoring and patrolling in repeatedly affected areas.
- **Physical Delivery & Gestures:** Gesture to Card 1 to emphasize why traditional registers fail (lack of spatial concentration), move across to Card 2 to introduce the 4-pillar integration, and conclude by pointing to Card 3 for authority value.
- **Viva Defense Answer:** If asked how this helps duty officers: 'A duty officer cannot easily read through 500 paper FIRs to see which street corner is recurring. SafeHer groups reports spatially and visually highlights the exact street sectors requiring patrols.'

---

### Slide 3 – Literature Survey & Research Foundation
- **Target Spoken Duration:** 55 seconds
- **What is shown on Screen:** Four foundational pillars: Sherman (1989) Hotspot Theory, Chainey & Ratcliffe (2005) GIS Crime Mapping, Environmental Determinants (Nehme et al., 2017 & Safetipin Audits), and Research Gap.
- **Verbatim Spoken Lines:**
  > Now I will present the literature survey and theoretical foundation of our project.
  >   >
  >   > Our work is grounded on well-established research in GIS crime mapping and environmental criminology.
  >   >
  >   > First, research by Sherman in 1989 on hotspot theory proved that crime is not distributed evenly across a city, but concentrates heavily in specific micro-places. This justifies why hotspot identification is a scientifically valid planning tool.
  >   >
  >   > Second, Chainey and Ratcliffe in 2005 demonstrated that GIS-based hotspot detection allows law enforcement to allocate patrolling and civic resources efficiently. In SafeHer, we use a 1-kilometer spatial grid to evaluate spatial density and recurrence.
  >   >
  >   > Third, environmental studies, such as Nehme et al. in 2017 and Safetipin audit studies, show that physical infrastructure like street lighting, CCTV surveillance, and police proximity strongly influence women’s perceived and actual safety.
  >   >
  >   > Finally, the research gap we address is that existing mobile applications are mostly reactive SOS panic buttons, while official police records are delayed and coarse. SafeHer bridges this gap by providing a proactive, rule-based, street-level geospatial hotspot and risk assessment platform using crowdsourced community data.
- **Physical Delivery & Gestures:** Walk through the four quadrants: explain the criminological foundation (Sherman), spatial GIS methodology (Chainey & Ratcliffe), environmental factors (Nehme & Safetipin), and conclude strongly with the gap SafeHer closes.
- **Viva Defense Answer:** If asked why established literature matters: 'It proves our methodology is scientifically backed: crime concentrates in micro-places, GIS grids optimize patrol distribution, and environmental indicators reflect true citizen safety perceptions.'

---

### Slide 4 – Datasets and Resources
- **Target Spoken Duration:** 60 seconds
- **What is shown on Screen:** Data architecture showing Source A (Mobile Crowdsourced Incident Data), Source B (Bengaluru Street Safety Dataset - Excel), and OpenStreetMap Infrastructure Features (lighting, CCTV, police proximity).
- **Verbatim Spoken Lines:**
  > For our project, we use different types of data and resources.
  >   >
  >   > The first important source is the incident data. This contains information related to reported incidents, including their location, date, time and type.
  >   >
  >   > We also use geographical and public infrastructure information.
  >   >
  >   > For geographical information, we use OpenStreetMap and related geographical resources.
  >   >
  >   > The available Excel dataset is currently focused on Bengaluru.
  >   >
  >   > The dataset contains information related to roads, streets and buildings, along with prototype or assumed infrastructure attributes such as lighting and surveillance.
  >   >
  >   > These infrastructure attributes are used for the project analysis and demonstration.
  >   >
  >   > In addition to the existing dataset, new incident information can come from the mobile application.
  >   >
  >   > This allows the system to combine existing data with newly reported incidents.
- **Physical Delivery & Gestures:** Point to the left box for incident attributes, then point to the right box explaining OpenStreetMap street geometries and Bengaluru physical infrastructure attributes.
- **Viva Defense Answer:** If asked why Bengaluru is used: 'The Bengaluru dataset ('bengaluru_street_safety_REAL.xlsx') provides our initial empirical baseline to validate spatial clustering. However, the data pipeline is fully generalized and ready to ingest additional Karnataka districts.'

---

### Slide 5 – Complete System Data Flow
- **Target Spoken Duration:** 60 seconds
- **What is shown on Screen:** Full-width, high-resolution end-to-end data pipeline diagram tracing records from citizen mobile capture -> FastAPI -> Database -> Module 1 Analytics -> Authority Dashboard.
- **Verbatim Spoken Lines:**
  > This slide shows the complete data flow of our project.
  >   >
  >   > First, we have the existing data and the new incident data collected through the mobile application.
  >   >
  >   > The incident information is sent through an API to the backend.
  >   >
  >   > The backend stores the information in the database.
  >   >
  >   > After that, Module 1 performs data preprocessing and incident analysis.
  >   >
  >   > The data is analysed based on factors such as incident type, date, time, location, frequency and recurrence.
  >   >
  >   > Then we perform geospatial analysis to understand where incidents are concentrated.
  >   >
  >   > Based on this analysis, we identify hotspots and assign different risk levels such as Low, Medium and High.
  >   >
  >   > The analytical results are then provided through APIs to the Authority Dashboard.
  >   >
  >   > The dashboard allows authorities to view the information using maps, charts and filters.
  >   >
  >   > The system can also support alerts and preventive patrolling based on repeated or concentrated historical incidents.
- **Physical Delivery & Gestures:** Trace your finger or laser pointer across the top flow: from Mobile Input on the left through Backend and Database to Module 1 Analytics and finally the Authority Dashboard.
- **Viva Defense Answer:** If asked how data gets from Module 2 to Module 1: 'The mobile app posts incident JSON payloads to FastAPI endpoints, which persist them in MongoDB. Module 1 runs analytical clustering pipelines over the database and serves computed hotspots to the dashboard via REST APIs.'

---

### Slide 6 – Architecture & Technology Stack
- **Target Spoken Duration:** 50 seconds
- **What is shown on Screen:** Full-system layered architecture diagram on the left paired with 6 categorized technology specifications on the right: Mobile Client, Backend, Database, Analytics, Mapping, Dashboard.
- **Verbatim Spoken Lines:**
  > This slide shows the architecture and technologies used in our project.
  >   >
  >   > For the mobile application, we can use a cross-platform framework such as Flutter or React Native.
  >   >
  >   > For the backend, we use Python and FastAPI.
  >   >
  >   > The database layer uses MongoDB for storing incident information.
  >   >
  >   > For data processing and analysis, we use libraries such as Pandas, NumPy and GeoPandas.
  >   >
  >   > For geographical visualization, we use OpenStreetMap along with Leaflet or Folium.
  >   >
  >   > For charts and analysis visualizations, we use Matplotlib or Plotly.
  >   >
  >   > The authority dashboard can be developed using technologies such as HTML, CSS, JavaScript and React.
  >   >
  >   > The communication between different components is handled using REST APIs and JSON.
  >   >
  >   > We can use tools such as Postman for API testing, and development tools such as VS Code and Android Studio.
- **Physical Delivery & Gestures:** Point to the architecture diagram on the left to show separation of concerns, then glance across the right stack cards to confirm open-source technologies used.
- **Viva Defense Answer:** If asked why FastAPI was chosen over Flask: 'FastAPI has built-in asynchronous request handling, automatic OpenAPI Swagger documentation generation, and high data validation performance via Pydantic.'

---

### Slide 7 – Project Modularization & Scope Division
- **Target Spoken Duration:** 60 seconds
- **What is shown on Screen:** Clear two-module workflow diagram detailing Module 1 (Anusha K - Hotspot Identification & Risk Assessment) and Module 2 (Aman Yadav - Mobile App & Dynamic Security Dashboard).
- **Verbatim Spoken Lines:**
  > Our project is divided into two major modules, but both modules work together as a single system.
  >   >
  >   > Module 1 is my module.
  >   >
  >   > It focuses on incident analysis, geospatial analysis, hotspot identification and risk-level assessment.
  >   >
  >   > My module takes the available incident and geographical data, processes it, identifies areas where incidents are concentrated or repeatedly reported, and produces the analytical results.
  >   >
  >   > Module 2 is handled by Aman.
  >   >
  >   > It focuses on the women’s safety mobile application and the authority dashboard.
  >   >
  >   > The mobile application allows users to submit incident reports.
  >   >
  >   > The authority dashboard allows authorized personnel to monitor the reported incidents, view maps and charts, apply filters and see hotspot and risk information.
  >   >
  >   > So, Module 1 provides the analytical results, while Module 2 provides the reporting and monitoring interface.
- **Physical Delivery & Gestures:** Emphasize personal accountability. Point clearly to Module 1 as YOUR individual scope, and Module 2 as Aman's individual scope, explaining how REST APIs unite both.
- **Viva Defense Answer:** If asked about collaborative boundary: 'Module 1 owns all analytical algorithms, spatial processing, risk categorization, and data exports. Module 2 owns client presentation, citizen reporting form intake, and admin dashboard rendering.'

---

### Slide 8 – Module 1 Methodology: Hotspot & Risk Assessment
- **Target Spoken Duration:** 75 seconds
- **What is shown on Screen:** Hero workflow diagram showing the eight-stage analytical pipeline: Data Integration -> Pre-processing -> Incident Analysis -> Geospatial Binning -> Hotspot Detection -> Risk Stratification -> Alert Generation -> Serving Layer.
- **Verbatim Spoken Lines:**
  > Now I will explain my module in more detail through its eight-stage analytical pipeline.
  >   >
  >   > The first step is data integration, where we combine geographical context with incident reports received from the mobile application.
  >   >
  >   > Second is data preprocessing, handling missing values, deduplication, and validating GPS coordinates within Karnataka.
  >   >
  >   > Third is incident analysis, categorizing event types, temporal patterns across time of day and week, and recurrence.
  >   >
  >   > Fourth is geospatial binning, mapping citizen reports onto a uniform 1-kilometer spatial grid.
  >   >
  >   > From Step 4, the workflow flows directly into Step 5: hotspot detection, flagging areas with 3 or more incidents across distinct dates.
  >   >
  >   > Sixth is risk stratification, assigning Low, Medium, or High risk tiers using rule-based criteria fusing incident density with infrastructure vulnerabilities.
  >   >
  >   > Seventh is alert generation, ranking high-risk areas to produce a prioritized preventive patrol list for law enforcement.
  >   >
  >   > Finally, eighth is the serving layer, publishing GeoJSON and REST APIs so that analytical results seamlessly feed the Authority Dashboard.
- **Physical Delivery & Gestures:** Deliver this slide with maximum confidence—this is the core of your academic project. Walk through the 8 stages in exact sequence, highlighting how Step 4 (Binning) connects seamlessly into Step 5 (Hotspots).
- **Viva Defense Answer:** If asked about risk level rules: 'Hotspots are bounded using a 0.01-degree (~1 km) grid. A cell with 3 or more incidents is flagged as a hotspot. High Risk corresponds to >=8 incidents or high harassment ratios; Medium Risk is 4 to 7 incidents; Low Risk is 3 incidents.'

---

### Slide 9 – Module 1 Sample Analytical Results
- **Target Spoken Duration:** 60 seconds
- **What is shown on Screen:** Real visual map output showing Bengaluru spatial hotspot clusters (Red/Amber/Green pins) alongside quantitative metric cards (72 Hotspots, 30 High, 19 Med, 23 Low, 55 Alerts).
- **Verbatim Spoken Lines:**
  > This slide shows the type of output produced by Module 1.
  >   >
  >   > The purpose of this output is to make the incident analysis easier to understand visually.
  >   >
  >   > Instead of looking at individual incident records, authorities can see where incidents are concentrated.
  >   >
  >   > The hotspot information can be represented on a map, along with the corresponding risk level.
  >   >
  >   > The system can categorize identified areas into Low, Medium and High risk levels.
  >   >
  >   > This makes it easier for authorities to focus their attention on areas with repeated or concentrated incidents.
  >   >
  >   > The results can also support preventive patrolling and security planning.
  >   >
  >   > So, the main output of Module 1 is not just the raw incident data, but a more useful representation of the data through statistics, geographical information, hotspots and risk levels.
- **Physical Delivery & Gestures:** Point to the map preview on the left showing visual hotspots, then point to the quantitative metrics on the right: 72 hotspots identified and 55 patrol alerts generated.
- **Viva Defense Answer:** If asked whether these are real FIRs: 'These results represent our empirical validation run of 1,079 community and benchmark reports, demonstrating that our spatial clustering pipeline functions correctly.'

---

### Slide 10 – Module 2: Mobile Application & Authority Dashboard
- **Target Spoken Duration:** 60 seconds
- **What is shown on Screen:** Authority dashboard preview screenshot on the left paired with 3 functional pillars: Citizen Mobile Intake, Dynamic Security Monitoring, and Authority Monitoring with Daily Alerts.
- **Verbatim Spoken Lines:**
  > Now I will explain Module 2.
  >   >
  >   > Module 2 focuses on the Women’s Safety and Dynamic Security Monitoring Mobile Application.
  >   >
  >   > The application allows users to report women-safety-related incidents.
  >   >
  >   > While submitting a report, the user can provide information such as the incident type, date, time, description and geographical location.
  >   >
  >   > The information is sent through the API to the backend and stored in the database.
  >   >
  >   > The important feature is that new reports can continuously enter the system.
  >   >
  >   > This is why the system supports dynamic security monitoring.
  >   >
  >   > The new incident information can then be processed by Module 1.
  >   >
  >   > The Authority Dashboard provides authorized personnel with a centralized view of the information.
  >   >
  >   > Authorities can view incident statistics, geographical information, hotspots and risk levels.
  >   >
  >   > They can also filter the information based on factors such as region or city, incident type, date, time and risk level.
  >   >
  >   > The system can also generate daily alerts based on recent or recurring incidents to support preventive patrolling.
- **Physical Delivery & Gestures:** Highlight the dashboard interface on the left, then gesture to the dynamic monitoring card on the right to explain why continuous mobile ingestion prevents the map from becoming stale.
- **Viva Defense Answer:** If asked about user confidentiality: 'The mobile app is anonymous-by-design. Users do not need to register names or phone numbers to report incidents, ensuring privacy while fostering community participation.'

---

### Slide 11 – SafeHer System Interfaces & UX
- **Target Spoken Duration:** 60 seconds
- **What is shown on Screen:** Three live system interfaces: Mobile Incident Reporting Screen (left), Citizen Community Safety Map (center), and Authority Command Dashboard with Multi-Factor Filters (right).
- **Verbatim Spoken Lines:**
  > This slide shows the main screens or interfaces of our proposed system.
  >   >
  >   > The first part is the mobile application.
  >   >
  >   > The user can access the application and submit an incident report by providing the required information and geographical location.
  >   >
  >   > The second part is the Authority Dashboard.
  >   >
  >   > The dashboard provides a centralized interface for authorized personnel.
  >   >
  >   > It can display incident information using maps, charts and statistics.
  >   >
  >   > The authority can apply filters to focus on a particular region, incident type, date, time or risk level.
  >   >
  >   > The hotspot and risk information generated by Module 1 can also be visualized on the dashboard.
  >   >
  >   > This makes the system easier to use because the authority does not have to manually analyse individual incident records.
- **Physical Delivery & Gestures:** Point to Screen 1 for incident submission, Screen 2 for community citizen safety awareness, and Screen 3 for the administrative command dashboard used by law enforcement.
- **Viva Defense Answer:** If asked who can access the dashboard: 'The Authority Dashboard is protected by role-based authentication and is strictly accessible to verified law enforcement and municipal personnel.'

---

### Slide 12 – Conclusion & Project Contributions
- **Target Spoken Duration:** 60 seconds
- **What is shown on Screen:** Four synthesis cards: Unified Platform, Actionable Preventive Patrolling, Bengaluru Validation & Scalability, and SDG 5 Target 5.2 Alignment.
- **Verbatim Spoken Lines:**
  > To conclude, our project combines women-safety incident reporting with data analysis and security monitoring.
  >   >
  >   > Module 1 focuses on analysing historical incidents, performing geospatial analysis, identifying hotspots and assigning risk levels.
  >   >
  >   > Module 2 provides the mobile application and Authority Dashboard through which incidents can be reported and monitored.
  >   >
  >   > The two modules are connected through the backend and APIs.
  >   >
  >   > The main benefit of the system is that it converts incident data into useful information such as hotspots, risk levels, geographical visualizations and alerts.
  >   >
  >   > This information can help authorities understand areas where incidents are repeatedly or heavily concentrated and support preventive patrolling and safety planning.
  >   >
  >   > Our current available dataset is focused on Bengaluru, while the overall system architecture can be extended to other regions or cities when suitable data is available.
  >   >
  >   > The project contributes to SDG 5 – Gender Equality, especially by supporting efforts to address violence and improve safety for women in public spaces.
  >   >
  >   > Thank you.
- **Physical Delivery & Gestures:** Summarize the 4 core achievements by pointing to each card: Integration, Prevention, Scalability across Karnataka, and SDG 5.2 social impact.
- **Viva Defense Answer:** If asked about Phase II plans: 'In Phase II, we plan to conduct user testing with law enforcement representatives and integrate real-time push alerts for field patrol officers.'

---

### Slide 13 – Thank You & Viva Defense
- **Target Spoken Duration:** 15 seconds
- **What is shown on Screen:** Royal Navy & Gold closing slide with 'Thank You', 'We are ready to answer your questions', full project credentials, Guide Dr. M Sridevi, Anusha K (1BY25MC017), and Aman Yadav (1BY25MC012).
- **Verbatim Spoken Lines:**
  > Thank you, ma’am.
  >   >
  >   > I am ready to answer any questions.
- **Physical Delivery & Gestures:** Smile, maintain steady eye contact with Dr. M Sridevi and the examination panel, and pause calmly to invite their questions.
- **Viva Defense Answer:** Remain confident, listen carefully to each question without interrupting, and refer back to your specific slides as needed.

---
