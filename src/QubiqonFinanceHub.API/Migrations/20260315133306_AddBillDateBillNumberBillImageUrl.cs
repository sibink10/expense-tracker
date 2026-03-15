using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class AddBillDateBillNumberBillImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RequiredByDate",
                table: "ExpenseRequests");

            migrationBuilder.RenameColumn(
                name: "AttachmentUrl",
                table: "ExpenseRequests",
                newName: "BillImageUrl");

            migrationBuilder.AddColumn<DateOnly>(
                name: "BillDate",
                table: "ExpenseRequests",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<string>(
                name: "BillNumber",
                table: "ExpenseRequests",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BillDate",
                table: "ExpenseRequests");

            migrationBuilder.DropColumn(
                name: "BillNumber",
                table: "ExpenseRequests");

            migrationBuilder.RenameColumn(
                name: "BillImageUrl",
                table: "ExpenseRequests",
                newName: "AttachmentUrl");

            migrationBuilder.AddColumn<DateTime>(
                name: "RequiredByDate",
                table: "ExpenseRequests",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }
    }
}
