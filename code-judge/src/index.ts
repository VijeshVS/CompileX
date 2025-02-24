import { exec, spawn } from "child_process";
import fs from "fs";
import pidusage from "pidusage";
import { CodeOutput, CodeWork, LanguageConfig, TestCase } from "./types/main";
import amqplib from "amqplib";
import { LANGUAGE_CONFIG } from "./config/main";
import redis from "redis";

const redis_client = redis.createClient({
  url: "redis://localhost:6379"
});

redis_client.on("error", (err) => {
  console.error("Redis client error:", err);
});

function writeContent(file_path: string, content: string) {
  try {
    fs.writeFileSync(file_path, content, "utf-8");
  } catch (error) {
    console.error(`Error writing to file ${file_path}:`, error);
  }
}

async function TestAgainstTestCases(
  testCases: TestCase[],
  timeLimit: number,
  memoryLimit: number,
  config: LanguageConfig
): Promise<CodeOutput[]> {
  const testResults: CodeOutput[] = [];

  return new Promise((resolve, _reject) => {
    for (let index = 0; index < testCases.length; index++) {
      const test_case = testCases[index];
      const process = spawn(config.execute_command);
      let output = "";
      let errorStatusCode = 0;
      let errorMessage = "";

      const tle_timeout = setTimeout(() => {
        process.kill("SIGKILL");
        errorStatusCode = 402;
        errorMessage = "TLE";
      }, timeLimit);

      const memory_monitor = setInterval(() => {
        pidusage(process.pid as any, (err: any, stats: any) => {
          if (err) {
            console.error("Error fetching memory usage:", err);
            return;
          }
          if (stats.memory / 1024 / 1024 > memoryLimit) {
            process.kill("SIGKILL");
            errorStatusCode = 403;
            errorMessage = "Memory Limit Exceeded";
          }
        });
      }, 100);

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.on("close", (code, signal) => {
        clearTimeout(tle_timeout);
        clearInterval(memory_monitor);

        const currentOutput: CodeOutput = {
          input: test_case.input,
          expected_output: test_case.output,
          observed_output: output.trim(),
          status: 200,
          error: null,
        };

        if (signal == "SIGSEGV") {
          currentOutput.status = 400;
          currentOutput.error = "Segmentation Fault !!";
        } else if (signal == "SIGKILL") {
          currentOutput.status = errorStatusCode;
          currentOutput.error = errorMessage;
        } else {
          if (test_case.output != output.trim()) {
            currentOutput.status = 300;
          }
        }

        testResults.push(currentOutput);

        if (testResults.length == testCases.length) {
          resolve(testResults);
        }
      });

      process.stdin.write(test_case.input);
      process.stdin.end();
    }
  });
}

async function runCode(
  config: LanguageConfig,
  testCases: TestCase[],
  timeLimit: number,
  memoryLimit: number
): Promise<CodeOutput[]> {
  return new Promise((resolve, reject) => {
    exec(config.compile_command, async (error, _stdout, stderr) => {
      if (error) {
        console.log("Compilation Error:", stderr);
        resolve([]);
      }

      const results = await TestAgainstTestCases(
        testCases,
        timeLimit,
        memoryLimit,
        config
      );

      resolve(results);
    });
  });
}

async function consumeWork() {
  try {
    const connection = await amqplib.connect("amqp://localhost");
    const channel = await connection.createChannel();

    const queue = "code-judge";
    await channel.assertQueue(queue, { durable: false });

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const work: CodeWork = JSON.parse(msg.content.toString());
        writeContent(LANGUAGE_CONFIG[work.language].file_path, work.code);

        const results = await runCode(
          LANGUAGE_CONFIG[work.language],
          work.test_cases,
          work.time_limit,
          work.memory_limit
        );
        
        redis_client.set(work.commit_id, JSON.stringify(results));

        channel.ack(msg);
      }
    });
  } catch (err) {
    console.error("Error connecting to RabbitMQ:", err);
  }
}

consumeWork();