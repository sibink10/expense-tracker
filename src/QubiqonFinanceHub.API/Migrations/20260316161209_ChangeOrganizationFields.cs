using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class ChangeOrganizationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Organizations_Slug",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "AccentColor",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "AddressLine1",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "BankAccountName",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "BankAccountNumber",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "BankIFSC",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "BankName",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "BankSWIFT",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "CIN",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "ContactEmail",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "MaxUsers",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "PAN",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "Plan",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "PrimaryColor",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "TAN",
                table: "Organizations");

            migrationBuilder.RenameColumn(
                name: "PinCode",
                table: "Organizations",
                newName: "PostalCode");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Organizations",
                newName: "OrgName");

            migrationBuilder.RenameColumn(
                name: "LegalName",
                table: "Organizations",
                newName: "PaymentAddress");

            migrationBuilder.RenameColumn(
                name: "GSTIN",
                table: "Organizations",
                newName: "Phone");

            migrationBuilder.RenameColumn(
                name: "ContactPhone",
                table: "Organizations",
                newName: "Fax");

            migrationBuilder.RenameColumn(
                name: "ContactPersonName",
                table: "Organizations",
                newName: "Industry");

            migrationBuilder.RenameColumn(
                name: "BankBranch",
                table: "Organizations",
                newName: "SubName");

            migrationBuilder.RenameColumn(
                name: "AddressLine2",
                table: "Organizations",
                newName: "Address");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Organizations",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Country",
                table: "Organizations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<bool>(
                name: "Selected",
                table: "Organizations",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Tenant",
                table: "Organizations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "UseSeparatePaymentAddress",
                table: "Organizations",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_OrgName",
                table: "Organizations",
                column: "OrgName",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Organizations_OrgName",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "Selected",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "Tenant",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "UseSeparatePaymentAddress",
                table: "Organizations");

            migrationBuilder.RenameColumn(
                name: "SubName",
                table: "Organizations",
                newName: "BankBranch");

            migrationBuilder.RenameColumn(
                name: "PostalCode",
                table: "Organizations",
                newName: "PinCode");

            migrationBuilder.RenameColumn(
                name: "Phone",
                table: "Organizations",
                newName: "GSTIN");

            migrationBuilder.RenameColumn(
                name: "PaymentAddress",
                table: "Organizations",
                newName: "LegalName");

            migrationBuilder.RenameColumn(
                name: "OrgName",
                table: "Organizations",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "Industry",
                table: "Organizations",
                newName: "ContactPersonName");

            migrationBuilder.RenameColumn(
                name: "Fax",
                table: "Organizations",
                newName: "ContactPhone");

            migrationBuilder.RenameColumn(
                name: "Address",
                table: "Organizations",
                newName: "AddressLine2");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Organizations",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<string>(
                name: "Country",
                table: "Organizations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AccentColor",
                table: "Organizations",
                type: "nvarchar(7)",
                maxLength: 7,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AddressLine1",
                table: "Organizations",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankAccountName",
                table: "Organizations",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankAccountNumber",
                table: "Organizations",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankIFSC",
                table: "Organizations",
                type: "nvarchar(15)",
                maxLength: 15,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankName",
                table: "Organizations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankSWIFT",
                table: "Organizations",
                type: "nvarchar(15)",
                maxLength: 15,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CIN",
                table: "Organizations",
                type: "nvarchar(25)",
                maxLength: 25,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactEmail",
                table: "Organizations",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Organizations",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "MaxUsers",
                table: "Organizations",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "PAN",
                table: "Organizations",
                type: "nvarchar(15)",
                maxLength: 15,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Plan",
                table: "Organizations",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PrimaryColor",
                table: "Organizations",
                type: "nvarchar(7)",
                maxLength: 7,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "Organizations",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TAN",
                table: "Organizations",
                type: "nvarchar(15)",
                maxLength: 15,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_Slug",
                table: "Organizations",
                column: "Slug",
                unique: true);
        }
    }
}
