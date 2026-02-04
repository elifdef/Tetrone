import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import FormInput from "../UI/FormInput";

export default function RegisterForm() {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        password_confirmation: ""
    });

    const [msg, setMsg] = useState({ text: "", color: "" });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg({});
        setLoading(true);

        try {
            await api.post('/sign-up', formData);
            setMsg({
                text: (
                    <span>
                        Ви зареєструвались{" "}
                        <Link to="/login" style={{ color: '#1d9bf0', textDecoration: 'underline' }}>Увійдіть тут</Link>
                    </span>
                ),
                color: "green"
            });
            setFormData({ username: "", email: "", password: "", password_confirmation: "" });
        } catch (err) {
            const errorText = err.response?.data?.message || "Помилка реєстрації";
            setMsg({ text: errorText, color: "red" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <FormInput
                    type="text"
                    name="username"
                    id="reg-username"
                    label="Нікнейм"
                    placeholder="Нікнейм"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />

                <FormInput
                    type="email"
                    name="email"
                    id="reg-email"
                    label="Електронна пошта"
                    placeholder="example@mail.com"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <FormInput
                    type="password"
                    name="password"
                    id="reg-password"
                    label="Пароль"
                    placeholder="Пароль"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

                <FormInput
                    type="password"
                    name="password_confirmation"
                    id="reg-confirm-password"
                    label="Повторіть пароль"
                    placeholder="Підтвердження пароля"
                    autoComplete="new-password"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    required
                />

                {msg.text && (
                    <div style={{ color: msg.color, textAlign: 'center', fontSize: '14px' }}>
                        {msg.text}
                    </div>
                )}

                <button className="btn" type="submit" disabled={loading}>
                    {loading ? "Реєстрація..." : "Зареєструватися"}
                </button>
            </form>

            <p style={{ marginTop: '15px', textAlign: 'center' }}>
                Вже є акаунт? <Link to="/login" style={{ color: '#1d9bf0' }}>Увійти</Link>
            </p>
        </>
    );
}