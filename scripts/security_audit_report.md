# 🛡️ BÁO CÁO KIỂM TOÁN BẢO MẬT & MA TRẬN ỦY QUYỀN TOÀN HỆ THỐNG (VinhPhatERP)

## 1. Kiểm Toán Hiện Trạng RLS Trên Các Bảng Nghiệp Vụ Trọng Yếu

### 📦 Bảng: `orders`

- **Cột liên kết đối tượng:** `id`, `order_number`, `customer_id`, `order_date`, `delivery_date`, `total_amount`, `paid_amount`, `status`, `notes`, `created_by`, `created_at`, `updated_at`, `source_quotation_id`, `tenant_id`, `order_type`
- **Số lượng Policy:** 11
  | Lệnh (CMD) | Tên Policy | Roles | Permissive | Điều Kiện (USING / WITH CHECK) |
  |:---:|---|---|:---:|---|
  | **DELETE** | Managers can delete orders | authenticated | PERMISSIVE | USING: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]))` |
  | **INSERT** | Staff can insert orders | authenticated | PERMISSIVE | WITH CHECK: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]))` |
  | **SELECT** | Staff can read orders | authenticated | PERMISSIVE | USING: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'driver'::user_role, 'viewer'::user_role, 'sale'::user_role]))` |
  | **UPDATE** | Staff can update orders | authenticated | PERMISSIVE | USING: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]))` |
  | **DELETE** | Tenant Isolation Delete on orders | authenticated | PERMISSIVE | USING: `((tenant_id IS NULL) OR (tenant_id = current_tenant_id()) OR (current_tenant_id() IS NULL))` |
  | **INSERT** | Tenant Isolation Insert on orders | authenticated | PERMISSIVE | WITH CHECK: `((tenant_id IS NULL) OR (tenant_id = current_tenant_id()) OR (current_tenant_id() IS NULL))` |
  | **SELECT** | Tenant Isolation Select on orders | authenticated | PERMISSIVE | USING: `((tenant_id IS NULL) OR (tenant_id = current_tenant_id()) OR (current_tenant_id() IS NULL))` |
  | **UPDATE** | Tenant Isolation Update on orders | authenticated | PERMISSIVE | USING: `((tenant_id IS NULL) OR (tenant_id = current_tenant_id()) OR (current_tenant_id() IS NULL))` |
  | **INSERT** | customer_portal_orders_insert | public | PERMISSIVE | WITH CHECK: `(auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.customer_id = orders.customer_id)))` |
  | **SELECT** | customer_portal_orders_select | public | PERMISSIVE | USING: `(auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.customer_id = orders.customer_id)))` |
  | **ALL** | tenant_isolation_orders | public | RESTRICTIVE | USING: `(tenant_id = current_tenant_id())` |

### 📦 Bảng: `order_items`

- **Cột liên kết đối tượng:** `id`, `order_id`, `fabric_type`, `color_name`, `color_code`, `quantity`, `unit`, `unit_price`, `amount`, `notes`, `sort_order`, `width_cm`, `tenant_id`, `product_category`, `source_stock_id`, `source_lot_number`
- **Số lượng Policy:** 11
  | Lệnh (CMD) | Tên Policy | Roles | Permissive | Điều Kiện (USING / WITH CHECK) |
  |:---:|---|---|:---:|---|
  | **DELETE** | Managers can delete order_items | authenticated | PERMISSIVE | USING: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]))` |
  | **INSERT** | Staff can insert order_items | authenticated | PERMISSIVE | WITH CHECK: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]))` |
  | **SELECT** | Staff can read order_items | authenticated | PERMISSIVE | USING: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'driver'::user_role, 'viewer'::user_role, 'sale'::user_role]))` |
  | **UPDATE** | Staff can update order_items | authenticated | PERMISSIVE | USING: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]))` |
  | **DELETE** | Tenant Isolation Delete on order_items | authenticated | PERMISSIVE | USING: `((tenant_id IS NULL) OR (tenant_id = current_tenant_id()) OR (current_tenant_id() IS NULL))` |
  | **INSERT** | Tenant Isolation Insert on order_items | authenticated | PERMISSIVE | WITH CHECK: `((tenant_id IS NULL) OR (tenant_id = current_tenant_id()) OR (current_tenant_id() IS NULL))` |
  | **SELECT** | Tenant Isolation Select on order_items | authenticated | PERMISSIVE | USING: `((tenant_id IS NULL) OR (tenant_id = current_tenant_id()) OR (current_tenant_id() IS NULL))` |
  | **UPDATE** | Tenant Isolation Update on order_items | authenticated | PERMISSIVE | USING: `((tenant_id IS NULL) OR (tenant_id = current_tenant_id()) OR (current_tenant_id() IS NULL))` |
  | **INSERT** | customer_portal_order_items_insert | public | PERMISSIVE | WITH CHECK: `(EXISTS ( SELECT 1
   FROM (orders o
     JOIN profiles p ON ((p.customer_id = o.customer_id)))
  WHERE ((o.id = order_items.order_id) AND (p.id = auth.uid()))))` |
  | **SELECT** | customer_portal_order_items_select | public | PERMISSIVE | USING: `(EXISTS ( SELECT 1
   FROM (orders o
     JOIN profiles p ON ((p.customer_id = o.customer_id)))
  WHERE ((o.id = order_items.order_id) AND (p.id = auth.uid()))))` |
  | **ALL** | tenant_isolation_order_items | public | RESTRICTIVE | USING: `(tenant_id = current_tenant_id())` |

