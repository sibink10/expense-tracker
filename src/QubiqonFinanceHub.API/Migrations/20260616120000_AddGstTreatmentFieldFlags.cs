using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class AddGstTreatmentFieldFlags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.GstTreatments', 'ShowGstin') IS NULL
                    ALTER TABLE [dbo].[GstTreatments] ADD [ShowGstin] BIT NOT NULL
                        CONSTRAINT DF_GstTreatments_ShowGstin DEFAULT 1;
                IF COL_LENGTH('dbo.GstTreatments', 'ShowPlaceOfSupply') IS NULL
                    ALTER TABLE [dbo].[GstTreatments] ADD [ShowPlaceOfSupply] BIT NOT NULL
                        CONSTRAINT DF_GstTreatments_ShowPlaceOfSupply DEFAULT 1;
                IF COL_LENGTH('dbo.GstTreatments', 'ShowTaxPreference') IS NULL
                    ALTER TABLE [dbo].[GstTreatments] ADD [ShowTaxPreference] BIT NOT NULL
                        CONSTRAINT DF_GstTreatments_ShowTaxPreference DEFAULT 1;
                IF COL_LENGTH('dbo.GstTreatments', 'ShowPan') IS NULL
                    ALTER TABLE [dbo].[GstTreatments] ADD [ShowPan] BIT NOT NULL
                        CONSTRAINT DF_GstTreatments_ShowPan DEFAULT 1;
                """);

            migrationBuilder.Sql("""
                UPDATE [dbo].[GstTreatments] SET
                    [ShowGstin] = 1, [ShowPlaceOfSupply] = 1, [ShowTaxPreference] = 1, [ShowPan] = 1
                WHERE [Code] IN (N'REGISTERED', N'COMPOSITION', N'SEZ', N'DEEMED_EXPORT');

                UPDATE [dbo].[GstTreatments] SET
                    [ShowGstin] = 1, [ShowPlaceOfSupply] = 0, [ShowTaxPreference] = 1, [ShowPan] = 1
                WHERE [Code] = N'UNREGISTERED';

                UPDATE [dbo].[GstTreatments] SET
                    [ShowGstin] = 0, [ShowPlaceOfSupply] = 0, [ShowTaxPreference] = 1, [ShowPan] = 0
                WHERE [Code] IN (N'OVERSEAS', N'CONSUMER');
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH('finance.Clients', 'TaxExemptionReason') IS NULL
                    ALTER TABLE [finance].[Clients] ADD [TaxExemptionReason] NVARCHAR(500) NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('finance.Clients', 'TaxExemptionReason') IS NOT NULL
                    ALTER TABLE [finance].[Clients] DROP COLUMN [TaxExemptionReason];
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.GstTreatments', 'ShowPan') IS NOT NULL
                    ALTER TABLE [dbo].[GstTreatments] DROP CONSTRAINT DF_GstTreatments_ShowPan;
                IF COL_LENGTH('dbo.GstTreatments', 'ShowPan') IS NOT NULL
                    ALTER TABLE [dbo].[GstTreatments] DROP COLUMN [ShowPan];
                IF COL_LENGTH('dbo.GstTreatments', 'ShowTaxPreference') IS NOT NULL
                    ALTER TABLE [dbo].[GstTreatments] DROP CONSTRAINT DF_GstTreatments_ShowTaxPreference;
                IF COL_LENGTH('dbo.GstTreatments', 'ShowTaxPreference') IS NOT NULL
                    ALTER TABLE [dbo].[GstTreatments] DROP COLUMN [ShowTaxPreference];
                IF COL_LENGTH('dbo.GstTreatments', 'ShowPlaceOfSupply') IS NOT NULL
                    ALTER TABLE [dbo].[GstTreatments] DROP CONSTRAINT DF_GstTreatments_ShowPlaceOfSupply;
                IF COL_LENGTH('dbo.GstTreatments', 'ShowPlaceOfSupply') IS NOT NULL
                    ALTER TABLE [dbo].[GstTreatments] DROP COLUMN [ShowPlaceOfSupply];
                IF COL_LENGTH('dbo.GstTreatments', 'ShowGstin') IS NOT NULL
                    ALTER TABLE [dbo].[GstTreatments] DROP CONSTRAINT DF_GstTreatments_ShowGstin;
                IF COL_LENGTH('dbo.GstTreatments', 'ShowGstin') IS NOT NULL
                    ALTER TABLE [dbo].[GstTreatments] DROP COLUMN [ShowGstin];
                """);
        }
    }
}
