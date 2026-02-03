import React, { useState } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { useAuth } from '@/contexts/AuthContext';
import { Lead, PIPELINE_STAGES, PipelineStage } from '@/types/sales';
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Phone,
  Mail,
  Building,
  ChevronDown,
  Edit,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LeadModal from './LeadModal';
import LeadDetailModal from './LeadDetailModal';

const LeadsPage: React.FC = () => {
  const { t } = useTranslation();
  const { filteredLeads, leadFilters, setLeadFilters, deleteLead, importLeads, leadsLoading } = useSales();
  const { user, users } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const products = ['Enterprise CRM', 'Analytics Suite', 'Marketing Automation', 'Sales Intelligence', 'Customer Support Platform', 'Data Integration'];

  const handleSearch = (value: string) => {
    setLeadFilters({ ...leadFilters, search: value });
  };

  const handleStatusFilter = (status: PipelineStage | 'all') => {
    setLeadFilters({ ...leadFilters, status });
  };

  const handleExportCSV = () => {
    const headers = [t('name'), t('company'), t('email_label'), t('phone'), t('product_interest'), t('value'), t('status'), 'Tags'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.company,
      lead.email,
      lead.phone,
      lead.productInterest,
      lead.dealValue,
      lead.status,
      lead.tags.join('; ')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(1);
      const leads = lines.filter(line => line.trim()).map(line => {
        const [name, company, email, phone, productInterest, dealValue] = line.split(',');
        return {
          name: name?.trim(),
          company: company?.trim(),
          email: email?.trim(),
          phone: phone?.trim(),
          productInterest: productInterest?.trim(),
          dealValue: parseFloat(dealValue) || 0,
          status: 'new_lead' as PipelineStage,
          tags: [],
          assignedTo: user?.id || '',
          source: 'CSV Import',
          notes: '',
        };
      });
      importLeads(leads);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeads(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (leadsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-slate-500">{t('loading')} leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('leads')}</h2>
          <p className="text-slate-500">{filteredLeads.length} {t('leads_found')}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">{t('import')}</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">{t('export')}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/30"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">{t('add_lead')}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('search_leads_placeholder')}
              value={leadFilters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={leadFilters.status}
              onChange={(e) => handleStatusFilter(e.target.value as PipelineStage | 'all')}
              className="appearance-none pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
            >
              <option value="all">{t('all_statuses')}</option>
              {PIPELINE_STAGES.map(stage => (
                <option key={stage.key} value={stage.key}>{stage.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>

          {/* More Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
          >
            <Filter className="w-5 h-5" />
            <span className="font-medium">{t('filters')}</span>
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="px-4 pb-4 pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Product Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('product_interest')}</label>
              <select
                value={leadFilters.product}
                onChange={(e) => setLeadFilters({ ...leadFilters, product: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t('all_products')}</option>
                {products.map(product => (
                  <option key={product} value={product}>{product}</option>
                ))}
              </select>
            </div>

            {/* Assigned To Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('assigned_to')}</label>
              <select
                value={leadFilters.assignedTo}
                onChange={(e) => setLeadFilters({ ...leadFilters, assignedTo: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t('all_members')}</option>
                {users.filter(u => u.role === 'sales').map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            {/* Deal Value Range */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('min_value')}</label>
              <input
                type="number"
                value={leadFilters.minValue}
                onChange={(e) => setLeadFilters({ ...leadFilters, minValue: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="$0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('max_value')}</label>
              <input
                type="number"
                value={leadFilters.maxValue}
                onChange={(e) => setLeadFilters({ ...leadFilters, maxValue: parseInt(e.target.value) || 1000000 })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="$1,000,000"
              />
            </div>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">{t('leads')}</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700 hidden md:table-cell">Contact</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700 hidden lg:table-cell">{t('product')}</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">{t('value')}</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">{t('status')}</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700 hidden xl:table-cell">Tags</th>
                <th className="px-4 py-4 text-right text-sm font-semibold text-slate-700">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => {
                const stage = PIPELINE_STAGES.find(s => s.key === lead.status);
                const assignedUser = users.find(u => u.id === lead.assignedTo);

                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setViewingLead(lead)}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={() => toggleSelectLead(lead.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{lead.name}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {lead.company}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-600 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </p>
                        <p className="text-sm text-slate-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-sm text-slate-600">{lead.productInterest}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-slate-900">${lead.dealValue.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${stage?.color} text-white`}>
                        {stage?.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden xl:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {lead.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-600">
                            {tag}
                          </span>
                        ))}
                        {lead.tags.length > 2 && (
                          <span className="text-xs text-slate-400">+{lead.tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingLead(lead)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                          onClick={() => setEditingLead(lead)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(t('delete_confirm'))) {
                              deleteLead(lead.id);
                            }
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">{t('no_leads_found')}</h3>
            <p className="text-slate-500">{t('adjust_search')}</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {(showAddModal || editingLead) && (
        <LeadModal
          lead={editingLead}
          onClose={() => {
            setShowAddModal(false);
            setEditingLead(null);
          }}
        />
      )}

      {viewingLead && (
        <LeadDetailModal
          lead={viewingLead}
          onClose={() => setViewingLead(null)}
          onEdit={() => {
            setEditingLead(viewingLead);
            setViewingLead(null);
          }}
        />
      )}
    </div>
  );
};

export default LeadsPage;
