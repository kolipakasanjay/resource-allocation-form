# PMI Pearl City Chapter (PMIPCC) - Portfolio Resource Allocation System

Official Enterprise Resource Allocation & Multi-Person Quarterly Tracking System for **PMI Pearl City Chapter Hyderabad (PMIPCC)**.

---

## 🏛️ Requirements & Implementation

### 1. Brand Identity & Design System
- **Logo**: Uses official PMIPCC color and white vector SVG logos (`assets/pmi-logo-color.svg`, `assets/pmi-logo-white.svg`, and favicon `assets/favicon.png`).
- **Brand Colors**: Official PMI Pearl City Chapter palette:
  - `--pmi-dark: #003366` (PMI Deep Navy)
  - `--pmi-blue: #0065bd` (PMI Electric Blue)
  - `--pmi-orange: #ff610f` (PMI Vibrant Orange)
  - `--pmi-cyan: #05bfe0` & `--pmi-violet: #4f17a8`
  - `--pmi-ribbon` (Four-color chapter emblem ribbon)
- **Stylesheet**: Direct implementation of `styles.css` from the PMIPCC enterprise design system.

---

### 2. Leadership Board & Portfolios (Taken from Board Image)
The system is pre-configured with the **8 official Board Members & Portfolios** shown in the chapter leadership image:

| # | Board Member | Chapter Portfolio & Role | Code |
|---|---|---|---|
| 1 | **Manohar Yerraguntla** | President & Governance | `PG-01` |
| 2 | **Sivakumar G** | Vice President Professional Associations & Events | `PAE-02` |
| 3 | **Vinay Babu Tarala** | General Secretary & Marcom | `GSM-03` |
| 4 | **Krishna Chaitanya** | Treasurer & Volunteers | `TV-04` |
| 5 | **Suresh Addepalli** | Director Membership | `MB-05` |
| 6 | **Lata Kalla** | Director YSIC & Academia | `YA-06` |
| 7 | **Seshu Ganti** | Director Corporate Outreach | `CO-07` |
| 8 | **Sreevani Lakkaraju** | Director Academy | `AC-08` |

---

### 3. Dynamic Form Workflow

1. **Portfolio: Dropdown with Names from Image**:
   - `<select>` dropdown populated with the 8 chapter portfolios and their designated leads.
   - Only **Active** portfolios appear in this dropdown.
2. **Multiple Options to Select Persons**:
   - Interactive board member selection cards with avatar initials, full names, and official chapter roles.
   - Supports selecting single or multiple persons (Person 1, Person 2, Person 3...).
   - Quick controls: "Select All 8 Leaders", "Clear Selection", and "⚡ Quick Demo".
   - Selected leaders are mirrored as removable chip badges.
3. **Past 3 Months Work (Multi-Select Monthname, Hours, Comments)**:
   - For **each selected Person** (Person 1, Person 2, Person 3...):
     - **Select Month**: Dropdown to select the target month (defaults to **October**).
     - **Dynamic Past 3 Months Calculation**:
       - When **October** is selected, the system automatically computes and displays work for the **past 3 months**:
         1. **August**
         2. **September**
         3. **October**
       - Selecting any other month (e.g. November, December, September) dynamically shifts to its respective rolling past 3 months!
     - **Multi-Select Months**:
       - 12 calendar month pills allow adding or removing any custom month.
       - The past 3 months are highlighted with PMIPCC orange badges.
     - **Work Matrix for Each Month**:
       - **Monthname** (e.g., `📅 August`, `📅 September`, `📅 October`)
       - **Hours** input with quick buttons (`40h`, `80h`, `160h`)
       - **Comments** input for task deliverables, PDU initiatives, chapter events, and meetings
       - Quick copy button: duplicate hours/comments across all months for that person
       - Real-time subtotal hours calculated per person
4. **Sticky Action Bar**:
   - Real-time counters: Leaders Selected, Months Logged, and Grand Total Hours.
   - "Submit & Save Allocations" with validation.
   - "Reset Form" and auto-draft saving to `localStorage`.

---

### 4. Portfolios & Leadership Management (Admin / CRUD)
- **Portfolios Management**:
  - Add new Portfolio (Name, Code, Lead Person, Status, Description).
  - Update portfolio details.
  - Dropdown deletion (delete portfolio from system/dropdown with confirmation).
  - Toggle status directly on table row: **Active**, **Not Active / Inactive**, **Archive**.
- **Leaders Directory**:
  - Add new person/leader (Name, Role, Email, Portfolio, Status).
  - Update leader information.
  - Delete with safety confirmation.
  - Toggle status: **Active** (visible in multi-select), **Not Active** (hidden), **Archive**.

---

### 5. Reports & Multi-Format Downloads
- **Analytics KPI Cards**: Total Hours Logged, Month Allocations, Unique Leaders, Portfolios Tracked.
- **Visual SVG Charts**:
  - Hours Logged by Portfolio (horizontal progress bars).
  - Monthly Allocation Trend (vertical bar chart highlighting August, September, October).
- **Filterable Data Table**:
  - Filter by Portfolio, Leader/Person, Month, and Search Comments.
  - Sortable columns and row actions (Edit Allocation, Delete).
- **Downloads**:
  1. 📥 **Download Excel (`.xlsx` / `.xls`)**: Formatted XML spreadsheet with PMIPCC header banner, formatted numbers, and summary totals.
  2. 📄 **Download CSV (`.csv`)**: RFC 4180 standard CSV with UTF-8 BOM (`\uFEFF`) for Microsoft Excel compatibility.
  3. 🖨️ **Print / Save PDF**: Print-optimized stylesheet (`@media print`) with PMIPCC logo header and clean tables.
  4. 💾 **Backup & Restore JSON**: Full data export and import.

---

### 6. Security Field & Administrator Audit Tracking
A dedicated security governance audit trail for administrator logins:
- **Security Field (Active Session Banner)**: Prominently displayed across the Chapter Admin Panel with 4 key verification items:
  1. **Timestamp (IST)**: Verified Indian Standard Time (UTC+5:30) at the moment of login.
  2. **Logged-in Person (Admin)**: Username and chapter role of the authenticated administrator.
  3. **IP Address**: Client connection IP address (local loopback `127.0.0.1` and public client IP).
  4. **Device & Browser Details**: Full client platform signature including browser name/version, operating system, architecture (e.g. 64-bit), form factor (Desktop/Mobile), and screen resolution.
- **Security Audit Register Subtab**: Complete searchable audit history table with session filters, IP refresh, CSV export, and log management.
- **Server Client-Info Endpoint**: High-efficiency `/api/client-info` endpoint providing accurate IP and user-agent metadata.

---

## 🚀 How to Run

### Option 1: Direct Browser Launch (No Installation Required)
Simply open [index.html](file:///c:/Users/Sanjay/OneDrive/Desktop/PMIPCC/ASSIGNMENT2/index.html) in Google Chrome, Microsoft Edge, or Firefox.

### Option 2: Local Node.js Server
```bash
npm start
```
or
```bash
node server.js
```
Then visit: [http://localhost:3000](http://localhost:3000)

