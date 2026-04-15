import React from 'react';
import { Text, type TextProps } from 'react-native';
import { cn } from '@/shared/lib/cn';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'caption' | 'label';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

interface AppTextProps extends TextProps {
  variant?: Variant;
  weight?: Weight;
  muted?: boolean;
  secondary?: boolean;
  accent?: boolean;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  display: 'text-4xl tracking-tight',
  title: 'text-3xl tracking-tight',
  heading: 'text-xl',
  body: 'text-base',
  caption: 'text-sm',
  label: 'text-xs tracking-widest uppercase',
};

const weightClasses: Record<Weight, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export function AppText({
  variant = 'body',
  weight = 'regular',
  muted = false,
  secondary = false,
  accent = false,
  className,
  children,
  ...props
}: AppTextProps) {
  const colorClass = accent
    ? 'text-brand-accent'
    : muted
      ? 'text-ink-muted'
      : secondary
        ? 'text-ink-secondary'
        : 'text-ink';

  return (
    <Text
      className={cn(
        variantClasses[variant],
        weightClasses[weight],
        colorClass,
        className,
      )}
      {...props}
    >
      {children}
    </Text>
  );
}
