using System;
using System.Collections.Generic;

namespace GarageInventory.Domain.Entities;

public class Category : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Color { get; set; } // Hex color for UI
    public string? Icon { get; set; } // Icon identifier for UI
    public Guid UserId { get; set; }
    public Guid? ParentCategoryId { get; set; }
    
    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Category? ParentCategory { get; set; }
    public virtual ICollection<Category> ChildCategories { get; set; } = new List<Category>();
    public virtual ICollection<InventoryItem> InventoryItems { get; set; } = new List<InventoryItem>();
    
    public string FullPath => ParentCategory != null ? $"{ParentCategory.FullPath} > {Name}" : Name;
}