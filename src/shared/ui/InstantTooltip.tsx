import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PowerTooltip } from "@/shared/ui/PowerTooltip";
import type { FrameworkGlossaryTooltip } from "@/utils/frameworkGlossary";
import type { PowerTooltipData } from "@/shared/utils/powerTooltip";

type TooltipContent =
  | {
      kind: "text";
      text: string;
    }
  | {
      kind: "power";
      data: PowerTooltipData;
    }
  | {
      kind: "stat";
      data: StatTooltipData;
    }
  | {
      kind: "framework";
      data: FrameworkGlossaryTooltip;
    };

type TooltipState = {
  advantageHighlightQueries: string[];
  content: TooltipContent;
  cursorX: number;
  cursorY: number;
  forceAdvancedPowerTooltip: boolean;
  left: number;
  top: number;
  positioned: boolean;
};

type StatTooltipData = {
  info: string | null;
  forms: string[];
  primaryEUs: string[];
  secondaryEUs: string[];
};

function getTooltipElement(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null;
  }

  if (target.closest("[data-no-instant-tooltip]")) {
    return null;
  }

  const element = target.closest<HTMLElement>(
    "[title], [data-power-tooltip], [data-stat-tooltip], [data-framework-tooltip]",
  );

  if (!element) {
    return null;
  }

  if (
    !element.title.trim() &&
    !element.dataset.powerTooltip &&
    !element.dataset.statTooltip &&
    !element.dataset.frameworkTooltip
  ) {
    return null;
  }

  return element;
}

function StatTooltip({ data }: { data: StatTooltipData }) {
  return (
    <div className="stat-tooltip">
      {data.info ? (
        <p className="stat-tooltip__intro">
          <strong>{data.info}</strong>
        </p>
      ) : null}
      {data.forms.length > 0 ? (
        <div className="stat-tooltip__section">
          <strong>Toggle</strong>
          <span>{data.forms.join(", ")}</span>
        </div>
      ) : null}
      {data.primaryEUs.length > 0 ? (
        <div className="stat-tooltip__section">
          <strong>Primary</strong>
          <span>{data.primaryEUs.join(", ")}</span>
        </div>
      ) : null}
      {data.secondaryEUs.length > 0 ? (
        <div className="stat-tooltip__section">
          <strong>Secondary</strong>
          <span>{data.secondaryEUs.join(", ")}</span>
        </div>
      ) : null}
    </div>
  );
}

