import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';
import { PAGE_SIZE } from '../../lib/pagination';

const Pagination = ({
  pagination,
  onPageChange,
  itemLabel = 'items',
  className = '',
}) => {
  if (!pagination) return null;

  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || PAGE_SIZE;
  const total = Number(pagination.total) || 0;
  const totalPages = Number(pagination.totalPages) || Math.max(Math.ceil(total / limit), 1);

  if (total <= limit) return null;

  const rangeStart = (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  return (
    <div className={`flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row ${className}`}>
      <p className="text-sm text-slate-500">
        Showing {rangeStart}–{rangeEnd} of {total} {itemLabel} · Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          className="px-3 py-1.5 text-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="secondary"
          className="px-3 py-1.5 text-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
