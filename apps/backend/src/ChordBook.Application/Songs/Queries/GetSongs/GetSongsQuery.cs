using ChordBook.Application.Songs.DTOs;
using MediatR;

namespace ChordBook.Application.Songs.Queries.GetSongs;

public record GetSongsQuery(Guid? UserId) : IRequest<IEnumerable<SongListItemDto>>;
