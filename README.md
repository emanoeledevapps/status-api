# API Monitoring System

This API monitors other APIs, logs their statuses into a PostgreSQL database, and notifies a Discord channel via Webhook when a failure is detected.

## Tech Stack
- **Node.js** with **TypeScript**
- **Express** for management API
- **Prisma** (ORM) with **PostgreSQL**
- **Axios** for health checks and Discord notifications
- **node-cron** for scheduled monitoring

## Prerequisites
1.  **PostgreSQL** instance running.
2.  **Discord Webhook URL** (Go to Server Settings > Integrations > Webhooks).

## Setup Instructions

1.  **Configure Environment Variables**
    Edit the `.env` file and update your PostgreSQL connection string and Discord Webhook URL:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/status_db"
    DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/your-webhook-id/your-webhook-token"
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Database Migrations**
    ```bash
    npm run db:migrate
    ```
    *(Note: This will ask for a migration name, e.g., "init")*

4.  **Seed Initial Data (Optional)**
    ```bash
    npx prisma db seed
    ```

5.  **Start the Development Server**
    ```bash
    npm run dev
    ```

## API Endpoints

-   `GET /apis`: List all monitored APIs.
-   `POST /apis`: Add a new API to monitor.
    -   Payload: `{ "name": "Google", "url": "https://google.com", "interval": 60 }`
-   `GET /logs`: View the latest 100 monitoring logs (useful for a status page).

## Monitoring
The system is pre-configured to check all active APIs every minute. If a failure (non-2xx response or timeout) is detected, a message is automatically sent to the configured Discord channel.
