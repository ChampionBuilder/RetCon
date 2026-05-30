export type FrameworkGlossarySection = {
  label: string;
  tags: string[];
};

export type FrameworkGlossaryTooltip = {
  framework: string;
  sections: FrameworkGlossarySection[];
};

const frameworkGlossaries: Record<string, FrameworkGlossaryTooltip> = {
  Ice: {
    framework: "Ice",
    sections: [
      {
        label: "Ice Structures",
        tags: ["Ice Cage", "Ice Column", "Ice Barriers"],
      },
    ],
  },
  Electricity: {
    framework: "Electricity",
    sections: [
      {
        label: "Completing a Circuit",
        tags: ["Consuming Negative Ions"],
      },
    ],
  },
  Fire: {
    framework: "Fire",
    sections: [
      {
        label: "Burning effects",
        tags: ["Clinging Flames", "Leaping Flames", "Pyre Patch", "Fire Snake"],
      },
    ],
  },
  Laser_Sword: {
    framework: "Laser Sword",
    sections: [
      {
        label: "Radiation",
        tags: ["Plasma Burn", "Burn Through", "Disintegrate", "Overheat"],
      },
    ],
  },
  Unarmed: {
    framework: "Unarmed",
    sections: [
      {
        label: "Chi Energy effects",
        tags: [
          "Chi Flame",
          "Lithe",
          "Quick Maneuvering",
          "Ebb and Flow",
          "Nimble Movements",
          "Sudden Strike",
          "Dragon Rush",
          "Bountiful Chi Resurgence",
        ],
      },
    ],
  },
  Darkness: {
    framework: "Darkness",
    sections: [
      {
        label: "Mental States",
        tags: ["Fear", "Stress", "Regret", "Dependency", "Ego Leech"],
      },
    ],
  },
  Single_Blade: {
    framework: "Single Blade",
    sections: [
      {
        label: "Wounds",
        tags: ["Shredded", "Bleed", "Open Wound", "Deep Wound", "Swallowtail Cut"],
      },
    ],
  },
  Bestial_Supernatural: {
    framework: "Bestial Supernatural",
    sections: [
      {
        label: "Wounds",
        tags: ["Shredded", "Bleed", "Open Wound", "Deep Wound", "Swallowtail Cut"],
      },
    ],
  },
  Sorcery: {
    framework: "Sorcery",
    sections: [
      {
        label: "Curses",
        tags: [
          "Jinxed",
          "Hexed",
          "Debilitating Poison",
          "Corruption",
          "Illuminated",
          "Devoid",
        ],
      },
      {
        label: "Enchantements",
        tags: ["Spellcaster toggle form", "Rune", "Illumination", "Mystified"],
      },
    ],
  },
  Infernal_Supernatural: {
    framework: "Infernal Supernatural",
    sections: [
      {
        label: "Poisons",
        tags: [
          "Deadly Poison",
          "Debilitating Poison",
          "Noxious Poison",
          "Infects",
        ],
      },
    ],
  },
};

export function getFrameworkGlossaryTooltip(frameworkId: string) {
  return frameworkGlossaries[frameworkId] ?? null;
}

export function getFrameworkGlossaryTooltipAttribute(frameworkId: string) {
  const glossary = getFrameworkGlossaryTooltip(frameworkId);

  return glossary ? JSON.stringify(glossary) : undefined;
}
