import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const baseClasses = 'bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200';
  const hoverClasses = hover ? 'hover:shadow-md hover:border-gray-300' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  const divProps: React.HTMLAttributes<HTMLDivElement> = {
    className: `${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`.trim(),
    onClick,
    tabIndex: onClick ? 0 : undefined,
  };

  if (onClick) {
    (divProps as any).role = 'button';
    divProps.onKeyDown = (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && onClick) {
        onClick();
      }
    };
  }

  return <div {...divProps}>{children}</div>;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`.trim()}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`.trim()}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={className || ''}>
      {children}
    </div>
  );
}