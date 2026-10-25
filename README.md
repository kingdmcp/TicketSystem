# Nexus Enterprise ITSM & ITAM CMDB Platform

A unified, full-stack Enterprise IT Service Management (**ITSM**), IT Asset Management (**ITAM**), Central Configuration Management Database (**CMDB**), and Real-time Spatial Floorplan & Network Discovery platform built with the **MERN Stack** (MongoDB/Express/React/Node.js) and **Python Network Discovery Integration**.

---

## 1. Project Scope & Architecture

This platform provides an end-to-end operational suite covering:
1. **ITSM Service Desk**: Helpdesk ticketing, Impact × Urgency priority matrix engine, automated routing, SLA response & resolution countdown monitoring, 1-hour/1-day pre-breach alerts, user resolution review with 4-hour auto-close timeouts, and automatic Knowledge Base generation.
2. **ITAM & Central CMDB**: Hardware asset tracking (Servers, Switches, Routers, APs, Workstations, Laptops), lifecycle state transitions (*Planned*, *In Use*, *In Repair*, *Retired*), IPAM mapping (IP, MAC, Switch Port, VLAN), and QR/Tag identifiers.
3. **Software Asset Management**: Enterprise software contract tracking, seat pool allocations, utilization rates, and the **3-Month Post-Offboarding Retention Policy**.
4. **Spatial Floorplan & Network Discovery**: Interactive 2D floorplan canvas (Server Rooms, Support Labs, Engineering Bays, Exec Suites) with live device pins (Online, Degraded, Offline), ping telemetry, and direct CMDB drawer linking. Supported by a Python SNMP/Zabbix scanner daemon.
5. **Security, RBAC & Governance**: Pre-configured personas (Vishan, Harindy, Pabodha, Malmika, HR, Manager, Staff), granular permission guards, real-time WebSocket events, and immutable system-wide forensic audit logs.

---

## 2. Team Leadership & Responsibilities

| Lead | Role | Primary Focus & Deliverables |
| :--- | :--- | :--- |
| **Vishan Fernando** | **Project Manager & ITSM Lead** | Helpdesk ticketing, Impact × Urgency matrix, auto-routing logic, Knowledge Base deflection & article generator, SLA countdowns & escalations. |
| **Harindy Jayasuriya** | **ITAM & CMDB Lead** | Hardware asset tracking, lifecycle states (*Planned/In Use/Repair/Retired*), software licensing seat pool, 3-month delayed offboarding reclamation. |
| **Pabodha Senaratne** | **Discovery & Integration Lead** | Campus spatial floorplans, interactive 2D canvas, Zabbix/NetBox integration, and Python active discovery daemon (`discovery_service.py`). |
| **Malmika Wickramasinghe** | **Analytics & Security Lead** | Role-Based Access Control (RBAC), persona quick-switcher, forensic security audit logging, and Recharts performance analytics dashboards. |

---

## 3. Core System Workflows

### 3.1 Onboarding & Department Transfer Process (Section 3.1)
- **Step 1: HR Initiates Draft**: HR talent specialist initiates candidate profile, inputs basic information, and generates unique primary key (`ONB-2026-xxx`).
- **Step 2: Candidate Intake Form**: Candidate receives invitation and completes phone, home address, emergency contacts, and hardware preference (e.g. MacBook Pro M3 Max or Dell Latitude).
- **Step 3: HR Verification**: HR reviews candidate inputs, assigns security groups (e.g. `Engineering-Dev`, `GitHub-Committers`, `Global-Staff`), and validates reporting manager.
- **Step 4: IT Provisioning**: IT creates Network ID (`NET_xxx`), System ID (`SYS-xxx`), corporate email, badge ID, and dispatches temporary credentials. An active employee user record is auto-generated.
- **Ongoing Department Transfers**: Dedicated transfer workflow where employee rotations are requested, reviewed by department managers, approved by HR, and IT security groups are updated dynamically.

### 3.2 Offboarding Process (Section 3.2)
- **Step 1: HR Initiates Separation**: HR submits offboarding case specifying exit date and reason.
- **Step 2: Automated Asset Aggregation**: System immediately audits and compiles all assigned hardware assets and software license seats held by the departing employee.
- **Step 3: One-Click Automated System Cutoff Sequence**:
  - Removes user from all distribution & security groups.
  - Disables Active Directory / LDAP user account.
  - Configures out-of-office auto-reply: *"[Employee] has left the organization. For urgent queries, contact [Manager]"*.
  - Forwards all incoming emails directly to the designated department manager.
