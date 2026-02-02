import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export function Card({ children, className, padding = 'medium' }: CardProps) {
  const paddingClasses = {
    none: 'p-0',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };

  return (
    <div className={clsx(
      'bg-white rounded-ios shadow-ios-card border border-ios-gray-5',
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}
