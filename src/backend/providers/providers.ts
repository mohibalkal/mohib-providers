import { makeProviders, makeStandardFetcher, targets } from '@movie-web/providers';

import { isExtensionActiveCached } from '@/backend/extension/messaging';
import { makeExtensionFetcher, makeLoadBalancedSimpleProxyFetcher } from '@/backend/providers/fetchers';

export function getProviders() {
  if (isExtensionActiveCached()) {
    return makeProviders({
      fetcher: makeStandardFetcher(fetch),
      proxiedFetcher: makeExtensionFetcher(),
      target: targets.BROWSER,
      consistentIpForRequests: true,
    });
  }

  return makeProviders({
    fetcher: makeStandardFetcher(fetch),
    proxiedFetcher: makeLoadBalancedSimpleProxyFetcher(),
    target: targets.BROWSER,
    consistentIpForRequests: true,
  });
}

export function getAllProviders() {
  return makeProviders({
    fetcher: makeStandardFetcher(fetch),
    target: targets.BROWSER,
    consistentIpForRequests: true,
  });
}
