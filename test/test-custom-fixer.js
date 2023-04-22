require("mocha");
var assert = require("assert");
const Compiler = require("../src/ts/compiler/compiler");
const Snippet = require("../src/snippet");
const CustomFixer = require("../src/custom-fixer");
const LanguageService = require("../src/ts/language-service");
const CustomFixes = require("../src/custom-fixes");

var languageService;
var fixer;

describe("CustomFixer", function () {
    this.beforeAll(()=>{
        languageService = new LanguageService();
        fixer = new CustomFixer(languageService);
    })

    describe("Error Fixes", function () {
        it("No error case", async function () {
            var code = `console.log('a');`;
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 0);
            assert.strictEqual(fixed.code, code)
        });
        it("Unfixable error", async function () {
            var code = `console.log('a'`;
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 1);
            assert.strictEqual(fixed.code, code)
        });
        it("Fix 'cannot find name'", async function () {
            var code = 
`console.log(a);`
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 0);
            assert.strictEqual(fixed.code, 
`var a = ` + CustomFixes.PLACEHOLDER_STRING + `;
console.log(a);`)
        });
    });

    describe("Insert Cases", function () {
        it("Fix when indented", async function () {
            var code = 
`function b(){
    console.log(a);
}`
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 0);
            assert.strictEqual(fixed.code, 
`function b(){
    var a = ` + CustomFixes.PLACEHOLDER_STRING + `;
    console.log(a);
}`);
        });

        it("Fix when across multiple lines", async function () {
            var code = 
`function b(){
    console.log(
        a
    );
}`
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 0);
            assert.strictEqual(fixed.code, 
`function b(){
    var a = ` + CustomFixes.PLACEHOLDER_STRING + `;
    console.log(
        a
    );
}`);
        });
    });
});