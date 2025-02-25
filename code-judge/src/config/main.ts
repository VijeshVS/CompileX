import { LanguageConfig } from "../types/main";

export const LANGUAGE_CONFIG: Record<string,LanguageConfig> = {
    "c" : {
        file_path: "execute.c",
        output_binary: "a.out",
        compile_command: "gcc execute.c -o a.out",
        execute_command: "./a.out"
    },
    "cpp":{
        file_path: "execute.cpp",
        output_binary: "a.out",
        compile_command: "g++ execute.cpp -o a.out",
        execute_command: "./a.out"
    },
    "python": {
        file_path: "execute.py",
        output_binary: "execute.py",
        compile_command: "python3 execute.py",
        execute_command: "python3 execute.py"
    },
    "go": {
        file_path: "execute.go",
        output_binary: "execute",
        compile_command: "go build execute.go",
        execute_command: "./execute"
    },
    "java": {
        file_path: "Main.java",
        output_binary: "Main",
        compile_command: "javac Main.java",
        execute_command: "java Main"
    }
}

// supported: c, cpp, go