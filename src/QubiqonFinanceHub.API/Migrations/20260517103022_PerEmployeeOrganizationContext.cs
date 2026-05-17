using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class PerEmployeeOrganizationContext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.Organizations', 'Selected') IS NOT NULL
    ALTER TABLE dbo.Organizations DROP COLUMN Selected;
");

            migrationBuilder.Sql(@"
IF OBJECT_ID(N'dbo.employee_organization_context', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.employee_organization_context (
        employee_id uniqueidentifier NOT NULL,
        active_organization_id uniqueidentifier NULL,
        updated_at datetime2 NOT NULL CONSTRAINT DF_employee_organization_context_updated_at DEFAULT (sysutcdatetime()),
        CONSTRAINT PK_employee_organization_context PRIMARY KEY (employee_id),
        CONSTRAINT FK_employee_org_ctx_employee FOREIGN KEY (employee_id) REFERENCES dbo.Employees (Id) ON DELETE CASCADE,
        CONSTRAINT FK_employee_org_ctx_organization FOREIGN KEY (active_organization_id) REFERENCES dbo.Organizations (Id)
    );
    CREATE INDEX IX_employee_organization_context_active_organization_id
        ON dbo.employee_organization_context (active_organization_id);
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'dbo.employee_organization_context', N'U') IS NOT NULL
    DROP TABLE dbo.employee_organization_context;
");

            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.Organizations', 'Selected') IS NULL
    ALTER TABLE dbo.Organizations ADD Selected bit NOT NULL CONSTRAINT DF_Organizations_Selected DEFAULT (0);
");
        }
    }
}
