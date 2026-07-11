import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Search, Trash2, Edit, Eye, ArrowUpDown,
} from 'lucide-react';
import { dealApi, userApi } from '../../lib/api';
import { formatCurrency } from '../../lib/currency';
import { PAGE_SIZE } from '../../lib/pagination';
import { useAuth } from '../../hooks/useAuth';
import {
  DEAL_STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
  getAssignedName,
  getContactName,
  getCompanyName,
  emptyDealForm,
  dealToForm,
} from '../../lib/deals';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import DealFormFields from '../../components/deals/DealFormFields';

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const SORT_COLUMNS = [
  { key: 'title', label: 'Deal Name' },
  { key: 'value', label: 'Value' },
  { key: 'stage', label: 'Status' },
  { key: 'createdAt', label: 'Created' },
];

const DealsHistory = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, hasPermission } = useAuth();

  const canEdit = hasPermission('deals:edit');
  const canDelete = hasPermission('deals:delete');

  const [deals, setDeals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState(searchParams.get('stage') || '');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [form, setForm] = useState(emptyDealForm());

  const allSelected = deals.length > 0 && selectedIds.length === deals.length;

  const fetchDeals = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: targetPage,
        limit: PAGE_SIZE,
        sortBy,
        sortOrder,
      };
      if (search.trim()) params.search = search.trim();
      if (stageFilter) params.stage = stageFilter;
      if (ownerFilter) params.assignedTo = ownerFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (minValue) params.minValue = minValue;
      if (maxValue) params.maxValue = maxValue;

      const response = await dealApi.getAll(params);
      setDeals(response.data || []);
      setPagination(response.pagination || { page: targetPage, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      setSelectedIds((prev) => prev.filter((id) => (response.data || []).some((d) => d._id === id)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, stageFilter, ownerFilter, dateFrom, dateTo, minValue, maxValue, sortBy, sortOrder]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await userApi.getAllUsers({ limit: 100 });
      setUsers(response.data);
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const stage = searchParams.get('stage');
    if (stage && DEAL_STAGES.includes(stage)) {
      setStageFilter(stage);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchDeals(page);
  }, [fetchDeals, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDeals(1);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStageFilter('');
    setOwnerFilter('');
    setDateFrom('');
    setDateTo('');
    setMinValue('');
    setMaxValue('');
    setPage(1);
    setSearchParams({});
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : deals.map((d) => d._id));
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
        await dealApi.bulkDelete(selectedIds);
        setSuccess(`${selectedIds.length} deal(s) deleted`);
        setSelectedIds([]);
      } else {
        await dealApi.delete(deleteTarget._id);
        setSuccess('Deal deleted');
        setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget._id));
      }
      setDeleteTarget(null);
      fetchDeals(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const openViewModal = (deal) => {
    setSelectedDeal(deal);
    setShowViewModal(true);
  };

  const openEditModal = (deal) => {
    setSelectedDeal(deal);
    setForm(dealToForm(deal));
    setShowEditModal(true);
    setShowViewModal(false);
  };

  const closeModals = () => {
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedDeal(null);
    setForm(emptyDealForm(user?.id || user?._id));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedDeal) return;
    setSaving(true);
    setError('');
    try {
      await dealApi.update(selectedDeal._id, {
        title: form.title,
        value: Number(form.value) || 0,
        probability: Number(form.probability) || 0,
        stage: form.stage,
        description: form.description,
        assignedTo: form.assignedTo,
      });
      setSuccess('Deal updated successfully');
      closeModals();
      fetchDeals(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteLabel = useMemo(() => {
    if (deleteTarget === 'bulk') {
      const count = selectedIds.length;
      return `Delete ${count} selected deal${count === 1 ? '' : 's'}?`;
    }
    if (!deleteTarget) return '';
    return `Delete "${deleteTarget.title}"?`;
  }, [deleteTarget, selectedIds.length]);

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    setPage(nextPage);
  };

  return (
    <div>
      <PageHeader
        title="Deals History"
        subtitle="Search, filter, and manage all deals in one place"
        actions={
          <>
            {canDelete && selectedIds.length > 0 && (
              <Button variant="danger" onClick={() => setDeleteTarget('bulk')}>
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedIds.length})
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate('/deals')}>
              <ArrowLeft className="h-4 w-4" />
              Back to Pipeline
            </Button>
          </>
        }
      />

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="card mb-4 p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label className="form-label">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search deals by name or description..."
                  className="form-input pl-9"
                />
              </div>
            </div>
            <div className="w-full lg:w-40">
              <label className="form-label">Status</label>
              <select
                value={stageFilter}
                onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
                className="form-input"
              >
                <option value="">All Statuses</option>
                {DEAL_STAGES.map((s) => (
                  <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div className="w-full lg:w-44">
              <label className="form-label">Owner</label>
              <select
                value={ownerFilter}
                onChange={(e) => { setOwnerFilter(e.target.value); setPage(1); }}
                className="form-input"
              >
                <option value="">All Owners</option>
                {users.map((u) => (
                  <option key={u.id || u._id} value={u.id || u._id}>
                    {u.fullName || `${u.firstName} ${u.lastName}`}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Apply</Button>
            <Button type="button" variant="secondary" onClick={clearFilters}>Clear</Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="form-label">Created From</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="form-input" />
            </div>
            <div>
              <label className="form-label">Created To</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="form-input" />
            </div>
            <div>
              <label className="form-label">Min Value</label>
              <input type="number" min="0" value={minValue} onChange={(e) => { setMinValue(e.target.value); setPage(1); }} className="form-input" placeholder="0" />
            </div>
            <div>
              <label className="form-label">Max Value</label>
              <input type="number" min="0" value={maxValue} onChange={(e) => { setMaxValue(e.target.value); setPage(1); }} className="form-input" placeholder="Any" />
            </div>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : deals.length === 0 ? (
        <EmptyState title="No deals found" description="Try adjusting your search or filters." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {canDelete && (
                    <th className="table-th w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all deals"
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                      />
                    </th>
                  )}
                  {SORT_COLUMNS.map((col) => (
                    <th key={col.key} className="table-th">
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="inline-flex items-center gap-1 font-medium hover:text-slate-900"
                      >
                        {col.label}
                        <ArrowUpDown className={`h-3.5 w-3.5 ${sortBy === col.key ? 'text-slate-900' : 'text-slate-400'}`} />
                      </button>
                    </th>
                  ))}
                  <th className="table-th">Company</th>
                  <th className="table-th">Contact</th>
                  <th className="table-th">Owner</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deals.map((deal) => {
                  const isSelected = selectedIds.includes(deal._id);
                  const stageColor = STAGE_COLORS[deal.stage] || STAGE_COLORS.prospect;
                  return (
                    <tr key={deal._id} className={`hover:bg-slate-50 ${isSelected ? 'bg-slate-50/80' : ''}`}>
                      {canDelete && (
                        <td className="table-td">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(deal._id)}
                            aria-label={`Select ${deal.title}`}
                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                          />
                        </td>
                      )}
                      <td className="table-td font-medium text-slate-900">{deal.title}</td>
                      <td className="table-td">{formatCurrency(deal.value)}</td>
                      <td className="table-td">
                        <Badge variant={stageColor.badge}>{STAGE_LABELS[deal.stage] || deal.stage}</Badge>
                      </td>
                      <td className="table-td whitespace-nowrap">{formatDate(deal.createdAt)}</td>
                      <td className="table-td">{getCompanyName(deal)}</td>
                      <td className="table-td">{getContactName(deal)}</td>
                      <td className="table-td">{getAssignedName(deal.assignedTo)}</td>
                      <td className="table-td">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" className="px-2 py-1.5" onClick={() => openViewModal(deal)} title="View details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canEdit && (
                            <Button variant="ghost" className="px-2 py-1.5" onClick={() => openEditModal(deal)} title="Edit deal">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" className="px-2 py-1.5" onClick={() => setDeleteTarget(deal)} title="Delete deal">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={goToPage}
            itemLabel="deals"
          />
        </div>
      )}

      <Modal open={showViewModal} onClose={closeModals} title="Deal Details" size="lg">
        {selectedDeal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Deal Name</p>
                <p className="mt-1 font-medium text-slate-900">{selectedDeal.title}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Status</p>
                <div className="mt-1">
                  <Badge variant={STAGE_COLORS[selectedDeal.stage]?.badge || 'default'}>
                    {STAGE_LABELS[selectedDeal.stage]}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Value</p>
                <p className="mt-1 font-medium text-slate-900">{formatCurrency(selectedDeal.value)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Probability</p>
                <p className="mt-1 text-slate-900">{selectedDeal.probability}%</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Company</p>
                <p className="mt-1 text-slate-900">{getCompanyName(selectedDeal)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Contact</p>
                <p className="mt-1 text-slate-900">{getContactName(selectedDeal)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Owner</p>
                <p className="mt-1 text-slate-900">{getAssignedName(selectedDeal.assignedTo)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Created</p>
                <p className="mt-1 text-slate-900">{formatDate(selectedDeal.createdAt)}</p>
              </div>
            </div>
            {selectedDeal.description && (
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Description</p>
                <p className="mt-1 whitespace-pre-wrap text-slate-700">{selectedDeal.description}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={closeModals}>Close</Button>
              {canEdit && (
                <Button onClick={() => openEditModal(selectedDeal)}>Edit Deal</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {canEdit && (
        <Modal open={showEditModal} onClose={closeModals} title="Edit Deal" size="lg">
          <form onSubmit={handleUpdate}>
            <DealFormFields form={form} onChange={handleFormChange} users={users} />
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={closeModals}>Cancel</Button>
              <Button type="submit" loading={saving}>Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Delete"
        size="sm"
      >
        <p className="text-slate-600">{deleteLabel}</p>
        <p className="mt-2 text-sm text-slate-500">This action cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default DealsHistory;