### 📦 Bảng: `shipments`

- **Cột liên kết đối tượng:** `id`, `shipment_number`, `order_id`, `customer_id`, `shipment_date`, `delivery_address`, `carrier`, `tracking_number`, `status`, `notes`, `created_by`, `created_at`, `updated_at`, `delivery_staff_id`, `shipping_rate_id`, `shipping_cost`, `loading_fee`, `total_weight_kg`, `total_meters`, `vehicle_info`, `prepared_at`, `shipped_at`, `delivered_at`, `delivery_proof`, `receiver_name`, `receiver_phone`, `tenant_id`, `employee_id`, `journey_status`, `last_chat_at`, `customer_signature_url`, `proof_photos`, `signed_at`
- **Số lượng Policy:** 7
  | Lệnh (CMD) | Tên Policy | Roles | Permissive | Điều Kiện (USING / WITH CHECK) |
  |:---:|---|---|:---:|---|
  | **DELETE** | Managers can delete shipments | authenticated | PERMISSIVE | USING: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]))` |
  | **SELECT** | Shipments read access | authenticated | PERMISSIVE | USING: `(((current_user_role())::text = ANY (ARRAY['admin'::text, 'manager'::text, 'staff'::text])) OR (((current_user_role())::text = 'driver'::text) AND (delivery_staff_id = auth.uid())))` |
  | **UPDATE** | Shipments update access | authenticated | PERMISSIVE | USING: `(((current_user_role())::text = ANY (ARRAY['admin'::text, 'manager'::text, 'staff'::text])) OR (((current_user_role())::text = 'driver'::text) AND (delivery_staff_id = auth.uid())))` |
  | **INSERT** | Staff can insert shipments | authenticated | PERMISSIVE | WITH CHECK: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]))` |
  | **SELECT** | Staff can read shipments | authenticated | PERMISSIVE | USING: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'driver'::user_role, 'viewer'::user_role, 'sale'::user_role]))` |
  | **SELECT** | customer_portal_shipments_select | public | PERMISSIVE | USING: `(auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.customer_id = shipments.customer_id)))` |
  | **ALL** | tenant_isolation_shipments | public | RESTRICTIVE | USING: `(tenant_id = current_tenant_id())` |

### 📦 Bảng: `shipment_items`

- **Cột liên kết đối tượng:** `id`, `shipment_id`, `finished_roll_id`, `fabric_type`, `color_name`, `quantity`, `unit`, `notes`, `sort_order`, `tenant_id`, `price_per_meter`, `total_amount`
- **Số lượng Policy:** 7
  | Lệnh (CMD) | Tên Policy | Roles | Permissive | Điều Kiện (USING / WITH CHECK) |
  |:---:|---|---|:---:|---|
  | **DELETE** | Managers can delete shipment_items | authenticated | PERMISSIVE | USING: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]))` |
  | **SELECT** | Shipment items read access | authenticated | PERMISSIVE | USING: `(((current_user_role())::text = ANY (ARRAY['admin'::text, 'manager'::text, 'staff'::text])) OR (((current_user_role())::text = 'driver'::text) AND (shipment_id IN ( SELECT shipments.id
   FROM shipments
  WHERE (shipments.delivery_staff_id = auth.uid())))))` |
  | **INSERT** | Staff can insert shipment_items | authenticated | PERMISSIVE | WITH CHECK: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]))` |
  | **SELECT** | Staff can read shipment_items | authenticated | PERMISSIVE | USING: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'driver'::user_role, 'viewer'::user_role, 'sale'::user_role]))` |
  | **UPDATE** | Staff can update shipment_items | authenticated | PERMISSIVE | USING: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]))` |
  | **SELECT** | customer_portal_shipment_items_select | public | PERMISSIVE | USING: `(EXISTS ( SELECT 1
   FROM (shipments s
     JOIN profiles p ON ((p.customer_id = s.customer_id)))
  WHERE ((s.id = shipment_items.shipment_id) AND (p.id = auth.uid()))))` |
  | **ALL** | tenant_isolation_shipment_items | public | RESTRICTIVE | USING: `(tenant_id = current_tenant_id())` |

### 📦 Bảng: `quotations`

- **Cột liên kết đối tượng:** `id`, `quotation_number`, `customer_id`, `quotation_date`, `valid_until`, `subtotal`, `discount_type`, `discount_value`, `discount_amount`, `total_before_vat`, `vat_rate`, `vat_amount`, `total_amount`, `status`, `revision`, `parent_quotation_id`, `converted_order_id`, `delivery_terms`, `payment_terms`, `notes`, `created_by`, `confirmed_at`, `created_at`, `updated_at`, `tenant_id`
- **Số lượng Policy:** 10
  | Lệnh (CMD) | Tên Policy | Roles | Permissive | Điều Kiện (USING / WITH CHECK) |
  |:---:|---|---|:---:|---|
  | **SELECT** | Staff can read quotations | authenticated | PERMISSIVE | USING: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'driver'::user_role, 'viewer'::user_role, 'sale'::user_role]))` |
  | **DELETE** | Tenant Isolation Delete on quotations | authenticated | PERMISSIVE | USING: `((tenant_id IS NULL) OR (tenant_id = current_tenant_id()) OR (current_tenant_id() IS NULL))` |
  | **INSERT** | Tenant Isolation Insert on quotations | authenticated | PERMISSIVE | WITH CHECK: `((tenant_id IS NULL) OR (tenant_id = current_tenant_id()) OR (current_tenant_id() IS NULL))` |
  | **SELECT** | Tenant Isolation Select on quotations | authenticated | PERMISSIVE | USING: `((tenant_id IS NULL) OR (tenant_id = current_tenant_id()) OR (current_tenant_id() IS NULL))` |
  | **UPDATE** | Tenant Isolation Update on quotations | authenticated | PERMISSIVE | USING: `((tenant_id IS NULL) OR (tenant_id = current_tenant_id()) OR (current_tenant_id() IS NULL))` |
  | **DELETE** | quotations_delete | public | PERMISSIVE | USING: `(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'manager'::user_role])) AND (profiles.is_active = true))))` |
  | **INSERT** | quotations_insert | public | PERMISSIVE | WITH CHECK: `(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role)::text = ANY (ARRAY['admin'::text, 'manager'::text, 'sale'::text])) AND (profiles.is_active = true))))` |
  | **SELECT** | quotations_select | public | PERMISSIVE | USING: `true` |
  | **UPDATE** | quotations_update | public | PERMISSIVE | USING: `(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role)::text = ANY (ARRAY['admin'::text, 'manager'::text, 'sale'::text])) AND (profiles.is_active = true))))` |
  | **ALL** | tenant_isolation_quotations | public | RESTRICTIVE | USING: `(tenant_id = current_tenant_id())` |

