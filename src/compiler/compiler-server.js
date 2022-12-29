/**
 * @fileoverview The process that the compiler class communicates with.
 */

const TypeScriptCompiler = require("./typescript-compiler");

const compiler = new TypeScriptCompiler();

class CompilerServer{
    static compile(code){
        var errors = compiler.compile(code);
        return errors;
    }
}

process.on('message', (msg) => {
    var errors = CompilerServer.compile(msg);
    process.send(errors);
});