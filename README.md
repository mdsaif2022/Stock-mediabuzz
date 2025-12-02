# Stock Media Platform

A comprehensive full-stack stock media platform built with React, TypeScript, Express, and Tailwind CSS. This platform allows users to browse, preview, and download free media files (videos, images, audio, templates, and APKs) while providing administrators with powerful tools to manage content, users, and monetization through integrated ad networks.

## 🚀 Features

### User Features
- **Media Browsing & Discovery**
  - Browse media by category (Video, Image, Audio, Template, APK)
  - Advanced search and filtering
  - Trending media section
  - Category-based browsing
  - Related media recommendations

- **Media Preview & Interaction**
  - Video hover preview with auto-play on hover
  - Video thumbnail generation and display
  - Custom video player with seek controls (single click: ±10s, double-click: ±30s)
  - Audio player with waveform visualization
  - Image gallery with lightbox
  - Fullscreen video support
  - Lazy loading for optimized performance

- **Download System**
  - One-click downloads with Adsteera ad integration
  - Download tracking and history
  - Server-side download proxy for CORS-safe file delivery
  - Support for multiple cloud storage providers (Cloudinary)

- **User Account**
  - User registration and authentication
  - User dashboard
  - Profile management
  - Download history
  - Favorite media collection

- **Creator Features**
  - Creator dashboard
  - Storage management
  - Upload tracking
  - Creator application system

### Admin Features
- **Media Management**
  - Upload media via file upload or URL
  - Edit and delete media
  - Bulk operations
  - Cloudinary account management (4 accounts with usage tracking)
  - APK-specific features (icon upload, feature screenshots)
  - Media categorization and tagging

- **User Management**
  - View all registered users
  - User status management (active, pending, banned)
  - User activity tracking
  - Download statistics per user

- **Analytics Dashboard**
  - Download trends and statistics
  - User growth metrics
  - Media type distribution
  - Top downloads and users
  - Ad performance metrics

- **Ad Management**
  - Adsteera integration with 20+ ad links
  - Header ad slider with rotation
  - Download page ad integration
  - Custom ad management system
  - Ad performance tracking

- **Settings**
  - Payment settings (bKash integration)
  - Branding customization (favicon)
  - General settings (maintenance mode)
  - Platform configuration

### Technical Features
- **Modern SPA Architecture**
  - React 18 with React Router 6
  - TypeScript for type safety
  - Vite for fast development and building
  - Single-page application with client-side routing

- **UI/UX**
  - Fully responsive design (mobile, tablet, desktop)
  - Dark mode support
  - Radix UI component library
  - Tailwind CSS for styling
  - Lucide React icons
  - Smooth animations and transitions

- **Backend**
  - Express.js server
  - Integrated with Vite dev server (single port)
  - RESTful API architecture
  - JSON-based data storage (can be migrated to database)
  - File upload handling with Multer
  - Cloudinary integration for media storage

- **Developer Experience**
  - Hot module replacement (HMR)
  - TypeScript throughout
  - Shared types between client and server
  - Comprehensive error handling
  - Error boundaries

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18
- **Routing**: React Router 6
- **Language**: TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5
- **File Upload**: Multer
- **Cloud Storage**: Cloudinary
- **Validation**: Zod

### Development Tools
- **Package Manager**: PNPM
- **Testing**: Vitest
- **Code Formatting**: Prettier
- **Type Checking**: TypeScript

## 📁 Project Structure

```
Stock-Media/
├── client/                 # React SPA frontend
│   ├── components/        # Reusable components
│   │   ├── ui/           # UI component library (Radix UI)
│   │   ├── media/         # Media-specific components
│   │   └── ...           # Layout, Header, Footer, etc.
│   ├── pages/            # Route pages
│   │   ├── admin/        # Admin dashboard pages
│   │   └── ...          # User-facing pages
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and API helpers
│   ├── contexts/         # React contexts (Auth)
│   └── services/         # External service integrations
│
├── server/                # Express API backend
│   ├── routes/           # API route handlers
│   ├── data/            # JSON database files
│   └── config/          # Configuration files
│
├── shared/               # Shared TypeScript types
│   └── api.ts           # API interfaces
│
└── public/              # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PNPM (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Stock-Media
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   **For Development** - Create a `.env` file in the root directory:
   ```env
   # Cloudinary Configuration (optional - for media uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Firebase (optional - for authentication)
   FIREBASE_API_KEY=your_firebase_key
   FIREBASE_AUTH_DOMAIN=your_auth_domain
   FIREBASE_PROJECT_ID=your_project_id
   
   # API Base URL (for production)
   API_BASE_URL=your_api_url
   ```
   
   **For Production Build** - Create a `.env.production` file:
   ```env
   VITE_API_BASE_URL=https://your-backend.onrender.com
   VITE_ADMIN_EMAIL=admin@yourdomain.com
   ```
   
   See `ENVIRONMENT_VARIABLES.md` for complete environment variable documentation.

4. **Start development server**
   ```bash
   pnpm dev
   ```
   The app will be available at `http://localhost:8080`

### Available Scripts

