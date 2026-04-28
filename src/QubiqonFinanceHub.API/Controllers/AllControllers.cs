using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Services.Interfaces;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace QubiqonFinanceHub.API.Controllers;



// ═══════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════
[ApiController, Route("api/auth"), Authorize]
public class AuthController(ITenantService tenant, FinanceHubDbContext db, IAzureRoleService azureRoleService) : ControllerBase
{
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        // Get claims from Azure AD token
        var oid = User.FindFirst("oid")?.Value ?? User.FindFirst("sub")?.Value;
        var email = User.FindFirst("preferred_username")?.Value ?? User.FindFirst("email")?.Value;
        var name = User.FindFirst("name")?.Value ?? email ?? "Unknown";
        var tid = User.FindFirst("tid")?.Value;

        // Find org by tenant ID
        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Id.ToString() == tid)
                  ?? await db.Organizations.FirstOrDefaultAsync(); // fallback to first org

        if (org == null) return NotFound("Organization not found");

        // Find or auto-provision employee
        var emp = await db.Employees.FirstOrDefaultAsync(e => e.EntraObjectId == oid);
        if (emp == null)
        {
            emp = new Employee
            {
                Id = Guid.Parse(oid!),
                OrganizationId = org.Id,
                EntraObjectId = oid!,
                FullName = name,
                Email = email ?? "",
                Role = UserRole.Employee,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                IsDelete = false
            };
            await azureRoleService.AssignRoleAsync(emp.EntraObjectId!, UserRole.Employee);
            db.Employees.Add(emp);
            await db.SaveChangesAsync();
        }

        if (emp.IsActive == false || emp.IsDelete == true)
            throw new Exception("You have been deactivated from the application or deleted from the application");  

        var parts = emp.FullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var initials = parts.Length >= 2
            ? $"{parts[0][0]}{parts[^1][0]}"
            : emp.FullName[..Math.Min(2, emp.FullName.Length)];

        return Ok(new CurrentUserDto(
            emp.Id, emp.FullName, emp.Email, emp.Department,
            emp.Designation, emp.Role, initials.ToUpper(), org.Id, org.OrgName
        ));
    }

    [HttpGet("debug-claims")]
    [AllowAnonymous]
    public IActionResult DebugClaims()
    {
        var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
        return Ok(new
        {
            isAuthenticated = User,
            claims
        });
    }
}



// ═══════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════
[ApiController, Route("api/dashboard"), Authorize]
public class DashboardController(IDashboardService dashboard) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] bool myOnly = false) => Ok(await dashboard.GetStatsAsync(myOnly));
}

