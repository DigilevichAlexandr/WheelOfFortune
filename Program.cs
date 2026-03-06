using WheelOfFortune.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<GameStateService>();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/state", (GameStateService game) => Results.Ok(game.GetState()));

app.MapPost("/api/participants", (CreateParticipantRequest request, GameStateService game) =>
{
    if (string.IsNullOrWhiteSpace(request.Name))
    {
        return Results.BadRequest(new { message = "Имя участника обязательно." });
    }

    if (request.Points <= 0)
    {
        return Results.BadRequest(new { message = "Количество очков должно быть больше нуля." });
    }

    var participant = game.AddParticipant(request.Name.Trim(), request.Points);
    return Results.Ok(participant);
});

app.MapPost("/api/spin", (GameStateService game) =>
{
    var result = game.Spin();
    return result is null
        ? Results.BadRequest(new { message = "Добавьте хотя бы одного участника, чтобы крутить колесо." })
        : Results.Ok(result);
});

app.MapPost("/api/redeem", (RedeemPrizeRequest request, GameStateService game) =>
{
    if (string.IsNullOrWhiteSpace(request.WinnerId))
    {
        return Results.BadRequest(new { message = "Не выбран победитель." });
    }

    var success = game.Redeem(request.WinnerId, request.PrizeCost);
    return success
        ? Results.Ok(game.GetState())
        : Results.BadRequest(new { message = "Недостаточно очков или победитель не найден." });
});

app.Run();

internal sealed record CreateParticipantRequest(string Name, int Points);
internal sealed record RedeemPrizeRequest(string WinnerId, int PrizeCost);
