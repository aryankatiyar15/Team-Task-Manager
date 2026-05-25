import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { InlineAlert } from "../components/Feedback.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../utils/format.js";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Member"
  });
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
      await signup(form);
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
          <span className="eyebrow">Start a workspace</span>
          <h1>Create your account</h1>
          <p>Choose Admin for the assessment owner flow, or Member for the assigned-task flow.</p>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          <h2>Signup</h2>
          <InlineAlert message={error} />

          <label>
            Name
            <input name="name" value={form.name} onChange={updateField} required />
          </label>

          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={updateField} required />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              minLength={8}
              required
            />
          </label>

          <label>
            Role
            <select name="role" value={form.role} onChange={updateField}>
              <option value="Member">Member</option>
              <option value="Admin">Admin</option>
            </select>
          </label>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="form-note">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
