import type { PhysicalNode, Step } from './types';

// 물리 레인에서 여러 Step이 함께 쓰는 장비
const ap: PhysicalNode = { id: 'phone-ap', label: 'AP(프로세서)', icon: 'Cpu' };
const modem: PhysicalNode = { id: 'phone-modem', label: '폰 modem', icon: 'Smartphone' };
const tower: PhysicalNode = { id: 'cell-tower', label: '기지국', icon: 'RadioTower' };
const core: PhysicalNode = { id: 'carrier-core', label: '통신사 코어망', icon: 'Building2' };
const aws: PhysicalNode = { id: 'aws-seoul', label: 'AWS 서울', icon: 'Cloud' };

const para = (...lines: string[]) => lines.join('\n\n');

// ms는 임시값(provisional)이다. 측정 후 교체한다.
export const steps: Step[] = [
  {
    index: 0,
    slug: 'tap',
    title: '버튼을 누르는 순간',
    summary: '손가락이 화면에 닿고, 브라우저가 요청을 만들기 시작해요.',
    ms: 5,
    provisional: true,
    messages: [{ label: 'touch', direction: 'up' }, { label: 'click', direction: 'up' }, { label: 'fetch()', direction: 'up' }],
    nodes: [
      { id: 'touch-sensor', label: '터치 센서', icon: 'Hand' },
      { id: 'touch-controller', label: '터치 컨트롤러', icon: 'Cpu' },
      ap,
    ],
    body: para(
      '손가락이 "주문하기" 버튼에 닿는 순간부터 여정이 시작돼요. 화면 아래의 터치 센서가 손가락 위치를 알아채고, 그 좌표가 폰의 프로세서로 전달돼요.',
      '브라우저는 그 좌표에 어떤 요소가 있는지 찾아 버튼의 click 이벤트를 일으키고, 우리가 붙여 둔 onClick 함수가 실행돼요. 그 안에서 [[fetch]]가 호출되면서 비로소 HTTP 요청이 만들어지기 시작해요.',
    ),
    deeper: para(
      '요즘 폰 화면은 대부분 정전식 터치 센서예요. 유리 아래에 가는 전극이 격자로 깔려 있고, 손가락이 닿으면 그 지점의 전기적 성질이 살짝 달라져요. 터치 컨트롤러 칩이 격자를 계속 훑다가 변화가 생긴 위치를 계산해 프로세서(AP)에 알려요.',
      '프로세서에서는 OS가 이 입력을 받아 지금 화면 앞에 있는 앱, 여기서는 브라우저에 넘겨요. 브라우저는 화면 좌표와 페이지 요소들의 위치를 맞춰 보는 [[hit-test]]로 눌린 버튼을 찾아요.',
    ),
    sources: [
      { label: 'MDN: Pointer events', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events' },
      { label: 'MDN: Fetch API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API' },
    ],
  },
  {
    index: 1,
    slug: 'url-cache',
    title: '주소를 읽고 캐시부터 확인하기',
    summary: '보내기 전에, 이미 가진 답이 있는지 먼저 살펴봐요.',
    ms: 3,
    provisional: true,
    messages: [{ label: 'URL parse', direction: 'up' }, { label: 'cache lookup', direction: 'up' }],
    nodes: [ap, { id: 'phone-ram', label: '메모리(RAM)', icon: 'MemoryStick' }],
    body: para(
      'fetch에 넘긴 주소 https://shop.example.com/api/orders를 브라우저가 쪼개 읽어요. 어떤 규칙으로(https), 어느 서버에(shop.example.com), 어떤 경로로(/api/orders) 보낼지 정리하는 거예요.',
      'GET 요청이라면 여기서 [[http-cache]]에 쓸 만한 답이 있는지 먼저 봐요. 하지만 주문은 서버의 상태를 바꾸는 POST 요청이라, 브라우저는 저장해 둔 답을 쓰지 않고 네트워크로 보내요.',
    ),
    deeper: para(
      '이 단계는 전부 폰 안에서 일어나요. 프로세서가 주소 문자열을 해석하고, 캐시와 이미 열려 있는 연결 목록을 메모리(RAM)에서 찾아봐요. 그래서 시간이 아주 조금 걸려요.',
      '페이지와 API의 도메인이 다르면 브라우저는 본 요청 전에 "이런 요청을 보내도 되나요?"라고 묻는 [[preflight]] 요청을 하나 더 보내요. JSON을 POST하는 요청이 대표적이에요. 이 시나리오는 페이지와 API가 같은 도메인이라 그 왕복이 없어요.',
    ),
    practice: para(
      'GET API라면 응답 헤더의 [[cache-control]]이 이 단계에서 끝날지를 정해요. max-age를 주면 그 시간 동안은 네트워크를 아예 타지 않고, no-store를 주면 매번 서버에 물어요.',
      'DevTools Network 탭의 Size 칸에 (memory cache)나 (disk cache)가 보이면 이 단계에서 끝난 요청이에요.',
    ),
    sources: [
      { label: 'RFC 9111: HTTP Caching', url: 'https://www.rfc-editor.org/rfc/rfc9111' },
      { label: 'MDN: Cache-Control', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control' },
      { label: 'MDN: CORS', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS' },
    ],
  },
  {
    index: 2,
    slug: 'dns',
    title: '이름으로 주소 찾기',
    summary: '도메인 이름을 서버의 IP 주소로 바꿔요.',
    ms: 20,
    provisional: true,
    messages: [{ label: 'DNS query', direction: 'up' }, { label: 'DNS response', direction: 'down' }],
    nodes: [modem, tower, { id: 'carrier-dns', label: '통신사 DNS 서버', icon: 'Server' }],
    body: para(
      'shop.example.com이라는 이름만으로는 패킷을 보낼 수 없어요. 인터넷은 [[ip|IP 주소]]로 길을 찾기 때문에, 이름을 주소로 바꾸는 [[dns]] 조회가 먼저 필요해요.',
      '브라우저와 OS에 기억해 둔 답이 없으면 폰은 통신사의 [[resolver]]에게 물어봐요. 질문과 답은 보통 [[udp]] 패킷 하나씩이라 왕복 한 번이면 끝나요.',
    ),
    deeper: para(
      '통신사 resolver도 답을 모르면 대신 찾아 나서요. 루트 서버에 .com을 맡은 서버가 어디인지 묻고, 그 서버에 example.com을 맡은 서버를 묻고, 마지막으로 그 도메인을 관리하는 서버(예: Route 53)에게서 실제 주소를 받아요.',
      '받은 답에는 [[ttl]]이 붙어 있어서 그 시간 동안은 resolver, OS, 브라우저가 답을 기억해 둬요. 그래서 실제로는 이 단계가 몇 ms 만에 끝나거나 아예 생략되는 경우가 많아요.',
      '물리적으로는 질문 패킷이 폰 modem에서 전파가 되어 기지국까지 가고, 통신사 망 안의 DNS 서버까지만 다녀와요. 아직 AWS까지는 가지 않아요.',
    ),
    practice: para(
      'Node.js에서 getaddrinfo [[enotfound]]가 나면 이 단계에서 실패한 거예요. 도메인 오타, DNS 레코드 누락, 사내망에서만 풀리는 이름을 바깥에서 부른 경우가 흔한 원인이에요.',
      'Node.js의 dns.lookup은 OS의 이름 풀이 기능을 [[libuv]]의 thread pool에서 실행해요. 요청마다 새 이름을 조회하는 코드가 많으면 이 thread pool이 붐벼서 파일 읽기 같은 다른 작업까지 느려질 수 있어요.',
      'DevTools에서 요청을 누르고 Timing 탭을 보면 DNS Lookup 칸이 이 단계의 시간이에요.',
    ),
    sources: [
      { label: 'RFC 1035: Domain Names', url: 'https://www.rfc-editor.org/rfc/rfc1035' },
      { label: 'Node.js: dns implementation considerations', url: 'https://nodejs.org/api/dns.html#implementation-considerations' },
    ],
  },
  {
    index: 3,
    slug: 'tcp',
    title: '서버와 연결 맺기',
    summary: '말을 걸어도 되는지 서로 확인해요.',
    ms: 18,
    provisional: true,
    messages: [{ label: 'SYN', direction: 'up' }, { label: 'SYN-ACK', direction: 'down' }, { label: 'ACK', direction: 'up' }],
    nodes: [modem, tower, core, aws],
    body: para(
      '서버의 IP 주소를 알았으니 이제 말을 걸 차례예요. 그런데 주문 내용을 바로 보내지는 않아요.',
      '먼저 [[tcp]] 연결을 열어서 서로 주고받을 준비가 됐는지부터 확인해요. 폰이 [[syn]]을 보내고, 서버가 [[syn-ack]]로 답하고, 폰이 [[ack]]로 받았다고 알리면 연결이 열려요. 이 세 번의 인사를 [[3-way-handshake]]라고 불러요.',
      '데이터는 한 바이트도 보내지 않았는데 신호가 한 번 왕복하는 시간, 즉 [[rtt]] 하나가 인사에 쓰였어요.',
    ),
    deeper: para(
      '물리적으로 따라가 보면, [[syn]] 하나는 폰 modem에서 전파가 되어 가까운 기지국으로 날아가요. 기지국부터는 유선이에요. 통신사 코어망을 지나 광케이블로 된 인터넷 백본을 타고 AWS 서울 리전의 데이터센터로 들어가요.',
      '같은 도시 안이라도 무선 구간에서 순서를 기다리는 시간과 여러 장비를 거치는 시간이 쌓여요. 그래서 모바일에서는 이 왕복 한 번에 수십 ms가 걸리는 일이 흔해요.',
      '목적지는 [[port|443번 port]]예요. 그 port에서는 [[alb]]가 연결을 기다리고 있다가 [[syn-ack]]를 돌려줘요.',
      '[[http3]]는 [[tcp]] 대신 [[quic]]을 써요. TCP 인사와 다음 단계의 [[tls]] 인사를 따로 하면 왕복이 두 번 필요한데, QUIC은 둘을 묶어 한 번에 끝내요.',
    ),
    practice: para(
      'Node.js에서 fetch나 http.request가 [[econnrefused]]를 내면, 상대 컴퓨터까지는 갔는데 그 port에서 기다리는 프로그램이 없다는 뜻이에요. 서버가 [[syn]]에 [[rst]]로 답한 거예요. 서버 프로세스가 떠 있는지, port 번호가 맞는지부터 확인하세요.',
      '[[etimedout]]은 [[syn]]에 아무 답도 없었다는 뜻이에요. AWS에서는 [[security-group]] 규칙이 빠진 경우가 대표적이에요. 허용되지 않은 트래픽은 서버에 닿지 않으니, 서버가 거절 신호조차 보낼 수 없어서 기다리다 시간이 다 돼요.',
      '연결을 매번 새로 맺지 않으면 이 단계를 통째로 건너뛸 수 있어요. 브라우저는 같은 서버와 맺은 연결을 다시 쓰고, Node.js도 19 버전부터 기본 HTTP agent가 [[keep-alive]]를 켜 둬요.',
    ),
    sources: [
      { label: 'RFC 9293: TCP', url: 'https://www.rfc-editor.org/rfc/rfc9293' },
      { label: 'RFC 9000: QUIC', url: 'https://www.rfc-editor.org/rfc/rfc9000' },
      { label: 'Node.js: http.globalAgent', url: 'https://nodejs.org/api/http.html#httpglobalagent' },
      { label: 'AWS: Security groups', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html' },
    ],
  },
  {
    index: 4,
    slug: 'tls',
    title: '둘만 아는 암호 정하기',
    summary: '서버가 진짜인지 확인하고, 대화를 암호화할 키를 만들어요.',
    ms: 24,
    provisional: true,
    messages: [{ label: 'ClientHello', direction: 'up' }, { label: 'ServerHello', direction: 'down' }, { label: 'Finished', direction: 'up' }],
    nodes: [modem, tower, core, aws],
    body: para(
      '연결은 열렸지만, 이 위로 오가는 내용은 아직 길목에 있는 누구나 볼 수 있어요. 그래서 주문 정보를 보내기 전에 [[tls]] 인사를 한 번 더 해요.',
      '폰이 [[client-hello]]로 쓸 수 있는 암호 방식과 키 재료를 보내면, 서버는 [[server-hello]]와 함께 자신의 [[certificate]]를 보내요. 폰이 인증서를 확인하고 Finished를 보내면 그때부터 모든 내용이 암호화돼요. [[tls|TLS 1.3]]에서는 이 과정이 왕복 한 번이에요.',
    ),
    deeper: para(
      '신기한 점은 암호화에 쓸 키가 네트워크로 한 번도 오가지 않는다는 거예요. 양쪽이 각자 만든 값의 일부만 교환하고, 같은 계산을 해서 같은 비밀 키에 도착해요. 이 방식을 [[ecdhe]]라고 해요.',
      '인증서는 "이 공개 키의 주인은 shop.example.com이 맞다"는 증명서예요. 폰은 인증서에 적힌 도메인이 접속한 주소와 같은지, 기간이 지나지 않았는지, 폰이 믿는 [[ca]]까지 서명이 이어지는지 확인해요.',
      '이 시나리오에서는 [[alb]]가 인증서를 들고 있다가 암호화를 풀어요. ALB 뒤의 Node 서버는 같은 네트워크 안에서 평문 HTTP로 요청을 받아요.',
    ),
    practice: para(
      '인증서 문제는 Node.js에서 CERT_HAS_EXPIRED(만료), ERR_TLS_CERT_ALTNAME_INVALID(도메인 불일치), UNABLE_TO_VERIFY_LEAF_SIGNATURE(중간 인증서 누락) 같은 에러로 나타나요.',
      '급하다고 NODE_TLS_REJECT_UNAUTHORIZED=0으로 검증을 끄면 안 돼요. 에러만 사라질 뿐, 중간에서 누가 가로채도 알아챌 수 없게 돼요.',
      '앞 단계의 [[keep-alive]]로 연결을 유지하면 이 TLS 인사도 다시 할 필요가 없어요.',
    ),
    sources: [
      { label: 'RFC 8446: TLS 1.3', url: 'https://www.rfc-editor.org/rfc/rfc8446' },
      { label: 'Node.js: TLS', url: 'https://nodejs.org/api/tls.html' },
      {
        label: 'AWS: HTTPS listeners for your Application Load Balancer',
        url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/create-https-listener.html',
      },
    ],
  },
  {
    index: 5,
    slug: 'arrival',
    title: '서버 건물에 도착',
    summary: 'Load balancer가 요청을 받아 Node 서버 한 대에 넘겨요.',
    ms: 12,
    provisional: true,
    messages: [{ label: 'POST /api/orders', direction: 'up' }, { label: 'forward', direction: 'up' }],
    nodes: [
      { id: 'alb', label: 'ALB', icon: 'Network' },
      { id: 'switch', label: '스위치', icon: 'Router' },
      { id: 'nic', label: '서버 NIC', icon: 'Server' },
      { id: 'server-cpu', label: 'CPU', icon: 'Cpu' },
    ],
    body: para(
      '드디어 주문 내용이 담긴 요청 POST /api/orders가 출발해요. [[http2]] 형식으로 암호화된 채 같은 길을 지나 AWS 서울 리전의 [[alb]]에 도착해요.',
      'ALB는 암호화를 풀고, 뒤에 있는 Node 서버 여러 대 중 [[health-check]]를 통과한 한 대를 골라 요청을 넘겨요. 이 구간은 같은 데이터센터 안이라 아주 가까워요.',
    ),
    deeper: para(
      'ALB와 Node 서버 사이는 기본적으로 HTTP/1.1이에요. ALB는 서버와 맺은 연결을 열어 두고 여러 요청에 돌려 써요.',
      '요청 패킷이 데이터센터 스위치를 거쳐 서버의 [[nic]]에 도착하면, NIC는 데이터를 메모리에 직접 써 넣고 [[interrupt]]로 CPU를 불러요. CPU는 하던 일을 잠깐 멈추고 [[kernel]]의 네트워크 코드를 실행해서, 데이터를 해당 연결의 수신 버퍼에 쌓아 둬요.',
      '여기까지 Node.js는 아무것도 하지 않았어요. 데이터는 kernel 안에서 누군가 가져가기를 기다리고 있어요.',
    ),
    practice: para(
      '502는 ALB가 서버에게서 제대로 된 답을 받지 못했다는 뜻이에요. 서버 프로세스가 죽었거나, 응답 도중에 서버가 연결을 끊은 경우예요.',
      'Node.js에서 자주 보는 원인이 하나 있어요. Node의 server.keepAliveTimeout 기본값은 5초인데 ALB의 idle timeout 기본값은 60초예요. Node가 먼저 연결을 닫는 순간 ALB가 그 연결로 요청을 보내면 간헐적인 502가 나요. keepAliveTimeout을 ALB idle timeout보다 길게 잡아 주세요.',
      '504는 서버가 연결은 받았지만 idle timeout 안에 답하지 못한 경우예요. 대개 뒤 단계, 특히 느린 DB 쿼리가 원인이에요.',
    ),
    sources: [
      {
        label: 'AWS: Troubleshoot your Application Load Balancers',
        url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-troubleshooting.html',
      },
      {
        label: 'AWS: Application Load Balancer attributes',
        url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/application-load-balancers.html#load-balancer-attributes',
      },
      { label: 'Node.js: server.keepAliveTimeout', url: 'https://nodejs.org/api/http.html#serverkeepalivetimeout' },
    ],
  },
  {
    index: 6,
    slug: 'node',
    title: 'Node.js가 일하는 시간',
    summary: 'event loop가 요청을 집어 들고 여러분의 코드를 실행해요.',
    ms: 16,
    provisional: true,
    messages: [{ label: 'poll', direction: 'up' }, { label: 'handler()', direction: 'up' }],
    nodes: [
      { id: 'cpu-core', label: 'CPU core', icon: 'Cpu' },
      { id: 'server-ram', label: '메모리(RAM)', icon: 'MemoryStick' },
    ],
    body: para(
      'kernel에 쌓인 요청을 Node.js가 가져갈 차례예요. Node.js의 [[event-loop]]는 [[libuv]]를 통해 "읽을 데이터가 생긴 연결이 있으면 깨워 줘"라고 OS에 맡겨 두고 기다려요.',
      '데이터가 도착하면 event loop가 poll 단계에서 깨어나 HTTP 요청을 해석하고, 우리가 작성한 핸들러(예: NestJS 컨트롤러)를 [[main-thread]]에서 실행해요.',
    ),
    deeper: para(
      '리눅스 서버에서 libuv는 [[epoll]]이라는 OS 기능으로 수많은 연결을 한꺼번에 지켜봐요. 연결마다 thread를 따로 두지 않아도 되는 이유예요.',
      '핸들러 안에서 await로 DB를 기다리는 동안 main thread는 쉬지 않아요. 그 사이 다른 사용자의 요청을 처리하다가, DB 답이 오면 멈춰 두었던 핸들러를 이어서 실행해요.',
      '물리적으로는 CPU core 하나가 이 main thread를 실행하고, 요청 데이터와 객체들은 메모리(RAM)를 오가요. JavaScript 코드가 아무리 많아도 한순간에 그 코드를 실행하는 core는 하나예요.',
    ),
    practice: para(
      'main thread가 하나뿐이라 [[blocking]] 코드가 가장 위험해요. 큰 배열을 정렬하거나, 거대한 JSON을 한 번에 변환하거나, fs.readFileSync 같은 동기 함수를 요청 처리 중에 쓰면 그동안 모든 사용자의 요청이 멈춰요.',
      'CPU를 오래 쓰는 일은 [[worker-threads]]로 옮기거나 잘게 나누세요. 응답 시간이 이유 없이 들쭉날쭉하다면 event loop 지연부터 재 보세요.',
    ),
    sources: [
      { label: 'Node.js: The Node.js Event Loop', url: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick' },
      { label: "Node.js: Don't Block the Event Loop", url: 'https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop' },
      { label: 'libuv: Design overview', url: 'https://docs.libuv.org/en/v1.x/design.html' },
    ],
  },
  {
    index: 7,
    slug: 'db',
    title: '데이터베이스에 다녀오기',
    summary: '주문을 저장하러 옆 서버의 Postgres에 다녀와요.',
    ms: 54,
    provisional: true,
    messages: [{ label: 'INSERT', direction: 'up' }, { label: 'COMMIT', direction: 'up' }, { label: 'result', direction: 'down' }],
    nodes: [
      { id: 'app-server', label: '앱 서버', icon: 'Server' },
      { id: 'db-server', label: 'DB 서버(RDS)', icon: 'Database' },
      { id: 'storage', label: 'SSD/EBS', icon: 'HardDrive' },
    ],
    body: para(
      '주문을 저장하려면 데이터베이스에 다녀와야 해요. Node 서버는 [[connection-pool]]에 미리 열어 둔 Postgres 연결 하나를 빌려서, 연결 인사 없이 바로 쿼리를 보내요.',
      'Postgres는 INSERT를 실행하고, COMMIT 때 변경 내용을 [[wal]]에 적어 디스크에 안전하게 남은 것을 확인한 뒤에야 "성공"이라고 답해요. 앱 서버와 DB 서버는 같은 리전 안의 다른 서버라, 이 대화도 짧은 네트워크 왕복이에요.',
    ),
    deeper: para(
      'Postgres는 HTTP가 아니라 자기만의 [[wire-protocol]]로 대화해요. 쿼리를 받으면 SQL을 해석하고, 실행 계획을 세우고, 실제로 실행하는 순서로 처리해요.',
      'RDS의 디스크는 서버에 꽂힌 SSD가 아니라 네트워크로 연결된 [[ebs]]예요. 그래서 "디스크에 썼다"는 확인에도 데이터센터 안의 네트워크 왕복이 들어가요. Multi-AZ DB 인스턴스로 구성했다면 다른 가용 영역의 대기 서버에도 기록된 뒤에 답이 와요.',
      '이 단계가 전체에서 가장 긴 경우가 많아요. 쿼리 실행, 디스크 기록, 네트워크 왕복이 모두 겹치기 때문이에요.',
    ),
    practice: para(
      'pool의 연결이 모두 사용 중이면 새 요청은 빈 연결이 날 때까지 줄을 서요. 트래픽이 몰릴 때만 응답이 갑자기 느려지거나 timeout이 난다면 pool 고갈을 의심해 보세요. 트랜잭션을 열어 둔 채 외부 API를 기다리는 코드가 흔한 범인이에요.',
      '느린 쿼리는 EXPLAIN ANALYZE로 실행 계획을 확인하세요. 필요한 [[index]]가 없어서 테이블 전체를 훑고 있는 경우가 많아요.',
    ),
    sources: [
      { label: 'PostgreSQL: Frontend/Backend Protocol', url: 'https://www.postgresql.org/docs/current/protocol.html' },
      { label: 'PostgreSQL: Write-Ahead Logging', url: 'https://www.postgresql.org/docs/current/wal-intro.html' },
      { label: 'node-postgres: Pooling', url: 'https://node-postgres.com/features/pooling' },
      { label: 'AWS: Amazon RDS DB instance storage', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Storage.html' },
      {
        label: 'AWS: Multi-AZ DB instance deployments',
        url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html',
      },
    ],
  },
  {
    index: 8,
    slug: 'response',
    title: '답장이 화면에 그려지기까지',
    summary: '응답이 같은 길로 돌아오고, 브라우저가 화면을 다시 그려요.',
    ms: 48,
    provisional: true,
    messages: [{ label: '201 Created', direction: 'down' }, { label: 'JSON.parse', direction: 'down' }, { label: 'render', direction: 'down' }],
    nodes: [aws, core, tower, { id: 'gpu', label: 'GPU', icon: 'Cpu' }, { id: 'phone-screen', label: '폰 화면', icon: 'Monitor' }],
    body: para(
      '핸들러가 주문 결과를 돌려주면 Node.js가 이를 JSON으로 바꿔 201 Created 응답을 만들어요. 응답은 ALB에서 다시 암호화되어 왔던 길을 거꾸로 달려 폰에 도착해요.',
      '브라우저는 응답을 복호화하고 fetch의 Promise를 완료시켜요. 우리 코드가 받은 데이터로 화면 상태를 바꾸면, 브라우저가 바뀐 부분을 다시 그려서 "주문 완료"가 나타나요.',
    ),
    deeper: para(
      '화면을 다시 그리는 데도 순서가 있어요. 바뀐 [[dom]]에 스타일을 계산하고, 위치와 크기를 정하고(layout), 픽셀로 칠한 뒤(paint), 여러 층을 [[gpu]]에서 합쳐요(composite).',
      '완성된 화면은 디스플레이가 다음에 새로 고쳐지는 순간에 보여요. 60Hz 화면이면 약 16.7ms마다, 120Hz 화면이면 약 8.3ms마다 기회가 와요. 그래서 계산이 끝나도 화면에 보이기까지 조금 기다릴 수 있어요.',
    ),
    practice: para(
      'DevTools Timing 탭의 Waiting for server response가 [[ttfb]]예요. 요청을 보낸 뒤 첫 바이트가 오기까지의 시간이라, 앞의 Step 5~7(서버 처리와 DB)이 대부분 여기에 들어 있어요.',
      'TTFB가 길다면 응답에 [[server-timing]] 헤더를 넣어 서버 안에서 어디가 느린지 드러내 보세요. DevTools에 서버 구간별 시간이 함께 표시돼요.',
    ),
    sources: [
      { label: 'MDN: Time to first byte', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Time_to_first_byte' },
      { label: 'MDN: Server-Timing', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing' },
      {
        label: 'MDN: Populating the page: how browsers work',
        url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work',
      },
    ],
  },
];
