#!/usr/bin/env bash
# AWS 서울 리전(ap-northeast-2) 엔드포인트까지의 구간별 시간을 N회 재서 중앙값(ms)을 출력한다.
# 사용: scripts/measure.sh [host] [runs]
set -euo pipefail
HOST="${1:-ec2.ap-northeast-2.amazonaws.com}"
RUNS="${2:-15}"

median() { sort -n | awk '{a[NR]=$1} END {print (NR%2 ? a[(NR+1)/2] : (a[NR/2]+a[NR/2+1])/2)}'; }

echo "host=$HOST runs=$RUNS date=$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# 1) DNS: 캐시를 피하려고 공개 resolver에 직접 묻는다(+norecurse 아님, resolver 캐시는 있을 수 있음)
for _ in $(seq "$RUNS"); do
  dig @1.1.1.1 "$HOST" +noall +stats | awk '/Query time/ {print $4}'
done | median | xargs printf 'dns_query_ms(1.1.1.1)=%s\n'

# 2) curl: 새 연결마다 TCP connect / TLS / TTFB 구간
tmp=$(mktemp)
for _ in $(seq "$RUNS"); do
  curl -so /dev/null --http2 -w '%{time_namelookup} %{time_connect} %{time_appconnect} %{time_starttransfer}\n' "https://$HOST/"
done > "$tmp"
awk '{printf "%.2f\n", ($2-$1)*1000}' "$tmp" | median | xargs printf 'tcp_connect_ms=%s\n'
awk '{printf "%.2f\n", ($3-$2)*1000}' "$tmp" | median | xargs printf 'tls_handshake_ms=%s\n'
awk '{printf "%.2f\n", ($4-$3)*1000}' "$tmp" | median | xargs printf 'request_to_first_byte_ms=%s\n'
rm -f "$tmp"

# 3) 왕복 시간(RTT) 참고값
ping -c "$RUNS" -q "$HOST" 2>/dev/null | awk -F'/' '/round-trip|rtt/ {print "ping_rtt_avg_ms=" $5}' || echo "ping_rtt_avg_ms=unavailable"
