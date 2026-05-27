import React, { ReactNode } from 'react';
import { PackageX } from 'lucide-react';
import Button from './Button';

interface EmptyProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function Empty({ icon, title, description, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <div className="text-gray-400">
          {icon || <PackageX className="w-8 h-8" />}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-base text-gray-500 text-center max-w-sm mb-8">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} size="md">{action.label}</Button>
      )}
    </div>
  );
}