using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class MoveFinanceTablesToFinanceSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "finance");

            migrationBuilder.EnsureSchema(
                name: "dbo");

            migrationBuilder.RenameTable(
                name: "Vendors",
                newName: "Vendors",
                newSchema: "finance");

            migrationBuilder.RenameTable(
                name: "VendorBills",
                newName: "VendorBills",
                newSchema: "finance");

            migrationBuilder.RenameTable(
                name: "VendorBillLineItems",
                newName: "VendorBillLineItems",
                newSchema: "finance");

            migrationBuilder.RenameTable(
                name: "TaxConfigurations",
                newName: "TaxConfigurations",
                newSchema: "finance");

            migrationBuilder.RenameTable(
                name: "RequestDocuments",
                newName: "RequestDocuments",
                newSchema: "finance");

            migrationBuilder.RenameTable(
                name: "PaymentTerms",
                newName: "PaymentTerms",
                newSchema: "finance");

            migrationBuilder.RenameTable(
                name: "OrganizationSettings",
                newName: "OrganizationSettings",
                newSchema: "dbo");

            migrationBuilder.RenameTable(
                name: "Organizations",
                newName: "Organizations",
                newSchema: "dbo");

            migrationBuilder.RenameTable(
                name: "Invoices",
                newName: "Invoices",
                newSchema: "finance");

            migrationBuilder.RenameTable(
                name: "InvoiceLineItems",
                newName: "InvoiceLineItems",
                newSchema: "finance");

            migrationBuilder.RenameTable(
                name: "ExpenseRequests",
                newName: "ExpenseRequests",
                newSchema: "finance");

            migrationBuilder.RenameTable(
                name: "Employees",
                newName: "Employees",
                newSchema: "dbo");

            migrationBuilder.RenameTable(
                name: "EmailTemplates",
                newName: "EmailTemplates",
                newSchema: "finance");

            migrationBuilder.RenameTable(
                name: "CodeSequences",
                newName: "CodeSequences",
                newSchema: "finance");

            migrationBuilder.RenameTable(
                name: "Clients",
                newName: "Clients",
                newSchema: "finance");

            migrationBuilder.RenameTable(
                name: "Categories",
                newName: "Categories",
                newSchema: "finance");

            migrationBuilder.RenameTable(
                name: "AdvancePayments",
                newName: "AdvancePayments",
                newSchema: "finance");

            migrationBuilder.RenameTable(
                name: "ActivityComments",
                newName: "ActivityComments",
                newSchema: "finance");

            migrationBuilder.RenameTable(
                name: "Accounts",
                newName: "Accounts",
                newSchema: "finance");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameTable(
                name: "Vendors",
                schema: "finance",
                newName: "Vendors");

            migrationBuilder.RenameTable(
                name: "VendorBills",
                schema: "finance",
                newName: "VendorBills");

            migrationBuilder.RenameTable(
                name: "VendorBillLineItems",
                schema: "finance",
                newName: "VendorBillLineItems");

            migrationBuilder.RenameTable(
                name: "TaxConfigurations",
                schema: "finance",
                newName: "TaxConfigurations");

            migrationBuilder.RenameTable(
                name: "RequestDocuments",
                schema: "finance",
                newName: "RequestDocuments");

            migrationBuilder.RenameTable(
                name: "PaymentTerms",
                schema: "finance",
                newName: "PaymentTerms");

            migrationBuilder.RenameTable(
                name: "OrganizationSettings",
                schema: "dbo",
                newName: "OrganizationSettings");

            migrationBuilder.RenameTable(
                name: "Organizations",
                schema: "dbo",
                newName: "Organizations");

            migrationBuilder.RenameTable(
                name: "Invoices",
                schema: "finance",
                newName: "Invoices");

            migrationBuilder.RenameTable(
                name: "InvoiceLineItems",
                schema: "finance",
                newName: "InvoiceLineItems");

            migrationBuilder.RenameTable(
                name: "ExpenseRequests",
                schema: "finance",
                newName: "ExpenseRequests");

            migrationBuilder.RenameTable(
                name: "Employees",
                schema: "dbo",
                newName: "Employees");

            migrationBuilder.RenameTable(
                name: "EmailTemplates",
                schema: "finance",
                newName: "EmailTemplates");

            migrationBuilder.RenameTable(
                name: "CodeSequences",
                schema: "finance",
                newName: "CodeSequences");

            migrationBuilder.RenameTable(
                name: "Clients",
                schema: "finance",
                newName: "Clients");

            migrationBuilder.RenameTable(
                name: "Categories",
                schema: "finance",
                newName: "Categories");

            migrationBuilder.RenameTable(
                name: "AdvancePayments",
                schema: "finance",
                newName: "AdvancePayments");

            migrationBuilder.RenameTable(
                name: "ActivityComments",
                schema: "finance",
                newName: "ActivityComments");

            migrationBuilder.RenameTable(
                name: "Accounts",
                schema: "finance",
                newName: "Accounts");
        }
    }
}
