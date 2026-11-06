# 登录、Session 与 Casbin RBAC 实施计划

> **For agentic workers:** 按任务逐项执行；每项先写失败测试，再实现最小行为并验证。代码和配置注释使用中文。

**目标：** 为顾客前台和管理后台提供邮箱密码登录、Redis 服务端 Session、Casbin 按市场授权，并提供安全的一次性超级管理员初始化命令。

**架构：** NestJS API 内新增 Auth、Authorization 和 AdminAccess 模块，MySQL 通过 TypeORM migration 保存顾客、管理员、角色展示元数据和 Casbin 策略；Casbin 策略表是权限及角色市场分配的唯一事实源。Redis 通过现有 ioredis 连接存储 Session。前端使用 HttpOnly Cookie 和 CSRF Token；API 负责最终权限检查，后台 UI 只负责展示可用操作。

**技术栈：** 当前 TypeScript/NestJS/TypeORM/MySQL/ioredis；`express-session` 与兼容 ioredis 的 `connect-redis` 8.x；Apache Casbin 的 Node.js 实现和 TypeORM Adapter；Next.js 顾客端；React + Ant Design 管理端。

**规格：** [海外电商系统设计](../specs/2026-11-06-overseas-commerce-system-design.md)，重点为第 7 节“身份认证与权限”。

## 全局约束

- 顾客邮箱密码自助注册；管理员身份独立存储，不开放公开注册。
- 浏览器认证使用 Redis Session 和 HttpOnly Cookie；变更状态的请求要求 Session 绑定的 CSRF Token。
- Casbin RBAC Domain 使用 `US`、`CN`；后台 API 强制授权并检查请求市场，前端显隐不作为安全边界。
- 管理员当前角色和授权从 MySQL/Casbin 读取；Session 不保存长期有效的权限结论。
- TypeORM `synchronize` 与自动迁移保持关闭；数据库结构通过显式 migration 管理。
- 初始超级管理员只通过一次性命令创建；命令必须要求本地 `.env` 提供邮箱和密码，禁止默认账号或密码。
- 日志、响应、错误和测试输出不得泄露密码、Cookie、Session ID、CSRF Token 或连接凭据。
- 源码注释和配置文件注释用中文；只解释安全边界、业务规则和非显然配置。

## 完成条件

1. MySQL migration 可创建顾客/管理员身份、角色、权限、授权关系及 Casbin 策略表，并可回滚。
2. 顾客可注册、登录、读取当前身份和登出；管理员可登录、读取当前身份和登出；管理员只能由后台授权流程或初始化命令创建。
3. Session 存储在 Redis；登录轮换 Session ID；登出销毁服务端 Session；Cookie 为 HttpOnly，并有 SameSite/Secure 配置。
4. 状态变更接口拒绝缺失或无效 CSRF Token 的请求。
5. Casbin API 授权按 `US`/`CN` 隔离；无权限及跨市场请求被拒绝；超级管理员可以访问两个市场。
6. 管理员登录页、顾客注册/登录页可以通过 API 完成对应流程；后台受保护页面在无有效 Session 时回到登录状态。
7. 一次性初始化命令在账户已存在时安全拒绝重复创建；不会输出凭据。
8. 相关单元与组件测试通过；记录需要 MySQL/Redis 时的集成验证结果和限制。

## 验收与验证用例

