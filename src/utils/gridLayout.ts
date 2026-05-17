export function arrangeItemsByColumns<T>(items: T[], columnCount: number) {
  if (columnCount <= 1 || items.length <= 1) {
    return items;
  }

  const rowCount = Math.ceil(items.length / columnCount);
  const arrangedItems: T[] = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const item = items[columnIndex * rowCount + rowIndex];

      if (item !== undefined) {
        arrangedItems.push(item);
      }
    }
  }

  return arrangedItems;
}
