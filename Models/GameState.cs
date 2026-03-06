namespace WheelOfFortune.Models;

public sealed class GameState
{
    public IReadOnlyList<Participant> Participants { get; init; } = [];
    public int TotalPoints { get; init; }
    public WinnerBalance? WinnerBalance { get; init; }
}

public sealed class WinnerBalance
{
    public string ParticipantId { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public int Balance { get; init; }
}

public sealed class SpinResult
{
    public string ParticipantId { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public int WonPoints { get; init; }
    public double Pointer { get; init; }
}
