const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");
const { minify } = require("terser");
const { minify: minifyHtml } = require("html-minifier-terser");
const CleanCSS = require("clean-css");

const ROOT = process.cwd();

const IGNORE = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.github/**",
  "**/scripts/**"
];

async function optimizeHTML(file) {
  const source = await fs.readFile(file, "utf8");

  const output = await minifyHtml(source, {
    collapseWhitespace: true,
    collapseInlineTagWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeEmptyAttributes: true,
    useShortDoctype: true,
    minifyCSS: true,
    minifyJS: true,
    keepClosingSlash: true
  });

  await fs.writeFile(file, output, "utf8");
}

async function optimizeCSS(file) {
  const source = await fs.readFile(file, "utf8");

  const result = new CleanCSS({
    level: 2
  }).minify(source);

  if (result.errors.length) {
    throw new Error(result.errors.join("\n"));
  }

  await fs.writeFile(file, result.styles, "utf8");
}

async function optimizeJS(file) {
  const source = await fs.readFile(file, "utf8");

  const result = await minify(source, {
    ecma: 2020,
    compress: {
      passes: 2,
      dead_code: true,
      drop_debugger: true
    },
    mangle: true,
    format: {
      comments: false
    }
  });

  if (!result.code) {
    throw new Error(`Failed to optimize ${file}`);
  }

  await fs.writeFile(file, result.code, "utf8");
}

async function main() {

  const htmlFiles = glob.sync("**/*.html", {
    cwd: ROOT,
    ignore: IGNORE,
    nodir: true
  });

  const cssFiles = glob.sync("**/*.css", {
    cwd: ROOT,
    ignore: IGNORE,
    nodir: true
  });

  const jsFiles = glob.sync("**/*.js", {
    cwd: ROOT,
    ignore: IGNORE,
    nodir: true
  });

  console.log("=================================");
  console.log("Frontend Optimization Started");
  console.log("=================================");

  for (const file of htmlFiles) {
    console.log("HTML :", file);
    await optimizeHTML(path.join(ROOT, file));
  }

  for (const file of cssFiles) {
    console.log("CSS  :", file);
    await optimizeCSS(path.join(ROOT, file));
  }

  for (const file of jsFiles) {
    console.log("JS   :", file);
    await optimizeJS(path.join(ROOT, file));
  }

  console.log("");
  console.log("=================================");
  console.log("Optimization Complete");
  console.log("=================================");
  console.log(`HTML Files : ${htmlFiles.length}`);
  console.log(`CSS Files  : ${cssFiles.length}`);
  console.log(`JS Files   : ${jsFiles.length}`);
}

main().catch(err => {
  console.error("");
  console.error("Optimization failed.");
  console.error(err);
  process.exit(1);
});
