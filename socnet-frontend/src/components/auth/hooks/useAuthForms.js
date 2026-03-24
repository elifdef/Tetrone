import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../../services/auth.service";
import { AuthContext } from "../../../context/AuthContext";

export const useAuthForms = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loginUser = async (email, password) => {
        setLoading(true);
        setError(null);

        const res = await AuthService.signIn(email, password);

        if (res.success) {
            const token = res.data?.token;
            if (!token) {
                setError("Token not received");
                setLoading(false);
                return;
            }

            const userRes = await AuthService.getMe(token);

            if (userRes.success) {
                login(token, userRes.data);
                navigate(!userRes.data.is_setup_complete ? '/setup-profile' : '/');
            } else {
                setError(userRes.message);
            }
        } else {
            setError(res.message);
        }

        setLoading(false);
    };

    const registerUser = async (formData) => {
        setLoading(true);
        setError(null);

        const res = await AuthService.signUp(formData);

        if (res.success) {
            setLoading(false);
            return true;
        } else {
            setError(res.message);
            setLoading(false);
            return false;
        }
    };

    return { loginUser, registerUser, loading, error, setError };
};