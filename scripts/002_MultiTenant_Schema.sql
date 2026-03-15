-- ═══════════════════════════════════════════════════════════════
--  QUBIQON FINANCE HUB — Multi-Tenant Schema Extension
--  Adds: Organizations, Tenancy, Email Templates, Invoice Config
--  Run AFTER 001_CreateSchema.sql
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
--  1. ORGANIZATIONS TABLE (Tenant root)
--  Each organization is a separate tenant
-- ───────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Organizations')
BEGIN
    CREATE TABLE [dbo].[Organizations] (
        [Id]                    UNIQUEIDENTIFIER    NOT NULL    DEFAULT NEWSEQUENTIALID(),
        [Name]                  NVARCHAR(200)       NOT NULL,
        [LegalName]             NVARCHAR(300)       NULL,
        [Slug]                  NVARCHAR(50)        NOT NULL,   -- URL-safe identifier: qubiqon, acme-corp
        [LogoUrl]               NVARCHAR(2048)      NULL,       -- Azure Blob URL
        [FaviconUrl]            NVARCHAR(2048)      NULL,
        [PrimaryColor]          NVARCHAR(7)         NULL        DEFAULT '#1B2A4A',
        [AccentColor]           NVARCHAR(7)         NULL        DEFAULT '#E8593C',

        -- Address
        [AddressLine1]          NVARCHAR(300)       NULL,
        [AddressLine2]          NVARCHAR(300)       NULL,
        [City]                  NVARCHAR(100)       NULL,
        [State]                 NVARCHAR(100)       NULL,
        [Country]               NVARCHAR(100)       NULL        DEFAULT 'India',
        [PinCode]               NVARCHAR(20)        NULL,

        -- Tax Registration
        [GSTIN]                 NVARCHAR(20)        NULL,
        [PAN]                   NVARCHAR(15)        NULL,
        [CIN]                   NVARCHAR(25)        NULL,
        [TAN]                   NVARCHAR(15)        NULL,

        -- Contact
        [ContactPersonName]     NVARCHAR(100)       NULL,
        [ContactEmail]          NVARCHAR(256)       NULL,
        [ContactPhone]          NVARCHAR(20)        NULL,
        [Website]               NVARCHAR(256)       NULL,

        -- Bank Details (primary)
        [BankAccountName]       NVARCHAR(200)       NULL,
        [BankAccountNumber]     NVARCHAR(30)        NULL,
        [BankIFSC]              NVARCHAR(15)        NULL,
        [BankName]              NVARCHAR(100)       NULL,
        [BankBranch]            NVARCHAR(200)       NULL,
        [BankSWIFT]             NVARCHAR(15)        NULL,

        -- Subscription / Tenant
        [Plan]                  NVARCHAR(20)        NOT NULL    DEFAULT 'Professional',
        [MaxUsers]              INT                 NOT NULL    DEFAULT 25,
        [IsActive]              BIT                 NOT NULL    DEFAULT 1,
        [SubscriptionExpiresAt] DATETIME2(7)        NULL,

        [CreatedAt]             DATETIME2(7)        NOT NULL    DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]             DATETIME2(7)        NULL,

        CONSTRAINT [PK_Organizations]           PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [UQ_Organizations_Slug]      UNIQUE ([Slug]),
        CONSTRAINT [CK_Organizations_Plan]      CHECK ([Plan] IN ('Free', 'Starter', 'Professional', 'Enterprise'))
    );

    CREATE NONCLUSTERED INDEX [IX_Organizations_Slug]
        ON [dbo].[Organizations] ([Slug]) INCLUDE ([Name], [IsActive]);
END;
GO

-- ───────────────────────────────────────────────────────────
--  2. ADD OrganizationId TO ALL EXISTING TABLES
--  This makes every table tenant-aware
-- ───────────────────────────────────────────────────────────

