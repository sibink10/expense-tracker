using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;

namespace QubiqonFinanceHub.API.Services.Helpers;

internal static class ListQuerySorting
{
    internal static string NormalizeSortKey(string? sortBy)
    {
        if (string.IsNullOrWhiteSpace(sortBy)) return "createdat";
        return sortBy.Trim().ToLowerInvariant().Replace(" ", "");
    }

    internal static IQueryable<ExpenseRequest> ApplyExpenseSorting(this IQueryable<ExpenseRequest> q, FilterParams f)
    {
        var desc = f.Desc;
        return NormalizeSortKey(f.SortBy) switch
        {
            "amount" => desc ? q.OrderByDescending(x => x.Amount) : q.OrderBy(x => x.Amount),
            "balancedue" or "balance" => desc ? q.OrderByDescending(x => x.Amount - x.PaidAmount) : q.OrderBy(x => x.Amount - x.PaidAmount),
            "expensecode" or "code" or "id" => desc ? q.OrderByDescending(x => x.ExpenseCode) : q.OrderBy(x => x.ExpenseCode),
            "purpose" => desc ? q.OrderByDescending(x => x.Purpose) : q.OrderBy(x => x.Purpose),
            "status" => desc ? q.OrderByDescending(x => x.Status) : q.OrderBy(x => x.Status),
            "employee" or "employeename" or "submittedby" => desc ? q.OrderByDescending(x => x.Employee.FullName) : q.OrderBy(x => x.Employee.FullName),
            "billdate" => desc ? q.OrderByDescending(x => x.BillDate) : q.OrderBy(x => x.BillDate),
            "createdat" or _ => desc ? q.OrderByDescending(x => x.CreatedAt) : q.OrderBy(x => x.CreatedAt),
        };
    }

    internal static IQueryable<Invoice> ApplyInvoiceSorting(this IQueryable<Invoice> q, FilterParams f)
    {
        var desc = f.Desc;
        return NormalizeSortKey(f.SortBy) switch
        {
            "invoicecode" or "code" => desc ? q.OrderByDescending(x => x.InvoiceCode) : q.OrderBy(x => x.InvoiceCode),
            "client" or "clientname" => desc ? q.OrderByDescending(x => x.Client.Name) : q.OrderBy(x => x.Client.Name),
            "total" or "amount" => desc ? q.OrderByDescending(x => x.Total) : q.OrderBy(x => x.Total),
            "balancedue" or "balance" => desc ? q.OrderByDescending(x => x.Total - x.paidAmound) : q.OrderBy(x => x.Total - x.paidAmound),
            "currency" => desc ? q.OrderByDescending(x => x.Currency) : q.OrderBy(x => x.Currency),
            "duedate" or "due" => desc ? q.OrderByDescending(x => x.DueDate) : q.OrderBy(x => x.DueDate),
            "invoicedate" => desc ? q.OrderByDescending(x => x.InvoiceDate) : q.OrderBy(x => x.InvoiceDate),
            "status" => desc ? q.OrderByDescending(x => x.Status) : q.OrderBy(x => x.Status),
            "createdat" or _ => desc ? q.OrderByDescending(x => x.CreatedAt) : q.OrderBy(x => x.CreatedAt),
        };
    }

    internal static IQueryable<VendorBill> ApplyVendorBillSorting(this IQueryable<VendorBill> q, FilterParams f)
    {
        var desc = f.Desc;
        return NormalizeSortKey(f.SortBy) switch
        {
            "billcode" or "code" => desc ? q.OrderByDescending(x => x.BillCode) : q.OrderBy(x => x.BillCode),
            "vendor" or "vendorname" => desc ? q.OrderByDescending(x => x.Vendor.Name) : q.OrderBy(x => x.Vendor.Name),
            "vendorbillnumber" => desc ? q.OrderByDescending(x => x.vendorBillNumber) : q.OrderBy(x => x.vendorBillNumber),
            "amount" => desc ? q.OrderByDescending(x => x.Amount) : q.OrderBy(x => x.Amount),
            "tds" or "tdsamount" => desc ? q.OrderByDescending(x => x.TDSAmount) : q.OrderBy(x => x.TDSAmount),
            "totalpayable" or "payable" => desc ? q.OrderByDescending(x => x.TotalPayable) : q.OrderBy(x => x.TotalPayable),
            "balancedue" or "balance" => desc ? q.OrderByDescending(x => x.TotalPayable - x.PaidAmount) : q.OrderBy(x => x.TotalPayable - x.PaidAmount),
            "duedate" or "due" => desc ? q.OrderByDescending(x => x.DueDate) : q.OrderBy(x => x.DueDate),
            "billdate" => desc ? q.OrderByDescending(x => x.BillDate) : q.OrderBy(x => x.BillDate),
            "status" => desc ? q.OrderByDescending(x => x.Status) : q.OrderBy(x => x.Status),
            "createdat" or _ => desc ? q.OrderByDescending(x => x.CreatedAt) : q.OrderBy(x => x.CreatedAt),
        };
    }

