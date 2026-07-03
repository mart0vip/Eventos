import { Mail, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/icons/SocialIcons";

export default function TopBar() {
  return (
    <div className="hidden md:block bg-saddle text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between text-xs">
        <div className="flex items-center gap-5">
          <a
            href="mailto:secretaria@clubhipicoargentino.org.ar"
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <Mail size={13} />
            secretaria@clubhipicoargentino.org.ar
          </a>
          <a
            href="tel:+541147871003"
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <Phone size={13} />
            +54 11-4787-1003
          </a>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://facebook.com/hipicoargentinofanpage"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="hover:opacity-80 transition-opacity"
          >
            <FacebookIcon size={14} />
          </a>
          <a
            href="https://instagram.com/clubhipicoargentino"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hover:opacity-80 transition-opacity"
          >
            <InstagramIcon size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