-- Add to Employees
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Employees') AND name = 'OrganizationId')
BEGIN
    ALTER TABLE [dbo].[Employees] ADD [OrganizationId] UNIQUEIDENTIFIER NULL;
    CREATE NONCLUSTERED INDEX [IX_Employees_OrgId] ON [dbo].[Employees] ([OrganizationId]);
END;
GO

-- Add to ExpenseRequests
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExpenseRequests') AND name = 'OrganizationId')
BEGIN
    ALTER TABLE [dbo].[ExpenseRequests] ADD [OrganizationId] UNIQUEIDENTIFIER NULL;
    CREATE NONCLUSTERED INDEX [IX_ExpenseRequests_OrgId] ON [dbo].[ExpenseRequests] ([OrganizationId]);
END;
GO

-- Add to PaymentRecords
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PaymentRecords') AND name = 'OrganizationId')
BEGIN
    ALTER TABLE [dbo].[PaymentRecords] ADD [OrganizationId] UNIQUEIDENTIFIER NULL;
END;
GO

-- ───────────────────────────────────────────────────────────
--  3. CLIENTS TABLE
-- ───────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Clients')
BEGIN
    CREATE TABLE [dbo].[Clients] (
        [Id]                UNIQUEIDENTIFIER    NOT NULL    DEFAULT NEWSEQUENTIALID(),
        [OrganizationId]    UNIQUEIDENTIFIER    NOT NULL,
        [Name]              NVARCHAR(200)       NOT NULL,
        [ContactPerson]     NVARCHAR(100)       NULL,
        [Email]             NVARCHAR(256)       NOT NULL,
        [Phone]             NVARCHAR(20)        NULL,
        [Country]           NVARCHAR(100)       NOT NULL    DEFAULT 'India',
        [Currency]          NVARCHAR(3)         NOT NULL    DEFAULT 'INR',
        [TaxType]           NVARCHAR(20)        NOT NULL    DEFAULT 'Domestic',
        [GSTIN]             NVARCHAR(20)        NULL,
        [AddressLine1]      NVARCHAR(300)       NULL,
        [AddressLine2]      NVARCHAR(300)       NULL,
        [City]              NVARCHAR(100)       NULL,
        [State]             NVARCHAR(100)       NULL,
        [PinCode]           NVARCHAR(20)        NULL,
        [IsActive]          BIT                 NOT NULL    DEFAULT 1,
        [CreatedAt]         DATETIME2(7)        NOT NULL    DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_Clients]             PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Clients_Org]         FOREIGN KEY ([OrganizationId])
            REFERENCES [dbo].[Organizations] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [CK_Clients_TaxType]     CHECK ([TaxType] IN ('Domestic', 'SEZ', 'Export')),
        CONSTRAINT [CK_Clients_Currency]    CHECK ([Currency] IN ('INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'AED', 'SGD'))
    );

    CREATE NONCLUSTERED INDEX [IX_Clients_OrgId] ON [dbo].[Clients] ([OrganizationId]);
END;
GO

-- ───────────────────────────────────────────────────────────
--  4. VENDORS TABLE
-- ───────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Vendors')
BEGIN
    CREATE TABLE [dbo].[Vendors] (
        [Id]                UNIQUEIDENTIFIER    NOT NULL    DEFAULT NEWSEQUENTIALID(),
        [OrganizationId]    UNIQUEIDENTIFIER    NOT NULL,
        [Name]              NVARCHAR(200)       NOT NULL,
        [GSTIN]             NVARCHAR(20)        NULL,
        [Email]             NVARCHAR(256)       NOT NULL,
        [Phone]             NVARCHAR(20)        NULL,
        [Category]          NVARCHAR(100)       NULL,
        [Address]           NVARCHAR(500)       NULL,
        [IsActive]          BIT                 NOT NULL    DEFAULT 1,
        [CreatedAt]         DATETIME2(7)        NOT NULL    DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_Vendors]         PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Vendors_Org]     FOREIGN KEY ([OrganizationId])
            REFERENCES [dbo].[Organizations] ([Id]) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX [IX_Vendors_OrgId] ON [dbo].[Vendors] ([OrganizationId]);
