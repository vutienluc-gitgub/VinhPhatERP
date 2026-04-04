# UI System - ERP Mobile First

## Stack

- Tailwind CSS
- shadcn/ui

## Core Rules

- Mobile-first ONLY
- 1 column layout on mobile
- Use card-based UI

## Components

- Use: Card, Button, Input, Dialog
- Button must be full width on mobile
- Button height >= 48px

## Typography

- Title: text-lg font-semibold
- Value: text-2xl font-bold

## Layout

- spacing: p-4, gap-4
- rounded-xl or rounded-2xl

## Do NOT

- No desktop-first
- No complex grid
- No overloaded UI

## Responsive & Overflow Rules (BẮT BUỘC)

### Grid
- Mobile-first: luôn dùng 1 cột mặc định
- Không dùng inline style: gridTemplateColumns
- Bắt buộc dùng:
  - grid-cols-1 md:grid-cols-2

### Table
- Table phải luôn được bọc bởi container:

<div class="overflow-x-auto w-full">
  <table class="min-w-full">...</table>
</div>

- Không hard-code colSpan sai
- colSpan phải:
  - đúng số cột thực tế
  - hoặc dùng biến (columns.length)

### Text Overflow
- Text dài phải xử lý:
  - break-words (ưu tiên)
  - hoặc truncate

### Layout
- Không được gây scroll ngang
- Không dùng width cố định lớn hơn màn hình

### Forbidden
- ❌ gridTemplateColumns: '1fr 1fr'
- ❌ table không có overflow-x-auto
- ❌ colSpan hardcode sai