import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SocialCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    // We need to access setToken and setCurrentUser from AuthContext, 
    // but currently AuthContext only exposes login/register/logout methods.
    // We might need to manually set localStorage and reload or modify AuthContext.
    // For now, let's manually set localStorage and force a reload or use a simpler approach.
    const { login } = useAuth(); // We can't use login because it expects email/password

    useEffect(() => {
        const token = searchParams.get('token');
        const userData = searchParams.get('user');

        if (token && userData) {
            try {
                const user = JSON.parse(decodeURIComponent(userData));

                // Save to localStorage
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                // Redirect to home and reload to let AuthContext pick up the changes
                // A cleaner way would be to expose a method in AuthContext to set auth state
                window.location.href = '/';
            } catch (err) {
                console.error('Error parsing social auth data', err);
                navigate('/login');
            }
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ textAlign: 'center' }}>
                <h2>Authenticating...</h2>
                <p>Please wait while we complete your login.</p>
            </div>
        </div>
    );
}
