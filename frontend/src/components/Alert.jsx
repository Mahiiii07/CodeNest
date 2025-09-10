import { useEffect } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

const Alert = ({ type = 'info', message, onClose, autoClose = false }) => {
    const alertStyles = {
        success: 'bg-green-500/20 border-green-500/30 text-green-300',
        error: 'bg-red-500/20 border-red-500/30 text-red-300',
        warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
        info: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    };

    const iconStyles = {
        success: 'text-green-400',
        error: 'text-red-400',
        warning: 'text-yellow-400',
        info: 'text-blue-400',
    };

    const Icon = type === 'success' ? CheckCircle : AlertCircle;

    //  AUTO CLOSE SUCCESS MESSAGES AFTER 5 SECONDS
    useEffect(() => {
        if (autoClose || type === 'success') {
            const timer = setTimeout(() => {
                if (onClose) onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [autoClose, type, onClose]);

    return (
        <div className={`border rounded-lg p-3 mb-4 flex items-center gap-3 ${alertStyles[type]}`}>
            <Icon className={`${iconStyles[type]} flex-shrink-0`} size={20} />
            <span className="flex-1 text-sm">{message}</span>
            {onClose && (
                <button
                    onClick={onClose}
                    className="text-current hover:opacity-70 flex-shrink-0"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
};

export default Alert;
