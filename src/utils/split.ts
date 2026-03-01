function sortedIds(ids: string[]) {
  return [...ids].sort((a, b) => a.localeCompare(b));
}

export function splitEqual(amountCents: number, participantUids: string[]) {
  if (participantUids.length === 0) {
    throw new Error("At least one participant is required.");
  }

  const ids = sortedIds(participantUids);
  const base = Math.floor(amountCents / ids.length);
  let remainder = amountCents - base * ids.length;
  const result: Record<string, number> = {};

  ids.forEach((uid) => {
    const extra = remainder > 0 ? 1 : 0;
    result[uid] = base + extra;
    remainder -= extra;
  });

  return result;
}

export function splitCustom(amountCents: number, map: Record<string, number>) {
  const total = Object.values(map).reduce((sum, value) => sum + value, 0);
  if (total !== amountCents) {
    throw new Error("Custom split total must equal amount.");
  }
  return map;
}

export function splitPercent(amountCents: number, map: Record<string, number>) {
  const ids = sortedIds(Object.keys(map));
  if (ids.length === 0) {
    throw new Error("Percent split requires participants.");
  }

  const raw = ids.map((uid) => ({
    uid,
    rawCents: (amountCents * map[uid]) / 100,
  }));

  const floored = raw.map((row) => Math.floor(row.rawCents));
  let remainder = amountCents - floored.reduce((sum, value) => sum + value, 0);
  const byFraction = raw
    .map((row, index) => ({
      index,
      fraction: row.rawCents - Math.floor(row.rawCents),
      uid: row.uid,
    }))
    .sort((a, b) => {
      if (b.fraction !== a.fraction) return b.fraction - a.fraction;
      return a.uid.localeCompare(b.uid);
    });

  const final = [...floored];
  for (let i = 0; i < byFraction.length && remainder > 0; i += 1) {
    final[byFraction[i].index] += 1;
    remainder -= 1;
  }

  const result: Record<string, number> = {};
  ids.forEach((uid, index) => {
    result[uid] = final[index];
  });
  return result;
}
