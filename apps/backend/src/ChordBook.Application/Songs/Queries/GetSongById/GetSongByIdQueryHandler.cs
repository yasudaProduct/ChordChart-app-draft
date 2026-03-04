using ChordBook.Application.Common.Interfaces;
using ChordBook.Application.Songs.DTOs;
using ChordBook.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ChordBook.Application.Songs.Queries.GetSongById;

public class GetSongByIdQueryHandler
    : IRequestHandler<GetSongByIdQuery, SongDto?>
{
    private readonly IApplicationDbContext _context;

    public GetSongByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SongDto?> Handle(
        GetSongByIdQuery request, CancellationToken cancellationToken)
    {
        var song = await _context.Songs
            .FirstOrDefaultAsync(
                s => s.Id == request.Id &&
                    (request.UserId.HasValue
                        ? (s.UserId == request.UserId.Value
                            || s.Visibility == Visibility.Public
                            || s.Visibility == Visibility.UrlOnly)
                        : s.Visibility == Visibility.Public),
                cancellationToken);

        if (song is null) return null;

        var content = JsonSerializer.Deserialize<JsonElement>(song.Content);
        return new SongDto(
            song.Id, song.Title, song.Artist, song.Key, song.Bpm,
            song.TimeSignature, content, song.Visibility,
            song.CreatedAt, song.UpdatedAt);
    }
}
