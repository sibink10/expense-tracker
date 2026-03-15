-- ═══════════════════════════════════════════════════════════════
--  QUBIQON EXPENSE MANAGER — Azure SQL Database Schema
--  Target: Azure SQL Database (Serverless, Gen5, 2 vCores)
--  Version: 1.0.0
--  Date: 2026-03-14
--  
--  Run this script against a new Azure SQL Database to create
--  all tables, indexes, constraints, and seed data.
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
--  1. EMPLOYEES TABLE
--  Synced from Microsoft Entra ID (Azure AD)
-- ───────────────────────────────────────────────────────────

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Employees')
BEGIN
    CREATE TABLE [dbo].[Employees] (
        [Id]                UNIQUEIDENTIFIER    NOT NULL    DEFAULT NEWSEQUENTIALID(),
        [EntraObjectId]     NVARCHAR(36)        NOT NULL,
        [FullName]          NVARCHAR(100)       NOT NULL,
        [Email]             NVARCHAR(256)       NOT NULL,
        [Department]        NVARCHAR(100)       NULL,
        [Designation]       NVARCHAR(100)       NULL,
        [EmployeeCode]      NVARCHAR(50)        NULL,
        [Role]              NVARCHAR(20)        NOT NULL    DEFAULT 'Employee',
        [IsActive]          BIT                 NOT NULL    DEFAULT 1,
        [CreatedAt]         DATETIME2(7)        NOT NULL    DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]         DATETIME2(7)        NULL,

        CONSTRAINT [PK_Employees]               PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [UQ_Employees_EntraObjectId] UNIQUE ([EntraObjectId]),
        CONSTRAINT [UQ_Employees_Email]         UNIQUE ([Email]),
        CONSTRAINT [CK_Employees_Role]          CHECK ([Role] IN ('Employee', 'Approver', 'Finance', 'Admin'))
    );

    CREATE NONCLUSTERED INDEX [IX_Employees_EntraObjectId]
        ON [dbo].[Employees] ([EntraObjectId]);

    CREATE NONCLUSTERED INDEX [IX_Employees_Email]
        ON [dbo].[Employees] ([Email]);

    CREATE NONCLUSTERED INDEX [IX_Employees_Role]
        ON [dbo].[Employees] ([Role])
        INCLUDE ([FullName], [Email], [Department], [IsActive]);

    CREATE NONCLUSTERED INDEX [IX_Employees_EmployeeCode]
        ON [dbo].[Employees] ([EmployeeCode])
        WHERE [EmployeeCode] IS NOT NULL;
END;
GO

-- ───────────────────────────────────────────────────────────
--  2. EXPENSE REQUESTS TABLE
--  Core table for all expense submissions
-- ───────────────────────────────────────────────────────────

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ExpenseRequests')
BEGIN
    CREATE TABLE [dbo].[ExpenseRequests] (
        [Id]                UNIQUEIDENTIFIER    NOT NULL    DEFAULT NEWSEQUENTIALID(),
        [ExpenseCode]       NVARCHAR(20)        NOT NULL,
        [EmployeeId]        UNIQUEIDENTIFIER    NOT NULL,
        [Amount]            DECIMAL(18, 2)      NOT NULL,
        [Purpose]           NVARCHAR(500)       NOT NULL,
        [Description]       NVARCHAR(2000)      NULL,
        [Category]          NVARCHAR(30)        NOT NULL    DEFAULT 'General',
        [RequiredByDate]    DATE                NOT NULL,
        [Status]            NVARCHAR(20)        NOT NULL    DEFAULT 'Pending',
        [AttachmentUrl]     NVARCHAR(2048)      NULL,
        [CreatedAt]         DATETIME2(7)        NOT NULL    DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]         DATETIME2(7)        NULL,
        [ApprovedAt]        DATETIME2(7)        NULL,
        [ProcessedAt]       DATETIME2(7)        NULL,
        [CancelledAt]       DATETIME2(7)        NULL,

        CONSTRAINT [PK_ExpenseRequests]             PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [UQ_ExpenseRequests_ExpenseCode] UNIQUE ([ExpenseCode]),
        CONSTRAINT [FK_ExpenseRequests_Employee]    FOREIGN KEY ([EmployeeId])
            REFERENCES [dbo].[Employees] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [CK_ExpenseRequests_Amount]      CHECK ([Amount] > 0 AND [Amount] <= 10000000),
        CONSTRAINT [CK_ExpenseRequests_Status]      CHECK ([Status] IN ('Pending', 'Approved', 'Rejected', 'Cancelled', 'Processed')),
        CONSTRAINT [CK_ExpenseRequests_Category]    CHECK ([Category] IN (
            'General', 'Travel', 'Software', 'Hardware', 'Marketing',
            'Training', 'ClientMeeting', 'OfficeSupplies', 'Events', 'Other'))
    );

    CREATE NONCLUSTERED INDEX [IX_ExpenseRequests_ExpenseCode]
        ON [dbo].[ExpenseRequests] ([ExpenseCode]);

    CREATE NONCLUSTERED INDEX [IX_ExpenseRequests_EmployeeId]
        ON [dbo].[ExpenseRequests] ([EmployeeId])
        INCLUDE ([Status], [Amount], [CreatedAt]);

    CREATE NONCLUSTERED INDEX [IX_ExpenseRequests_Status]
        ON [dbo].[ExpenseRequests] ([Status])
        INCLUDE ([EmployeeId], [Amount], [CreatedAt]);

    CREATE NONCLUSTERED INDEX [IX_ExpenseRequests_CreatedAt]
        ON [dbo].[ExpenseRequests] ([CreatedAt] DESC)
        INCLUDE ([Status], [EmployeeId]);

    -- Composite index for the most common query pattern: filter by status + sort by date
    CREATE NONCLUSTERED INDEX [IX_ExpenseRequests_Status_CreatedAt]
        ON [dbo].[ExpenseRequests] ([Status], [CreatedAt] DESC)
        INCLUDE ([ExpenseCode], [EmployeeId], [Amount], [Purpose], [Category], [RequiredByDate]);
