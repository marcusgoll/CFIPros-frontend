# CFIPros Frontend

Modern Next.js 15 frontend for the CFIPros platform - ACS code extraction and study plan generation for aviation professionals.

## 🚀 Tech Stack

- **Next.js 15.1.0** with App Router
- **TypeScript 5.8.4** with strict configuration  
- **Tailwind CSS 3.4.x** with custom design system
- **Jest + React Testing Library** for testing
- **ESLint + Prettier** for code quality

## 🏃‍♂️ Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── (public)/          # Public routes
│   ├── (authed)/          # Protected routes  
│   └── api/               # API routes (BFF)
├── components/            # Reusable components
├── lib/                   # Utilities and services
├── __tests__/             # Test files
└── public/                # Static assets
```

## 🧪 Testing

Run the test suite:
```bash
npm test                   # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

## 🎯 Features

- ✅ Modern Next.js 15 with App Router
- ✅ TypeScript with strict mode
- ✅ Tailwind CSS design system
- ✅ Comprehensive testing setup
- ✅ Production-ready build system
- ✅ SEO optimization
- ✅ File upload functionality
- ✅ Authentication integration

## 📖 Development

This frontend connects to the CFIPros FastAPI backend for:
- File upload and processing
- ACS code extraction
- Study plan generation
- User authentication
- Premium features

Built with ❤️ for aviation professionals.