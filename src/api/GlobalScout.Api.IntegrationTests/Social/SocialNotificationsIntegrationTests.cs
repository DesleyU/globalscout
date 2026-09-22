using System.Net.Http.Json;
using System.Text.Json;

namespace GlobalScout.Api.IntegrationTests.Social;

[Collection(nameof(IntegrationCollection))]
public sealed class SocialNotificationsIntegrationTests
{
    private readonly IntegrationTestFixture _fixture;

    public SocialNotificationsIntegrationTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task SendConnectionRequest_CreatesUnreadNotificationForReceiver()
    {
        var factory = _fixture.Factory;
        var (senderId, senderToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (receiverId, receiverToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        await SocialIntegrationTestHelpers.ConfirmEmailAsync(factory, senderId, Ct);

        var sender = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, senderToken);
        var connectionId = await SocialIntegrationTestHelpers.SendConnectionRequestAsync(sender, receiverId, Ct);

        var receiver = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, receiverToken);
        using var doc = await SocialIntegrationTestHelpers.GetNotificationsAsync(receiver, Ct);

        var notifications = doc.RootElement.GetProperty("notifications").EnumerateArray().ToList();
        var notification = Assert.Single(notifications);
        Assert.Equal("ConnectionRequestReceived", notification.GetProperty("type").GetString());
        Assert.Equal(senderId, notification.GetProperty("actor").GetProperty("id").GetGuid());
        Assert.Equal(connectionId, notification.GetProperty("relatedEntityId").GetGuid());
        Assert.False(notification.GetProperty("isRead").GetBoolean());
        Assert.Equal(1, doc.RootElement.GetProperty("unreadCount").GetInt32());
    }

    [Fact]
    public async Task AcceptConnectionRequest_CreatesUnreadNotificationForOriginalSender()
    {
        var factory = _fixture.Factory;
        var (senderId, senderToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (receiverId, receiverToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        await SocialIntegrationTestHelpers.ConfirmEmailAsync(factory, senderId, Ct);

        var sender = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, senderToken);
        var connectionId = await SocialIntegrationTestHelpers.SendConnectionRequestAsync(sender, receiverId, Ct);

        var receiver = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, receiverToken);
        using var respondResponse = await SocialIntegrationTestHelpers.RespondToConnectionAsync(receiver, connectionId, "accept", Ct);
        respondResponse.EnsureSuccessStatusCode();

        using var doc = await SocialIntegrationTestHelpers.GetNotificationsAsync(sender, Ct);
        var notifications = doc.RootElement.GetProperty("notifications").EnumerateArray().ToList();
        var notification = Assert.Single(notifications);
        Assert.Equal("ConnectionAccepted", notification.GetProperty("type").GetString());
        Assert.Equal(receiverId, notification.GetProperty("actor").GetProperty("id").GetGuid());
        Assert.Equal(connectionId, notification.GetProperty("relatedEntityId").GetGuid());
        Assert.False(notification.GetProperty("isRead").GetBoolean());
    }

    [Fact]
    public async Task RejectConnectionRequest_DoesNotCreateNotificationForOriginalSender()
    {
        var factory = _fixture.Factory;
        var (senderId, senderToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (receiverId, receiverToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        await SocialIntegrationTestHelpers.ConfirmEmailAsync(factory, senderId, Ct);

        var sender = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, senderToken);
        var connectionId = await SocialIntegrationTestHelpers.SendConnectionRequestAsync(sender, receiverId, Ct);

        var receiver = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, receiverToken);
        using var respondResponse = await SocialIntegrationTestHelpers.RespondToConnectionAsync(receiver, connectionId, "reject", Ct);
        respondResponse.EnsureSuccessStatusCode();

        using var doc = await SocialIntegrationTestHelpers.GetNotificationsAsync(sender, Ct);
        Assert.Empty(doc.RootElement.GetProperty("notifications").EnumerateArray());
    }

    [Fact]
    public async Task Follow_CreatesUnreadNotificationForTarget()
    {
        var factory = _fixture.Factory;
        var (followerId, followerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (targetId, targetToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

        var follower = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, followerToken);
        using var followResponse = await SocialIntegrationTestHelpers.FollowUserAsync(follower, targetId, Ct);
        followResponse.EnsureSuccessStatusCode();

        var target = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, targetToken);
        using var doc = await SocialIntegrationTestHelpers.GetNotificationsAsync(target, Ct);

        var notifications = doc.RootElement.GetProperty("notifications").EnumerateArray().ToList();
        var notification = Assert.Single(notifications);
        Assert.Equal("NewFollower", notification.GetProperty("type").GetString());
        Assert.Equal(followerId, notification.GetProperty("actor").GetProperty("id").GetGuid());
        Assert.False(notification.GetProperty("isRead").GetBoolean());
    }

