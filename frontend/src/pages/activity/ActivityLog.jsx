import { useState, useEffect, useCallback } from 'react';
import { activityApi } from '../../lib/api';
import { PAGE_SIZE } from '../../lib/pagination';
import PageHeader from '../../components/ui/PageHeader';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';

const MODULES = ['contacts', 'deals', 'tasks', 'communications', 'documents', 'users', 'settings', 'reports'];
const ACTIONS = ['create', 'update', 'delete', 'upload', 'login', 'logout'];

const EMPTY_FILTERS = { module: '', action: '' };

const formatDate = (date) => new Date(date).toLocaleString(undefined, {
  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: targetPage, limit: PAGE_SIZE };
      if (filters.module) params.module = filters.module;
      if (filters.action) params.action = filters.action;
      const response = await activityApi.getLogs(params);
      setLogs(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  const applyFilters = () => {
    setFilters({ ...draft });
    setPage(1);
  };

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  return (
    <div>
      <PageHeader title="Activity Log" subtitle="Track user actions across the system" />
      <Alert type="error" message={error} onClose={() => setError('')} />

      <FilterBar onApply={applyFilters} onClear={clearFilters}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="form-label">Module</label>
            <select
              value={draft.module}
              onChange={(e) => setDraft((f) => ({ ...f, module: e.target.value }))}
              className="form-input"
            >
              <option value="">All Modules</option>
              {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Action</label>
            <select
              value={draft.action}
              onChange={(e) => setDraft((f) => ({ ...f, action: e.target.value }))}
              className="form-input"
            >
              <option value="">All Actions</option>
              {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </FilterBar>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden">
          <DataTable minWidth="720px">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="table-th">User</th>
                  <th className="table-th">Action</th>
                  <th className="table-th">Module</th>
                  <th className="table-th">Description</th>
                  <th className="table-th">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="table-td text-slate-900">
                      {log.userId?.firstName} {log.userId?.lastName}
                    </td>
                    <td className="table-td">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="table-td">{log.module}</td>
                    <td className="table-td max-w-xs truncate">{log.description}</td>
                    <td className="table-td whitespace-nowrap">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No activity logs found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </DataTable>
          <Pagination pagination={pagination} onPageChange={setPage} itemLabel="logs" />
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
