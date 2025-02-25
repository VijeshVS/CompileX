import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  TestCase,
  CodeSubmission,
  SubmissionResponse,
  StatusResponse,
} from "./types";

const SUPPORTED_LANGUAGES = [
  { id: "c", name: "C" },
  { id: "python", name: "Python" },
  { id: "javascript", name: "JavaScript" },
  { id: "java", name: "Java" },
  { id: "cpp", name: "C++" },
  { id: "go", name: "Go" },
];

const DEFAULT_CODE = {
  c: `#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\\n", a + b);
    return 0;
}`,
  python: `a, b = map(int, input().split())
print(a + b)`,
  javascript: `const [a, b] = input().split(' ').map(Number);
console.log(a + b);`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int a = scanner.nextInt();
        int b = scanner.nextInt();
        System.out.println(a + b);
    }
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`,
  go: `package main

import "fmt"

func main() {
    var a, b int
    fmt.Scan(&a, &b)
    fmt.Println(a + b)
}`,
};

function App() {
  const [code, setCode] = useState<string>(
    DEFAULT_CODE[SUPPORTED_LANGUAGES[0].id]
  );
  const [language, setLanguage] = useState<string>(SUPPORTED_LANGUAGES[0].id);
  const [timeLimit, setTimeLimit] = useState<number>(1);
  const [memoryLimit, setMemoryLimit] = useState<number>(256);
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: "5 3", output: "8" },
    { input: "10 20", output: "30" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [executionResults, setExecutionResults] = useState<any[]>([]);

  useEffect(() => {
    setCode(DEFAULT_CODE[language]);
  }, [language]);

  const addTestCase = () =>
    setTestCases([...testCases, { input: "", output: "" }]);

  const removeTestCase = (index: number) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index));
    } else {
      toast.error("At least one test case is required");
    }
  };

  const updateTestCase = (
    index: number,
    field: keyof TestCase,
    value: string
  ) => {
    const newTestCases = [...testCases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setTestCases(newTestCases);
  };

  const pollStatus = async (commitId: string) => {
    try {
      const response = await axios.get<StatusResponse>(
        `http://localhost:3000/status/${commitId}`
      );
      if (response.data.status === "pending") {
        setTimeout(() => pollStatus(commitId), 1000);
      } else {
        setIsSubmitting(false);
        // @ts-ignore
        setExecutionResults(response.data.status);
        toast.success("Execution completed!");
      }
    } catch (error) {
      setIsSubmitting(false);
      toast.error("Error checking execution status");
      console.error("Error polling status:", error);
    }
  };

  const handleSubmit = async () => {
    if (
      !code.trim() ||
      testCases.some((tc) => !tc.input.trim() || !tc.output.trim())
    ) {
      toast.error("Please provide valid code and test cases");
      return;
    }
    setIsSubmitting(true);
    const submission: CodeSubmission = {
      code,
      time_limit: timeLimit,
      memory_limit: memoryLimit,
      test_cases: testCases,
      language,
    };
    try {
      const response = await axios.post<SubmissionResponse>(
        "http://localhost:3000/submit",
        submission
      );
      toast.success("Code submitted successfully!");
      pollStatus(response.data.commit_id);
    } catch (error) {
      setIsSubmitting(false);
      toast.error("Error submitting code");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="bg-gray-800 flex-1 shadow-lg p-6 rounded-lg">
          <div className="flex gap-6 mb-4">
            <select
              className="bg-gray-700 text-white border border-gray-600 p-3 rounded-md"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
            <div className="flex gap-6">
              <input
                type="number"
                min="1"
                value={timeLimit}
                onChange={(e) =>
                  setTimeLimit(Math.max(1, Number(e.target.value)))
                }
                className="bg-gray-700 text-white border p-3 rounded-md w-28"
              />
              <input
                type="number"
                min="1"
                value={memoryLimit}
                onChange={(e) =>
                  setMemoryLimit(Math.max(1, Number(e.target.value)))
                }
                className="bg-gray-700 text-white border p-3 rounded-md w-28"
              />
            </div>
          </div>

          {/* @ts-ignore */}
          <Editor
            height="400px"
            language={language}
            value={code}
            // @ts-ignore
            onChange={setCode}
            theme="vs-dark"
          />
        </div>
        <div className="bg-gray-800 shadow-lg p-6 rounded-lg flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Test Cases</h2>
            <button
              onClick={addTestCase}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          {testCases.map((tc, index) => (
            <div
              key={index}
              className="flex gap-4 items-center bg-gray-700 p-4 rounded-lg mb-3"
            >
              <textarea
                value={tc.input}
                onChange={(e) => updateTestCase(index, "input", e.target.value)}
                className="bg-gray-600 text-white p-3 border border-gray-500 rounded-md w-1/2"
              />
              <textarea
                value={tc.output}
                onChange={(e) =>
                  updateTestCase(index, "output", e.target.value)
                }
                className="bg-gray-600 text-white p-3 border border-gray-500 rounded-md w-1/2"
              />
              <button
                onClick={() => removeTestCase(index)}
                className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`mt-6 px-6 py-3 rounded text-white ${
          isSubmitting ? "bg-gray-600" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {isSubmitting ? "Running..." : "Submit"}
      </button>
      {executionResults.length > 0 && (
        <div className="bg-gray-800 shadow-lg p-6 rounded-lg mt-6">
          <h2 className="text-xl font-semibold mb-4">Execution Results</h2>
          {executionResults.map((result, index) => {
            let bgColor = "bg-green-600"; // Default to success
            let statusMessage = "Accepted";

            switch (result.status) {
              case 100:
                bgColor = "bg-yellow-600";
                statusMessage = "Compilation Error";
                break;
              case 200:
                bgColor = "bg-green-600";
                statusMessage = "Accepted";
                break;
              case 300:
                bgColor = "bg-orange-600";
                statusMessage = "Wrong Answer";
                break;
              case 400:
                bgColor = "bg-red-600";
                statusMessage = "Runtime Error";
                break;
              case 401:
                bgColor = "bg-purple-600";
                statusMessage = "Memory Limit Exceeded";
                break;
              case 402:
                bgColor = "bg-blue-600";
                statusMessage = "Time Limit Exceeded";
                break;
              case 500:
                bgColor = "bg-gray-600";
                statusMessage = "Internal Error";
                break;
              default:
                bgColor = "bg-gray-700";
                statusMessage = "Unknown Status";
            }

            return (
              <div key={index} className={`p-4 border-b ${bgColor}`}>
                <p>
                  <strong>Status:</strong> {statusMessage}
                </p>
                <p>
                  <strong>Input:</strong> {result.input}
                </p>
                <p>
                  <strong>Expected Output:</strong> {result.expected_output}
                </p>
                <p>
                  <strong>Observed Output:</strong>{" "}
                  {result.observed_output || "Error"}
                </p>
                {result.error && (
                  <p className="text-red-200">Error: {result.error}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;
