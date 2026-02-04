import React, { useState, useEffect } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { useAuth } from '@/contexts/AuthContext';
import { Lead, PipelineStage } from '@/types/sales';
import { X, User, Building, Phone, Mail, Package, DollarSign, Tag, FileText, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

interface LeadModalProps {
  lead: Lead | null;
  onClose: () => void;
}

const LeadModal: React.FC<LeadModalProps> = ({ lead, onClose }) => {
  const { t } = useTranslation();
  const { addLead, updateLead, products, pipelineStages } = useSales();
  const { user, users } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    productInterest: [] as string[],
    dealValue: 0,
    status: 'new_lead' as PipelineStage,
    tags: [] as string[],
    assignedTo: user?.id || '',
    source: '',
    notes: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sources = ['Website', 'LinkedIn', 'Referral', 'Trade Show', 'Cold Call', 'Email Campaign', 'Partner'];
  const suggestedTags = ['Enterprise', 'SMB', 'Startup', 'Hot Lead', 'Decision Maker', 'Technical', 'Budget Approved'];

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name,
        company: lead.company,
        phone: lead.phone,
        email: lead.email,
        productInterest: lead.productInterest || [],
        dealValue: lead.dealValue,
        status: lead.status,
        tags: lead.tags,
        assignedTo: lead.assignedTo,
        source: lead.source,
        notes: lead.notes,
      });
    }
  }, [lead]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.company.trim()) newErrors.company = 'Company is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (lead) {
        await updateLead(lead.id, formData);
        toast({ title: t('lead_updated'), description: t('lead_updated_desc', { name: formData.name }) });
      } else {
        await addLead(formData);
        toast({ title: t('lead_created'), description: t('lead_created_desc', { name: formData.name }) });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save lead:', error);
      toast({ title: 'Error', description: 'Failed to save lead', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({ ...formData, tags: [...formData.tags, trimmedTag] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      {/* Modal */}
      <div className="relative bg-white rounded-[24px] shadow-2xl ring-1 ring-slate-900/5 w-full max-w-5xl max-h-[90vh] overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-900">
            {lead ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-8 space-y-8">
            {/* Basic & Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 ${errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  placeholder="John Smith"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Building className="w-4 h-4 inline mr-1" />
                  Company *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${errors.company ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                    }`}
                  placeholder="Acme Inc"
                />
                {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                    }`}
                  placeholder="john@company.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="+62 812..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lead Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="">Select source</option>
                  {sources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assigned To</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="">Unassigned</option>
                  {users.filter(u => u.role === 'sales').map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product, Value & Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Package className="w-4 h-4 inline mr-1" />
                  Product Interest
                </label>
                <div className="flex flex-wrap gap-2 mb-2 min-h-[42px] p-2 bg-slate-50 border border-slate-100 rounded-xl">
                  {formData.productInterest.length > 0 ? (
                    formData.productInterest.map(pName => (
                      <span
                        key={pName}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium border border-indigo-100"
                      >
                        {pName}
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            productInterest: formData.productInterest.filter(p => p !== pName)
                          })}
                          className="hover:text-indigo-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 p-1">No products selected</span>
                  )}
                </div>
                <select
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !formData.productInterest.includes(val)) {
                      setFormData({
                        ...formData,
                        productInterest: [...formData.productInterest, val]
                      });
                    }
                  }}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="">Add product...</option>
                  {products
                    .filter(p => !formData.productInterest.includes(p.name))
                    .map(product => (
                      <option key={product.id} value={product.name}>{product.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Deal Value (Rp)
                </label>
                <input
                  type="number"
                  value={formData.dealValue}
                  onChange={(e) => setFormData({ ...formData, dealValue: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="50000"
                />
                <p className="text-xs text-slate-400 mt-2 italic">
                  Total: Rp {formData.dealValue.toLocaleString('id-ID')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as PipelineStage })}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold text-indigo-600"
                >
                  {pipelineStages.map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200"
                    >
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-slate-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    className="flex-1 px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Add tag and press Enter"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {suggestedTags.filter(t => !formData.tags.includes(t)).slice(0, 5).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-xs transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  placeholder="Add any additional notes about this customer..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-300 font-medium shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {lead ? 'Update Lead' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadModal;
