export interface TestCase {
  input: string;
  output: string;
}

export interface CodeSubmission {
  code: string;
  time_limit: number;
  memory_limit: number;
  test_cases: TestCase[];
  language: string;
}

export interface SubmissionResponse {
  commit_id: string;
}

export interface StatusResponse {
  status: string | object;
}