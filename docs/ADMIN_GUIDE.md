# Administrator Guide

## Daycare Management System (Web App - TrueNAS Hosted)

**Version:** 2.0.0
**Last Updated:** February 2026

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [TrueNAS Deployment](#2-truenas-deployment)
3. [First-Time Setup](#3-first-time-setup)
4. [User Management](#4-user-management)
5. [Facility Configuration](#5-facility-configuration)
6. [Billing Configuration](#6-billing-configuration)
7. [Role Permissions](#7-role-permissions)
8. [Staff Management](#8-staff-management)
9. [Child Enrollment](#9-child-enrollment)
10. [Fee Configuration](#10-fee-configuration)
11. [Backup & Restore](#11-backup--restore)
12. [Data Retention & Archival](#12-data-retention--archival)
13. [Appearance & Language](#13-appearance--language)
14. [Reports & Exports](#14-reports--exports)
15. [Multi-Device Setup](#15-multi-device-setup)
16. [Maintenance & Updates](#16-maintenance--updates)
17. [Troubleshooting](#17-troubleshooting)

---

## 1. Getting Started

### 1.1 System Requirements

**Server (TrueNAS):**
- TrueNAS Scale (preferred, native Docker) or TrueNAS Core (Docker via VM)
- 2 GB RAM minimum allocated to Docker
- 5 GB disk space for application and database
- Static IP address on local network (recommended)

**Client Devices (any of the following):**
- Desktop/Laptop with any modern browser (Chrome, Firefox, Edge, Safari)
- Android or iPad tablet with any modern browser
- Smartphone with any modern browser
- Connected to the same local network as the TrueNAS server

### 1.2 Access URL

Once deployed, access the application from any device on your local network:

```
http://<truenas-ip>:3000
```

For example: `http://192.168.1.100:3000`

Bookmark this URL on all devices that will use the application.

### 1.3 Default Administrator Account

If using seed data for initial setup:
- **Username**: `admin`
- **PIN**: `1234`

**Important**: Change the default PIN immediately after first login via Settings > Users.

---

## 2. TrueNAS Deployment

### 2.1 TrueNAS Scale (Recommended)

TrueNAS Scale has native Docker/Kubernetes support:

1. Log into TrueNAS Scale web interface
2. Navigate to **Apps** section
3. Deploy using Docker Compose:
   - Upload or create the `docker-compose.yml` provided with the application
   - Configure the data volume to point to a TrueNAS dataset
   - Set environment variables (database password, session secret)
4. Start the application
5. Verify by navigating to `http://<truenas-ip>:3000`

### 2.2 TrueNAS Core (Via VM)

TrueNAS Core doesn't support Docker natively. Use a VM:

1. Create a new VM in TrueNAS (Debian or Ubuntu recommended)
2. Install Docker and Docker Compose inside the VM
3. Copy the application files to the VM
4. Run `docker-compose up -d`
5. Configure VM networking to be accessible on the local network
6. Verify by navigating to `http://<vm-ip>:3000`

### 2.3 Data Persistence

The application stores data in Docker volumes:

| Volume | Contents | Persistence |
|--------|----------|-------------|
| `db-data` | PostgreSQL database files | Survives container restarts |
| `dms-data` | Backups, uploaded files | Survives container restarts |

**Map these volumes to TrueNAS datasets** for additional protection via TrueNAS snapshots and replication.

### 2.4 Environment Variables

Configure these in your `docker-compose.yml` or `.env` file:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://dms:securepass@db:5432/daycare` |
| `SESSION_SECRET` | Random string for session encryption | `a1b2c3d4e5f6...` (32+ characters) |
| `PORT` | HTTP port | `3000` |
| `BACKUP_DIR` | Backup file storage path | `/app/data/backups` |

---

## 3. First-Time Setup

After deployment, complete these steps in order:

### Step 1: Log In
Open `http://<truenas-ip>:3000` in your browser and log in with the default admin credentials.

### Step 2: Change Default PIN
Navigate to **Settings > Users**, find the admin account, and reset the PIN to something secure.

### Step 3: Configure Facility Information
Navigate to **Settings > Facility Info** and enter your daycare's details:
- Facility Name, Address, Phone, Email
- EIN/Tax ID, License Number
- Licensed Capacity
- Operating Hours
- Fiscal Year Start Month

### Step 4: Set Up App Branding
On the same page, set:
- **App Title** (e.g., "Little Stars Family Day Home")
- **App Abbreviation** (e.g., "LS")

### Step 5: Create User Accounts
Navigate to **Settings > Users** to create accounts for all staff. See [Section 4](#4-user-management).

### Step 6: Configure Fee Schedules
Navigate to **Billing > Fee Configuration**. See [Section 10](#10-fee-configuration).

### Step 7: Enroll Staff Members
Navigate to **Staff > Add Staff**. See [Section 8](#8-staff-management).

### Step 8: Enroll Children
Navigate to **Children > Add Child**. See [Section 9](#9-child-enrollment).

### Step 9: Configure Invoice Settings
Navigate to **Settings > Billing & Invoices** to set up due date policy, letterhead, and footer.

### Step 10: Set Up Permissions
Navigate to **Settings > Role Permissions**. See [Section 7](#7-role-permissions).

### Step 11: Set Up Devices
Configure tablets and phones to access the application. See [Section 15](#15-multi-device-setup).

### Step 12: Create First Backup
Navigate to **Settings > Backup** and create a full backup.

---

## 4. User Management

### 4.1 Accessing User Management

Navigate to **Settings > Users** tab.

### 4.2 User Roles

| Role | Access Level | Typical User | Typical Device |
|------|-------------|--------------|----------------|
| **Admin** | Full access | Daycare owner | Desktop |
| **Provider** | Full access | Licensed provider | Desktop |
| **Staff** | Limited, configurable | Assistants, teachers | Tablet |
| **Substitute** | Minimal, configurable | Temporary staff | Tablet |

### 4.3 Creating a User Account

1. Navigate to **Settings > Users**
2. Click **Add User**
3. Fill in:
   - **Username**: Unique login name (cannot change later)
   - **Full Name**: Display name
   - **PIN**: Minimum 4 digits
   - **Role**: Admin, Provider, Staff, or Substitute
   - **Link to Staff Member** (optional): Connect to a staff record
4. Click **Save**

### 4.4 Editing a User Account

1. Find the user in the table
2. Click **Edit**
3. Change: Full Name, Role, Active/Inactive status, Staff link
4. Click **Save**

### 4.5 Resetting a PIN

1. Find the user, click **Reset PIN**
2. Enter new PIN (minimum 4 characters)
3. Click **Save**

### 4.6 Deactivating a User

Edit the user and toggle Active to Inactive. Inactive users cannot log in.

---

## 5. Facility Configuration

### 5.1 App Branding

| Field | Description | Where Displayed |
|-------|-------------|-----------------|
| App Title | Full name | Header, login screen, browser tab |
| App Abbreviation | Short name (2-4 chars) | Sidebar, login screen |

### 5.2 Facility Information

| Field | Description | Used For |
|-------|-------------|----------|
| Facility Name | Legal business name | Invoices, reports |
| Address | Physical address | Invoices |
| Phone | Contact number | Invoices |
| Email | Business email | Invoices |
| EIN/Tax ID | Employer ID Number | Tax documents |
| License Number | VA daycare license | Compliance docs |
| Licensed Capacity | Max children allowed | Dashboard capacity indicator |
| Operating Hours | Open/close times | Attendance, late fee reference |
| Fiscal Year Start | Month fiscal year begins | Financial reporting |

---

## 6. Billing Configuration

Navigate to **Settings > Billing & Invoices**.

### 6.1 Invoice Due Date

- **Due Upon Receipt**: Invoice due immediately
- **Due After N Days**: Due N days after billing period end (1-90 days)

### 6.2 Invoice Letterhead

Upload a logo/header image for printed invoices:

| Layout | Recommended Size |
|--------|-----------------|
| Full-Width Banner | 2100 x 300 px |
| Centered Logo | 300 x 300 px |
| Left Logo + Right Info | 300 x 300 px |

Click **Upload Letterhead** and select an image file from your device.

### 6.3 Invoice Footer

Configure up to three lines of footer text (e.g., business name, address, payment instructions).

---

## 7. Role Permissions

Navigate to **Settings > Role Permissions**.

- **Admin and Provider** always have full access (cannot be restricted)
- **Staff and Substitute** roles have configurable permissions

### 7.1 Permission List

| Permission | Controls |
|-----------|---------|
| Dashboard | Main overview page |
| View/Edit Children | Child records |
| Emergency Contacts | Contact management |
| Medical Info | Health records |
| Enroll Children | Create new child records |
| View/Edit Staff | Staff records |
| Check In/Out | Attendance operations |
| Attendance History | Past records |
| Edit Times | Time corrections |
| View/Manage Billing | Invoices, payments |
| View/Edit Meals | Meal logging |
| View/Export Reports | Report generation |
| View/Edit Settings | App configuration |
| View/Edit Compliance | Compliance records |

### 7.2 Recommended Profiles

**Staff (Daycare Assistant on Tablet):**
- Enable: Dashboard, Check In/Out, View Children, View/Edit Meals, Attendance History
- Disable: Billing, Settings, Staff management, Reports export

**Substitute:**
- Enable: Dashboard, Check In/Out, View Children
- Disable: Everything else

---

## 8. Staff Management

### 8.1 Adding Staff

Navigate to **Staff > Add Staff** and fill in:

**Required**: First Name, Last Name, Date of Birth, Address, Phone, Hire Date, Position (Provider/Assistant/Substitute)

**Optional**: Email, Pay Rates, Emergency Contact, TB Screening, Education

### 8.2 Certifications

Track required Virginia certifications under each staff member's **Certifications** tab:
- CPR, First Aid, MAT, Pre-Licensure Orientation, Annual Training
- Record: Name, Issue Date, Expiry Date, Hours, Sponsoring Org
- Dashboard shows expiration alerts (red ≤30 days, yellow ≤90 days)

### 8.3 Background Checks

Track under each staff member's **Background Checks** tab:
- Child Abuse Registry, VA Criminal, FBI Fingerprint, Sex Offender
- Record: Check Date, Expiry Date, Result (Pass/Fail/Pending)

### 8.4 Linking Staff to User Accounts

When creating a user account, link it to a staff record to track which staff member performed actions.

---

## 9. Child Enrollment

### 9.1 Enrollment Wizard (4 Steps)

1. **Basic Info**: Name, DOB, address, schedule, fee tier
2. **Parent/Guardian**: Primary contact information
3. **Medical Info**: Physician, allergies, dietary restrictions, consents
4. **Review**: Summary and confirmation

### 9.2 Schedule Types

| Type | Description | Extra Fields |
|------|-------------|-------------|
| Full Time | Mon-Fri all day | None |
| Part Time | Specific days | Day picker (Mon-Fri) |
| After School | After school hours | Day picker + Dismissal Time |
| Before School | Morning hours | Day picker |
| Drop In | As needed | None |

### 9.3 Fee Tier Assignment

Link each child to a fee configuration to determine their billing rate. Fee tiers must be created first under Billing > Fee Configuration.

### 9.4 After Enrollment

From the child's detail page, manage:
- Emergency Contacts (with priority ordering and pickup authorization)
- Authorized Pickups
- Immunization Records
- Medical information updates

---

## 10. Fee Configuration

Navigate to **Billing > Fee Configuration**.

### 10.1 Creating Fee Schedules

For each age group and schedule type combination:

| Field | Example |
|-------|---------|
| Name | "Infant Full-Time" |
| Age Group | Infant |
| Schedule Type | Full Time |
| Weekly Rate | $300.00 |
| Daily Rate | $70.00 |
| Hourly Rate | $15.00 |
| Registration Fee | $50.00 |
| Late Pickup Fee/min | $1.00 |
| Late Payment Fee | $25.00 |
| Sibling Discount | 10% |

### 10.2 Recommended Configurations

Create separate tiers for: Infant FT/PT, Toddler FT/PT, Preschool FT/PT, School-Age After/Before School, Drop-In.

---

## 11. Backup & Restore

### 11.1 Backup Strategy

| Frequency | Type | Purpose |
|-----------|------|---------|
| Daily (automated) | Data Backup | Automatic database backup by the server |
| Weekly (manual) | Application Backup | Full backup including all data and files |
| Monthly | Download to external | Save backup to USB/external drive |

### 11.2 Creating Backups

Navigate to **Settings > Backup**:

- **Data Backup**: Quick database-only backup stored on the server
- **Application Backup**: Comprehensive backup downloaded to your device as a file

### 11.3 Restoring from Backup

- **From file**: Click **Restore from File**, upload the backup file
- **From history**: Find the backup in the history list, click **Restore**

**Warning**: Restoring replaces ALL current data.

### 11.4 Backup History

View all backups with: Date, Type, Filename, Size. Actions: Download, Restore, Delete.

### 11.5 Automated Backups

The server automatically creates daily database backups. These are stored in the backup directory on the TrueNAS volume.

### 11.6 TrueNAS Snapshots

For additional protection, configure TrueNAS to take periodic snapshots of the datasets used by the Docker volumes. This provides filesystem-level recovery independent of the application.

---

## 12. Data Retention & Archival

### 12.1 Retention Period

Configure in **Settings > Billing & Invoices**:
- Default: 365 days (1 year)
- Range: 30 to 3650 days

### 12.2 Archiving

Records can be archived. Archived data is stored with an expiry date. After the retention period, expired archives can be permanently removed.

### 12.3 Data Export

Export data from any module as CSV files for external record-keeping.

---

## 13. Appearance & Language

### 13.1 Themes

Navigate to **Settings > Appearance**. Multiple color themes are available. Click a theme card to apply immediately.

### 13.2 Languages

Navigate to **Settings > Language**:
- English (US) - Default
- Spanish
- Urdu

Changes apply immediately to all interface text.

---

## 14. Reports & Exports

### 14.1 Attendance Reports

Navigate to **Reports > Attendance Reports**:
- Filter by date range, type (All/Children/Staff), specific person
- Export as CSV or PDF

### 14.2 Financial Reports

Navigate to **Reports > Financial Reports**:
- Filter by date range and family
- Shows: Total Revenue, Total Payments, Total Outstanding

### 14.3 Aging Report

Navigate to **Billing > Aging Report**:
- Groups past-due accounts: Current, 1-7, 8-14, 15-30, 30+ days

---

## 15. Multi-Device Setup

### 15.1 Overview

The web application is accessible from any device on your local network. Recommended setup:

| Device | Location | Primary Use | User Role |
|--------|----------|-------------|-----------|
| Desktop | Office | Administration, billing, reports | Admin/Provider |
| Tablet | Daycare room | Attendance check-in/check-out, meals | Staff |
| Phone | Mobile | Dashboard checks, quick lookups | Admin/Provider |

### 15.2 Setting Up a Tablet

1. Connect the tablet to the same Wi-Fi network as the TrueNAS server
2. Open the browser (Chrome recommended)
3. Navigate to `http://<truenas-ip>:3000`
4. Bookmark the URL or add it to the home screen:
   - **Android**: Tap browser menu > "Add to Home Screen"
   - **iPad**: Tap Share icon > "Add to Home Screen"
5. Log in with the staff user account
6. The attendance page will display with large, touch-friendly cards

### 15.3 Setting Up a Phone

1. Connect to the same Wi-Fi network
2. Open browser and navigate to `http://<truenas-ip>:3000`
3. Add to home screen for app-like access
4. The interface adapts to the phone screen size

### 15.4 Simultaneous Multi-User Access

Multiple staff members can be logged in simultaneously from different devices. For example:
- Staff member on tablet checking children in
- Owner on desktop creating invoices
- Owner on phone checking the dashboard

Each user has their own independent session.

### 15.5 Network Considerations

- All devices must be on the same local network (Wi-Fi or Ethernet)
- The TrueNAS server should have a **static IP address** for reliable access
- No internet connection is required
- If your Wi-Fi network has client isolation enabled, devices may not reach the server - check your router settings

---

## 16. Maintenance & Updates

### 16.1 Updating the Application

To update to a new version:

```bash
# On the TrueNAS server (or VM)
cd /path/to/daycare-management-system
docker-compose pull
docker-compose up -d
```

This downloads the latest image and restarts the containers. Data is preserved in the Docker volumes.

### 16.2 Monitoring

- Check container status: `docker-compose ps`
- View logs: `docker-compose logs -f`
- Check disk usage: Monitor TrueNAS storage dashboard

### 16.3 Database Maintenance

PostgreSQL handles maintenance automatically. For manual maintenance:
- Backups: Use the in-app backup system or `pg_dump`
- Vacuum: PostgreSQL auto-vacuums by default

---

## 17. Troubleshooting

### 17.1 Cannot Access Application from Device

**Check**:
1. Is the TrueNAS server running? Check TrueNAS web UI
2. Is the Docker container running? `docker-compose ps`
3. Is the device on the same network? Check Wi-Fi connection
4. Is the URL correct? `http://<truenas-ip>:3000`
5. Try the IP address directly (not hostname)
6. Check if a firewall is blocking port 3000

### 17.2 Application Loads But Shows Error

**Check container logs**: `docker-compose logs dms-app`

Common issues:
- Database connection failed: Check `DATABASE_URL` environment variable
- Port conflict: Another service using port 3000

### 17.3 Login Issues

- Account deactivated: Another admin can reactivate via Settings > Users
- Wrong PIN: Another admin can reset via Settings > Users > Reset PIN
- Username is case-sensitive

### 17.4 Slow Performance

- Check TrueNAS server resource usage (CPU, RAM)
- Ensure Docker has sufficient RAM allocated (2 GB minimum)
- Check network connection quality (Wi-Fi signal)

### 17.5 Data Recovery

If something goes wrong:
1. **In-app restore**: Settings > Backup > Restore from History
2. **Docker volume**: Data persists in Docker volumes even if containers are recreated
3. **TrueNAS snapshots**: If configured, restore from TrueNAS snapshot

### 17.6 Container Won't Start

```bash
# Check logs
docker-compose logs

# Restart containers
docker-compose restart

# Full rebuild
docker-compose down
docker-compose up -d --build
```

### 17.7 Tablet Touch Issues

- Use Chrome browser for best touch support
- Ensure the attendance page loads fully before tapping
- The cards are designed to be large and touch-friendly
- If taps aren't registering, try refreshing the page

---

## Appendix: Quick Reference

### Important URLs

| URL | Purpose |
|-----|---------|
| `http://<truenas-ip>:3000` | Application |
| `http://<truenas-ip>` | TrueNAS web interface |

### Docker Commands

| Command | Purpose |
|---------|---------|
| `docker-compose up -d` | Start application |
| `docker-compose down` | Stop application |
| `docker-compose restart` | Restart application |
| `docker-compose logs -f` | View live logs |
| `docker-compose ps` | Check status |
| `docker-compose pull` | Download updates |

### Default Ports

| Service | Port |
|---------|------|
| Web Application | 3000 |
| PostgreSQL | 5432 (internal, not exposed) |
