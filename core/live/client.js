'use strict';
/*
 * HTTP client for the live checks. It can only send GET and HEAD requests, only to the
 * host that passed target validation (connections are pinned to the vetted address),
 * at most `maxRequests` requests at no more than five per second. Redirects are never
 * followed automatically, response bodies are capped, and no cookies are sent.
 */
const http = require('http');
const https = require('https');

const ALLOWED_METHODS = new Set(['GET', 'HEAD']);
const USER_AGENT = 'OWASP-ASST live check (+https://github.com/OWASP/ASST)';

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

class LiveClient {
  /**
   * @param {{target:{url:URL, address:string, family:number}, maxRequests?:number, minIntervalMs?:number, timeoutMs?:number, maxBytes?:number}} opts
   */
  constructor({ target, maxRequests = 60, minIntervalMs = 200, timeoutMs = 8000, maxBytes = 256 * 1024 }) {
    this.hostname = target.url.hostname;
    this.address = target.address;
    this.family = target.family;
    this.maxRequests = maxRequests;
    this.minIntervalMs = minIntervalMs;
    this.timeoutMs = timeoutMs;
    this.maxBytes = maxBytes;
    this.log = [];
    this.last = 0;
  }

  get remaining() {
    return this.maxRequests - this.log.length;
  }

  /**
   * @returns {Promise<{status:number, headers:object, body:string, truncated:boolean, url:string, error?:string}|null>}
   *   null when the request budget is used up
   */
  async fetch(rawUrl, { method = 'GET', headers = {}, maxBytes, timeoutMs } = {}) {
    const m = String(method).toUpperCase();
    if (!ALLOWED_METHODS.has(m)) throw new Error(`live checks only send GET and HEAD requests (refused ${m})`);
    const u = new URL(rawUrl);
    if (u.hostname !== this.hostname) throw new Error(`live checks stay on ${this.hostname} (refused ${u.hostname})`);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error(`unsupported protocol ${u.protocol}`);
    if (this.log.length >= this.maxRequests) return null;
    const wait = this.last + this.minIntervalMs - Date.now();
    if (wait > 0) await sleep(wait);
    this.last = Date.now();
    const entry = { method: m, url: u.href, status: null };
    this.log.push(entry);
    try {
      const res = await this.send(u, m, headers, maxBytes || this.maxBytes, timeoutMs || this.timeoutMs);
      entry.status = res.status;
      return res;
    } catch (err) {
      entry.error = err.message;
      return { status: 0, headers: {}, body: '', truncated: false, url: u.href, error: err.message };
    }
  }

  send(u, method, headers, maxBytes, timeoutMs) {
    const mod = u.protocol === 'https:' ? https : http;
    const { address, family } = this;
    const lookup = (hostname, options, cb) => {
      if (typeof options === 'function') return options(null, address, family);
      if (options && options.all) return cb(null, [{ address, family }]);
      return cb(null, address, family);
    };
    return new Promise((resolve, reject) => {
      const req = mod.request(u, {
        method,
        lookup,
        agent: false,
        // asst-ignore[NODE-TLS-001] local development servers often use self-signed certificates; only status codes and headers are read
        rejectUnauthorized: false,
        headers: { 'user-agent': USER_AGENT, accept: '*/*', ...headers },
      }, (res) => {
        const chunks = [];
        let size = 0;
        let truncated = false;
        const done = () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8'), truncated, url: u.href });
        res.on('data', (c) => {
          if (truncated) return;
          const room = maxBytes - size;
          if (c.length > room) {
            chunks.push(c.subarray(0, Math.max(0, room)));
            size = maxBytes;
            truncated = true;
            done();
            res.destroy();
            return;
          }
          chunks.push(c);
          size += c.length;
        });
        res.on('end', () => {
          if (!truncated) done();
        });
        res.on('error', (err) => {
          if (!truncated) reject(err);
        });
      });
      req.setTimeout(timeoutMs, () => req.destroy(new Error(`no answer within ${timeoutMs} ms`)));
      req.on('error', reject);
      req.end();
    });
  }
}

module.exports = { LiveClient, ALLOWED_METHODS, USER_AGENT };
