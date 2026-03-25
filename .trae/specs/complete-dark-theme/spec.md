# 暗色主题完整实现 Spec

## Why
当前的暗色主题实现不完整，虽然 ThemeContext 正确设置了 `dark` 类到根元素，但大多数组件没有添加对应的暗色主题样式，导致只有背景色变化，而文本、边框等颜色没有相应调整。

## What Changes
- 为所有页面和组件添加完整的暗色主题支持
- 为文本、背景、边框、按钮等元素添加 `dark:` 前缀的样式类
- 确保所有模态框、表单元素、按钮等都有暗色主题适配
- 保持与白色主题的视觉一致性和用户体验

## Impact
- Affected specs: 全局主题系统、所有页面和组件
- Affected code:
  - `src/app/community/page.tsx` - 添加暗色主题样式
  - `src/app/members/page.tsx` - 添加暗色主题样式
  - `src/app/sections/mainpage/` - 添加暗色主题样式到所有组件
  - `src/components/` - 添加暗色主题样式到所有组件
  - `src/app/sections/member/` - 添加暗色主题样式

## ADDED Requirements

### Requirement: 完整的暗色主题支持
系统 SHALL 为所有页面和组件提供完整的暗色主题支持，包括文本、背景、边框、按钮等所有视觉元素。

#### Scenario: 切换到暗色主题
- **WHEN** 用户切换到暗色主题
- **THEN** 所有页面和组件的文本、背景、边框等颜色都应相应调整为暗色主题配色

#### Scenario: 切换到白色主题
- **WHEN** 用户切换到白色主题
- **THEN** 所有页面和组件的文本、背景、边框等颜色都应相应调整为白色主题配色

### Requirement: 视觉一致性
系统 SHALL 确保暗色主题和白色主题在视觉层次、对比度和用户体验上保持一致。

#### Scenario: 比较两种主题
- **WHEN** 用户在暗色和白色主题之间切换
- **THEN** 页面布局、元素大小、间距等应保持一致，仅颜色方案变化

## MODIFIED Requirements

### Requirement: 组件样式
所有组件 SHALL 添加 `dark:` 前缀的样式类，确保在暗色主题下正确显示。

#### Scenario: 查看社区页面
- **WHEN** 用户在暗色主题下访问社区页面
- **THEN** 公告卡片、按钮、表单等元素应显示为暗色主题配色

#### Scenario: 查看成员页面
- **WHEN** 用户在暗色主题下访问成员页面
- **THEN** 成员列表、搜索框、筛选器等元素应显示为暗色主题配色

## REMOVED Requirements
### Requirement: 部分暗色主题支持
**Reason**: 替换为完整的暗色主题支持
**Migration**: 为所有组件添加 `dark:` 前缀的样式类
