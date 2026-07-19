'use client';

import { useState } from 'react';

type PropertyPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentPropertyId: string | null;
  currentPropertyName: string | null;
  onPropertyChange: (id: string | null, name: string | null) => void;
};

const properties = [
  { id: 'email', name: 'Email' },
  { id: 'phone', name: 'Phone Number' },
  { id: 'name', name: 'Full Name' },
  { id: 'address', name: 'Address' },
  { id: 'company', name: 'Company' },
  { id: 'job_title', name: 'Job Title' },
  { id: 'website', name: 'Website' },
  { id: 'twitter', name: 'Twitter' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'linkedin', name: 'LinkedIn' },
];

export default function PropertyPickerModal({
  isOpen,
  onClose,
  currentPropertyId,
  currentPropertyName,
  onPropertyChange,
}: PropertyPickerModalProps) {
  const [search, setSearch] = useState('');

  const filteredProperties = properties.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white rounded-lg w-96 max-w-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Property Picker</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search properties..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>

          {/* Properties list */}
          <div className="max-h-96 overflow-y-auto">
            {filteredProperties.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No properties found</p>
            ) : (
              <ul className="space-y-1">
                {filteredProperties.map((prop) => (
                  <li
                    key={prop.id}
                    onClick={() => {
                      onPropertyChange(prop.id, prop.name);
                      onClose();
                    }}
                    className={`cursor-pointer px-3 py-2 rounded-lg ${
                      currentPropertyId === prop.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {prop.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t">
          <button
            onClick={onClose}
            className="mr-2 text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}