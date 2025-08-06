# Garage Inventory Management System

A modern, full-stack inventory management system built with Angular and .NET, designed for managing garage/workshop inventory across multiple locations. This project serves as a test implementation for Cursor's background agents and demonstrates best practices for AI-assisted development.

## 🏗️ Architecture

This project follows **Onion Architecture** principles with clear separation of concerns:

### Backend (.NET 9)
- **Domain Layer**: Core business entities and interfaces
- **Application Layer**: Use cases, DTOs, and application services
- **Infrastructure Layer**: Data access, external services, and repositories
- **Presentation Layer**: API controllers and middleware

### Frontend (Angular 20)
- **Zoneless Architecture**: Latest Angular features without zone.js
- **Server-Side Rendering**: Enhanced performance and SEO
- **Standalone Components**: Modern Angular component architecture
- **Angular Material**: Consistent UI components

### Database
- **PostgreSQL**: Primary database with proper normalization
- **Entity Framework Core**: Code-first approach with migrations
- **Soft Deletes**: Audit trail support

## 🚀 Features

### Core Inventory Management
- **Multi-location Support**: Garage, workbench, storage totes, cabinets, shelves, external storage
- **Hierarchical Locations**: Nested location structure (e.g., Garage > Workbench > Drawer 1)
- **Item Categorization**: Flexible category system with hierarchy
- **Rich Item Details**: Brand, model, serial number, condition, purchase info
- **Image Support**: Multiple images per item with primary image selection
- **Movement Tracking**: Complete audit trail of item movements
- **Search & Filter**: Advanced search capabilities with tags and categories

### Authentication & Security
- **JWT Authentication**: Simple token-based auth with future OAuth2/OIDC support
- **Role-based Authorization**: Extensible user role system
- **Password Hashing**: Secure BCrypt password hashing
- **HTTPS Everywhere**: Production-ready security

## 🛠️ Technology Stack

### Backend
- **.NET 9**: Latest .NET framework
- **ASP.NET Core**: Web API framework
- **Entity Framework Core**: ORM with PostgreSQL provider
- **MediatR**: CQRS pattern implementation
- **AutoMapper**: Object-to-object mapping
- **FluentValidation**: Input validation
- **JWT Bearer**: Authentication tokens
- **BCrypt.Net**: Password hashing

### Frontend
- **Angular 20**: Latest Angular with zoneless architecture
- **Angular Material**: UI component library
- **TypeScript**: Type-safe JavaScript
- **SCSS**: Enhanced CSS with variables and mixins
- **RxJS**: Reactive programming

### Infrastructure
- **Docker**: Containerized development and deployment
- **PostgreSQL**: Relational database
- **Redis**: Caching layer (optional)
- **Nginx**: Reverse proxy and static file serving

## 🏃‍♂️ Getting Started

### Prerequisites
- **Node.js 22+**: For Angular development
- **Docker & Docker Compose**: For containerized development
- **.NET 9 SDK**: For local API development (optional with Docker)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd background-agent-test
   ```

2. **Start the development environment**
   ```bash
   docker-compose up -d
   ```

3. **Access the applications**
   - Frontend: http://localhost:4200
   - API: http://localhost:5000
   - API Documentation: http://localhost:5000/swagger

### Local Development Setup

#### Backend (.NET API)
```bash
cd src
dotnet restore
dotnet build
dotnet run --project GarageInventory.API
```

#### Frontend (Angular)
```bash
cd frontend
npm install
ng serve
```

#### Database
```bash
# Using Docker
docker run --name garage-db -e POSTGRES_PASSWORD=garage_password -e POSTGRES_USER=garage_user -e POSTGRES_DB=garage_inventory -p 5432:5432 -d postgres:15-alpine

