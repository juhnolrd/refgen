import { SourceMetadata } from './parser';


export function formatGOST(metadata: SourceMetadata): string {
  const { type, title, authors, year, url, journal, publisher, accessDate, publishDate } = metadata;


  // Форматируем авторов
  const formattedAuthors = authors.length > 0 
    ? authors.map(formatAuthorName).join(', ')
    : '';


  switch (type) {
    case 'article':
      // Статья в журнале
      if (journal) {
        return `${formattedAuthors ? formattedAuthors + ' ' : ''}${title} / ${formattedAuthors} // ${journal}.${year ? ` – ${year}.` : ''} – URL: ${url} (дата обращения: ${accessDate}).`;
      }
      return formatWebsite(metadata);


    case 'book':
      // Книга/монография
      return `${formattedAuthors ? formattedAuthors + ' ' : ''}${title} / ${formattedAuthors}.${publisher ? ` – ${publisher},` : ''}${year ? ` ${year}.` : ''} – URL: ${url} (дата обращения: ${accessDate}).`;


    case 'law':
      // Нормативный документ
      return `${title}${year ? ` от ${year}` : ''} // Консультант Плюс: справочно-правовая система. – URL: ${url} (дата обращения: ${accessDate}).`;


    case 'website':
    default:
      return formatWebsite(metadata);
  }
}


function formatWebsite(metadata: SourceMetadata): string {
  const { title, authors, url, accessDate, publishDate } = metadata;
  
  const domain = new URL(url).hostname.replace('www.', '');
  const formattedAuthors = authors.length > 0 
    ? authors.map(formatAuthorName).join(', ') + ' '
    : '';


  let result = `${formattedAuthors}${title} // ${capitalizeFirst(domain)}: сайт. – URL: ${url}`;
  
  if (publishDate) {
    result += ` (дата публикации: ${new Date(publishDate).toLocaleDateString('ru-RU')})`;
  } else {
    result += ` (дата обращения: ${accessDate})`;
  }
  
  return result + '.';
}


function formatAuthorName(fullName: string): string {
  // Преобразует "John Doe" в "Doe J."
  const parts = fullName.trim().split(' ');
  if (parts.length >= 2) {
    const lastName = parts[parts.length - 1];
    const initials = parts.slice(0, -1).map(p => p[0] + '.').join(' ');
    return `${lastName} ${initials}`;
  }
  return fullName;
}


function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


export function formatAPA(metadata: SourceMetadata): string {
  const { title, authors, year, url, journal } = metadata;
  
  const authorsStr = authors.length > 0
    ? authors.map(formatAuthorAPA).join(', ')
    : 'Unknown Author';


  if (journal) {
    return `${authorsStr} (${year || 'n.d.'}). ${title}. ${journal}. ${url}`;
  }


  return `${authorsStr} (${year || 'n.d.'}). ${title}. Retrieved from ${url}`;
}


function formatAuthorAPA(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length >= 2) {
    const lastName = parts[parts.length - 1];
    const initials = parts.slice(0, -1).map(p => p[0] + '.').join('');
    return `${lastName}, ${initials}`;
  }
  return fullName;
}