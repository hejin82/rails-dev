import { useEffect, useRef, useState } from "react"
import { HOME, executeCommand, promptFor } from "../lib/simulatedTerminal"

function Banner() {
  return (
    <div className="terminal-banner">
      <p>Welcome to rails-dev simulated terminal.</p>
      <p>This is a browser-only simulation. Commands never execute on the server.</p>
      <p>
        Type <code>help</code> to see available commands.
      </p>
    </div>
  )
}

export default function TerminalPage() {
  const [entries, setEntries] = useState([])
  const [showBanner, setShowBanner] = useState(true)
  const [cwd, setCwd] = useState(HOME)
  const [input, setInput] = useState("")
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(0)

  const inputRef = useRef(null)
  const screenRef = useRef(null)
  const nextEntryId = useRef(1)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const screen = screenRef.current
    if (screen) screen.scrollTop = screen.scrollHeight
  }, [entries, showBanner])

  const handleSubmit = (event) => {
    event.preventDefault()
    const command = input.trim()
    if (!command) return

    const result = executeCommand(command, cwd, history)

    if (result.clear) {
      setEntries([])
      setShowBanner(false)
    } else {
      setEntries((current) => [
        ...current,
        {
          id: nextEntryId.current++,
          prompt: promptFor(cwd),
          command,
          output: result.output
        }
      ])
    }

    setHistory((current) => [...current, command])
    setHistoryIndex(history.length + 1)
    setCwd(result.cwd)
    setInput("")
  }

  const handleKeyDown = (event) => {
    if (event.key === "ArrowUp") {
      event.preventDefault()
      if (history.length === 0) return

      const nextIndex = Math.max(0, historyIndex - 1)
      setHistoryIndex(nextIndex)
      setInput(history[nextIndex] ?? "")
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (history.length === 0) return

      const nextIndex = Math.min(history.length, historyIndex + 1)
      setHistoryIndex(nextIndex)
      setInput(nextIndex === history.length ? "" : history[nextIndex])
      return
    }

    if (event.ctrlKey && event.key.toLowerCase() === "l") {
      event.preventDefault()
      setEntries([])
      setShowBanner(false)
    }
  }

  return (
    <section className="terminal-page">
      <div className="terminal-heading">
        <div>
          <h1>模拟终端</h1>
          <p>在浏览器里体验一个假的 shell，支持文件和目录浏览。</p>
        </div>
        <span className="terminal-badge">SIMULATED</span>
      </div>

      <div className="terminal-window">
        <div className="terminal-titlebar">
          <span className="terminal-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="terminal-title">guest@rails-dev: ~</span>
        </div>

        <div
          className="terminal-screen"
          ref={screenRef}
          onClick={() => inputRef.current?.focus()}
        >
          {showBanner && <Banner />}

          {entries.map((entry) => (
            <div className="terminal-entry" key={entry.id}>
              <div className="terminal-command-line">
                <span className="terminal-prompt">{entry.prompt}</span>
                <span className="terminal-command">{entry.command}</span>
              </div>
              {entry.output.map((outputLine, index) => (
                <div className={`terminal-output ${outputLine.tone}`} key={index}>
                  {outputLine.text || "\u00a0"}
                </div>
              ))}
            </div>
          ))}

          <form className="terminal-input-line" onSubmit={handleSubmit}>
            <span className="terminal-prompt">{promptFor(cwd)}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Terminal command"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </form>
        </div>

        <div className="terminal-hint">↑/↓ history · Ctrl+L clear · 所有命令仅在前端模拟</div>
      </div>
    </section>
  )
}