    internal static IQueryable<AdvancePayment> ApplyAdvanceSorting(this IQueryable<AdvancePayment> q, FilterParams f)
    {
        var desc = f.Desc;
        return NormalizeSortKey(f.SortBy) switch
        {
            "advancecode" or "code" or "id" => desc ? q.OrderByDescending(x => x.AdvanceCode) : q.OrderBy(x => x.AdvanceCode),
            "amount" => desc ? q.OrderByDescending(x => x.Amount) : q.OrderBy(x => x.Amount),
            "balancedue" or "balance" => desc ? q.OrderByDescending(x => x.Amount - x.PaidAmount) : q.OrderBy(x => x.Amount - x.PaidAmount),
            "purpose" => desc ? q.OrderByDescending(x => x.Purpose) : q.OrderBy(x => x.Purpose),
            "status" => desc ? q.OrderByDescending(x => x.Status) : q.OrderBy(x => x.Status),
            "employee" or "employeename" => desc ? q.OrderByDescending(x => x.Employee.FullName) : q.OrderBy(x => x.Employee.FullName),
            "createdat" or _ => desc ? q.OrderByDescending(x => x.CreatedAt) : q.OrderBy(x => x.CreatedAt),
        };
    }

    internal static IQueryable<Vendor> ApplyVendorSorting(this IQueryable<Vendor> q, FilterParams f)
    {
        var desc = f.Desc;
        return NormalizeSortKey(f.SortBy) switch
        {
            "email" => desc ? q.OrderByDescending(x => x.Email) : q.OrderBy(x => x.Email),
            "gstin" => desc ? q.OrderByDescending(x => x.GSTIN) : q.OrderBy(x => x.GSTIN),
            "contact" or "contactperson" => desc ? q.OrderByDescending(x => x.ContactPerson) : q.OrderBy(x => x.ContactPerson),
            "category" => desc ? q.OrderByDescending(x => x.Category) : q.OrderBy(x => x.Category),
            "name" or "vendor" => desc ? q.OrderByDescending(x => x.Name) : q.OrderBy(x => x.Name),
            "createdat" or _ => desc ? q.OrderByDescending(x => x.CreatedAt) : q.OrderBy(x => x.CreatedAt),
        };
    }

    internal static IQueryable<Client> ApplyClientSorting(this IQueryable<Client> q, FilterParams f)
    {
        var desc = f.Desc;
        return NormalizeSortKey(f.SortBy) switch
        {
            "email" => desc ? q.OrderByDescending(x => x.Email) : q.OrderBy(x => x.Email),
            "contactperson" or "contact" => desc ? q.OrderByDescending(x => x.ContactPerson) : q.OrderBy(x => x.ContactPerson),
            "country" => desc ? q.OrderByDescending(x => x.Country) : q.OrderBy(x => x.Country),
            "currency" => desc ? q.OrderByDescending(x => x.Currency) : q.OrderBy(x => x.Currency),
            "customertype" or "type" => desc ? q.OrderByDescending(x => x.CustomerType) : q.OrderBy(x => x.CustomerType),
            "name" or "client" => desc ? q.OrderByDescending(x => x.Name) : q.OrderBy(x => x.Name),
            "createdat" or _ => desc ? q.OrderByDescending(x => x.CreatedAt) : q.OrderBy(x => x.CreatedAt),
        };
    }

    internal static IQueryable<Employee> ApplyEmployeeSorting(this IQueryable<Employee> q, FilterParams f)
    {
        var desc = f.Desc;
        return NormalizeSortKey(f.SortBy) switch
        {
            "email" => desc ? q.OrderByDescending(e => e.Email) : q.OrderBy(e => e.Email),
            "department" or "dept" => desc ? q.OrderByDescending(e => e.Department) : q.OrderBy(e => e.Department),
            "role" => desc ? q.OrderByDescending(e => e.Role) : q.OrderBy(e => e.Role),
            "isactive" or "status" => desc ? q.OrderByDescending(e => e.IsActive) : q.OrderBy(e => e.IsActive),
            "fullname" or "name" => desc ? q.OrderByDescending(e => e.FullName) : q.OrderBy(e => e.FullName),
            "createdat" or _ => desc ? q.OrderByDescending(e => e.CreatedAt) : q.OrderBy(e => e.CreatedAt),
        };
    }
}
