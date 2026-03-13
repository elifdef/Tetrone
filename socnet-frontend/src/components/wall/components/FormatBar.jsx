import { useTranslation } from 'react-i18next';

export default function FormatBar() {
    const { t } = useTranslation();

    return (
        <div className="socnet-format-bar" >
            <span style={{ fontSize: '11px', color: 'var(--theme-text-muted)', fontWeight: 'bold' }}>
                {t('wall.formatting')}
            </span>
        </div>
    );
}