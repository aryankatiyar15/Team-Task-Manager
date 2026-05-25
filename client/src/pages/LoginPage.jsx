import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { InlineAlert } from "../components/Feedback.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../utils/format.js";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-copy">
          <span className="eyebrow">College assessment app</span>
          <h1>Team Task Manager</h1>
          <p>Manage projects, assign tasks, and track role-based progress from one clean workspace.</p>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          <h2>Login</h2>
          <InlineAlert message={error} />

          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              placeholder="admin@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              placeholder="Admin@12345"
              required
            />
          </label>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="form-note">
            Need an account? <Link to="/signup">Create one</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
