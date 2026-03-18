using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Services.Interfaces;
using System.Text.RegularExpressions;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class CodeGeneratorService : ICodeGeneratorService
{
    private readonly FinanceHubDbContext _db;

    public CodeGeneratorService(FinanceHubDbContext db)
    {
        _db = db;
    }

    // 🔹 Existing method (unchanged)
    public async Task<string> GenerateCodeAsync(Guid orgId, string sequenceType)
    {
        var prefix = sequenceType.ToUpper() switch
        {
            "expense" => "EXP",
            "invoice" => "INV",
            "advance" => "ADV",
            "bill" => "BILL",
            _ => sequenceType.ToUpper()[..3]
        };

        var seq = await _db.CodeSequences
            .FirstOrDefaultAsync(s => s.OrganizationId == orgId && s.SequenceType == sequenceType);

        if (seq == null)
        {
            seq = new CodeSequence
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                SequenceType = sequenceType,
                LastNumber = 0
            };
            _db.CodeSequences.Add(seq);
        }

        seq.LastNumber++;
        await _db.SaveChangesAsync();

        return $"{prefix}-{DateTime.UtcNow:yyyy}-{seq.LastNumber:D4}";
    }

    // 🔥 Format-based number generation
    public async Task<string> GenerateBillNumberAsync(Guid orgId, string type)
    {
        // 🔹 1. Get format key
        var formatKey = type.ToLower() switch
        {
            "expense" => "expFmt",
            "invoice" => "invFmt",
            "advance" => "advFmt",
            "bill" => "billFmt",
            _ => throw new ArgumentException("Invalid type")
        };

        // 🔹 2. Get format from settings
        var format = await _db.OrganizationSettings
            .Where(s => s.OrganizationId == orgId && s.Key == formatKey)
            .Select(s => s.Value)
            .FirstOrDefaultAsync();

        // 🔹 3. Get last number
        var lastNumber = await GetLastBillNumberAsync(orgId, type);

        // 🔹 4. Extract next sequence
        int nextSeq = ExtractNextSequence(lastNumber, format);

        if (string.IsNullOrWhiteSpace(format))
            return nextSeq.ToString("D4");

        // 🔹 5. Handle year reset
        var currentYear = DateTime.UtcNow.Year.ToString();

        if (!string.IsNullOrEmpty(lastNumber) && (format.Contains("{YYYY}") || format.Contains("{YY}")))
        {
            var lastYear = ExtractYear(lastNumber);
            if (lastYear != currentYear)
                nextSeq = 1;
        }

        // 🔹 6. Apply format
        return ApplyFormat(format, nextSeq);
    }

    // ------------------ Helpers ------------------

    private async Task<string?> GetLastBillNumberAsync(Guid orgId, string type)
    {
        return type.ToLower() switch
        {
            "expense" => await _db.ExpenseRequests
                .Where(x => x.OrganizationId == orgId && x.ExpenseCode != null)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => x.ExpenseCode)
                .FirstOrDefaultAsync(),

            "invoice" => await _db.Invoices
                .Where(x => x.OrganizationId == orgId && x.InvoiceCode != null)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => x.InvoiceCode)
                .FirstOrDefaultAsync(),

            "advance" => await _db.AdvancePayments
                .Where(x => x.OrganizationId == orgId && x.AdvanceCode != null)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => x.AdvanceCode)
                .FirstOrDefaultAsync(),

            "bill" => await _db.VendorBills
                .Where(x => x.OrganizationId == orgId && x.BillCode != null)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => x.BillCode)
                .FirstOrDefaultAsync(),

            _ => null
        };
    }

    private int ExtractNextSequence(string? lastNumber, string? format)
    {
        if (string.IsNullOrEmpty(lastNumber))
            return 1;

        if (!string.IsNullOrWhiteSpace(format))
        {
            var seqTokenMatch = Regex.Match(format, @"\{SEQ:(\d+)\}");
            if (seqTokenMatch.Success)
            {
                var token = seqTokenMatch.Value;
                var pattern = Regex.Escape(format);
                pattern = pattern.Replace(Regex.Escape("{YYYY}"), @"\d{4}");
                pattern = pattern.Replace(Regex.Escape("{YY+1}"), @"\d{2}");
                pattern = pattern.Replace(Regex.Escape("{YY}"), @"\d{2}");
                pattern = pattern.Replace(Regex.Escape("{MM}"), @"\d{2}");
                pattern = pattern.Replace(Regex.Escape(token), $@"(?<seq>\d{{{seqTokenMatch.Groups[1].Value}}})");

                var match = Regex.Match(lastNumber, $"^{pattern}$");
                if (match.Success && int.TryParse(match.Groups["seq"].Value, out var extractedSeq))
                    return extractedSeq + 1;
            }
        }

        var parts = lastNumber.Split('-');
        var lastPart = parts.Last();

        return int.TryParse(lastPart, out int seq) ? seq + 1 : 1;
    }

    private string? ExtractYear(string code)
    {
        var parts = code.Split('-');
        return parts.Length >= 2 ? parts[1] : null;
    }

    private string ApplyFormat(string format, int seq)
    {
        var result = format;
        var now = DateTime.UtcNow;

        // Replace {YYYY} → full year e.g. "2025"
        result = result.Replace("{YYYY}", now.Year.ToString());

        // Replace {YY} → 2-digit current year e.g. "25"
        result = result.Replace("{YY}", now.ToString("yy"));

        // Replace {YY+1} → 2-digit next year e.g. "26"
        result = result.Replace("{YY+1}", (now.Year + 1).ToString().Substring(2));

        // Replace {MM} → 2-digit current month e.g. "03"
        result = result.Replace("{MM}", now.ToString("MM"));

        // Replace {SEQ:n} → zero-padded sequence e.g. "001"
        var match = Regex.Match(result, @"\{SEQ:(\d+)\}");
        if (match.Success)
        {
            int pad = int.Parse(match.Groups[1].Value);
            var seqFormatted = seq.ToString().PadLeft(pad, '0');
            result = Regex.Replace(result, @"\{SEQ:\d+\}", seqFormatted);
        }

        return result;
    }
}