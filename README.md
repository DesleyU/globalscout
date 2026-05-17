# GlobalScout - Football Networking Platform

A comprehensive networking platform connecting football players, clubs, scouts, and agents worldwide.

## 🚀 Features

- **User Authentication**: Secure JWT-based authentication with role-based access control
- **Profile Management**: Detailed profiles for players, clubs, scouts, and agents
- **Connection System**: Send and manage connection requests between users
- **Advanced Search**: Filter users by role, position, club, location, and age
- **Admin Dashboard**: Comprehensive user management and system statistics
- **Responsive Design**: Modern, mobile-first UI built with Tailwind CSS
- **Real-time Updates**: Live notifications and updates using React Query

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Server state management and caching
- **Axios** - HTTP client for API requests
- **Lucide React** - Beautiful icon library
- **React Hot Toast** - Toast notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Prisma** - Modern database toolkit and ORM
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API rate limiting protection
- **Swagger** - API documentation

## 📁 Project Structure

```
globalscout/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   └── server.js        # Main server file
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.js          # Database seeding
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── public/              # Static assets
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd globalscout
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

   Create a `.env` file in the backend directory:
   ```env
   # Database
   DATABASE_URL="your-supabase-database-url"
   DIRECT_URL="your-supabase-direct-url"

   # Supabase
   SUPABASE_URL="your-supabase-url"
   SUPABASE_ANON_KEY="your-supabase-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

   # JWT
   JWT_SECRET="your-jwt-secret-key"
   JWT_EXPIRES_IN="7d"

   # Server
   PORT=5000
   NODE_ENV="development"
   ```

3. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Push schema to database
   npx prisma db push

   # (Optional) Seed the database
   npm run seed
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

   Create a `.env` file in the frontend directory when you need to override the API host:
   ```env
   # Local .NET API default
   VITE_API_BASE_URL=http://localhost:5288/api

   # Production
   # VITE_API_BASE_URL=https://api.globalscout.eu/api
   ```

   Frontend API requests are built from `VITE_API_BASE_URL`, so production login posts to `https://api.globalscout.eu/api/auth/login`.

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The API will be available at `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

## 📚 API Documentation

Once the backend is running, you can access the Swagger API documentation at:
`http://localhost:5000/api-docs`

## 🔐 User Roles

- **Player**: Individual football players looking to connect with clubs and scouts
- **Club**: Football clubs seeking players and connecting with agents
- **Scout/Agent**: Talent scouts and agents representing players
- **Admin**: Platform administrators with user management capabilities

## 🎯 Key Features

### Authentication
- Secure registration and login
- Role-based access control
- JWT token management
- Password encryption

### Profile Management
- Comprehensive user profiles
- Role-specific information fields
- Profile picture support (planned)
- Bio and professional information

### Connection System
- Send connection requests
- Accept/reject requests
- Manage existing connections
- View connection history

### Search & Discovery
- Advanced filtering options
- Search by multiple criteria
- User recommendations
- Location-based search

### Admin Features
- User management dashboard
- System statistics
- User status management
- Content moderation tools

## 🔮 Future Enhancements

- **Video Uploads**: Player highlight reels and skill videos
- **Statistics Integration**: Performance metrics and analytics
- **Messaging System**: Direct messaging between connected users
- **Event Management**: Tournament and match organization
- **Mobile App**: Native iOS and Android applications
- **Advanced Analytics**: AI-powered player recommendations
- **Payment Integration**: Premium features and subscriptions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@globalscout.com or join our Slack channel.

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape this platform
- Special thanks to the football community for inspiration and feedback
- Built with love for the beautiful game ⚽

---

**GlobalScout** - Connecting the football world, one player at a time.