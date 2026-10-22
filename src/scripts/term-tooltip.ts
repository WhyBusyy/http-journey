// 용어 툴팁을 마우스를 올린(또는 focus한) 칩 바로 아래에 띄우고, 화면 밖으로 나가지 않게 민다.
const GAP = 6;
const EDGE = 8;

function place(term: HTMLElement, pointer?: { x: number; y: number }) {
  const tip = term.querySelector<HTMLElement>('[role="tooltip"]');
  if (!tip) return;
  tip.classList.add('is-floating');

  // 칩이 줄바꿈으로 두 줄에 걸치면 포인터가 있는 줄을 기준으로 삼는다
  const rects = Array.from(term.getClientRects());
  const rect =
    (pointer && rects.find((r) => pointer.y >= r.top && pointer.y <= r.bottom && pointer.x >= r.left && pointer.x <= r.right)) ||
    rects[0];
  if (!rect) return;

  const { offsetWidth: w, offsetHeight: h } = tip;
  const left = Math.min(Math.max(rect.left, EDGE), window.innerWidth - w - EDGE);
  const below = rect.bottom + GAP;
  const top = below + h > window.innerHeight - EDGE ? rect.top - h - GAP : below;
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

document.addEventListener('pointerover', (e) => {
  const term = (e.target as Element).closest<HTMLElement>('.term');
  if (term) place(term, { x: e.clientX, y: e.clientY });
});

document.addEventListener('focusin', (e) => {
  const term = (e.target as Element).closest<HTMLElement>('.term');
  if (term) place(term);
});

const reposition = () => {
  const open = document.querySelector<HTMLElement>('.term:hover, .term:focus-within');
  if (open) place(open);
};
window.addEventListener('scroll', reposition, { passive: true });
window.addEventListener('resize', reposition);
