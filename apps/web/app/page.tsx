import { LandingPage } from "@/src/modules/landing/components/landing-page"
import { getLandingPageData } from "@/src/modules/landing/lib/landing-data"

export const dynamic = "force-dynamic"

export default async function Home() {
  const data = await getLandingPageData()
  return <LandingPage {...data} />
}
