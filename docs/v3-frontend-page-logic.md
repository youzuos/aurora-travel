# Aurora v3.0 前端页面逻辑与重构草案

Updated: 2026-06-30

用途：在当前前端实现基础上，整理 v3.0 页面逻辑、组件职责和重构方向。此文件先作为产品/前端对齐稿，后续再按此实现代码。

## 0. 当前前端现状

当前项目是一个 Next.js 单页应用，核心页面在 `app/page.tsx` 中通过状态条件渲染。

当前已有能力：
- 顶部导航：`TopBar`
- 年度计划首页：`YearView`
- 年度计划编辑弹窗：`ChatOverlay`
- 单次旅行详情：`TripView`
- 时间推进：`TimeWarp`
- 成熟度概览：`MaturitySummary`
- 年度统计：`Stats`
- Agent 提醒卡片：`PriceAlert`
- 小精灵选择：`CompanionOnboarding`
- 小精灵状态条：`CompanionStatus`
- 小精灵灵感雷达：`CompanionInspirationRadar`
- 小精灵浮动入口：`CompanionBubble`
- 小精灵聊天抽屉：`CompanionChat`

当前主要状态：
- `hasPlan`: 是否已有年度计划，由 `trips.length > 0` 判断。
- `selectedTrip`: 是否进入某段旅行详情。
- `plannerOpen`: 是否打开年度规划编辑弹窗。
- `companionState`: 小精灵状态，存储在 `localStorage`。
- `companionChatOpen`: 是否打开小精灵聊天。
- `warp`: Time Warp 当前阶段。

当前问题：
- 无计划首页仍混有 v2.2 的旧空状态和 v3.0 的小精灵雷达，主流程不够清楚。
- 缺少首次明确问题：「今年你有没有一定要去旅行的地方？」
- 灵感发现没有 5 次探索机会机制。
- `YearView` 内部仍自带旧空状态，不利于 v3.0 分流。
- `CompanionInspirationRadar` 已能探索地点，但按钮语义偏「加入本次旅行清单」，无计划时应是「加入年度心愿夹」。
- `ChatOverlay` 目前是边界条件表单，但应被重命名/定位为「规划生成器」或「年度心愿与边界条件编辑器」，不应再承担首次灵感发现职责。
- 中文文案存在乱码，需要作为重构前置清理项。

## 1. v3.0 前端总状态机

建议把首页从简单的 `hasPlan / selectedTrip` 条件渲染，重构为更明确的 product state。

```ts
type HomeStage =
  | "entry-decision"
  | "direct-wishlist"
  | "inspiration-discovery"
  | "wishlist-review"
  | "generating-plan"
  | "year-view"
  | "trip-view";
```

状态进入规则：
- 如果已有 saved plan：进入 `year-view`。
- 如果没有 saved plan 且用户未回答首次问题：进入 `entry-decision`。
- 如果用户回答「有一定要去的地方」：进入 `direct-wishlist`。
- 如果用户回答「没有 / 还没想好」：进入 `inspiration-discovery`。
- 用户完成心愿收集后：进入 `wishlist-review`。
- 用户确认边界条件后：进入 `generating-plan`。
- 年度计划生成成功：进入 `year-view`。
- 用户点击某段旅行：进入 `trip-view`。

全局浮层：
- `CompanionOnboarding`: 仍可在首次使用时出现，但不应阻断主流程太久；可以作为轻量角色选择层。
- `CompanionBubble`: 全局浮动入口，有计划/无计划都可出现，但不得遮挡主按钮。
- `CompanionChat`: 全局聊天抽屉，负责陪伴和问答，不替代灵感发现主流程。
- `ChatOverlay` / Planner: 作为年度心愿和边界条件编辑器，可从多个入口打开。

## 2. 页面 1：首次进入 / 状态判断页

对应状态：`entry-decision`

页面目标：
- 用一个问题判断用户是「已有明确心愿」还是「需要灵感发现」。
- 避免用户一进来就看到复杂 dashboard。

呈现形式：
- 顶部品牌区：
  - Aurora
  - Travel by timing, not by luck.
  - Plan once. Refine all year.
- 中央单问题区域：
  - 主问题：「今年你有没有一定要去旅行的地方？」
  - 辅助文案：「可以是一个城市、一种风景，或者只是一个此生想看的画面。」
- 两个主要选择：
  - 「有，我来填写」
  - 「还没有，让小精灵去看看」
- 小精灵可作为视觉陪伴出现，但不要喧宾夺主。

组件建议：
- 新增 `EntryDecision`
- 从 `YearView` 中移除无计划空状态，让无计划状态由 `EntryDecision` 和 `InspirationDiscovery` 承担。

