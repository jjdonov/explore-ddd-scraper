#!/usr/bin/env node

/**
 * This is a sample HTTP server.
 * Replace this with your implementation.
 */

import "dotenv/config";
import { JSDOM } from "jsdom";
import { NodeHtmlMarkdown } from "node-html-markdown";
import fetch from "node-fetch";
import fs from "fs/promises";
import { urls as speakerUrls } from "./speakers";

type SpeakerContent = {
  speakerName: string;
  markdown: string;
};

type IndexContent = {
  speakerNames: string[];
};

export default async function main() {
  console.log(`scraping ${speakerUrls.length} urls`);

  const indexContent: IndexContent = { speakerNames: [] };
  for (const speakerUrl of speakerUrls) {
    const authorPage = await fetchSpeakerPage(speakerUrl);
    const content = parseSpeakerContent(authorPage);
    await writeSpeakerContent(content);
    indexContent.speakerNames.push(content.speakerName);
  }
  await writeIndexContent(indexContent);

  console.log("\nfin");
}

async function fetchSpeakerPage(url: string) {
  const f = await fetch(url);
  const html = await f.text();
  return html;
}

function parseSpeakerContent(authorPage: string): SpeakerContent {
  const dom = new JSDOM(authorPage);
  const speakerName =
    dom.window.document.querySelector(".speaker-header")?.textContent ??
    unknownAuthor();
  const content =
    dom.window.document.querySelector(".copy-container")?.innerHTML.trim() ??
    "";
  const markdown = NodeHtmlMarkdown.translate(content);

  return {
    speakerName,
    markdown,
  };
}

const unknownAuthorGenerator = (function* unknownAuthor() {
  let i = 0;
  while (true) {
    yield `unknown-speaker-${i}`;
  }
})();

const unknownAuthor = () => unknownAuthorGenerator.next().value;

async function writeSpeakerContent(speakerContent: SpeakerContent) {
  const path = `./md-output/${speakerContent.speakerName}.md`;
  await fs.writeFile(path, speakerContent.markdown);
  console.log(`wrote: ${path}`);
}

async function writeIndexContent(indexContent: IndexContent) {
  const path = `./md-output/explore-ddd-2024-speakers.md`;
  const content = indexContent.speakerNames.map(
    (speakerName) => `- [[${speakerName}]]`
  );
  content.unshift("# Speakers");

  await fs.writeFile(path, content.join("\n"));
  console.log(`wrote: ${path}`);
}

main();
