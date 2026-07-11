const DataTable = ({ children, minWidth = '720px', className = '' }) => (
  <div className={`overflow-x-auto ${className}`}>
    <div style={{ minWidth }} className="w-full">
      {children}
    </div>
  </div>
);

export default DataTable;
