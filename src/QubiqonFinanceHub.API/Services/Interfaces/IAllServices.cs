using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;

namespace QubiqonFinanceHub.API.Services.Interfaces;

public interface ITenantService
{
    Guid GetCurrentOrganizationId();
    Guid GetCurrentEmployeeId();
    Task<Employee> GetCurrentEmployeeAsync();
    Task<Organization> GetCurrentOrganizationAsync();
}

public interface ICodeGeneratorService
{
    Task<string> GenerateCodeAsync(Guid orgId, string sequenceType);
}

public interface IExpenseService
{
    Task<ExpenseDto> CreateAsync(CreateExpenseRequest dto);
    Task<ExpenseDto?> GetByIdAsync(Guid id);
    Task<PaginatedResult<ExpenseDto>> ListAsync(FilterParams filters, bool myOnly = false);
    Task<ExpenseDto> ApproveAsync(Guid id, ApproveRequest dto);
    Task<ExpenseDto> RejectAsync(Guid id, RejectRequest dto);
    Task<ExpenseDto> CancelAsync(Guid id);
    Task<ExpenseDto> ProcessPaymentAsync(Guid id, ProcessPaymentRequest dto);
    Task AttachBillAsync(Guid id, string attachmentUrl);
}

public interface IAdvanceService
{
    Task<AdvanceDto> CreateAsync(CreateAdvanceRequest dto);
    Task<AdvanceDto?> GetByIdAsync(Guid id);
    Task<PaginatedResult<AdvanceDto>> ListAsync(FilterParams filters, bool myOnly = false);
    Task<AdvanceDto> ApproveAsync(Guid id, ApproveRequest dto);
    Task<AdvanceDto> RejectAsync(Guid id, RejectRequest dto);
    Task<AdvanceDto> DisburseAsync(Guid id, ProcessPaymentRequest dto);
    Task<List<AdvanceDto>> GetEmployeeHistoryAsync(Guid employeeId);
}

public interface IVendorService
{
    Task<VendorDto> CreateAsync(CreateVendorRequest dto);
    Task<VendorDto> UpdateAsync(Guid id, UpdateVendorRequest dto);
    Task<VendorDto?> GetByIdAsync(Guid id);
    Task<List<VendorDto>> ListAsync();
}

public interface IVendorBillService
{
    Task<BillDto> CreateAsync(CreateBillRequest dto, string? attachmentUrl);
    Task<BillDto?> GetByIdAsync(Guid id);
    Task<PaginatedResult<BillDto>> ListAsync(FilterParams filters);
    Task<BillDto> ApproveAsync(Guid id, ApproveRequest dto);
    Task<BillDto> RejectAsync(Guid id, RejectRequest dto);
    Task<BillDto> ProcessPaymentAsync(Guid id, ProcessPaymentRequest dto);
}

public interface IClientService
{
    Task<ClientDto> CreateAsync(CreateClientRequest dto);
    Task<ClientDto> UpdateAsync(Guid id, UpdateClientRequest dto);
    Task<ClientDto?> GetByIdAsync(Guid id);
    Task<List<ClientDto>> ListAsync();
}

public interface IInvoiceService
{
    Task<InvoiceDto> CreateAsync(CreateInvoiceRequest dto);
    Task<InvoiceDto?> GetByIdAsync(Guid id);
    Task<PaginatedResult<InvoiceDto>> ListAsync(FilterParams filters);
    Task<InvoiceDto> MarkSentAsync(Guid id);
    Task<InvoiceDto> MarkPaidAsync(Guid id, ProcessPaymentRequest dto);
    Task<byte[]> GeneratePdfAsync(Guid id);
}

public interface ITaxConfigService
{
    Task<TaxConfigDto> CreateAsync(CreateTaxConfigRequest dto);
    Task<List<TaxConfigDto>> ListAsync(string? type = null);
    Task<TaxConfigDto> ToggleActiveAsync(Guid id);
}

public interface IOrganizationService
{
    Task<OrganizationDto> GetAsync();
    Task<OrganizationDto> UpdateAsync(UpdateOrganizationRequest dto);
    Task<Dictionary<string, string>> GetSettingsAsync();
    Task SetSettingAsync(string key, string value);
}

public interface IEmailService
{
    Task SendNotificationAsync(string templateKey, Dictionary<string, string> variables, string toEmail, string? ccEmails = null, string? attachmentPath = null);
}

public interface IDashboardService
{
    Task<DashboardDto> GetStatsAsync(bool myOnly = false);
}

public interface IEmployeeService
{
    Task<List<EmployeeDto>> ListAsync();
    Task<EmployeeDto?> GetByIdAsync(Guid id);
    Task<EmployeeDto> CreateAsync(CreateEmployeeRequest dto);
    Task<EmployeeDto> UpdateAsync(Guid id, UpdateEmployeeRequest dto);
    Task<EmployeeDto> ToggleActiveAsync(Guid id);
}
