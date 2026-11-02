import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import ConfirmProvider from './components/common/ConfirmProvider';

function App() {
  return (
    <BrowserRouter>
      <ConfirmProvider>
        <AppRoutes />
      </ConfirmProvider>
    </BrowserRouter>
  );
}

export default App;
