using ChordBook.Application.Common.Interfaces;
using ChordBook.Application.Songs.DTOs;
using ChordBook.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChordBook.Application.Songs.Queries.GetSongs;

public class GetSongsQueryHandler
    : IRequestHandler<GetSongsQuery, IEnumerable<SongListItemDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSongsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<SongListItemDto>> Handle(
        GetSongsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Songs.AsQueryable();

        if (request.UserId.HasValue)
            query = query.Where(s => s.UserId == request.UserId.Value);
        else
            query = query.Where(s => s.Visibility == Visibility.Public);

        return await query
            .OrderByDescending(s => s.UpdatedAt)
            .Select(s => new SongListItemDto(
                s.Id, s.Title, s.Artist, s.Key, s.UpdatedAt))
            .ToListAsync(cancellationToken);
    }
}
