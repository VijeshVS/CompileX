import express, { Request, Response } from 'express';
import amqp from 'amqplib/callback_api';
import { createClient } from 'redis';
import crypto from 'crypto';

const app = express();
const PORT = 3000;
const QUEUE = 'code-judge';

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
app.post('/submit', async (req: Request, res: Response) => {
    const { code, time_limit, memory_limit, test_cases, language } = req.body;
    if (!code || !time_limit || !memory_limit || !test_cases || !language) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const commit_id = crypto.randomBytes(8).toString('hex');
    const message: CodeSubmission = {
        code,
        time_limit,
        memory_limit,
        test_cases,
        language,
        commit_id
    };

    amqp.connect('amqp://localhost', (error0, connection) => {
        if (error0) {
            return res.status(500).json({ error: 'RabbitMQ connection failed' });
        }
        connection.createChannel((error1, channel) => {
            if (error1) {
                return res.status(500).json({ error: 'Failed to create RabbitMQ channel' });
            }
            channel.assertQueue(QUEUE, { durable: false });
            channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(message)));
            console.log(" [x] Sent", message);
        });
        setTimeout(() => connection.close(), 500);
    });
    
    await redisClient.set(commit_id, 'pending');
    res.json({ commit_id });
});

// GET endpoint to check status of a commit_id
// @ts-ignore
app.get('/status/:commitId', async (req: Request, res: Response) => {
    const { commitId } = req.params;
    const status = await redisClient.get(commitId);
    if (!status) {
        return res.json({ status: 'pending' });
    }
    res.json({ status });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
