# Enterprise Rent-A-Car Portal
### EECS 3421 – Group Project

A full-stack web application for managing an Enterprise Rent-A-Car database. Built with **Next.js** and **Azure SQL Server**.

---

## Features

- **Dashboard** — live stats (customers, available vehicles, active reservations, revenue)
- **Management Queries** — run all 10 analytical SQL queries from the project directly in the browser
- **Reservations** — create, view, edit, and cancel reservations
- **Customers** — full CRUD with loyalty account info
- **Fleet** — manage vehicles, filter by status and branch
- **Employees** — manage staff and roles
- **Branches** — manage branch locations
- **Payments** — record and view payments
- **Maintenance** — log and track vehicle service records

---

## Prerequisites

- [Node.js 18+](https://nodejs.org)
- An Azure SQL Server database with the schema loaded (see below)

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/nowayitsali/enterprise-car-rental-portal.git
cd enterprise-car-rental-portal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

In Azure Portal, open your SQL Database → **Query editor** and paste in the contents of `completed_file.sql`.

This will create all the tables and load the sample data.

### 4. Configure environment variables

Create a `.env.local` file in the root of the project:

```
DB_SERVER=your-server.database.windows.net
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
```

Find these in: **Azure Portal → SQL Database → Connection strings → ADO.NET tab**

> ⚠️ Never commit `.env.local` — it's already in `.gitignore`

### 5. Whitelist your IP

Azure Portal → SQL Server → **Networking** → Add your client IP under Firewall rules.

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
├── lib/db.js                  # Azure SQL connection pool (mssql)
├── pages/
│   ├── index.js               # React frontend
│   └── api/
│       ├── dashboard.js       # Live stats
│       ├── queries/[num].js   # All 10 management queries
│       ├── customers/
│       ├── employees/
│       ├── branches/
│       ├── vehicles/
│       ├── reservations/
│       ├── payments/
│       └── maintenance/
├── styles/globals.css
├── completed_file.sql         # Full DB schema + sample data
└── .env.local.example         # Environment variable template
```

---

## Tech Stack

- **Frontend** — Next.js (Pages Router), React, CSS
- **Backend** — Next.js API Routes
- **Database** — Microsoft Azure SQL Server
- **Driver** — [mssql](https://www.npmjs.com/package/mssql)