| ID | 类型 | 场景与固定输入 | 预期结果 | 执行命令 | 证据 | 初始状态 |
|---|---|---|---|---|---|---|
| AUTH-01 | 单元 | 邮箱含首尾空格及大写字符 | 规范化后以小写邮箱保存；重复邮箱拒绝 | `npm run test --workspace @commerce/api -- --runInBand` | Jest 输出 | pending |
| AUTH-02 | 单元 | 正确密码与错误密码分别验证同一 scrypt 哈希 | 正确密码通过，错误密码失败，比较不泄露明文 | 同上 | Jest 输出 | pending |
| AUTH-03 | 接口 | 顾客注册、登录、身份查询、登出 | Cookie 只含不透明 Session ID；登出后身份查询返回未认证 | 同上 | Jest 输出 | pending |
| AUTH-04 | 边界 | 重复邮箱、空密码、非法邮箱、顾客登录管理员邮箱 | 请求按契约拒绝，不创建或泄露其他身份 | 同上 | Jest 输出 | pending |
| AUTH-05 | 安全 | 状态变更请求缺少/伪造 CSRF Token | 请求被拒绝；有效 Session Token 请求通过 | 同上 | Jest 输出 | pending |
| AUTH-06 | 单元 | 管理员首次登录及初始化命令重复执行 | 初次成功；重复运行不重复创建且不打印凭据 | 同上 | Jest 输出 | pending |
| AUTH-07 | 权限 | 仅拥有 US `product.read` 权限的管理员访问 US、CN 同一资源 | US 允许；CN 拒绝；超级管理员两市场均允许 | 同上 | Jest 输出 | pending |
| AUTH-08 | 回归 | 健康端点与未受保护的存活端点 | `health/live` 不要求登录；`health/ready` 仍检查 MySQL/Redis/Kafka | `npm run test --workspace @commerce/api -- --runInBand` | Jest 输出 | pending |
| AUTH-09 | 前端组件 | 管理员未登录访问保护页；顾客表单提交 | 后台要求登录；顾客表单显示成功/错误状态并发送凭据 Cookie | 各自 workspace 的 `npm test` | Vitest 输出 | pending |
| AUTH-10 | 集成 | 迁移后启动 API，使用本地 MySQL/Redis 完成登录、登出 | 真实依赖运行成功，Redis Session 有 TTL 且登出后删除 | `npm run db:migrate --workspace @commerce/api` 后按 README 手工操作 | 仅记录非敏感状态 | pending |

## 任务

### 任务 1：建立认证数据模型与迁移运行器

**文件：**
- 新建：`apps/api/src/database/entities/customer-user.entity.ts`
- 新建：`apps/api/src/database/entities/admin-user.entity.ts`
- 新建：`apps/api/src/database/entities/role.entity.ts`
- 新建：`apps/api/src/database/api-typeorm-options.ts`
- 新建：`apps/api/src/database/migrations/1793923200000-CreateIdentityAndAuthorizationTables.ts`
- 新建：`apps/api/src/database/run-migrations.ts`
- 修改：`apps/api/src/database/database.module.ts`
- 修改：`apps/api/jest.config.cjs`
- 修改：`apps/api/package.json`
- 测试：`apps/api/src/database/api-typeorm-options.spec.ts`

**接口：** 顾客邮箱在 `customer_users` 内唯一；管理员邮箱在 `admin_users` 内唯一；角色展示元数据保存在 `roles`；授权和管理员-角色-市场关系以 `casbin_rule` 作为唯一持久化事实源，权限点代码定义；migration 显式建立 `casbin_rule`，不使用 `synchronize`。

- [ ] 先把 Jest 发现规则扩展为 `src/**/*.spec.ts` 与现有 `test/**/*.e2e-spec.ts`，并为 TypeORM options 注册实体、迁移和关闭自动同步编写失败测试。
- [ ] 运行 API 对应 Jest 用例，确认因迁移/实体尚未注册而失败。
- [ ] 编写实体、可逆 migration 和 `db:migrate` / `db:revert` 命令。
- [ ] 重跑数据库配置用例，确认 migration 列表和实体注册符合预期。
- [ ] 检查 migration 中的唯一索引、外键和 `casbin_rule` 字段与 Adapter 约定一致。

### 任务 2：实现邮箱规范化和密码哈希

**文件：**
- 新建：`apps/api/src/auth/password.service.ts`
- 新建：`apps/api/src/auth/password.service.spec.ts`
- 新建：`apps/api/src/auth/email.util.ts`
- 新建：`apps/api/src/auth/email.util.spec.ts`

**接口：** `PasswordService.hash(plain: string): Promise<string>` 与 `PasswordService.verify(plain: string, encoded: string): Promise<boolean>` 使用 Node.js `crypto.scrypt`、随机盐和固定长度摘要；密码长度限制为 8–128 个 Unicode 字符。`normalizeEmail(email: string): string` 去除首尾空格并转小写。

- [ ] 写 scrypt 正确密码通过、错误密码失败、不同盐产生不同摘要的测试，并确认 RED。
- [ ] 写邮箱规范化及空值拒绝测试，并确认 RED。
- [ ] 实现最小服务；使用 `timingSafeEqual` 比较等长摘要。
- [ ] 运行上述测试确认 GREEN；不在错误信息中输出密码或摘要。

### 任务 3：配置 Redis Session、CORS 与 CSRF

