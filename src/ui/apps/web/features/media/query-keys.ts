export const mediaQueryKeys = {
  all: ["media"] as const,
  videos: () => [...mediaQueryKeys.all, "videos"] as const,
};
