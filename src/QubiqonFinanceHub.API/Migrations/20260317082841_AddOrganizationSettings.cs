using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OrganizationId1",
                table: "OrganizationSettings",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationSettings_OrganizationId1",
                table: "OrganizationSettings",
                column: "OrganizationId1");

            migrationBuilder.AddForeignKey(
                name: "FK_OrganizationSettings_Organizations_OrganizationId1",
                table: "OrganizationSettings",
                column: "OrganizationId1",
                principalTable: "Organizations",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrganizationSettings_Organizations_OrganizationId1",
                table: "OrganizationSettings");

            migrationBuilder.DropIndex(
                name: "IX_OrganizationSettings_OrganizationId1",
                table: "OrganizationSettings");

            migrationBuilder.DropColumn(
                name: "OrganizationId1",
                table: "OrganizationSettings");
        }
    }
}
