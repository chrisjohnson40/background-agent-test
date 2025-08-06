using System;
using System.Collections.Generic;

namespace GarageInventory.Domain.Entities;

public class Location : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public LocationType Type { get; set; }
    public Guid UserId { get; set; }
    public Guid? ParentLocationId { get; set; }
    
    // Physical properties
    public string? Address { get; set; }
    public int? ShelfNumber { get; set; }
    public string? Section { get; set; }
    public string? Notes { get; set; }
    
    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Location? ParentLocation { get; set; }
    public virtual ICollection<Location> ChildLocations { get; set; } = new List<Location>();
    public virtual ICollection<InventoryItem> InventoryItems { get; set; } = new List<InventoryItem>();
    
    public string FullPath => ParentLocation != null ? $"{ParentLocation.FullPath} > {Name}" : Name;
}

public enum LocationType
{
    Garage = 1,
    Workbench = 2,
    StorageTote = 3,
    Cabinet = 4,
    Shelf = 5,
    ExternalStorage = 6,
    Room = 7,
    Other = 99
}