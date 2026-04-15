import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  type TouchableOpacityProps,
} from 'react-native';
import { cn } from '@/shared/lib/cn';
import { AppText } from './AppText';
import { colors } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface AppButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-primary active:bg-brand-primary-dim',
  secondary: 'bg-brand-surface border border-brand-border',
  ghost: 'bg-transparent',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-10 px-4 rounded-brand-md',
  md: 'h-12 px-6 rounded-brand-lg',
  lg: 'h-14 px-8 rounded-brand-xl',
};

const labelVariant: Record<Variant, 'regular' | 'medium' | 'semibold' | 'bold'> = {
  primary: 'semibold',
  secondary: 'medium',
  ghost: 'medium',
};

export function AppButton({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  ...props
}: AppButtonProps) {
  return (
    <TouchableOpacity
      className={cn(
        'flex-row items-center justify-center',
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && 'opacity-50',
        className,
      )}
      disabled={disabled || loading}
      activeOpacity={0.75}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.ink : colors.accent}
        />
      ) : (
        <AppText
          variant="body"
          weight={labelVariant[variant]}
          accent={variant === 'ghost'}
        >
          {label}
        </AppText>
      )}
    </TouchableOpacity>
  );
}
