// Core Types for Sales Application

export type UserRole = 'admin' | 'manager' | 'sales';

export interface Product {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  password?: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  productInterest: string[];
  dealValue: number;
  status: PipelineStage;
  tags: string[];
  assignedTo: string;
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type PipelineStage = string;

export interface PipelineStageConfig {
  id: string;
  label: string;
  color: string;
  order_index: number;
  is_system: boolean;
  active?: boolean;
}


export interface Task {
  id: string;
  title: string;
  description: string;
  leadId?: string;
  assignedTo: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface CommunicationLog {
  id: string;
  leadId: string;
  type: 'email' | 'whatsapp' | 'call' | 'meeting' | 'note';
  subject?: string;
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
  createdAt: string;
  createdBy: string;
}

export interface BroadcastTemplate {
  id: string;
  name: string;
  type: 'email' | 'whatsapp';
  subject?: string;
  content: string;
  variables: string[];
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastCampaign {
  id: string;
  name: string;
  type: 'email' | 'whatsapp';
  templateId: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduledAt?: string;
  sentAt?: string;
  recipients: string[];
  stats: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    replied: number;
    failed: number;
  };
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'task' | 'lead' | 'broadcast' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalLeads: number;
  activeDeals: number;
  closingRate: number;
  revenue: number;
  leadsThisMonth: number;
  dealsThisMonth: number;
  revenueThisMonth: number;
  conversionRate: number;
}

export interface SalesPerformance {
  userId: string;
  userName: string;
  leadsAssigned: number;
  dealsClosed: number;
  revenue: number;
  conversionRate: number;
}
