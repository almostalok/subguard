import React from 'react';
import { EvidenceLevel, CommitmentStatus, MandateStatus } from '@subguard/types';
import { formatCurrency } from '@subguard/utils';

// ==========================================
// 1. Button Component (Vercel Grid Style)
// ==========================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', isLoading = false, className = '', disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:opacity-40 disabled:pointer-events-none select-none min-h-[40px]';

    const variantStyles = {
      primary: 'bg-white text-black hover:bg-neutral-200 border border-transparent font-semibold shadow-xs',
      secondary: 'bg-[#0A0A0A] text-[#EDEDED] border border-[#27272A] hover:bg-[#171717] hover:border-[#3F3F46]',
      outline: 'bg-transparent text-[#EDEDED] border border-[#27272A] hover:bg-[#141414] hover:border-[#3F3F46]',
      danger: 'bg-red-950/40 text-red-400 border border-red-800/50 hover:bg-red-900/40',
      ghost: 'bg-transparent text-[#888888] hover:text-[#EDEDED] hover:bg-[#141414]',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-2.5 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-3.5 w-3.5 text-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="font-mono text-xs">PROCESSING</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ==========================================
// 2. Badge Components (Technical Vercel Tags)
// ==========================================

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'risk' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center font-mono font-medium rounded-md uppercase tracking-wider transition-colors';
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  const variantStyles = {
    neutral: 'bg-zinc-900 text-zinc-300 border border-zinc-800',
    success: 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40',
    warning: 'bg-amber-950/40 text-amber-400 border border-amber-800/40',
    risk: 'bg-red-950/40 text-red-400 border border-red-800/40',
    info: 'bg-blue-950/40 text-blue-400 border border-blue-800/40',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const EvidenceBadge: React.FC<{ level: EvidenceLevel; className?: string }> = ({
  level,
  className = '',
}) => {
  switch (level) {
    case EvidenceLevel.CONFIRMED:
      return (
        <Badge variant="success" className={className}>
          ● Confirmed
        </Badge>
      );
    case EvidenceLevel.EXPECTED:
      return (
        <Badge variant="info" className={className}>
          Expected
        </Badge>
      );
    case EvidenceLevel.ESTIMATED:
      return (
        <Badge variant="neutral" className={className}>
          Estimated
        </Badge>
      );
    case EvidenceLevel.POTENTIAL:
      return (
        <Badge variant="warning" className={className}>
          Potential
        </Badge>
      );
    case EvidenceLevel.NEEDS_REVIEW:
      return (
        <Badge variant="risk" className={className}>
          Review Needed
        </Badge>
      );
    default:
      return <Badge variant="neutral" className={className}>{level}</Badge>;
  }
};

export const StatusBadge: React.FC<{
  status: CommitmentStatus | MandateStatus;
  className?: string;
}> = ({ status, className = '' }) => {
  switch (status) {
    case CommitmentStatus.ACTIVE:
      return <Badge variant="success" className={className}>Active</Badge>;
    case CommitmentStatus.PAUSED:
      return <Badge variant="warning" className={className}>Paused</Badge>;
    case CommitmentStatus.CANCELLED:
    case MandateStatus.REVOKED:
      return <Badge variant="neutral" className={className}>Cancelled</Badge>;
    case CommitmentStatus.ARCHIVED:
    case MandateStatus.EXPIRED:
      return <Badge variant="neutral" className={className}>Archived</Badge>;
    default:
      return <Badge variant="neutral" className={className}>{status}</Badge>;
  }
};

// ==========================================
// 3. Card Component (Vercel Modular Grid Card)
// ==========================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={`bg-[#0A0A0A] border border-[#222222] rounded-lg transition-all duration-150 ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// ==========================================
// 4. StatCard Component (Vercel Grid Metric)
// ==========================================

export interface StatCardProps {
  label: string;
  amountMinor?: number;
  value?: string | number;
  currency?: string;
  description?: string;
  badge?: React.ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    text: string;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  amountMinor,
  value,
  currency = 'INR',
  description,
  badge,
  className = '',
}) => {
  const displayValue =
    typeof amountMinor === 'number' ? formatCurrency(amountMinor, currency) : value;

  return (
    <div className={`bg-[#0A0A0A] border border-[#222222] p-5 rounded-lg flex flex-col justify-between hover:border-[#333333] transition-colors ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-mono tracking-wider text-[#888888] uppercase">
          {label}
        </span>
        {badge}
      </div>
      <div className="text-2xl lg:text-3xl font-semibold tracking-tight text-[#EDEDED] font-mono tabular-nums">
        {displayValue}
      </div>
      {description && (
        <p className="mt-2.5 text-xs text-[#888888] leading-relaxed">{description}</p>
      )}
    </div>
  );
};

// ==========================================
// 5. Input, Select, Textarea (Vercel Inputs)
// ==========================================

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className = '', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1A1]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2 text-sm bg-[#0A0A0A] text-[#EDEDED] border rounded-md transition-colors placeholder:text-zinc-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white min-h-[40px] font-sans ${
            error ? 'border-red-500 ring-1 ring-red-500' : 'border-[#27272A] hover:border-[#3F3F46]'
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-400 font-mono">{error}</span>}
        {helperText && !error && <span className="text-xs text-[#888888]">{helperText}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, id, className = '', ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1A1]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full px-3 py-2 text-sm bg-[#0A0A0A] text-[#EDEDED] border rounded-md transition-colors focus:outline-none focus:border-white focus:ring-1 focus:ring-white min-h-[40px] font-sans ${
            error ? 'border-red-500' : 'border-[#27272A] hover:border-[#3F3F46]'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#111111] text-[#EDEDED]">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-red-400 font-mono">{error}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ==========================================
// 6. Modal / Dialog Component (Vercel Modal)
// ==========================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg bg-[#0A0A0A] border border-[#27272A] rounded-lg shadow-2xl overflow-hidden p-6">
        <div className="flex items-start justify-between pb-4 border-b border-[#222222]">
          <div>
            <h3 className="text-base font-semibold text-[#EDEDED]">{title}</h3>
            {description && (
              <p className="mt-1 text-xs text-[#888888]">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-md text-[#888888] hover:text-[#EDEDED] hover:bg-[#141414] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center font-mono text-sm"
          >
            ✕
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
};
