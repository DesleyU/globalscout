FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY src/GlobalScout/GlobalScout.slnx src/GlobalScout/
COPY src/GlobalScout/GlobalScout.Application/GlobalScout.Application.csproj src/GlobalScout/GlobalScout.Application/
COPY src/GlobalScout/GlobalScout.Domain/GlobalScout.Domain.csproj src/GlobalScout/GlobalScout.Domain/
COPY src/GlobalScout/GlobalScout.Infrastructure/GlobalScout.Infrastructure.csproj src/GlobalScout/GlobalScout.Infrastructure/
COPY src/GlobalScout/GlobalScout.Migrator/GlobalScout.Migrator.csproj src/GlobalScout/GlobalScout.Migrator/
COPY src/GlobalScout/GlobalScout.SharedKernel/GlobalScout.SharedKernel.csproj src/GlobalScout/GlobalScout.SharedKernel/

RUN dotnet restore src/GlobalScout/GlobalScout.Migrator/GlobalScout.Migrator.csproj

COPY src/GlobalScout src/GlobalScout
RUN dotnet publish src/GlobalScout/GlobalScout.Migrator/GlobalScout.Migrator.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "GlobalScout.Migrator.dll"]
