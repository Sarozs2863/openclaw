import { findCodeRegions, isInsideCode } from "./code-regions.js";
import { stripReasoningTagsFromText } from "./reasoning-tags.js";

const MEMORY_TAG_RE = /<\s*(\/?)\s*relevant[-_]memories\b[^<>]*>/gi;
const MEMORY_TAG_QUICK_RE = /<\s*\/?\s*relevant[-_]memories\b/i;
const LEAKED_THINKING_PROCESS_RE = /^\s*(?:think\s*\n+)?thinking process\s*:/i;
const REPLY_TAG_RE = /\[\[\s*reply_to(?:_current|\s*:\s*[^\]]+)\s*\]\]/gi;
const ACTION_REPLY_MARKER_RE =
  /(?:output the response(?: with the .*? tag)?\.|(?:final\s+)?answer:|reply:)\s*/i;

function stripRelevantMemoriesTags(text: string): string {
  if (!text || !MEMORY_TAG_QUICK_RE.test(text)) {
    return text;
  }
  MEMORY_TAG_RE.lastIndex = 0;

  const codeRegions = findCodeRegions(text);
  let result = "";
  let lastIndex = 0;
  let inMemoryBlock = false;

  for (const match of text.matchAll(MEMORY_TAG_RE)) {
    const idx = match.index ?? 0;
    if (isInsideCode(idx, codeRegions)) {
      continue;
    }

    const isClose = match[1] === "/";
    if (!inMemoryBlock) {
      result += text.slice(lastIndex, idx);
      if (!isClose) {
        inMemoryBlock = true;
      }
    } else if (isClose) {
      inMemoryBlock = false;
    }

    lastIndex = idx + match[0].length;
  }

  if (!inMemoryBlock) {
    result += text.slice(lastIndex);
  }

  return result;
}

function stripLeakedThinkingProcess(text: string): string {
  if (!text || !LEAKED_THINKING_PROCESS_RE.test(text)) {
    return text;
  }

  REPLY_TAG_RE.lastIndex = 0;
  const replyTagMatches = [...text.matchAll(REPLY_TAG_RE)];
  const lastReplyTag = replyTagMatches.at(-1);
  if (lastReplyTag?.index != null) {
    return text.slice(lastReplyTag.index).trimStart();
  }

  const markerMatch = ACTION_REPLY_MARKER_RE.exec(text);
  if (markerMatch?.index != null) {
    return text.slice(markerMatch.index + markerMatch[0].length).trimStart();
  }

  return text;
}

export function stripAssistantInternalScaffolding(text: string): string {
  const withoutReasoning = stripReasoningTagsFromText(text, { mode: "preserve", trim: "start" });
  const withoutMemories = stripRelevantMemoriesTags(withoutReasoning);
  return stripLeakedThinkingProcess(withoutMemories).trimStart();
}
