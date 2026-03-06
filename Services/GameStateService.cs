using WheelOfFortune.Models;

namespace WheelOfFortune.Services;

public sealed class GameStateService
{
    private readonly object _sync = new();
    private readonly Random _random = new();
    private readonly List<Participant> _participants = [];
    private WinnerBalance? _winner;

    public Participant AddParticipant(string name, int points)
    {
        lock (_sync)
        {
            var participant = new Participant
            {
                Name = name,
                Points = points
            };

            _participants.Add(participant);
            return participant;
        }
    }

    public GameState GetState()
    {
        lock (_sync)
        {
            return BuildState();
        }
    }

    public SpinResult? Spin()
    {
        lock (_sync)
        {
            if (_participants.Count == 0)
            {
                return null;
            }

            var totalPoints = _participants.Sum(x => x.Points);
            if (totalPoints <= 0)
            {
                return null;
            }

            var pointer = _random.NextDouble() * totalPoints;
            double cumulative = 0;

            Participant winner = _participants[0];
            foreach (var participant in _participants)
            {
                cumulative += participant.Points;
                if (pointer <= cumulative)
                {
                    winner = participant;
                    break;
                }
            }

            _winner = new WinnerBalance
            {
                ParticipantId = winner.Id,
                Name = winner.Name,
                Balance = totalPoints
            };

            _participants.Clear();

            return new SpinResult
            {
                ParticipantId = winner.Id,
                Name = winner.Name,
                WonPoints = totalPoints,
                Pointer = pointer
            };
        }
    }

    public bool Redeem(string winnerId, int prizeCost)
    {
        lock (_sync)
        {
            if (_winner is null || _winner.ParticipantId != winnerId || prizeCost <= 0 || _winner.Balance < prizeCost)
            {
                return false;
            }

            _winner = new WinnerBalance
            {
                ParticipantId = _winner.ParticipantId,
                Name = _winner.Name,
                Balance = _winner.Balance - prizeCost
            };

            return true;
        }
    }

    private GameState BuildState() =>
        new()
        {
            Participants = _participants
                .Select(p => new Participant { Id = p.Id, Name = p.Name, Points = p.Points })
                .ToList(),
            TotalPoints = _participants.Sum(x => x.Points),
            WinnerBalance = _winner is null
                ? null
                : new WinnerBalance
                {
                    ParticipantId = _winner.ParticipantId,
                    Name = _winner.Name,
                    Balance = _winner.Balance
                }
        };
}
