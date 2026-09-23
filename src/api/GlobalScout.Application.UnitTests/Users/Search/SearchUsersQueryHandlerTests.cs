using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Users;
using GlobalScout.Application.Users.Search;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.Users.Search;

public sealed class SearchUsersQueryHandlerTests
{
    private static readonly SearchUsersResult EmptyResult = new([], new SearchUsersPagination(1, 20, 0, 0));

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task Handle_clamps_non_positive_page_to_one(int requestedPage)
    {
        var users = new Mock<IUserDirectoryRepository>();
        users
            .Setup(instance => instance.SearchUsersAsync(
                It.Is<SearchUsersCriteria>(c => c.Page == 1),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(EmptyResult);
        var handler = new SearchUsersQueryHandler(users.Object);

        var result = await handler.Handle(
            new SearchUsersQuery(Guid.NewGuid(), null, null, null, null, null, null, null, null, null, requestedPage, 20),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        users.VerifyAll();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public async Task Handle_clamps_non_positive_limit_to_default_twenty(int requestedLimit)
    {
        var users = new Mock<IUserDirectoryRepository>();
        users
            .Setup(instance => instance.SearchUsersAsync(
                It.Is<SearchUsersCriteria>(c => c.Limit == 20),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(EmptyResult);
        var handler = new SearchUsersQueryHandler(users.Object);

        var result = await handler.Handle(
            new SearchUsersQuery(Guid.NewGuid(), null, null, null, null, null, null, null, null, null, 1, requestedLimit),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        users.VerifyAll();
    }

    [Fact]
    public async Task Handle_clamps_limit_above_hundred_to_hundred()
    {
        var users = new Mock<IUserDirectoryRepository>();
        users
            .Setup(instance => instance.SearchUsersAsync(
                It.Is<SearchUsersCriteria>(c => c.Limit == 100),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(EmptyResult);
        var handler = new SearchUsersQueryHandler(users.Object);

        var result = await handler.Handle(
            new SearchUsersQuery(Guid.NewGuid(), null, null, null, null, null, null, null, null, null, 1, 500),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        users.VerifyAll();
    }

    [Fact]
    public async Task Handle_passes_valid_page_and_limit_through_unchanged()
    {
        var users = new Mock<IUserDirectoryRepository>();
        users
            .Setup(instance => instance.SearchUsersAsync(
                It.Is<SearchUsersCriteria>(c => c.Page == 3 && c.Limit == 50),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(EmptyResult);
        var handler = new SearchUsersQueryHandler(users.Object);

        var result = await handler.Handle(
            new SearchUsersQuery(Guid.NewGuid(), null, null, null, null, null, null, null, null, null, 3, 50),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        users.VerifyAll();
    }

    [Fact]
    public async Task Handle_forwards_filters_and_excludes_the_caller_unchanged()
    {
        var callerId = Guid.NewGuid();
        var users = new Mock<IUserDirectoryRepository>();
        users
            .Setup(instance => instance.SearchUsersAsync(
                It.Is<SearchUsersCriteria>(c =>
                    c.ExcludeUserId == callerId
                    && c.Role == "PLAYER"
                    && c.Position == "FORWARD"
                    && c.Club == "Real Madrid"
                    && c.Country == "Spain"
                    && c.City == "Madrid"
                    && c.MinAge == 18
                    && c.MaxAge == 30
                    && c.Search == "messi"
                    && c.Sort == "age_asc"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(EmptyResult);
        var handler = new SearchUsersQueryHandler(users.Object);

        var result = await handler.Handle(
            new SearchUsersQuery(
                callerId, "PLAYER", "FORWARD", "Real Madrid", "Spain", "Madrid", 18, 30, "messi", "age_asc", 1, 20),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        users.VerifyAll();
    }
}
