import express from 'express';
import axios from 'axios';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Discord webhook notification function
async function notifyDiscord(apiName: string, url: string, status: number, error: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await axios.post(webhookUrl, {
      content: `🚨 **API Failure Detected!**\n\n**Name:** ${apiName}\n**URL:** ${url}\n**Status:** ${status}\n**Error:** ${error}\n**Time:** ${new Date().toISOString()}`
    });
  } catch (err) {
    console.error('Error sending Discord notification:', err);
  }
}

// Monitoring function
async function monitorApis() {
  const apis = await prisma.api.findMany({ where: { active: true } });

  for (const api of apis) {
    const startTime = Date.now();
    try {
      const response = await axios.get(api.url, { timeout: 10000 });
      const responseTime = Date.now() - startTime;

      await prisma.log.create({
        data: {
          apiId: api.id,
          status: response.status,
          responseTime,
          success: true
        }
      });
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const status = error.response?.status || 0;
      const errorMessage = error.message || 'Unknown error';

      await prisma.log.create({
        data: {
          apiId: api.id,
          status,
          responseTime,
          success: false,
          error: errorMessage
        }
      });

      // Notify Discord on failure
      await notifyDiscord(api.name, api.url, status, errorMessage);
    }
  }
}

// Schedule monitoring every minute (default)
cron.schedule('* * * * *', () => {
  console.log('Running monitoring task...');
  monitorApis();
});

// CRUD for Monitored APIs
app.get('/apis', async (req, res) => {
  const apis = await prisma.api.findMany();
  res.json(apis);
});

app.post('/apis', async (req, res) => {
  const { name, url, interval } = req.body;
  const api = await prisma.api.create({
    data: { name, url, interval }
  });
  res.status(201).json(api);
});

// Get logs (for future status page)
app.get('/logs', async (req, res) => {
  const logs = await prisma.log.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { api: true }
  });
  res.json(logs);
});

app.listen(port, () => {
  console.log(`Monitoring API running on port ${port}`);
});
