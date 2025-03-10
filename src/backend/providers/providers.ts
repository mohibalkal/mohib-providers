import { makeExtensionFetcher, makeLoadBalancedSimpleProxyFetcher } from './fetchers';
import { makeProviders, makeStandardFetcher, targets } from '../../../lib';
import { isExtensionActiveCached } from '../extension/messaging';

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
