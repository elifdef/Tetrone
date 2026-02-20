import { useState, useContext } from "react";
import { Outlet } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import Footer from "./Footer";
import EmailVerificationBanner from "./EmailVerificationBanner";

export default function MainLayout() {
    const { user } = useContext(AuthContext);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <>
            {user && <EmailVerificationBanner user={user} />}

            <button className="mobile-menu-btn" onClick={toggleMenu}>
                {isMobileMenuOpen ? '✖' : '☰'}
            </button>

            {isMobileMenuOpen && (
                <div className="mobile-menu-overlay" onClick={closeMenu}></div>
            )}
            <div className="socnet-app-layout">
                <LeftSidebar isOpen={isMobileMenuOpen} closeMenu={closeMenu} />
                <main className="socnet-main-content">
                    <Outlet />
                </main>
                <RightSidebar />
            </div>
            <Footer />
        </>
    );
}