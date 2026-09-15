import { useState } from "react";
import type { SchedulerWorkspace, SchedulerWorkspaceState } from "./workspace/SchedulerWorkspace";

type Props = Readonly<{ workspace: SchedulerWorkspace; state: Extract<SchedulerWorkspaceState, { screen: "api-key-connected" }> }>;

export function CharacterSelection({ workspace, state }: Props) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selectedIds = state.selectedIds ?? [];
  const characters = state.characters ?? [];
  const run = (action: () => Promise<void>) => {
    setBusy(true);
    void action().finally(() => setBusy(false));
  };

  return <div className="character-selection">
    <h3>{state.selectionPhase === "review" ? "선택 결과 검토" : "활성 추적 캐릭터 선택"}</h3>
    <p>최대 10개를 선택하세요. 비활성 캐릭터는 목록에 남지만 스케줄러 조회에서 제외됩니다.</p>
    {state.selectionError && <p role="alert" className="connection-error">{state.selectionError}</p>}
    {state.selectionPhase === "confirmed" && <p role="status">활성 추적 선택을 확정했습니다. 첫 동기화 기능은 다음 단계에서 제공됩니다.</p>}
    <fieldset disabled={busy}>
      <legend>계정 캐릭터 ({characters.length}개)</legend>
      {characters.length === 0 && <p>계정 캐릭터가 없습니다. KMS 캐릭터가 있는 계정의 API 키인지 확인해 주세요.</p>}
      <ul className="account-characters">{characters.map(character => <li key={character.id}>
        <label className="character-option"><input type="checkbox" checked={selectedIds.includes(character.id)} aria-label={`${character.name} 활성 추적`} onChange={event => run(() => workspace.setCharacterActive(character.id, event.target.checked))} /><span><strong>{character.name}</strong><small>{character.world} · {character.className} · Lv.{character.level}</small><small>{selectedIds.includes(character.id) ? "활성 추적" : "비활성 · 스케줄러 조회 제외"}</small></span></label>
      </li>)}</ul>
      <h4>활성 추적 순서 ({selectedIds.length}/10)</h4>
      <p className="order-help">드래그하거나 위·아래 버튼으로 순서를 바꿀 수 있습니다.</p>
      <ol data-testid="selected-characters" className="selected-characters">{selectedIds.map((id, index) => {
        const character = characters.find(candidate => candidate.id === id);
        if (!character) return null;
        return <li key={id} draggable={!busy} onDragStart={event => { setDraggedId(id); event.dataTransfer.setData("text/plain", id); event.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => setDraggedId(null)} onDragOver={event => { if (draggedId) event.preventDefault(); }} onDrop={event => { event.preventDefault(); if (draggedId) run(() => workspace.moveCharacter(draggedId, index)); setDraggedId(null); }}>
          <span>{index + 1}. {character.name}</span><div className="order-buttons"><button type="button" aria-label={`${character.name} 위로`} disabled={index === 0} onClick={() => run(() => workspace.moveCharacter(id, index - 1))}>위 ↑</button><button type="button" aria-label={`${character.name} 아래로`} disabled={index === selectedIds.length - 1} onClick={() => run(() => workspace.moveCharacter(id, index + 1))}>아래 ↓</button></div>
        </li>;
      })}</ol>
      {state.selectionPhase === "review" ? <><p>위 목록과 순서로 추적합니다. 선택하지 않은 캐릭터는 조회하지 않습니다. 수정하려면 선택 또는 순서를 변경하세요.</p><button type="button" className="connect-button" onClick={() => run(() => workspace.confirmSelection())}>이 선택으로 확정</button></> : state.selectionPhase !== "confirmed" && <button type="button" className="connect-button" disabled={!selectedIds.length} onClick={() => run(() => workspace.reviewSelection())}>선택 결과 검토</button>}
    </fieldset>
  </div>;
}
