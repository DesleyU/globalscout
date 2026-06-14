FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY src/api/GlobalScout.slnx src/api/
COPY src/api/GlobalScout.Application/GlobalScout.Application.csproj src/api/GlobalScout.Application/
COPY src/api/GlobalScout.Domain/GlobalScout.Domain.csproj src/api/GlobalScout.Domain/
COPY src/api/GlobalScout.Infrastructure/GlobalScout.Infrastructure.csproj src/api/GlobalScout.Infrastructure/
COPY src/api/GlobalScout.Migrator/GlobalScout.Migrator.csproj src/api/GlobalScout.Migrator/
COPY src/api/GlobalScout.SharedKernel/GlobalScout.SharedKernel.csproj src/api/GlobalScout.SharedKernel/

RUN dotnet restore src/api/GlobalScout.Migrator/GlobalScout.Migrator.csproj

COPY src/api src/api
RUN dotnet publish src/api/GlobalScout.Migrator/GlobalScout.Migrator.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "GlobalScout.Migrator.dll"]
