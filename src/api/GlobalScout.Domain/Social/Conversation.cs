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
    /// <see cref="User1Id"/>'s read position: every message created at or before this time counts as read by them.
    /// </summary>
    public DateTimeOffset? User1LastReadAt { get; set; }

    /// <summary>
    /// <see cref="User2Id"/>'s read position: every message created at or before this time counts as read by them.
    /// </summary>
    public DateTimeOffset? User2LastReadAt { get; set; }

    public DateTimeOffset? LastReadAtFor(Guid userId) =>
        userId == User1Id ? User1LastReadAt
        : userId == User2Id ? User2LastReadAt
        : throw new ArgumentException("User is not part of this conversation.", nameof(userId));

    public bool IsReadBy(Guid userId, DateTimeOffset messageCreatedAt) =>
        LastReadAtFor(userId) is { } readAt && messageCreatedAt <= readAt;

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
