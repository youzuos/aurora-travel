# Final Fix Report

- 状态：DONE
- commit hash：TBD

## 修改文件列表

- `app/page.tsx`
- `components/CompanionBubble.tsx`
- `components/CompanionChat.tsx`
- `components/CompanionStatus.tsx`
- `lib/companion.ts`
- `tests/companion.regression.test.ts`
- `tests/tsconfig.companion-tests.json`

## 运行的验证命令和结果摘要

1. `npx tsc -p tests/tsconfig.companion-tests.json`
   - 结果：PASS
   - 摘要：companion 回归脚本和相关逻辑文件通过独立 TypeScript 编译。

2. `node -e "const Module=require('module'); const path=require('path'); const root=path.resolve('.tmp-companion-tests'); const original=Module._resolveFilename; Module._resolveFilename=function(request,parent,isMain,options){ if(request.startsWith('@/')) request=path.join(root, request.slice(2)); return original.call(this, request, parent, isMain, options); }; require('./.tmp-companion-tests/tests/companion.regression.test.js');"`
   - 结果：PASS
   - 摘要：5 个 companion 关键回归检查全部通过，覆盖被动消息、不打开 unread 的 chat 模式、加速迁移、模糊目的地匹配、延迟回复合并、snippet 轮换。

3. `npm run build`
   - 结果：PASS
   - 摘要：Next.js production build 完成，静态页面生成和类型检查通过。

## Final Review Finding 修复说明

### 1. 自动迁移只在 hydration 时评估

- 在 `app/page.tsx` 增加 `focus`、`pageshow`、`visibilitychange` 的 companion 重评估。
- 打开 companion chat 时先执行 `maybeAdvanceCompanionLocation`。
- 在 `CompanionBubble` 的常驻定时器中也会先重评估迁移，再决定发 arrival 还是 passive status，因此 test mode 的加速在长驻 tab 中持续有效。

### 2. chat 打开时 passive activity 被完全丢弃

- `CompanionBubble` 不再在 `chatOpen=true` 时停止计时。
- chat 打开时，passive message 继续进入 `messageHistory`，但调用 `addPassiveCompanionMessage(..., { incrementUnread: false })`，所以不会弹浮动气泡，也不会增加 unread。
- chat 关闭时维持现有 bubble + unread 行为。

### 3. 目的地匹配只支持显式城市/国家

- 在 `lib/companion.ts` 增加 tag-based vague destination 规则，顺序为：显式 city/country keyword -> tags -> fallback。
- 已覆盖 reviewer 示例方向：
  - 海边/海/港口/码头 -> `harbor/canal/river`
  - 山/雪山/湖 -> `mountain/lake`
  - 极光/夜空 -> `aurora`
  - 秋天/森林 -> `autumn/forest`
  - 吃的/美食/甜点 -> `food/cafe/chocolate`
  - 安静/寺庙/樱花 -> `quiet/temple/blossom`
- fallback 文案也更新为允许用户继续用“海边/山里/极光”等方式澄清。

### 4. `CompanionChat` 延迟回复使用 stale state

- `CompanionChat` 现在保存 pending timer ref，并在 close / change character / unmount 时清理。
- 用户消息仍然立即入列，agent reply 仍然保持 520ms 左右短延迟。
- 延迟提交不再用旧 `result.state` 直接覆盖，而是用 `mergeGeneratedReplyState` 基于 latest state 追加 reply message，保留期间发生的 `testMode` 切换或其他新状态。

### 5. 当前城市文本太静态

- 在 `lib/companion.ts` 为 Kyoto / Osaka / Nara / Paris 增加多条 `status / food / people / scenery / photo` 轮换文案。
- `messageForIntent` 现在对 `status / food / people / scenery / photo` 都使用 `pickByCursor`，不再硬编码 `[0]`。
- `arrival` 仍保留固定第一条。

## Minor 修复说明

- `CompanionStatus` 头像增加 initials + gradient fallback。
- `CompanionChat` photo card 增加 `onError` fallback；图片加载失败时仍显示 caption / credit，并展示“城市照片暂时不可用”文案。

## Concerns

- 无额外 concerns。
