import { useEffect, useState } from "react"

const EMPTY_FORM = {
  email: "",
  username: "",
  gender: "male",
  birth_date: "",
  user_type: "normal"
}

const GENDER_OPTIONS = [
  { value: "male", label: "男" },
  { value: "female", label: "女" },
  { value: "other", label: "其他" }
]

const USER_TYPE_OPTIONS = [
  { value: "normal", label: "普通用户" },
  { value: "admin", label: "管理员" }
]

const today = new Date().toLocaleDateString("en-CA")

function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content ?? ""
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken(),
      ...(options.headers ?? {})
    }
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const message = Array.isArray(data.errors) ? data.errors.join("；") : "请求失败"
    throw new Error(message)
  }

  return response.status === 204 ? null : response.json()
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const loadUsers = async () => {
    setLoading(true)
    try {
      setUsers(await api("/api/users"))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    setNotice("")

    try {
      const path = editingId ? `/api/users/${editingId}` : "/api/users"
      const method = editingId ? "PATCH" : "POST"

      await api(path, {
        method,
        body: JSON.stringify({ user: form })
      })

      setNotice(editingId ? "用户已更新" : "用户已创建")
      resetForm()
      await loadUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (user) => {
    setEditingId(user.id)
    setForm({
      email: user.email,
      username: user.username,
      gender: user.gender,
      birth_date: user.birth_date,
      user_type: user.user_type
    })
    setError("")
    setNotice("")
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`确定删除用户 ${user.username}？`)) return

    setError("")
    setNotice("")

    try {
      await api(`/api/users/${user.id}`, { method: "DELETE" })
      setNotice("用户已删除")
      if (editingId === user.id) resetForm()
      await loadUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="users-page">
      <div className="users-heading">
        <div>
          <h1>用户管理</h1>
          <p>共 {users.length} 个用户</p>
        </div>
        {editingId && (
          <button type="button" className="secondary" onClick={resetForm}>
            取消编辑
          </button>
        )}
      </div>

      {error && <p className="flash error">{error}</p>}
      {notice && <p className="flash notice">{notice}</p>}

      <form className="user-form" onSubmit={handleSubmit}>
        <h2>{editingId ? "编辑用户" : "新建用户"}</h2>

        <label>
          邮箱
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={updateField}
            placeholder="user@example.com"
          />
        </label>

        <label>
          用户名
          <input
            name="username"
            required
            maxLength="50"
            value={form.username}
            onChange={updateField}
            placeholder="username"
          />
        </label>

        <label>
          性别
          <select name="gender" value={form.gender} onChange={updateField}>
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          出生年月日
          <input
            name="birth_date"
            type="date"
            required
            max={today}
            value={form.birth_date}
            onChange={updateField}
          />
        </label>

        <label>
          用户类别
          <select name="user_type" value={form.user_type} onChange={updateField}>
            {USER_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? "保存中..." : editingId ? "保存修改" : "创建用户"}
          </button>
          {editingId && (
            <button type="button" className="secondary" onClick={resetForm}>
              取消
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p>加载中...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>邮箱</th>
                <th>用户名</th>
                <th>性别</th>
                <th>出生年月日</th>
                <th>用户类别</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6">暂无用户，先创建一个吧。</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.username}</td>
                    <td>{user.gender_label}</td>
                    <td>{user.birth_date}</td>
                    <td>
                      <span className={`badge ${user.user_type}`}>{user.user_type_label}</span>
                    </td>
                    <td className="row-actions">
                      <button type="button" className="secondary" onClick={() => startEdit(user)}>
                        编辑
                      </button>
                      <button type="button" className="danger" onClick={() => handleDelete(user)}>
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
