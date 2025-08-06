using System;
using System.Threading;
using System.Threading.Tasks;

namespace GarageInventory.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    IRepository<Location> Locations { get; }
    IRepository<Category> Categories { get; }
    IInventoryItemRepository InventoryItems { get; }
    IRepository<ItemImage> ItemImages { get; }
    IRepository<ItemMovement> ItemMovements { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}