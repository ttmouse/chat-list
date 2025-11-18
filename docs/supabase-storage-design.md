# Supabase 存储与权限设计（插件：话术助手）

## 目标与原则
1. 公共话术库人人可读，少数管理员可发布与维护。
2. 个人话术库仅登录用户可读写；离线可用，自动与云端同步。
3. 不改变插件现有功能与交互，数据层渐进接入 Supabase。
4. 严格遵守 RLS，浏览器端仅使用 `anon key`；不在代码库提交任何私密密钥。

## 数据分层与表设计
### 公共库
- `public_catalog`
  - 字段：`id`(text pk)、`group_id`(text)、`title`(text)、`note`(text)、`content`(text)、`order_index`(int)、`version`(int)、`tags`(json)、`lang`(text)、`is_active`(bool)、`created_at`、`updated_at`、`created_by`(uuid)、`updated_by`(uuid)
  - 索引：`group_id`、`updated_at`、`order_index`、`is_active`
- `chat_groups_public`
  - 字段：`id`(text pk)、`name`(text)、`color`(text)、`order_index`(int)、`created_at`、`updated_at`
  - 索引：`order_index`

### 私有库（按用户）
- `user_scripts`
  - 字段：`id`(text pk)、`user_id`(uuid)、`group_id`(text)、`title`(text)、`note`(text)、`content`(text)、`order_index`(int)、`usage_count`(int)、`tags`(json)、`lang`(text)、`created_at`、`updated_at`
  - 索引：`user_id`、`user_id + group_id`、`user_id + updated_at`
- `chat_groups_user`
  - 字段：`id`(text pk)、`user_id`(uuid)、`name`(text)、`color`(text)、`order_index`(int)、`created_at`、`updated_at`
  - 索引：`user_id`、`order_index`

### 发布申请与审核
- `publish_requests`
  - 字段：`id`(text pk)、`user_id`(uuid)、`source_script_id`(text)、`payload`(json)（拟发布的数据）、`status`(enum: pending/approved/rejected)、`review_notes`(text)、`created_at`、`updated_at`
  - 索引：`status`、`user_id`、`updated_at`

## RLS 策略（核心）
- `public_catalog` 与 `chat_groups_public`
  - 读取：允许所有人 `select`（`using: true`）。
  - 写入：仅管理员允许 `insert/update/delete`（通过角色或 `app_metadata` 控制；浏览器端不使用服务密钥）。
- `user_scripts` 与 `chat_groups_user`
  - 读取/写入：仅 `auth.uid() = user_id` 的行允许 `select/insert/update/delete`。
- `publish_requests`
  - 用户：可 `insert` 与读取/更新自己的请求。
  - 管理员：可读写全部，更新状态与备注。

## 插件端数据访问架构
### 组件
- `StorageService`：统一编排数据源与同步逻辑。
- `ChromeLocalAdapter`：复用现有 `chrome.storage.local`。
- `SupabaseAdapter`：封装 Supabase 读写（分页、增量、upsert）。

### 接口
- `getGroups() / getScripts()`：合并公共+私有（登录前仅公共）。
- `saveGroup/updateGroup/deleteGroup`，`saveScript/updateScript/deleteScript`：私有库写入（先本地，入队云端）。
- `bulkUpsert(groups, scripts)`：首迁或批量编辑。
- `syncPull(lastSyncAt)`：增量拉取（`updated_at > lastSyncAt`，分页）。
- `syncPush(changes[])`：异步上行（指数退避重试）。

### 读取策略
- 登录前：公共库 + 本地缓存；断网可用。
- 登录后：公共库 + 私有库；云端成功后缓存到本地。

### 写入策略
- 私有库：乐观更新（本地先写），入队上行；成功后回写 `updated_at`/`usage_count`。
- 公共库：普通用户不可写；通过“提报”生成 `publish_requests`。

### 合并与冲突
- 合并：同 ID 以最新 `updated_at` 胜出（LWW）。
- 计数：`usage_count` 采用最大值合并，避免倒退。

### 队列与重试
- `syncPushQueue`：指数退避（如 1s/2s/5s/15s），上限提示用户。
- 错误处理：网络失败、RLS 拒绝均记录原因与失败项。

## 后台管理页面（独立）
- 登录与角色：Supabase Auth；管理员角色存于 `app_metadata` 或独立 `user_roles` 表。
- 模块：公共库 CRUD、分组管理、批量导入/导出、发布申请审核（差异对比、一键合并）、审计与版本回滚。
- 流程：插件用户“提报”→ 后台审核→ 合并入公共库→ 记录来源与版本。

## 同步与缓存策略
- 首次迁移：检测登录与连接可用→ 私有库 `bulkUpsert` 上行→ 记录 `lastSyncAt`。
- 增量拉取：启动时与固定间隔（如 10–30 分钟）执行；分页合并。
- 离线：所有写入先落本地缓存；恢复后自动上行。

## 安全与配置
- 环境变量：`SUPABASE_URL`、`SUPABASE_ANON_KEY` 通过扩展配置或构建注入；禁止硬编码在仓库。
- 输入校验：写入前校验 `title/content/name` 长度与合法性，避免脏数据。
- 统计事件：如需公共使用统计，另设 `usage_events` 做匿名聚合，公共库本身只读。

## 最小可行版本（MVP）
1. 公共只读 + 私有读写接入 Supabase。
2. 插件内新增“提报到公共库”，写入 `publish_requests`。
3. 简易后台页面：审核列表与详情、Approve/Reject、合入公共库。

## 上线步骤
1. 创建表与 RLS；验证权限边界。
2. 接入 `StorageService` 与 `SupabaseAdapter`，替换数据源（功能不变）。
3. 实现增量拉取与同步队列、错误重试与轻量提示。
4. 搭建后台页面并打通提报审核流程。
5. 端到端验证与灰度发布。

## 验证清单
- 首迁后云端与本地数据一致；刷新状态仍一致。
- 增删改与批量编辑：离线操作不报错、恢复后自动同步。
- 使用次数更新不倒退；合并策略正确。
- 权限严格隔离：不同用户数据不可见；公共库只读。
- 性能：列表渲染与搜索无明显退化；同步过程不阻塞交互。

## 术语
- 公共库：面向所有用户的官方话术集合。
- 私有库：按用户隔离的个人话术集合。
- 提报：用户将私有话术提议纳入公共库的申请。