END;
GO

-- ───────────────────────────────────────────────────────────
--  3. EXPENSE COMMENTS TABLE
--  Audit trail for all actions on expenses
-- ───────────────────────────────────────────────────────────

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ExpenseComments')
BEGIN
    CREATE TABLE [dbo].[ExpenseComments] (
        [Id]                    UNIQUEIDENTIFIER    NOT NULL    DEFAULT NEWSEQUENTIALID(),
        [ExpenseRequestId]      UNIQUEIDENTIFIER    NOT NULL,
        [CommentByEmployeeId]   UNIQUEIDENTIFIER    NOT NULL,
        [CommentText]           NVARCHAR(2000)      NOT NULL,
        [Type]                  NVARCHAR(30)        NOT NULL    DEFAULT 'General',
        [CreatedAt]             DATETIME2(7)        NOT NULL    DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_ExpenseComments]                 PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_ExpenseComments_ExpenseRequest]  FOREIGN KEY ([ExpenseRequestId])
            REFERENCES [dbo].[ExpenseRequests] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ExpenseComments_Employee]        FOREIGN KEY ([CommentByEmployeeId])
            REFERENCES [dbo].[Employees] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [CK_ExpenseComments_Type]            CHECK ([Type] IN (
            'Submitted', 'Approved', 'Rejected', 'Cancelled', 'PaymentProcessed', 'General'))
    );

    CREATE NONCLUSTERED INDEX [IX_ExpenseComments_ExpenseRequestId]
        ON [dbo].[ExpenseComments] ([ExpenseRequestId], [CreatedAt])
        INCLUDE ([CommentByEmployeeId], [CommentText], [Type]);

    CREATE NONCLUSTERED INDEX [IX_ExpenseComments_CommentBy]
        ON [dbo].[ExpenseComments] ([CommentByEmployeeId]);
END;
GO

