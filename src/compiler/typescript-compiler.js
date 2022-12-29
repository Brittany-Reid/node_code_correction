const ts = require("typescript");

const FILENAME = "inmemory.js";
var start;

/**
 * Object to compile snippets using the Typescript compiler programmatically.
 * - In memory source code.
 * - Caches read-in files to speed up program creation step on subsequent compiles.
 * - Only emits diagnostics for the sourcefile, speeding up this step.
 * - NOT timeout safe - one code snippet causes crashes, use compiler class
 */
class TypeScriptCompiler{
    constructor(){
        this.oldProgram = undefined;
        this.sourceFile = undefined;

        // Define compiler options
        this.compilerOptions = {
            module: "esnext",
            target: "esnext",
            allowJs: true,
            checkJs:true,
            types: ["node"],
            jsx: false,
            // skipDefaultLibCheck: true,
            // skipLibCheck: true,
            // strict: false,
            // emitDecoratorMetadata: true,
            // experimentalDecorators: true,
            // noEmitOnError: true,
            // noImplicitAny: false,
            removeComments: false,
            // sourceMap: true,
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
        host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
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
        //documentation is sparse but i can see this function optionally takes a sourcefile
        //with this specified getPreEmitDiagnostics is considerably faster
        var diagnostics;
        try{
            diagnostics = ts.getPreEmitDiagnostics(program, this.sourceFile);
        } catch(e){
            return e.message;
        }
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
            var ignores = []
            // if(ignores.includes(diagnostic.code)){
            //     continue;
            // }

            errors.push({
                message: message,
                start: diagnostic.start,
                length: diagnostic.length,
                line: line,
                character: character,
                filename: filename,
                code: diagnostic.code,
                category: diagnostic.category,
            })
        }
        return errors;
    }
}

module.exports = TypeScriptCompiler;