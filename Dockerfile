FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . ./
<<<<<<< codex/create-prize-wheel-application-in-.net-s2kksc
RUN dotnet restore
=======
>>>>>>> main
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish ./
<<<<<<< codex/create-prize-wheel-application-in-.net-s2kksc
EXPOSE 10000
ENTRYPOINT ["sh", "-c", "dotnet WheelOfFortune.dll --urls http://0.0.0.0:${PORT:-10000}"]
=======
ENV ASPNETCORE_URLS=http://0.0.0.0:10000
EXPOSE 10000
ENTRYPOINT ["dotnet", "WheelOfFortune.dll"]
>>>>>>> main
