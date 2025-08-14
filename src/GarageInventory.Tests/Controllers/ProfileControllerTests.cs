using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using FluentAssertions;
using GarageInventory.API.Controllers;
using GarageInventory.Application.DTOs;
using GarageInventory.Application.Interfaces;

namespace GarageInventory.Tests.Controllers;

public class ProfileControllerTests
{
    private readonly Mock<IUserService> _mockUserService;
    private readonly Mock<ILogger<ProfileController>> _mockLogger;
    private readonly ProfileController _controller;
    private readonly Guid _testUserId = Guid.NewGuid();

    public ProfileControllerTests()
    {
        _mockUserService = new Mock<IUserService>();
        _mockLogger = new Mock<ILogger<ProfileController>>();
        _controller = new ProfileController(_mockUserService.Object, _mockLogger.Object);
        
        // Mock the HttpContext to simulate authenticated user
        var httpContext = new DefaultHttpContext();
        httpContext.Items["UserId"] = _testUserId;
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    [Fact]
    public async Task GetProfile_ShouldReturnUserProfile_WhenUserExists()
    {
        // Arrange
        var expectedUser = new UserDto
        {
            Id = _testUserId,
            Username = "johndoe",
            Email = "john.doe@example.com",
            FirstName = "John",
            LastName = "Doe",
            FullName = "John Doe",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _mockUserService.Setup(x => x.GetByIdAsync(_testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedUser);

        // Act
        var result = await _controller.GetProfile();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedUser);
        
        _mockUserService.Verify(x => x.GetByIdAsync(_testUserId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetProfile_ShouldReturnNotFound_WhenUserDoesNotExist()
    {
        // Arrange
        _mockUserService.Setup(x => x.GetByIdAsync(_testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserDto?)null);

        // Act
        var result = await _controller.GetProfile();

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult!.Value.Should().Be("User profile not found");
    }

    [Fact]
    public async Task GetProfile_ShouldReturnInternalServerError_WhenExceptionOccurs()
    {
        // Arrange
        _mockUserService.Setup(x => x.GetByIdAsync(_testUserId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetProfile();

        // Assert
        result.Should().BeOfType<ObjectResult>();
        var objectResult = result as ObjectResult;
        objectResult!.StatusCode.Should().Be(500);
        objectResult.Value.Should().Be("An error occurred while retrieving the profile");
    }

    [Fact]
    public async Task UpdateProfile_ShouldReturnUpdatedProfile_WhenValidRequest()
    {
        // Arrange
        var updateRequest = new UpdateUserDto
        {
            Email = "john.updated@example.com",
            FirstName = "John",
            LastName = "Updated"
        };

        var updatedUser = new UserDto
        {
            Id = _testUserId,
            Username = "johndoe",
            Email = "john.updated@example.com",
            FirstName = "John",
            LastName = "Updated",
            FullName = "John Updated",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _mockUserService.Setup(x => x.UpdateAsync(_testUserId, updateRequest, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedUser);

        // Act
        var result = await _controller.UpdateProfile(updateRequest);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(updatedUser);
        
        _mockUserService.Verify(x => x.UpdateAsync(_testUserId, updateRequest, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateProfile_ShouldReturnBadRequest_WhenModelStateIsInvalid()
    {
        // Arrange
        var updateRequest = new UpdateUserDto
        {
            Email = "invalid-email", // Invalid email format
            FirstName = "John",
            LastName = "Doe"
        };

        _controller.ModelState.AddModelError("Email", "Invalid email format");

        // Act
        var result = await _controller.UpdateProfile(updateRequest);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
        _mockUserService.Verify(x => x.UpdateAsync(It.IsAny<Guid>(), It.IsAny<UpdateUserDto>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateProfile_ShouldReturnNotFound_WhenUserDoesNotExist()
    {
        // Arrange
        var updateRequest = new UpdateUserDto
        {
            Email = "john.doe@example.com",
            FirstName = "John",
            LastName = "Doe"
        };

        _mockUserService.Setup(x => x.UpdateAsync(_testUserId, updateRequest, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("User not found"));

        // Act
        var result = await _controller.UpdateProfile(updateRequest);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult!.Value.Should().Be("User not found");
    }

    [Fact]
    public async Task UpdateProfile_ShouldReturnConflict_WhenEmailAlreadyExists()
    {
        // Arrange
        var updateRequest = new UpdateUserDto
        {
            Email = "existing@example.com",
            FirstName = "John",
            LastName = "Doe"
        };

        _mockUserService.Setup(x => x.UpdateAsync(_testUserId, updateRequest, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Email already exists"));

        // Act
        var result = await _controller.UpdateProfile(updateRequest);

        // Assert
        result.Should().BeOfType<ConflictObjectResult>();
        var conflictResult = result as ConflictObjectResult;
        conflictResult!.Value.Should().Be("Email already exists");
    }

    [Fact]
    public async Task ChangePassword_ShouldReturnOk_WhenPasswordChangedSuccessfully()
    {
        // Arrange
        var changePasswordRequest = new ChangePasswordDto
        {
            CurrentPassword = "oldpassword",
            NewPassword = "newpassword123"
        };

        _mockUserService.Setup(x => x.ChangePasswordAsync(_testUserId, changePasswordRequest, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.ChangePassword(changePasswordRequest);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(new { message = "Password changed successfully" });
        
        _mockUserService.Verify(x => x.ChangePasswordAsync(_testUserId, changePasswordRequest, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ChangePassword_ShouldReturnBadRequest_WhenModelStateIsInvalid()
    {
        // Arrange
        var changePasswordRequest = new ChangePasswordDto
        {
            CurrentPassword = "",
            NewPassword = "123" // Too short
        };

        _controller.ModelState.AddModelError("CurrentPassword", "Current password is required");
        _controller.ModelState.AddModelError("NewPassword", "Password must be at least 8 characters long");

        // Act
        var result = await _controller.ChangePassword(changePasswordRequest);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
        _mockUserService.Verify(x => x.ChangePasswordAsync(It.IsAny<Guid>(), It.IsAny<ChangePasswordDto>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ChangePassword_ShouldReturnBadRequest_WhenCurrentPasswordIsIncorrect()
    {
        // Arrange
        var changePasswordRequest = new ChangePasswordDto
        {
            CurrentPassword = "wrongpassword",
            NewPassword = "newpassword123"
        };

        _mockUserService.Setup(x => x.ChangePasswordAsync(_testUserId, changePasswordRequest, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.ChangePassword(changePasswordRequest);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult!.Value.Should().BeEquivalentTo(new { message = "Current password is incorrect" });
    }

    [Fact]
    public async Task ChangePassword_ShouldReturnNotFound_WhenUserDoesNotExist()
    {
        // Arrange
        var changePasswordRequest = new ChangePasswordDto
        {
            CurrentPassword = "oldpassword",
            NewPassword = "newpassword123"
        };

        _mockUserService.Setup(x => x.ChangePasswordAsync(_testUserId, changePasswordRequest, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("User not found"));

        // Act
        var result = await _controller.ChangePassword(changePasswordRequest);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult!.Value.Should().Be("User not found");
    }

    [Fact]
    public async Task ChangePassword_ShouldReturnInternalServerError_WhenExceptionOccurs()
    {
        // Arrange
        var changePasswordRequest = new ChangePasswordDto
        {
            CurrentPassword = "oldpassword",
            NewPassword = "newpassword123"
        };

        _mockUserService.Setup(x => x.ChangePasswordAsync(_testUserId, changePasswordRequest, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.ChangePassword(changePasswordRequest);

        // Assert
        result.Should().BeOfType<ObjectResult>();
        var objectResult = result as ObjectResult;
        objectResult!.StatusCode.Should().Be(500);
        objectResult.Value.Should().Be("An error occurred while changing the password");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task ChangePassword_ShouldReturnBadRequest_WhenCurrentPasswordIsNullOrEmpty(string currentPassword)
    {
        // Arrange
        var changePasswordRequest = new ChangePasswordDto
        {
            CurrentPassword = currentPassword,
            NewPassword = "newpassword123"
        };

        _controller.ModelState.AddModelError("CurrentPassword", "Current password is required");

        // Act
        var result = await _controller.ChangePassword(changePasswordRequest);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    [InlineData("123")]
    [InlineData("1234567")]
    public async Task ChangePassword_ShouldReturnBadRequest_WhenNewPasswordIsInvalid(string newPassword)
    {
        // Arrange
        var changePasswordRequest = new ChangePasswordDto
        {
            CurrentPassword = "oldpassword",
            NewPassword = newPassword
        };

        _controller.ModelState.AddModelError("NewPassword", "New password must be at least 8 characters long");

        // Act
        var result = await _controller.ChangePassword(changePasswordRequest);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }
}