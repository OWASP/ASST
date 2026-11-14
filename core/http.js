'use strict';
/*
 * Minimal HTTP(S) client on Node's built-in modules (no global fetch, which prints an
 * experimental warning on Node 18). Timeouts, a response size cap and JSON helpers.
 */
const http = require('http');
const https = require('https');
const { URL } = require('url');

const USER_AGENT = 'OWASP-ASST (+https://github.com/OWASP/ASST)';

/**
 * @param {string} url
 * @param {{method?:string, headers?:object, body?:string|Buffer, timeoutMs?:number, maxBytes?:number, rejectUnauthorized?:boolean}} opts
 * @returns {Promise<{status:number, headers:object, body:Buffer, url:string}>}
 */
function request(url, opts = {}) {
  const u = new URL(url);
  const mod = u.protocol === 'https:' ? https : u.protocol === 'http:' ? http : null;
  if (!mod) return Promise.reject(new Error(`unsupported protocol ${u.protocol}`));
  const method = (opts.method || 'GET').toUpperCase();
  const timeoutMs = opts.timeoutMs || 15000;
  const maxBytes = opts.maxBytes || 8 * 1024 * 1024;
  const headers = { 'user-agent': USER_AGENT, accept: '*/*', ...(opts.headers || {}) };
  if (opts.body !== undefined) headers['content-length'] = Buffer.byteLength(opts.body);
  return new Promise((resolve, reject) => {
    const req = mod.request(u, { method, headers, rejectUnauthorized: opts.rejectUnauthorized !== false }, (res) => {
      const chunks = [];
      let size = 0;
      res.on('data', (c) => {
        size += c.length;
        if (size > maxBytes) {
          req.destroy(new Error(`response from ${u.host} is larger than ${maxBytes} bytes`));
          return;
        }
        chunks.push(c);
      });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks), url: u.href }));
      res.on('error', reject);
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`request to ${u.host} timed out after ${timeoutMs} ms`)));
    req.on('error', reject);
    if (opts.body !== undefined) req.write(opts.body);
    req.end();
  });
}

async function getJson(url, opts = {}) {
  const res = await request(url, { ...opts, headers: { accept: 'application/json', ...(opts.headers || {}) } });
  if (res.status < 200 || res.status >= 300) throw new Error(`${new URL(url).host} answered HTTP ${res.status}`);
  return JSON.parse(res.body.toString('utf8'));
}

async function postJson(url, data, opts = {}) {
  const res = await request(url, {
    ...opts,
    method: 'POST',
    body: JSON.stringify(data),
    headers: { accept: 'application/json', 'content-type': 'application/json', ...(opts.headers || {}) },
  });
  if (res.status < 200 || res.status >= 300) throw new Error(`${new URL(url).host} answered HTTP ${res.status}`);
  return JSON.parse(res.body.toString('utf8'));
}

/** Runs async tasks with a concurrency limit, keeping result order. */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

module.exports = { request, getJson, postJson, mapLimit, USER_AGENT };
