import { CourseLibrary } from "@/components/home/library/CourseLibrary"
import { Hero } from "@/components/home/Hero"
import { HowItWorks } from "@/components/home/HowItWorks"

const HomePage = () => {
  return (
    <>
      <Hero />
      <CourseLibrary />
      <HowItWorks />
    </>
  )
}

export default HomePage
