import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

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

async function comboScraper(ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> {
  let progress = 0;
  const interval = setInterval(() => {
    progress += 1;
    ctx.progress(progress);
  }, 100);

  try {
    let url = `${baseUrl}/api/video/${ctx.media.imdbId}`;
    if (ctx.media.type === 'show') {
      url += `?s=${ctx.media.season.number}&e=${ctx.media.episode.number}`;
    }

    const response = await ctx.fetcher(url, {
      headers,
    });

    if (response.statusCode === 404) {
      throw new NotFoundError('Media Not Found');
    }

    if (!response.ok) {
      throw new Error('Failed to fetch media data');
    }

    const streamData = response as {
      url: string;
      subtitles?: Array<{
        lang: string;
        url: string;
      }>;
    };

    if (!streamData.url) {
      throw new NotFoundError('No stream URL found');
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

    clearInterval(interval);
    ctx.progress(100);

    return {
      stream: [stream],
      embeds: [],
    };
  } catch (error) {
    clearInterval(interval);
    throw error;
  }
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
