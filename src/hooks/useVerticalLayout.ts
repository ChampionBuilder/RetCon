import { useEffect, useState } from "react";

export const verticalLayoutQuery =
  "(max-width: 1100px) and (orientation: portrait)";

export function useVerticalLayout() {
  const [isVerticalLayout, setIsVerticalLayout] = useState(() =>
    window.matchMedia(verticalLayoutQuery).matches,
  );

  useEffect(() => {
    const verticalLayout = window.matchMedia(verticalLayoutQuery);
    const updateVerticalLayout = () =>
      setIsVerticalLayout(verticalLayout.matches);

    verticalLayout.addEventListener("change", updateVerticalLayout);

    return () => {
      verticalLayout.removeEventListener("change", updateVerticalLayout);
    };
  }, []);

  return isVerticalLayout;
}
