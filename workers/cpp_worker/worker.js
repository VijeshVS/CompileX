import amqp from "amqplib";
import { exec } from "child_process";
import fs from "fs/promises";

const AMQP_URL = 'amqp://host.docker.internal:5672';
const QUEUE_NAME = "hello_cpp";
const FILE_PATH = "hello.cpp";
const OUTPUT_BINARY = "./a.out";

async function writeFile(content) {
  try {
    await fs.writeFile(FILE_PATH, content, "utf-8");
    console.log("✅ Code written to file successfully");
  } catch (err) {
    console.error("❌ Error writing file:", err);
    throw err;
  }
}

async function compileAndRun() {
  try {
    console.log("🔨 Compiling C++ code...");
    await execPromise(`g++ ${FILE_PATH} -o ${OUTPUT_BINARY}`);
    console.log("✅ Compilation successful!");

    console.log("🚀 Running program...");
    const output = await execPromise(OUTPUT_BINARY);
    console.log("🖥️ Output:\n", output);
  } catch (err) {
    console.error("❌ Error during compilation or execution:", err);
  }
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) return reject(err);
      if (stderr) console.warn("⚠️ Compiler warning/error:", stderr);
      resolve(stdout);
    });
  });
}

async function startConsumer() {
  try {
    const connection = await amqp.connect(AMQP_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: false });

    console.log(
      ` [*] Waiting for C++ messages in '${QUEUE_NAME}'. To exit press CTRL+C`
    );

    channel.consume(
      QUEUE_NAME,
      async (msg) => {
        if (!msg) return;

        try {
          const { code } = JSON.parse(msg.content.toString());
          console.log("📥 Received C++ code:", code);

          await writeFile(code);
          await compileAndRun();
        } catch (err) {
          console.error("❌ Error processing message:", err);
        }
      },
      { noAck: true }
    );
  } catch (error) {
    console.error("❌ Error in RabbitMQ Consumer:", error);
    process.exit(1);
  }
}

startConsumer();
