using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCustomerFromVendorBillLineItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VendorBillLineItems_Clients_CustomerId",
                table: "VendorBillLineItems");

            migrationBuilder.DropIndex(
                name: "IX_VendorBillLineItems_CustomerId",
                table: "VendorBillLineItems");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "VendorBillLineItems");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CustomerId",
                table: "VendorBillLineItems",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_VendorBillLineItems_CustomerId",
                table: "VendorBillLineItems",
                column: "CustomerId");

            migrationBuilder.AddForeignKey(
                name: "FK_VendorBillLineItems_Clients_CustomerId",
                table: "VendorBillLineItems",
                column: "CustomerId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
