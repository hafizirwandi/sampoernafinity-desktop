import { useAuth } from './hooks/useAuth.js';
import { useTheme } from './hooks/useTheme.js';
import LoginView from './views/LoginView.jsx';
import DashboardShell from './views/DashboardShell.jsx';

export default function App() {
    const auth = useAuth();
    const theme = useTheme();

    if (auth.status === 'loading') return null;

    if (auth.status === 'login') {
        return <LoginView auth={auth} theme={theme} />;
    }

    return <DashboardShell auth={auth} theme={theme} />;
}
