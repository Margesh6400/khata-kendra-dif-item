# 🛠️ Khata Kendra (ખાતા કેન્દ્ર) - Ultimate User Guide
### Complete Page-by-Page Operating Manual with Step-by-Step Feature Tutorials

Welcome to the **Khata Kendra** comprehensive user guide. This document contains step-by-step operating instructions for every screen, menu, button, and calculation method in the system. Use this guide to train staff, troubleshoot billing, and manage inventory operations.

---

## 📋 Table of Contents
1. [User Authentication & Login](#1-user-authentication--login)
2. [Dashboard & Daily Rojmel (રોજમેળ)](#2-dashboard--daily-rojmel-રોજમેળ)
3. [Client Management & Custom Rent Profiles (ગ્રાહક સંચાલન)](#3-client-management--custom-rent-profiles-ગ્રાહક-સંચાલન)
4. [Stock & Inventory Management (સ્ટોક સંચાલન)](#4-stock--inventory-management-સ્ટોક-સંચાલન)
5. [Udhar Challan - Dispatches (ઉધાર ચલણ)](#5-udhar-challan---dispatches-ઉધાર-ચલણ)
6. [Jama Challan - Returns & Damage Tracking (જમા ચલણ)](#6-jama-challan---returns--damage-tracking-જમા-ચલણ)
7. [Challan Book - Historical Log (ચલણ બુક)](#7-challan-book---historical-log-ચલણ-બુક)
8. [Create Bill - Rental Calculations (બિલ બનાવો)](#8-create-bill---rental-calculations-બિલ-બનાવો)
9. [Bill Book - Invoice Management (બિલ બુક)](#9-bill-book---invoice-management-બિલ-બુક)
10. [Client Ledger & Statements (ગ્રાહક ખાતાવહી)](#10-client-ledger--statements-ગ્રાહક-ખાતાવહી)
11. [Payments Entry (નાણાં જમા)](#11-payments-entry-નાણાં-જમા)
12. [Stock History & Adjustments Log (સ્ટોક ડાયરી)](#12-stock-history--adjustments-log-સ્ટોક-ડાયરી)
13. [Challan Designer (ટેમ્પલેટ ડિઝાઇનર)](#13-challan-designer-ટેમ્પલેટ-ડિઝાઇનર)
14. [System Settings & Data Backups (સેટિંગ્સ)](#14-system-settings--data-backups-સેટિંગ્સ)
15. [Advanced Logic: FIFO "Jama First" vs. Accumulative Billing](#15-advanced-logic-fifo-jama-first-vs-accumulative-billing)

---

## 1. User Authentication & Login
Secures your business data. Tied to your Supabase cloud backend database.

### 🔐 How to log in:
1. Open the application. You will be automatically redirected to the **Login Page** if not authenticated.
2. Enter your registered **Email Address** and secure **Password**.
3. Click the **"Sign In" (લોગ ઇન)** button.
4. If successful, you will see a loading spinner ("લોડ થઈ રહ્યું છે...") before landing on the main Dashboard.
5. **Session Persistence:** The system remembers your login session so you don't have to enter your credentials every time you open the app on the same browser.

---

## 2. Dashboard & Daily Rojmel (રોજમેળ)
Provides real-time business diagnostics and logs daily material logistics.

### 📊 Features & How to Use Them:
* **Key Performance Metrics (KPIs):** 
  * Displays **Active Clients** (number of customers with outstanding rental materials).
  * Displays **Outstanding Dues** (total rupees due from all clients combined).
  * Displays **Plates On Site** (active rental shuttering plates count).
  * Displays **Available Stock** (free plates inside your go-down).
* **Rojmel (Daily Material Journal):**
  * **What it does:** Records and sums up all inward and outward material movement for the selected day.
  * **How to change date:** Use the calendar date-picker in the Rojmel widget to look back at historical dates.
  * **How to export daily summary:** Click **"Download Journal" (રોજમેળ ડાઉનલોડ કરો)**. It creates a formatted print-ready layout of today's total inward/outward movement, categorizing items by size and client.

---

## 3. Client Management & Custom Rent Profiles (ગ્રાહક સંચાલન)
Manages client files, contact directories, shipping sites, and custom rental rates.

### 👤 Adding a New Client:
1. Navigate to **Client Management** from the side menu.
2. Click the **"Add New Client" (નવો ગ્રાહક ઉમેરો)** button.
3. Enter the required details:
   * **Name (નામ):** Primary billing name.
   * **Phone Number (મોબાઈલ નંબર):** Used for direct WhatsApp messaging.
   * **Alternative Phone:** Secondary contact info.
4. **Manage Construction Sites:** Under the site section, click **"Add Site"** to add delivery addresses. A client can have multiple active sites (e.g., *“Om Shanti Heights”*, *“Govardhan Villa”*).
5. Click **"Save"** to insert the record.

### ⚙️ Setting Up Custom Rental Rates:
By default, the client is billed at global default rates. If this client has special pricing:
1. Open the Client details page and click **"Edit Client" (માહિતી સુધારો)**.
2. Toggle the **"Custom Rent Profiles" (કસ્ટમ ભાડા પ્રોફાઇલ)** switch.
3. A list of your inventory items will expand. Enter the negotiated daily rent for specific items:
   * Example: If the default Jack rate is ₹2.00, but this client gets it for ₹1.70, type `1.70` next to the specific Jack size.
   * *Note: Shuttering plates use a flat daily rate and are usually excluded from itemized custom sizes.*
4. Click **"Save changes"** to write changes to database.

---

## 4. Stock & Inventory Management (સ્ટોક સંચાલન)
Configure inventory items, register custom sizes, reorder print columns, and run physical stock audits.

### 📦 Adding a New Item Size:
1. Go to **Stock Management**.
2. Select your category tab: **Shuttering (શટરિંગ)**, **Jack (જેક)**, **Cuplock (કપલોક)**, or **Other (અન્ય)**.
3. Click the **"Add Size" (સાઈઝ ઉમેરો)** button.
4. Type the label/size name (e.g., `12x3 Plate` or `3.5 Mtr Jack`).
5. Choose the category and enter the starting physical quantity (Total Stock) in your go-down.
6. Click **"Submit"**.

### ↕️ Drag-and-Drop Reordering:
The sequence of items on this screen dictates how columns appear on delivery challans and printed PDF bills.
1. Click **"Reorder Items" (ક્રમ ગોઠવો)**.
2. Click and hold the drag grip icon (`⠿`) next to any item size.
3. Drag the row up or down to your preferred position.
4. Click **"Save Order"** to register this layout sequence globally.

### ✏️ Editing or Deleting Item Sizes:
* **Editing:** Click the **Edit (પેન્સિલ)** icon to rename a size.
* **Deleting:** Click the **Trash (કચરાપેટી)** icon.
  * **Safety Guard:** The system will block deletion if any quantity of this size is currently marked "On Rent" or "Borrowed" on an active site. You must return all stock via Jama Challan before deleting.

### 🛠️ Performing Stock Adjustments (Manual Audits):
1. In the stock listing table, locate the item size you wish to adjust.
2. Click the **"+"** or **"-"** buttons.
3. Input the quantity to add/subtract.
4. Enter the reason for the audit (e.g., *"Purchased new stock"*, *"Scrapped rusted pipes"*).
5. Save. This logs the action to **Stock History** for audit compliance.

---

## 5. Udhar Challan - Dispatches (ઉધાર ચલણ)
Creates delivery receipts to track what materials leave the yard, which site they go to, and when.

### 🚚 Step-by-Step Material Dispatch:
1. Click **"Udhar Challan" (ઉધાર ચલણ)** ➡️ **"New Challan" (નવું ચલણ બનાવો)**.
2. **Header Information:**
   * Select the **Client Name** from the dropdown list.
   * Choose the specific **Construction Site** (address) where the material is headed.
   * Enter the **Challan Date**.
   * Fill in **Driver Name**, **Vehicle Number**, and **Reference/PO Number** (optional).
3. **Adding Items:**
   * Click on the product tabs (Shuttering, Jack, Cuplock, Other).
   * Input the quantities being loaded onto the truck next to each size.
   * **Live Stock Validation:** If you type in a quantity that exceeds your available go-down stock, the input field highlights in red and warns you: *"Insufficient stock in go-down!"*.
4. **Submit & Print:**
   * Click **"Save Challan"**.
   * Once saved, a PDF preview will pop up.
   * Click **"Print"** to send to a local printer, or click **"Send WhatsApp"** to share the PDF invoice/challan directly with the client.

---

## 6. Jama Challan - Returns & Damage Tracking (જમા ચલણ)
Documents materials returning to your yard, classifying them by physical condition.

### 🔄 Step-by-Step Material Return:
1. Navigate to **Jama Challan (જમા ચલણ)** ➡️ **"Create Return Challan"**.
2. Select the **Client** and the specific **Site Address**.
3. **Grid Loading:** The page will automatically populate a list of **only** the items currently outstanding at that site. It shows:
   * *Total Outstanding Quantity* for each size.
4. **Enter Quantities returned under three columns:**
   * **Good (ચોખ્ખો):** Undamaged items. Returning these increases your available go-down stock.
   * **Broken (તૂટેલો):** Damaged but repairable items. Moves these units to "Broken Stock" in your warehouse and halts rental days.
   * **Lost (ખોવાયેલ):** Missing items. Moves these units to "Lost Stock" and halts rental days. (You can bill the replacement cost during invoicing).
5. **Safety Check:** If you enter a return quantity higher than what is outstanding, the system throws an error: *"Cannot return more than outstanding stock"*.
6. Click **"Save Return Challan"**.

---

## 7. Challan Book - Historical Log (ચલણ બુક)
Your ledger repository for search, audit, and adjustments.

### 🔍 How to use:
* **Search Box:** Search by customer name, site name, or challan number.
* **Filters:** Use date controls to view dispatches within specific ranges.
* **Type Toggle:** Switch filters between **"All"**, **"Udhar Only"**, or **"Jama Only"**.
* **Edit/Delete Actions:**
  * Click any row to view full details.
  * **Delete Challan:** Deleting an Udhar/Jama Challan recalculates the client's current outstanding items at the site and restores go-down stock balances. Use this to revert entry mistakes.

---

## 8. Create Bill - Rental Calculations (બિલ બનાવો)
Generates rental bills by calculating the number of days materials remained on site.

### 🧾 How to Generate an Invoice:
1. Go to **Create Bill (બિલ બનાવો)**.
2. Select the **Client** and choose the **Billing Period**:
   * **Start Date:** The beginning date of the bill (defaults to the date of first dispatch).
   * **Till Date:** The cutoff date up to which rent is charged (defaults to today's date).
3. **Rent Calculation Model:** Select your matching algorithm:
   * **FIFO (Jama First) [Recommended]:** Matches returns against the earliest delivery challans.
   * **Regular:** Accumulates overall balance.
4. **Review Computed Rent:**
   * **Shuttering Section:** Displays flat daily rate calculations.
   * **Jack Section:** Displays rental broken down size-by-size according to custom rates.
   * **Cuplock/Other Section:** Displays scaffolding rental totals.
5. **Add Extra Costs (વધારાના ચાર્જ):**
   * Click **"Add Row"** under Extra Costs.
   * Enter parameters: **Date**, **Note** (e.g., *Transport, Loading/Unloading, Plate Cleaning, Damage repair fee*), **Quantity (Pieces)**, and **Price Per Piece**. The system calculates the row total.
6. **Add Custom Discounts:**
   * Enter parameters for deductions (e.g., *Negotiated discount, rounding off*).
7. **Draft Preview:** Toggle the **"Preview Invoice"** switch to view the full PDF design draft before saving.
8. Click **"Generate Bill"**. This creates a unique invoice number, registers the invoice in the database, and adds a debit transaction to the client's ledger.

---

## 9. Bill Book - Invoice Management (બિલ બુક)
Review, print, and manage generated invoices.

### 📄 Actions:
* **Search:** Find bills by Client Name or Invoice Number.
* **Print Invoice:** Click **"Print"** next to any bill to open the formatted PDF invoice layout.
* **JPEG Export:** Click **"Export Image"** to convert the invoice to an image file (JPEG), which is easily viewable on WhatsApp without downloading a PDF reader.
* **Delete Bill:** Deleting a bill deletes the invoice record and removes the outstanding debit from the customer's account balance.

---

## 10. Client Ledger & Statements (ગ્રાહક ખાતાવહી)
Chronological ledger sheets showing all debits (bills) and credits (payments) per client.

### 📖 How to generate a statement:
1. Go to **Client Ledger (ગ્રાહક ખાતાવહી)**.
2. Select the client from the list.
3. You will see a statement showing:
   * Date, Description, Reference (Bill ID or Receipt ID), Debit (Udhar), Credit (Jama), and **Running Balance**.
4. **Print Ledger Statement:** Click **"Print Statement" (ખાતાવહી પ્રિન્ટ કરો)**. Generates an A4 PDF statement containing your company header, client info, transaction grid, and final outstanding balance to send to the client.

---

## 11. Payments Entry (નાણાં જમા)
Records client cash collections and banking transactions.

### 💰 How to record a collection:
1. Go to **Payments (જમા નાણાં)**.
2. Click **"New Payment" (નવી એન્ટ્રી)**.
3. Select the **Client**.
4. Enter the **Receipt Date** and **Payment Amount (રૂપિયા)**.
5. Select **Payment Mode**:
   * **Cash (રોકડા)**
   * **Cheque (ચેક):** Fill in the Cheque Number and bank name.
   * **UPI / Online (UPI/ઓનલાઈન):** Fill in the transaction reference ID.
6. Click **"Save Payment"**. This reduces the client's outstanding balance immediately.

---

## 12. Stock History & Adjustments Log (સ્ટોક ડાયરી)
Review all manual stock corrections, audit actions, and system logs.

* Whenever inventory is added or subtracted manually, an audit log is saved here.
* Shows: Date, Item Size, Category, Quantity Adjusted (+ or -), Action Type, and Audit Reason. Use this to detect inventory leakage.

---

## 13. Challan Designer (ટેમ્પલેટ ડિઝાઇનર)
A custom canvas layout designer to edit print formats.

### 🎨 How to design your challan:
1. Open the **Challan Designer**.
2. You will see an A4 template editor.
3. **Customize Headings:** Edit your company logo, company name, address, contact details, GSTIN, and Terms & Conditions.
4. **Column Options:** Turn columns (e.g. Rate, Total, Driver, Vehicle No, Borrowed items) on or off using the toggle switches.
5. **Visual Customization:** Use the sizing and spacing controls to adjust text size, padding, and border thickness.
6. Click **"Save Design"** to apply this layout to all printouts.

---

## 14. System Settings & Data Backups (સેટિંગ્સ)
Manage business profiles, tax rates, standard hire prices, and database files.

### ⚙️ Setting Up Default Rates:
1. Navigate to **Settings (સેટિંગ્સ)**.
2. In **Rental Rates Configuration**:
   * Enter the default daily rent for Shuttering plates (applied to all plate sizes).
   * Enter default rates for Jacks of different sizes.
   * Enter default rates for Cuplocks.
3. Save. All new client dispatches will use these rates unless overridden.

### 💾 Backup & Restore:
* **Create Backup:** Click **"Export Database JSON"**. This compiles all your tables (Clients, Stock, Challans, Payments, Bills) into a single secure file. Download and save this file to your computer.
* **Restore Database:** Click **"Import Database JSON"** and upload a previously downloaded backup file to restore your entire database in case of hardware loss.

---

## 15. Advanced Logic: FIFO "Jama First" vs. Accumulative Billing
Understanding how Khata Kendra computes rental bills.

### Option A: FIFO ("Jama First" Mode)
Matches returns to the oldest deliveries. This is standard in rental industries.

* **Example:**
  * Day 1: You deliver **100 plates**.
  * Day 10: You deliver **50 plates**.
  * Day 15: The client returns **60 plates**.
  * **Calculation:** The 60 returned plates match the Day 1 delivery. Rent stops for 60 plates on Day 15 (billed for 14 days). The remaining 40 plates (from Day 1) and 50 plates (from Day 10) continue to run up to the billing end date.

### Option B: Regular Mode (Accumulative)
Accumulates all outstanding quantities over time. Good for simple billing periods without staggered intermediate returns.

* **Calculation:** The system calculates overall net outstanding quantities for each day in the billing range and multiplies it directly by the daily rate.
