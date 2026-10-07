using GlobalScout.Domain.Social;
using Xunit;

namespace GlobalScout.Application.UnitTests.Social.Messages;

public sealed class ConversationReadStateTests
{
    private static readonly DateTimeOffset ReadAt = new(2026, 10, 1, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void IsReadBy_is_true_up_to_and_including_the_read_position()
    {
        var conversation = Create(user1ReadAt: ReadAt);

        Assert.True(conversation.IsReadBy(conversation.User1Id, ReadAt.AddMinutes(-1)));
        Assert.True(conversation.IsReadBy(conversation.User1Id, ReadAt));
        Assert.False(conversation.IsReadBy(conversation.User1Id, ReadAt.AddTicks(10)));
    }

    [Fact]
    public void IsReadBy_is_false_when_the_user_has_never_read()
    {
        var conversation = Create(user1ReadAt: ReadAt);

        Assert.False(conversation.IsReadBy(conversation.User2Id, ReadAt.AddDays(-30)));
    }

    [Fact]
    public void LastReadAtFor_rejects_a_user_outside_the_conversation()
    {
        var conversation = Create(user1ReadAt: ReadAt);

        Assert.Throws<ArgumentException>(() => conversation.LastReadAtFor(Guid.NewGuid()));
    }

    private static Conversation Create(DateTimeOffset? user1ReadAt)
    {
        var (user1Id, user2Id) = Conversation.OrderPair(Guid.NewGuid(), Guid.NewGuid());
        return new Conversation
        {
            Id = Guid.NewGuid(),
            User1Id = user1Id,
            User2Id = user2Id,
            User1LastReadAt = user1ReadAt
        };
    }
}
