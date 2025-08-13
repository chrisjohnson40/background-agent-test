using System;

namespace GarageInventory.Domain.Entities;

public class ItemMovement : BaseEntity
{
    public Guid InventoryItemId { get; set; }
    public Guid FromLocationId { get; set; }
    public Guid ToLocationId { get; set; }
    public Guid MovedByUserId { get; set; }
    public DateTime MovedAt { get; set; } = DateTime.UtcNow;
    public string? Reason { get; set; }
    public string? Notes { get; set; }
    
    // Quantity moved (for partial moves)
    public int QuantityMoved { get; set; } = 1;
    
    // Navigation properties
    public virtual InventoryItem InventoryItem { get; set; } = null!;
    public virtual Location FromLocation { get; set; } = null!;
    public virtual Location ToLocation { get; set; } = null!;
    public virtual User MovedByUser { get; set; } = null!;
}