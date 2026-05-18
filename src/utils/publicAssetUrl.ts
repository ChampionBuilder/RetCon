export function publicAssetUrl(path: string) {
  const baseUrl = import.meta.env.BASE_URL;
  const relativePath = path.replace(/^\/+/, "");

  return `${baseUrl}${relativePath}`;
}
