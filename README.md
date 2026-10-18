# RoadWatch BulSU • Pothole Reporting and Road Monitoring Web Application

> **Bulacan State University (BulSU)**  
> **College of Information and Communications Technology (CICT)**  
> **Course:** IT 305 – Advanced Web Development  
> **Program & Section:** BSIT-WMAD (BSIT 3H / 3I / 3J)  
> **Project Output:** Final Student Output Web System  

---

## 1. Project Overview & Interface Separation

**RoadWatch BulSU** is a modern, responsive web application designed for municipal road monitoring and citizen pothole reporting in Malolos City and the surrounding Bulacan province.

The system features **two strictly separated interfaces**:

### 1. Citizen Interface (Public Access)
- **Zero Authentication Required:** Citizens can access the site, report potholes, view public maps, and track submissions without registration or sign-in.
- **Citizen Navigation:**
  - **Home:** Overview of road monitoring and live statistics.
  - **Report a Pothole:** Upload road photographs, preview, select coordinates on the map or GPS, and submit.
  - **Pothole Map:** Confirmed public map displaying **only administrator-approved** potholes with photo popups and detail panels.
  - **My Reports:** Session history of submitted reports and verification statuses.
  - **Administrator Sign In:** Discrete link leading to the staff gateway.
- **No Management Leakage:** Citizen views do not show administrative controls, review queues, or verification tools.

### 2. Administrator Interface (Sign-In Required)
- **Dedicated Gateway:** Staff sign-in page at `/pages/admin-login.html` and `#admin-login`.
- **Session Authentication:** Temporary demo credentials checked via `sessionStorage` (`roadwatch_admin_auth`).
- **Demonstration Credentials:**
  - **Username:** `admin`
  - **Password:** `bulsu2026`
- **Route Guard Protection:** Unauthenticated attempts to access `#admin-dashboard`, `#admin-reviews`, `#admin-approved`, or `#admin-history` are automatically intercepted and redirected to the login page.
- **Administrator Navigation:**
  - **Dashboard:** Real-time metrics (Total, Awaiting Review, Approved, Rejected) and recent submissions.
  - **Report Review Queue:** Verification queue with filterable status tabs, high-resolution photo inspection, mini-map geolocation, and Approve/Reject workflows.
  - **Approved Potholes:** Live catalog of confirmed hazards published on the public map.
  - **Report History:** Complete audit archive of past decisions and inspector notes.
  - **Sign Out:** One-click session clearance returning to the public citizen homepage.

---

## 2. Official Brand Sheet — Exact Color Palette

The interface strictly implements the official brand sheet palette defined in `css/variables.css`:

### Primary Colors
| Color Name | HEX Code | Intended Use |
|---|---|---|
| **Cosmic Purple** | `#6D28D9` | Primary color for light themes |
| **Luminous Lavender** | `#A78BFA` | Primary color for dark themes |

### Secondary Colors
| Color Name | HEX Code | Intended Use |
|---|---|---|
| **Deep Nebula Blue** | `#075985` | Secondary color for light themes |
| **Electric Cyan** | `#00F2FE` | Secondary color for dark themes |

### Neutral Colors
| Color Name | HEX Code | Intended Use |
|---|---|---|
| **Starlight Ice** | `#EBF3FC` | Light background |
| **Sky Mist** | `#E0F2FE` | Alternative light background |
| **Lavender Mist** | `#F3EEFF` | Alternative light background |
| **White** | `#FFFFFF` | Surface & light text where appropriate |
| **Deep Space Black** | `#050B16` | Dark text and dark background |
| **Royal Indigo** | `#0A1432` | Dark background |
| **Luminous Indigo** | `#13224E` | Dark surface |
| **Night Surface** | `#0E1726` | Dark surface |

---

## 3. Official Status Badge System

Status badge colors adhere to the official brand sheet specifications across light and dark modes:

