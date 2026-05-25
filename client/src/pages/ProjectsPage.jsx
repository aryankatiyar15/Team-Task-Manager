import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../api/http.js";
import { EmptyState, InlineAlert, LoadingBlock } from "../components/Feedback.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../utils/format.js";

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", memberIds: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadProjects() {
    setError("");

    try {
      const data = await request("/projects");
      setProjects(data.projects);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    if (!isAdmin) return;

    try {
      const data = await request("/users?role=Member");
      setUsers(data.users);
    } catch (_err) {
      setUsers([]);
    }
  }

  useEffect(() => {
    loadProjects();
    loadUsers();
  }, [isAdmin]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateMembers(event) {
    const memberIds = Array.from(event.target.selectedOptions).map((option) => option.value);
    setForm((current) => ({ ...current, memberIds }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await request("/projects", {
        method: "POST",
        body: form
      });
      setForm({ name: "", description: "", memberIds: [] });
      setSuccess("Project created");
      await loadProjects();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingBlock label="Loading projects..." />;
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">{isAdmin ? "Admin workspace" : "Member workspace"}</span>
          <h1>Projects</h1>
        </div>
      </header>

      <InlineAlert message={error} />
      <InlineAlert type="success" message={success} />

      {isAdmin ? (
        <form className="panel form-grid" onSubmit={handleSubmit}>
          <div className="panel-header wide">
            <h2>Create project</h2>
          </div>

          <label>
            Project name
            <input name="name" value={form.name} onChange={updateField} required />
          </label>

          <label>
            Description
            <textarea name="description" value={form.description} onChange={updateField} rows={3} />
          </label>

          <label>
            Initial members
            <select multiple value={form.memberIds} onChange={updateMembers}>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </label>

          <button className="primary-button fit" type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create project"}
          </button>
        </form>
      ) : null}

      {projects.length ? (
        <div className="project-grid">
          {projects.map((project) => (
            <Link className="project-card" to={`/projects/${project._id}`} key={project._id}>
              <div>
                <strong>{project.name}</strong>
                <p>{project.description || "No description added."}</p>
              </div>
              <span>{project.members.length} members</span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No projects found"
          description={isAdmin ? "Create the first project to begin assigning work." : "An admin must add you to a project."}
        />
      )}
    </section>
  );
}
