import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

const captionTypes = {
  srt: 'srt',
  vtt: 'vtt',
} as const;

function getCaptionTypeFromUrl(url: string): 'srt' | 'vtt' | null {
  const extensions = Object.keys(captionTypes);
  const type = extensions.find((v) => url.endsWith(`.${v}`));
  if (!type) return null;
  return type as 'srt' | 'vtt';
}

export const baseUrl = 'https://uira.live';

export const headers = {
  Referer: 'https://uira.live/',
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

interface StreamResponse {
  url: string;
  subtitles?: Array<{
    lang: string;
    url: string;
  }>;
}

async function comboScraper(ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> {
  const title = ctx.media.title;
  const year = 'year' in ctx.media ? ctx.media.year : undefined;

  const searchUrl = `/api/search?query=${encodeURIComponent(title)}${year ? `&year=${year}` : ''}`;
  const searchResponse = await ctx.proxiedFetcher(searchUrl, {
    baseUrl,
    headers,
  });

  if (!searchResponse.ok) {
    throw new Error('Failed to search for media');
  }

  const searchData = searchResponse as SearchResponse;
  if (!searchData.results || searchData.results.length === 0) {
    return { embeds: [] };
  }

  const mediaId = searchData.results[0].id;
  const streamUrl = `/api/video/${mediaId}`;
  const streamResponse = await ctx.proxiedFetcher(streamUrl, {
    baseUrl,
    headers,
  });

  if (!streamResponse.ok) {
    throw new Error('Failed to fetch stream data');
  }

  const streamData = streamResponse as StreamResponse;
  if (!streamData.url) {
    return { embeds: [] };
  }

  const stream = {
    id: 'uira-primary',
    type: 'hls' as const,
    playlist: streamData.url,
    flags: [flags.CORS_ALLOWED],
    captions:
      streamData.subtitles?.map((sub) => ({
        id: `uira-${sub.lang}`,
        url: sub.url,
        language: sub.lang,
        type: getCaptionTypeFromUrl(sub.url) ?? 'srt',
        hasCorsRestrictions: false,
      })) ?? [],
  };

  return {
    stream: [stream],
    embeds: [],
  };
}

export const uiraScraper = makeSourcerer({
  id: 'uira',
  name: 'Uira',
  rank: 180,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
