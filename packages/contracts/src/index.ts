export type MarketCode = 'US' | 'CN';

export type DependencyStatus = 'ok' | 'error';

export interface ReadinessResponse {
  status: 'ok' | 'error';
  dependencies: {
    mysql: DependencyStatus;
    redis: DependencyStatus;
    kafka: DependencyStatus;
  };
}
