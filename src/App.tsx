import { AppProviders } from '@/app/providers/AppProviders';
import { AppRouter } from '@/app/router/AppRouter';
import { useQueryInvalidationBridge } from '@/integration/useQueryInvalidationBridge';
import '@/styles/app-shell.css';
import '@/styles/data-ui.css';

function AppContent() {
  // Bridge lắng nghe System Events và cập nhật linh hoạt cache React Query.
  // Component này cần nằm TRONG AppProviders để truy cập được queryClient.
  useQueryInvalidationBridge();

  return <AppRouter />;
}

function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

export default App;
