# TradingView Webhook Manager

A full-stack application to manage TradingView webhooks, built with Next.js and Firebase, deployable on Vercel.

## Features

- Receive and process TradingView webhooks
- Store webhook data in Firebase Firestore
- Real-time webhook data display
- Modern UI with Tailwind CSS

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment to Vercel

1. Push your code to a Git repository
2. Import your project in Vercel
3. Add the same environment variables in Vercel's project settings
4. Deploy!

## Webhook Configuration

1. Get your webhook URL from your deployed application:
   ```
   https://your-domain.vercel.app/api/webhook
   ```

2. Configure this URL in your TradingView alert settings

## License

MIT 