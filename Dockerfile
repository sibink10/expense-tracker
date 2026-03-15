FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/QubiqonFinanceHub.API/QubiqonFinanceHub.API.csproj", "src/QubiqonFinanceHub.API/"]
RUN dotnet restore "src/QubiqonFinanceHub.API/QubiqonFinanceHub.API.csproj"
COPY . .
WORKDIR "/src/src/QubiqonFinanceHub.API"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "QubiqonFinanceHub.API.dll"]