```bash
pnpm dev              # Start development server (client + server)
pnpm build            # Production build (client + server)
pnpm build:client      # Build frontend only
pnpm build:server      # Build backend only
pnpm build:cpanel      # Build frontend for cPanel (includes .htaccess)
pnpm start            # Start production server
pnpm test             # Run tests
pnpm typecheck        # TypeScript type checking
pnpm format.fix        # Format code with Prettier
```

## 📱 Routes

### Public Routes
- `/` - Home page with trending media
- `/browse` - Browse all media with filters
- `/categories` - Browse by category
- `/media/:id` - Media detail page
- `/contact` - Contact page
- `/login` - User login
- `/signup` - User registration

### User Routes (Requires Authentication)
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/creator` - Creator dashboard

### Admin Routes (Requires Admin Role)
- `/admin` - Admin dashboard
- `/admin/media` - Media management
- `/admin/users` - User management
- `/admin/ads` - Ad management
- `/admin/analytics` - Analytics dashboard
- `/admin/settings` - Platform settings

## 🔧 Configuration

### Cloudinary Setup
The platform supports multiple Cloudinary accounts for media storage. Configure up to 4 accounts in `server/config/cloudinary.ts`.

### Adsteera Integration
Ad links are configured in:
- `client/components/AdsSlider.tsx` - Header ad slider (20 links)
- `client/pages/MediaDetail.tsx` - Download page ads (17 links)

### Firebase Authentication
Configure Firebase in `client/lib/firebase.ts` for user authentication.

## 📊 API Endpoints

### Media
- `GET /api/media` - Get all media (with pagination and filters)
- `GET /api/media/trending` - Get trending media
- `GET /api/media/:id` - Get media by ID
- `GET /api/media/categories/summary` - Get category summary
- `POST /api/media` - Create media (admin only)
- `PUT /api/media/:id` - Update media (admin only)
- `DELETE /api/media/:id` - Delete media (admin only)

### Downloads
- `GET /api/download/proxy/:mediaId` - Proxy download with CORS handling
- `POST /api/download/:mediaId` - Track download
- `GET /api/download/history` - Get download history

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - User logout

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/download-stats` - Get download statistics

## 🎨 Customization

### Styling
- Global styles: `client/global.css`
- Tailwind config: `tailwind.config.ts`
- Theme colors can be customized in `global.css`

### Branding
- Favicon: Upload via admin settings
- Logo: Update in `client/components/Header.tsx`

## 🚢 Deployment

### Production Build
```bash
pnpm build        # Build both client and server
pnpm start        # Start production server
```

### Build for cPanel (Static Hosting)
```bash
pnpm build:cpanel  # Build frontend with .htaccess for cPanel
```
This creates optimized static files in `dist/spa/` ready for cPanel upload.

### Deployment Options

#### cPanel Deployment (Recommended for Static Hosting)
- **Frontend**: Deploy to cPanel (static files)
- **Backend**: Deploy separately to Render/Railway/Heroku
- **Complete Guide**: See `CPANEL_DEPLOYMENT_COMPLETE.md` for step-by-step instructions

#### Other Deployment Options
- **Vercel**: Full-stack deployment (configure `vercel.json`)
- **Netlify**: Full-stack deployment (configure `netlify.toml`)
- **Render**: Backend API deployment (see `RENDER_ENV_VARIABLES.md`)
- **Self-hosted**: Run with Node.js

**Important**: For cPanel deployment, you must deploy the backend separately as cPanel only supports static files. The frontend communicates with the backend via API calls.

## 🔐 Security Notes

- Admin credentials are configured via environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)
- CORS is configured to only allow requests from your production domain
- API keys and secrets should never be committed to version control
- Use environment variables for all sensitive configuration

## 🗄️ Data Persistence

The platform supports multiple storage backends:

- **Production (Vercel)**: Uses Vercel KV (Redis) for persistent storage
- **Production (Render)**: Uses Upstash Redis or file storage
- **Development**: Uses local file storage (`server/data/`)

All media metadata is synced from Cloudinary and stored in the configured database. To sync existing Cloudinary files, use the sync endpoint (see `SYNC_CLOUDINARY_RENDER.md`).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary. All rights reserved.

## 📚 Documentation

### Production Deployment
- **`CPANEL_DEPLOYMENT_COMPLETE.md`** - Complete cPanel deployment guide (frontend + backend)
- **`RENDER_ENV_VARIABLES.md`** - Backend environment variables setup for Render
- **`SYNC_CLOUDINARY_RENDER.md`** - How to sync Cloudinary media to your database

### Configuration
- **`ENVIRONMENT_VARIABLES.md`** - Complete environment variables reference
- **`ADMIN_MEDIA_GUIDE.md`** - Admin guide for managing media content

### Additional Guides
- **`FIREBASE_DOMAIN_SETUP.md`** - Firebase authentication setup
- **`NAVIGATION_GUIDE.md`** - Navigation and routing information
- **`BACK_BUTTON_FIX.md`** - Browser navigation fixes

## 👥 Support

For support, email support@yourdomain.com or open an issue in the repository.

## 🙏 Acknowledgments

- Built with [Fusion Starter](https://github.com/your-repo/fusion-starter)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ for the stock media community**
