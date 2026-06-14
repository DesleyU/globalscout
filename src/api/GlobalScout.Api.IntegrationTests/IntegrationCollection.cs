using Xunit;

namespace GlobalScout.Api.IntegrationTests;

[CollectionDefinition(nameof(IntegrationCollection))]
public sealed class IntegrationCollection : ICollectionFixture<IntegrationTestFixture>;
