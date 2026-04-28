Launch Game — Facilitator Dashboard
The facilitator-side application for the Launch Game serious game platform.
This app runs on the facilitator's desktop during a live game session. It provides real-time oversight of all student teams, controls round progression, manages expert contract verification, and generates end-game scoring reports.

This repository is the facilitator app. The student-facing game app lives in launch-game.


What It Does
During a live session with up to 80 students across multiple teams, the facilitator needs to monitor everything at once. This dashboard provides:

Live team overview — Real-time view of all teams' cash, hours, TRL/progress, equity, and activity status
Round control — Advance rounds, trigger phase gates, and broadcast game events to all teams simultaneously
Contract verification — Confirm physical contracts submitted by student teams before digital progress is unlocked
Scoring — End-game score breakdown per team across all scoring categories, with PDF export
Game setup — Create and configure game sessions, set edition (Research or Startup), manage team registration


Relationship to the Student App
The two apps share the same Firebase Firestore backend. Changes made in the facilitator dashboard (advancing a round, verifying a contract, triggering an event) appear in real time on all student devices without a page refresh.
The facilitator app is the source of authority — it controls what teams can and cannot do at any given moment in the game.

Architecture
LayerTechnologyFrontendReact 19 (SPA)BackendFirebase Firestore (real-time sync, shared with student app)HostingNetlifyScoringCentralised scoring engine, config-driven per edition

Game Editions Supported
The facilitator dashboard supports both game editions from a single interface:

Research Edition — University research-to-spinoff simulation
Startup Edition — Customer Development-based startup simulation (Steve Blank methodology)

Edition selection happens at game creation. All round logic, scoring weights, and phase gate conditions are pulled from the corresponding config file.
