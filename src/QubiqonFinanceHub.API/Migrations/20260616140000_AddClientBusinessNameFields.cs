using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class AddClientBusinessNameFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.GstTreatments', 'ShowBusinessLegalName') IS NULL
                    ALTER TABLE [dbo].[GstTreatments] ADD [ShowBusinessLegalName] BIT NOT NULL
                        CONSTRAINT DF_GstTreatments_ShowBusinessLegalName DEFAULT 0;
                IF COL_LENGTH('dbo.GstTreatments', 'ShowBusinessTradeName') IS NULL
                    ALTER TABLE [dbo].[GstTreatments] ADD [ShowBusinessTradeName] BIT NOT NULL
                        CONSTRAINT DF_GstTreatments_ShowBusinessTradeName DEFAULT 0;
                """);

            migrationBuilder.Sql("""
                UPDATE [dbo].[GstTreatments] SET
                    [ShowBusinessLegalName] = 1, [ShowBusinessTradeName] = 1
                WHERE [Code] IN (N'REGISTERED', N'COMPOSITION', N'SEZ', N'DEEMED_EXPORT', N'UNREGISTERED');

                UPDATE [dbo].[GstTreatments] SET
                    [ShowBusinessLegalName] = 0, [ShowBusinessTradeName] = 0
                WHERE [Code] IN (N'OVERSEAS', N'CONSUMER');
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH('finance.Clients', 'BusinessLegalName') IS NULL
                    ALTER TABLE [finance].[Clients] ADD [BusinessLegalName] NVARCHAR(300) NULL;
                IF COL_LENGTH('finance.Clients', 'BusinessTradeName') IS NULL
                    ALTER TABLE [finance].[Clients] ADD [BusinessTradeName] NVARCHAR(300) NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('finance.Clients', 'BusinessTradeName') IS NOT NULL
                    ALTER TABLE [finance].[Clients] DROP COLUMN [BusinessTradeName];
                IF COL_LENGTH('finance.Clients', 'BusinessLegalName') IS NOT NULL
                    ALTER TABLE [finance].[Clients] DROP COLUMN [BusinessLegalName];
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.GstTreatments', 'ShowBusinessTradeName') IS NOT NULL
                    ALTER TABLE [dbo].[GstTreatments] DROP CONSTRAINT DF_GstTreatments_ShowBusinessTradeName;
                IF COL_LENGTH('dbo.GstTreatments', 'ShowBusinessTradeName') IS NOT NULL
                    ALTER TABLE [dbo].[GstTreatments] DROP COLUMN [ShowBusinessTradeName];
                IF COL_LENGTH('dbo.GstTreatments', 'ShowBusinessLegalName') IS NOT NULL
                    ALTER TABLE [dbo].[GstTreatments] DROP CONSTRAINT DF_GstTreatments_ShowBusinessLegalName;
                IF COL_LENGTH('dbo.GstTreatments', 'ShowBusinessLegalName') IS NOT NULL
                    ALTER TABLE [dbo].[GstTreatments] DROP COLUMN [ShowBusinessLegalName];
                """);
        }
    }
}
