# Feature: Basic Item Search

## Context

- Business goal: Allow users to quickly find inventory items by name, brand, or category
- Constraints: Must work with existing Angular frontend and .NET API
- Relevant Cursor Rules: Follow Onion Architecture, use standalone components

## Requirements

- User stories:
  - As a user, I want to search for items by typing in a search box
  - As a user, I want to see search results update in real-time
  - As a user, I want to filter results by category

- API endpoints:
  - GET /api/items/search?query={term}&category={id}
  - Response: List of matching InventoryItem DTOs

- UI components:
  - Search input component with debounced input
  - Search results list component
  - Category filter dropdown

## Done/Acceptance

- Back-end tests (dotnet): Unit tests for search service, integration tests for API endpoint
- Front-end tests (Angular): Component tests for search components, service tests for search service
- Edge cases: Empty results, special characters, very long queries

## Notes

- Risky/human-only tasks: None - this is a good AI-ready feature
