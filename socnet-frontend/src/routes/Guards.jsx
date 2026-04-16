import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// якщо юзер вже увійшов то редірект на головну
export const GuestGuard = () => {
    const { user } = useContext(AuthContext);

    if (user)
        return user.is_setup_complete ? <Navigate to="/" replace /> : <Navigate to="/setup-profile" replace />;
    return <Outlet />;
};

// якщо гість то редірект на логін
export const AuthGuard = () => {
    const { user } = useContext(AuthContext);

    if (!user) return <Navigate to="/login" replace />;
    if (!user.is_setup_complete) return <Navigate to="/setup-profile" replace />;

    return <Outlet />;
};

// якщо юзер не завершив початкове оформлення
export const SetupGuard = () => {
    const { user } = useContext(AuthContext);

    if (!user) return <Navigate to="/login" replace />;
    if (user.is_setup_complete) return <Navigate to="/" replace />;

    return <Outlet />;
};

// перевірка ролі юзера
export const RoleGuard = ({ allowedRoles, children }) => {
    const { user } = useContext(AuthContext);

    if (!user || !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children ? children : <Outlet />;
};