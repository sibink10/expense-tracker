using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Auth.Shared;
using QubiqonFinanceHub.API.Models.Entities;
using CurrencyRatesCache = QubiqonFinanceHub.API.Models.CurrencyRatesCache;
using QubiqonFinanceHub.API.Models.Enums;

namespace QubiqonFinanceHub.API.Data;

public class FinanceHubDbContext : DbContext
{
    public FinanceHubDbContext(DbContextOptions<FinanceHubDbContext> options) : base(options) { }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<OrganizationSetting> OrganizationSettings => Set<OrganizationSetting>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<FinanceEmployeeRole> FinanceEmployeeRoles => Set<FinanceEmployeeRole>();
    public DbSet<EmployeeOrganizationContext> EmployeeOrganizationContexts => Set<EmployeeOrganizationContext>();
    public DbSet<ExpenseRequest> ExpenseRequests => Set<ExpenseRequest>();
    public DbSet<Forecast> Forecasts => Set<Forecast>();
    public DbSet<AdvancePayment> AdvancePayments => Set<AdvancePayment>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<VendorBill> VendorBills => Set<VendorBill>();
    public DbSet<VendorBillLineItem> VendorBillLineItems => Set<VendorBillLineItem>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceLineItem> InvoiceLineItems => Set<InvoiceLineItem>();
    public DbSet<TaxConfiguration> TaxConfigurations => Set<TaxConfiguration>();
    public DbSet<ActivityComment> ActivityComments => Set<ActivityComment>();
    public DbSet<RequestDocument> RequestDocuments => Set<RequestDocument>();
    public DbSet<EmailTemplate> EmailTemplates => Set<EmailTemplate>();
    public DbSet<CodeSequence> CodeSequences => Set<CodeSequence>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<PaymentTerm> PaymentTerms => Set<PaymentTerm>();
    public DbSet<GstTreatment> GstTreatments => Set<GstTreatment>();
    public DbSet<PlaceOfSupply> PlaceOfSupply => Set<PlaceOfSupply>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<CurrencyRatesCache> CurrencyRatesCaches => Set<CurrencyRatesCache>();
    public DbSet<AuthSession> AuthSessions => Set<AuthSession>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        // ─── dbo (shared / platform) ─────────────────
        b.Entity<Organization>(e => {
            e.ToTable("Organizations", DbSchemas.Dbo);
            e.HasIndex(x => x.OrgName).IsUnique();
        });

