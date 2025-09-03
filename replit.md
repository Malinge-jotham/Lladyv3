# Eldady - Social Marketplace Platform

## Overview

Eldady is a social marketplace platform that combines e-commerce functionality with social media features. Users can create "vrooms" (personal product galleries), share products, interact through likes and comments, and engage in real-time messaging. The platform facilitates product discovery, social commerce, and community building around shared interests in products and brands.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development tooling
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom design system using warm neutral colors and terracotta/coral accents
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **File Uploads**: Uppy with AWS S3 integration for file management and uploads

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect for user authentication
- **Session Management**: Express sessions with PostgreSQL store for persistent user sessions
- **Real-time Communication**: WebSocket integration for live messaging features

### Database Design
The schema includes core entities for:
- **Users**: Authentication and profile management
- **Products**: Core marketplace items with pricing, descriptions, and image galleries
- **Vrooms**: User-created product galleries/collections
- **Social Features**: Likes, comments, shares, and follows for community engagement
- **Commerce**: Cart items and order management
- **Messaging**: Real-time communication between users

### File Storage & Media Management
- **Object Storage**: Google Cloud Storage integration with custom ACL (Access Control List) system
- **Upload Flow**: Direct-to-cloud uploads using presigned URLs for performance
- **Access Control**: Custom permission system supporting group-based access (USER_LIST, EMAIL_DOMAIN, GROUP_MEMBER, SUBSCRIBER)
- **Image Handling**: Support for multiple image URLs per product for gallery functionality

### Development & Build Tools
- **Build System**: Vite for frontend bundling with esbuild for server-side compilation
- **Development**: Hot module replacement and runtime error overlay for development experience
- **Database Migrations**: Drizzle Kit for schema management and migrations
- **TypeScript**: Full type safety across frontend, backend, and shared schemas

## External Dependencies

### Cloud Services
- **Neon Database**: Serverless PostgreSQL hosting for scalable database operations
- **Google Cloud Storage**: Object storage for media files and user uploads
- **Replit Authentication**: Managed authentication service with OpenID Connect

### Third-party Libraries
- **@uppy/core, @uppy/dashboard, @uppy/aws-s3**: File upload management with cloud storage integration
- **@tanstack/react-query**: Server state management and data fetching
- **@radix-ui/***: Accessible UI component primitives
- **drizzle-orm**: Type-safe database ORM with PostgreSQL support
- **wouter**: Lightweight React routing
- **ws**: WebSocket implementation for real-time features

### Development Tools
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **@replit/vite-plugin-cartographer**: Replit-specific development tooling
- **tailwindcss**: Utility-first CSS framework
- **typescript**: Static type checking