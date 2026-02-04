import React, { useState } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { useAuth } from '@/contexts/AuthContext';
import { Lead, PipelineStage } from '@/types/sales';
import {
  GripVertical,
  MoreVertical,
  Phone,
  Mail,
  Building,
  DollarSign,
  User,
  ChevronDown,
  Filter,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PipelinePage: React.FC = () => {
  const { t } = useTranslation();
  const { leads, moveLead, leadsLoading, pipelineStages } = useSales();
  const { users } = useAuth();
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string>('');

  const filteredLeads = filterAssignee
    ? leads.filter(l => l.assignedTo === filterAssignee)
    : leads;

  const getLeadsByStage = (stage: PipelineStage) => {
    return filteredLeads.filter(lead => lead.status === stage);
  };

  const getTotalValue = (stage: PipelineStage) => {
    return getLeadsByStage(stage).reduce((sum, lead) => sum + lead.dealValue, 0);
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    if (draggedLead && draggedLead.status !== stage) {
      await moveLead(draggedLead.id, stage);
    }
    setDraggedLead(null);
    setDragOverStage(null);
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
    setDragOverStage(null);
  };

  if (leadsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-slate-500">{t('loading')} pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('pipeline')}</h2>
          <p className="text-slate-500">{t('pipeline_desc')}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="appearance-none pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              <option value="">{t('all_members')}</option>
              {users.filter(u => u.role === 'sales').map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {pipelineStages.map((stage) => (
          <div key={stage.id} className="bg-white rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full ${stage.color}`} />
              <span className="text-xs font-medium text-slate-500 truncate">{stage.label}</span>
            </div>
            <p className="text-lg font-bold text-slate-900">Rp {(getTotalValue(stage.id) / 1000).toFixed(0)}K</p>
            <p className="text-xs text-slate-400">{getLeadsByStage(stage.id).length} {t('deals_count')}</p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max h-full">
          {pipelineStages.map((stage) => {
            const stageLeads = getLeadsByStage(stage.id);
            const isDropTarget = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                className={`
                  w-72 flex-shrink-0 flex flex-col bg-slate-50 rounded-2xl transition-all
                  ${isDropTarget ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
                `}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                      <h3 className="font-semibold text-slate-900">{stage.label}</h3>
                    </div>
                    <span className="text-sm font-medium text-slate-500 bg-white px-2 py-0.5 rounded-lg">
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-sm text-slate-500">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">Rp {getTotalValue(stage.id).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-380px)]">
                  {stageLeads.map((lead) => {
                    const assignedUser = users.find(u => u.id === lead.assignedTo);
                    const isDragging = draggedLead?.id === lead.id;

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                        onDragEnd={handleDragEnd}
                        className={`
                          bg-white rounded-xl p-4 shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing
                          hover:shadow-md hover:border-slate-200 transition-all
                          ${isDragging ? 'opacity-50 scale-95' : ''}
                        `}
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-slate-300" />
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                              {lead.name.charAt(0)}
                            </div>
                          </div>
                          <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>

                        {/* Card Content */}
                        <h4 className="font-semibold text-slate-900 mb-1">{lead.name}</h4>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                          <Building className="w-3 h-3" />
                          {lead.company}
                        </p>

                        {/* Deal Value */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-bold text-slate-900">
                            Rp {lead.dealValue.toLocaleString('id-ID')}
                          </span>
                          <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">
                            {lead.productInterest && lead.productInterest.length > 0
                              ? lead.productInterest[0].split(' ')[0]
                              : 'N/A'}
                          </span>
                        </div>

                        {/* Tags */}
                        {lead.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {lead.tags.slice(0, 2).map(tag => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            {assignedUser?.avatar ? (
                              <img
                                src={assignedUser.avatar}
                                alt={assignedUser.name}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-slate-500" />
                              </div>
                            )}
                            <span className="text-xs text-slate-500">{assignedUser?.name?.split(' ')[0] || t('unassigned')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <a
                              href={`mailto:${lead.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Mail className="w-4 h-4 text-slate-400" />
                            </a>
                            <a
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Phone className="w-4 h-4 text-slate-400" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {stageLeads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                      <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-2">
                        <Building className="w-6 h-6" />
                      </div>
                      <p className="text-sm">{t('no_deals')}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PipelinePage;
