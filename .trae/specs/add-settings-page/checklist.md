# Checklist

## ThemeContext
- [x] ThemeContext 正确创建并导出 useTheme hook
- [x] 主题状态支持 'light' 和 'dark' 两种值
- [x] 主题选择持久化到 localStorage
- [x] 页面刷新后主题状态正确恢复

## 全局样式
- [x] globals.css 包含暗色主题 CSS 变量
- [x] layout.tsx 正确包裹 ThemeProvider
- [x] 暗色主题下页面样式正确应用

## 设置页面
- [x] 设置页面可通过 `/settings` 路径访问
- [x] 页面包含返回按钮可返回 profile
- [x] 主题切换开关正常工作
- [x] 修改密码功能正常工作（弹窗显示、密码修改成功）
- [x] 意见反馈功能正常工作（弹窗显示、提交成功）
- [x] 退出登录功能正常工作（登出并跳转登录页）

## Profile 页面
- [x] 个人信息区域显示圆形设置按钮
- [x] 设置按钮使用齿轮图标
- [x] 点击设置按钮跳转至设置页面
- [x] 修改密码、意见反馈、退出登录按钮已移除
- [x] 管理员控制台功能保持不变
