using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationZohoCredentials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ZohoAuthorizationEndpoint",
                schema: "dbo",
                table: "Organizations",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZohoClientId",
                schema: "dbo",
                table: "Organizations",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZohoClientSecret",
                schema: "dbo",
                table: "Organizations",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZohoCode",
                schema: "dbo",
                table: "Organizations",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZohoDataCenter",
                schema: "dbo",
                table: "Organizations",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZohoHomePage",
                schema: "dbo",
                table: "Organizations",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZohoRedirectUri",
                schema: "dbo",
                table: "Organizations",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZohoRefreshToken",
                schema: "dbo",
                table: "Organizations",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZohoScope",
                schema: "dbo",
                table: "Organizations",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZohoSignApiBaseUrl",
                schema: "dbo",
                table: "Organizations",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZohoTokenEndpoint",
                schema: "dbo",
                table: "Organizations",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ZohoAuthorizationEndpoint",
                schema: "dbo",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "ZohoClientId",
                schema: "dbo",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "ZohoClientSecret",
                schema: "dbo",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "ZohoCode",
                schema: "dbo",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "ZohoDataCenter",
                schema: "dbo",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "ZohoHomePage",
                schema: "dbo",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "ZohoRedirectUri",
                schema: "dbo",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "ZohoRefreshToken",
                schema: "dbo",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "ZohoScope",
                schema: "dbo",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "ZohoSignApiBaseUrl",
                schema: "dbo",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "ZohoTokenEndpoint",
                schema: "dbo",
                table: "Organizations");
        }
    }
}
