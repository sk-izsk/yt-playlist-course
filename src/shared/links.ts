/** Pulls every YouTube link out of pasted text (one per line, comma or space separated). Order kept, duplicates dropped. */
export const extractLinks = (text: string) => {
  const found = text.match(/(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/[^\s,]+/gi) ?? []
  return [...new Set(found.map((l) => l.replace(/[).,]+$/, "")))]
}

/** "Pasted 7 lines but no link" — words that aren't links, so we can warn instead of silently dropping them. */
export const nonLinkLines = (text: string) =>
  text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/youtube\.com|youtu\.be/i.test(l))
