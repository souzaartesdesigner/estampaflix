import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

interface AuthLayoutProps {
  children: ReactNode;
  heroTitle?: string;
  heroSubtitle?: string;
}

export function AuthLayout({ 
  children, 
  heroTitle = "SUBLIMAÇÃO",
  heroSubtitle = "Conecte-se, baixe milhares de artes e gere seus catálogos interativos em minutos."
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0a0a0a] text-white overflow-hidden font-sans">
      {/* Lado Esquerdo (Desktop Hero) */}
      <div className="hidden lg:flex lg:w-[60%] relative flex-col items-center justify-center p-12 overflow-hidden">
        {/* Glows / Gradientes radiais */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl text-center space-y-6">
          <Link to="/">
            <img
              src="https://estampaflix.com/__l5e/assets-v1/803758df-7757-44c9-8c71-26e110368b12/estampa-flix-logo.png"
              alt="Logo Estampa Flix"
              className="mx-auto mb-12 h-16 w-auto object-contain brightness-110"
            />
          </Link>
          
          <h1 className="text-6xl xl:text-8xl font-black tracking-tighter leading-none uppercase">
            {heroTitle} <span className="text-primary">EM ESCALA.</span>
          </h1>
          
          <p className="text-xl text-white/60 font-medium max-w-lg mx-auto">
            {heroSubtitle}
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-12 left-12 text-white/20 text-sm font-mono tracking-widest uppercase">
          Estampa Flix © 2026
        </div>
      </div>

      {/* Lado Direito (Formulários) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        {/* Mobile Logo */}
        <div className="absolute top-8 left-0 right-0 lg:hidden flex justify-center">
          <Link to="/">
            <img
              src="https://estampaflix.com/__l5e/assets-v1/803758df-7757-44c9-8c71-26e110368b12/estampa-flix-logo.png"
              alt="Logo Estampa Flix"
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-7 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
