const Compiler = require("./src/compiler/compiler");

var compiler = new Compiler();
var code = `const zerotwo = require('002');

console.log(zerotwo());
`
async function main(){
    var e;
    try{
        var e = await compiler.compile(code);
    }catch(e){
        console.log(e)
    }

    // e = await compiler.compile("var a");
    console.log(e)

    compiler.close()
}
main();
