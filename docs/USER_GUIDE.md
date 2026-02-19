# User Guide

## Daycare Management System (Web App)

**Version:** 2.0.0
**Last Updated:** February 2026

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Accessing the Application](#2-accessing-the-application)
3. [Logging In and Out](#3-logging-in-and-out)
4. [Dashboard](#4-dashboard)
5. [Attendance](#5-attendance)
6. [Children](#6-children)
7. [Staff](#7-staff)
8. [Billing & Invoicing](#8-billing--invoicing)
9. [Reports](#9-reports)
10. [Settings](#10-settings)
11. [Using on Tablet](#11-using-on-tablet)
12. [Using on Phone](#12-using-on-phone)
13. [Frequently Asked Questions](#13-frequently-asked-questions)

---

## 1. Introduction

### 1.1 About This Application

The Daycare Management System (DMS) is a web application for managing Virginia-licensed family day homes. It runs on your daycare's local server (TrueNAS) and can be accessed from any device on the local network - desktop computers, tablets, and phones.

### 1.2 What You Can Do

| Role | Capabilities |
|------|-------------|
| **Admin / Provider** | Everything: enrollment, billing, reports, settings, attendance |
| **Staff** | Attendance check-in/check-out, view children, meal logging, dashboard |
| **Substitute** | Attendance check-in/check-out, view children, dashboard |

If you cannot see certain menu items, your administrator has not granted you access to those areas.

### 1.3 Navigation

The application has a **sidebar** on the left with navigation items:

| Icon | Module | Purpose |
|------|--------|---------|
| Dashboard | **Dashboard** | Today's overview |
| Child | **Children** | Manage enrolled children |
| People | **Staff** | Manage staff members |
| Calendar | **Attendance** | Daily check-in/check-out |
| Receipt | **Billing** | Invoices and payments |
| Chart | **Reports** | Generate reports |
| Gear | **Settings** | App configuration |

On **desktop**: The sidebar is always visible. Click the hamburger menu to collapse it.
On **tablet**: Tap the hamburger menu to show/hide the sidebar.
On **phone**: Tap the hamburger menu to slide the sidebar open.

---

## 2. Accessing the Application

### 2.1 From a Desktop or Laptop

1. Open your web browser (Chrome, Firefox, Edge, or Safari)
2. Type the application URL: `http://<server-ip>:3000` (your admin will provide the exact address)
3. Bookmark the URL for easy access

### 2.2 From a Tablet

1. Connect to the daycare Wi-Fi network
2. Open the browser
3. Navigate to the application URL
4. Add to home screen for app-like access:
   - **Android**: Menu > "Add to Home Screen"
   - **iPad**: Share button > "Add to Home Screen"

### 2.3 From a Phone

1. Connect to the daycare Wi-Fi
2. Open the browser and navigate to the URL
3. Add to home screen for quick access

**Note**: All devices must be connected to the same local network as the server. The application does not require internet access.

---

## 3. Logging In and Out

### 3.1 Logging In

1. Open the application in your browser
2. Enter your **Username**
3. Enter your **PIN** (the numeric code from your administrator)
4. Tap or click **Login**

If you see "Invalid username or PIN", check both fields. Usernames are case-sensitive.

### 3.2 Logging Out

Click or tap the **Logout** button in the top-right corner of the header.

### 3.3 Multiple Devices

You can be logged in on multiple devices at the same time. For example, you might have the dashboard open on your phone while using attendance on the tablet.

---

## 4. Dashboard

The Dashboard is your home screen showing a real-time overview. It refreshes automatically every 30 seconds.

### 4.1 Headcount Card (Blue)

Shows children currently checked in and the capacity usage: "Capacity: 8/12" means 8 children present out of 12 allowed.

### 4.2 Staff On Duty Card (Purple)

Shows how many staff are clocked in, with their names displayed as tags.

### 4.3 Ratio Compliance Card (Green or Red)

The most important indicator for Virginia compliance:

- **Green = Compliant**: Enough staff for the children present
- **Red = Non-Compliant**: Need more staff

Shows points used per caregiver, caregivers needed vs. present.

**If Non-Compliant**: Have another staff member clock in, or do not check in more children until compliance is restored.

### 4.4 Children Present

List of all checked-in children with their check-in times.

### 4.5 Alerts

- **Red alerts**: Staff certifications expiring within 30 days
- **Yellow alerts**: Certifications expiring within 90 days
- **Past due accounts**: Families with unpaid balances

### 4.6 Quick Actions

Shortcut buttons:
- **Check In** - Go to Attendance
- **Add Child** - Open enrollment form
- **Record Payment** - Open payment form

---

## 5. Attendance

The Attendance page is designed for quick daily use, especially on a tablet with touch.

### 5.1 Today's View

**Left side - Children**: Grid of cards for all active children
**Right side - Staff**: List of all active staff members

### 5.2 Checking a Child In

1. Find the child's card (it will be **gray**)
2. Tap the card
3. The card turns **green** and shows the check-in time
4. The headcount and ratio update automatically

### 5.3 Checking a Child Out

1. Find the child's card (it will be **green**)
2. Tap the card
3. The card returns to **gray**

### 5.4 Clocking Staff In

1. Find the staff member on the right panel
2. Tap the **Clock In** button
3. Their entry turns **blue** and shows the time

### 5.5 Clocking Staff Out

1. Find the staff member (their entry will be **blue**)
2. Tap the **Clock Out** button
3. Their entry returns to neutral

### 5.6 Point System Bar

The colored bar at the top shows Virginia Point System compliance:

| Age | Points per Child |
|-----|-----------------|
| Birth to 15 months | 4 points |
| 16 to 23 months | 3 points |
| 2 to 4 years | 2 points |
| 5 to 9 years | 1 point |
| 10+ years | 0 points |

Each caregiver handles up to **16 points**. The bar shows the age group breakdown so you can see exactly where the points come from.

### 5.7 Attendance History

1. Tap the **History** tab on the Attendance page
2. Set date range and filters
3. View past records with total hours

### 5.8 Time Corrections

If a time was recorded incorrectly:
1. Go to Attendance History
2. Find the record
3. Tap **Edit**
4. Change the times
5. Enter a **reason** (required)
6. Save

---

## 6. Children

### 6.1 Viewing Children

Navigate to **Children** to see all enrolled children. Use the search bar to find by name, or filter by status (Active, Inactive, Withdrawn).

### 6.2 Enrolling a New Child

1. Tap **Add Child**
2. Follow the 4-step wizard:
   - **Step 1**: Name, DOB, address, schedule, fee tier
   - **Step 2**: Parent/guardian contact info
   - **Step 3**: Physician, allergies, dietary needs, medical consents
   - **Step 4**: Review all info and save

### 6.3 Child Detail Page

Tap a child's name to see their full profile with tabs:

| Tab | What's There |
|-----|-------------|
| Profile | Name, DOB, address, schedule |
| Medical | Physician, allergies, dietary restrictions |
| Emergency Contacts | Emergency contact list |
| Authorized Pickups | People allowed to pick up the child |
| Immunizations | Vaccination records |
| Attendance | Child's attendance history |

### 6.4 Managing Emergency Contacts

On the child's detail page > Emergency Contacts tab:
1. Tap **Add Contact**
2. Enter name, relationship, phone, priority
3. Toggle **Authorized Pickup** if applicable
4. Save

### 6.5 Schedule Types

| Type | Description |
|------|-------------|
| Full Time | Monday-Friday, all day |
| Part Time | Specific days (you pick which days) |
| After School | After school hours (set dismissal time) |
| Before School | Morning hours |
| Drop In | As needed, no set schedule |

---

## 7. Staff

### 7.1 Staff List

Navigate to **Staff** to see all staff members. Search by name or filter by status.

### 7.2 Staff Detail Page

Tap a staff member's name for tabs:

| Tab | Contents |
|-----|----------|
| Profile | Personal info, hire date, position |
| Certifications | CPR, First Aid, MAT, training records |
| Background Checks | Required Virginia background checks |
| Training | Training history |
| Timecards | Clock-in/out history |

### 7.3 Certifications

Add certifications for each staff member:
- CPR, First Aid, MAT, Pre-Licensure Orientation, Annual Training
- Record issue date, expiry date, hours, and sponsoring organization
- Expiring certifications appear as Dashboard alerts

---

## 8. Billing & Invoicing

### 8.1 Billing Dashboard

Navigate to **Billing** for an overview:
- Total Outstanding, Collected This Month, Overdue Accounts, Pending Invoices
- Quick action buttons for common tasks
- Recent payments and past-due accounts lists

### 8.2 Generating Invoices

1. Go to **Billing > Invoices**
2. Tap **Generate Invoices**
3. Select billing period dates
4. The system creates invoices based on each child's fee tier

### 8.3 Viewing & Editing Invoices

Tap an invoice to see its full detail:
- Line items table (edit, add, or delete items)
- Payment history
- Split billing configuration
- Print button

### 8.4 Line Item Types

| Type | Description |
|------|-------------|
| Tuition | Regular childcare fees |
| Registration | One-time enrollment fee |
| Late Pickup | Fee for picking up after hours |
| Late Payment | Fee for late payment |
| Supply | Supplies or materials |
| Credit | Discount or credit |
| Other | Miscellaneous charges |

### 8.5 Split Billing

Divide an invoice between the parent and a third party (subsidy, employer, etc.):

1. Open the invoice
2. Toggle **Enable Split Billing**
3. Set parent's percentage (e.g., 60%)
4. Enter third-party payer name and address
5. Save

When printing, two separate invoices are generated - one for each payer.

### 8.6 Recording Payments

1. Go to **Billing > Record Payment**
2. Select family
3. Enter amount
4. Select method: Cash, Check, Money Order, Credit Card, ACH, Zelle, Venmo, Subsidy, Other
5. Optionally enter reference number and notes
6. Save

### 8.7 Family Accounts

View any family's complete financial history: balances, invoices, and payments.

### 8.8 Aging Report

Go to **Billing > Aging Report** to see accounts grouped by how overdue they are: Current, 1-7 days, 8-14 days, 15-30 days, 30+ days.

### 8.9 Printing Invoices

1. Open the invoice detail
2. Tap **Print**
3. Your device's print dialog opens
4. Print or save as PDF

Invoices include your letterhead and footer if configured in Settings.

---

## 9. Reports

### 9.1 Attendance Reports

1. Navigate to **Reports**
2. Set date range, type filter, and optional specific person
3. Tap **Generate Report**
4. View results table: Date, Name, Type, Check-in, Check-out, Hours

**Export**: Tap **Export CSV** or **Export PDF** to download the report.

### 9.2 Financial Reports

1. Navigate to **Reports > Financial Reports** tab
2. Set date range and optional family filter
3. Tap **Generate Report**
4. See: Total Revenue, Total Payments, Total Outstanding

---

## 10. Settings

### 10.1 Available Tabs

| Tab | Purpose | Who Can Access |
|-----|---------|---------------|
| Facility Info | Daycare name, address, branding | Admin/Provider |
| Users | User accounts | Admin/Provider |
| Billing & Invoices | Invoice configuration | Admin/Provider |
| Role Permissions | Feature access by role | Admin/Provider |
| Backup | Backup and restore | Admin/Provider |
| Appearance | Color themes | Any user |
| Language | Interface language | Any user |

### 10.2 Changing Theme

Go to **Settings > Appearance**, tap a theme card. Applied immediately.

### 10.3 Changing Language

Go to **Settings > Language**. Choose English, Spanish, or Urdu. Applied immediately.

---

## 11. Using on Tablet

The tablet is the ideal device for daily attendance operations in the daycare room.

### 11.1 Best Practices

- **Keep the tablet charged** and in a fixed location in the daycare room
- **Bookmark the app** or add to home screen for one-tap access
- **Use Chrome** for the best touch experience
- **Log in as a staff user** with appropriate permissions
- **Keep the Attendance page open** throughout the day

### 11.2 Attendance on Tablet

The Attendance page is designed with large, touch-friendly cards:
- Children appear as a grid of tappable cards
- Staff appear as a list with large clock in/out buttons
- The compliance bar is always visible at the top
- Cards are big enough to tap without precision

### 11.3 Landscape vs. Portrait

- **Landscape** (horizontal): Best for attendance - shows children and staff side by side
- **Portrait** (vertical): Staff section appears below children section

---

## 12. Using on Phone

The phone provides quick access for the owner/administrator when away from the desk.

### 12.1 What Works Well on Phone

- Checking the Dashboard (headcount, compliance, alerts)
- Viewing child or staff details
- Quick lookups

### 12.2 What's Better on Desktop/Tablet

- Billing and invoicing (complex forms)
- Reports (wide tables)
- Settings configuration

### 12.3 Phone Layout

On phone screens:
- Sidebar becomes a slide-out drawer (tap hamburger menu)
- Cards stack vertically
- Tables scroll horizontally if needed
- All functions are accessible, just adapted for the smaller screen

---

## 13. Frequently Asked Questions

### General

**Q: Can multiple people use the app at the same time?**
A: Yes! That's the key advantage of the web version. Staff can check kids in on the tablet while the owner does billing on the desktop, and both see real-time updates.

**Q: Does it need internet?**
A: No. Everything runs on your local network. As long as your device is connected to the same Wi-Fi as the TrueNAS server, it works without internet.

**Q: What if the server goes down?**
A: You won't be able to access the app until the TrueNAS server is back up. The server is configured to auto-restart, so brief outages resolve themselves. All data is preserved.

**Q: Can I use it outside my home/daycare?**
A: By default, only devices on your local network can access it. If you need remote access, your administrator would need to configure VPN or port forwarding (not recommended for security reasons).

### Attendance

**Q: What happens if I forget to check out a child?**
A: They'll still show as "checked in" the next day on the Dashboard. Use Attendance History to find the record and correct the time.

**Q: How does the Point System work?**
A: Virginia assigns points based on age: younger children need more supervision (more points). Each caregiver handles up to 16 points. If total points exceed what your staff can handle, you're non-compliant.

**Q: If two staff members tap check-in for the same child at the same time, what happens?**
A: The server processes requests sequentially. The first tap succeeds, the second will see the child is already checked in.

**Q: Can a substitute clock in?**
A: Yes. Virginia limits substitutes to 240 hours per year.

### Billing

**Q: Can I edit an invoice after it's been issued?**
A: Yes, you can add, edit, and delete line items. Totals recalculate automatically.

**Q: What does "Void" mean?**
A: Voiding cancels an invoice permanently. It stays in the system for records but can't be edited or paid.

**Q: How does split billing work?**
A: It divides an invoice between parent and a third party. You set the percentage split. When printed, separate invoices are generated for each payer.

### Technical

**Q: What browsers work?**
A: Chrome (recommended), Firefox, Safari, and Edge. All modern browsers should work.

**Q: The app looks different on my phone vs the desktop.**
A: The app is responsive - it adapts its layout to fit your screen size. All the same features are available on every device.

**Q: How do I know the address to type in?**
A: Ask your administrator. It's typically something like `http://192.168.1.100:3000` where the numbers are your TrueNAS server's IP address.

**Q: I added it to my home screen but it shows a blank page.**
A: Make sure you're connected to the daycare Wi-Fi. If you're on cellular data, the app won't be reachable since it's on the local network only.
