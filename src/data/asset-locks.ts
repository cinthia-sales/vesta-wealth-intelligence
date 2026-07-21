import type { ProfileId } from "@/lib/profile-derive";

const KEY = "vesta.asset.locks.v1";

type LockMap = Record<string, Record<string, string>>;

function normalizeName(name: string) {
  return name.replace(/\s+/g, " ").trim().toLowerCase();
}

function readLocks(): LockMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "{}") as LockMap;
  } catch {
    return {};
  }
}

function writeLocks(locks: LockMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(locks));
}

export function isAssetLocked(profileId: ProfileId, assetName: string) {
  const locks = readLocks();
  return Boolean(locks[profileId]?.[normalizeName(assetName)]);
}

export function getAssetLockReason(profileId: ProfileId, assetName: string) {
  const locks = readLocks();
  return locks[profileId]?.[normalizeName(assetName)] ?? "";
}

export function setAssetLocked(profileId: ProfileId, assetName: string, reason = "Decisão da Vesta após análise/breakeven") {
  const locks = readLocks();
  const profileLocks = locks[profileId] ?? {};
  profileLocks[normalizeName(assetName)] = reason;
  locks[profileId] = profileLocks;
  writeLocks(locks);
}

export function removeAssetLock(profileId: ProfileId, assetName: string) {
  const locks = readLocks();
  if (!locks[profileId]) return;
  delete locks[profileId][normalizeName(assetName)];
  writeLocks(locks);
}
