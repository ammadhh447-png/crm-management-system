import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, Download, Upload, AlertCircle, Trash2, Edit, UserPlus } from 'lucide-react';
import { contactApi } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import { PAGE_SIZE } from '../../lib/pagination';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import FilterBar from '../../components/ui/FilterBar';
import ConfirmDeleteModal from '../../components/ui/ConfirmDeleteModal';
import DataTable from '../../components/ui/DataTable';
import { useBulkSelection } from '../../hooks/useBulkSelection';

const EMPTY_FILTERS = { search: '', leadStatus: '', leadSource: '', type: '' };

const STATUS_VARIANTS = {
  new: 'info',
  contacted: 'warning',
  qualified: 'success',
  lost: 'danger',
  converted: 'purple',
};

const formatLabel = (value) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  companyName: '',
  leadSource: 'website',
  leadStatus: 'new',
  tags: '',
  segment: '',
  type: 'lead',
  notes: '',
};

const Contacts = () => {
  const { hasPermission } = useAuth();
  const fileInputRef = useRef(null);

  const [contacts, setContacts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [meta, setMeta] = useState({ leadSources: [], leadStatuses: [], contactTypes: [] });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingContact, setDeletingContact] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const {
    selectedIds, selectedCount, allSelected, toggleSelectAll, toggleSelect, clearSelection, pruneSelection,
  } = useBulkSelection(contacts);

  const [duplicatesModalOpen, setDuplicatesModalOpen] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [duplicatesLoading, setDuplicatesLoading] = useState(false);

  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState('');

  const fetchContacts = useCallback(async (targetPage) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: targetPage, limit: PAGE_SIZE };
      if (filters.search) params.search = filters.search;
      if (filters.leadStatus) params.leadStatus = filters.leadStatus;
      if (filters.leadSource) params.leadSource = filters.leadSource;
      if (filters.type) params.type = filters.type;
      const response = await contactApi.getAll(params);
      setContacts(response.data || []);
      setPagination(response.pagination || {});
      pruneSelection((response.data || []).map((c) => c._id));
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

  const fetchMeta = async () => {
    try {
      const response = await contactApi.getMeta();
      setMeta(response.data);
    } catch {
      setMeta({
        leadSources: ['website', 'referral', 'campaign', 'social', 'cold_call', 'event', 'other'],
        leadStatuses: ['new', 'contacted', 'qualified', 'lost', 'converted'],
        contactTypes: ['lead', 'contact', 'customer'],
      });
    }
  };

  const fetchDuplicates = async () => {
    setDuplicatesLoading(true);
    try {
      const response = await contactApi.getDuplicates();
      setDuplicates(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setDuplicatesLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
    fetchDuplicates();
  }, []);

  useEffect(() => {
    fetchContacts(page);
  }, [fetchContacts, page]);

  const updateDraft = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateModal = () => {
    setEditingContact(null);
    setForm({ ...EMPTY_FORM, leadSource: meta.leadSources[0] || 'website' });
    setFormModalOpen(true);
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setForm({
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      phone: contact.phone || '',
      companyName: contact.companyName || contact.company?.name || '',
      leadSource: contact.leadSource || 'website',
      leadStatus: contact.leadStatus || 'new',
      tags: (contact.tags || []).join(', '),
      segment: contact.segment || '',
      type: contact.type || 'lead',
      notes: contact.notes || '',
    });
    setFormModalOpen(true);
  };

  const closeFormModal = () => {
    setFormModalOpen(false);
    setEditingContact(null);
    setForm(EMPTY_FORM);
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };
      let response;
      if (editingContact) {
        response = await contactApi.update(editingContact._id, payload);
        const welcome = response.data?.welcomeEmail;
        if (welcome?.sent) {
          setSuccess(`Contact updated. ${welcome.message}`);
        } else if (welcome && !welcome.skipped) {
          setSuccess('Contact updated successfully');
          setError(welcome.reason || 'Welcome email could not be sent');
        } else {
          setSuccess('Contact updated successfully');
        }
      } else {
        response = await contactApi.create(payload);
        const welcome = response.data?.welcomeEmail;
        if (welcome?.sent) {
          setSuccess(`Contact created. ${welcome.message}`);
        } else if (welcome && !welcome.skipped) {
          setSuccess('Contact created successfully');
          setError(welcome.reason || 'Welcome email could not be sent');
        } else {
          setSuccess('Contact created successfully');
        }
      }
      closeFormModal();
      fetchContacts(page);
      fetchDuplicates();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (contact) => {
    setDeletingContact(contact);
    setDeleteTarget(null);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingContact && deleteTarget !== 'bulk') return;
    setDeleting(true);
    setError('');
    try {
      if (deleteTarget === 'bulk') {
        await contactApi.bulkDelete(selectedIds);
        setSuccess(`${selectedIds.length} contact(s) deleted`);
        clearSelection();
      } else {
        await contactApi.delete(deletingContact._id);
        setSuccess('Contact deleted successfully');
      }
      setDeleteModalOpen(false);
      setDeletingContact(null);
      setDeleteTarget(null);
      fetchContacts(page);
      fetchDuplicates();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError('');
    try {
      const response = await contactApi.importCSV(file);
      setSuccess(`Imported ${response.data.imported} of ${response.data.total} contacts`);
      fetchContacts(1);
      fetchDuplicates();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleExport = async (format) => {
    setExporting(format);
    setError('');
    try {
      const blob = await contactApi.exportData(format);
      const ext = format === 'xlsx' ? 'xlsx' : 'csv';
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contacts.${ext}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting('');
    }
  };

  const canCreate = hasPermission('contacts:create');
  const canEdit = hasPermission('contacts:edit');
  const canDelete = hasPermission('contacts:delete');
  const canImport = hasPermission('contacts:import');

  return (
    <div>
      <PageHeader
        title="Contacts & Leads"
        subtitle="Manage your contacts, leads, and customer relationships"
        actions={
          <>
            {canDelete && selectedCount > 0 && (
              <Button variant="danger" onClick={() => { setDeleteTarget('bulk'); setDeleteModalOpen(true); }}>
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedCount})
              </Button>
            )}
            {duplicates.length > 0 && (
              <Button variant="secondary" onClick={() => setDuplicatesModalOpen(true)}>
                <AlertCircle className="h-4 w-4" />
                {duplicates.length} Duplicate{duplicates.length !== 1 ? 's' : ''}
              </Button>
            )}
            {canImport && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImport}
                />
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  loading={importing}
                >
                  <Upload className="h-4 w-4" />
                  Import CSV
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              onClick={() => handleExport('csv')}
              loading={exporting === 'csv'}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport('xlsx')}
              loading={exporting === 'xlsx'}
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
            {canCreate && (
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Add Contact
              </Button>
            )}
          </>
        }
      />

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <FilterBar onApply={applyFilters} onClear={clearFilters}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="form-label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={draft.search}
                onChange={(e) => updateDraft('search', e.target.value)}
                placeholder="Search by name, email, or company..."
                className="form-input pl-9"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select value={draft.leadStatus} onChange={(e) => updateDraft('leadStatus', e.target.value)} className="form-input">
              <option value="">All Statuses</option>
              {meta.leadStatuses.map((s) => (
                <option key={s} value={s}>{formatLabel(s)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Source</label>
            <select value={draft.leadSource} onChange={(e) => updateDraft('leadSource', e.target.value)} className="form-input">
              <option value="">All Sources</option>
              {meta.leadSources.map((s) => (
                <option key={s} value={s}>{formatLabel(s)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Type</label>
            <select value={draft.type} onChange={(e) => updateDraft('type', e.target.value)} className="form-input">
              <option value="">All Types</option>
              {meta.contactTypes.map((t) => (
                <option key={t} value={t}>{formatLabel(t)}</option>
              ))}
            </select>
          </div>
        </div>
      </FilterBar>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={UserPlus}
            title="No contacts found"
            description="Get started by adding your first contact or importing from CSV."
            action={
              canCreate && (
                <Button onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  Add Contact
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <DataTable minWidth="960px">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {canDelete && (
                    <th className="table-th w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all contacts"
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                      />
                    </th>
                  )}
                  <th className="table-th">Name</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Phone</th>
                  <th className="table-th">Company</th>
                  <th className="table-th">Source</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Tags</th>
                  {(canEdit || canDelete) && <th className="table-th text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.map((contact) => (
                  <tr key={contact._id} className={`hover:bg-slate-50 ${selectedIds.includes(contact._id) ? 'bg-slate-50/80' : ''}`}>
                    {canDelete && (
                      <td className="table-td">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(contact._id)}
                          onChange={() => toggleSelect(contact._id)}
                          aria-label={`Select ${contact.firstName} ${contact.lastName}`}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                        />
                      </td>
                    )}
                    <td className="table-td font-medium text-slate-900">
                      {contact.firstName} {contact.lastName}
                    </td>
                    <td className="table-td">{contact.email}</td>
                    <td className="table-td">{contact.phone || '—'}</td>
                    <td className="table-td">{contact.companyName || contact.company?.name || '—'}</td>
                    <td className="table-td">{formatLabel(contact.leadSource)}</td>
                    <td className="table-td">
                      <Badge variant={STATUS_VARIANTS[contact.leadStatus] || 'default'}>
                        {formatLabel(contact.leadStatus)}
                      </Badge>
                    </td>
                    <td className="table-td capitalize">{contact.type}</td>
                    <td className="table-td">
                      <div className="flex flex-wrap gap-1">
                        {(contact.tags || []).slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="default">{tag}</Badge>
                        ))}
                        {(contact.tags || []).length > 3 && (
                          <Badge variant="default">+{contact.tags.length - 3}</Badge>
                        )}
                      </div>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="table-td text-right">
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <button
                              onClick={() => openEditModal(contact)}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => openDeleteModal(contact)}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>

          <Pagination pagination={pagination} onPageChange={setPage} itemLabel="contacts" />
        </div>
      )}

      <Modal
        open={formModalOpen}
        onClose={closeFormModal}
        title={editingContact ? 'Edit Contact' : 'Add Contact'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First Name" name="firstName" value={form.firstName} onChange={handleFormChange} required />
            <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleFormChange} required />
            <Input label="Email" name="email" type="email" value={form.email} onChange={handleFormChange} required />
            <Input label="Phone" name="phone" type="tel" value={form.phone} onChange={handleFormChange} />
            <Input label="Company" name="companyName" value={form.companyName} onChange={handleFormChange} />
            <div>
              <label className="form-label">Type</label>
              <select name="type" value={form.type} onChange={handleFormChange} className="form-input">
                {meta.contactTypes.map((t) => (
                  <option key={t} value={t}>{formatLabel(t)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Lead Source</label>
              <select name="leadSource" value={form.leadSource} onChange={handleFormChange} className="form-input">
                {meta.leadSources.map((s) => (
                  <option key={s} value={s}>{formatLabel(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Lead Status</label>
              <select name="leadStatus" value={form.leadStatus} onChange={handleFormChange} className="form-input">
                {meta.leadStatuses.map((s) => (
                  <option key={s} value={s}>{formatLabel(s)}</option>
                ))}
              </select>
            </div>
            <Input label="Tags" name="tags" value={form.tags} onChange={handleFormChange} placeholder="tag1, tag2, tag3" />
            <Input label="Segment" name="segment" value={form.segment} onChange={handleFormChange} />
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleFormChange}
              rows={3}
              className="form-input resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button variant="secondary" type="button" onClick={closeFormModal}>Cancel</Button>
            <Button type="submit" loading={saving}>
              {editingContact ? 'Save Changes' : 'Create Contact'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        open={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setDeletingContact(null); setDeleteTarget(null); }}
        title="Delete Contact"
        message={
          deleteTarget === 'bulk'
            ? `Delete ${selectedCount} selected contact${selectedCount === 1 ? '' : 's'}?`
            : `Are you sure you want to delete ${deletingContact?.firstName} ${deletingContact?.lastName}?`
        }
        onConfirm={handleDelete}
        loading={deleting}
      />

      <Modal
        open={duplicatesModalOpen}
        onClose={() => setDuplicatesModalOpen(false)}
        title="Duplicate Contacts"
        size="lg"
      >
        {duplicatesLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : duplicates.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">No duplicate emails found.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              The following contacts share the same email address. Review and merge or remove duplicates.
            </p>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="table-th">Email</th>
                    <th className="table-th">Original</th>
                    <th className="table-th">Duplicate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {duplicates.map((dup, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="table-td font-medium text-slate-900">{dup.duplicate.email}</td>
                      <td className="table-td">
                        {dup.original.firstName} {dup.original.lastName}
                      </td>
                      <td className="table-td">
                        {dup.duplicate.firstName} {dup.duplicate.lastName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Contacts;
