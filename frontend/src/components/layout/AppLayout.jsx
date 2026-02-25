import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';

export default function AppLayout() {
    return (
        <div className="flex h-screen w-full bg-background overflow-hidden text-text-main">
            <Sidebar />

            <div className="flex flex-col flex-1 w-full min-w-0">
                <MobileHeader />

                <main className="flex-1 overflow-auto bg-background p-4 md:p-8">
                    <div className="mx-auto max-w-7xl">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
