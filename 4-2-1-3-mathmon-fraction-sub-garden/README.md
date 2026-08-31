# 매스몬 분수 빼기 정원

## 차시 계약

- 차시: `4-2-1-3` · 매스몬 분수 빼기 정원
- 공식 팩: `mathmon-grade4-official-pack-v1`
- 주인공: `mathmon-grade4-03-tapir` · 동글맥몬
- 승인: `approval:mathmon-grade4-official-pack-v1:20260829`
- 실행 캔버스: `1280x800` (16:10)
- 문항: 10개 · 선택지 4개 · `directInteraction`

분모가 같은 분수는 분모를 그대로 두고 분자끼리 뺍니다. 1은 같은 분모의 분수로 바꿔 계산하고, 정답을 고른 뒤 그림과 식으로 확인합니다. 학생 화면에는 내부 힘·점수와 순위 기능을 표시하지 않습니다.

## 보상과 결과

보상은 `mathmon-unified-reward-v2`의 `stage-reveal` 흐름입니다. 결과는 `첫 화단`, `새싹 정원`, `꽃길 정원`, `빛나는 온실`, `황금 정원`, `무지개 정원` 여섯 단계입니다. 모든 결과 장면은 동글맥몬 한 마리와 정원 장면을 포함한 전용 생성 이미지이며, 제목은 독립 투명 래스터 자산입니다.

## 자산 증거

- [결과 6상태](result-states-contact-sheet.png)
- [문제 진행 6상태](play-progress-states-contact-sheet.png)
- [보상 닫힘과 6사건](reward-states-contact-sheet.png)
- [결과 제목 6상태](result-title-states-contact-sheet.png)

생성 원본은 source `assets/`와 `assets/generation-lineage.json`에 보존하고, 학생 실행본에는 PNG/WebP만 연결합니다. 원본·runtime SHA-256은 lineage와 정적 검사에서 대조합니다.

## 정적 검증 단계

브라우저 전체 흐름은 `desktop`, `tablet-landscape`, `reported-design-feedback-1079x842`에서 23상태씩 총 69장 확인했으며, 영수증은 `screenshots/mathmon-browser-qa-receipt.json`에 기록했습니다. 상단 조작은 `stage-top-controls-v2` 기준(배지 14px, 문제 번호 16px)을 사용합니다.
