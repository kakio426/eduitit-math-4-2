# 매스몬 분수 합체 다리

## 차시 계약

- 차시: `4-2-1-2` · 매스몬 분수 합체 다리
- 공식 팩: `mathmon-grade4-official-pack-v1`
- 주인공: `mathmon-grade4-02-bison` · 들소몬
- 승인: `approval:mathmon-grade4-official-pack-v1:20260829`
- 성취기준: `[4수01-15]`
- 실행 캔버스: `1280x800` (16:10)
- 문항: 10개 · 선택지 4개 · `directInteraction`
- 교과서: 인쇄 12–13쪽 / PDF 26–27쪽, 인쇄 16–17쪽 / PDF 34–35쪽
- 익힘: 인쇄 8–9쪽 / PDF 28–29쪽, 인쇄 12–13쪽 / PDF 36–37쪽

분모가 같은 분수를 더할 때 분모는 그대로 두고 분자를 더합니다. 가분수가 되면 대분수로 바꾸며, 정답을 고른 뒤 그림과 식으로 확인합니다. 학생 화면에는 힘·점수·확률 같은 내부 값과 네트워크·순위 기능을 표시하지 않습니다.

## 보상과 결과

보상은 `mathmon-unified-reward-v2`의 `stage-reveal` 흐름입니다. 정답 확인 뒤 `다리 뒤 보기`를 누르고, 닫힌 보상에서 `다리 뒤를 열어 봐요`를 누르면 이번 변화가 공개됩니다. 다음 행동은 `다음` 또는 마지막 문제의 `결과 보기`입니다.

결과 단계는 `첫 교각`, `맞춘 다리`, `이어진 다리`, `빛나는 대교`, `황금 대교`, `무지개 대교` 여섯 가지입니다. 결과 장면에는 들소몬만 사용하며 다른 차시 캐릭터·로봇·외부 네트워크·순위판은 없습니다.

## 자산 증거

- [결과 6상태](result-states-contact-sheet.png)
- [문제 진행 6상태](play-progress-states-contact-sheet.png)
- [보상 닫힘과 6사건](reward-states-contact-sheet.png)
- [결과 제목 6상태](result-title-states-contact-sheet.png)

차시 source `assets/`와 출력 실행본의 자산 SHA-256을 빌드·증거 검사에서 대조합니다. 원본 생성 자산은 학생 화면에 직접 노출하지 않습니다.

## 브라우저 확인

desktop 1280×800, tablet-landscape 1024×768, reported-design-feedback-1079x842 1079×842의 세 viewport에서 전체 흐름을 확인합니다. 요구 상태는 viewport당 23개, 전체 69장입니다. 최신 영수증과 자동 증거는 `screenshots/mathmon-browser-qa-receipt.json`, `screenshots/report-evidence-manifest.json`에 기록합니다.
