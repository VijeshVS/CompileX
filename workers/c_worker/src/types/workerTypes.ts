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
