export default function Home() {
  return (
    <div className="p-6 space-y-10">

      {/* --- 1. 시장 지수 박스 --- */}
      <section>
        <h2 className="text-xl font-bold mb-3">📈 시장 지수</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* KOSPI */}
          <div className="p-5 bg-white dark:bg-gray-800 shadow rounded-xl">
            <div className="text-gray-500 dark:text-gray-300">KOSPI</div>
            <div className="text-2xl font-bold text-red-500">+12.35 (0.55%)</div>
          </div>

          {/* KOSDAQ */}
          <div className="p-5 bg-white dark:bg-gray-800 shadow rounded-xl">
            <div className="text-gray-500 dark:text-gray-300">KOSDAQ</div>
            <div className="text-2xl font-bold text-blue-500">-4.21 (-0.32%)</div>
          </div>

          {/* 환율 */}
          <div className="p-5 bg-white dark:bg-gray-800 shadow rounded-xl">
            <div className="text-gray-500 dark:text-gray-300">USD/KRW</div>
            <div className="text-2xl font-bold text-red-500">+8.20</div>
          </div>
        </div>
      </section>

      {/* --- 2. 인기 종목 --- */}
      <section>
        <h2 className="text-xl font-bold mb-3">🔥 오늘의 인기 종목</h2>

        <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-4">
          <div className="divide-y dark:divide-gray-700">
            {/* item 1 */}
            <div className="flex justify-between py-3">
              <div>
                <div className="font-semibold">삼성전자</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  Electronics
                </div>
              </div>
              <div className="text-right text-red-500 font-semibold">+2.14%</div>
            </div>

            {/* item 2 */}
            <div className="flex justify-between py-3">
              <div>
                <div className="font-semibold">LG에너지솔루션</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  Battery
                </div>
              </div>
              <div className="text-right text-blue-500 font-semibold">-1.02%</div>
            </div>

            {/* item 3 */}
            <div className="flex justify-between py-3">
              <div>
                <div className="font-semibold">NAVER</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  Tech
                </div>
              </div>
              <div className="text-right text-red-500 font-semibold">+3.35%</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 3. 포트폴리오 요약 (미로그인 상태 가정) --- */}
      <section>
        <h2 className="text-xl font-bold mb-3">📊 내 포트폴리오</h2>

        <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-xl shadow text-gray-700 dark:text-gray-300">
          <div className="text-lg font-semibold mb-2">로그인하면 포트폴리오 현황을 확인할 수 있어요.</div>
          <button className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
            로그인하기
          </button>
        </div>
      </section>

      {/* --- 4. 주요 뉴스 --- */}
      <section className="pb-10">
        <h2 className="text-xl font-bold mb-3">📰 주요 뉴스</h2>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow space-y-3">
          <div className="font-semibold hover:underline cursor-pointer">
            •  삼성전자, 신형 반도체 발표 예정
          </div>
          <div className="font-semibold hover:underline cursor-pointer">
            •  미 연준, 금리 동결 발표
          </div>
          <div className="font-semibold hover:underline cursor-pointer">
            •  코스피, 글로벌 장 분위기 영향으로 상승
          </div>
        </div>
      </section>

    </div>
  );
}