function FrameworkTooltip({ data }: { data: FrameworkGlossaryTooltip }) {
  return (
    <div className="framework-tooltip">
      <div className="framework-tooltip__header">
        <strong>{data.framework}</strong>
      </div>

      {data.sections.map((section) => (
        <div className="framework-tooltip__section" key={section.label}>
          <strong>{section.label}</strong>
          <div className="framework-tooltip__tags">
            {section.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function releaseTooltipElement(element: HTMLElement | null) {
  if (!element) {
    return;
  }

  const storedTitle = element.dataset.instantTooltipTitle;

  if (storedTitle !== undefined) {
    if (!element.title.trim()) {
      element.title = storedTitle;
    }

    delete element.dataset.instantTooltipTitle;
  }
}

function shouldForceAdvancedPowerTooltip(element: HTMLElement) {
  return element.dataset.powerTooltipAdvanced === "true";
}

function getAdvantageHighlightQueries(element: HTMLElement) {
  const rawQueries = element.dataset.powerTooltipAdvantageQueries;

  if (!rawQueries) {
    return [];
  }

  try {
    const queries = JSON.parse(rawQueries);

    return Array.isArray(queries)
      ? queries.filter((query): query is string => typeof query === "string")
      : [];
  } catch {
    return [];
  }
}

export function InstantTooltip() {
  const activeElementRef = useRef<HTMLElement | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [showAdvancedPowerTooltip, setShowAdvancedPowerTooltip] =
    useState(false);

  useLayoutEffect(() => {
    const tooltipElement = tooltipRef.current;

    if (!tooltip || !tooltipElement) {
      return;
    }

    const margin = 12;
    const gap = 14;
    const rect = tooltipElement.getBoundingClientRect();
    const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
    const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
    const preferredLeft = tooltip.cursorX + gap;
    const preferredTop = tooltip.cursorY + gap;
    const nextLeft =
      preferredLeft > maxLeft
        ? tooltip.cursorX - rect.width - gap
        : preferredLeft;
    const nextTop =
      preferredTop > maxTop
        ? tooltip.cursorY - rect.height - gap
        : preferredTop;
    const clampedLeft = Math.min(Math.max(nextLeft, margin), maxLeft);
    const clampedTop = Math.min(Math.max(nextTop, margin), maxTop);

    if (
      clampedLeft !== tooltip.left ||
      clampedTop !== tooltip.top ||
      !tooltip.positioned
    ) {
      setTooltip((currentTooltip) =>
        currentTooltip
          ? {
              ...currentTooltip,
              left: clampedLeft,
              top: clampedTop,
              positioned: true,
            }
          : currentTooltip,
      );
    }
  }, [tooltip, showAdvancedPowerTooltip]);

  useEffect(() => {
    const hoverMediaQuery = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );

    function getTooltipContent(element: HTMLElement): TooltipContent | null {
      if (element.dataset.powerTooltip) {
        try {
          return {
            kind: "power",
            data: JSON.parse(element.dataset.powerTooltip) as PowerTooltipData,
          };
        } catch {
          // Fall back to the plain title when a malformed dataset slips through.
        }
      }

      if (element.dataset.statTooltip) {
        try {
          return {
            kind: "stat",
            data: JSON.parse(element.dataset.statTooltip) as StatTooltipData,
          };
        } catch {
          // Fall back to the plain title when a malformed dataset slips through.
        }
      }

      if (element.dataset.frameworkTooltip) {
        try {
          return {
            kind: "framework",
            data: JSON.parse(
              element.dataset.frameworkTooltip,
            ) as FrameworkGlossaryTooltip,
          };
        } catch {
          // Fall back to the plain title when a malformed dataset slips through.
        }
      }

      const text =
        element.title.trim() ||
        element.dataset.instantTooltipTitle?.trim() ||
        "";

      return text ? { kind: "text", text } : null;
    }

    function disconnectMutationObserver() {
      mutationObserverRef.current?.disconnect();
      mutationObserverRef.current = null;
    }

    function showTooltip(element: HTMLElement, x: number, y: number) {
      const content = getTooltipContent(element);

      if (!content) {
        return;
      }

      if (activeElementRef.current !== element) {
        releaseTooltipElement(activeElementRef.current);
      }

      activeElementRef.current = element;
      element.dataset.instantTooltipTitle = element.title;
      element.removeAttribute("title");

      setTooltip({
        advantageHighlightQueries: getAdvantageHighlightQueries(element),
        content,
        cursorX: x,
        cursorY: y,
        forceAdvancedPowerTooltip: shouldForceAdvancedPowerTooltip(element),
        left: x,
        top: y,
        positioned: false,
      });

      disconnectMutationObserver();
      mutationObserverRef.current = new MutationObserver(() => {
        const nextContent = getTooltipContent(element);

        if (!nextContent) {
          return;
        }

        setTooltip((currentTooltip) =>
          currentTooltip
            ? {
                ...currentTooltip,
                advantageHighlightQueries:
                  getAdvantageHighlightQueries(element),
                content: nextContent,
                forceAdvancedPowerTooltip:
                  shouldForceAdvancedPowerTooltip(element),
              }
            : currentTooltip,
        );
      });
      mutationObserverRef.current.observe(element, {
        attributeFilter: [
          "data-power-tooltip",
          "data-power-tooltip-advantage-queries",
          "data-power-tooltip-advanced",
          "data-stat-tooltip",
          "data-framework-tooltip",
          "title",
        ],
        attributes: true,
      });
    }

    function hideTooltip() {
      disconnectMutationObserver();
      releaseTooltipElement(activeElementRef.current);
      activeElementRef.current = null;
      setTooltip(null);
    }

    function clearLongPressTimeout() {
      if (longPressTimeoutRef.current !== null) {
        window.clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
    }

    function handleMouseOver(event: MouseEvent) {
      setShowAdvancedPowerTooltip(event.shiftKey);

      if (
        event.target instanceof Element &&
        event.target.closest("[data-no-instant-tooltip]")
      ) {
        hideTooltip();
        return;
      }

      const element = getTooltipElement(event.target);

      if (!element) {
        return;
      }

      showTooltip(element, event.clientX, event.clientY);
    }

    function handleMouseMove(event: MouseEvent) {
      setShowAdvancedPowerTooltip(event.shiftKey);

      if (!activeElementRef.current) {
        return;
      }

      setTooltip((currentTooltip) =>
        currentTooltip
          ? {
              ...currentTooltip,
              cursorX: event.clientX,
              cursorY: event.clientY,
            }
          : currentTooltip,
      );
    }

    function handleMouseOut(event: MouseEvent) {
      const activeElement = activeElementRef.current;

      if (!activeElement) {
        return;
      }

      if (
        event.relatedTarget instanceof Node &&
        activeElement.contains(event.relatedTarget)
      ) {
        return;
      }

      hideTooltip();
    }

    function handleFocusIn(event: FocusEvent) {
      const element = getTooltipElement(event.target);

      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      showTooltip(element, rect.left + rect.width / 2, rect.bottom);
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType === "mouse") {
        return;
      }

      clearLongPressTimeout();

      const element = getTooltipElement(event.target);

      if (!element) {
        hideTooltip();
        return;
      }

      longPressTimeoutRef.current = window.setTimeout(() => {
        showTooltip(element, event.clientX, event.clientY);
        longPressTimeoutRef.current = null;
      }, 520);
    }

    function handlePointerCancel() {
      clearLongPressTimeout();
    }

    function handlePointerUp(event: PointerEvent) {
      clearLongPressTimeout();

      if (
        event.pointerType !== "mouse" &&
        activeElementRef.current &&
        !activeElementRef.current.contains(event.target as Node)
      ) {
        hideTooltip();
      }
    }

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") {
        clearLongPressTimeout();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Shift") {
        setShowAdvancedPowerTooltip(true);
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key === "Shift") {
        setShowAdvancedPowerTooltip(false);
      }
    }

    function handleWindowBlur() {
      setShowAdvancedPowerTooltip(false);
    }

    if (hoverMediaQuery.matches) {
      document.addEventListener("mouseover", handleMouseOver);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseout", handleMouseOut);
      document.addEventListener("focusin", handleFocusIn);
      document.addEventListener("focusout", hideTooltip);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointercancel", handlePointerCancel);
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", hideTooltip);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointercancel", handlePointerCancel);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
      clearLongPressTimeout();
      disconnectMutationObserver();
      releaseTooltipElement(activeElementRef.current);
    };
  }, []);

  if (!tooltip) {
    return null;
  }

  const advantages =
    tooltip.content.kind === "power" ? tooltip.content.data.advantages ?? [] : [];
  const shouldShowAdvancedPowerTooltip =
    showAdvancedPowerTooltip || tooltip.forceAdvancedPowerTooltip;
  const hasAdvantagePanel =
    shouldShowAdvancedPowerTooltip && advantages.length > 0;

  return (
    <div
      className={
        hasAdvantagePanel
          ? "instant-tooltip instant-tooltip--with-advantages"
          : "instant-tooltip"
      }
      ref={tooltipRef}
      role="tooltip"
      style={{
        left: tooltip.left,
        top: tooltip.top,
        visibility: tooltip.positioned ? "visible" : "hidden",
      }}
    >
      {tooltip.content.kind === "power" ? (
        <PowerTooltip
          advantageHighlightQueries={tooltip.advantageHighlightQueries}
          showAdvantages={shouldShowAdvancedPowerTooltip}
          tooltip={tooltip.content.data}
        />
      ) : tooltip.content.kind === "stat" ? (
        <StatTooltip data={tooltip.content.data} />
      ) : tooltip.content.kind === "framework" ? (
        <FrameworkTooltip data={tooltip.content.data} />
      ) : (
        tooltip.content.text
      )}
    </div>
  );
}
