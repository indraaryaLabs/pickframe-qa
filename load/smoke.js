// Light, read-only load check against the public surface of PickFrame.
//
// This is a smoke test for latency and error rate under a handful of concurrent visitors.
// It is deliberately gentle: the target runs on free-tier infrastructure that is shared with
// real users, so this script must never be pointed at it with a high VU count.
//
//   k6 run load/smoke.js
//   k6 run -e API_URL=http://localhost:8080 -e WEB_URL=http://localhost:5173 load/smoke.js

import http from 'k6/http';
import { check, group, sleep } from 'k6';

const API_URL = (__ENV.API_URL || 'https://api-pickframe.satuarah.click').replace(/\/+$/, '');
const WEB_URL = (__ENV.WEB_URL || 'https://pickframe.satuarah.click').replace(/\/+$/, '');

export const options = {
  scenarios: {
    visitors: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 5 },
        { duration: '40s', target: 5 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{endpoint:health}': ['p(95)<1500'],
    'http_req_duration{endpoint:landing}': ['p(95)<2500'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  group('API', () => {
    const res = http.get(`${API_URL}/`, { tags: { endpoint: 'health' } });
    check(res, {
      'health is 200': (r) => r.status === 200,
      'health reports ok': (r) => r.json('status') === 'ok',
    });
  });

  group('Web', () => {
    for (const path of ['/', '/pricing']) {
      const res = http.get(`${WEB_URL}${path}`, { tags: { endpoint: 'landing' } });
      check(res, {
        [`${path} is 200`]: (r) => r.status === 200,
        [`${path} serves HTML`]: (r) => String(r.headers['Content-Type']).includes('text/html'),
      });
    }
  });

  sleep(1 + Math.random());
}
