using ExcelDataReader;
using Microsoft.AspNetCore.Http;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class ExcelUploadService : IExcelUploadService
{
    public async Task<List<string>> ReadExcelColumnsAsync(IFormFile file, CancellationToken ct = default)
    {
        var (cols, _) = await ReadExcelAsync(file, ct);
        return cols;
    }

    public async Task<(List<string> Columns, List<Dictionary<string, object?>> Rows)> ReadExcelAsync(
        IFormFile file,
        CancellationToken ct = default
    )
    {
        if (file == null) throw new ArgumentNullException(nameof(file));
        if (file.Length <= 0) return (new List<string>(), new List<Dictionary<string, object?>>());

        await using var stream = file.OpenReadStream();
        using var reader = ExcelReaderFactory.CreateReader(stream);

        var columns = new List<string>();
        var rows = new List<Dictionary<string, object?>>();

        // Row 1 = header row
        if (!reader.Read()) return (columns, rows);

        var colCount = reader.FieldCount;
        for (var i = 0; i < colCount; i++)
        {
            var header = (reader.GetValue(i)?.ToString() ?? "").Trim();
            if (string.IsNullOrWhiteSpace(header)) header = $"Column{i + 1}";

            var unique = header;
            var n = 2;
            while (columns.Contains(unique, StringComparer.OrdinalIgnoreCase))
            {
                unique = $"{header}_{n}";
                n++;
            }
            columns.Add(unique);
        }

        while (reader.Read())
        {
            ct.ThrowIfCancellationRequested();

            var dict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            var anyValue = false;

            for (var i = 0; i < columns.Count; i++)
            {
                var v = reader.GetValue(i);
                if (v != null && v != DBNull.Value && v.ToString()?.Length > 0) anyValue = true;
                dict[columns[i]] = v == DBNull.Value ? null : v;
            }

            if (anyValue) rows.Add(dict);
        }

        return (columns, rows);
    }
}

