using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;

namespace QubiqonFinanceHub.API.Data;

public class FinanceHubDbContext : DbContext
{
    public FinanceHubDbContext(DbContextOptions<FinanceHubDbContext> options) : base(options) { }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<OrganizationSetting> OrganizationSettings => Set<OrganizationSetting>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<ExpenseRequest> ExpenseRequests => Set<ExpenseRequest>();
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

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        // ─── Organization ───────────────────────────
        b.Entity<Organization>(e => {
            e.ToTable("Organizations");
            e.HasIndex(x => x.OrgName).IsUnique();
        });

        //Organization settings
        b.Entity<OrganizationSetting>(e => {
            e.ToTable("OrganizationSettings");
            e.HasIndex(x => new { x.OrganizationId, x.Key }).IsUnique();
            e.HasOne(x => x.Organization)
             .WithMany()
             .HasForeignKey(x => x.OrganizationId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<OrganizationSetting>(e => {
            e.ToTable("OrganizationSettings");
            e.HasIndex(x => new { x.OrganizationId, x.Key }).IsUnique();
        });

        // ─── Employee ───────────────────────────────
        b.Entity<Employee>(e => {
            e.ToTable("Employees");
            e.HasIndex(x => new { x.OrganizationId, x.EntraObjectId }).IsUnique();
            e.HasIndex(x => new { x.OrganizationId, x.Email }).IsUnique();
            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(20);
        });

        // ─── Expense ────────────────────────────────
        b.Entity<ExpenseRequest>(e => {
            e.ToTable("ExpenseRequests");
            e.HasIndex(x => new { x.OrganizationId, x.ExpenseCode }).IsUnique();
            e.HasIndex(x => new { x.OrganizationId, x.Status, x.CreatedAt });
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Employee).WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Advance ────────────────────────────────
        b.Entity<AdvancePayment>(e => {
            e.ToTable("AdvancePayments");
            e.HasIndex(x => new { x.OrganizationId, x.AdvanceCode }).IsUnique();
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Employee).WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Vendor ─────────────────────────────────
        b.Entity<Vendor>(e => {
            e.ToTable("Vendors");
            e.HasIndex(x => x.OrganizationId);
        });

        // ─── Vendor Bill ────────────────────────────
        b.Entity<VendorBill>(e => {
            e.ToTable("VendorBills");
            e.HasIndex(x => new { x.OrganizationId, x.BillCode }).IsUnique();
            e.HasIndex(x => new { x.OrganizationId, x.Status });
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Vendor).WithMany().HasForeignKey(x => x.VendorId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<VendorBillLineItem>(e => {
            e.ToTable("VendorBillLineItems");
            e.HasIndex(x => new { x.VendorBillId, x.LineNumber });
            e.HasOne(x => x.VendorBill)
                .WithMany(x => x.LineItems)
                .HasForeignKey(x => x.VendorBillId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.GSTConfig).WithMany().HasForeignKey(x => x.GSTConfigId).OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Client ─────────────────────────────────
        b.Entity<Client>(e => {
            e.ToTable("Clients");
            e.HasIndex(x => x.OrganizationId);
            e.Property(x => x.TaxType).HasConversion<string>().HasMaxLength(20);
        });

        // ─── Invoice ────────────────────────────────
        b.Entity<Invoice>(e => {
            e.ToTable("Invoices");
            e.HasIndex(x => new { x.OrganizationId, x.InvoiceCode }).IsUnique();
            e.HasIndex(x => new { x.OrganizationId, x.Status });
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Client).WithMany().HasForeignKey(x => x.ClientId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<InvoiceLineItem>(e => {
            e.ToTable("InvoiceLineItems");
            e.HasIndex(x => new { x.InvoiceId, x.LineNumber });
        });

        // ─── Tax Configuration ──────────────────────
        b.Entity<TaxConfiguration>(e => {
            e.ToTable("TaxConfigurations");
            e.HasIndex(x => new { x.OrganizationId, x.Type, x.IsActive });
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(10);
        });

        // ─── Activity Comment ───────────────────────
        b.Entity<ActivityComment>(e => {
            e.ToTable("ActivityComments");
            e.HasIndex(x => x.ExpenseRequestId).HasFilter("[ExpenseRequestId] IS NOT NULL");
            e.HasIndex(x => x.VendorBillId).HasFilter("[VendorBillId] IS NOT NULL");
            e.HasIndex(x => x.AdvancePaymentId).HasFilter("[AdvancePaymentId] IS NOT NULL");
            e.HasIndex(x => x.InvoiceId).HasFilter("[InvoiceId] IS NOT NULL");
            e.Property(x => x.ActionType).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.CommentByEmployee).WithMany().HasForeignKey(x => x.CommentByEmployeeId).OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Request Document ───────────────────────
        b.Entity<RequestDocument>(e => {
            e.ToTable("RequestDocuments");
            e.HasIndex(x => x.ExpenseRequestId).HasFilter("[ExpenseRequestId] IS NOT NULL");
            e.HasIndex(x => x.VendorBillId).HasFilter("[VendorBillId] IS NOT NULL");
            e.HasIndex(x => new { x.OrganizationId, x.CreatedAt });
            e.HasOne(x => x.ExpenseRequest)
                .WithMany(x => x.Documents)
                .HasForeignKey(x => x.ExpenseRequestId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.VendorBill)
                .WithMany(x => x.Documents)
                .HasForeignKey(x => x.VendorBillId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.UploadedByEmployee)
                .WithMany()
                .HasForeignKey(x => x.UploadedByEmployeeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Email Template ─────────────────────────
        b.Entity<EmailTemplate>(e => {
            e.ToTable("EmailTemplates");
            e.HasIndex(x => new { x.OrganizationId, x.TemplateKey }).IsUnique();
        });

        // ─── Code Sequence ──────────────────────────
        b.Entity<CodeSequence>(e => {
            e.ToTable("CodeSequences");
            e.HasIndex(x => new { x.OrganizationId, x.SequenceType }).IsUnique();
        });

        // ─── Category ───────────────────────────────  
        b.Entity<Category>(e => {
            e.ToTable("Categories");
            e.HasIndex(x => new { x.OrganizationId, x.Name }).IsUnique();
        });
    }
}
