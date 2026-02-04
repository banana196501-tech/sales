import React, { useState } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { BroadcastTemplate, BroadcastCampaign, Lead } from '@/types/sales';
import LeadModal from '../leads/LeadModal';
import {
  Mail,
  Plus,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  Eye,
  Edit,
  Trash2,
  Search,
  MousePointer,
  BarChart3,
  Calendar,
  Paperclip,
  Link as LinkIcon,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from '../ui/ConfirmModal';
import TiptapEditor from '../ui/TiptapEditor';

const EmailPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    templates,
    campaigns,
    leads,
    communicationLogs,
    addCampaign,
    sendCampaign,
    deleteCampaign,
    deleteAllCampaigns,
    deleteAllCommunicationLogs,
    addTemplate,
    updateTemplate,
    deleteTemplate
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
    subject: '',
    content: '',
    attachments: [] as string[]
  });

  const emailTemplates = templates.filter(t => t.type === 'email');
  const emailCampaigns = campaigns.filter(c => c.type === 'email');

  const totalSent = emailCampaigns.reduce((sum, c) => sum + c.stats.sent, 0);
  const totalDelivered = emailCampaigns.reduce((sum, c) => sum + c.stats.delivered, 0);
  const totalRead = emailCampaigns.reduce((sum, c) => sum + c.stats.read, 0);
  const openRate = totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0;

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
        await deleteAllCampaigns('email');
        setSelectedCampaigns([]);
      } else if (confirmDelete.type === 'clear-history') {
        await deleteAllCommunicationLogs('email');
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setConfirmDelete(null);
    }
  };

  const toggleSelectAllCampaigns = () => {
    if (selectedCampaigns.length === emailCampaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(emailCampaigns.map(c => c.id));
    }
  };

  const toggleSelectCampaign = (id: string) => {
    setSelectedCampaigns(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

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
      type: 'email',
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
        subject: templateForm.subject,
        content: templateForm.content,
        variables: variables,
        attachments: templateForm.attachments
      });
    } else {
      await addTemplate({
        name: templateForm.name,
        type: 'email',
        subject: templateForm.subject,
        content: templateForm.content,
        variables: variables,
        attachments: templateForm.attachments
      });
    }

    setShowTemplateModal(false);
    setEditingTemplate(null);
    setTemplateForm({ name: '', subject: '', content: '', attachments: [] });
  };

  const handleEditTemplate = (template: BroadcastTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject || '',
      content: template.content,
      attachments: template.attachments || []
    });
    setShowTemplateModal(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(id);
    }
  };

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('email')}</h2>
          <p className="text-slate-500">{t('broadcast_email_desc')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewCampaign(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/30"
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
            <div className="p-3 bg-blue-100 rounded-xl">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{emailCampaigns.length}</p>
              <p className="text-sm text-slate-500">{t('total_campaigns')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Send className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalSent}</p>
              <p className="text-sm text-slate-500">{t('messages_sent')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Eye className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{openRate}%</p>
              <p className="text-sm text-slate-500">{t('opened')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <MousePointer className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {emailCampaigns.reduce((sum, c) => sum + c.stats.replied, 0)}
              </p>
              <p className="text-sm text-slate-500">{t('replied')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'campaigns'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
          {t('campaigns_tab')}
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'templates'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
          {t('templates_tab')}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'history'
            ? 'bg-blue-600 text-white'
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
            <h3 className="font-semibold text-slate-800">{emailCampaigns.length} Email {t('campaigns_tab')}</h3>
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
              {emailCampaigns.length > 0 && (
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
                      checked={selectedCampaigns.length === emailCampaigns.length && emailCampaigns.length > 0}
                      onChange={toggleSelectAllCampaigns}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
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
                {emailCampaigns.map((campaign) => {
                  const template = templates.find(t => t.id === campaign.templateId);
                  const openRate = campaign.stats.delivered > 0
                    ? Math.round((campaign.stats.read / campaign.stats.delivered) * 100)
                    : 0;

                  return (
                    <tr key={campaign.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedCampaigns.includes(campaign.id)}
                          onChange={() => toggleSelectCampaign(campaign.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Mail className="w-5 h-5 text-blue-600" />
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
                        <div className="flex items-center gap-4">
                          <div className="flex-1 max-w-32">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-500">{t('opened')}</span>
                              <span className="font-medium text-slate-700">{openRate}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                style={{ width: `${openRate}%` }}
                              />
                            </div>
                          </div>
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
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
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

          {emailCampaigns.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">{t('no_campaigns')}</h3>
              <p className="text-slate-500 mb-4">{t('create_email_campaign_desc')}</p>
              <button
                onClick={() => setShowNewCampaign(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
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
          {emailTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{template.name}</h3>
              {template.subject && (
                <p className="text-sm text-slate-500 mb-2">{t('subject_label')}: {template.subject}</p>
              )}
              <p className="text-sm text-slate-600 line-clamp-3 mb-3">{template.content}</p>
              <div className="flex flex-wrap gap-1">
                {template.variables.map(variable => (
                  <span key={variable} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
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
              setTemplateForm({ name: '', subject: '', content: '', attachments: [] });
              setShowTemplateModal(true);
            }}
            className="bg-slate-50 rounded-2xl p-5 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center min-h-[200px]"
          >
            <div className="p-3 bg-blue-100 rounded-xl mb-3">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <p className="font-medium text-slate-700">{t('add_template')}</p>
          </button>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">
              {communicationLogs.filter(log => log.type === 'email').length} {t('history_log') || 'History Log'}
            </h3>
            {communicationLogs.filter(log => log.type === 'email').length > 0 && (
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
                  .filter(log => log.type === 'email')
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((log) => {
                    const lead = leads.find(l => l.id === log.leadId);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-2">
                          <button
                            onClick={() => lead && setViewingLead(lead)}
                            className="text-left hover:text-blue-600 transition-colors"
                          >
                            <p className="font-medium text-slate-900">{lead?.name || 'Unknown'}</p>
                            <p className="text-sm text-slate-500">{lead?.email}</p>
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
          {communicationLogs.filter(l => l.type === 'email').length === 0 && (
            <div className="py-12 text-center text-slate-500">
              No email logs found.
            </div>
          )}
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTemplateModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50/30 flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 text-white">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingTemplate ? 'Edit Template Email' : 'Buat Template Email'}
                </h2>
                <p className="text-sm text-slate-500">Sesuaikan konten pesan siaran Anda</p>
              </div>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Template</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Contoh: Honda Promo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Subjek Email</label>
                  <input
                    type="text"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Judul email..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Konten Pesan</label>
                <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <TiptapEditor
                    content={templateForm.content}
                    onChange={(content) => setTemplateForm({ ...templateForm, content })}
                    placeholder="Halo {{name}}, perkenalkan penawaran spesial kami..."
                  />
                </div>
                <div className="flex items-center gap-2 mt-2 px-1">
                  <div className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wider">Tip</div>
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
                        <div key={index} className="group relative flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                          <div className="p-2 bg-white rounded-lg shadow-sm group-hover:text-blue-600">
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

                  <div className="flex gap-2 p-1 bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                    <div className="p-2.5 text-slate-400">
                      <LinkIcon className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      id="new-attachment-url"
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
                        const input = document.getElementById('new-attachment-url') as HTMLInputElement;
                        const url = input.value.trim();
                        if (url) {
                          setTemplateForm({
                            ...templateForm,
                            attachments: [...templateForm.attachments, url]
                          });
                          input.value = '';
                        }
                      }}
                      className="px-5 py-2 mr-1 bg-white hover:bg-blue-600 hover:text-white text-blue-600 rounded-xl transition-all font-bold text-xs shadow-sm shadow-blue-100"
                    >
                      {t('add_btn')}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 px-1 italic">{t('attachment_desc')}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-6 py-2.5 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={!templateForm.name || !templateForm.content}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNewCampaign(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50/30 flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 text-white">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t('create_email_campaign')}</h2>
                <p className="text-sm text-slate-500">Kirim pesan siaran ke banyak orang sekaligus</p>
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
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Contoh: Honda Promo Newsletter"
                />
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('message_template')}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {emailTemplates.length > 0 ? (
                    emailTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all group ${selectedTemplate === template.id
                          ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                          : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <p className={`font-bold text-sm ${selectedTemplate === template.id ? 'text-blue-700' : 'text-slate-700'}`}>{template.name}</p>
                        {template.subject && (
                          <p className="text-[10px] text-slate-400 mt-1 truncate">{template.subject}</p>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                      <p className="text-sm text-slate-400 mb-4">Belum ada template Email.</p>
                      <button
                        onClick={() => {
                          setShowNewCampaign(false);
                          setActiveTab('templates');
                          setShowTemplateModal(true);
                        }}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors"
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
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                    {selectedLeads.length} {t('selected_count')}
                  </span>
                </div>

                <div className="relative mb-3 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    placeholder="Cari penerima..."
                  />
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-sm">
                  {filteredLeads.slice(0, 50).map((lead) => (
                    <label
                      key={lead.id}
                      className="flex items-center gap-4 p-3.5 hover:bg-blue-50/30 cursor-pointer transition-colors group"
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
                        className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{lead.name}</p>
                        <p className="text-xs text-slate-500 truncate">{lead.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('schedule_optional')}</label>
                <div className="p-1 bg-slate-50 border border-slate-200 rounded-2xl flex items-center focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                  <div className="p-2.5 text-slate-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-2xl transition-all font-bold text-sm shadow-xl shadow-blue-500/20 disabled:shadow-none"
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

      {/* Lead Modal */}
      {
        viewingLead && (
          <LeadModal lead={viewingLead} onClose={() => setViewingLead(null)} />
        )
      }
    </div>
  );
};

export default EmailPage;
