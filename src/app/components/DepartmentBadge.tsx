import React from 'react';
import { getDepartmentName } from '@/lib/constants';

interface DepartmentBadgeProps {
  departmentCode: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  variant?: 'solid' | 'gradient' | 'outline';
}

const sizeClasses = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1.5 text-[13px]',
  lg: 'px-3.5 py-2 text-sm',
};

// Kit department tag. Every variant renders the same neutral tag: department
// colors are content, never UI chrome.
export default function DepartmentBadge({
  departmentCode,
  size = 'md',
  showIcon = true,
  className = '',
}: DepartmentBadgeProps) {
  const departmentName = getDepartmentName(departmentCode);

  return (
    <span
      className={`border-line text-ink inline-flex items-center gap-2 rounded-full border bg-white font-medium leading-tight ${sizeClasses[size]} ${className}`}
      title={departmentName}
    >
      {showIcon && <span className="bg-warm h-1.5 w-1.5 flex-none rounded-full" />}
      {departmentName}
    </span>
  );
}
