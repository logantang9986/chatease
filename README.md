# ChatEase - Cross-Platform IM System

## Introduction
**ChatEase** is a modern, full-stack Instant Messaging (IM) solution designed for seamless communication across multiple platforms. It features a high-performance **Spring Boot** backend and a versatile **React** frontend that supports Web, Desktop (Windows/macOS/Linux), and an Admin Dashboard.

---

## Tech Stack

### Backend
- **Framework**: Spring Boot 3.5.6 with JDK 17.
- **Persistence**: MySQL 8.0 and Spring Data JPA.
- **Real-time**: Spring WebSocket for instant messaging.
- **Security**: JWT (JSON Web Token) and jBCrypt for authentication and password encryption.
- **Cache/Rate Limiting**: Redis for managing email verification codes and user blacklists.

### Frontend
- **Core**: React 18, TypeScript, and Vite for high-performance builds.
- **Desktop**: Electron for cross-platform application packaging.
- **State**: Zustand for lightweight and scalable state management.
- **Styling**: Tailwind CSS, Lucide React icons, and Sonner for toast notifications.
- **Network**: Axios for REST APIs and Native WebSocket for real-time duplex communication.

---

## Quick Start

### Prerequisites
- **Node.js**: v16+.
- **Java**: JDK 17.
- **Databases**: MySQL 8.0+ and Redis.

### 1. Backend Setup
1. Create a database named `chatease` in MySQL.
2. Import the SQL scripts found in the backend `resources` directory.
3. Configure `application.yml` with your database credentials, Redis settings, and mail server details.
4. Run the application using your IDE or `mvn spring-boot:run`.

### 2. Frontend Setup
Install dependencies for both the user client and the admin dashboard:

```bash
# Install Client dependencies
cd client && npm install

# Install Admin dependencies
cd ../admin && npm install

### 3. Configuration
Ensure the frontend points to your backend service (Default: `http://localhost:8080`) by modifying the `BASE_URL` in:

- `client/src/api/axios.ts`
- `admin/src/services/api.ts` (if applicable)

---

##  Running the Project

### User Client
- **Web Mode**: `cd client && npm run dev`
- **Desktop Mode**: `cd client && npm run electron:dev`

### Admin Dashboard
- **Run**: `cd admin && npm run dev`

---

## Building

### Backend
- Build the executable JAR: `mvn clean package`

### Frontend
- **Web Build**: `npm run build` in the respective directory.
- **Desktop Package**: `cd client && npm run electron:build` to generate installers in the `release` directory.

---