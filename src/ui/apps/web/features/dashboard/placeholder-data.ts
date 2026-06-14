export const placeholderMatchHistory = [
  {
    opponent: "FC Barcelona",
    date: "May 15, 2026",
    result: "2-1",
    goals: 1,
    assists: 0,
  },
  {
    opponent: "Real Madrid",
    date: "May 10, 2026",
    result: "1-1",
    goals: 0,
    assists: 1,
  },
  {
    opponent: "Atletico Madrid",
    date: "May 5, 2026",
    result: "3-0",
    goals: 2,
    assists: 1,
  },
] as const;

export const placeholderRecentActivity = [
  { action: "Profile viewed by Liverpool FC scout", time: "2 hours ago" },
  { action: "New message from Bayern Munich", time: "5 hours ago" },
  { action: "Match highlights uploaded", time: "1 day ago" },
  { action: "Performance stats updated", time: "2 days ago" },
] as const;

export const placeholderUpcomingMatches = [
  { opponent: "Valencia CF", date: "May 22, 2026", time: "20:00" },
  { opponent: "Sevilla FC", date: "May 28, 2026", time: "18:30" },
] as const;
