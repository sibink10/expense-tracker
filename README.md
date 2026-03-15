# Qubiqon Finance Hub v2

Multi-tenant finance management platform for **Qubiqon Consulting India Ltd**.

## Modules

| Module | Description | Roles |
|--------|-------------|-------|
| **Employee Expenses** | Request → Approve → Bill attach → Payment release | Employee, Approver, Finance |
| **Advance Payments** | Request → Approve → Disburse (no proof needed, admin-capped) | Employee, Approver, Finance |
| **Vendor Payments** | Finance submits bill → Approve → Pay vendor (auto-email + CC) | Finance, Approver |
| **Client Invoicing** | Create invoice with line items + GST + TDS → Send → Mark paid | Finance |
| **Administration** | Org settings, code formats, tax/GST config, email templates | Admin |

## Architecture

```
React SPA ──► ASP.NET Core 9 API ──► Azure SQL (Multi-tenant)
    │                │                    │
    ▼                ▼                    ▼
Entra ID SSO    App Insights         Blob Storage
                    │                (Attachments)
                    ▼
              Email (MailKit)
```

## Tech Stack

- **Backend**: .NET 9, C# 13, EF Core 9, FluentValidation
- **Frontend**: React 18, TypeScript, Vite, MSAL
- **Database**: Azure SQL (Serverless Gen5), Multi-tenant shared schema
- **Auth**: Microsoft Entra ID (Azure AD) SSO + RBAC
- **PDF**: QuestPDF (invoice generation matching Zoho Books format)
- **Email**: MailKit (payment confirmations, approvals, reminders)
- **Hosting**: Azure App Service, Blob Storage, Application Insights
- **IaC**: Azure Bicep, GitHub Actions CI/CD

## Project Structure

```
QubiqonFinanceHub/
├── src/
│   ├── QubiqonFinanceHub.API/          ── .NET 9 Backend
│   │   ├── Controllers/                REST endpoints (13 controllers)
│   │   ├── Models/Entities/            Domain models (15 entities)
│   │   ├── Models/Enums/               All enumerations
│   │   ├── DTOs/                       Request/response types
│   │   ├── Data/                       EF Core DbContext
│   │   ├── Services/Interfaces/        Service contracts
│   │   ├── Services/Implementations/   Business logic
│   │   ├── Middleware/                  Exception handler
│   │   ├── Extensions/                 DI registration
│   │   └── Program.cs                  Entry point
│   │
│   └── QubiqonFinanceHub.Web/          ── React Frontend
│       ├── src/App.jsx                 Complete prototype (700+ lines)
│       ├── src/main.tsx                MSAL + React entry
│       ├── index.html
│       └── package.json
│
├── scripts/
│   ├── 001_CreateSchema.sql            Base tables + seed data
│   └── 002_MultiTenant_Schema.sql      Multi-tenant extension (15 tables)
│
├── docs/
│   ├── invoice_generator.py            ReportLab PDF generator
│   └── email-templates/                4 HTML email templates
│
├── infra/infra.bicep                   Azure infrastructure
├── .github/workflows/deploy.yml        CI/CD pipeline
├── Dockerfile
└── README.md
```

## Database Schema (30 tables)

### Core
- `Organizations` — Tenant root (name, address, GSTIN, bank details, branding)
- `Employees` — Users synced from Entra ID with roles
- `OrganizationSettings` — Key-value config per tenant

### Expenses & Advances
- `ExpenseRequests` — Employee expense submissions with status workflow
- `AdvancePayments` — Advance requests with admin-configurable cap

### Vendor Payments
- `Vendors` — Vendor master with GSTIN, email
- `VendorBills` — Bills with TDS, payment terms, auto-generated codes

### Client Invoicing
- `Clients` — Client master with country, currency, tax type
- `Invoices` — Multi-currency invoices with overall TDS
- `InvoiceLineItems` — Line items with per-item GST

### Configuration
- `TaxConfigurations` — Admin-managed TDS + GST types (16 TDS + 12 GST presets)
- `ActivityComments` — Polymorphic audit trail for all modules
- `EmailTemplates` — Customizable notification templates per tenant
- `CodeSequences` — Auto-increment code generators

## API Endpoints (40+)

### Expenses: `POST /api/expenses`, `GET /api/expenses/my`, `POST /{id}/approve`, `POST /{id}/reject`, `POST /{id}/cancel`, `POST /{id}/pay`, `POST /{id}/attach`
### Advances: `POST /api/advances`, `GET /api/advances/my`, `POST /{id}/approve`, `POST /{id}/disburse`, `GET /employee/{empId}/history`
### Vendor Bills: `POST /api/bills`, `GET /api/bills`, `POST /{id}/approve`, `POST /{id}/pay`
### Invoices: `POST /api/invoices`, `GET /api/invoices`, `POST /{id}/send`, `POST /{id}/paid`, `GET /{id}/pdf`
### Vendors: `POST /api/vendors`, `PUT /{id}`, `GET /api/vendors`
### Clients: `POST /api/clients`, `PUT /{id}`, `GET /api/clients`
### Tax Config: `POST /api/tax-config`, `GET /api/tax-config`, `POST /{id}/toggle`
### Organization: `GET /api/organization`, `PUT /api/organization`, `GET /settings`, `POST /settings/{key}`

## Getting Started

```bash
# Backend
cd src/QubiqonFinanceHub.API
dotnet run

# Frontend
cd src/QubiqonFinanceHub.Web
cp .env.example .env.local
npm install && npm run dev
```

## Deployment

```bash
# Infrastructure
az deployment group create -g qubiqon-rg -f infra/infra.bicep \
  --parameters sqlAdminUser=admin sqlAdminPassword=<pwd> \
               entraIdTenantId=<tid> entraIdClientId=<cid>

# Database
sqlcmd -S <server> -d QubiqonFinanceHub -i scripts/001_CreateSchema.sql
sqlcmd -S <server> -d QubiqonFinanceHub -i scripts/002_MultiTenant_Schema.sql

# Or push to main for automatic GitHub Actions deployment
```

## License

Proprietary — Qubiqon Consulting India Ltd. All rights reserved.