| Status Name | Mode | Text Color | Background Color |
|---|---|---|---|
| **Submitted** | Light Mode | `#F8FAFC` | `#334155` |
| **Submitted** | Dark Mode | `#050B16` | `#E2E8F0` |
| **Under Review / Pending** | Light Mode | `#FEF3C7` | `#78350F` |
| **Under Review / Pending** | Dark Mode | `#78350F` | `#FEF3C7` |
| **In Progress / Approved** | Light Mode | `#F0F9FF` | `#075985` |
| **In Progress / Approved** | Dark Mode | `#075985` | `#E0F2FE` |
| **Resolved** | Light Mode | `#ECFDF5` | `#064E3B` |
| **Resolved** | Dark Mode | `#064E3B` | `#D1FAE5` |

---

## 4. Interactive Six-Theme Multi-Theme System

The application incorporates six distinct visual themes with an interactive Theme Selection UI inspired by the design reference:

1. **Brand Sheet Daylight** (`brand-daylight`) — *Default for new users* (Light Mode):
   - Background: Starlight Ice (`#EBF3FC`), Surface: White (`#FFFFFF`), Primary: Cosmic Purple (`#6D28D9`), Secondary: Deep Nebula Blue (`#075985`), Text: Deep Space Black (`#050B16`).
2. **Space Corporate Aurora** (`corporate-aurora`) (Dark Mode):
   - Background: Royal Indigo (`#0A1432`), Surface: Luminous Indigo (`#13224E`), Primary: Luminous Lavender (`#A78BFA`), Secondary: Electric Cyan (`#00F2FE`), Text: Starlight Ice (`#EBF3FC`).
3. **Nebula Sky Light** (`nebula-sky`) (Light Mode):
   - Background: Sky Mist (`#E0F2FE`), Surface: White (`#FFFFFF`), Primary: Deep Nebula Blue (`#075985`), Secondary: Cosmic Purple (`#6D28D9`), Text: Deep Space Black (`#050B16`).
4. **Cosmic Purple Studio** (`cosmic-studio`) (Light Mode):
   - Background: Lavender Mist (`#F3EEFF`), Surface: White (`#FFFFFF`), Primary: Cosmic Purple (`#6D28D9`), Secondary: Deep Nebula Blue (`#075985`), Text: Deep Space Black (`#050B16`).
5. **Deep Space Night** (`deep-space`) (Dark Mode):
   - Background: Deep Space Black (`#050B16`), Surface: Night Surface (`#0E1726`), Primary: Luminous Lavender (`#A78BFA`), Secondary: Electric Cyan (`#00F2FE`), Text: Starlight Ice (`#EBF3FC`).
6. **Nebula Midnight** (`nebula-midnight`) (Dark Mode):
   - Background: Royal Indigo (`#0A1432`), Surface: Night Surface (`#0E1726`), Primary: Electric Cyan (`#00F2FE`), Secondary: Luminous Lavender (`#A78BFA`), Text: Starlight Ice (`#EBF3FC`).

### Key Theme Architecture Features
- **Zero-Flicker Synchronous Loading:** An inline `<script>` runs in `<head>` before body render, preventing light/dark flashes.
- **LocalStorage Persistence:** Selection is saved under `roadwatch_theme`, defaulting to `brand-daylight`.
- **Dynamic Map Tile Synchronization:** Automatically toggles CartoDB Positron (`light_all`) for light themes and CartoDB Dark Matter (`dark_all`) for dark themes without reloading the page.
- **Theme Selection UI:** Available at `#themes`, via the Topbar quick button (`🎨 Themes`), and in both Citizen and Administrator sidebars. Features custom dark navy container (`#0A1432`), 5 rectangular swatches per theme, active badges, and radio selection indicators.

---

## 5. Project Structure

