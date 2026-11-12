interface QuizLike {
  options: string[];
  answerIndex: number;
}

/** 0,1,2,3 or 3,2,1,0: a pattern a learner spots at once. */
const isRun = (order: number[]) =>
  order.length >= 3 && [1, -1].some((d) => order.every((v, i) => i === 0 || v === order[i - 1] + d));

/**
 * Shuffles every question's options so answer positions are random, not whatever the agent
 * habitually picks (an earlier pass put every answer at A, a later one used C,A,D,B everywhere).
 * Rejects orders that are all one position, a straight run, or already used by 2+ other lessons.
 * Explanations must not name positions ("option A") since they move here.
 */
export const shuffleQuiz = <T extends QuizLike>(
  quiz: T[],
  otherOrders: string[],
  rng: () => number = Math.random,
): T[] => {
  for (let attempt = 0; attempt < 100; attempt++) {
    const out = quiz.map((q) => {
      const idx = q.options.map((_, i) => i);
      for (let i = idx.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [idx[i], idx[j]] = [idx[j], idx[i]];
      }
      return { ...q, options: idx.map((i) => q.options[i]), answerIndex: idx.indexOf(q.answerIndex) };
    });
    const order = out.map((q) => q.answerIndex);
    const reused = otherOrders.filter((o) => o === order.join(",")).length >= 2;
    if (quiz.length < 3 || (new Set(order).size > 1 && !isRun(order) && !reused)) return out;
  }
  return quiz; // ponytail: 100 tries never failed in practice; the quality check reports it if it does
};
