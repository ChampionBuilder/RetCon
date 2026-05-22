import type { SyntheticEvent } from "react";
import { publicAssetUrl } from "@/shared/utils/publicAssetUrl";

type SpriteIconProps = {
  name: string;
  size?: number;
  width?: number;
  height?: number;
  className?: string;
  title?: string;
};

export function SpriteIcon({
  name,
  size = 28,
  width,
  height,
  className,
  title,
}: SpriteIconProps) {
  const requestedSource = publicAssetUrl(
    name.startsWith("/") ? name : `/icons/${name}.png`,
  );
  const genericSource = publicAssetUrl("/icons/Any_Generic.png");
  const imageClassName = className
    ? `sprite-icon sprite-icon--image ${className}`
    : "sprite-icon sprite-icon--image";

  function handleError(event: SyntheticEvent<HTMLImageElement>) {
    if (!event.currentTarget.src.endsWith(genericSource)) {
      event.currentTarget.src = genericSource;
    }
  }

  return (
    <img
      alt=""
      className={imageClassName}
      src={requestedSource}
      onError={handleError}
      title={title}
      style={{
        width: width ?? size,
        height: height ?? size,
      }}
    />
  );
}
