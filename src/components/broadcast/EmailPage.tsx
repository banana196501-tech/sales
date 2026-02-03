import React, { useState } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { BroadcastTemplate, BroadcastCampaign } from '@/types/sales';
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
  BarChart3
} from 'lucide-react';

const EmailPage: React.FC = () => {
  const { templates, campaigns, leads, addCampaign, sendCampaign } = useSales();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates'>('campaigns');
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [campaignName, setCampaignName] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const emailTemplates = templates.filter(t => t.type === 'email');
  const emailCampaigns = campaigns.filter(c => c.type === 'email');

  const totalSent = emailCampaigns.reduce((sum, c) => sum + c.stats.sent, 0);
  const totalDelivered = emailCampaigns.reduce((sum, c) => sum + c.stats.delivered, 0);
  const totalRead = emailCampaigns.reduce((sum, c) => sum + c.stats.read, 0);
  const openRate = totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0;

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
          <h2 className="text-2xl font-bold text-slate-900">Email Broadcast</h2>
          <p className="text-slate-500">Create and manage email campaigns</p>
        </div>
        <button
          onClick={() => setShowNewCampaign(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/30"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
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
              <p className="text-sm text-slate-500">Total Campaigns</p>
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
              <p className="text-sm text-slate-500">Emails Sent</p>
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
              <p className="text-sm text-slate-500">Open Rate</p>
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
              <p className="text-sm text-slate-500">Replies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === 'campaigns'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Campaigns
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === 'templates'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Templates
        </button>
      </div>

      {/* Content */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Campaign</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 hidden md:table-cell">Recipients</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 hidden lg:table-cell">Performance</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Actions</th>
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
                              <span className="text-slate-500">Open Rate</span>
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
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <BarChart3 className="w-4 h-4 text-slate-500" />
                          </button>
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

          {emailCampaigns.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No campaigns yet</h3>
              <p className="text-slate-500 mb-4">Create your first email campaign</p>
              <button
                onClick={() => setShowNewCampaign(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Campaign
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
                  <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <Edit className="w-4 h-4 text-slate-400" />
                  </button>
                  <button className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{template.name}</h3>
              {template.subject && (
                <p className="text-sm text-slate-500 mb-2">Subject: {template.subject}</p>
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
          <button className="bg-slate-50 rounded-2xl p-5 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center min-h-[200px]">
            <div className="p-3 bg-blue-100 rounded-xl mb-3">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <p className="font-medium text-slate-700">Add Template</p>
          </button>
        </div>
      )}

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewCampaign(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900">Create Email Campaign</h2>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Monthly Newsletter"
                />
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Template</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {emailTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedTemplate === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-medium text-slate-900">{template.name}</p>
                      {template.subject && (
                        <p className="text-sm text-slate-500">Subject: {template.subject}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Recipients ({selectedLeads.length} selected)
                </label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{lead.name}</p>
                        <p className="text-sm text-slate-500">{lead.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setSelectedLeads(filteredLeads.map(l => l.id))}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => setSelectedLeads([])}
                    className="text-sm text-slate-600 hover:text-slate-700"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowNewCampaign(false)}
                className="px-6 py-2.5 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={!campaignName || !selectedTemplate || selectedLeads.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl transition-all font-medium shadow-lg shadow-blue-500/30 disabled:shadow-none"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailPage;
