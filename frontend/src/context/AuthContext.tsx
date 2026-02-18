import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabase';
import type { Session, User } from '@supabase/supabase-js';

type UserRole = 'admin' | 'agent' | null;

interface AuthContextType {
    session: Session | null;
    user: User | null;
    role: UserRole;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    role: null,
    loading: true,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(false); // Default false for testing

    console.log("AuthProvider initializing. Supabase client present?", !!supabase);

    useEffect(() => {
        let mounted = true;
        console.log("AuthProvider mounted");

        // Failsafe: Force stop loading after 3 seconds
        const timer = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Force stop loading (timeout)");
                setLoading(false);
            }
        }, 3000);

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log("Supabase session checked", session);
            if (!mounted) return;
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserRole(session.user.id);
            } else {
                setLoading(false);
            }
        }).catch((err) => {
            console.error("Session check failed", err);
            if (mounted) setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserRole(session.user.id);
            } else {
                setRole(null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
            clearTimeout(timer);
        };
    }, []);

    const fetchUserRole = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (data) setRole(data.role as UserRole);
            else console.warn('No profile found for user');

        } catch {
            // error ignored
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setRole(null);
        setUser(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{ session, user, role, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
