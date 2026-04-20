import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { SocialProof } from '@/components/home/SocialProof'
import { HowItWorks } from '@/components/home/HowItWorks'
import { FeaturedInstructors } from '@/components/home/FeaturedInstructors'
import { InstructorCTA } from '@/components/home/InstructorCTA'
import { Testimonials } from '@/components/home/Testimonials'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <SocialProof />
        <HowItWorks />
        <FeaturedInstructors />
        <InstructorCTA />
        <Testimonials />
      </main>
      <Footer />
    </>
  )
}
