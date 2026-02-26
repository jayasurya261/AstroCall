import React, { createContext, useContext, useEffect, useState } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'user' | 'astrologer' | 'superadmin' | null
    const [loading, setLoading] = useState(true);

    // Email/Password signup — also creates astrologers collection entry if role is astrologer
    async function signup(email, password, role) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store user role in Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            role: role,
            createdAt: new Date(),
        });

        // If signing up as astrologer, also create the astrologers collection entry
        if (role === "astrologer") {
            await setDoc(doc(db, "astrologers", user.uid), {
                name: email.split("@")[0],
                bio: "New astrologer on AstroCall.",
                languages: ["English"],
                isOnline: false,
                rating: 0,
                reviews: 0,
                hourlyRate: 30,
            });
        }

        setUserRole(role);
        return user;
    }

    // Email/Password login — fetches role from Firestore and returns it
    async function login(email, password) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch and return role so caller can redirect properly
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        const role = docSnap.exists() ? docSnap.data().role : "user";
        setUserRole(role);
        return { user, role };
    }

    // Google login — Step 1: authenticate, check if user exists in DB
    async function loginWithGoogle() {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            // New user — needs role selection
            return { requiresRole: true, user };
        } else {
            // Existing user — log them in
            const role = docSnap.data().role;
            setUserRole(role);
            return { requiresRole: false, user, role };
        }
    }

    // Google login — Step 2: complete with chosen role
    async function completeGoogleLoginWithRole(user, role) {
        const docRef = doc(db, "users", user.uid);
        await setDoc(docRef, {
            email: user.email,
            role: role,
            createdAt: new Date(),
        });

        // If astrologer, also create the astrologers collection entry
        if (role === "astrologer") {
            await setDoc(doc(db, "astrologers", user.uid), {
                name: user.displayName || user.email.split("@")[0],
                photoURL: user.photoURL || "",
                bio: "New astrologer on AstroCall.",
                languages: ["English"],
                isOnline: false,
                rating: 0,
                reviews: 0,
                hourlyRate: 30,
            });
        }

        setUserRole(role);
    }

    function logout() {
        setUserRole(null);
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserRole(docSnap.data().role);
                } else {
                    // User is authenticated but has no Firestore doc yet
                    // This happens during Google role-selection flow — don't set a default role
                    setUserRole(null);
                }
            } else {
                setUserRole(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userRole,
        signup,
        login,
        loginWithGoogle,
        completeGoogleLoginWithRole,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
