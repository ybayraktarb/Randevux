import { BusinessStorefrontModern } from "@/components/booking/BusinessStorefrontModern"
import { getBusinessStorefrontAction } from "@/app/actions/business.actions"
import { notFound } from "next/navigation"

export default async function BusinessProfileViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const res = await getBusinessStorefrontAction(id)

    if (!res.success || !res.data) {
        notFound()
    }

    return <BusinessStorefrontModern initialData={res.data} />
}
