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
public class AuthController(ITenantService tenant, FinanceHubDbContext db) : ControllerBase
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
                CreatedAt = DateTime.UtcNow
            };
            db.Employees.Add(emp);
            await db.SaveChangesAsync();
        }

        if (emp.IsActive == false)
            throw new Exception("You have been deactivated from the application");  

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
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) { var r = await svc.GetByIdAsync(id); return r != null ? Ok(r) : NotFound(); }
    [HttpGet("my")] public async Task<IActionResult> ListMine([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f, true));
    [HttpGet] public async Task<IActionResult> ListAll([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));
    [HttpPost("{id:guid}/approve")] public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRequest dto) => Ok(await svc.ApproveAsync(id, dto));
    [HttpPost("{id:guid}/reject")] public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequest dto) => Ok(await svc.RejectAsync(id, dto));
    [HttpPost("{id:guid}/cancel")] public async Task<IActionResult> Cancel(Guid id) => Ok(await svc.CancelAsync(id));
    [HttpPost("{id:guid}/pay")] public async Task<IActionResult> Pay(Guid id, [FromBody] ProcessPaymentRequest dto) => Ok(await svc.ProcessPaymentAsync(id, dto));
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
    [HttpGet] public async Task<IActionResult> ListAll([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));
    [HttpGet("employee/{empId:guid}/history")] public async Task<IActionResult> History(Guid empId) => Ok(await svc.GetEmployeeHistoryAsync(empId));
    [HttpPost("{id:guid}/approve")] public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRequest dto) => Ok(await svc.ApproveAsync(id, dto));
    [HttpPost("{id:guid}/reject")] public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequest dto) => Ok(await svc.RejectAsync(id, dto));
    [HttpPost("{id:guid}/disburse")] public async Task<IActionResult> Disburse(Guid id, [FromBody] ProcessPaymentRequest dto) => Ok(await svc.DisburseAsync(id, dto));
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
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) { var r = await svc.GetByIdAsync(id); return r != null ? Ok(r) : NotFound(); }
    [HttpGet] public async Task<IActionResult> List([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));
    [HttpPost("{id:guid}/approve")] public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRequest dto) => Ok(await svc.ApproveAsync(id, dto));
    [HttpPost("{id:guid}/reject")] public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequest dto) => Ok(await svc.RejectAsync(id, dto));
    [HttpPost("{id:guid}/pay")] public async Task<IActionResult> Pay(Guid id, [FromBody] ProcessPaymentRequest dto) => Ok(await svc.ProcessPaymentAsync(id, dto));
    [HttpGet("{id:guid}/attachment")]
    public async Task<IActionResult> GetAttachmentUrl(Guid id)
    {
        var result = await svc.GetAttachmentUrlAsync(id);
        return Ok(new { url = result });
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
}

// ═══════════════════════════════════════════════════
//  INVOICES
// ═══════════════════════════════════════════════════
//[ApiController, Route("api/invoices"), Authorize(Roles = "Finance,Admin")]
[ApiController, Route("api/invoices"), Authorize]
public class InvoicesController(IInvoiceService svc) : ControllerBase
{
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest dto) => Ok(await svc.CreateAsync(dto));
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) { var r = await svc.GetByIdAsync(id); return r != null ? Ok(r) : NotFound(); }
    [HttpGet] public async Task<IActionResult> List([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));
    [HttpPost("{id:guid}/send")] public async Task<IActionResult> Send(Guid id) => Ok(await svc.MarkSentAsync(id));
    [HttpPost("{id:guid}/paid")] public async Task<IActionResult> Paid(Guid id, [FromBody] ProcessPaymentRequest dto) => Ok(await svc.MarkPaidAsync(id, dto));
    [HttpGet("{id:guid}/pdf")] public async Task<IActionResult> Pdf(Guid id) { var pdf = await svc.GeneratePdfAsync(id); return File(pdf, "application/pdf"); }
}

// ═══════════════════════════════════════════════════
//  TAX CONFIG
// ═══════════════════════════════════════════════════
[ApiController, Route("api/tax-config"), Authorize]
public class TaxConfigController(ITaxConfigService svc) : ControllerBase
{
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateTaxConfigRequest dto) => Ok(await svc.CreateAsync(dto));
    [HttpGet] public async Task<IActionResult> List([FromQuery] string? type) => Ok(await svc.ListAsync(type));
    [HttpPost("{id:guid}/toggle")] public async Task<IActionResult> Toggle(Guid id) => Ok(await svc.ToggleActiveAsync(id));
}

// ═══════════════════════════════════════════════════
//  ORGANIZATION
// ═══════════════════════════════════════════════════
[ApiController, Route("api/organization"), Authorize]
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
[ApiController, Route("api/settings/organization"), Authorize]
public class OrganizationSettingsController(IOrganizationSettingsService svc) : ControllerBase
{
    [HttpGet] public async Task<IActionResult> GetSettings() => Ok(await svc.GetSettingsAsync());
    [HttpPost("{key}")] public async Task<IActionResult> SetSetting(string key, [FromBody] string value) { await svc.SetSettingAsync(key, value); return Ok(); }
    [HttpPost("bulk")]public async Task<IActionResult> BulkSetSettings([FromBody] List<BulkSettingItemDto> settings) { await svc.BulkSetSettingsAsync(settings); return Ok(); }
}

// ═══════════════════════════════════════════════════
//  EMPLOYEES
// ═══════════════════════════════════════════════════

[ApiController, Route("api/employees"), Authorize]
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
//  HEALTH
// ═══════════════════════════════════════════════════
[ApiController, Route("api/health")]
public class HealthController : ControllerBase
{
    [HttpGet, AllowAnonymous]
    public IActionResult Get() => Ok(new { status = "Healthy", service = "Qubiqon Finance Hub", version = "2.0.0", timestamp = DateTime.UtcNow });
}