**文件：**
- 新建：`apps/api/src/auth/session.middleware.ts`
- 新建：`apps/api/src/auth/csrf.middleware.ts`
- 新建：`apps/api/src/auth/session.types.ts`
- 修改：`apps/api/src/main.ts`
- 修改：`apps/api/src/config/validate-env.ts`
- 修改：`.env.example`
- 修改：`apps/api/package.json`
- 测试：`apps/api/src/auth/session.middleware.spec.ts`
- 测试：`apps/api/src/auth/csrf.middleware.spec.ts`

**接口：** 在 API bootstrap 时使用 `express-session` + `connect-redis` 8.x，共用现有 ioredis 客户端；配置 `SESSION_SECRET`、`SESSION_TTL_SECONDS`、`SESSION_COOKIE_SECURE` 和 `WEB_ALLOWED_ORIGINS`。提供 `GET /auth/csrf`，返回绑定 Session 的随机 Token；状态变更请求校验 `X-CSRF-Token`。CORS 仅允许配置的前台/后台源并启用凭据。

- [ ] 为缺少 Session Secret、非法 TTL、错误 Origin、缺少/错误 CSRF Token 写测试并确认 RED。
- [ ] 配置中文注释的 `.env.example`；新增配置验证与 Session/CSRF middleware。
- [ ] 确认 Cookie 有 HttpOnly、SameSite=Lax、正确 Max-Age；生产 Secure 由配置控制。
- [ ] 运行 API 配置与 middleware 测试确认 GREEN。

### 任务 4：实现顾客注册与 Session 登录流程

**文件：**
- 新建：`apps/api/src/auth/auth.module.ts`
- 新建：`apps/api/src/auth/customer-auth.controller.ts`
- 新建：`apps/api/src/auth/customer-auth.service.ts`
- 新建：`apps/api/src/auth/customer-auth.service.spec.ts`
- 新建：`apps/api/src/auth/dto/customer-register.dto.ts`
- 新建：`apps/api/src/auth/dto/email-password.dto.ts`
- 修改：`apps/api/src/app.module.ts`

**接口：** `POST /auth/customer/register`、`POST /auth/customer/login`、`GET /auth/customer/me`、`POST /auth/customer/logout`。用户身份只从服务端 Session 读取；登录时 regenerate Session ID，登出时销毁 Redis Session。

- [ ] 先写注册、重复邮箱、错误密码、Session ID 轮换、登出后失效用例并确认 RED。
- [ ] 实现 DTO 校验、顾客服务和控制器，错误响应不区分未知邮箱与密码错误。
- [ ] 运行 API Auth 用例确认 GREEN；增加注册成功后读取当前用户的断言。

### 任务 5：管理后台邮箱密码认证

**文件：**
- 新建：`apps/api/src/auth/admin-auth.controller.ts`
- 新建：`apps/api/src/auth/admin-auth.service.ts`
- 新建：`apps/api/src/auth/admin-auth.service.spec.ts`

**接口：** `POST /auth/admin/login`、`GET /auth/admin/me`、`POST /auth/admin/logout`；管理后台不提供公开注册。管理员身份从独立的 `admin_users` 表读取。

- [ ] 测试管理员登录身份与顾客身份隔离、禁用管理员拒绝登录和重复初始化拒绝。
- [ ] 实现 Admin Auth；确认没有公开管理员注册路由。
- [ ] 运行 API Auth 用例确认 GREEN。

### 任务 6：实现 Casbin 市场授权和角色管理 API

**文件：**
- 新建：`apps/api/src/authorization/casbin.module.ts`
- 新建：`apps/api/src/authorization/casbin.model.conf`
- 新建：`apps/api/src/authorization/permissions.ts`
- 新建：`apps/api/src/authorization/permission.decorator.ts`
- 新建：`apps/api/src/authorization/permission.guard.ts`
- 新建：`apps/api/src/authorization/permission.guard.spec.ts`
- 新建：`apps/api/src/admin/bootstrap-admin.ts`
- 新建：`apps/api/src/admin/roles.controller.ts`
- 新建：`apps/api/src/admin/roles.service.ts`
- 新建：`apps/api/src/admin/roles.service.spec.ts`
- 修改：`apps/api/src/app.module.ts`
- 修改：`apps/api/package.json`

**接口：** Casbin `r = subject, domain, object, action`；domain 为明确解析的 `US`/`CN`。用权限 decorator 声明代码定义的权限点，Guard 在 API 执行 Casbin 决策；拒绝缺失身份、未知市场、跨市场和未定义权限。角色查询/创建/权限分配接口只允许持有 `admin.role.manage` 的管理员；管理员账号创建和角色绑定只允许持有 `admin.account.manage` 的管理员。所有变更同步到 MySQL/Casbin 策略。

