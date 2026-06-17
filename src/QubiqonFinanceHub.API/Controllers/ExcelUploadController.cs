using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Controllers;

public class ExcelUploadRequest
{
    public IFormFile File { get; set; } = null!;
}

[ApiController, Route("api/excel-upload")]
public class ExcelUploadController(IExcelUploadService excel, FinanceHubDbContext db, ITenantService tenant) : ControllerBase
{
    [HttpPost("vendor-bills/columns")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> GetVendorBillColumns([FromForm] ExcelUploadRequest request, CancellationToken ct = default)
    {
        if (request.File == null || request.File.Length <= 0) return BadRequest("File is required");

        var (_, rows) = await excel.ReadExcelAsync(request.File, ct);
        var columns = rows
            .SelectMany(r => r.Keys)
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(c => c)
            .ToList();

        return Ok(new
        {
            count = columns.Count,
            columns
        });
    }

    [HttpPost("vendors/import")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImportVendors([FromForm] ExcelUploadRequest request, [FromQuery] int? take = null, CancellationToken ct = default)
    {
        if (request.File == null || request.File.Length <= 0) return BadRequest("File is required");
        if (take.HasValue && take.Value <= 0) return BadRequest("take must be >= 1");

        var orgId = await tenant.GetCurrentOrganizationId();
        var (_, rows) = await excel.ReadExcelAsync(request.File, ct);

        var inserted = 0;
        var skipped = 0;
        var errors = new List<string>();
        var results = new List<object>();

        var existing = await db.Vendors.AsNoTracking()
            .Where(v => v.OrganizationId == orgId && !v.IsDelete)
            .Select(v => new { v.Name, v.Email })
            .ToListAsync(ct);
        var existingNames = existing
            .Select(x => (x.Name ?? "").Trim().ToLower())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToHashSet();
        var existingEmails = existing
            .Select(x => (x.Email ?? "").Trim().ToLower())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToHashSet();

        var pending = new List<Vendor>();

        var excelRowNumber = 1;
        foreach (var r in rows)
        {
            excelRowNumber++;
            ct.ThrowIfCancellationRequested();

            var type = GetCellString(r, "Type");
            if (string.Equals(type, "Employee", StringComparison.OrdinalIgnoreCase))
            {
                skipped++;
                continue;
            }

            var companyName = GetCellString(r, "Company Name");
            var displayName = GetCellString(r, "Display Name");
            var vendorName = (!string.IsNullOrWhiteSpace(companyName) ? companyName : displayName)?.Trim() ?? "";

            var firstName = GetCellString(r, "First Name");
            var lastName = GetCellString(r, "Last Name");
            var fullName = string.Join(" ", new[] { firstName, lastName }.Where(x => !string.IsNullOrWhiteSpace(x))).Trim();

            var phone = GetCellString(r, "Phone");
            var mobile = GetCellString(r, "MobilePhone");
            var phoneNumber = (!string.IsNullOrWhiteSpace(phone) ? phone : mobile)?.Trim() ?? "";

            var contactPerson = "";

            var gstin = (GetCellString(r, "GST Identification Number (GSTIN)") ?? "").Trim();

            var address = JoinLines(
                GetCellString(r, "Billing Attention"),
                GetCellString(r, "Billing Address"),
                GetCellString(r, "Billing Street2"),
                GetCellString(r, "Billing City"),
                GetCellString(r, "Billing State"),
                GetCellString(r, "Billing Country"),
                GetCellString(r, "Billing Code")
            ).Trim();

            var bankName = (GetCellString(r, "Vendor Bank Name") ?? "").Trim();
            var accountNumber = (GetCellString(r, "Vendor Bank Account Number") ?? "").Trim();
            var ifsc = (GetCellString(r, "Vendor Bank Code") ?? "").Trim();

            var email = GetCellString(r, "EmailID");
            if (string.IsNullOrWhiteSpace(email)) email = GetCellString(r, "Email");
            email = (email ?? "").Trim();
            if (string.IsNullOrWhiteSpace(email)) email = "";
            if (string.IsNullOrWhiteSpace(address)) address = "";

            if (string.IsNullOrWhiteSpace(vendorName))
            {
                skipped++;
                results.Add(new
                {
                    row = excelRowNumber,
                    inserted = false,
                    skipped = true,
                    reason = "Missing required field (name)",
                    vendor = new { name = vendorName, email, address }
                });
                continue;
            }

            var nameLower = vendorName.ToLower();
            var emailLower = string.IsNullOrWhiteSpace(email) ? "" : email.ToLower();
            var exists = existingNames.Contains(nameLower) || (!string.IsNullOrWhiteSpace(emailLower) && existingEmails.Contains(emailLower));

            if (exists)
            {
                skipped++;
                results.Add(new { row = excelRowNumber, inserted = false, skipped = true, reason = "Vendor already exists (name/email match)" });
                continue;
            }

            try
            {
                var v = new Vendor
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    Name = vendorName,
                    Email = email,
                    Address = address,
                    Phone = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber,
                    ContactPerson = string.IsNullOrWhiteSpace(contactPerson) ? null : contactPerson,
                    GSTIN = string.IsNullOrWhiteSpace(gstin) ? null : gstin,
                    BankName = string.IsNullOrWhiteSpace(bankName) ? null : bankName,
                    AccountNumber = string.IsNullOrWhiteSpace(accountNumber) ? null : accountNumber,
                    IfscCode = string.IsNullOrWhiteSpace(ifsc) ? null : ifsc,
                    IsActive = true,
                    IsDelete = false,
                    CreatedAt = DateTime.UtcNow
                };

                pending.Add(v);
                existingNames.Add(nameLower);
                if (!string.IsNullOrWhiteSpace(emailLower)) existingEmails.Add(emailLower);

                if (pending.Count >= 200)
                {
                    db.Vendors.AddRange(pending);
                    await db.SaveChangesAsync(ct);
                    pending.Clear();
                }

                inserted++;
                results.Add(new { row = excelRowNumber, inserted = true, name = vendorName, email });
            }
            catch (Exception ex)
            {
                skipped++;
                errors.Add($"Row {excelRowNumber}: {ex.Message}");
                results.Add(new { row = excelRowNumber, inserted = false, skipped = true, reason = "DB error" });
            }

            if (take.HasValue && inserted >= take.Value) break;
        }

        if (pending.Count > 0)
        {
            db.Vendors.AddRange(pending);
            await db.SaveChangesAsync(ct);
        }

        return Ok(new { inserted, skipped, errors, results });
    }

    private static string? GetCellString(Dictionary<string, object?> row, string column)
    {
        return row.TryGetValue(column, out var v) ? (v?.ToString() ?? "").Trim() : null;
    }

    private static string JoinLines(params string?[] parts)
    {
        var lines = parts
            .Select(p => (p ?? "").Trim())
            .Where(p => !string.IsNullOrWhiteSpace(p))
            .ToList();
        return string.Join("\n", lines);
    }
}
