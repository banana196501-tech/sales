import React, { useState, useMemo } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { useAuth } from '@/contexts/AuthContext';

import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Download,
  ArrowUpRight,
  Target,
  Award,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { leads, campaigns, leadsLoading, pipelineStages, products } = useSales();
  const { users } = useAuth();
  const [dateRange, setDateRange] = useState('year');

  // Calculate stats from real data
  const stats = useMemo(() => {
    const closedWon = leads.filter(l => l.status === 'closed_won');
    const activeDeals = leads.filter(l => !['closed_won', 'closed_lost'].includes(l.status));
    const totalRevenue = closedWon.reduce((sum, l) => sum + l.dealValue, 0);
    const closingRate = leads.length > 0 ? Math.round((closedWon.length / leads.length) * 100) : 0;

    return {
      totalLeads: leads.length,
      activeDeals: activeDeals.length,
      closingRate,
      revenue: totalRevenue,
    };
  }, [leads]);

  // Pipeline data
  const pipelineData = useMemo(() => {
    return pipelineStages.map(stage => ({
      stage: stage.id,
      label: stage.label,
      count: leads.filter(l => l.status === stage.id).length,
      value: leads.filter(l => l.status === stage.id).reduce((sum, l) => sum + l.dealValue, 0),
    }));
  }, [leads, pipelineStages]);

  // Sales performance
  const salesPerformance = useMemo(() => {
    return users.filter(u => u.role === 'sales').map(user => {
      const userLeads = leads.filter(l => l.assignedTo === user.id);
      const closedWon = userLeads.filter(l => l.status === 'closed_won');
      return {
        userId: user.id,
        userName: user.name,
        avatar: user.avatar,
        leadsAssigned: userLeads.length,
        dealsClosed: closedWon.length,
        revenue: closedWon.reduce((sum, l) => sum + l.dealValue, 0),
        conversionRate: userLeads.length > 0 ? Math.round((closedWon.length / userLeads.length) * 100) : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [leads, users]);

  // Monthly revenue (simulated based on lead creation dates)
  const monthlyRevenue = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => {
      const monthLeads = leads.filter(l => {
        const date = new Date(l.createdAt);
        return date.getMonth() === index && l.status === 'closed_won';
      });
      return {
        month,
        revenue: monthLeads.reduce((sum, l) => sum + l.dealValue, 0),
        deals: monthLeads.length,
      };
    });
  }, [leads]);

  const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#22c55e', '#ef4444'];

  // Product performance data
  // Product performance data
  const productData = useMemo(() => {
    return products.map(product => {
      const productLeads = leads.filter(l => Array.isArray(l.productInterest) ? l.productInterest.includes(product.name) : l.productInterest === product.name);
      const closedWon = productLeads.filter(l => l.status === 'closed_won');
      return {
        name: product.name,
        leads: productLeads.length,
        revenue: closedWon.reduce((sum, l) => sum + l.dealValue, 0),
        conversion: productLeads.length > 0 ? Math.round((closedWon.length / productLeads.length) * 100) : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [leads, products]);

  // Lead source data
  const sourceData = useMemo(() => {
    const sources = Array.from(new Set(leads.map(l => l.source).filter(Boolean)));
    if (sources.length === 0) return [];
    const total = leads.length || 1;
    return sources.map(source => ({
      name: source,
      value: Math.round((leads.filter(l => l.source === source).length / total) * 100),
    })).sort((a, b) => b.value - a.value);
  }, [leads]);

  // Conversion funnel data
  const funnelData = useMemo(() => {
    const newLeads = leads.filter(l => l.status === 'new_lead').length;
    const total = leads.length || 1;
    return [
      { stage: 'New Leads', count: newLeads, percentage: 100 },
      { stage: 'Contacted', count: leads.filter(l => l.status === 'contacted').length, percentage: Math.round((leads.filter(l => ['contacted', 'presentation', 'negotiation', 'closed_won'].includes(l.status)).length / total) * 100) },
      { stage: 'Presentation', count: leads.filter(l => l.status === 'presentation').length, percentage: Math.round((leads.filter(l => ['presentation', 'negotiation', 'closed_won'].includes(l.status)).length / total) * 100) },
      { stage: 'Negotiation', count: leads.filter(l => l.status === 'negotiation').length, percentage: Math.round((leads.filter(l => ['negotiation', 'closed_won'].includes(l.status)).length / total) * 100) },
      { stage: 'Closed Won', count: leads.filter(l => l.status === 'closed_won').length, percentage: Math.round((leads.filter(l => l.status === 'closed_won').length / total) * 100) },
    ];
  }, [leads]);

  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: stats,
      monthlyRevenue,
      pipelineData,
      salesPerformance,
      productData,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  if (leadsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-slate-500">{t('loading')} analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('analytics')}</h2>
          <p className="text-slate-500">{t('performance')} and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="week">{t('this_week')}</option>
            <option value="month">{t('this_month')}</option>
            <option value="quarter">{t('this_quarter')}</option>
            <option value="year">{t('this_year')}</option>
          </select>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/30"
          >
            <Download className="w-4 h-4" />
            {t('export')}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
              +18%
            </span>
          </div>
          <p className="text-3xl font-bold">Rp {(stats.revenue / 1000000).toFixed(1)}M</p>
          <p className="text-white/80 text-sm mt-1">{t('total_revenue')}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
              +12%
            </span>
          </div>
          <p className="text-3xl font-bold">{stats.closingRate}%</p>
          <p className="text-white/80 text-sm mt-1">{t('closing_rate')}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
              +8%
            </span>
          </div>
          <p className="text-3xl font-bold">{stats.totalLeads}</p>
          <p className="text-white/80 text-sm mt-1">{t('total_leads')}</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
              +5%
            </span>
          </div>
          <p className="text-3xl font-bold">{stats.activeDeals}</p>
          <p className="text-white/80 text-sm mt-1">{t('active_deals')}</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{t('revenue_trend')}</h3>
              <p className="text-sm text-slate-500">{t('monthly_rev_desc')}</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `Rp ${v / 1000000}M`} />
                <Tooltip
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deals Closed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{t('deals_closed_label')}</h3>
              <p className="text-sm text-slate-500">{t('deals_closed_desc')}</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="deals" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">{t('conv_funnel')}</h3>
            <p className="text-sm text-slate-500">{t('funnel_desc')}</p>
          </div>
          <div className="space-y-4">
            {funnelData.map((item, index) => (
              <div key={item.stage}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">{item.stage}</span>
                  <span className="font-medium text-slate-900">{item.count}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">{t('lead_sources')}</h3>
            <p className="text-sm text-slate-500">{t('source_desc')}</p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Share']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {sourceData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-slate-600 truncate">{item.name}</span>
                <span className="font-medium text-slate-900 ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">{t('top_products')}</h3>
            <p className="text-sm text-slate-500">{t('top_products_desc')}</p>
          </div>
          <div className="space-y-4">
            {productData.slice(0, 5).map((product, index) => (
              <div key={product.name} className="flex items-center gap-3">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                  ${index === 0 ? 'bg-amber-100 text-amber-700' :
                    index === 1 ? 'bg-slate-100 text-slate-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'}
                `}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate text-sm">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.leads} {t('leads_found')}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900 text-sm">Rp {(product.revenue / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-emerald-600">{product.conversion}% conv.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Team Performance */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{t('sales_performance')}</h3>
            <p className="text-sm text-slate-500">{t('team_leaderboard')}</p>
          </div>
          <Award className="w-5 h-5 text-amber-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                <th className="pb-3 font-medium">{t('rank')}</th>
                <th className="pb-3 font-medium">{t('sales_rep')}</th>
                <th className="pb-3 font-medium">{t('total_leads')}</th>
                <th className="pb-3 font-medium">{t('deals_closed_label')}</th>
                <th className="pb-3 font-medium">{t('revenue')}</th>
                <th className="pb-3 font-medium">{t('conversion_rate')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesPerformance.map((person, index) => (
                <tr key={person.userId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${index === 0 ? 'bg-amber-100 text-amber-700' :
                        index === 1 ? 'bg-slate-100 text-slate-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'}
                    `}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      {person.avatar ? (
                        <img src={person.avatar} alt={person.userName} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {person.userName.charAt(0)}
                        </div>
                      )}
                      <p className="font-medium text-slate-900">{person.userName}</p>
                    </div>
                  </td>
                  <td className="py-4 text-slate-600">{person.leadsAssigned}</td>
                  <td className="py-4 text-slate-600">{person.dealsClosed}</td>
                  <td className="py-4">
                    <span className="font-semibold text-slate-900">Rp {person.revenue.toLocaleString('id-ID')}</span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          style={{ width: `${person.conversionRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{person.conversionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {salesPerformance.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    {t('no_sales_data')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
