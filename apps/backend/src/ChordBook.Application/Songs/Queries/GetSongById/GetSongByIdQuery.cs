using ChordBook.Application.Songs.DTOs;
using MediatR;

namespace ChordBook.Application.Songs.Queries.GetSongById;

public record GetSongByIdQuery(Guid Id, Guid? UserId) : IRequest<SongDto?>;
