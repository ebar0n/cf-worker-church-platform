import React from 'react';
import { DEPARTMENTS } from '@/lib/constants';

interface DepartmentSelectorProps {
  selectedDepartment: string;
  onSelectDepartment: (code: string) => void;
}

export default function DepartmentSelector({
  selectedDepartment,
  onSelectDepartment,
}: DepartmentSelectorProps) {
  return (
    <div>
      <label className="mb-3 block text-sm font-medium text-gray-700">Departamento *</label>

      {/* Visual department grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept.code}
            type="button"
            onClick={() => onSelectDepartment(dept.code)}
            className={`group rounded-lg border-2 p-3 text-left transition-all duration-200 sm:p-4 ${
              selectedDepartment === dept.code
                ? 'border-[#4b207f] bg-[#4b207f]/5'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Department image preview */}
              {dept.image && (
                <div className="relative flex-shrink-0">
                  <img
                    src={dept.image}
                    alt={dept.name}
                    className="h-12 w-12 rounded-md object-cover opacity-60 transition-opacity group-hover:opacity-80 sm:h-14 sm:w-14"
                  />
                  <div
                    className="absolute inset-0 rounded-md opacity-20"
                    style={{ backgroundColor: dept.color }}
                  />
                </div>
              )}

              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div
                  className="h-3 w-3 flex-shrink-0 rounded-full shadow-sm"
                  style={{ backgroundColor: dept.color }}
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {dept.name}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected department info */}
      {selectedDepartment && (
        <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4">
          <div className="flex items-center gap-3">
            <div
              className="h-6 w-6 rounded-full shadow-md"
              style={{
                backgroundColor: DEPARTMENTS.find((d) => d.code === selectedDepartment)?.color,
              }}
            />
            <div>
              <h4 className="font-semibold text-gray-800">
                {DEPARTMENTS.find((d) => d.code === selectedDepartment)?.name}
              </h4>
              <p className="text-sm text-gray-600">Departamento seleccionado para este anuncio</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