// ═══════════════════════════════════════════════════
//  EXPENSES
// ═══════════════════════════════════════════════════
[ApiController, Route("api/expenses"), Authorize]
public class ExpensesController(IExpenseService svc) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreateExpenseRequest dto)
    {
        var result = await svc.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromForm] UpdateExpenseRequest dto)
    {
        var result = await svc.UpdateAsync(id, dto);
        return Ok(result);
    }
    [HttpPost("{id:guid}/upload-bill")]
    public async Task<IActionResult> UploadBill(Guid id, [FromForm] UploadBillRequest dto)
    {
        var result = await svc.UploadBillAsync(id, dto);
        return Ok(result);
    }

    [HttpGet("{id:guid}/bill")]
    public async Task<IActionResult> GetBillUrl(Guid id)
    {
        var result = await svc.GetBillUrlAsync(id);
        return Ok(new { url = result });
    }
    [HttpGet("{id:guid}/documents/{documentId:guid}")]
    public async Task<IActionResult> GetBillDocumentUrl(Guid id, Guid documentId)
    {
        var result = await svc.GetDocumentUrlAsync(id, documentId);
        return Ok(new { url = result });
    }
    [HttpDelete("{id:guid}/documents/{documentId:guid}")]
    public async Task<IActionResult> RemoveDocument(Guid id, Guid documentId)
    {
        await svc.RemoveDocumentAsync(id, documentId);
        return NoContent();
    }
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) { var r = await svc.GetByIdAsync(id); return r != null ? Ok(r) : NotFound(); }
    [HttpGet("my")] public async Task<IActionResult> ListMine([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f, true));
    [HttpGet, Authorize(Roles = "Approver,Finance,Admin")]
    public async Task<IActionResult> ListAll([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));
    [HttpPost("{id:guid}/approve"), Authorize(Roles = "Approver,Admin")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRequest dto) => Ok(await svc.ApproveAsync(id, dto));
    [HttpPost("{id:guid}/reject"), Authorize(Roles = "Approver,Admin")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequest dto) => Ok(await svc.RejectAsync(id, dto));
    [HttpPost("{id:guid}/cancel")] public async Task<IActionResult> Cancel(Guid id) => Ok(await svc.CancelAsync(id));
    [HttpPost("{id:guid}/pay"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> Pay(Guid id, [FromBody] ProcessPaymentRequest dto) => Ok(await svc.ProcessPaymentAsync(id, dto));
    [HttpPost("{id:guid}/attach")] public async Task<IActionResult> Attach(Guid id, [FromBody] string url) { await svc.AttachBillAsync(id, url); return Ok(); }
}

// ═══════════════════════════════════════════════════
//  ADVANCES
// ═══════════════════════════════════════════════════
[ApiController, Route("api/advances"), Authorize]
public class AdvancesController(IAdvanceService svc) : ControllerBase
{
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateAdvanceRequest dto) => Ok(await svc.CreateAsync(dto));
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) { var r = await svc.GetByIdAsync(id); return r != null ? Ok(r) : NotFound(); }
    [HttpGet("my")] public async Task<IActionResult> ListMine([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f, true));
    [HttpGet, Authorize(Roles = "Approver,Finance,Admin")]
    public async Task<IActionResult> ListAll([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));
    [HttpGet("employee/{empId:guid}/history")] public async Task<IActionResult> History(Guid empId) => Ok(await svc.GetEmployeeHistoryAsync(empId));
    [HttpPost("{id:guid}/approve"), Authorize(Roles = "Approver,Admin")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRequest dto) => Ok(await svc.ApproveAsync(id, dto));
    [HttpPost("{id:guid}/reject"), Authorize(Roles = "Approver,Admin")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequest dto) => Ok(await svc.RejectAsync(id, dto));
    [HttpGet("{id:guid}/disburse/validate"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> ValidateDisburse(Guid id, [FromQuery] decimal paidAmount) => Ok(await svc.ValidateDisburseAsync(id, paidAmount));
    [HttpPost("{id:guid}/disburse"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> Disburse(Guid id, [FromBody] ProcessPaymentRequest dto) => Ok(await svc.DisburseAsync(id, dto));
    [HttpPost("{id:guid}/cancel")] public async Task<IActionResult> Cancel(Guid id) => Ok(await svc.CancelAsync(id));
}

// ═══════════════════════════════════════════════════
//  VENDORS
// ═══════════════════════════════════════════════════
[ApiController, Route("api/vendors"), Authorize]
public class VendorsController(IVendorService svc) : ControllerBase
{
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateVendorRequest dto) => Ok(await svc.CreateAsync(dto));
    [HttpPut("{id:guid}")] public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVendorRequest dto) => Ok(await svc.UpdateAsync(id, dto));
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) { var r = await svc.GetByIdAsync(id); return r != null ? Ok(r) : NotFound(); }
    [HttpGet] public async Task<IActionResult> List([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));
    [HttpDelete("{id:guid}")] public async Task<IActionResult> Delete(Guid id) { await svc.DeleteAsync(id); return NoContent(); }
}

// ═══════════════════════════════════════════════════
//  VENDOR BILLS
// ═══════════════════════════════════════════════════
[ApiController, Route("api/bills"), Authorize]
public class BillsController(IVendorBillService svc) : ControllerBase
{
    //[HttpPost, Authorize(Roles = "Finance,Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreateBillRequest dto)
    {
        var result = await svc.CreateAsync(dto);
        return Ok(result);
    }
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBillRequest dto)
    {
        var result = await svc.UpdateAsync(id, dto);
        return Ok(result);
    }
    [HttpPost("{id:guid}/upload-bill")]
    public async Task<IActionResult> UploadBill(Guid id, [FromForm] UploadVendorBillRequest dto)
    {
        var result = await svc.UploadBillAsync(id, dto);
        return Ok(result);
    }
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) { var r = await svc.GetByIdAsync(id); return r != null ? Ok(r) : NotFound(); }
    [HttpGet, Authorize(Roles = "Approver,Finance,Admin")]
    public async Task<IActionResult> List([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));
    [HttpPost("{id:guid}/approve"), Authorize(Roles = "Approver,Admin")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRequest dto) => Ok(await svc.ApproveAsync(id, dto));
    [HttpPost("{id:guid}/reject"), Authorize(Roles = "Approver,Admin")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequest dto) => Ok(await svc.RejectAsync(id, dto));
    [HttpPost("{id:guid}/pay"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> Pay(Guid id, [FromBody] ProcessPaymentRequest dto) => Ok(await svc.ProcessPaymentAsync(id, dto));
    [HttpGet("{id:guid}/attachment")]
    public async Task<IActionResult> GetAttachmentUrl(Guid id)
    {
        var result = await svc.GetAttachmentUrlAsync(id);
        return Ok(new { url = result });
    }
    [HttpGet("{id:guid}/documents/{documentId:guid}")]
    public async Task<IActionResult> GetDocumentUrl(Guid id, Guid documentId)
    {
        var result = await svc.GetDocumentUrlAsync(id, documentId);
        return Ok(new { url = result });
    }
    [HttpDelete("{id:guid}/documents/{documentId:guid}")]
    public async Task<IActionResult> RemoveDocument(Guid id, Guid documentId)
    {
        await svc.RemoveDocumentAsync(id, documentId);
        return NoContent();
    }
}

// ═══════════════════════════════════════════════════
//  CLIENTS
// ═══════════════════════════════════════════════════
[ApiController, Route("api/clients"), Authorize]
public class ClientsController(IClientService svc) : ControllerBase
{
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateClientRequest dto) => Ok(await svc.CreateAsync(dto));
    [HttpPut("{id:guid}")] public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClientRequest dto) => Ok(await svc.UpdateAsync(id, dto));
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) { var r = await svc.GetByIdAsync(id); return r != null ? Ok(r) : NotFound(); }
    [HttpGet] public async Task<IActionResult> List([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));
    [HttpDelete("{id:guid}")] public async Task<IActionResult> Delete(Guid id) { await svc.DeleteAsync(id); return NoContent(); }
}

