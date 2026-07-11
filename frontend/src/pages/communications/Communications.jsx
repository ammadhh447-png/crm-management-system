import { useState, useEffect, useMemo } from 'react';
import { Mail, Phone, MessageSquare, Plus, Send, Trash2 } from 'lucide-react';
import { communicationApi } from '../../lib/api';
import { PAGE_SIZE } from '../../lib/pagination';
import { useAuth } from '../../hooks/useAuth';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import ConfirmDeleteModal from '../../components/ui/ConfirmDeleteModal';
import Pagination from '../../components/ui/Pagination';

const TYPE_ICONS = { email: Mail, call: Phone, meeting: MessageSquare, note: MessageSquare };

const Communications = () => {
  const { hasPermission } = useAuth();
  const [comms, setComms] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [filters, setFilters] = useState({ search: '', type: '' });
  const [draft, setDraft] = useState({ search: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [form, setForm] = useState({ type: 'call', subject: '', body: '', contact: '', duration: '' });
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '', contactId: '', templateId: '' });
  const [templateForm, setTemplateForm] = useState({ name: '', subject: '', body: '', category: 'general' });

  const canDelete = hasPermission('communications:create');
  const allSelected = comms.length > 0 && selectedIds.length === comms.length;

  const selectedCount = selectedIds.length;

  const load = async (targetPage = page) => {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([
        communicationApi.getAll({
          page: targetPage,
          limit: PAGE_SIZE,
          search: filters.search || undefined,
          type: filters.type || undefined,
        }),
        communicationApi.getTemplates(),
      ]);
      setComms(c.data);
      setPagination(c.pagination || {});
      setTemplates(t.data);
      setSelectedIds((prev) => prev.filter((id) => c.data.some((item) => item._id === id)));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, [page, filters]);

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : comms.map((c) => c._id));
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      if (deleteTarget === 'bulk') {
        await communicationApi.bulkDelete(selectedIds);
        setSuccess(`${selectedIds.length} communication(s) deleted`);
        setSelectedIds([]);
      } else {
        await communicationApi.delete(deleteTarget._id);
        setSuccess('Communication deleted');
        setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget._id));
      }
      setDeleteTarget(null);
      load(page);
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleLog = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        type: form.type,
        subject: form.subject,
        body: form.body,
        duration: +form.duration || 0,
      };
      if (form.contact?.trim()) payload.contact = form.contact.trim();

      await communicationApi.create(payload);
      setShowLog(false);
      setForm({ type: 'call', subject: '', body: '', contact: '', duration: '' });
      load(page);
    } catch (e) { setError(e.message); }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        to: emailForm.to.trim(),
        subject: emailForm.subject.trim(),
        body: emailForm.body.trim(),
      };
      if (emailForm.contactId?.trim()) payload.contactId = emailForm.contactId.trim();
      if (emailForm.templateId?.trim()) payload.templateId = emailForm.templateId.trim();

      await communicationApi.sendEmail(payload);
      setShowEmail(false);
      setEmailForm({ to: '', subject: '', body: '', contactId: '', templateId: '' });
      load(page);
    } catch (e) { setError(e.message); }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      await communicationApi.createTemplate(templateForm);
      setShowTemplate(false);
      load(page);
    } catch (e) { setError(e.message); }
  };

  const applyTemplate = (id) => {
    const t = templates.find((t) => t._id === id);
    if (t) setEmailForm((f) => ({ ...f, templateId: id, subject: t.subject, body: t.body }));
  };

  const deleteLabel = useMemo(() => {
    if (deleteTarget === 'bulk') {
      return `Delete ${selectedCount} selected communication${selectedCount === 1 ? '' : 's'}?`;
    }
    if (!deleteTarget) return '';
    return `Delete this ${deleteTarget.type} communication?`;
  }, [deleteTarget, selectedCount]);

  return (
    <div>
      <PageHeader
        title="Communications"
        subtitle="Log calls, meetings, emails and manage templates"
        actions={
          <>
            {canDelete && selectedCount > 0 && (
              <Button variant="danger" onClick={() => setDeleteTarget('bulk')}>
                <Trash2 className="h-4 w-4" /> Delete Selected ({selectedCount})
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowTemplate(true)}>Templates</Button>
            <Button variant="secondary" onClick={() => setShowLog(true)}><Plus className="h-4 w-4" /> Log Activity</Button>
            <Button onClick={() => setShowEmail(true)}><Send className="h-4 w-4" /> Send Email</Button>
          </>
        }
      />
      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <FilterBar
        onApply={() => { setFilters({ ...draft }); setPage(1); }}
        onClear={() => { const empty = { search: '', type: '' }; setDraft(empty); setFilters(empty); setPage(1); }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="form-label">Search</label>
            <input
              type="text"
              value={draft.search}
              onChange={(e) => setDraft((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search subject or notes..."
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Type</label>
            <select value={draft.type} onChange={(e) => setDraft((f) => ({ ...f, type: e.target.value }))} className="form-input">
              <option value="">All Types</option>
              <option value="call">Call</option>
              <option value="meeting">Meeting</option>
              <option value="email">Email</option>
              <option value="note">Note</option>
            </select>
          </div>
        </div>
      </FilterBar>

      {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
        <div className="card overflow-hidden">
          <DataTable minWidth="760px">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {canDelete && (
                  <th className="table-th w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all communications"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                    />
                  </th>
                )}
                <th className="table-th">Type</th>
                <th className="table-th">Subject</th>
                <th className="table-th">Contact</th>
                <th className="table-th">User</th>
                <th className="table-th">Date</th>
                <th className="table-th">Status</th>
                {canDelete && <th className="table-th text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comms.map((c) => {
                const Icon = TYPE_ICONS[c.type] || MessageSquare;
                const isSelected = selectedIds.includes(c._id);
                return (
                  <tr key={c._id} className={`hover:bg-slate-50 ${isSelected ? 'bg-slate-50/80' : ''}`}>
                    {canDelete && (
                      <td className="table-td">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(c._id)}
                          aria-label={`Select ${c.subject || c.type}`}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                        />
                      </td>
                    )}
                    <td className="table-td"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-slate-400" /><Badge>{c.type}</Badge></div></td>
                    <td className="table-td font-medium">{c.subject || c.body?.slice(0, 50)}</td>
                    <td className="table-td">{c.contact ? `${c.contact.firstName} ${c.contact.lastName}` : c.emailTo || '—'}</td>
                    <td className="table-td">{c.userId?.firstName} {c.userId?.lastName}</td>
                    <td className="table-td">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="table-td"><Badge variant={c.emailStatus === 'sent' ? 'success' : c.emailStatus === 'failed' ? 'danger' : 'default'}>{c.emailStatus || 'logged'}</Badge></td>
                    {canDelete && (
                      <td className="table-td text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(c)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete communication"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {!comms.length && (
                <tr>
                  <td colSpan={canDelete ? 8 : 6} className="px-4 py-12 text-center text-sm text-slate-500">
                    No communications logged yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </DataTable>
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            itemLabel="communications"
          />
        </div>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        message={deleteLabel}
        onConfirm={handleDelete}
        loading={deleting}
      />

      <Modal open={showLog} onClose={() => setShowLog(false)} title="Log Communication">
        <form onSubmit={handleLog} className="space-y-4">
          <div>
            <label className="form-label">Type</label>
            <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="call">Call</option><option value="meeting">Meeting</option><option value="email">Email</option><option value="note">Note</option>
            </select>
          </div>
          <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <div><label className="form-label">Notes</label><textarea className="form-input" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
          {form.type === 'call' && <Input label="Duration (minutes)" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />}
          <Button type="submit" className="w-full">Save Log</Button>
        </form>
      </Modal>

      <Modal open={showEmail} onClose={() => setShowEmail(false)} title="Send Email" size="lg">
        <form onSubmit={handleSendEmail} className="space-y-4">
          <Input label="To" type="email" value={emailForm.to} onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })} required />
          <div>
            <label className="form-label">Template</label>
            <select className="form-input" value={emailForm.templateId} onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">None</option>
              {templates.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <Input label="Subject" value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} required />
          <div><label className="form-label">Body (HTML supported)</label><textarea className="form-input" rows={6} value={emailForm.body} onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })} required /></div>
          <Button type="submit" className="w-full"><Send className="h-4 w-4" /> Send Email</Button>
        </form>
      </Modal>

      <Modal open={showTemplate} onClose={() => setShowTemplate(false)} title="Email Templates" size="lg">
        <div className="mb-4 space-y-2">
          {templates.map((t) => (
            <div key={t._id} className="rounded-lg border border-slate-200 p-3">
              <p className="font-medium text-slate-900">{t.name}</p>
              <p className="text-sm text-slate-500">{t.subject}</p>
            </div>
          ))}
        </div>
        <form onSubmit={handleCreateTemplate} className="space-y-3 border-t border-slate-200 pt-4">
          <p className="text-sm font-medium text-slate-900">New Template</p>
          <Input label="Name" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} required />
          <Input label="Subject" value={templateForm.subject} onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })} required />
          <div><label className="form-label">Body</label><textarea className="form-input" rows={4} value={templateForm.body} onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })} required /></div>
          <Button type="submit" className="w-full">Create Template</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Communications;
