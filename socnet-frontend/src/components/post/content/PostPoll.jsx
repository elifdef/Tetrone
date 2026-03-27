import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PostService from '../../../services/post.service';
import { notifyError } from '../../common/Notify';
import { Link } from 'react-router-dom';

export default function PostPoll({ poll, postId, isOwner }) {
    const { t } = useTranslation();

    const [results, setResults] = useState({});
    const [votedOptionIds, setVotedOptionIds] = useState([]);
    const [draftOptionIds, setDraftOptionIds] = useState([]);
    const [isClosed, setIsClosed] = useState(false);
    const [quizData, setQuizData] = useState(null);

    useEffect(() => {
        if (poll) {
            setResults(poll.results || {});
            setVotedOptionIds(poll.voted_option_ids || []);
            setDraftOptionIds(poll.voted_option_ids || []);
            setIsClosed(poll.is_closed || false);

            if (poll.type === 'quiz' && poll.voted_option_ids?.length > 0) {
                setQuizData({ options: poll.options, explanation: poll.explanation });
            }
        }
    }, [poll]);

    const [isLoading, setIsLoading] = useState(false);
    const [votersData, setVotersData] = useState(null);
    const [isVotersModalOpen, setIsVotersModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(null);
    const [isLoadingVoters, setIsLoadingVoters] = useState(false);
    const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);

    if (!poll) return null;

    const totalVotes = Object.values(results).reduce((sum, current) => sum + Number(current), 0);

    const getPercentage = (optionId) => {
        if (totalVotes === 0) return 0;
        const count = Number(results[optionId]) || 0;
        return Math.round((count / totalVotes) * 100);
    };

    const hasDraftChanges = JSON.stringify([...draftOptionIds].sort()) !== JSON.stringify([...votedOptionIds].sort());

    const submitVote = async (idsToSubmit) => {
        if (idsToSubmit.length === 0 || isClosed) return;

        setIsLoading(true);
        const res = await PostService.votePoll(postId, idsToSubmit);

        if (res.success) {
            setResults(res.data.results);
            setVotedOptionIds(res.data.voted_option_ids);
            setDraftOptionIds(res.data.voted_option_ids);

            if (res.data.quiz_data) setQuizData(res.data.quiz_data);
        } else {
            notifyError(res.message || t('error.connection'));
            setDraftOptionIds(votedOptionIds);
        }
        setIsLoading(false);
    };

    const openVotersModal = async (optionId, e) => {
        e.stopPropagation();
        if (poll.is_anonymous) return;

        setActiveTab(optionId);
        setIsVotersModalOpen(true);

        // Якщо дані вже завантажені раніше, не робимо зайвий запит
        if (votersData) return;

        setIsLoadingVoters(true);
        const res = await PostService.getPollVoters(postId);

        if (res.success) {
            setVotersData(res.data?.voters || res.data);
        } else {
            notifyError(res.message || t('poll.error_voters'));
            setIsVotersModalOpen(false);
        }
        setIsLoadingVoters(false);
    };

    const closePoll = async () => {
        setIsLoading(true);
        const res = await PostService.closePoll(postId);

        if (res.success) {
            setIsClosed(true);
            setIsCloseConfirmOpen(false);
        } else {
            notifyError(res.message || t('error.connection'));
        }
        setIsLoading(false);
    };

    const handleOptionClick = (optionId) => {
        if (isLoading || isClosed) return;
        if (votedOptionIds.length > 0 && !poll.can_change_vote) return;

        if (poll.is_multiple_choice) {
            let newDraft = [...draftOptionIds];
            if (newDraft.includes(optionId)) {
                newDraft = newDraft.filter(id => id !== optionId);
            } else {
                newDraft.push(optionId);
            }
            setDraftOptionIds(newDraft);
        } else {
            if (draftOptionIds.includes(optionId)) return;
            setDraftOptionIds([optionId]);
            submitVote([optionId]);
        }
    };

    const cancelDraft = () => setDraftOptionIds(votedOptionIds);

    const showResults = votedOptionIds.length > 0 || isClosed;
    const isQuiz = poll.type === 'quiz';
    const optionsToRender = quizData ? quizData.options : poll.options;

    return (
        <div className="tetrone-poll">
            <div className="tetrone-poll-question">
                {poll.question}
            </div>

            <div className="tetrone-poll-options">
                {optionsToRender.map((option) => {
                    const isVoted = votedOptionIds.includes(option.id);
                    const isSelected = draftOptionIds.includes(option.id);
                    const percent = getPercentage(option.id);
                    const canVoteNow = (votedOptionIds.length === 0 || poll.can_change_vote) && !isClosed;

                    let quizClass = '';
                    let icon = null;

                    if (showResults && isQuiz && quizData) {
                        if (option.is_correct) {
                            quizClass = 'quiz-correct';
                            icon = '✅';
                        } else if (isVoted) {
                            quizClass = 'quiz-incorrect';
                            icon = '❌';
                        }
                    }

                    return (
                        <div key={option.id} className="tetrone-poll-option-wrapper">
                            <div
                                onClick={() => handleOptionClick(option.id)}
                                className={`tetrone-poll-option ${isSelected ? 'is-voted' : ''} ${canVoteNow ? 'can-vote' : 'disabled'} ${quizClass}`}
                            >
                                {showResults && (
                                    <div className="tetrone-poll-fill" style={{ width: `${percent}%` }}></div>
                                )}

                                <div className="tetrone-poll-text">
                                    {poll.is_multiple_choice && (
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            readOnly
                                            className="tetrone-poll-multiple-checkbox"
                                        />
                                    )}
                                    {option.text}
                                    {icon && <span className="tetrone-poll-icon">{icon}</span>}
                                </div>

                                {showResults && (
                                    <div
                                        className={`tetrone-poll-percent ${!poll.is_anonymous ? 'clickable' : 'default'}`}
                                        onClick={(e) => openVotersModal(option.id, e)}
                                        title={!poll.is_anonymous ? t('poll.view_voters') : ''}
                                    >
                                        {percent}%
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {isQuiz && showResults && quizData?.explanation && (
                <div className="tetrone-poll-explanation-box">
                    <span className="tetrone-poll-explanation-title">{t('poll.explanation_title')}</span>
                    {quizData.explanation}
                </div>
            )}

            {poll.is_multiple_choice && hasDraftChanges && !isClosed && (
                <div className="tetrone-poll-actions tetrone-poll-actions-start">
                    <button className="tetrone-btn" onClick={() => submitVote(draftOptionIds)} disabled={isLoading || draftOptionIds.length === 0}>
                        {t('poll.submit_vote')}
                    </button>
                    {votedOptionIds.length > 0 && (
                        <button className="tetrone-btn tetrone-btn-cancel" onClick={cancelDraft} disabled={isLoading}>
                            {t('common.cancel')}
                        </button>
                    )}
                </div>
            )}

            <div className="tetrone-poll-meta tetrone-poll-meta-spaced">
                <div className="tetrone-poll-meta-left">
                    <span>{totalVotes} {t('post.votes_count', { count: totalVotes })}</span>
                    {poll.is_anonymous && <><span className="dot">•</span><span>{t('post.anonymous_poll')}</span></>}

                    {isClosed && (
                        <>
                            <span className="dot">•</span>
                            <span className="tetrone-poll-closed-badge">{t('poll.closed_badge')}</span>
                        </>
                    )}
                </div>

                {isOwner && !isClosed && (
                    <button className="tetrone-poll-close-btn" onClick={() => setIsCloseConfirmOpen(true)}>
                        {t('common.close')}
                    </button>
                )}
            </div>

            {isCloseConfirmOpen && (
                <div className="tetrone-modal-overlay" onClick={() => setIsCloseConfirmOpen(false)}>
                    <div className="tetrone-modal-dialog tetrone-modal-dialog-sm" onClick={e => e.stopPropagation()}>
                        <div className="tetrone-modal-text-confirm">
                            {t('poll.close_confirm_text')}
                        </div>
                        <div className="tetrone-modal-actions">
                            <button className="tetrone-btn-ghost" onClick={() => setIsCloseConfirmOpen(false)}>{t('common.cancel')}</button>
                            <button className="tetrone-btn" onClick={closePoll} disabled={isLoading}>{t('common.close')}</button>
                        </div>
                    </div>
                </div>
            )}

            {isVotersModalOpen && !poll.is_anonymous && (
                <div className="tetrone-modal-overlay" onClick={() => setIsVotersModalOpen(false)}>
                    <div className="tetrone-modal-dialog" onClick={e => e.stopPropagation()}>
                        <button className="tetrone-modal-close" onClick={() => setIsVotersModalOpen(false)}>✖</button>
                        <h3 className="tetrone-poll-voters-header">{t('poll.voters_title')}</h3>
                        <div className="tetrone-tabs">
                            {optionsToRender.map(opt => (
                                <button key={opt.id} className={`tetrone-tab ${activeTab === opt.id ? 'active' : ''}`} onClick={() => setActiveTab(opt.id)}>
                                    {opt.text} <span className="tetrone-tab-count">{results[opt.id] || 0}</span>
                                </button>
                            ))}
                        </div>
                        <div className="tetrone-poll-voters-list-container">
                            {isLoadingVoters ? (
                                <div className="tetrone-poll-voters-state-msg">{t('common.loading')}</div>
                            ) : (
                                votersData && votersData[activeTab] && votersData[activeTab].length > 0 ? (
                                    votersData[activeTab].map(voter => (
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
                </div>
            )}
        </div>
    );
}