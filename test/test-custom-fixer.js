require("mocha");
var assert = require("assert");
const Compiler = require("../src/ts/compiler/compiler");
const Snippet = require("../src/snippet");
const CustomFixer = require("../src/custom-fixer");
const LanguageService = require("../src/ts/language-service");
const CustomFixes = require("../src/custom-fixes");
const _ = require("lodash");

var languageService;
var fixer;

describe("CustomFixer", function () {
    this.beforeAll(()=>{
        languageService = new LanguageService();
        fixer = new CustomFixer(languageService);
    })

    describe("Functions", function () {
        it("makeErrorLineMap for undefined", async function () {
            var code = `;`;
            var snippet = new Snippet(code);
            snippet = fixer.makeErrorLineMap(snippet);
            assert(_.isEmpty(snippet.lineMap));
        });
    });

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
    });`;
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
        it("Fix 'cannot find name' where number'", async function () {
            var code = 
`Math.pow(1, a);`
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 0);
            assert.strictEqual(fixed.code, 
`var a = ` + CustomFixes.PLACEHOLDER_NUMBER + `;
Math.pow(1, a);`)
        });
        it("Fix 'cannot find name' where num array", async function () {
            var code = 
//i cant think of any examples that take an array
`function sum(num = [1, 2, 3]){
    return 1;
}

sum(a);`
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 0);
            assert.strictEqual(fixed.code, 
`function sum(num = [1, 2, 3]){
    return 1;
}

var a = ` + CustomFixes.PLACEHOLDER_NUMBER_ARRAY + `;

sum(a);`)
        });
        it("Fix 'cannot find name' where string array", async function () {
            var code = 
//i cant think of any examples that take an array
`function sum(num = ["a", "b", "c"]){
    return 1;
}

sum(a);`
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 0);
            assert.strictEqual(fixed.code, 
`function sum(num = ["a", "b", "c"]){
    return 1;
}

var a = ` + CustomFixes.PLACEHOLDER_STRING_ARRAY + `;

sum(a);`)
         });
        //spread array returns type array so we need to handle detecting ...
        it("Fix 'cannot find name' where spread array but value should be number", async function () {
            var code = 
`Math.max(a);`
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 0);
            assert.strictEqual(fixed.code, 
`var a = ` + CustomFixes.PLACEHOLDER_NUMBER + `;
Math.max(a);`)
        });
        it("Fix 'cannot find name' where no types", async function () {
            //ensure placeholder even with undefined functions
            var code = 
`s(a)`
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 1);
            assert.strictEqual(fixed.code, 
`var a = ` + CustomFixes.PLACEHOLDER_STRING + `;
s(a)`)
        });
        it("Fix `cannot find name' with type suggestion", async function (){
            var code = 
`const { ChildProcess } = require("child_process");
ChildProcess.on(a, "a")`
            var result = 
`const { ChildProcess } = require("child_process");
var a = "Your Value Here"; // Suggested Type: EventEmitter
ChildProcess.on(a, "a")`
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 1);
            assert.strictEqual(fixed.code, result)

        })

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
        it("Ignore 'cannot find name (suggestion)' where not code", async function () {
            var code = `Abbey <-> 4C4F56\n`;
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 5);
            assert.strictEqual(fixed.code, `Abbey <-> 4C4F56\n`)
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
        //this case no longer represents midline insert as we fixed the incorrect error
//         it("Don't insert midline", async function () {
//             var code = 
// `sudo install`
//             var snippet = new Snippet(code);
//             var fixed = await fixer.fix(snippet);
//             assert.strictEqual(fixed.errors.length, 1);
// //there will be an indent from the space between but this doesn't effect functionality
//             assert.strictEqual(fixed.code, 
// `var sudo = ` + CustomFixes.PLACEHOLDER_STRING + `
//  var install = ` + CustomFixes.PLACEHOLDER_STRING + `
// sudo install`);
//         });

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

        
        it("Fix when space before newline", async function (){
            //in some cases the error persists and we get infinite definitions
            //in this case its placed incorrectly but we should still avoid the infinite error
            var code = 
`    let CheckUrl = function (url, done) {
    dns.lookup(url, function(err, address) { 
        if (err) return done(err);
        done(null, true);
    });
    } 

    app.post("/api/shorturl/new", async function(req, res) {
    });\``
            var result = 
`const dns = require("dns");
    let CheckUrl = function (url, done) {
    dns.lookup(url, function(err, address) { 
        if (err) return done(err);
        done(null, true);
    });
    } 
 
    var app = "Your Value Here";

    app.post("/api/shorturl/new", async function(req, res) {
    });\``
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 2);
            assert.strictEqual(fixed.code, result)

        })

    });
});