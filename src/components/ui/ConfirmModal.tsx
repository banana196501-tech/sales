import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    variant = 'danger'
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    const colors = {
        danger: {
            icon: 'bg-red-100 text-red-600',
            button: 'bg-red-600 hover:bg-red-700 shadow-red-200',
        },
        warning: {
            icon: 'bg-amber-100 text-amber-600',
            button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200',
        },
        info: {
            icon: 'bg-blue-100 text-blue-600',
            button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl shrink-0 ${colors[variant].icon}`}>
                            {variant === 'danger' ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                                <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <p className="text-slate-600 leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-8">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-semibold transition-colors"
                        >
                            {cancelText || t('cancel')}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 px-4 py-3 text-white rounded-2xl font-semibold shadow-lg transition-all active:scale-95 ${colors[variant].button}`}
                        >
                            {confirmText || t('confirm')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
