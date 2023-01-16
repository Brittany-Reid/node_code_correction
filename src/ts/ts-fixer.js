const ts = require("typescript");
const fs = require("fs");
const os = require("os");
const Config = require("./config");
const { getBaseDirectory } = require("../common");
const path = require("path");

const NODE_TYPES_DIR = path.join(getBaseDirectory(), "node_modules/@types/node")
const LIB_DIR = path.join(getBaseDirectory(), "node_modules/typescript/lib")

const FILENAME = "inmemory.js"
var codeString = undefined;

/**
 * Runs TSFixes in-memory.
 * Based on:
 * https://github.com/microsoft/ts-fix
 */
class TSFixer{
    constructor(){
        /**
         * @type {ts.CompilerOptions}
         */
        this.compilerOptions = Config.compilerOptions;

        this.filteredFixes = Config.filteredFixes;

        this.filteredErrors = Config.filteredErrors;

        this.languageServiceHost = this.createLanguageServiceHost();

        this.lastDiagnostics;
        this.lastFixes;
    }

    /**
     * Create the LanguageServiceHost.
     * @returns {ts.LanguageServiceHost}
     */
    createLanguageServiceHost(){
        var fileNames = [FILENAME];
        const files = {};
        const snapshots = {};

        fileNames.forEach(fileName => {
            files[fileName] = { version: 0 };
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
            readFile: ts.sys.readFile,
            readDirectory: ts.sys.readDirectory,
            directoryExists: ts.sys.directoryExists,
            getDirectories: ts.sys.getDirectories,
          };
    }

    fix(code){
        codeString = code;
        this.ls = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
        this.program = this.ls.getProgram();
        var diagnostics = this.getDiagnostics();
        this.lastDiagnostics = diagnostics;
        if(!diagnostics || diagnostics.length === 0) return code;
        var fixes = this.getFixes(diagnostics);
        this.lastFixes = fixes;
        var changes = this.getTextChanges(fixes);
        var fixed = this.applyChanges(changes)
        return fixed;
    }

    /**
     * Get diagnostics (only semantic as thats what ts-fix does)
     * @returns {readonly ts.Diagnostic[]}
     */
    getDiagnostics(){
        var file = this.program.getSourceFile(FILENAME);
        var diagnostics = this.program.getSemanticDiagnostics(file);

        //filter out codes
        diagnostics = diagnostics.filter((d) => {
            if(this.filteredErrors.includes(d.code)) return false
            return true
        })

        return diagnostics;
    }

    /**
     * Get fixes for a list of diagnostics.
     * @param {readonly ts.Diagnostic[]} diagnostics 
     * @returns {ts.CodeFixAction[]}
     */
    getFixes(diagnostics){
        var ls = this.ls;
        var codefixes = ([]).concat.apply([], diagnostics.map(function (d) {
            if (d.file && d.start !== undefined && d.length !== undefined) {
              return ls.getCodeFixesAtPosition(
                d.file.fileName,
                d.start,
                d.start + d.length,
                [d.code],
                ts.getDefaultFormatCodeSettings(os.EOL),
                {});
            } else {
              return [];
            }
        }))
        
        codefixes = codefixes.filter((f) => {
            if(f !== undefined){
                if(!this.filteredFixes.includes(f.fixName)){
                    return true;
                }
            }
            return false;
        });

        return codefixes
    }

    /**
     * Returns dictionary of filename to valid text changes.
     * @param {ts.CodeFixAction[]} fixes 
     * @returns {ts.TextChange[]}
     */
    getTextChanges(fixes){
        let textChanges = []

        for (let i = 0; i < fixes.length; i++) {
            const fix = fixes[i];
            const changes = fix.changes;
            for (let j = 0; j < changes.length; j++) {
                let change = changes[j];
                let validChanges = this.getValidTextChanges(change)
                if (validChanges === undefined) continue
                textChanges = textChanges.concat(validChanges);
            }
        }

        return textChanges;
    }

    getValidTextChanges(changes){
        if (/[\\/]node_modules[\\/]/.test(changes.fileName)){
            return undefined;
        }
        return [...changes.textChanges];
    }

    /**
     * Apply changes
     * @param {ts.TextChange[]} changes 
     * @returns 
     */
    applyChanges(changes){
        const sourceFile = this.program.getSourceFile(FILENAME);
        var text = sourceFile.text;
        const sortedFixList = this.sortChangesByStart(changes);
        const filteredFixList = this.filterOverlappingFixes(sortedFixList);
        for (let i = filteredFixList.length - 1; i >= 0; i--) {
            // apply each codefix
            text = this.doTextChangeOnString(text, filteredFixList[i]);
        }
        return text;
    }

    /**
     * https://github.com/microsoft/ts-fix/blob/83e43211c2b29468069dbd9fc407343fc15d9ee3/src/index.ts#L334
     * @param {ts.TextChange[]} textChanges 
     * @returns {ts.TextChange[]}
     */
    sortChangesByStart(textChanges) {
        return textChanges.sort((a, b) => {
            return (a.span.start - b.span.start === 0) ? a.span.length - b.span.length : a.span.start - b.span.start 
        });
    }

    /**
     * https://github.com/microsoft/ts-fix/blob/83e43211c2b29468069dbd9fc407343fc15d9ee3/src/index.ts#L344
     * @param {ts.TextChange[]} sortedFixList 
     * @returns {ts.TextChange[]}
     */
    filterOverlappingFixes(sortedFixList){
        let filteredList = [];
        let currentEnd = -1;
        for (let i = 0; i < sortedFixList.length; i++) {
            let fix = sortedFixList[i];
            if (fix.span.start > currentEnd) {
                filteredList.push(fix);
                currentEnd = fix.span.start + fix.span.length;
            }
        }
        return filteredList;
    }

    /**
     * 
     * @param {string} currentFileText 
     * @param {ts.TextChange} change 
     * @returns {string}
     */
    doTextChangeOnString(currentFileText, change){
        const prefix = currentFileText.substring(0, change.span.start);
        const middle = change.newText;
        const suffix = currentFileText.substring(change.span.start + change.span.length);
        return prefix + middle + suffix;
    }
}

// var fixer = new TSFixer();
// var fixed = fixer.fix(
//     `consle.log('a')
//     console.log(a)`
// );
// console.log({fixed})

module.exports = TSFixer;
