/**
 * @fileoverview call ts fixes programmatically 
 * need to use languageservice for fixes
 * https://jakerunzer.com/running-ts-in-browser
 */

const fs = require("fs");
const { textSpanIntersectsWithPosition } = require("typescript");
const ts = require("typescript");
const { getBaseDirectory } = require("../common");
const TypeScriptCompiler = require("./typescript-compiler");
const os = require("os")

const FILENAME = "inmemory.js";

const files = {
    [FILENAME]: "consol.log()",
    ["/esnext.d.ts"] : fs.readFileSync(getBaseDirectory() + "/node_modules/typescript/lib/lib.esnext.d.ts", {encoding:"utf-8"}),
    ["/lib.es2022.d.ts"] : fs.readFileSync(getBaseDirectory() + "/node_modules/typescript/lib/lib.es2022.d.ts", {encoding:"utf-8"}),
    ["/lib.es2022.array.d.ts"] : fs.readFileSync(getBaseDirectory() + "/node_modules/typescript/lib/lib.es2022.array.d.ts", {encoding:"utf-8"}),
    ["/lib.es2022.error.d.ts"] : fs.readFileSync(getBaseDirectory() + "/node_modules/typescript/lib/lib.es2022.error.d.ts", {encoding:"utf-8"}),
    ["/lib.es2022.intl.d.ts"] : fs.readFileSync(getBaseDirectory() + "/node_modules/typescript/lib/lib.es2022.intl.d.ts", {encoding:"utf-8"}),
    ["/lib.es2022.object.d.ts"] : fs.readFileSync(getBaseDirectory() + "/node_modules/typescript/lib/lib.es2022.object.d.ts", {encoding:"utf-8"}),
    ["/lib.es2022.sharedmemory.d.ts"] : fs.readFileSync(getBaseDirectory() + "/node_modules/typescript/lib/lib.es2022.sharedmemory.d.ts", {encoding:"utf-8"}),
    ["/lib.es2022.string.d.ts"] : fs.readFileSync(getBaseDirectory() + "/node_modules/typescript/lib/lib.es2022.string.d.ts", {encoding:"utf-8"}),
  };

var compilerOptions = {
    module: "esnext",
    target: "esnext",
    lib:["esnext"], //ignore dom etc
    allowJs: true,
    checkJs:true,
    types: ["node"],
    jsx: false,
    removeComments: false,
}

function createSystem(files) {
    files = { ...files };
    return {
        // ...
        directoryExists: directory =>
        Object.keys(files).some(path => path.startsWith(directory)),
        fileExists: (filename) => {
            return true
            // console.log(filename)
            // fileName => files[fileName] != null
        },
        getCurrentDirectory: () => "/",
        readFile: (filename) => {
            if(!files[filename]){
                filename = filename.split("/node_modules")[1]
                if(!files[filename]){
                    if(!fs.existsSync(getBaseDirectory() + "/node_modules" + filename)) return
                    var text = fs.readFileSync(getBaseDirectory() + "/node_modules" + filename, {encoding:"utf-8"})
                    files[filename] = textSpanIntersectsWithPosition
                    return text;
                }
                
                // if(!fs.existsSync(filename)) return;
                // var text = fs.readdirSync(filename)
                //files[filename] = text
            }
            return files[filename]
        },
    };
}

const sys = createSystem(files)

const sourceFiles = {};
for (const name of Object.keys(files)) {
    sourceFiles[name] = ts.createSourceFile(
        name,
        files[name],
        {}
    );
}

var compilerHost = ts.createCompilerHost(compilerOptions, true);
compilerHost.readFile = sys.readFile;
compilerHost.fileExists = sys.fileExists;
compilerHost.getSourceFile = (filename) => {
    return sourceFiles[filename]
}
compilerHost.getDefaultLibFileName = () => "/lib.d.ts"

// console.log(compilerHost.readFile.toString())

// var compilerHost = {
//     ...sys,
//     getCanonicalFileName: fileName => fileName,
//     getDefaultLibFileName: () => "/lib.d.ts",
//     getDirectories: () => [],
//     getNewLine: () => sys.newLine,
//     getSourceFile: (filename) => {
//         return sourceFiles[filename]
//     },
//     useCaseSensitiveFileNames: () => sys.useCaseSensitiveFileNames,
// };

const languageServiceHost = {
    ...compilerHost,
    getCompilationSettings: () => compilerOptions,
    getScriptFileNames: () => Object.keys(files),
    getScriptSnapshot: filename => {
      const contents = sys.readFile(filename);
      if (contents) {
        return ts.ScriptSnapshot.fromString(contents);
      }
  
      return undefined;
    },
    getScriptVersion: fileName => "0",
  };

const languageService = ts.createLanguageService(languageServiceHost);
var diagnostics = languageService.getSemanticDiagnostics(FILENAME);
var d = diagnostics[0]
//console.log(diagnostics)
languageService.getCodeFixesAtPosition(
    d.file.fileName,
    d.start,
    d.start + d.length,
    [d.code],
    undefined,
    {});


// const TypeScriptCompiler = require("./typescript-compiler");

// const FILENAME = "inmemory.js";

// class MyLanguageServiceHost{
//     files = {}
//     sourceFiles = new Map();
//     log = _ => { };
//     trace = _ => { };
//     error = _ => { };
//     getCompilationSettings = ts.getDefaultCompilerOptions;
//     getScriptIsOpen = _ => true;
//     getCurrentDirectory = () => "";
//     getDefaultLibFileName = () => {return "lib"}

//     fileExists = (fileName) => {
//         return !!this.files[fileName]
//     }

//     readFile = (fileName) => {
//         return undefined
//     }

//     getScriptVersion = fileName => this.files[fileName].ver.toString();
//     getScriptSnapshot = (fileName) => {
//         var file = this.files[fileName];
//         if(file)
//             return this.files[fileName].file;
//     }

//     getScriptFileNames() {
//         var names = [];
//         for (var name in this.files) {
//             if (this.files.hasOwnProperty(name)) {
//                 names.push(name);
//             }
//         }
//         return names;
//     }

//     addFile(fileName, body) {
//         var snap = ts.ScriptSnapshot.fromString(body);
//         snap.getChangeRange = _ => undefined;
//         var existing = this.files[fileName];
//         if (existing) {
//             this.files[fileName].ver++;
//             this.files[fileName].file = snap
//           } else {
//             this.files[fileName] = { ver: 1, file: snap };
//         }

//         var sourceFile = ts.createSourceFile(fileName, body, {});
//         this.sourceFiles.set(fileName, sourceFile);
//     }

// }

// var host = new MyLanguageServiceHost();
// var languageService = ts.createLanguageService(host, ts.createDocumentRegistry());
// host.addFile(FILENAME, "consol.log()");
// var program = languageService.getProgram()
// program.getSourceFile = (fileName) => {
//     console.log("here")
//     return host.sourceFiles.get(fileName)
// }
// program.getSourceFiles = () => {
//     return Array.from(host.sourceFiles.values());
// }

// // console.log(program.getSourceFiles())

// // const diagnostics = program.getSourceFiles().map(function (file) {
// //     console.log(file)
// //     return program.getSemanticDiagnostics(file);
// //   });

// // console.log(diagnostics)
// // languageService.emit
// var output = languageService.getEmitOutput(FILENAME).outputFiles[0].text;
// console.log(output)

// // var tc = new TypeScriptCompiler();
// // tc.compile("consol.log()")
// // console.log(tc.sourceFile)

// var tc = new TypeScriptCompiler();
// tc.compile("consol.log()")