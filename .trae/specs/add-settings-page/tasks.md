# Tasks

- [x] Task 1: 创建 ThemeContext 主题上下文
  - [ ] SubTask 1.1: 创建 `src/context/ThemeContext.tsx`，包含主题状态管理
  - [ ] SubTask 1.2: 支持 'light' 和 'dark' 两种主题
  - [ ] SubTask 1.3: 实现主题持久化（localStorage）
  - [ ] SubTask 1.4: 导出 useTheme hook

- [x] Task 2: 更新全局样式支持暗色主题
  - [ ] SubTask 2.1: 在 `globals.css` 中添加暗色主题 CSS 变量
  - [ ] SubTask 2.2: 在 `layout.tsx` 中添加 ThemeProvider

- [x] Task 3: 创建设置页面
  - [ ] SubTask 3.1: 创建 `src/app/settings/page.tsx`
  - [ ] SubTask 3.2: 添加页面标题和返回按钮
  - [ ] SubTask 3.3: 添加主题切换开关组件
  - [ ] SubTask 3.4: 添加修改密码功能（从 profile 迁移）
  - [ ] SubTask 3.5: 添加意见反馈功能（从 profile 迁移）
  - [ ] SubTask 3.6: 添加退出登录功能（从 profile 迁移）

- [x] Task 4: 更新 Profile 页面
  - [ ] SubTask 4.1: 在个人信息区域添加圆形设置按钮（齿轮图标）
  - [ ] SubTask 4.2: 移除修改密码、意见反馈、退出登录按钮
  - [ ] SubTask 4.3: 保持管理员控制台功能不变

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 3]
