import Image from 'next/image'
import Link from 'next/link'
import { Outfit } from 'next/font/google'
import {
  ChevronDown,
  ChevronRight,
  Menu,
  Search,
} from 'lucide-react'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const heroImage =
  'https://images.pexels.com/photos/8867431/pexels-photo-8867431.jpeg?auto=compress&cs=tinysrgb&w=1200'
const carImage =
  'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=1200'
const founderImage =
  'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1200'

function SocialIcon({ type }: { type: 'facebook' | 'twitter' | 'instagram' | 'linkedin' }) {
  if (type === 'facebook') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.6.4-1 1-1Z" fill="currentColor" />
      </svg>
    )
  }

  if (type === 'twitter') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M18.9 4H22l-6.8 7.8L23 20h-6.1l-4.8-5.2L7.6 20H4.5l7.2-8.2L4 4h6.2l4.3 4.8L18.9 4Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  if (type === 'instagram') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
      </svg>
    )
  }

  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 8a1 1 0 0 1 1-1h2.6a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8Zm6 0a1 1 0 0 1 1-1h2.4a3.6 3.6 0 0 1 3.6 3.6V16a1 1 0 0 1-1 1h-2.6a1 1 0 0 1-1-1v-4.4c0-.8-.5-1.4-1.3-1.4-.8 0-1.3.6-1.3 1.4V16a1 1 0 0 1-1 1H14a1 1 0 0 1-1-1V8Z"
        fill="currentColor"
      />
      <circle cx="9.3" cy="4.8" r="1.3" fill="currentColor" />
    </svg>
  )
}

function TopBar() {
  return (
    <div className="hidden bg-[#161518] text-white lg:block">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-8 py-3 text-[11px] font-medium uppercase tracking-[0.18em]">
        <div className="flex items-center gap-2 text-[#f4c400]">
          <span className="inline-block h-2 w-2 rounded-full bg-[#f4c400]" />
          <span>Training Time: Hot Class 7am to 11am</span>
        </div>

        <div className="flex items-center gap-2 text-white/80">
          <span className="text-[#f4c400]">◎</span>
          <span>We have come closer to you: San Fransisco</span>
          <ChevronRight size={12} className="text-[#f4c400]" />
        </div>

        <div className="flex items-center gap-3 text-white/80">
          <span className="text-[11px] tracking-[0.2em] text-[#f4c400]">Social Media</span>
          <SocialIcon type="facebook" />
          <SocialIcon type="twitter" />
          <SocialIcon type="instagram" />
          <SocialIcon type="linkedin" />
        </div>
      </div>
    </div>
  )
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12 overflow-hidden rounded-full border border-[#d8d8d8] bg-[#f6c808] p-1.5">
        <div className="flex h-full w-full items-center justify-center rounded-full bg-[#111111] text-[10px] font-bold uppercase tracking-[0.18em] text-white">
          ud
        </div>
      </div>
      <div className="text-[42px] font-semibold leading-none tracking-[-0.06em] text-[#121212]">
        udrive
      </div>
    </div>
  )
}

function HeroVisual({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-[#efefef] ${className}`}
      style={{
        clipPath: 'polygon(0 0, 84% 0, 100% 18%, 100% 100%, 17% 100%, 0 82%)',
      }}
    >
      <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 520px" />
    </div>
  )
}

function NumberTabs() {
  const items = [
    { label: '01', active: false },
    { label: '02', active: true },
    { label: '03', active: false },
  ]

  return (
    <div className="flex items-center gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex h-12 w-12 items-center justify-center text-[14px] font-medium"
          style={{
            background: item.active ? '#f7cf11' : '#f5f5f5',
            color: item.active ? '#111111' : '#8d8d8d',
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  )
}

function SocialButtons() {
  const icons: Array<'facebook' | 'twitter' | 'linkedin'> = ['facebook', 'twitter', 'linkedin']
  return (
    <div className="flex items-center gap-2">
      {icons.map((icon, index) => (
        <div
          key={index}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ececec] text-[#8a8a8a]"
        >
          <SocialIcon type={icon} />
        </div>
      ))}
    </div>
  )
}

function StarRow() {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className="h-2.5 w-2.5 bg-[#f7cf11]" />
      ))}
    </div>
  )
}

