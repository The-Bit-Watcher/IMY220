import { useSearchParams } from 'react-router-dom';
import Header from '../components/common/Header/Header';
import ReportsPanel from '../components/admin/ReportsPanel';
import UsersPanel from '../components/admin/UsersPanel';
import CommentsPanel from '../components/admin/CommentsPanel';
import ReasonsPanel from '../components/admin/ReasonsPanel';
import VerificationsPanel from '../components/admin/VerificationsPanel';

const TABS = [
  ['reports', 'Reported posts', ReportsPanel],
  ['verification', 'Verification', VerificationsPanel],
  ['users', 'Users', UsersPanel],
  ['activity', 'Comments', CommentsPanel],
  ['reasons', 'Report reasons', ReasonsPanel],
];

// Admins can also edit/delete any post, comment or album straight from those pages.
function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = TABS.find(([key]) => key === searchParams.get('tab')) || TABS[0];
  const Panel = active[2];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold m-0">Admin dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Moderate reports, manage accounts and activity. You can also edit or delete any post, comment or album from its own page.</p>
        </div>

        <div role="tablist" aria-label="Admin sections" className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          {TABS.map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={active[0] === key}
              onClick={() => setSearchParams({ tab: key })}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg ${active[0] === key ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-50'}`}>
              {label}
            </button>
          ))}
        </div>

        <section role="tabpanel" aria-label={active[1]}>
          <Panel />
        </section>
      </main>
    </div>
  );
}

export default AdminPage;
