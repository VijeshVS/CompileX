import { LanguageConfig } from "../types/main";

export const LANGUAGE_CONFIG: Record<string,LanguageConfig> = {
    "c" : {
        file_path: "execute.c",
        output_binary: "a.out",
        compile_command: "gcc execute.c -o a.out",
        execute_command: "./a.out"
    }
}