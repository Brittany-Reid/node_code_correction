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
];

async function main(){
    //ncc errors

    var i = 0;

    

    // var compiled = await NCC.getErrors(snippets);
    // console.log(compiled[i].errors)

    //ncc fixes
    // NCC.evaluator.fixer.deletions = false;
    // var fixed = await NCC.fix([snippets[snippets.length-1]]);
    var fixed = await NCC.fix(snippets);
    console.log(fixed[0].code)
    console.log(fixed[i].errors)

    //ncq
    // var e = new Evaluator();
    // var r = e.errors(snippets.map(s => {return new Snippet(s)}))
    // console.log(r[i].errors)
    // var r = e.fix(snippets.map(s => {return new Snippet(s)}))
    // console.log(r[i].code)
}

main();