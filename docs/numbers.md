# 단계별 ms의 근거

페이지의 시간은 "대략 이 정도"라는 감을 주기 위한 대표값이다. 측정값, 공개 자료, 추정을 조합했고 추정은 그렇다고 표시한다.
(스펙 8절: 공개 자료 + 이 맥 측정 조합, 직접 5G 측정 없음)

## 측정 (2026-10-22, macOS, 유선/Wi-Fi, 서울)

`scripts/measure.sh` (대상 `ec2.ap-northeast-2.amazonaws.com`, 15회 중앙값, HTTP/2, TLS 1.3 확인)

| 항목 | 값 |
|---|---|
| DNS 조회 (`dig @1.1.1.1`) | 8 ms |
| TCP connect (왕복 1회) | 8.11 ms |
| TLS handshake (TLS 1.3) | 19.78 ms |
| 요청 → 첫 바이트 | 7.88 ms |

- TLS가 왕복 1회(≈8ms)보다 약 11.7ms 길다. TLS 1.3은 1-RTT이므로 이 차이를 인증서 검증 등 암호 처리 시간으로 본다. `s3.ap-northeast-2.amazonaws.com`(TLS 1.3)에서도 비슷한 경향(TLS 9.5~15.9ms)이었다.
- Node 최소 주문 핸들러(JSON 파싱 → 검증 → 201 JSON 응답, `node:http`, Node 22.23.4) localhost 30회 중앙값: **0.15 ms**.

## 공개 자료

- 모바일 왕복 시간: Opensignal, 한국 5G 폰 평균 latency **35.9 ms** (2019년 6월, 5G NSA 초기). 최신 보고서(2025-12)는 접근이 막혀 수치를 확인하지 못했다. 오래된 자료라 현재는 더 짧을 수 있다.
  https://www.rcrwireless.com/20190621/5g/what-is-using-5g-really-like-opensignal-tests-korean-5g
- EBS gp3: "single-digit millisecond latency" (AWS EBS User Guide, General Purpose SSD).
  https://docs.aws.amazon.com/ebs/latest/userguide/general-purpose.html

## 단계별 계산

모바일 왕복 1회(RTT)를 36 ms, 편도를 그 절반인 18 ms로 둔다.

| Step | ms | 계산 | 종류 |
|---|---|---|---|
| 0 탭 → fetch() | 5 | 터치 샘플링 대기 + 이벤트 처리 | 추정 (공개 측정 자료 없음) |
| 1 URL과 캐시 | 1 | 메모리 안의 문자열 해석·조회 | 추정 |
| 2 DNS | 36 | 통신사 resolver까지 모바일 왕복 1회 | 공개 자료 |
| 3 TCP | 36 | 3-way handshake = 왕복 1회 | 공개 자료 |
| 4 TLS | 48 | 왕복 1회 36 + 암호 처리 12 | 공개 자료 + 측정 |
| 5 서버 도착 | 20 | 요청 편도 18 + ALB 처리 2 | 공개 자료 + 추정 |
| 6 Node | 2 | 최소 핸들러 0.15 + 프레임워크·검증 여유 | 측정 + 추정 |
| 7 DB | 8 | 앱↔DB 네트워크 1 + INSERT 1 + EBS 기록 수 ms | 공개 자료 + 추정 |
| 8 응답과 렌더링 | 30 | 응답 편도 18 + 파싱·렌더 4 + 60Hz 화면 갱신 평균 대기 8 | 공개 자료 + 추정 |
| **합계** | **186** | | |

## 측정하지 않은 것

- 로컬 Postgres의 INSERT+COMMIT: 일반 테이블에 써야 해서 사용자 DB를 건드리게 되고, 로컬 SSD는 RDS(EBS)와 성격이 달라 대표성이 없다고 판단해 재지 않았다.
- 실제 5G 단말 측정: 스펙상 하지 않는다.
