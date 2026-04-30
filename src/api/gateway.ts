import { supabase, untypedDb } from '@/services/supabase/client';
import { APP_CONFIG, HTTP_HEADERS } from '@/shared/utils/constants';

export type ApiVersion = 'v1' | 'v2';

/**
 * Mẫu thiết kế API Gateway (Facade Pattern) chuẩn SaaS.
 * Giúp cô lập phiên bản API và tạo một điểm truy cập duy nhất cho toàn bộ hệ thống.
 *
 * Thay vì: import { fetchOrders } from '@/api/orders.api';
 * Sẽ dùng: api.v1.orders.list() hoặc api.v2.orders.list()
 */

// Import các modules (sau này có thể chia thành folder v1/, v2/)
import * as ordersApi from './orders.api';
import * as customersApi from './customers.api';
import * as productsApi from './fabric-catalog.api';
import * as authApi from './permissions.api';

// --- API Version 1 ---
const v1 = {
  orders: ordersApi,
  customers: customersApi,
  products: productsApi,
  auth: authApi,
};

// --- API Version 2 (Tương lai) ---
const v2 = {
  // Ví dụ: v2 có thể map tới một logic lấy dữ liệu hoàn toàn khác
  // orders: ordersApiV2,
};

export const api = {
  v1,
  v2,

  /**
   * Utility để lấy Header version động cho các Custom Fetch requests
   */
  getHeaders: (version: ApiVersion = 'v1') => {
    return {
      'Content-Type': HTTP_HEADERS.CONTENT_TYPE_JSON,
      [HTTP_HEADERS.ACCEPT_VERSION]: version,
      [HTTP_HEADERS.X_APP_CLIENT]: APP_CONFIG.CLIENT_NAME,
    };
  },

  /**
   * Trả về Supabase client trỏ tới schema versioning riêng biệt.
   * Supabase (PostgREST) hỗ trợ routing schema thông qua tên schema thay vì public.
   */
  getClient: (version: ApiVersion = 'v1') => {
    if (version === 'v2') {
      // Ví dụ: khi v2 release, toàn bộ schema db của v2 nằm ở `api_v2` thay vì `public`.
      // Dùng untypedDb.schema() vì Database generated types hiện tại chỉ có 'public'
      return untypedDb.schema('api_v2');
    }
    return supabase; // v1 dùng public mặc định
  },
};
