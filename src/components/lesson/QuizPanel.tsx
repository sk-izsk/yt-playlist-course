"use client"

import { Button, Empty } from "antd"
import { useState } from "react"
import type { QuizItem } from "@/shared/types"
import { QuizQuestion } from "./QuizQuestion"
import styles from "./lesson.module.css"

export const QuizPanel = ({ items, seek }: { items: QuizItem[]; seek: (sec: number) => void }) => {
  // question index → chosen option
  const [answers, setAnswers] = useState<Record<number, number>>({})

  if (!items.length) {
    return <Empty description="No quiz yet — it's written together with the notes." />
  }

  const answered = Object.keys(answers).length
  const correct = items.filter((q, i) => answers[i] === q.answerIndex).length

  return (
    <div className={styles.quiz}>
      {items.map((q, i) => (
        <QuizQuestion
          key={q.id}
          index={i}
          total={items.length}
          item={q}
          chosen={answers[i]}
          onChoose={(opt) => setAnswers((a) => ({ ...a, [i]: opt }))}
          seek={seek}
        />
      ))}
      {answered === items.length && (
        <div className={styles.score}>
          <span>
            You got <b>{correct}</b> of {items.length}
          </span>
          <Button onClick={() => setAnswers({})}>Retry</Button>
        </div>
      )}
    </div>
  )
}
