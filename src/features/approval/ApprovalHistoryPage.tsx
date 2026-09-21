export function ApprovalHistoryPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-4">
        Lịch sử phê duyệt toàn hệ thống
      </h1>
      <div className="p-8 bg-surface-secondary border border-default rounded-lg text-center">
        <p className="text-muted-foreground">
          Log toàn bộ sự kiện từ `approval_histories`.
          <br />
          Bao gồm tất cả ApprovalApproved, ApprovalRejected, ApprovalCancelled
          của mọi module.
        </p>
      </div>
    </div>
  );
}
