import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/database';
import { User, UserRole } from '@/types/sales';
import {
  Settings,
  Users,
  Mail,
  MessageSquare,
  Shield,
  Bell,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Key,
  Globe,
  Database,
  Loader2
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, users, hasRole, refreshUsers } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [showAddUser, setShowAddUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'sales' as UserRole,
  });

  const [integrations, setIntegrations] = useState({
    whatsapp: { enabled: true, apiKey: '••••••••••••••••' },
    email: { enabled: true, provider: 'SendGrid', apiKey: '••••••••••••••••' },
  });

  const tabs = [
    { id: 'users', label: t('user_mgmt'), icon: Users },
    { id: 'integrations', label: t('integrations'), icon: Globe },
    { id: 'notifications', label: t('notifications'), icon: Bell },
    { id: 'security', label: t('security'), icon: Shield },
  ];

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return;

    setIsSubmitting(true);
    try {
      await db.users.create({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      });

      await refreshUsers();
      setShowAddUser(false);
      setNewUser({ name: '', email: '', role: 'sales' });
      toast({ title: t('user_created'), description: t('user_added_desc', { name: newUser.name }) });
    } catch (error) {
      console.error('Failed to create user:', error);
      toast({ title: 'Error', description: 'Failed to create user', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm(t('delete_user_confirm'))) return;

    try {
      await db.users.delete(id);
      await refreshUsers();
      toast({ title: 'User deleted' });
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'manager': return 'bg-purple-100 text-purple-700';
      case 'sales': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">{t('settings')}</h2>
        <p className="text-slate-500">{t('settings_desc')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="bg-white rounded-2xl border border-slate-100 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left
                    ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* User Management */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{t('user_mgmt')}</h3>
                  <p className="text-sm text-slate-500">{t('user_mgmt_desc')}</p>
                </div>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  {t('add_user')}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">{t('user_label')}</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">{t('email_label')}</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">{t('role_label')}</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">{t('joined')}</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                {u.name.charAt(0)}
                              </div>
                            )}
                            <span className="font-medium text-slate-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-sm font-medium capitalize ${getRoleBadgeColor(u.role)}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                              <Edit className="w-4 h-4 text-slate-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              disabled={u.id === user?.id}
                            >
                              <Trash2 className={`w-4 h-4 ${u.id === user?.id ? 'text-slate-300' : 'text-red-500'}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Integrations */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              {/* WhatsApp Integration */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <MessageSquare className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{t('whatsapp_api')}</h3>
                      <p className="text-sm text-slate-500">{t('wa_api_desc')}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={integrations.whatsapp.enabled}
                      onChange={(e) => setIntegrations({
                        ...integrations,
                        whatsapp: { ...integrations.whatsapp, enabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('api_key')}</label>
                    <div className="flex gap-3">
                      <input
                        type="password"
                        value={integrations.whatsapp.apiKey}
                        className="flex-1 px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        readOnly
                      />
                      <button className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors">
                        <Key className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">{t('connected_verified')}</span>
                  </div>
                </div>
              </div>

              {/* Email Integration */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{t('email_service')} (SendGrid)</h3>
                      <p className="text-sm text-slate-500">{t('email_api_desc')}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={integrations.email.enabled}
                      onChange={(e) => setIntegrations({
                        ...integrations,
                        email: { ...integrations.email, enabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('provider')}</label>
                    <select className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>SendGrid</option>
                      <option>Mailgun</option>
                      <option>Amazon SES</option>
                      <option>Custom SMTP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('api_key')}</label>
                    <div className="flex gap-3">
                      <input
                        type="password"
                        value={integrations.email.apiKey}
                        className="flex-1 px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                      />
                      <button className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors">
                        <Key className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">{t('connected_verified')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">{t('notif_prefs')}</h3>

              <div className="space-y-6">
                {[
                  { title: 'New Lead Assigned', description: 'Get notified when a new lead is assigned to you' },
                  { title: 'Task Due Reminders', description: 'Receive reminders before tasks are due' },
                  { title: 'Deal Stage Changes', description: 'Get notified when deals move between stages' },
                  { title: 'Campaign Completion', description: 'Receive notifications when broadcasts complete' },
                  { title: 'Weekly Summary', description: 'Get a weekly summary of your sales performance' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">{t('security_settings')}</h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('cur_password')}</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('new_password')}</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('conf_password')}</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all font-medium">
                    {t('upd_password')}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('two_fa')}</h3>
                <p className="text-slate-500 mb-4">{t('two_fa_desc')}</p>
                <button className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-medium">
                  {t('enable_2fa')}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('active_sessions')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-slate-500" />
                      <div>
                        <p className="font-medium text-slate-900">Current Session</p>
                        <p className="text-sm text-slate-500">Chrome on macOS • Active now</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg">Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddUser(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900">{t('add_user')}</h2>
              <button
                onClick={() => setShowAddUser(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('full_name')}</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('email_label')}</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('role_label')}</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="sales">Sales</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowAddUser(false)}
                className="px-6 py-2.5 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors font-medium"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleAddUser}
                disabled={isSubmitting || !newUser.name || !newUser.email}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl transition-all font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('add_user')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
