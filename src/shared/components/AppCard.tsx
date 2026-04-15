import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/shared/lib/cn';

interface AppCardProps extends ViewProps {
  padded?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function AppCard({ padded = true, className, children, ...props }: AppCardProps) {
  return (
    <View
      className={cn(
        'bg-brand-card rounded-brand-lg overflow-hidden',
        padded && 'p-4',
        className,
      )}
      {...props}
    >
      {children}
    </View>
  );
}
