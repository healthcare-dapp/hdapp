export interface PagedResponse<D> {
    items: D[]
    total_count: number
    next_page_id: string | null
    previous_page_id: string | null
}
