using System;
using System.Threading;
using System.Threading.Tasks;
using GarageInventory.Application.DTOs;

namespace GarageInventory.Application.Interfaces;

public interface IUserService
{
    Task<UserDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserDto?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<UserDto?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<UserDto> CreateAsync(CreateUserDto createUserDto, CancellationToken cancellationToken = default);
    Task<UserDto> UpdateAsync(Guid id, UpdateUserDto updateUserDto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> ChangePasswordAsync(Guid id, ChangePasswordDto changePasswordDto, CancellationToken cancellationToken = default);
}