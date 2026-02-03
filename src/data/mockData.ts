import { Lead, Task, BroadcastTemplate, BroadcastCampaign, CommunicationLog, User, Notification } from '@/types/sales';

export const mockUsers: User[] = [
  { id: '1', email: 'admin@company.com', name: 'Alex Johnson', role: 'admin', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', createdAt: '2024-01-01' },
  { id: '2', email: 'manager@company.com', name: 'Sarah Chen', role: 'manager', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', createdAt: '2024-01-15' },
  { id: '3', email: 'sales1@company.com', name: 'Mike Wilson', role: 'sales', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', createdAt: '2024-02-01' },
  { id: '4', email: 'sales2@company.com', name: 'Emily Davis', role: 'sales', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', createdAt: '2024-02-15' },
  { id: '5', email: 'sales3@company.com', name: 'James Brown', role: 'sales', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', createdAt: '2024-03-01' },
];

const products = ['Enterprise CRM', 'Analytics Suite', 'Marketing Automation', 'Sales Intelligence', 'Customer Support Platform', 'Data Integration'];
const companies = ['TechCorp Inc', 'Global Solutions', 'Innovate Labs', 'Digital Dynamics', 'Future Systems', 'Smart Industries', 'Cloud Nine Tech', 'Peak Performance', 'Quantum Leap', 'Nexus Group', 'Alpha Ventures', 'Beta Technologies', 'Gamma Solutions', 'Delta Corp', 'Epsilon Holdings'];
const sources = ['Website', 'LinkedIn', 'Referral', 'Trade Show', 'Cold Call', 'Email Campaign', 'Partner'];
const tags = ['Enterprise', 'SMB', 'Startup', 'Hot Lead', 'Decision Maker', 'Technical', 'Budget Approved', 'Q1 Target', 'Renewal', 'Upsell'];

export const mockLeads: Lead[] = Array.from({ length: 50 }, (_, i) => ({
  id: `lead-${i + 1}`,
  name: ['John Smith', 'Jane Doe', 'Robert Johnson', 'Maria Garcia', 'David Lee', 'Lisa Wang', 'Michael Brown', 'Sarah Miller', 'Chris Taylor', 'Amanda White', 'Kevin Zhang', 'Rachel Green', 'Tom Anderson', 'Nancy Kim', 'Paul Martinez'][i % 15] + (i > 14 ? ` ${Math.floor(i / 15) + 1}` : ''),
  company: companies[i % companies.length],
  phone: `+1 (555) ${String(100 + i).padStart(3, '0')}-${String(1000 + i * 7).slice(-4)}`,
  email: `contact${i + 1}@${companies[i % companies.length].toLowerCase().replace(/\s/g, '')}.com`,
  productInterest: products[i % products.length],
  dealValue: [15000, 25000, 50000, 75000, 100000, 150000, 200000, 250000][i % 8],
  status: (['new_lead', 'contacted', 'presentation', 'negotiation', 'closed_won', 'closed_lost'] as const)[i % 6],
  tags: [tags[i % tags.length], tags[(i + 3) % tags.length]],
  assignedTo: mockUsers[2 + (i % 3)].id,
  source: sources[i % sources.length],
  notes: `Initial contact made via ${sources[i % sources.length]}. Interested in ${products[i % products.length]}.`,
  createdAt: new Date(2024, Math.floor(i / 10), (i % 28) + 1).toISOString(),
  updatedAt: new Date(2024, Math.floor(i / 10) + 1, (i % 28) + 1).toISOString(),
}));

export const mockTasks: Task[] = [
  { id: 'task-1', title: 'Follow up with TechCorp', description: 'Send proposal and schedule demo', leadId: 'lead-1', assignedTo: '3', dueDate: '2024-12-20', priority: 'high', status: 'pending', createdAt: '2024-12-15' },
  { id: 'task-2', title: 'Prepare presentation for Global Solutions', description: 'Create custom deck for enterprise features', leadId: 'lead-2', assignedTo: '3', dueDate: '2024-12-18', priority: 'high', status: 'in_progress', createdAt: '2024-12-14' },
  { id: 'task-3', title: 'Send contract to Innovate Labs', description: 'Final contract with negotiated terms', leadId: 'lead-3', assignedTo: '4', dueDate: '2024-12-19', priority: 'medium', status: 'pending', createdAt: '2024-12-15' },
  { id: 'task-4', title: 'Schedule call with Digital Dynamics', description: 'Technical requirements discussion', leadId: 'lead-4', assignedTo: '4', dueDate: '2024-12-21', priority: 'medium', status: 'pending', createdAt: '2024-12-16' },
  { id: 'task-5', title: 'Review Q4 pipeline', description: 'Analyze all deals closing this quarter', assignedTo: '2', dueDate: '2024-12-22', priority: 'high', status: 'pending', createdAt: '2024-12-15' },
  { id: 'task-6', title: 'Update CRM records', description: 'Clean up duplicate entries', assignedTo: '5', dueDate: '2024-12-23', priority: 'low', status: 'pending', createdAt: '2024-12-16' },
  { id: 'task-7', title: 'Prepare monthly report', description: 'Sales performance summary for December', assignedTo: '2', dueDate: '2024-12-31', priority: 'medium', status: 'pending', createdAt: '2024-12-15' },
  { id: 'task-8', title: 'Onboard new sales rep', description: 'Training session for new team member', assignedTo: '2', dueDate: '2024-12-20', priority: 'high', status: 'in_progress', createdAt: '2024-12-10' },
  { id: 'task-9', title: 'Negotiate pricing with Future Systems', description: 'Discuss volume discount', leadId: 'lead-5', assignedTo: '3', dueDate: '2024-12-19', priority: 'high', status: 'pending', createdAt: '2024-12-17' },
  { id: 'task-10', title: 'Send thank you note to closed deals', description: 'Personal follow-up for customer satisfaction', assignedTo: '4', dueDate: '2024-12-24', priority: 'low', status: 'pending', createdAt: '2024-12-18' },
];

export const mockTemplates: BroadcastTemplate[] = [
  { id: 'tpl-1', name: 'Welcome Email', type: 'email', subject: 'Welcome to {{company}} - Let\'s Get Started!', content: 'Hi {{name}},\n\nThank you for your interest in our {{product}}. We\'re excited to help {{company}} achieve its goals.\n\nBest regards,\nThe Sales Team', variables: ['name', 'company', 'product'], createdAt: '2024-01-01', updatedAt: '2024-06-15' },
  { id: 'tpl-2', name: 'Follow-up Email', type: 'email', subject: 'Following Up - {{product}} Demo', content: 'Hi {{name}},\n\nI wanted to follow up on our recent conversation about {{product}}. Do you have any questions I can help answer?\n\nLooking forward to hearing from you.', variables: ['name', 'product'], createdAt: '2024-01-15', updatedAt: '2024-06-20' },
  { id: 'tpl-3', name: 'Special Offer', type: 'email', subject: 'Exclusive Offer for {{company}}', content: 'Hi {{name}},\n\nWe have a special offer exclusively for {{company}}. Get 20% off {{product}} when you sign up this month!\n\nDon\'t miss out on this limited-time opportunity.', variables: ['name', 'company', 'product'], createdAt: '2024-02-01', updatedAt: '2024-07-01' },
  { id: 'tpl-4', name: 'WhatsApp Intro', type: 'whatsapp', content: 'Hi {{name}}! 👋 This is {{sender}} from our sales team. I\'d love to tell you more about how {{product}} can help {{company}}. When would be a good time to chat?', variables: ['name', 'sender', 'product', 'company'], createdAt: '2024-03-01', updatedAt: '2024-08-01' },
  { id: 'tpl-5', name: 'WhatsApp Follow-up', type: 'whatsapp', content: 'Hi {{name}}, just following up on {{product}}. Have you had a chance to review the proposal? Let me know if you have any questions!', variables: ['name', 'product'], createdAt: '2024-03-15', updatedAt: '2024-08-15' },
  { id: 'tpl-6', name: 'Meeting Reminder', type: 'whatsapp', content: 'Hi {{name}}! Just a reminder about our meeting tomorrow at {{time}}. Looking forward to discussing {{product}} with you!', variables: ['name', 'time', 'product'], createdAt: '2024-04-01', updatedAt: '2024-09-01' },
  { id: 'tpl-7', name: 'Product Update', type: 'email', subject: 'New Features in {{product}}', content: 'Hi {{name}},\n\nWe\'ve just released exciting new features in {{product}} that I think {{company}} would love.\n\nWould you like to schedule a quick demo to see them in action?', variables: ['name', 'product', 'company'], createdAt: '2024-05-01', updatedAt: '2024-10-01' },
  { id: 'tpl-8', name: 'Contract Ready', type: 'email', subject: 'Your {{product}} Contract is Ready', content: 'Hi {{name}},\n\nGreat news! The contract for {{company}}\'s {{product}} subscription is ready for review.\n\nPlease let me know if you have any questions or need any modifications.', variables: ['name', 'company', 'product'], createdAt: '2024-06-01', updatedAt: '2024-11-01' },
];

export const mockCampaigns: BroadcastCampaign[] = [
  { id: 'camp-1', name: 'Q4 Product Launch', type: 'email', templateId: 'tpl-7', status: 'completed', sentAt: '2024-10-15', recipients: mockLeads.slice(0, 30).map(l => l.id), stats: { total: 30, sent: 30, delivered: 28, read: 22, replied: 8, failed: 2 }, createdAt: '2024-10-10' },
  { id: 'camp-2', name: 'Holiday Special Offer', type: 'email', templateId: 'tpl-3', status: 'completed', sentAt: '2024-11-20', recipients: mockLeads.slice(0, 25).map(l => l.id), stats: { total: 25, sent: 25, delivered: 24, read: 18, replied: 6, failed: 1 }, createdAt: '2024-11-15' },
  { id: 'camp-3', name: 'New Year Follow-up', type: 'whatsapp', templateId: 'tpl-4', status: 'scheduled', scheduledAt: '2025-01-02', recipients: mockLeads.slice(0, 20).map(l => l.id), stats: { total: 20, sent: 0, delivered: 0, read: 0, replied: 0, failed: 0 }, createdAt: '2024-12-15' },
  { id: 'camp-4', name: 'Enterprise Outreach', type: 'email', templateId: 'tpl-1', status: 'sending', recipients: mockLeads.filter(l => l.tags.includes('Enterprise')).map(l => l.id), stats: { total: 15, sent: 8, delivered: 7, read: 3, replied: 1, failed: 1 }, createdAt: '2024-12-18' },
  { id: 'camp-5', name: 'Hot Leads Reminder', type: 'whatsapp', templateId: 'tpl-5', status: 'draft', recipients: mockLeads.filter(l => l.tags.includes('Hot Lead')).map(l => l.id), stats: { total: 10, sent: 0, delivered: 0, read: 0, replied: 0, failed: 0 }, createdAt: '2024-12-19' },
];

export const mockCommunicationLogs: CommunicationLog[] = [
  { id: 'log-1', leadId: 'lead-1', type: 'email', subject: 'Introduction', content: 'Initial outreach email sent', status: 'read', createdAt: '2024-12-01', createdBy: '3' },
  { id: 'log-2', leadId: 'lead-1', type: 'call', content: 'Discovery call - 30 minutes. Discussed requirements and budget.', status: 'delivered', createdAt: '2024-12-05', createdBy: '3' },
  { id: 'log-3', leadId: 'lead-1', type: 'email', subject: 'Proposal', content: 'Sent detailed proposal with pricing', status: 'delivered', createdAt: '2024-12-10', createdBy: '3' },
  { id: 'log-4', leadId: 'lead-2', type: 'whatsapp', content: 'Quick intro message', status: 'replied', createdAt: '2024-12-02', createdBy: '4' },
  { id: 'log-5', leadId: 'lead-2', type: 'meeting', content: 'Product demo - showed all features', status: 'delivered', createdAt: '2024-12-08', createdBy: '4' },
  { id: 'log-6', leadId: 'lead-3', type: 'email', subject: 'Follow-up', content: 'Following up on demo', status: 'read', createdAt: '2024-12-12', createdBy: '4' },
  { id: 'log-7', leadId: 'lead-4', type: 'call', content: 'Technical requirements discussion', status: 'delivered', createdAt: '2024-12-14', createdBy: '5' },
  { id: 'log-8', leadId: 'lead-5', type: 'note', content: 'Customer requested custom pricing', status: 'delivered', createdAt: '2024-12-15', createdBy: '3' },
];

export const mockNotifications: Notification[] = [
  { id: 'notif-1', type: 'task', title: 'Task Due Soon', message: 'Follow up with TechCorp is due tomorrow', read: false, createdAt: '2024-12-19T10:00:00' },
  { id: 'notif-2', type: 'lead', title: 'New Lead Assigned', message: 'You have been assigned a new lead: Smart Industries', read: false, createdAt: '2024-12-19T09:30:00' },
  { id: 'notif-3', type: 'broadcast', title: 'Campaign Completed', message: 'Q4 Product Launch campaign has finished sending', read: true, createdAt: '2024-12-18T15:00:00' },
  { id: 'notif-4', type: 'lead', title: 'Deal Closed', message: 'Congratulations! TechCorp deal closed for $150,000', read: true, createdAt: '2024-12-17T14:00:00' },
  { id: 'notif-5', type: 'system', title: 'System Update', message: 'New features have been added to the pipeline view', read: true, createdAt: '2024-12-16T10:00:00' },
  { id: 'notif-6', type: 'task', title: 'Task Overdue', message: 'Prepare presentation for Global Solutions is overdue', read: false, createdAt: '2024-12-19T08:00:00' },
  { id: 'notif-7', type: 'broadcast', title: 'WhatsApp Campaign Scheduled', message: 'New Year Follow-up will be sent on Jan 2, 2025', read: false, createdAt: '2024-12-15T16:00:00' },
  { id: 'notif-8', type: 'lead', title: 'Lead Status Changed', message: 'Global Solutions moved to Negotiation stage', read: true, createdAt: '2024-12-14T11:00:00' },
];

export const getDashboardStats = () => ({
  totalLeads: mockLeads.length,
  activeDeals: mockLeads.filter(l => !['closed_won', 'closed_lost'].includes(l.status)).length,
  closingRate: Math.round((mockLeads.filter(l => l.status === 'closed_won').length / mockLeads.length) * 100),
  revenue: mockLeads.filter(l => l.status === 'closed_won').reduce((sum, l) => sum + l.dealValue, 0),
  leadsThisMonth: 12,
  dealsThisMonth: 5,
  revenueThisMonth: 425000,
  conversionRate: 18.5,
});

export const getSalesPerformance = () => mockUsers.filter(u => u.role === 'sales').map(user => {
  const userLeads = mockLeads.filter(l => l.assignedTo === user.id);
  const closedWon = userLeads.filter(l => l.status === 'closed_won');
  return {
    userId: user.id,
    userName: user.name,
    leadsAssigned: userLeads.length,
    dealsClosed: closedWon.length,
    revenue: closedWon.reduce((sum, l) => sum + l.dealValue, 0),
    conversionRate: userLeads.length > 0 ? Math.round((closedWon.length / userLeads.length) * 100) : 0,
  };
});

export const getPipelineData = () => {
  const stages = ['new_lead', 'contacted', 'presentation', 'negotiation', 'closed_won', 'closed_lost'] as const;
  return stages.map(stage => ({
    stage,
    count: mockLeads.filter(l => l.status === stage).length,
    value: mockLeads.filter(l => l.status === stage).reduce((sum, l) => sum + l.dealValue, 0),
  }));
};

export const getMonthlyRevenue = () => [
  { month: 'Jan', revenue: 180000, deals: 4 },
  { month: 'Feb', revenue: 220000, deals: 5 },
  { month: 'Mar', revenue: 195000, deals: 4 },
  { month: 'Apr', revenue: 280000, deals: 6 },
  { month: 'May', revenue: 310000, deals: 7 },
  { month: 'Jun', revenue: 265000, deals: 5 },
  { month: 'Jul', revenue: 340000, deals: 8 },
  { month: 'Aug', revenue: 295000, deals: 6 },
  { month: 'Sep', revenue: 380000, deals: 9 },
  { month: 'Oct', revenue: 420000, deals: 10 },
  { month: 'Nov', revenue: 385000, deals: 8 },
  { month: 'Dec', revenue: 425000, deals: 9 },
];
