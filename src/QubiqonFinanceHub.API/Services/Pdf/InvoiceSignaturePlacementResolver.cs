using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
using UglyToad.PdfPig.DocumentLayoutAnalysis.WordExtractor;

namespace QubiqonFinanceHub.API.Services.Pdf;

public sealed record InvoiceSignaturePlacement(
    int PageNo,
    int XCoord,
    int YCoord,
    int AbsWidth,
    int AbsHeight);

public static class InvoiceSignaturePlacementResolver
{
    public const string SignAnchorToken = "QFH_SIGN_ANCHOR";

    private const int DefaultAbsWidth = 115;
    private const int DefaultAbsHeight = 36;
    private const int DefaultXCoord = 389;
    private const int DefaultYCoord = 760;
    private const int SignatureXOffset = -30;

    // Layout constants matching ComposeSignature in InvoicePdfDocument.
    private const int SignatureBlockWidth = 150;
    private const int LabelPaddingTop = 4;
    private const int SignatureLineHeight = 1;

    public static InvoiceSignaturePlacement Resolve(byte[] pdfBytes)
    {
        using var document = PdfDocument.Open(pdfBytes);
        var totalPages = document.NumberOfPages;

        for (var pageIndex = totalPages; pageIndex >= 1; pageIndex--)
        {
            var page = document.GetPage(pageIndex);
            var pageNo = pageIndex - 1;
            var words = GetWords(page);

            if (TryFindAnchorBounds(words, out var left, out var top, out var right))
            {
                return new InvoiceSignaturePlacement(
                    pageNo,
                    ToXCoord(right),
                    ToYCoordFromAnchorTop(page.Height, top),
                    DefaultAbsWidth,
                    DefaultAbsHeight);
            }

            if (TryFindLabelBounds(words, out left, out top, out right))
            {
                return new InvoiceSignaturePlacement(
                    pageNo,
                    ToXCoordFromLabel(left, right),
                    ToYCoordFromLabelTop(page.Height, top),
                    DefaultAbsWidth,
                    DefaultAbsHeight);
            }
        }

        return new InvoiceSignaturePlacement(
            Math.Max(0, totalPages - 1),
            DefaultXCoord,
            DefaultYCoord,
            DefaultAbsWidth,
            DefaultAbsHeight);
    }

    private static int ToXCoord(double anchorRight) =>
        Math.Max(0, (int)Math.Round(anchorRight - DefaultAbsWidth) + SignatureXOffset);

    private static int ToYCoordFromAnchorTop(double pageHeight, double anchorTop) =>
        Math.Max(0, (int)Math.Round(pageHeight - anchorTop));

    private static int ToXCoordFromLabel(double labelLeft, double labelRight)
    {
        var labelCenter = (labelLeft + labelRight) / 2.0;
        var blockRight = labelCenter + SignatureBlockWidth / 2.0;
        return Math.Max(0, (int)Math.Round(blockRight - DefaultAbsWidth) + SignatureXOffset);
    }

    private static int ToYCoordFromLabelTop(double pageHeight, double labelTop)
    {
        var labelTopFromPageTop = pageHeight - labelTop;
        var boxTop = labelTopFromPageTop - LabelPaddingTop - SignatureLineHeight - DefaultAbsHeight;
        return Math.Max(0, (int)Math.Round(boxTop));
    }

    private static IReadOnlyList<Word> GetWords(Page page) =>
        NearestNeighbourWordExtractor.Instance.GetWords(page.Letters).ToList();

    private static bool TryFindAnchorBounds(
        IReadOnlyList<Word> words,
        out double left,
        out double top,
        out double right)
    {
        left = top = right = 0;
        var anchor = words.FirstOrDefault(w => w.Text == SignAnchorToken);
        if (anchor is null)
            return false;

        left = anchor.BoundingBox.Left;
        right = anchor.BoundingBox.Right;
        top = anchor.BoundingBox.Top;
        return true;
    }

    private static bool TryFindLabelBounds(
        IReadOnlyList<Word> words,
        out double left,
        out double top,
        out double right)
    {
        left = top = right = 0;
        var contentWords = words.Where(w => !string.IsNullOrWhiteSpace(w.Text)).ToList();

        for (var i = 0; i < contentWords.Count - 1; i++)
        {
            if (!contentWords[i].Text.Equals("Authorized", StringComparison.OrdinalIgnoreCase))
                continue;
            if (!contentWords[i + 1].Text.Equals("Signature", StringComparison.OrdinalIgnoreCase))
                continue;

            var matched = new[] { contentWords[i], contentWords[i + 1] };
            left = matched.Min(w => w.BoundingBox.Left);
            right = matched.Max(w => w.BoundingBox.Right);
            top = matched.Max(w => w.BoundingBox.Top);
            return true;
        }

        return false;
    }
}