交互：
- 点击「有，我来填写」：进入 `direct-wishlist`。
- 点击「还没有，让小精灵去看看」：进入 `inspiration-discovery`。
- 如果检测到 saved plan：不展示此页，直接 `year-view`。

## 3. 页面 2：直接填写年度心愿

对应状态：`direct-wishlist`

页面目标：
- 用户已经知道想去哪，快速输入心愿。
- 不让用户先填复杂边界条件。

呈现形式：
- 主输入框：
  - 「写下你今年一定想去的地方 / 想看的风景」
  - 示例：京都樱花、冰岛极光、新疆胡杨、想去海边。
- 支持一次输入多个心愿。
- 心愿即时转成列表：
  - 名称。
  - 来源：用户输入。
  - 优先级：必去 / 想去 / 随缘。
- 底部按钮：
  - 「继续补充边界条件」
  - 「让小精灵再帮我找几个灵感」

组件建议：
- 可以复用 `ChatOverlay` 的 wishlist step，但最好拆成独立 `WishlistCollector`。
- `ChatOverlay` 后续只负责 modal 编辑，不承担首屏主页面。

交互：
- 添加心愿：写入年度心愿夹 draft。
- 调整优先级：更新 draft。
- 点击继续：进入 `wishlist-review`。
- 点击让小精灵找灵感：进入 `inspiration-discovery`，保留已有 draft 心愿。

## 4. 页面 3：灵感发现首页

对应状态：`inspiration-discovery`

页面目标：
- 用户没有明确想去哪里时，通过小精灵探索激发心愿。
- 用户最多派小精灵探索 5 次。
- 如果 5 次都没选，系统随机指定一个目的地，避免流程停住。

呈现形式：
- 页面主模块是「派小精灵探路」互动区，而不是普通聊天框。
- 顶部说明：
  - 「派小精灵去为你寻找世界上最值得去旅行一次的地方」
  - 「你有 5 次探索机会」
- 探索次数指示：
  - `第 1 / 5 次探索`
  - 或 5 个点状进度。
- 输入区：
  - placeholder: 「输入城市、国家、地区或旅行偏好，也可以留空随机出发」
  - chips：海边、雪山、美食、小众古城、极光、樱花。
- 操作按钮：
  - 「派小精灵出发」
  - 「随机出发」
  - 「继续附近探索」
- 结果区：
  - 旅行见闻卡片。

见闻卡片呈现：
- 城市 / 国家。
- 小精灵当前状态。
- 城市图片 / 明信片。
- 小精灵见闻文案。
- 标签。
- 如果是附近探索，显示距离。
- 操作：
  - 「加入年度心愿夹」
  - 「换个方向」
  - 「继续附近探索」

当前组件映射：
- 基于现有 `CompanionInspirationRadar` 重构。
- 增加 props/state：
  - `attemptCount`
  - `maxAttempts = 5`
  - `mode = "annual-wishlist" | "trip-wishlist"`
  - `onExhaustedWithoutChoice`
- 文案从「加入本次旅行清单」改为按场景变化：
  - 无计划：加入年度心愿夹。
  - Trip View：加入本次行程心愿夹。

交互：
- 用户加入：将 finding 转为 `WishlistItem`，进入 `wishlist-review`。
- 用户继续探索：attempt + 1。
- 第 5 次后仍未加入：
  - 系统随机选一个目的地。
  - 弹出确认文案：「我先帮你把 XX 放进心愿夹，你可以之后修改。」
  - 进入 `wishlist-review`。

## 5. 页面 4：年度心愿夹与边界条件确认

对应状态：`wishlist-review`

页面目标：
- 汇总所有心愿。
- 收集规划所需边界条件。
- 作为生成年度计划前的最后确认页。

呈现形式：
- 左侧/上方：年度心愿夹。
  - 心愿名称。
  - 来源：用户输入 / 小精灵推荐 / 系统随机指定 / legacy。
  - 优先级。
  - 删除 / 编辑。
- 右侧/下方：边界条件。
  - 年假天数。
  - 年度预算。
  - 计划旅行次数。
  - 单次旅行平均预算。
  - 不能旅行的具体日期。
- 日期选择仍使用现有年日历。
- 主按钮：
  - 「生成我的 2026 年度计划」

当前组件映射：
- 复用 `ChatOverlay` 的步骤表单能力。
- 建议重构为：
  - `PlanSetup`
  - `WishlistReview`
  - `BoundaryConditionsForm`
  - `UnavailableDateCalendar`

交互：
- 用户确认心愿和边界条件后进入 `generating-plan`。
- 编辑计划时也进入此页，但带入已有 profile。

## 6. 页面 5：Agent 生成中

对应状态：`generating-plan`

页面目标：
- 不显示简单 loading。
- 强化 Agent 协作的 demo 记忆点。

