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