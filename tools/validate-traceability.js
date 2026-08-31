#!/usr/bin/env node
"use strict";

// Валидатор трассируемости требований (BR-constraint.traceability-comments).
//
// Проверяет, что каждый исходный модуль и каждый тест кодовой базы содержит
// в заголовочном комментарии ссылку на обосновывающие требования:
//   - код   (src/**/*.{ts,vue})  — строка «Трассируемость: <ID>»;
//   - тесты (src/**/*.{test,spec}.{ts,tsx}) — строка «Проверяет: <ID>».
//
// Исключения: декларации `*.d.ts`, каталоги node_modules/dist.
// Выход: 0 — все модули/тесты имеют трассировку, 1 — найдены пропуски.
//
// Использование:
//   node tools/validate-traceability.js        # просканировать src/ (по умолчанию)
//   node tools/validate-traceability.js src/frontend/src   # конкретная директория
//   npm run validate:traceability              # через npm-скрипт

const fs = require("fs");
const path = require("path");

// Каталоги, которые не сканируем (вендорный/сгенерированный контент).
const EXCLUDE_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".venv",
  ".agents",
  ".ai-factory",
]);

const DEFAULT_ROOTS = ["src"];

// Маркеры трассируемости (BR-constraint.traceability-comments).
const CODE_MARKER = "Трассируемость:";
const TEST_MARKER = "Проверяет:";

// Маркер должен находиться в заголовочном комментарии (первые строки файла).
const HEADER_LINES = 20;

function isTestFile(file) {
  return /\.(test|spec)\.(ts|tsx)$/.test(file);
}

function isSourceFile(file) {
  return /\.(ts|tsx|vue)$/.test(file) && !file.endsWith(".d.ts");
}

function collectFiles(root, out) {
  const stat = fs.statSync(root);
  if (stat.isFile()) {
    if (isSourceFile(root)) out.push(root);
    return;
  }
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      collectFiles(path.join(root, entry.name), out);
    } else if (entry.isFile() && isSourceFile(entry.name)) {
      out.push(path.join(root, entry.name));
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const roots = args.length > 0 ? args : DEFAULT_ROOTS;

  const files = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) {
      console.error(`❌ Path not found: ${root}`);
      process.exit(2);
    }
    collectFiles(root, files);
  }

  const missing = [];
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const header = content.split("\n").slice(0, HEADER_LINES).join("\n");
    const marker = isTestFile(file) ? TEST_MARKER : CODE_MARKER;
    if (!header.includes(marker)) {
      missing.push({ file, marker });
    }
  }

  if (missing.length > 0) {
    console.error(
      `\n❌ Traceability validation failed (${missing.length} / ${files.length} files):\n`,
    );
    for (const m of missing) {
      console.error(`  ${m.file}`);
      console.error(`      отсутствует «${m.marker}» в заголовочном комментарии`);
    }
    console.error("");
    process.exit(1);
  }

  const tests = files.filter(isTestFile).length;
  console.log(
    `✅ Traceability validation passed (${files.length - tests} modules, ${tests} tests).`,
  );
  process.exit(0);
}

main();
