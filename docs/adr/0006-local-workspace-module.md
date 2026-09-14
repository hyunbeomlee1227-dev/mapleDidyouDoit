---
status: accepted
---

# SchedulerWorkspace 뒤에 넥슨 해석과 로컬 저장을 집중

화면은 `SchedulerWorkspace` Module의 작은 Interface를 통해 API 키 연결, 캐릭터 선택, 상태 새로고침, 키 교체 및 전체 삭제를 수행한다. Module은 넥슨 원본 필드 해석, 완료 판정, 캐시, 누락 캐릭터 처리 및 로컬 데이터 마이그레이션을 Implementation 안에 숨긴다. 사용자 API 키와 작은 설정은 `localStorage`에, 캐릭터 구성과 마지막 수행 상태는 IndexedDB에 저장한다.

넥슨 API는 우리가 제어하지 않는 외부 시스템이므로 Module 내부 seam에 구체적인 넥슨 호출 Interface를 두고 브라우저 `fetch` Adapter와 테스트 Adapter를 제공한다. 브라우저 저장소에도 실제 Adapter와 메모리 테스트 Adapter를 둔다. 화면과 테스트는 넥슨 응답 구조나 저장소 종류를 직접 알지 않으며 `SchedulerWorkspace` Interface에서 관찰되는 동작만 사용한다.
