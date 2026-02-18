// src/components/common/LoginRequiredModal.tsx

type Props = {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
};

export default function LoginRequiredModal({
  open,
  onClose,
  onLogin,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-2">로그인이 필요합니다</h3>
        <p className="text-sm text-gray-600 mb-6">
          주문 기능을 이용하려면 로그인해주세요.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100"
          >
            취소
          </button>

          <button
            onClick={onLogin}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            로그인 하러 가기
          </button>
        </div>
      </div>
    </div>
  );
}
