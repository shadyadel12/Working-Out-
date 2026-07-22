const HOUR = 60 * 60 * 1000;

function cors(request: Request, env: Env) {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = env.ALLOWED_WEB_ORIGINS.split(',').map((item) => item.trim());
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info,x-client-platform',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Expose-Headers': 'x-request-id,content-range',
    Vary: 'Origin',
  };
}

function json(request: Request, env: Env, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(request, env), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function routeLabel(pathname: string) {
  return pathname
    .replace(/^\/proxy/, '')
    .split('/')
    .filter(Boolean)
    .slice(0, 4)
    .map((part) => /^[0-9a-f-]{24,}$/i.test(part) || /^\d+$/.test(part) ? ':id' : part.slice(0, 64))
    .join('/') || 'root';
}

function clientIp(request: Request) {
  return (request.headers.get('CF-Connecting-IP') ?? 'unknown').slice(0, 64);
}

function platform(request: Request) {
  const declared = request.headers.get('x-client-platform');
  if (declared === 'web' || declared === 'android' || declared === 'ios') return declared;
  const agent = request.headers.get('User-Agent') ?? '';
  if (/android/i.test(agent)) return 'android';
  if (/iphone|ipad|ios/i.test(agent)) return 'ios';
  return 'web';
}

async function activeBlock(env: Env, ip: string) {
  return env.ANALYTICS_DB.prepare(
    `select ip, reason, expires_at from ip_blocks
     where ip = ? and (expires_at is null or expires_at > datetime('now'))`,
  ).bind(ip).first<{ ip: string; reason: string; expires_at: string | null }>();
}

async function record(env: Env, request: Request, status: number, blocked: boolean, requestId: string) {
  const now = new Date();
  const bucket = new Date(Math.floor(now.getTime() / HOUR) * HOUR).toISOString();
  const ip = clientIp(request);
  const clientPlatform = platform(request);
  const route = routeLabel(new URL(request.url).pathname);
  const country = request.cf?.country ?? null;
  const agent = (request.headers.get('User-Agent') ?? '').slice(0, 255) || null;
  const error = status >= 400 ? 1 : 0;
  const statements = [env.ANALYTICS_DB.prepare(
    `insert into traffic_hourly
      (ip,bucket,platform,route,method,request_count,error_count,blocked_count,last_status,last_seen,country,user_agent)
     values (?,?,?,?,?,1,?,?,?,?,?,?)
     on conflict(ip,bucket,platform,route,method) do update set
       request_count=request_count+1,
       error_count=error_count+excluded.error_count,
       blocked_count=blocked_count+excluded.blocked_count,
       last_status=excluded.last_status,
       last_seen=excluded.last_seen,
       country=excluded.country,
       user_agent=excluded.user_agent`,
  ).bind(ip, bucket, clientPlatform, route, request.method, error, blocked ? 1 : 0, status, now.toISOString(), country, agent)];
  if (error || blocked) statements.push(env.ANALYTICS_DB.prepare(
    `insert into security_events(id,occurred_at,ip,platform,method,route,status,country,event_type)
     values(?,?,?,?,?,?,?,?,?)`,
  ).bind(requestId, now.toISOString(), ip, clientPlatform, request.method, route, status, country, blocked ? 'blocked' : 'error'));
  await env.ANALYTICS_DB.batch(statements);
}

function jwtAal(token: string) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return (JSON.parse(atob(payload)) as { aal?: string }).aal;
  } catch { return null; }
}

async function requireAdmin(request: Request, env: Env) {
  const authorization = request.headers.get('Authorization') ?? '';
  const apikey = request.headers.get('apikey') ?? '';
  const token = authorization.replace(/^Bearer\s+/i, '');
  if (!token || !apikey || jwtAal(token) !== 'aal2') return null;
  const authHeaders = { Authorization: authorization, apikey };
  const userResponse = await fetch(`${env.SUPABASE_ORIGIN}/auth/v1/user`, { headers: authHeaders });
  if (!userResponse.ok) return null;
  const user = await userResponse.json<{ id: string }>();
  const profileResponse = await fetch(`${env.SUPABASE_ORIGIN}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`, { headers: authHeaders });
  if (!profileResponse.ok) return null;
  const profiles = await profileResponse.json<Array<{ role: string }>>();
  return profiles[0]?.role === 'admin' ? user.id : null;
}

