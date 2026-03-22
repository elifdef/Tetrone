import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const RightSidebar = () => {
    const { user } = useContext(AuthContext);
    return (
        <aside className="tetrone-sidebar-right">
        </aside>
    );
};

export default RightSidebar;