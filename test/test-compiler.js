require("mocha");
var assert = require("assert");
const Compiler = require("../src/compiler");

var compiler = new Compiler();

describe("Compiler", function () {
    describe("functions", function () {
        it("Should compile code", function () {
            var snippet = "console.log(a)";
            var result = compiler.compile(snippet);
            assert.strictEqual(result.length, 1)
            assert.strictEqual(result[0]["message"], "Cannot find name 'a'.")
        }).timeout(20000); //initial run is slower
        it("Should be able to reuse compiler object", function () {
            var snippet = "console.log(mocha)";
            var result = compiler.compile(snippet);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0]["message"], "Cannot find name 'mocha'.")
        }); //this one should be incredibly fast
    });
});