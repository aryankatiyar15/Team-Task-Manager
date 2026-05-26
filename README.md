# Team Task Manager

A production-ready college assessment app for managing projects, assigning tasks, and tracking progress with Admin and Member role-based access control.

## Live Deployment

https://team-task-manager-client-production-1e4e.up.railway.app/login

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT + bcrypt password hashing
- Deployment : Railway
- API style: REST

## Core Features

- Signup, login, logout, protected routes
- JWT authentication middleware
- Password hashing with bcrypt
- Admin and Member role-based access control
- Admin project ownership
- Create, update, delete projects
- Add and remove project members
- Create, edit, delete, assign tasks
- Member task status updates
- Automatic overdue calculation from due date and status
- Role-aware dashboard metrics, including tasks per user
- Loading, success, error, and empty states in the UI

## Folder Structure

```text
team-task-manager/
  client/
    src/
      api/
      components/
      context/
      pages/
      utils/
      App.jsx
      main.jsx
      styles.css
    vite.config.js
  server/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      scripts/
      utils/
      validation/
      app.js
      server.js
  package.json
  nixpacks.toml
  README.md
```

## Database Schema

### User

| Field | Type | Notes |
| --- | --- | --- |
| name | String | Required |
| email | String | Required, unique |
| passwordHash | String | Required |
| role | String | `Admin` or `Member` |

### Project

| Field | Type | Notes |
| --- | --- | --- |
| name | String | Required |
| description | String | Optional |
| owner | ObjectId | References `User`; project admin |
| members | ObjectId[] | References `User` |

### Task

| Field | Type | Notes |
| --- | --- | --- |
| title | String | Required |
| description | String | Optional |
| project | ObjectId | References `Project` |
| assignee | ObjectId | References `User` |
| createdBy | ObjectId | References `User` |
| dueDate | Date | Required |
| priority | String | `Low`, `Medium`, `High` |
| status | String | `To Do`, `In Progress`, `Done` |
| isOverdue | Virtual | True when due date is past and status is not `Done` |

## Environment Variables

Create `server/.env` from `server/.env.example`.

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/team_task_manager
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

For Railway, set `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `CLIENT_URL`.
Do not manually set `PORT` on Railway because Railway provides the correct runtime port.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Start MongoDB locally or use a MongoDB Atlas connection string.

3. Create `server/.env`.

4. Seed demo data:

```bash
npm run seed
```

5. Run the app:

```bash
npm run dev
```

6. Open:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5000/api/health
```

## Demo Accounts

After `npm run seed`:

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@example.com | Admin@12345 |
| Member | meera@example.com | Member@12345 |
| Member | rahul@example.com | Member@12345 |

## API Routes

### Auth

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Public | Create account |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| POST | `/api/auth/logout` | Authenticated | Client-side JWT logout helper |
| GET | `/api/auth/me` | Authenticated | Current user |

### Users

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| GET | `/api/users` | Admin | List users, supports `role` and `search` query params |

### Projects

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| GET | `/api/projects` | Authenticated | Admin sees owned projects, Member sees assigned projects |
| POST | `/api/projects` | Admin | Create project |
| GET | `/api/projects/:projectId` | Project user | Project details and visible tasks |
| PATCH | `/api/projects/:projectId` | Project Admin | Update project |
| DELETE | `/api/projects/:projectId` | Project Admin | Delete project and tasks |
| POST | `/api/projects/:projectId/members` | Project Admin | Add member |
| DELETE | `/api/projects/:projectId/members/:userId` | Project Admin | Remove member if they have no open tasks |

### Tasks

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| GET | `/api/tasks` | Authenticated | Role-scoped task list, supports `projectId`, `status`, `priority` |
| POST | `/api/tasks` | Admin | Create task |
| GET | `/api/tasks/:taskId` | Task user | Task details |
| PATCH | `/api/tasks/:taskId` | Admin or assigned Member | Admin edits task; Member can update status only |
| PATCH | `/api/tasks/:taskId/status` | Admin or assigned Member | Update status |
| DELETE | `/api/tasks/:taskId` | Admin | Delete task |

### Dashboard

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| GET | `/api/dashboard` | Authenticated | Role-aware task totals, tasks per user, overdue count, and project progress |


## Future Improvements

- Email invitations
- Password reset
- Comments on tasks
- File attachments
- Notifications for overdue tasks
- Admin analytics export
