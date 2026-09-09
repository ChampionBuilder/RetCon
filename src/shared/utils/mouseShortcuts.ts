type MouseShortcutEvent = {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  getModifierState: (key: "AltGraph") => boolean;
};

export function isQuickUnslotClick(event: MouseShortcutEvent) {
  const isAltGraphClick =
    event.getModifierState("AltGraph") || (event.altKey && event.ctrlKey);

  return (
    (event.altKey || isAltGraphClick) &&
    !event.metaKey &&
    !event.shiftKey &&
    (isAltGraphClick || !event.ctrlKey)
  );
}

export function isForceSlotClick(event: MouseShortcutEvent) {
  return (
    event.ctrlKey &&
    event.shiftKey &&
    !event.altKey &&
    !event.metaKey &&
    !event.getModifierState("AltGraph")
  );
}

export function isPinTooltipClick(event: MouseShortcutEvent) {
  return (
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey &&
    !event.getModifierState("AltGraph")
  );
}
