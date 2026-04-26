'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

// Social icon SVGs (Instagram and Facebook not in this lucide version)

const NAV_LINKS = [
  { label: 'Inicio', href: '/' },
  { label: 'Sobre', href: '#sobre' },
  { label: 'Como Funciona', href: '#como-funciona' },
  { label: 'Depoimentos', href: '#depoimentos' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contato', href: '#contato' },
]

export function MobileMenu() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menu"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#E2E8F0] bg-white text-[#0F172A] lg:hidden"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-[#0F172A]">
          <div className="flex items-center justify-between px-6 py-5">
            <span className="text-xl font-extrabold text-white">
              CNH<span style={{ color: '#3ECF8E' }}>Simples</span>
            </span>
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-4 pt-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-[12px] px-4 py-4 text-lg font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3 p-6">
            <Link
              href="/login/aluno"
              onClick={() => setOpen(false)}
              className="w-full rounded-[9999px] border border-white/20 py-3 text-center text-sm font-semibold text-white"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro/instrutor"
              onClick={() => setOpen(false)}
              className="w-full rounded-[9999px] py-3 text-center text-sm font-semibold text-[#0F172A]"
              style={{ background: '#3ECF8E' }}
            >
              Sou Instrutor
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
