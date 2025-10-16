import React, { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  description?: string;
  children: ReactNode;
  required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  description,
  children,
  required
}) => {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-slate-600"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
      {children}
    </div>
  );
};

export default FormField;
