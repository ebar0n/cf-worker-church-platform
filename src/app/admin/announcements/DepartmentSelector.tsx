import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
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
        className="focus-visible:border-denim focus-visible:outline-denim/25 flex h-12 w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <div className="flex items-center gap-3">
          {selectedDept ? (
            <>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: selectedDept.color }}
              />
              <span className="text-ink text-base">{selectedDept.name}</span>
            </>
          ) : (
            <span className="text-base text-gray-500">Seleccionar departamento</span>
          )}
        </div>
        <ChevronDown
          className={`text-ink-soft h-5 w-5 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          strokeWidth={1.5}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="border-line absolute z-10 mt-1 w-full rounded-xl border bg-white shadow-[0_8px_24px_rgb(28_27_25/0.12)]">
          <div className="max-h-60 overflow-y-auto p-2">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.code}
                type="button"
                onClick={() => {
                  onSelectDepartment(dept.code);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-100 ${
                  selectedDepartment === dept.code ? 'bg-warm-soft' : ''
                }`}
              >
                <span
                  className="h-1.5 w-1.5 flex-none rounded-full"
                  style={{ backgroundColor: dept.color }}
                />
                <span className="text-ink text-sm font-medium">{dept.name}</span>
                {selectedDepartment === dept.code && (
                  <Check className="text-ink ml-auto h-4 w-4" strokeWidth={1.5} />
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
