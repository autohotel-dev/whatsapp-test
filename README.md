# 🏨 Auto Hotel Luxor - WhatsApp Chatbot v3.0

Advanced enterprise-level WhatsApp chatbot with AI, database integration, and real-time analytics.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start server
npm start

# Access dashboard
http://localhost:3000/dashboard
```

## 📚 Documentation

Full documentation is available in the `/docs` folder:

- **[Complete Guide](./docs/README.md)** - Full documentation
- **[Quick Start](./docs/QUICK_START.md)** - Get started in 5 minutes
- **[Advanced Features](./docs/ADVANCED_FEATURES.md)** - All v3.0 features
- **[Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)** - Deploy to production
- **[Improvements Log](./docs/MEJORAS.md)** - Technical details of v2.1 improvements

## 📦 Project Structure

```
whatsapp-test/
├── app.js                      # Main entry point
├── src/                        # Source code
│   ├── modules/               # Business logic modules
│   │   ├── chatbot/          # Chat functionality
│   │   ├── database/         # MongoDB integration
│   │   ├── ai/               # OpenAI NLP
│   │   ├── notifications/    # Email/Slack alerts
│   │   ├── ux/               # UX enhancements
│   │   └── analytics/        # Analytics engine
│   ├── services/             # External services
│   ├── utils/                # Utilities
│   └── config/               # Configuration
├── public/                    # Static files (dashboard)
├── tests/                     # Test suites
├── certs/                     # SSL certificates
├── docs/                      # Documentation
├── .env.example              # Environment template
└── package.json              # Dependencies

```

## ✨ Key Features

### Core (Always Active)
- ✅ Intelligent chatbot with context memory
- ✅ Intent detection with confidence scoring
- ✅ Advanced rate limiting
- ✅ Real-time analytics
- ✅ Error handling with retries
- ✅ Interactive web dashboard

### Advanced (Optional)
- 🤖 AI/NLP with OpenAI
- 💾 MongoDB persistence
- 📧 Email/Slack notifications
- 🎨 Enhanced UX with typing indicators
- 🎯 Lead scoring & segmentation
- 🔄 Remarketing system

## 🔧 Configuration

Create a `.env` file based on `.env.example`:

```env
# Required
VERIFY_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
FLOW_ID=your_flow_id

# Optional
MONGODB_URI=mongodb://localhost:27017/hotel-luxor
OPENAI_API_KEY=sk-your_api_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
SLACK_WEBHOOK=your_slack_webhook
```

## 🧪 Testing

```bash
# Run test suite
npm test

# View analytics
npm run analytics

# Development mode
npm run dev
```

## 📊 API Endpoints

```
GET  /dashboard              # Web dashboard
GET  /health                 # Health check
GET  /analytics              # Full metrics
GET  /analytics/summary      # Quick summary
POST /ai/detect-intent       # AI intent detection
GET  /users/:phone           # User profile
GET  /conversations/:phone   # Chat history
GET  /reservations/:phone    # Reservations
```

## 🌟 Version

**Current:** v3.0.0  
**Status:** ✅ Production Ready

## 📄 License

MIT

---

For detailed documentation, see **[/docs](./docs/)**