### 📦 Bảng: `quotation_items`

- **Cột liên kết đối tượng:** `id`, `quotation_id`, `fabric_type`, `color_name`, `color_code`, `width_cm`, `quantity`, `unit`, `unit_price`, `amount`, `lead_time_days`, `notes`, `sort_order`, `tenant_id`
- **Số lượng Policy:** 10
  | Lệnh (CMD) | Tên Policy | Roles | Permissive | Điều Kiện (USING / WITH CHECK) |
  |:---:|---|---|:---:|---|
  | **SELECT** | Staff can read quotation_items | authenticated | PERMISSIVE | USING: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'driver'::user_role, 'viewer'::user_role, 'sale'::user_role]))` |
  | **DELETE** | Tenant Isolation Delete on quotation_items | authenticated | PERMISSIVE | USING: `((tenant_id IS NULL) OR (tenant_id = current_tenant_id()) OR (current_tenant_id() IS NULL))` |
  | **INSERT** | Tenant Isolation Insert on quotation_items | authenticated | PERMISSIVE | WITH CHECK: `((tenant_id IS NULL) OR (tenant_id = current_tenant_id()) OR (current_tenant_id() IS NULL))` |
  | **SELECT** | Tenant Isolation Select on quotation_items | authenticated | PERMISSIVE | USING: `((tenant_id IS NULL) OR (tenant_id = current_tenant_id()) OR (current_tenant_id() IS NULL))` |
  | **UPDATE** | Tenant Isolation Update on quotation_items | authenticated | PERMISSIVE | USING: `((tenant_id IS NULL) OR (tenant_id = current_tenant_id()) OR (current_tenant_id() IS NULL))` |
  | **DELETE** | quotation_items_delete | public | PERMISSIVE | USING: `(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role)::text = ANY (ARRAY['admin'::text, 'manager'::text, 'sale'::text])) AND (profiles.is_active = true))))` |
  | **INSERT** | quotation_items_insert | public | PERMISSIVE | WITH CHECK: `(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role)::text = ANY (ARRAY['admin'::text, 'manager'::text, 'sale'::text])) AND (profiles.is_active = true))))` |
  | **SELECT** | quotation_items_select | public | PERMISSIVE | USING: `true` |
  | **UPDATE** | quotation_items_update | public | PERMISSIVE | USING: `(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role)::text = ANY (ARRAY['admin'::text, 'manager'::text, 'sale'::text])) AND (profiles.is_active = true))))` |
  | **ALL** | tenant_isolation_quotation_items | public | RESTRICTIVE | USING: `(tenant_id = current_tenant_id())` |

### 📦 Bảng: `payments`

- **Cột liên kết đối tượng:** `id`, `payment_number`, `order_id`, `customer_id`, `payment_date`, `amount`, `payment_method`, `reference_number`, `notes`, `created_by`, `created_at`, `updated_at`, `account_id`, `tenant_id`
- **Số lượng Policy:** 6
  | Lệnh (CMD) | Tên Policy | Roles | Permissive | Điều Kiện (USING / WITH CHECK) |
  |:---:|---|---|:---:|---|
  | **DELETE** | Managers can delete payments | authenticated | PERMISSIVE | USING: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]))` |
  | **INSERT** | Staff can insert payments | authenticated | PERMISSIVE | WITH CHECK: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]))` |
  | **SELECT** | Staff can read payments | authenticated | PERMISSIVE | USING: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'driver'::user_role, 'viewer'::user_role, 'sale'::user_role]))` |
  | **UPDATE** | Staff can update payments | authenticated | PERMISSIVE | USING: `(current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]))` |
  | **SELECT** | customer_portal_payments_select | public | PERMISSIVE | USING: `(auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.customer_id = payments.customer_id)))` |
  | **ALL** | tenant_isolation_payments | public | RESTRICTIVE | USING: `(tenant_id = current_tenant_id())` |