```text
D:\Adv Web/
├── index.html                  # Main Application Shell (SPA View Router & Access Guard)
├── README.md                   # System Documentation & Role Separation Guide
├── pages/
│   ├── admin-login.html        # Dedicated Administrator Sign-In Page
│   ├── admin-dashboard.html    # Protected Administrator Dashboard Entry
│   ├── admin-reviews.html      # Protected Report Review Queue Entry
│   ├── report-details.html     # Protected Detailed Photo Inspection Entry
│   ├── report-pothole.html     # Public Citizen Report Submission Entry
│   ├── pothole-map.html        # Public Confirmed Pothole Map Entry
│   ├── my-reports.html         # Public Citizen Report History Entry
│   └── theme-settings.html     # Multi-Theme Selection Entry Point
├── css/
│   ├── variables.css           # Centralized Brand Constants & Scoped Theme Variables
│   ├── themes.css              # Dedicated Theme Selection UI Component Styles
│   ├── style.css               # Core design system, cards, login cards, buttons, modals, toasts
│   ├── layout.css              # Persistent sidebar, topbar, status chips, grid containers
│   ├── map.css                 # Interactive map layout, custom pins, info windows, side drawer
│   ├── responsive.css          # Breakpoints for desktop, tablet, and mobile browsers
│   └── leaflet.css             # Local stylesheet for interactive map fallback engine
├── js/
│   ├── dummy-data.js           # Realistic BulSU / Malolos seed reports with SVG photo assets
│   ├── state.js                # In-memory reactive state manager (No permanent storage)
│   ├── reports.js              # Reports utility query module
│   ├── themes.js               # Centralized 6-Theme Registry & Reactive ThemeManager
│   ├── google-map.js           # Google Maps JS API loader & interactive dark fallback engine
│   ├── report-form.js          # File input, drag-and-drop preview, GPS picker, validation
│   ├── admin-review.js         # Inspection modal, approval/rejection workflows, approved/history renderers
│   ├── main.js                 # Global view router, AuthService, route guard, toasts
│   └── leaflet.js              # Local library for interactive dark map fallback engine
└── assets/
    ├── icons/
    │   ├── logo.svg            # Custom Space-themed RoadWatch crest
    │   ├── marker-approved.svg # Electric Cyan verified pothole pin
    │   └── marker-pending.svg  # Amber review pin
    └── images/
        ├── pothole-bulsu-mcarthur.svg   # MacArthur Hwy sample crater (Km 44 Southbound)
        ├── pothole-barasoain-paseo.svg  # Paseo del Congreso sample fissure
        ├── pothole-capitol-road.svg     # Capitol Boulevard water-filled cavity
        ├── pothole-tikay-highway.svg    # Tikay Junction clustered asphalt defect
        └── pothole-placeholder.svg     # Default upload preview placeholder
```

---

## 6. How to Run & Test the Application

### Running the Application
Open `index.html` directly in Microsoft Edge or Google Chrome:
```text
file:///D:/Adv%20Web/index.html
```
Or start a local web server:
```powershell
# Using PHP:
php -S localhost:8000
# Using Node:
npx serve .
```

### Verification Workflows

1. **Citizen Access Verification (Public):**
   - Open `index.html`.
   - Observe citizen navigation: **Home**, **Report a Pothole**, **Pothole Map**, **My Reports**, and **Administrator Sign In**.
   - Notice that administrative queues, verification tools, and role switchers are **not visible**.
   - Submit a pothole report: It receives a temporary ID and status `Pending Review`.
   - Check the **Pothole Map**: The newly submitted pending report does **not** appear on the map.
2. **Access Control & Route Guard Verification:**
   - Attempt to manually navigate to `#admin-dashboard` or `#admin-reviews` without signing in.
   - The route guard intercepts the attempt, displays a warning toast, and redirects to `#admin-login`.
   - Attempt to open `pages/admin-dashboard.html` directly in the browser: It immediately redirects to `pages/admin-login.html`.
3. **Administrator Sign-In Verification:**
   - On the sign-in page, enter `admin` and `bulsu2026`.
   - Click the show/hide password eye icon to toggle visibility.
   - Click **Sign In**: You are authenticated and redirected to the **Administrator Dashboard**.
   - The sidebar updates to the Administrator Portal: **Dashboard**, **Review Queue**, **Approved Potholes**, **Report History**, and **Sign Out**.
4. **Approval & Public Map Synchronization:**
   - In the Review Queue, click **Inspect Photo** on the pending report.
   - Review the photograph, coordinates, and description.
   - Click **Approve & Publish to Map**.
   - Switch to the Public Map: The approved marker now appears live on the map with its photograph and details!
5. **Sign Out Verification:**
   - Click **Sign Out** in the sidebar or top bar.
   - The session is cleared from `sessionStorage`, and you are returned to the citizen homepage.
   - Attempting to reopen administrator views requires signing in again.
