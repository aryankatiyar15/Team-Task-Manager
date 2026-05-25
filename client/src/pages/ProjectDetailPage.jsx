import { Pencil, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { request } from "../api/http.js";
import { EmptyState, InlineAlert, LoadingBlock } from "../components/Feedback.jsx";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate, getErrorMessage, toDateInputValue } from "../utils/format.js";

const emptyTaskForm = {
  title: "",
  description: "",
  assigneeId: "",
  dueDate: "",
  priority: "Medium",
  status: "To Do"
};

const statuses = ["To Do", "In Progress", "Done"];
const priorities = ["Low", "Medium", "High"];

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadProject() {
    setError("");

    try {
      const data = await request(`/projects/${projectId}`);
      setProject(data.project);
      setTasks(data.tasks);
      setProjectForm({
        name: data.project.name,
        description: data.project.description || ""
      });
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
    loadProject();
    loadUsers();
  }, [projectId, isAdmin]);

  const assignees = useMemo(() => {
    if (!project) return [];
    const people = [project.owner, ...project.members];
    const seen = new Set();
    return people.filter((person) => {
      if (!person || seen.has(person._id)) return false;
      seen.add(person._id);
      return true;
    });
  }, [project]);

  const availableMembers = useMemo(() => {
    if (!project) return [];
    const memberIds = new Set(project.members.map((member) => member._id));
    memberIds.add(project.owner._id);
    return users.filter((user) => !memberIds.has(user._id));
  }, [project, users]);

  function updateProjectField(event) {
    setProjectForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateTaskField(event) {
    setTaskForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function resetTaskForm() {
    setTaskForm(emptyTaskForm);
    setEditingTaskId(null);
  }

  async function saveProject(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await request(`/projects/${projectId}`, {
        method: "PATCH",
        body: projectForm
      });
      setSuccess("Project updated");
      await loadProject();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject() {
    const confirmed = window.confirm("Delete this project and all related tasks?");
    if (!confirmed) return;

    try {
      await request(`/projects/${projectId}`, { method: "DELETE" });
      navigate("/projects");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function addMember(event) {
    event.preventDefault();
    if (!memberId) return;
    setError("");
    setSuccess("");

    try {
      await request(`/projects/${projectId}/members`, {
        method: "POST",
        body: { userId: memberId }
      });
      setMemberId("");
      setSuccess("Member added");
      await loadProject();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function removeMember(userId) {
    setError("");
    setSuccess("");

    try {
      await request(`/projects/${projectId}/members/${userId}`, { method: "DELETE" });
      setSuccess("Member removed");
      await loadProject();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function saveTask(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const body = {
      ...taskForm,
      projectId,
      assigneeId: taskForm.assigneeId || assignees[0]?._id
    };

    try {
      if (editingTaskId) {
        await request(`/tasks/${editingTaskId}`, {
          method: "PATCH",
          body
        });
        setSuccess("Task updated");
      } else {
        await request("/tasks", {
          method: "POST",
          body
        });
        setSuccess("Task created");
      }

      resetTaskForm();
      await loadProject();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function editTask(task) {
    setEditingTaskId(task._id);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      assigneeId: task.assignee?._id || "",
      dueDate: toDateInputValue(task.dueDate),
      priority: task.priority,
      status: task.status
    });
  }

  async function updateStatus(taskId, status) {
    setError("");
    setSuccess("");

    try {
      await request(`/tasks/${taskId}/status`, {
        method: "PATCH",
        body: { status }
      });
      setSuccess("Task status updated");
      await loadProject();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function deleteTask(taskId) {
    try {
      await request(`/tasks/${taskId}`, { method: "DELETE" });
      setSuccess("Task deleted");
      await loadProject();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) {
    return <LoadingBlock label="Loading project..." />;
  }

  if (!project) {
    return (
      <section className="page-stack">
        <InlineAlert message={error || "Project not found"} />
        <Link className="secondary-button fit" to="/projects">
          Back to projects
        </Link>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <Link className="text-link" to="/projects">
            Projects
          </Link>
          <h1>{project.name}</h1>
          <p>{project.description || "No description added."}</p>
        </div>
      </header>

      <InlineAlert message={error} />
      <InlineAlert type="success" message={success} />

      <div className="two-column">
        <section className="panel">
          <div className="panel-header">
            <h2>Team</h2>
          </div>

          <div className="member-list">
            <div className="member-row">
              <div>
                <strong>{project.owner.name}</strong>
                <span>{project.owner.email}</span>
              </div>
              <span className="badge">Admin</span>
            </div>
            {project.members.map((member) => (
              <div className="member-row" key={member._id}>
                <div>
                  <strong>{member.name}</strong>
                  <span>{member.email}</span>
                </div>
                {isAdmin ? (
                  <button className="ghost-button" type="button" onClick={() => removeMember(member._id)}>
                    Remove
                  </button>
                ) : (
                  <span className="badge">Member</span>
                )}
              </div>
            ))}
          </div>

          {isAdmin ? (
            <form className="inline-form" onSubmit={addMember}>
              <select value={memberId} onChange={(event) => setMemberId(event.target.value)}>
                <option value="">Select member</option>
                {availableMembers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <button className="secondary-button" type="submit" disabled={!memberId}>
                Add
              </button>
            </form>
          ) : null}
        </section>

        {isAdmin ? (
          <section className="panel">
            <div className="panel-header">
              <h2>Project settings</h2>
            </div>
            <form className="stacked-form" onSubmit={saveProject}>
              <label>
                Name
                <input name="name" value={projectForm.name} onChange={updateProjectField} required />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  value={projectForm.description}
                  onChange={updateProjectField}
                  rows={3}
                />
              </label>
              <div className="button-row">
                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save project"}
                </button>
                <button className="danger-button" type="button" onClick={deleteProject}>
                  Delete
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </div>

      {isAdmin ? (
        <section className="panel">
          <div className="panel-header">
            <h2>{editingTaskId ? "Edit task" : "Create task"}</h2>
            {editingTaskId ? (
              <button className="icon-button" type="button" onClick={resetTaskForm} title="Cancel edit">
                <X size={18} />
              </button>
            ) : null}
          </div>

          <form className="form-grid" onSubmit={saveTask}>
            <label>
              Title
              <input name="title" value={taskForm.title} onChange={updateTaskField} required />
            </label>
            <label>
              Assignee
              <select name="assigneeId" value={taskForm.assigneeId} onChange={updateTaskField} required>
                <option value="">Select assignee</option>
                {assignees.map((person) => (
                  <option key={person._id} value={person._id}>
                    {person.name} ({person.role})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Due date
              <input name="dueDate" type="date" value={taskForm.dueDate} onChange={updateTaskField} required />
            </label>
            <label>
              Priority
              <select name="priority" value={taskForm.priority} onChange={updateTaskField}>
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select name="status" value={taskForm.status} onChange={updateTaskField}>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="wide">
              Description
              <textarea name="description" value={taskForm.description} onChange={updateTaskField} rows={3} />
            </label>
            <button className="primary-button fit" type="submit" disabled={saving || assignees.length === 0}>
              {saving ? "Saving..." : editingTaskId ? "Update task" : "Create task"}
            </button>
          </form>
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-header">
          <h2>Tasks</h2>
          <span>{tasks.length} visible</span>
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
                    Assigned to {task.assignee?.name} - Due {formatDate(task.dueDate)}
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
                    <>
                      <button className="icon-button" type="button" onClick={() => editTask(task)} title="Edit task">
                        <Pencil size={17} />
                      </button>
                      <button className="icon-button danger" type="button" onClick={() => deleteTask(task._id)} title="Delete task">
                        <Trash2 size={17} />
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No tasks yet" description={isAdmin ? "Create the first task for this project." : "No tasks are assigned to you in this project."} />
        )}
      </section>
    </section>
  );
}
