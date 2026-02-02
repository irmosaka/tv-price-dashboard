export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* هدر */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            📺 داشبورد قیمت تلویزیون
          </h1>
          <p className="text-gray-600 text-lg">
            رصد و مقایسه هوشمند قیمت تلویزیون‌ها از فروشگاه‌های معتبر آنلاین
          </p>
        </header>

        {/* کارت‌های اطلاعاتی */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-blue-500 text-3xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">نمودارهای تعاملی</h3>
            <p className="text-gray-600">تحلیل روند قیمت‌ها با نمودارهای پیشرفته</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-green-500 text-3xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">جستجوی پیشرفته</h3>
            <p className="text-gray-600">فیلتر بر اساس برند، سایز، تکنولوژی</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-purple-500 text-3xl mb-4">📱</div>
            <h3 className="text-xl font-bold mb-2">موبایل فرندلی</h3>
            <p className="text-gray-600">طراحی واکنش‌گرا برای همه دستگاه‌ها</p>
          </div>
        </div>

        {/* بخش وضعیت پروژه */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">🎉 پروژه با موفقیت راه‌اندازی شد!</h2>
          
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">✅ کارهای انجام شده:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>ساخت ریپوزیتوری در گیت‌هاب</li>
              <li>ایجاد ساختار پوشه‌های پروژه</li>
              <li>راه‌اندازی Next.js با TypeScript و Tailwind</li>
              <li>نصب پکیج‌های ضروری</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-700">📋 مراحل بعدی:</h3>
            <ol className="list-decimal list-inside space-y-3">
              <li className="mb-2">
                <span className="font-medium">پیاده‌سازی اسکرپر برای دیجی‌کالا</span>
                <p className="text-gray-500 text-sm mr-6">جمع‌آوری داده‌های قیمت و مشخصات</p>
              </li>
              <li className="mb-2">
                <span className="font-medium">ایجاد مدل دیتابیس</span>
                <p className="text-gray-500 text-sm mr-6">طراحی جداول و رابطه‌ها با Prisma</p>
              </li>
              <li className="mb-2">
                <span className="font-medium">ساخت API endpoints</span>
                <p className="text-gray-500 text-sm mr-6">ایجاد route برای ذخیره و بازیابی داده</p>
              </li>
              <li className="mb-2">
                <span className="font-medium">ایجاد کامپوننت‌های نمودار</span>
                <p className="text-gray-500 text-sm mr-6">پیاده‌سازی نمودارها با Recharts</p>
              </li>
              <li>
                <span className="font-medium">دپلوی روی Vercel</span>
                <p className="text-gray-500 text-sm mr-6">انتشار پروژه و تنظیم اتوماسیون</p>
              </li>
            </ol>
          </div>
        </div>
        
        {/* دکمه‌های اقدام */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition">
            🚀 شروع اسکرپینگ
          </button>
          <button className="bg-gray-800 hover:bg-black text-white font-medium py-3 px-6 rounded-lg transition">
            📁 مشاهده کدها
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition">
            🌐 پیش‌نمایش زنده
          </button>
        </div>

        {/* فوتر */}
        <footer className="mt-16 text-center text-gray-500">
          <p>تمامی مراحل توسعه در محیط GitHub انجام شده است</p>
          <p className="mt-2">آماده برای قدم بعدی! 🚀</p>
        </footer>
      </div>
    </div>
  )
}
