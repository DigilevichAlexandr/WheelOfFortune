using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using WheelOfFortune.Data;
using WheelOfFortune.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite("Data Source=wheel.db"));
builder.Services.AddScoped<AuthService>();
builder.Services.AddSingleton<GameStateService>();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.Cookie.HttpOnly = true;
        o.Cookie.SameSite = SameSiteMode.Strict;
        o.LoginPath = "/";
        o.Events.OnRedirectToLogin = ctx =>
        {
            ctx.Response.StatusCode = 401;
            return Task.CompletedTask;
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapPost("/api/register", async (RegisterRequest req, AuthService auth) =>
{
    var (ok, error) = await auth.RegisterAsync(req.Username ?? "", req.Password ?? "");
    if (!ok) return Results.BadRequest(new { message = error });
    return Results.Ok(new { message = "Регистрация прошла. Войдите." });
});

app.MapPost("/api/login", async (LoginRequest req, AuthService auth, HttpContext ctx) =>
{
    var user = await auth.ValidateAsync(req.Username ?? "", req.Password ?? "");
    if (user is null) return Results.BadRequest(new { message = "Неверный логин или пароль." });

    var claims = new[] { new Claim(ClaimTypes.Name, user.Username), new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()) };
    var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
    await ctx.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity));
    return Results.Ok(new { username = user.Username });
});

app.MapPost("/api/logout", async (HttpContext ctx) =>
{
    await ctx.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.Ok();
});

app.MapGet("/api/me", (HttpContext ctx) =>
{
    if (!ctx.User.Identity?.IsAuthenticated ?? true)
        return Results.Json((object?)null);
    return Results.Ok(new { username = ctx.User.Identity?.Name });
}).AllowAnonymous();

app.MapGet("/api/state", (GameStateService game) => Results.Ok(game.GetState())).RequireAuthorization();
app.MapPost("/api/participants", (CreateParticipantRequest request, GameStateService game) =>
{
    if (string.IsNullOrWhiteSpace(request.Name))
        return Results.BadRequest(new { message = "Имя участника обязательно." });
    if (request.Points <= 0)
        return Results.BadRequest(new { message = "Количество очков должно быть больше нуля." });
    var participant = game.AddParticipant(request.Name.Trim(), request.Points);
    return Results.Ok(participant);
}).RequireAuthorization();

app.MapPost("/api/spin", (GameStateService game) =>
{
    var result = game.Spin();
    return result is null
        ? Results.BadRequest(new { message = "Добавьте хотя бы одного участника, чтобы крутить колесо." })
        : Results.Ok(result);
}).RequireAuthorization();

app.MapPost("/api/redeem", (RedeemPrizeRequest request, GameStateService game) =>
{
    if (string.IsNullOrWhiteSpace(request.WinnerId))
        return Results.BadRequest(new { message = "Не выбран победитель." });
    var success = game.Redeem(request.WinnerId, request.PrizeCost);
    return success ? Results.Ok(game.GetState()) : Results.BadRequest(new { message = "Недостаточно очков или победитель не найден." });
}).RequireAuthorization();

app.Run();

internal sealed record RegisterRequest(string? Username, string? Password);
internal sealed record LoginRequest(string? Username, string? Password);
internal sealed record CreateParticipantRequest(string Name, int Points);
internal sealed record RedeemPrizeRequest(string WinnerId, int PrizeCost);