// ═══════════════════════════════════════════════════
//  INVOICES
// ═══════════════════════════════════════════════════
//[ApiController, Route("api/invoices"), Authorize(Roles = "Finance,Admin")]
[ApiController, Route("api/invoices"), Authorize]
public class InvoicesController(IInvoiceService svc) : ControllerBase
{
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest dto) => Ok(await svc.CreateAsync(dto));
    [HttpPut("{id:guid}")] public async Task<IActionResult> Update(Guid id, [FromBody] UpdateInvoiceRequest dto) => Ok(await svc.UpdateAsync(id, dto));
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) { var r = await svc.GetByIdAsync(id); return r != null ? Ok(r) : NotFound(); }
    [HttpGet, Authorize(Roles = "Approver,Finance,Admin")]
    public async Task<IActionResult> List([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));
    [HttpGet("counts"), Authorize(Roles = "Approver,Finance,Admin")]
    public async Task<IActionResult> Counts() => Ok(await svc.GetStatusCountsAsync());
    [HttpPost("{id:guid}/send"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> Send(Guid id) => Ok(await svc.MarkSentAsync(id));
    [HttpPost("{id:guid}/paid"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> Paid(Guid id, [FromBody] ProcessPaymentRequest dto) => Ok(await svc.MarkPaidAsync(id, dto));
    [HttpGet("{id:guid}/pdf")] public async Task<IActionResult> Pdf(Guid id) { var pdf = await svc.GeneratePdfAsync(id); return File(pdf, "application/pdf"); }
}

// ═══════════════════════════════════════════════════
//  TAX CONFIG
// ═══════════════════════════════════════════════════
[ApiController, Route("api/tax-config"), Authorize(Roles = "Admin")]
public class TaxConfigController(ITaxConfigService svc) : ControllerBase
{
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateTaxConfigRequest dto) => Ok(await svc.CreateAsync(dto));
    [HttpGet] public async Task<IActionResult> List([FromQuery] string? type) => Ok(await svc.ListAsync(type));
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) { var r = await svc.GetByIdAsync(id); return r == null ? NotFound() : Ok(r); }
    [HttpPut("{id:guid}")] public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTaxConfigRequest dto) => Ok(await svc.UpdateAsync(id, dto));
    [HttpPost("{id:guid}/toggle")] public async Task<IActionResult> Toggle(Guid id) => Ok(await svc.ToggleActiveAsync(id));
}

// ═══════════════════════════════════════════════════
//  ORGANIZATION
// ═══════════════════════════════════════════════════
[ApiController, Route("api/organization"), Authorize(Roles = "Admin")]
public class OrganizationController(IOrganizationService svc) : ControllerBase
{

    [HttpPost] public async Task<IActionResult> Create([FromForm] CreateOrganizationRequest dto) => Ok(await svc.CreateAsync(dto));
    [HttpGet("all")] public async Task<IActionResult> List() => Ok(await svc.GetAllAsync());
    [HttpGet] public async Task<IActionResult> Get() => Ok(await svc.GetAsync());
    [HttpPut("{id:guid}")] public async Task<IActionResult> Update(Guid id, [FromForm] UpdateOrganizationRequest dto) => Ok(await svc.UpdateAsync(id, dto));
    [HttpGet("settings")] public async Task<IActionResult> Settings() => Ok(await svc.GetSettingsAsync());
    //[HttpPost("settings/{key}")] public async Task<IActionResult> SetSetting(string key, [FromBody] string value) { await svc.SetSettingAsync(key, value); return Ok(); }
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) => Ok(await svc.GetByIdAsync(id));
    [HttpPatch("{id:guid}/select")] public async Task<IActionResult> Select(Guid id) => Ok(await svc.SelectAsync(id));
}

