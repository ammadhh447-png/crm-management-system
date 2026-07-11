import Input from '../ui/Input';
import { DEAL_STAGES, STAGE_LABELS } from '../../lib/deals';

const DealFormFields = ({ form, onChange, users }) => (
  <div className="space-y-4">
    <Input label="Title" name="title" value={form.title} onChange={onChange} required />
    <div className="grid grid-cols-2 gap-4">
      <Input label="Value (USD)" name="value" type="number" min="0" value={form.value} onChange={onChange} required />
      <Input label="Probability (%)" name="probability" type="number" min="0" max="100" value={form.probability} onChange={onChange} />
    </div>
    <div>
      <label htmlFor="stage" className="form-label">Stage</label>
      <select id="stage" name="stage" value={form.stage} onChange={onChange} className="form-input">
        {DEAL_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
      </select>
    </div>
    <Input label="Contact" name="contact" value={form.contact} onChange={onChange} placeholder="Optional contact name" />
    <div>
      <label htmlFor="description" className="form-label">Description</label>
      <textarea
        id="description"
        name="description"
        value={form.description}
        onChange={onChange}
        rows={3}
        className="form-input resize-none"
      />
    </div>
    <div>
      <label htmlFor="assignedTo" className="form-label">Assigned To</label>
      <select id="assignedTo" name="assignedTo" value={form.assignedTo} onChange={onChange} className="form-input" required>
        <option value="">Select user</option>
        {users.map((u) => (
          <option key={u.id || u._id} value={u.id || u._id}>
            {u.fullName || `${u.firstName} ${u.lastName}`}
          </option>
        ))}
      </select>
    </div>
  </div>
);

export default DealFormFields;