    [Fact]
    public async Task RapidFollowUnfollowFollow_WhileUnread_DoesNotDuplicateNotification()
    {
        var factory = _fixture.Factory;
        var (followerId, followerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (targetId, targetToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

        var follower = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, followerToken);
        var target = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, targetToken);

        using var firstFollow = await SocialIntegrationTestHelpers.FollowUserAsync(follower, targetId, Ct);
        firstFollow.EnsureSuccessStatusCode();
        using var unfollow = await SocialIntegrationTestHelpers.UnfollowUserAsync(follower, targetId, Ct);
        unfollow.EnsureSuccessStatusCode();
        using var secondFollow = await SocialIntegrationTestHelpers.FollowUserAsync(follower, targetId, Ct);
        secondFollow.EnsureSuccessStatusCode();

        using var doc = await SocialIntegrationTestHelpers.GetNotificationsAsync(target, Ct);
        var notifications = doc.RootElement.GetProperty("notifications").EnumerateArray()
            .Where(n => n.GetProperty("type").GetString() == "NewFollower")
            .ToList();

        Assert.Single(notifications);
        Assert.Equal(1, doc.RootElement.GetProperty("unreadCount").GetInt32());
    }

    [Fact]
    public async Task MarkNotificationRead_UpdatesIsReadAndUnreadCount()
    {
        var factory = _fixture.Factory;
        var (followerId, followerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (targetId, targetToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

        var follower = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, followerToken);
        using var followResponse = await SocialIntegrationTestHelpers.FollowUserAsync(follower, targetId, Ct);
        followResponse.EnsureSuccessStatusCode();

        var target = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, targetToken);
        using var beforeDoc = await SocialIntegrationTestHelpers.GetNotificationsAsync(target, Ct);
        var notificationId = beforeDoc.RootElement.GetProperty("notifications")[0].GetProperty("id").GetGuid();

        using var markReadResponse = await SocialIntegrationTestHelpers.MarkNotificationReadAsync(target, notificationId, Ct);
        markReadResponse.EnsureSuccessStatusCode();

        using var afterDoc = await SocialIntegrationTestHelpers.GetNotificationsAsync(target, Ct);
        Assert.True(afterDoc.RootElement.GetProperty("notifications")[0].GetProperty("isRead").GetBoolean());
        Assert.Equal(0, afterDoc.RootElement.GetProperty("unreadCount").GetInt32());
    }

    [Fact]
    public async Task MarkAllNotificationsRead_ZeroesUnreadCountForEveryNotification()
    {
        var factory = _fixture.Factory;
        var (followerId, followerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (senderId, senderToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (targetId, targetToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        await SocialIntegrationTestHelpers.ConfirmEmailAsync(factory, senderId, Ct);

        var follower = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, followerToken);
        using var followResponse = await SocialIntegrationTestHelpers.FollowUserAsync(follower, targetId, Ct);
        followResponse.EnsureSuccessStatusCode();

        var sender = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, senderToken);
        using var connectResponse = await SocialIntegrationTestHelpers.SendConnectionRequestRawAsync(sender, targetId, Ct);
        connectResponse.EnsureSuccessStatusCode();

        var target = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, targetToken);
        using var beforeDoc = await SocialIntegrationTestHelpers.GetNotificationsAsync(target, Ct);
        Assert.Equal(2, beforeDoc.RootElement.GetProperty("unreadCount").GetInt32());

        using var markAllResponse = await SocialIntegrationTestHelpers.MarkAllNotificationsReadAsync(target, Ct);
        markAllResponse.EnsureSuccessStatusCode();

        using var afterDoc = await SocialIntegrationTestHelpers.GetNotificationsAsync(target, Ct);
        Assert.Equal(0, afterDoc.RootElement.GetProperty("unreadCount").GetInt32());
        Assert.All(
            afterDoc.RootElement.GetProperty("notifications").EnumerateArray(),
            n => Assert.True(n.GetProperty("isRead").GetBoolean()));
    }

    [Fact]
    public async Task RapidFollowUnfollowFollow_AfterNotificationIsRead_CreatesASecondNotification()
    {
        var factory = _fixture.Factory;
        var (followerId, followerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (targetId, targetToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

        var follower = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, followerToken);
        var target = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, targetToken);

        using var firstFollow = await SocialIntegrationTestHelpers.FollowUserAsync(follower, targetId, Ct);
        firstFollow.EnsureSuccessStatusCode();

        using var firstDoc = await SocialIntegrationTestHelpers.GetNotificationsAsync(target, Ct);
        var firstNotificationId = firstDoc.RootElement.GetProperty("notifications")[0].GetProperty("id").GetGuid();
        using var markReadResponse = await SocialIntegrationTestHelpers.MarkNotificationReadAsync(target, firstNotificationId, Ct);
        markReadResponse.EnsureSuccessStatusCode();

        using var unfollow = await SocialIntegrationTestHelpers.UnfollowUserAsync(follower, targetId, Ct);
        unfollow.EnsureSuccessStatusCode();
        using var secondFollow = await SocialIntegrationTestHelpers.FollowUserAsync(follower, targetId, Ct);
        secondFollow.EnsureSuccessStatusCode();

        using var secondDoc = await SocialIntegrationTestHelpers.GetNotificationsAsync(target, Ct);
        var newFollowerNotifications = secondDoc.RootElement.GetProperty("notifications").EnumerateArray()
            .Where(n => n.GetProperty("type").GetString() == "NewFollower")
            .ToList();

        Assert.Equal(2, newFollowerNotifications.Count);
        Assert.Equal(1, secondDoc.RootElement.GetProperty("unreadCount").GetInt32());
    }
}
