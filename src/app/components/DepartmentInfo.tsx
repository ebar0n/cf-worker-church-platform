import React from 'react';
import { getDepartmentName, getDepartmentColor, getDepartmentImage } from '@/lib/constants';
import DepartmentBadge from './DepartmentBadge';

interface DepartmentInfoProps {
  departmentCode: string;
  showImage?: boolean;
  showBadge?: boolean;
  className?: string;
}

export default function DepartmentInfo({
  departmentCode,
  showImage = true,
  showBadge = true,
  className = '',
}: DepartmentInfoProps) {
  const departmentName = getDepartmentName(departmentCode);
  const departmentColor = getDepartmentColor(departmentCode);
  const departmentImage = getDepartmentImage(departmentCode);

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {/* Background image with overlay */}
      {showImage && departmentImage && (
        <div className="absolute inset-0">
          <img src={departmentImage} alt={departmentName} className="h-full w-full object-cover" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(135deg, ${departmentColor}40, ${departmentColor}20)`,
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative p-4">
        {showBadge && (
          <div className="mb-3">
            <DepartmentBadge
              departmentCode={departmentCode}
              size="sm"
              variant="gradient"
              className="backdrop-blur-sm"
            />
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gray-800">{departmentName}</h3>

          {/* Color accent line */}
          <div className="h-1 rounded-full" style={{ backgroundColor: departmentColor }} />

          {/* Department description placeholder */}
          <p className="text-sm text-gray-600">Departamento activo de la iglesia</p>
        </div>
      </div>
    </div>
  );
}
