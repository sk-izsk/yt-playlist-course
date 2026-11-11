import { findCourse } from "@/server/repo/courses";
import { practiceOf, quizOf } from "@/server/repo/lesson-content";
import { lessonsOfCourse } from "@/server/repo/lessons";

/** The end-of-run table, printed by code so an agent doesn't spend tokens writing it. */
export const reportCourse = (token: string) => {
  const course = findCourse(token)!;
  console.log(`# ${course.title}\n#    kind   min  summary  ts  practice  quiz  answers`);
  for (const l of lessonsOfCourse(course.id)) {
    if (!l.summary) {
      console.log(`#${String(l.position).padEnd(3)} —      ${String(Math.round(l.durationSec / 60)).padStart(3)}  (no notes yet)`);
      continue;
    }
    const ts = (l.summary.match(/#t=\d+/g) ?? []).length;
    const answers = quizOf(l.id).map((q) => q.answerIndex).join(",");
    console.log(
      [
        `#${String(l.position).padEnd(3)}`,
        (l.kind ?? "").padEnd(5),
        String(Math.round(l.durationSec / 60)).padStart(4),
        String(l.summary.length).padStart(8),
        String(ts).padStart(3),
        String(practiceOf(l.id).length).padStart(9),
        String(quizOf(l.id).length).padStart(5),
        ` ${answers}`,
      ].join(" "),
    );
  }
};
