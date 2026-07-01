import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  accent?: boolean;
}

export function Card({ title, accent = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`glass rounded-2xl p-5 transition-all duration-200 ${accent ? 'gradient-border' : ''} ${className}`}
      {...props}
    >
      {title && (
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-400 uppercase">{title}</h3>
      )}
      {children}
    </div>
  );
}
