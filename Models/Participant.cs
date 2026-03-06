namespace WheelOfFortune.Models;

public sealed class Participant
{
    public string Id { get; init; } = Guid.NewGuid().ToString("N");
    public string Name { get; init; } = string.Empty;
    public int Points { get; set; }
}
