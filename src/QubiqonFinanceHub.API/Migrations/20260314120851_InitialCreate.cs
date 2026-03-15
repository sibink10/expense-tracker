using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Clients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ContactPerson = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Country = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    TaxType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    GSTIN = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clients", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CodeSequences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SequenceType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    LastNumber = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CodeSequences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Organizations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    LegalName = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Slug = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    LogoUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    PrimaryColor = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: false),
                    AccentColor = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: false),
                    AddressLine1 = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    AddressLine2 = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    State = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Country = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PinCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    GSTIN = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    PAN = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: true),
                    CIN = table.Column<string>(type: "nvarchar(25)", maxLength: 25, nullable: true),
                    TAN = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: true),
                    ContactPersonName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ContactEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ContactPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Website = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    BankAccountName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    BankAccountNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    BankIFSC = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: true),
                    BankName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    BankBranch = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    BankSWIFT = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: true),
                    Plan = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    MaxUsers = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Organizations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Vendors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    GSTIN = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vendors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmailTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TemplateKey = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    HtmlBody = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailTemplates_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Employees",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EntraObjectId = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Department = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Designation = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    EmployeeCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Employees_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrganizationSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Key = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrganizationSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrganizationSettings_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaxConfigurations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Rate = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    Section = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    SubType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaxConfigurations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaxConfigurations_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AdvancePayments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AdvanceCode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Purpose = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PaymentReference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DisbursedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdvancePayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdvancePayments_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ExpenseRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExpenseCode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SubmittedByEmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Purpose = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    RequiredByDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    AttachmentUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    PaymentReference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpenseRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExpenseRequests_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Invoices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InvoiceCode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ClientId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    SubTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalGST = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TaxConfigId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TaxAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Total = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    InvoiceDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PaymentTerms = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PurchaseOrder = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    TotalInWords = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PaymentReference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedByEmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Invoices_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Invoices_TaxConfigurations_TaxConfigId",
                        column: x => x.TaxConfigId,
                        principalTable: "TaxConfigurations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "VendorBills",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BillCode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    VendorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TaxConfigId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TDSAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalPayable = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    BillDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PaymentTerms = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    AttachmentUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    CCEmails = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    SubmittedByEmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PaymentReference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorBills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorBills_TaxConfigurations_TaxConfigId",
                        column: x => x.TaxConfigId,
                        principalTable: "TaxConfigurations",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_VendorBills_Vendors_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Vendors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InvoiceLineItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InvoiceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LineNumber = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    HSNCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Rate = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    GSTConfigId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    GSTAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvoiceLineItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InvoiceLineItems_Invoices_InvoiceId",
                        column: x => x.InvoiceId,
                        principalTable: "Invoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_InvoiceLineItems_TaxConfigurations_GSTConfigId",
                        column: x => x.GSTConfigId,
                        principalTable: "TaxConfigurations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ActivityComments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExpenseRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    VendorBillId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AdvancePaymentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    InvoiceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CommentByEmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    ActionType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivityComments_AdvancePayments_AdvancePaymentId",
                        column: x => x.AdvancePaymentId,
                        principalTable: "AdvancePayments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ActivityComments_Employees_CommentByEmployeeId",
                        column: x => x.CommentByEmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ActivityComments_ExpenseRequests_ExpenseRequestId",
                        column: x => x.ExpenseRequestId,
                        principalTable: "ExpenseRequests",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ActivityComments_Invoices_InvoiceId",
                        column: x => x.InvoiceId,
                        principalTable: "Invoices",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ActivityComments_VendorBills_VendorBillId",
                        column: x => x.VendorBillId,
                        principalTable: "VendorBills",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActivityComments_AdvancePaymentId",
                table: "ActivityComments",
                column: "AdvancePaymentId",
                filter: "[AdvancePaymentId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityComments_CommentByEmployeeId",
                table: "ActivityComments",
                column: "CommentByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityComments_ExpenseRequestId",
                table: "ActivityComments",
                column: "ExpenseRequestId",
                filter: "[ExpenseRequestId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityComments_InvoiceId",
                table: "ActivityComments",
                column: "InvoiceId",
                filter: "[InvoiceId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityComments_VendorBillId",
                table: "ActivityComments",
                column: "VendorBillId",
                filter: "[VendorBillId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AdvancePayments_EmployeeId",
                table: "AdvancePayments",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_AdvancePayments_OrganizationId_AdvanceCode",
                table: "AdvancePayments",
                columns: new[] { "OrganizationId", "AdvanceCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Clients_OrganizationId",
                table: "Clients",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_CodeSequences_OrganizationId_SequenceType",
                table: "CodeSequences",
                columns: new[] { "OrganizationId", "SequenceType" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmailTemplates_OrganizationId_TemplateKey",
                table: "EmailTemplates",
                columns: new[] { "OrganizationId", "TemplateKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Employees_OrganizationId_Email",
                table: "Employees",
                columns: new[] { "OrganizationId", "Email" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Employees_OrganizationId_EntraObjectId",
                table: "Employees",
                columns: new[] { "OrganizationId", "EntraObjectId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExpenseRequests_EmployeeId",
                table: "ExpenseRequests",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_ExpenseRequests_OrganizationId_ExpenseCode",
                table: "ExpenseRequests",
                columns: new[] { "OrganizationId", "ExpenseCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExpenseRequests_OrganizationId_Status_CreatedAt",
                table: "ExpenseRequests",
                columns: new[] { "OrganizationId", "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceLineItems_GSTConfigId",
                table: "InvoiceLineItems",
                column: "GSTConfigId");

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceLineItems_InvoiceId_LineNumber",
                table: "InvoiceLineItems",
                columns: new[] { "InvoiceId", "LineNumber" });

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_ClientId",
                table: "Invoices",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_OrganizationId_InvoiceCode",
                table: "Invoices",
                columns: new[] { "OrganizationId", "InvoiceCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_OrganizationId_Status",
                table: "Invoices",
                columns: new[] { "OrganizationId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_TaxConfigId",
                table: "Invoices",
                column: "TaxConfigId");

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_Slug",
                table: "Organizations",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationSettings_OrganizationId_Key",
                table: "OrganizationSettings",
                columns: new[] { "OrganizationId", "Key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaxConfigurations_OrganizationId_Type_IsActive",
                table: "TaxConfigurations",
                columns: new[] { "OrganizationId", "Type", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_VendorBills_OrganizationId_BillCode",
                table: "VendorBills",
                columns: new[] { "OrganizationId", "BillCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VendorBills_OrganizationId_Status",
                table: "VendorBills",
                columns: new[] { "OrganizationId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_VendorBills_TaxConfigId",
                table: "VendorBills",
                column: "TaxConfigId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorBills_VendorId",
                table: "VendorBills",
                column: "VendorId");

            migrationBuilder.CreateIndex(
                name: "IX_Vendors_OrganizationId",
                table: "Vendors",
                column: "OrganizationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActivityComments");

            migrationBuilder.DropTable(
                name: "CodeSequences");

            migrationBuilder.DropTable(
                name: "EmailTemplates");

            migrationBuilder.DropTable(
                name: "InvoiceLineItems");

            migrationBuilder.DropTable(
                name: "OrganizationSettings");

            migrationBuilder.DropTable(
                name: "AdvancePayments");

            migrationBuilder.DropTable(
                name: "ExpenseRequests");

            migrationBuilder.DropTable(
                name: "VendorBills");

            migrationBuilder.DropTable(
                name: "Invoices");

            migrationBuilder.DropTable(
                name: "Employees");

            migrationBuilder.DropTable(
                name: "Vendors");

            migrationBuilder.DropTable(
                name: "Clients");

            migrationBuilder.DropTable(
                name: "TaxConfigurations");

            migrationBuilder.DropTable(
                name: "Organizations");
        }
    }
}
