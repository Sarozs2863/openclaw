import { supportsXhigh } from "@mariozechner/pi-ai/dist/models.js";
import { describe, expect, it } from "vitest";

describe("pi-ai xhigh support", () => {
  it("supports xhigh for gpt-5.4 models", () => {
    expect(supportsXhigh({ id: "gpt-5.4", api: "openai-responses" } as never)).toBe(true);
  });
});
