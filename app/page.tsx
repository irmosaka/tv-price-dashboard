import { Card } from '@/components/ios/Card';
import { Button } from '@/components/ios/Button';
import { Icon } from '@/components/ios/Icon';

export default function Home() {
  return (
    <div className="min-h-screen bg-ios-gray-6 pb-20">
      {/* iOS Status Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-ios-gray-5">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ios-gray-1">۹:۴۱</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon name="wifi" size={14} />
              <Icon name="battery" size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Icon name="tv" size={48} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">داشبورد تلویزیون</h1>
              <p className="text-ios-gray-1 mt-1">مقایسه قیمت از فروشگاه‌های آنلاین</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card padding="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-ios-blue">۰</div>
              <div className="text-xs text-ios-gray-1 mt-1">محصولات</div>
            </div>
          </Card>
          <Card padding="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-ios-green">۳</div>
              <div className="text-xs text-ios-gray-1 mt-1">منابع</div>
            </div>
          </Card>
          <Card padding="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-ios-orange">۰</div>
              <div className="text-xs text-ios-gray-1 mt-1">برندها</div>
            </div>
          </Card>
          <Card padding="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-ios-purple">۰</div>
              <div className="text-xs text-ios-gray-1 mt-1">آپدیت</div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-4">عملیات سریع</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" icon={<Icon name="search" />} fullWidth>
              جستجوی پیشرفته
            </Button>
            <Button variant="secondary" icon={<Icon name="filter" />} fullWidth>
              فیلترها
            </Button>
            <Button variant="secondary" icon={<Icon name="chart" />} fullWidth>
              نمودارها
            </Button>
            <Button variant="secondary" icon={<Icon name="settings" />} fullWidth>
              تنظیمات
            </Button>
          </div>
        </Card>

        {/* Sources */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-4">منابع داده</h2>
          <div className="space-y-3">
            <div className="ios-list-item">
              <div className="flex items-center gap-3">
                <Icon name="digikala" size={28} />
                <div>
                  <div className="font-medium">دیجی‌کالا</div>
                  <div className="text-sm text-ios-gray-1">در حال راه‌اندازی</div>
                </div>
              </div>
              <Icon name="chevronRight" className="text-ios-gray-3" />
            </div>
            <div className="ios-list-item">
              <div className="flex items-center gap-3">
                <Icon name="tecnolife" size={28} />
                <div>
                  <div className="font-medium">تکنولایف</div>
                  <div className="text-sm text-ios-gray-1">به زودی</div>
                </div>
              </div>
              <Icon name="chevronRight" className="text-ios-gray-3" />
            </div>
            <div className="ios-list-item">
              <div className="flex items-center gap-3">
                <Icon name="torob" size={28} />
                <div>
                  <div className="font-medium">ترب</div>
                  <div className="text-sm text-ios-gray-1">به زودی</div>
                </div>
              </div>
              <Icon name="chevronRight" className="text-ios-gray-3" />
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="fixed bottom-6 left-4 right-4 max-w-4xl mx-auto">
          <Card padding="medium" className="shadow-ios-lg">
            <div className="text-center mb-4">
              <h3 className="font-bold text-lg mb-2">آماده برای شروع؟</h3>
              <p className="text-ios-gray-1 text-sm">اولین اسکرپر رو راه‌اندازی کن</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="primary" 
                icon={<Icon name="github" />}
                fullWidth
              >
                مشاهده کد
              </Button>
              <Button 
                variant="outline" 
                icon={<Icon name="add" />}
                fullWidth
              >
                شروع اسکرپینگ
              </Button>
            </div>
          </Card>
        </div>
      </main>

      {/* iOS Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-ios-gray-5">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-4 py-3">
            <button className="flex flex-col items-center gap-1">
              <Icon name="home" size={24} />
              <span className="text-xs text-ios-blue">خانه</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <Icon name="search" size={24} />
              <span className="text-xs text-ios-gray-2">جستجو</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <Icon name="chart" size={24} />
              <span className="text-xs text-ios-gray-2">تحلیل</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <Icon name="user" size={24} />
              <span className="text-xs text-ios-gray-2">پروفایل</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
