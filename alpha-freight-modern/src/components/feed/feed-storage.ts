export const getFeedStorageScope = (role: "carrier" | "supplier", userEmail?: string) =>
  `${role}:${(userEmail || "guest").trim().toLowerCase() || "guest"}`;

const FEED_MEDIA_DB_NAME = "alpha-freight-feed-media";
const FEED_MEDIA_STORE_NAME = "uploaded-media";

type StoredMediaRecord = {
  id: string;
  file: Blob;
  fileName: string;
  contentType: string;
  createdAt: number;
};

type HydratableMediaItem = {
  imageSrc?: string;
  videoSrc?: string;
  thumbnailSrc?: string;
  imageStorageKey?: string;
  videoStorageKey?: string;
  thumbnailStorageKey?: string;
};

export const getCustomFeedPostsStorageKey = (
  role: "carrier" | "supplier",
  userEmail?: string
) => `alpha-freight:custom-feed-posts:${getFeedStorageScope(role, userEmail)}`;

export const getCustomReelsStorageKey = (
  role: "carrier" | "supplier",
  userEmail?: string
) => `alpha-freight:custom-reels:${getFeedStorageScope(role, userEmail)}`;

export const getDiscoveryFeedPostsStorageKey = () => "alpha-freight:discovery-feed-posts";

export const getDiscoveryReelsStorageKey = () => "alpha-freight:discovery-reels";

const CUSTOM_FEED_POSTS_PREFIX = "alpha-freight:custom-feed-posts:";
const CUSTOM_REELS_PREFIX = "alpha-freight:custom-reels:";

const dedupeStoredItems = <T extends { distributionId?: string; author?: string; content?: string; title?: string }>(
  items: T[]
) => {
  const itemMap = new Map<string, T>();

  items.forEach((item, index) => {
    const dedupeKey =
      item.distributionId?.trim() ||
      `${item.author || "author"}:${item.content || item.title || index}`;
    itemMap.set(dedupeKey, item);
  });

  return [...itemMap.values()];
};

export const readAllNetworkFeedPosts = <T extends { distributionId?: string; author?: string; content?: string }>() => {
  if (typeof window === "undefined") return [] as T[];

  const collected: T[] = [
    ...readStoredCollection<T>(getDiscoveryFeedPostsStorageKey()),
  ];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const storageKey = window.localStorage.key(index);
    if (!storageKey?.startsWith(CUSTOM_FEED_POSTS_PREFIX)) continue;
    collected.push(...readStoredCollection<T>(storageKey));
  }

  return dedupeStoredItems(collected);
};

export const readAllNetworkReels = <
  T extends { distributionId?: string; author?: string; title?: string; caption?: string },
>() => {
  if (typeof window === "undefined") return [] as T[];

  const collected: T[] = [
    ...readStoredCollection<T>(getDiscoveryReelsStorageKey()),
  ];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const storageKey = window.localStorage.key(index);
    if (!storageKey?.startsWith(CUSTOM_REELS_PREFIX)) continue;
    collected.push(...readStoredCollection<T>(storageKey));
  }

  return dedupeStoredItems(collected);
};

export const getViewerInterestProfileStorageKey = (
  role: "carrier" | "supplier",
  userEmail?: string
) => `alpha-freight:viewer-interest-profile:${getFeedStorageScope(role, userEmail)}`;

const openFeedMediaDatabase = async () => {
  if (typeof window === "undefined" || !("indexedDB" in window)) return null;

  return await new Promise<IDBDatabase | null>((resolve, reject) => {
    const request = window.indexedDB.open(FEED_MEDIA_DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(FEED_MEDIA_STORE_NAME)) {
        database.createObjectStore(FEED_MEDIA_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
};

export const storeUploadedMedia = async (storageKey: string, file: File | Blob, fileName?: string) => {
  const database = await openFeedMediaDatabase();
  if (!database) return false;

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(FEED_MEDIA_STORE_NAME, "readwrite");
    const store = transaction.objectStore(FEED_MEDIA_STORE_NAME);
    const payload: StoredMediaRecord = {
      id: storageKey,
      file,
      fileName: fileName || (file instanceof File ? file.name : "upload"),
      contentType: file.type || "application/octet-stream",
      createdAt: Date.now(),
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    store.put(payload);
  });

  database.close();
  return true;
};

export const deleteStoredMedia = async (storageKey?: string) => {
  if (!storageKey) return false;

  const database = await openFeedMediaDatabase();
  if (!database) return false;

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(FEED_MEDIA_STORE_NAME, "readwrite");
    const store = transaction.objectStore(FEED_MEDIA_STORE_NAME);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    store.delete(storageKey);
  });

  database.close();
  return true;
};

export const resolveStoredMediaUrl = async (storageKey: string) => {
  const database = await openFeedMediaDatabase();
  if (!database) return null;

  const record = await new Promise<StoredMediaRecord | null>((resolve, reject) => {
    const transaction = database.transaction(FEED_MEDIA_STORE_NAME, "readonly");
    const store = transaction.objectStore(FEED_MEDIA_STORE_NAME);
    const request = store.get(storageKey);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result as StoredMediaRecord | undefined;
      resolve(result || null);
    };
  });

  database.close();

  if (!record?.file) return null;
  return URL.createObjectURL(record.file);
};

