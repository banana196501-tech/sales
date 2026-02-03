import React, { useMemo } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import { PIPELINE_STAGES } from '@/types/sales';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { leads, tasks, leadsLoading } = useSales();
  const { users } = useAuth();

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
    return PIPELINE_STAGES.map(stage => ({
      stage: stage.key,
      label: stage.label,
      count: leads.filter(l => l.status === stage.key).length,
      value: leads.filter(l => l.status === stage.key).reduce((sum, l) => sum + l.dealValue, 0),
    }));
  }, [leads]);

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

  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const overdueTasks = tasks.filter(t => t.status === 'pending' && new Date(t.dueDate) < new Date()).length;

  const kpiCards = [
    {
      title: t('total_leads'),
      value: stats.totalLeads,
      change: '+12%',
      positive: true,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: t('active_deals'),
      value: stats.activeDeals,
      change: '+8%',
      positive: true,
      icon: Target,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: t('closing_rate'),
      value: `${stats.closingRate}%`,
      change: '+3.2%',
      positive: true,
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: t('revenue'),
      value: `$${(stats.revenue / 1000).toFixed(0)}K`,
      change: '+18%',
      positive: true,
      icon: DollarSign,
      color: 'from-amber-500 to-orange-500',
    },
  ];

  const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#22c55e', '#ef4444'];

  if (leadsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">{card.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${card.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {card.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    <span className="font-medium">{card.change}</span>
                    <span className="text-slate-400">{t('vs_last_month')}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Value Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{t('revenue_chart')}</h3>
              <p className="text-sm text-slate-500">{t('distribution')}</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}K`} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="url(#colorRevenue)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Distribution */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">{t('distribution')}</h3>
            <p className="text-sm text-slate-500">{t('leads')} {t('status')}</p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={pipelineData.filter(d => d.count > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="label"
                >
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [value, name]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pipelineData.slice(0, 4).map((item, index) => (
              <div key={item.stage} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-slate-600 truncate">{item.label}</span>
                <span className="font-medium text-slate-900 ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Performance */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{t('sales_performance')}</h3>
              <p className="text-sm text-slate-500">Team leaderboard</p>
            </div>
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {salesPerformance.length > 0 ? (
              salesPerformance.map((person, index) => (
                <div key={person.userId} className="flex items-center gap-4">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${index === 0 ? 'bg-amber-100 text-amber-700' :
                      index === 1 ? 'bg-slate-100 text-slate-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'}
                  `}>
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {person.avatar ? (
                      <img src={person.avatar} alt={person.userName} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {person.userName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{person.userName}</p>
                      <p className="text-sm text-slate-500">{person.dealsClosed} {t('deals_closed')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">${(person.revenue / 1000).toFixed(0)}K</p>
                    <p className="text-sm text-emerald-600">{person.conversionRate}% rate</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-4">{t('no_sales_data')}</p>
            )}
          </div>
        </div>

        {/* Tasks Overview */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{t('tasks_overview')}</h3>
              <p className="text-sm text-slate-500">Your pending tasks</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-amber-700">{pendingTasks}</p>
              <p className="text-sm text-amber-600">Pending Tasks</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-red-700">{overdueTasks}</p>
              <p className="text-sm text-red-600">{t('overdue')}</p>
            </div>
          </div>

          <div className="space-y-3">
            {tasks.filter(t => t.status !== 'completed').slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className={`
                  w-2 h-2 rounded-full
                  ${task.priority === 'high' ? 'bg-red-500' :
                    task.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'}
                `} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                  <p className="text-xs text-slate-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                </div>
                <span className={`
                  text-xs px-2 py-1 rounded-lg font-medium
                  ${task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}
                `}>
                  {task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                </span>
              </div>
            ))}
            {tasks.filter(t => t.status !== 'completed').length === 0 && (
              <p className="text-slate-500 text-center py-4">No pending tasks</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{t('recent_leads')}</h3>
            <p className="text-sm text-slate-500">Latest additions to your pipeline</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                <th className="pb-3 font-medium">{t('name')}</th>
                <th className="pb-3 font-medium">{t('company')}</th>
                <th className="pb-3 font-medium hidden md:table-cell">{t('product')}</th>
                <th className="pb-3 font-medium">{t('value')}</th>
                <th className="pb-3 font-medium">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.slice(0, 5).map((lead) => {
                const stage = PIPELINE_STAGES.find(s => s.key === lead.status);
                return (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3">
                      <p className="font-medium text-slate-900">{lead.name}</p>
                      <p className="text-sm text-slate-500">{lead.email}</p>
                    </td>
                    <td className="py-3 text-slate-600">{lead.company}</td>
                    <td className="py-3 text-slate-600 hidden md:table-cell">{lead.productInterest}</td>
                    <td className="py-3 font-medium text-slate-900">${lead.dealValue.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${stage?.color} text-white`}>
                        {stage?.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    {t('no_leads')}
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

export default Dashboard;
