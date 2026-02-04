import React, { useState } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { useAuth } from '@/contexts/AuthContext';
import { Lead, CommunicationLog } from '@/types/sales';
import {
  X,
  Phone,
  Mail,
  Building,
  Calendar,
  Tag,
  Edit,
  MessageSquare,
  Send,
  Clock,
  User,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
  onEdit: () => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose, onEdit }) => {
  const { t } = useTranslation();
  const { communicationLogs, addCommunicationLog, tasks, pipelineStages } = useSales();
  const { user, users } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'notes'>('details');
  const [newNote, setNewNote] = useState('');

  const leadLogs = communicationLogs.filter(log => log.leadId === lead.id);
  const leadTasks = tasks.filter(task => task.leadId === lead.id);

  // Combine logs and tasks into a single feed
  const allActivity = [
    ...leadLogs.map(log => ({
      ...log,
      activityType: 'communication' as const,
      date: new Date(log.createdAt)
    })),
    ...leadTasks.map(task => ({
      ...task,
      activityType: 'task' as const,
      date: new Date(task.createdAt),
      type: 'task' as const // For icon/color mapping
    })),
    // Include base notes from the lead record if present
    ...(lead.notes ? [{
      id: 'initial-note',
      leadId: lead.id,
      type: 'note' as const,
      content: lead.notes,
      subject: 'Informasi Tambahan / Catatan Awal',
      status: 'delivered' as const,
      createdBy: lead.assignedTo,
      createdAt: lead.createdAt,
      date: new Date(lead.createdAt),
      activityType: 'communication' as const
    }] : [])
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const stage = pipelineStages.find(s => s.id === lead.status);
  const assignedUser = users.find(u => u.id === lead.assignedTo);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await addCommunicationLog({
        leadId: lead.id,
        type: 'note',
        content: newNote,
        status: 'delivered',
        createdBy: user?.id || '',
      });
      toast({ title: t('note_added'), description: t('note_added_desc') });
      setNewNote('');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' });
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'whatsapp': return <MessageSquare className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'task': return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
      case 'replied':
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-inner">
                {lead.name.charAt(0)}
              </div>
              <div className="flex-1 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold text-white leading-tight">{lead.name}</h2>
                  <button
                    onClick={onEdit}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold backdrop-blur-sm border border-white/10"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>{t('edit')}</span>
                  </button>
                </div>
                <p className="text-white/80 flex items-center gap-2 mt-2 font-medium">
                  <Building className="w-4 h-4" />
                  {lead.company}
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${stage?.color} text-white shadow-sm`}>
                    {stage?.label}
                  </span>
                  <span className="text-white/80 text-sm">
                    {t('value')}: <span className="font-bold text-white italic">Rp {lead.dealValue.toLocaleString('id-ID')}</span>
                  </span>
                </div>
              </div>
            </div>
            {/* Close button space placeholder */}
            <div className="w-10 h-10 shrink-0" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {(['details', 'activity', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-280px)] p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Mail className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <a href={`mailto:${lead.email}`} className="text-slate-900 hover:text-indigo-600">
                        {lead.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Phone className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Phone</p>
                      <a href={`tel:${lead.phone}`} className="text-slate-900 hover:text-indigo-600">
                        {lead.phone || 'Not provided'}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deal Info */}
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Deal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">Product Interest</p>
                    <p className="text-slate-900 font-medium">{lead.productInterest || 'Not specified'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">Lead Source</p>
                    <p className="text-slate-900 font-medium">{lead.source || 'Unknown'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">Assigned To</p>
                    <div className="flex items-center gap-2 mt-1">
                      {assignedUser?.avatar ? (
                        <img src={assignedUser.avatar} alt={assignedUser.name} className="w-6 h-6 rounded-full" />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      )}
                      <span className="text-slate-900 font-medium">{assignedUser?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">Created</p>
                    <p className="text-slate-900 font-medium">
                      {new Date(lead.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {lead.tags.length > 0 ? (
                    lead.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-slate-500">No tags assigned</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Send Email
                  </a>
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                  <a
                    href={`https://wa.me/${lead.phone?.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              {allActivity.length > 0 ? (
                allActivity.map((item: any) => {
                  const creator = users.find(u => u.id === item.createdBy || u.id === item.assignedTo);
                  const isTask = item.activityType === 'task';

                  return (
                    <div key={item.id} className="flex gap-4 p-4 bg-slate-50 rounded-xl relative overflow-hidden group">
                      {isTask && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />}
                      <div className={`p-2 rounded-lg h-fit ${item.type === 'email' ? 'bg-blue-100 text-blue-600' :
                        item.type === 'whatsapp' ? 'bg-green-100 text-green-600' :
                          item.type === 'call' ? 'bg-amber-100 text-amber-600' :
                            item.type === 'meeting' ? 'bg-purple-100 text-purple-600' :
                              item.type === 'task' ? 'bg-indigo-100 text-indigo-600' :
                                'bg-slate-200 text-slate-600'
                        }`}>
                        {getLogIcon(item.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900 capitalize">
                            {isTask ? `Task: ${item.title}` : item.type}
                          </p>
                          <div className="flex items-center gap-2 text-xs font-medium px-2 py-1 bg-white rounded-lg shadow-sm border border-slate-100">
                            {isTask ? (
                              <>
                                <span className={`w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`} />
                                <span className="capitalize">{item.status}</span>
                              </>
                            ) : (
                              <>
                                {getStatusIcon(item.status)}
                                <span className="capitalize ml-1">{item.status}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {!isTask && item.subject && <p className="text-sm font-semibold text-slate-700 mt-1">{item.subject}</p>}
                        <p className="text-slate-600 mt-1 text-sm leading-relaxed">
                          {isTask ? item.description : item.content}
                        </p>
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{creator?.name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{item.date.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500">No activity recorded yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Add Note */}
              <div className="flex gap-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={3}
                  className="flex-1 px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="self-end px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* Notes List */}
              {leadLogs.filter(l => l.type === 'note').length > 0 ? (
                leadLogs.filter(l => l.type === 'note').map((note) => {
                  const creator = users.find(u => u.id === note.createdBy);
                  return (
                    <div key={note.id} className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                      <p className="text-slate-700">{note.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                        <span>{creator?.name || 'Unknown'}</span>
                        <span>•</span>
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500">No notes yet. Add one above!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;
