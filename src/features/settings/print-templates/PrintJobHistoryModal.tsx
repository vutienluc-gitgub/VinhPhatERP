import { usePrintJobs } from '@/domain/print';
import { Button, Icon } from '@/shared/components';

interface PrintJobHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrintJobHistoryModal({
  isOpen,
  onClose,
}: PrintJobHistoryModalProps) {
  const { data: jobs = [], isLoading } = usePrintJobs();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[85vh] bg-surface rounded-2xl border border-default shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-default bg-surface-secondary/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="History" size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                Nhật Ký Lệnh In Ấn (Print Jobs Audit Log)
              </h3>
              <span className="text-xs text-muted">
                Theo dõi lịch sử các bản in đã xuất, thiết bị và thời gian thực
                hiện
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-muted hover:text-foreground flex items-center justify-center"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <div className="h-10 bg-surface-secondary rounded animate-pulse" />
              <div className="h-10 bg-surface-secondary rounded animate-pulse" />
              <div className="h-10 bg-surface-secondary rounded animate-pulse" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-2 border border-dashed border-default rounded-2xl">
              <Icon name="Printer" size={28} className="text-muted/60" />
              <span className="text-sm font-semibold text-foreground">
                Chưa có nhật ký in nào được ghi nhận
              </span>
              <span className="text-xs text-muted">
                Các lệnh in chứng từ từ màn hình nghiệp vụ sẽ tự động lưu vết
                tại đây.
              </span>
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-xl border border-default">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface-secondary text-foreground font-bold border-b border-default uppercase text-[10px] tracking-wide">
                  <tr>
                    <th className="py-3 px-3.5">Mã Lệnh In</th>
                    <th className="py-3 px-3.5">Loại Chứng Từ</th>
                    <th className="py-3 px-3.5">Số Chứng Từ</th>
                    <th className="py-3 px-3.5">Người Thực Hiện</th>
                    <th className="py-3 px-3.5">Định Dạng</th>
                    <th className="py-3 px-3.5">Thời Gian</th>
                    <th className="py-3 px-3.5 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-surface-secondary/40">
                      <td className="py-3 px-3.5 font-mono font-bold text-foreground">
                        {job.id}
                      </td>
                      <td className="py-3 px-3.5 text-foreground">
                        {job.documentType}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-primary font-bold">
                        {job.documentId}
                      </td>
                      <td className="py-3 px-3.5 text-foreground">
                        {job.requestedBy}
                      </td>
                      <td className="py-3 px-3.5 uppercase font-mono text-[11px] text-muted">
                        {job.outputType}
                      </td>
                      <td className="py-3 px-3.5 text-muted font-mono text-[11px]">
                        {job.createdAt.slice(0, 19).replace('T', ' ')}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            job.status === 'completed'
                              ? 'bg-success-soft text-success'
                              : 'bg-danger-soft text-danger'
                          }`}
                        >
                          {job.status === 'completed'
                            ? 'Thành công'
                            : 'Thất bại'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-default flex justify-end bg-surface">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
