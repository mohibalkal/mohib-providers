import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

const baseUrl = 'https://hindiscrape.whvx.net';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext) {
  let endpoint = `/movie/${ctx.media.tmdbId}`;

  if (ctx.media.type === 'show') {
    endpoint = `/tv/${ctx.media.tmdbId}/${ctx.media.season.number.toString()}/${ctx.media.episode.number.toString()}`;
  }

  const playerPage = await ctx.proxiedFetcher(endpoint, {
    baseUrl,
  });

  const fileData: { label: string; file: string }[] = playerPage.sources;
  const embeds = [];

  for (const stream of fileData) {
    if (!stream.file) continue;
    const embedId = `hindiscrape-${stream.label.toLowerCase().trim()}`;
    embeds.push({ embedId, url: stream.file });
  }

  return { embeds };
}

export const hindiScraper = makeSourcerer({
  id: 'hindiscraper',
  name: 'Jalebi Scraper',
  rank: 10,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
}); 