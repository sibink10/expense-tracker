using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class AddForecastManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ForecastId",
                schema: "finance",
                table: "RequestDocuments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ForecastId",
                schema: "finance",
                table: "ExpenseRequests",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ForecastId",
                schema: "finance",
                table: "ActivityComments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Forecasts",
                schema: "finance",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Purpose = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExpectedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ExpectedExpenseDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedByEmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Forecasts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Forecasts_Employees_CreatedByEmployeeId",
                        column: x => x.CreatedByEmployeeId,
                        principalSchema: "dbo",
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RequestDocuments_ForecastId",
                schema: "finance",
                table: "RequestDocuments",
                column: "ForecastId",
                filter: "[ForecastId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ExpenseRequests_ForecastId",
                schema: "finance",
                table: "ExpenseRequests",
                column: "ForecastId",
                filter: "[ForecastId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityComments_ForecastId",
                schema: "finance",
                table: "ActivityComments",
                column: "ForecastId",
                filter: "[ForecastId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Forecasts_CreatedByEmployeeId",
                schema: "finance",
                table: "Forecasts",
                column: "CreatedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Forecasts_OrganizationId_Status_CreatedAt",
                schema: "finance",
                table: "Forecasts",
                columns: new[] { "OrganizationId", "Status", "CreatedAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_ActivityComments_Forecasts_ForecastId",
                schema: "finance",
                table: "ActivityComments",
                column: "ForecastId",
                principalSchema: "finance",
                principalTable: "Forecasts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ExpenseRequests_Forecasts_ForecastId",
                schema: "finance",
                table: "ExpenseRequests",
                column: "ForecastId",
                principalSchema: "finance",
                principalTable: "Forecasts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RequestDocuments_Forecasts_ForecastId",
                schema: "finance",
                table: "RequestDocuments",
                column: "ForecastId",
                principalSchema: "finance",
                principalTable: "Forecasts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActivityComments_Forecasts_ForecastId",
                schema: "finance",
                table: "ActivityComments");

            migrationBuilder.DropForeignKey(
                name: "FK_ExpenseRequests_Forecasts_ForecastId",
                schema: "finance",
                table: "ExpenseRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_RequestDocuments_Forecasts_ForecastId",
                schema: "finance",
                table: "RequestDocuments");

            migrationBuilder.DropTable(
                name: "Forecasts",
                schema: "finance");

            migrationBuilder.DropIndex(
                name: "IX_RequestDocuments_ForecastId",
                schema: "finance",
                table: "RequestDocuments");

            migrationBuilder.DropIndex(
                name: "IX_ExpenseRequests_ForecastId",
                schema: "finance",
                table: "ExpenseRequests");

            migrationBuilder.DropIndex(
                name: "IX_ActivityComments_ForecastId",
                schema: "finance",
                table: "ActivityComments");

            migrationBuilder.DropColumn(
                name: "ForecastId",
                schema: "finance",
                table: "RequestDocuments");

            migrationBuilder.DropColumn(
                name: "ForecastId",
                schema: "finance",
                table: "ExpenseRequests");

            migrationBuilder.DropColumn(
                name: "ForecastId",
                schema: "finance",
                table: "ActivityComments");
        }
    }
}