END;
GO

-- ───────────────────────────────────────────────────────────
--  5. VENDOR BILLS TABLE
-- ───────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VendorBills')
BEGIN
    CREATE TABLE [dbo].[VendorBills] (
        [Id]                    UNIQUEIDENTIFIER    NOT NULL    DEFAULT NEWSEQUENTIALID(),
        [OrganizationId]        UNIQUEIDENTIFIER    NOT NULL,
        [BillCode]              NVARCHAR(30)        NOT NULL,
        [VendorId]              UNIQUEIDENTIFIER    NOT NULL,
        [Amount]                DECIMAL(18,2)       NOT NULL,
        [TaxConfigId]           UNIQUEIDENTIFIER    NULL,
        [TDSAmount]             DECIMAL(18,2)       NOT NULL    DEFAULT 0,
        [TotalPayable]          DECIMAL(18,2)       NOT NULL,
        [Description]           NVARCHAR(1000)      NOT NULL,
        [BillDate]              DATE                NOT NULL,
        [DueDate]               DATE                NOT NULL,
        [PaymentTerms]          NVARCHAR(20)        NOT NULL    DEFAULT 'net30',
        [Status]                NVARCHAR(20)        NOT NULL    DEFAULT 'Submitted',
        [AttachmentUrl]         NVARCHAR(2048)      NULL,
        [CCEmails]              NVARCHAR(1000)      NULL,
        [SubmittedByEmployeeId] UNIQUEIDENTIFIER    NOT NULL,
        [PaymentReference]      NVARCHAR(100)       NULL,
        [PaidAt]                DATETIME2(7)        NULL,
        [CreatedAt]             DATETIME2(7)        NOT NULL    DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]             DATETIME2(7)        NULL,

        CONSTRAINT [PK_VendorBills]         PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_VendorBills_Org]     FOREIGN KEY ([OrganizationId])
            REFERENCES [dbo].[Organizations] ([Id]),
        CONSTRAINT [FK_VendorBills_Vendor]  FOREIGN KEY ([VendorId])
            REFERENCES [dbo].[Vendors] ([Id]),
        CONSTRAINT [CK_VendorBills_Status]  CHECK ([Status] IN ('Draft','Submitted','Approved','Rejected','Paid','Overdue'))
    );

    CREATE NONCLUSTERED INDEX [IX_VendorBills_OrgId_Status] ON [dbo].[VendorBills] ([OrganizationId], [Status]);
    CREATE UNIQUE INDEX [IX_VendorBills_OrgId_Code] ON [dbo].[VendorBills] ([OrganizationId], [BillCode]);
END;
GO

