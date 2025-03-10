import { makeSimpleProxyFetcher } from '../../../lib';

export function makeExtensionFetcher() {
  return makeSimpleProxyFetcher('https://proxy.nsbx.ru', fetch);
}

export function makeLoadBalancedSimpleProxyFetcher() {
  return makeSimpleProxyFetcher('https://proxy.nsbx.ru', fetch);
}
