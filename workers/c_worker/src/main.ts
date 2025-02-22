import { exec, spawn } from "child_process";
import fs from "fs";

interface TestCase {
  input: string;
  output: string;
}

interface CodeOutput {
  input: string;
  expected_output: string;
  observed_output: string | null;
  status: number;
  error: string | null;
}

const AMQP_URL = "amqp://host.docker.internal:5672";
const QUEUE_NAME = "c_worker_queue";
const FILE_PATH = "execute.c";
const OUTPUT_BINARY = "a.out";
const COMPILE_COMMAND = `gcc ${FILE_PATH}`;
const EXECUTE_COMMAND = `./${OUTPUT_BINARY}`;

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
  memoryLimit: number
) {
  const testResults: CodeOutput[] = [];

  return new Promise((resolve, reject) => {
    for (let index = 0; index < testCases.length; index++) {
      const test_case = testCases[index];
      const process = spawn(EXECUTE_COMMAND);
      let output = "";
      let errorStatusCode = 0;
      let errorMessage = "";

      const tle_timeout = setTimeout(() => {
        process.kill("SIGKILL");
        errorStatusCode = 402;
        errorMessage = "TLE";
      }, timeLimit);

      const memory_monitor = setInterval(() => {
        // memory usage check
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
          observed_output: output,
          status: 200,
          error: null,
        };

        if (signal == "SIGSEGV") {
          currentOutput.status = 400;
          currentOutput.error = "Segmentation Fault !!";
        } else if (signal == "SIGKILL") {
          currentOutput.status = errorStatusCode;
          currentOutput.error = errorMessage 
        }
        else {
            if(test_case.output != output){
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

async function runCode() {
  exec(COMPILE_COMMAND, async (error, stdout, stderr) => {

    if(error){
      console.log(error);
      return;
    }

    const testCases: TestCase[] = [
      { input: "1\n2\n", output: "3\n" },
      { input: "5\n7\n", output: "12\n" },
    ];
    const timeLimit = 2000; // 2 seconds
    const memoryLimit = 50; // 50 MB

    const results = await TestAgainstTestCases(
      testCases,
      timeLimit,
      memoryLimit
    );
    console.log(results);
  });
}

runCode();
