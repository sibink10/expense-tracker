using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class CodeGeneratorService : ICodeGeneratorService
{
    private readonly FinanceHubDbContext _db;

    public CodeGeneratorService(FinanceHubDbContext db)
    {
        _db = db;
    }

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
}