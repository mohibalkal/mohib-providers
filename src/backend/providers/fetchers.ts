import { makeSimpleProxyFetcher } from '../../../lib';

export function makeExtensionFetcher() {
  return makeSimpleProxyFetcher('http://localhost:8080', fetch);
}

export function makeLoadBalancedSimpleProxyFetcher() {
  return makeSimpleProxyFetcher('http://localhost:8080', fetch);
}
