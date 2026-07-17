import { MessageCircle } from "lucide-react";
import { whatsappUrl } from "../data/content";

export function WhatsAppFab() {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-40 group flex items-center gap-2 rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 pl-4 pr-4 py-4 md:pr-5 transition-all hover:shadow-xl hover:shadow-[#25D366]/40 hover:scale-105"
      aria-label="Chat via WhatsApp"
    >
      <MessageCircle size={22} className="shrink-0" />
      <span className="hidden md:inline text-sm font-semibold max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
        Chat Admin
      </span>
    </a>
  );
}
