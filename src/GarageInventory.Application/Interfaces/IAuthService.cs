using System.Threading;
using System.Threading.Tasks;
using GarageInventory.Application.DTOs;

namespace GarageInventory.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginDto loginDto, CancellationToken cancellationToken = default);
    Task<UserDto> RegisterAsync(CreateUserDto createUserDto, CancellationToken cancellationToken = default);
    Task<bool> ValidateTokenAsync(string token, CancellationToken cancellationToken = default);
    Task<UserDto?> GetUserFromTokenAsync(string token, CancellationToken cancellationToken = default);
    string GenerateToken(UserDto user);
    string HashPassword(string password);
    bool VerifyPassword(string password, string hash);
    
    // Session Management Methods
    Task<LoginResponseDto> RefreshTokenAsync(string token, CancellationToken cancellationToken = default);
    Task LogoutAsync(string token, CancellationToken cancellationToken = default);
}