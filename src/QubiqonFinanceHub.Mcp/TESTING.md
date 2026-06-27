# Testing the Finance Hub MCP server

A step-by-step guide to run the MCP server locally and confirm it works, using the
**MCP Inspector** (a browser tool that lets you click through MCP tools).

## What you need first
- **.NET 9 SDK** — check with `dotnet --version` (should print `9.x`).
- **Node.js** (for `npx`) — check with `node --version`.
- **A valid Entra ID access token** for the chatbot app
  (audience `api://fad88ee9-4a38-43c9-9a66-cece733f6d3e`). How to obtain this token is
  out of scope here — ask whoever set up the Azure app registration. You just paste it later.

## The big picture
There are **two servers** plus the **Inspector**:

```
Inspector (browser)  ──Bearer token──►  MCP server (:7301)  ──►  Finance API (:7201)  ──►  database
```

- The **Finance API** is only needed when you actually *call a tool* (to get real data).
- Listing the tools works with just the MCP server running.

---

## Step 1 — Start the Finance API
Open a terminal and run:

```bash
cd src/QubiqonFinanceHub.API
dotnet run
```

Wait until you see `Now listening on: https://localhost:7201`.
Leave this terminal open. To check it's alive, open https://localhost:7201/swagger in a browser.

## Step 2 — Start the MCP server
Open a **second** terminal and run:

```bash
cd src/QubiqonFinanceHub.Mcp
dotnet run
```

Wait until you see `Now listening on: https://localhost:7301` (and `http://localhost:5301`).
Leave this terminal open too.

## Step 3 — Start the MCP Inspector
Open a **third** terminal and run:

```bash
npx @modelcontextprotocol/inspector
```

The first time it will download the tool. It then prints a URL like
`http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=...`. Open that URL in your browser.

## Step 4 — Connect the Inspector to the MCP server
In the Inspector UI (left-hand panel):

1. **Transport Type**: choose **Streamable HTTP**.
2. **URL**: enter `http://localhost:5301`
   (the plain-http port — avoids browser warnings about the self-signed https certificate).
3. Open the **Authentication** section and paste your token into the **Bearer Token** field.
4. Click **Connect**.

If the token is valid you'll see the connection turn green / "Connected".
If you skip the token or it's wrong, you'll get **401 Unauthorized** — that's the auth working,
not a bug.

## Step 5 — List the tools
Click the **Tools** tab, then **List Tools**. You should see **10** read-only tools:

`list_my_expenses`, `list_all_expenses`, `get_expense`, `list_my_advances`,
`list_vendor_bills`, `list_invoices`, `get_invoice`, `dashboard_summary`,
`list_vendors`, `list_clients`.

> Reaching this step proves the MCP server, your token, and the protocol all work —
> even without the Finance API.

## Step 6 — Call a tool (real data)
Make sure **Step 1 (the API)** is running, then:

1. Click a tool, e.g. **`list_my_expenses`**.
2. Fill in **all** the input fields — even the ones that look optional:
   - `status` → leave the box empty (just click in it), but **don't remove the field**
   - `page` → `1`
   - `pageSize` → `5`
   - **Why:** the tool parameters have no default values, so the server treats every field as
     **required**. Leaving `status` out entirely causes
     `missing a value for the required parameter 'status'`.
3. Click **Run Tool**. You should see JSON with your expense items.

Good tools to try first:
- `list_my_expenses` — your own expenses (works for any user).
- `dashboard_summary` — set `myOnly` = `true`, `reportCurrency` = `INR`.
- `list_all_expenses` — only returns data if your account has the
  **Approver / Finance / Admin** role; otherwise it returns **403** (also a correct result).

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| **`dotnet run` seems to "keep building" / never shows `Now listening`** | A previous server instance is still running and holding the port, so startup crashes with `Failed to bind to address ... address already in use`. See the note below. |
| **401 Unauthorized** when connecting | Missing/expired/wrong token. Paste a fresh valid token. |
| `missing a value for the required parameter 'status'` | Fill in every input field (see Step 6). |
| Tool call fails but listing works | The **Finance API (:7201)** isn't running — start Step 1. |
| `403` from `list_all_expenses` etc. | Your account lacks the required role. Expected behaviour. |
| Browser warns about the certificate | Use the **http** URL `http://localhost:5301` in Step 4. |

### Note — "port already in use" (server won't start)
If `dotnet run` builds but never prints `Now listening on: https://localhost:7301`, a previous
instance is usually still running and holding ports **7301 / 5301**. (Closing a terminal tab
without pressing `Ctrl+C` leaves the process alive.) The build succeeds, then startup crashes with:

```
Failed to bind to address https://127.0.0.1:7301: address already in use.
```

Find and kill whatever holds the port, then re-run (PowerShell):

```powershell
Get-NetTCPConnection -LocalPort 7301,5301 -State Listen | Select LocalPort, OwningProcess
Stop-Process -Id <PID> -Force
```

Tip: this server lives in `src/QubiqonFinanceHub.Mcp` (ports 7301/5301). The **Finance API** is a
different project in `src/QubiqonFinanceHub.API` (port 7201) — don't confuse the two directories.

## Stopping everything
Press `Ctrl+C` in each of the three terminals.