-- ───────────────────────────────────────────────────────────
--  6. INVOICES TABLE
-- ───────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Invoices')
BEGIN
    CREATE TABLE [dbo].[Invoices] (
        [Id]                UNIQUEIDENTIFIER    NOT NULL    DEFAULT NEWSEQUENTIALID(),
        [OrganizationId]    UNIQUEIDENTIFIER    NOT NULL,
        [InvoiceCode]       NVARCHAR(30)        NOT NULL,
        [ClientId]          UNIQUEIDENTIFIER    NOT NULL,
        [Currency]          NVARCHAR(3)         NOT NULL    DEFAULT 'INR',
        [SubTotal]          DECIMAL(18,2)       NOT NULL,
        [TotalGST]          DECIMAL(18,2)       NOT NULL    DEFAULT 0,
        [TaxConfigId]       UNIQUEIDENTIFIER    NULL,       -- Overall TDS
        [TaxAmount]         DECIMAL(18,2)       NOT NULL    DEFAULT 0,
        [Total]             DECIMAL(18,2)       NOT NULL,
        [InvoiceDate]       DATE                NOT NULL,
        [DueDate]           DATE                NOT NULL,
        [PaymentTerms]      NVARCHAR(20)        NOT NULL    DEFAULT 'net30',
        [PurchaseOrder]     NVARCHAR(50)        NULL,
        [Status]            NVARCHAR(20)        NOT NULL    DEFAULT 'Draft',
        [Notes]             NVARCHAR(1000)      NULL,
        [TotalInWords]      NVARCHAR(500)       NULL,
        [PaymentReference]  NVARCHAR(100)       NULL,
        [PaidAt]            DATETIME2(7)        NULL,
        [SentAt]            DATETIME2(7)        NULL,
        [CreatedByEmployeeId] UNIQUEIDENTIFIER  NOT NULL,
        [CreatedAt]         DATETIME2(7)        NOT NULL    DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]         DATETIME2(7)        NULL,

        CONSTRAINT [PK_Invoices]            PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Invoices_Org]        FOREIGN KEY ([OrganizationId])
            REFERENCES [dbo].[Organizations] ([Id]),
        CONSTRAINT [FK_Invoices_Client]     FOREIGN KEY ([ClientId])
            REFERENCES [dbo].[Clients] ([Id]),
        CONSTRAINT [CK_Invoices_Status]     CHECK ([Status] IN ('Draft','Sent','Viewed','Paid','Partial','Overdue'))
    );

    CREATE UNIQUE INDEX [IX_Invoices_OrgId_Code] ON [dbo].[Invoices] ([OrganizationId], [InvoiceCode]);
    CREATE NONCLUSTERED INDEX [IX_Invoices_OrgId_Status] ON [dbo].[Invoices] ([OrganizationId], [Status]);
END;
GO

-- ───────────────────────────────────────────────────────────
--  7. INVOICE LINE ITEMS
-- ───────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InvoiceLineItems')
BEGIN
    CREATE TABLE [dbo].[InvoiceLineItems] (
        [Id]                UNIQUEIDENTIFIER    NOT NULL    DEFAULT NEWSEQUENTIALID(),
        [InvoiceId]         UNIQUEIDENTIFIER    NOT NULL,
        [LineNumber]        INT                 NOT NULL,
        [Description]       NVARCHAR(1000)      NOT NULL,
        [HSNCode]           NVARCHAR(20)        NULL,
        [Quantity]          DECIMAL(18,2)       NOT NULL,
        [Rate]              DECIMAL(18,2)       NOT NULL,
        [Amount]            DECIMAL(18,2)       NOT NULL,
        [GSTConfigId]       UNIQUEIDENTIFIER    NULL,
        [GSTAmount]         DECIMAL(18,2)       NOT NULL    DEFAULT 0,
        [TotalAmount]       DECIMAL(18,2)       NOT NULL,

        CONSTRAINT [PK_InvoiceLineItems]        PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_InvoiceLineItems_Invoice] FOREIGN KEY ([InvoiceId])
            REFERENCES [dbo].[Invoices] ([Id]) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX [IX_InvoiceLineItems_InvoiceId]
        ON [dbo].[InvoiceLineItems] ([InvoiceId], [LineNumber]);
END;
GO

-- ───────────────────────────────────────────────────────────
--  8. TAX CONFIGURATION (Admin-managed)
-- ───────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TaxConfigurations')
BEGIN
    CREATE TABLE [dbo].[TaxConfigurations] (
        [Id]                UNIQUEIDENTIFIER    NOT NULL    DEFAULT NEWSEQUENTIALID(),
        [OrganizationId]    UNIQUEIDENTIFIER    NOT NULL,
        [TaxType]           NVARCHAR(10)        NOT NULL,   -- 'TDS' or 'GST'
        [Name]              NVARCHAR(200)       NOT NULL,
        [Rate]              DECIMAL(5,2)        NOT NULL,
        [Section]           NVARCHAR(20)        NULL,       -- e.g. '194 C', '194 J'
        [SubType]           NVARCHAR(20)        NULL,       -- e.g. 'IGST', 'CGST+SGST', 'SEZ'
        [IsActive]          BIT                 NOT NULL    DEFAULT 1,
        [CreatedAt]         DATETIME2(7)        NOT NULL    DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_TaxConfigurations]       PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_TaxConfig_Org]           FOREIGN KEY ([OrganizationId])
            REFERENCES [dbo].[Organizations] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [CK_TaxConfig_Type]          CHECK ([TaxType] IN ('TDS', 'GST'))
    );

    CREATE NONCLUSTERED INDEX [IX_TaxConfig_OrgId_Type]
        ON [dbo].[TaxConfigurations] ([OrganizationId], [TaxType], [IsActive]);