- [ ] 为匿名拒绝、US 管理员访问 US 通过、访问 CN 拒绝、超级管理员两市场通过写单元测试并确认 RED。
- [ ] 安装 `casbin` 与 `typeorm-adapter`；使用已迁移的 `casbin_rule` 表并从同一 TypeORM DataSource 加载策略。
- [ ] 实现一次性管理员初始化命令：从本地 `.env` 读取凭据，为管理员创建 `super_admin` 角色及 US/CN 授权；账号已存在则安全拒绝，不输出凭据。
- [ ] 实现 permission decorator、Casbin Guard 和最小角色查询/创建/权限分配 API。
- [ ] 增加管理员账号创建/停用及按市场分配角色 API；公开注册不能创建管理员。
- [ ] 更新权限后重载当前 Enforcer；授权查询不得依赖 Session 中缓存的角色。
- [ ] 运行 API 授权测试确认 GREEN。

### 任务 7：接入顾客与管理端登录界面

**文件：**
- 新建：`apps/storefront/app/[market]/login/page.tsx`
- 新建：`apps/storefront/app/[market]/register/page.tsx`
- 新建：`apps/storefront/app/[market]/account/page.tsx`
- 新建：`apps/storefront/app/[market]/login/page.test.tsx`
- 新建：`apps/admin/src/auth/AdminLoginPage.tsx`
- 新建：`apps/admin/src/auth/AdminAuthContext.tsx`
- 新建：`apps/admin/src/auth/AdminLoginPage.test.tsx`
- 新建：`apps/admin/src/roles/AdminRolesPage.tsx`
- 新建：`apps/admin/src/roles/AdminRolesPage.test.tsx`
- 修改：`apps/admin/src/App.tsx`
- 修改：`apps/admin/src/config.ts`

**接口：** 前台表单使用 `/auth/customer/*`；后台使用 `/auth/admin/*`；跨源请求都设置 `credentials: 'include'` 并先获取 CSRF Token。后台提供角色/权限管理页并按服务端返回权限呈现操作；未登录后台不得显示管理页面；UI 不自行判断或替代服务端权限。

- [ ] 写顾客表单提交、错误反馈和后台未登录保护的组件测试并确认 RED。
- [ ] 实现简洁、可访问的邮箱密码表单和 Session 状态恢复。
- [ ] 实现按 US/CN 选择市场的角色/权限管理界面，并显示 API 返回的拒绝状态。
- [ ] 运行 Storefront/Admin Vitest 用例确认 GREEN。

### 任务 8：文档和切片验收

**文件：**
- 修改：`README.md`
- 修改：`docs/development/local-services.md`
- 修改：`docs/superpowers/plans/README.md`

- [ ] 写中文说明：生成 Session Secret、初始化管理员、执行 migration、启动前后台以及本地 Cookie/CORS 配置。
- [ ] 更新验收表状态和仅包含非敏感信息的验证证据。
- [ ] 对 API、Storefront、Admin 运行相关单元/组件测试，并运行 root `npm run typecheck`、`npm run lint`、`npm run build`。
- [ ] 人工走通顾客注册登录登出、管理员初始化登录、US/CN 授权拒绝与允许流程。
- [ ] 检查 `git diff` 确认 `.env`、密码、Cookie、Session ID 和测试凭据没有进入版本控制。

## 实现前决策记录

- 首位超级管理员由用户确认采用一次性 CLI 初始化；命令从本地环境配置取凭据且拒绝重复创建。
- connect-redis v8.1 官方 README 支持 ioredis；v9 开始仅支持 node-redis，因此本切片固定使用兼容的 8.x 主版本，不额外启动第二个 Redis 客户端。
- Casbin TypeORM Adapter 支持 MySQL；它可自动建 `casbin_rule` 表，但本项目统一由显式 migration 建表，Adapter 只在 migration 后加载和保存策略。
- 授权关系只保存在 Casbin 策略表，避免角色权限和市场分配与 Casbin 策略重复存储造成双写不一致；`roles` 仅保存展示元数据。
- 多实例 Casbin 策略热刷新、密码重置邮件、邮箱验证、MFA、登录风控与统一 SSO 不属于本切片。
