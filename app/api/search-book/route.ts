import { NextRequest, NextResponse } from 'next/server';


interface BookMetadata {
  author: string;
  title: string;
  publisher?: string;
  year?: string;
  pages?: string;
}


function formatAuthorRU(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name.trim();
  const surname = parts[parts.length - 1];
  const initials = parts
    .slice(0, -1)
    .map((p) => p[0]?.toUpperCase() + '.')
    .join(' ');
  return `${surname} ${initials}`;
}


function formatBookCitation(book: BookMetadata): string {
  const author = formatAuthorRU(book.author);
  let result = `${author} ${book.title}`;


  if (book.publisher || book.year || book.pages) {
    result += ' /';
    if (book.publisher) result += ` ${book.publisher}`;
    if (book.year) result += book.publisher ? `, ${book.year}` : ` ${book.year}`;
    if (book.pages) result += `. — ${book.pages} с`;
  }


  return `${result}.`;
}


async function searchGoogleBooks(
  author: string,
  title: string,
): Promise<BookMetadata | null> {
  const query = encodeURIComponent(`${author} ${title}`);
  const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=3`;


  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);


  try {
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'RefGen/1.0' },
    });


    clearTimeout(timeout);


    if (!response.ok) return null;


    const data: unknown = await response.json();


    if (
      typeof data !== 'object' ||
      data === null ||
      !('items' in data) ||
      !Array.isArray(data.items) ||
      data.items.length === 0
    ) {
      return null;
    }


    const item = data.items[0];
    const volumeInfo =
      typeof item === 'object' && item !== null && 'volumeInfo' in item
        ? item.volumeInfo
        : null;


    if (typeof volumeInfo !== 'object' || volumeInfo === null) {
      return null;
    }


    const info = volumeInfo as Record<string, unknown>;


    const bookTitle = typeof info.title === 'string' ? info.title : title;


    const bookAuthors = Array.isArray(info.authors)
      ? info.authors.filter((a): a is string => typeof a === 'string')
      : [author];


    const bookAuthor = bookAuthors[0] || author;


    const bookPublisher =
      typeof info.publisher === 'string' ? info.publisher : undefined;


    const bookYear =
      typeof info.publishedDate === 'string'
        ? info.publishedDate.slice(0, 4)
        : undefined;


    const bookPages =
      typeof info.pageCount === 'number' ? String(info.pageCount) : undefined;


    return {
      author: bookAuthor,
      title: bookTitle,
      publisher: bookPublisher,
      year: bookYear,
      pages: bookPages,
    };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}


async function searchOpenLibrary(
  author: string,
  title: string,
): Promise<BookMetadata | null> {
  const query = encodeURIComponent(`${author} ${title}`);
  const apiUrl = `https://openlibrary.org/search.json?q=${query}&limit=1`;


  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);


  try {
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'RefGen/1.0' },
    });


    clearTimeout(timeout);


    if (!response.ok) return null;


    const data: unknown = await response.json();


    if (
      typeof data !== 'object' ||
      data === null ||
      !('docs' in data) ||
      !Array.isArray(data.docs) ||
      data.docs.length === 0
    ) {
      return null;
    }


    const doc = data.docs[0] as Record<string, unknown>;


    const bookTitle =
      typeof doc.title === 'string' ? doc.title : title;


    const bookAuthors = Array.isArray(doc.author_name)
      ? doc.author_name.filter((a): a is string => typeof a === 'string')
      : [author];


    const bookAuthor = bookAuthors[0] || author;


    const bookPublisher = Array.isArray(doc.publisher)
      ? typeof doc.publisher[0] === 'string'
        ? doc.publisher[0]
        : undefined
      : undefined;


    const bookYear =
      typeof doc.first_publish_year === 'number'
        ? String(doc.first_publish_year)
        : undefined;


    const bookPages =
      typeof doc.number_of_pages_median === 'number'
        ? String(doc.number_of_pages_median)
        : undefined;


    return {
      author: bookAuthor,
      title: bookTitle,
      publisher: bookPublisher,
      year: bookYear,
      pages: bookPages,
    };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}


export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();


    if (
      typeof body !== 'object' ||
      body === null ||
      !('author' in body) ||
      !('title' in body) ||
      typeof body.author !== 'string' ||
      typeof body.title !== 'string'
    ) {
      return NextResponse.json(
        { error: 'нужны поля author и title' },
        { status: 400 },
      );
    }


    const { author, title } = body as { author: string; title: string };


    // Пробуем Google Books
    let book = await searchGoogleBooks(author, title);


    // Если не нашли — пробуем Open Library
    if (!book) {
      book = await searchOpenLibrary(author, title);
    }


    // Если оба API не помогли — форматируем что есть
    if (!book) {
      const fallback: BookMetadata = { author, title };
      return NextResponse.json({
        citation: formatBookCitation(fallback),
        incomplete: true,
      });
    }


    const hasFullData = Boolean(book.publisher && book.year && book.pages);


    return NextResponse.json({
      citation: formatBookCitation(book),
      incomplete: !hasFullData,
    });
  } catch (error: unknown) {
    console.error('search-book error:', error);
    return NextResponse.json(
      { error: 'не удалось найти книгу' },
      { status: 500 },
    );
  }
}