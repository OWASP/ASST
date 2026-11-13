'use strict';
/*
 * Target validation for the opt-in live checks. By default only loopback and private
 * network addresses are allowed (127.0.0.0/8, 10/8, 172.16/12, 192.168/16, ::1, fc00::/7).
 * Link-local ranges (169.254.0.0/16, fe80::/10) are refused because cloud metadata
 * services live there. The resolved address is pinned for every request, so a DNS
 * answer cannot change between the check and the connection.
 */
const dns = require('dns');
const net = require('net');

const V4_LOCAL = [['127.0.0.0', 8], ['10.0.0.0', 8], ['172.16.0.0', 12], ['192.168.0.0', 16]];

function v4ToInt(ip) {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + Number(octet)) >>> 0, 0);
}

function inCidr(ip, base, bits) {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return ((v4ToInt(ip) & mask) >>> 0) === ((v4ToInt(base) & mask) >>> 0);
}

/** True for loopback and private-network addresses. */
function isLocalAddress(ip) {
  if (net.isIPv4(ip)) return V4_LOCAL.some(([base, bits]) => inCidr(ip, base, bits));
  if (net.isIPv6(ip)) {
    const x = ip.toLowerCase();
    if (x === '::1' || x === '0:0:0:0:0:0:0:1') return true;
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(x);
    if (mapped) return isLocalAddress(mapped[1]);
    return /^f[cd][0-9a-f]{0,2}:/.test(x); // fc00::/7 unique local addresses
  }
  return false;
}

/** Base URLs point at a folder: "http://localhost/app" becomes "http://localhost/app/". */
function normalizeBase(url) {
  const u = new URL(url.href);
  u.hash = '';
  u.search = '';
  if (!u.pathname.endsWith('/')) {
    const last = u.pathname.split('/').pop();
    u.pathname = /\.[A-Za-z0-9]{1,5}$/.test(last) ? u.pathname.slice(0, u.pathname.length - last.length) : `${u.pathname}/`;
  }
  return u;
}

/**
 * @returns {Promise<{ok:true, url:URL, address:string, family:number, remote:boolean}|{ok:false, reason:string, remote?:boolean}>}
 */
async function resolveTarget(rawUrl, { allowRemote = false, lookup = dns.promises.lookup } = {}) {
  let url;
  try {
    url = new URL(String(rawUrl));
  } catch {
    return { ok: false, reason: `"${rawUrl}" is not a valid URL (example: http://localhost/MyProject/)` };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false, reason: 'only http:// and https:// URLs can be checked' };
  if (url.username || url.password) return { ok: false, reason: 'URLs with a user name or password are not supported' };
  const host = url.hostname.replace(/^\[|\]$/g, '');
  let addresses;
  try {
    addresses = net.isIP(host) ? [{ address: host, family: net.isIP(host) }] : await lookup(host, { all: true, verbatim: true });
  } catch (err) {
    return { ok: false, reason: `${host} could not be resolved (${err.code || err.message})` };
  }
  if (!addresses || !addresses.length) return { ok: false, reason: `${host} could not be resolved` };
  const local = addresses.every((a) => isLocalAddress(a.address));
  if (!local && !allowRemote) {
    return {
      ok: false,
      remote: true,
      reason: `${host} is not a local or private-network address. Live checks run against localhost and private networks by default; add --allow-remote only for a site you own or are authorized to test.`,
    };
  }
  return { ok: true, url: normalizeBase(url), address: addresses[0].address, family: addresses[0].family, remote: !local };
}

module.exports = { resolveTarget, isLocalAddress, normalizeBase };
