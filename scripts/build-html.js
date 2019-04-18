require('dotenv-safe').config();

const globby = require('globby');
const fs = require('fs');
const path = require('path');
const ncp = require('ncp').ncp;
const minify = require('html-minifier').minify;
ncp.limit = 16;


globby(['./src/**/*.html']).then(paths => {
  paths.forEach(filePath => {
    const outputPath = filePath.replace('/src/', '/dist/');
    ncp(filePath, outputPath, (err) => {
      if (err) {
        return console.error(err);
      }

      const htmlFile = fs.readFileSync(outputPath);

      replaceEnv(htmlFile)
        .then(replaced => Promise.resolve(minify(replaced, { collapseWhitespace: true, removeAttributeQuotes: true } )))
        .then(minified => fs.writeFileSync(outputPath, minified))
    });
  })
});

function replaceEnv(target) {
  return new Promise((resolve) => {
    resolve(target.toString()
      .replace('process.env.API_KEY', `'${process.env.API_KEY}'`)
    )});
}