export const hydrateStoredMediaUrls = async <T extends HydratableMediaItem>(items: T[]) => {
  const generatedObjectUrls: string[] = [];

  const hydratedItems = await Promise.all(
    items.map(async (item) => {
      const nextItem = { ...item };

      if (item.imageStorageKey) {
        const resolvedImageUrl = await resolveStoredMediaUrl(item.imageStorageKey);
        if (resolvedImageUrl) {
          nextItem.imageSrc = resolvedImageUrl;
          generatedObjectUrls.push(resolvedImageUrl);
        }
      }

      if (item.videoStorageKey) {
        const resolvedVideoUrl = await resolveStoredMediaUrl(item.videoStorageKey);
        if (resolvedVideoUrl) {
          nextItem.videoSrc = resolvedVideoUrl;
          generatedObjectUrls.push(resolvedVideoUrl);
        }
      }

      if (item.thumbnailStorageKey) {
        const resolvedThumbnailUrl = await resolveStoredMediaUrl(item.thumbnailStorageKey);
        if (resolvedThumbnailUrl) {
          nextItem.thumbnailSrc = resolvedThumbnailUrl;
          generatedObjectUrls.push(resolvedThumbnailUrl);
        }
      }

      return nextItem;
    })
  );

  return {
    items: hydratedItems,
    generatedObjectUrls,
  };
};

export const revokeGeneratedObjectUrls = (urls: string[]) => {
  urls.forEach((url) => {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  });
};

export const readStoredCollection = <T,>(storageKey: string): T[] => {
  if (typeof window === "undefined") return [];

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    const parsedValue = rawValue ? (JSON.parse(rawValue) as unknown) : [];

    return Array.isArray(parsedValue) ? (parsedValue as T[]) : [];
  } catch {
    return [];
  }
};

export const writeStoredCollection = <T,>(storageKey: string, value: T[]) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(storageKey, JSON.stringify(value));
};

export const getProfileFollowersStorageKey = (profileIdentityKey: string) =>
  `alpha-freight:profile-followers:${profileIdentityKey.trim().toLowerCase()}`;

export const readProfileFollowerKeys = (profileIdentityKey: string): string[] => {
  if (!profileIdentityKey.trim()) return [];

  return readStoredCollection<string>(getProfileFollowersStorageKey(profileIdentityKey));
};

export const setProfileFollowerKeys = (profileIdentityKey: string, followerKeys: string[]): number => {
  if (!profileIdentityKey.trim()) return 0;

  const normalizedFollowerKeys = [...new Set(followerKeys.map((key) => key.trim().toLowerCase()).filter(Boolean))];
  writeStoredCollection(getProfileFollowersStorageKey(profileIdentityKey), normalizedFollowerKeys);

  return normalizedFollowerKeys.length;
};

export const dispatchFeedContentUpdated = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("alpha_feed_content_updated"));
};

export const toggleProfileFollower = (
  profileIdentityKey: string,
  followerIdentityKey: string,
  shouldFollow: boolean
): number => {
  if (!profileIdentityKey.trim() || !followerIdentityKey.trim()) return 0;

  const normalizedFollowerKey = followerIdentityKey.trim().toLowerCase();
  const currentFollowers = readProfileFollowerKeys(profileIdentityKey);
  const nextFollowers = shouldFollow
    ? currentFollowers.includes(normalizedFollowerKey)
      ? currentFollowers
      : [...currentFollowers, normalizedFollowerKey]
    : currentFollowers.filter((key) => key !== normalizedFollowerKey);

  return setProfileFollowerKeys(profileIdentityKey, nextFollowers);
};

export const getLikedPostsStorageKey = (
  role: "carrier" | "supplier",
  userEmail?: string,
  userId?: string
) => {
  const scope = userId?.trim() || userEmail?.trim().toLowerCase() || "guest";
  return `alpha-freight:liked-posts:${role}:${scope}`;
};

export const readLikedDistributionIds = (
  role: "carrier" | "supplier",
  userEmail?: string,
  userId?: string
): string[] => {
  return readStoredCollection<string>(getLikedPostsStorageKey(role, userEmail, userId))
    .map((value) => value.trim())
    .filter(Boolean);
};

export const writeLikedDistributionIds = (
  role: "carrier" | "supplier",
  userEmail: string | undefined,
  userId: string | undefined,
  distributionIds: string[]
) => {
  writeStoredCollection(
    getLikedPostsStorageKey(role, userEmail, userId),
    [...new Set(distributionIds.map((value) => value.trim()).filter(Boolean))]
  );
};

export const setLikedDistributionId = (
  role: "carrier" | "supplier",
  userEmail: string | undefined,
  userId: string | undefined,
  distributionId: string,
  liked: boolean
) => {
  const normalizedId = distributionId.trim();
  if (!normalizedId) return;

  const current = new Set(readLikedDistributionIds(role, userEmail, userId));
  if (liked) {
    current.add(normalizedId);
  } else {
    current.delete(normalizedId);
  }

  writeLikedDistributionIds(role, userEmail, userId, [...current]);
};