END;
GO

-- ───────────────────────────────────────────────────────────
--  9. ADVANCE PAYMENTS TABLE
-- ───────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AdvancePayments')
BEGIN
    CREATE TABLE [dbo].[AdvancePayments] (
        [Id]                UNIQUEIDENTIFIER    NOT NULL    DEFAULT NEWSEQUENTIALID(),
        [OrganizationId]    UNIQUEIDENTIFIER    NOT NULL,
        [AdvanceCode]       NVARCHAR(30)        NOT NULL,
        [EmployeeId]        UNIQUEIDENTIFIER    NOT NULL,
        [Amount]            DECIMAL(18,2)       NOT NULL,
        [Purpose]           NVARCHAR(500)       NOT NULL,
        [Status]            NVARCHAR(20)        NOT NULL    DEFAULT 'Pending',
        [PaymentReference]  NVARCHAR(100)       NULL,
        [DisbursedAt]       DATETIME2(7)        NULL,
        [SettledAt]         DATETIME2(7)        NULL,
        [CreatedAt]         DATETIME2(7)        NOT NULL    DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_AdvancePayments]         PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Advances_Org]            FOREIGN KEY ([OrganizationId])
            REFERENCES [dbo].[Organizations] ([Id]),
        CONSTRAINT [FK_Advances_Employee]       FOREIGN KEY ([EmployeeId])
            REFERENCES [dbo].[Employees] ([Id]),
        CONSTRAINT [CK_Advances_Status]         CHECK ([Status] IN ('Pending','Approved','Rejected','Disbursed','Settled'))
    );

    CREATE UNIQUE INDEX [IX_Advances_OrgId_Code] ON [dbo].[AdvancePayments] ([OrganizationId], [AdvanceCode]);
END;
GO

-- ───────────────────────────────────────────────────────────
--  10. EMAIL TEMPLATES TABLE (Admin-customizable)
-- ───────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EmailTemplates')
BEGIN
    CREATE TABLE [dbo].[EmailTemplates] (
        [Id]                UNIQUEIDENTIFIER    NOT NULL    DEFAULT NEWSEQUENTIALID(),
        [OrganizationId]    UNIQUEIDENTIFIER    NOT NULL,
        [TemplateKey]       NVARCHAR(50)        NOT NULL,   -- bill_reminder, payment_confirmation, etc.
        [Subject]           NVARCHAR(500)       NOT NULL,
        [HtmlBody]          NVARCHAR(MAX)       NOT NULL,
        [IsActive]          BIT                 NOT NULL    DEFAULT 1,
        [CreatedAt]         DATETIME2(7)        NOT NULL    DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]         DATETIME2(7)        NULL,

        CONSTRAINT [PK_EmailTemplates]          PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_EmailTemplates_Org]      FOREIGN KEY ([OrganizationId])
            REFERENCES [dbo].[Organizations] ([Id]) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX [IX_EmailTemplates_OrgKey]
        ON [dbo].[EmailTemplates] ([OrganizationId], [TemplateKey]);
END;
GO

