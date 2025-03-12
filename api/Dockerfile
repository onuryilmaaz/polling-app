# .NET 8 Image'ını Kullan
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Build Aşaması
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["./api.csproj", "./"]
RUN dotnet restore "api.csproj"

COPY . .
WORKDIR "/src/"
RUN dotnet publish -c Release -o /app/publish

# Runtime Aşaması
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "api.dll"]
