import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Lead, Task, BroadcastTemplate, BroadcastCampaign, Notification, PipelineStage, CommunicationLog } from '@/types/sales';
import { db } from '@/lib/database';
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
  importLeads: (leads: Partial<Lead>[]) => Promise<void>;
  refreshLeads: () => Promise<void>;
  
  // Tasks
  tasks: Task[];
  tasksLoading: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
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
  refreshNotifications: () => Promise<void>;
  
  // Filters
  leadFilters: LeadFilters;
  setLeadFilters: (filters: LeadFilters) => void;
  filteredLeads: Lead[];
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
  maxValue: 1000000,
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

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [leadsData, tasksData, templatesData, campaignsData, logsData] = await Promise.all([
          db.leads.getAll(),
          db.tasks.getAll(),
          db.templates.getAll(),
          db.campaigns.getAll(),
          db.communicationLogs.getAll(),
        ]);
        
        setLeads(leadsData);
        setTasks(tasksData);
        setTemplates(templatesData);
        setCampaigns(campaignsData);
        setCommunicationLogs(logsData);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: 'Error loading data',
          description: 'Please refresh the page to try again',
          variant: 'destructive',
        });
      } finally {
        setLeadsLoading(false);
        setTasksLoading(false);
        setTemplatesLoading(false);
        setCampaignsLoading(false);
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
        setLeads(prev => [payload.new as Lead, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setLeads(prev => prev.map(lead => 
          lead.id === payload.new.id ? { ...lead, ...payload.new } : lead
        ));
      } else if (payload.eventType === 'DELETE') {
        setLeads(prev => prev.filter(lead => lead.id !== payload.old.id));
      }
    });

    const tasksChannel = db.subscriptions.subscribeToTasks((payload) => {
      if (payload.eventType === 'INSERT') {
        setTasks(prev => [payload.new as Task, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setTasks(prev => prev.map(task => 
          task.id === payload.new.id ? { ...task, ...payload.new } : task
        ));
      } else if (payload.eventType === 'DELETE') {
        setTasks(prev => prev.filter(task => task.id !== payload.old.id));
      }
    });

    const campaignsChannel = db.subscriptions.subscribeToCampaigns((payload) => {
      if (payload.eventType === 'INSERT') {
        setCampaigns(prev => [payload.new as BroadcastCampaign, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setCampaigns(prev => prev.map(campaign => 
          campaign.id === payload.new.id ? { ...campaign, ...payload.new } : campaign
        ));
      }
    });

    return () => {
      db.subscriptions.unsubscribe(leadsChannel);
      db.subscriptions.unsubscribe(tasksChannel);
      db.subscriptions.unsubscribe(campaignsChannel);
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

  // Leads CRUD
  const addLead = useCallback(async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newLead = await db.leads.create(lead);
      setLeads(prev => [newLead, ...prev]);
      toast({ title: 'Lead added', description: `${lead.name} has been added to your leads` });
    } catch (error) {
      console.error('Failed to add lead:', error);
      toast({ title: 'Error', description: 'Failed to add lead', variant: 'destructive' });
    }
  }, []);

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    try {
      const updatedLead = await db.leads.update(id, updates);
      setLeads(prev => prev.map(lead => lead.id === id ? updatedLead : lead));
      toast({ title: 'Lead updated', description: 'Lead information has been updated' });
    } catch (error) {
      console.error('Failed to update lead:', error);
      toast({ title: 'Error', description: 'Failed to update lead', variant: 'destructive' });
    }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    try {
      await db.leads.delete(id);
      setLeads(prev => prev.filter(lead => lead.id !== id));
      toast({ title: 'Lead deleted', description: 'Lead has been removed' });
    } catch (error) {
      console.error('Failed to delete lead:', error);
      toast({ title: 'Error', description: 'Failed to delete lead', variant: 'destructive' });
    }
  }, []);

  const moveLead = useCallback(async (id: string, newStatus: PipelineStage) => {
    try {
      const updatedLead = await db.leads.update(id, { status: newStatus });
      setLeads(prev => prev.map(lead => lead.id === id ? updatedLead : lead));
    } catch (error) {
      console.error('Failed to move lead:', error);
      toast({ title: 'Error', description: 'Failed to update lead status', variant: 'destructive' });
    }
  }, []);

  const importLeads = useCallback(async (importedLeads: Partial<Lead>[]) => {
    try {
      const newLeads = await Promise.all(
        importedLeads.map(lead => db.leads.create({
          name: lead.name || 'Unknown',
          company: lead.company || '',
          phone: lead.phone || '',
          email: lead.email || '',
          productInterest: lead.productInterest || '',
          dealValue: lead.dealValue || 0,
          status: lead.status || 'new_lead',
          tags: lead.tags || [],
          assignedTo: lead.assignedTo || '',
          source: 'CSV Import',
          notes: lead.notes || '',
        }))
      );
      setLeads(prev => [...newLeads, ...prev]);
      toast({ title: 'Leads imported', description: `${newLeads.length} leads have been imported` });
    } catch (error) {
      console.error('Failed to import leads:', error);
      toast({ title: 'Error', description: 'Failed to import leads', variant: 'destructive' });
    }
  }, []);

  // Tasks CRUD
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      const newTask = await db.tasks.create(task);
      setTasks(prev => [newTask, ...prev]);
      toast({ title: 'Task created', description: task.title });
    } catch (error) {
      console.error('Failed to add task:', error);
      toast({ title: 'Error', description: 'Failed to create task', variant: 'destructive' });
    }
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      const updatedTask = await db.tasks.update(id, updates);
      setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await db.tasks.delete(id);
      setTasks(prev => prev.filter(task => task.id !== id));
      toast({ title: 'Task deleted' });
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
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
      const newCampaign = await db.campaigns.create(campaign);
      setCampaigns(prev => [newCampaign, ...prev]);
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

  const sendCampaign = useCallback(async (id: string) => {
    try {
      await db.campaigns.update(id, { 
        status: 'sending',
        sentAt: new Date().toISOString(),
      });
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === id ? { ...campaign, status: 'sending' as const, sentAt: new Date().toISOString() } : campaign
      ));
      toast({ title: 'Campaign started', description: 'Your broadcast is being sent' });
      
      // Simulate sending completion
      setTimeout(async () => {
        const campaign = campaigns.find(c => c.id === id);
        if (campaign) {
          await db.campaigns.update(id, { 
            status: 'completed',
            stats: {
              ...campaign.stats,
              sent: campaign.stats.total,
              delivered: Math.floor(campaign.stats.total * 0.95),
            }
          });
          setCampaigns(prev => prev.map(c => 
            c.id === id ? { 
              ...c, 
              status: 'completed' as const,
              stats: {
                ...c.stats,
                sent: c.stats.total,
                delivered: Math.floor(c.stats.total * 0.95),
              }
            } : c
          ));
        }
      }, 3000);
    } catch (error) {
      console.error('Failed to send campaign:', error);
      toast({ title: 'Error', description: 'Failed to send campaign', variant: 'destructive' });
    }
  }, [campaigns]);

  // Communication Logs
  const addCommunicationLog = useCallback(async (log: Omit<CommunicationLog, 'id' | 'createdAt'>) => {
    try {
      const newLog = await db.communicationLogs.create(log);
      setCommunicationLogs(prev => [newLog, ...prev]);
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
    if (leadFilters.product && lead.productInterest !== leadFilters.product) return false;
    if (leadFilters.assignedTo && lead.assignedTo !== leadFilters.assignedTo) return false;
    if (leadFilters.tags.length > 0 && !leadFilters.tags.some(tag => lead.tags.includes(tag))) return false;
    if (lead.dealValue < leadFilters.minValue || lead.dealValue > leadFilters.maxValue) return false;
    return true;
  });

  return (
    <SalesContext.Provider
      value={{
        leads,
        leadsLoading,
        addLead,
        updateLead,
        deleteLead,
        moveLead,
        importLeads,
        refreshLeads,
        tasks,
        tasksLoading,
        addTask,
        updateTask,
        deleteTask,
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
        sendCampaign,
        refreshCampaigns,
        communicationLogs,
        addCommunicationLog,
        refreshCommunicationLogs,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        refreshNotifications,
        leadFilters,
        setLeadFilters,
        filteredLeads,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};
