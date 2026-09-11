'use client';


import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import CitationResult from '@/components/CitationResult';


interface Citation {
  id: string;
  citation: string;
}


interface SourceError {
  url: string;
  message: string;
}


export default function Home() {
  const [input, setInput] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [errors, setErrors] = useState<SourceError[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [notice, setNotice] = useState('');


  const running = useRef(false);


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();


    if (running.current) return;


    const urls = input
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);


    if (urls.length === 0) {
      setNotice('добавь хотя бы одну ссылку');
      return;
    }


    running.current = true;
    setLoading(true);
    setErrors([]);
    setNotice('');
    setProgress({ done: 0, total: urls.length });


    try {
      for (const [index, url] of urls.entries()) {
        const controller = new AbortController();
        const timeout = window.setTimeout(
          () => controller.abort(),
          20_000
        );


        try {
          let parsedUrl: URL;


          try {
            parsedUrl = new URL(url);
          } catch {
            throw new Error('проверь адрес: нужна полная ссылка');
          }


          if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
            throw new Error('ссылка должна начинаться с https:// или http://');
          }


          const response = await fetch('/api/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: parsedUrl.href }),
            signal: controller.signal,
          });


          if (!response.ok) {
            throw new Error(
              'не удалось обработать источник — попробуй другую ссылку'
            );
          }


          const data: unknown = await response.json();


          if (
            typeof data !== 'object' ||
            data === null ||
            !('citation' in data) ||
            typeof data.citation !== 'string' ||
            !data.citation.trim()
          ) {
            throw new Error('сервер не вернул готовую ссылку');
          }


          const result: Citation = {
            id: crypto.randomUUID(),
            citation: data.citation.trim(),
          };


          setCitations((previous) => [...previous, result]);
        } catch (error: unknown) {
          const message = controller.signal.aborted
            ? 'источник отвечает слишком долго — попробуй позже'
            : error instanceof Error
              ? error.message
              : 'не удалось обработать источник';


          setErrors((previous) => [...previous, { url, message }]);
        } finally {
          window.clearTimeout(timeout);
          setProgress({ done: index + 1, total: urls.length });
        }
      }
    } finally {
      running.current = false;
      setLoading(false);
    }
  };


  const copyAll = async () => {
    const text = citations
      .map((item, index) => `${index + 1}. ${item.citation}`)
      .join('\n\n');


    try {
      await navigator.clipboard.writeText(text);
      setNotice('весь список скопирован');
    } catch {
      setNotice(
        'браузер не разрешил копирование — выдели и скопируй текст вручную'
      );
    }
  };


  const clearResults = () => {
    setCitations([]);
    setErrors([]);
    setProgress({ done: 0, total: 0 });
    setNotice('');
  };


  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <header className="mb-8 text-center">
          <h1 className="mb-3 text-5xl font-bold tracking-tight">
            RefGen
          </h1>


          <p className="text-lg leading-relaxed text-gray-700">
            генератор ссылок для библиографии
            <br />
            для студентов СПбГЭУ
          </p>


          <span className="mt-5 inline-flex rounded-full bg-[#B8FF00] px-4 py-2 text-sm font-medium text-gray-900">
            бесплатно · без лимита генераций
          </span>
        </header>


        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border-2 border-[#26B38C] bg-white p-5 shadow-sm sm:p-8"
        >
          <label
            htmlFor="sources"
            className="mb-3 block text-sm font-medium text-gray-800"
          >
            здесь надо закинуть ссылку на источник
          </label>


          <textarea
            id="sources"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              'https://example.com/article\nhttps://example.com/book'
            }
            rows={6}
            required
            disabled={loading}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            aria-describedby="sources-hint"
            className="w-full resize-y rounded-xl border border-gray-400 bg-white px-4 py-3 text-base text-gray-900 outline-none placeholder:text-gray-600 focus:border-[#26B38C] focus:ring-2 focus:ring-[#26B38C] disabled:bg-gray-100"
          />


          <p
            id="sources-hint"
            className="mt-2 text-sm leading-relaxed text-gray-600"
          >
            можно сразу несколько — каждая ссылка с новой строки.
            обрабатываем по очереди, результаты появляются ниже
          </p>


          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="mt-5 w-full rounded-xl bg-[#26B38C] px-5 py-3 font-semibold text-gray-950 transition-colors hover:bg-[#229e7c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5C21C7] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-600"
          >
            {loading
              ? `делаем: ${progress.done} из ${progress.total}`
              : 'давай уже быстрее'}
          </button>


          <p
            role="status"
            aria-live="polite"
            className="mt-3 text-sm text-gray-600"
          >
            {loading
              ? 'не закрывай страницу, пока ссылки обрабатываются'
              : progress.total > 0
                ? `обработка завершена: ${progress.done} из ${progress.total}`
                : ''}
          </p>
        </form>


        {notice && (
          <p role="status" className="mt-4 text-sm text-gray-700">
            {notice}
          </p>
        )}


        {errors.length > 0 && (
          <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-900">
              эти источники не получилось обработать
            </h2>


            <ul className="mt-3 space-y-3">
              {errors.map((item, index) => (
                <li
                  key={`${index}-${item.url}`}
                  className="break-words text-sm text-red-900"
                >
                  <p className="font-medium">{item.url}</p>
                  <p>{item.message}</p>
                </li>
              ))}
            </ul>


            <p className="mt-4 text-sm text-red-900">
              остальные результаты сохранены ниже. неудачные ссылки
              можно отправить ещё раз отдельно
            </p>
          </section>
        )}


        {citations.length > 0 && (
          <section className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">
                твой список · {citations.length}
              </h2>


              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={copyAll}
                  disabled={loading}
                  className="rounded-lg bg-[#5C21C7] px-4 py-2 text-sm font-medium text-white hover:bg-[#491a9f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  скопировать весь список
                </button>


                <button
                  type="button"
                  onClick={clearResults}
                  disabled={loading}
                  className="rounded-lg border border-gray-400 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  очистить результаты
                </button>
              </div>
            </div>


            <p className="mt-3 text-sm text-gray-600">
              порядок — как при добавлении. результаты хранятся только
              до обновления или закрытия страницы
            </p>


            {citations.map((item) => (
              <CitationResult
                key={item.id}
                citation={item.citation}
              />
            ))}
          </section>
        )}


        <footer className="mt-12 flex items-center justify-center gap-2 text-sm text-gray-600">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
          <a 
            href="https://t.me/iknowhellsip" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-[#26B38C] transition-colors"
          >
            dev tg: iknowhellsip
          </a>
        </footer>
      </div>
    </main>
  );
}