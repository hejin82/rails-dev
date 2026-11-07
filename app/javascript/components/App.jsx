import { useState } from "react"

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <section className="react-card">
      <h2>React 19 已接入</h2>
      <p>这个区块由 React 渲染；Turbo 和 Stimulus 仍然保留。</p>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        点击次数：{count}
      </button>
    </section>
  )
}
