import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import i18n from 'i18next';
import { Lead, Task, BroadcastTemplate, BroadcastCampaign, Notification, PipelineStage, CommunicationLog, Product, PipelineStageConfig } from '@/types/sales';
import { db, transformLead, transformTask, transformCampaign, transformCommunicationLog } from '@/lib/database';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from './AuthContext';

interface SalesContextType {
  // Leads
  leads: Lead[];
  leadsLoading: boolean;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  moveLead: (id: string, newStatus: PipelineStage) => Promise<void>;
  deleteAllLeads: () => Promise<void>;
  importLeads: (leads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  refreshLeads: () => Promise<void>;

  // Tasks
  tasks: Task[];
  tasksLoading: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  deleteAllTasks: () => Promise<void>;
  refreshTasks: () => Promise<void>;

  // Templates
  templates: BroadcastTemplate[];
  templatesLoading: boolean;
  addTemplate: (template: Omit<BroadcastTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<BroadcastTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  refreshTemplates: () => Promise<void>;

  // Campaigns
  campaigns: BroadcastCampaign[];
  campaignsLoading: boolean;
  addCampaign: (campaign: Omit<BroadcastCampaign, 'id' | 'createdAt'>) => Promise<void>;
  updateCampaign: (id: string, updates: Partial<BroadcastCampaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  deleteAllCampaigns: (type?: 'email' | 'whatsapp') => Promise<void>;
  deleteAllCommunicationLogs: (type?: 'email' | 'whatsapp') => Promise<void>;
  sendCampaign: (id: string) => Promise<void>;
  refreshCampaigns: () => Promise<void>;

  // Communication Logs
  communicationLogs: CommunicationLog[];
  addCommunicationLog: (log: Omit<CommunicationLog, 'id' | 'createdAt'>) => Promise<void>;
  refreshCommunicationLogs: () => Promise<void>;

  // Notifications
  notifications: Notification[];
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;

  // Filters
  leadFilters: LeadFilters;
  setLeadFilters: (filters: LeadFilters) => void;
  filteredLeads: Lead[];

  // Products
  products: Product[];
  productsLoading: boolean;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  deleteAllProducts: () => Promise<void>;
  refreshProducts: () => Promise<void>;

  // Pipeline Stages
  pipelineStages: PipelineStageConfig[];
  pipelineStagesLoading: boolean;
  addPipelineStage: (stage: Omit<PipelineStageConfig, 'created_at'>) => Promise<void>;
  updatePipelineStage: (id: string, updates: Partial<PipelineStageConfig>) => Promise<void>;
  deletePipelineStage: (id: string) => Promise<void>;
  refreshPipelineStages: () => Promise<void>;
}

interface LeadFilters {
  search: string;
  status: PipelineStage | 'all';
  product: string;
  assignedTo: string;
  tags: string[];
  minValue: number;
  maxValue: number;
}

const defaultFilters: LeadFilters = {
  search: '',
  status: 'all',
  product: '',
  assignedTo: '',
  tags: [],
  minValue: 0,
  maxValue: 1000000000,
};

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};

interface SalesProviderProps {
  children: ReactNode;
}

export const SalesProvider: React.FC<SalesProviderProps> = ({ children }) => {
  const { user } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const [templates, setTemplates] = useState<BroadcastTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [leadFilters, setLeadFilters] = useState<LeadFilters>(defaultFilters);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Pipeline Stages state
  const [pipelineStages, setPipelineStages] = useState<PipelineStageConfig[]>([]);
  const [pipelineStagesLoading, setPipelineStagesLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        let templatesData = await db.templates.getAll();

        // Seed default templates if empty
        if (templatesData.length === 0) {
          const defaultTemplates: Omit<BroadcastTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
            {
              name: 'Welcome Message (WA)',
              type: 'whatsapp',
              content: 'Halo {{name}}, selamat bergabung dengan Nusantara Sakti! Ada yang bisa kami bantu mengenai motor Honda impian Anda?',
              variables: ['name']
            },
            {
              name: 'Follow Up (WA)',
              type: 'whatsapp',
              content: 'Halo {{name}} dari {{company}}, kami ingin menanyakan kembali mengenai ketertarikan Anda pada produk kami. Apakah ada pertanyaan tambahan?',
              variables: ['name', 'company']
            },
            {
              name: 'Welcome Email',
              type: 'email',
              subject: 'Selamat Datang di Nusantara Sakti',
              content: 'Halo {{name}},<br><br>Terima kasih telah menunjukkan ketertarikan pada unit Honda kami. Tim kami akan segera menghubungi Anda.<br><br>Salam,<br>Nusantara Sakti',
              variables: ['name']
            }
          ];

          for (const t of defaultTemplates) {
            await db.templates.create(t);
          }
          templatesData = await db.templates.getAll();
        }

        const [leadsData, tasksData, campaignsData, logsData] = await Promise.all([
          db.leads.getAll(),
          db.tasks.getAll(),
          db.campaigns.getAll(),
          db.communicationLogs.getAll(),
        ]);

        setLeads(leadsData);
        setTasks(tasksData);
        setTemplates(templatesData);
        setCampaigns(campaignsData);
        setCommunicationLogs(logsData);

        // Fetch products and seed if empty
        const productsData = await db.products.getAll();
        if (productsData.length === 0) {
          const defaultProducts = [
            // Skuter Matik
            { name: 'Honda Beat', description: 'Skutik Kecil - Lincah dan irit untuk penggunaan harian.' },
            { name: 'Honda Beat Street', description: 'Skutik Kecil - Gaya street dengan stang telanjang.' },
            { name: 'Honda Genio', description: 'Skutik Kecil - Desain casual dan stylish.' },
            { name: 'Honda Vario 125', description: 'Skutik Menengah - Performa handal untuk harian.' },
            { name: 'Honda Vario 160', description: 'Skutik Menengah - Sporty dengan mesin bertenaga 160cc.' },
            { name: 'Honda Scoopy', description: 'Skutik Menengah - Ikonik dengan desain retro modern.' },
            { name: 'Honda Stylo 160', description: 'Skutik Menengah - Retro modern dengan performa tinggi.' },
            { name: 'Honda PCX 160', description: 'Skutik Besar - Mewah dan nyaman untuk jarak jauh.' },
            { name: 'Honda ADV 160', description: 'Skutik Adventure - Tangguh untuk berbagai medan.' },
            { name: 'Honda Forza 250', description: 'Skutik Premium - Performa dan fitur kasta tertinggi.' },
            // Bebek
            { name: 'Honda Supra X 125', description: 'Bebek - Legendaris dan irit bahan bakar.' },
            { name: 'Honda Revo', description: 'Bebek - Fungsional dan ekonomis.' },
            { name: 'Honda Supra GTR 150', description: 'Bebek Sport - Performa mesin 150cc yang agresif.' },
            { name: 'Honda Sonic 150R', description: 'Bebek Sport - Light Agility Sport untuk anak muda.' },
            { name: 'Honda CT125', description: 'Bebek Trekking - Ikonik dan tangguh untuk petualangan.' },
            { name: 'Honda Super Cub C125', description: 'Bebek Premium - Desain retro legendaris.' },
            // Sport & Adventure
            { name: 'Honda CBR150R', description: 'Sport Fairing - DNA balap untuk penggunaan harian.' },
            { name: 'Honda CBR250RR', description: 'Sport Fairing - Total Control dengan mesin 2 silinder.' },
            { name: 'Honda CB150R StreetFire', description: 'Naked Sport - Agresif dan lincah di kemacetan.' },
            { name: 'Honda CB150X', description: 'Adv-Tourer - Desain adventure yang gagah.' },
            { name: 'Honda CRF150L', description: 'Off-Road - Dual purpose untuk segala medan.' },
            { name: 'Honda CRF250 Rally', description: 'Off-Road - Desain terinspirasi reli Dakar.' },
            { name: 'Honda CRF1100L Africa Twin', description: 'Adventure - Performa tangguh lintas benua.' },
            { name: 'Honda CB500X', description: 'Adv-Tourer - Kenyamanan di berbagai kondisi.' },
            { name: 'Honda CBR1000RR-R', description: 'Superbike - Performa kasta tertinggi.' },
            // Cruiser
            { name: 'Honda Rebel', description: 'Cruiser - Gaya klasik Amerika yang ikonik.' },
            { name: 'Honda Rebel 1100', description: 'Cruiser - Performa besar maksimal.' },
            // Electric & Others
            { name: 'Honda EM1 e:', description: 'Electric - Motor listrik pertama untuk masa depan.' },
            { name: 'Honda Monkey', description: 'Iconic - Kecil, unik, dan penuh gaya.' },
            { name: 'Honda ST125 Dax', description: 'Iconic - Desain unik untuk para kolektor.' }
          ];
          const created = await Promise.all(defaultProducts.map(p => db.products.create(p)));
          setProducts(created);
        } else {
          setProducts(productsData);
        }

        // Fetch Pipeline Stages
        const stagesData = await db.pipelineStages.getAll();
        setPipelineStages(stagesData);

      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: 'Error loading data',
          description: 'Please try again',
          variant: 'destructive',
        });
      } finally {
        setLeadsLoading(false);
        setTasksLoading(false);
        setTemplatesLoading(false);
        setCampaignsLoading(false);
        setProductsLoading(false);
        setPipelineStagesLoading(false);
      }
    };

    loadData();
  }, []);

  // Load notifications when user changes
  useEffect(() => {
    const loadNotifications = async () => {
      if (user) {
        try {
          const notifs = await db.notifications.getByUserId(user.id);
          setNotifications(notifs);
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
      }
    };

    loadNotifications();
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    const leadsChannel = db.subscriptions.subscribeToLeads((payload) => {
      if (payload.eventType === 'INSERT') {
        const newLead = transformLead(payload.new);
        setLeads(prev => {
          if (prev.some(l => l.id === newLead.id)) return prev;
          return [newLead, ...prev];
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedLead = transformLead(payload.new);
        setLeads(prev => prev.map(lead =>
          lead.id === updatedLead.id ? updatedLead : lead
        ));
      } else if (payload.eventType === 'DELETE') {
        setLeads(prev => prev.filter(lead => lead.id !== payload.old.id));
      }
    });

    const tasksChannel = db.subscriptions.subscribeToTasks((payload) => {
      if (payload.eventType === 'INSERT') {
        const newTask = transformTask(payload.new);
        setTasks(prev => {
          if (prev.some(t => t.id === newTask.id)) return prev;
          return [newTask, ...prev];
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedTask = transformTask(payload.new);
        setTasks(prev => prev.map(task =>
          task.id === updatedTask.id ? updatedTask : task
        ));
      } else if (payload.eventType === 'DELETE') {
        setTasks(prev => prev.filter(task => task.id !== payload.old.id));
      }
    });

    const campaignsChannel = db.subscriptions.subscribeToCampaigns((payload) => {
      if (payload.eventType === 'INSERT') {
        const newCampaign = transformCampaign(payload.new);
        setCampaigns(prev => {
          if (prev.some(c => c.id === newCampaign.id)) return prev;
          return [newCampaign, ...prev];
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedCampaign = transformCampaign(payload.new);
        setCampaigns(prev => prev.map(campaign =>
          campaign.id === updatedCampaign.id ? updatedCampaign : campaign
        ));
      } else if (payload.eventType === 'DELETE') {
        setCampaigns(prev => prev.filter(campaign => campaign.id !== payload.old.id));
      }
    });

    const communicationLogsChannel = db.subscriptions.subscribeToCommunicationLogs((payload) => {
      if (payload.eventType === 'INSERT') {
        const newLog = transformCommunicationLog(payload.new);
        setCommunicationLogs(prev => {
          if (prev.some(l => l.id === newLog.id)) return prev;
          return [newLog, ...prev];
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedLog = transformCommunicationLog(payload.new);
        setCommunicationLogs(prev => prev.map(log =>
          log.id === updatedLog.id ? updatedLog : log
        ));
      } else if (payload.eventType === 'DELETE') {
        setCommunicationLogs(prev => prev.filter(log => log.id !== payload.old.id));
      }
    });

    return () => {
      db.subscriptions.unsubscribe(leadsChannel);
      db.subscriptions.unsubscribe(tasksChannel);
      db.subscriptions.unsubscribe(campaignsChannel);
      db.subscriptions.unsubscribe(communicationLogsChannel);
    };
  }, []);

  // Subscribe to user notifications
  useEffect(() => {
    if (!user) return;

    const notificationsChannel = db.subscriptions.subscribeToNotifications(user.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        setNotifications(prev => [payload.new as Notification, ...prev]);
        toast({
          title: payload.new.title,
          description: payload.new.message,
        });
      }
    });

    return () => {
      db.subscriptions.unsubscribe(notificationsChannel);
    };
  }, [user]);

  // Refresh functions
  const refreshLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const data = await db.leads.getAll();
      setLeads(data);
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const data = await db.tasks.getAll();
      setTasks(data);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  const refreshTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const data = await db.templates.getAll();
      setTemplates(data);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const refreshCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const data = await db.campaigns.getAll();
      setCampaigns(data);
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  const refreshCommunicationLogs = useCallback(async () => {
    try {
      const data = await db.communicationLogs.getAll();
      setCommunicationLogs(data);
    } catch (error) {
      console.error('Failed to refresh communication logs:', error);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await db.notifications.getByUserId(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  }, [user]);

  const refreshProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const data = await db.products.getAll();
      setProducts(data);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const refreshPipelineStages = useCallback(async () => {
    setPipelineStagesLoading(true);
    try {
      const data = await db.pipelineStages.getAll();
      setPipelineStages(data);
    } catch (error) {
      console.error('Failed to refresh pipeline stages:', error);
    } finally {
      setPipelineStagesLoading(false);
    }
  }, []);

  const createNotification = useCallback(async (notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    if (!user) return;

    // Check preferences
    const saved = localStorage.getItem('sales_notifications');
    const prefs = saved ? JSON.parse(saved) : {
      newLead: true,
      taskDue: true,
      stageChange: true,
      campaignComplete: true,
      weeklySummary: true
    };

    let enabled = true;
    if (notif.type === 'lead') enabled = prefs.newLead;
    if (notif.type === 'task') enabled = prefs.taskDue;
    // Stage Change mapped to system for now
    if (notif.title.includes('Stage') || notif.title.includes('Tahap')) enabled = prefs.stageChange;
    if (notif.type === 'broadcast') enabled = prefs.campaignComplete;

    if (!enabled) return;

    try {
      await db.notifications.create({
        type: notif.type,
        title: notif.title,
        message: notif.message,
        userId: user.id,
        read: false
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }, [user]);

  // Leads CRUD
  const addLead = useCallback(async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await db.leads.create(lead);
      toast({ title: 'Lead added', description: lead.name });

      await createNotification({
        type: 'lead',
        title: i18n.t('notif_new_lead'),
        message: `${lead.name} from ${lead.company} has been assigned to you.`
      });
    } catch (error) {
      console.error('Failed to add lead:', error);
      toast({ title: 'Error', description: 'Failed to add lead', variant: 'destructive' });
    }
  }, [createNotification]);

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    try {
      await db.leads.update(id, updates);
      toast({ title: 'Lead updated', description: 'Lead information has been updated' });
    } catch (error) {
      console.error('Failed to update lead:', error);
      toast({ title: 'Error', description: 'Failed to update lead', variant: 'destructive' });
    }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    try {
      await db.leads.delete(id);
      toast({ title: 'Lead deleted', description: 'Lead has been removed' });
    } catch (error) {
      console.error('Failed to delete lead:', error);
      toast({ title: 'Error', description: 'Failed to delete lead', variant: 'destructive' });
    }
  }, []);

  const moveLead = useCallback(async (id: string, newStatus: PipelineStage) => {
    try {
      const lead = leads.find(l => l.id === id);
      await db.leads.update(id, { status: newStatus });
      toast({ title: 'Lead Status Updated', description: `Lead moved to ${newStatus}` });

      if (lead) {
        await createNotification({
          type: 'lead',
          title: i18n.t('notif_stage_change'),
          message: `Lead ${lead.name} has been moved to ${newStatus}.`
        });
      }
    } catch (error) {
      console.error('Failed to move lead:', error);
      toast({ title: 'Error', description: 'Failed to update lead status', variant: 'destructive' });
    }
  }, [leads, createNotification]);

  const deleteAllLeads = useCallback(async () => {
    try {
      await db.leads.deleteAll();
      toast({ title: 'Lead Truncated', description: 'All leads have been deleted successfully.' });
    } catch (error) {
      console.error('Failed to truncate leads:', error);
      toast({ title: 'Error', description: 'Failed to delete all leads', variant: 'destructive' });
    }
  }, []);

  const importLeads = useCallback(async (newLeads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    try {
      await Promise.all(
        newLeads.map(lead => db.leads.create({
          name: lead.name || 'Unknown',
          company: lead.company || '',
          phone: lead.phone || '',
          email: lead.email || '',
          productInterest: lead.productInterest || [],
          dealValue: lead.dealValue || 0,
          status: lead.status || 'new_lead',
          tags: lead.tags || [],
          assignedTo: lead.assignedTo || '',
          source: 'CSV Import',
          notes: lead.notes || '',
        }))
      );
      toast({ title: 'Leads imported', description: `${newLeads.length} leads have been imported` });
    } catch (error) {
      console.error('Failed to import leads:', error);
      toast({ title: 'Error', description: 'Failed to import leads', variant: 'destructive' });
    }
  }, []);

  // Tasks CRUD
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      await db.tasks.create(task);
      toast({ title: 'Task created', description: task.title });

      await createNotification({
        type: 'task',
        title: i18n.t('notif_task_due'),
        message: `Task: ${task.title} is due on ${new Date(task.dueDate).toLocaleDateString()}.`
      });
    } catch (error) {
      console.error('Failed to add task:', error);
      toast({ title: 'Error', description: 'Failed to create task', variant: 'destructive' });
    }
  }, [createNotification]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      await db.tasks.update(id, updates);
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await db.tasks.delete(id);
      toast({ title: 'Task deleted' });
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
    }
  }, []);

  const deleteAllTasks = useCallback(async () => {
    try {
      await db.tasks.deleteAll();
      toast({ title: 'Tasks Truncated', description: 'All tasks have been deleted successfully.' });
    } catch (error) {
      console.error('Failed to truncate tasks:', error);
      toast({ title: 'Error', description: 'Failed to delete all tasks', variant: 'destructive' });
    }
  }, []);

  // Templates CRUD
  const addTemplate = useCallback(async (template: Omit<BroadcastTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTemplate = await db.templates.create(template);
      setTemplates(prev => [newTemplate, ...prev]);
      toast({ title: 'Template created', description: template.name });
    } catch (error) {
      console.error('Failed to add template:', error);
      toast({ title: 'Error', description: 'Failed to create template', variant: 'destructive' });
    }
  }, []);

  const updateTemplate = useCallback(async (id: string, updates: Partial<BroadcastTemplate>) => {
    try {
      const updatedTemplate = await db.templates.update(id, updates);
      setTemplates(prev => prev.map(template => template.id === id ? updatedTemplate : template));
      toast({ title: 'Template updated' });
    } catch (error) {
      console.error('Failed to update template:', error);
      toast({ title: 'Error', description: 'Failed to update template', variant: 'destructive' });
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      await db.templates.delete(id);
      setTemplates(prev => prev.filter(template => template.id !== id));
      toast({ title: 'Template deleted' });
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast({ title: 'Error', description: 'Failed to delete template', variant: 'destructive' });
    }
  }, []);

  // Campaigns
  const addCampaign = useCallback(async (campaign: Omit<BroadcastCampaign, 'id' | 'createdAt'>) => {
    try {
      await db.campaigns.create(campaign);
      toast({ title: 'Campaign created', description: campaign.name });
    } catch (error) {
      console.error('Failed to add campaign:', error);
      toast({ title: 'Error', description: 'Failed to create campaign', variant: 'destructive' });
    }
  }, []);

  const updateCampaign = useCallback(async (id: string, updates: Partial<BroadcastCampaign>) => {
    try {
      const updatedCampaign = await db.campaigns.update(id, updates);
      setCampaigns(prev => prev.map(campaign => campaign.id === id ? updatedCampaign : campaign));
    } catch (error) {
      console.error('Failed to update campaign:', error);
      toast({ title: 'Error', description: 'Failed to update campaign', variant: 'destructive' });
    }
  }, []);

  const deleteCampaign = useCallback(async (id: string) => {
    try {
      await db.campaigns.delete(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Campaign deleted' });
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      toast({ title: 'Error', description: 'Failed to delete campaign', variant: 'destructive' });
    }
  }, []);

  const deleteAllCampaigns = useCallback(async (type?: 'email' | 'whatsapp') => {
    try {
      await db.campaigns.deleteAll(type);
      setCampaigns(prev => type ? prev.filter(c => c.type !== type) : []);
      toast({ title: 'Campaigns Truncated', description: `All ${type ? type + ' ' : ''}campaigns have been deleted.` });
    } catch (error) {
      console.error('Failed to delete campaigns:', error);
      toast({ title: 'Error', description: 'Failed to delete campaigns', variant: 'destructive' });
    }
  }, []);

  const deleteAllCommunicationLogs = useCallback(async (type?: 'email' | 'whatsapp') => {
    try {
      await db.communicationLogs.deleteAll(type);
      setCommunicationLogs(prev => type ? prev.filter(log => log.type !== type) : []);
      toast({ title: 'History Log Truncated', description: `All ${type ? type + ' ' : ''}logs have been deleted.` });
    } catch (error) {
      console.error('Failed to delete logs:', error);
      toast({ title: 'Error', description: 'Failed to delete logs', variant: 'destructive' });
    }
  }, []);

  const sendCampaign = useCallback(async (id: string) => {
    try {
      const campaign = campaigns.find(c => c.id === id);
      if (!campaign) throw new Error('Campaign not found');

      const settingsStr = localStorage.getItem('sales_integrations');
      const settings = settingsStr ? JSON.parse(settingsStr) : null;
      const emailSettings = settings?.email;
      const waSettings = settings?.whatsapp;

      if (campaign.type === 'email' && !emailSettings?.enabled) {
        throw new Error('Email integration is disabled');
      }

      if (campaign.type === 'whatsapp' && !waSettings?.enabled) {
        throw new Error('WhatsApp integration is disabled. Please enable it in Settings > Integrations.');
      }

      await db.campaigns.update(id, {
        status: 'sending',
        sentAt: new Date().toISOString(),
      });

      setCampaigns(prev => prev.map(c =>
        c.id === id ? { ...c, status: 'sending', sentAt: new Date().toISOString() } : c
      ));

      toast({
        title: i18n.t('campaign_started'),
        description: campaign.type === 'email' ? 'Sending emails...' : 'Sending WhatsApp messages...'
      });

      const template = templates.find(t => t.id === campaign.templateId);
      if (!template) throw new Error('Template not found');

      let sentCount = 0;
      let failedCount = 0;

      // Process each recipient
      for (const recipientId of campaign.recipients) {
        const lead = leads.find(l => l.id === recipientId);
        if (!lead) continue;

        if (campaign.type === 'email' && !lead.email) continue;
        if (campaign.type === 'whatsapp' && !lead.phone) continue;

        // Replace variables
        let content = template.content;
        let subject = template.subject || 'No Subject';

        try {
          Object.entries(lead).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            content = content.replace(regex, String(value || ''));
            subject = subject.replace(regex, String(value || ''));
          });

          if (campaign.type === 'email' && emailSettings.provider === 'Google Gmail API') {
            const accessToken = emailSettings.apiKey;
            if (!accessToken || accessToken.includes('••••')) {
              throw new Error('Invalid Gmail Access Token');
            }

            // Fetch user's email address to construct proper From header
            let userEmail = '';
            try {
              const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
              });
              if (profileRes.ok) {
                const profile = await profileRes.json();
                userEmail = profile.email;
              }
            } catch (e) {
              console.warn('Failed to fetch user email', e);
            }

            // Fallback if email fetch failed
            if (!userEmail) userEmail = 'me';

            const senderName = emailSettings.senderName || 'Sales Team';
            console.log(`Sending Email from: "${senderName}"`);

            // Encode subject for RFC compatibility
            const encodeRFC2047 = (str: string) => {
              return '=?utf-8?B?' + btoa(unescape(encodeURIComponent(str))) + '?=';
            };

            const subjectHeader = encodeRFC2047(subject);
            // Don't encode name if it's simple ASCII, or use a cleaner format
            const fromHeader = `"${senderName}" <${userEmail}>`;

            // Add attachments to content if any
            if (template.attachments && template.attachments.length > 0) {
              content += '<br><br><strong>Attachments:</strong><ul>' +
                template.attachments.map(url => `<li><a href="${url}">${url.split('/').pop()}</a></li>`).join('') +
                '</ul>';
            }

            const messageParts = [
              `MIME-Version: 1.0`,
              `Date: ${new Date().toUTCString()}`,
              `From: ${fromHeader}`,
              `To: ${lead.email}`,
              `Subject: ${subjectHeader}`,
              `Content-Type: text/html; charset=utf-8`,
              ``,
              content
            ];

            const message = messageParts.join('\r\n');
            const encodedMessage = btoa(unescape(encodeURIComponent(message)))
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=+$/, '');

            const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                raw: encodedMessage
              })
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error('Gmail API Error:', errorData);
              throw new Error(errorData.error?.message || 'Failed to send email');
            }
          } else if (campaign.type === 'whatsapp') {
            const rawToken = waSettings?.apiKey || '';
            const token = rawToken.trim();

            if (!token || token.includes('••••')) {
              throw new Error('WhatsApp Token is missing or invalid. Please re-save it in Settings.');
            }

            // Normalize phone number: remove +, spaces, dashes
            let phone = lead.phone.replace(/\D/g, '');
            if (phone.startsWith('0')) {
              phone = '62' + phone.slice(1);
            } else if (phone.startsWith('8')) {
              phone = '62' + phone;
            }

            console.log(`Sending WA to: ${phone}`, { message: content });

            const params = new URLSearchParams();
            params.append('token', token);
            params.append('target', phone);
            params.append('message', content);
            params.append('delay', '1');

            // Add first attachment if exists as media
            if (template.attachments && template.attachments.length > 0) {
              params.append('url', template.attachments[0]);
            }

            const response = await fetch('https://api.fonnte.com/send', {
              method: 'POST',
              headers: {
                'Authorization': token,
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: params.toString()
            });

            const data = await response.json();

            if (!data.status) {
              console.error('Fonnte API Error:', data);
              throw new Error(data.reason || 'Failed to send WhatsApp message via Fonnte');
            }

            // App-side delay to prevent browser rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            // Simulation for other providers
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          sentCount++;

          // Log communication
          await db.communicationLogs.create({
            leadId: lead.id,
            type: campaign.type as 'email' | 'whatsapp',
            subject: campaign.type === 'email' ? subject : 'WhatsApp Broadcast',
            content: content,
            status: 'sent',
            createdBy: user?.id
          });

        } catch (error: any) {
          console.error(`Failed to send to ${recipientId}:`, error);
          failedCount++;

          try {
            // Log failure
            await db.communicationLogs.create({
              leadId: recipientId,
              type: campaign.type as 'email' | 'whatsapp',
              subject: campaign.type === 'email' ? subject : 'WhatsApp Broadcast',
              content: `Error: ${error.message || 'Unknown error'}`,
              status: 'failed',
              createdBy: user?.id
            });
          } catch (logError) {
            console.error('Failed to create failure log:', logError);
          }
        }
      }

      // Update campaign status
      let finalStatus: BroadcastCampaign['status'] = 'completed';
      if (sentCount === 0 && failedCount > 0) {
        finalStatus = 'failed';
      } else if (sentCount === 0 && failedCount === 0) {
        finalStatus = 'draft'; // Nothing processed (e.g. leads missing phone/email)
      }

      await db.campaigns.update(id, {
        status: finalStatus,
        stats: {
          ...campaign.stats,
          sent: sentCount,
          failed: failedCount,
          delivered: sentCount, // Assuming delivered if sent via API
        }
      });

      setCampaigns(prev => prev.map(c =>
        c.id === id ? {
          ...c,
          status: finalStatus,
          stats: {
            ...c.stats,
            sent: sentCount,
            failed: failedCount,
            delivered: sentCount,
          }
        } : c
      ));

      toast({
        title: 'Campaign finished',
        description: `Sent: ${sentCount}, Failed: ${failedCount}`,
        variant: failedCount > 0 ? "destructive" : "default"
      });

    } catch (error: any) {
      console.error('Failed to send campaign:', error);
      toast({ title: 'Error', description: error.message || 'Failed to send campaign', variant: 'destructive' });

      setCampaigns(prev => prev.map(c =>
        c.id === id ? { ...c, status: 'failed' } : c
      ));
    }
  }, [campaigns, leads, templates, user]);

  // Communication Logs
  const addCommunicationLog = useCallback(async (log: Omit<CommunicationLog, 'id' | 'createdAt'>) => {
    try {
      await db.communicationLogs.create(log);
    } catch (error) {
      console.error('Failed to add communication log:', error);
    }
  }, []);

  // Notifications
  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await db.notifications.markAsRead(id);
      setNotifications(prev => prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    if (!user) return;
    try {
      await db.notifications.markAllAsRead(user.id);
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [user]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await db.notifications.delete(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      toast({ title: 'Notification deleted' });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast({ title: 'Error', description: 'Failed to delete notification', variant: 'destructive' });
    }
  }, []);

  const deleteAllNotifications = useCallback(async () => {
    if (!user) return;
    try {
      await db.notifications.deleteAll(user.id);
      setNotifications([]);
      toast({ title: 'All notifications cleared' });
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      toast({ title: 'Error', description: 'Failed to clear notifications', variant: 'destructive' });
    }
  }, [user]);

  // Filtered leads
  const filteredLeads = leads.filter(lead => {
    if (leadFilters.search) {
      const search = leadFilters.search.toLowerCase();
      if (!lead.name.toLowerCase().includes(search) &&
        !lead.company.toLowerCase().includes(search) &&
        !lead.email.toLowerCase().includes(search)) {
        return false;
      }
    }
    if (leadFilters.status !== 'all' && lead.status !== leadFilters.status) return false;
    if (leadFilters.product && !lead.productInterest.includes(leadFilters.product)) return false;
    if (leadFilters.assignedTo && lead.assignedTo !== leadFilters.assignedTo) return false;
    if (leadFilters.tags.length > 0 && !leadFilters.tags.some(tag => lead.tags.includes(tag))) return false;
    if (lead.dealValue < leadFilters.minValue || lead.dealValue > leadFilters.maxValue) return false;
    return true;
  });

  // Products CRUD
  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt'>) => {
    try {
      const newProduct = await db.products.create(product);
      setProducts(prev => [...prev, newProduct].sort((a, b) => a.name.localeCompare(b.name)));
      toast({ title: 'Product added', description: product.name });
    } catch (error) {
      console.error('Failed to add product:', error);
      toast({ title: 'Error', description: 'Failed to add product', variant: 'destructive' });
    }
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    try {
      const updatedProduct = await db.products.update(id, updates);
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p).sort((a, b) => a.name.localeCompare(b.name)));
      toast({ title: 'Product updated' });
    } catch (error) {
      console.error('Failed to update product:', error);
      toast({ title: 'Error', description: 'Failed to update product', variant: 'destructive' });
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await db.products.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Product deleted' });
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
  }, []);

  const deleteAllProducts = useCallback(async () => {
    try {
      await db.products.deleteAll();
      setProducts([]);
      toast({ title: 'All products deleted', description: 'The product list is now empty.' });
    } catch (error) {
      console.error('Failed to delete all products:', error);
      toast({ title: 'Error', description: 'Failed to delete all products', variant: 'destructive' });
    }
  }, []);

  // Pipeline Stages CRUD
  const addPipelineStage = useCallback(async (stage: Omit<PipelineStageConfig, 'created_at'>) => {
    try {
      const newStage = await db.pipelineStages.create(stage);
      setPipelineStages(prev => [...prev, newStage].sort((a, b) => a.order_index - b.order_index));
      toast({ title: 'Stage added', description: stage.label });
    } catch (error) {
      console.error('Failed to add pipeline stage:', error);
      toast({ title: 'Error', description: 'Failed to add pipeline stage', variant: 'destructive' });
    }
  }, []);

  const updatePipelineStage = useCallback(async (id: string, updates: Partial<PipelineStageConfig>) => {
    try {
      const updatedStage = await db.pipelineStages.update(id, updates);
      setPipelineStages(prev => prev.map(s => s.id === id ? updatedStage : s).sort((a, b) => a.order_index - b.order_index));
      toast({ title: 'Stage updated' });
    } catch (error) {
      console.error('Failed to update pipeline stage:', error);
      toast({ title: 'Error', description: 'Failed to update pipeline stage', variant: 'destructive' });
    }
  }, []);

  const deletePipelineStage = useCallback(async (id: string) => {
    try {
      await db.pipelineStages.delete(id);
      setPipelineStages(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Stage deleted' });
    } catch (error) {
      console.error('Failed to delete pipeline stage:', error);
      toast({ title: 'Error', description: 'Failed to delete pipeline stage', variant: 'destructive' });
    }
  }, []);

  return (
    <SalesContext.Provider
      value={{
        leads,
        leadsLoading,
        addLead,
        updateLead,
        deleteLead,
        moveLead,
        deleteAllLeads,
        importLeads,
        refreshLeads,
        tasks,
        tasksLoading,
        addTask,
        updateTask,
        deleteTask,
        deleteAllTasks,
        refreshTasks,
        templates,
        templatesLoading,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        refreshTemplates,
        campaigns,
        campaignsLoading,
        addCampaign,
        updateCampaign,
        deleteCampaign,
        deleteAllCampaigns,
        deleteAllCommunicationLogs,
        sendCampaign,
        refreshCampaigns,

        communicationLogs,
        addCommunicationLog,
        refreshCommunicationLogs,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        deleteAllNotifications,
        refreshNotifications,
        leadFilters,
        setLeadFilters,
        filteredLeads,

        products,
        productsLoading,
        addProduct,
        updateProduct,
        deleteProduct,
        deleteAllProducts,
        refreshProducts,
        pipelineStages,
        pipelineStagesLoading,
        addPipelineStage,
        updatePipelineStage,
        deletePipelineStage,
        refreshPipelineStages,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};
