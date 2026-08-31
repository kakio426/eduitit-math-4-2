# 매스몬 분수 조각 공방

## 제작·자산 계약

- 공식 팩: `mathmon-grade4-official-pack-v1` · `4학년 2학기 공식 후보 매스몬팩`
- 승인: `approval:mathmon-grade4-official-pack-v1:20260829`
- 차시 주인공: `mathmon-grade4-01-sugar-glider` · 하늘주머니몬
- 실행 캔버스: `1280x800` (16:10), 문항 10개
- 교과서: 인쇄본 10–11쪽 / PDF 22–23쪽
- 익힘: 인쇄본 6–7쪽 / PDF 24–25쪽
- 성취기준: `[4수01-15]`
- 다른 차시 캐릭터와 로봇은 사용하지 않았습니다. 네트워크와 순위판은 사용하지 않습니다.

## 시각 증거

기존 승인 팩과 차시 실행 PNG를 배열한 증거 시트입니다. 새 학생용 아트를 만들거나 바꾸지 않았습니다.

- [결과 6단계](result-states-contact-sheet.png)
- [문제 진행 6상태](play-progress-states-contact-sheet.png)
- [보상 닫힘+6사건](reward-states-contact-sheet.png)
- 결과 상태 메타데이터: `result-states-contact-sheet.png` (source lesson `assets`와 동일한 파일)

## 실행 계약

보상은 `mathmon-unified-reward-v2`의 `stage-reveal` 흐름을 사용합니다. 오답은 50% 확률의 제한된 감점 또는 유지이며, 학생 화면에는 힘 숫자를 표시하지 않습니다. 결과는 첫 조각·맞춤 틀·완성 모양·빛나는 공방·황금 공방·무지개 공방의 6단계입니다.

브라우저 흐름은 desktop, tablet-landscape, reported-design-feedback-1079x842의 3 viewport에서 전수 확인합니다. 현재 실행 증거는 `screenshots/mathmon-browser-qa-receipt.json`과 `screenshots/report-evidence-manifest.json`에 기록됩니다.

정적 화면 계약은 `generated-result-fullscene-v3`, 상단 조작은 `stage-top-controls-v2`이며 기준 글자 크기는 배지 14px, 문제 번호 16px입니다. 실행은 `directInteraction`으로 선택지를 누르는 즉시 판정합니다.
