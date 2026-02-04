import React, { useState } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { useAuth } from '@/contexts/AuthContext';
import { Lead, PipelineStage } from '@/types/sales';
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
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LeadModal from './LeadModal';
import LeadDetailModal from './LeadDetailModal';
import ConfirmModal from '../ui/ConfirmModal';

const LeadsPage: React.FC = () => {
  const { t } = useTranslation();
  const { filteredLeads, leadFilters, setLeadFilters, updateLead, deleteLead, deleteAllLeads, importLeads, leadsLoading, products, pipelineStages } = useSales();
  const { user, users } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id?: string; type: 'single' | 'bulk' | 'truncate' } | null>(null);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [importConflicts, setImportConflicts] = useState<{
    newLead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>;
    existingLead: Lead;
  }[]>([]);
  const [nonConflictingLeads, setNonConflictingLeads] = useState<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [leadFilters, filteredLeads.length]);

  const handleSearch = (value: string) => {
    setLeadFilters({ ...leadFilters, search: value });
  };

  const handleStatusFilter = (status: PipelineStage | 'all') => {
    setLeadFilters({ ...leadFilters, status });
  };

  const executeExport = () => {
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
    setShowExportConfirm(false);
  };

  const executeImport = async () => {
    if (!pendingImportFile) return;
    const file = pendingImportFile;
    setPendingImportFile(null);
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const allLines = text.split(/\r?\n/).filter(line => line.trim());
        if (allLines.length === 0) return;

        // Better CSV splitter to handle commas inside quotes if needed
        const splitLine = (l: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < l.length; i++) {
            if (l[i] === '"' && (i === 0 || (i > 0 && l[i - 1] !== '\\'))) {
              inQuotes = !inQuotes;
            } else if (l[i] === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += l[i];
            }
          }
          result.push(current.trim());
          return result.map(s => s.replace(/^"|"$/g, '').trim());
        };

        const firstLineCols = splitLine(allLines[0]);
        const headerLine = allLines[0].toLowerCase();
        const hasHeaders = headerLine.includes('name') || headerLine.includes('nama') ||
          headerLine.includes('email') || headerLine.includes('phone') ||
          headerLine.includes('given name');

        let nameIdx = -1, emailIdx = -1, phoneIdx = -1, companyIdx = -1, valueIdx = -1;
        let dataLines = allLines;

        if (hasHeaders) {
          nameIdx = firstLineCols.findIndex(c => /\b(name|nama|display name|full name)\b/i.test(c));
          emailIdx = firstLineCols.findIndex(c => /\b(email|e-mail|mail)\b/i.test(c));
          phoneIdx = firstLineCols.findIndex(c => /\b(phone|mobile|telp|tel|whatsapp)\b/i.test(c));
          companyIdx = firstLineCols.findIndex(c => /\b(company|perusahaan|organization|label)\b/i.test(c));
          valueIdx = firstLineCols.findIndex(c => /\b(value|deal|amount|harga)\b/i.test(c));

          dataLines = allLines.slice(1);

          // Google Contacts specific columns if standard ones not found
          if (nameIdx === -1) {
            nameIdx = firstLineCols.findIndex(c => /\bgiven\s*name\b/i.test(c));
          }
          if (phoneIdx === -1) {
            phoneIdx = firstLineCols.findIndex(c => /\bphone\s*1\b/i.test(c));
          }
        }

        const leadsToImport = dataLines.map(line => {
          const cols = splitLine(line);
          if (cols.length < 1) return null;

          let name = '';
          let phone = '';
          let email = '';
          let company = '';
          let dealValue = 0;

          if (hasHeaders) {
            if (nameIdx !== -1) {
              name = cols[nameIdx] || '';
              if (firstLineCols[nameIdx].toLowerCase().includes('given')) {
                const familyIdx = firstLineCols.findIndex(c => /\bfamily\s*name\b/i.test(c));
                if (familyIdx !== -1 && cols[familyIdx]) {
                  name = `${name} ${cols[familyIdx]}`.trim();
                }
              }
            }
            phone = phoneIdx !== -1 ? cols[phoneIdx].replace(/[^\d+]/g, '') : '';
            email = emailIdx !== -1 ? cols[emailIdx] : '';
            company = companyIdx !== -1 ? cols[companyIdx] : '';
            dealValue = valueIdx !== -1 ? parseFloat(cols[valueIdx].replace(/[^\d.]/g, '')) || 0 : 0;
          } else {
            name = cols[0] || 'Unknown';
            if (cols[2] && cols[2].length > 1 && !cols[2].includes('@') && !/[\d]{5,}/.test(cols[2])) {
              name = `${name} ${cols[2]}`.trim();
            } else if (cols[1] && cols[1].length > 1 && !cols[1].includes('@') && !/[\d]{5,}/.test(cols[1])) {
              company = cols[1];
            }

            cols.forEach((col, idx) => {
              if (idx === 0) return;
              if (!email && col.includes('@')) email = col;
              if (!phone && /^\+?[\d\s-]{8,}$/.test(col) && col.replace(/[^\d]/g, '').length >= 8) {
                phone = col.replace(/[^\d+]/g, '');
              }
            });
          }

          if (!phone) {
            const anyPhone = cols.find(c => /^\+?[\d\s-]{10,}$/.test(c) && c.replace(/[^\d]/g, '').length >= 8);
            if (anyPhone) phone = anyPhone.replace(/[^\d+]/g, '');
          }

          let normalizedPhone = phone.trim();
          if (normalizedPhone) {
            let digits = normalizedPhone.replace(/[^\d]/g, '');
            if (digits.startsWith('62')) {
              normalizedPhone = digits;
            } else if (digits.startsWith('0')) {
              normalizedPhone = '62' + digits.slice(1);
            } else if (digits.length >= 9) {
              normalizedPhone = '62' + digits;
            }
          }

          return {
            name: name.trim() || 'Unknown',
            company: company.trim() || '',
            email: email.trim() || '',
            phone: normalizedPhone,
            productInterest: [] as string[],
            dealValue: dealValue,
            status: 'new_lead' as PipelineStage,
            tags: [],
            assignedTo: user?.id || '',
            source: 'CSV Import',
            notes: '',
          };
        }).filter(l => l !== null) as Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[];

        // Check for duplicates
        const currentLeads = [...filteredLeads]; // Use all available leads for faster check
        const conflicts: { newLead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>; existingLead: Lead }[] = [];
        const clear: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[] = [];

        leadsToImport.forEach(newLead => {
          const existing = currentLeads.find(l => l.phone && newLead.phone && l.phone === newLead.phone);
          if (existing) {
            conflicts.push({ newLead, existingLead: existing });
          } else {
            clear.push(newLead);
          }
        });

        if (conflicts.length > 0) {
          setImportConflicts(conflicts);
          setNonConflictingLeads(clear);
          setShowConflictModal(true);
        } else {
          await importLeads(clear);
        }
      } catch (error) {
        console.error("Import error", error);
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleResolveConflicts = async (action: 'replace' | 'duplicate' | 'skip') => {
    setShowConflictModal(false);
    setIsImporting(true);

    try {
      const finalLeadsToCreate = [...nonConflictingLeads];

      if (action === 'replace') {
        for (const conflict of importConflicts) {
          await updateLead(conflict.existingLead.id, conflict.newLead);
        }
      } else if (action === 'duplicate') {
        finalLeadsToCreate.push(...importConflicts.map(c => c.newLead));
      }

      if (finalLeadsToCreate.length > 0) {
        await importLeads(finalLeadsToCreate);
      } else if (action === 'replace') {
        // No new ones to create, but we updated existing ones. toast already handled by updateLead.
      }
    } catch (error) {
      console.error("Error resolving conflicts:", error);
    } finally {
      setIsImporting(false);
      setImportConflicts([]);
      setNonConflictingLeads([]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length && filteredLeads.length > 0) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelectLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLeads(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const onConfirmDelete = async () => {
    if (!confirmDelete) return;

    if (confirmDelete.type === 'single' && confirmDelete.id) {
      await deleteLead(confirmDelete.id);
    } else if (confirmDelete.type === 'bulk') {
      for (const id of selectedLeads) {
        await deleteLead(id);
      }
      setSelectedLeads([]);
    } else if (confirmDelete.type === 'truncate') {
      await deleteAllLeads();
      setSelectedLeads([]);
    }
    setConfirmDelete(null);
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
          {selectedLeads.length > 0 && (
            <button
              onClick={() => setConfirmDelete({ type: selectedLeads.length === filteredLeads.length ? 'truncate' : 'bulk' })}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-all shadow-lg shadow-red-100/50 active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">
                {selectedLeads.length === filteredLeads.length ? 'Hapus Semua' : `Hapus (${selectedLeads.length})`}
              </span>
            </button>
          )}

          <label className={`flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition-colors ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span className="text-sm font-medium hidden sm:inline">{isImporting ? 'Importing...' : t('import')}</span>
            <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && setPendingImportFile(e.target.files[0])} className="hidden" disabled={isImporting} />
          </label>
          <button
            onClick={() => setShowExportConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">{t('export')}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/30 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">{t('add_lead')}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 transition-all duration-300">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
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

          <div className="relative">
            <select
              value={leadFilters.status}
              onChange={(e) => handleStatusFilter(e.target.value as PipelineStage | 'all')}
              className="appearance-none pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
            >
              <option value="all">{t('all_statuses')}</option>
              {pipelineStages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
          >
            <Filter className="w-5 h-5" />
            <span className="font-medium">{t('filters')}</span>
          </button>
        </div>

        {showFilters && (
          <div className="px-4 pb-4 pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top duration-200">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('product_interest')}</label>
              <select
                value={leadFilters.product}
                onChange={(e) => setLeadFilters({ ...leadFilters, product: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t('all_products')}</option>
                {products.map(product => (
                  <option key={product.id} value={product.name}>{product.name}</option>
                ))}
              </select>
            </div>

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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('min_value')}</label>
              <input
                type="number"
                value={leadFilters.minValue}
                onChange={(e) => setLeadFilters({ ...leadFilters, minValue: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Rp 0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('max_value')}</label>
              <input
                type="number"
                value={leadFilters.maxValue}
                onChange={(e) => setLeadFilters({ ...leadFilters, maxValue: parseInt(e.target.value) || 1000000000 })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Rp 1.000.000.000"
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
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
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
              {paginatedLeads.map((lead) => {
                const stage = pipelineStages.find(s => s.id === lead.status);
                const isSelected = selectedLeads.includes(lead.id);

                return (
                  <tr
                    key={lead.id}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/30' : ''}`}
                    onClick={() => setViewingLead(lead)}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectLead(lead.id, e as any)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium shrink-0">
                          {lead.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{lead.name}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-1 truncate">
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
                      <span className="text-sm text-slate-600">
                        {Array.isArray(lead.productInterest) ? lead.productInterest.join(', ') : lead.productInterest || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-slate-900 whitespace-nowrap">Rp {(lead.dealValue || 0).toLocaleString('id-ID')}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${stage?.color} text-white whitespace-nowrap`}>
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingLead(lead)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        </button>
                        <button
                          onClick={() => setEditingLead(lead)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ id: lead.id, type: 'single' })}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
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
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t('no_leads_found')}</h3>
            <p className="text-slate-500 max-w-sm mx-auto">{t('adjust_search')}</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredLeads.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>{t('showing')}</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>{t('of')} <strong>{filteredLeads.length}</strong> {t('entries')}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 3 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === pageNum
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                      : 'hover:bg-slate-100 text-slate-600'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      )}

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

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={onConfirmDelete}
        title={
          confirmDelete?.type === 'truncate' ? 'Hapus Semua Lead' :
            confirmDelete?.type === 'bulk' ? `Hapus ${selectedLeads.length} Lead` :
              'Hapus Lead'
        }
        message={
          confirmDelete?.type === 'truncate' ? 'Apakah Anda yakin ingin menghapus SEMUA lead secara permanen? Tindakan ini tidak dapat dibatalkan.' :
            confirmDelete?.type === 'bulk' ? `Apakah Anda yakin ingin menghapus ${selectedLeads.length} lead terpilih?` :
              'Apakah Anda yakin ingin menghapus lead ini?'
        }
        confirmText={confirmDelete?.type === 'truncate' ? 'Ya, Hapus Semua' : 'Ya, Hapus'}
        variant="danger"
      />

      <ConfirmModal
        isOpen={showExportConfirm}
        onClose={() => setShowExportConfirm(false)}
        onConfirm={executeExport}
        title="Ekspor ke CSV"
        message={`Apakah Anda yakin ingin mengekspor ${filteredLeads.length} lead ke file CSV?`}
        confirmText="Ekspor Sekarang"
        variant="info"
      />

      <ConfirmModal
        isOpen={!!pendingImportFile}
        onClose={() => setPendingImportFile(null)}
        onConfirm={executeImport}
        title="Impor dari CSV"
        message={`Apakah Anda yakin ingin mengimpor data lead dari file "${pendingImportFile?.name}"?`}
        confirmText="Impor Sekarang"
        variant="warning"
      />

      {showConflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConflictModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Konflik Data Ditemukan</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-6">
                Ada <strong>{importConflicts.length}</strong> data dengan nomor telepon yang sudah terdaftar di sistem. Pilih tindakan yang ingin dilakukan:
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleResolveConflicts('replace')}
                  className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group text-left"
                >
                  <div className="pr-4">
                    <p className="font-bold text-slate-900 group-hover:text-indigo-700">Perbarui (Replace)</p>
                    <p className="text-xs text-slate-500 mt-1">Gunakan data dari file untuk mengupdate informasi lead yang sudah ada.</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 shrink-0" />
                </button>

                <button
                  onClick={() => handleResolveConflicts('duplicate')}
                  className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left"
                >
                  <div className="pr-4">
                    <p className="font-bold text-slate-900 group-hover:text-emerald-700">Tetap Impor (Duplikat)</p>
                    <p className="text-xs text-slate-500 mt-1">Masukkan sebagai data baru. Sistem akan memiliki dua lead dengan nomor yang sama.</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 shrink-0" />
                </button>

                <button
                  onClick={() => handleResolveConflicts('skip')}
                  className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-slate-500 hover:bg-slate-50 transition-all group text-left"
                >
                  <div className="pr-4">
                    <p className="font-bold text-slate-900 group-hover:text-slate-700">Abaikan Semua Konflik</p>
                    <p className="text-xs text-slate-500 mt-1">Hanya mengimpor data yang benar-benar baru (belum ada di sistem).</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 shrink-0" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowConflictModal(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:text-slate-900 transition-colors"
              >
                Batal Impor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay for Import */}
      {isImporting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
          <div className="relative bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-90 duration-200">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-100 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Upload className="w-6 h-6 text-indigo-600 animate-bounce" />
              </div>
            </div>
            <div className="text-center">
              <h4 className="text-lg font-bold text-slate-900">Sedang Memproses Data</h4>
              <p className="text-slate-500 text-sm mt-1">Mohon tunggu sebentar, sistem sedang sinkronisasi...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;
