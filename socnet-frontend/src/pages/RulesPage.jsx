import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';

export default function RulesPage() {
    const { t } = useTranslation();
    usePageTitle(t('rules.page_title'));
    const rulesList = t('rules.items', { returnObjects: true });

    return (
        <div className="socnet-card-wrapper socnet-rules-page">
            <h1 className="socnet-rules-header">
                {t('rules.header')}
            </h1>

            <div className="socnet-rules-content">
                {Array.isArray(rulesList) && rulesList.map((rule, index) => (
                    <div key={index} className="socnet-rule-block">
                        <h3 className="socnet-rule-title">
                            {index + 1}. {rule.title}
                        </h3>

                        {rule.text && (
                            <p className="socnet-rule-text">
                                {rule.text}
                            </p>
                        )}

                        {Array.isArray(rule.subItems) && rule.subItems.length > 0 && (
                            <ol className="socnet-rule-sublist">
                                {rule.subItems.map((subItem, subIndex) => (
                                    <li key={subIndex} className="socnet-rule-sublist-item">
                                        {subItem}
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                ))}
            </div>

            <div className="socnet-rule-block">
                <p className="socnet-rule-text">
                    <em>{t('rules.footer_note')}</em>
                </p>
            </div>
        </div>
    );
}