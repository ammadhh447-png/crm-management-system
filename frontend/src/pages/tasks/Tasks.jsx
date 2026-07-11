import { useState, useEffect, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import {
  Plus,
  List,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  Trash2,
  Pencil,
  CheckSquare,
} from 'lucide-react';
import { taskApi, userApi } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import FilterBar from '../../components/ui/FilterBar';
import ConfirmDeleteModal from '../../components/ui/ConfirmDeleteModal';
import DataTable from '../../components/ui/DataTable';
import { PAGE_SIZE } from '../../lib/pagination';
import Pagination from '../../components/ui/Pagination';
import { useBulkSelection } from '../../hooks/useBulkSelection';

const EMPTY_FILTERS = { search: '', status: '', priority: '', type: '', assignedTo: '' };

const PRIORITY_VARIANTS = {
  urgent: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'default',
};

const STATUS_VARIANTS = {
  pending: 'warning',
  in_progress: 'info',
  done: 'success',
  cancelled: 'default',
};

const RECURRENCE_OPTIONS = ['none', 'daily', 'weekly', 'monthly'];

const formatLabel = (value) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatUserName = (user) => {
  if (!user) return '—';
  if (typeof user === 'string') return user;
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.fullName || '—';
};

const emptyForm = {
  title: '',
  description: '',
  type: 'follow_up',
  priority: 'medium',
  status: 'pending',
  dueDate: '',
  recurrence: 'none',
  assignedTo: '',
  contact: '',
  deal: '',
};

const Tasks = () => {
  const { user, hasPermission } = useAuth();
  const [view, setView] = useState('list');
  const [tasks, setTasks] = useState([]);
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ types: [], priorities: [], statuses: [] });
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const {
    selectedIds, selectedCount, allSelected, toggleSelectAll, toggleSelect, clearSelection, pruneSelection,
  } = useBulkSelection(tasks);

  const canCreate = hasPermission('tasks:create');
  const canEdit = hasPermission('tasks:edit');
  const canDelete = hasPermission('tasks:delete');

  const fetchMeta = useCallback(async () => {
    try {
      const response = await taskApi.getMeta();
      setMeta(response.data);
    } catch {
      setMeta({
        types: ['call', 'meeting', 'follow_up', 'email', 'other'],
        priorities: ['low', 'medium', 'high', 'urgent'],
        statuses: ['pending', 'in_progress', 'done', 'cancelled'],
      });
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await userApi.getAllUsers({ limit: 100 });
      setUsers(response.data);
    } catch {
      setUsers([]);
    }
  }, []);

  const fetchTasks = useCallback(async (targetPage) => {
    setLoading(true);
    setError('');
    try {
      const response = await taskApi.getAll({
        page: targetPage,
        limit: PAGE_SIZE,
        search: filters.search || undefined,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        type: filters.type || undefined,
        assignedTo: filters.assignedTo || undefined,
      });
      setTasks(response.data || []);
      setPagination(response.pagination || {});
      pruneSelection((response.data || []).map((t) => t._id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, pruneSelection]);

  const applyFilters = () => {
    setFilters({ ...draft });
    setPage(1);
  };

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const fetchCalendarTasks = useCallback(async () => {
    setCalendarLoading(true);
    setError('');
    try {
      const response = await taskApi.getCalendar({
        year: currentMonth.getFullYear(),
        month: currentMonth.getMonth() + 1,
      });
      setCalendarTasks(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCalendarLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchMeta();
    fetchUsers();
  }, [fetchMeta, fetchUsers]);

  useEffect(() => {
    if (view === 'list') fetchTasks(page);
  }, [view, fetchTasks, page]);

  useEffect(() => {
    if (view === 'calendar') fetchCalendarTasks();
  }, [view, fetchCalendarTasks]);

  const openCreateModal = () => {
    setEditingTask(null);
    setForm({
      ...emptyForm,
      assignedTo: user?.id || user?._id || '',
    });
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title || '',
      description: task.description || '',
      type: task.type || 'follow_up',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
      recurrence: task.recurrence || 'none',
      assignedTo: task.assignedTo?._id || task.assignedTo?.id || task.assignedTo || '',
      contact: task.contact?._id || task.contact || '',
      deal: task.deal?._id || task.deal || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTask(null);
    setForm(emptyForm);
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      title: form.title.trim(),
      description: form.description,
      type: form.type,
      priority: form.priority,
      status: form.status,
      recurrence: form.recurrence,
      assignedTo: form.assignedTo || user?.id || user?._id,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      contact: form.contact || undefined,
      deal: form.deal || undefined,
    };

    try {
      if (editingTask) {
        await taskApi.update(editingTask._id, payload);
        setSuccess('Task updated successfully');
      } else {
        await taskApi.create(payload);
        setSuccess('Task created successfully');
      }
      closeModal();
      if (view === 'list') fetchTasks(page);
      else fetchCalendarTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkDone = async (task) => {
    setError('');
    setSuccess('');
    try {
      await taskApi.update(task._id, { status: 'done' });
      setSuccess('Task marked as done');
      if (view === 'list') fetchTasks(page);
      else fetchCalendarTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      if (deleteTarget === 'bulk') {
        await taskApi.bulkDelete(selectedIds);
        setSuccess(`${selectedIds.length} task(s) deleted`);
        clearSelection();
      } else {
        await taskApi.delete(deleteTarget._id);
        setSuccess('Task deleted');
      }
      setDeleteTarget(null);
      if (view === 'list') fetchTasks(page);
      else fetchCalendarTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = monthStart.getDay();
  const calendarCells = [...Array(startPad).fill(null), ...monthDays];

  const getTasksForDay = (day) =>
    calendarTasks.filter((task) => task.dueDate && isSameDay(new Date(task.dueDate), day));

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <PageHeader
        title="Tasks & Calendar"
        subtitle="Manage tasks, deadlines, and follow-ups"
        actions={
          <>
            {canDelete && view === 'list' && selectedCount > 0 && (
              <Button variant="danger" onClick={() => setDeleteTarget('bulk')}>
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedCount})
              </Button>
            )}
            {canCreate && (
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            )}
          </>
        }
      />

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setView('list')}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
            view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <List className="h-4 w-4" />
          List
        </button>
        <button
          type="button"
          onClick={() => setView('calendar')}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
            view === 'calendar' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Calendar
        </button>
      </div>

      {view === 'list' && (
        <FilterBar onApply={applyFilters} onClear={clearFilters}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div className="sm:col-span-2">
              <label className="form-label">Search</label>
              <input
                type="text"
                value={draft.search}
                onChange={(e) => setDraft((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search tasks..."
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select value={draft.status} onChange={(e) => setDraft((f) => ({ ...f, status: e.target.value }))} className="form-input">
                <option value="">All Statuses</option>
                {meta.statuses.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select value={draft.priority} onChange={(e) => setDraft((f) => ({ ...f, priority: e.target.value }))} className="form-input">
                <option value="">All Priorities</option>
                {meta.priorities.map((p) => <option key={p} value={p}>{formatLabel(p)}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Type</label>
              <select value={draft.type} onChange={(e) => setDraft((f) => ({ ...f, type: e.target.value }))} className="form-input">
                <option value="">All Types</option>
                {meta.types.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Assignee</label>
              <select value={draft.assignedTo} onChange={(e) => setDraft((f) => ({ ...f, assignedTo: e.target.value }))} className="form-input">
                <option value="">All Users</option>
                {users.map((u) => (
                  <option key={u.id || u._id} value={u.id || u._id}>
                    {u.fullName || `${u.firstName} ${u.lastName}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FilterBar>
      )}

      {view === 'list' && (
        loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={CheckSquare}
              title="No tasks found"
              description="Create a task or adjust your filters to see results."
              action={
                canCreate && (
                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4" />
                    Create Task
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <DataTable minWidth="800px">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    {canDelete && (
                      <th className="table-th w-10">
                        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all tasks" className="h-4 w-4 rounded border-slate-300" />
                      </th>
                    )}
                    <th className="table-th">Title</th>
                    <th className="table-th">Type</th>
                    <th className="table-th">Priority</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Due Date</th>
                    <th className="table-th">Assigned To</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map((task) => (
                    <tr key={task._id} className={`hover:bg-slate-50 ${selectedIds.includes(task._id) ? 'bg-slate-50/80' : ''}`}>
                      {canDelete && (
                        <td className="table-td">
                          <input type="checkbox" checked={selectedIds.includes(task._id)} onChange={() => toggleSelect(task._id)} aria-label={`Select ${task.title}`} className="h-4 w-4 rounded border-slate-300" />
                        </td>
                      )}
                      <td className="table-td font-medium text-slate-900">{task.title}</td>
                      <td className="table-td">
                        <Badge variant="default">{formatLabel(task.type)}</Badge>
                      </td>
                      <td className="table-td">
                        <Badge variant={PRIORITY_VARIANTS[task.priority] || 'default'}>
                          {formatLabel(task.priority)}
                        </Badge>
                      </td>
                      <td className="table-td">
                        <Badge variant={STATUS_VARIANTS[task.status] || 'default'}>
                          {formatLabel(task.status)}
                        </Badge>
                      </td>
                      <td className="table-td whitespace-nowrap">
                        {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="table-td">{formatUserName(task.assignedTo)}</td>
                      <td className="table-td">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && task.status !== 'done' && (
                            <button
                              type="button"
                              onClick={() => handleMarkDone(task)}
                              title="Mark done"
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openEditModal(task)}
                              title="Edit"
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(task)}
                              title="Delete"
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTable>
            <Pagination pagination={pagination} onPageChange={setPage} itemLabel="tasks" />
          </div>
        )
      )}

      {view === 'calendar' && (
        <div className="card overflow-hidden overflow-x-auto">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                className="btn-secondary p-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date())}
                className="btn-secondary text-xs"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                className="btn-secondary p-2"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {calendarLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {weekdayLabels.map((day) => (
                  <div
                    key={day}
                    className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendarCells.map((day, idx) => {
                  if (!day) {
                    return <div key={`pad-${idx}`} className="min-h-[80px] border-b border-r border-slate-100 bg-slate-50/50 sm:min-h-[120px]" />;
                  }

                  const dayTasks = getTasksForDay(day);
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[80px] border-b border-r border-slate-100 p-1 sm:min-h-[120px] sm:p-2 ${
                        isToday(day) ? 'bg-blue-50/50' : isCurrentMonth ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                            isToday(day)
                              ? 'bg-slate-900 text-white'
                              : isCurrentMonth
                                ? 'text-slate-700'
                                : 'text-slate-400'
                          }`}
                        >
                          {format(day, 'd')}
                        </span>
                        {canCreate && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTask(null);
                              setForm({
                                ...emptyForm,
                                assignedTo: user?.id || user?._id || '',
                                dueDate: format(day, 'yyyy-MM-dd'),
                              });
                              setModalOpen(true);
                            }}
                            className="rounded p-0.5 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-600"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map((task) => (
                          <button
                            key={task._id}
                            type="button"
                            onClick={() => canEdit && openEditModal(task)}
                            className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium transition-opacity hover:opacity-80 ${
                              task.status === 'done'
                                ? 'bg-emerald-100 text-emerald-700 line-through'
                                : task.priority === 'urgent'
                                  ? 'bg-red-100 text-red-700'
                                  : task.priority === 'high'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {task.title}
                          </button>
                        ))}
                        {dayTasks.length > 3 && (
                          <p className="px-1.5 text-xs text-slate-500">+{dayTasks.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingTask ? 'Edit Task' : 'Create Task'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            name="title"
            value={form.title}
            onChange={handleFormChange}
            required
            placeholder="Task title"
          />

          <div>
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleFormChange}
              rows={3}
              className="form-input resize-none"
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="type" className="form-label">
                Type
              </label>
              <select
                id="type"
                name="type"
                value={form.type}
                onChange={handleFormChange}
                className="form-input"
              >
                {meta.types.map((t) => (
                  <option key={t} value={t}>
                    {formatLabel(t)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="form-label">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={form.priority}
                onChange={handleFormChange}
                className="form-input"
              >
                {meta.priorities.map((p) => (
                  <option key={p} value={p}>
                    {formatLabel(p)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleFormChange}
                className="form-input"
              >
                {meta.statuses.map((s) => (
                  <option key={s} value={s}>
                    {formatLabel(s)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dueDate" className="form-label">
                Due Date
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleFormChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="recurrence" className="form-label">
                Recurrence
              </label>
              <select
                id="recurrence"
                name="recurrence"
                value={form.recurrence}
                onChange={handleFormChange}
                className="form-input"
              >
                {RECURRENCE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {formatLabel(r)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="assignedTo" className="form-label">
                Assigned To
              </label>
              <select
                id="assignedTo"
                name="assignedTo"
                value={form.assignedTo}
                onChange={handleFormChange}
                className="form-input"
                required
              >
                <option value="">Select user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName || `${u.firstName} ${u.lastName}`}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Contact ID (optional)"
              name="contact"
              value={form.contact}
              onChange={handleFormChange}
              placeholder="Contact ID"
            />

            <Input
              label="Deal ID (optional)"
              name="deal"
              value={form.deal}
              onChange={handleFormChange}
              placeholder="Deal ID"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        message={
          deleteTarget === 'bulk'
            ? `Delete ${selectedCount} selected task${selectedCount === 1 ? '' : 's'}?`
            : `Delete task "${deleteTarget?.title}"?`
        }
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
};

export default Tasks;
