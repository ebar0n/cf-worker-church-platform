import React, { useState } from 'react';
import { DEPARTMENTS } from '@/lib/constants';

interface DepartmentSelectorProps {
  selectedDepartment: string;
  onSelectDepartment: (code: string) => void;
}

export default function DepartmentSelector({
  selectedDepartment,
  onSelectDepartment,
}: DepartmentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedDept = DEPARTMENTS.find((d) => d.code === selectedDepartment);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f]/20"
      >
        <div className="flex items-center gap-3">
          {selectedDept ? (
            <>
              <div
                className="h-4 w-4 rounded-full shadow-sm"
                style={{ backgroundColor: selectedDept.color }}
              />
              <span className="text-sm font-medium text-gray-700">{selectedDept.name}</span>
            </>
          ) : (
            <span className="text-sm text-gray-500">Seleccionar departamento</span>
          )}
        </div>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="max-h-60 overflow-y-auto p-2">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.code}
                type="button"
                onClick={() => {
                  onSelectDepartment(dept.code);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-gray-50 ${
                  selectedDepartment === dept.code ? 'bg-[#4b207f]/10' : ''
                }`}
              >
                <div
                  className="h-4 w-4 rounded-full shadow-sm"
                  style={{ backgroundColor: dept.color }}
                />
                <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                {selectedDepartment === dept.code && (
                  <svg
                    className="ml-auto h-4 w-4 text-[#4b207f]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />}
    </div>
  );
}
