require("mocha");
var assert = require("assert");
const Compiler = require("../src/compiler/compiler");

var start = Date.now();

var compiler = new Compiler();
var pid = compiler.forked.pid;

describe("Compiler", function () {
    describe("functions", function () {
        it("Should compile code", async function () {
            var snippet = "console.log(a)";
            var result = await compiler.compile(snippet)
            assert.strictEqual(result.length, 1)
            assert.strictEqual(result[0]["message"], "Cannot find name 'a'.");
        }).timeout(20000); //initial run is slower
        it("Should be able to reuse compiler object", async function () {
            var snippet = "console.log(mocha)";
            var result = await compiler.compile(snippet)
            assert.strictEqual(result.length, 1)
            assert.strictEqual(result[0]["message"], "Cannot find name 'mocha'.");
        }); //this one should be incredibly fast
        it("Should timeout this error case", async function () {
            var snippet = '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n'+
            '!!!                         IMPORTANT NOTE                         !!!\n' +
            '!!!  MULTIPLAYER LOBBIES CREATED BY ONE ACCOUNT ARE LIMITED TO 4.  !!!\n' +
            '!!! THIS IS A WORK IN PROGRESS. THINGS MIGHT CHANGE WITHOUT NOTICE !!!\n' +
            '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!';

            try{
                var result = await compiler.compile(snippet)
                assert.fail("expected reject")
            }
            catch(e){
                assert.ok(e)
            }
        }).timeout(20000)
        it("should create new process", async function () {
            var snippet = "console.log(a)";
            var result = await compiler.compile(snippet)
            assert.strictEqual(result.length, 1)
            assert.strictEqual(result[0]["message"], "Cannot find name 'a'.");
            assert.notDeepEqual(compiler.forked.pid, pid) //pid is different
        }).timeout(20000); //initial run is slower
    });

    this.afterAll(()=>{
        compiler.close()
        console.log(Date.now()-start)
    })
});