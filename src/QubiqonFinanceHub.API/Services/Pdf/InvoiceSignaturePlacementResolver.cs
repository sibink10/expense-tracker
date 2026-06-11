using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;

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
    private const int DefaultXCoord = 419;
    private const int DefaultYCoord = 760;
    private const int SignatureXOffset = -30;  // was +15, shift left to center over anchor
    private const int SignatureYOffset = 40;   // was 2, push up above the signature line

    public static InvoiceSignaturePlacement Resolve(byte[] pdfBytes)
    {
        using var document = PdfDocument.Open(pdfBytes);
        var totalPages = document.NumberOfPages;

        for (var pageIndex = totalPages; pageIndex >= 1; pageIndex--)
        {
            var page = document.GetPage(pageIndex);
            if (TryFindAnchorBounds(page, out var left, out var top, out var right))
            {
                var xCoord = Math.Max(0, (int)(right - DefaultAbsWidth) + SignatureXOffset);
                var yCoord = Math.Max(0, (int)(page.Height - top) - DefaultAbsHeight - SignatureYOffset);
                return new InvoiceSignaturePlacement(
                    pageIndex - 1,
                    xCoord,
                    yCoord,
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

    private static bool TryFindAnchorBounds(Page page, out double left, out double top, out double right)
    {
        left = top = right = 0;
        var letters = page.Letters;
        if (letters.Count == 0)
            return false;

        var token = SignAnchorToken;
        for (var start = 0; start <= letters.Count - token.Length; start++)
        {
            if (!MatchesToken(letters, start, token))
                continue;

            var matched = letters.Skip(start).Take(token.Length).ToList();
            left = matched.Min(l => l.BoundingBox.Left);
            right = matched.Max(l => l.BoundingBox.Right);
            top = matched.Max(l => l.BoundingBox.Top);
            return true;
        }

        return false;
    }

    private static bool MatchesToken(IReadOnlyList<Letter> letters, int start, string token)
    {
        for (var i = 0; i < token.Length; i++)
        {
            if (letters[start + i].Value != token[i].ToString())
                return false;
        }

        return true;
    }
}
