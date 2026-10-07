namespace GlobalScout.Domain.Social;

/// <summary>
/// A 1:1 conversation between two users. The pair is stored normalized (<see cref="User1Id"/> is the lower ID),
/// so each pair of users has exactly one conversation; the database enforces both rules.
/// </summary>
public sealed class Conversation
{
    public Guid Id { get; set; }

    public Guid User1Id { get; set; }

    public Guid User2Id { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset LastMessageAt { get; set; }

    /// <summary>
    /// Orders a pair of user IDs the way they are stored. <see cref="Guid.CompareTo(Guid)"/> matches
    /// PostgreSQL <c>uuid</c> ordering, which the <c>user1_id &lt; user2_id</c> check constraint relies on.
    /// </summary>
    public static (Guid User1Id, Guid User2Id) OrderPair(Guid userA, Guid userB)
    {
        if (userA == userB)
        {
            throw new ArgumentException("A conversation needs two different users.", nameof(userB));
        }

        return userA.CompareTo(userB) < 0 ? (userA, userB) : (userB, userA);
    }
}
