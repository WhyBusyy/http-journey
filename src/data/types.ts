export type Source = { label: string; url: string };

/** up = 클라이언트 → 서버, down = 서버 → 클라이언트 */
export type LogicalMessage = { label: string; direction: 'up' | 'down' };

/** icon은 lucide-react 컴포넌트 이름 */
export type PhysicalNode = { id: string; label: string; icon: string };

export type Step = {
  index: number;
  slug: string;
  title: string;
  summary: string;
  ms: number;
  provisional: boolean;
  messages: LogicalMessage[];
  /** 패킷이 지나는 순서대로 */
  nodes: PhysicalNode[];
  /** [[key]] 용어 마커 포함, 2~4문장 */
  body: string;
  deeper: string;
  practice?: string;
  sources: Source[];
};
