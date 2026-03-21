export const EditIcon = ({ width = 14, height = 14, className = "" }) => (
    <svg width={width} height={height} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

export const DeleteIcon = ({ width = 14, height = 14, className = "" }) => (
    <svg width={width} height={height} className={className} viewBox="0 -0.5 21 21" fill="currentColor">
        <path d="M7.35 16h2.1v-8h-2.1v8zm4.2 0h2.1v-8h-2.1v8zm-6.3 2h10.5V6H5.25v12zm2.1-14h6.3V2H7.35v2zm8.4 0V0H5.25v4H0v2h3.15v14h14.7V6H21V4h-5.25z" />
    </svg>
);

export const ReplyIcon = ({ width = 14, height = 14, className = "" }) => (
    <svg width={width} height={height} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 17 4 12 9 7"></polyline>
        <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
    </svg>
);

export const ReportIcon = ({ width = 14, height = 14, className = "" }) => (
    <svg width={width} height={height} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
        <line x1="4" y1="22" x2="4" y2="15"></line>
    </svg>
);

export const DotsIcon = ({ width = 14, height = 14, className = "" }) => (
    <svg width={width} height={height} className={className} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="19" r="2" />
    </svg>
);