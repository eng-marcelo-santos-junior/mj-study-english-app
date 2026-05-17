import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        <textarea
          ref={ref}
          rows={3}
          className={`w-full resize-none rounded-lg border px-3 py-2 text-sm transition-colors outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 dark:placeholder:text-gray-600 dark:focus:ring-offset-gray-900 ${
            error
              ? 'border-red-400 bg-red-50 focus:ring-red-400 dark:border-red-700 dark:bg-red-950/30'
              : 'border-gray-300 bg-white focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:border-indigo-500'
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
