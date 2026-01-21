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

// Icons (using Unicode symbols for simplicity)
const PlayIcon = () => <span className="text-lg">▶</span>;
const PlusIcon = () => <span className="text-lg">+</span>;
const TrashIcon = () => <span className="text-lg">🗑️</span>;
const ClockIcon = () => <span className="mr-1">⏱️</span>;
const MemoryIcon = () => <span className="mr-1">💾</span>;
const CheckIcon = () => <span className="text-green-400">✓</span>;
const CrossIcon = () => <span className="text-red-400">✗</span>;
const LoadingIcon = () => (
  <svg className="animate-spin h-5 w-5 inline-block" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

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
  // Load initial state from localStorage only
  const [code, setCode] = useState<string>(() => {
    const saved = localStorage.getItem('compilex_code');
    return saved || '';
  });
  
  const [language, setLanguage] = useState<string>(() => {
    const saved = localStorage.getItem('compilex_language');
    return saved || SUPPORTED_LANGUAGES[0].id;
  });
  
  const [timeLimit, setTimeLimit] = useState<number>(() => {
    const saved = localStorage.getItem('compilex_timeLimit');
    return saved ? Number(saved) : 1;
  });
  
  const [memoryLimit, setMemoryLimit] = useState<number>(() => {
    const saved = localStorage.getItem('compilex_memoryLimit');
    return saved ? Number(saved) : 256;
  });
  
  const [testCases, setTestCases] = useState<TestCase[]>(() => {
    const saved = localStorage.getItem('compilex_testCases');
    return saved ? JSON.parse(saved) : [{ input: "", output: "" }];
  });
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const [executionResults, setExecutionResults] = useState<any[]>([]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('compilex_code', code);
  }, [code]);

  useEffect(() => {
    localStorage.setItem('compilex_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('compilex_timeLimit', String(timeLimit));
  }, [timeLimit]);

  useEffect(() => {
    localStorage.setItem('compilex_memoryLimit', String(memoryLimit));
  }, [memoryLimit]);

  useEffect(() => {
    localStorage.setItem('compilex_testCases', JSON.stringify(testCases));
  }, [testCases]);

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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.get<StatusResponse>(
        `${API_URL}/status/${commitId}`
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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.post<SubmissionResponse>(
        `${API_URL}/submit`,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-4 md:p-8">
      {/* Header */}
      <header className="mb-8 animate-fadeIn">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="gradient-text">CompileX</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            Online code compiler and judge system
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Code Editor Section */}
          <div className="glass-effect rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            {/* Editor Controls */}
            <div className="p-4 md:p-6 border-b border-white/10">
              <div className="flex flex-wrap gap-3 items-center">
                {/* Language Selector */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                    Language
                  </label>
                  <select
                    className="w-full bg-slate-800/80 text-white border border-slate-700 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-slate-800"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Limit */}
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                    <ClockIcon /> Time (s)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={timeLimit}
                    onChange={(e) =>
                      setTimeLimit(Math.max(1, Number(e.target.value)))
                    }
                    className="w-full bg-slate-800/80 text-white border border-slate-700 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-slate-800"
                  />
                </div>

                {/* Memory Limit */}
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                    <MemoryIcon /> Memory (MB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={memoryLimit}
                    onChange={(e) =>
                      setMemoryLimit(Math.max(1, Number(e.target.value)))
                    }
                    className="w-full bg-slate-800/80 text-white border border-slate-700 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Code Editor */}
            <div className="relative">
              {/* @ts-ignore */}
              <Editor
                height="500px"
                language={language}
                value={code}
                // @ts-ignore
                onChange={setCode}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  roundedSelection: false,
                  padding: { top: 16, bottom: 16 },
                  lineNumbers: "on",
                  renderLineHighlight: "all",
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

          {/* Test Cases Section */}
          <div className="glass-effect rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Test Cases
              </h2>
              <button
                onClick={addTestCase}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-blue-500/50 font-medium"
              >
                <PlusIcon /> Add
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4 max-h-[500px] overflow-y-auto">
              {testCases.map((tc, index) => (
                <div
                  key={index}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 rounded-xl hover:border-slate-600 transition-all animate-fadeIn"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-300">
                      Test Case {index + 1}
                    </span>
                    <button
                      onClick={() => removeTestCase(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-all"
                      title="Remove test case"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                        Input
                      </label>
                      <textarea
                        value={tc.input}
                        onChange={(e) =>
                          updateTestCase(index, "input", e.target.value)
                        }
                        placeholder="Enter input..."
                        className="w-full bg-slate-900/50 text-white p-3 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-mono text-sm"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                        Expected Output
                      </label>
                      <textarea
                        value={tc.output}
                        onChange={(e) =>
                          updateTestCase(index, "output", e.target.value)
                        }
                        placeholder="Enter expected output..."
                        className="w-full bg-slate-900/50 text-white p-3 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-mono text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-center animate-fadeIn">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`
              px-8 py-4 rounded-xl font-bold text-lg
              transition-all transform hover:scale-105 
              shadow-2xl flex items-center gap-3
              ${
                isSubmitting
                  ? "bg-slate-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 glow-green"
              }
            `}
          >
            {isSubmitting ? (
              <>
                <LoadingIcon /> Processing...
              </>
            ) : (
              <>
                <PlayIcon /> Run Code
              </>
            )}
          </button>
        </div>

        {/* Execution Results */}
        {executionResults.length > 0 && (
          <div className="mt-8 glass-effect rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 md:p-6 border-b border-white/10">
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Execution Results
              </h2>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              {executionResults.map((result, index) => {
                let statusClass = "from-green-500/20 to-emerald-500/20 border-green-500/30";
                let statusIcon = <CheckIcon />;
                let statusMessage = "Accepted";

                switch (result.status) {
                  case 100:
                    statusClass = "from-yellow-500/20 to-amber-500/20 border-yellow-500/30";
                    statusIcon = <CrossIcon />;
                    statusMessage = "Compilation Error";
                    break;
                  case 200:
                    statusClass = "from-green-500/20 to-emerald-500/20 border-green-500/30";
                    statusIcon = <CheckIcon />;
                    statusMessage = "Accepted";
                    break;
                  case 300:
                    statusClass = "from-orange-500/20 to-red-500/20 border-orange-500/30";
                    statusIcon = <CrossIcon />;
                    statusMessage = "Wrong Answer";
                    break;
                  case 400:
                    statusClass = "from-red-500/20 to-rose-500/20 border-red-500/30";
                    statusIcon = <CrossIcon />;
                    statusMessage = "Runtime Error";
                    break;
                  case 401:
                    statusClass = "from-purple-500/20 to-fuchsia-500/20 border-purple-500/30";
                    statusIcon = <CrossIcon />;
                    statusMessage = "Memory Limit Exceeded";
                    break;
                  case 402:
                    statusClass = "from-blue-500/20 to-cyan-500/20 border-blue-500/30";
                    statusIcon = <CrossIcon />;
                    statusMessage = "Time Limit Exceeded";
                    break;
                  case 500:
                    statusClass = "from-slate-500/20 to-gray-500/20 border-slate-500/30";
                    statusIcon = <CrossIcon />;
                    statusMessage = "Internal Error";
                    break;
                  default:
                    statusClass = "from-slate-500/20 to-gray-500/20 border-slate-500/30";
                    statusIcon = <span>?</span>;
                    statusMessage = "Unknown Status";
                }

                return (
                  <div
                    key={index}
                    className={`bg-gradient-to-r ${statusClass} border rounded-xl p-4 md:p-5 backdrop-blur-sm transition-all hover:scale-[1.02]`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{statusIcon}</span>
                      <h3 className="text-lg font-bold">
                        Test Case {index + 1}: {statusMessage}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div className="bg-slate-900/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1 font-semibold">INPUT</p>
                        <pre className="text-sm text-slate-200 font-mono whitespace-pre-wrap break-words">
                          {result.input || "N/A"}
                        </pre>
                      </div>
                      
                      <div className="bg-slate-900/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1 font-semibold">EXPECTED OUTPUT</p>
                        <pre className="text-sm text-slate-200 font-mono whitespace-pre-wrap break-words">
                          {result.expected_output || "N/A"}
                        </pre>
                      </div>
                      
                      <div className="bg-slate-900/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1 font-semibold">YOUR OUTPUT</p>
                        <pre className="text-sm text-slate-200 font-mono whitespace-pre-wrap break-words">
                          {result.observed_output || "Error"}
                        </pre>
                      </div>
                      
                      {result.error && (
                        <div className="bg-red-900/30 p-3 rounded-lg md:col-span-2">
                          <p className="text-xs text-red-400 mb-1 font-semibold">ERROR MESSAGE</p>
                          <pre className="text-sm text-red-200 font-mono whitespace-pre-wrap break-words">
                            {result.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-slate-500 text-sm">
        <p>Built with ❤️ using React, TypeScript, and Tailwind CSS</p>
      </footer>
    </div>
  );
}

export default App;
