import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/contexts/SalesContext';
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
  Loader2,
  Lock,
  Camera,
  User as UserIcon,
  Package,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  AlertTriangle,
  Layout,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import ConfirmModal from '../ui/ConfirmModal';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, users, hasRole, refreshUsers, updateProfile, updatePassword } = useAuth();
  const { products, productsLoading, addProduct, updateProduct, deleteProduct } = useSales();
  const [activeTab, setActiveTab] = useState('profile');
  const [showAddUser, setShowAddUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{ id?: string, name: string, description: string } | null>(null);
  const [productPage, setProductPage] = useState(1);
  const [productSearch, setProductSearch] = useState('');
  const [showDeleteAllProductsConfirm, setShowDeleteAllProductsConfirm] = useState(false);
  const productItemsPerPage = 6;

  const {
    deleteAllProducts,
    pipelineStages,
    pipelineStagesLoading,
    addPipelineStage,
    updatePipelineStage,
    deletePipelineStage
  } = useSales();
  const [isCheckingWA, setIsCheckingWA] = useState(false);
  const [showWAToken, setShowWAToken] = useState(false);

  const [newStage, setNewStage] = useState({ label: '', color: 'bg-slate-500' });
  const [editingStage, setEditingStage] = useState<{ id: string, label: string, color: string } | null>(null);
  const [showDeleteStageConfirm, setShowDeleteStageConfirm] = useState<{ id: string, label: string } | null>(null);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'sales' as UserRole,
  });

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  React.useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const [integrations, setIntegrations] = useState<{
    whatsapp: { enabled: boolean; apiKey: string };
    email: { enabled: boolean; provider: string; apiKey: string; clientId?: string; senderName?: string };
  }>(() => {
    const saved = localStorage.getItem('sales_integrations');
    const defaultState = {
      whatsapp: { enabled: true, apiKey: '' },
      email: { enabled: true, provider: 'Google Gmail API', apiKey: '', clientId: '', senderName: 'Maz Fathur NSS' },
    };

    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure senderName exists in merged state if loading from old localStorage
      return {
        ...defaultState,
        ...parsed,
        email: { ...defaultState.email, ...parsed.email }
      };
    }

    return defaultState;
  });

  React.useEffect(() => {
    localStorage.setItem('sales_integrations', JSON.stringify(integrations));
  }, [integrations]);

  const [notifSettings, setNotifSettings] = useState(() => {
    const saved = localStorage.getItem('sales_notifications');
    return saved ? JSON.parse(saved) : {
      newLead: true,
      taskDue: true,
      stageChange: true,
      campaignComplete: true,
      weeklySummary: true
    };
  });

  React.useEffect(() => {
    localStorage.setItem('sales_notifications', JSON.stringify(notifSettings));
  }, [notifSettings]);

  const handleExportProducts = () => {
    try {
      const dataToExport = products.map(p => ({
        'ID': p.id,
        'Nama Produk': p.name,
        'Deskripsi': p.description || '',
        'Tanggal Dibuat': new Date(p.createdAt).toLocaleDateString('id-ID')
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Produk');
      XLSX.writeFile(workbook, `Daftar_Produk_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({ title: 'Export Berhasil', description: 'Data produk telah diunduh sebagai file Excel.' });
    } catch (error) {
      console.error('Export failed:', error);
      toast({ title: 'Export Gagal', description: 'Gagal mengekspor data produk.', variant: 'destructive' });
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const tabs = [
    { id: 'profile', label: t('profile'), icon: UserIcon },
    { id: 'users', label: t('user_mgmt'), icon: Users, adminOnly: true },
    { id: 'pipeline', label: 'Pipeline', icon: Layout, adminOnly: true },
    { id: 'business', label: 'Produk & Bisnis', icon: Package, adminOnly: true },
    { id: 'integrations', label: t('integrations'), icon: Globe, adminOnly: true },
    { id: 'notifications', label: t('notifications'), icon: Bell },
    { id: 'security', label: t('security'), icon: Shield },
  ];

  const filteredTabs = tabs.filter(tab => !tab.adminOnly || hasRole(['admin']));

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return;

    setIsSubmitting(true);
    try {
      if (editingUser) {
        // Update user
        await db.users.update(editingUser.id, {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        });
        toast({ title: t('user_updated'), description: t('user_updated_desc', { name: newUser.name }) });
      } else {
        // Create user
        await db.users.create({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        });
        toast({ title: t('user_created'), description: t('user_added_desc', { name: newUser.name }) });
      }

      await refreshUsers();
      setShowAddUser(false);
      setEditingUser(null);
      setNewUser({ name: '', email: '', role: 'sales' });
    } catch (error) {
      console.error('Failed to save user:', error);
      toast({ title: 'Error', description: 'Failed to save user', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setShowAddUser(true);
  };

  const onConfirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await db.users.delete(userToDelete);
      await refreshUsers();
      toast({ title: 'User deleted' });
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    }
    setUserToDelete(null);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'manager': return 'bg-purple-100 text-purple-700';
      case 'sales': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleVerifyWA = async () => {
    let token = integrations.whatsapp.apiKey;
    token = token.trim();

    if (!token || token.includes('••••')) {
      toast({ title: 'Token Error', description: 'Silakan masukkan token Fonnte yang valid terlebih dahulu.', variant: 'destructive' });
      return;
    }

    setIsCheckingWA(true);
    try {
      // Use URLSearchParams for x-www-form-urlencoded (more standard for Fonnte/PHP APIs)
      const params = new URLSearchParams();
      params.append('token', token);

      const response = await fetch('https://api.fonnte.com/get-devices', {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await response.json();

      if (data.status) {
        toast({
          title: 'Koneksi Berhasil!',
          description: `Token valid. Terdeteksi ${data.data?.length || 0} perangkat terdaftar.`,
        });
      } else {
        let errorMsg = data.reason || 'Terjadi kesalahan pada server Fonnte.';

        if (errorMsg === 'unknown user') {
          // If we get "unknown user", it might be a valid Device Token (which can send messages)
          // but doesn't have permission to list devices (which requires Account Token).
          toast({
            title: 'Koneksi Terbatas',
            description: 'Token terdeteksi sebagai "Device Token". Fitur "Cek Koneksi" (Get Devices) tidak diizinkan untuk jenis token ini, namun pengiriman pesan broadcast biasanya tetap bisa dilakukan. Silakan simpan dan coba kirim pesan percobaan.',
            variant: 'default'
          });
          return;
        }

        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('WA Verification Error:', error);
      toast({
        title: 'Koneksi Gagal',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsCheckingWA(false);
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
            {filteredTabs.map((tab) => {
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
          {/* Pipeline Management */}
          {activeTab === 'pipeline' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Manajemen Pipeline Sales</h3>

                {/* Add New Stage */}
                <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Tambah Tahap Baru</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nama Tahap (Contoh: Survei Lokasi)"
                      value={newStage.label}
                      onChange={(e) => setNewStage({ ...newStage, label: e.target.value })}
                      className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                      value={newStage.color}
                      onChange={(e) => setNewStage({ ...newStage, color: e.target.value })}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="bg-slate-500">Abu-abu</option>
                      <option value="bg-blue-500">Biru</option>
                      <option value="bg-purple-500">Ungu</option>
                      <option value="bg-amber-500">Kuning</option>
                      <option value="bg-emerald-500">Hijau</option>
                      <option value="bg-red-500">Merah</option>
                      <option value="bg-pink-500">Pink</option>
                      <option value="bg-indigo-500">Indigo</option>
                    </select>
                    <button
                      onClick={async () => {
                        if (!newStage.label) return;

                        // Convert label to ID (e.g. "New Stage" -> "new_stage")
                        const id = newStage.label.toLowerCase().replace(/[^a-z0-9]/g, '_');

                        await addPipelineStage({
                          id,
                          label: newStage.label,
                          color: newStage.color,
                          order_index: pipelineStages.length + 1,
                          is_system: false
                        });
                        setNewStage({ label: '', color: 'bg-slate-500' });
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium"
                    >
                      Tambah
                    </button>
                  </div>
                </div>

                {/* Stage List */}
                {pipelineStagesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pipelineStages.map((stage, index) => (
                      <div key={stage.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-shadow group">
                        <div className={`w-3 h-3 rounded-full ${stage.color}`} />

                        <div className="flex-1">
                          {editingStage?.id === stage.id ? (
                            <div className="flex gap-2">
                              <input
                                value={editingStage.label}
                                onChange={(e) => setEditingStage({ ...editingStage, label: e.target.value })}
                                className="flex-1 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                autoFocus
                              />
                              <select
                                value={editingStage.color}
                                onChange={(e) => setEditingStage({ ...editingStage, color: e.target.value })}
                                className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                              >
                                <option value="bg-slate-500">Abu-abu</option>
                                <option value="bg-blue-500">Biru</option>
                                <option value="bg-purple-500">Ungu</option>
                                <option value="bg-amber-500">Kuning</option>
                                <option value="bg-emerald-500">Hijau</option>
                                <option value="bg-red-500">Merah</option>
                              </select>
                              <button
                                onClick={async () => {
                                  await updatePipelineStage(stage.id, { label: editingStage.label, color: editingStage.color });
                                  setEditingStage(null);
                                }}
                                className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingStage(null)}
                                className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-medium text-slate-700">{stage.label}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            disabled={index === 0}
                            onClick={() => {
                              const prev = pipelineStages[index - 1];
                              updatePipelineStage(stage.id, { order_index: prev.order_index });
                              updatePipelineStage(prev.id, { order_index: stage.order_index });
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg disabled:opacity-30"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            disabled={index === pipelineStages.length - 1}
                            onClick={() => {
                              const next = pipelineStages[index + 1];
                              updatePipelineStage(stage.id, { order_index: next.order_index });
                              updatePipelineStage(next.id, { order_index: stage.order_index });
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg disabled:opacity-30"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <div className="w-px h-4 bg-slate-200 mx-1" />
                          <button
                            onClick={() => setEditingStage({ id: stage.id, label: stage.label, color: stage.color })}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {!stage.is_system && (
                            <button
                              onClick={() => setShowDeleteStageConfirm({ id: stage.id, label: stage.label })}
                              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-600 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-4 text-xs text-slate-400">
                  * Tahap dengan ikon gembok adalah sistem default dan tidak dapat dihapus, hanya bisa diubah nama/warnanya.
                </p>
              </div>
            </div>
          )}

          {/* Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-3xl overflow-hidden bg-slate-100 ring-4 ring-slate-50 relative">
                        {profileForm.avatar ? (
                          <img src={profileForm.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-3xl font-bold">
                            {profileForm.name.charAt(0)}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <label className="absolute -bottom-2 -right-2 p-2.5 bg-indigo-600 text-white rounded-xl cursor-pointer shadow-lg hover:bg-indigo-700 transition-all hover:scale-110 active:scale-95">
                        <Camera className="w-4 h-4" />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                toast({ title: 'Error', description: 'Image size should be less than 2MB', variant: 'destructive' });
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setProfileForm(prev => ({ ...prev, avatar: reader.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">{t('full_name')}</label>
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">{t('email_label')}</label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={async () => {
                          setIsSubmitting(true);
                          try {
                            await updateProfile(profileForm);
                          } catch (err: any) {
                            toast({ title: 'Error', description: err.message || 'Update failed', variant: 'destructive' });
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all font-semibold shadow-lg shadow-indigo-200 disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        {t('save_changes')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 rounded-xl">
                    <Shield className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{t('role_and_permissions')}</h4>
                    <p className="text-sm text-slate-500">{t('current_role')}: <span className="font-semibold text-indigo-600 capitalize">{user?.role}</span></p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 max-w-xs md:text-right">
                  {t('role_change_contact')}
                </p>
              </div>
            </div>
          )}

          {/* User Management */}
          {activeTab === 'users' && hasRole(['admin']) && (
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
                            <button
                              onClick={() => handleEditUser(u)}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4 text-slate-500" />
                            </button>
                            <button
                              onClick={() => setUserToDelete(u.id)}
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
          {activeTab === 'integrations' && hasRole(['admin']) && (
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Fonnte Token</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <input
                          type={showWAToken ? "text" : "password"}
                          value={integrations.whatsapp.apiKey}
                          onChange={(e) => setIntegrations({
                            ...integrations,
                            whatsapp: { ...integrations.whatsapp, apiKey: e.target.value }
                          })}
                          className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                          placeholder="Md..........."
                        />
                        <button
                          type="button"
                          onClick={() => setShowWAToken(!showWAToken)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showWAToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <button
                        onClick={handleVerifyWA}
                        disabled={isCheckingWA || !integrations.whatsapp.apiKey || integrations.whatsapp.apiKey.includes('••••')}
                        className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all font-medium flex items-center gap-2 disabled:opacity-50 min-w-[140px] justify-center"
                      >
                        {isCheckingWA ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Memeriksa...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Cek Koneksi</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Dapatkan token Anda dari <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="text-green-600 hover:underline font-medium">Dashboard Fonnte</a>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className={`p-1.5 rounded-full ${integrations.whatsapp.apiKey && !integrations.whatsapp.apiKey.includes('••••') ? 'bg-green-100' : 'bg-amber-100'}`}>
                      {integrations.whatsapp.apiKey && !integrations.whatsapp.apiKey.includes('••••') ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {integrations.whatsapp.apiKey && !integrations.whatsapp.apiKey.includes('••••') ? 'Token Terdeteksi' : 'Token Belum Diatur'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {integrations.whatsapp.apiKey && !integrations.whatsapp.apiKey.includes('••••')
                          ? 'Token tersimpan di sistem. Klik "Cek Koneksi" untuk verifikasi status terbaru.'
                          : 'Hubungkan akun Fonnte Anda untuk mulai mengirim pesan broadcast.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Integration */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-xl">
                      <Mail className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{t('email_service')} ({integrations.email.provider})</h3>
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
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('provider')}</label>
                    <select
                      value={integrations.email.provider}
                      onChange={(e) => setIntegrations({
                        ...integrations,
                        email: { ...integrations.email, provider: e.target.value }
                      })}
                      className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option>Google Gmail API</option>
                      <option>SendGrid</option>
                      <option>Mailgun</option>
                      <option>Amazon SES</option>
                      <option>Custom SMTP</option>
                    </select>
                  </div>

                  {integrations.email.provider === 'Google Gmail API' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Sender Name</label>
                        <input
                          type="text"
                          value={integrations.email.senderName || ''}
                          onChange={(e) => setIntegrations({
                            ...integrations,
                            email: { ...integrations.email, senderName: e.target.value }
                          })}
                          className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="e.g. Sales Team"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                          The name that will appear in the recipient's inbox.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Client ID</label>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={integrations.email.clientId || ''}
                            onChange={(e) => setIntegrations({
                              ...integrations,
                              email: { ...integrations.email, clientId: e.target.value }
                            })}
                            className="flex-1 px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="apps.googleusercontent.com"
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Use the Google Cloud Console to create an OAuth 2.0 Client ID for a Web Application.
                        </p>
                      </div>
                      <div>
                        {integrations.email.apiKey && !integrations.email.apiKey.includes('••••') ? (
                          <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-green-900">Successfully Connected</p>
                                <p className="text-sm text-green-700">Gmail API is ready to send emails</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setIntegrations(prev => ({ ...prev, email: { ...prev.email, apiKey: '', clientId: '' } }))}
                              className="text-sm text-green-700 hover:text-green-900 font-medium underline"
                            >
                              Disconnect
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (!integrations.email.clientId) {
                                toast({ title: 'Error', description: 'Please enter a Client ID first', variant: 'destructive' });
                                return;
                              }

                              const script = document.createElement('script');
                              script.src = 'https://accounts.google.com/gsi/client';
                              script.async = true;
                              script.onload = () => {
                                // @ts-ignore
                                const client = google.accounts.oauth2.initTokenClient({
                                  client_id: integrations.email.clientId,
                                  scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email',
                                  callback: (response: any) => {
                                    if (response.access_token) {
                                      setIntegrations(prev => ({
                                        ...prev,
                                        email: { ...prev.email, apiKey: response.access_token }
                                      }));
                                      toast({ title: 'Success', description: 'Connected to Google Account' });
                                    }
                                  },
                                });
                                client.requestAccessToken();
                              };
                              document.body.appendChild(script);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors font-medium"
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Connect Google Account
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('api_key')}</label>
                      <div className="flex gap-3">
                        <input
                          type="password"
                          value={integrations.email.apiKey}
                          className="flex-1 px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                          readOnly
                        />
                        <button className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors">
                          <Key className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    {integrations.email.provider === 'Google Gmail API' ? (
                      integrations.email.apiKey && !integrations.email.apiKey.includes('••••') ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Connected</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-600">
                          <div className="w-2 h-2 bg-amber-500 rounded-full" />
                          <span>Not connected</span>
                        </div>
                      )
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-green-600">{t('connected_verified')}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Explicit Save Button for Integrations */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => {
                      localStorage.setItem('sales_integrations', JSON.stringify(integrations));
                      toast({
                        title: 'Pengaturan Tersimpan',
                        description: 'Konfigurasi integrasi WhatsApp dan Email telah diperbarui.',
                      });
                    }}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-semibold shadow-lg shadow-indigo-200 flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    <span>Simpan Pengaturan Integrasi</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Product Management */}
          {activeTab === 'business' && hasRole(['admin']) && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-6 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Manajemen Produk</h3>
                  <p className="text-sm text-slate-500">Total {products.length} produk terdaftar.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari produk..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setProductPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={handleExportProducts}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button
                    onClick={() => setShowDeleteAllProductsConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-all text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus Semua
                  </button>
                  <button
                    onClick={() => {
                      setEditingProduct({ name: '', description: '' });
                      setShowProductModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-200 text-sm font-bold"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah
                  </button>
                </div>
              </div>

              <div className="p-4 md:p-6">
                {productsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">{productSearch ? 'Produk tidak ditemukan.' : 'Belum ada produk yang ditambahkan.'}</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredProducts
                        .slice((productPage - 1) * productItemsPerPage, productPage * productItemsPerPage)
                        .map((product) => (
                          <div key={product.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-indigo-50 transition-colors">
                                <Package className="w-6 h-6 text-indigo-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900">{product.name}</h4>
                                {product.description && <p className="text-sm text-slate-500">{product.description}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingProduct({ id: product.id, name: product.name, description: product.description || '' });
                                  setShowProductModal(true);
                                }}
                                className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setProductToDelete(product.id)}
                                className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Product Pagination */}
                    {Math.ceil(filteredProducts.length / productItemsPerPage) > 1 && (
                      <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 px-2 pt-6 border-t border-slate-100">
                        <p className="text-sm text-slate-500">
                          Menampilkan <span className="font-semibold text-slate-900">{(productPage - 1) * productItemsPerPage + 1}</span> s/d <span className="font-semibold text-slate-900">{Math.min(productPage * productItemsPerPage, filteredProducts.length)}</span> dari <span className="font-semibold text-slate-900">{filteredProducts.length}</span> produk
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setProductPage(prev => Math.max(1, prev - 1))}
                            disabled={productPage === 1}
                            className="p-2 hover:bg-slate-100 disabled:opacity-30 rounded-xl transition-all border border-transparent hover:border-slate-200 active:scale-95"
                          >
                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                          </button>
                          <div className="flex items-center gap-1.5">
                            {Array.from({ length: Math.ceil(filteredProducts.length / productItemsPerPage) }, (_, i) => i + 1).map(page => (
                              <button
                                key={page}
                                onClick={() => setProductPage(page)}
                                className={`min-w-[40px] h-10 rounded-xl text-sm font-bold transition-all ${productPage === page
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200'
                                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-100'
                                  }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setProductPage(prev => Math.min(Math.ceil(filteredProducts.length / productItemsPerPage), prev + 1))}
                            disabled={productPage === Math.ceil(filteredProducts.length / productItemsPerPage)}
                            className="p-2 hover:bg-slate-100 disabled:opacity-30 rounded-xl transition-all border border-transparent hover:border-slate-200 active:scale-95"
                          >
                            <ChevronRight className="w-5 h-5 text-slate-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">{t('notif_prefs')}</h3>

              <div className="space-y-6">
                {[
                  { key: 'newLead', title: t('notif_new_lead'), description: t('notif_new_lead_desc') },
                  { key: 'taskDue', title: t('notif_task_due'), description: t('notif_task_due_desc') },
                  { key: 'stageChange', title: t('notif_stage_change'), description: t('notif_stage_change_desc') },
                  { key: 'campaignComplete', title: t('notif_campaign_comp'), description: t('notif_campaign_comp_desc') },
                  { key: 'weeklySummary', title: t('notif_weekly_sum'), description: t('notif_weekly_sum_desc') },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifSettings[item.key as keyof typeof notifSettings]}
                        onChange={(e) => setNotifSettings(prev => ({ ...prev, [item.key]: e.target.checked }))}
                        className="sr-only peer"
                      />
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
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('new_password')}</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('conf_password')}</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                        toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
                        return;
                      }
                      if (passwordForm.newPassword.length < 4) {
                        toast({ title: 'Error', description: 'Password must be at least 4 characters', variant: 'destructive' });
                        return;
                      }
                      setIsSubmitting(true);
                      try {
                        await updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      } catch (error: any) {
                        toast({ title: 'Error', description: error.message || 'Failed to update password', variant: 'destructive' });
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
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

      {/* Add/Edit User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowAddUser(false); setEditingUser(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900">{editingUser ? t('edit_user') : t('add_user')}</h2>
              <button
                onClick={() => { setShowAddUser(false); setEditingUser(null); }}
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
                // disabled={!!editingUser} - Enabled as per request
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
                onClick={() => { setShowAddUser(false); setEditingUser(null); }}
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
                {editingUser ? t('save_changes') : t('add_user')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={onConfirmDeleteUser}
        title={t('delete_user')}
        message={t('delete_user_confirm')}
        confirmText={t('delete_user')}
        variant="danger"
      />

      {/* Product Modal */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowProductModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingProduct.id ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nama Produk</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Contoh: Honda Vario 160"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Deskripsi (Opsional)</label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Keterangan singkat produk..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-6 py-2.5 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (!editingProduct.name) return;
                  setIsSubmitting(true);
                  try {
                    if (editingProduct.id) {
                      await updateProduct(editingProduct.id, { name: editingProduct.name, description: editingProduct.description });
                    } else {
                      await addProduct({ name: editingProduct.name, description: editingProduct.description });
                    }
                    setShowProductModal(false);
                  } catch (error) {
                    console.error('Failed to save product:', error);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={!editingProduct.name || isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all font-medium shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Simpan Produk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Products */}
      <ConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={async () => {
          if (!productToDelete) return;
          await deleteProduct(productToDelete);
          setProductToDelete(null);
        }}
        title="Hapus Produk"
        message="Apakah Anda yakin ingin menghapus produk ini? Tindakan ini dapat mempengaruhi data lead yang sudah ada."
        confirmText="Ya, Hapus"
        variant="danger"
      />

      {/* Delete All Products Confirmation */}
      <ConfirmModal
        isOpen={showDeleteAllProductsConfirm}
        onClose={() => setShowDeleteAllProductsConfirm(false)}
        onConfirm={async () => {
          await deleteAllProducts();
          setShowDeleteAllProductsConfirm(false);
          setProductPage(1);
        }}
        title="Hapus Semua Produk"
        message="PERINGATAN: Tindakan ini akan menghapus SELURUH produk Anda secara permanen. Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus Semua"
        variant="danger"
      />

      {/* Delete Stage Confirmation */}
      {showDeleteStageConfirm && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setShowDeleteStageConfirm(null)}
          onConfirm={async () => {
            if (showDeleteStageConfirm) {
              await deletePipelineStage(showDeleteStageConfirm.id);
              setShowDeleteStageConfirm(null);
            }
          }}
          title="Hapus Tahap Pipeline"
          message={`Apakah Anda yakin ingin menghapus tahap "${showDeleteStageConfirm.label}"? Perhatian: Lead yang ada di tahap ini mungkin perlu dipindahkan.`}
          confirmText="Ya, Hapus"
          variant="danger"
        />
      )}
    </div>
  );
};

export default SettingsPage;