# Or use the docker-compose setup
docker-compose up postgres
```

## 🤖 Background Agents & AI Development

This project is specifically designed to demonstrate effective use of Cursor's background agents. Here's how to leverage them:

### Background Agent Capabilities
- **Autonomous Development**: Agents can work on specific features independently
- **Code Reviews**: Automated code quality checks and suggestions
- **Documentation**: Auto-generation of documentation and comments
- **Testing**: Automated test creation and maintenance
- **Refactoring**: Code optimization and pattern improvements

### Best Practices for AI-Assisted Development

#### Task Assignment
When working with background agents, assign **specific, well-defined tasks**:

✅ **Good Task Examples:**
- "Implement user authentication with JWT tokens"
- "Create inventory item CRUD operations with validation"
- "Add image upload functionality for inventory items"
- "Implement location hierarchy with drag-and-drop reordering"

❌ **Poor Task Examples:**
- "Make the app better"
- "Fix all bugs"
- "Add some features"

#### Agent Collaboration
- **Clear Interfaces**: Define clear contracts between components
- **Integration Tests**: Ensure different agents' work integrates properly
- **Consistent Patterns**: Follow established architectural patterns
- **Documentation**: Maintain up-to-date documentation for cross-agent understanding

### Project Structure for Agents

```
/src                          # .NET Backend
  /GarageInventory.Domain     # → Agent: Domain Modeling
  /GarageInventory.Application # → Agent: Business Logic
  /GarageInventory.Infrastructure # → Agent: Data & External Services
  /GarageInventory.API        # → Agent: API Development
  /GarageInventory.Tests      # → Agent: Testing & QA

/frontend                     # Angular Frontend
  /src/app
    /auth                     # → Agent: Authentication
    /inventory                # → Agent: Inventory Management
    /locations                # → Agent: Location Management
    /shared                   # → Agent: Shared Components
    /core                     # → Agent: Core Services

/docker                       # → Agent: DevOps & Infrastructure
```

## 📁 Project Structure

```
background-agent-test/
├── src/                                    # .NET Backend
│   ├── GarageInventory.Domain/            # Domain entities and interfaces
│   ├── GarageInventory.Application/       # Application services and DTOs
│   ├── GarageInventory.Infrastructure/    # Data access and external services
│   ├── GarageInventory.API/              # Web API controllers
│   └── GarageInventory.Tests/            # Unit and integration tests
├── frontend/                              # Angular Frontend
│   ├── src/app/
│   │   ├── auth/                         # Authentication components
│   │   ├── inventory/                    # Inventory management
│   │   ├── locations/                    # Location management
│   │   ├── layout/                       # Layout components
│   │   ├── core/                         # Core services and guards
│   │   └── shared/                       # Shared components
│   ├── Dockerfile                        # Production Docker image
│   └── Dockerfile.dev                    # Development Docker image
├── database/                              # Database initialization
├── docker-compose.yml                     # Development environment
├── .cursorrules                          # AI development guidelines
└── README.md                             # This file
```

## 🧪 Testing Strategy

### Backend Testing
- **Unit Tests**: Domain logic and application services
- **Integration Tests**: API endpoints and database operations
- **Test Coverage**: Minimum 80% for business logic

### Frontend Testing
- **Unit Tests**: Components and services
- **Integration Tests**: Component interactions
- **E2E Tests**: Critical user workflows

## 🚀 Deployment

### Development
```bash
docker-compose up
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 API Documentation

The API is documented using OpenAPI/Swagger. Once the application is running, visit:
- Development: http://localhost:5000/swagger
- Production: https://your-domain.com/swagger

## 🤝 Contributing

This project demonstrates best practices for AI-assisted development. When contributing:

1. **Follow the .cursorrules**: Established patterns for AI development
2. **Write Clear Commits**: Use conventional commit format
3. **Include Tests**: Maintain test coverage
4. **Update Documentation**: Keep documentation current
5. **Use Background Agents**: Leverage AI for routine tasks

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Cursor AI and background agents
- Demonstrates modern .NET and Angular development practices
- Showcases effective human-AI collaboration in software development