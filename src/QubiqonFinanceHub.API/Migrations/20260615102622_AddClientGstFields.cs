using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QubiqonFinanceHub.API.Migrations
{
    /// <inheritdoc />
    public partial class AddClientGstFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF OBJECT_ID(N'dbo.GstTreatments', N'U') IS NULL
                BEGIN
                    CREATE TABLE [dbo].[GstTreatments] (
                        [Id] UNIQUEIDENTIFIER NOT NULL,
                        [Code] NVARCHAR(30) NOT NULL,
                        [Name] NVARCHAR(100) NOT NULL,
                        [Description] NVARCHAR(500) NULL,
                        [IsActive] BIT NOT NULL CONSTRAINT DF_GstTreatments_IsActive DEFAULT 1,
                        [CreatedAt] DATETIME2 NOT NULL CONSTRAINT DF_GstTreatments_CreatedAt DEFAULT SYSUTCDATETIME(),
                        [UpdatedAt] DATETIME2 NOT NULL CONSTRAINT DF_GstTreatments_UpdatedAt DEFAULT SYSUTCDATETIME(),
                        CONSTRAINT [PK_GstTreatments] PRIMARY KEY ([Id])
                    );
                    CREATE UNIQUE INDEX [IX_GstTreatments_Code] ON [dbo].[GstTreatments]([Code]);
                END
                """);

            migrationBuilder.Sql("""
                MERGE [dbo].[GstTreatments] AS t
                USING (VALUES
                    ('11111111-1111-1111-1111-111111111101', N'REGISTERED',     N'Registered',     N'Regular GST registered business'),
                    ('11111111-1111-1111-1111-111111111102', N'UNREGISTERED',   N'Unregistered',   N'Unregistered business'),
                    ('11111111-1111-1111-1111-111111111103', N'COMPOSITION',    N'Composition',    N'Composition scheme taxpayer'),
                    ('11111111-1111-1111-1111-111111111104', N'SEZ',            N'SEZ',            N'Special Economic Zone'),
                    ('11111111-1111-1111-1111-111111111105', N'DEEMED_EXPORT',  N'Deemed Export',  N'Deemed export supplies'),
                    ('11111111-1111-1111-1111-111111111106', N'OVERSEAS',       N'Overseas',       N'Overseas customer'),
                    ('11111111-1111-1111-1111-111111111107', N'CONSUMER',       N'Consumer',       N'Consumer (B2C)')
                ) AS s ([Id], [Code], [Name], [Description])
                ON t.[Code] = s.[Code]
                WHEN NOT MATCHED THEN
                    INSERT ([Id], [Code], [Name], [Description], [IsActive], [CreatedAt], [UpdatedAt])
                    VALUES (s.[Id], s.[Code], s.[Name], s.[Description], 1, SYSUTCDATETIME(), SYSUTCDATETIME());
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'dbo.PlaceOfSupply', N'U') IS NULL
                BEGIN
                    CREATE TABLE [dbo].[PlaceOfSupply] (
                        [PlaceOfSupplyCode] VARCHAR(2) NOT NULL,
                        [PlaceOfSupplyName] NVARCHAR(100) NOT NULL,
                        [CountryCode] NVARCHAR(3) NOT NULL CONSTRAINT DF_PlaceOfSupply_CountryCode DEFAULT N'IN',
                        [CountryName] NVARCHAR(100) NOT NULL CONSTRAINT DF_PlaceOfSupply_CountryName DEFAULT N'India',
                        [IsUnionTerritory] BIT NOT NULL CONSTRAINT DF_PlaceOfSupply_IsUnionTerritory DEFAULT 0,
                        CONSTRAINT [PK_PlaceOfSupply] PRIMARY KEY ([PlaceOfSupplyCode])
                    );
                END
                """);

            migrationBuilder.Sql("""
                MERGE [dbo].[PlaceOfSupply] AS t
                USING (VALUES
                    ('01', N'Jammu and Kashmir', 0),
                    ('02', N'Himachal Pradesh', 0),
                    ('03', N'Punjab', 0),
                    ('04', N'Chandigarh', 1),
                    ('05', N'Uttarakhand', 0),
                    ('06', N'Haryana', 0),
                    ('07', N'Delhi', 1),
                    ('08', N'Rajasthan', 0),
                    ('09', N'Uttar Pradesh', 0),
                    ('10', N'Bihar', 0),
                    ('11', N'Sikkim', 0),
                    ('12', N'Arunachal Pradesh', 0),
                    ('13', N'Nagaland', 0),
                    ('14', N'Manipur', 0),
                    ('15', N'Mizoram', 0),
                    ('16', N'Tripura', 0),
                    ('17', N'Meghalaya', 0),
                    ('18', N'Assam', 0),
                    ('19', N'West Bengal', 0),
                    ('20', N'Jharkhand', 0),
                    ('21', N'Odisha', 0),
                    ('22', N'Chhattisgarh', 0),
                    ('23', N'Madhya Pradesh', 0),
                    ('24', N'Gujarat', 0),
                    ('25', N'Daman and Diu', 1),
                    ('26', N'Dadra and Nagar Haveli and Daman and Diu', 1),
                    ('27', N'Maharashtra', 0),
                    ('28', N'Andhra Pradesh', 0),
                    ('29', N'Karnataka', 0),
                    ('30', N'Goa', 0),
                    ('31', N'Lakshadweep', 1),
                    ('32', N'Kerala', 0),
                    ('33', N'Tamil Nadu', 0),
                    ('34', N'Puducherry', 1),
                    ('35', N'Andaman and Nicobar Islands', 1),
                    ('36', N'Telangana', 0),
                    ('37', N'Andhra Pradesh (New)', 0),
                    ('38', N'Ladakh', 1)
                ) AS s ([PlaceOfSupplyCode], [PlaceOfSupplyName], [IsUnionTerritory])
                ON t.[PlaceOfSupplyCode] = s.[PlaceOfSupplyCode]
                WHEN NOT MATCHED THEN
                    INSERT ([PlaceOfSupplyCode], [PlaceOfSupplyName], [CountryCode], [CountryName], [IsUnionTerritory])
                    VALUES (s.[PlaceOfSupplyCode], s.[PlaceOfSupplyName], N'IN', N'India', s.[IsUnionTerritory]);
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH('finance.Clients', 'IsTaxable') IS NULL
                    ALTER TABLE [finance].[Clients] ADD [IsTaxable] BIT NOT NULL CONSTRAINT DF_Clients_IsTaxable DEFAULT 1;

                IF COL_LENGTH('finance.Clients', 'GstTreatmentId') IS NULL
                    ALTER TABLE [finance].[Clients] ADD [GstTreatmentId] UNIQUEIDENTIFIER NULL;

                IF COL_LENGTH('finance.Clients', 'PlaceOfSupplyCode') IS NULL
                    ALTER TABLE [finance].[Clients] ADD [PlaceOfSupplyCode] VARCHAR(2) NULL;

                IF COL_LENGTH('finance.Clients', 'Pan') IS NULL
                    ALTER TABLE [finance].[Clients] ADD [Pan] NVARCHAR(10) NULL;

                IF COL_LENGTH('finance.Clients', 'PaymentTermsId') IS NULL
                    ALTER TABLE [finance].[Clients] ADD [PaymentTermsId] UNIQUEIDENTIFIER NULL;
                """);

            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Clients_GstTreatmentId' AND object_id = OBJECT_ID(N'finance.Clients'))
                    CREATE INDEX [IX_Clients_GstTreatmentId] ON [finance].[Clients]([GstTreatmentId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Clients_PlaceOfSupplyCode' AND object_id = OBJECT_ID(N'finance.Clients'))
                    CREATE INDEX [IX_Clients_PlaceOfSupplyCode] ON [finance].[Clients]([PlaceOfSupplyCode]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Clients_PaymentTermsId' AND object_id = OBJECT_ID(N'finance.Clients'))
                    CREATE INDEX [IX_Clients_PaymentTermsId] ON [finance].[Clients]([PaymentTermsId]);
                """);

            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Clients_GstTreatments_GstTreatmentId')
                    ALTER TABLE [finance].[Clients] ADD CONSTRAINT [FK_Clients_GstTreatments_GstTreatmentId]
                        FOREIGN KEY ([GstTreatmentId]) REFERENCES [dbo].[GstTreatments]([Id]) ON DELETE NO ACTION;

                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Clients_PlaceOfSupply_PlaceOfSupplyCode')
                    ALTER TABLE [finance].[Clients] ADD CONSTRAINT [FK_Clients_PlaceOfSupply_PlaceOfSupplyCode]
                        FOREIGN KEY ([PlaceOfSupplyCode]) REFERENCES [dbo].[PlaceOfSupply]([PlaceOfSupplyCode]) ON DELETE NO ACTION;

                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Clients_PaymentTerms_PaymentTermsId')
                    ALTER TABLE [finance].[Clients] ADD CONSTRAINT [FK_Clients_PaymentTerms_PaymentTermsId]
                        FOREIGN KEY ([PaymentTermsId]) REFERENCES [finance].[PaymentTerms]([Id]) ON DELETE NO ACTION;
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH('finance.Clients', 'TaxType') IS NOT NULL
                BEGIN
                    DECLARE @df NVARCHAR(200);
                    SELECT @df = dc.name
                    FROM sys.default_constraints dc
                    INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
                    WHERE dc.parent_object_id = OBJECT_ID(N'finance.Clients') AND c.name = N'TaxType';
                    IF @df IS NOT NULL EXEC(N'ALTER TABLE [finance].[Clients] DROP CONSTRAINT [' + @df + N']');
                    ALTER TABLE [finance].[Clients] DROP COLUMN [TaxType];
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('finance.Clients', 'TaxType') IS NULL
                    ALTER TABLE [finance].[Clients] ADD [TaxType] NVARCHAR(20) NOT NULL CONSTRAINT DF_Clients_TaxType_Down DEFAULT N'';

                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Clients_PaymentTerms_PaymentTermsId')
                    ALTER TABLE [finance].[Clients] DROP CONSTRAINT [FK_Clients_PaymentTerms_PaymentTermsId];
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Clients_PlaceOfSupply_PlaceOfSupplyCode')
                    ALTER TABLE [finance].[Clients] DROP CONSTRAINT [FK_Clients_PlaceOfSupply_PlaceOfSupplyCode];
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Clients_GstTreatments_GstTreatmentId')
                    ALTER TABLE [finance].[Clients] DROP CONSTRAINT [FK_Clients_GstTreatments_GstTreatmentId];

                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Clients_PaymentTermsId' AND object_id = OBJECT_ID(N'finance.Clients'))
                    DROP INDEX [IX_Clients_PaymentTermsId] ON [finance].[Clients];
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Clients_PlaceOfSupplyCode' AND object_id = OBJECT_ID(N'finance.Clients'))
                    DROP INDEX [IX_Clients_PlaceOfSupplyCode] ON [finance].[Clients];
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Clients_GstTreatmentId' AND object_id = OBJECT_ID(N'finance.Clients'))
                    DROP INDEX [IX_Clients_GstTreatmentId] ON [finance].[Clients];

                IF COL_LENGTH('finance.Clients', 'PaymentTermsId') IS NOT NULL
                    ALTER TABLE [finance].[Clients] DROP COLUMN [PaymentTermsId];
                IF COL_LENGTH('finance.Clients', 'Pan') IS NOT NULL
                    ALTER TABLE [finance].[Clients] DROP COLUMN [Pan];
                IF COL_LENGTH('finance.Clients', 'PlaceOfSupplyCode') IS NOT NULL
                    ALTER TABLE [finance].[Clients] DROP COLUMN [PlaceOfSupplyCode];
                IF COL_LENGTH('finance.Clients', 'GstTreatmentId') IS NOT NULL
                    ALTER TABLE [finance].[Clients] DROP COLUMN [GstTreatmentId];
                IF COL_LENGTH('finance.Clients', 'IsTaxable') IS NOT NULL
                    ALTER TABLE [finance].[Clients] DROP COLUMN [IsTaxable];

                IF OBJECT_ID(N'dbo.PlaceOfSupply', N'U') IS NOT NULL
                    DROP TABLE [dbo].[PlaceOfSupply];
                IF OBJECT_ID(N'dbo.GstTreatments', N'U') IS NOT NULL
                    DROP TABLE [dbo].[GstTreatments];
                """);
        }
    }
}
