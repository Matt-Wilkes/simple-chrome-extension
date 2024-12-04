import { createContext, useContext, useEffect, useState } from "react";
import { Session } from '@supabase/supabase-js';
import { supabase } from "../services/supabaseClient";

type AuthContextProviderProps = {
    children: React.ReactNode;
};

type AuthContextType = {
    session: Session | null;
    setSession: React.Dispatch<React.SetStateAction<Session | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// createContext<{ session: Session | null | undefined, user: User | null | undefined, signOut: () => void}>(session: null, user: null, signOut: () => {})

export default function AuthContextProvider({ children }: AuthContextProviderProps) {
    const [session, setSession] = useState<Session | null>(null);
   

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });
    }, []);

    return (
        <AuthContext.Provider
            value={{
                session,
                setSession,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

// export const useAuthContext = () => useContext(AuthContext);
export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext must be used within an AuthContextProvider");
    }
    return context;
};