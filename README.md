# BD TicketPro 🛫

একটি সম্পূর্ণ ও আধুনিক **Travel Agency Management System** যা বিশেষভাবে বাংলাদেশী ট্রাভেল এজেন্সির জন্য ডিজাইন করা হয়েছে। আন্তর্জাতিক ফ্লাইট টিকেট (বিশেষত মধ্যপ্রাচ্যের দেশগুলির) ক্রয়, বিক্রয়, বুকিং এবং ম্যানেজমেন্টের জন্য।

## ✨ Features

### 🔐 **রোল-বেসড অ্যাক্সেস কন্ট্রোল**

- **Admin**: সম্পূর্ণ অ্য���ক্সেস (টিকেট ক্রয়, বিক্রয়, প্রফিট দেখা, ব্যাচ এডিট/ডিলিট)
- **Manager**: টিকেট দেখা ও বুকিং, সেল কনফার্ম (ক্রয় মূল্য দেখতে পারে না)
- **Staff**: শুধু বুকিং তৈরি, আংশিক পেমেন্ট (ক্রয় মূল্য বা ওভাররাইড নেই)

### 📊 **ড্যাশবোর্ড ও এনালিটিক্স**

- আজকের বিক্রয় পরিসংখ্যান
- মোট বুকিং ও লকড টিকেট
- ইনভেন্টরি ম্যানেজমেন্ট
- অনুমানিত লাভ (শুধু অ্যাডমিন)
- রিয়েল-টাইম ড্যাটা আপডেট

### 🌍 **কান্ট্রি ম্যানেজমেন্ট**

- দেশভিত্তিক টিকেট গ্রুপিং
- টিকেট উপলব্ধতার ইন্ডিকেটর
- ইন্টারঅ্যাক্টিভ কান্ট্রি কার্ড
- মধ্যপ্রাচ্যের প্রধান দেশগুলির সাপোর্ট

### 🎫 **টিকেট ম্যানেজমেন্ট**

- ব্যাচভিত্তিক টিকেট ক্রয়
- ইনভেন্টরি ট্র্যাকিং
- স্ট্যাটাস ম্যানেজমেন্ট (Available, Locked, Sold)
- উন্নত ফিল্টারিং ও সার্চ

### 💳 **বুকিং সিস্টেম**

- 4-স্টেপ বুকিং প্রসেস
- ফুল/পার্শিয়াল পেমেন্ট অপশন
- অটো লক সিস্টেম (24 ঘন্টা)
- পেমেন্ট মেথড সাপোর্ট

### 🛒 **অ্যাডমিন ক্রয় মডিউল**

- এজেন্ট ইনফর্মেশন ম্যানেজমেন্ট
- ইনভয়েস আপলোড
- প্রফিট ক্যালকুলেশন
- পারচেজ হিস্ট্রি ট্র্যাকিং

### ⚙️ **সিস্টেম সেটিংস**

- কোম্পানি ইনফর্মেশন
- ইউজার ম্যানেজমেন্ট
- নোটিফিকেশন সেটিংস
- ব্যাকআপ ও এক্সপোর্ট

## 🚀 Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS 3** for styling
- **Framer Motion** for animations
- **Radix UI** components
- **React Router 6** for navigation
- **Tanstack Query** for data fetching

### Backend

- **Node.js** with Express
- **SQLite** database with Better-SQLite3
- **JWT** authentication
- **Zod** for validation
- **bcryptjs** for password hashing

### Development

- **TypeScript** throughout
- **ESLint** & **Prettier**
- **Vitest** for testing
- Hot reload for development

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd bd-ticketpro

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Default Login Credentials

```
Admin:   admin / admin123
Manager: manager / manager123
Staff:   staff / staff123
```

## 🏗️ Project Structure

```
bd-ticketpro/
├── client/                 # React frontend
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── context/           # React Context providers
│   ├── services/          # API service layer
│   └── global.css         # Global styles
│
├── server/                # Express backend
│   ├── database/          # Database schema & models
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   └── index.ts           # Main server file
│
├── shared/                # Shared types & interfaces
│   └── api.ts             # API type definitions
│
└── dist/                  # Production build output
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Server
NODE_ENV=production
PORT=8080
JWT_SECRET=your-super-secret-key

# Database
DATABASE_URL=./bd-ticketpro.db

# CORS
ALLOWED_ORIGINS=https://your-domain.com

# Features
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_AUTO_BACKUP=true
```

### Database Setup

The application uses SQLite with automatic initialization:

```bash
# Database will be created automatically on first run
# Sample data is seeded automatically
# Database file: bd-ticketpro.db
```

## 🚀 Production Deployment

### Build for Production

```bash
# Build both client and server
npm run build

# Start production server
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080
CMD ["npm", "start"]
```

### Environment Setup

```bash
# Create production environment file
cp .env.example .env.production

# Update with production values
NODE_ENV=production
JWT_SECRET=your-production-secret
ALLOWED_ORIGINS=https://your-domain.com
```

## 📝 API Documentation

### Authentication

```bash
# Login
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}

# Get current user
GET /api/auth/me
Authorization: Bearer <token>
```

### Tickets

```bash
# Get all tickets
GET /api/tickets?country=KSA&status=available

# Get tickets by country
GET /api/tickets/country/KSA

# Update ticket status
PATCH /api/tickets/:id/status
{
  "status": "sold"
}
```

### Bookings

```bash
# Create booking
POST /api/bookings
{
  "ticketId": "ticket-id",
  "agentInfo": { "name": "Agent Name" },
  "passengerInfo": { "name": "Passenger", "passportNo": "123456" },
  "paymentType": "full"
}

# Update booking status
PATCH /api/bookings/:id/status
{
  "status": "confirmed"
}
```

## 🔐 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- CORS protection
- Input validation with Zod
- SQL injection prevention
- Activity logging

## 📊 Database Schema

### Core Tables

- `users` - User accounts and roles
- `countries` - Destination countries
- `airlines` - Airline information
- `ticket_batches` - Bulk ticket purchases
- `tickets` - Individual tickets
- `bookings` - Customer bookings
- `system_settings` - Application configuration
- `activity_logs` - Audit trail

## 🔄 Backup & Recovery

### Automatic Backups

```bash
# Enable auto-backup in .env
ENABLE_AUTO_BACKUP=true
BACKUP_INTERVAL=24h
BACKUP_RETENTION=30d
```

### Manual Backup

```bash
# Export data
GET /api/settings/export/data?format=csv

# Database file backup
cp bd-ticketpro.db backup-$(date +%Y%m%d).db
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Permission Error**

   ```bash
   chmod 755 ./
   chmod 666 bd-ticketpro.db
   ```

2. **Port Already in Use**

   ```bash
   export PORT=3001
   npm run dev
   ```

3. **Build Errors**
   ```bash
   rm -rf node_modules
   npm install
   npm run build
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Email: support@bdticketpro.com
- Documentation: [docs.bdticketpro.com](https://docs.bdticketpro.com)

---

**BD TicketPro** - মধ্যপ্রাচ্যের ফ্লাইট টিকেট ব্যবসার জন্য সম্পূর্ণ সমাধান ✈️
#   m u s a f i r d e s k t r i a l  
 