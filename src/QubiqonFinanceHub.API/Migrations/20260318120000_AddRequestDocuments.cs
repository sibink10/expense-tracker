using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using QubiqonFinanceHub.API.Data;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    [DbContext(typeof(FinanceHubDbContext))]
    [Migration("20260318120000_AddRequestDocuments")]
    public class AddRequestDocuments : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RequestDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExpenseRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    VendorBillId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UploadedByEmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(260)", maxLength: 260, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    FileUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RequestDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RequestDocuments_Employees_UploadedByEmployeeId",
                        column: x => x.UploadedByEmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RequestDocuments_ExpenseRequests_ExpenseRequestId",
                        column: x => x.ExpenseRequestId,
                        principalTable: "ExpenseRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RequestDocuments_VendorBills_VendorBillId",
                        column: x => x.VendorBillId,
                        principalTable: "VendorBills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RequestDocuments_ExpenseRequestId",
                table: "RequestDocuments",
                column: "ExpenseRequestId",
                filter: "[ExpenseRequestId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_RequestDocuments_OrganizationId_CreatedAt",
                table: "RequestDocuments",
                columns: new[] { "OrganizationId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_RequestDocuments_UploadedByEmployeeId",
                table: "RequestDocuments",
                column: "UploadedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_RequestDocuments_VendorBillId",
                table: "RequestDocuments",
                column: "VendorBillId",
                filter: "[VendorBillId] IS NOT NULL");

            migrationBuilder.Sql("""
                INSERT INTO [RequestDocuments] ([Id], [OrganizationId], [ExpenseRequestId], [VendorBillId], [UploadedByEmployeeId], [FileName], [ContentType], [FileSizeBytes], [FileUrl], [CreatedAt])
                SELECT
                    NEWID(),
                    [OrganizationId],
                    [Id],
                    NULL,
                    COALESCE([SubmittedByEmployeeId], [EmployeeId]),
                    RIGHT([BillImageUrl], CHARINDEX('/', REVERSE([BillImageUrl])) - 1),
                    NULL,
                    0,
                    [BillImageUrl],
                    COALESCE([UpdatedAt], [CreatedAt])
                FROM [ExpenseRequests]
                WHERE [BillImageUrl] IS NOT NULL AND LTRIM(RTRIM([BillImageUrl])) <> '';
                """);

            migrationBuilder.Sql("""
                INSERT INTO [RequestDocuments] ([Id], [OrganizationId], [ExpenseRequestId], [VendorBillId], [UploadedByEmployeeId], [FileName], [ContentType], [FileSizeBytes], [FileUrl], [CreatedAt])
                SELECT
                    NEWID(),
                    [OrganizationId],
                    NULL,
                    [Id],
                    [SubmittedByEmployeeId],
                    RIGHT([AttachmentUrl], CHARINDEX('/', REVERSE([AttachmentUrl])) - 1),
                    NULL,
                    0,
                    [AttachmentUrl],
                    COALESCE([UpdatedAt], [CreatedAt])
                FROM [VendorBills]
                WHERE [AttachmentUrl] IS NOT NULL AND LTRIM(RTRIM([AttachmentUrl])) <> '';
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RequestDocuments");
        }

        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder.HasAnnotation("ProductVersion", "9.0.0");
#pragma warning restore 612, 618
        }
    }
}
