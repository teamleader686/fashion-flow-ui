import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

export type DateFilter = 'today' | 'week' | 'month' | 'custom';

type DateRangeFilterProps = {
  selectedFilter: DateFilter;
  onFilterChange: (filter: DateFilter) => void;
  customDateRange: { from: Date | undefined; to: Date | undefined };
  onCustomDateChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
};

export default function DateRangeFilter({
  selectedFilter,
  onFilterChange,
  customDateRange,
  onCustomDateChange,
}: DateRangeFilterProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const filters: { value: DateFilter; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant={selectedFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange(filter.value)}
            className="text-xs sm:text-sm"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {selectedFilter === 'custom' && (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'justify-start text-left font-normal text-xs sm:text-sm',
                !customDateRange.from && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customDateRange.from ? (
                customDateRange.to ? (
                  <>
                    {format(customDateRange.from, 'MMM dd')} -{' '}
                    {format(customDateRange.to, 'MMM dd, yyyy')}
                  </>
                ) : (
                  format(customDateRange.from, 'MMM dd, yyyy')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: customDateRange.from, to: customDateRange.to }}
              onSelect={(range) => {
                onCustomDateChange({
                  from: range?.from,
                  to: range?.to,
                });
                if (range?.from && range?.to) {
                  setIsCalendarOpen(false);
                }
              }}
              numberOfMonths={2}
              className="rounded-md border"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
