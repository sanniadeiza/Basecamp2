# MyBaseCamp

A web-based project management tool mimicking Basecamp features.

## Features
- **User Registration & Authentication**: Secure JWT-based auth.
- **Admin Roles**: Special permissions for thread management.
- **Project Management**: Dashboard for tracking team efforts.
- **Discussions (Threads)**: Dedicated spaces for admin-led topics.
- **Messaging**: Interaction for all project members.
- **Attachments**: Support for PNG, JPG, PDF, and TXT with format enforcement.

## High-End Aesthetics
- **Dark Mode**: Sleek slate-colored theme.
- **Glassmorphism**: Modern backdrop filters and translucent borders.
- **Micro-animations**: Smooth transitions for a premium feel.

## Technical Setup
1. **Server**:
   ```bash
   cd server
   npm install
   npx prisma generate
   node index.js
   ```
2. **Client**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Cloud Hosting
This project is deployment-ready for an **AWS EC2** instance (or any standard Linux VPS).
- The frontend is built and served via Nginx.
- The backend runs on Node.js using PM2, with SQLite for persistent local storage.
