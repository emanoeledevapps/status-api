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

// Discord notifications
async function notifyDiscord(apiName: string, url: string, status: number, error: string, type: 'fail' | 'success') {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const content = type === 'fail' 
    ? `🚨 **API Failure Detected!**\n\n**Name:** ${apiName}\n**URL:** ${url}\n**Status:** ${status}\n**Error:** ${error}\n**Time:** ${new Date().toLocaleString()}`
    : `✅ **API is Back Online!**\n\n**Name:** ${apiName}\n**URL:** ${url}\n**Time:** ${new Date().toLocaleString()}`;

  try {
    await axios.post(webhookUrl, { content });
  } catch (err) {
    console.error('Error sending Discord notification:', err);
  }
}

// Monitoring function with state management
async function monitorApis() {
  const apis = await prisma.api.findMany({ where: { active: true } });

  for (const api of apis) {
    const startTime = Date.now();
    try {
      const response = await axios.get(api.url, { timeout: 10000 });
      const responseTime = Date.now() - startTime;

      await prisma.log.create({
        data: { apiId: api.id, status: response.status, responseTime, success: true }
      });

      // If it was down, notify it's back up
      if (api.lastStatus === 'down') {
        await notifyDiscord(api.name, api.url, response.status, '', 'success');
        await prisma.api.update({
          where: { id: api.id },
          data: { lastStatus: 'up' }
        });
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const status = error.response?.status || 0;
      const errorMessage = error.message || 'Unknown error';

      await prisma.log.create({
        data: { apiId: api.id, status, responseTime, success: false, error: errorMessage }
      });

      // If it was up, notify it's down
      if (api.lastStatus === 'up') {
        await notifyDiscord(api.name, api.url, status, errorMessage, 'fail');
        await prisma.api.update({
          where: { id: api.id },
          data: { lastStatus: 'down' }
        });
      }
    }
  }
}

cron.schedule('* * * * *', () => {
  console.log('Running monitoring task...');
  monitorApis();
});

app.get('/apis', async (req, res) => {
  const apis = await prisma.api.findMany();
  res.json(apis);
});

app.post('/apis', async (req, res) => {
  const { name, url, interval } = req.body;
  const api = await prisma.api.create({
    data: { name, url, interval, lastStatus: 'up' }
  });
  res.status(201).json(api);
});

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
