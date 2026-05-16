using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationBankDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AccountNumber",
                schema: "dbo",
                table: "Organizations",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankAddress",
                schema: "dbo",
                table: "Organizations",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankName",
                schema: "dbo",
                table: "Organizations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IfscCode",
                schema: "dbo",
                table: "Organizations",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AccountNumber",
                schema: "dbo",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "BankAddress",
                schema: "dbo",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "BankName",
                schema: "dbo",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "IfscCode",
                schema: "dbo",
                table: "Organizations");
        }
    }
}
