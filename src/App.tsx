import { useState, useSyncExternalStore } from "react";
import type { SchedulerWorkspace } from "./workspace/SchedulerWorkspace";

type AppProps = Readonly<{
  workspace: SchedulerWorkspace;
}>;

export function App({ workspace }: AppProps) {
  const state = useSyncExternalStore(workspace.subscribe, workspace.getState, workspace.getState);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

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

        <section className="connection-card" aria-labelledby="connection-title">
          {state.screen === "api-key-connected" ? <>
            <h2 id="connection-title">API 키 연결 완료</h2>
            <p role="status">{state.source === "stored" ? "이 브라우저에 저장된 API 키가 연결되어 있습니다." : `계정 캐릭터 ${state.characterCount ?? 0}개를 확인했습니다.`}</p>
            <p>다음 단계에서 활성 추적 캐릭터를 선택할 수 있습니다.</p>
          </> : <>
            <h2 id="connection-title">내 계정 연결하기</h2>
            <p>본인의 KMS 계정을 조회할 수 있는 API 키를 입력해 주세요.</p>
            <p>넥슨 Open API에서 로그인한 뒤 애플리케이션을 등록하고 메이플스토리 API 키를 발급받아 복사해 주세요.</p>
            <a href="https://openapi.nexon.com/ko/guide/prepare-in-advance/" target="_blank" rel="noreferrer">넥슨 공식 API 키 발급 안내 ↗</a>
            <p className="storage-notice" id="storage-notice">검증된 API 키는 이 브라우저에 평문으로 저장됩니다. 공용 기기에서는 사용하지 마세요. 키는 넥슨 API로만 직접 전송되며 서비스 서버에 저장되지 않습니다.</p>
            <form onSubmit={(event) => {
              event.preventDefault();
              void workspace.connectApiKey(apiKey).then(() => {
                if (workspace.getState().screen === "api-key-connected") setApiKey("");
              });
            }}>
              <label htmlFor="api-key">사용자 API 키</label>
              <div className="key-field">
                <input id="api-key" type={showKey ? "text" : "password"} value={apiKey} onChange={(event) => setApiKey(event.target.value)} required autoComplete="off" spellCheck={false} aria-describedby="storage-notice" disabled={state.status === "validating"} />
                <button type="button" aria-pressed={showKey} onClick={() => setShowKey(!showKey)}>{showKey ? "API 키 숨기기" : "API 키 표시"}</button>
              </div>
              {state.error && <p role="alert" className="connection-error">{state.error.message} <small>오류 코드: {state.error.code}</small></p>}
              <button className="connect-button" disabled={state.status === "validating"} type="submit">{state.status === "validating" ? "확인 중…" : "연결하기"}</button>
              {state.status === "validating" && <p role="status">API 키를 확인하고 있습니다.</p>}
            </form>
          </>}
        </section>
      </main>

      <footer className="site-footer">
        <p>Data based on NEXON Open API</p>
        <p>넥슨의 공식 서비스가 아닙니다</p>
        <a href="https://github.com/hyunbeomlee1227-dev/mapleDidyouDoit/issues">문제 문의 (API 키를 작성하지 마세요)</a>
      </footer>
    </div>
  );
}
