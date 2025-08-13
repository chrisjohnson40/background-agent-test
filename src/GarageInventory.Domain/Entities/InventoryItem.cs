using System;
using System.Collections.Generic;

namespace GarageInventory.Domain.Entities;

public class InventoryItem : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public string? Barcode { get; set; }
    
    // Quantity and condition
    public int Quantity { get; set; } = 1;
    public ItemCondition Condition { get; set; } = ItemCondition.Good;
    public string? ConditionNotes { get; set; }
    
    // Financial
    public decimal? PurchasePrice { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public decimal? EstimatedValue { get; set; }
    
    // Organization
    public Guid UserId { get; set; }
    public Guid LocationId { get; set; }
    public Guid? CategoryId { get; set; }
    public string? Tags { get; set; } // Comma-separated tags
    public string? Notes { get; set; }
    
    // Physical properties
    public string? Dimensions { get; set; }
    public decimal? Weight { get; set; }
    public string? Color { get; set; }
    
    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Location Location { get; set; } = null!;
    public virtual Category? Category { get; set; }
    public virtual ICollection<ItemImage> Images { get; set; } = new List<ItemImage>();
    public virtual ICollection<ItemMovement> MovementHistory { get; set; } = new List<ItemMovement>();
    
    public string[] TagList => string.IsNullOrWhiteSpace(Tags) 
        ? Array.Empty<string>() 
        : Tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}

public enum ItemCondition
{
    Excellent = 1,
    VeryGood = 2,
    Good = 3,
    Fair = 4,
    Poor = 5,
    BrokenNeedsRepair = 6,
    ForParts = 7
}