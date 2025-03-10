import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { fetchWithTimeout } from '@/utils/fetch';

export const baseUrl = 'https://autoembed.cc';

export const headers = {
  Referer: 'https://autoembed.cc/',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};

interface SearchResult {
  id: string;
  title: string;
}

interface SearchResponse {
  results: SearchResult[];
}

interface StreamSource {
  file: string;
  label?: string;
}

interface StreamTrack {
  file: string;
  label: string;
}

interface StreamResponse {
  sources: StreamSource[];
  tracks?: StreamTrack[];
}

async function comboScraper(ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> {
  const title = ctx.media.title;
  const year = 'year' in ctx.media ? ctx.media.year : undefined;

  const searchUrl = `${baseUrl}/api/search?query=${encodeURIComponent(title)}${year ? `&year=${year}` : ''}`;
  const searchResponse = await fetchWithTimeout(searchUrl, { headers });

  if (!searchResponse.ok) {
    throw new Error('Failed to search for media');
  }

  const searchData = (await searchResponse.json()) as SearchResponse;
  if (!searchData.results || searchData.results.length === 0) {
    return { embeds: [] };
  }

  const mediaId = searchData.results[0].id;
  const streamUrl = `${baseUrl}/api/video/${mediaId}`;
  const streamResponse = await fetchWithTimeout(streamUrl, { headers });

  if (!streamResponse.ok) {
    throw new Error('Failed to fetch stream data');
  }

  const streamData = (await streamResponse.json()) as StreamResponse;
  if (!streamData.sources || streamData.sources.length === 0) {
    return { embeds: [] };
  }

  return {
    embeds: streamData.sources.map((source, index) => ({
      embedId: `autoembed-${index}`,
      url: source.file,
      quality: source.label || 'auto',
    })),
  };
}

export const autoembedScraper = makeSourcerer({
  id: 'autoembed',
  name: 'AutoEmbed',
  rank: 175,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
