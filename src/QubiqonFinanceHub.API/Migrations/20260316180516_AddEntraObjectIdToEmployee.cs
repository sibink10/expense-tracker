using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class AddEntraObjectIdToEmployee : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Employees_OrganizationId_EntraObjectId",
                table: "Employees");

            migrationBuilder.AlterColumn<string>(
                name: "EntraObjectId",
                table: "Employees",
                type: "nvarchar(36)",
                maxLength: 36,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(36)",
                oldMaxLength: 36);

            migrationBuilder.CreateIndex(
                name: "IX_Employees_OrganizationId_EntraObjectId",
                table: "Employees",
                columns: new[] { "OrganizationId", "EntraObjectId" },
                unique: true,
                filter: "[EntraObjectId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Employees_OrganizationId_EntraObjectId",
                table: "Employees");

            migrationBuilder.AlterColumn<string>(
                name: "EntraObjectId",
                table: "Employees",
                type: "nvarchar(36)",
                maxLength: 36,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(36)",
                oldMaxLength: 36,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Employees_OrganizationId_EntraObjectId",
                table: "Employees",
                columns: new[] { "OrganizationId", "EntraObjectId" },
                unique: true);
        }
    }
}