-- ───────────────────────────────────────────────────────────
--  4. PAYMENT RECORDS TABLE
--  Finance team payment processing details
-- ───────────────────────────────────────────────────────────

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PaymentRecords')
BEGIN
    CREATE TABLE [dbo].[PaymentRecords] (
        [Id]                        UNIQUEIDENTIFIER    NOT NULL    DEFAULT NEWSEQUENTIALID(),
        [ExpenseRequestId]          UNIQUEIDENTIFIER    NOT NULL,
        [ProcessedByEmployeeId]     UNIQUEIDENTIFIER    NOT NULL,
        [AmountPaid]                DECIMAL(18, 2)      NOT NULL,
        [PaymentReferenceNumber]    NVARCHAR(100)       NOT NULL,
        [Method]                    NVARCHAR(20)        NOT NULL    DEFAULT 'NEFT',
        [Notes]                     NVARCHAR(500)       NULL,
        [ProcessedAt]               DATETIME2(7)        NOT NULL    DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_PaymentRecords]                  PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_PaymentRecords_ExpenseRequest]   FOREIGN KEY ([ExpenseRequestId])
            REFERENCES [dbo].[ExpenseRequests] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_PaymentRecords_Employee]         FOREIGN KEY ([ProcessedByEmployeeId])
            REFERENCES [dbo].[Employees] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [UQ_PaymentRecords_ExpenseRequest]   UNIQUE ([ExpenseRequestId]),
        CONSTRAINT [UQ_PaymentRecords_RefNo]            UNIQUE ([PaymentReferenceNumber]),
        CONSTRAINT [CK_PaymentRecords_Amount]           CHECK ([AmountPaid] > 0),
        CONSTRAINT [CK_PaymentRecords_Method]           CHECK ([Method] IN ('NEFT', 'RTGS', 'IMPS', 'UPI', 'Cheque', 'BankTransfer'))
    );

    CREATE NONCLUSTERED INDEX [IX_PaymentRecords_ProcessedBy]
        ON [dbo].[PaymentRecords] ([ProcessedByEmployeeId]);

    CREATE NONCLUSTERED INDEX [IX_PaymentRecords_ProcessedAt]
        ON [dbo].[PaymentRecords] ([ProcessedAt] DESC)
        INCLUDE ([ExpenseRequestId], [AmountPaid], [PaymentReferenceNumber]);
END;
GO

-- ───────────────────────────────────────────────────────────
--  5. EXPENSE CODE SEQUENCE TABLE
--  Auto-increment for generating EXP-XXXXXX codes
-- ───────────────────────────────────────────────────────────

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ExpenseCodeSequence')
BEGIN
    CREATE TABLE [dbo].[ExpenseCodeSequence] (
        [Id]                    INT     NOT NULL    IDENTITY(1,1),
        [LastSequenceNumber]    INT     NOT NULL    DEFAULT 0,

        CONSTRAINT [PK_ExpenseCodeSequence] PRIMARY KEY CLUSTERED ([Id])
    );

    -- Seed the single sequence row
    INSERT INTO [dbo].[ExpenseCodeSequence] ([LastSequenceNumber]) VALUES (0);
END;
GO

-- ───────────────────────────────────────────────────────────
--  6. VIEWS — Commonly used queries
-- ───────────────────────────────────────────────────────────

-- Active expenses with employee details
IF OBJECT_ID('dbo.vw_ExpenseRequests', 'V') IS NOT NULL
    DROP VIEW [dbo].[vw_ExpenseRequests];
GO

CREATE VIEW [dbo].[vw_ExpenseRequests]
AS
SELECT
    er.[Id],
    er.[ExpenseCode],
    er.[Amount],
    er.[Purpose],
    er.[Description],
    er.[Category],
    er.[RequiredByDate],
    er.[Status],
    er.[CreatedAt],
    er.[ApprovedAt],
    er.[ProcessedAt],
    er.[CancelledAt],
    e.[Id]              AS EmployeeId,
    e.[FullName]        AS EmployeeName,
    e.[Email]           AS EmployeeEmail,
    e.[Department],
    e.[Designation],
    e.[EmployeeCode],
    pr.[PaymentReferenceNumber],
    pr.[Method]         AS PaymentMethod,
    pr.[ProcessedAt]    AS PaymentDate,
    pe.[FullName]       AS ProcessedByName
FROM [dbo].[ExpenseRequests] er
INNER JOIN [dbo].[Employees] e ON er.[EmployeeId] = e.[Id]
LEFT JOIN [dbo].[PaymentRecords] pr ON er.[Id] = pr.[ExpenseRequestId]
LEFT JOIN [dbo].[Employees] pe ON pr.[ProcessedByEmployeeId] = pe.[Id];
GO

-- Dashboard summary statistics
IF OBJECT_ID('dbo.vw_DashboardStats', 'V') IS NOT NULL
    DROP VIEW [dbo].[vw_DashboardStats];
GO

