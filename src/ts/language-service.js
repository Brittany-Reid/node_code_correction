const path = require("path");
const fs = require("fs");
const ts = require("typescript");
const os = require("os");
const Config = require("./config");
const { getBaseDirectory } = require("../common");

const NODE_TYPES_DIR = path.join(getBaseDirectory(), "node_modules/@types/node")
const LIB_DIR = path.join(getBaseDirectory(), "node_modules/typescript/lib")

const FILENAME = "inmemory.js"
var codeString = undefined;

/**
 * Handle calls to the Language Service Host.
 * TsFixer should have that functionality called from here instead.
 */
class LanguageService{
    constructor(){
         /**
         * @type {ts.CompilerOptions}
         */
         this.compilerOptions = Config.compilerOptions;

         this.filteredFixes = Config.filteredFixes;
 
         this.filteredErrors = Config.filteredErrors;
 
         this.languageServiceHost = this.createLanguageServiceHost();
 
         this.documentRegistry = undefined;

         this.program = undefined;
         this.oldProgram = undefined;
         this.sourceFile = undefined;
    }

    /**
     * Create the LanguageServiceHost.
     * Possibly we replace the compiler with this.
     * @returns {ts.LanguageServiceHost}
     */
    createLanguageServiceHost(){
        var fileNames = [FILENAME];
        const files = {};
        const snapshots = {};
        const cache = {};

        fileNames.forEach(fileName => {
            files[fileName] = { version : 0 };
        });

        return {
            getScriptFileNames: () => fileNames,
            getScriptVersion: fileName =>
                files[fileName] && files[fileName].version.toString(),
            getScriptSnapshot: fileName => {
                if(fileName == FILENAME){
                    return ts.ScriptSnapshot.fromString(codeString);
                }
                if(!(path.resolve(fileName).startsWith(NODE_TYPES_DIR) || path.resolve(fileName).startsWith(LIB_DIR))){
                    return undefined
                }
                var snapshot = snapshots[fileName];
                //filename doesn't exist, load
                if(!snapshot){
                        //doesn't exist
                        if (!fs.existsSync(fileName)) {
                            return undefined;
                        }
                        snapshot = ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
                    snapshots[fileName] = snapshot
                }
                return snapshot;
                //return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
            },
            getCurrentDirectory: () => process.cwd(),
            getCompilationSettings: () => this.compilerOptions,
            getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
            fileExists: ts.sys.fileExists,
            readFile: (path, encoding) => {
                //ignore our package.json, results appear to be the same?
                if(path !== "package.json"){
                    var file = cache[path];
                    if(!file){
                        file = ts.sys.readFile(path, encoding)
                        cache[path] = file;
                        return file;
                    }
                }
                return undefined;
            },
            readDirectory: ts.sys.readDirectory,
            directoryExists: ts.sys.directoryExists,
            getDirectories: ts.sys.getDirectories,
        };
    }

    getErrors(code){
        codeString = code;
        if(!this.documentRegistry) this.documentRegistry = ts.createDocumentRegistry();
        else{
            this.documentRegistry.updateDocument(
                path.join(process.cwd(), FILENAME), //we need the full path for some reason
                this.languageServiceHost,
                this.languageServiceHost.getScriptSnapshot(FILENAME), //we need to pass the snapshot here,
                0, //version
                1, //checked getSourceFile for inmemory.js that scriptKind is 1, idk what it means :) yay!
                "esnext" //lang version
            )
           // this.documentRegistry.acquireDocument(path.join(process.cwd(), FILENAME), this.languageServiceHost, this.languageServiceHost.getScriptSnapshot(FILENAME), undefined, 1, "esnext"))
        }
        this.ls = ts.createLanguageService(this.languageServiceHost, this.documentRegistry);
        this.program = this.ls.getProgram();
        this.sourceFile = this.program.getSourceFile(FILENAME);
        var diagnostics = ts.getPreEmitDiagnostics(this.program, this.sourceFile);
        //not sure if ts fixer could hook into this using ts.getPreEmitDiagnostics over program.get...
        var errors = this.filterDiagnostics(diagnostics);
        return errors;
    }

    /**
     * Filters TS Diagnostics into error format.
     * Preserves the sourceFile.
     * @param {Array<ts.Diagnostic>} diagnostics 
     * @returns 
     */
    filterDiagnostics(diagnostics){
        var errors = [];
        for (const diagnostic of diagnostics) {
            //ignore errors not for this file
            const file = diagnostic.file;
            if(!file) continue


            const message = diagnostic.messageText;
            const filename = file.fileName;
            const lineAndChar = file.getLineAndCharacterOfPosition(
                diagnostic.start
            );
            const line = lineAndChar.line + 1;
            const character = lineAndChar.character + 1;

            if(this.filteredErrors.includes(diagnostic.code)) continue;

            errors.push({
                file: diagnostic.file,
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

module.exports = LanguageService;