require("mocha");
var assert = require("assert");
const Evaluator = require("../src/evaluator");
const Snippet = require("../src/snippet");

/**
 * Test Evaluator class.
 */
describe("Evaluator", function () {
    describe("functions", function () {
        it("should get errors for snippets", async function () {
            var snippets = [
                new Snippet("<html>")
            ];
            var evaluator = new Evaluator();
            var evaluatedSnippets = await evaluator.errors(snippets);
            assert.strictEqual(evaluatedSnippets[0].errors.length, 3);
            assert.strictEqual(evaluatedSnippets[0].errors[0].code, 17004); //no jsx
        });
        // it("should fix snippets", function () {
        //     var snippets = [
        //         new Snippet("var b = 1")
        //     ];
        //     var evaluator = new Evaluator();
        //     var evaluatedSnippets = evaluator.fix(snippets);
        //     assert.strictEqual(evaluatedSnippets[0].code, "var b = 1;");
        // });
        // it("should handle import", function () {
        //     var snippets = [
        //         new Snippet("import 'x';")
        //     ];
        //     var evaluator = new Evaluator();
        //     var evaluatedSnippets = evaluator.fix(snippets);
        //     assert.strictEqual(evaluatedSnippets[0].code, "require('x');");
        // });
        // it("should handle single parsing error", function () {
        //     var snippets = [
        //         new Snippet(
        //             "var a;\n" +
        //             "<jsx>"
        //         )
        //     ];
        //     var evaluator = new Evaluator();
        //     var evaluatedSnippets = evaluator.fix(snippets);
        //     assert.strictEqual(evaluatedSnippets[0].code, "var a;\n// <jsx>");
        // });
    });
});