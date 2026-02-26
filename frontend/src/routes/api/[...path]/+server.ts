import type { RequestEvent } from '@sveltejs/kit';

import { env } from '$env/dynamic/public';
const targetBase = (env.PUBLIC_API_BASE_URL ?? '').trim() || 'http://localhost:3000';


async function forward(event: RequestEvent) {
  const { request } = event;
  const url = new URL(request.url);

  const target = `${targetBase}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');

  const res = await fetch(target, {
    method: request.method,
    headers,
    body:
      request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.arrayBuffer()
        : undefined,
  });

  // ⭐ 重新建立 headers，移除壓縮相關 header
  const newHeaders = new Headers(res.headers);
  newHeaders.delete('content-encoding');
  newHeaders.delete('content-length');

  return new Response(res.body, {
    status: res.status,
    headers: newHeaders
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const OPTIONS = forward;
