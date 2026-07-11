import Modal from './Modal';
import Button from './Button';

const ConfirmDeleteModal = ({
  open,
  title = 'Confirm Delete',
  message,
  onClose,
  onConfirm,
  loading = false,
  confirmLabel = 'Delete',
}) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <p className="text-slate-600">{message}</p>
    <p className="mt-2 text-sm text-slate-500">This action cannot be undone.</p>
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
      <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
    </div>
  </Modal>
);

export default ConfirmDeleteModal;
