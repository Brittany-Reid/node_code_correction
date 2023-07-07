require("mocha");
var assert = require("assert");
const NCC = require("../src/ncc");
const Snippet = require("../src/snippet");

var snippet_cases = {
    working: "var a = 0;",
    cant_find_name: "console.log(a)",
    compile_fail: '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n'+
            '!!!                         IMPORTANT NOTE                         !!!\n' +
            '!!!  MULTIPLAYER LOBBIES CREATED BY ONE ACCOUNT ARE LIMITED TO 4.  !!!\n' +
            '!!! THIS IS A WORK IN PROGRESS. THINGS MIGHT CHANGE WITHOUT NOTICE !!!\n' +
            '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
}

describe("NCC", function () {

    this.beforeAll(()=>{
        NCC.timeout = 10000; //10 seconds
    })

    describe("functions", async function () {
        it("should compile a set of snippets", async function () {
            var snippets = [
                snippet_cases["working"],
                snippet_cases["cant_find_name"]
            ]

            var compiled = await NCC.getErrors(snippets);
            assert.strictEqual(compiled[0].errors.length, 0)
            assert.strictEqual(compiled[1].errors.length, 1)
            assert.strictEqual(compiled[1].errors[0].message, "Cannot find name 'a'.")
        });
        it("should handle fail case", async function () {
            var snippets = [
                snippet_cases["compile_fail"]
            ]

            var compiled = await NCC.getErrors(snippets);
            assert.strictEqual(compiled[0].errors, undefined)
            assert.strictEqual(compiled[0].compileFail, true)
        }).timeout(20000);
        it("should sort correctly", async function () {
            //they are in wrong order
            var snippets = [
                snippet_cases["compile_fail"],
                snippet_cases["cant_find_name"],
                snippet_cases["working"]
            ]

            var compiled = await NCC.getErrors(snippets);
            compiled = compiled.sort(Snippet.sort);
            assert.strictEqual(compiled[0].errors.length, 0)
            assert.strictEqual(compiled[1].errors.length, 1)
            assert.strictEqual(compiled[2].errors, undefined)
            assert.strictEqual(compiled[2].compileFail, true)
        }).timeout(20000);
        it("fix snippets", async function(){
            var snippets = [
                snippet_cases["cant_find_name"]
            ]

            var fixed = await NCC.fix(snippets);
            assert.strictEqual(fixed[0].errors.length, 0)
            assert.strictEqual(fixed[0].code, 
`var a = "Your Value Here";
console.log(a)`
            )
        }).timeout(20000);
    });
})