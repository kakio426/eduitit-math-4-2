# 4-2 공식 후보팩 기술 QA

상태: `active-approved` · 사용자 최종 스타일 승인 완료 · `approvalId: approval:mathmon-grade4-official-pack-v1:20260829` · `usedBy: []`

10종 PNG 전수 기술 검수 완료: RGBA 768×768, bounds 70~82%, corner alpha 0, green fringe 0. 사용자 승인용 검수판은 `approval-review-manifest.json`의 manifest exact 10개 캐릭터만 사용하며 `foreignCharacterCount: 0`이다. 컬러·검은 실루엣·96px 카드 시트는 각각 `full-pack-contact-sheet.png`, `full-pack-silhouette-sheet.png`, `full-pack-card-size-sheet.png`다. 제목은 `4학년 2학기 후보 10종`과 모드명을 포함하며 모든 실루엣은 컬러판과 동일한 5열×2행 셀의 contain 영역에 표시된다.

승인판 시트 SHA-256: 컬러 `c2431b01a7257fde4f61b561106b3de567493fb6432ba2ec631129c218573d24`, 검은 실루엣 `3095e8c4732d91fd0f5663de3d14deeb3c3d875e48b12c514d46528031d48c65`, 96px 카드 `08675975941a655962eb66ee48e42af09a6f987fb0f82c961154b4bcc6ce0f9c`.

전역 review sheets는 기존 base/robot/griffin/dragon 및 차시 보상 캐릭터가 포함된 내부 충돌 감사용이며 사용자 팩 승인판으로 제시하지 않는다. `STYLE_GUIDE.md` 부재로 `MATHMON_ASSET_CONTRACT.md`와 catalog policy를 fallback 기준으로 사용했다. 사용자 승인은 완료했으나 24개 lesson 구현은 아직 대기 중이다.
