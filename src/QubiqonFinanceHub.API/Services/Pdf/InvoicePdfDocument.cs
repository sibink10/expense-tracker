using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace QubiqonFinanceHub.API.Services.Pdf;

public sealed class InvoicePdfDocument : IDocument
{
    private readonly InvoicePdfModel _m;

    private static readonly Color Navy      = Color.FromHex("#1A3C6E");
    private static readonly Color Muted     = Color.FromHex("#6B7280");
    private static readonly Color HeaderBg  = Color.FromHex("#F3F4F6");
    private static readonly Color Orange    = Color.FromHex("#B45309");
    private static readonly Color PaymentRed = Color.FromHex("#DC2626");
    private static readonly Color Border    = Color.FromHex("#E5E7EB");

    private const float ContentPadding = 16f;

    public InvoicePdfDocument(InvoicePdfModel model) => _m = model;

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(28);
            page.DefaultTextStyle(x => x.FontSize(9).FontColor(Colors.Black));

            page.Content()
                .Border(1).BorderColor(Border)
                .Padding(ContentPadding)
                .Column(col =>
                {
                    col.Item().Element(ComposeHeader);
                    col.Item().PaddingTop(12).Element(ComposeMeta);
                    col.Item().PaddingTop(8).Element(ComposeBillTo);
                    col.Item().PaddingTop(8).Element(ComposeLineItems);
                    col.Item().PaddingTop(12).Element(ComposeFooter);
                });
        });
    }

    // ── 1. HEADER ────────────────────────────────────────────────────────────
    private void ComposeHeader(IContainer container)
    {
        container.Row(row =>
        {
            // Left: logo + org details
            row.RelativeItem(3).Row(inner =>
            {
                // Logo box
                inner.ConstantItem(56).Height(56).Element(c =>
                {
                    if (_m.LogoBytes is { Length: > 0 })
                        c.Image(_m.LogoBytes).FitArea();
                    else
                    {
                        var initial = string.IsNullOrWhiteSpace(_m.OrgName)
                            ? "?"
                            : char.ToUpperInvariant(_m.OrgName.Trim()[0]).ToString();
                        c.Border(1).BorderColor(Border).AlignCenter().AlignMiddle()
                            .Text(initial).FontSize(22).Bold().FontColor(Orange);
                    }
                });

                // Org text block
                inner.RelativeItem().PaddingLeft(10).Column(c =>
                {
                    c.Item().PaddingBottom(4).Text(_m.OrgName).FontSize(13).Bold().FontColor(Navy);
                    if (!string.IsNullOrWhiteSpace(_m.OrgSubName))
                        c.Item().Text(_m.OrgSubName).FontSize(8).FontColor(Muted);
                    foreach (var line in _m.OrgAddressBlock
                                 .Split('\n', StringSplitOptions.RemoveEmptyEntries))
                        c.Item().Text(line.Trim()).FontSize(8).FontColor(Muted);
                });
            });

            // Right: large watermark-style "INVOICE"
            row.RelativeItem().AlignRight().AlignTop()
                .Text("INVOICE").FontSize(26).Bold().FontColor(Color.FromHex("#D1D5DB"));
        });
    }

    // ── 2. META (Invoice #, Date, Terms, Due Date, PO, INR Invoice) ──────────
    private void ComposeMeta(IContainer container)
    {
        container.Border(1).BorderColor(Border).Row(row =>
        {
            // Left: label / value pairs
            row.RelativeItem().Padding(10).Column(left =>
            {
                MetaRow(left, "Invoice #",    _m.InvoiceCode);
                MetaRow(left, "Invoice date", _m.InvoiceDate.ToString("dd/MM/yyyy"));
                MetaRow(left, "Terms",        string.IsNullOrWhiteSpace(_m.PaymentTerms) ? "—" : _m.PaymentTerms);
                MetaRow(left, "Due date",     _m.DueDate.ToString("dd/MM/yyyy"));
                MetaRow(left, "PO #",         string.IsNullOrWhiteSpace(_m.PurchaseOrder) ? "—" : _m.PurchaseOrder);
            });

            // Right: currency label at bottom-right of meta box
            row.RelativeItem().Padding(10).Column(right =>
            {
                right.Item().AlignBottom().AlignRight()
                    .Text(_m.CurrencyLabel).FontSize(10).SemiBold().FontColor(Orange);
            });
        });
    }

    private static void MetaRow(ColumnDescriptor col, string label, string value)
    {
        col.Item().PaddingBottom(3).Row(r =>
        {
            r.ConstantItem(80).Text(label).FontSize(8).FontColor(Muted);
            r.RelativeItem().Text(value).FontSize(8).SemiBold().FontColor(Navy);
        });
    }

    // ── 3. BILL TO / SHIP TO ─────────────────────────────────────────────────
    private void ComposeBillTo(IContainer container)
    {
        container.Border(1).BorderColor(Border).Row(row =>
        {
            // Left: BILL TO
            row.RelativeItem().BorderRight(1).BorderColor(Border).Padding(10).Column(left =>
            {
                left.Item().PaddingBottom(4)
                    .Text("Bill To").FontSize(7).Bold().FontColor(Muted);

                var lines = _m.BillToText
                    .Split('\n', StringSplitOptions.RemoveEmptyEntries)
                    .Select(l => l.Trim()).ToList();

                for (var i = 0; i < lines.Count; i++)
                {
                    if (i == 0)
                        left.Item().Text(lines[i]).FontSize(8).Bold().FontColor(Navy);
                    else
                        left.Item().Text(lines[i]).FontSize(8).FontColor(Muted);
                }
            });

            // Right: SHIP TO
            row.RelativeItem().Padding(10).Column(right =>
            {
                right.Item().PaddingBottom(4)
                    .Text("Ship To").FontSize(7).Bold().FontColor(Muted);

                var lines = _m.ShipToText
                    .Split('\n', StringSplitOptions.RemoveEmptyEntries)
                    .Select(l => l.Trim()).ToList();

                for (var i = 0; i < lines.Count; i++)
                {
                    if (i == 0)
                        right.Item().Text(lines[i]).FontSize(8).Bold().FontColor(Navy);
                    else
                        right.Item().Text(lines[i]).FontSize(8).FontColor(Muted);
                }
            });
        });
    }

    // ── 4. LINE ITEMS TABLE ───────────────────────────────────────────────────
    private void ComposeLineItems(IContainer container)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(cols =>
            {
                cols.ConstantColumn(22);   // #
                cols.RelativeColumn(4);    // Item & Description
                cols.ConstantColumn(52);   // HSN/SAC
                cols.ConstantColumn(44);   // QTY
                cols.ConstantColumn(56);   // RATE
                cols.ConstantColumn(56);   // GST
                cols.ConstantColumn(66);   // TOTAL
            });

            // Header row
            table.Header(header =>
            {
                void HeaderCell(string title, bool alignRight)
                {
                    var cell = header.Cell()
                        .Background(HeaderBg)
                        .BorderBottom(1).BorderColor(Border)
                        .Padding(6);
                    if (alignRight)
                        cell.AlignRight().Text(title).FontSize(7).Bold().FontColor(Muted);
                    else
                        cell.Text(title).FontSize(7).Bold().FontColor(Muted);
                }

                HeaderCell("#", alignRight: false);
                HeaderCell("Item & Description", alignRight: false);
                HeaderCell("HSN/SAC", alignRight: false);
                HeaderCell("Qty (hrs/days)", alignRight: true);
                HeaderCell("Rate", alignRight: true);
                HeaderCell("GST", alignRight: true);
                HeaderCell("Total Amount", alignRight: true);
            });

            // Data rows
            var idx = 0;
            foreach (var line in _m.LineItems)
            {
                var bg = idx % 2 == 0 ? Colors.White : Color.FromHex("#FAFAFA");

                Cell(table, bg).Text(line.LineNumber.ToString()).FontSize(8);
                Cell(table, bg).Text(line.Description).FontSize(8).SemiBold();
                Cell(table, bg).Text(line.HsnCode ?? "—").FontSize(8);
                Cell(table, bg).AlignRight().Text(line.Quantity.ToString("N2")).FontSize(8);
                Cell(table, bg).AlignRight().Text(FormatMoney(line.Rate)).FontSize(8);
                Cell(table, bg).AlignRight().Text(FormatMoney(line.GstAmount)).FontSize(8);
                Cell(table, bg).AlignRight().Text(FormatMoney(line.LineTotal)).FontSize(8).SemiBold();

                idx++;
            }
        });
    }

    /// <summary>Shared helper — returns the inner container for a data cell.</summary>
    private static IContainer Cell(TableDescriptor table, Color bg)
        => table.Cell()
            .Background(bg)
            .BorderBottom(1).BorderColor(Border)
            .Padding(6);

    // ── 5. FOOTER (notes, totals, bank + signature side-by-side) ─────────────
    private void ComposeFooter(IContainer container)
    {
        container.Column(footer =>
        {
            // ── Row A ──────────────────────────────────────────────────────────
            footer.Item().Row(row =>
            {
                row.RelativeItem(1.3f).Column(left =>
                {
                    if (!string.IsNullOrWhiteSpace(_m.TotalInWords))
                    {
                        left.Item().Text("TOTAL IN WORDS").FontSize(7).Bold().FontColor(Muted);
                        left.Item().PaddingTop(2)
                            .Text(_m.TotalInWords).FontSize(8).Bold().Italic();
                    }

                    left.Item()
                        .PaddingTop(string.IsNullOrWhiteSpace(_m.TotalInWords) ? 0 : 10)
                        .Text("Notes").FontSize(7).Bold().FontColor(Muted);
                    left.Item().PaddingTop(2)
                        .Text(string.IsNullOrWhiteSpace(_m.Notes) ? "—" : _m.Notes!)
                        .FontSize(8);
                });

                row.RelativeItem(0.9f).Column(right =>
                {
                    right.Item().AlignRight().Column(totals =>
                    {
                        TotalRow(totals, "Sub Total",    FormatMoney(_m.SubTotal),   bold: false, red: false);
                        if (_m.TotalGst != 0)
                            TotalRow(totals, "GST",      FormatMoney(_m.TotalGst),   bold: false, red: false);
                        if (_m.TaxAmount > 0)
                        {
                            var tdsLabel = string.IsNullOrWhiteSpace(_m.TaxName) ? "TDS" : $"TDS ({_m.TaxName})";
                            TotalRow(totals, tdsLabel, $"-{FormatMoney(_m.TaxAmount)}", bold: false, red: true);
                        }
                        TotalRow(totals, "Total",        FormatMoney(_m.Total),      bold: true,  red: false);
                        var paidLabel = _m.PaidAmount > 0
                            ? $"(-) {FormatMoney(_m.PaidAmount)}"
                            : FormatMoney(0);
                        TotalRow(totals, "Payment Made", paidLabel,                 bold: false, red: true);
                        TotalRow(totals, "Balance Due",  FormatMoney(_m.BalanceDue), bold: true, red: false);
                    });
                });
            });

            // ── Row B: bank details (left) + authorized signature (right) ────
            footer.Item().PaddingTop(16).ShowEntire().Row(row =>
            {
                row.RelativeItem(1).PaddingRight(8).Element(c =>
                {
                    if (HasBankDetails())
                        c.Element(ComposeBankDetails);
                });

                row.RelativeItem(1).PaddingLeft(8).AlignBottom().AlignCenter()
                    .Element(ComposeSignature);
            });
        });
    }

    private void ComposeBankDetails(IContainer container)
    {
        container.Column(left =>
        {
            left.Item().PaddingBottom(6)
                .Text("Bank Account Details")
                .FontSize(7).Bold().FontColor(Muted);
            left.Item().Table(t =>
            {
                t.ColumnsDefinition(c => { c.RelativeColumn(1); c.RelativeColumn(1.4f); });
                BankRow(t, "Account Holder Name", _m.BankAccountName);
                BankRow(t, "Account Number", _m.BankAccountNumber);
                BankRow(t, "IFSC Code",      _m.IfscCode);
                BankRow(t, "Bank Name",      _m.BankName);
                BankRow(t, "Bank Address",   _m.BankAddress);
                if (!string.IsNullOrWhiteSpace(_m.SwiftCode))
                    BankRow(t, "SWIFT Code", _m.SwiftCode);
            });
        });
    }

    private void ComposeSignature(IContainer container)
    {
        container.Width(115).Column(sig =>
        {
            sig.Item().Height(24).AlignCenter().AlignTop()
                .Text(InvoiceSignaturePlacementResolver.SignAnchorToken)
                .FontSize(1).FontColor(Colors.White);
            sig.Item().LineHorizontal(1).LineColor(Navy);
            sig.Item().PaddingTop(3).AlignCenter()
                .Text("Authorized Signature").FontSize(6).SemiBold().FontColor(Navy);
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private bool HasBankDetails() =>
        !string.IsNullOrWhiteSpace(_m.BankName)          ||
        !string.IsNullOrWhiteSpace(_m.BankAccountName)   ||
        !string.IsNullOrWhiteSpace(_m.IfscCode)          ||
        !string.IsNullOrWhiteSpace(_m.SwiftCode)         ||
        !string.IsNullOrWhiteSpace(_m.BankAddress)       ||
        !string.IsNullOrWhiteSpace(_m.BankAccountNumber);

    private static void BankRow(TableDescriptor t, string label, string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return;
        t.Cell().Border(1).BorderColor(Border).Padding(4).Text(label).FontSize(7).FontColor(Muted);
        t.Cell().Border(1).BorderColor(Border).Padding(4).Text(value).FontSize(7);
    }

    private static void TotalRow(
        ColumnDescriptor col, string label, string value, bool bold, bool red)
    {
        col.Item().PaddingBottom(4).Row(r =>
        {
            if (bold)
                r.RelativeItem().Text(label).FontSize(8).Bold();
            else
                r.RelativeItem().Text(label).FontSize(8).SemiBold();

            if (bold)
                r.RelativeItem().AlignRight().Text(value).FontSize(8).Bold();
            else if (red)
                r.RelativeItem().AlignRight().Text(value).FontSize(8).FontColor(PaymentRed);
            else
                r.RelativeItem().AlignRight().Text(value).FontSize(8).SemiBold();
        });
    }

    private string FormatMoney(decimal amount) =>
        _m.Currency switch
        {
            "USD" => $"${amount:N2}",
            "EUR" => $"€{amount:N2}",
            "GBP" => $"£{amount:N2}",
            "CAD" => $"CA${amount:N2}",
            "AED" => $"AED {amount:N2}",
            _     => $"₹{amount:N2}",
        };
}