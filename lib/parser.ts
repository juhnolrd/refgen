import axios from 'axios';
import * as cheerio from 'cheerio';


export interface SourceMetadata {
  type: 'article' | 'book' | 'law' | 'website' | 'unknown';
  title: string;
  authors: string[];
  year?: string;
  url: string;
  publisher?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  accessDate: string;
  publishDate?: string;
  doi?: string;
}


export async function parseURL(url: string): Promise<SourceMetadata> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });


    const $ = cheerio.load(response.data);
    
    const metadata: SourceMetadata = {
      type: 'website',
      title: '',
      authors: [],
      url: url,
      accessDate: new Date().toLocaleDateString('ru-RU')
    };


    // Парсим meta теги
    metadata.title = 
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="citation_title"]').attr('content') ||
      $('title').text() ||
      'Без названия';


    // Авторы
    const authorMeta = $('meta[name="citation_author"]');
    if (authorMeta.length > 0) {
      authorMeta.each((_, el) => {
        const author = $(el).attr('content');
        if (author) metadata.authors.push(author);
      });
    } else {
      const author = $('meta[name="author"]').attr('content');
      if (author) metadata.authors.push(author);
    }


    // Год публикации
    metadata.publishDate = 
      $('meta[property="article:published_time"]').attr('content') ||
      $('meta[name="citation_publication_date"]').attr('content') ||
      $('meta[name="date"]').attr('content');
    
    if (metadata.publishDate) {
      metadata.year = new Date(metadata.publishDate).getFullYear().toString();
    }


    // Журнал
    metadata.journal = 
      $('meta[name="citation_journal_title"]').attr('content');


    // DOI
    metadata.doi = 
      $('meta[name="citation_doi"]').attr('content');


    // Определяем тип
    if (metadata.journal || metadata.doi || $('meta[name="citation_pdf_url"]').length > 0) {
      metadata.type = 'article';
    } else if ($('meta[property="og:type"]').attr('content') === 'book') {
      metadata.type = 'book';
    } else if (url.includes('consultant.ru') || url.includes('pravo.gov.ru')) {
      metadata.type = 'law';
    }


    return metadata;


  } catch (error) {
    throw new Error('Не удалось загрузить страницу. Проверьте URL.');
  }
}