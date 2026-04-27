using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;

namespace QubiqonFinanceHub.API.Services.Interfaces;

public interface ITenantService
{
    Guid GetCurrentEmployeeId();
    string? GetCurrentUserEmail();
    Task<Guid> GetCurrentOrganizationId();
    Task<Employee> GetCurrentEmployeeAsync();
    Task<Organization> GetCurrentOrganizationAsync();
}

public interface ICodeGeneratorService
{
    Task<string> GenerateCodeAsync(Guid orgId, string sequenceType); 
    Task<string> GenerateBillNumberAsync(Guid orgId, string type, string? countryCode = null);
}

public interface IExpenseService
{
    Task<ExpenseDto> CreateAsync(CreateExpenseRequest dto);
    Task<ExpenseDto> UpdateAsync(Guid id, UpdateExpenseRequest dto);
    Task<ExpenseDto> UploadBillAsync(Guid id, UploadBillRequest dto);
    Task<ExpenseDto?> GetByIdAsync(Guid id);
    Task<PaginatedResult<ExpenseDto>> ListAsync(FilterParams filters, bool myOnly = false);
    Task<ExpenseDto> ApproveAsync(Guid id, ApproveRequest dto);
    Task<ExpenseDto> RejectAsync(Guid id, RejectRequest dto);
    Task<ExpenseDto> CancelAsync(Guid id);
    Task<ExpenseDto> ProcessPaymentAsync(Guid id, ProcessPaymentRequest dto);
    Task AttachBillAsync(Guid id, string attachmentUrl);
    Task<string> GetBillUrlAsync(Guid id);
    Task<string> GetDocumentUrlAsync(Guid id, Guid documentId);
    Task RemoveDocumentAsync(Guid expenseId, Guid documentId);
}

public interface IAdvanceService
{
    Task<AdvanceDto> CreateAsync(CreateAdvanceRequest dto);
    Task<AdvanceDto?> GetByIdAsync(Guid id);
    Task<PaginatedResult<AdvanceDto>> ListAsync(FilterParams filters, bool myOnly = false);
    Task<AdvanceDto> ApproveAsync(Guid id, ApproveRequest dto);
    Task<AdvanceDto> RejectAsync(Guid id, RejectRequest dto);
    Task<AdvanceDto> DisburseAsync(Guid id, ProcessPaymentRequest dto);
    Task<AdvanceDisburseValidationDto> ValidateDisburseAsync(Guid id, decimal paidAmount);
    Task<List<AdvanceDto>> GetEmployeeHistoryAsync(Guid employeeId);
    Task<AdvanceDto> CancelAsync(Guid id);
}

public interface IVendorService
{
    Task<VendorDto> CreateAsync(CreateVendorRequest dto);
    Task<VendorDto> UpdateAsync(Guid id, UpdateVendorRequest dto);
    Task<VendorDto?> GetByIdAsync(Guid id);
    Task<PaginatedResult<VendorDto>> ListAsync(FilterParams f);
    Task DeleteAsync(Guid id);
}

public interface IVendorBillService
{
    Task<BillDto> CreateAsync(CreateBillRequest dto);
    Task<BillDto> UpdateAsync(Guid id, UpdateBillRequest dto);
    Task<BillDto> UploadBillAsync(Guid id, UploadVendorBillRequest dto);
    Task<BillDto?> GetByIdAsync(Guid id);
    Task<PaginatedResult<BillDto>> ListAsync(FilterParams filters);
    Task<BillDto> ApproveAsync(Guid id, ApproveRequest dto);
    Task<BillDto> RejectAsync(Guid id, RejectRequest dto);
    Task<BillDto> ProcessPaymentAsync(Guid id, ProcessPaymentRequest dto);
    Task<string> GetAttachmentUrlAsync(Guid id);
    Task<string> GetDocumentUrlAsync(Guid id, Guid documentId);
    Task RemoveDocumentAsync(Guid billId, Guid documentId);
}

