import { describe, expect, it, vi } from "vitest";
import {
  explorationActionForKey,
  promptAcceptedPaletteAction,
  promptBaseColor,
  promptConfigurationAction,
  promptExportCompleteAction,
  promptExportDestination,
  promptExplorationAction,
  promptHarmony,
  promptStartupMode,
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

  it("offers export after accepting an explored palette", async () => {
    const choose = vi.fn().mockResolvedValue("export");
    const prompt: PromptInterface = {
      question: vi.fn(),
      choose,
      close: vi.fn(),
    };

    await expect(promptAcceptedPaletteAction(prompt)).resolves.toBe("export");
    expect(choose).toHaveBeenCalledWith(
      "Palette accepted. What would you like to do?",
      [
        { label: "Done", value: "done" },
        { label: "Export as JSON or CSS", value: "export" },
      ],
      "done",
    );
  });
});

describe("startup and exploration prompts", () => {
  it("defaults startup to exploration", async () => {
    const choose = vi.fn().mockResolvedValue("explore");
    const prompt: PromptInterface = { question: vi.fn(), choose, close: vi.fn() };
    await expect(promptStartupMode(prompt)).resolves.toBe("explore");
    expect(choose).toHaveBeenCalledWith(
      "How would you like to start?",
      expect.arrayContaining([
        { label: "Create a custom palette", value: "configure" },
      ]),
      "explore",
    );
  });

  it("uses the numbered fallback outside a TTY", async () => {
    const prompt: PromptInterface = {
      question: vi.fn().mockResolvedValue("2"),
      close: vi.fn(),
    };
    await expect(promptExplorationAction(prompt)).resolves.toBe("next");
  });

  it("uses the injected single-key reader in a TTY", async () => {
    const readExplorationAction = vi.fn().mockResolvedValue("edit");
    const prompt: PromptInterface = {
      question: vi.fn(),
      readExplorationAction,
      close: vi.fn(),
    };
    await expect(promptExplorationAction(prompt)).resolves.toBe("edit");
    expect(readExplorationAction).toHaveBeenCalledOnce();
  });

  it.each([
    ["", "return", "accept"],
    [" ", "space", "next"],
    ["e", "e", "edit"],
    ["Q", "q", "quit"],
    ["x", "x", undefined],
  ] as const)("maps %j/%j to %j", (input, keyName, expected) => {
    expect(explorationActionForKey(input, keyName)).toBe(expected);
  });
});

describe("configuration prompts", () => {
  it("preselects and preserves the current base color", async () => {
    const choose = vi.fn().mockResolvedValue("current");
    const prompt: PromptInterface = { question: vi.fn(), choose, close: vi.fn() };

    await expect(promptBaseColor(prompt, "#2563EB")).resolves.toBe("#2563EB");
    expect(choose).toHaveBeenCalledWith(
      "How would you like to choose the base color?",
      expect.arrayContaining([
        expect.objectContaining({ value: "current" }),
      ]),
      "current",
    );
  });

  it("describes the result of each final action", async () => {
    const choose = vi.fn().mockResolvedValue("done");
    const prompt: PromptInterface = { question: vi.fn(), choose, close: vi.fn() };

    await promptConfigurationAction(prompt);

    expect(choose).toHaveBeenCalledWith(
      "Choose an action:",
      [
        { label: "Done", value: "done" },
        { label: "Export as JSON or CSS", value: "export" },
        { label: "Change palette settings", value: "edit" },
      ],
      "done",
    );
  });

  it("adds plain-language explanations to harmony choices", async () => {
    const choose = vi.fn().mockResolvedValue("analogous");
    const prompt: PromptInterface = { question: vi.fn(), choose, close: vi.fn() };

    await promptHarmony(prompt);

    expect(choose).toHaveBeenCalledWith(
      "Choose a color harmony:",
      [
        { label: "Monochrome (1 hue + neutrals)", value: "monochrome" },
        { label: "Analogous (3 neighboring hues + neutrals)", value: "analogous" },
        { label: "Complementary (2 opposite hues + neutrals)", value: "complementary" },
        { label: "Triadic (3 evenly spaced hues + neutrals)", value: "triadic" },
      ],
      undefined,
    );
  });
});

describe("export prompts", () => {
  it.each([
    ["back", { mode: "back" }],
    ["print", { mode: "print" }],
  ] as const)("returns the %s choice", async (mode, expected) => {
    const prompt: PromptInterface = {
      question: vi.fn(),
      choose: vi.fn().mockResolvedValue(mode),
      close: vi.fn(),
    };
    await expect(promptExportDestination(prompt, "css")).resolves.toEqual(expected);
  });

  it("requires a non-empty path when saving", async () => {
    const prompt: PromptInterface = {
      question: vi.fn().mockResolvedValueOnce("  ").mockResolvedValueOnce(" palette.css "),
      choose: vi.fn().mockResolvedValue("save"),
      close: vi.fn(),
    };
    await expect(promptExportDestination(prompt, "css"))
      .resolves.toEqual({ mode: "save", path: "palette.css" });
    expect(prompt.question).toHaveBeenCalledTimes(2);
  });

  it("defaults the completion action to done", async () => {
    const choose = vi.fn().mockResolvedValue("done");
    const prompt: PromptInterface = { question: vi.fn(), choose, close: vi.fn() };

    await expect(promptExportCompleteAction(prompt)).resolves.toBe("done");
    expect(choose).toHaveBeenCalledWith(
      "Export complete. What would you like to do?",
      expect.any(Array),
      "done",
    );
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
      "How should the harmony colors be adjusted?",
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
