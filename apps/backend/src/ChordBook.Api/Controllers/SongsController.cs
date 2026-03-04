using ChordBook.Application.Common.Interfaces;
using ChordBook.Application.Songs.Commands.CreateSong;
using ChordBook.Application.Songs.Commands.DeleteSong;
using ChordBook.Application.Songs.Commands.UpdateSong;
using ChordBook.Application.Songs.DTOs;
using ChordBook.Application.Songs.Queries.GetSongById;
using ChordBook.Application.Songs.Queries.GetSongs;
using ChordBook.Application.Songs.Queries.SearchSongs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChordBook.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SongsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public SongsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<SongListItemDto>>> GetSongs()
    {
        var result = await _mediator.Send(
            new GetSongsQuery(_currentUser.UserId));
        return Ok(result);
    }

    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<SongListItemDto>>> SearchSongs(
        [FromQuery] string? q)
    {
        var result = await _mediator.Send(new SearchSongsQuery(q));
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<SongDto>> GetSong(Guid id)
    {
        var result = await _mediator.Send(
            new GetSongByIdQuery(id, _currentUser.UserId));
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<SongDto>> CreateSong(
        [FromBody] CreateSongDto dto)
    {
        if (_currentUser.UserId is null) return Unauthorized();
        var command = new CreateSongCommand(
            _currentUser.UserId.Value, dto.Title, dto.Artist,
            dto.Key, dto.Bpm, dto.TimeSignature);
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetSong), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SongDto>> UpdateSong(
        Guid id, [FromBody] UpdateSongDto dto)
    {
        if (_currentUser.UserId is null) return Unauthorized();
        var command = new UpdateSongCommand(
            id, _currentUser.UserId.Value, dto.Title, dto.Artist,
            dto.Key, dto.Bpm, dto.TimeSignature, dto.Content);
        var result = await _mediator.Send(command);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteSong(Guid id)
    {
        if (_currentUser.UserId is null) return Unauthorized();
        var success = await _mediator.Send(
            new DeleteSongCommand(id, _currentUser.UserId.Value));
        return success ? NoContent() : NotFound();
    }
}
