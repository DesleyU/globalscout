using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.PlayerIdentity;

namespace GlobalScout.Application.PlayerIdentity.Admin.GetEvidenceReadUrl;

public sealed record GetAdminEvidenceReadUrlQuery(Guid ClaimId, Guid EvidenceId)
    : IQuery<EvidenceReadUrlResult>;
