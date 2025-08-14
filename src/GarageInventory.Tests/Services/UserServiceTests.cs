using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using FluentAssertions;
using GarageInventory.Application.Services;
using GarageInventory.Application.DTOs;
using GarageInventory.Domain.Entities;
using GarageInventory.Domain.Interfaces;

namespace GarageInventory.Tests.Services;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _mockUserRepository;
    private readonly Mock<IPasswordHasher> _mockPasswordHasher;
    private readonly Mock<ILogger<UserService>> _mockLogger;
    private readonly UserService _userService;
    private readonly Guid _testUserId = Guid.NewGuid();

    public UserServiceTests()
    {
        _mockUserRepository = new Mock<IUserRepository>();
        _mockPasswordHasher = new Mock<IPasswordHasher>();
        _mockLogger = new Mock<ILogger<UserService>>();
        _userService = new UserService(_mockUserRepository.Object, _mockPasswordHasher.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnUserDto_WhenUserExists()
    {
        // Arrange
        var user = new User
        {
            Id = _testUserId,
            Username = "johndoe",
            Email = "john.doe@example.com",
            FirstName = "John",
            LastName = "Doe",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _mockUserRepository.Setup(x => x.GetByIdAsync(_testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act
        var result = await _userService.GetByIdAsync(_testUserId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(_testUserId);
        result.Username.Should().Be("johndoe");
        result.Email.Should().Be("john.doe@example.com");
        result.FirstName.Should().Be("John");
        result.LastName.Should().Be("Doe");
        result.FullName.Should().Be("John Doe");
        result.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenUserDoesNotExist()
    {
        // Arrange
        _mockUserRepository.Setup(x => x.GetByIdAsync(_testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _userService.GetByIdAsync(_testUserId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateAsync_ShouldReturnUpdatedUserDto_WhenValidRequest()
    {
        // Arrange
        var existingUser = new User
        {
            Id = _testUserId,
            Username = "johndoe",
            Email = "john.doe@example.com",
            FirstName = "John",
            LastName = "Doe",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var updateDto = new UpdateUserDto
        {
            Email = "john.updated@example.com",
            FirstName = "John",
            LastName = "Updated"
        };

        var updatedUser = new User
        {
            Id = _testUserId,
            Username = "johndoe",
            Email = "john.updated@example.com",
            FirstName = "John",
            LastName = "Updated",
            IsActive = true,
            CreatedAt = existingUser.CreatedAt
        };

        _mockUserRepository.Setup(x => x.GetByIdAsync(_testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);
        _mockUserRepository.Setup(x => x.EmailExistsAsync("john.updated@example.com", _testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _mockUserRepository.Setup(x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedUser);

        // Act
        var result = await _userService.UpdateAsync(_testUserId, updateDto);

        // Assert
        result.Should().NotBeNull();
        result.Email.Should().Be("john.updated@example.com");
        result.FirstName.Should().Be("John");
        result.LastName.Should().Be("Updated");
        result.FullName.Should().Be("John Updated");
        
        _mockUserRepository.Verify(x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ShouldThrowArgumentException_WhenUserDoesNotExist()
    {
        // Arrange
        var updateDto = new UpdateUserDto
        {
            Email = "john.doe@example.com",
            FirstName = "John",
            LastName = "Doe"
        };

        _mockUserRepository.Setup(x => x.GetByIdAsync(_testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act & Assert
        await _userService.Invoking(x => x.UpdateAsync(_testUserId, updateDto))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("User not found");
    }

    [Fact]
    public async Task UpdateAsync_ShouldThrowInvalidOperationException_WhenEmailAlreadyExists()
    {
        // Arrange
        var existingUser = new User
        {
            Id = _testUserId,
            Username = "johndoe",
            Email = "john.doe@example.com",
            FirstName = "John",
            LastName = "Doe",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var updateDto = new UpdateUserDto
        {
            Email = "existing@example.com",
            FirstName = "John",
            LastName = "Doe"
        };

        _mockUserRepository.Setup(x => x.GetByIdAsync(_testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);
        _mockUserRepository.Setup(x => x.EmailExistsAsync("existing@example.com", _testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act & Assert
        await _userService.Invoking(x => x.UpdateAsync(_testUserId, updateDto))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Email already exists");
    }

    [Fact]
    public async Task ChangePasswordAsync_ShouldReturnTrue_WhenPasswordChangedSuccessfully()
    {
        // Arrange
        var user = new User
        {
            Id = _testUserId,
            Username = "johndoe",
            Email = "john.doe@example.com",
            PasswordHash = "hashedoldpassword",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var changePasswordDto = new ChangePasswordDto
        {
            CurrentPassword = "oldpassword",
            NewPassword = "newpassword123"
        };

        _mockUserRepository.Setup(x => x.GetByIdAsync(_testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _mockPasswordHasher.Setup(x => x.VerifyPassword("oldpassword", "hashedoldpassword"))
            .Returns(true);
        _mockPasswordHasher.Setup(x => x.HashPassword("newpassword123"))
            .Returns("hashednewpassword");
        _mockUserRepository.Setup(x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act
        var result = await _userService.ChangePasswordAsync(_testUserId, changePasswordDto);

        // Assert
        result.Should().BeTrue();
        _mockPasswordHasher.Verify(x => x.VerifyPassword("oldpassword", "hashedoldpassword"), Times.Once);
        _mockPasswordHasher.Verify(x => x.HashPassword("newpassword123"), Times.Once);
        _mockUserRepository.Verify(x => x.UpdateAsync(It.Is<User>(u => u.PasswordHash == "hashednewpassword"), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ChangePasswordAsync_ShouldReturnFalse_WhenCurrentPasswordIsIncorrect()
    {
        // Arrange
        var user = new User
        {
            Id = _testUserId,
            Username = "johndoe",
            Email = "john.doe@example.com",
            PasswordHash = "hashedoldpassword",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var changePasswordDto = new ChangePasswordDto
        {
            CurrentPassword = "wrongpassword",
            NewPassword = "newpassword123"
        };

        _mockUserRepository.Setup(x => x.GetByIdAsync(_testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _mockPasswordHasher.Setup(x => x.VerifyPassword("wrongpassword", "hashedoldpassword"))
            .Returns(false);

        // Act
        var result = await _userService.ChangePasswordAsync(_testUserId, changePasswordDto);

        // Assert
        result.Should().BeFalse();
        _mockPasswordHasher.Verify(x => x.VerifyPassword("wrongpassword", "hashedoldpassword"), Times.Once);
        _mockPasswordHasher.Verify(x => x.HashPassword(It.IsAny<string>()), Times.Never);
        _mockUserRepository.Verify(x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ChangePasswordAsync_ShouldThrowArgumentException_WhenUserDoesNotExist()
    {
        // Arrange
        var changePasswordDto = new ChangePasswordDto
        {
            CurrentPassword = "oldpassword",
            NewPassword = "newpassword123"
        };

        _mockUserRepository.Setup(x => x.GetByIdAsync(_testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act & Assert
        await _userService.Invoking(x => x.ChangePasswordAsync(_testUserId, changePasswordDto))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("User not found");
    }

    [Fact]
    public async Task EmailExistsAsync_ShouldReturnTrue_WhenEmailExists()
    {
        // Arrange
        var email = "existing@example.com";
        _mockUserRepository.Setup(x => x.EmailExistsAsync(email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _userService.EmailExistsAsync(email);

        // Assert
        result.Should().BeTrue();
        _mockUserRepository.Verify(x => x.EmailExistsAsync(email, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task EmailExistsAsync_ShouldReturnFalse_WhenEmailDoesNotExist()
    {
        // Arrange
        var email = "nonexistent@example.com";
        _mockUserRepository.Setup(x => x.EmailExistsAsync(email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _userService.EmailExistsAsync(email);

        // Assert
        result.Should().BeFalse();
        _mockUserRepository.Verify(x => x.EmailExistsAsync(email, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UsernameExistsAsync_ShouldReturnTrue_WhenUsernameExists()
    {
        // Arrange
        var username = "existinguser";
        _mockUserRepository.Setup(x => x.UsernameExistsAsync(username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _userService.UsernameExistsAsync(username);

        // Assert
        result.Should().BeTrue();
        _mockUserRepository.Verify(x => x.UsernameExistsAsync(username, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UsernameExistsAsync_ShouldReturnFalse_WhenUsernameDoesNotExist()
    {
        // Arrange
        var username = "nonexistentuser";
        _mockUserRepository.Setup(x => x.UsernameExistsAsync(username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _userService.UsernameExistsAsync(username);

        // Assert
        result.Should().BeFalse();
        _mockUserRepository.Verify(x => x.UsernameExistsAsync(username, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task UpdateAsync_ShouldNotUpdateEmail_WhenEmailIsNullOrEmpty(string email)
    {
        // Arrange
        var existingUser = new User
        {
            Id = _testUserId,
            Username = "johndoe",
            Email = "john.doe@example.com",
            FirstName = "John",
            LastName = "Doe",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var updateDto = new UpdateUserDto
        {
            Email = email,
            FirstName = "John",
            LastName = "Updated"
        };

        _mockUserRepository.Setup(x => x.GetByIdAsync(_testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);
        _mockUserRepository.Setup(x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        // Act
        var result = await _userService.UpdateAsync(_testUserId, updateDto);

        // Assert
        result.Email.Should().Be("john.doe@example.com"); // Should remain unchanged
        _mockUserRepository.Verify(x => x.EmailExistsAsync(It.IsAny<string>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ChangePasswordAsync_ShouldValidatePasswordComplexity()
    {
        // Arrange
        var user = new User
        {
            Id = _testUserId,
            Username = "johndoe",
            Email = "john.doe@example.com",
            PasswordHash = "hashedoldpassword",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var changePasswordDto = new ChangePasswordDto
        {
            CurrentPassword = "oldpassword",
            NewPassword = "123" // Too weak
        };

        _mockUserRepository.Setup(x => x.GetByIdAsync(_testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _mockPasswordHasher.Setup(x => x.VerifyPassword("oldpassword", "hashedoldpassword"))
            .Returns(true);

        // Act & Assert
        await _userService.Invoking(x => x.ChangePasswordAsync(_testUserId, changePasswordDto))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("Password must be at least 8 characters long");
    }
}