CREATE VIEW [dbo].[vw_DashboardStats]
AS
SELECT
    COUNT(*)                                                        AS TotalRequests,
    SUM(CASE WHEN [Status] = 'Pending'   THEN 1 ELSE 0 END)       AS PendingCount,
    SUM(CASE WHEN [Status] = 'Approved'  THEN 1 ELSE 0 END)       AS ApprovedCount,
    SUM(CASE WHEN [Status] = 'Rejected'  THEN 1 ELSE 0 END)       AS RejectedCount,
    SUM(CASE WHEN [Status] = 'Processed' THEN 1 ELSE 0 END)       AS ProcessedCount,
    SUM(CASE WHEN [Status] = 'Cancelled' THEN 1 ELSE 0 END)       AS CancelledCount,
    ISNULL(SUM(CASE WHEN [Status] = 'Pending'   THEN [Amount] END), 0) AS TotalPendingAmount,
    ISNULL(SUM(CASE WHEN [Status] = 'Approved'  THEN [Amount] END), 0) AS TotalApprovedAmount,
    ISNULL(SUM(CASE WHEN [Status] = 'Processed' THEN [Amount] END), 0) AS TotalProcessedAmount,
    ISNULL(SUM(CASE WHEN [Status] = 'Rejected'  THEN [Amount] END), 0) AS TotalRejectedAmount
FROM [dbo].[ExpenseRequests];
GO

-- ───────────────────────────────────────────────────────────
--  7. STORED PROCEDURE — Generate next expense code
-- ───────────────────────────────────────────────────────────

