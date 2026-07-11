import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { Users, DollarSign, Target, TrendingUp, CheckSquare, AlertTriangle } from 'lucide-react';
import { reportApi } from '../../lib/api';
import { formatCurrency } from '../../lib/currency';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

const COLORS = ['#1e293b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const STAGE_LABELS = { prospect: 'Prospect', qualified: 'Qualified', proposal: 'Proposal', negotiation: 'Negotiation', won: 'Won', lost: 'Lost' };
const STATUS_LABELS = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', lost: 'Lost', converted: 'Converted' };

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportApi.getDashboard().then((res) => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!data) return <p className="text-center text-slate-500">Failed to load dashboard</p>;

  const { summary, leadsByStatus, leadsBySource, dealsByStage, revenueByMonth, teamPerformance, recentDeals, overdueTasks } = data;

  return (
    <div className="w-full max-w-full overflow-hidden">
      <PageHeader title="Dashboard" subtitle="Overview of your CRM performance" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Contacts" value={summary.totalContacts} icon={Users} color="blue" />
        <StatCard label="Open Deals" value={summary.openDeals} icon={Target} color="amber" />
        <StatCard label="Pipeline Value" value={formatCurrency(summary.pipelineValue)} icon={DollarSign} color="green" />
        <StatCard label="Conversion Rate" value={`${summary.conversionRate}%`} icon={TrendingUp} color="purple" change={`${summary.wonDeals} deals won`} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Won Deals" value={summary.wonDeals} color="green" />
        <StatCard label="Forecast Revenue" value={formatCurrency(summary.forecastRevenue)} color="blue" />
        <StatCard label="Active Tasks" value={summary.totalTasks} icon={CheckSquare} color="slate" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Deals by Stage</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dealsByStage.map((d) => ({ ...d, label: STAGE_LABELS[d.stage] || d.stage }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1e293b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Leads by Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={leadsByStatus.filter((l) => l.count > 0).map((l) => ({ ...l, label: STATUS_LABELS[l.status] || l.status }))} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={90} label={({ label, count }) => `${label}: ${count}`}>
                {leadsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Lead Sources</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={leadsBySource} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="source" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Recent Deals</h3>
            <Link to="/deals" className="text-xs text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentDeals?.length ? recentDeals.map((d) => (
              <div key={d._id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{d.title}</p>
                  <p className="text-xs text-slate-500">{d.assignedTo?.firstName} {d.assignedTo?.lastName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(d.value)}</p>
                  <Badge variant={d.stage === 'won' ? 'success' : d.stage === 'lost' ? 'danger' : 'info'}>{STAGE_LABELS[d.stage]}</Badge>
                </div>
              </div>
            )) : <p className="px-5 py-8 text-center text-sm text-slate-500">No deals yet</p>}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Overdue Tasks
            </h3>
            <Link to="/tasks" className="text-xs text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {overdueTasks?.length ? overdueTasks.map((t) => (
              <div key={t._id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{t.title}</p>
                  <p className="text-xs text-slate-500">{t.assignedTo?.firstName} {t.assignedTo?.lastName}</p>
                </div>
                <Badge variant="danger">{t.priority}</Badge>
              </div>
            )) : <p className="px-5 py-8 text-center text-sm text-slate-500">No overdue tasks</p>}
          </div>
        </div>
      </div>

      {teamPerformance?.length > 0 && (
        <div className="card mt-6">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Team Performance</h3>
          </div>
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="table-th">Team Member</th>
                  <th className="table-th">Total Deals</th>
                  <th className="table-th">Won</th>
                  <th className="table-th">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamPerformance.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="table-td font-medium">{t.name}</td>
                    <td className="table-td">{t.totalDeals}</td>
                    <td className="table-td">{t.won}</td>
                    <td className="table-td font-semibold">{formatCurrency(t.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
