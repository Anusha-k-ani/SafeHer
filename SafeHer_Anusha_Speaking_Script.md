# SafeHer — Complete Viva Presentation Script for Anusha K

**Title:** SafeHer – Dynamic Security Monitoring and Women’s Safety System  
**Presenter:** Anusha K (USN: 1BY25MC017) — Module 1 Lead  
**Co-Presenter:** Aman Yadav (USN: 1BY25MC012) — Module 2 Lead  
**Guide:** Dr. M Sridevi  
**Institution:** Department of Master of Computer Applications, BMS Institute of Technology and Management  

---

## 1. Introduction

“Good morning sir/ma’am.

Our project is titled **SafeHer – Dynamic Security Monitoring and Women’s Safety System**.

The main objective of our project is to develop a data-driven system that can help in understanding and monitoring women’s safety in public spaces.

Our system focuses on collecting safety-related incident information, analyzing where incidents are occurring and recurring, identifying hotspots, assessing the risk levels of those areas, and providing useful information for preventive action.

Our project is divided into **two modules**.

**Module 1** focuses mainly on the **data analysis, hotspot identification and risk assessment** part of the system.

**Module 2** focuses on the **women’s safety mobile application and dynamic security monitoring**, including the authority monitoring side.

I will first give an overall overview of our complete project and then I will explain **Module 1 in detail**.

After that, **Aman will continue with Module 2 and explain the mobile application and monitoring part of the project.**”

---

## 2. Project Background / Problem

“Before explaining the modules, I’ll briefly explain the problem that we are trying to address.

Women’s safety-related information can come from different sources such as police records, helplines, FIRs and citizen reports.

But having these records alone does not always give a clear understanding of **where incidents are concentrated or whether incidents are repeatedly occurring in a particular area**.

For example, if incidents are reported at different times around the same area, it may not be immediately visible from individual records that the location requires more attention.

Also, preventive patrolling can be more useful when it is supported by information about recurring incidents and high-risk locations.

So our project aims to organize and analyze this information and provide location-based insights that can support preventive security measures.”

---

## 3. Our Proposed Solution — SafeHer

“To address this, we propose **SafeHer**.

SafeHer is an integrated system that combines incident reporting, data analysis, hotspot identification, risk assessment and security monitoring.

The system has two connected modules.

The first module is the **analytical module**, where we process incident data and identify hotspots and risk levels.

The second module is the **application and monitoring module**, where citizens can report incidents through a mobile application and authorities can monitor the information through a dashboard.

So these two modules work together.

The analytical module provides the intelligence, and the application and monitoring module provides the interaction and monitoring.”

---

## 4. Overall Project Flow

“Now I’ll briefly explain the overall flow of the complete project.

We have existing incident data as our initial data source.

The system also allows new safety-related reports to come from citizens through the mobile application.

These reports are sent to the backend through APIs and stored in the database.

The data is then processed and analyzed by Module 1.

Module 1 performs incident analysis, geographical analysis, hotspot identification and risk assessment.

The resulting hotspots, risk levels and alerts are then made available through APIs.

These results can be consumed by the authority monitoring dashboard.

At the same time, when new reports come from the mobile application, they can be incorporated into the analysis so that the safety information can be refreshed.

So, in a simple way, our complete flow is:

**Citizen / Existing Data → Backend → Database → Data Analysis → Hotspots and Risk Assessment → APIs → Authority Monitoring.**”

---

## 5. Project Components

“The main components of our project are:

First, **Mobile Incident Reporting**, where citizens can report incidents or unsafe perceptions.

Second, **Location-Based Analysis**, where we analyze the geographical distribution of the incidents.

Third, **Hotspot Identification**, where we identify areas having recurring incidents.

Fourth, **Risk Assessment**, where the identified areas are classified into different risk levels.

And finally, the **Authority Monitoring and Alert System**, where the analyzed information can be viewed and used for preventive action.”

---

## 6. Now Moving to Module 1

“Now I’ll explain **Module 1 in detail**.

The title of our Module 1 is:

**Security Provision through Hotspot Identification and Risk Assessment for Women’s Safety in Public Spaces.**

The main focus of this module is to take the available incident data and convert it into useful analytical information.

Basically, we want to identify:

**where incidents are happening, whether they are recurring in particular areas, which areas can be considered hotspots, and what level of risk those hotspots have.**

The module also generates alerts that can help in prioritizing areas for preventive patrolling.”

---

## 7. Data Used in Module 1

“For Module 1, we work with incident-related and geographical data.

The incident data contains information such as:

- incident category,
- date,
- time,
- description,
- and GPS location.

We also have geographical information such as roads, streets, intersections and public transport-related locations.

Our prototype geographical dataset also includes safety-related attributes such as lighting condition, surveillance presence and police proximity.

These attributes help us demonstrate how geographical and safety-related information can be considered during the analysis.”

---

## 8. Module 1 Pipeline

