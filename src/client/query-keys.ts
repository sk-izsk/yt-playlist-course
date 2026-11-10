export const qk = {
  courses: ["courses"] as const,
  course: (token: string) => ["course", token] as const,
  lesson: (token: string) => ["lesson", token] as const,
  notifications: ["notifications"] as const,
};
