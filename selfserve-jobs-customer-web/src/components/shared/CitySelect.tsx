'use client';

import { useState, useEffect } from 'react';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { COUNTRY_CITIES } from '@/lib/city-data';

const OTHER_VALUE = '__other__';

interface CitySelectProps {
  country: string;
  value: string;
  onChange: (city: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  label?: string;
}

export function CitySelect({
  country,
  value,
  onChange,
  onBlur,
  error,
  required,
  label = 'City',
}: CitySelectProps) {
  const cities = country ? (COUNTRY_CITIES[country] ?? []) : [];
  const hasCities = cities.length > 0;

  // Track whether the user has chosen "Other" from the dropdown
  const [showOther, setShowOther] = useState(false);

  // Reset other-mode whenever country changes
  useEffect(() => {
    setShowOther(false);
  }, [country]);

  if (!country) {
    return (
      <Input
        label={label}
        placeholder="Select a country first"
        value=""
        onChange={() => {}}
        disabled
        required={required}
        error={error}
      />
    );
  }

  if (!hasCities) {
    // No city data for this country — plain text input
    return (
      <Input
        label={label}
        placeholder="Enter city"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        error={error}
        required={required}
      />
    );
  }

  const options = [
    ...cities.map((city) => ({ value: city, label: city })),
    { value: OTHER_VALUE, label: 'Other' },
  ];

  const selectValue = showOther ? OTHER_VALUE : value;

  return (
    <div className="flex flex-col gap-2">
      <Select
        label={label}
        placeholder="Select a city"
        options={options}
        value={selectValue}
        onChange={(e) => {
          if (e.target.value === OTHER_VALUE) {
            setShowOther(true);
            onChange('');
          } else {
            setShowOther(false);
            onChange(e.target.value);
          }
        }}
        error={showOther ? undefined : error}
        required={required}
      />
      {showOther && (
        <Input
          placeholder="Enter your city"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          error={error}
          required={required}
        />
      )}
    </div>
  );
}
