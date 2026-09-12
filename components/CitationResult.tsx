'use client';


import { useState } from 'react';


interface Props {
  index: number;
  citation: string;
}


export default function CitationResult({ index, citation }: Props) {
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
        <span className="text-sm font-semibold text-[#26B38C] tabular-nums shrink-0">
          {index}.
        </span>
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