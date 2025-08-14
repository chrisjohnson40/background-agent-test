using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using GarageInventory.Application.DTOs;
using GarageInventory.Application.Interfaces;
using GarageInventory.Domain.Entities;
using GarageInventory.Domain.Interfaces;
using Moq;
using Xunit;

namespace GarageInventory.Tests.Services;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly IAuthService _authService;

    public AuthServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        
        // Note: This will fail until we implement the actual AuthService
        // This is intentional for TDD - RED phase
        _authService = null!; // Will be replaced with actual implementation
    }

    [Fact]
    public async Task RegisterAsync_WithValidData_ShouldCreateUserSuccessfully()
    {
        // Arrange
        var createUserDto = new CreateUserDto
        {
            Email = "test@example.com",
            Password = "Password1!",
            FirstName = "John",
            LastName = "Doe",
            Username = "johndoe"
        };

        var expectedUser = new User
        {
            Id = Guid.NewGuid(),
            Email = createUserDto.Email,
            FirstName = createUserDto.FirstName,
            LastName = createUserDto.LastName,
            Username = createUserDto.Username,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(createUserDto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        
        _userRepositoryMock.Setup(x => x.GetByUsernameAsync(createUserDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        _userRepositoryMock.Setup(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedUser);

        _unitOfWorkMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _authService.RegisterAsync(createUserDto);

        // Assert
        result.Should().NotBeNull();
        result.Email.Should().Be(createUserDto.Email);
        result.FirstName.Should().Be(createUserDto.FirstName);
        result.LastName.Should().Be(createUserDto.LastName);
        result.Username.Should().Be(createUserDto.Username);
        result.IsActive.Should().BeTrue();

        _userRepositoryMock.Verify(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("")]
    [InlineData("invalid-email")]
    [InlineData("test@")]
    [InlineData("@example.com")]
    [InlineData("test.example.com")]
    public async Task RegisterAsync_WithInvalidEmail_ShouldThrowArgumentException(string invalidEmail)
    {
        // Arrange
        var createUserDto = new CreateUserDto
        {
            Email = invalidEmail,
            Password = "Password1!",
            FirstName = "John",
            LastName = "Doe",
            Username = "johndoe"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => 
            _authService.RegisterAsync(createUserDto));
        
        exception.Message.Should().Contain("Invalid email format");
    }

    [Fact]
    public async Task RegisterAsync_WithExistingEmail_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var createUserDto = new CreateUserDto
        {
            Email = "existing@example.com",
            Password = "Password1!",
            FirstName = "John",
            LastName = "Doe",
            Username = "johndoe"
        };

        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Email = createUserDto.Email,
            Username = "existinguser"
        };

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(createUserDto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => 
            _authService.RegisterAsync(createUserDto));
        
        exception.Message.Should().Be("Email already exists");
    }

    [Fact]
    public async Task RegisterAsync_WithExistingUsername_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var createUserDto = new CreateUserDto
        {
            Email = "test@example.com",
            Password = "Password1!",
            FirstName = "John",
            LastName = "Doe",
            Username = "existinguser"
        };

        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "other@example.com",
            Username = createUserDto.Username
        };

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(createUserDto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        
        _userRepositoryMock.Setup(x => x.GetByUsernameAsync(createUserDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => 
            _authService.RegisterAsync(createUserDto));
        
        exception.Message.Should().Be("Username already exists");
    }

    [Theory]
    [InlineData("")]
    [InlineData("weak")]
    [InlineData("password")]
    [InlineData("PASSWORD")]
    [InlineData("Password")]
    [InlineData("Password1")]
    [InlineData("Pass1!")]
    public async Task RegisterAsync_WithWeakPassword_ShouldThrowArgumentException(string weakPassword)
    {
        // Arrange
        var createUserDto = new CreateUserDto
        {
            Email = "test@example.com",
            Password = weakPassword,
            FirstName = "John",
            LastName = "Doe",
            Username = "johndoe"
        };

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(createUserDto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        
        _userRepositoryMock.Setup(x => x.GetByUsernameAsync(createUserDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => 
            _authService.RegisterAsync(createUserDto));
        
        exception.Message.Should().Contain("Password does not meet security requirements");
    }

    [Theory]
    [InlineData("Password1!")]
    [InlineData("MySecure123@")]
    [InlineData("Complex$Pass9")]
    [InlineData("StrongP@ssw0rd")]
    public async Task RegisterAsync_WithStrongPassword_ShouldSucceed(string strongPassword)
    {
        // Arrange
        var createUserDto = new CreateUserDto
        {
            Email = "test@example.com",
            Password = strongPassword,
            FirstName = "John",
            LastName = "Doe",
            Username = "johndoe"
        };

        var expectedUser = new User
        {
            Id = Guid.NewGuid(),
            Email = createUserDto.Email,
            FirstName = createUserDto.FirstName,
            LastName = createUserDto.LastName,
            Username = createUserDto.Username,
            IsActive = true
        };

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(createUserDto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        
        _userRepositoryMock.Setup(x => x.GetByUsernameAsync(createUserDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        _userRepositoryMock.Setup(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedUser);

        _unitOfWorkMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _authService.RegisterAsync(createUserDto);

        // Assert
        result.Should().NotBeNull();
        result.Email.Should().Be(createUserDto.Email);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task RegisterAsync_WithEmptyFirstName_ShouldThrowArgumentException(string? firstName)
    {
        // Arrange
        var createUserDto = new CreateUserDto
        {
            Email = "test@example.com",
            Password = "Password1!",
            FirstName = firstName!,
            LastName = "Doe",
            Username = "johndoe"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => 
            _authService.RegisterAsync(createUserDto));
        
        exception.Message.Should().Contain("First name is required");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task RegisterAsync_WithEmptyLastName_ShouldThrowArgumentException(string? lastName)
    {
        // Arrange
        var createUserDto = new CreateUserDto
        {
            Email = "test@example.com",
            Password = "Password1!",
            FirstName = "John",
            LastName = lastName!,
            Username = "johndoe"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => 
            _authService.RegisterAsync(createUserDto));
        
        exception.Message.Should().Contain("Last name is required");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task RegisterAsync_WithEmptyUsername_ShouldThrowArgumentException(string? username)
    {
        // Arrange
        var createUserDto = new CreateUserDto
        {
            Email = "test@example.com",
            Password = "Password1!",
            FirstName = "John",
            LastName = "Doe",
            Username = username!
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => 
            _authService.RegisterAsync(createUserDto));
        
        exception.Message.Should().Contain("Username is required");
    }

    [Fact]
    public async Task RegisterAsync_ShouldHashPassword()
    {
        // Arrange
        var createUserDto = new CreateUserDto
        {
            Email = "test@example.com",
            Password = "Password1!",
            FirstName = "John",
            LastName = "Doe",
            Username = "johndoe"
        };

        User? capturedUser = null;
        _userRepositoryMock.Setup(x => x.GetByEmailAsync(createUserDto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        
        _userRepositoryMock.Setup(x => x.GetByUsernameAsync(createUserDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        _userRepositoryMock.Setup(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .Callback<User, CancellationToken>((user, _) => capturedUser = user)
            .ReturnsAsync((User user, CancellationToken _) => user);

        _unitOfWorkMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        await _authService.RegisterAsync(createUserDto);

        // Assert
        capturedUser.Should().NotBeNull();
        capturedUser!.PasswordHash.Should().NotBe(createUserDto.Password);
        capturedUser.PasswordHash.Should().NotBeNullOrEmpty();
        
        // Verify password can be verified with the hash
        var isValidPassword = _authService.VerifyPassword(createUserDto.Password, capturedUser.PasswordHash);
        isValidPassword.Should().BeTrue();
    }

    [Fact]
    public void HashPassword_ShouldReturnHashedPassword()
    {
        // Arrange
        var password = "Password1!";

        // Act
        var hashedPassword = _authService.HashPassword(password);

        // Assert
        hashedPassword.Should().NotBeNullOrEmpty();
        hashedPassword.Should().NotBe(password);
    }

    [Fact]
    public void VerifyPassword_WithCorrectPassword_ShouldReturnTrue()
    {
        // Arrange
        var password = "Password1!";
        var hashedPassword = _authService.HashPassword(password);

        // Act
        var result = _authService.VerifyPassword(password, hashedPassword);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void VerifyPassword_WithIncorrectPassword_ShouldReturnFalse()
    {
        // Arrange
        var password = "Password1!";
        var wrongPassword = "WrongPassword1!";
        var hashedPassword = _authService.HashPassword(password);

        // Act
        var result = _authService.VerifyPassword(wrongPassword, hashedPassword);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task RegisterAsync_ShouldSetUserAsActive()
    {
        // Arrange
        var createUserDto = new CreateUserDto
        {
            Email = "test@example.com",
            Password = "Password1!",
            FirstName = "John",
            LastName = "Doe",
            Username = "johndoe"
        };

        User? capturedUser = null;
        _userRepositoryMock.Setup(x => x.GetByEmailAsync(createUserDto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        
        _userRepositoryMock.Setup(x => x.GetByUsernameAsync(createUserDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        _userRepositoryMock.Setup(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .Callback<User, CancellationToken>((user, _) => capturedUser = user)
            .ReturnsAsync((User user, CancellationToken _) => user);

        _unitOfWorkMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        await _authService.RegisterAsync(createUserDto);

        // Assert
        capturedUser.Should().NotBeNull();
        capturedUser!.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task RegisterAsync_ShouldSetCreatedAtToCurrentTime()
    {
        // Arrange
        var createUserDto = new CreateUserDto
        {
            Email = "test@example.com",
            Password = "Password1!",
            FirstName = "John",
            LastName = "Doe",
            Username = "johndoe"
        };

        var beforeRegistration = DateTime.UtcNow;
        User? capturedUser = null;
        
        _userRepositoryMock.Setup(x => x.GetByEmailAsync(createUserDto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        
        _userRepositoryMock.Setup(x => x.GetByUsernameAsync(createUserDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        _userRepositoryMock.Setup(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .Callback<User, CancellationToken>((user, _) => capturedUser = user)
            .ReturnsAsync((User user, CancellationToken _) => user);

        _unitOfWorkMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        await _authService.RegisterAsync(createUserDto);
        var afterRegistration = DateTime.UtcNow;

        // Assert
        capturedUser.Should().NotBeNull();
        capturedUser!.CreatedAt.Should().BeAfter(beforeRegistration.AddSeconds(-1));
        capturedUser.CreatedAt.Should().BeBefore(afterRegistration.AddSeconds(1));
    }

    #region Login Tests

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ShouldReturnLoginResponse()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Username = "johndoe",
            Password = "Password1!"
        };

        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Username = loginDto.Username,
            Email = "john@example.com",
            FirstName = "John",
            LastName = "Doe",
            PasswordHash = "hashedPassword",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var expectedToken = "jwt-token-here";
        var expectedExpiresAt = DateTime.UtcNow.AddHours(24);

        _userRepositoryMock.Setup(x => x.GetByUsernameAsync(loginDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        _unitOfWorkMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        result.Should().NotBeNull();
        result.Token.Should().NotBeNullOrEmpty();
        result.User.Should().NotBeNull();
        result.User.Id.Should().Be(existingUser.Id);
        result.User.Username.Should().Be(existingUser.Username);
        result.User.Email.Should().Be(existingUser.Email);
        result.User.FirstName.Should().Be(existingUser.FirstName);
        result.User.LastName.Should().Be(existingUser.LastName);
        result.User.IsActive.Should().BeTrue();
        result.ExpiresAt.Should().BeAfter(DateTime.UtcNow);

        _userRepositoryMock.Verify(x => x.GetByUsernameAsync(loginDto.Username, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_WithValidEmailAsUsername_ShouldReturnLoginResponse()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Username = "john@example.com", // Using email as username
            Password = "Password1!"
        };

        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Username = "johndoe",
            Email = loginDto.Username,
            FirstName = "John",
            LastName = "Doe",
            PasswordHash = "hashedPassword",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _userRepositoryMock.Setup(x => x.GetByUsernameAsync(loginDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(loginDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        _unitOfWorkMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        result.Should().NotBeNull();
        result.User.Email.Should().Be(existingUser.Email);
        result.User.Username.Should().Be(existingUser.Username);

        _userRepositoryMock.Verify(x => x.GetByUsernameAsync(loginDto.Username, It.IsAny<CancellationToken>()), Times.Once);
        _userRepositoryMock.Verify(x => x.GetByEmailAsync(loginDto.Username, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidUsername_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Username = "nonexistentuser",
            Password = "Password1!"
        };

        _userRepositoryMock.Setup(x => x.GetByUsernameAsync(loginDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(loginDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => 
            _authService.LoginAsync(loginDto));
        
        exception.Message.Should().Be("Invalid username or password");

        _userRepositoryMock.Verify(x => x.GetByUsernameAsync(loginDto.Username, It.IsAny<CancellationToken>()), Times.Once);
        _userRepositoryMock.Verify(x => x.GetByEmailAsync(loginDto.Username, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Username = "johndoe",
            Password = "WrongPassword1!"
        };

        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Username = loginDto.Username,
            Email = "john@example.com",
            PasswordHash = "hashedPassword",
            IsActive = true
        };

        _userRepositoryMock.Setup(x => x.GetByUsernameAsync(loginDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => 
            _authService.LoginAsync(loginDto));
        
        exception.Message.Should().Be("Invalid username or password");

        _userRepositoryMock.Verify(x => x.GetByUsernameAsync(loginDto.Username, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_WithInactiveUser_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Username = "johndoe",
            Password = "Password1!"
        };

        var inactiveUser = new User
        {
            Id = Guid.NewGuid(),
            Username = loginDto.Username,
            Email = "john@example.com",
            PasswordHash = "hashedPassword",
            IsActive = false // User is inactive
        };

        _userRepositoryMock.Setup(x => x.GetByUsernameAsync(loginDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(inactiveUser);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => 
            _authService.LoginAsync(loginDto));
        
        exception.Message.Should().Be("Account is inactive");

        _userRepositoryMock.Verify(x => x.GetByUsernameAsync(loginDto.Username, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task LoginAsync_WithEmptyUsername_ShouldThrowArgumentException(string? username)
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Username = username!,
            Password = "Password1!"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => 
            _authService.LoginAsync(loginDto));
        
        exception.Message.Should().Contain("Username is required");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task LoginAsync_WithEmptyPassword_ShouldThrowArgumentException(string? password)
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Username = "johndoe",
            Password = password!
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => 
            _authService.LoginAsync(loginDto));
        
        exception.Message.Should().Contain("Password is required");
    }

    [Fact]
    public async Task LoginAsync_ShouldUpdateLastLoginAt()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Username = "johndoe",
            Password = "Password1!"
        };

        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Username = loginDto.Username,
            Email = "john@example.com",
            PasswordHash = "hashedPassword",
            IsActive = true,
            LastLoginAt = null
        };

        var beforeLogin = DateTime.UtcNow;

        _userRepositoryMock.Setup(x => x.GetByUsernameAsync(loginDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        _unitOfWorkMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        await _authService.LoginAsync(loginDto);
        var afterLogin = DateTime.UtcNow;

        // Assert
        existingUser.LastLoginAt.Should().NotBeNull();
        existingUser.LastLoginAt.Should().BeAfter(beforeLogin.AddSeconds(-1));
        existingUser.LastLoginAt.Should().BeBefore(afterLogin.AddSeconds(1));

        _unitOfWorkMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_ShouldGenerateValidToken()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Username = "johndoe",
            Password = "Password1!"
        };

        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Username = loginDto.Username,
            Email = "john@example.com",
            FirstName = "John",
            LastName = "Doe",
            PasswordHash = "hashedPassword",
            IsActive = true
        };

        _userRepositoryMock.Setup(x => x.GetByUsernameAsync(loginDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        _unitOfWorkMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        result.Token.Should().NotBeNullOrEmpty();
        result.ExpiresAt.Should().BeAfter(DateTime.UtcNow);
        
        // Verify token can be validated
        var isValidToken = await _authService.ValidateTokenAsync(result.Token);
        isValidToken.Should().BeTrue();
    }

    [Fact]
    public async Task LoginAsync_ShouldReturnCorrectUserData()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Username = "johndoe",
            Password = "Password1!"
        };

        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Username = loginDto.Username,
            Email = "john@example.com",
            FirstName = "John",
            LastName = "Doe",
            PasswordHash = "hashedPassword",
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        };

        _userRepositoryMock.Setup(x => x.GetByUsernameAsync(loginDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        _unitOfWorkMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        result.User.Should().NotBeNull();
        result.User.Id.Should().Be(existingUser.Id);
        result.User.Username.Should().Be(existingUser.Username);
        result.User.Email.Should().Be(existingUser.Email);
        result.User.FirstName.Should().Be(existingUser.FirstName);
        result.User.LastName.Should().Be(existingUser.LastName);
        result.User.FullName.Should().Be($"{existingUser.FirstName} {existingUser.LastName}");
        result.User.IsActive.Should().Be(existingUser.IsActive);
        result.User.CreatedAt.Should().Be(existingUser.CreatedAt);
        result.User.LastLoginAt.Should().NotBeNull();
    }

    #endregion Login Tests

    #region Session Management Tests

    [Fact]
    public async Task ValidateTokenAsync_WithValidToken_ShouldReturnTrue()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "testuser",
            Email = "test@example.com",
            IsActive = true
        };

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            IsActive = user.IsActive
        };

        var validToken = _authService.GenerateToken(userDto);

        // Act
        var result = await _authService.ValidateTokenAsync(validToken);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task ValidateTokenAsync_WithExpiredToken_ShouldReturnFalse()
    {
        // Arrange
        var expiredToken = "expired.jwt.token";

        // Act
        var result = await _authService.ValidateTokenAsync(expiredToken);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task ValidateTokenAsync_WithInvalidToken_ShouldReturnFalse()
    {
        // Arrange
        var invalidToken = "invalid.token.format";

        // Act
        var result = await _authService.ValidateTokenAsync(invalidToken);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task ValidateTokenAsync_WithNullToken_ShouldReturnFalse()
    {
        // Act
        var result = await _authService.ValidateTokenAsync(null!);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task ValidateTokenAsync_WithEmptyToken_ShouldReturnFalse()
    {
        // Act
        var result = await _authService.ValidateTokenAsync(string.Empty);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetUserFromTokenAsync_WithValidToken_ShouldReturnUser()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "tokenuser",
            Email = "token@example.com",
            FirstName = "Token",
            LastName = "User",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = $"{user.FirstName} {user.LastName}",
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };

        var validToken = _authService.GenerateToken(userDto);

        _userRepositoryMock.Setup(x => x.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act
        var result = await _authService.GetUserFromTokenAsync(validToken);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(user.Id);
        result.Username.Should().Be(user.Username);
        result.Email.Should().Be(user.Email);
        result.FirstName.Should().Be(user.FirstName);
        result.LastName.Should().Be(user.LastName);
        result.IsActive.Should().Be(user.IsActive);
    }

    [Fact]
    public async Task GetUserFromTokenAsync_WithInvalidToken_ShouldReturnNull()
    {
        // Arrange
        var invalidToken = "invalid.token.format";

        // Act
        var result = await _authService.GetUserFromTokenAsync(invalidToken);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetUserFromTokenAsync_WithExpiredToken_ShouldReturnNull()
    {
        // Arrange
        var expiredToken = "expired.jwt.token";

        // Act
        var result = await _authService.GetUserFromTokenAsync(expiredToken);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetUserFromTokenAsync_WithValidTokenButInactiveUser_ShouldReturnNull()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "inactiveuser",
            Email = "inactive@example.com",
            IsActive = false
        };

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            IsActive = true // Token was issued when user was active
        };

        var validToken = _authService.GenerateToken(userDto);

        _userRepositoryMock.Setup(x => x.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act
        var result = await _authService.GetUserFromTokenAsync(validToken);

        // Assert
        result.Should().BeNull(); // Should return null because user is now inactive
    }

    [Fact]
    public void GenerateToken_WithValidUser_ShouldReturnValidJwtToken()
    {
        // Arrange
        var userDto = new UserDto
        {
            Id = Guid.NewGuid(),
            Username = "testuser",
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        // Act
        var token = _authService.GenerateToken(userDto);

        // Assert
        token.Should().NotBeNullOrEmpty();
        token.Split('.').Should().HaveCount(3); // JWT has 3 parts separated by dots
        
        // Token should be valid
        var isValid = _authService.ValidateTokenAsync(token).Result;
        isValid.Should().BeTrue();
    }

    [Fact]
    public void GenerateToken_WithNullUser_ShouldThrowArgumentNullException()
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentNullException>(() => 
            _authService.GenerateToken(null!));
        
        exception.ParamName.Should().Be("user");
    }

    [Fact]
    public void GenerateToken_ShouldIncludeUserClaimsInToken()
    {
        // Arrange
        var userDto = new UserDto
        {
            Id = Guid.NewGuid(),
            Username = "claimsuser",
            Email = "claims@example.com",
            FirstName = "Claims",
            LastName = "User",
            IsActive = true
        };

        // Act
        var token = _authService.GenerateToken(userDto);

        // Assert
        token.Should().NotBeNullOrEmpty();
        
        // Verify user can be extracted from token
        var extractedUser = _authService.GetUserFromTokenAsync(token).Result;
        extractedUser.Should().NotBeNull();
        extractedUser!.Id.Should().Be(userDto.Id);
        extractedUser.Username.Should().Be(userDto.Username);
        extractedUser.Email.Should().Be(userDto.Email);
    }

    [Fact]
    public void GenerateToken_ShouldCreateUniqueTokensForSameUser()
    {
        // Arrange
        var userDto = new UserDto
        {
            Id = Guid.NewGuid(),
            Username = "uniqueuser",
            Email = "unique@example.com",
            IsActive = true
        };

        // Act
        var token1 = _authService.GenerateToken(userDto);
        var token2 = _authService.GenerateToken(userDto);

        // Assert
        token1.Should().NotBe(token2); // Tokens should be unique due to timestamp/nonce
    }

    [Fact]
    public void GenerateToken_ShouldSetExpirationTime()
    {
        // Arrange
        var userDto = new UserDto
        {
            Id = Guid.NewGuid(),
            Username = "expiryuser",
            Email = "expiry@example.com",
            IsActive = true
        };

        var beforeGeneration = DateTime.UtcNow;

        // Act
        var token = _authService.GenerateToken(userDto);

        // Assert
        token.Should().NotBeNullOrEmpty();
        
        // Token should be valid now
        var isValidNow = _authService.ValidateTokenAsync(token).Result;
        isValidNow.Should().BeTrue();
        
        // Token should have reasonable expiration (not expired immediately)
        var afterGeneration = DateTime.UtcNow;
        var timeDiff = afterGeneration - beforeGeneration;
        timeDiff.Should().BeLessThan(TimeSpan.FromSeconds(1)); // Generation should be fast
    }

    #endregion Session Management Tests

    #region Token Refresh Tests

    [Fact]
    public async Task RefreshTokenAsync_WithValidToken_ShouldReturnNewToken()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "refreshuser",
            Email = "refresh@example.com",
            FirstName = "Refresh",
            LastName = "User",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = $"{user.FirstName} {user.LastName}",
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };

        var originalToken = _authService.GenerateToken(userDto);

        _userRepositoryMock.Setup(x => x.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act
        var result = await _authService.RefreshTokenAsync(originalToken);

        // Assert
        result.Should().NotBeNull();
        result.Token.Should().NotBeNullOrEmpty();
        result.Token.Should().NotBe(originalToken); // Should be a new token
        result.ExpiresAt.Should().BeAfter(DateTime.UtcNow);
        result.User.Should().NotBeNull();
        result.User.Id.Should().Be(user.Id);
    }

    [Fact]
    public async Task RefreshTokenAsync_WithInvalidToken_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var invalidToken = "invalid.token.format";

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => 
            _authService.RefreshTokenAsync(invalidToken));
        
        exception.Message.Should().Contain("Invalid token");
    }

    [Fact]
    public async Task RefreshTokenAsync_WithExpiredToken_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var expiredToken = "expired.jwt.token";

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => 
            _authService.RefreshTokenAsync(expiredToken));
        
        exception.Message.Should().Contain("Token expired");
    }

    [Fact]
    public async Task RefreshTokenAsync_WithInactiveUser_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "inactiveuser",
            Email = "inactive@example.com",
            IsActive = false // User is now inactive
        };

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            IsActive = true // Token was issued when user was active
        };

        var validToken = _authService.GenerateToken(userDto);

        _userRepositoryMock.Setup(x => x.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => 
            _authService.RefreshTokenAsync(validToken));
        
        exception.Message.Should().Contain("User account is inactive");
    }

    [Fact]
    public async Task RefreshTokenAsync_WithNonExistentUser_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var userDto = new UserDto
        {
            Id = Guid.NewGuid(),
            Username = "nonexistentuser",
            Email = "nonexistent@example.com",
            IsActive = true
        };

        var validToken = _authService.GenerateToken(userDto);

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userDto.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => 
            _authService.RefreshTokenAsync(validToken));
        
        exception.Message.Should().Contain("User not found");
    }

    [Fact]
    public async Task RefreshTokenAsync_ShouldUpdateLastLoginTime()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "loginuser",
            Email = "login@example.com",
            FirstName = "Login",
            LastName = "User",
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            LastLoginAt = DateTime.UtcNow.AddHours(-2)
        };

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        };

        var originalToken = _authService.GenerateToken(userDto);
        var beforeRefresh = DateTime.UtcNow;

        _userRepositoryMock.Setup(x => x.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _userRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .Callback<User, CancellationToken>((u, _) => user.LastLoginAt = u.LastLoginAt)
            .Returns(Task.CompletedTask);

        _unitOfWorkMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _authService.RefreshTokenAsync(originalToken);
        var afterRefresh = DateTime.UtcNow;

        // Assert
        result.User.LastLoginAt.Should().NotBeNull();
        result.User.LastLoginAt.Should().BeAfter(beforeRefresh.AddSeconds(-1));
        result.User.LastLoginAt.Should().BeBefore(afterRefresh.AddSeconds(1));
        
        _userRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion Token Refresh Tests

    #region Logout Tests

    [Fact]
    public async Task LogoutAsync_WithValidToken_ShouldInvalidateToken()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "logoutuser",
            Email = "logout@example.com",
            IsActive = true
        };

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            IsActive = user.IsActive
        };

        var validToken = _authService.GenerateToken(userDto);

        _userRepositoryMock.Setup(x => x.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act
        await _authService.LogoutAsync(validToken);

        // Assert
        // After logout, token should be invalid
        var isTokenValid = await _authService.ValidateTokenAsync(validToken);
        isTokenValid.Should().BeFalse();
    }

    [Fact]
    public async Task LogoutAsync_WithInvalidToken_ShouldNotThrowException()
    {
        // Arrange
        var invalidToken = "invalid.token.format";

        // Act & Assert
        // Should not throw exception, just handle gracefully
        await _authService.LogoutAsync(invalidToken);
    }

    [Fact]
    public async Task LogoutAsync_WithNullToken_ShouldNotThrowException()
    {
        // Act & Assert
        // Should not throw exception, just handle gracefully
        await _authService.LogoutAsync(null!);
    }

    [Fact]
    public async Task LogoutAsync_WithEmptyToken_ShouldNotThrowException()
    {
        // Act & Assert
        // Should not throw exception, just handle gracefully
        await _authService.LogoutAsync(string.Empty);
    }

    [Fact]
    public async Task LogoutAsync_ShouldAddTokenToBlacklist()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "blacklistuser",
            Email = "blacklist@example.com",
            IsActive = true
        };

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            IsActive = user.IsActive
        };

        var validToken = _authService.GenerateToken(userDto);

        _userRepositoryMock.Setup(x => x.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act
        await _authService.LogoutAsync(validToken);

        // Assert
        // Token should be blacklisted and therefore invalid
        var isTokenValid = await _authService.ValidateTokenAsync(validToken);
        isTokenValid.Should().BeFalse();
    }

    [Fact]
    public async Task LogoutAsync_ShouldClearUserSession()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "sessionuser",
            Email = "session@example.com",
            IsActive = true,
            LastLoginAt = DateTime.UtcNow
        };

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            IsActive = user.IsActive,
            LastLoginAt = user.LastLoginAt
        };

        var validToken = _authService.GenerateToken(userDto);

        _userRepositoryMock.Setup(x => x.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act
        await _authService.LogoutAsync(validToken);

        // Assert
        // User should no longer be retrievable from the token
        var userFromToken = await _authService.GetUserFromTokenAsync(validToken);
        userFromToken.Should().BeNull();
    }

    #endregion Logout Tests
}