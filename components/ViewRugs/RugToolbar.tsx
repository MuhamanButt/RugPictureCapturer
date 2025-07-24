import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RugToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  sortOption: string
  onSortChange: (value: string) => void
}

export default function RugToolbar({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
}: RugToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
      <Input
        placeholder="Search by Rug ID..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full md:w-1/2"
      />

      <Select value={sortOption} onValueChange={onSortChange}>
        <SelectTrigger className="w-full md:w-56">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Most Recent</SelectItem>
          <SelectItem value="id-asc">ID A → Z</SelectItem>
          <SelectItem value="id-desc">ID Z → A</SelectItem>
          <SelectItem value="photos">Most Photos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
