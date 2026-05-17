import type { SyntheticEvent } from "react";

type SpriteIconProps = {
  name: string;
  size?: number;
  className?: string;
  title?: string;
};

export function SpriteIcon({
  name,
  size = 28,
  className,
  title,
}: SpriteIconProps) {
  const baseUrl = import.meta.env.BASE_URL;
  const requestedSource = name.startsWith("/")
    ? `${baseUrl}${name.slice(1)}`
    : `${baseUrl}icons/${name}.png`;
  const genericSource = `${baseUrl}icons/Any_Generic.png`;
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
        width: size,
        height: size,
      }}
    />
  );
}
