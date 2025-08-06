# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["GarageInventory.API/GarageInventory.API.csproj", "GarageInventory.API/"]
COPY ["GarageInventory.Application/GarageInventory.Application.csproj", "GarageInventory.Application/"]
COPY ["GarageInventory.Domain/GarageInventory.Domain.csproj", "GarageInventory.Domain/"]
COPY ["GarageInventory.Infrastructure/GarageInventory.Infrastructure.csproj", "GarageInventory.Infrastructure/"]

RUN dotnet restore "GarageInventory.API/GarageInventory.API.csproj"

# Copy source code
COPY . .
WORKDIR "/src/GarageInventory.API"

# Build the application
RUN dotnet build "GarageInventory.API.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "GarageInventory.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Create a non-root user
RUN adduser --disabled-password --gecos '' --shell /bin/bash --home /home/appuser appuser
USER appuser

# Copy published app
COPY --from=publish /app/publish .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

EXPOSE 80
ENTRYPOINT ["dotnet", "GarageInventory.API.dll"]