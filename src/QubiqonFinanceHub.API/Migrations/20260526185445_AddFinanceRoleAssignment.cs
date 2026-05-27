using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanceRoleAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
IF OBJECT_ID(N'[dbo].[Roles]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Roles] (
        [Id] int NOT NULL IDENTITY,
        [DisplayName] varchar(100) NOT NULL,
        [Code] varchar(50) NOT NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE [name] = N'IX_Roles_Code'
      AND [object_id] = OBJECT_ID(N'[dbo].[Roles]')
)
BEGIN
    CREATE UNIQUE INDEX [IX_Roles_Code] ON [dbo].[Roles] ([Code]);
END;

IF OBJECT_ID(N'[finance].[EmployeeRoles]', N'U') IS NULL
BEGIN
    CREATE TABLE [finance].[EmployeeRoles] (
        [Id] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [RoleId] int NOT NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAt] datetime2 NOT NULL DEFAULT (sysutcdatetime()),
        [UpdatedAt] datetime2 NULL DEFAULT (sysutcdatetime()),
        CONSTRAINT [PK_EmployeeRoles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_EmployeeRoles_Employees_EmployeeId]
            FOREIGN KEY ([EmployeeId]) REFERENCES [dbo].[Employees] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_EmployeeRoles_Roles_RoleId]
            FOREIGN KEY ([RoleId]) REFERENCES [dbo].[Roles] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE [name] = N'IX_EmployeeRoles_EmployeeId'
      AND [object_id] = OBJECT_ID(N'[finance].[EmployeeRoles]')
)
BEGIN
    CREATE UNIQUE INDEX [IX_EmployeeRoles_EmployeeId]
        ON [finance].[EmployeeRoles] ([EmployeeId]);
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE [name] = N'IX_EmployeeRoles_RoleId'
      AND [object_id] = OBJECT_ID(N'[finance].[EmployeeRoles]')
)
BEGIN
    CREATE INDEX [IX_EmployeeRoles_RoleId]
        ON [finance].[EmployeeRoles] ([RoleId]);
END;
""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
IF OBJECT_ID(N'[finance].[EmployeeRoles]', N'U') IS NOT NULL
BEGIN
    DROP TABLE [finance].[EmployeeRoles];
END;
""");
        }
    }
}
