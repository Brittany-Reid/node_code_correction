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

        it("Fix 'cannot find name' for stdlib", async function(){
            //example snippet from dataset:
            var code = 
`    fs.writeFile("/tmp/test", "Hey there!", function(err) {
        if(err) {
            sys.puts(err);
        } else {
            sys.puts("The file was saved!");
        }
    });`
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 0);
            assert.strictEqual(fixed.code, 
`const sys = require("sys");
const fs = require("fs");
    fs.writeFile("/tmp/test", "Hey there!", function(err) {
        if(err) {
            sys.puts(err);
        } else {
            sys.puts("The file was saved!");
        }
    });`
            )

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

        it("Fix 'cannot find name (suggestion)'", async function () {
            var code = 
`json.substring(0, 1)`
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 0);
            assert.strictEqual(fixed.code, 
`var json = ` + CustomFixes.PLACEHOLDER_STRING + `;
json.substring(0, 1)`)
        });
        it("Ignore 'cannot find name (suggestion)' where not string", async function () {
            var code = `json.parse("{}");`;
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 1);
            assert.strictEqual(fixed.code, `json.parse("{}");`)
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

        //preferably we could detect this isn't node.js but we shouldn't insert mid line
        //for some reason this case detects as statement start not on its own line
        it("Don't insert midline", async function () {
            var code = 
`sudo install`
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 1);
//there will be an indent from the space between but this doesn't effect functionality
            assert.strictEqual(fixed.code, 
`var sudo = ` + CustomFixes.PLACEHOLDER_STRING + `
 var install = ` + CustomFixes.PLACEHOLDER_STRING + `
sudo install`);
        });

        it("Handle left-side", async function () {
            var code = 
`a = "a";`
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 0);
//there will be an indent from the space between but this doesn't effect functionality
            assert.strictEqual(fixed.code, 
`var a;
a = "a";`);
        });

    });
});