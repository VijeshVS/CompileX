import express, { Request, Response } from "express";
import amqp from "amqplib";
import { createClient } from "redis";
import crypto from "crypto";
import cors from 'cors'

const app = express();
const PORT = 3000;
const QUEUE = "code-judge";
app.use(cors({
  origin: '*'
}))

const redisClient = createClient();
redisClient.connect();

app.use(express.json());

interface CodeSubmission {
  code: string;
  time_limit: number;
  memory_limit: number;
  test_cases: { input: string; output: string }[];
  language: string;
  commit_id: string;
}

// POST endpoint to submit code
// @ts-ignore
app.post("/submit", async (req: Request, res: Response) => {
  const { code, time_limit, memory_limit, test_cases, language } = req.body;
  if (!code || !time_limit || !memory_limit || !test_cases || !language) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const commit_id = crypto.randomBytes(8).toString("hex");
  const message: CodeSubmission = {
    code,
    time_limit,
    memory_limit,
    test_cases,
    language,
    commit_id,
  };

  try {
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE, { durable: false });
    channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(message)));
    
    setTimeout(() => connection.close(), 500);
  } catch (error) {
    return res.status(500).json({ error: "RabbitMQ operation failed" });
  }
  // await redisClient.set(commit_id, "pending");
  res.json({ commit_id });
});

// GET endpoint to check status of a commit_id
// @ts-ignore
app.get("/status/:commitId", async (req: Request, res: Response) => {
  const { commitId } = req.params;
  const status = await redisClient.get(commitId);

  if (!status) {
    return res.json({ status: "pending" });
  }
  
  res.json({ status: JSON.parse(status) });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
