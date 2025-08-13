using System;
using System.Collections.Generic;
using GarageInventory.Domain.Entities;

namespace GarageInventory.Application.DTOs;

public class LocationDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public LocationType Type { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public Guid? ParentLocationId { get; set; }
    public string? ParentLocationName { get; set; }
    public string FullPath { get; set; } = string.Empty;
    public string? Address { get; set; }
    public int? ShelfNumber { get; set; }
    public string? Section { get; set; }
    public string? Notes { get; set; }
    public int ItemCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateLocationDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public LocationType Type { get; set; }
    public Guid? ParentLocationId { get; set; }
    public string? Address { get; set; }
    public int? ShelfNumber { get; set; }
    public string? Section { get; set; }
    public string? Notes { get; set; }
}

public class UpdateLocationDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public LocationType? Type { get; set; }
    public Guid? ParentLocationId { get; set; }
    public string? Address { get; set; }
    public int? ShelfNumber { get; set; }
    public string? Section { get; set; }
    public string? Notes { get; set; }
}

public class LocationTreeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public LocationType Type { get; set; }
    public int ItemCount { get; set; }
    public List<LocationTreeDto> Children { get; set; } = new();
}