import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Star } from "lucide-react";

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.86 5.86 0 0 0-2.13 1.38A5.86 5.86 0 0 0 .63 4.14c-.3.76-.5 1.64-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.73 1.46 1.38 2.13.67.65 1.34 1.07 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.86 5.86 0 0 0 2.13-1.38 5.86 5.86 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.86 5.86 0 0 0-1.38-2.13A5.86 5.86 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
  </svg>
);

const TikTokIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.4a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.01-.83z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.05 1.02-1.05 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.07-.12-.27-.2-.57-.35zM12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.75.98 1.01-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.29c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.13 1.03 7 2.9a9.82 9.82 0 0 1 2.9 7c-.01 5.46-4.45 9.91-9.91 9.91zM12.05 2C6.58 2 2.13 6.45 2.13 11.92c0 1.75.46 3.46 1.33 4.97L2 22l5.26-1.38a9.93 9.93 0 0 0 4.79 1.23h.01c5.47 0 9.92-4.45 9.92-9.92 0-2.65-1.03-5.14-2.91-7A9.86 9.86 0 0 0 12.05 2z" />
  </svg>
);

function FooterBottom() {
  const [stats, setStats] = useState({ rating: "5.0", count: 133 });

  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch("/api/reviews", { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && data.averageRating && data.totalReviewCount) {
          setStats({ rating: data.averageRating.toFixed(1), count: data.totalReviewCount });
        }
      } catch (_err) { /* keep defaults */ }
    };
    loadStats();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <div className="my-8 h-px w-full bg-white/10" />
      <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
            <Star size={20} className="fill-yellow-400 text-yellow-400" />
          </div>
          <div>
            <h4 className="font-bold text-white">Google Reviews</h4>
            <p className="text-sm text-gray-400">★★★★★ {stats.rating} from {stats.count} Reviews</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="https://www.facebook.com/raziadrivingcenter" target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-2xl bg-white/5 p-4 text-gray-300 transition-all duration-300 hover:-translate-y-2 hover:bg-[#1877F2] hover:text-white"><FacebookIcon /></a>
          <a href="https://www.instagram.com/raziadrivingcenter" target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-2xl bg-white/5 p-4 text-gray-300 transition-all duration-300 hover:-translate-y-2 hover:bg-[#E1306C] hover:text-white"><InstagramIcon /></a>
          <a href="https://www.tiktok.com/@raziadrivingcenter" target="_blank" rel="noreferrer" aria-label="TikTok" className="rounded-2xl bg-white/5 p-4 text-gray-300 transition-all duration-300 hover:-translate-y-2 hover:bg-black hover:text-white"><TikTokIcon /></a>
          <a href="https://www.google.com/maps/dir//Razia+Driving+Center,+Gulberg+2,+Lahore,+Pakistan/" target="_blank" rel="noreferrer" aria-label="Google Maps" className="rounded-2xl bg-white/5 p-4 text-gray-300 transition-all duration-300 hover:-translate-y-2 hover:bg-[#4285F4] hover:text-white"><MapPin size={18} /></a>
          <a href="https://wa.me/923094461407" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="rounded-2xl bg-white/5 p-4 text-gray-300 transition-all duration-300 hover:-translate-y-2 hover:bg-[#25D366] hover:text-white"><WhatsAppIcon /></a>
        </div>
      </div>
      <div className="mt-8 border-t border-white/10 pt-6">
        <div className="flex flex-col items-center justify-between gap-4 text-center lg:flex-row">
          <p className="text-gray-500">© 2026 Razia Driving Center. All Rights Reserved.</p>
          <p className="font-medium text-gray-400">Learn Today. Drive Forever.</p>
        </div>
      </div>
    </>
  );
}

export default FooterBottom;
