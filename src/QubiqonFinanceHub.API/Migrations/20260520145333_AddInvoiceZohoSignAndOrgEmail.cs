using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoiceZohoSignAndOrgEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ZohoSignEmail",
                schema: "dbo",
                table: "Organizations",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SignatureRequestedAt",
                schema: "finance",
                table: "Invoices",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SignedAt",
                schema: "finance",
                table: "Invoices",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SignedPdfUrl",
                schema: "finance",
                table: "Invoices",
                type: "nvarchar(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZohoSignRequestId",
                schema: "finance",
                table: "Invoices",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZohoSignStatus",
                schema: "finance",
                table: "Invoices",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ZohoSignStatusUpdatedAt",
                schema: "finance",
                table: "Invoices",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ZohoSignEmail",
                schema: "dbo",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "SignatureRequestedAt",
                schema: "finance",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "SignedAt",
                schema: "finance",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "SignedPdfUrl",
                schema: "finance",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ZohoSignRequestId",
                schema: "finance",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ZohoSignStatus",
                schema: "finance",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ZohoSignStatusUpdatedAt",
                schema: "finance",
                table: "Invoices");
        }
    }
}
