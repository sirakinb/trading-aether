# TradeCopilot - AI Trading Assistant

Advanced AI-powered trading analysis and risk management platform for professional traders.

**Live App**: https://trading-aether.vercel.app

## Features

- 🤖 **AI Chart Analysis** - Upload trading charts and get detailed analysis
- 📊 **Trade History** - Track and manage your trading performance  
- ⚙️ **Settings & Memory** - Personalized AI coaching based on your trading patterns
- 🎯 **Risk Management** - Advanced risk assessment and trade planning

## Tech Stack

This project is built with:
- **Vite + React + TypeScript**
- **Tailwind CSS + shadcn/ui** 
- **Supabase** (Database, Auth, Storage, Edge Functions)
- **Vercel** (Deployment)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/sirakinb/trading-aether.git
   cd trading-aether
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Visit `http://localhost:5173`

## Deployment

The app is deployed on Vercel. Any changes pushed to the `main` branch will automatically trigger a new deployment.

### Environment Variables (Vercel)

Make sure to set these environment variables in your Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Database Schema

The app uses Supabase with the following main tables:
- `conversations` - Chat conversations with AI
- `messages` - Individual messages in conversations  
- `trades` - Saved trade records and analysis
- `memories` - AI memory system for personalized coaching
- `user_settings` - User preferences and settings

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.