import { BusinessProfile } from "@/components/randevux/business-profile"

export default function BusinessProfileViewPage({ params }: { params: { id: string } }) {
    return <BusinessProfile /> // Later pass the ID to fetch real business
}
