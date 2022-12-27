const ts = require("typescript");

const FILENAME = "inmemory.ts";

/**
 * Object to compile snippets using the Typescript compiler.
 */
class Compiler{
    constructor(){
        this.oldProgram = undefined;
        this.sourceFile = undefined;

        // Define compiler options
        this.compilerOptions = {
            module: ts.ModuleKind.CommonJS,
            target: ["es5"],
            allowJs: true,
            checkJs:true,
            types: ["node"]
        }

        this.compilerHost = this.createCompilerHost(this.compilerOptions)
        // Create default host
        // this.defaultCompilerHost = ts.createCompilerHost(this.compilerOptions, true);
    }

    /** 
     * Patch to ts.compilerHost that retains sourceFiles in a Map. 
     * https://microsoft.github.io/lage/docs/Cookbook/make-ts-fast/
     * Reads FILENAME from memory.
     * https://convincedcoder.com/2019/01/19/Processing-TypeScript-using-TypeScript/
    **/
    createCompilerHost(compilerOptions) {
        const host = ts.createCompilerHost(compilerOptions, true);
        const sourceFiles = new Map();
        const originalGetSourceFile = host.getSourceFile;
        // monkey patch host to cache source files
        host.getSourceFile = (fileName,languageVersion, onError, shouldCreateNewSourceFile) => {
            //if filename matches inmemory designator
            if(fileName === FILENAME){
                return this.sourceFile;
            }
            if (sourceFiles.has(fileName)) {
                return sourceFiles.get(fileName);
            }
            const sourceFile = originalGetSourceFile(
                fileName,
                languageVersion,
                onError,
                shouldCreateNewSourceFile
            );
            sourceFiles.set(fileName, sourceFile);
            return sourceFile;
        };
        return host;
      }



    /**
     * Compiles a string of code.
     * @param {string} code String code to lint.
     * @return Array of error messages.
     */
    compile(code){
        //create the source file
        this.sourceFile = ts.createSourceFile(FILENAME, code, {});

        //create the program
        var program = ts.createProgram(
            [FILENAME], this.compilerOptions, this.compilerHost, this.oldProgram
        );

        this.oldProgram = program;

        const diagnostics = ts.getPreEmitDiagnostics(program);
        var errors = this.getErrors(diagnostics);
        return errors;
    }

    /**
     * Get errors from diagnostic object
     * @param {readonly ts.Diagnostic[]} diagnostics to process
     */
    getErrors(diagnostics){
        var errors = []
        for (const diagnostic of diagnostics) {
            const message = diagnostic.messageText;
            const file = diagnostic.file;
            if(!file) continue
            const filename = file.fileName;

            const lineAndChar = file.getLineAndCharacterOfPosition(
                diagnostic.start
            );
            const line = lineAndChar.line + 1;
            const character = lineAndChar.character + 1;

            // if(filename != FILENAME) continue;

            errors.push({
                message: message,
                start: diagnostic.start,
                length: diagnostic.length,
                line: line,
                character: character,
                filename: filename,
            })
        }
        return errors;
    }
}

module.exports = Compiler;