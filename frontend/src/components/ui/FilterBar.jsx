import Button from './Button';

const FilterBar = ({ onApply, onClear, children, className = '' }) => (
  <div className={`card mb-4 p-4 ${className}`}>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
      className="space-y-4"
    >
      {children}
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Apply Filters</Button>
        <Button type="button" variant="secondary" onClick={onClear}>Clear</Button>
      </div>
    </form>
  </div>
);

export default FilterBar;
