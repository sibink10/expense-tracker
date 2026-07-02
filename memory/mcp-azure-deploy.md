---
name: mcp-azure-deploy
description: How the QubiqonFinanceHub.Mcp server is hosted on Azure App Service, plus the Compress-Archive zip-deploy pitfall
metadata:
  type: project
---

The MCP server (`src/QubiqonFinanceHub.Mcp`) is hosted on Azure App Service: app **finance-mcp**, resource group **qubiqon-finance-rg**, Linux, DOTNETCORE|9.0, subscription `poc-qubiqon`. Public URL: `https://finance-mcp-bxdafmfjdwafbnh7.southindia-01.azurewebsites.net`. The MCP endpoint is at the **root** (`MapMcp()` + `.RequireAuthorization()`), so an unauthenticated probe correctly returns **401** (not 404). Required App Settings (override appsettings.json): `FinanceApi__BaseUrl=https://api-dev-finance.qubiqon.io/api`, `ASPNETCORE_ENVIRONMENT=Production`. AzureAd ClientId/Audience `fad88ee9-4a38-43c9-9a66-cece733f6d3e`, tenant `cea95265-0690-4a6d-9251-e12e48630c60`.

**Why:** IDE right-click publish silently failed once (App Service kept serving the default hostingstart.html welcome page → every MCP route 404'd). The reliable path is `dotnet publish -c Release` → zip → `az webapp deploy --type zip`.

**How to apply:** Do NOT build the deploy zip with PowerShell `Compress-Archive` — it writes Windows backslash separators (`runtimes\win\...`) that break Kudu's Linux rsync with HTTP 400 (`failed to stat ... Invalid argument`). Build the zip with forward slashes instead (Python `zipfile`, or a tool that normalizes separators). Diagnose deploy issues with `az webapp log deployment show -g qubiqon-finance-rg -n finance-mcp`.
