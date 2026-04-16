import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import adminService from '../../services/admin.service';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import { useDateFormatter } from '../../hooks/useDateFormatter';

const AdminTickets = () => {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [replying, setReplying] = useState(false);

    const [feedback, setFeedback] = useState(null);

    const showMessage = (msg, type = 'success') => {
        setFeedback({ msg, type });
        setTimeout(() => setFeedback(null), 3000);
    };

    useEffect(() => {
        if (!selectedTicket) {
            loadTickets();
        }
    }, [statusFilter, selectedTicket]);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const res = await adminService.getTickets(statusFilter);
            setTickets(res.data?.data || res.data || []);
        } catch (error) {
            showMessage(t('admin.support.error_loading_tickets'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTicket = async (id) => {
        setLoading(true);
        try {
            const res = await adminService.getTicket(id);
            setSelectedTicket(res.data);
        } catch (error) {
            showMessage(t('admin.support.error_loading_ticket'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        try {
            await adminService.assignTicket(selectedTicket.id);
            showMessage(t('admin.support.ticket_assigned'), 'success');
            handleSelectTicket(selectedTicket.id);
        } catch (error) {
            showMessage(error.message, 'error');
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        setReplying(true);
        try {
            await adminService.replyToTicket(selectedTicket.id, replyText, isInternal);
            setReplyText('');
            setIsInternal(false);
            showMessage(t('admin.support.reply_sent'), 'success');
            handleSelectTicket(selectedTicket.id);
        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            setReplying(false);
        }
    };

    if (selectedTicket) {
        return (
            <div className="tetrone-admin-ticket-detail">
                {feedback && (
                    <div className={`tetrone-feedback-msg tetrone-feedback-${feedback.type}`}>
                        {feedback.msg}
                    </div>
                )}

                <div className="tetrone-support-header-actions">
                    <Button variant="secondary" onClick={() => setSelectedTicket(null)}>
                        {t('action.go_back')}
                    </Button>
                    <h3 className="tetrone-section-title">#{selectedTicket.id} - {selectedTicket.subject}</h3>
                    {!selectedTicket.assigned_to && (
                        <Button onClick={handleAssign}>{t('admin.support.assign_to_me')}</Button>
                    )}
                </div>

                <div className="tetrone-admin-ticket-meta">
                    <div><strong>{t('support.field_category')}:</strong> {t(`support.cat_${selectedTicket.category}`)}</div>
                    <div><strong>{t('admin.support.ticket_author')}:</strong> @{selectedTicket.user?.username}</div>
                    <div><strong>{t('admin.support.ticket_status')}:</strong> {t(`support.status_${selectedTicket.status}`)}</div>

                    {selectedTicket.meta_data?.browser && (
                        <div>
                            <strong>{t('admin.support.os_browser')}</strong> {selectedTicket.meta_data.os} / {selectedTicket.meta_data.browser}
                        </div>
                    )}
                    {selectedTicket.meta_data?.steps_to_reproduce && (
                        <div><strong>{t('support.field_steps')}:</strong> {selectedTicket.meta_data.steps_to_reproduce}</div>
                    )}
                </div>

                <div className="tetrone-ticket-chat">
                    {selectedTicket.messages?.map(msg => {
                        const isAdmin = msg.user_id !== selectedTicket.user_id;
                        let msgClass = isAdmin ? 'tetrone-ticket-message-admin' : 'tetrone-ticket-message-user';
                        if (msg.is_internal_note) msgClass = 'tetrone-ticket-message-internal';

                        return (
                            <div key={msg.id} className={`tetrone-ticket-message ${msgClass}`}>
                                <div className="tetrone-ticket-message-header">
                                    <span>
                                        {msg.user?.username || t('admin.support.system')}
                                        {msg.is_internal_note ? ` (${t('admin.support.internal_note')})` : ''}
                                    </span>
                                    <span>{formatDate(msg.created_at)}</span>
                                </div>
                                <div className="tetrone-ticket-msg-text">{msg.message}</div>

                                {msg.attachments?.length > 0 && (
                                    <div className="tetrone-ticket-msg-attachments">
                                        {msg.attachments.map(att => (
                                            <a key={att.id} href={att.file_url} target="_blank" rel="noreferrer">
                                                <img
                                                    src={att.file_url}
                                                    alt={t('common.attachment')}
                                                    className="tetrone-ticket-attachment-img"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <form onSubmit={handleReply} className="tetrone-ticket-reply-box">
                    <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={t('admin.support.reply_placeholder')}
                        required
                    />
                    <div className="tetrone-ticket-reply-actions">
                        <label className="tetrone-ticket-checkbox-wrap">
                            <input
                                type="checkbox"
                                checked={isInternal}
                                onChange={(e) => setIsInternal(e.target.checked)}
                            />
                            {t('admin.support.internal_note_desc')}
                        </label>
                        <Button type="submit" disabled={replying || !replyText.trim()}>
                            {t('admin.support.send_reply')}
                        </Button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="tetrone-admin-tickets-container">
            {feedback && (
                <div className={`tetrone-feedback-msg tetrone-feedback-${feedback.type}`}>
                    {feedback.msg}
                </div>
            )}

            <div className="tetrone-support-header-actions">
                <h2 className="tetrone-section-title">{t('admin.support.support_tickets')}</h2>
                <select
                    className="tetrone-input tetrone-status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">{t('admin.support.filter_all')}</option>
                    <option value="open">{t('support.status_open')}</option>
                    <option value="in_progress">{t('support.status_in_progress')}</option>
                    <option value="waiting_for_user">{t('support.status_waiting_for_user')}</option>
                    <option value="resolved">{t('support.status_resolved')}</option>
                </select>
            </div>

            <div className="tetrone-card-wrapper" style={{ padding: 0 }}>
                <div className="tetrone-admin-ticket-row tetrone-admin-ticket-header">
                    <div>{t('common.id')}</div>
                    <div>{t('support.field_subject')}</div>
                    <div>{t('support.field_category')}</div>
                    <div>{t('admin.support.ticket_status')}</div>
                    <div>{t('common.date')}</div>
                </div>

                {loading ? (
                    <div className="tetrone-empty-state">{t('common.loading')}</div>
                ) : tickets.length === 0 ? (
                    <div className="tetrone-empty-state">{t('admin.support.no_tickets_found')}</div>
                ) : (
                    tickets.map(ticket => (
                        <div
                            key={ticket.id}
                            className="tetrone-admin-ticket-row"
                            onClick={() => handleSelectTicket(ticket.id)}
                        >
                            <div>#{ticket.id}</div>
                            <div className="tetrone-admin-ticket-subject">
                                {ticket.subject}
                            </div>
                            <div>{t(`support.cat_${ticket.category}`)}</div>
                            <div>
                                <span className="tetrone-ticket-status">{t(`support.status_${ticket.status}`)}</span>
                            </div>
                            <div className="tetrone-admin-ticket-date">{formatDate(ticket.created_at)}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminTickets;