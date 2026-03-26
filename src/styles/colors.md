# 颜色配置使用指南

## 1. 颜色配置文件位置

颜色配置文件位于 `src/styles/colors.css`，包含了亮色和暗色模式下的所有颜色定义。

## 2. 颜色配置结构

颜色配置文件分为两部分：

### 2.1 亮色模式颜色变量

```css
:root {
  /* 背景颜色 */
  --color-background-light: #ffffff;
  --color-background-light-secondary: #f8fafc;
  
  /* 文本颜色 */
  --color-text-light: #000000;
  --color-text-light-secondary: #666666;
  
  /* 边框颜色 */
  --color-border-light: #e5e5e5;
  
  /* 强调色 */
  --color-accent-light: #4a89dc;
  --color-accent-light-secondary: #3b82f6;
  
  /* 状态颜色 */
  --color-success-light: #10b981;
  --color-warning-light: #f59e0b;
  --color-error-light: #ef4444;
  
  /* 卡片颜色 */
  --color-card-light: #f8fafc;
  
  /* 标签颜色 */
  --color-tag-background-light: #dbeafe;
  --color-tag-text-light: #2563eb;
  
  /* 按钮颜色 */
  --color-button-primary-light: #3b82f6;
  --color-button-primary-text-light: #000000;
  --color-button-secondary-light: #f8fafc;
  --color-button-secondary-text-light: #666666;
  
  /* 表单颜色 */
  --color-form-background-light: #f8fafc;
  --color-form-border-light: #e5e7eb;
}
```

### 2.2 暗色模式颜色变量

```css
.dark {
  /* 背景颜色 */
  --color-background-dark: #121212;
  --color-background-dark-secondary: #1e1e1e;
  
  /* 文本颜色 */
  --color-text-dark: #ffffff;
  --color-text-dark-secondary: #b0b0b0;
  
  /* 边框颜色 */
  --color-border-dark: #333333;
  
  /* 强调色 */
  --color-accent-dark: #3b7dd8;
  --color-accent-dark-secondary: #60a5fa;
  
  /* 状态颜色 */
  --color-success-dark: #34d399;
  --color-warning-dark: #fbbf24;
  --color-error-dark: #f87171;
  
  /* 卡片颜色 */
  --color-card-dark: #1e293b;
  
  /* 标签颜色 */
  --color-tag-background-dark: #1e3a8a;
  --color-tag-text-dark: #93c5fd;
  
  /* 按钮颜色 */
  --color-button-primary-dark: #60a5fa;
  --color-button-primary-text-dark: #1e293b;
  --color-button-secondary-dark: #1e293b;
  --color-button-secondary-text-dark: #b0b0b0;
  
  /* 表单颜色 */
  --color-form-background-dark: #1e293b;
  --color-form-border-dark: #475569;
}
```

## 3. 颜色类的使用方法

### 3.1 背景颜色

```jsx
// 主背景色
<div className="bg-background-light dark:bg-background-dark">...</div>

// 次要背景色
<div className="bg-background-light-secondary dark:bg-background-dark-secondary">...</div>

// 卡片背景色
<div className="bg-card-light dark:bg-card-dark">...</div>

// 表单背景色
<input className="bg-form-light dark:bg-form-dark">...</input>
```

### 3.2 文本颜色

```jsx
// 主文本色
<p className="text-text-light dark:text-text-dark">...</p>

// 次要文本色
<p className="text-text-light-secondary dark:text-text-dark-secondary">...</p>
```

### 3.3 边框颜色

```jsx
// 边框颜色
<div className="border border-border-light dark:border-border-dark">...</div>
```

### 3.4 强调色

```jsx
// 强调色背景
<div className="bg-accent-light dark:bg-accent-dark">...</div>

// 强调色文本
<p className="text-accent-light dark:text-accent-dark">...</p>
```

### 3.5 状态颜色

