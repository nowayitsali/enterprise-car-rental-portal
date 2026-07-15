# Enterprise Rent-A-Car – Setup Guide (Next.js)

## Prerequisites
- Node.js 18+ (https://nodejs.org)

## 1. Install dependencies
```
npm install
```

## 2. Set up environment variables
Copy `.env.local.example` to `.env.local` and fill in your Azure SQL credentials:

```
DB_SERVER=your-server.database.windows.net
DB_NAME=EnterpriseRentACarDB
DB_USER=your-username
DB_PASSWORD=your-password
```

Find these in: Azure Portal → SQL Database → Connection strings → ADO.NET tab

## 3. Make sure your IP is whitelisted
Azure Portal → SQL Server → Networking → Add your client IP

## 4. Run the dev server
```
npm run dev
```

Open http://localhost:3000

## Project Structure
```
3421 Project/
├── lib/db.js                  ← mssql connection pool
├── pages/
│   ├── index.js               ← React frontend (all tabs)
│   ├── _app.js
│   └── api/
│       ├── dashboard.js
│       ├── queries/[num].js   ← All 10 management queries
│       ├── customers/
│       ├── employees/
│       ├── branches/
│       ├── vehicles/
│       ├── reservations/
│       ├── payments/
│       ├── maintenance/
│       ├── vehicle-classes.js
│       ├── addons.js
│       └── promo-codes.js
├── styles/globals.css
├── package.json
└── completed_file.sql
```