export function LandingPage() {
  return (
    <div className={`${outfit.className} min-h-screen bg-[#fbfbfb] text-[#101010]`}>
      <TopBar />

      <header className="bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-7 lg:px-8">
          <BrandMark />

          <nav className="hidden items-center gap-7 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a] xl:flex">
            <Link href="/" className="flex items-center gap-1">
              Home <ChevronDown size={12} />
            </Link>
            <Link href="/" className="flex items-center gap-1">
              About <ChevronDown size={12} />
            </Link>
            <Link href="/" className="flex items-center gap-1">
              Courses <ChevronDown size={12} />
            </Link>
            <Link href="/" className="flex items-center gap-1">
              Services <ChevronDown size={12} />
            </Link>
            <Link href="/" className="flex items-center gap-1">
              Blog <ChevronDown size={12} />
            </Link>
            <Link href="/">Contact</Link>
          </nav>

          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Search"
              className="hidden h-11 w-11 items-center justify-center text-[#141414] lg:flex"
            >
              <Search size={17} strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Menu"
              className="flex h-11 w-11 items-center justify-center text-[#141414]"
            >
              <Menu size={24} strokeWidth={1.8} />
            </button>
            <Link
              href="/login/instrutor"
              className="hidden min-w-[170px] bg-[#f7cf11] px-7 py-4 text-center text-[12px] font-bold uppercase tracking-[0.18em] text-[#111111] lg:block"
            >
              Consultation
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-white">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-6 py-6 pb-20 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:pt-2">
            <div className="flex flex-col justify-center pt-8 lg:pt-16">
              <h1 className="max-w-[420px] text-[54px] font-semibold leading-[0.98] tracking-[-0.06em] text-[#131313] md:text-[78px]">
                Fast Track Driving Lessons
              </h1>

              <p className="mt-8 max-w-[330px] text-[14px] leading-7 text-[#9c9c9c]">
                Idea of denouncing pleasure and praising pain was born and we will give you a complete.
              </p>

              <div className="mt-10">
                <Link
                  href="/buscar"
                  className="inline-flex bg-[#121212] px-8 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white"
                  style={{ boxShadow: '8px 8px 0 #e9e9e9' }}
                >
                  Test Vehicle
                </Link>
              </div>
            </div>

            <div className="flex flex-col items-center gap-8 lg:items-end">
              <HeroVisual src={heroImage} alt="Motorista sorrindo dentro do carro" className="h-[320px] w-full max-w-[540px] md:h-[420px]" />
              <div className="w-full max-w-[540px] pr-0 lg:pr-3">
                <div className="flex justify-center lg:justify-end">
                  <NumberTabs />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#fbfbfb]">
          <div className="mx-auto max-w-[1200px] px-6 py-10 pb-24 lg:px-8 lg:py-16 lg:pb-28">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_0.95fr]">
              <div>
                <h2 className="max-w-[580px] text-[40px] font-semibold leading-[1.05] tracking-[-0.05em] text-[#141414] md:text-[58px]">
                  A perfect driving school with latest vehicles
                </h2>

                <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-[0.92fr_1.08fr]">
                  <HeroVisual src={carImage} alt="Carro na estrada" className="h-[300px] md:h-[340px]" />

                  <div className="flex flex-col justify-between gap-6">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#1a1a1a]">Since</p>
                      <div className="mt-3 flex items-center gap-4">
                        <span className="text-[56px] font-semibold leading-none tracking-[-0.06em] text-[#111111]">
                          2006
                        </span>
                        <div className="flex gap-1.5 pt-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <span
                              key={index}
                              className="block h-3 w-6"
                              style={{
                                background: '#f6c808',
                                clipPath: 'polygon(0 0, 68% 0, 100% 50%, 68% 100%, 0 100%, 28% 50%)',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 text-[14px] leading-7 text-[#8d8d8d]">
                      <p>
                        Expire to you how all this mistaken denouncing pleasure and praising pain was born and we will give
                        you a complete account of the system and expound the actual teachings.
                      </p>
                      <p>
                        Mistaken denouncing pleasure and praising pain was born and we will give you complete account of the
                        system anyone.
                      </p>
                    </div>

                    <div className="flex items-end justify-between gap-6 border-t border-[#ececec] pt-6">
                      <div>
                        <div className="text-[48px] leading-none text-[#131313]">~</div>
                        <div className="mt-4">
                          <p className="text-[18px] font-semibold text-[#111111]">Isaac Herman</p>
                          <p className="text-[12px] uppercase tracking-[0.18em] text-[#9a9a9a]">Founder</p>
                        </div>
                      </div>

                      <Link
                        href="/buscar"
                        className="inline-flex bg-[#111111] px-8 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white"
                      >
                        Read More
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-6 lg:items-end">
                <HeroVisual
                  src={founderImage}
                  alt="Homem de terno sorrindo dentro do carro"
                  className="h-[340px] w-full max-w-[380px] md:h-[430px]"
                />

                <div className="w-full max-w-[380px] bg-white px-7 py-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8f8f8f]">Follow Me On</p>
                  <div className="mt-4">
                    <SocialButtons />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-[1.05fr_1fr] lg:px-8">
            <div className="flex items-start gap-6">
              <div className="h-16 w-1 bg-[#111111]" />
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]">our learners</p>
                <div className="mt-5 inline-flex items-center gap-3 bg-[#111111] px-5 py-4 text-white">
                  <span className="inline-flex h-9 w-9 items-center justify-center bg-[#f7cf11] text-[12px] font-bold text-[#111111]">
                    ▶
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold">Download Course Content</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/55">PDF and Kit</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-[160px_1fr]">
              <div className="relative mx-auto h-[170px] w-[110px]">
                <div className="absolute left-1/2 top-0 h-full w-[88px] -translate-x-1/2 rounded-[30px] bg-[#f7cf11]" />
                <div className="absolute left-1/2 top-3 h-[146px] w-[66px] -translate-x-1/2 rounded-[18px] bg-[#1e3a5f]" />
                <div className="absolute left-1/2 top-[22px] h-[102px] w-[42px] -translate-x-1/2 rounded-[12px] bg-[#16314c]" />
              </div>

              <ul className="space-y-3 pt-3 text-[13px] leading-7 text-[#606060]">
                <li className="flex items-center gap-3"><span className="h-2 w-2 bg-[#f7cf11]" />Traffic Signs & Control Devices</li>
                <li className="flex items-center gap-3"><span className="h-2 w-2 bg-[#f7cf11]" />Rules of the Road</li>
                <li className="flex items-center gap-3"><span className="h-2 w-2 bg-[#f7cf11]" />Defensive Driving and Road Tests</li>
                <li className="flex items-center gap-3"><span className="h-2 w-2 bg-[#f7cf11]" />Driving in Dangerous Conditions</li>
                <li className="flex items-center gap-3"><span className="h-2 w-2 bg-[#f7cf11]" />Emergency Accident</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#151515]">
          <div className="absolute inset-0 opacity-20">
            <Image src={founderImage} alt="" fill className="object-cover object-left" sizes="100vw" />
          </div>
          <div className="absolute inset-0 bg-[#111111]/85" />
          <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="max-w-[320px] text-white">
              <h3 className="text-[42px] font-semibold leading-[1] tracking-[-0.05em]">Reviews & Testimonials</h3>
              <p className="mt-5 text-[14px] leading-7 text-white/65">
                Hear the inspiring experience of our older students and discover why learners prefer this school.
              </p>
              <div className="mt-6">
                <StarRow />
              </div>
              <p className="mt-4 text-[12px] uppercase tracking-[0.14em] text-white/65">Trust Score 4.5 | 3,500 reviewed</p>
              <div className="mt-8">
                <Link
                  href="/buscar"
                  className="inline-flex bg-white px-7 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-[#111111]"
                >
                  All Reviews
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {[
                {
                  title: 'This is the Best Driving School in City',
                  text: 'Professional instructors with calm teaching style and modern lessons for complete confidence on road.',
                  name: 'Brett Daniels',
                },
                {
                  title: 'Great Experience with Udrive Team',
                  text: 'Everything from first class to final road preparation felt practical, structured and encouraging.',
                  name: 'Mia Isabella',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border border-white/12 bg-[#1b1b1b] p-7 text-white"
                  style={{ clipPath: 'polygon(0 0, 88% 0, 100% 14%, 100% 100%, 0 100%)' }}
                >
                  <StarRow />
                  <h4 className="mt-6 text-[24px] font-semibold leading-[1.08] tracking-[-0.04em]">{item.title}</h4>
                  <p className="mt-4 text-[13px] leading-7 text-white/62">{item.text}</p>
                  <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                    <div className="relative h-11 w-11 overflow-hidden rounded-full">
                      <Image src={founderImage} alt={item.name} fill className="object-cover" sizes="44px" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold">{item.name}</p>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Happy Learner</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-[1200px] px-6 py-16 lg:px-8 lg:py-20">
            <div className="text-center">
              <h3 className="text-[38px] font-semibold tracking-[-0.05em] text-[#111111] md:text-[48px]">
                Latest form our blog post
              </h3>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  image: carImage,
                  title: 'Driving tips that make you a far better driver',
                },
                {
                  image: heroImage,
                  title: 'Description need to know local parking',
                },
                {
                  image: founderImage,
                  title: 'Best roads to practice driving in urban areas',
                },
              ].map((post, index) => (
                <article key={index} className="bg-white">
                  <div className="relative h-[210px] overflow-hidden">
                    <Image src={post.image} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                    <span className="absolute left-0 top-0 bg-[#f7cf11] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#111111]">
                      Option Tips
                    </span>
                  </div>
                  <div className="border border-t-0 border-[#efefef] px-5 py-5">
                    <h4 className="text-[20px] font-semibold leading-[1.12] tracking-[-0.04em] text-[#111111]">
                      {post.title}
                    </h4>
                    <div className="mt-4 flex items-center gap-4 text-[11px] uppercase tracking-[0.14em] text-[#999999]">
                      <span>27 April, 2026</span>
                      <span>0 Comments</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-[#fbfbfb]">
          <div className="mx-auto max-w-[1200px] px-6 py-8 lg:px-8">
            <div className="relative overflow-hidden bg-white px-6 py-12 lg:px-10 lg:py-14">
              <div className="absolute left-0 top-0 h-20 w-32 bg-[#f4f4f4]" style={{ clipPath: 'polygon(0 0, 100% 0, 58% 100%, 0 100%)' }} />
              <div className="absolute right-0 top-0 h-full w-[38%] bg-[#f7cf11]" style={{ clipPath: 'polygon(28% 0, 100% 0, 100% 100%, 0 100%)' }} />
              <div className="absolute left-[44%] top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 text-[86px] font-bold tracking-[-0.08em] text-[#111111] lg:block">
                TKE
              </div>

              <div className="relative z-20 grid grid-cols-1 gap-5 md:grid-cols-3">
                {[
                  { title: 'Learn Traffic Signs', image: carImage },
                  { title: "Don't Miss Anything", image: heroImage },
                  { title: 'Drive with More Control', image: founderImage },
                ].map((card, index) => (
                  <div key={index} className="overflow-hidden bg-[#111111] text-white">
                    <div className="relative h-[220px]">
                      <Image src={card.image} alt={card.title} fill className="object-cover opacity-80" sizes="(max-width: 768px) 100vw, 33vw" />
                    </div>
                    <div className="flex items-center justify-between bg-[#111111] px-5 py-5">
                      <div>
                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#f7cf11] text-[13px] font-bold text-[#111111]">
                          {index + 1}
                        </div>
                        <p className="text-[28px] font-semibold leading-[1] tracking-[-0.05em]">{card.title}</p>
                      </div>
                      <span className="inline-flex h-10 w-10 items-center justify-center bg-[#f7cf11] text-[#111111]">↗</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-[#161616] text-white">
          <div className="mx-auto max-w-[1200px] px-6 py-14 lg:px-8">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.1fr_0.8fr_0.8fr_1fr]">
              <div>
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-[#f6c808] p-1.5">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[#111111] text-[9px] font-bold uppercase tracking-[0.16em] text-white">
                      ud
                    </div>
                  </div>
                  <div className="text-[30px] font-semibold tracking-[-0.06em]">udrive</div>
                </div>
                <p className="mt-5 max-w-[260px] text-[13px] leading-7 text-white/55">
                  Teach driving with proper rules and regulations. Structure focused lessons and practical road confidence.
                </p>
                <p className="mt-6 text-[12px] uppercase tracking-[0.16em] text-white/35">Office</p>
                <p className="mt-2 text-[13px] text-white/60">25 Main Road, San Fransisco, CA</p>
              </div>

              <div>
                <h4 className="text-[14px] font-semibold uppercase tracking-[0.18em] text-white">Our Company</h4>
                <ul className="mt-5 space-y-3 text-[13px] text-white/55">
                  <li>About Us</li>
                  <li>Lessons</li>
                  <li>Driving Services</li>
                  <li>Pricing Plans</li>
                  <li>City Coverage</li>
                </ul>
              </div>

              <div>
                <h4 className="text-[14px] font-semibold uppercase tracking-[0.18em] text-white">Essential Links</h4>
                <ul className="mt-5 space-y-3 text-[13px] text-white/55">
                  <li>Book Now</li>
                  <li>Blog Articles</li>
                  <li>Traffic Rules</li>
                  <li>Safety Guides</li>
                  <li>Road Tests</li>
                </ul>
              </div>

              <div>
                <h4 className="text-[14px] font-semibold uppercase tracking-[0.18em] text-white">Gallery Images</h4>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[heroImage, founderImage, carImage, carImage, heroImage, founderImage].map((src, index) => (
                    <div key={index} className="relative h-[72px] overflow-hidden bg-white/5">
                      <Image src={src} alt="" fill className="object-cover" sizes="72px" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-5 text-[11px] uppercase tracking-[0.16em] text-white/35 md:flex-row md:items-center md:justify-between">
              <span>Privacy Policy</span>
              <span>Terms & Conditions</span>
              <span>Corporate Policy</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
