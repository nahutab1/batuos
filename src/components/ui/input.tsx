import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-xs font-medium tracking-wide text-gray-400 uppercase">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition-all duration-200 placeholder:text-gray-500 hover:border-white/20 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 ${
          error ? 'border-rose-500/50' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';
