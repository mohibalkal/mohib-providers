import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer } from '@/providers/base';
import { scrapeMovie } from '@/providers/sources/vidsrc/scrape-movie';
import { scrapeShow } from '@/providers/sources/vidsrc/scrape-show';

export const vidsrcScraper = makeSourcerer({
  id: 'vidsrc',
  name: 'VidSrc',
  rank: 90,
  disabled: false,
  flags: [flags.CORS_ALLOWED, flags.CF_BLOCKED],
  scrapeMovie,
  scrapeShow,
});