```jsx
// 成功状态
<div className="bg-success-light/10 text-success-light dark:bg-success-dark/20 dark:text-success-dark">...</div>

// 警告状态
<div className="bg-warning-light/10 text-warning-light dark:bg-warning-dark/20 dark:text-warning-dark">...</div>

// 错误状态
<div className="bg-error-light/10 text-error-light dark:bg-error-dark/20 dark:text-error-dark">...</div>
```

### 3.6 按钮颜色

```jsx
// 主要按钮
<button className="bg-button-primary-light text-button-primary-text-light dark:bg-button-primary-dark dark:text-button-primary-text-dark">...</button>

// 次要按钮
<button className="bg-button-secondary-light text-button-secondary-text-light dark:bg-button-secondary-dark dark:text-button-secondary-text-dark">...</button>
```

### 3.7 标签颜色

```jsx
// 标签
<span className="bg-tag-light text-tag-light dark:bg-tag-dark dark:text-tag-dark">...</span>
```

## 4. 最佳实践

1. **统一使用**: 所有组件都应该使用配置文件中定义的颜色类，而不是直接使用Tailwind的颜色类或自定义颜色值。

2. **语义化使用**: 根据元素的语义选择合适的颜色类，例如：
   - 卡片使用 `bg-card-light`
   - 表单使用 `bg-form-light`
   - 按钮使用 `bg-button-primary-light`

3. **暗色模式适配**: 确保为每个颜色类都添加对应的暗色模式类，例如：
   - `bg-background-light dark:bg-background-dark`
   - `text-text-light dark:text-text-dark`

4. **一致性**: 保持同一类型元素的颜色一致，例如所有主要按钮都使用相同的颜色类。

5. **可读性**: 确保文本颜色与背景颜色的对比度足够，保证在亮色和暗色模式下都有良好的可读性。

## 5. 示例代码

### 5.1 卡片组件

```jsx
<div className="rounded-2xl border border-border-light bg-card-light p-3 shadow-sm dark:border-border-dark dark:bg-card-dark">
  <h2 className="text-lg font-semibold text-text-light dark:text-text-dark">标题</h2>
  <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">内容</p>
</div>
```

### 5.2 按钮组件

```jsx
<button className="rounded-full bg-button-primary-light px-4 py-2 text-sm font-medium text-button-primary-text-light shadow-sm hover:bg-button-primary-light/90 dark:bg-button-primary-dark dark:text-button-primary-text-dark dark:hover:bg-button-primary-dark/90">
  确认
</button>
```

### 5.3 表单元素

```jsx
<input 
  type="text" 
  className="w-full rounded-xl border border-border-light bg-form-light px-3 py-2 text-sm text-text-light outline-none focus:border-accent-light dark:border-border-dark dark:bg-form-dark dark:text-text-dark dark:focus:border-accent-dark"
  placeholder="请输入内容"
/>
```

## 6. 颜色修改指南

如果需要修改颜色，只需要修改 `src/styles/colors.css` 文件中的颜色变量值，所有使用这些颜色类的组件都会自动更新。

### 6.1 修改亮色模式颜色

```css
:root {
  /* 修改主背景色 */
  --color-background-light: #f9fafb;
  
  /* 修改主文本色 */
  --color-text-light: #111827;
  
  /* 修改强调色 */
  --color-accent-light: #2563eb;
}
```

### 6.2 修改暗色模式颜色

```css
.dark {
  /* 修改主背景色 */
  --color-background-dark: #0f172a;
  
  /* 修改主文本色 */
  --color-text-dark: #f8fafc;
  
  /* 修改强调色 */
  --color-accent-dark: #3b82f6;
}
```

## 7. 注意事项

1. **兼容性**: 颜色配置与Tailwind CSS v4兼容，可以与Tailwind的工具类一起使用。

2. **性能**: 颜色配置使用CSS变量，具有良好的性能表现。

3. **维护性**: 集中管理颜色配置，便于后续的维护和修改。

4. **扩展性**: 可以根据需要添加新的颜色变量和颜色类。

5. **一致性**: 确保所有组件都使用配置文件中定义的颜色类，保持视觉一致性。