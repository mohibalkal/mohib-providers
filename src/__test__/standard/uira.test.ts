import { describe, it, expect } from 'vitest';
import { uiraScraper } from '../../providers/sources/uira';
import { MovieScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { UseableFetcher } from '@/fetchers/types';
import { HlsBasedStream } from '@/providers/streams';
import { Sourcerer } from '@/providers/base';

describe('uira.live scraper', () => {
  it('should scrape a movie', async () => {
    const ctx: MovieScrapeContext = {
      media: {
        title: 'The Matrix',
        releaseYear: 1999,
        type: 'movie',
        imdbId: 'tt0133093',
        tmdbId: '603',
      },
      fetcher: (async (url: string) => ({
        ok: true,
        url: 'https://example.com/stream.m3u8',
        subtitles: [
          {
            lang: 'en',
            url: 'https://example.com/subtitles.srt',
          },
        ],
      })) as unknown as UseableFetcher,
      proxiedFetcher: (async () => ({})) as unknown as UseableFetcher,
      progress: () => {},
    };

    const result = await (uiraScraper as Sourcerer).scrapeMovie?.(ctx);
    expect(result).toBeDefined();
    expect(result?.stream).toBeDefined();
    const stream = result?.stream?.[0] as HlsBasedStream;
    expect(stream.type).toBe('hls');
    expect(stream.playlist).toBe('https://example.com/stream.m3u8');
    expect(stream.captions).toHaveLength(1);
    expect(stream.captions[0].language).toBe('en');
    expect(stream.captions[0].url).toBe('https://example.com/subtitles.srt');
  });

  it('should handle not found errors', async () => {
    const ctx: MovieScrapeContext = {
      media: {
        title: 'Non Existent Movie',
        releaseYear: 2024,
        type: 'movie',
        imdbId: 'tt0000000',
        tmdbId: '0',
      },
      fetcher: (async () => ({
        ok: false,
        statusCode: 404,
      })) as unknown as UseableFetcher,
      proxiedFetcher: (async () => ({})) as unknown as UseableFetcher,
      progress: () => {},
    };

    await expect((uiraScraper as Sourcerer).scrapeMovie?.(ctx)).rejects.toThrow(NotFoundError);
  });

  it('should handle no stream URL', async () => {
    const ctx: MovieScrapeContext = {
      media: {
        title: 'Invalid Movie',
        releaseYear: 2024,
        type: 'movie',
        imdbId: 'tt0000001',
        tmdbId: '1',
      },
      fetcher: (async () => ({
        ok: true,
        url: '',
      })) as unknown as UseableFetcher,
      proxiedFetcher: (async () => ({})) as unknown as UseableFetcher,
      progress: () => {},
    };

    await expect((uiraScraper as Sourcerer).scrapeMovie?.(ctx)).rejects.toThrow(NotFoundError);
  });
}); 