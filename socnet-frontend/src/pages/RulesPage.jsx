import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';

export default function RulesPage() {
    const { t } = useTranslation();
    usePageTitle(t('rules.page_title'));
    const rulesList = t('rules.items', { returnObjects: true });

    return (
        <div className="tetrone-card-wrapper tetrone-rules-page">
            <h1 className="tetrone-rules-header">
                {t('rules.header')}
            </h1>

            <div className="tetrone-rules-content">
                {Array.isArray(rulesList) && rulesList.map((rule, index) => (
                    <div key={index} className="tetrone-rule-block">
                        <h3 className="tetrone-rule-title">
                            {index + 1}. {rule.title}
                        </h3>

                        {rule.text && (
                            <p className="tetrone-rule-text">
                                {rule.text}
                            </p>
                        )}

                        {Array.isArray(rule.subItems) && rule.subItems.length > 0 && (
                            <ol className="tetrone-rule-sublist">
                                {rule.subItems.map((subItem, subIndex) => (
                                    <li key={subIndex} className="tetrone-rule-sublist-item">
                                        {subItem}
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                ))}
            </div>

            <div className="tetrone-rule-block">
                <p className="tetrone-rule-text">
                    <em>{t('rules.footer_note')}</em>
                </p>
            </div>
        </div>
    );
}