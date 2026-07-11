import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, Calendar } from 'lucide-react';
import { reportApi } from '../../lib/api';
import { formatCurrency } from '../../lib/currency';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const COLORS = ['#1e293b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ from: '', to: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const res = await reportApi.getDashboard(params);
      setData(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleExport = async () => {
    try {
      const res = await reportApi.exportReport(filters);
      const url = URL.createObjectURL(res);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'crm-report.xlsx';
      a.click();
    } catch {}
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Sales performance, conversion rates, and team metrics"
        actions={<Button variant="secondary" onClick={handleExport}><Download className="h-4 w-4" /> Export Excel</Button>}
      />

      <div className="card mb-6 flex flex-wrap items-end gap-4 p-4">
        <div>
          <label className="form-label">From</label>
          <input type="date" className="form-input" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        </div>
        <div>
          <label className="form-label">To</label>
          <input type="date" className="form-input" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
        <Button onClick={load}><Calendar className="h-4 w-4" /> Apply Filter</Button>
      </div>

      {data && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Contacts" value={data.summary.totalContacts} />
            <StatCard label="Conversion Rate" value={`${data.summary.conversionRate}%`} />
            <StatCard label="Won Deals" value={data.summary.wonDeals} />
            <StatCard label="Forecast Revenue" value={formatCurrency(data.summary.forecastRevenue)} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <h3 className="mb-4 font-semibold text-slate-900">Deal Pipeline Value by Stage</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.dealsByStage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, name) => name === 'value' ? formatCurrency(v) : v} />
                  <Bar dataKey="value" fill="#1e293b" name="value" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="count" fill="#3b82f6" name="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <h3 className="mb-4 font-semibold text-slate-900">Lead Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={data.leadsByStatus.filter((l) => l.count > 0)} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label>
                    {data.leadsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5 lg:col-span-2">
              <h3 className="mb-4 font-semibold text-slate-900">Revenue by Month</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {data.teamPerformance?.length > 0 && (
            <div className="card mt-6">
              <div className="border-b border-slate-200 px-5 py-4"><h3 className="font-semibold text-slate-900">Team Performance</h3></div>
              <table className="w-full">
                <thead className="bg-slate-50"><tr>
                  <th className="table-th">Member</th><th className="table-th">Deals</th><th className="table-th">Won</th><th className="table-th">Value</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.teamPerformance.map((t, i) => (
                    <tr key={i}><td className="table-td font-medium">{t.name}</td><td className="table-td">{t.totalDeals}</td><td className="table-td">{t.won}</td><td className="table-td font-semibold">{formatCurrency(t.totalValue)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
