# Funcoland

A modern web application built with Next.js for tracking and managing video game collections and playtimes. The application integrates with the HowLongToBeat API to provide accurate game completion estimates.

## 🚀 Features

- User authentication and authorization with NextAuth
- Game collection management
- Integration with HowLongToBeat for game completion times
- Modern, responsive UI built with Tailwind CSS
- Type-safe development with TypeScript
- Database management with Prisma

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database ORM**: Prisma
- **Authentication**: NextAuth.js
- **External API**: HowLongToBeat
- **Security**: bcrypt for password hashing

## 📦 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/funcoland.git
   cd funcoland
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:
   ```
   DATABASE_URL="your-database-url"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
