using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Models;

namespace QubiqonFinanceHub.API.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Account> Accounts { get; set; }

    public virtual DbSet<ActivityComment> ActivityComments { get; set; }

    public virtual DbSet<AdvancePayment> AdvancePayments { get; set; }

    public virtual DbSet<Announcement> Announcements { get; set; }

    public virtual DbSet<Attachment> Attachments { get; set; }

    public virtual DbSet<AttendanceEntry> AttendanceEntries { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<BusinessUnit> BusinessUnits { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Client> Clients { get; set; }

    public virtual DbSet<Client1> Clients1 { get; set; }

    public virtual DbSet<CodeSequence> CodeSequences { get; set; }

    public virtual DbSet<CompOffRequest> CompOffRequests { get; set; }

    public virtual DbSet<CurrencyRatesCache> CurrencyRatesCaches { get; set; }

    public virtual DbSet<Department> Departments { get; set; }

    public virtual DbSet<Designation> Designations { get; set; }

    public virtual DbSet<EmailTemplate> EmailTemplates { get; set; }

    public virtual DbSet<Employee> Employees { get; set; }

    public virtual DbSet<EmployeeBankDetail> EmployeeBankDetails { get; set; }

    public virtual DbSet<EmployeeIdconfig> EmployeeIdconfigs { get; set; }

    public virtual DbSet<EmployeeOrganizationContext> EmployeeOrganizationContexts { get; set; }

    public virtual DbSet<EmployeeRole> EmployeeRoles { get; set; }

    public virtual DbSet<EmployeeRole1> EmployeeRoles1 { get; set; }

    public virtual DbSet<EmployeeSalaryPackage> EmployeeSalaryPackages { get; set; }

    public virtual DbSet<Engagement> Engagements { get; set; }

    public virtual DbSet<ExitReason> ExitReasons { get; set; }

    public virtual DbSet<ExpenseRequest> ExpenseRequests { get; set; }

    public virtual DbSet<FocusArea> FocusAreas { get; set; }

    public virtual DbSet<GeneratedLetter> GeneratedLetters { get; set; }

    public virtual DbSet<Grade> Grades { get; set; }

    public virtual DbSet<HelpdeskCategory> HelpdeskCategories { get; set; }

    public virtual DbSet<HelpdeskComment> HelpdeskComments { get; set; }

    public virtual DbSet<HelpdeskTicket> HelpdeskTickets { get; set; }

    public virtual DbSet<Holiday> Holidays { get; set; }

    public virtual DbSet<HolidayPlan> HolidayPlans { get; set; }

    public virtual DbSet<HolidayType> HolidayTypes { get; set; }

    public virtual DbSet<Invoice> Invoices { get; set; }

    public virtual DbSet<Invoice1> Invoices1 { get; set; }

    public virtual DbSet<InvoiceLineItem> InvoiceLineItems { get; set; }

    public virtual DbSet<LeaveApplication> LeaveApplications { get; set; }

    public virtual DbSet<LeaveBalance> LeaveBalances { get; set; }

    public virtual DbSet<LeaveLedgerEntry> LeaveLedgerEntries { get; set; }

    public virtual DbSet<LeaveType> LeaveTypes { get; set; }

    public virtual DbSet<LetterType> LetterTypes { get; set; }

    public virtual DbSet<Location> Locations { get; set; }

    public virtual DbSet<MaterialRequest> MaterialRequests { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Organization> Organizations { get; set; }

    public virtual DbSet<OrganizationSetting> OrganizationSettings { get; set; }

    public virtual DbSet<PaymentTerm> PaymentTerms { get; set; }

    public virtual DbSet<PayrollComponent> PayrollComponents { get; set; }

    public virtual DbSet<PayrollConfig> PayrollConfigs { get; set; }

    public virtual DbSet<PayrollRun> PayrollRuns { get; set; }

    public virtual DbSet<PayrollRunDetail> PayrollRunDetails { get; set; }

    public virtual DbSet<PerformanceConfig> PerformanceConfigs { get; set; }

    public virtual DbSet<Pfoption> Pfoptions { get; set; }

    public virtual DbSet<PolineItem> PolineItems { get; set; }

    public virtual DbSet<PurchaseOrder> PurchaseOrders { get; set; }

    public virtual DbSet<QhrmsemployeeRole> QhrmsemployeeRoles { get; set; }

    public virtual DbSet<QscmemployeeRole> QscmemployeeRoles { get; set; }

    public virtual DbSet<Quotation> Quotations { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<RequestDocument> RequestDocuments { get; set; }

    public virtual DbSet<ResignationRequest> ResignationRequests { get; set; }

    public virtual DbSet<Resource> Resources { get; set; }

    public virtual DbSet<RevenuePoint> RevenuePoints { get; set; }

    public virtual DbSet<ReviewAssignment> ReviewAssignments { get; set; }

    public virtual DbSet<ReviewForm> ReviewForms { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<SalaryStructure> SalaryStructures { get; set; }

    public virtual DbSet<SalaryStructureComponent> SalaryStructureComponents { get; set; }

    public virtual DbSet<ScmAuditLog> ScmAuditLogs { get; set; }

    public virtual DbSet<Shift> Shifts { get; set; }

    public virtual DbSet<TaxConfiguration> TaxConfigurations { get; set; }

    public virtual DbSet<TaxSlab> TaxSlabs { get; set; }

    public virtual DbSet<Timesheet> Timesheets { get; set; }

    public virtual DbSet<TimesheetLine> TimesheetLines { get; set; }

    public virtual DbSet<TimesheetMonthDocument> TimesheetMonthDocuments { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Vendor> Vendors { get; set; }

    public virtual DbSet<VendorBill> VendorBills { get; set; }

    public virtual DbSet<VendorBillLineItem> VendorBillLineItems { get; set; }

    public virtual DbSet<Wfhrequest> Wfhrequests { get; set; }

    public virtual DbSet<WorkMode> WorkModes { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // When resolved via DI the options are supplied externally; only fall back
        // to the environment for design-time (e.g. `dotnet ef`) use. Never hardcode
        // the connection string here — it carries credentials.
        if (!optionsBuilder.IsConfigured)
            optionsBuilder.UseSqlServer(
                Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
                ?? throw new InvalidOperationException(
                    "Set the ConnectionStrings__DefaultConnection environment variable for design-time use."));
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Account>(entity =>
        {
            entity.ToTable("Accounts", "finance");

            entity.HasIndex(e => new { e.OrganizationId, e.Name }, "IX_Accounts_OrganizationId_Name").IsUnique();

            entity.HasIndex(e => new { e.OrganizationId, e.ShortName }, "IX_Accounts_OrganizationId_ShortName").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Name).HasMaxLength(120);
            entity.Property(e => e.ShortName).HasMaxLength(40);
        });

        modelBuilder.Entity<ActivityComment>(entity =>
        {
            entity.ToTable("ActivityComments", "finance");

            entity.HasIndex(e => e.AdvancePaymentId, "IX_ActivityComments_AdvancePaymentId").HasFilter("([AdvancePaymentId] IS NOT NULL)");

            entity.HasIndex(e => e.CommentByEmployeeId, "IX_ActivityComments_CommentByEmployeeId");

            entity.HasIndex(e => e.ExpenseRequestId, "IX_ActivityComments_ExpenseRequestId").HasFilter("([ExpenseRequestId] IS NOT NULL)");

            entity.HasIndex(e => e.InvoiceId, "IX_ActivityComments_InvoiceId").HasFilter("([InvoiceId] IS NOT NULL)");

            entity.HasIndex(e => e.VendorBillId, "IX_ActivityComments_VendorBillId").HasFilter("([VendorBillId] IS NOT NULL)");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.ActionType).HasMaxLength(20);
            entity.Property(e => e.Text).HasMaxLength(2000);

            entity.HasOne(d => d.AdvancePayment).WithMany(p => p.ActivityComments).HasForeignKey(d => d.AdvancePaymentId);

            entity.HasOne(d => d.CommentByEmployee).WithMany(p => p.ActivityComments)
                .HasForeignKey(d => d.CommentByEmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.ExpenseRequest).WithMany(p => p.ActivityComments).HasForeignKey(d => d.ExpenseRequestId);

            entity.HasOne(d => d.Invoice).WithMany(p => p.ActivityComments).HasForeignKey(d => d.InvoiceId);

            entity.HasOne(d => d.VendorBill).WithMany(p => p.ActivityComments).HasForeignKey(d => d.VendorBillId);
        });

        modelBuilder.Entity<AdvancePayment>(entity =>
        {
            entity.ToTable("AdvancePayments", "finance");

            entity.HasIndex(e => e.EmployeeId, "IX_AdvancePayments_EmployeeId");

            entity.HasIndex(e => new { e.OrganizationId, e.AdvanceCode }, "IX_AdvancePayments_OrganizationId_AdvanceCode").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.AdvanceCode).HasMaxLength(30);
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.PaidAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.PaymentReference).HasMaxLength(100);
            entity.Property(e => e.Purpose).HasMaxLength(500);
            entity.Property(e => e.Status).HasMaxLength(20);

            entity.HasOne(d => d.Employee).WithMany(p => p.AdvancePayments)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<Announcement>(entity =>
        {
            entity.ToTable("Announcements", "qhrms");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.CreatedBy).WithMany(p => p.Announcements)
                .HasForeignKey(d => d.CreatedById)
                .HasConstraintName("FK_Announcements_CreatedBy");

            entity.HasOne(d => d.Organization).WithMany(p => p.Announcements)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Announcements_Organizations");
        });

        modelBuilder.Entity<Attachment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_QSCM_Attachments");

            entity.ToTable("Attachments", "qscm");

            entity.HasIndex(e => e.RequestId, "IX_QSCM_Attachments_RequestId");

            entity.Property(e => e.Id).HasDefaultValueSql("(newsequentialid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.MimeType).HasMaxLength(200);
            entity.Property(e => e.Name).HasMaxLength(500);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Url).HasMaxLength(2000);

            entity.HasOne(d => d.Request).WithMany(p => p.Attachments)
                .HasForeignKey(d => d.RequestId)
                .HasConstraintName("FK_QSCM_Attachments_MaterialRequests_RequestId");

            entity.HasOne(d => d.UploadedByNavigation).WithMany(p => p.Attachments)
                .HasForeignKey(d => d.UploadedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_QSCM_Attachments_Employees_UploadedBy");
        });

        modelBuilder.Entity<AttendanceEntry>(entity =>
        {
            entity.ToTable("AttendanceEntries", "qhrms");

            entity.HasIndex(e => new { e.EmployeeId, e.Date }, "UQ_AttendanceEntries_Employee_Date").IsUnique();

            entity.Property(e => e.Status).HasDefaultValue("Pending");
            entity.Property(e => e.SubmittedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Approver).WithMany(p => p.AttendanceEntryApprovers)
                .HasForeignKey(d => d.ApproverId)
                .HasConstraintName("FK_AttendanceEntries_Approver");

            entity.HasOne(d => d.Employee).WithMany(p => p.AttendanceEntryEmployees)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AttendanceEntries_Employees");

            entity.HasOne(d => d.Shift).WithMany(p => p.AttendanceEntries)
                .HasForeignKey(d => d.ShiftId)
                .HasConstraintName("FK_AttendanceEntries_Shifts");

            entity.HasOne(d => d.WorkMode).WithMany(p => p.AttendanceEntries)
                .HasForeignKey(d => d.WorkModeId)
                .HasConstraintName("FK_AttendanceEntries_WorkModes");
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("AuditLogs", "qhrms");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Ipaddress).HasColumnName("IPAddress");

            entity.HasOne(d => d.Organization).WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.OrganizationId)
                .HasConstraintName("FK_AuditLogs_Organizations");

            entity.HasOne(d => d.PerformedBy).WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.PerformedById)
                .HasConstraintName("FK_AuditLogs_PerformedBy");
        });

        modelBuilder.Entity<BusinessUnit>(entity =>
        {
            entity.ToTable("BusinessUnits", "qhrms");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.Organization).WithMany(p => p.BusinessUnits)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_BusinessUnits_Organizations");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("Categories", "finance");

            entity.HasIndex(e => new { e.OrganizationId, e.Name }, "IX_Categories_OrganizationId_Name").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
        });

        modelBuilder.Entity<Client>(entity =>
        {
            entity.ToTable("Clients", "finance");

            entity.HasIndex(e => e.OrganizationId, "IX_Clients_OrganizationId");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.BillingAddress).HasMaxLength(500);
            entity.Property(e => e.ContactPerson).HasMaxLength(100);
            entity.Property(e => e.Country).HasMaxLength(100);
            entity.Property(e => e.Currency).HasMaxLength(3);
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.Gstin)
                .HasMaxLength(20)
                .HasColumnName("GSTIN");
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.ShippingAddress).HasMaxLength(500);
            entity.Property(e => e.TaxType).HasMaxLength(20);
        });

        modelBuilder.Entity<Client1>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_pm_clients");

            entity.ToTable("clients", "pm");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Contacts).HasColumnName("contacts");
            entity.Property(e => e.Country).HasColumnName("country");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedById).HasColumnName("created_by_id");
            entity.Property(e => e.Csat).HasColumnName("csat");
            entity.Property(e => e.Engagements).HasColumnName("engagements");
            entity.Property(e => e.History).HasColumnName("history");
            entity.Property(e => e.Industry).HasColumnName("industry");
            entity.Property(e => e.IsDeleted).HasColumnName("is_deleted");
            entity.Property(e => e.Name).HasColumnName("name");
            entity.Property(e => e.OpenInvoices).HasColumnName("open_invoices");
            entity.Property(e => e.PrimaryContact).HasColumnName("primary_contact");
            entity.Property(e => e.SinceLabel).HasColumnName("since_label");
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.Tier).HasColumnName("tier");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.CreatedBy).WithMany(p => p.Client1s)
                .HasForeignKey(d => d.CreatedById)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_pm_clients_employees");
        });

        modelBuilder.Entity<CodeSequence>(entity =>
        {
            entity.ToTable("CodeSequences", "finance");

            entity.HasIndex(e => new { e.OrganizationId, e.SequenceType }, "IX_CodeSequences_OrganizationId_SequenceType").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.SequenceType).HasMaxLength(30);
        });

        modelBuilder.Entity<CompOffRequest>(entity =>
        {
            entity.ToTable("CompOffRequests", "qhrms");

            entity.Property(e => e.ManagerRequestInternetMessageId).HasMaxLength(500);
            entity.Property(e => e.ManagerRequestSubject).HasMaxLength(500);
            entity.Property(e => e.Status).HasDefaultValue("Pending");
            entity.Property(e => e.SubmittedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Approver).WithMany(p => p.CompOffRequestApprovers)
                .HasForeignKey(d => d.ApproverId)
                .HasConstraintName("FK_CompOffRequests_Approver");

            entity.HasOne(d => d.Employee).WithMany(p => p.CompOffRequestEmployees)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CompOffRequests_Employees");
        });

        modelBuilder.Entity<CurrencyRatesCache>(entity =>
        {
            entity.HasKey(e => new { e.Base, e.Currency });

            entity.ToTable("CurrencyRatesCache");

            entity.HasIndex(e => e.IsSelected, "UX_CurrencyRatesCache_IsSelected")
                .IsUnique()
                .HasFilter("([IsSelected]=(1))");

            entity.Property(e => e.Base).HasMaxLength(3);
            entity.Property(e => e.Currency).HasMaxLength(3);
            entity.Property(e => e.SyncedAt).HasDefaultValueSql("(sysutcdatetime())");
        });

        modelBuilder.Entity<Department>(entity =>
        {
            entity.ToTable("Departments", "qhrms");

            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.BusinessUnit).WithMany(p => p.Departments)
                .HasForeignKey(d => d.BusinessUnitId)
                .HasConstraintName("FK_Departments_BusinessUnits");

            entity.HasOne(d => d.HeadEmployee).WithMany(p => p.Departments)
                .HasForeignKey(d => d.HeadEmployeeId)
                .HasConstraintName("FK_Departments_HeadEmployee");

            entity.HasOne(d => d.Organization).WithMany(p => p.Departments)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Departments_Organizations");
        });

        modelBuilder.Entity<Designation>(entity =>
        {
            entity.ToTable("Designations", "qhrms");

            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.BusinessUnit).WithMany(p => p.Designations)
                .HasForeignKey(d => d.BusinessUnitId)
                .HasConstraintName("FK_Designations_BusinessUnits");

            entity.HasOne(d => d.Department).WithMany(p => p.Designations)
                .HasForeignKey(d => d.DepartmentId)
                .HasConstraintName("FK_Designations_Departments");

            entity.HasOne(d => d.Organization).WithMany(p => p.Designations)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Designations_Organizations");
        });

        modelBuilder.Entity<EmailTemplate>(entity =>
        {
            entity.HasIndex(e => new { e.OrganizationId, e.TemplateKey }, "IX_EmailTemplates_OrganizationId_TemplateKey").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Subject).HasMaxLength(500);
            entity.Property(e => e.TemplateKey).HasMaxLength(50);

            entity.HasOne(d => d.Organization).WithMany(p => p.EmailTemplates).HasForeignKey(d => d.OrganizationId);
        });

        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasIndex(e => new { e.OrganizationId, e.Email }, "IX_Employees_OrganizationId_Email").IsUnique();

            entity.HasIndex(e => new { e.OrganizationId, e.EntraObjectId }, "IX_Employees_OrganizationId_EntraObjectId")
                .IsUnique()
                .HasFilter("([EntraObjectId] IS NOT NULL)");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.BloodGroup).HasMaxLength(10);
            entity.Property(e => e.Department).HasMaxLength(100);
            entity.Property(e => e.Designation).HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.EmployeeCode).HasMaxLength(50);
            entity.Property(e => e.EmploymentStatus).HasMaxLength(50);
            entity.Property(e => e.EmploymentType).HasMaxLength(50);
            entity.Property(e => e.EntraObjectId).HasMaxLength(36);
            entity.Property(e => e.FirstName).HasMaxLength(100);
            entity.Property(e => e.FullName).HasMaxLength(100);
            entity.Property(e => e.Gender).HasMaxLength(20);
            entity.Property(e => e.PersonalEmail).HasMaxLength(256);
            entity.Property(e => e.PersonalMobile).HasMaxLength(30);
            entity.Property(e => e.Role).HasMaxLength(20);

            entity.HasOne(d => d.BusinessUnit).WithMany(p => p.Employees)
                .HasForeignKey(d => d.BusinessUnitId)
                .HasConstraintName("FK_Employees_BusinessUnits");

            entity.HasOne(d => d.Grade).WithMany(p => p.Employees)
                .HasForeignKey(d => d.GradeId)
                .HasConstraintName("FK_Employees_Grades");

            entity.HasOne(d => d.Manager).WithMany(p => p.InverseManager)
                .HasForeignKey(d => d.ManagerId)
                .HasConstraintName("FK_Employees_Manager");

            entity.HasOne(d => d.Organization).WithMany(p => p.Employees).HasForeignKey(d => d.OrganizationId);
        });

        modelBuilder.Entity<EmployeeBankDetail>(entity =>
        {
            entity.ToTable("EmployeeBankDetails", "qhrms");

            entity.Property(e => e.AccountType).HasDefaultValue("Savings");
            entity.Property(e => e.Ifsccode).HasColumnName("IFSCCode");
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.Employee).WithMany(p => p.EmployeeBankDetails)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_EmployeeBankDetails_Employees");
        });

        modelBuilder.Entity<EmployeeIdconfig>(entity =>
        {
            entity.ToTable("EmployeeIDConfigs", "qhrms");

            entity.Property(e => e.Mode).HasDefaultValue("Manual");
            entity.Property(e => e.Padding).HasDefaultValue(4);
            entity.Property(e => e.Separator).HasDefaultValue("-");
            entity.Property(e => e.StartNumber).HasDefaultValue(1);

            entity.HasOne(d => d.Organization).WithMany(p => p.EmployeeIdconfigs)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_EmployeeIDConfigs_Organizations");
        });

        modelBuilder.Entity<EmployeeOrganizationContext>(entity =>
        {
            entity.HasKey(e => e.EmployeeId);

            entity.ToTable("employee_organization_context");

            entity.Property(e => e.EmployeeId)
                .ValueGeneratedNever()
                .HasColumnName("employee_id");
            entity.Property(e => e.ActiveOrganizationId).HasColumnName("active_organization_id");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.ActiveOrganization).WithMany(p => p.EmployeeOrganizationContexts)
                .HasForeignKey(d => d.ActiveOrganizationId)
                .HasConstraintName("FK_employee_org_ctx_organization");

            entity.HasOne(d => d.Employee).WithOne(p => p.EmployeeOrganizationContext)
                .HasForeignKey<EmployeeOrganizationContext>(d => d.EmployeeId)
                .HasConstraintName("FK_employee_org_ctx_employee");
        });

        modelBuilder.Entity<EmployeeRole>(entity =>
        {
            entity.ToTable("EmployeeRoles", "finance");

            entity.HasIndex(e => e.EmployeeId, "IX_EmployeeRoles_EmployeeId").IsUnique();

            entity.HasIndex(e => e.RoleId, "IX_EmployeeRoles_RoleId");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Employee).WithOne(p => p.EmployeeRole)
                .HasForeignKey<EmployeeRole>(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.Role).WithMany(p => p.EmployeeRoles)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<EmployeeRole1>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_pm_employee_roles");

            entity.ToTable("employee_roles", "pm");

            entity.HasIndex(e => e.EmployeeId, "UQ_pm_employee_roles_employee_id").IsUnique();

            entity.HasIndex(e => e.EntraObjectId, "UQ_pm_employee_roles_entra_object_id").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AssignedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnName("assigned_at");
            entity.Property(e => e.EmployeeId).HasColumnName("employee_id");
            entity.Property(e => e.EntraObjectId).HasColumnName("entra_object_id");
            entity.Property(e => e.EntraSnapshot).HasColumnName("entra_snapshot");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(4000)
                .HasColumnName("password_hash");
            entity.Property(e => e.Role)
                .HasMaxLength(20)
                .HasColumnName("role");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Employee).WithOne(p => p.EmployeeRole1)
                .HasForeignKey<EmployeeRole1>(d => d.EmployeeId)
                .HasConstraintName("FK_pm_employee_roles_employees");
        });

        modelBuilder.Entity<EmployeeSalaryPackage>(entity =>
        {
            entity.ToTable("EmployeeSalaryPackages", "qhrms");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.TotalCtc)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("TotalCTC");

            entity.HasOne(d => d.CreatedBy).WithMany(p => p.EmployeeSalaryPackageCreatedBies)
                .HasForeignKey(d => d.CreatedById)
                .HasConstraintName("FK_EmployeeSalaryPackages_CreatedBy");

            entity.HasOne(d => d.Employee).WithMany(p => p.EmployeeSalaryPackageEmployees)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_EmployeeSalaryPackages_Employees");

            entity.HasOne(d => d.SalaryStructure).WithMany(p => p.EmployeeSalaryPackages)
                .HasForeignKey(d => d.SalaryStructureId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_EmployeeSalaryPackages_SalaryStructures");
        });

        modelBuilder.Entity<Engagement>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_pm_engagements");

            entity.ToTable("engagements", "pm");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ClientId)
                .HasMaxLength(450)
                .HasColumnName("client_id");
            entity.Property(e => e.ClientName).HasColumnName("client_name");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedById).HasColumnName("created_by_id");
            entity.Property(e => e.Currency)
                .HasMaxLength(3)
                .HasDefaultValue("INR")
                .HasColumnName("currency");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.IsDeleted).HasColumnName("is_deleted");
            entity.Property(e => e.Milestones).HasColumnName("milestones");
            entity.Property(e => e.Model).HasColumnName("model");
            entity.Property(e => e.Name).HasColumnName("name");
            entity.Property(e => e.Pm).HasColumnName("pm");
            entity.Property(e => e.Progress).HasColumnName("progress");
            entity.Property(e => e.PurchaseOrder)
                .HasMaxLength(50)
                .HasColumnName("purchase_order");
            entity.Property(e => e.ResourceCount).HasColumnName("resource_count");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnName("updated_at");
            entity.Property(e => e.Value).HasColumnName("value");
            entity.Property(e => e.ValueMonthly).HasColumnName("value_monthly");

            entity.HasOne(d => d.CreatedBy).WithMany(p => p.Engagements)
                .HasForeignKey(d => d.CreatedById)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_pm_engagements_employees");
        });

        modelBuilder.Entity<ExitReason>(entity =>
        {
            entity.ToTable("ExitReasons", "qhrms");

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Type).HasDefaultValue("Resignation");

            entity.HasOne(d => d.Organization).WithMany(p => p.ExitReasons)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ExitReasons_Organizations");
        });

        modelBuilder.Entity<ExpenseRequest>(entity =>
        {
            entity.ToTable("ExpenseRequests", "finance");

            entity.HasIndex(e => e.EmployeeId, "IX_ExpenseRequests_EmployeeId");

            entity.HasIndex(e => new { e.OrganizationId, e.ExpenseCode }, "IX_ExpenseRequests_OrganizationId_ExpenseCode").IsUnique();

            entity.HasIndex(e => new { e.OrganizationId, e.Status, e.CreatedAt }, "IX_ExpenseRequests_OrganizationId_Status_CreatedAt");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.BillImageUrl).HasMaxLength(2048);
            entity.Property(e => e.ExpenseCode).HasMaxLength(30);
            entity.Property(e => e.PaidAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.PaymentReference).HasMaxLength(100);
            entity.Property(e => e.Purpose).HasMaxLength(500);
            entity.Property(e => e.Status).HasMaxLength(20);

            entity.HasOne(d => d.Employee).WithMany(p => p.ExpenseRequests)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<FocusArea>(entity =>
        {
            entity.ToTable("FocusAreas", "qhrms");

            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.Organization).WithMany(p => p.FocusAreas)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_FocusAreas_Organizations");
        });

        modelBuilder.Entity<GeneratedLetter>(entity =>
        {
            entity.ToTable("GeneratedLetters", "qhrms");

            entity.Property(e => e.GeneratedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Status).HasDefaultValue("Draft");

            entity.HasOne(d => d.Employee).WithMany(p => p.GeneratedLetterEmployees)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_GeneratedLetters_Employees");

            entity.HasOne(d => d.GeneratedBy).WithMany(p => p.GeneratedLetterGeneratedBies)
                .HasForeignKey(d => d.GeneratedById)
                .HasConstraintName("FK_GeneratedLetters_GeneratedBy");

            entity.HasOne(d => d.LetterType).WithMany(p => p.GeneratedLetters)
                .HasForeignKey(d => d.LetterTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_GeneratedLetters_LetterTypes");
        });

        modelBuilder.Entity<Grade>(entity =>
        {
            entity.ToTable("Grades", "qhrms");

            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.BusinessUnit).WithMany(p => p.Grades)
                .HasForeignKey(d => d.BusinessUnitId)
                .HasConstraintName("FK_Grades_BusinessUnits");

            entity.HasOne(d => d.Organization).WithMany(p => p.Grades)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Grades_Organizations");
        });

        modelBuilder.Entity<HelpdeskCategory>(entity =>
        {
            entity.ToTable("HelpdeskCategories", "qhrms");

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Type).HasDefaultValue("Request");

            entity.HasOne(d => d.Organization).WithMany(p => p.HelpdeskCategories)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HelpdeskCategories_Organizations");
        });

        modelBuilder.Entity<HelpdeskComment>(entity =>
        {
            entity.ToTable("HelpdeskComments", "qhrms");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Author).WithMany(p => p.HelpdeskComments)
                .HasForeignKey(d => d.AuthorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HelpdeskComments_Author");

            entity.HasOne(d => d.Ticket).WithMany(p => p.HelpdeskComments)
                .HasForeignKey(d => d.TicketId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HelpdeskComments_Tickets");
        });

        modelBuilder.Entity<HelpdeskTicket>(entity =>
        {
            entity.ToTable("HelpdeskTickets", "qhrms");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Priority).HasDefaultValue("Medium");
            entity.Property(e => e.Status).HasDefaultValue("Open");

            entity.HasOne(d => d.AssignedTo).WithMany(p => p.HelpdeskTicketAssignedTos)
                .HasForeignKey(d => d.AssignedToId)
                .HasConstraintName("FK_HelpdeskTickets_AssignedTo");

            entity.HasOne(d => d.Category).WithMany(p => p.HelpdeskTickets)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HelpdeskTickets_Categories");

            entity.HasOne(d => d.Organization).WithMany(p => p.HelpdeskTickets)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HelpdeskTickets_Organizations");

            entity.HasOne(d => d.RaisedBy).WithMany(p => p.HelpdeskTicketRaisedBies)
                .HasForeignKey(d => d.RaisedById)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HelpdeskTickets_RaisedBy");
        });

        modelBuilder.Entity<Holiday>(entity =>
        {
            entity.ToTable("Holidays", "qhrms");

            entity.HasOne(d => d.HolidayPlan).WithMany(p => p.Holidays)
                .HasForeignKey(d => d.HolidayPlanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Holidays_HolidayPlans");
        });

        modelBuilder.Entity<HolidayPlan>(entity =>
        {
            entity.ToTable("HolidayPlans", "qhrms");

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Type).HasDefaultValue("Mandatory");

            entity.HasOne(d => d.BusinessUnit).WithMany(p => p.HolidayPlans)
                .HasForeignKey(d => d.BusinessUnitId)
                .HasConstraintName("FK_HolidayPlans_BusinessUnits");

            entity.HasOne(d => d.Organization).WithMany(p => p.HolidayPlans)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HolidayPlans_Organizations");

            entity.HasOne(d => d.TypeNavigation).WithMany(p => p.HolidayPlans)
                .HasForeignKey(d => d.TypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HolidayPlans_HolidayTypes");
        });

        modelBuilder.Entity<HolidayType>(entity =>
        {
            entity.ToTable("HolidayTypes", "qhrms");

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.ToTable("Invoices", "finance");

            entity.HasIndex(e => e.ClientId, "IX_Invoices_ClientId");

            entity.HasIndex(e => new { e.OrganizationId, e.InvoiceCode }, "IX_Invoices_OrganizationId_InvoiceCode").IsUnique();

            entity.HasIndex(e => new { e.OrganizationId, e.Status }, "IX_Invoices_OrganizationId_Status");

            entity.HasIndex(e => e.TaxConfigId, "IX_Invoices_TaxConfigId");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Currency).HasMaxLength(3);
            entity.Property(e => e.InvoiceCode).HasMaxLength(30);
            entity.Property(e => e.Notes).HasMaxLength(1000);
            entity.Property(e => e.PaidAmound)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("paidAmound");
            entity.Property(e => e.PaymentReference).HasMaxLength(100);
            entity.Property(e => e.PaymentTerms).HasMaxLength(20);
            entity.Property(e => e.PurchaseOrder).HasMaxLength(50);
            entity.Property(e => e.SignedPdfUrl).HasMaxLength(2048);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Total).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalGst)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("TotalGST");
            entity.Property(e => e.TotalInWords).HasMaxLength(500);
            entity.Property(e => e.ZohoSignRequestId).HasMaxLength(64);
            entity.Property(e => e.ZohoSignStatus).HasMaxLength(50);

            entity.HasOne(d => d.Client).WithMany(p => p.Invoices)
                .HasForeignKey(d => d.ClientId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.TaxConfig).WithMany(p => p.Invoices).HasForeignKey(d => d.TaxConfigId);
        });

        modelBuilder.Entity<Invoice1>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_pm_invoices");

            entity.ToTable("invoices", "pm");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AmountInr).HasColumnName("amount_inr");
            entity.Property(e => e.ClientId)
                .HasMaxLength(450)
                .HasColumnName("client_id");
            entity.Property(e => e.ClientName).HasColumnName("client_name");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedById).HasColumnName("created_by_id");
            entity.Property(e => e.DescriptionText).HasColumnName("description_text");
            entity.Property(e => e.Due).HasColumnName("due");
            entity.Property(e => e.EngagementId)
                .HasMaxLength(450)
                .HasColumnName("engagement_id");
            entity.Property(e => e.Issued).HasColumnName("issued");
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.Type).HasColumnName("type");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.CreatedBy).WithMany(p => p.Invoice1s)
                .HasForeignKey(d => d.CreatedById)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_pm_invoices_employees");

            entity.HasOne(d => d.Engagement).WithMany(p => p.Invoice1s)
                .HasForeignKey(d => d.EngagementId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_pm_invoices_engagements");
        });

        modelBuilder.Entity<InvoiceLineItem>(entity =>
        {
            entity.ToTable("InvoiceLineItems", "finance");

            entity.HasIndex(e => e.GstconfigId, "IX_InvoiceLineItems_GSTConfigId");

            entity.HasIndex(e => new { e.InvoiceId, e.LineNumber }, "IX_InvoiceLineItems_InvoiceId_LineNumber");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Gstamount)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("GSTAmount");
            entity.Property(e => e.GstconfigId).HasColumnName("GSTConfigId");
            entity.Property(e => e.Hsncode)
                .HasMaxLength(20)
                .HasColumnName("HSNCode");
            entity.Property(e => e.Quantity).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Rate).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Gstconfig).WithMany(p => p.InvoiceLineItems).HasForeignKey(d => d.GstconfigId);

            entity.HasOne(d => d.Invoice).WithMany(p => p.InvoiceLineItems).HasForeignKey(d => d.InvoiceId);
        });

        modelBuilder.Entity<LeaveApplication>(entity =>
        {
            entity.ToTable("LeaveApplications", "qhrms");

            entity.Property(e => e.AppliedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.DayPart).HasDefaultValue("FullDay");
            entity.Property(e => e.Status).HasDefaultValue("Pending");
            entity.Property(e => e.TotalDays).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Approver).WithMany(p => p.LeaveApplicationApprovers)
                .HasForeignKey(d => d.ApproverId)
                .HasConstraintName("FK_LeaveApplications_Approver");

            entity.HasOne(d => d.Employee).WithMany(p => p.LeaveApplicationEmployees)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LeaveApplications_Employees");

            entity.HasOne(d => d.LeaveType).WithMany(p => p.LeaveApplications)
                .HasForeignKey(d => d.LeaveTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LeaveApplications_LeaveTypes");
        });

        modelBuilder.Entity<LeaveBalance>(entity =>
        {
            entity.ToTable("LeaveBalances", "qhrms");

            entity.HasIndex(e => new { e.EmployeeId, e.LeaveTypeId, e.Year }, "UQ_LeaveBalances_Employee_LeaveType_Year").IsUnique();

            entity.Property(e => e.Accrued).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Adjusted).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CarryForward).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Encashed).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Lapsed).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.OpeningBalance).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Used).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Employee).WithMany(p => p.LeaveBalances)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LeaveBalances_Employees");

            entity.HasOne(d => d.LeaveType).WithMany(p => p.LeaveBalances)
                .HasForeignKey(d => d.LeaveTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LeaveBalances_LeaveTypes");
        });

        modelBuilder.Entity<LeaveLedgerEntry>(entity =>
        {
            entity.ToTable("LeaveLedgerEntries", "qhrms");

            entity.Property(e => e.BalanceAfter).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Days).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TransactionDate).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Employee).WithMany(p => p.LeaveLedgerEntryEmployees)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LeaveLedgerEntries_Employees");

            entity.HasOne(d => d.LeaveType).WithMany(p => p.LeaveLedgerEntries)
                .HasForeignKey(d => d.LeaveTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LeaveLedgerEntries_LeaveTypes");

            entity.HasOne(d => d.PerformedBy).WithMany(p => p.LeaveLedgerEntryPerformedBies)
                .HasForeignKey(d => d.PerformedById)
                .HasConstraintName("FK_LeaveLedgerEntries_PerformedBy");

            entity.HasOne(d => d.RefApplication).WithMany(p => p.LeaveLedgerEntries)
                .HasForeignKey(d => d.RefApplicationId)
                .HasConstraintName("FK_LeaveLedgerEntries_LeaveApplications");
        });

        modelBuilder.Entity<LeaveType>(entity =>
        {
            entity.ToTable("LeaveTypes", "qhrms");

            entity.Property(e => e.AccrualAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Classification).HasDefaultValue("Custom");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.MaxBalance).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.MaxCarryForward).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.MaxEncashment).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.MinDaysPerApplication)
                .HasDefaultValue(0.5m)
                .HasColumnType("decimal(18, 2)");
            entity.Property(e => e.ProRationOnJoining).HasDefaultValue(true);

            entity.HasOne(d => d.Organization).WithMany(p => p.LeaveTypes)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LeaveTypes_Organizations");
        });

        modelBuilder.Entity<LetterType>(entity =>
        {
            entity.ToTable("LetterTypes", "qhrms");

            entity.Property(e => e.Status).HasDefaultValue("Active");

            entity.HasOne(d => d.Organization).WithMany(p => p.LetterTypes)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LetterTypes_Organizations");
        });

        modelBuilder.Entity<Location>(entity =>
        {
            entity.ToTable("Locations", "qhrms");

            entity.Property(e => e.Country).HasDefaultValue("India");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Pincode).HasColumnName("PINCode");

            entity.HasOne(d => d.Employee).WithMany(p => p.Locations)
                .HasForeignKey(d => d.EmployeeId)
                .HasConstraintName("FK_Locations_Employees");

            entity.HasOne(d => d.Organization).WithMany(p => p.Locations)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Locations_Organizations");
        });

        modelBuilder.Entity<MaterialRequest>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_QSCM_MaterialRequests");

            entity.ToTable("MaterialRequests", "qscm");

            entity.HasIndex(e => e.RequestId, "IX_QSCM_MaterialRequests_RequestId")
                .IsUnique()
                .HasFilter("([IsDeleted]=(0))");

            entity.HasIndex(e => e.RequesterId, "IX_QSCM_MaterialRequests_RequesterId");

            entity.Property(e => e.Id).HasDefaultValueSql("(newsequentialid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Department)
                .HasMaxLength(200)
                .HasDefaultValue("");
            entity.Property(e => e.Description).HasDefaultValue("");
            entity.Property(e => e.ItemName).HasMaxLength(300);
            entity.Property(e => e.Priority).HasMaxLength(50);
            entity.Property(e => e.Quantity).HasColumnType("decimal(18, 4)");
            entity.Property(e => e.Reason).HasDefaultValue("");
            entity.Property(e => e.RequestId).HasMaxLength(50);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.Unit)
                .HasMaxLength(50)
                .HasDefaultValue("Nos");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Requester).WithMany(p => p.MaterialRequests)
                .HasForeignKey(d => d.RequesterId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_QSCM_MaterialRequests_Employees_RequesterId");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notifications", "qhrms");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Organization).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Notifications_Organizations");

            entity.HasOne(d => d.Recipient).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.RecipientId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Notifications_Recipient");
        });

        modelBuilder.Entity<Organization>(entity =>
        {
            entity.HasIndex(e => e.OrgName, "IX_Organizations_OrgName").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.AccountHolderName).HasMaxLength(200);
            entity.Property(e => e.AccountNumber).HasMaxLength(50);
            entity.Property(e => e.Address).HasMaxLength(300);
            entity.Property(e => e.BankAddress).HasMaxLength(500);
            entity.Property(e => e.BankName).HasMaxLength(100);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.Country).HasMaxLength(100);
            entity.Property(e => e.Fax).HasMaxLength(20);
            entity.Property(e => e.IfscCode).HasMaxLength(20);
            entity.Property(e => e.Industry).HasMaxLength(100);
            entity.Property(e => e.SwiftCode).HasMaxLength(20);
            entity.Property(e => e.LogoUrl).HasMaxLength(2048);
            entity.Property(e => e.OrgName).HasMaxLength(200);
            entity.Property(e => e.PaymentAddress).HasMaxLength(300);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.PostalCode).HasMaxLength(20);
            entity.Property(e => e.State).HasMaxLength(100);
            entity.Property(e => e.SubName).HasMaxLength(200);
            entity.Property(e => e.Website).HasMaxLength(256);
            entity.Property(e => e.ZohoAuthorizationEndpoint).HasMaxLength(512);
            entity.Property(e => e.ZohoClientId).HasMaxLength(256);
            entity.Property(e => e.ZohoClientSecret).HasMaxLength(512);
            entity.Property(e => e.ZohoCode).HasMaxLength(512);
            entity.Property(e => e.ZohoDataCenter).HasMaxLength(20);
            entity.Property(e => e.ZohoHomePage).HasMaxLength(512);
            entity.Property(e => e.ZohoRedirectUri).HasMaxLength(512);
            entity.Property(e => e.ZohoRefreshToken).HasMaxLength(512);
            entity.Property(e => e.ZohoScope).HasMaxLength(1000);
            entity.Property(e => e.ZohoSignApiBaseUrl).HasMaxLength(512);
            entity.Property(e => e.ZohoSignEmail).HasMaxLength(256);
            entity.Property(e => e.ZohoTokenEndpoint).HasMaxLength(512);
        });

        modelBuilder.Entity<OrganizationSetting>(entity =>
        {
            entity.HasIndex(e => e.OrganizationId1, "IX_OrganizationSettings_OrganizationId1");

            entity.HasIndex(e => new { e.OrganizationId, e.Key }, "IX_OrganizationSettings_OrganizationId_Key").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Key).HasMaxLength(100);

            entity.HasOne(d => d.Organization).WithMany(p => p.OrganizationSettingOrganizations).HasForeignKey(d => d.OrganizationId);

            entity.HasOne(d => d.OrganizationId1Navigation).WithMany(p => p.OrganizationSettingOrganizationId1Navigations).HasForeignKey(d => d.OrganizationId1);
        });

        modelBuilder.Entity<PaymentTerm>(entity =>
        {
            entity.ToTable("PaymentTerms", "finance");

            entity.HasIndex(e => new { e.OrganizationId, e.Name }, "IX_PaymentTerms_OrganizationId_Name").IsUnique();

            entity.HasIndex(e => new { e.OrganizationId, e.ShortName }, "IX_PaymentTerms_OrganizationId_ShortName").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.ShortName).HasMaxLength(30);
        });

        modelBuilder.Entity<PayrollComponent>(entity =>
        {
            entity.ToTable("PayrollComponents", "qhrms");

            entity.Property(e => e.ComponentType).HasDefaultValue("Income");
            entity.Property(e => e.FixedAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsTaxable).HasDefaultValue(true);

            entity.HasOne(d => d.Organization).WithMany(p => p.PayrollComponents)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PayrollComponents_Organizations");
        });

        modelBuilder.Entity<PayrollConfig>(entity =>
        {
            entity.ToTable("PayrollConfigs", "qhrms");

            entity.Property(e => e.AllowVpf).HasColumnName("AllowVPF");
            entity.Property(e => e.PackageMode).HasDefaultValue("Annual");
            entity.Property(e => e.RoundingMode).HasDefaultValue("Nearest");

            entity.HasOne(d => d.Organization).WithMany(p => p.PayrollConfigs)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PayrollConfigs_Organizations");
        });

        modelBuilder.Entity<PayrollRun>(entity =>
        {
            entity.ToTable("PayrollRuns", "qhrms");

            entity.Property(e => e.InitiatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Status).HasDefaultValue("Draft");
            entity.Property(e => e.TotalDeductions).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalGross).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalNetPay).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalPf)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("TotalPF");
            entity.Property(e => e.TotalPt)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("TotalPT");
            entity.Property(e => e.TotalTds)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("TotalTDS");

            entity.HasOne(d => d.ClosedBy).WithMany(p => p.PayrollRunClosedBies)
                .HasForeignKey(d => d.ClosedById)
                .HasConstraintName("FK_PayrollRuns_ClosedBy");

            entity.HasOne(d => d.InitiatedBy).WithMany(p => p.PayrollRunInitiatedBies)
                .HasForeignKey(d => d.InitiatedById)
                .HasConstraintName("FK_PayrollRuns_InitiatedBy");

            entity.HasOne(d => d.Organization).WithMany(p => p.PayrollRuns)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PayrollRuns_Organizations");
        });

        modelBuilder.Entity<PayrollRunDetail>(entity =>
        {
            entity.ToTable("PayrollRunDetails", "qhrms");

            entity.Property(e => e.GrossSalary).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Lopdays)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("LOPDays");
            entity.Property(e => e.NetSalary).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Pfemployee)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("PFEmployee");
            entity.Property(e => e.Pfemployer)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("PFEmployer");
            entity.Property(e => e.Ptamount)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("PTAmount");
            entity.Property(e => e.Status).HasDefaultValue("Generated");
            entity.Property(e => e.Tdsamount)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("TDSAmount");
            entity.Property(e => e.TotalDeductions).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Employee).WithMany(p => p.PayrollRunDetails)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PayrollRunDetails_Employees");

            entity.HasOne(d => d.PayrollRun).WithMany(p => p.PayrollRunDetails)
                .HasForeignKey(d => d.PayrollRunId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PayrollRunDetails_PayrollRuns");
        });

        modelBuilder.Entity<PerformanceConfig>(entity =>
        {
            entity.ToTable("PerformanceConfigs", "qhrms");

            entity.Property(e => e.CycleType).HasDefaultValue("Annual");
            entity.Property(e => e.RatingScale).HasDefaultValue(5);

            entity.HasOne(d => d.Organization).WithMany(p => p.PerformanceConfigs)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PerformanceConfigs_Organizations");
        });

        modelBuilder.Entity<Pfoption>(entity =>
        {
            entity.ToTable("PFOptions", "qhrms");

            entity.Property(e => e.ContributionType).HasDefaultValue("None");
            entity.Property(e => e.ContributionValue).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.Organization).WithMany(p => p.Pfoptions)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PFOptions_Organizations");
        });

        modelBuilder.Entity<PolineItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_QSCM_POLineItems");

            entity.ToTable("POLineItems", "qscm");

            entity.HasIndex(e => e.PurchaseOrderId, "IX_QSCM_POLineItems_PurchaseOrderId");

            entity.Property(e => e.Id).HasDefaultValueSql("(newsequentialid())");
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Quantity).HasColumnType("decimal(18, 4)");
            entity.Property(e => e.Unit).HasMaxLength(50);
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.PurchaseOrder).WithMany(p => p.PolineItems)
                .HasForeignKey(d => d.PurchaseOrderId)
                .HasConstraintName("FK_QSCM_POLineItems_PurchaseOrders_PurchaseOrderId");
        });

        modelBuilder.Entity<PurchaseOrder>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_QSCM_PurchaseOrders");

            entity.ToTable("PurchaseOrders", "qscm");

            entity.HasIndex(e => e.Ponumber, "IX_QSCM_PurchaseOrders_PONumber")
                .IsUnique()
                .HasFilter("([IsDeleted]=(0))");

            entity.HasIndex(e => e.RequestId, "IX_QSCM_PurchaseOrders_RequestId")
                .IsUnique()
                .HasFilter("([IsDeleted]=(0))");

            entity.Property(e => e.Id).HasDefaultValueSql("(newsequentialid())");
            entity.Property(e => e.BuyerCompanyName).HasMaxLength(300);
            entity.Property(e => e.ConfidentialityClause).HasDefaultValue("");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.DeliveryInstallationTerms).HasDefaultValue("");
            entity.Property(e => e.PaymentMode).HasMaxLength(50);
            entity.Property(e => e.PaymentTerms).HasMaxLength(50);
            entity.Property(e => e.PaymentTermsText).HasDefaultValue("");
            entity.Property(e => e.Podate)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("PODate");
            entity.Property(e => e.Ponumber)
                .HasMaxLength(50)
                .HasColumnName("PONumber");
            entity.Property(e => e.ScopeOfServices).HasDefaultValue("");
            entity.Property(e => e.SignedPdfUrl).HasMaxLength(2000);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TerminationClause).HasDefaultValue("");
            entity.Property(e => e.TestingAcceptanceClause).HasDefaultValue("");
            entity.Property(e => e.Total).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.VendorEmail).HasMaxLength(256);
            entity.Property(e => e.VendorName).HasMaxLength(300);
            entity.Property(e => e.WarrantiesSupport).HasDefaultValue("");
            entity.Property(e => e.ZohoSignRequestId).HasMaxLength(200);
            entity.Property(e => e.ZohoSignStatus).HasMaxLength(50);

            entity.HasOne(d => d.CreatedBy).WithMany(p => p.PurchaseOrders)
                .HasForeignKey(d => d.CreatedById)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_QSCM_PurchaseOrders_Employees_CreatedById");

            entity.HasOne(d => d.Quotation).WithMany(p => p.PurchaseOrders)
                .HasForeignKey(d => d.QuotationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_QSCM_PurchaseOrders_Quotations_QuotationId");

            entity.HasOne(d => d.Request).WithOne(p => p.PurchaseOrder)
                .HasForeignKey<PurchaseOrder>(d => d.RequestId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_QSCM_PurchaseOrders_MaterialRequests_RequestId");
        });

        modelBuilder.Entity<QhrmsemployeeRole>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_qhrms_EmployeeRoles");

            entity.ToTable("QHRMSEmployeeRoles", "qhrms");

            entity.HasIndex(e => new { e.EmployeeId, e.RoleId }, "UQ_qhrms_EmployeeRoles_EmployeeId_RoleId").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.Employee).WithMany(p => p.QhrmsemployeeRoles)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_qhrms_EmployeeRoles_Employees");

            entity.HasOne(d => d.Role).WithMany(p => p.QhrmsemployeeRoles)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_qhrms_EmployeeRoles_Roles");
        });

        modelBuilder.Entity<QscmemployeeRole>(entity =>
        {
            entity.ToTable("QSCMEmployeeRoles", "qscm");

            entity.HasIndex(e => new { e.EmployeeId, e.RoleId }, "UQ_QSCMEmployeeRoles_EmployeeId_RoleId").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

            entity.HasOne(d => d.Employee).WithMany(p => p.QscmemployeeRoles)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_QSCMEmployeeRoles_Employees");

            entity.HasOne(d => d.Role).WithMany(p => p.QscmemployeeRoles)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_QSCMEmployeeRoles_Roles");
        });

        modelBuilder.Entity<Quotation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_QSCM_Quotations");

            entity.ToTable("Quotations", "qscm");

            entity.HasIndex(e => e.RequestId, "IX_QSCM_Quotations_RequestId");

            entity.Property(e => e.Id).HasDefaultValueSql("(newsequentialid())");
            entity.Property(e => e.AttachmentName).HasMaxLength(500);
            entity.Property(e => e.AttachmentUrl).HasMaxLength(2000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Currency)
                .HasMaxLength(10)
                .HasDefaultValue("INR");
            entity.Property(e => e.QuotedAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.VendorEmail).HasMaxLength(256);
            entity.Property(e => e.VendorName).HasMaxLength(300);

            entity.HasOne(d => d.CreatedBy).WithMany(p => p.QuotationCreatedBies)
                .HasForeignKey(d => d.CreatedById)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_QSCM_Quotations_Employees_CreatedById");

            entity.HasOne(d => d.Request).WithMany(p => p.Quotations)
                .HasForeignKey(d => d.RequestId)
                .HasConstraintName("FK_QSCM_Quotations_MaterialRequests_RequestId");

            entity.HasOne(d => d.SelectedByNavigation).WithMany(p => p.QuotationSelectedByNavigations)
                .HasForeignKey(d => d.SelectedBy)
                .HasConstraintName("FK_QSCM_Quotations_Employees_SelectedBy");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Token).HasName("PK_pm_refresh_tokens");

            entity.ToTable("refresh_tokens", "pm");

            entity.Property(e => e.Token)
                .HasMaxLength(500)
                .HasColumnName("token");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.EmployeeId).HasColumnName("employee_id");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Employee).WithMany(p => p.RefreshTokens)
                .HasForeignKey(d => d.EmployeeId)
                .HasConstraintName("FK_pm_refresh_tokens_employees");
        });

        modelBuilder.Entity<RequestDocument>(entity =>
        {
            entity.ToTable("RequestDocuments", "finance");

            entity.HasIndex(e => e.ExpenseRequestId, "IX_RequestDocuments_ExpenseRequestId").HasFilter("([ExpenseRequestId] IS NOT NULL)");

            entity.HasIndex(e => new { e.OrganizationId, e.CreatedAt }, "IX_RequestDocuments_OrganizationId_CreatedAt");

            entity.HasIndex(e => e.UploadedByEmployeeId, "IX_RequestDocuments_UploadedByEmployeeId");

            entity.HasIndex(e => e.VendorBillId, "IX_RequestDocuments_VendorBillId").HasFilter("([VendorBillId] IS NOT NULL)");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.ContentType).HasMaxLength(200);
            entity.Property(e => e.FileName).HasMaxLength(260);
            entity.Property(e => e.FileUrl).HasMaxLength(2048);

            entity.HasOne(d => d.ExpenseRequest).WithMany(p => p.RequestDocuments)
                .HasForeignKey(d => d.ExpenseRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.UploadedByEmployee).WithMany(p => p.RequestDocuments)
                .HasForeignKey(d => d.UploadedByEmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.VendorBill).WithMany(p => p.RequestDocuments)
                .HasForeignKey(d => d.VendorBillId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ResignationRequest>(entity =>
        {
            entity.ToTable("ResignationRequests", "qhrms");

            entity.Property(e => e.OfficialLwd).HasColumnName("OfficialLWD");
            entity.Property(e => e.PreferredLwd).HasColumnName("PreferredLWD");
            entity.Property(e => e.Status).HasDefaultValue("Pending");
            entity.Property(e => e.SubmittedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Approver).WithMany(p => p.ResignationRequestApprovers)
                .HasForeignKey(d => d.ApproverId)
                .HasConstraintName("FK_ResignationRequests_Approver");

            entity.HasOne(d => d.Employee).WithMany(p => p.ResignationRequestEmployees)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ResignationRequests_Employees");

            entity.HasOne(d => d.ExitReason).WithMany(p => p.ResignationRequests)
                .HasForeignKey(d => d.ExitReasonId)
                .HasConstraintName("FK_ResignationRequests_ExitReasons");
        });

        modelBuilder.Entity<Resource>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_pm_resources");

            entity.ToTable("resources", "pm");

            entity.HasIndex(e => e.EmployeeId, "UQ_pm_resources_employee_id").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedById).HasColumnName("created_by_id");
            entity.Property(e => e.EmployeeId).HasColumnName("employee_id");
            entity.Property(e => e.Name).HasColumnName("name");
            entity.Property(e => e.Rate).HasColumnName("rate");
            entity.Property(e => e.Role).HasColumnName("role");
            entity.Property(e => e.Skills).HasColumnName("skills");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.CreatedBy).WithMany(p => p.ResourceCreatedBies)
                .HasForeignKey(d => d.CreatedById)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_pm_resources_employees_createdby");

            entity.HasOne(d => d.Employee).WithOne(p => p.ResourceEmployee)
                .HasForeignKey<Resource>(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_pm_resources_employees");
        });

        modelBuilder.Entity<RevenuePoint>(entity =>
        {
            entity.HasKey(e => e.Month).HasName("PK_pm_revenue_points");

            entity.ToTable("revenue_points", "pm");

            entity.Property(e => e.Month).HasColumnName("month");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedById).HasColumnName("created_by_id");
            entity.Property(e => e.Revenue).HasColumnName("revenue");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.CreatedBy).WithMany(p => p.RevenuePoints)
                .HasForeignKey(d => d.CreatedById)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_pm_revenue_points_employees");
        });

        modelBuilder.Entity<ReviewAssignment>(entity =>
        {
            entity.ToTable("ReviewAssignments", "qhrms");

            entity.Property(e => e.AssignedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.FinalRating).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.HrevalStatus)
                .HasDefaultValue("Not Started")
                .HasColumnName("HREvalStatus");
            entity.Property(e => e.ManagerEvalStatus).HasDefaultValue("Not Started");
            entity.Property(e => e.SelfEvalStatus).HasDefaultValue("Not Started");

            entity.HasOne(d => d.Employee).WithMany(p => p.ReviewAssignments)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ReviewAssignments_Employees");

            entity.HasOne(d => d.ReviewForm).WithMany(p => p.ReviewAssignments)
                .HasForeignKey(d => d.ReviewFormId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ReviewAssignments_ReviewForms");
        });

        modelBuilder.Entity<ReviewForm>(entity =>
        {
            entity.ToTable("ReviewForms", "qhrms");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Status).HasDefaultValue("Active");
            entity.Property(e => e.Version).HasDefaultValue(1);

            entity.HasOne(d => d.Organization).WithMany(p => p.ReviewForms)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ReviewForms_Organizations");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasIndex(e => e.Code, "UQ_Roles_Code").IsUnique();

            entity.Property(e => e.Code)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.DisplayName)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<SalaryStructure>(entity =>
        {
            entity.ToTable("SalaryStructures", "qhrms");

            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.BusinessUnit).WithMany(p => p.SalaryStructures)
                .HasForeignKey(d => d.BusinessUnitId)
                .HasConstraintName("FK_SalaryStructures_BusinessUnits");

            entity.HasOne(d => d.Organization).WithMany(p => p.SalaryStructures)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SalaryStructures_Organizations");
        });

        modelBuilder.Entity<SalaryStructureComponent>(entity =>
        {
            entity.ToTable("SalaryStructureComponents", "qhrms");

            entity.Property(e => e.FixedAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Component).WithMany(p => p.SalaryStructureComponents)
                .HasForeignKey(d => d.ComponentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SalaryStructureComponents_PayrollComponents");

            entity.HasOne(d => d.SalaryStructure).WithMany(p => p.SalaryStructureComponents)
                .HasForeignKey(d => d.SalaryStructureId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SalaryStructureComponents_SalaryStructures");
        });

        modelBuilder.Entity<ScmAuditLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_QSCM_ScmAuditLogs");

            entity.ToTable("ScmAuditLogs", "qscm");

            entity.HasIndex(e => e.EmployeeId, "IX_QSCM_AuditLogs_EmployeeId");

            entity.HasIndex(e => new { e.EntityType, e.EntityId }, "IX_QSCM_AuditLogs_EntityType_EntityId");

            entity.Property(e => e.Id).HasDefaultValueSql("(newsequentialid())");
            entity.Property(e => e.Action).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.EntityType).HasMaxLength(100);
            entity.Property(e => e.IpAddress).HasMaxLength(64);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Employee).WithMany(p => p.ScmAuditLogs)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_QSCM_ScmAuditLogs_Employees_EmployeeId");
        });

        modelBuilder.Entity<Shift>(entity =>
        {
            entity.ToTable("Shifts", "qhrms");

            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.Organization).WithMany(p => p.Shifts)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Shifts_Organizations");
        });

        modelBuilder.Entity<TaxConfiguration>(entity =>
        {
            entity.ToTable("TaxConfigurations", "finance");

            entity.HasIndex(e => new { e.OrganizationId, e.Type, e.IsActive }, "IX_TaxConfigurations_OrganizationId_Type_IsActive");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Rate).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.Section).HasMaxLength(100);
            entity.Property(e => e.SubType).HasMaxLength(20);
            entity.Property(e => e.Type).HasMaxLength(10);

            entity.HasOne(d => d.Organization).WithMany(p => p.TaxConfigurations).HasForeignKey(d => d.OrganizationId);
        });

        modelBuilder.Entity<TaxSlab>(entity =>
        {
            entity.ToTable("TaxSlabs", "qhrms");

            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.Organization).WithMany(p => p.TaxSlabs)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TaxSlabs_Organizations");
        });

        modelBuilder.Entity<Timesheet>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_pm_timesheets");

            entity.ToTable("timesheets", "pm");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ApprovedOn).HasColumnName("approved_on");
            entity.Property(e => e.Approver).HasColumnName("approver");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedById).HasColumnName("created_by_id");
            entity.Property(e => e.RejectedOn).HasColumnName("rejected_on");
            entity.Property(e => e.RejectionReason)
                .HasMaxLength(4000)
                .HasColumnName("rejection_reason");
            entity.Property(e => e.ResourceId)
                .HasMaxLength(450)
                .HasColumnName("resource_id");
            entity.Property(e => e.ResourceName).HasColumnName("resource_name");
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.SubmittedOn).HasColumnName("submitted_on");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnName("updated_at");
            entity.Property(e => e.WeekEnd).HasColumnName("week_end");
            entity.Property(e => e.WeekLabel).HasColumnName("week_label");
            entity.Property(e => e.WeekStart).HasColumnName("week_start");

            entity.HasOne(d => d.CreatedBy).WithMany(p => p.Timesheets)
                .HasForeignKey(d => d.CreatedById)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_pm_timesheets_employees");

            entity.HasOne(d => d.Resource).WithMany(p => p.Timesheets)
                .HasForeignKey(d => d.ResourceId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_pm_timesheets_resources");
        });

        modelBuilder.Entity<TimesheetLine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_pm_timesheet_lines");

            entity.ToTable("timesheet_lines", "pm");

            entity.HasIndex(e => e.EngagementId, "IX_pm_timesheet_lines_engagement_id");

            entity.HasIndex(e => e.TimesheetId, "IX_pm_timesheet_lines_timesheet_id");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("id");
            entity.Property(e => e.Category)
                .HasMaxLength(255)
                .HasColumnName("category");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.DocumentBlobName)
                .HasMaxLength(1024)
                .HasColumnName("document_blob_name");
            entity.Property(e => e.DocumentContentType)
                .HasMaxLength(255)
                .HasColumnName("document_content_type");
            entity.Property(e => e.DocumentFileName)
                .HasMaxLength(512)
                .HasColumnName("document_file_name");
            entity.Property(e => e.DocumentSize).HasColumnName("document_size");
            entity.Property(e => e.DocumentUrl)
                .HasMaxLength(2048)
                .HasColumnName("document_url");
            entity.Property(e => e.EngagementId).HasColumnName("engagement_id");
            entity.Property(e => e.Hours).HasColumnName("hours");
            entity.Property(e => e.TimesheetId).HasColumnName("timesheet_id");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Timesheet).WithMany(p => p.TimesheetLines)
                .HasForeignKey(d => d.TimesheetId)
                .HasConstraintName("FK_pm_timesheet_lines_timesheets");
        });

        modelBuilder.Entity<TimesheetMonthDocument>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_pm_timesheet_month_documents");

            entity.ToTable("timesheet_month_documents", "pm");

            entity.HasIndex(e => e.EngagementId, "IX_pm_timesheet_month_documents_engagement_id");

            entity.HasIndex(e => new { e.EngagementId, e.MonthKey }, "UQ_pm_timesheet_month_documents_engagement_month").IsUnique();

            entity.Property(e => e.Id)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("id");
            entity.Property(e => e.BlobName)
                .HasMaxLength(1024)
                .HasColumnName("blob_name");
            entity.Property(e => e.ContentType)
                .HasMaxLength(255)
                .HasColumnName("content_type");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.EngagementId).HasColumnName("engagement_id");
            entity.Property(e => e.FileName)
                .HasMaxLength(512)
                .HasColumnName("file_name");
            entity.Property(e => e.MonthKey)
                .HasMaxLength(7)
                .HasColumnName("month_key");
            entity.Property(e => e.Size).HasColumnName("size");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("updated_at");
            entity.Property(e => e.UploadedById).HasColumnName("uploaded_by_id");
            entity.Property(e => e.Url)
                .HasMaxLength(2048)
                .HasColumnName("url");

            entity.HasOne(d => d.Engagement).WithMany(p => p.TimesheetMonthDocuments)
                .HasForeignKey(d => d.EngagementId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_pm_timesheet_month_documents_engagements");

            entity.HasOne(d => d.UploadedBy).WithMany(p => p.TimesheetMonthDocuments)
                .HasForeignKey(d => d.UploadedById)
                .HasConstraintName("FK_pm_timesheet_month_documents_employees");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_QSCM_Users");

            entity.ToTable("Users", "qscm");

            entity.HasIndex(e => e.Email, "IX_QSCM_Users_Email")
                .IsUnique()
                .HasFilter("([IsDeleted]=(0))");

            entity.Property(e => e.Id).HasDefaultValueSql("(newsequentialid())");
            entity.Property(e => e.AvatarUrl).HasMaxLength(2000);
            entity.Property(e => e.AzureObjectId).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Department)
                .HasMaxLength(200)
                .HasDefaultValue("");
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.RefreshToken).HasMaxLength(500);
            entity.Property(e => e.Role).HasMaxLength(50);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");
        });

        modelBuilder.Entity<Vendor>(entity =>
        {
            entity.ToTable("Vendors", "finance");

            entity.HasIndex(e => e.OrganizationId, "IX_Vendors_OrganizationId");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.AccountNumber).HasMaxLength(50);
            entity.Property(e => e.Address)
                .HasMaxLength(500)
                .HasDefaultValue("");
            entity.Property(e => e.BankName).HasMaxLength(100);
            entity.Property(e => e.Category).HasMaxLength(100);
            entity.Property(e => e.ContactPerson).HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.Gstin)
                .HasMaxLength(20)
                .HasColumnName("GSTIN");
            entity.Property(e => e.IfscCode).HasMaxLength(20);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Phone).HasMaxLength(20);
        });

        modelBuilder.Entity<VendorBill>(entity =>
        {
            entity.ToTable("VendorBills", "finance");

            entity.HasIndex(e => new { e.OrganizationId, e.BillCode }, "IX_VendorBills_OrganizationId_BillCode").IsUnique();

            entity.HasIndex(e => new { e.OrganizationId, e.Status }, "IX_VendorBills_OrganizationId_Status");

            entity.HasIndex(e => e.TaxConfigId, "IX_VendorBills_TaxConfigId");

            entity.HasIndex(e => e.VendorId, "IX_VendorBills_VendorId");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.AttachmentUrl).HasMaxLength(2048);
            entity.Property(e => e.BillCode).HasMaxLength(30);
            entity.Property(e => e.Ccemails)
                .HasMaxLength(1000)
                .HasColumnName("CCEmails");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.DiscountPercent).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.PaidAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.PaymentReference).HasMaxLength(100);
            entity.Property(e => e.PaymentTerms).HasMaxLength(20);
            entity.Property(e => e.Rounding).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.Tdsamount)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("TDSAmount");
            entity.Property(e => e.TotalPayable).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.VendorBillNumber)
                .HasMaxLength(20)
                .HasDefaultValue("")
                .HasColumnName("vendorBillNumber");

            entity.HasOne(d => d.TaxConfig).WithMany(p => p.VendorBills).HasForeignKey(d => d.TaxConfigId);

            entity.HasOne(d => d.Vendor).WithMany(p => p.VendorBills)
                .HasForeignKey(d => d.VendorId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<VendorBillLineItem>(entity =>
        {
            entity.ToTable("VendorBillLineItems", "finance");

            entity.HasIndex(e => e.GstconfigId, "IX_VendorBillLineItems_GSTConfigId");

            entity.HasIndex(e => new { e.VendorBillId, e.LineNumber }, "IX_VendorBillLineItems_VendorBillId_LineNumber");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Account).HasMaxLength(100);
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.GstconfigId).HasColumnName("GSTConfigId");
            entity.Property(e => e.Quantity).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Rate).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Gstconfig).WithMany(p => p.VendorBillLineItems).HasForeignKey(d => d.GstconfigId);

            entity.HasOne(d => d.VendorBill).WithMany(p => p.VendorBillLineItems).HasForeignKey(d => d.VendorBillId);
        });

        modelBuilder.Entity<Wfhrequest>(entity =>
        {
            entity.ToTable("WFHRequests", "qhrms");

            entity.Property(e => e.Status).HasDefaultValue("Pending");
            entity.Property(e => e.SubmittedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Approver).WithMany(p => p.WfhrequestApprovers)
                .HasForeignKey(d => d.ApproverId)
                .HasConstraintName("FK_WFHRequests_Approver");

            entity.HasOne(d => d.Employee).WithMany(p => p.WfhrequestEmployees)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_WFHRequests_Employees");
        });

        modelBuilder.Entity<WorkMode>(entity =>
        {
            entity.ToTable("WorkModes", "qhrms");

            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.Organization).WithMany(p => p.WorkModes)
                .HasForeignKey(d => d.OrganizationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_WorkModes_Organizations");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