public interface IClientService
{
    Task<ClientDto> CreateAsync(CreateClientRequest dto);
    Task<ClientDto> UpdateAsync(Guid id, UpdateClientRequest dto);
    Task<ClientDto?> GetByIdAsync(Guid id);
    Task<PaginatedResult<ClientDto>> ListAsync(FilterParams f);
    Task DeleteAsync(Guid id);
}

public interface IInvoiceService
{
    Task<InvoiceDto> CreateAsync(CreateInvoiceRequest dto);
    Task<InvoiceDto> UpdateAsync(Guid id, UpdateInvoiceRequest dto);
    Task<InvoiceDto?> GetByIdAsync(Guid id);
    Task<PaginatedResult<InvoiceDto>> ListAsync(FilterParams filters);
    Task<InvoiceStatusCountsDto> GetStatusCountsAsync();
    Task<InvoiceDto> MarkSentAsync(Guid id);
    Task<InvoiceDto> MarkPaidAsync(Guid id, ProcessPaymentRequest dto);
    Task<byte[]> GeneratePdfAsync(Guid id);
}

public interface ITaxConfigService
{
    Task<TaxConfigDto> CreateAsync(CreateTaxConfigRequest dto);
    Task<TaxConfigDto> UpdateAsync(Guid id, UpdateTaxConfigRequest dto);
    Task<TaxConfigDto?> GetByIdAsync(Guid id);
    Task<List<TaxConfigDto>> ListAsync(string? type = null);
    Task<TaxConfigDto> ToggleActiveAsync(Guid id);
}

public interface IOrganizationService
{
    Task<OrganizationDto> CreateAsync(CreateOrganizationRequest dto);
    Task<OrganizationDto> GetAsync();
    Task<OrganizationDto> UpdateAsync(Guid id, UpdateOrganizationRequest dto);
    Task<Dictionary<string, string>> GetSettingsAsync();
    Task<List<OrganizationDto>> GetAllAsync();
    Task SetSettingAsync(string key, string value);
    Task<OrganizationDto> GetByIdAsync(Guid id);
    Task<OrganizationDto> SelectAsync(Guid id);
}

public interface IOrganizationSettingsService
{
    Task<Dictionary<string, SettingDto>> GetSettingsAsync();
    Task SetSettingAsync(string key, string value);
    Task BulkSetSettingsAsync(List<BulkSettingItemDto> settings);
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
    Task<PaginatedResult<EmployeeDto>> ListAsync(FilterParams f);
    Task<EmployeeDto?> GetByIdAsync(Guid id);
    Task<EmployeeDto> CreateAsync(CreateEmployeeRequest dto);
    Task<EmployeeDto> UpdateAsync(Guid id, UpdateEmployeeRequest dto);
    Task<EmployeeDto> ToggleActiveAsync(Guid id);
    Task<EmployeeDto> DeleteAsync(Guid id);
}

public interface IStorageService
{
    Task<string> UploadAsync(string folder, Guid entityId, IFormFile file);
    Task DeleteAsync(string fileUrl);
    string GenerateSasUrl(string fileUrl, int expiryMinutes = 30);
}

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllAsync();
    Task<CategoryDto?> GetByIdAsync(Guid id);
    Task<CategoryDto> CreateAsync(CreateCategoryRequest dto);
    Task<CategoryDto> UpdateAsync(Guid id, UpdateCategoryRequest dto);
    Task DeleteAsync(Guid id);
    Task<CategoryDto> ToggleActiveAsync(Guid id);
}

public interface IExcelUploadService
{
    Task<List<string>> ReadExcelColumnsAsync(IFormFile file, CancellationToken ct = default);

    Task<(List<string> Columns, List<Dictionary<string, object?>> Rows)> ReadExcelAsync(
        IFormFile file,
        CancellationToken ct = default
    );
}

public interface IAzureRoleService
{
    Task AssignRoleAsync(string azureObjectId, UserRole role);
    Task RemoveAllRolesAsync(string azureObjectId);
    Task<string?> GetObjectIdByEmailAsync(string email);      // <-- fix return type
}