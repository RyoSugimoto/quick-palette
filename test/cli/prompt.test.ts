import { describe, expect, it, vi } from "vitest";
import { select, type PromptInterface } from "../../src/cli/prompt.js";

const options = [
  { label: "First", value: "first" },
  { label: "Second", value: "second" },
] as const;

describe("CLI selection", () => {
  it("uses numbered input when cursor selection is unavailable", async () => {
    const prompt: PromptInterface = {
      question: vi.fn().mockResolvedValueOnce("invalid").mockResolvedValueOnce("2"),
      close: vi.fn(),
    };

    await expect(select(prompt, "Choose:", options)).resolves.toBe("second");
    expect(prompt.question).toHaveBeenCalledTimes(2);
  });

  it("delegates to cursor selection when it is available", async () => {
    const choose = vi.fn().mockResolvedValue("second");
    const prompt: PromptInterface = {
      question: vi.fn(),
      choose,
      close: vi.fn(),
    };

    await expect(select(prompt, "Choose:", options, "first")).resolves.toBe("second");
    expect(choose).toHaveBeenCalledWith("Choose:", options, "first");
    expect(prompt.question).not.toHaveBeenCalled();
  });
});