        b.Entity<OrganizationSetting>(e => {
            e.ToTable("OrganizationSettings", DbSchemas.Dbo);
            e.HasIndex(x => new { x.OrganizationId, x.Key }).IsUnique();
            e.HasOne(x => x.Organization)
             .WithMany()
             .HasForeignKey(x => x.OrganizationId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<EmailTemplate>(e => {
            e.ToTable("EmailTemplates", DbSchemas.Dbo);
            e.HasIndex(x => new { x.OrganizationId, x.TemplateKey }).IsUnique();
        });

        b.Entity<Employee>(e => {
            e.ToTable("Employees", DbSchemas.Dbo);
            // Multiple employees may omit Entra (manual adds); uniqueness only when set (matches DB filter).
            e.HasIndex(x => new { x.OrganizationId, x.EntraObjectId })
                .IsUnique()
                .HasFilter("[EntraObjectId] IS NOT NULL");
            e.HasIndex(x => new { x.OrganizationId, x.Email }).IsUnique();
            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.HasFinanceAccess).HasDefaultValue(true);
        });

        b.Entity<Role>(e => {
            e.ToTable("Roles", DbSchemas.Dbo);
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.Code).HasMaxLength(50).IsUnicode(false);
            e.Property(x => x.DisplayName).HasMaxLength(100).IsUnicode(false);
            e.Property(x => x.IsActive).HasDefaultValue(true);
        });

        b.Entity<FinanceEmployeeRole>(e => {
            e.ToTable("EmployeeRoles", DbSchemas.Finance);
            e.HasIndex(x => x.EmployeeId).IsUnique();
            e.Property(x => x.Id).ValueGeneratedOnAdd();
            e.Property(x => x.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");
            e.Property(x => x.IsActive).HasDefaultValue(true);
            e.HasOne(x => x.Employee)
                .WithOne(x => x.FinanceRole)
                .HasForeignKey<FinanceEmployeeRole>(x => x.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Role)
                .WithMany()
                .HasForeignKey(x => x.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<EmployeeOrganizationContext>(e => {
            e.ToTable("employee_organization_context", DbSchemas.Dbo);
            e.HasKey(x => x.EmployeeId);
            e.Property(x => x.EmployeeId).HasColumnName("employee_id");
            e.Property(x => x.ActiveOrganizationId).HasColumnName("active_organization_id");
            e.Property(x => x.UpdatedAt)
                .HasColumnName("updated_at")
                .HasDefaultValueSql("(sysutcdatetime())");
            e.HasOne(x => x.Employee)
                .WithOne(x => x.OrganizationContext)
                .HasForeignKey<EmployeeOrganizationContext>(x => x.EmployeeId)
                .HasConstraintName("FK_employee_org_ctx_employee");
            e.HasOne(x => x.ActiveOrganization)
                .WithMany()
                .HasForeignKey(x => x.ActiveOrganizationId)
                .HasConstraintName("FK_employee_org_ctx_organization");
        });

        b.Entity<CurrencyRatesCache>(e => {
            e.HasKey(x => new { x.Base, x.Currency });
            e.ToTable("CurrencyRatesCache");
            e.HasIndex(x => x.IsSelected, "UX_CurrencyRatesCache_IsSelected")
                .IsUnique()
                .HasFilter("([IsSelected]=(1))");
            e.Property(x => x.Base).HasMaxLength(3);
            e.Property(x => x.Currency).HasMaxLength(3);
            e.Property(x => x.SyncedAt).HasDefaultValueSql("(sysutcdatetime())");
        });

        // ─── finance (domain tables) ─────────────────
        b.Entity<ExpenseRequest>(e => {
            e.ToTable("ExpenseRequests", DbSchemas.Finance);
            e.HasIndex(x => new { x.OrganizationId, x.ExpenseCode }).IsUnique();
            e.HasIndex(x => new { x.OrganizationId, x.Status, x.CreatedAt });
            e.HasIndex(x => x.ForecastId).HasFilter("[ForecastId] IS NOT NULL");
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Employee).WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Forecast)
                .WithMany(x => x.ExpenseRequests)
                .HasForeignKey(x => x.ForecastId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Forecast ───────────────────────────────
        b.Entity<Forecast>(e => {
            e.ToTable("Forecasts", DbSchemas.Finance);
            e.HasIndex(x => new { x.OrganizationId, x.Status, x.CreatedAt });
            e.HasIndex(x => x.CreatedByEmployeeId);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.CreatedByEmployee)
                .WithMany()
                .HasForeignKey(x => x.CreatedByEmployeeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Advance ────────────────────────────────
        b.Entity<AdvancePayment>(e => {
            e.ToTable("AdvancePayments", DbSchemas.Finance);
            e.HasIndex(x => new { x.OrganizationId, x.AdvanceCode }).IsUnique();
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Employee).WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Vendor ─────────────────────────────────
        b.Entity<Vendor>(e => {
            e.ToTable("Vendors", DbSchemas.Finance);
            e.HasIndex(x => x.OrganizationId);
        });

        // ─── Vendor Bill ────────────────────────────
        b.Entity<VendorBill>(e => {
            e.ToTable("VendorBills", DbSchemas.Finance);
            e.HasIndex(x => new { x.OrganizationId, x.BillCode }).IsUnique();
            e.HasIndex(x => new { x.OrganizationId, x.Status });
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Vendor).WithMany().HasForeignKey(x => x.VendorId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<VendorBillLineItem>(e => {
            e.ToTable("VendorBillLineItems", DbSchemas.Finance);
            e.HasIndex(x => new { x.VendorBillId, x.LineNumber });
            e.HasOne(x => x.VendorBill)
                .WithMany(x => x.LineItems)
                .HasForeignKey(x => x.VendorBillId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.GSTConfig).WithMany().HasForeignKey(x => x.GSTConfigId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<GstTreatment>(e => {
            e.ToTable("GstTreatments", DbSchemas.Dbo);
            e.HasIndex(x => x.Code).IsUnique();
        });

        b.Entity<PlaceOfSupply>(e => {
            e.ToTable("PlaceOfSupply", DbSchemas.Dbo);
            e.Property(x => x.PlaceOfSupplyCode).HasMaxLength(2).IsUnicode(false);
        });

        // ─── Client ─────────────────────────────────
        b.Entity<Client>(e => {
            e.ToTable("Clients", DbSchemas.Finance);
            e.HasIndex(x => x.OrganizationId);
            e.Property(x => x.IsTaxable).HasDefaultValue(true);
            e.Property(x => x.PlaceOfSupplyCode).HasMaxLength(2).IsUnicode(false);
            e.HasOne(x => x.GstTreatment)
                .WithMany()
                .HasForeignKey(x => x.GstTreatmentId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.PlaceOfSupply)
                .WithMany()
                .HasForeignKey(x => x.PlaceOfSupplyCode)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.PaymentTerm)
                .WithMany()
                .HasForeignKey(x => x.PaymentTermsId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Invoice ────────────────────────────────
        b.Entity<Invoice>(e => {
            e.ToTable("Invoices", DbSchemas.Finance);
            e.HasIndex(x => new { x.OrganizationId, x.InvoiceCode }).IsUnique();
            e.HasIndex(x => new { x.OrganizationId, x.Status });
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Client).WithMany().HasForeignKey(x => x.ClientId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<InvoiceLineItem>(e => {
            e.ToTable("InvoiceLineItems", DbSchemas.Finance);
            e.HasIndex(x => new { x.InvoiceId, x.LineNumber });
        });

        // ─── Tax Configuration ──────────────────────
        b.Entity<TaxConfiguration>(e => {
            e.ToTable("TaxConfigurations", DbSchemas.Finance);
            e.HasIndex(x => new { x.OrganizationId, x.Type, x.IsActive });
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(10);
            e.Property(x => x.Section).HasMaxLength(100);
        });

        // ─── Activity Comment ───────────────────────
        b.Entity<ActivityComment>(e => {
            e.ToTable("ActivityComments", DbSchemas.Finance);
            e.HasIndex(x => x.ExpenseRequestId).HasFilter("[ExpenseRequestId] IS NOT NULL");
            e.HasIndex(x => x.VendorBillId).HasFilter("[VendorBillId] IS NOT NULL");
            e.HasIndex(x => x.AdvancePaymentId).HasFilter("[AdvancePaymentId] IS NOT NULL");
            e.HasIndex(x => x.InvoiceId).HasFilter("[InvoiceId] IS NOT NULL");
            e.HasIndex(x => x.ForecastId).HasFilter("[ForecastId] IS NOT NULL");
            e.Property(x => x.ActionType).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.CommentByEmployee).WithMany().HasForeignKey(x => x.CommentByEmployeeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<Forecast>()
                .WithMany(x => x.Comments)
                .HasForeignKey(x => x.ForecastId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Request Document ───────────────────────
        b.Entity<RequestDocument>(e => {
            e.ToTable("RequestDocuments", DbSchemas.Finance);
            e.HasIndex(x => x.ExpenseRequestId).HasFilter("[ExpenseRequestId] IS NOT NULL");
            e.HasIndex(x => x.VendorBillId).HasFilter("[VendorBillId] IS NOT NULL");
            e.HasIndex(x => x.ForecastId).HasFilter("[ForecastId] IS NOT NULL");
            e.HasIndex(x => new { x.OrganizationId, x.CreatedAt });
            e.HasOne(x => x.ExpenseRequest)
                .WithMany(x => x.Documents)
                .HasForeignKey(x => x.ExpenseRequestId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.VendorBill)
                .WithMany(x => x.Documents)
                .HasForeignKey(x => x.VendorBillId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Forecast)
                .WithMany(x => x.Documents)
                .HasForeignKey(x => x.ForecastId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.UploadedByEmployee)
                .WithMany()
                .HasForeignKey(x => x.UploadedByEmployeeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Code Sequence ──────────────────────────
        b.Entity<CodeSequence>(e => {
            e.ToTable("CodeSequences", DbSchemas.Finance);
            e.HasIndex(x => new { x.OrganizationId, x.SequenceType }).IsUnique();
        });

        // ─── Category ───────────────────────────────  
        b.Entity<Category>(e => {
            e.ToTable("Categories", DbSchemas.Finance);
            e.HasIndex(x => new { x.OrganizationId, x.Name }).IsUnique();
        });

        b.Entity<PaymentTerm>(e => {
            e.ToTable("PaymentTerms", DbSchemas.Finance);
            e.HasIndex(x => new { x.OrganizationId, x.ShortName }).IsUnique();
            e.HasIndex(x => new { x.OrganizationId, x.Name }).IsUnique();
        });

        b.Entity<Account>(e => {
            e.ToTable("Accounts", DbSchemas.Finance);
            e.HasIndex(x => new { x.OrganizationId, x.ShortName }).IsUnique();
            e.HasIndex(x => new { x.OrganizationId, x.Name }).IsUnique();
        });

        b.Entity<AuthSession>(e => {
            e.ToTable("auth_sessions", DbSchemas.Dbo);
            e.HasKey(x => x.SessionId);
            e.Property(x => x.SessionId).HasColumnName("session_id");
            e.Property(x => x.UserOid).HasColumnName("user_oid").HasMaxLength(36).IsUnicode(false);
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(256);
            e.Property(x => x.AzureAccessToken).HasColumnName("azure_access_token");
            e.Property(x => x.RefreshToken).HasColumnName("refresh_token");
            e.Property(x => x.AccessTokenExpiry).HasColumnName("access_token_expiry");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("(sysutcdatetime())");
            e.Property(x => x.ExpiresAt).HasColumnName("expires_at");
            e.HasIndex(x => x.UserOid).HasDatabaseName("IX_auth_sessions_user_oid");
            e.HasIndex(x => x.ExpiresAt).HasDatabaseName("IX_auth_sessions_expires_at");
        });
    }
}
