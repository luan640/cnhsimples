import Link from 'next/link'
import { Car } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t py-10 px-4" style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-[#0F172A]">
          <div className="w-7 h-7 rounded-[6px] flex items-center justify-center" style={{ background: '#3ECF8E' }}>
            <Car size={15} color="#0F172A" />
          </div>
          <span>CNH Simples</span>
        </Link>

        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[#64748B]">
          <Link href="/sobre" className="hover:text-[#0F172A] transition-colors">Sobre</Link>
          <Link href="/termos" className="hover:text-[#0F172A] transition-colors">Termos de uso</Link>
          <Link href="/privacidade" className="hover:text-[#0F172A] transition-colors">Privacidade</Link>
          <Link href="/contato" className="hover:text-[#0F172A] transition-colors">Contato</Link>
          <Link href="/cadastro/instrutor" className="hover:text-[#0F172A] transition-colors">Seja Instrutor</Link>
        </nav>

        <p className="text-sm text-[#64748B]">
          © {new Date().getFullYear()} CNH Simples · Fortaleza, CE
        </p>
      </div>
    </footer>
  )
}
