import React from 'react';
import { getDepartmentName, getDepartmentColor, getDepartmentImage } from '@/lib/constants';

interface DepartmentBadgeProps {
  departmentCode: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  variant?: 'solid' | 'gradient' | 'outline';
}

export default function DepartmentBadge({
  departmentCode,
  size = 'md',
  showIcon = true,
  className = '',
  variant = 'gradient',
}: DepartmentBadgeProps) {
  const departmentName = getDepartmentName(departmentCode);
  const departmentColor = getDepartmentColor(departmentCode);
  const departmentImage = getDepartmentImage(departmentCode);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  // Generate gradient colors based on the base color
  const generateGradient = (baseColor: string) => {
    // For white color, use a subtle gradient
    if (baseColor === '#FFFFFF') {
      return 'from-gray-100 to-gray-200 text-gray-800';
    }

    // For other colors, create a gradient with the base color
    return `from-[${baseColor}] to-[${baseColor}]/80`;
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'solid':
        return `bg-[${departmentColor}] text-white shadow-lg`;
      case 'gradient':
        return `bg-gradient-to-r ${generateGradient(departmentColor)} text-white shadow-lg`;
      case 'outline':
        return `border-2 border-[${departmentColor}] text-[${departmentColor}] bg-white/90 backdrop-blur-sm`;
      default:
        return `bg-gradient-to-r ${generateGradient(departmentColor)} text-white shadow-lg`;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl ${sizeClasses[size]} ${getVariantClasses()} ${className}`}
      title={departmentName}
      style={{
        // Fallback for gradient colors that might not work with Tailwind
        background:
          variant === 'gradient' && departmentColor !== '#FFFFFF'
            ? `linear-gradient(135deg, ${departmentColor}, ${departmentColor}dd)`
            : undefined,
      }}
    >
      {showIcon && (
        <div className={`${iconSizes[size]} flex items-center justify-center`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={variant === 'outline' ? 2 : 1.5}
            stroke="currentColor"
            className="h-full w-full"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
            />
          </svg>
        </div>
      )}
      <span className="font-medium">{departmentName}</span>
    </span>
  );
}