呈现形式：
- 居中生成面板或当前页面覆盖层。
- 流式显示 3-5 秒：
  - 时机 Agent：分析花期 / 极光 / 雪季 / 胡杨窗口。
  - 假期 Agent：计算法定节假日和年假拼接。
  - 综合 Agent：排序心愿、合并目的地、判断延期。
  - 提醒小助手：生成订票、天气、装备、预约节点。
- 每行有完成状态。

当前组件映射：
- 目前 `ChatOverlay` 只有按钮 loading。
- 建议新增 `AgentGenerationOverlay`。
- 生成完成后调用现有 `/api/plan` 或本地 fallback。

交互：
- 成功：进入 `year-view`。
- 失败：展示可恢复错误，允许重试或使用本地 fallback。

## 7. 页面 6：Year View 年度计划

对应状态：`year-view`

页面目标：
- 有计划后的首页主视图。
- 年度甘特图必须位于页面最上方的核心区域。

呈现形式：
- 顶部：年度标题、修改计划、清空计划。
- 第一核心模块：年度甘特图。
  - 横轴 1-12 月。
  - 每段旅行条。
  - 成熟度点：Sketch / Refining / Ready。
  - Deferred 心愿。
  - 不可出行冲突提示。
- 第二模块：年度概览。
  - 年假使用。
  - 预算使用。
  - 心愿覆盖。
  - 旅行次数。
- 第三模块：小精灵最近见闻。
  - 最近探索地点。
  - 推荐新地点或新体验。
  - 加入年度心愿夹。
  - 加入后提示「需要重新规划」。
- 后续模块：
  - Time Warp。
  - 成熟度 summary。
  - 提醒小助手 / Heads-up。

当前组件映射：
- `YearView`: 只保留有计划甘特图，不再负责无计划空状态。
- `Stats`: 年度概览。
- `CompanionInspirationRadar`: 有计划状态可降级为「最近见闻/继续探索」模块。
- `PriceAlert`: v3.0 应重命名为 `HeadsUpAlerts` 或 `ReminderAssistant`。

交互：
- 点击旅行条：进入 `trip-view`。
- 点击修改计划：进入 `wishlist-review` 或打开 Planner。
- 点击小精灵见闻加入年度心愿夹：
  - 加入 draft wishlist。
  - 页面显示「计划需要重新生成」。
  - 用户确认后重新进入 `generating-plan`。

## 8. 页面 7：Trip View 单次旅行精修

对应状态：`trip-view`

页面目标：
- 将某段旅行从月级别计划推进到可执行的天粒度计划。
- 展示本次行程心愿夹。

呈现形式：
- 顶部：
  - 返回 Year View。
  - 目的地组合。
  - 日期范围。
  - 成熟度。
  - 年假消耗。
- 请假策略：
  - 方案 1：峰值优先。
  - 方案 2：提前出发。
  - 方案 3：假期拼接。
  - 日历标记公共假期、请假日、冲突日。
- 体验时机：
  - 花期 / 极光 / 雪季概率。
  - 扑空率。
  - 峰值窗口。
  - 备选窗口。
- 本次行程心愿夹：
  - 已加入地点 / 餐厅 / 景点。
  - 小精灵推荐的新见闻。
  - 操作：加入 Day X / 加入本次行程。
- 天粒度行程：
  - Day 1 / Day 2 / Day 3...
  - 每天地点、体验、交通或注意事项。
  - 下雨 / 闭馆 / 天气变化备选方案。
  - 目的地太少时：
    - 显示「自由探索时间」。
    - 提示「让小精灵继续找找附近值得去的地方」。
    - 提供「继续探路」按钮。

当前组件映射：
- `TripView` 已有：
  - peak chart。
  - price chart。
  - holiday leverage。
  - maturity timeline。
  - leave strategy。
- 待重构：
  - `PriceChart` 在 v3.0 中弱化为提醒小助手，不作为核心价格 Agent。
  - 新增 `DailyItinerary`.
  - 新增 `TripWishlist`.
  - 新增 `TripCompanionFindings`.

交互：
- 返回 Year View。
- 修改请假方案。
- 小精灵推荐加入本次行程。
- 如果本次行程变化较大，提示需要重新规划。

## 9. Time Warp 组件

页面目标：
- 让用户看到计划如何随时间变清晰。
- 不只改变颜色，也改变内容粒度。

呈现形式：
- 时间轴按钮或 slider：
  - 年初。
  - 出发前 3 月。
  - 出发前 1 月。
  - T-14。
- 当前状态指针。
- 左侧解释：模糊概率区间。
- 右侧解释：精准窗口。

