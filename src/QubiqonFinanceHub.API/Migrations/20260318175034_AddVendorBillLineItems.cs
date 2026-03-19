using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class AddVendorBillLineItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "VendorBillLineItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VendorBillId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LineNumber = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Account = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Rate = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    GSTConfigId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CustomerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorBillLineItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorBillLineItems_Clients_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorBillLineItems_TaxConfigurations_GSTConfigId",
                        column: x => x.GSTConfigId,
                        principalTable: "TaxConfigurations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorBillLineItems_VendorBills_VendorBillId",
                        column: x => x.VendorBillId,
                        principalTable: "VendorBills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VendorBillLineItems_CustomerId",
                table: "VendorBillLineItems",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorBillLineItems_GSTConfigId",
                table: "VendorBillLineItems",
                column: "GSTConfigId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorBillLineItems_VendorBillId_LineNumber",
                table: "VendorBillLineItems",
                columns: new[] { "VendorBillId", "LineNumber" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VendorBillLineItems");
        }
    }
}
