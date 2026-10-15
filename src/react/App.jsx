import { useAuth } from './hooks/useAuth.js';
import { useTheme } from './hooks/useTheme.js';
import { useAppUpdate } from './hooks/useAppUpdate.js';
import LoginView from './views/LoginView.jsx';
import DashboardShell from './views/DashboardShell.jsx';
import UpdateBanner from './components/UpdateBanner.jsx';
import UpdateRequiredScreen from './components/UpdateRequiredScreen.jsx';

export default function App() {
    const auth = useAuth();
    const theme = useTheme();
    const update = useAppUpdate();

    // An unsupported build can't use the API anymore, so the update screen
    // replaces everything — login included.
    if (update.state?.required) {
        return <UpdateRequiredScreen update={update} />;
    }

    if (auth.status === 'loading') return null;

    return (
        <>
            {auth.status === 'login' ? <LoginView auth={auth} theme={theme} /> : <DashboardShell auth={auth} theme={theme} />}
            <UpdateBanner update={update} />
        </>
    );
}
