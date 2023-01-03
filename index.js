const Compiler = require("./src/compiler/compiler");
const Fixer = require("./src/fixer");
const Snippet = require("./src/snippet");

var compiler = new Compiler();
var fixer = new Fixer(compiler);;
var code = `router.lookup = (req, res) // -> should trigger router search and handlers execution`


async function main(){
    var e;
    try{
        var e = await compiler.compile(code);
        // var fixed = await fixer.fix(new Snippet(code));
        // e = fixed.errors;
    }catch(e){
        console.log(e)
    }

    // e = await compiler.compile("var a");
    console.log(e)

    compiler.close()
}

main();