// ═══════════════════════════════════════════════════
//  ORGANIZATION SETTINGS
// ═══════════════════════════════════════════════════
[ApiController, Route("api/settings/organization"), Authorize(Roles = "Admin")]
public class OrganizationSettingsController(IOrganizationSettingsService svc) : ControllerBase
{
    [HttpGet] public async Task<IActionResult> GetSettings() => Ok(await svc.GetSettingsAsync());
    [HttpPost("{key}")] public async Task<IActionResult> SetSetting(string key, [FromBody] string value) { await svc.SetSettingAsync(key, value); return Ok(); }
    [HttpPost("bulk")]public async Task<IActionResult> BulkSetSettings([FromBody] List<BulkSettingItemDto> settings) { await svc.BulkSetSettingsAsync(settings); return Ok(); }
}

// ═══════════════════════════════════════════════════
//  EMPLOYEES
// ═══════════════════════════════════════════════════

[ApiController, Route("api/employees"), Authorize(Roles = "Admin")]
public class EmployeesController(IEmployeeService svc) : ControllerBase
{
    [HttpGet] public async Task<IActionResult> List([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) { var r = await svc.GetByIdAsync(id); return r != null ? Ok(r) : NotFound(); }
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateEmployeeRequest dto) => Ok(await svc.CreateAsync(dto));
    [HttpPut("{id:guid}")] public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmployeeRequest dto) => Ok(await svc.UpdateAsync(id, dto));
    [HttpPost("{id:guid}/toggle")] public async Task<IActionResult> Toggle(Guid id) => Ok(await svc.ToggleActiveAsync(id));
    [HttpPatch("{id:guid}/delete")] public async Task<IActionResult> Delete(Guid id) => Ok(await svc.DeleteAsync(id));
}

// ═══════════════════════════════════════════════════
//  CATEGORY
// ═══════════════════════════════════════════════════
[ApiController, Route("api/categories"), Authorize]
public class CategoryController(ICategoryService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List() => Ok(await svc.GetAllAsync());
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var r = await svc.GetByIdAsync(id);
        return r != null ? Ok(r) : NotFound();
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest dto) => Ok(await svc.CreateAsync(dto));

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryRequest dto) => Ok(await svc.UpdateAsync(id, dto));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await svc.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("{id:guid}/toggle")]
    public async Task<IActionResult> Toggle(Guid id) => Ok(await svc.ToggleActiveAsync(id));
}

// ═══════════════════════════════════════════════════
//  PAYMENT TERMS
// ═══════════════════════════════════════════════════
[ApiController, Route("api/payment-terms"), Authorize]
public class PaymentTermsController(IPaymentTermService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List() => Ok(await svc.GetAllAsync());

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var r = await svc.GetByIdAsync(id);
        return r != null ? Ok(r) : NotFound();
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreatePaymentTermRequest dto) => Ok(await svc.CreateAsync(dto));

    [HttpPut("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePaymentTermRequest dto) => Ok(await svc.UpdateAsync(id, dto));

    [HttpDelete("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await svc.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("{id:guid}/toggle"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Toggle(Guid id) => Ok(await svc.ToggleActiveAsync(id));
}

// ═══════════════════════════════════════════════════
//  ACCOUNTS
// ═══════════════════════════════════════════════════
[ApiController, Route("api/accounts"), Authorize]
public class AccountsController(IAccountService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List() => Ok(await svc.GetAllAsync());

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var r = await svc.GetByIdAsync(id);
        return r != null ? Ok(r) : NotFound();
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateAccountRequest dto) => Ok(await svc.CreateAsync(dto));

    [HttpPut("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAccountRequest dto) => Ok(await svc.UpdateAsync(id, dto));

    [HttpDelete("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await svc.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("{id:guid}/toggle"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Toggle(Guid id) => Ok(await svc.ToggleActiveAsync(id));
}



// ═══════════════════════════════════════════════════
//  EXCEL UPLOAD (COLUMNS DISCOVERY)
// ═══════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════
//  HEALTH
// ═══════════════════════════════════════════════════
[ApiController, Route("api/health")]
public class HealthController : ControllerBase
{
    [HttpGet, AllowAnonymous]
    public IActionResult Get() => Ok(new { status = "Healthy", service = "Qubiqon Finance Hub", version = "2.0.0", timestamp = DateTime.UtcNow });
}


