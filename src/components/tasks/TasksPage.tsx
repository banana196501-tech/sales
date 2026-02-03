import React, { useState } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/types/sales';
import {
  CheckSquare,
  Plus,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Edit,
  Trash2,
  X,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TasksPage: React.FC = () => {
  const { t } = useTranslation();
  const { tasks, leads, addTask, updateTask, deleteTask, tasksLoading } = useSales();
  const { user, users } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    leadId: '',
    assignedTo: user?.id || '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'in_progress' | 'completed',
  });

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  const groupedTasks = {
    overdue: filteredTasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date()),
    today: filteredTasks.filter(t => {
      const today = new Date();
      const dueDate = new Date(t.dueDate);
      return t.status !== 'completed' &&
        dueDate.toDateString() === today.toDateString();
    }),
    upcoming: filteredTasks.filter(t => {
      const today = new Date();
      const dueDate = new Date(t.dueDate);
      return t.status !== 'completed' &&
        dueDate > today &&
        dueDate.toDateString() !== today.toDateString();
    }),
    completed: filteredTasks.filter(t => t.status === 'completed'),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.dueDate) return;

    setIsSubmitting(true);
    try {
      if (editingTask) {
        await updateTask(editingTask.id, formData);
      } else {
        await addTask(formData);
      }

      setShowAddModal(false);
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        leadId: '',
        assignedTo: user?.id || '',
        dueDate: '',
        priority: 'medium',
        status: 'pending',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      leadId: task.leadId || '',
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
    });
    setShowAddModal(true);
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await updateTask(task.id, { status: newStatus });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-slate-600 bg-slate-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return t('high');
      case 'medium': return t('medium');
      case 'low': return t('low');
      default: return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t('pending');
      case 'in_progress': return t('in_progress');
      case 'completed': return t('completed');
      default: return status;
    }
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const lead = leads.find(l => l.id === task.leadId);
    const assignee = users.find(u => u.id === task.assignedTo);
    const isOverdue = task.status !== 'completed' && new Date(task.dueDate) < new Date();

    return (
      <div className={`
        bg-white rounded-xl p-4 border transition-all hover:shadow-md
        ${task.status === 'completed' ? 'border-slate-100 opacity-60' : 'border-slate-200'}
        ${isOverdue ? 'border-l-4 border-l-red-500' : ''}
      `}>
        <div className="flex items-start gap-3">
          <button
            onClick={() => toggleTaskStatus(task)}
            className={`
              mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
              ${task.status === 'completed'
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-slate-300 hover:border-indigo-500'}
            `}
          >
            {task.status === 'completed' && <CheckCircle className="w-3 h-3" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={`font-medium ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                {task.title}
              </h4>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openEditModal(task)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>

            {task.description && (
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className={`text-xs px-2 py-1 rounded-lg font-medium ${getPriorityColor(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>

              <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                <Calendar className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>

              {lead && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {lead.name}
                </span>
              )}

              {assignee && (
                <div className="flex items-center gap-1">
                  {assignee.avatar ? (
                    <img src={assignee.avatar} alt={assignee.name} className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 bg-slate-200 rounded-full" />
                  )}
                  <span className="text-xs text-slate-500">{assignee.name.split(' ')[0]}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-slate-500">{t('loading')} tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('tasks')}</h2>
          <p className="text-slate-500">{filteredTasks.filter(t => t.status !== 'completed').length} {t('tasks_remaining')}</p>
        </div>
        <button
          onClick={() => {
            setEditingTask(null);
            setFormData({
              title: '',
              description: '',
              leadId: '',
              assignedTo: user?.id || '',
              dueDate: '',
              priority: 'medium',
              status: 'pending',
            });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/30"
        >
          <Plus className="w-4 h-4" />
          {t('add_task')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{groupedTasks.overdue.length}</p>
              <p className="text-sm text-slate-500">{t('overdue')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{groupedTasks.today.length}</p>
              <p className="text-sm text-slate-500">{t('due_today')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{groupedTasks.upcoming.length}</p>
              <p className="text-sm text-slate-500">{t('upcoming')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{groupedTasks.completed.length}</p>
              <p className="text-sm text-slate-500">{t('completed_count')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="all">{t('all_status')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="in_progress">{t('in_progress')}</option>
            <option value="completed">{t('completed')}</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="all">{t('all_priority')}</option>
            <option value="high">{t('high')}</option>
            <option value="medium">{t('medium')}</option>
            <option value="low">{t('low')}</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Task Lists */}
      <div className="space-y-6">
        {/* Overdue */}
        {groupedTasks.overdue.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {t('overdue')} ({groupedTasks.overdue.length})
            </h3>
            <div className="space-y-3">
              {groupedTasks.overdue.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Today */}
        {groupedTasks.today.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('due_today')} ({groupedTasks.today.length})
            </h3>
            <div className="space-y-3">
              {groupedTasks.today.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {groupedTasks.upcoming.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t('upcoming')} ({groupedTasks.upcoming.length})
            </h3>
            <div className="space-y-3">
              {groupedTasks.upcoming.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Completed */}
        {groupedTasks.completed.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {t('completed_count')} ({groupedTasks.completed.length})
            </h3>
            <div className="space-y-3">
              {groupedTasks.completed.slice(0, 5).map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">{t('no_tasks_found')}</h3>
            <p className="text-slate-500">{t('create_task_start')}</p>
          </div>
        )}
      </div>

      {/* Add/Edit Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingTask ? t('edit_task') : t('add_new_task')}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('title_label')} *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Task title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('description_label')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Task description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('due_date')} *</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('priority')}</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">{t('low')}</option>
                    <option value="medium">{t('medium')}</option>
                    <option value="high">{t('high')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('related_lead')}</label>
                <select
                  value={formData.leadId}
                  onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t('no_lead')}</option>
                  {leads.slice(0, 20).map(lead => (
                    <option key={lead.id} value={lead.id}>{lead.name} - {lead.company}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('assign_to')}</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition-all font-medium shadow-lg shadow-indigo-500/30 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingTask ? t('update_task') : t('add_task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
