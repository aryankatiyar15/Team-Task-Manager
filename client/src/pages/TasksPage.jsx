import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../api/http.js";
import { EmptyState, InlineAlert, LoadingBlock } from "../components/Feedback.jsx";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate, getErrorMessage } from "../utils/format.js";

const statuses = ["To Do", "In Progress", "Done"];

export default function TasksPage() {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ status: "", priority: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadTasks() {
    setError("");
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);

    try {
      const query = params.toString() ? `?${params.toString()}` : "";
      const data = await request(`/tasks${query}`);
      setTasks(data.tasks);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, [filters.status, filters.priority]);

  function updateFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function updateStatus(taskId, status) {
    setSuccess("");
    setError("");

    try {
      await request(`/tasks/${taskId}/status`, {
        method: "PATCH",
        body: { status }
      });
      setSuccess("Task status updated");
      await loadTasks();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function deleteTask(taskId) {
    setSuccess("");
    setError("");

    try {
      await request(`/tasks/${taskId}`, { method: "DELETE" });
      setSuccess("Task deleted");
      await loadTasks();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) {
    return <LoadingBlock label="Loading tasks..." />;
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">{isAdmin ? "All owned project tasks" : "Assigned to me"}</span>
          <h1>Tasks</h1>
        </div>
      </header>

      <InlineAlert message={error} />
      <InlineAlert type="success" message={success} />

      <section className="panel filters">
        <label>
          Status
          <select name="status" value={filters.status} onChange={updateFilter}>
            <option value="">All</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select name="priority" value={filters.priority} onChange={updateFilter}>
            <option value="">All</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Task list</h2>
          <span>{tasks.length} results</span>
        </div>

        {tasks.length ? (
          <div className="task-list">
            {tasks.map((task) => (
              <article className={task.isOverdue ? "task-row overdue" : "task-row"} key={task._id}>
                <div className="task-main">
                  <div className="task-title-line">
                    <strong>{task.title}</strong>
                    {task.isOverdue ? <span className="overdue-pill">Overdue</span> : null}
                  </div>
                  <p>{task.description || "No description."}</p>
                  <span>
                    <Link to={`/projects/${task.project?._id}`}>{task.project?.name}</Link> - {task.assignee?.name} - Due {formatDate(task.dueDate)}
                  </span>
                </div>
                <div className="task-actions">
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                  <select
                    value={task.status}
                    onChange={(event) => updateStatus(task._id, event.target.value)}
                    aria-label={`Update ${task.title} status`}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {isAdmin ? (
                    <button className="danger-button small" type="button" onClick={() => deleteTask(task._id)}>
                      Delete
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No tasks match" description="Try clearing filters or creating a task from a project." />
        )}
      </section>
    </section>
  );
}
