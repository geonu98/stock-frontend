export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">로그인</h2>

        <form className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 text-sm">이메일</label>
            <input 
              type="email"
              className="w-full border rounded-md px-3 py-2 focus:ring focus:ring-blue-200 outline-none"
              placeholder="example@gmail.com"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">비밀번호</label>
            <input 
              type="password"
              className="w-full border rounded-md px-3 py-2 focus:ring focus:ring-blue-200 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}
