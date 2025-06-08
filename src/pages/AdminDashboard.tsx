// src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import '../styles/AdminDashboard.css'; // We will create this CSS file next
import { formatDate } from '../utils/formatDate'; // Assuming you have or create this utility file

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// Define the shape of the user data we expect from the admin endpoint
interface UserData {
    user_id: number;
    fullname: string;
    email: string;
    user_type: string;
}

const AdminDashboard = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAllUsers = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                // Call the admin-only endpoint
                const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsers(response.data);
            } catch (err: any) {
                console.error("Failed to fetch users:", err);
                setError(err.response?.data?.message || "Could not load user data. You must be an administrator.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllUsers();
    }, []);

    const handleDeleteUser = async (userId: number, fullname: string) => {
        // Ask for confirmation before deleting
        if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE the user '${fullname}' (ID: ${userId})? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh the user list by filtering out the deleted user
            setUsers(prevUsers => prevUsers.filter(u => u.user_id !== userId));
            alert("User deleted successfully.");
        } catch (err: any) {
            console.error("Failed to delete user:", err);
            alert(err.response?.data?.message || "Could not delete user.");
        }
    };

    return (
        <>
            <Navbar />
            <div className="admin-dashboard-container">
                <header className="admin-header">
                    <h1>Admin Dashboard</h1>
                    <p>Manage users and monitor application activity.</p>
                </header>

                <section className="admin-section">
                    <h2>All Users ({users.length})</h2>
                    {loading && <p className="loading-message">Loading users...</p>}
                    {error && <p className="error-message">{error}</p>}
                    {!loading && !error && (
                        <div className="admin-table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Full Name</th>
                                        <th>Email</th>
                                        <th>User Type</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.user_id}>
                                            <td>{user.user_id}</td>
                                            <td>{user.fullname}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`user-type-badge ${user.user_type.toLowerCase()}`}>
                                                    {user.user_type}
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    className="delete-button" 
                                                    onClick={() => handleDeleteUser(user.user_id, user.fullname)}
                                                    disabled={user.user_type === 'Admin'} // Prevent deleting other admins
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
};

export default AdminDashboard;