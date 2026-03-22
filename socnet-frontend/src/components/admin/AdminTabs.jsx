export const AdminTabs = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className="tetrone-tabs">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    className={`tetrone-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};