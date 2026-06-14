using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Social;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.Connections.GetPendingRequests;

internal sealed class GetPendingConnectionRequestsQueryHandler(ISocialGraphRepository social)
    : IQueryHandler<GetPendingConnectionRequestsQuery, GetPendingConnectionRequestsResult>
{
    public async Task<Result<GetPendingConnectionRequestsResult>> Handle(
        GetPendingConnectionRequestsQuery query,
        CancellationToken cancellationToken)
    {
        var type = string.IsNullOrWhiteSpace(query.Type) ? "received" : query.Type.Trim().ToLowerInvariant();
        if (type is not ("received" or "sent"))
        {
            return Result.Failure<GetPendingConnectionRequestsResult>(SocialErrors.InvalidPendingRequestType);
        }

        var received = type == "received";
        var page = Math.Max(1, query.Page);
        var limit = Math.Clamp(query.Limit, 1, 100);

        var (items, total) = await social.GetPendingRequestsPageAsync(
            query.UserId,
            received,
            page,
            limit,
            cancellationToken);

        var pages = (int)Math.Ceiling(total / (double)limit);
        var pagination = new LegacyPaginationDto(page, limit, total, pages);

        return Result.Success(new GetPendingConnectionRequestsResult(items, pagination));
    }
}
