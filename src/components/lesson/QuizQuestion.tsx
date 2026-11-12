import { CaretRightOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { clock } from "@/shared/format"
import type { QuizItem } from "@/shared/types"
import styles from "./lesson.module.css"

interface Props {
  index: number
  total: number
  item: QuizItem
  chosen: number | undefined
  onChoose: (option: number) => void
  seek: (sec: number) => void
}

const LETTERS = "ABCDEF"

export const QuizQuestion = ({ index, total, item: q, chosen, onChoose, seek }: Props) => {
  const answered = chosen !== undefined
  const wrong = answered && chosen !== q.answerIndex

  const state = (i: number) => {
    if (!answered) {
      return undefined
    }
    if (i === q.answerIndex) {
      return "right"
    }
    return i === chosen ? "wrong" : undefined
  }

  return (
    <div className={styles.question}>
      <span className={`${styles.qMeta} mono`}>
        Question {index + 1} of {total}
      </span>
      <h3>{q.question}</h3>
      <div className={styles.options}>
        {q.options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            className={styles.option}
            data-state={state(i)}
            disabled={answered}
            onClick={() => onChoose(i)}
          >
            <span className={styles.letter}>{LETTERS[i]}</span>
            {opt}
          </button>
        ))}
      </div>
      {answered && (
        <div className={styles.feedback} data-wrong={wrong}>
          <span>
            {wrong ? "Not quite." : "Correct."} {q.explanation}
          </span>
          {wrong && q.atSec != null && (
            <Button type="primary" size="small" icon={<CaretRightOutlined />} onClick={() => seek(q.atSec!)}>
              Replay {clock(q.atSec)} that explains it
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
