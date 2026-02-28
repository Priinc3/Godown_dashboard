import { useFinanceAuth } from '../../contexts/FinanceAuthContext';
import FinanceLoginModal from './FinanceLoginModal';

export default function FinanceGate({ children }) {
    const { isFinanceLoggedIn, loading } = useFinanceAuth();

    if (loading) {
        return <div className="p-8 text-center text-text-muted animate-pulse">Loading...</div>;
    }

    if (!isFinanceLoggedIn) {
        return <FinanceLoginModal />;
    }

    return children;
}
