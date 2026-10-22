export type Source = { label: string; url: string };

/** up = 클라이언트 → 서버, down = 서버 → 클라이언트 */
export type LogicalMessage = { label: string; direction: 'up' | 'down' };

/** icon은 lucide-react 컴포넌트 이름. Step의 nodes는 항상 폰 쪽(왼쪽) → 서버 쪽(오른쪽) 순서로 둔다. */
export type PhysicalNode = { id: string; label: string; icon: string };

export type Step = {
  index: number;
  slug: string;
  title: string;
  summary: string;
  ms: number;
  provisional: boolean;
  messages: LogicalMessage[];
  /** 폰 쪽 → 서버 쪽 순서. 패킷 점은 메시지 방향(up/down)에 따라 이 줄을 오간다. */
  nodes: PhysicalNode[];
  /** [[key]] 용어 마커 포함, 2~4문장 */
  body: string;
  deeper: string;
  practice?: string;
  sources: Source[];
};
