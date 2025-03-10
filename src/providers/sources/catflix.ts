import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { compareMedia } from '@/utils/compare';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://catflix.su';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const searchPage = await ctx.proxiedFetcher('/', {
    baseUrl,
    query: {
      s: ctx.media.title,
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  });

  ctx.progress(40);

  const $search = load(searchPage);
  const searchResults: { title: string; year?: number | undefined; url: string }[] = [];

  $search('li').each((_, element) => {
    const title = $search(element).find('h2').first().text().trim();
    const year = Number($search(element).find('.text-xs > span').eq(1).text().trim()) || undefined;
    const url = $search(element).find('a').attr('href');

    if (!title || !url) return;

    searchResults.push({ title, year, url });
  });

  let watchPageUrl = searchResults.find((x) => x && compareMedia(ctx.media, x.title, x.year))?.url;
  if (!watchPageUrl) throw new NotFoundError('No watchable item found');

  ctx.progress(60);

  if (ctx.media.type === 'show') {
    const match = watchPageUrl.match(/\/series\/([^/]+)\/?/);
    if (!match) throw new Error('Failed to parse watch page url');
    watchPageUrl = watchPageUrl.replace(
      `/series/${match[1]}`,
      `/episode/${match[1]}-${ctx.media.season.number}x${ctx.media.episode.number}`,
    );
  }

  const watchPage = load(await ctx.proxiedFetcher(watchPageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  }));

  ctx.progress(80);

  const url = watchPage('iframe').first().attr('src');
  if (!url) throw new Error('Failed to find embed url');

  ctx.progress(90);

  return {
    embeds: [
      {
        embedId: 'turbovid',
        url,
      },
    ],
  };
}

export const catflixScraper = makeSourcerer({
  id: 'catflix',
  name: 'Catflix',
  rank: 122,
  flags: [flags.CORS_ALLOWED],
  disabled: false,
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
