import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { clearSession } from '../../../utils/session';

function Logout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Revokes the token in Redis so it can't be reused even before it expires
      await api('/api/logout', { method: 'POST' });
    } catch {
      // Logging out locally is enough if the server can't be reached
    } finally {
      clearSession();
      navigate('/', { replace: true });
    }
  };

  return (
    <button type="button" onClick={handleLogout}
      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-all">
      Log Out
    </button>
  );
}

export default Logout;
