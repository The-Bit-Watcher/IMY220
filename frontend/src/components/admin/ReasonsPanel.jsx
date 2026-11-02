import { useEffect, useState } from 'react';
import ErrorBox from '../common/ErrorBox';
import { api } from '../../services/api';
import { useConfirm } from '../../context/ConfirmContext';

// The reasons users can choose from when reporting a post
function ReasonsPanel() {
  const confirm = useConfirm();
  const [reasons, setReasons] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api('/api/report-reasons').then((d) => setReasons(d.reasons)).catch((err) => setError(err.message));
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const { reason } = await api('/api/admin/report-reasons', { method: 'POST', body: { name: name.trim() } });
      setReasons((prev) => [...prev, reason]);
      setName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (reason) => {
    if (!(await confirm({ title: 'Remove reason?', message: `Users will no longer be able to pick “${reason.name}”. Existing reports keep it.`, confirmLabel: 'Remove' }))) return;
    setError('');
    try {
      await api(`/api/admin/report-reasons/${reason._id}`, { method: 'DELETE' });
      setReasons((prev) => prev.filter((r) => r._id !== reason._id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4 max-w-lg">
      <form onSubmit={add} className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="new-reason" className="field-label">New report reason</label>
          <input id="new-reason" type="text" maxLength={60} value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Violence" className="field-input" />
        </div>
        <button type="submit" disabled={saving || !name.trim()} className="btn btn-primary !py-2.5">Add</button>
      </form>
      <ErrorBox message={error} />
      <ul className="divide-y divide-slate-800 bg-slate-900 border border-slate-800 rounded-xl">
        {reasons.map((r) => (
          <li key={r._id} className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-200">
            {r.name}
            <button type="button" onClick={() => remove(r)} className="text-xs text-slate-500 hover:text-rose-400">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ReasonsPanel;
