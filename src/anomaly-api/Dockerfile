#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5258

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["AnomalyApi/AnomalyApi.csproj", "AnomalyApi/"]
RUN dotnet restore "AnomalyApi/AnomalyApi.csproj"
COPY . .
WORKDIR "/src/AnomalyApi"
RUN dotnet build "AnomalyApi.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AnomalyApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:5258

ENTRYPOINT ["dotnet", "AnomalyApi.dll"]