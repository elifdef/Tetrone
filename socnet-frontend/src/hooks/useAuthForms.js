import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export const useAuthForms = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loginUser = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/sign-in', { email, password });
            const token = res.data.token;
            const res2 = await api.get('/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const user = res2.data;
            login(token, user);
            navigate(!user.is_setup_complete ? '/setup-profile' : '/');

        } catch (err) {
            setError(err.response?.data?.message || "Помилка входу");
        } finally {
            setLoading(false);
        }
    };

    const registerUser = async (formData) => {
        setLoading(true);
        setError(null);
        try {
            await api.post('/sign-up', formData);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || "Помилка реєстрації");
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        loginUser,
        registerUser,
        loading,
        error,
        setError 
    };
};