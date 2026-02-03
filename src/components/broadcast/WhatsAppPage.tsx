import React, { useState } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { BroadcastTemplate, BroadcastCampaign } from '@/types/sales';
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
  Filter
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const WhatsAppPage: React.FC = () => {
  const { t } = useTranslation();
  const { templates, campaigns, leads, addCampaign, sendCampaign } = useSales();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates'>('campaigns');
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [campaignName, setCampaignName] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
        <button
          onClick={() => setShowNewCampaign(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-green-500/30"
        >
          <Plus className="w-4 h-4" />
          {t('new_campaign')}
        </button>
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
      </div>

      {/* Content */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
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
                  const template = templates.find(t => t.id === campaign.templateId);
                  const deliveryRate = campaign.stats.total > 0
                    ? Math.round((campaign.stats.delivered / campaign.stats.total) * 100)
                    : 0;

                  return (
                    <tr key={campaign.id} className="hover:bg-slate-50 transition-colors">
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
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <Eye className="w-4 h-4 text-slate-500" />
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
            <div key={template.id} className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <Edit className="w-4 h-4 text-slate-400" />
                  </button>
                  <button className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
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
          <button className="bg-slate-50 rounded-2xl p-5 border-2 border-dashed border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all flex flex-col items-center justify-center min-h-[200px]">
            <div className="p-3 bg-green-100 rounded-xl mb-3">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-medium text-slate-700">{t('add_template')}</p>
          </button>
        </div>
      )}

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewCampaign(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900">{t('create_wa_campaign')}</h2>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('campaign_name')}</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Q1 Product Launch"
                />
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('message_template')}</label>
                <div className="space-y-2">
                  {whatsappTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedTemplate === template.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <p className="font-medium text-slate-900">{template.name}</p>
                      <p className="text-sm text-slate-500 line-clamp-2 mt-1">{template.content}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('select_recipients')} ({selectedLeads.length} {t('selected_count')})
                </label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Search leads..."
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                  {filteredLeads.slice(0, 20).map((lead) => (
                    <label
                      key={lead.id}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
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
                        className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{lead.name}</p>
                        <p className="text-sm text-slate-500">{lead.company} • {lead.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setSelectedLeads(filteredLeads.map(l => l.id))}
                    className="text-sm text-green-600 hover:text-green-700"
                  >
                    {t('select_all')}
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => setSelectedLeads([])}
                    className="text-sm text-slate-600 hover:text-slate-700"
                  >
                    {t('clear')}
                  </button>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('schedule_optional')}</label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowNewCampaign(false)}
                className="px-6 py-2.5 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors font-medium"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={!campaignName || !selectedTemplate || selectedLeads.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl transition-all font-medium shadow-lg shadow-green-500/30 disabled:shadow-none"
              >
                {t('create_campaign_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppPage;
