using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class MoveEmailTemplatesToDbo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameTable(
                name: "EmailTemplates",
                schema: "finance",
                newName: "EmailTemplates",
                newSchema: "dbo");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameTable(
                name: "EmailTemplates",
                schema: "dbo",
                newName: "EmailTemplates",
                newSchema: "finance");
        }
    }
}
