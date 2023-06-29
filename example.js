const ts = require("typescript");
const NCC = require(".");
const Evaluator = require("./src/ncq/evaluator");
const Snippet = require("./src/snippet");
const LanguageService = require("./src/ts/language-service");

var snippets = [
    "    function encrypt(str) {\n      var cipher = crypto.createCipheriv('aes-256-cbc', key, iv).setAutoPadding(false);\n      str = customPadding(str);\n       var crypt = cipher.update(str, 'utf8', 'base64');\n       crypt += cipher.final(\"base64\");\n       return crypt;\n    }\n    var t = encrypt(\"dude\");",
    `const {username, email} = await prompt.get(['username', 'email']);`,
    `const { prompt } = require('enquirer');
    const question = [
      {
        type: 'input',
        name: 'username',
        message: 'What is your username?'
      },
      {
        type: 'password',
        name: 'password',
        message: 'What is your password?'
      }
    ];
    
    let answers = await prompt(question);
    console.log(answers);`,
    `(async () => {
        const questions = [{ ... }];
        const onCancel = prompt => {
          console.log('Never stop prompting!');
          return true;
        }
        const response = await prompts(questions, { onCancel });
      })();`,
  `assert(true)`,
  `import sum from './sum';\n\nit('sums numbers', () => {\n  expect(sum(1, 2)).toEqual(3);\n  expect(sum(2, 2)).toEqual(4);\n});`,
  `import sum from './sum';

  expect(sum(1, 2)).toEqual(3)
  `,
  `consle.log()`,
  `var words = s.split(",")`,
  `var s
   var words = s.split(",")`,
  `Math.pow(1, a)`,
  `Math.max(a);`,
  `function sum(num = [1, 2, 3]){
    return 1;
  }
  
  sum(a)`,
  `function sum(num = ["a", "b", "c"]){
    return 1;
  }
  
  sum(a)`,
  `sum(a)`,
  `process.removeListener("a", b)`,
  `const { ChildProcess } = require("child_process");
ChildProcess.on(a, "a")`,
`    let CheckUrl = function (url, done) {
  dns.lookup(url, function(err, address) { 
    if (err) return done(err);
    done(null, true);
  });
} 

app.post("/api/shorturl/new", async function(req, res) {
});\``,
`      const fse = require('fs-extra');
let srcDir = \`path/to/file ;
let destDir = \`pat/to/destination/diractory\`;
fse.copySync(srcDir, destDir, function (err) {
// to copy folder
    if (err) {
        console.error(err);
    } else {
        console.log("success!");
    }
});
`,
`    let p1 = getUserDatafromEnvironmentP(Dev_Environmnet, user, environmnet);
let p2 = getUserDatafromEnvironmentP(PVS_Environmnet, user, environmnet);
let p3 = getUserDatafromEnvironmentP(Prod_Environmnet, user, environmnet);
let result = Promise.all([p1, p2, p3]).then(
    function(a, b, c) {
        // a, b and c will contain the three results
        // undefined for "not used", false for "failed", true for "ok"
        .. continue with processing here
    })
);
// you can't do anything useful here because the above code is async`
  // `process.nextTick(a)`
];

async function main(){
    //ncc errors

    var i = 0;

    

    // var compiled = await NCC.getErrors(snippets);
    // console.log(compiled[i].errors)

    //ncc fixes
    // NCC.evaluator.fixer.deletions = false;
    var fixed = await NCC.fix([snippets[snippets.length-1]]);
    console.log(fixed[0])
    // console.log(fixed[i].errors)

    //ncq
    // var e = new Evaluator();
    // var r = e.errors(snippets.map(s => {return new Snippet(s)}))
    // console.log(r[i].errors)
    // var r = e.fix(snippets.map(s => {return new Snippet(s)}))
    // console.log(r[i].code)
}

main();