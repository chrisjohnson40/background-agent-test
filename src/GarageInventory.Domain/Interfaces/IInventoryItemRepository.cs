using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using GarageInventory.Domain.Entities;

namespace GarageInventory.Domain.Interfaces;

public interface IInventoryItemRepository : IRepository<InventoryItem>
{
    Task<IEnumerable<InventoryItem>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IEnumerable<InventoryItem>> GetByLocationIdAsync(Guid locationId, CancellationToken cancellationToken = default);
    Task<IEnumerable<InventoryItem>> GetByCategoryIdAsync(Guid categoryId, CancellationToken cancellationToken = default);
    Task<IEnumerable<InventoryItem>> SearchAsync(string searchTerm, Guid userId, CancellationToken cancellationToken = default);
    Task<IEnumerable<InventoryItem>> GetByTagAsync(string tag, Guid userId, CancellationToken cancellationToken = default);
    Task<InventoryItem?> GetByBarcodeAsync(string barcode, Guid userId, CancellationToken cancellationToken = default);
}