### 📦 Bảng: `contracts`

- **Cột liên kết đối tượng:** `id`, `contract_number`, `type`, `status`, `content`, `template_id`, `party_a_type`, `party_a_id`, `party_a_name`, `party_a_address`, `party_a_tax_code`, `party_a_representative`, `party_a_title`, `party_b_name`, `party_b_address`, `party_b_tax_code`, `party_b_bank_account`, `party_b_representative`, `payment_term`, `effective_date`, `expiry_date`, `notes`, `source_order_id`, `pdf_url`, `pdf_generated_at`, `sent_at`, `sent_by`, `signed_at`, `signed_by`, `signed_file_url`, `cancelled_at`, `cancelled_by`, `cancel_reason`, `created_at`, `updated_at`, `created_by`, `tenant_id`
- **Số lượng Policy:** 4
  | Lệnh (CMD) | Tên Policy | Roles | Permissive | Điều Kiện (USING / WITH CHECK) |
  |:---:|---|---|:---:|---|
  | **SELECT** | Authenticated users can read contracts | authenticated | PERMISSIVE | USING: `(tenant_id = current_tenant_id())` |
  | **DELETE** | Managers can delete contracts | authenticated | PERMISSIVE | USING: `((tenant_id = current_tenant_id()) AND (current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role])))` |
  | **INSERT** | Staff can insert contracts | authenticated | PERMISSIVE | WITH CHECK: `((tenant_id = current_tenant_id()) AND (current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role])))` |
  | **UPDATE** | Staff can update contracts | authenticated | PERMISSIVE | USING: `((tenant_id = current_tenant_id()) AND (current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role])))` |

### 📦 Bảng: `order_requests`

- **Cột liên kết đối tượng:**
- **Số lượng Policy:** 0
  > ⚠️ **CẢNH BÁO NGUY HIỂM:** Bảng `order_requests` CHƯA CÓ RLS Policy hoặc RLS bị bypass hoàn toàn!
