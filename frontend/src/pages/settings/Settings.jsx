import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { settingsApi, userApi, authApi } from '../../lib/api';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { LANGUAGES } from '../../i18n/locales';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Profile from '../profile/Profile';

const MANAGER_ASSIGNABLE = ['manager', 'sales_rep', 'support', 'hr'];

const Settings = () => {
  const { t, setLanguage, language } = useLanguage();
  const { user, hasPermission } = useAuth();
  const [searchParams] = useSearchParams();
  const canManageSettings = hasPermission('settings:view');
  const canSaveOrgSettings = hasPermission('settings:manage');
  const canManageUsers = hasPermission('users:edit');
  const [tab, setTab] = useState(searchParams.get('tab') || 'profile');
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({});
  const [newField, setNewField] = useState({ name: '', label: '', type: 'text' });

  useEffect(() => {
    const nextTab = searchParams.get('tab');
    if (nextTab) setTab(nextTab);
  }, [searchParams]);

  useEffect(() => {
    if (!canManageSettings && !canManageUsers) return;

    setLoading(true);
    const requests = [];
    if (canManageSettings) requests.push(settingsApi.get());
    if (canManageUsers) {
      requests.push(userApi.getAllUsers());
      requests.push(authApi.getRoles());
    }

    Promise.all(requests)
      .then((results) => {
        let idx = 0;
        if (canManageSettings) {
          setSettings(results[idx].data);
          setForm(results[idx].data);
          idx += 1;
        }
        if (canManageUsers) {
          setUsers(results[idx].data);
          setRoles(results[idx + 1].data);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [canManageSettings, canManageUsers]);

  const handleSave = async () => {
    try {
      const res = await settingsApi.update(form);
      setSettings(res.data);
      setSuccess('Settings saved');
    } catch (e) { setError(e.message); }
  };

  const getAssignableRoles = () => {
    if (user?.role === 'admin') return roles;
    if (user?.role === 'manager') {
      return roles.filter((r) => MANAGER_ASSIGNABLE.includes(r.value));
    }
    return roles.filter((r) => r.value !== 'admin' && r.value !== 'manager');
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await userApi.updateUser(userId, { role });
      const u = await userApi.getAllUsers();
      setUsers(u.data);
      setSuccess('Role updated');
    } catch (e) { setError(e.message); }
  };

  const handleAddField = async (entity) => {
    try {
      await settingsApi.addCustomField(entity, newField);
      const s = await settingsApi.get();
      setSettings(s.data);
      setForm(s.data);
      setNewField({ name: '', label: '', type: 'text' });
      setSuccess('Custom field added');
    } catch (e) { setError(e.message); }
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'language', label: t('settings.language') },
    ...(canManageSettings ? [
      { id: 'company', label: 'Company' },
      { id: 'fields', label: 'Custom Fields' },
    ] : []),
    ...(canManageUsers ? [{ id: 'users', label: 'Users & Roles' }] : []),
  ];

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const assignableRoles = getAssignableRoles();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and organization preferences" />
      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {tabs.map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === item.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <Profile embedded />}

      {tab === 'company' && canManageSettings && (
        <div className="card max-w-2xl p-6 space-y-4">
          <Input label="Company Name" value={form.companyName || ''} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          <Input label="Company Email" value={form.companyEmail || ''} onChange={(e) => setForm({ ...form, companyEmail: e.target.value })} />
          <Input label="Company Phone" value={form.companyPhone || ''} onChange={(e) => setForm({ ...form, companyPhone: e.target.value })} />
          <Input label="Address" value={form.companyAddress || ''} onChange={(e) => setForm({ ...form, companyAddress: e.target.value })} />
          <Input label="Timezone" value={form.timezone || 'UTC'} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      )}

      {tab === 'users' && canManageUsers && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr><th className="table-th">User</th><th className="table-th">Email</th><th className="table-th">Current Role</th><th className="table-th">Change Role</th><th className="table-th">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="table-td font-medium">{u.fullName}</td>
                  <td className="table-td">{u.email}</td>
                  <td className="table-td"><Badge variant="info">{u.roleLabel}</Badge></td>
                  <td className="table-td">
                    <select
                      className="form-input w-40"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={u.id === user?.id}
                    >
                      {assignableRoles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                  <td className="table-td"><Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'fields' && canManageSettings && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {['contact', 'deal'].map((entity) => (
            <div key={entity} className="card p-6">
              <h3 className="mb-4 font-semibold capitalize text-slate-900">{entity} Custom Fields</h3>
              <div className="mb-4 space-y-2">
                {(form[`custom${entity === 'contact' ? 'Contact' : 'Deal'}Fields`] || []).map((f) => (
                  <div key={f.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-sm">{f.label} ({f.type})</span>
                    <Badge>{f.name}</Badge>
                  </div>
                ))}
              </div>
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <Input label="Field Name" value={newField.name} onChange={(e) => setNewField({ ...newField, name: e.target.value })} />
                <Input label="Label" value={newField.label} onChange={(e) => setNewField({ ...newField, label: e.target.value })} />
                <Button onClick={() => handleAddField(entity)}>Add Field</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'language' && (
        <div className="card max-w-2xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{t('settings.language')}</h3>
            <p className="mt-1 text-sm text-slate-500">{t('settings.languageDesc')}</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {LANGUAGES.map((lang) => {
              const selected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    if (canManageSettings) {
                      setForm((prev) => ({ ...prev, defaultLanguage: lang.code }));
                    }
                    setSuccess('Language updated');
                  }}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                    selected
                      ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-2xl leading-none">{lang.flag}</span>
                  <div>
                    <p className="text-sm font-semibold">{lang.native}</p>
                    <p className={`text-xs ${selected ? 'text-slate-300' : 'text-slate-500'}`}>{lang.label}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {canSaveOrgSettings ? (
            <Button onClick={handleSave}>Save as organization default</Button>
          ) : (
            <p className="text-xs text-slate-500">Your language preference is saved on this device.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
