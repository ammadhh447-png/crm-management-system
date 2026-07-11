const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && <Icon className="mb-4 h-12 w-12 text-slate-300" />}
    <h3 className="text-lg font-medium text-slate-900">{title}</h3>
    <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
