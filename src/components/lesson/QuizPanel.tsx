"use client"

import { Button, Empty } from "antd"
import { useState } from "react"
import type { QuizItem } from "@/shared/types"
import { shuffleQuiz } from "@/shared/shuffle-quiz"
import { QuizQuestion } from "./QuizQuestion"
import styles from "./lesson.module.css"

export const QuizPanel = ({ items, seek }: { items: QuizItem[]; seek: (sec: number) => void }) => {
  // question index → chosen option
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [questions] = useState(() => shuffleQuiz(items, []))

  if (!questions.length) {
    return <Empty description="No quiz yet — it's written together with the notes." />
  }

  const answered = Object.keys(answers).length
  const correct = questions.filter((q, i) => answers[i] === q.answerIndex).length

  return (
    <div className={styles.quiz}>
      {questions.map((q, i) => (
        <QuizQuestion
          key={q.id}
          index={i}
          total={questions.length}
          item={q}
          chosen={answers[i]}
          onChoose={(opt) => setAnswers((a) => ({ ...a, [i]: opt }))}
          seek={seek}
        />
      ))}
      {answered === questions.length && (
        <div className={styles.score}>
          <span>
            You got <b>{correct}</b> of {questions.length}
          </span>
          <Button onClick={() => setAnswers({})}>Retry</Button>
        </div>
      )}
    </div>
  )
}
