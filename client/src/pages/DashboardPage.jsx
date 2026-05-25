import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../api/http.js";
import { EmptyState, InlineAlert, LoadingBlock } from "../components/Feedback.jsx";
import StatCard from "../components/StatCard.jsx";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge.jsx";
import { formatDate, getErrorMessage } from "../utils/format.js";

const statuses = ["To Do", "In Progress", "Done"];

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadDashboard() {
    setError("");

    try {
      const data = await request("/dashboard");
      setDashboard(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function updateStatus(taskId, status) {
    setSuccess("");
    setError("");

    try {
      await request(`/tasks/${taskId}/status`, {
        method: "PATCH",
        body: { status }
      });
      setSuccess("Task status updated");
      await loadDashboard();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) {
    return <LoadingBlock label="Loading dashboard..." />;
  }

  const summary = dashboard?.summary;

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">{dashboard?.role} view</span>
          <h1>Dashboard</h1>
        </div>
        <Link className="secondary-button" to="/projects">
          View projects
        </Link>
      </header>

      <InlineAlert message={error} />
      <InlineAlert type="success" message={success} />

      <div className="stats-grid">
        <StatCard label="Total tasks" value={summary?.totalTasks || 0} hint="Visible to your role" />
        <StatCard label="To Do" value={summary?.tasksByStatus?.["To Do"] || 0} />
        <StatCard label="In Progress" value={summary?.tasksByStatus?.["In Progress"] || 0} />
        <StatCard label="Done" value={summary?.tasksByStatus?.Done || 0} />
        <StatCard label="Overdue" value={summary?.overdueTasks || 0} hint="Auto-calculated" />
      </div>

      <div className="two-column">
        <section className="panel">
          <div className="panel-header">
            <h2>Project progress</h2>
          </div>

          {dashboard?.projectProgress?.length ? (
            <div className="progress-list">
              {dashboard.projectProgress.map((project) => (
                <div className="progress-row" key={project._id}>
                  <div>
                    <strong>{project.name}</strong>
                    <span>
                      {project.doneTasks}/{project.totalTasks} tasks done
                    </span>
                  </div>
                  <div className="progress-track" aria-label={`${project.progress}% complete`}>
                    <span style={{ width: `${project.progress}%` }} />
                  </div>
                  <strong>{project.progress}%</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No projects yet" description="Create or join a project to see progress." />
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Tasks per user</h2>
          </div>

          {dashboard?.tasksPerUser?.length ? (
            <div className="user-task-list">
              {dashboard.tasksPerUser.map((row) => (
                <div className="user-task-row" key={row._id}>
                  <div>
                    <strong>{row.name}</strong>
                    <span>{row.email}</span>
                  </div>
                  <div className="user-task-counts">
                    <span>{row.totalTasks} total</span>
                    <span>{row.tasksByStatus.Done} done</span>
                    <span>{row.overdueTasks} overdue</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No user task data" description="Assigned tasks will create the user breakdown." />
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2>Upcoming tasks</h2>
        </div>

        {dashboard?.upcomingTasks?.length ? (
          <div className="task-list compact">
            {dashboard.upcomingTasks.map((task) => (
              <article className={task.isOverdue ? "task-row overdue" : "task-row"} key={task._id}>
                <div>
                  <div className="task-title-line">
                    <strong>{task.title}</strong>
                    {task.isOverdue ? <span className="overdue-pill">Overdue</span> : null}
                  </div>
                  <span>
                    {task.project?.name} - Due {formatDate(task.dueDate)}
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
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No assigned tasks" description="Tasks assigned to you will appear here." />
        )}
      </section>
    </section>
  );
}
