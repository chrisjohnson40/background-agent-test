using System;

namespace GarageInventory.Domain.Entities;

public class ItemImage : BaseEntity
{
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? AltText { get; set; }
    public bool IsPrimary { get; set; } = false;
    public int DisplayOrder { get; set; } = 0;
    
    // Image metadata
    public int? Width { get; set; }
    public int? Height { get; set; }
    
    // Relationships
    public Guid InventoryItemId { get; set; }
    public virtual InventoryItem InventoryItem { get; set; } = null!;
}