const ts = require("typescript");
const fs = require("fs")

var filename = "test.ts"
var code = `
const fs = require("fs");

fs.read(a)

function b(){
`

var options = { 
    compilerOptions: 
    { 
        module: ts.ModuleKind.CommonJS,
        target: ["es5"],
        allowJs: true,
        checkJs:true,
        types: ["node"]
    }
};

const defaultCompilerHost = ts.createCompilerHost({});


var sourceFile = ts.createSourceFile(filename, code, {});

const customCompilerHost = {
    getSourceFile: (name, languageVersion) => {
        // console.log(name)
        if (name === filename) {
            return sourceFile;
        // else {
        //     // contents = fs.readFileSync(defaultCompilerHost.getDefaultLibLocation() + "/" + name);
        //     // return ts.createSourceFile(name, contents.toString(), {})
        // }
        }else if(name.startsWith("node_modules/@types/node")){
            return defaultCompilerHost.getSourceFile(name)
        } else {
            var dir = defaultCompilerHost.getDefaultLibLocation() + "/" + name;
            var contents;
            if(!fs.existsSync(dir)){
                if(name == "node_modules/@typescript/lib-dom.ts"){
                    name = "lib.dom.d.ts"
                    contents = fs.readFileSync(defaultCompilerHost.getDefaultLibLocation() + "/" + name);
                }
                else if(name == "node_modules/@typescript/lib-es5.ts"){
                    name = "lib.es5.d.ts"
                    contents = fs.readFileSync(defaultCompilerHost.getDefaultLibLocation() + "/" + name);
                }
                else if(name == "node_modules/@typescript/lib-webworker/importscripts.ts"){
                    name = "lib.webworker.importscripts.d.ts"
                    contents = fs.readFileSync(defaultCompilerHost.getDefaultLibLocation() + "/" + name);
                }
                else if(name == "node_modules/@typescript/lib-scripthost.ts"){
                    name = "lib.scripthost.d.ts"
                    contents = fs.readFileSync(defaultCompilerHost.getDefaultLibLocation() + "/" + name);
                }
                else{
                    return
                }
            }
            contents = fs.readFileSync(defaultCompilerHost.getDefaultLibLocation() + "/" + name);
            return ts.createSourceFile(name, contents.toString(), {})
            // var f = defaultCompilerHost.getSourceFile(
            //     name, languageVersion
            // );
            // return f;
        }
    },
    writeFile: (filename, data) => {},
    getDefaultLibFileName: (options) => {
        return "lib.d.ts"
        // return defaultCompilerHost.getDefaultLibFileName(options)
    },
    getDefaultLibLocation: ()=>{
        return defaultCompilerHost.getDefaultLibLocation()
    },
    useCaseSensitiveFileNames: () => false,
    getCanonicalFileName: filename => filename,
    getCurrentDirectory: () => "",
    getNewLine: () => "\n",
    getDirectories: () => [],
    fileExists: () => true,
    readFile: () => "",
    addFile: () => {}
};

const program = ts.createProgram(
    ["test.ts"], options.compilerOptions, customCompilerHost
);

function getDiagnostics(program){

    const diagnostics = ts.getPreEmitDiagnostics(program);

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

        if(filename != "test.ts") continue;
        console.log(message);
        console.log(`(${filename}:${line}:${character})`);
    }
}

getDiagnostics(program)

const program2 = ts.createProgram(
    ["test.ts"], options.compilerOptions, customCompilerHost
);


getDiagnostics(program2)


// console.log(ts.transpileModule("console.log(a);\n", options))

// ts.