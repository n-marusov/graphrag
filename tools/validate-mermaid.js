#!/usr/bin/env node
"use strict";

// Mermaid-валидатор для markdown-документации проекта.
//
// Находит все ```mermaid-блоки в .md-файлах и проверяет каждый синтаксическим
// парсером mermaid (mermaid.parse). Выход: 0 — все диаграммы валидны,
// 1 — хотя бы одна не проходит разбор.
//
// Использование:
//   node tools/validate-mermaid.js                 # просканировать репозиторий (по умолчанию)
//   node tools/validate-mermaid.js specs/c4        # конкретная директория
//   node tools/validate-mermaid.js foo.md          # конкретный файл
//   npm run validate:mermaid                       # через npm-скрипт

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

// DOM-шим: mermaid (v11) на этапе импорта связывает DOMPurify с глобальным
// window/document, поэтому их нужно подготовить ДО динамического импорта mermaid.
const dom = new JSDOM("<!DOCTYPE html><body></body>");
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.SVGElement = dom.window.SVGElement;

// Каталоги, которые не сканируем (вендорный/сгенерированный контент).
const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".git",
  ".venv",
  ".agents",
  ".ai-factory",
]);

// Директории по умолчанию — проектная документация с диаграммами.
const DEFAULT_ROOTS = ["specs", "src"];

const MERMAID_BLOCK_RE = /```mermaid\r?\n([\s\S]*?)```/g;

function collectMarkdownFiles(root, out) {
  const stat = fs.statSync(root);
  if (stat.isFile()) {
    if (root.endsWith(".md")) out.push(root);
    return;
  }
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      collectMarkdownFiles(path.join(root, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(path.join(root, entry.name));
    }
  }
}

function firstLine(text) {
  const lines = String(text).split("\n");
  return lines.find((l) => l.trim().length > 0) || "";
}

async function main() {
  const mermaid = (await import("mermaid")).default;
  mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });

  const args = process.argv.slice(2);
  const roots = args.length > 0 ? args : DEFAULT_ROOTS;

  const files = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) {
      console.error(`❌ Path not found: ${root}`);
      process.exit(2);
    }
    collectMarkdownFiles(root, files);
  }

  let total = 0;
  const failures = [];
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    for (const match of content.matchAll(MERMAID_BLOCK_RE)) {
      total++;
      try {
        await mermaid.parse(match[1], { suppressErrors: false });
      } catch (err) {
        failures.push({ file, message: firstLine(err.message || err) });
      }
    }
  }

  if (failures.length > 0) {
    console.error(`\n❌ Mermaid validation failed (${failures.length} / ${total} blocks):\n`);
    for (const f of failures) {
      console.error(`  ${f.file}`);
      console.error(`      ${f.message}`);
    }
    console.error("");
    process.exit(1);
  }

  console.log(`✅ Mermaid validation passed (${total} blocks in ${files.length} files).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Mermaid validation crashed:", err);
  process.exit(2);
});
