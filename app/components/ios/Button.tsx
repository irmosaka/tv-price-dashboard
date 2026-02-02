import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { tv, VariantProps } from 'tailwind-variants';

const button = tv({
  base: 'px-6 py-3 rounded-ios font-medium transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2',
  variants: {
    variant: {
      primary: 'bg-ios-blue text-white hover:bg-[#0066CC]',
      secondary: 'bg-ios-gray-6 text-ios-gray-1 hover:bg-ios-gray-5',
      destructive: 'bg-ios-red text-white hover:bg-[#E53935]',
      outline: 'bg-transparent border border-ios-gray-4 text-ios-gray-1 hover:bg-ios-gray-6',
    },
    size: {
      small: 'px-4 py-2 text-sm',
      medium: 'px-6 py-3 text-base',
      large: 'px-8 py-4 text-lg',
    },
    fullWidth: {
      true: 'w-full',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'medium',
  },
});

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {
  children: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
}

export function Button({ 
  children, 
  icon, 
  loading, 
  variant, 
  size, 
  fullWidth, 
  className, 
  disabled, 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={button({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="animate-spin">⟳</span>
      ) : icon ? (
        <span className="text-lg">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
