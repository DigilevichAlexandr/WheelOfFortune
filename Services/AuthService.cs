using Microsoft.EntityFrameworkCore;
using WheelOfFortune.Data;
using WheelOfFortune.Models;

namespace WheelOfFortune.Services;

public sealed class AuthService
{
    private readonly AppDbContext _db;

    public AuthService(AppDbContext db) => _db = db;

    public async Task<(bool Ok, string? Error)> RegisterAsync(string username, string password)
    {
        username = username.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(username) || username.Length < 3)
            return (false, "Логин от 3 символов.");
        if (string.IsNullOrEmpty(password) || password.Length < 4)
            return (false, "Пароль от 4 символов.");

        if (await _db.Users.AnyAsync(u => u.Username == username))
            return (false, "Такой логин уже занят.");

        var user = new User
        {
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password)
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<User?> ValidateAsync(string username, string password)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username.Trim().ToLowerInvariant());
        return user != null && BCrypt.Net.BCrypt.Verify(password, user.PasswordHash) ? user : null;
    }
}
