using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Social;
using GlobalScout.Domain.Social;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.Connections.GetConnections;

internal sealed class GetConnectionsQueryHandler(ISocialGraphRepository social)
    : IQueryHandler<GetConnectionsQuery, GetConnectionsResult>
{
    public async Task<Result<GetConnectionsResult>> Handle(GetConnectionsQuery query, CancellationToken cancellationToken)
    {
        var status = ParseStatus(query.Status);
        var page = Math.Max(1, query.Page);
        var limit = Math.Clamp(query.Limit, 1, 100);

        var (items, total) = await social.GetConnectionsPageAsync(
            query.UserId,
            status,
            page,
            limit,
            cancellationToken);

        var pages = (int)Math.Ceiling(total / (double)limit);
        var pagination = new LegacyPaginationDto(page, limit, total, pages);

        return Result.Success(new GetConnectionsResult(items, pagination));
    }

    private static ConnectionStatus ParseStatus(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return ConnectionStatus.Accepted;
        }

        return raw.Trim().ToUpperInvariant() switch
        {
            "PENDING" => ConnectionStatus.Pending,
            "ACCEPTED" => ConnectionStatus.Accepted,
            "REJECTED" => ConnectionStatus.Rejected,
            _ => ConnectionStatus.Accepted
        };
    }
}
