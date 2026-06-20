import { describe, expect, it, vi } from "vitest";
import {
  promptCssOutput,
  promptHarmonyTuning,
  select,
  type PromptInterface,
} from "../../src/cli/prompt.js";

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

describe("CSS output prompt", () => {
  it.each([
    ["skip", { mode: "skip" }],
    ["print", { mode: "print" }],
  ] as const)("returns the %s choice", async (mode, expected) => {
    const prompt: PromptInterface = {
      question: vi.fn(),
      choose: vi.fn().mockResolvedValue(mode),
      close: vi.fn(),
    };
    await expect(promptCssOutput(prompt)).resolves.toEqual(expected);
  });

  it("requires a non-empty path when saving", async () => {
    const prompt: PromptInterface = {
      question: vi.fn().mockResolvedValueOnce("  ").mockResolvedValueOnce(" palette.css "),
      choose: vi.fn().mockResolvedValue("save"),
      close: vi.fn(),
    };
    await expect(promptCssOutput(prompt)).resolves.toEqual({ mode: "save", path: "palette.css" });
    expect(prompt.question).toHaveBeenCalledTimes(2);
  });
});

describe("harmony tuning prompt", () => {
  it("uses mechanical as the default", async () => {
    const choose = vi.fn().mockResolvedValue("mechanical");
    const prompt: PromptInterface = {
      question: vi.fn(),
      choose,
      close: vi.fn(),
    };

    await expect(promptHarmonyTuning(prompt)).resolves.toBe("mechanical");
    expect(choose).toHaveBeenCalledWith(
      "Choose harmony tuning:",
      expect.any(Array),
      "mechanical",
    );
  });

  it.each(["ui", "branding", "data-visualization"] as const)(
    "returns the %s purpose",
    async (purpose) => {
      const prompt: PromptInterface = {
        question: vi.fn(),
        choose: vi.fn().mockResolvedValue(purpose),
        close: vi.fn(),
      };
      await expect(promptHarmonyTuning(prompt)).resolves.toBe(purpose);
    },
  );
});
