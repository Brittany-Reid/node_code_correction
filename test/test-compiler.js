require("mocha");
var assert = require("assert");
const Compiler = require("../src/compiler");

var compiler = new Compiler();

describe("Compiler", function () {
    describe("functions", function () {
        it("Should compile code", function () {
            var snippet = "console.log(a)";
            var compiler = new Compiler();
            var result = compiler.compile(snippet);
            assert.strictEqual(result.length, 1)
        }).timeout(20000);
        it("Reusing compiler resets errors", function () {
            var snippet = "console.log(mocha)";
            var result = compiler.compile(snippet);
            assert.strictEqual(result.length, 1)
        }).timeout(20000);
    });
});