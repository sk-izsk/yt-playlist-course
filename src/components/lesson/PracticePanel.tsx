import { ExportOutlined } from "@ant-design/icons"
import { Collapse, Empty } from "antd"
import type { Difficulty, PracticeItem } from "@/shared/types"
import styles from "./lesson.module.css"

const ORDER: Difficulty[] = ["easy", "medium", "hard"]

export const PracticePanel = ({ items }: { items: PracticeItem[] }) => {
  if (!items.length) {
    return <Empty description="No practice yet — it's written together with the notes." />
  }

  return (
    <div className={styles.practice}>
      {ORDER.map((level) => {
        const group = items.filter((i) => i.difficulty === level)
        if (!group.length) {
          return null
        }
        return (
          <section key={level}>
            <h3 className={styles.levelHead}>
              <span className={styles.level} data-level={level}>
                {level}
              </span>
              {group.length} problem{group.length > 1 ? "s" : ""}
            </h3>
            {group.map((p) => (
              <PracticeCard key={p.id} item={p} />
            ))}
          </section>
        )
      })}
    </div>
  )
}

const PracticeCard = ({ item: p }: { item: PracticeItem }) => {
  return (
    <div className={styles.problem} data-level={p.difficulty}>
      <div className={styles.problemHead}>
        <strong>{p.title}</strong>
        {p.url && (
          <a href={p.url} target="_blank" rel="noreferrer">
            Solve <ExportOutlined />
          </a>
        )}
      </div>
      <p>{p.prompt}</p>
      {p.hint && <Collapse ghost size="small" items={[{ key: "h", label: "Hint", children: p.hint }]} />}
    </div>
  )
}
