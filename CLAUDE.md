# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Qubiqon Finance Hub v2 is a multi-tenant finance management platform for Qubiqon Consulting India Ltd, covering expenses, advances, vendor bills, client invoicing, forecasts, and admin/configuration. It has two parts:

- **`src/QubiqonFinanceHub.API`** — ASP.NET Core 9 (C# 13) Web API backend. This is the only project in `QubiqonFinanceHub.sln`.
- **`src/QubiqonFinanceHub.Web`** — React 18 + TypeScript + Vite SPA frontend. It is a standalone npm project, not part of the .NET solution.

Note: the README's architecture section is partly stale — auth does **not** use MSAL in the browser (see Frontend → Auth below), and the React app is a full multi-page SPA, not the single-file prototype the README describes.

## Backend (`src/QubiqonFinanceHub.API`)

### Commands

All commands run from `src/QubiqonFinanceHub.API` unless noted.

```bash
dotnet restore                  # restore packages (or run from repo root against the .sln)
dotnet build                    # build
dotnet run                      # run locally → https://localhost:7201 / http://localhost:5201, Swagger at /swagger
dotnet run --launch-profile Staging   # run with ASPNETCORE_ENVIRONMENT=Staging
```

There is **no test project** in the solution — there is nothing to run for tests.

### EF Core migrations

The project uses EF Core code-first migrations in `Migrations/`. The active context is `FinanceHubDbContext`.

```bash
dotnet ef migrations add <Name> --context FinanceHubDbContext
dotnet ef database update --context FinanceHubDbContext
```

Note: automatic migration on startup is **commented out** in `Program.cs` (`db.Database.MigrateAsync()` is disabled), so migrations must be applied manually. The `--context` flag is required because two `DbContext` classes exist (see below).

### Docker

`Dockerfile` builds and publishes the API, exposing port 8080. It expects to be built from the repo root (it copies `src/QubiqonFinanceHub.API/`).

### Architecture

#### Two DbContexts — use the right one

- **`Data/FinanceHubDbContext`** — the live, hand-curated context the app actually uses (registered in `Program.cs` / `ServiceCollectionExtensions.AddApplicationDatabase`). All services depend on this. Migrations target it.
- **`Data/AppDbContext` (and `Models/AppDbContext`)** — a large database-scaffolded context covering many non-finance tables (HRMS, project management, attendance, etc.) across other DB schemas. It reflects the shared company database but is **not wired into DI**. Don't add finance features here.

The underlying SQL Server database is shared across multiple Qubiqon products and partitioned by schema (`DbSchemas`): `dbo` (platform: Organizations, OrganizationSettings, Employees, EmailTemplates), `finance` (all finance-domain tables), plus `pm`, `qhrms`, `qscms` for other products. When mapping entities in `FinanceHubDbContext.OnModelCreating`, set the schema explicitly via `ToTable(name, DbSchemas.X)`.

#### Layering

Controllers → Services (Interfaces / Implementations) → `FinanceHubDbContext`. Controllers are thin and delegate to injected service interfaces. DTOs live in `DTOs/` (most in `AllDTOs.cs`); service contracts in `Services/Interfaces/IAllServices.cs`; business logic in `Services/Implementations/`. Stateless domain rules are factored into `Services/Helpers/` (e.g. `InvoiceStatusRules`, `VendorBillStatusRules`, `ClientGstValidation`). Service registration is centralized in `Extensions/ServiceCollectionExtensions.cs` — register new services there.

#### Multi-tenancy (critical)

Every finance query must be scoped to the caller's effective organization. Use `ITenantService` (`Services/Implementations/TenantService.cs`):
- `GetEffectiveOrganizationIdAsync()` — the org to scope by. Effective org = active override (`EmployeeOrganizationContext.ActiveOrganizationId`) if set, else the employee's home `OrganizationId` (rule encoded in `OrganizationContextResolver.ResolveEffective`). Result is cached per-request in `HttpContext.Items`.
- `GetCurrentEmployeeId()` / `GetCurrentUserEmail()` read from JWT claims (`NameIdentifier`/`oid`, `email`/`preferred_username`).
- A dev fallback employee/org (all-zero / `...0001` GUIDs) is returned when no authenticated user resolves — be aware this masks auth failures in local dev.

#### Authentication

Two layers, both in `Auth/`:
1. **`QubiqonSessionMiddleware`** (`Auth/Shared`) — runs before auth. Reads a session cookie, loads the session from `IAuthSessionStore`, refreshes Azure AD tokens via `IAzureTokenRefreshService`, and stashes the session/user in `HttpContext.Items`. This is the shared SSO layer that brokers Entra ID OAuth tokens.
2. **JWT Bearer** — the API validates an app-issued JWT (issuer `qubiqon-finance`, audience `qubiqon-finance-api`, signed with `GlobalAuth:AppJwtSecret`). `AppJwtService` mints these; `EmployeeProvisioningService` / `FinanceRoleResolver` provision employees and resolve roles from Azure.

Authorization uses role policies (`EmployeeOnly`, `ApproverOnly`, `FinanceOnly`, `AdminOnly`) and `[Authorize(Roles="...")]` on action methods. Roles: Employee, Approver, Finance, Admin.

#### External integrations

- **Microsoft Graph** (`GraphApiService`, `GraphApiController`) — user/directory data.
- **Zoho Sign** (`Services/Zoho/`, `ZohoController`) — e-signature on invoices; configured via `ZohoOptions` (`Zoho` config section) and the `ZohoSignClient` named HttpClient.
- **Azure Blob Storage** (`AzureBlobStorageService`) — attachments / bill images.
- **Email** via MailKit (`EmailService`, `Email` config section, Office 365 SMTP).
- **QuestPDF** (`Services/Pdf/`) — invoice PDF generation (matching Zoho Books layout); QuestPDF Professional license is set in `Program.cs`.
- **Currency rates** (`CurrencyRateService`) — multi-currency invoices, cached in `CurrencyRatesCache`.
- **Excel upload** (`ExcelUploadService`, ExcelDataReader) — bulk import.

#### Cross-cutting

- **Exceptions**: `Middleware/GlobalExceptionHandlerMiddleware` converts exceptions to HTTP responses — throw domain exceptions from services rather than returning error DTOs.
- **Validation**: FluentValidation with auto-validation.
- **Codes**: `CodeGeneratorService` + `CodeSequences` table generate sequential document codes (invoice/bill numbers, etc.) per tenant.
- **Logging**: Serilog → Console + Application Insights.
- **JSON**: enums serialize as strings; camelCase property names.

### Configuration

`appsettings.json` holds the SQL connection string, CORS origins, App Insights, and Email/SMTP settings. Required secrets that must be supplied (e.g. via user-secrets or environment) and will throw on startup if missing: `GlobalAuth:AppJwtSecret` and `GlobalAuth:OAuthRedirectUri` (must be an absolute URL). The deployed connection string and credentials currently live in `appsettings.json` — prefer environment/user-secrets overrides for anything sensitive rather than committing changes to that file.

### Database setup scripts

`scripts/001_CreateSchema.sql` and `scripts/002_MultiTenant_Schema.sql` are the original SQL bootstrap scripts. The schema is now maintained through EF migrations, so prefer migrations for new changes; the scripts remain for reference / fresh provisioning.

## Frontend (`src/QubiqonFinanceHub.Web`)

### Commands

Run from `src/QubiqonFinanceHub.Web`:

```bash
npm install
npm run dev          # Vite dev server on http://localhost:3000 (proxies /api → https://localhost:7201)
npm run build        # tsc -b && vite build (production)
npm run build:dev    # build with --mode development
npm run build:stage  # build with --mode staging
npm run preview      # serve a production build locally
```

There are no tests or lint scripts configured.

### Environment / API base URL

Env files live in `env/` (configured via `vite.config.ts` `envDir: 'env'`). Vite reads `.env.<mode>`; the real files (`.env.development`, `.env.staging`, `.env.production`) are git-ignored — copy from the matching `*.example`. The only variable is `VITE_API_BASE_URL` (the API origin, including `/api`). In local `npm run dev` the Vite proxy forwards `/api` to the local backend, but `VITE_API_BASE_URL` still drives the axios client, so set it to the API you intend to hit.

### Auth (no MSAL)

Browser auth is **cookie-session + app JWT**, brokered entirely by the backend — there is no MSAL/`@azure/msal` dependency. Flow (`src/shared/auth/sessionAuth.ts`):
- `redirectToLogin()` sends the browser to `GET {api}/auth/login?returnUrl=...`; the backend runs the Entra ID OAuth dance and sets the session cookie.
- `fetchAppToken()` calls `GET {api}/auth/token` (with `credentials: include`) to exchange that cookie for a short-lived app JWT, cached in memory with its expiry. A `403` throws `TokenForbiddenError` (user not authorized for this app).
- `logoutSession()` calls `POST {api}/auth/logout`.

### API client

All HTTP goes through the shared axios instance in `src/shared/api/client.ts` (`apiClient`, `withCredentials: true`). A request interceptor attaches the bearer token from the getter wired up by `AppContext` via `setApiTokenGetter(getAppAccessToken)`, and strips `Content-Type` for `FormData` uploads. A response interceptor retries once on `401` (re-fetching the token) then redirects to `/`, and normalizes backend error shapes (`detail`/`title`/`message`/`errors`) into a single `Error.message` — use `getApiErrorMessage(err, fallback)` when surfacing failures. Per-domain API modules live in `src/shared/api/*` and are re-exported from `src/shared/api/index.ts`.

### Structure & conventions

- **Routing**: `src/routes/index.tsx` defines a `createBrowserRouter` tree under a single `Layout`; route elements live in `src/pages/**`.
- **Pages vs. components**: `src/pages/**` are thin route wrappers; the actual UI/logic lives in matching `*PageContent.tsx` under `src/components/**` (grouped by domain: `expenses`, `bills`, `invoices`, `advances`, `vendors`, `clients`, `forecasts`, `admin/*`, etc.). Modals are co-located per domain.
- **State**: global app state is a single React context, `src/context/AppContext.tsx` (`useAppContext`) — holds the current user, org config/settings, and cached lists (expenses, bills, advances, invoices, vendors, clients). No Redux/query library.
- **Shared logic**: cross-cutting helpers and domain rules live in `src/shared/**` (e.g. `expensePermissions.ts`, `gstFinance.ts`, `invoicePdf.ts`, `dashboardVisibility.ts`, `nav.ts`, constants/types). Types are centralized in `src/types/index.ts`.
- **PDF/UX libs**: invoices render client-side via `jspdf` / `html2pdf.js` / `html2canvas`; toasts via `react-hot-toast`; selects via `react-select`; icons via `lucide-react`.

## MCP server (`src/QubiqonFinanceHub.Mcp`)

An ASP.NET Core 9 server (official C# MCP SDK, `ModelContextProtocol.AspNetCore`) that exposes the Finance API to an LLM chatbot over the Model Context Protocol. It is in `QubiqonFinanceHub.sln` and built/run like any .NET project (`dotnet run` → `https://localhost:7301`). Its consumer is the Python desktop chatbot at `../../HR_policy_agent` (PySide6 + Azure OpenAI).

### Design — thin, read-only passthrough

The MCP server **re-implements no auth, roles, or tenancy**. It translates each MCP tool call into an HTTP `GET` against the Finance API, carrying the signed-in user's Finance JWT, so every existing `[Authorize]` and `ITenantService` check applies unchanged. Pieces:
- `Program.cs` — validates the inbound Entra ID token (`Microsoft.Identity.Web` JWT bearer), wires the Streamable-HTTP MCP endpoint (`AddMcpServer().WithHttpTransport().WithToolsFromAssembly()`), and requires auth on `MapMcp()`.
- `Services/FinanceApiClient.cs` — per request: reads the inbound Entra bearer, calls `POST /api/auth/exchange` to mint the Finance JWT, caches it per user `oid` (until ~1 min before expiry), and attaches it to read calls.
- `Tools/FinanceReadTools.cs` — read-only `[McpServerTool]` methods (`list_my_expenses`, `list_all_expenses`, `get_expense`, `list_my_advances`, `list_vendor_bills`, `list_invoices`, `get_invoice`, `dashboard_summary`, `list_vendors`, `list_clients`). **No write/approve/pay tools are exposed.** Tools that hit role-gated endpoints (e.g. `list_all_expenses`) naturally return 403 for unauthorized users.

### Auth chain (the key integration)

```
chatbot ──MSAL interactive login──► Entra ID  (token for api://{ChatbotClientId}/access_as_user)
chatbot ──Bearer <entra-token>────► MCP server  (validates audience+tenant)
MCP server ──POST /api/auth/exchange (forwards entra-token)──► API  (TrustedAzureAccessTokenValidator)
API ──Finance JWT (role + org baked in)──► MCP server  ──GET /api/...──► API endpoints
```

`POST /api/auth/exchange` ([GlobalAuthController.cs](src/QubiqonFinanceHub.API/Controllers/GlobalAuthController.cs)) is the linchpin. `TrustedAzureAccessTokenValidator` requires the token's audience to be `{ClientId}` or `api://{ClientId}`, its `tid` to match `TrustedApps:TenantId`, and its calling-app id (`azp`/`appid`) to be listed in `TrustedApps:Apps`. The simplest setup uses **one app registration** as both the desktop public client and the exposed API.

### Setup required before it runs end-to-end

1. Create/choose the chatbot Entra app registration: expose scope `access_as_user`, set `"accessTokenAcceptedVersion": 2` in the manifest.
2. Put its ClientId into **both** `src/QubiqonFinanceHub.Mcp/appsettings.json` (`AzureAd:ClientId` + `Audience`) and the API's `appsettings.json` `TrustedApps:Apps` — both currently hold the placeholder `REPLACE_WITH_CHATBOT_APP_CLIENT_ID`. (An `"external"` trusted app already exists and could be reused instead of adding a new one.)
3. Set `FinanceApi:BaseUrl` in the MCP server config to the target API.
4. Test with the MCP Inspector (`npx @modelcontextprotocol/inspector`) using a valid token before connecting the chatbot.

Note: the package pins `ModelContextProtocol.AspNetCore` at a preview version; refresh with `dotnet add package ModelContextProtocol.AspNetCore` if restore drifts.
