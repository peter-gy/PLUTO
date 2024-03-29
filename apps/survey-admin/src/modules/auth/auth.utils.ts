import { cookies } from 'next/headers';
import { USER_JWT_COOKIE_NAME } from '@pluto/survey-model';
import { NextResponse } from 'next/server';
import { strapiFetch } from '../strapi/strapi.utils';
import { env } from '../../env.mjs';

export function tryExtractAuthToken(request: Request) {
  const tokenFromHeader = request.headers.get('Authorization')?.split(' ')[1];
  if (tokenFromHeader) {
    return tokenFromHeader;
  }
  const tokenFromCookie = cookies().get(USER_JWT_COOKIE_NAME)?.value;
  if (tokenFromCookie) {
    return tokenFromCookie;
  }
  return null;
}

type RouteHandler = (request: Request, token?: string) => Promise<Response>;

export function requireAuth(routeHandler: RouteHandler) {
  return async (request: Request) => {
    // For some reason Next wants to pre-render API routes wrapped in this fn. We return a 400 to prevent that.
    if (process.env.NEXT_IS_EXPORT_WORKER === 'true') {
      return NextResponse.json({ error: 'No Prerender' }, { status: 400 });
    }

    // If auth is disabled, just call the route handler
    if (!env.NEXT_PUBLIC_USE_AUTH) {
      return routeHandler(request);
    }

    const token = tryExtractAuthToken(request);
    // Check for token existence
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }
    const isJwt = token.split('.').length === 3;
    // Check for token validity
    const res = await strapiFetch(
      isJwt ? '/users/me' : '/users',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      false
    );
    if (res.ok) {
      return routeHandler(request, token);
    }
    console.error(
      `Invalid token: ${token}. Response: ${res.status} ${await res.text()}}`
    );
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  };
}
