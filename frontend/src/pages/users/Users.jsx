import { useState, useEffect, useCallback } from 'react';
import { userApi } from '../../lib/api';
import { PAGE_SIZE } from '../../lib/pagination';
import PageHeader from '../../components/ui/PageHeader';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';

const EMPTY_FILTERS = { search: '', role: '', isActive: '' };

const Users = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: targetPage, limit: PAGE_SIZE };
      if (filters.search) params.search = filters.search;
      if (filters.role) params.role = filters.role;
      if (filters.isActive) params.isActive = filters.isActive;
      const response = await userApi.getAllUsers(params);
      setUsers(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

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
      <PageHeader title="Users" subtitle="Manage system users and roles" />

      <Alert type="error" message={error} onClose={() => setError('')} />

      <FilterBar onApply={applyFilters} onClear={clearFilters}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="form-label">Search</label>
            <input
              type="text"
              value={draft.search}
              onChange={(e) => setDraft((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search by name or email..."
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Role</label>
            <select
              value={draft.role}
              onChange={(e) => setDraft((f) => ({ ...f, role: e.target.value }))}
              className="form-input"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="sales_rep">Sales Rep</option>
              <option value="support">Support</option>
              <option value="hr">HR</option>
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              value={draft.isActive}
              onChange={(e) => setDraft((f) => ({ ...f, isActive: e.target.value }))}
              className="form-input"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </FilterBar>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden">
          <DataTable minWidth="640px">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="table-th">Name</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Role</th>
                  <th className="table-th">Department</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="table-td font-medium text-slate-900">{user.fullName}</td>
                    <td className="table-td">{user.email}</td>
                    <td className="table-td">{user.roleLabel}</td>
                    <td className="table-td">{user.department || '—'}</td>
                    <td className="table-td">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </DataTable>
          <Pagination pagination={pagination} onPageChange={setPage} itemLabel="users" />
        </div>
      )}
    </div>
  );
};

export default Users;
