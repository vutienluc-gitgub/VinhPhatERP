import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';
import { Icon } from '@/shared/components/Icon';
import { Portal } from '@/shared/components/Portal';

import { resolveGuides } from './engine/resolver';
import { GuideContent } from './components/GuideContent';
import { GuideSidebar } from './components/GuideSidebar';
import { GUIDE_MESSAGES } from './constants/messages';

export function GuidePage() {
  const { profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Resolve sections thông qua Engine thay vì filter chay ở UI
  const permittedSections = useMemo(() => {
    return resolveGuides({ role: profile?.role || null });
  }, [profile?.role]);

  // 2. Lấy active section từ URL (Nguồn sự thật duy nhất), fallback về section đầu tiên
  const activeSectionId =
    searchParams.get('section') || permittedSections[0]?.id || null;

  const activeSection = useMemo(
    () => permittedSections.find((s) => s.id === activeSectionId) || null,
    [activeSectionId, permittedSections],
  );

  const handleSelectSection = useCallback(
    (id: string) => {
      setSearchParams({ section: id });
      setMobileMenuOpen(false);
    },
    [setSearchParams],
  );

  // 3. Khoá scroll body khi mở menu mobile
  useBodyScrollLock(mobileMenuOpen);

  return (
    <div className="flex h-[calc(100vh-var(--header-height))] bg-surface overflow-hidden relative">
      {/* Mobile Header for toggle */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-14 bg-surface border-b border-border flex items-center px-4 z-20 shadow-sm">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="btn-icon mr-2"
          aria-label={GUIDE_MESSAGES.MENU_ARIA}
        >
          <Icon name="Menu" size={20} />
        </button>
        <Icon name="BookOpen" size={20} className="text-primary mr-2" />
        <span className="font-bold text-primary-strong">
          {GUIDE_MESSAGES.PAGE_TITLE}
        </span>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <GuideSidebar
          sections={permittedSections}
          activeSectionId={activeSectionId}
          onSelect={handleSelectSection}
        />
      </div>

      {/* Mobile Sidebar (Drawer) */}
      {mobileMenuOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex md:hidden">
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-[280px] max-w-[80vw] bg-surface shadow-2xl h-full animate-in slide-in-from-left duration-300 flex flex-col">
              <GuideSidebar
                sections={permittedSections}
                activeSectionId={activeSectionId}
                onSelect={handleSelectSection}
                onClose={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        </Portal>
      )}

      {/* Content Area */}
      <div className="flex-1 md:mt-0 mt-14 overflow-hidden flex flex-col">
        <GuideContent section={activeSection} />
      </div>
    </div>
  );
}
