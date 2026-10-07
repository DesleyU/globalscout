using GlobalScout.Domain.Social;
using Xunit;

namespace GlobalScout.Application.UnitTests.Social.Messages;

public sealed class ConversationOrderPairTests
{
    [Fact]
    public void OrderPair_returns_the_same_pair_regardless_of_argument_order()
    {
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();

        Assert.Equal(Conversation.OrderPair(a, b), Conversation.OrderPair(b, a));
    }

    [Fact]
    public void OrderPair_puts_the_lower_id_first()
    {
        var low = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var high = Guid.Parse("ffffffff-0000-0000-0000-000000000000");

        Assert.Equal((low, high), Conversation.OrderPair(high, low));
    }

    [Fact]
    public void OrderPair_rejects_the_same_user_twice()
    {
        var a = Guid.NewGuid();

        Assert.Throws<ArgumentException>(() => Conversation.OrderPair(a, a));
    }
}
