# 이슈 트래커: GitHub

이 저장소의 이슈와 명세는 GitHub Issues에서 관리한다. 모든 작업에는 `gh` CLI를 사용한다.

## 규칙

- **이슈 생성**: `gh issue create --title "..." --body "..."`
- **이슈 조회**: `gh issue view <번호> --comments`로 댓글과 라벨을 함께 확인한다.
- **이슈 목록**: `gh issue list --state open --json number,title,body,labels,comments`를 사용하고 필요에 따라 라벨과 상태를 제한한다.
- **댓글 작성**: `gh issue comment <번호> --body "..."`
- **라벨 추가 및 제거**: `gh issue edit <번호> --add-label "..."` 또는 `--remove-label "..."`
- **이슈 종료**: `gh issue close <번호> --comment "..."`

저장소는 `git remote -v`에서 확인한다. GitHub 저장소 안에서 실행하면 `gh`가 현재 저장소를 자동으로 사용한다.

## Pull Request를 트리아지 요청으로 사용할지 여부

**PR을 요청 접수 경로로 사용하지 않는다.** 외부 PR을 기능 요청으로 함께 트리아지하려면 이 값을 나중에 변경할 수 있다.

GitHub에서는 이슈와 PR이 번호 공간을 공유한다. `#42`처럼 종류가 불분명하면 `gh pr view 42`를 먼저 확인하고 실패할 경우 `gh issue view 42`를 사용한다.

## 스킬이 이슈 트래커 게시를 요구할 때

GitHub Issue를 생성한다.

## 스킬이 관련 티켓 조회를 요구할 때

`gh issue view <번호> --comments`를 실행한다.

## Wayfinder 운영

- **맵**: `wayfinder:map` 라벨이 붙은 단일 이슈로 Notes, Decisions-so-far, Fog를 관리한다.
- **하위 티켓**: GitHub 하위 이슈로 맵에 연결한다. 하위 이슈 기능을 사용할 수 없으면 맵의 작업 목록과 하위 티켓 본문의 `Part of #<맵 번호>`로 연결한다.
- **하위 티켓 라벨**: 작업 성격에 따라 `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, `wayfinder:task`를 사용한다.
- **차단 관계**: GitHub의 기본 이슈 의존성을 사용한다. 사용할 수 없으면 본문 상단에 `Blocked by: #<번호>`를 기록한다.
- **다음 작업 선택**: 열려 있고 담당자와 열린 차단 항목이 없는 첫 번째 하위 티켓을 선택한다.
- **선점**: 작업을 시작할 때 `gh issue edit <번호> --add-assignee @me`로 자신을 지정한다.
- **완료**: 답변을 댓글로 남기고 이슈를 닫은 뒤 맵의 Decisions-so-far에 결과 링크를 추가한다.
