create table if not exists traffic_hourly (
  ip text not null,
  bucket text not null,
  platform text not null,
  route text not null,
  method text not null,
  request_count integer not null default 0,
  error_count integer not null default 0,
  blocked_count integer not null default 0,
  last_status integer not null,
  last_seen text not null,
  country text,
  user_agent text,
  primary key (ip, bucket, platform, route, method)
);

create index if not exists traffic_hourly_bucket_idx on traffic_hourly(bucket desc);
create index if not exists traffic_hourly_ip_idx on traffic_hourly(ip, bucket desc);

create table if not exists security_events (
  id text primary key,
  occurred_at text not null,
  ip text not null,
  platform text not null,
  method text not null,
  route text not null,
  status integer not null,
  country text,
  event_type text not null
);

create index if not exists security_events_time_idx on security_events(occurred_at desc);

create table if not exists ip_blocks (
  ip text primary key,
  reason text not null,
  created_at text not null,
  created_by text not null,
  expires_at text
);

create index if not exists ip_blocks_expiry_idx on ip_blocks(expires_at);
