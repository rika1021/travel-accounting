import type { RequestEvent } from '@sveltejs/kit';

import { env } from '$env/dynamic/public';
const targetBase = (env.PUBLIC_API_BASE_URL ?? '').trim() || 'http://localhost:3000';


async function forward(event: RequestEvent) {
  const { request } = event;
  const url = new URL(request.url);
  // Keep `/api` prefix because backend routes are `/api/*`
  const target = `${targetBase}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  const res = await fetch(target, init);

  // Clone headers
  const responseHeaders = new Headers(res.headers);

  const buffer = await res.arrayBuffer();

  return new Response(buffer, {
    status: res.status,
    headers: responseHeaders,
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const OPTIONS = forward;
