# 매스몬 분수 변신 금고

## 차시 계약

- 차시: `4-2-1-4` · 매스몬 분수 변신 금고
- 공식 팩: `mathmon-grade4-official-pack-v1`
- 주인공: `mathmon-grade4-04-kingfisher` · 물총새몬
- 승인: `approval:mathmon-grade4-official-pack-v1:20260829`
- 문항: 10개 · 선택지 4개 · `directInteraction`
- 실행 캔버스: `1280x800` (16:10)
- 네트워크 없음 · 순위 없음 · 내부 힘/점수 표시 없음

대분수를 가분수로 바꾸고, 하나를 빌려 받아내림이 있는 분수의 뺄셈을 계산합니다. 교과서와 익힘책 PDF는 evidence-only이며 학생 실행 자산으로 복사하지 않습니다.

## 학생 흐름과 보상

정답 경로는 `선택지 → 금고 안 보기 → 금고 문을 열어 봐요 → 다음`의 정확한 4탭입니다. 오답은 같은 문제에서 다시 고르고, 증명은 정답 뒤에만 보입니다.

결과는 `작은 열쇠`, `구리 금고`, `은빛 금고`, `사파이어 금고`, `황금 금고`, `무지개 금고` 6단계입니다. 보상 자산은 닫힘과 normal/loss/mega/jackpot/keep/special 7상태입니다.

## 생성 자산과 검수 경로

- 문제 진행 6상태: `play-progress-states-contact-sheet.png`
- 문제 진행 생성 원본·source/anchor audit: `play-progress-states-contact-sheet.png`
- 보상 7상태: `reward-states-contact-sheet.png`
- 결과 6상태: `result-states-contact-sheet.png`
- 결과 제목 6상태: `result-title-states-contact-sheet.png`
- 결과 장면 주 보상 경계 audit: `assets/result-states-contact-sheet.audit.json`
- 생성 계보: `../_lessons/4-2-1-4-mathmon-fraction-regroup-vault/assets/generation-lineage.json`

문제 진행은 `768x1536`, 결과 장면은 `1280x800`, 보상은 `512x512` 생성 PNG/WebP입니다. 결과 패널 detector search ROI는 `{x:839,y:90,width:390,height:640}`이고 axis는 `1034`입니다. 보드 스캔도 이 native inner ROI의 `scanStartRatio=0.65546875`, `scanEndRatio=0.96015625`를 사용해 장식 외곽 프레임을 제외합니다. 여섯 결과의 주 보상/world bounds는 패널 경계 직전의 실제 좌측 영역 `{x:0,y:0,width:839,height:800}`으로 동일하며, 근거는 `result-states-contact-sheet.audit.json`에 고정했습니다. 결과 장면은 6단계 모두 독립 생성되며 패널 내부는 비어 있습니다.

## 현재 단계

정적 통합, 자산 연결, 빌드 및 정적 계약 검사를 완료했습니다. 최신 전체 브라우저 QA도 선언된 3개 viewport에서 PASS했으며, 최종 delivery gate는 아직 대기 중입니다.

브라우저 QA 시도 상태

최신 실행은 `node scripts/build-lesson.mjs 4-2-1-4-mathmon-fraction-regroup-vault` 뒤 `node scripts/qa-lesson-flow.mjs 4-2-1-4-mathmon-fraction-regroup-vault`이며 `QA_LESSON_FLOW: PASS`였습니다. 3개 viewport(desktop, tablet-landscape, reported-design-feedback-1079x842), 87개 캡처, 오답 재시도·10문항 정답 경로·reward 전환·6개 결과 tier·설정/retry를 포함합니다. 현재 영수증은 `screenshots/mathmon-browser-qa-receipt.json`, 상세 결과는 `.tmp-qa/mathmon/4-2-1-4-mathmon-fraction-regroup-vault/last-flow-results.json`입니다. 브라우저 QA는 PASS지만 최종 delivery PASS는 아직 주장하지 않습니다.

새 generated-runtime 계약 상태

실제 생성 계보(`assets/generation-lineage.json`)에는 생성 ID, prompt SHA, source/runtime SHA가 있습니다. 다만 이 작업본에서 확인 가능한 동시 호출 영수증의 task/turn/tool-event 묶음과 독립 provider registry 승격 record가 없고, authoritative registry도 `records: []`, `registrySeal: null`이므로 strict provenance는 보류입니다. 없는 값을 추정해 `assets/GENERATED_RUNTIME_PROVENANCE.json`을 PASS 형식으로 만들지 않았습니다. 이는 계약을 약화하지 않기 위한 의도적인 보류입니다.
