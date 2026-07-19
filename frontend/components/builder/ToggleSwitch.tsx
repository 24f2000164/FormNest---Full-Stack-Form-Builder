'use client';

import { useState } from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled = false,
  className = ''
}: ToggleSwitchProps) {
  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <label
      className={`${label ? 'flex items-center space-x-3' : 'inline-flex items-center'} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      {label && <span className="text-sm font-medium">{label}</span>}
      <div className="relative inline-block w-11 h-6 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={`w-11 h-6 rounded-full ${checked ? 'bg-gray-900' : 'bg-gray-200'}
                     peer transition-colors duration-200`}
        >
          <div
            className={`pointer-events-none absolute top-0.5 left-0.5 h-5 w-5
                       ${checked ? 'translate-x-5' : 'translate-x-0'}
                       bg-white rounded-full shadow ring-0
                       transition-transform duration-200`}
          ></div>
        </div>
      </div>
    </label>
  );
}