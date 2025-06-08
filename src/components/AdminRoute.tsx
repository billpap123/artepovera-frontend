// src/components/AdminRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';

const AdminRoute = () => {
    const { userType } = useUserContext();

    // You could also add a check for an isLoading state from your context
    // if it exists, to show a loading spinner while the user session is being determined.
    // For example:
    // const { userType, isLoading } = useUserContext();
    // if (isLoading) {
    //     return <div>Loading session...</div>;
    // }

    // If the user type from the context is 'Admin', render the child route (the <Outlet />).
    // The <Outlet /> will be replaced by your <AdminDashboard /> component from your App.tsx setup.
    if (userType === 'Admin') {
        return <Outlet />;
    }

    // If the user is not an admin, redirect them to the main page.
    return <Navigate to="/main" replace />;
};

export default AdminRoute;