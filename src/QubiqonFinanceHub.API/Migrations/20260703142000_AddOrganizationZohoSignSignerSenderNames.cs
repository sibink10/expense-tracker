using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationZohoSignSignerSenderNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ZohoSignSignerName",
                schema: "dbo",
                table: "Organizations",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZohoSignSenderName",
                schema: "dbo",
                table: "Organizations",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ZohoSignSignerName",
                schema: "dbo",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "ZohoSignSenderName",
                schema: "dbo",
                table: "Organizations");
        }
    }
}
