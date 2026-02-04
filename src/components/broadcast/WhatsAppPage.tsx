import React, { useState } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { BroadcastTemplate, BroadcastCampaign, Lead } from '@/types/sales';
import LeadModal from '../leads/LeadModal';
import {
  MessageSquare,
  Plus,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  Calendar,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Paperclip,
  Link as LinkIcon,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from '../ui/ConfirmModal';

const WhatsAppPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    templates,
    campaigns,
    leads,
    addCampaign,
    sendCampaign,
    deleteCampaign,
    deleteAllCampaigns,
    deleteAllCommunicationLogs,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    communicationLogs
  } = useSales();

  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'history'>('campaigns');
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [campaignName, setCampaignName] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<{ id?: string; type: 'single' | 'bulk' | 'truncate' | 'clear-history' } | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);

  // Template Management State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BroadcastTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    content: '',
    attachments: [] as string[]
  });

  const whatsappTemplates = templates.filter(t => t.type === 'whatsapp');
  const whatsappCampaigns = campaigns.filter(c => c.type === 'whatsapp');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'sending': return 'bg-blue-100 text-blue-700';
      case 'scheduled': return 'bg-amber-100 text-amber-700';
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'sending': return <Send className="w-4 h-4 animate-pulse" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleCreateCampaign = () => {
    if (!campaignName || !selectedTemplate || selectedLeads.length === 0) return;

    addCampaign({
      name: campaignName,
      type: 'whatsapp',
      templateId: selectedTemplate,
      status: scheduleDate ? 'scheduled' : 'draft',
      scheduledAt: scheduleDate || undefined,
      recipients: selectedLeads,
      stats: {
        total: selectedLeads.length,
        sent: 0,
        delivered: 0,
        read: 0,
        replied: 0,
        failed: 0,
      },
    });

    setShowNewCampaign(false);
    setCampaignName('');
    setSelectedTemplate('');
    setSelectedLeads([]);
    setScheduleDate('');
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.content) return;

    // Extract variables from content ({{variable}})
    const variables = templateForm.content.match(/{{([^}]+)}}/g)?.map(v => v.replace(/{{|}}/g, '')) || [];

    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, {
        name: templateForm.name,
        content: templateForm.content,
        variables: variables,
        attachments: templateForm.attachments
      });
    } else {
      await addTemplate({
        name: templateForm.name,
        type: 'whatsapp',
        content: templateForm.content,
        variables: variables,
        attachments: templateForm.attachments
      });
    }

    setShowTemplateModal(false);
    setEditingTemplate(null);
    setTemplateForm({ name: '', content: '', attachments: [] });
  };

  const handleEditTemplate = (template: BroadcastTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      content: template.content,
      attachments: template.attachments || []
    });
    setShowTemplateModal(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm(t('delete_confirm_template') || 'Are you sure you want to delete this template?')) {
      await deleteTemplate(id);
    }
  };

  const onConfirmDelete = async () => {
    if (!confirmDelete) return;

    try {
      if (confirmDelete.type === 'single' && confirmDelete.id) {
        await deleteCampaign(confirmDelete.id);
      } else if (confirmDelete.type === 'bulk') {
        for (const id of selectedCampaigns) {
          await deleteCampaign(id);
        }
        setSelectedCampaigns([]);
      } else if (confirmDelete.type === 'truncate') {
        await deleteAllCampaigns('whatsapp');
        setSelectedCampaigns([]);
      } else if (confirmDelete.type === 'clear-history') {
        await deleteAllCommunicationLogs('whatsapp');
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setConfirmDelete(null);
    }
  };

  const toggleSelectAllCampaigns = () => {
    if (selectedCampaigns.length === whatsappCampaigns.length && whatsappCampaigns.length > 0) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(whatsappCampaigns.map(c => c.id));
    }
  };

  const toggleSelectCampaign = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCampaigns(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('whatsapp')}</h2>
          <p className="text-slate-500">{t('broadcast_wa_desc')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewCampaign(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-green-500/30"
          >
            <Plus className="w-4 h-4" />
            {t('new_campaign')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{whatsappCampaigns.length}</p>
              <p className="text-sm text-slate-500">{t('total_campaigns')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {whatsappCampaigns.reduce((sum, c) => sum + c.stats.sent, 0)}
              </p>
              <p className="text-sm text-slate-500">{t('messages_sent')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {whatsappCampaigns.reduce((sum, c) => sum + c.stats.delivered, 0)}
              </p>
              <p className="text-sm text-slate-500">{t('delivered')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {whatsappCampaigns.reduce((sum, c) => sum + c.stats.read, 0)}
              </p>
              <p className="text-sm text-slate-500">{t('read')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'campaigns'
            ? 'bg-green-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
          {t('campaigns_tab')}
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'templates'
            ? 'bg-green-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
          {t('templates_tab')}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'history'
            ? 'bg-green-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
          {t('history_log') || 'History Log'}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">{whatsappCampaigns.length} WhatsApp {t('campaigns_tab')}</h3>
            <div className="flex items-center gap-2">
              {selectedCampaigns.length > 0 && (
                <button
                  onClick={() => setConfirmDelete({ type: 'bulk' })}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('delete')} ({selectedCampaigns.length})
                </button>
              )}
              {whatsappCampaigns.length > 0 && (
                <button
                  onClick={() => setConfirmDelete({ type: 'truncate' })}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('delete_all')}
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCampaigns.length === whatsappCampaigns.length && whatsappCampaigns.length > 0}
                      onChange={toggleSelectAllCampaigns}
                      className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">{t('campaign_label')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">{t('status')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 hidden md:table-cell">{t('recipients')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 hidden lg:table-cell">{t('performance')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">{t('date_label')}</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {whatsappCampaigns.map((campaign) => {
                  const isSelected = selectedCampaigns.includes(campaign.id);
                  const template = templates.find(t => t.id === campaign.templateId);

                  return (
                    <tr
                      key={campaign.id}
                      className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-green-50/50' : ''}`}
                      onClick={(e) => toggleSelectCampaign(campaign.id, e as any)}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectCampaign(campaign.id, e as any)}
                          className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{campaign.name}</p>
                            <p className="text-sm text-slate-500">{template?.name || 'Unknown template'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(campaign.status)}`}>
                          {getStatusIcon(campaign.status)}
                          <span className="capitalize">{campaign.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">{campaign.stats.total}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-slate-600">
                            <span className="font-medium text-emerald-600">{campaign.stats.delivered}</span> {t('delivered').toLowerCase()}
                          </span>
                          <span className="text-slate-600">
                            <span className="font-medium text-blue-600">{campaign.stats.read}</span> {t('read').toLowerCase()}
                          </span>
                          <span className="text-slate-600">
                            <span className="font-medium text-purple-600">{campaign.stats.replied}</span> {t('replied').toLowerCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">
                          {campaign.sentAt
                            ? new Date(campaign.sentAt).toLocaleDateString()
                            : campaign.scheduledAt
                              ? `Scheduled: ${new Date(campaign.scheduledAt).toLocaleDateString()}`
                              : 'Not scheduled'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {campaign.status === 'draft' && (
                            <button
                              onClick={() => sendCampaign(campaign.id)}
                              className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                              title="Send Now"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete({ id: campaign.id, type: 'single' });
                            }}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {whatsappCampaigns.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">{t('no_campaigns')}</h3>
              <p className="text-slate-500 mb-4">{t('create_wa_campaign_desc')}</p>
              <button
                onClick={() => setShowNewCampaign(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('create_campaign_btn')}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {whatsappTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-shadow relative">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 text-slate-400 hover:text-green-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{template.name}</h3>
              <p className="text-sm text-slate-600 line-clamp-3 mb-3">{template.content}</p>
              <div className="flex flex-wrap gap-1">
                {template.variables.map(variable => (
                  <span key={variable} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-md">
                    {`{{${variable}}}`}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Add Template Card */}
          <button
            onClick={() => {
              setEditingTemplate(null);
              setTemplateForm({ name: '', content: '', attachments: [] });
              setShowTemplateModal(true);
            }}
            className="bg-slate-50 rounded-2xl p-5 border-2 border-dashed border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all flex flex-col items-center justify-center min-h-[200px]"
          >
            <div className="p-3 bg-green-100 rounded-xl mb-3">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-medium text-slate-700">{t('add_template')}</p>
          </button>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">
              {communicationLogs.filter(log => log.type === 'whatsapp').length} {t('history_log') || 'History Log'}
            </h3>
            {communicationLogs.filter(log => log.type === 'whatsapp').length > 0 && (
              <button
                onClick={() => setConfirmDelete({ type: 'clear-history' })}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Semua Riwayat
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Recipient</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date & Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Content / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {communicationLogs
                  .filter(log => log.type === 'whatsapp')
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((log) => {
                    const lead = leads.find(l => l.id === log.leadId);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-2">
                          <button
                            onClick={() => lead && setViewingLead(lead)}
                            className="text-left hover:text-green-600 transition-colors"
                          >
                            <p className="font-medium text-slate-900">{lead?.name || 'Unknown'}</p>
                            <p className="text-sm text-slate-500">{lead?.phone}</p>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 capitalize">
                          {log.type}
                        </td>
                        <td className="px-6 py-4 text-sm capitalize">
                          <span className={`px-2 py-1 rounded-md text-xs font-semibold ${log.status === 'sent' ? 'bg-emerald-100 text-emerald-700' :
                            log.status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                          {log.content}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          {communicationLogs.filter(l => l.type === 'whatsapp').length === 0 && (
            <div className="py-12 text-center text-slate-500">
              No WhatsApp logs found.
            </div>
          )}
        </div>
      )}

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNewCampaign(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50/30 flex items-center gap-4">
              <div className="p-3 bg-green-600 rounded-2xl shadow-lg shadow-green-200 text-white">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t('create_wa_campaign')}</h2>
                <p className="text-sm text-slate-500">Kirim pesan WhatsApp massal ke para lead</p>
              </div>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('campaign_name')}</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  placeholder="Contoh: Promo Servis Rutin"
                />
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('message_template')}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {whatsappTemplates.length > 0 ? (
                    whatsappTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all group ${selectedTemplate === template.id
                          ? 'border-green-500 bg-green-50 shadow-md shadow-green-100'
                          : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <p className={`font-bold text-sm ${selectedTemplate === template.id ? 'text-green-700' : 'text-slate-700'}`}>{template.name}</p>
                        <p className="text-[10px] text-slate-400 mt-1 truncate">{template.content}</p>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                      <p className="text-sm text-slate-400 mb-4">Belum ada template WhatsApp.</p>
                      <button
                        onClick={() => {
                          setShowNewCampaign(false);
                          setActiveTab('templates');
                          setShowTemplateModal(true);
                        }}
                        className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-sm font-bold hover:bg-green-100 transition-colors"
                      >
                        + Buat Template Pertama
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recipients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">
                    {t('select_recipients')}
                  </label>
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    {selectedLeads.length} {t('selected_count')}
                  </span>
                </div>

                <div className="relative mb-3 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm"
                    placeholder="Cari penerima (Nama, Perusahaan, atau No. HP)..."
                  />
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-sm">
                  {filteredLeads.slice(0, 50).map((lead) => (
                    <label
                      key={lead.id}
                      className="flex items-center gap-4 p-3.5 hover:bg-green-50/30 cursor-pointer transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads([...selectedLeads, lead.id]);
                          } else {
                            setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                          }
                        }}
                        className="w-5 h-5 rounded-lg border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm group-hover:text-green-700 transition-colors">{lead.name}</p>
                        <p className="text-xs text-slate-500 truncate">{lead.company} • {lead.phone}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setViewingLead(lead);
                        }}
                        className="p-2 hover:bg-green-100 rounded-lg text-slate-400 hover:text-green-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-4 px-1">
                  <button
                    onClick={() => setSelectedLeads(filteredLeads.map(l => l.id))}
                    className="text-xs font-bold text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {t('select_all')}
                  </button>
                  <button
                    onClick={() => setSelectedLeads([])}
                    className="text-xs font-bold text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {t('clear')}
                  </button>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('schedule_optional')}</label>
                <div className="p-1 bg-slate-50 border border-slate-200 rounded-2xl flex items-center focus-within:ring-2 focus-within:ring-green-500 transition-all">
                  <div className="p-2.5 text-slate-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="flex-1 bg-transparent py-2.5 pr-4 outline-none text-sm text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowNewCampaign(false)}
                className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-2xl transition-all font-semibold text-sm"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={!campaignName || !selectedTemplate || selectedLeads.length === 0}
                className="px-8 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-2xl transition-all font-bold text-sm shadow-xl shadow-green-500/20 disabled:shadow-none"
              >
                {t('create_campaign_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={onConfirmDelete}
        title={
          confirmDelete?.type === 'truncate' ? t('delete_all') :
            confirmDelete?.type === 'clear-history' ? t('clear_history') :
              confirmDelete?.type === 'bulk' ? `${t('delete')} (${selectedCampaigns.length})` :
                t('delete')
        }
        message={
          confirmDelete?.type === 'truncate' ? t('truncate_campaigns_confirm') :
            confirmDelete?.type === 'clear-history' ? t('clear_history_confirm') :
              confirmDelete?.type === 'bulk' ? t('delete_campaign_confirm_bulk', { count: selectedCampaigns.length }) :
                t('delete_campaign_confirm')
        }
        confirmText={
          confirmDelete?.type === 'truncate' ? t('yes_delete_all') :
            confirmDelete?.type === 'clear-history' ? t('yes_clear_history') :
              t('yes_delete')
        }
        variant="danger"
      />

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowTemplateModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50/30 flex items-center gap-4">
              <div className="p-3 bg-green-600 rounded-2xl shadow-lg shadow-green-200 text-white">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingTemplate ? 'Edit Template WhatsApp' : 'Buat Template WhatsApp'}
                </h2>
                <p className="text-sm text-slate-500">Sesuaikan pesan instan untuk pelanggan Anda</p>
              </div>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Template</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                  placeholder="Contoh: Promo Honda"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Pesan WhatsApp</label>
                <textarea
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm leading-relaxed"
                  rows={6}
                  placeholder={`Halo {{name}},\nAda penawaran menarik dari {{company}}!`}
                />
                <div className="flex items-center gap-2 mt-2 px-1">
                  <div className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase tracking-wider">Tip</div>
                  <p className="text-xs text-slate-500">
                    Gunakan {'{{name}}'}, {'{{company}}'} untuk pesan personal.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('attachments_label')}</label>
                <div className="space-y-3">
                  {templateForm.attachments.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {templateForm.attachments.map((url, index) => (
                        <div key={index} className="group relative flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-green-200 hover:bg-green-50/30 transition-all">
                          <div className="p-2 bg-white rounded-lg shadow-sm group-hover:text-green-600">
                            <Paperclip className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-900 truncate">{url.split('/').pop()}</p>
                            <p className="text-[10px] text-slate-500 truncate">{url}</p>
                          </div>
                          <button
                            onClick={() => setTemplateForm({
                              ...templateForm,
                              attachments: templateForm.attachments.filter((_, i) => i !== index)
                            })}
                            className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 p-1 bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-green-500 transition-all">
                    <div className="p-2.5 text-slate-400">
                      <LinkIcon className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      id="new-wa-attachment-url"
                      placeholder={t('attachment_placeholder')}
                      className="flex-1 bg-transparent py-2.5 outline-none text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.currentTarget;
                          const url = input.value.trim();
                          if (url) {
                            setTemplateForm({
                              ...templateForm,
                              attachments: [...templateForm.attachments, url]
                            });
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('new-wa-attachment-url') as HTMLInputElement;
                        const url = input.value.trim();
                        if (url) {
                          setTemplateForm({
                            ...templateForm,
                            attachments: [...templateForm.attachments, url]
                          });
                          input.value = '';
                        }
                      }}
                      className="px-5 py-2 mr-1 bg-white hover:bg-green-600 hover:text-white text-green-600 rounded-xl transition-all font-bold text-xs shadow-sm shadow-green-100"
                    >
                      {t('add_btn')}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 px-1 italic">{t('attachment_desc')}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-2xl transition-all font-semibold"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateForm.name || !templateForm.content}
                className="px-10 py-2.5 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all font-bold shadow-lg shadow-green-200 disabled:opacity-50 disabled:shadow-none"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Lead Modal */}
      {viewingLead && (
        <LeadModal lead={viewingLead} onClose={() => setViewingLead(null)} />
      )}
    </div>
  );
};

export default WhatsAppPage;
