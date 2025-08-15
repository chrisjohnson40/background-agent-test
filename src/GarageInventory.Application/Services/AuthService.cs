using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using GarageInventory.Application.DTOs;
using GarageInventory.Application.Interfaces;
using GarageInventory.Domain.Entities;
using GarageInventory.Domain.Interfaces;

namespace GarageInventory.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;

    public AuthService(
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginDto loginDto, CancellationToken cancellationToken = default)
    {
        // Validate input
        if (string.IsNullOrWhiteSpace(loginDto.Username))
            throw new ArgumentException("Username is required");

        if (string.IsNullOrWhiteSpace(loginDto.Password))
            throw new ArgumentException("Password is required");

        // Find user by username or email
        var user = await _userRepository.GetByUsernameAsync(loginDto.Username, cancellationToken);
        if (user == null)
        {
            user = await _userRepository.GetByEmailAsync(loginDto.Username, cancellationToken);
        }

        if (user == null)
            throw new UnauthorizedAccessException("Invalid username or password");

        // Check if user is active
        if (!user.IsActive)
            throw new UnauthorizedAccessException("Account is inactive");

        // Verify password
        if (!VerifyPassword(loginDto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid username or password");

        // Update last login time
        user.LastLoginAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Generate token
        var userDto = MapToUserDto(user);
        var token = GenerateToken(userDto);
        var expiresAt = DateTime.UtcNow.AddHours(24); // Token expires in 24 hours

        return new LoginResponseDto
        {
            Token = token,
            User = userDto,
            ExpiresAt = expiresAt
        };
    }

    public async Task<UserDto> RegisterAsync(CreateUserDto createUserDto, CancellationToken cancellationToken = default)
    {
        // Validate input
        ValidateCreateUserDto(createUserDto);

        // Check if email already exists
        var existingUserByEmail = await _userRepository.GetByEmailAsync(createUserDto.Email, cancellationToken);
        if (existingUserByEmail != null)
            throw new InvalidOperationException("Email already exists");

        // Check if username already exists
        var existingUserByUsername = await _userRepository.GetByUsernameAsync(createUserDto.Username, cancellationToken);
        if (existingUserByUsername != null)
            throw new InvalidOperationException("Username already exists");

        // Create new user
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = createUserDto.Username,
            Email = createUserDto.Email,
            FirstName = createUserDto.FirstName,
            LastName = createUserDto.LastName,
            PasswordHash = HashPassword(createUserDto.Password),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var createdUser = await _userRepository.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToUserDto(createdUser);
    }

    public async Task<bool> ValidateTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(GetJwtSecret());
            
            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<UserDto?> GetUserFromTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(GetJwtSecret());
            
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                return null;

            var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
            return user != null ? MapToUserDto(user) : null;
        }
        catch
        {
            return null;
        }
    }

    public string GenerateToken(UserDto user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(GetJwtSecret());
        
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.GivenName, user.FirstName),
                new Claim(ClaimTypes.Surname, user.LastName)
            }),
            Expires = DateTime.UtcNow.AddHours(24),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }

    public async Task<LoginResponseDto> RefreshTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        var user = await GetUserFromTokenAsync(token, cancellationToken);
        if (user == null)
            throw new UnauthorizedAccessException("Invalid token");

        var newToken = GenerateToken(user);
        var expiresAt = DateTime.UtcNow.AddHours(24);

        return new LoginResponseDto
        {
            Token = newToken,
            User = user,
            ExpiresAt = expiresAt
        };
    }

    public async Task LogoutAsync(string token, CancellationToken cancellationToken = default)
    {
        // For now, we don't maintain a blacklist of tokens
        // In a production system, you might want to store invalidated tokens
        await Task.CompletedTask;
    }

    private void ValidateCreateUserDto(CreateUserDto createUserDto)
    {
        if (string.IsNullOrWhiteSpace(createUserDto.Email))
            throw new ArgumentException("Email is required");

        if (!IsValidEmail(createUserDto.Email))
            throw new ArgumentException("Invalid email format");

        if (string.IsNullOrWhiteSpace(createUserDto.Password))
            throw new ArgumentException("Password is required");

        if (!IsValidPassword(createUserDto.Password))
            throw new ArgumentException("Password does not meet security requirements");

        if (string.IsNullOrWhiteSpace(createUserDto.FirstName))
            throw new ArgumentException("First name is required");

        if (string.IsNullOrWhiteSpace(createUserDto.LastName))
            throw new ArgumentException("Last name is required");

        if (string.IsNullOrWhiteSpace(createUserDto.Username))
            throw new ArgumentException("Username is required");
    }

    private bool IsValidEmail(string email)
    {
        var emailRegex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$");
        return emailRegex.IsMatch(email);
    }

    private bool IsValidPassword(string password)
    {
        // Password must be at least 8 characters long and contain:
        // - At least one uppercase letter
        // - At least one lowercase letter
        // - At least one digit
        // - At least one special character
        if (password.Length < 8)
            return false;

        var hasUpper = Regex.IsMatch(password, @"[A-Z]");
        var hasLower = Regex.IsMatch(password, @"[a-z]");
        var hasDigit = Regex.IsMatch(password, @"\d");
        var hasSpecial = Regex.IsMatch(password, @"[!@#$%^&*(),.?""':;{}|<>]");

        return hasUpper && hasLower && hasDigit && hasSpecial;
    }

    private UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            IsActive = user.IsActive,
            LastLoginAt = user.LastLoginAt,
            CreatedAt = user.CreatedAt
        };
    }

    private string GetJwtSecret()
    {
        return _configuration["Jwt:Secret"] ?? "your-super-secret-jwt-key-that-should-be-at-least-32-characters-long";
    }
}