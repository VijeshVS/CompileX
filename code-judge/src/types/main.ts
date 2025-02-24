export interface TestCase {
  input: string;
  output: string;
}

export interface CodeOutput {
  input: string;
  expected_output: string;
  observed_output: string | null;
  status: number;
  error: string | null;
}

export interface LanguageConfig {
  file_path: string;
  output_binary: string;
  compile_command: string;
  execute_command: string;
}

export interface CodeWork {
  code: string;
  time_limit: number,
  memory_limit: number,
  test_cases: TestCase[],
  language: string,
  commit_id: string
}

export enum CodeJudgeStatus {
  COMPILATION_ERROR = 100, // Compilation Error (CE)
  ACCEPTED = 200,          // Accepted (AC)
  WRONG_ANSWER = 300,      // Wrong Answer (WA)
  RUNTIME_ERROR = 400,     // Runtime Error (RE)
  MEMORY_LIMIT_EXCEEDED = 401, // Memory Limit Exceeded (MLE)
  TIME_LIMIT_EXCEEDED = 402,   // Time Limit Exceeded (TLE)
  INTERNAL_ERROR = 500,    // Internal Error (IE)
  PENDING = 600,          // Pending (PENDING)
  RUNNING = 700           // Running (RUNNING)
}

