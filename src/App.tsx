import type { SchedulerWorkspace } from "./workspace/SchedulerWorkspace";

type AppProps = Readonly<{
  workspace: SchedulerWorkspace;
}>;

export function App({ workspace }: AppProps) {
  const state = workspace.getState();

  return (
    <div className="app-shell" data-screen={state.screen}>
      <header className="site-header">
        <a className="brand" href="/" aria-label="메했니? 홈">
          <span className="brand-mark" aria-hidden="true">
            했
          </span>
          <span>메했니?</span>
        </a>
        <span className="service-scope">KMS 전용 서비스</span>
      </header>

      <main className="welcome">
        <section className="welcome-copy" aria-labelledby="welcome-title">
          <p className="eyebrow">내 캐릭터의 반복 일정을 한눈에</p>
          <h1 id="welcome-title">메했니?</h1>
          <p className="tagline">메이플 스케줄러 자동 체크</p>
          <p className="intro">
            여러 캐릭터의 일간·주간 스케줄러를 놓치지 않도록, 남은 일을
            빠르게 모아보세요.
          </p>
        </section>

        <aside className="preview-card" aria-label="서비스 준비 안내">
          <div className="preview-icon" aria-hidden="true">
            ✓
          </div>
          <div>
            <p className="preview-title">시작할 준비가 되었어요</p>
            <p className="preview-description">
              내 계정의 스케줄러만 안전하게 확인하는 첫 단계를 준비하고
              있습니다.
            </p>
          </div>
        </aside>
      </main>

      <footer className="site-footer">
        <p>Data based on NEXON Open API</p>
        <p>넥슨의 공식 서비스가 아닙니다</p>
      </footer>
    </div>
  );
}