-- ───────────────────────────────────────────────────────────
--  11. ORGANIZATION CONFIG TABLE (key-value settings)
-- ───────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OrganizationSettings')
BEGIN
    CREATE TABLE [dbo].[OrganizationSettings] (
        [Id]                UNIQUEIDENTIFIER    NOT NULL    DEFAULT NEWSEQUENTIALID(),
        [OrganizationId]    UNIQUEIDENTIFIER    NOT NULL,
        [SettingKey]        NVARCHAR(100)       NOT NULL,
        [SettingValue]      NVARCHAR(MAX)       NOT NULL,
        [UpdatedAt]         DATETIME2(7)        NOT NULL    DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_OrgSettings]             PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_OrgSettings_Org]         FOREIGN KEY ([OrganizationId])
            REFERENCES [dbo].[Organizations] ([Id]) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX [IX_OrgSettings_OrgKey]
        ON [dbo].[OrganizationSettings] ([OrganizationId], [SettingKey]);
END;
GO

-- ───────────────────────────────────────────────────────────
--  12. SEED: Qubiqon Organization
-- ───────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[Organizations] WHERE [Slug] = 'qubiqon')
BEGIN
    INSERT INTO [dbo].[Organizations] (
        [Id], [Name], [LegalName], [Slug], [PrimaryColor], [AccentColor],
        [AddressLine1], [AddressLine2], [City], [State], [Country], [PinCode],
        [GSTIN], [ContactPersonName], [ContactEmail], [Website],
        [BankAccountName], [BankAccountNumber], [BankIFSC], [BankName], [BankBranch], [BankSWIFT],
        [Plan], [MaxUsers]
    ) VALUES (
        'AAAAAAAA-0000-0000-0000-000000000001',
        'Qubiqon', 'Qubiqon Consulting India Private Limited', 'qubiqon',
        '#1B2A4A', '#E8593C',
        'Carnival building Unit No VI C 6th Floor Phase 3 Building',
        'Infopark Kochi, Kakkanad',
        'Ernakulam', 'Kerala', 'India', '682030',
        '32AAACQ9628B1ZP',
        'Biju Neduvellil', 'finance@qubiqon.io', 'https://www.qubiqon.io',
        'QUBIQON CONSULTING INDIA PRIVATE LIMITED',
        '001005015268', 'ICIC0000010', 'ICICI Bank Ltd',
        'ICICI Bank Ltd, Emgee Square, M. G. Road, Ernakulam, Kochi',
        'ICICINBBCTS',
        'Professional', 50
    );

    -- Default settings
    INSERT INTO [dbo].[OrganizationSettings] ([OrganizationId], [SettingKey], [SettingValue]) VALUES
        ('AAAAAAAA-0000-0000-0000-000000000001', 'expense_code_format', 'EXP-{YYYY}-{SEQ:5}'),
        ('AAAAAAAA-0000-0000-0000-000000000001', 'bill_code_format', 'BL-{SEQ:3}/{YY}-{YY+1}'),
        ('AAAAAAAA-0000-0000-0000-000000000001', 'advance_code_format', 'ADV-{YYYY}-{SEQ:4}'),
        ('AAAAAAAA-0000-0000-0000-000000000001', 'invoice_code_format', 'QINV-{TYPE}-{YYMM}{SEQ:3}'),
        ('AAAAAAAA-0000-0000-0000-000000000001', 'advance_enabled', 'true'),
        ('AAAAAAAA-0000-0000-0000-000000000001', 'advance_cap', '50000'),
        ('AAAAAAAA-0000-0000-0000-000000000001', 'notification_cc_emails', 'accounts@qubiqon.io,finance@qubiqon.io');

    PRINT 'Qubiqon organization seeded.';
END;
GO

PRINT '═══════════════════════════════════════════════════════';
PRINT '  Multi-tenant schema extension applied!';
PRINT '  New tables: Organizations, Clients, Vendors,';
PRINT '    VendorBills, Invoices, InvoiceLineItems,';
PRINT '    AdvancePayments, TaxConfigurations,';
PRINT '    EmailTemplates, OrganizationSettings';
PRINT '═══════════════════════════════════════════════════════';
GO
