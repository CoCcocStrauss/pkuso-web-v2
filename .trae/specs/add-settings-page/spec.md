# 设置页面与主题切换功能 Spec

## Why
当前 profile 页面的功能按钮（修改密码、意见反馈、退出登录）与个人信息展示混在一起，用户需要一个独立的设置页面来管理应用配置。同时，用户希望能够切换白色/暗色主题以适应不同使用场景。

## What Changes
- 在 profile 页面顶部添加圆形设置按钮（齿轮图标），点击跳转至设置页面
- 创建 `/settings` 设置页面
- 将 profile 页面的三个功能按钮移至设置页面
- 添加主题切换功能（白色/暗色主题）
- 创建 ThemeContext 管理主题状态
- 更新 globals.css 支持暗色主题变量

## Impact
- Affected specs: profile 页面布局、全局主题系统
- Affected code:
  - `src/app/profile/page.tsx` - 添加设置按钮，移除功能按钮
  - `src/app/settings/page.tsx` - 新建设置页面
  - `src/context/ThemeContext.tsx` - 新建主题上下文
  - `src/context/UserContext.tsx` - 无需修改
  - `src/app/layout.tsx` - 添加 ThemeProvider
  - `src/app/globals.css` - 添加暗色主题变量

## ADDED Requirements

### Requirement: 设置页面入口
系统 SHALL 在 profile 页面顶部个人信息区域提供一个圆形设置按钮，以齿轮图标表示。

#### Scenario: 用户点击设置按钮
- **WHEN** 用户点击设置按钮
- **THEN** 系统导航至 `/settings` 页面

### Requirement: 设置页面功能
系统 SHALL 提供独立的设置页面，包含以下功能项：
1. 修改密码
2. 意见反馈
3. 退出登录
4. 主题切换开关

#### Scenario: 访问设置页面
- **WHEN** 用户访问 `/settings` 路径
- **THEN** 系统显示设置页面，包含上述功能项

#### Scenario: 点击修改密码
- **WHEN** 用户在设置页面点击修改密码
- **THEN** 系统显示修改密码弹窗（功能与原 profile 页面一致）

#### Scenario: 点击意见反馈
- **WHEN** 用户在设置页面点击意见反馈
- **THEN** 系统显示意见反馈弹窗（功能与原 profile 页面一致）

#### Scenario: 点击退出登录
- **WHEN** 用户在设置页面点击退出登录
- **THEN** 系统执行登出操作并跳转至登录页面

### Requirement: 主题切换功能
系统 SHALL 提供白色/暗色主题切换功能。

#### Scenario: 切换至暗色主题
- **WHEN** 用户将主题开关切换至暗色
- **THEN** 系统应用暗色主题样式到所有页面

#### Scenario: 切换至白色主题
- **WHEN** 用户将主题开关切换至白色
- **THEN** 系统应用白色主题样式到所有页面

#### Scenario: 主题持久化
- **WHEN** 用户切换主题后刷新页面或重新访问
- **THEN** 系统保持用户选择的主题设置

### Requirement: 主题上下文
系统 SHALL 提供 ThemeContext 用于全局主题状态管理。

#### Scenario: 获取当前主题
- **WHEN** 组件调用 useTheme hook
- **THEN** 系统返回当前主题状态和切换方法

## MODIFIED Requirements

### Requirement: Profile 页面布局
Profile 页面 SHALL 仅显示个人信息和管理员控制台，功能按钮移至设置页面。

#### Scenario: 普通用户查看 profile
- **WHEN** 普通用户访问 profile 页面
- **THEN** 系统显示个人信息卡片和设置按钮入口

#### Scenario: 管理员查看 profile
- **WHEN** 管理员访问 profile 页面
- **THEN** 系统显示个人信息卡片、管理员控制台和设置按钮入口