- **Step 4: Hardware Return & QA Inspection**: IT inspects hardware condition:
  - **Good Condition**: Automatically restocked to available inventory shelf (`Planned`).
  - **Damaged / Broken**: Defect report flagged to HR for payroll deduction and scheduled for repair.
- **Step 5: 3-Month Delayed License Revocation**: Software licenses remain retained for 90 days to ensure email/file archiving is complete before IT/HR triggers the final seat reclaim.

### 3.3 Ticket Lifecycle and SLA Monitoring (Section 3.3)
- **KB Self-Service Deflection**: When entering ticket title, matching Knowledge Base solutions are suggested immediately to resolve issues before submission.
- **Priority Matrix Engine**:
  - High Impact × High Urgency = **P1-Critical** (Response SLA: 15 min, Resolution SLA: 4 hr)
  - High Impact × Medium Urgency / Medium Impact × High Urgency = **P2-High** (Response SLA: 1 hr, Resolution SLA: 12 hr)
  - Medium Impact × Medium Urgency / High Impact × Low Urgency = **P3-Medium** (Response SLA: 4 hr, Resolution SLA: 24 hr)
  - Low Impact × Low Urgency = **P4-Low** (Response SLA: 8 hr, Resolution SLA: 72 hr)
- **Automated Routing**: Routes to Pabodha (Network), Harindy (Hardware), Malmika (Security), or Vishan (ITSM Core).
- **Pre-Breach Alerts**: Background cron evaluates deadlines every 20s and dispatches alerts before breaches occur. Breached tickets can be escalated to senior management.
- **Resolution & 4-Hour Closure Timeout**: IT technician records resolution notes and can choose to convert the fix into a public KB article. The user receives a prompt to **Accept** (closes ticket), **Reject** (reopens ticket), or if unattended, the system auto-closes after 4 hours.

### 3.4 Procurement Flow (Section 3.4)
- **Step 1: Requisition**: Staff member raises hardware requisition with estimated cost and justification.
- **Step 2: IT Review**: IT validates specifications, checks inventory for existing stock, and recommends optimal enterprise SKUs.
- **Step 3: Manager Approval**: Department manager reviews request against departmental cap-ex budgets.
- **Step 4: Finance Authorization**: Finance authorizes payment, issues a formal Purchase Order (`PO-2026-xxx`), and releases order to IT.
- **Step 5: Delivery QA & CMDB Auto-Tagging**: When vendor delivers hardware, IT performs receiving QA, automatically registers the asset in CMDB with a new Asset Tag (`ASSET-xxx`), and assigns it to the requesting staff member.

---

## 4. Technical Stack & Directory Structure

```
Project/
├── server/                    # Node.js + Express Backend & WebSockets
│   ├── data/                  # Store engine (works standalone or with MongoDB)
│   ├── controllers/           # Controllers for ITSM, ITAM, Onb, Offb, Proc, Floorplan, Discovery
│   ├── routes/                # Express API routes (/api/*)
│   ├── middleware/            # Audit logging & RBAC security middleware
│   ├── server.js              # Server entry point & SLA background daemon
│   └── package.json
│
├── client/                    # React + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/        # Navbar, Sidebar, NotificationToast
│   │   ├── context/           # AuthContext & Persona Switcher (Vishan, Harindy, etc.)
│   │   ├── pages/             # Dashboard, Tickets, Assets, Licenses, Onboarding,
│   │   │                      # Offboarding, Procurement, Floorplan, Discovery, Analytics, AuditLogs
│   │   ├── services/          # Axios API & Socket.io client
│   │   └── App.jsx
│   ├── vite.config.js
│   └── package.json
│
├── python/                    # Python Network Discovery Service
│   ├── discovery_service.py   # SNMP MIB probe & ICMP latency scanner
│   └── requirements.txt
│
├── start.bat                  # 1-Click Windows Launcher (cmd)
├── start.ps1                  # 1-Click Windows Launcher (PowerShell)
└── package.json               # Root scripts
```

---

## 5. How to Run the Platform

### Option A: 1-Click Windows Launcher
Double-click `start.bat` or run:
```powershell
.\start.ps1
```
This automatically boots:
- Backend API on `http://localhost:5000`
- Frontend UI on `http://localhost:5173`

### Option B: Manual Terminal Execution

#### 1. Backend Server
```powershell
cd server
npm start
```

#### 2. Frontend Client
```powershell
cd client
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

#### 3. Python Network Discovery Agent (Optional)
To run a discovery sweep across subnets `10.0.1.0/24` and `10.0.2.0/24`:
```powershell
cd python
python discovery_service.py --once
```
Or run as a continuous polling daemon:
```powershell
python discovery_service.py
```
Discovered telemetry will stream directly into the CMDB and live interactive floorplan canvas!
