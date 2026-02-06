import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const XD = () => (
    <div className="right-card">
        <h3>Продам гараж</h3>
        <p>Бита не крашена</p>
        <button className="promo-btn">
            Купити за ціну бюджета Естонії
        </button>
    </div>
);

const JoinPromo = () => (
    <div className="right-card">
        <h3>Новий у соцмережі?</h3>
        <p>Створіть акаунт, щоб додавати друзів, писати пости та коментувати!</p>
        <Link to="/register" className="promo-btn">
            Створити акаунт
        </Link>
    </div>
);

const RightSidebar = () => {
    // це тимчасовий компонент який потрібен щоб чимось заповнити праву сторону екрана
    // тому він не несе в собі ніякого змісту і функціоналу 
    const { user } = useContext(AuthContext);

    return (
        <aside className="right-sidebar">
            {user ? <XD /> : <JoinPromo />}
        </aside>
    );
};

export default RightSidebar;