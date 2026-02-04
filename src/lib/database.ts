import { supabase } from './supabase';
import { Lead, Task, BroadcastTemplate, BroadcastCampaign, CommunicationLog, Notification, User, PipelineStage, Product, PipelineStageConfig } from '@/types/sales';

// Type mappings from database to frontend
export interface DbUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'sales';
  avatar: string | null;
  password: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProduct {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface DbLead {
  id: string;
  name: string;
  company: string;
  phone: string | null;
  email: string;
  product_interest: string[] | null;
  deal_value: number;
  status: PipelineStage;
  tags: string[];
  assigned_to: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTask {
  id: string;
  title: string;
  description: string | null;
  lead_id: string | null;
  assigned_to: string | null;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface DbTemplate {
  id: string;
  name: string;
  type: 'email' | 'whatsapp';
  subject: string | null;
  content: string;
  variables: string[];
  attachments: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface DbCampaign {
  id: string;
  name: string;
  type: 'email' | 'whatsapp';
  template_id: string | null;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduled_at: string | null;
  sent_at: string | null;
  recipients: string[];
  stats: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    replied: number;
    failed: number;
  };
  created_at: string;
}

interface DbCommunicationLog {
  id: string;
  lead_id: string;
  type: 'email' | 'whatsapp' | 'call' | 'meeting' | 'note';
  subject: string | null;
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
  created_by: string | null;
  created_at: string;
}

interface DbNotification {
  id: string;
  user_id: string;
  type: 'task' | 'lead' | 'broadcast' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// Transform functions
export const transformUser = (db: DbUser): User => ({
  id: db.id,
  email: db.email,
  name: db.name,
  role: db.role,
  avatar: db.avatar || undefined,
  password: db.password || undefined,
  createdAt: db.created_at,
});

export const transformProduct = (db: DbProduct): Product => ({
  id: db.id,
  name: db.name,
  description: db.description || undefined,
  createdAt: db.created_at,
});

export const transformLead = (db: DbLead): Lead => ({
  id: db.id,
  name: db.name,
  company: db.company,
  phone: db.phone || '',
  email: db.email,
  productInterest: db.product_interest || [],
  dealValue: Number(db.deal_value),
  status: db.status,
  tags: db.tags || [],
  assignedTo: db.assigned_to || '',
  source: db.source || '',
  notes: db.notes || '',
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

export const transformTask = (db: DbTask): Task => ({
  id: db.id,
  title: db.title,
  description: db.description || '',
  leadId: db.lead_id || undefined,
  assignedTo: db.assigned_to || '',
  dueDate: db.due_date,
  priority: db.priority,
  status: db.status,
  createdAt: db.created_at,
});

export const transformTemplate = (db: DbTemplate): BroadcastTemplate => ({
  id: db.id,
  name: db.name,
  type: db.type,
  subject: db.subject || undefined,
  content: db.content,
  variables: db.variables || [],
  attachments: db.attachments || [],
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

export const transformCampaign = (db: DbCampaign): BroadcastCampaign => ({
  id: db.id,
  name: db.name,
  type: db.type,
  templateId: db.template_id || '',
  status: db.status,
  scheduledAt: db.scheduled_at || undefined,
  sentAt: db.sent_at || undefined,
  recipients: db.recipients || [],
  stats: db.stats,
  createdAt: db.created_at,
});

export const transformCommunicationLog = (db: DbCommunicationLog): CommunicationLog => ({
  id: db.id,
  leadId: db.lead_id,
  type: db.type,
  subject: db.subject || undefined,
  content: db.content,
  status: db.status,
  createdBy: db.created_by || '',
  createdAt: db.created_at,
});

const transformNotification = (db: DbNotification): Notification => ({
  id: db.id,
  type: db.type,
  title: db.title,
  message: db.message,
  read: db.read,
  createdAt: db.created_at,
});

// Database API
export const db = {
  // Products
  products: {
    async getAll(): Promise<Product[]> {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('CRITICAL ERROR - Products Table Fetch Failed:', error);
        throw error;
      }
      return (data || []).map(transformProduct);
    },
    async create(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
      const { data, error } = await supabase.from('products').insert({
        name: product.name,
        description: product.description,
      }).select().single();
      if (error) throw error;
      return transformProduct(data);
    },
    async update(id: string, updates: Partial<Product>): Promise<Product> {
      const { data, error } = await supabase.from('products').update({
        name: updates.name,
        description: updates.description,
      }).eq('id', id).select().single();
      if (error) throw error;
      return transformProduct(data);
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    async deleteAll(): Promise<void> {
      const { error } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    },
  },

  // Users
  users: {
    async getAll(): Promise<User[]> {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(transformUser);
    },
    async getByEmail(email: string): Promise<User | null> {
      const { data, error } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).single();
      if (error) return null;
      return data ? transformUser(data) : null;
    },
    async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
      const { data, error } = await supabase.from('users').insert({
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      }).select().single();
      if (error) throw error;
      return transformUser(data);
    },
    async update(id: string, updates: Partial<User>): Promise<User> {
      const { data, error } = await supabase.from('users').update({
        name: updates.name,
        email: updates.email,
        role: updates.role,
        avatar: updates.avatar,
        password: updates.password,
        updated_at: new Date().toISOString(),
      }).eq('id', id).select().single();
      if (error) throw error;
      return transformUser(data);
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
    },
  },

  // Leads
  leads: {
    async getAll(): Promise<Lead[]> {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(transformLead);
    },
    async getById(id: string): Promise<Lead | null> {
      const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
      if (error) return null;
      return data ? transformLead(data) : null;
    },
    async create(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
      const { data, error } = await supabase.from('leads').insert({
        name: lead.name,
        company: lead.company,
        phone: lead.phone,
        email: lead.email,
        product_interest: lead.productInterest,
        deal_value: lead.dealValue,
        status: lead.status,
        tags: lead.tags,
        assigned_to: lead.assignedTo || null,
        source: lead.source,
        notes: lead.notes,
      }).select().single();
      if (error) throw error;
      return transformLead(data);
    },
    async update(id: string, updates: Partial<Lead>): Promise<Lead> {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.company !== undefined) updateData.company = updates.company;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.productInterest !== undefined) updateData.product_interest = updates.productInterest;
      if (updates.dealValue !== undefined) updateData.deal_value = updates.dealValue;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo || null;
      if (updates.source !== undefined) updateData.source = updates.source;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { data, error } = await supabase.from('leads').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return transformLead(data);
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    async deleteAll(): Promise<void> {
      const { error } = await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    },
  },

  // Tasks
  tasks: {
    async getAll(): Promise<Task[]> {
      const { data, error } = await supabase.from('tasks').select('*').order('due_date', { ascending: true });
      if (error) throw error;
      return (data || []).map(transformTask);
    },
    async create(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
      const { data, error } = await supabase.from('tasks').insert({
        title: task.title,
        description: task.description,
        lead_id: task.leadId || null,
        assigned_to: task.assignedTo || null,
        due_date: task.dueDate,
        priority: task.priority,
        status: task.status,
      }).select().single();
      if (error) throw error;
      return transformTask(data);
    },
    async update(id: string, updates: Partial<Task>): Promise<Task> {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.leadId !== undefined) updateData.lead_id = updates.leadId || null;
      if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo || null;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.status !== undefined) updateData.status = updates.status;

      const { data, error } = await supabase.from('tasks').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return transformTask(data);
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    async deleteAll(): Promise<void> {
      const { error } = await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    },
  },

  // Templates
  templates: {
    async getAll(): Promise<BroadcastTemplate[]> {
      const { data, error } = await supabase.from('broadcast_templates').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(transformTemplate);
    },
    async create(template: Omit<BroadcastTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<BroadcastTemplate> {
      const { data, error } = await supabase.from('broadcast_templates').insert({
        name: template.name,
        type: template.type,
        subject: template.subject,
        content: template.content,
        variables: template.variables,
        attachments: template.attachments || [],
      }).select().single();
      if (error) throw error;
      return transformTemplate(data);
    },
    async update(id: string, updates: Partial<BroadcastTemplate>): Promise<BroadcastTemplate> {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.subject !== undefined) updateData.subject = updates.subject;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.variables !== undefined) updateData.variables = updates.variables;
      if (updates.attachments !== undefined) updateData.attachments = updates.attachments;

      const { data, error } = await supabase.from('broadcast_templates').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return transformTemplate(data);
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('broadcast_templates').delete().eq('id', id);
      if (error) throw error;
    },
  },

  // Campaigns
  campaigns: {
    async getAll(): Promise<BroadcastCampaign[]> {
      const { data, error } = await supabase.from('broadcast_campaigns').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(transformCampaign);
    },
    async create(campaign: Omit<BroadcastCampaign, 'id' | 'createdAt'>): Promise<BroadcastCampaign> {
      const { data, error } = await supabase.from('broadcast_campaigns').insert({
        name: campaign.name,
        type: campaign.type,
        template_id: campaign.templateId || null,
        status: campaign.status,
        scheduled_at: campaign.scheduledAt,
        recipients: campaign.recipients,
        stats: campaign.stats,
      }).select().single();
      if (error) throw error;
      return transformCampaign(data);
    },
    async update(id: string, updates: Partial<BroadcastCampaign>): Promise<BroadcastCampaign> {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.scheduledAt !== undefined) updateData.scheduled_at = updates.scheduledAt;
      if (updates.sentAt !== undefined) updateData.sent_at = updates.sentAt;
      if (updates.stats !== undefined) updateData.stats = updates.stats;

      const { data, error } = await supabase.from('broadcast_campaigns').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return transformCampaign(data);
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('broadcast_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    async deleteAll(type?: 'email' | 'whatsapp'): Promise<void> {
      let query = supabase.from('broadcast_campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (type) {
        query = query.eq('type', type);
      }
      const { error } = await query;
      if (error) throw error;
    },
  },

  // Communication Logs
  communicationLogs: {
    async getAll(): Promise<CommunicationLog[]> {
      const { data, error } = await supabase.from('communication_logs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(transformCommunicationLog);
    },
    async getByLeadId(leadId: string): Promise<CommunicationLog[]> {
      const { data, error } = await supabase.from('communication_logs').select('*').eq('lead_id', leadId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(transformCommunicationLog);
    },
    async create(log: Omit<CommunicationLog, 'id' | 'createdAt'>): Promise<CommunicationLog> {
      const { data, error } = await supabase.from('communication_logs').insert({
        lead_id: log.leadId,
        type: log.type,
        subject: log.subject,
        content: log.content,
        status: log.status,
        created_by: log.createdBy || null,
      }).select().single();
      if (error) throw error;
      return transformCommunicationLog(data);
    },
    async update(id: string, updates: Partial<CommunicationLog>): Promise<CommunicationLog> {
      const { data, error } = await supabase.from('communication_logs').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return transformCommunicationLog(data);
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('communication_logs').delete().eq('id', id);
      if (error) throw error;
    },
    async deleteAll(type?: 'email' | 'whatsapp'): Promise<void> {
      let query = supabase.from('communication_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (type) {
        query = query.eq('type', type);
      }
      const { error } = await query;
      if (error) throw error;
    },
  },

  // Notifications
  notifications: {
    async getByUserId(userId: string): Promise<Notification[]> {
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(transformNotification);
    },
    async create(notification: Omit<Notification, 'id' | 'createdAt'> & { userId: string }): Promise<Notification> {
      const { data, error } = await supabase.from('notifications').insert({
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
      }).select().single();
      if (error) throw error;
      return transformNotification(data);
    },
    async markAsRead(id: string): Promise<void> {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
      if (error) throw error;
    },
    async markAllAsRead(userId: string): Promise<void> {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
      if (error) throw error;
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    async deleteAll(userId: string): Promise<void> {
      const { error } = await supabase.from('notifications').delete().eq('user_id', userId);
      if (error) throw error;
    },
  },

  // Pipeline Stages
  pipelineStages: {
    async getAll(): Promise<PipelineStageConfig[]> {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Failed to fetch pipeline stages:', error);
        throw error;
      }
      return data || [];
    },
    async create(stage: Omit<PipelineStageConfig, 'created_at'>): Promise<PipelineStageConfig> {
      const { data, error } = await supabase.from('pipeline_stages').insert(stage).select().single();
      if (error) throw error;
      return data;
    },
    async update(id: string, updates: Partial<PipelineStageConfig>): Promise<PipelineStageConfig> {
      const { data, error } = await supabase.from('pipeline_stages').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('pipeline_stages').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // Real-time subscriptions
  subscriptions: {
    subscribeToLeads(callback: (payload: any) => void) {
      return supabase
        .channel('leads-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, callback)
        .subscribe();
    },
    subscribeToTasks(callback: (payload: any) => void) {
      return supabase
        .channel('tasks-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, callback)
        .subscribe();
    },
    subscribeToCampaigns(callback: (payload: any) => void) {
      return supabase
        .channel('campaigns-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcast_campaigns' }, callback)
        .subscribe();
    },
    subscribeToCommunicationLogs(callback: (payload: any) => void) {
      return supabase
        .channel('communication-logs-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'communication_logs' }, callback)
        .subscribe();
    },
    subscribeToNotifications(userId: string, callback: (payload: any) => void) {
      return supabase
        .channel('notifications-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, callback)
        .subscribe();
    },
    unsubscribe(channel: any) {
      supabase.removeChannel(channel);
    },
  },
};
