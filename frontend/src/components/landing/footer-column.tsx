import { Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const socialLinks = [
  { icon: FacebookIcon, label: 'Facebook', href: '#' },
  { icon: InstagramIcon, label: 'Instagram', href: '#' },
  { icon: TwitterIcon, label: 'Twitter', href: '#' },
  { icon: LinkedinIcon, label: 'LinkedIn', href: '#' },
];

const productLinks = [
  { text: 'Contact Management', textAr: 'إدارة جهات الاتصال', href: '/contacts' },
  { text: 'Deal Management', textAr: 'إدارة الصفقات', href: '/deals' },
  { text: 'Pipeline Views', textAr: 'عرض خطوط الأنابيب', href: '/deals' },
  { text: 'Reports & Analytics', textAr: 'التقارير والتحليلات', href: '/reports' },
  { text: 'Task Management', textAr: 'إدارة المهام', href: '/tasks' },
];

const companyLinks = [
  { text: 'About Us', textAr: 'عن المنصة', href: '/about' },
  { text: 'Contact', textAr: 'تواصل معنا', href: '/contact' },
  { text: 'Login', textAr: 'تسجيل الدخول', href: '/login' },
];

const helpLinks = [
  { text: 'Dashboard', textAr: 'لوحة التحكم', href: '/dashboard' },
  { text: 'Orders', textAr: 'الطلبات', href: '/orders' },
  { text: 'Documents', textAr: 'المستندات', href: '/documents' },
];

const contactInfo = [
  // TODO: replace with production email before launch
  { icon: Mail, text: 'info@rootline-crm.example.com', href: 'mailto:info@rootline-crm.example.com' },
  { icon: Phone, text: '+201272728222', href: 'tel:+201272728222' },
  { icon: MapPin, text: 'Egypt & Gulf Region', textAr: 'مصر ومنطقة الخليج', isAddress: true },
];

export default function Footer4Col({ locale = 'en' }: { locale?: 'ar' | 'en' }) {
  const isAr = locale === 'ar';

  return (
    <footer className="bg-[#0a0a0f] border-t border-[#00d4ff]/20 w-full place-self-end rounded-t-xl">
      <div className="mx-auto max-w-screen-xl px-4 pt-12 pb-6 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div>
            <div className={`flex justify-center gap-3 sm:justify-start ${isAr ? 'sm:flex-row-reverse' : ''}`}>
              <img
                src="/logo-vector-white-2.png"
                alt="Rootline CRM"
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
                Rootline CRM
              </span>
            </div>

            <p className={`mt-6 max-w-md text-center text-sm leading-relaxed text-white/40 sm:max-w-xs ${isAr ? 'sm:text-right' : 'sm:text-left'}`}>
              {isAr
                ? 'Rootline CRM منصة إدارة علاقات العملاء المبنية من الأساس لتكون بسيطة وقوية وفعّالة. نؤمن بأن إدارة العملاء يجب أن تكون سهلة لكل فريق.'
                : 'Rootline CRM is a customer relationship management platform built from the ground up to be simple, powerful, and effective. We believe managing customers should be easy for every team.'}
            </p>

            <ul className={`mt-8 flex justify-center gap-6 sm:justify-start md:gap-8 ${isAr ? 'sm:flex-row-reverse' : ''}`}>
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-[#00d4ff] hover:text-[#00b8e6] transition">
                    <span className="sr-only">{label}</span>
                    <Icon className="size-6" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:col-span-2">
            <div className={`text-center sm:text-left ${isAr ? 'sm:text-right' : ''}`}>
              <p className="text-lg font-medium text-white">{isAr ? 'المنتجات' : 'Products'}</p>
              <ul className="mt-8 space-y-4 text-sm">
                {productLinks.map(({ text, textAr, href }) => (
                  <li key={text}>
                    <Link className="text-white/40 hover:text-white/60 transition" href={href}>
                      {isAr ? textAr : text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`text-center sm:text-left ${isAr ? 'sm:text-right' : ''}`}>
              <p className="text-lg font-medium text-white">{isAr ? 'الشركة' : 'Company'}</p>
              <ul className="mt-8 space-y-4 text-sm">
                {companyLinks.map(({ text, textAr, href }) => (
                  <li key={text}>
                    <Link className="text-white/40 hover:text-white/60 transition" href={href}>
                      {isAr ? textAr : text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`text-center sm:text-left ${isAr ? 'sm:text-right' : ''}`}>
              <p className="text-lg font-medium text-white">{isAr ? 'المساعدة' : 'Help'}</p>
              <ul className="mt-8 space-y-4 text-sm">
                {helpLinks.map(({ text, textAr, href }) => (
                  <li key={text}>
                    <Link className="text-white/40 hover:text-white/60 transition" href={href}>
                      {isAr ? textAr : text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`text-center sm:text-left ${isAr ? 'sm:text-right' : ''}`}>
              <p className="text-lg font-medium text-white">{isAr ? 'تواصل معنا' : 'Contact Us'}</p>
              <ul className="mt-8 space-y-4 text-sm">
                {contactInfo.map(({ icon: Icon, text, textAr, href, isAddress }) => (
                  <li key={text}>
                    {isAddress ? (
                      <div className={`flex items-center justify-center gap-1.5 ${isAr ? 'sm:flex-row-reverse sm:justify-end' : 'sm:justify-start'}`}>
                        <Icon className="text-[#00d4ff] size-5 shrink-0 shadow-sm" />
                        <address className="-mt-0.5 flex-1 text-sm not-italic text-white/40 transition">
                          {isAr ? textAr : text}
                        </address>
                      </div>
                    ) : (
                      <a href={href} className={`flex items-center justify-center gap-1.5 ${isAr ? 'sm:flex-row-reverse sm:justify-end' : 'sm:justify-start'}`}>
                        <Icon className="text-[#00d4ff] size-5 shrink-0 shadow-sm" />
                        <span className="flex-1 text-sm text-white/40 transition">{text}</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-[#00d4ff]/20 pt-6">
          <div className={`text-center sm:flex sm:justify-between sm:text-left ${isAr ? 'sm:flex-row-reverse sm:text-right' : ''}`}>
            <p className="text-sm text-white/40">
              <span className="block sm:inline">{isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</span>
            </p>
            <p className="mt-4 text-sm text-white/40 transition sm:order-first sm:mt-0">
              &copy; 2026 Rootline CRM
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
