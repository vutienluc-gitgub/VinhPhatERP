# Driver Finance Flow

## Goal
Quản lý công nợ tài xế

## Entities
- drivers
- shipments
- driver_transactions

## Flow
1. Tạo shipment → tạo earning
2. Giao hàng → cập nhật trạng thái
3. Thanh toán → tạo payment
4. Tính công nợ

## Rules
- Không giao vượt
- Không trả quá số nợ