async function adminApi(request: Request, env: Env) {
  const adminId = await requireAdmin(request, env);
  if (!adminId) return json(request, env, { error: 'Administrator MFA is required.' }, 403);
  const url = new URL(request.url);
  if (url.pathname === '/admin/traffic' && request.method === 'GET') {
    const hours = Math.min(168, Math.max(1, Number(url.searchParams.get('hours') ?? 24)));
    const since = new Date(Date.now() - hours * HOUR).toISOString();
    const [totals, ips, events, blocks] = await env.ANALYTICS_DB.batch([
      env.ANALYTICS_DB.prepare(`select coalesce(sum(request_count),0) requests, coalesce(sum(error_count),0) errors, coalesce(sum(blocked_count),0) blocked, count(distinct ip) unique_ips from traffic_hourly where bucket >= ?`).bind(since),
      env.ANALYTICS_DB.prepare(`select ip, country, platform, sum(request_count) requests, sum(error_count) errors, sum(blocked_count) blocked, max(last_seen) last_seen from traffic_hourly where bucket >= ? group by ip,country,platform order by requests desc limit 200`).bind(since),
      env.ANALYTICS_DB.prepare(`select * from security_events where occurred_at >= ? order by occurred_at desc limit 200`).bind(since),
      env.ANALYTICS_DB.prepare(`select * from ip_blocks where expires_at is null or expires_at > datetime('now') order by created_at desc`),
    ]);
    return json(request, env, { totals: totals.results[0] ?? {}, ips: ips.results, events: events.results, blocks: blocks.results, hours });
  }
  if (url.pathname === '/admin/blocks' && request.method === 'POST') {
    const body = await request.json<{ ip?: string; reason?: string; expiresAt?: string | null }>();
    const ip = String(body.ip ?? '').trim();
    const reason = String(body.reason ?? '').trim().slice(0, 250);
    if (!ip || ip.length > 64 || !reason) return json(request, env, { error: 'IP and reason are required.' }, 400);
    await env.ANALYTICS_DB.prepare(`insert into ip_blocks(ip,reason,created_at,created_by,expires_at) values(?,?,?,?,?) on conflict(ip) do update set reason=excluded.reason,created_at=excluded.created_at,created_by=excluded.created_by,expires_at=excluded.expires_at`).bind(ip, reason, new Date().toISOString(), adminId, body.expiresAt ?? null).run();
    return json(request, env, { blocked: true });
  }
  if (url.pathname === '/admin/blocks' && request.method === 'DELETE') {
    const ip = url.searchParams.get('ip') ?? '';
    await env.ANALYTICS_DB.prepare('delete from ip_blocks where ip = ?').bind(ip).run();
    return json(request, env, { blocked: false });
  }
  return json(request, env, { error: 'Not found.' }, 404);
}

async function proxy(request: Request, env: Env) {
  const source = new URL(request.url);
  const target = new URL(source.pathname.replace(/^\/proxy/, '') + source.search, env.SUPABASE_ORIGIN);
  const headers = new Headers(request.headers);
  headers.delete('CF-Connecting-IP');
  headers.delete('CF-IPCountry');
  headers.delete('CF-Ray');
  headers.delete('Host');
  const upstream = new Request(target, request);
  headers.forEach((value, name) => upstream.headers.set(name, value));
  return fetch(upstream);
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request, env) });
    const requestId = crypto.randomUUID();
    const url = new URL(request.url);
    if (url.pathname === '/') return json(request, env, {
      ok: true,
      service: 'PulseFit request gateway',
      dashboard: 'https://working-out-rho.vercel.app/admin/traffic',
      health: '/health',
    });
    if (url.pathname === '/health') return json(request, env, { ok: true });
    if (url.pathname.startsWith('/admin/')) return adminApi(request, env);
    if (!url.pathname.startsWith('/proxy/')) return json(request, env, { error: 'Not found.' }, 404);
    const block = await activeBlock(env, clientIp(request));
    if (block) {
      ctx.waitUntil(record(env, request, 403, true, requestId));
      const response = json(request, env, { error: 'This network is temporarily blocked.', requestId }, 403);
      response.headers.set('x-request-id', requestId);
      return response;
    }
    try {
      const response = await proxy(request, env);
      const result = new Response(response.body, response);
      result.headers.set('x-request-id', requestId);
      ctx.waitUntil(record(env, request, response.status, false, requestId));
      return result;
    } catch (error) {
      console.error(JSON.stringify({ event: 'proxy_error', requestId, route: routeLabel(url.pathname), message: error instanceof Error ? error.message : 'Unknown error' }));
      ctx.waitUntil(record(env, request, 502, false, requestId));
      return json(request, env, { error: 'Upstream service unavailable.', requestId }, 502);
    }
  },
  async scheduled(_controller, env, ctx): Promise<void> {
    ctx.waitUntil(env.ANALYTICS_DB.batch([
      env.ANALYTICS_DB.prepare(`delete from security_events where occurred_at < datetime('now','-7 days')`),
      env.ANALYTICS_DB.prepare(`delete from traffic_hourly where bucket < datetime('now','-30 days')`),
      env.ANALYTICS_DB.prepare(`delete from ip_blocks where expires_at is not null and expires_at <= datetime('now')`),
    ]).then(() => undefined));
  },
} satisfies ExportedHandler<Env>;
