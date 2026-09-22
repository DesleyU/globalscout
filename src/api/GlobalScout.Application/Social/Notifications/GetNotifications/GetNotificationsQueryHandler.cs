using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Social;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.Notifications.GetNotifications;

internal sealed class GetNotificationsQueryHandler(INotificationRepository notifications)
    : IQueryHandler<GetNotificationsQuery, GetNotificationsResult>
{
    public async Task<Result<GetNotificationsResult>> Handle(GetNotificationsQuery query, CancellationToken cancellationToken)
    {
        var page = Math.Max(1, query.Page);
        var limit = Math.Clamp(query.Limit, 1, 100);

        var (items, total, unreadCount) = await notifications.GetPageAsync(
            query.RecipientUserId,
            page,
            limit,
            cancellationToken);

        var pages = (int)Math.Ceiling(total / (double)limit);
        var pagination = new LegacyPaginationDto(page, limit, total, pages);

        return Result.Success(new GetNotificationsResult(items, pagination, unreadCount));
    }
}
