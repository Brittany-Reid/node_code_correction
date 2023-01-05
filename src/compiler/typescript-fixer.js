const ts = require("typescript");
const TypeScriptCompiler = require("./src/compiler/typescript-compiler");

const FILENAME = "inmemory.js";

class MyLanguageServiceHost{
    files = {}
    sourceFiles = new Map();
    log = _ => { };
    trace = _ => { };
    error = _ => { };
    getCompilationSettings = ts.getDefaultCompilerOptions;
    getScriptIsOpen = _ => true;
    getCurrentDirectory = () => "";
    getDefaultLibFileName = () => {return "lib"}

    fileExists = (fileName) => {
        return !!this.files[fileName]
    }

    getScriptVersion = fileName => this.files[fileName].ver.toString();
    getScriptSnapshot = (fileName) => {
        var file = this.files[fileName];
        if(file)
            return this.files[fileName].file;
    }

    getScriptFileNames() {
        var names = [];
        for (var name in this.files) {
            if (this.files.hasOwnProperty(name)) {
                names.push(name);
            }
        }
        return names;
    }

    addFile(fileName, body) {
        var snap = ts.ScriptSnapshot.fromString(body);
        snap.getChangeRange = _ => undefined;
        var existing = this.files[fileName];
        if (existing) {
            this.files[fileName].ver++;
            this.files[fileName].file = snap
          } else {
            this.files[fileName] = { ver: 1, file: snap };
        }

        var sourceFile = ts.createSourceFile(fileName, body, {});
        this.sourceFiles.set(fileName, sourceFile);
    }

}

var host = new MyLanguageServiceHost();
var languageService = ts.createLanguageService(host, ts.createDocumentRegistry());
host.addFile(FILENAME, "consol.log()");
var program = languageService.getProgram()
program.getSourceFile = (fileName) => {
    return host.sourceFiles.get(fileName)
}
program.getSourceFiles = () => {
    return Array.from(host.sourceFiles.values());
}

// console.log(program.getSourceFiles())

// const diagnostics = program.getSourceFiles().map(function (file) {
//     console.log(file)
//     return program.getSemanticDiagnostics(file);
//   });

// console.log(diagnostics)
languageService.emit
// // var output = languageService.getEmitOutput(FILENAME).outputFiles[0].text;
// // console.log(output)

var tc = new TypeScriptCompiler();
tc.compile("consol.log()")
console.log(tc.sourceFile)