IF OBJECT_ID('dbo.sp_GetNextExpenseCode', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[sp_GetNextExpenseCode];
GO

CREATE PROCEDURE [dbo].[sp_GetNextExpenseCode]
    @NextCode NVARCHAR(20) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @NextNum INT;

    UPDATE [dbo].[ExpenseCodeSequence]
    SET @NextNum = [LastSequenceNumber] = [LastSequenceNumber] + 1
    WHERE [Id] = 1;

    SET @NextCode = 'EXP-' + RIGHT('000000' + CAST(@NextNum AS NVARCHAR(6)), 6);
END;
GO

-- ───────────────────────────────────────────────────────────
--  8. SEED DATA — Demo employees and sample expenses
-- ───────────────────────────────────────────────────────────

-- Only seed if employees table is empty (idempotent)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Employees])
BEGIN
    PRINT 'Seeding demo data...';

    -- Employees
    INSERT INTO [dbo].[Employees] ([Id], [EntraObjectId], [FullName], [Email], [Department], [Designation], [EmployeeCode], [Role])
    VALUES
        ('11111111-1111-1111-1111-111111111111', 'aad-oid-arun-kumar-001',   'Arun Kumar',   'arun.kumar@qubiqon.io',   'Engineering', 'Senior Software Engineer',    'QBQ-ENG-001', 'Employee'),
        ('22222222-2222-2222-2222-222222222222', 'aad-oid-priya-sharma-002', 'Priya Sharma',  'priya.sharma@qubiqon.io', 'Marketing',   'Marketing Manager',           'QBQ-MKT-001', 'Employee'),
        ('33333333-3333-3333-3333-333333333333', 'aad-oid-rajesh-nair-003', 'Rajesh Nair',   'rajesh.nair@qubiqon.io',  'Engineering', 'Engineering Manager',         'QBQ-ENG-002', 'Approver'),
        ('44444444-4444-4444-4444-444444444444', 'aad-oid-meera-iyer-004',  'Meera Iyer',    'meera.iyer@qubiqon.io',   'Finance',     'Finance Lead',                'QBQ-FIN-001', 'Finance'),
        ('55555555-5555-5555-5555-555555555555', 'aad-oid-vikram-menon-005','Vikram Menon',  'vikram.menon@qubiqon.io', 'Sales',       'Business Development Lead',   'QBQ-SAL-001', 'Employee');

    -- Expense Requests
    INSERT INTO [dbo].[ExpenseRequests] ([Id], [ExpenseCode], [EmployeeId], [Amount], [Purpose], [Category], [RequiredByDate], [Status], [CreatedAt], [ApprovedAt], [ProcessedAt])
    VALUES
        ('AAAA1111-1111-1111-1111-111111111111', 'EXP-000001', '11111111-1111-1111-1111-111111111111', 15000.00,  'Cloud infrastructure - Azure DevOps licenses',            'Software',      '2026-03-20', 'Pending',   '2026-03-10', NULL, NULL),
        ('AAAA2222-2222-2222-2222-222222222222', 'EXP-000002', '22222222-2222-2222-2222-222222222222', 45000.00,  'Digital marketing campaign - Q1 LinkedIn Ads',            'Marketing',     '2026-03-25', 'Approved',  '2026-03-08', '2026-03-09', NULL),
        ('AAAA3333-3333-3333-3333-333333333333', 'EXP-000003', '55555555-5555-5555-5555-555555555555', 8500.00,   'Client meeting travel - Bangalore to Mumbai',             'Travel',        '2026-03-18', 'Approved',  '2026-03-07', '2026-03-08', NULL),
        ('AAAA4444-4444-4444-4444-444444444444', 'EXP-000004', '11111111-1111-1111-1111-111111111111', 32000.00,  'Team offsite - Technical workshop venue booking',         'Events',        '2026-04-05', 'Rejected',  '2026-03-05', NULL, NULL),
        ('AAAA5555-5555-5555-5555-555555555555', 'EXP-000005', '22222222-2222-2222-2222-222222222222', 12000.00,  'Brand collateral printing - Business cards & brochures',  'Marketing',     '2026-03-30', 'Processed', '2026-03-01', '2026-03-02', '2026-03-12'),
        ('AAAA6666-6666-6666-6666-666666666666', 'EXP-000006', '55555555-5555-5555-5555-555555555555', 5200.00,   'Client lunch - Prospective deal closure meeting',         'ClientMeeting', '2026-03-15', 'Pending',   '2026-03-12', NULL, NULL);

    -- Comments
    INSERT INTO [dbo].[ExpenseComments] ([Id], [ExpenseRequestId], [CommentByEmployeeId], [CommentText], [Type], [CreatedAt])
    VALUES
        (NEWID(), 'AAAA2222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Approved. Budget allocated under Q1 marketing.',                   'Approved',          '2026-03-09'),
        (NEWID(), 'AAAA3333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Approved for client engagement.',                                  'Approved',          '2026-03-08'),
        (NEWID(), 'AAAA4444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Rejected. Please explore online workshop options first.',          'Rejected',          '2026-03-06'),
        (NEWID(), 'AAAA5555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Approved.',                                                        'Approved',          '2026-03-02'),
        (NEWID(), 'AAAA5555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'Payment processed via NEFT. Ref: QBQ20260312001',                 'PaymentProcessed',  '2026-03-12');

    -- Payment Record
    INSERT INTO [dbo].[PaymentRecords] ([Id], [ExpenseRequestId], [ProcessedByEmployeeId], [AmountPaid], [PaymentReferenceNumber], [Method], [Notes], [ProcessedAt])
    VALUES
        (NEWID(), 'AAAA5555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 12000.00, 'QBQ20260312001', 'NEFT', 'Processed as part of monthly vendor payments batch.', '2026-03-12');

    -- Update sequence counter
    UPDATE [dbo].[ExpenseCodeSequence] SET [LastSequenceNumber] = 6 WHERE [Id] = 1;

    PRINT 'Demo data seeded successfully.';
END;
GO

-- ───────────────────────────────────────────────────────────
--  9. ROW-LEVEL SECURITY (Optional — for future use)
--  Uncomment to enforce that employees can only see their own data
-- ───────────────────────────────────────────────────────────

/*
-- Create a function to filter rows by the current user's EmployeeId
CREATE FUNCTION dbo.fn_SecurityPredicate(@EmployeeId UNIQUEIDENTIFIER)
RETURNS TABLE
WITH SCHEMABINDING
AS
    RETURN SELECT 1 AS fn_result
    WHERE @EmployeeId = CAST(SESSION_CONTEXT(N'EmployeeId') AS UNIQUEIDENTIFIER)
       OR SESSION_CONTEXT(N'Role') IN (N'Approver', N'Finance', N'Admin');

-- Apply security policy to ExpenseRequests
CREATE SECURITY POLICY dbo.ExpenseSecurityPolicy
    ADD FILTER PREDICATE dbo.fn_SecurityPredicate(EmployeeId) ON dbo.ExpenseRequests
    WITH (STATE = ON);
*/

PRINT '═══════════════════════════════════════════════════════';
PRINT '  Qubiqon Expense Manager database schema created!';
PRINT '  Tables: Employees, ExpenseRequests, ExpenseComments,';
PRINT '          PaymentRecords, ExpenseCodeSequence';
PRINT '  Views:  vw_ExpenseRequests, vw_DashboardStats';
PRINT '  SProc:  sp_GetNextExpenseCode';
PRINT '═══════════════════════════════════════════════════════';
GO
