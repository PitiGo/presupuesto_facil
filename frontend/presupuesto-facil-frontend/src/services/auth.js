// services/auth.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth';
import { registerUser, loginUser,checkUser } from './api';

const firebaseConfig = {
    apiKey: "AIzaSyDPbbZ37gG_JJs_HddpIR7WQkHIhYoJKzs",
    authDomain: "healthywalletmobile.firebaseapp.com",
    projectId: "healthywalletmobile",
    storageBucket: "healthywalletmobile.appspot.com",
    messagingSenderId: "1012008775883",
    appId: "1:1012008775883:web:f38d5902a513cb8f9bab4e",
    measurementId: "G-K99S10Y5RZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const register = async (fullName, email, password) => {
    try {
        const backendResponse = await registerUser(fullName, email, password);
        console.log('Backend response:', backendResponse);
        
        // El usuario ya está creado en Firebase por el backend, 
        // así que solo necesitamos iniciar sesión aquí
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error('Registration error:', error);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.detail || 'Failed to register');
        } else {
            throw error;
        }
    }
};

export const login = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await loginUser(email, password);

        return user;
    } catch (error) {
        console.error('Error in login:', error);
        if (error.response) {
            throw new Error(error.response.data.detail || 'Failed to login');
        } else if (error.code) {
            throw new Error(getFirebaseErrorMessage(error.code));
        } else {
            throw error;
        }
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error in logout:', error);
        throw new Error('Failed to log out');
    }
};




export const registerWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        console.log('Google user:', user);
        
        // Get the ID token
        const idToken = await user.getIdToken();
        // Store the token in localStorage
        localStorage.setItem('authToken', idToken);

        try {
            const userCheck = await checkUser(user.email, user.uid);
            console.log('User check response:', userCheck);

            if (userCheck.exists) {
                const loginResponse = await loginUser(user.email, null, user.uid);
                console.log('Login response:', loginResponse);
            } else {
                const registerResponse = await registerUser(user.displayName, user.email, null, user.uid);
                console.log('Register response:', registerResponse);
            }

            return user;
        } catch (backendError) {
            console.error('Backend error:', backendError);
            if (backendError.response) {
                console.error('Error response:', backendError.response.data);
            }
            await auth.signOut();
            throw backendError;
        }
    } catch (error) {
        console.error('Error in registerWithGoogle:', error);
        throw error;
    }
};




export const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        const unsubscribe = firebaseOnAuthStateChanged(auth, user => {
            unsubscribe();
            resolve(user);
        }, reject);
    });
};

export const onAuthStateChanged = (callback) => {
    return firebaseOnAuthStateChanged(auth, callback);
};

const getFirebaseErrorMessage = (errorCode) => {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'This email is already in use.';
        case 'auth/invalid-email':
            return 'The email address is not valid.';
        case 'auth/operation-not-allowed':
            return 'Operation not allowed.';
        case 'auth/weak-password':
            return 'The password is too weak.';
        case 'auth/user-disabled':
            return 'This user account has been disabled.';
        case 'auth/user-not-found':
            return 'No user found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
};

