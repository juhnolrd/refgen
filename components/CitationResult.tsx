'use client';


import { useState } from 'react';


interface Props {
  index: number;
  citation: string;
  incomplete?: boolean;
}


export default function CitationResult({ index, citation, incomplete }: Props) {
  const [message, setMessage] = useState('');


  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${index}. ${citation}`);
      setMessage('скопировано');
    } catch {
      setMessage('не удалось скопировать — выдели текст вручную');
    }
  };


  return (
    <article className="rounded-xl border border-[#26B38C] bg-white p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-semibold text-[#26B38C] tabular-nums">
            {index}.
          </span>
          {incomplete && (
            <div className="group relative">
              <svg
                className="h-5 w-5 text-amber-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-label="предупреждение"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="invisible group-hover:visible absolute left-0 top-7 z-10 w-64 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
                не удалось найти полные данные о книге — проверь издательство,
                год и страницы вручную
              </span>
            </div>
          )}
        </div>


        <button
          type="button"
          onClick={copyToClipboard}
          className="rounded-lg bg-[#26B38C] px-4 py-2 text-sm font-medium text-gray-950 hover:bg-[#229e7c] shrink-0"
        >
          копировать
        </button>
      </div>


      <p className="whitespace-pre-wrap break-words leading-relaxed text-gray-900">
        {citation}
      </p>


      {message && (
        <p role="status" className="mt-3 text-sm text-gray-600">
          {message}
        </p>
      )}
    </article>
  );
}