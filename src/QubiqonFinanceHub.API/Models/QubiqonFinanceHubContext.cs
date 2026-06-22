using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace QubiqonFinanceHub.API.Models;

public partial class QubiqonFinanceHubContext : DbContext
{
    public QubiqonFinanceHubContext()
    {
    }

    public QubiqonFinanceHubContext(DbContextOptions<QubiqonFinanceHubContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Account> Accounts { get; set; }

    public virtual DbSet<ActivityComment> ActivityComments { get; set; }

    public virtual DbSet<AdvancePayment> AdvancePayments { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Client> Clients { get; set; }

    public virtual DbSet<Client1> Clients1 { get; set; }

    public virtual DbSet<CodeSequence> CodeSequences { get; set; }

    public virtual DbSet<CurrencyRatesCache> CurrencyRatesCaches { get; set; }

    public virtual DbSet<EmailTemplate> EmailTemplates { get; set; }

    public virtual DbSet<Employee> Employees { get; set; }

    public virtual DbSet<EmployeeOrganizationContext> EmployeeOrganizationContexts { get; set; }

    public virtual DbSet<EmployeeRole> EmployeeRoles { get; set; }

    public virtual DbSet<EmployeeRole1> EmployeeRoles1 { get; set; }

    public virtual DbSet<Engagement> Engagements { get; set; }

    public virtual DbSet<ExpenseRequest> ExpenseRequests { get; set; }

    public virtual DbSet<Invoice> Invoices { get; set; }

    public virtual DbSet<Invoice1> Invoices1 { get; set; }

    public virtual DbSet<InvoiceLineItem> InvoiceLineItems { get; set; }

    public virtual DbSet<Organization> Organizations { get; set; }

    public virtual DbSet<OrganizationSetting> OrganizationSettings { get; set; }

    public virtual DbSet<PaymentTerm> PaymentTerms { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<RequestDocument> RequestDocuments { get; set; }

    public virtual DbSet<Resource> Resources { get; set; }

    public virtual DbSet<RevenuePoint> RevenuePoints { get; set; }

    public virtual DbSet<TaxConfiguration> TaxConfigurations { get; set; }

    public virtual DbSet<Timesheet> Timesheets { get; set; }

    public virtual DbSet<Vendor> Vendors { get; set; }

    public virtual DbSet<VendorBill> VendorBills { get; set; }

    public virtual DbSet<VendorBillLineItem> VendorBillLineItems { get; set; }

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
            entity.Property(e => e.Department).HasMaxLength(100);
            entity.Property(e => e.Designation).HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.EmployeeCode).HasMaxLength(50);
            entity.Property(e => e.EntraObjectId).HasMaxLength(36);
            entity.Property(e => e.FullName).HasMaxLength(100);
            entity.Property(e => e.Role).HasMaxLength(20);

            entity.HasOne(d => d.Organization).WithMany(p => p.Employees).HasForeignKey(d => d.OrganizationId);
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
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TaxAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Total).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalGst)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("TotalGST");
            entity.Property(e => e.TotalInWords).HasMaxLength(500);

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

        modelBuilder.Entity<Organization>(entity =>
        {
            entity.HasIndex(e => e.OrgName, "IX_Organizations_OrgName").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.AccountNumber).HasMaxLength(50);
            entity.Property(e => e.Address).HasMaxLength(300);
            entity.Property(e => e.BankAddress).HasMaxLength(500);
            entity.Property(e => e.BankName).HasMaxLength(100);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.Country).HasMaxLength(100);
            entity.Property(e => e.Fax).HasMaxLength(20);
            entity.Property(e => e.IfscCode).HasMaxLength(20);
            entity.Property(e => e.Industry).HasMaxLength(100);
            entity.Property(e => e.LogoUrl).HasMaxLength(2048);
            entity.Property(e => e.OrgName).HasMaxLength(200);
            entity.Property(e => e.PaymentAddress).HasMaxLength(300);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.PostalCode).HasMaxLength(20);
            entity.Property(e => e.State).HasMaxLength(100);
            entity.Property(e => e.SubName).HasMaxLength(200);
            entity.Property(e => e.Website).HasMaxLength(256);
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

        modelBuilder.Entity<TaxConfiguration>(entity =>
        {
            entity.ToTable("TaxConfigurations", "finance");

            entity.HasIndex(e => new { e.OrganizationId, e.Type, e.IsActive }, "IX_TaxConfigurations_OrganizationId_Type_IsActive");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Rate).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.Section).HasMaxLength(20);
            entity.Property(e => e.SubType).HasMaxLength(20);
            entity.Property(e => e.Type).HasMaxLength(10);

            entity.HasOne(d => d.Organization).WithMany(p => p.TaxConfigurations).HasForeignKey(d => d.OrganizationId);
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

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
