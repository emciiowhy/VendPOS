import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const base = 'bg-white rounded-lg border border-gray-200 p-6 transition-shadow';
  const hoverStyle = hover ? 'hover:shadow-sm hover:border-gray-300' : '';
  const clickable = onClick ? 'cursor-pointer hover:shadow-sm' : '';

  const props: React.HTMLAttributes<HTMLDivElement> = {
    className: `${base} ${hoverStyle} ${clickable} ${className}`.trim(),
    onClick,
    tabIndex: onClick ? 0 : undefined,
  };

  if (onClick) {
    (props as any).role = 'button';
    props.onKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') onClick();
    };
  }

  return <div {...props}>{children}</div>;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`mb-4 ${className}`.trim()}>{children}</div>;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-base font-semibold text-gray-900 ${className}`.trim()}>{children}</h3>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={className || ''}>{children}</div>;
}