内容变化：
- 年初：
  - Sketch。
  - 概率区间 / 大致季节 / 灵感层。
  - 小精灵见闻：为什么值得去。
- 出发前 3 月：
  - Refining。
  - 推荐月份 / 大致预算 / 组合路线。
  - 小精灵见闻：附近还能拼哪些地方。
- 出发前 1 月：
  - Refining 到 Ready。
  - 街区 / 景点 / 餐食 / 照片点。
  - 小精灵见闻：具体去哪、怎么安排更顺。
- T-14：
  - Ready。
  - 天气 / 预约 / 交通 / 打包 / 备选方案。
  - 小精灵见闻：临近出发提醒。

当前组件映射：
- `TimeWarp` 已有基本阶段。
- `CompanionInspirationRadar` 已接收 `warp`，可继续用于不同阶段文案。
- 还需要让 `TripView` 的天粒度内容和 heads-up 内容响应 `warp`。

## 10. 临近提醒 / Heads-up 模块

页面目标：
- v3.0 替代「价格 Agent」主叙事。
- 提醒用户何时行动，但不做比价和下单。

呈现形式：
- 横向提醒卡片或列表。
- 节点：
  - T-45：关注机票 / 酒店 / 签证 / 请假审批。
  - T-14：天气变化 / 景点开放 / 预约 / 交通。
  - T-3：装备清单 / 备用路线 / 最终确认。
- 状态：
  - 等待中。
  - 需要行动。
  - 已完成。

当前组件映射：
- `PriceAlert` 需要重命名和改语义。
- 保留价格提醒作为一个提醒类型，而不是独立价格 Agent 主叙事。

## 11. Companion Chat 与 Radar 分工

Companion Chat：
- 聊天、陪伴、问小精灵在做什么。
- 可以指派它去某地。
- 可以发照片、语音、故事。
- 不作为年度规划主表单。

Companion Inspiration Radar：
- 产品化探索入口。
- 负责生成见闻卡片。
- 负责把地点加入年度心愿夹或本次行程心愿夹。
- 有明确的 5 次探索限制和 fallback。

重构要求：
- `CompanionChat` 内可以嵌入 compact Radar，但应明确这是「派它去看看」操作区。
- 首页无计划时使用 full Radar。
- Trip View 使用 trip-scoped Radar。

## 12. 文案与编码清理

当前多个组件中文显示为 mojibake。v3.0 重构前应优先清理：
- `app/page.tsx`
- `YearView.tsx`
- `ChatOverlay.tsx`
- `CompanionInspirationRadar.tsx`
- `CompanionOnboarding.tsx`
- `CompanionStatus.tsx`
- `CompanionChat.tsx`
- `TripView.tsx`
- `TimeWarp.tsx`
- `PriceAlert.tsx`

原则：
- 中文 copy 必须正常显示。
- 保留英文版本。
- 将散落 copy 逐步集中到 `copy` 配置或组件内稳定常量。

## 13. 建议实施顺序

P0：
1. 清理中文乱码。
2. 新增 `EntryDecision`。
3. 从 `YearView` 移除无计划空状态。
4. 重构 `CompanionInspirationRadar` 支持 5 次探索和年度心愿夹模式。
5. 建立 `WishlistReview` 页面/状态。
6. 将 `CompanionFinding` 转 `WishlistItem` 的入口接到年度心愿夹。
7. 更新 `app/page.tsx` 为明确 `HomeStage` 状态机。

P1：
1. 新增 `AgentGenerationOverlay`。
2. Year View 增加小精灵最近见闻和「计划需重新生成」状态。
3. Trip View 新增本次行程心愿夹。
4. Trip View 新增天粒度行程。
5. `PriceAlert` 重构为 `HeadsUpAlerts`。

P2：
1. Trip-scoped Companion Radar。
2. 选择某个请假策略并保存。
3. 真实 NOAA / 天气 API 接入。
4. 更完整多目的地拼接。
5. 更完整移动端体验。

## 14. 最小验收标准

无计划状态：
- 用户先看到「今年有没有一定要去旅行的地方」。
- 选择「没有」后进入 5 次小精灵探索。
- 5 次内选择目的地可加入年度心愿夹。
- 5 次都不选时系统随机指定一个目的地。

有心愿但无计划：
- 用户可确认心愿优先级和边界条件。
- 可以生成年度计划。

有计划状态：
- Year View 甘特图在最上方。
- 小精灵见闻不会抢走主视图。
- 加入新心愿后提示需要重新规划。

Trip View：
- 能看到请假策略。
- 能看到天粒度行程占位。
- 目的地太少时提示继续探索或自由探索。

稳定性：
- 无外部 API key 也能跑。
- `npm run build` 通过。
- companion regression test 通过。
- 浏览器 console 无 error。
