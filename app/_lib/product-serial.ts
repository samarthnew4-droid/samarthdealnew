export type ProductPostWithSerial = {
  id: string;
  created_at: string;
  serial_number: number | null;
  status?: "draft" | "live" | "over";
};

export function assignMissingProductSerialNumbers<T extends ProductPostWithSerial>(
  posts: T[],
): T[] {
  const usedSerialNumbers = new Set(
    posts.flatMap(({ serial_number }) =>
      typeof serial_number === "number" &&
      Number.isSafeInteger(serial_number) &&
      serial_number > 0
        ? [serial_number]
        : [],
    ),
  );
  const missingPosts = posts
    .filter(
      ({ serial_number }) =>
        typeof serial_number !== "number" ||
        !Number.isSafeInteger(serial_number) ||
        serial_number < 1,
    )
    .toSorted(
      (first, second) =>
        Number(first.status === "draft") - Number(second.status === "draft") ||
        first.created_at.localeCompare(second.created_at) ||
        first.id.localeCompare(second.id),
    );
  const assignedSerialNumbers = new Map<string, number>();
  let nextSerialNumber = 1;

  for (const post of missingPosts) {
    while (usedSerialNumbers.has(nextSerialNumber)) nextSerialNumber += 1;
    assignedSerialNumbers.set(post.id, nextSerialNumber);
    usedSerialNumbers.add(nextSerialNumber);
    nextSerialNumber += 1;
  }

  return posts.map((post) => ({
    ...post,
    serial_number:
      assignedSerialNumbers.get(post.id) ?? post.serial_number,
  }));
}