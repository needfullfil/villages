
const fs = require("fs-extra");
const path = require("path");
const { minify: terserMinify } = require("terser");
const JavaScriptObfuscator = require("javascript-obfuscator");
const { minify: minifyHtml } = require("html-minifier-terser");
const CleanCSS = require("clean-css");

const ROOT = process.cwd();

/*
 * ==========================================================
 * FILE DISCOVERY
 * ==========================================================
 */

const EXCLUDED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".github"
]);

const EXCLUDED_FILES = new Set([
  "scripts/protect.js",
  "template.html"
]);

async function discoverFiles(directory = ROOT) {
  const results = {
    html: [],
    css: [],
    js: [],
    json: []
  };

  async function walk(currentDirectory) {
    const entries = await fs.readdir(currentDirectory, {
      withFileTypes: true
    });

    for (const entry of entries) {
      const fullPath = path.join(currentDirectory, entry.name);
      const relativePath = path.relative(ROOT, fullPath);

      if (entry.isDirectory()) {
        if (EXCLUDED_DIRECTORIES.has(entry.name)) {
          continue;
        }

        await walk(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;

      const normalizedPath = relativePath
        .split(path.sep)
        .join("/");

      if (EXCLUDED_FILES.has(normalizedPath)) {
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();

      if (extension === ".html") {
        results.html.push(normalizedPath);
      } else if (extension === ".css") {
        results.css.push(normalizedPath);
      } else if (extension === ".js") {
        results.js.push(normalizedPath);
      } else if (extension === ".json") {
        results.json.push(normalizedPath);
      }
    }
  }

  await walk(directory);

  results.html.sort();
  results.css.sort();
  results.js.sort();
  results.json.sort();

  return results;
}

/*
 * ==========================================================
 * VALIDATION
 * ==========================================================
 */

async function verifyFiles(files, type) {
  for (const file of files) {
    const fullPath = path.join(ROOT, file);

    if (!(await fs.pathExists(fullPath))) {
      throw new Error(`${type} file not found: ${file}`);
    }

    const stat = await fs.stat(fullPath);

    if (!stat.isFile()) {
      throw new Error(`${type} path is not a file: ${file}`);
    }
  }
}

/*
 * ==========================================================
 * FORCE ONE PHYSICAL LINE
 * ==========================================================
 */

function forceOneLine(content) {
  return String(content)
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .trim();
}

/*
 * ==========================================================
 * ATOMIC WRITE
 * ==========================================================
 */

async function atomicWrite(file, content) {
  const tempFile = `${file}.protect.tmp`;

  await fs.writeFile(tempFile, content, "utf8");

  const stat = await fs.stat(tempFile);

  if (!stat.size) {
    throw new Error(`Generated empty file: ${file}`);
  }

  await fs.move(tempFile, file, {
    overwrite: true
  });
}

/*
 * ==========================================================
 * JAVASCRIPT PROTECTION
 * ==========================================================
 */

async function protectJavaScript(file) {
  const fullPath = path.join(ROOT, file);
  const fileName = path.basename(file).toLowerCase();

  console.log(`JS     : ${file}`);

  const source = await fs.readFile(fullPath, "utf8");

  if (!source.trim()) {
    throw new Error(`JavaScript file is empty: ${file}`);
  }

  /*
   * STEP 1 — TERSER MINIFICATION
   */

  const terserResult = await terserMinify(source, {
    ecma: 2022,

    compress: {
      passes: 3,
      dead_code: true,
      drop_debugger: true,
      conditionals: true,
      evaluate: true,
      booleans: true,
      loops: true,
      unused: true,
      hoist_funs: true,
      if_return: true,
      join_vars: true,
      reduce_funcs: true,
      reduce_vars: true,
      sequences: true,
      side_effects: true,
      switches: true,
      typeofs: true,

      unsafe: false,
      unsafe_arrows: false,
      unsafe_comps: false,
      unsafe_Function: false,
      unsafe_math: false,
      unsafe_methods: false,
      unsafe_proto: false,
      unsafe_regexp: false,
      unsafe_undefined: false
    },

    mangle: {
      toplevel: false,
      keep_classnames: false,
      keep_fnames: false,
      safari10: false
    },

    format: {
      comments: false,
      beautify: false,
      semicolons: true
    },

    sourceMap: false
  });

  if (!terserResult.code) {
    throw new Error(`Terser failed: ${file}`);
  }

  /*
   * SERVICE WORKER
   * Minification only. No obfuscation.
   */

  if (fileName === "sw.js") {
    const finalCode = forceOneLine(terserResult.code);

    await atomicWrite(fullPath, finalCode);

    const finalSource = await fs.readFile(fullPath, "utf8");

    if (!finalSource.trim()) {
      throw new Error(`Final service worker is empty: ${file}`);
    }

    if (finalSource.includes("\n") || finalSource.includes("\r")) {
      throw new Error(
        `Final service worker is not one line: ${file}`
      );
    }

    console.log(`MINIFIED SW: ${file}`);
    return;
  }

  /*
   * STEP 2 — STRONG JAVASCRIPT OBFUSCATION
   */

  const obfuscated = JavaScriptObfuscator.obfuscate(
    terserResult.code,
    {
      compact: true,
      simplify: true,

      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,

      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.20,

      identifierNamesGenerator: "hexadecimal",
      renameGlobals: false,

      stringArray: true,
      stringArrayCallsTransform: true,
      stringArrayCallsTransformThreshold: 0.75,

      stringArrayEncoding: [
        "base64"
      ],

      stringArrayIndexShift: true,
      stringArrayRotate: true,
      stringArrayShuffle: true,

      stringArrayWrappersCount: 5,
      stringArrayWrappersChainedCalls: true,
      stringArrayWrappersParametersMaxCount: 5,
      stringArrayWrappersType: "variable",

      stringArrayThreshold: 1,

      splitStrings: true,
      splitStringsChunkLength: 8,

      transformObjectKeys: true,

      unicodeEscapeSequence: true,

      target: "browser",

      debugProtection: false,

      disableConsoleOutput: false,

      selfDefending: true,

      sourceMap: false
    }
  );

  const protectedCode = obfuscated.getObfuscatedCode();

  if (!protectedCode || !protectedCode.trim()) {
    throw new Error(`Obfuscator produced empty output: ${file}`);
  }

  const finalCode = forceOneLine(protectedCode);

  await atomicWrite(fullPath, finalCode);

  const finalSource = await fs.readFile(fullPath, "utf8");

  if (!finalSource.trim()) {
    throw new Error(`Final JavaScript is empty: ${file}`);
  }

  if (finalSource.includes("\n") || finalSource.includes("\r")) {
    throw new Error(
      `Final JavaScript is not one line: ${file}`
    );
  }

  console.log(`PROTECTED: ${file}`);
}

/*
 * ==========================================================
 * CSS OPTIMIZATION
 * ==========================================================
 */

async function optimizeCSS(file) {
  const fullPath = path.join(ROOT, file);

  console.log(`CSS    : ${file}`);

  const source = await fs.readFile(fullPath, "utf8");

  if (!source.trim()) {
    throw new Error(`CSS file is empty: ${file}`);
  }

  const result = new CleanCSS({
    level: {
      1: {
        all: true
      },

      2: {
        all: true
      }
    },

    rebase: false,
    sourceMap: false
  }).minify(source);

  if (result.errors.length) {
    throw new Error(
      `CSS optimization failed for ${file}:\n${result.errors.join("\n")}`
    );
  }

  if (!result.styles || !result.styles.trim()) {
    throw new Error(
      `CSS optimization produced empty output: ${file}`
    );
  }

  const finalCSS = forceOneLine(result.styles);

  await atomicWrite(fullPath, finalCSS);

  const finalSource = await fs.readFile(fullPath, "utf8");

  if (!finalSource.trim()) {
    throw new Error(`Final CSS is empty: ${file}`);
  }

  if (finalSource.includes("\n") || finalSource.includes("\r")) {
    throw new Error(
      `Final CSS is not one line: ${file}`
    );
  }

  console.log(`OPTIMIZED: ${file}`);
}

/*
 * ==========================================================
 * HTML OPTIMIZATION
 * ==========================================================
 */

async function optimizeHTML(file) {
  const fullPath = path.join(ROOT, file);

  console.log(`HTML   : ${file}`);

  const source = await fs.readFile(fullPath, "utf8");

  if (!source.trim()) {
    throw new Error(`HTML file is empty: ${file}`);
  }

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

    keepClosingSlash: true,

    removeOptionalTags: false,
    sortAttributes: false,
    sortClassName: false,
    caseSensitive: true,

    decodeEntities: false
  });

  if (!output || !output.trim()) {
    throw new Error(
      `HTML optimization produced empty output: ${file}`
    );
  }

  const finalHTML = forceOneLine(output);

  await atomicWrite(fullPath, finalHTML);

  const finalSource = await fs.readFile(fullPath, "utf8");

  if (!finalSource.trim()) {
    throw new Error(`Final HTML is empty: ${file}`);
  }

  if (finalSource.includes("\n") || finalSource.includes("\r")) {
    throw new Error(
      `Final HTML is not one line: ${file}`
    );
  }

  console.log(`OPTIMIZED: ${file}`);
}

/*
 * ==========================================================
 * JSON COMPRESSION
 * ==========================================================
 */

async function optimizeJSON(file) {
  const fullPath = path.join(ROOT, file);

  console.log(`JSON   : ${file}`);

  const source = await fs.readFile(fullPath, "utf8");

  if (!source.trim()) {
    throw new Error(`JSON file is empty: ${file}`);
  }

  let parsed;

  try {
    parsed = JSON.parse(source);
  } catch (error) {
    throw new Error(
      `Invalid JSON: ${file}\n${error.message}`
    );
  }

  let output;

  try {
    output = JSON.stringify(parsed);
  } catch (error) {
    throw new Error(
      `JSON compression failed for ${file}\n${error.message}`
    );
  }

  if (!output || !output.trim()) {
    throw new Error(
      `JSON compression produced empty output: ${file}`
    );
  }

  const finalJSON = forceOneLine(output);

  await atomicWrite(fullPath, finalJSON);

  const finalSource = await fs.readFile(fullPath, "utf8");

  if (!finalSource.trim()) {
    throw new Error(`Final JSON is empty: ${file}`);
  }

  if (finalSource.includes("\n") || finalSource.includes("\r")) {
    throw new Error(
      `Final JSON is not one line: ${file}`
    );
  }

  try {
    JSON.parse(finalSource);
  } catch (error) {
    throw new Error(
      `Final JSON is invalid after compression: ${file}\n${error.message}`
    );
  }

  console.log(`COMPRESSED: ${file}`);
}

/*
 * ==========================================================
 * FINAL VERIFICATION
 * ==========================================================
 */

async function verifyOutput(files, type) {
  for (const file of files) {
    const fullPath = path.join(ROOT, file);

    if (!(await fs.pathExists(fullPath))) {
      throw new Error(`Missing output ${type}: ${file}`);
    }

    const source = await fs.readFile(fullPath, "utf8");

    if (!source.trim()) {
      throw new Error(`Empty output ${type}: ${file}`);
    }

    if (source.includes("\n") || source.includes("\r")) {
      throw new Error(
        `Output is NOT one line: ${file}`
      );
    }

    if (type === "JSON") {
      try {
        JSON.parse(source);
      } catch (error) {
        throw new Error(
          `Output is invalid JSON: ${file}\n${error.message}`
        );
      }
    }
  }
}

/*
 * ==========================================================
 * COMPLETE PROJECT INVENTORY
 * ==========================================================
 */

function printInventory(files) {
  const HTML_FILES = files.html;
  const CSS_FILES = files.css;
  const JS_FILES = files.js;
  const JSON_FILES = files.json;

  const SERVICE_WORKERS = JS_FILES.filter(
    file => path.basename(file).toLowerCase() === "sw.js"
  );

  const OBFUSCATED_JS = JS_FILES.filter(
    file => path.basename(file).toLowerCase() !== "sw.js"
  );

  const totalFiles =
    HTML_FILES.length +
    CSS_FILES.length +
    JS_FILES.length +
    JSON_FILES.length;

  console.log("");
  console.log("================================================");
  console.log("       VIDHWAAN COMPLETE PROJECT INVENTORY");
  console.log("================================================");

  console.log("");
  console.log("================ FILE COUNTS ==================");

  console.log(`HTML files found       : ${HTML_FILES.length}`);
  console.log(`CSS files found        : ${CSS_FILES.length}`);
  console.log(`JS files found         : ${JS_FILES.length}`);
  console.log(`JSON files found       : ${JSON_FILES.length}`);
  console.log(`JS files to obfuscate  : ${OBFUSCATED_JS.length}`);
  console.log(`SW files to minify     : ${SERVICE_WORKERS.length}`);
  console.log(`TOTAL FILES            : ${totalFiles}`);

  console.log("");
  console.log("================ HTML FILES ====================");

  HTML_FILES.forEach((file, i) => {
    console.log(`${i + 1}. ${file}`);
  });

  console.log("");
  console.log("================ CSS FILES =====================");

  CSS_FILES.forEach((file, i) => {
    console.log(`${i + 1}. ${file}`);
  });

  console.log("");
  console.log("================ JS FILES ======================");

  JS_FILES.forEach((file, i) => {
    console.log(`${i + 1}. ${file}`);
  });

  console.log("");
  console.log("================ JSON FILES ====================");

  JSON_FILES.forEach((file, i) => {
    console.log(`${i + 1}. ${file}`);
  });

  console.log("");
  console.log("=========== INVENTORY COMPLETE =================");
  console.log("");

  return {
    HTML_FILES,
    CSS_FILES,
    JS_FILES,
    JSON_FILES,
    SERVICE_WORKERS,
    OBFUSCATED_JS,
    totalFiles
  };
}

/*
 * ==========================================================
 * MAIN
 * ==========================================================
 */

async function main() {
  console.log("");
  console.log("================================================");
  console.log("        VIDHWAAN FRONTEND PROTECTION");
  console.log("================================================");
  console.log("");

  console.log("Discovering frontend files...");

  const files = await discoverFiles();

  /*
   * PRINT COMPLETE INVENTORY BEFORE VERIFICATION
   */

  const inventory = printInventory(files);

  const {
    HTML_FILES,
    CSS_FILES,
    JS_FILES,
    JSON_FILES,
    SERVICE_WORKERS,
    OBFUSCATED_JS,
    totalFiles
  } = inventory;

  if (totalFiles === 0) {
    throw new Error(
      "No .html, .css, .js or .json files were found to protect."
    );
  }

  /*
   * VERIFY ALL DISCOVERED FILES BEFORE MODIFYING ANYTHING
   */

  console.log("");
  console.log("================================================");
  console.log("          VERIFY PROJECT FILES");
  console.log("================================================");
  console.log("");

  console.log("Verifying HTML files...");
  await verifyFiles(HTML_FILES, "HTML");
  console.log("HTML verification passed.");

  console.log("");
  console.log("Verifying CSS files...");
  await verifyFiles(CSS_FILES, "CSS");
  console.log("CSS verification passed.");

  console.log("");
  console.log("Verifying JavaScript files...");
  await verifyFiles(JS_FILES, "JavaScript");
  console.log("JavaScript verification passed.");

  console.log("");
  console.log("Verifying JSON files...");
  await verifyFiles(JSON_FILES, "JSON");
  console.log("JSON verification passed.");

  console.log("");
  console.log("================================================");
  console.log("       ALL PROJECT FILES VERIFIED");
  console.log("================================================");
  console.log("");

  /*
   * HTML OPTIMIZATION
   */

  console.log("Starting HTML optimization...");

  for (const file of HTML_FILES) {
    await optimizeHTML(file);
  }

  /*
   * CSS OPTIMIZATION
   */

  console.log("");
  console.log("Starting CSS optimization...");

  for (const file of CSS_FILES) {
    await optimizeCSS(file);
  }

  /*
   * JAVASCRIPT PROTECTION
   *
   * Normal JS: Terser + Obfuscator
   * sw.js: Terser only
   */

  console.log("");
  console.log("Starting JavaScript protection...");

  for (const file of JS_FILES) {
    await protectJavaScript(file);
  }

  /*
   * JSON COMPRESSION
   */

  console.log("");
  console.log("Starting JSON compression...");

  for (const file of JSON_FILES) {
    await optimizeJSON(file);
  }

  /*
   * FINAL VERIFICATION
   */

  console.log("");
  console.log("================================================");
  console.log("          FINAL PROJECT VERIFICATION");
  console.log("================================================");
  console.log("");

  await verifyOutput(HTML_FILES, "HTML");
  await verifyOutput(CSS_FILES, "CSS");
  await verifyOutput(JS_FILES, "JavaScript");
  await verifyOutput(JSON_FILES, "JSON");

  console.log("");
  console.log("================================================");
  console.log("       ONE-LINE VERIFICATION PASSED");
  console.log("================================================");
  console.log("");

  console.log(
    "All HTML, CSS, JavaScript and JSON files are one line."
  );

  console.log("");

  console.log("================================================");
  console.log("       FRONTEND PROTECTION COMPLETE");
  console.log("================================================");
  console.log("");

  console.log(`HTML optimized      : ${HTML_FILES.length}`);
  console.log(`CSS optimized       : ${CSS_FILES.length}`);
  console.log(`JS obfuscated       : ${OBFUSCATED_JS.length}`);
  console.log(`SW minified only    : ${SERVICE_WORKERS.length}`);
  console.log(`JSON compressed     : ${JSON_FILES.length}`);
  console.log(`Total processed     : ${totalFiles}`);

  console.log("");
}

/*
 * ==========================================================
 * ERROR HANDLING
 * ==========================================================
 */

main().catch(error => {
  console.error("");
  console.error("================================================");
  console.error("       FRONTEND PROTECTION FAILED");
  console.error("================================================");
  console.error("");

  console.error(error);

  console.error("");

  process.exit(1);
});
