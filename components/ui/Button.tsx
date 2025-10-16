import React, { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-teal-500 text-white hover:bg-teal-600 focus-visible:ring-teal-500',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-400',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-300'
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 py-2',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-5 py-3'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const widthClass = fullWidth ? 'w-full' : '';
  const composedClassName = [
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    widthClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button ref={ref} type={type} className={composedClassName} {...props} />
  );
});

export default Button;
