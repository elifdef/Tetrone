import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Button from "../ui/Button";

export default function PollVotersModal({ isOpen, onClose, pollData, optionsToRender, activeTab, setActiveTab, isLoadingVoters, results }) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="tetrone-modal-overlay" onClick={onClose}>
            <div className="tetrone-modal-dialog" onClick={e => e.stopPropagation()}>
                <div className="tetrone-modal-header">
                    <h3>{t('poll.voters_title')}</h3>
                    <button className="tetrone-modal-close" onClick={onClose}>✖</button>
                </div>

                <div className="tetrone-modal-body" style={{ padding: 0 }}>
                    <div className="tetrone-tabs">
                        {optionsToRender.map(opt => (
                            <button key={opt.id} className={`tetrone-tab ${activeTab === opt.id ? 'active' : ''}`} onClick={() => setActiveTab(opt.id)}>
                                {opt.text} <span className="tetrone-tab-count">{results[opt.id] || 0}</span>
                            </button>
                        ))}
                    </div>

                    <div className="tetrone-poll-voters-list-container" style={{ padding: '15px', minHeight: '150px' }}>
                        {isLoadingVoters ? (
                            <div className="tetrone-poll-voters-state-msg">{t('common.loading')}</div>
                        ) : (
                            pollData && pollData[activeTab] && pollData[activeTab].length > 0 ? (
                                pollData[activeTab].map(voter => (
                                    <Link to={`/${voter.username}`} key={voter.id} className="tetrone-poll-voter-row">
                                        <img src={voter.avatar} alt="avatar" className="tetrone-poll-voter-img" />
                                        <span className="tetrone-poll-voter-name">{voter.first_name} {voter.last_name}</span>
                                    </Link>
                                ))
                            ) : (
                                <div className="tetrone-poll-voters-state-msg">{t('poll.no_voters_yet')}</div>
                            )
                        )}
                    </div>
                </div>

                <div className="tetrone-modal-footer">
                    <Button onClick={onClose}>{t('action.close')}</Button>
                </div>
            </div>
        </div>
    );
}