import React, { useState } from 'react';
import Editor from "@monaco-editor/react";
import axios from 'axios';
import toast from 'react-hot-toast';
import { TestCase, CodeSubmission, SubmissionResponse, StatusResponse } from './types';

const SUPPORTED_LANGUAGES = [
  { id: 'c', name: 'c' },
  { id: 'python', name: 'Python' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'java', name: 'Java' },
  { id: 'cpp', name: 'C++' }
];

const DEFAULT_CODE = `# Write your code here
def sum(a, b):
    return a + b

# Example usage
print(sum(5, 3))`;

function App() {
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [language, setLanguage] = useState<string>(SUPPORTED_LANGUAGES[0].id);
  const [timeLimit, setTimeLimit] = useState<number>(1);
  const [memoryLimit, setMemoryLimit] = useState<number>(256);
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: '5 3', output: '8' },
    { input: '10 20', output: '30' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [executionResults, setExecutionResults] = useState<any[]>([]);

  const addTestCase = () => setTestCases([...testCases, { input: '', output: '' }]);

  const removeTestCase = (index: number) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index));
    } else {
      toast.error('At least one test case is required');
    }
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: string) => {
    const newTestCases = [...testCases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setTestCases(newTestCases);
  };

  const pollStatus = async (commitId: string) => {
    try {
      const response = await axios.get<StatusResponse>(`http://localhost:3000/status/${commitId}`);
      if (response.data.status === 'pending') {
        setTimeout(() => pollStatus(commitId), 1000);
      } else {
        setIsSubmitting(false);
        setExecutionResults(response.data.status);
        toast.success('Execution completed!');
      }
    } catch (error) {
      setIsSubmitting(false);
      toast.error('Error checking execution status');
      console.error('Error polling status:', error);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim() || testCases.some(tc => !tc.input.trim() || !tc.output.trim())) {
      toast.error('Please provide valid code and test cases');
      return;
    }
    setIsSubmitting(true);
    const submission: CodeSubmission = { code, time_limit: timeLimit, memory_limit: memoryLimit, test_cases: testCases, language };
    try {
      const response = await axios.post<SubmissionResponse>('http://localhost:3000/submit', submission);
      toast.success('Code submitted successfully!');
      pollStatus(response.data.commit_id);
    } catch (error) {
      setIsSubmitting(false);
      toast.error('Error submitting code');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Code Execution Platform</h1>
        <div className="bg-white shadow p-6 rounded-lg">
          <div className="flex gap-4 mb-4">
            <select className="border p-2 rounded" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {SUPPORTED_LANGUAGES.map(lang => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
            </select>
            <input type="number" min="1" value={timeLimit} onChange={(e) => setTimeLimit(Math.max(1, Number(e.target.value)))} className="border p-2 w-20 rounded" />
            <input type="number" min="1" value={memoryLimit} onChange={(e) => setMemoryLimit(Math.max(1, Number(e.target.value)))} className="border p-2 w-20 rounded" />
          </div>
          <Editor height="400px" language={language} value={code} onChange={setCode} theme="vs-dark" />
        </div>
        <div className="bg-white shadow p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Test Cases</h2>
            <button onClick={addTestCase} className="bg-green-500 text-white px-4 py-2 rounded">Add</button>
          </div>
          {testCases.map((tc, index) => (
            <div key={index} className="flex gap-4 items-center bg-gray-50 p-4 rounded">
              <textarea value={tc.input} onChange={(e) => updateTestCase(index, 'input', e.target.value)} className="w-1/2 p-2 border rounded" />
              <textarea value={tc.output} onChange={(e) => updateTestCase(index, 'output', e.target.value)} className="w-1/2 p-2 border rounded" />
              <button onClick={() => removeTestCase(index)} className="bg-red-500 text-white px-3 py-1 rounded">X</button>
            </div>
          ))}
        </div>
        <button onClick={handleSubmit} disabled={isSubmitting} className={`px-6 py-3 rounded text-white ${isSubmitting ? 'bg-gray-400' : 'bg-blue-500'}`}>{isSubmitting ? 'Running...' : 'Submit'}</button>
        {executionResults.length > 0 && (
          <div className="bg-white shadow p-6 rounded-lg">
            <h2 className="text-xl font-semibold">Execution Results</h2>
            {executionResults.map((result, index) => (
              <div key={index} className="p-4 border-b">
                <p><strong>Input:</strong> {result.input}</p>
                <p><strong>Expected Output:</strong> {result.expected_output}</p>
                <p><strong>Observed Output:</strong> {result.observed_output || 'Error'}</p>
                {result.error && <p className="text-red-500">Error: {result.error}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
