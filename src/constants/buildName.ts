export const maxBuildNameLength = 30;

export function trimBuildNameForUrl(buildName: string) {
  return buildName.slice(0, maxBuildNameLength);
}