“To perform this analysis, we have divided Module 1 into **eight stages**.

They are:

1. Data Integration  
2. Data Preprocessing  
3. Incident Analysis  
4. Geospatial Binning and Analysis  
5. Hotspot Detection  
6. Risk Stratification  
7. Alert Generation  
8. Serving the Results through APIs

I’ll explain each of these stages.”

---

## 9. Stage 1 — Data Integration

“The first stage is **Data Integration**.

Here, we bring together the different data required for our analysis.

The main incident information includes the incident type, date, time, description and location.

We also combine this with the available geographical information.

Later, when the mobile application is implemented, new citizen reports will also become part of this data flow.

So the purpose of this stage is to bring the required information together so that it can be processed consistently.”

---

## 10. Stage 2 — Data Preprocessing

“The second stage is **Data Preprocessing**.

The raw data may contain missing values, inconsistent formats or other issues.

So before performing analysis, we clean and standardize the data.

For example, we check the incident information, dates, locations and categories.

We also make sure that the geographical coordinates are in a usable format.

After preprocessing, we have a cleaner and more consistent dataset for analysis.”

---

## 11. Stage 3 — Incident Analysis

“The third stage is **Incident Analysis**.

Here, we analyze the incidents based on their different attributes.

For example, we can analyze:

- what type of incidents are being reported,
- when they are occurring,
- where they are occurring,
- and how frequently they are occurring.

An important part is looking at recurrence.

We want to know whether incidents are repeatedly occurring around the same geographical area.”

---

## 12. Stage 4 — Geospatial Binning

“The fourth stage is **Geospatial Binning and Analysis**.

For our current approach, we use approximately a **1-kilometre spatial grid**.

The purpose of this grid is to divide the geographical area into smaller cells.

Each incident can then be associated with the corresponding geographical cell.

This allows us to analyze the concentration of incidents within different areas instead of looking at every incident independently.”

---

## 13. Stage 5 — Hotspot Detection

“The fifth stage is **Hotspot Detection**, which is one of the main parts of our module.

Our current rule is that an area is considered a hotspot when there are **three or more incidents across distinct dates**.

So we are not simply counting how many records are present.

We are also considering whether incidents are recurring across different dates.

For example, if incidents are reported in the same spatial cell on three different dates, that area can be identified as a hotspot.

This helps us identify areas where safety concerns are recurring.”

---

## 14. Stage 6 — Risk Stratification

“After identifying the hotspots, the next stage is **Risk Stratification**.

Here, we classify the identified hotspots into three risk levels:

**Low, Medium and High.**

This helps us prioritize the areas.

For example, a high-risk hotspot would receive more attention compared to a low-risk hotspot.

So instead of only showing that an area is a hotspot, our system also gives an indication of its risk level.”

---

## 15. Stage 7 — Alert Generation

“The seventh stage is **Alert Generation**.

Once the hotspots have been identified and their risk levels have been assigned, we generate actionable alerts.

The main purpose of these alerts is to highlight areas that may require attention.

For example, high-risk areas can be prioritized for preventive patrolling.

The system can therefore generate a daily list of areas that require attention based on the analysis.”

---

## 16. Stage 8 — Serving Results through APIs

“The final stage of Module 1 is **Serving the Results**.

The analytical results need to be made available to the rest of the system.

For this, we provide the results through **REST APIs and GeoJSON**.

These results can contain information about incidents, hotspots, risk levels and alerts.

The Authority Dashboard can then use these APIs to display the information through maps, statistics and filters.

So this stage connects the analytical output of Module 1 with the monitoring part of the overall project.”

---

## 17. Module 1 Results

“To validate our current analytical pipeline, we have a sample validation run.

We had **1,079 community reports**, out of which **534 were verified incident records**.

These included **247 harassment records and 287 unsafe perception records**.

Using our approximately 1-kilometre spatial analysis, we identified **72 hotspot cells**.

From these, we generated **55 actionable patrol alerts**.

The hotspot risk distribution was:

- 30 high-risk hotspots
- 19 medium-risk hotspots
- 23 low-risk hotspots.

These results demonstrate how the raw incident information can be converted into hotspots, risk levels and actionable patrol information.”

---

## 18. Closing Module 1

“So, that completes my part of the project.

To summarize my module:

We start with the incident and geographical data.

We integrate and preprocess the data.

Then we analyze the incidents and map them into approximately 1-kilometre spatial grids.

Based on recurring incidents across different dates, we identify hotspots.

Then we classify those hotspots into low, medium and high risk.

After that, we generate alerts for areas that may require attention and expose these results through APIs.

So Module 1 basically converts **raw safety-related data into actionable hotspot and risk information**.

This analytical output then becomes an important input for the second part of our project.

Now, **Aman will continue with Module 2**, where he will explain the **Women’s Safety and Dynamic Security Monitoring Mobile Application**, along with the citizen reporting and authority monitoring aspects of the system.”
