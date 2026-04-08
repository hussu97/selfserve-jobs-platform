import { Select } from '@/components/ui/Select';
import { COUNTRIES } from '@/lib/constants';
import type { SelectHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface CountrySelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'options'> {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
}

export const CountrySelect = forwardRef<HTMLSelectElement, CountrySelectProps>(
  ({ label = 'Country', placeholder = 'Select a country', ...props }, ref) => {
    return (
      <Select
        ref={ref}
        label={label}
        placeholder={placeholder}
        options={COUNTRIES}
        {...props}
      />
    );
  }
);

CountrySelect.displayName = 'CountrySelect';
