import React from 'react';
import { EvidenceLevel, CommitmentStatus, MandateStatus } from '@subguard/types';
import { formatCurrency } from '@subguard/utils';

// ==========================================
// 1. Button Component
// ==========================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', isLoading = false, className = '', disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none min-h-[44px]';

    const variantStyles = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-primary shadow-sm',
      secondary: 'bg-surface-subtle text-primary border border-border hover:bg-surface-hover focus-visible:ring-border',
      outline: 'bg-transparent text-primary border border-border hover:bg-surface-subtle focus-visible:ring-border',
      danger: 'bg-status-risk text-white hover:bg-red-700 focus-visible:ring-status-risk shadow-sm',
      ghost: 'bg-transparent text-primary hover:bg-surface-subtle focus-visible:ring-border',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs font-medium',
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
              className="animate-spin h-4 w-4 text-current"
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
            <span>Processing...</span>
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
// 2. Badge Component
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
  const baseStyles = 'inline-flex items-center font-medium rounded-full tracking-wide uppercase';
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  const variantStyles = {
    neutral: 'bg-stone-100 text-stone-700 border border-stone-200',
    success: 'bg-status-verified-bg text-status-verified border border-status-verified-border',
    warning: 'bg-status-warning-bg text-status-warning border border-status-warning-border',
    risk: 'bg-status-risk-bg text-status-risk border border-status-risk-border',
    info: 'bg-status-info-bg text-status-info border border-status-info-border',
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
          Needs Review
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
// 3. Card Component
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
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`bg-surface border border-border rounded-xl shadow-sm transition-all duration-150 ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// ==========================================
// 4. StatCard Component (KPI)
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
    <Card padding="md" className={`flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          {label}
        </span>
        {badge}
      </div>
      <div className="text-2xl lg:text-3xl font-semibold tracking-tight text-primary font-mono tabular-nums">
        {displayValue}
      </div>
      {description && (
        <p className="mt-2 text-xs text-muted leading-relaxed">{description}</p>
      )}
    </Card>
  );
};

// ==========================================
// 5. Input, Select, Textarea
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
          <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-primary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3.5 py-2.5 text-sm bg-surface text-primary border rounded-lg transition-colors placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px] ${
            error ? 'border-status-risk ring-1 ring-status-risk' : 'border-border hover:border-border-strong'
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-status-risk font-medium">{error}</span>}
        {helperText && !error && <span className="text-xs text-muted">{helperText}</span>}
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
          <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wider text-primary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full px-3.5 py-2.5 text-sm bg-surface text-primary border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px] ${
            error ? 'border-status-risk' : 'border-border hover:border-border-strong'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-status-risk font-medium">{error}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ==========================================
// 6. Modal / Dialog Component
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-xl overflow-hidden p-6">
        <div className="flex items-start justify-between pb-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            {description && (
              <p className="mt-1 text-xs text-muted">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-md text-muted hover:text-primary hover:bg-surface-subtle transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
};
