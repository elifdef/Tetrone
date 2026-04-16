import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { usePageTitle } from "../hooks/usePageTitle";
import supportService from '../services/support.service';
import SupportTicketForm from '../components/support/SupportTicketForm';
import { useDateFormatter } from '../hooks/useDateFormatter';
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';
import { InfoIcon, UserIcon, DocumentIcon, SecurityIcon, PollIcon, ChevronDownIcon, ChevronUpIcon, BackIcon } from '../components/ui/Icons';
import '../styles/support.css';

const SupportPage = () => {
    const { t, i18n } = useTranslation();
    usePageTitle(t('support.page_title'));
    const formatDate = useDateFormatter();

    const [searchParams, setSearchParams] = useSearchParams();
    const currentView = searchParams.get('view') || 'home';
    const currentCat = searchParams.get('cat');
    const currentTicketId = searchParams.get('ticket_id');

    const [openFaqId, setOpenFaqId] = useState(null);

    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(false);

    const categories = [
        { id: 'popular', icon: <InfoIcon width={32} height={32} />, titleKey: 'support.cat_popular' },
        { id: 'account', icon: <UserIcon width={32} height={32} />, titleKey: 'support.cat_account' },
        { id: 'post', icon: <DocumentIcon width={32} height={32} />, titleKey: 'support.cat_post' },
        { id: 'security', icon: <SecurityIcon width={32} height={32} />, titleKey: 'support.cat_security' },
        { id: 'other', icon: <PollIcon width={32} height={32} />, titleKey: 'support.cat_other' }
    ];

    const categoryFaqs = useMemo(() => {
        if (!currentCat) return [];
        const items = [];
        let index = 1;
        while (i18n.exists(`support.faq.${currentCat}.${index}_q`)) {
            const baseKey = `support.faq.${currentCat}.${index}`;
            items.push({
                id: index,
                q: `${baseKey}_q`,
                a: `${baseKey}_a`,
                img: i18n.exists(`${baseKey}_img`) ? `${baseKey}_img` : null
            });
            index++;
        }
        return items;
    }, [currentCat, i18n]);

    useEffect(() => {
        if (currentView === 'tickets') loadTickets();
    }, [currentView]);

    useEffect(() => {
        if (currentView === 'ticket_detail' && currentTicketId) {
            loadSingleTicket(currentTicketId);
        }
    }, [currentView, currentTicketId]);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const res = await supportService.getTickets();
            setTickets(res.data?.data || res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadSingleTicket = async (id) => {
        setLoading(true);
        try {
            const res = await supportService.getTicket(id);
            setSelectedTicket(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        setLoading(true);
        try {
            await supportService.replyToTicket(currentTicketId, replyText);
            setReplyText('');
            loadSingleTicket(currentTicketId);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const navigateTo = (view, extraParams = {}) => {
        setOpenFaqId(null);
        setSearchParams({ view, ...extraParams });
    };

    const toggleFaq = (id) => {
        setOpenFaqId(openFaqId === id ? null : id);
    };

    if (currentView === 'form') {
        return (
            <div className="tetrone-card-wrapper">
                <SupportTicketForm
                    onCancel={() => navigateTo('home')}
                    onSuccess={() => navigateTo('tickets')}
                />
            </div>
        );
    }

    if (currentView === 'category') {
        const catInfo = categories.find(c => c.id === currentCat);
        return (
            <div className="tetrone-card-wrapper">
                <div className="tetrone-support-header-actions">
                    <Button variant="secondary" onClick={() => navigateTo('home')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <BackIcon width={16} height={16} /> {t('action.go_back')}
                    </Button>
                    <h2 className="tetrone-section-title">{catInfo ? t(catInfo.titleKey) : ''}</h2>
                    <Button onClick={() => navigateTo('form')}>{t('support.create_ticket')}</Button>
                </div>

                <div className="tetrone-support-faq-list">
                    {categoryFaqs.length === 0 ? (
                        <div className="tetrone-empty-state">{t('support.no_questions_yet')}</div>
                    ) : (
                        categoryFaqs.map(faq => {
                            const isOpen = openFaqId === faq.id;
                            return (
                                <div key={faq.id} className="tetrone-support-faq-item">
                                    <div className="tetrone-support-faq-header" onClick={() => toggleFaq(faq.id)}>
                                        <span>{t(faq.q)}</span>
                                        <span>{isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}</span>
                                    </div>
                                    {isOpen && (
                                        <div className="tetrone-support-faq-body">
                                            <div>{t(faq.a)}</div>
                                            {faq.img && <img src={t(faq.img)} alt="FAQ" className="tetrone-support-faq-image" />}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    if (currentView === 'tickets') {
        return (
            <div className="tetrone-card-wrapper">
                <div className="tetrone-support-header-actions">
                    <Button variant="secondary" onClick={() => navigateTo('home')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <BackIcon width={16} height={16} /> {t('action.go_back')}
                    </Button>
                    <h2 className="tetrone-section-title">{t('support.tab_my_tickets')}</h2>
                    <Button onClick={() => navigateTo('form')}>{t('support.create_ticket')}</Button>
                </div>

                <div className="tetrone-ticket-list">
                    {loading ? (
                        <div className="tetrone-empty-state">{t('common.loading')}</div>
                    ) : tickets.length === 0 ? (
                        <div className="tetrone-empty-state with-card">{t('support.no_tickets')}</div>
                    ) : (
                        tickets.map(ticket => (
                            <div
                                key={ticket.id}
                                className="tetrone-ticket-card"
                                onClick={() => navigateTo('ticket_detail', { ticket_id: ticket.id })}
                            >
                                <div className="tetrone-ticket-info">
                                    <h4 className="tetrone-ticket-title">{ticket.subject}</h4>
                                    <span className="tetrone-ticket-meta">
                                        #{ticket.id} • {formatDate(ticket.created_at)} • {t(`support.cat_${ticket.category}`)}
                                    </span>
                                </div>
                                <div className="tetrone-ticket-status">
                                    {t(`support.status_${ticket.status}`)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    if (currentView === 'ticket_detail' && selectedTicket) {
        return (
            <div className="tetrone-card-wrapper">
                <div className="tetrone-support-header-actions">
                    <Button variant="secondary" onClick={() => navigateTo('tickets')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <BackIcon width={16} height={16} /> {t('support.tab_my_tickets')}
                    </Button>
                    <h2 className="tetrone-section-title">#{selectedTicket.id} - {selectedTicket.subject}</h2>
                    <div className="tetrone-ticket-status">{t(`support.status_${selectedTicket.status}`)}</div>
                </div>

                <div className="tetrone-support-chat-container">
                    {selectedTicket.messages?.map(msg => {
                        const isMine = msg.user_id === selectedTicket.user_id;
                        return (
                            <div key={msg.id} className={`tetrone-support-msg ${isMine ? 'tetrone-support-msg-user' : 'tetrone-support-msg-admin'}`}>
                                <div className="tetrone-support-msg-header">
                                    <strong>{isMine ? t('common.you') : t('common.support')}</strong>
                                    <span>{formatDate(msg.created_at)}</span>
                                </div>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                                {msg.attachments?.length > 0 && (
                                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                        {msg.attachments.map(att => (
                                            <a key={att.id} href={att.file_url} target="_blank" rel="noreferrer">
                                                <img src={att.file_url} alt="attachment" style={{ height: '50px', border: '1px solid #ccc' }} />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                    <form onSubmit={handleReply} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={t('support.reply_placeholder')}
                            required
                        />
                        <div style={{ alignSelf: 'flex-end' }}>
                            <Button type="submit" disabled={loading || !replyText.trim()}>{t('action.send')}</Button>
                        </div>
                    </form>
                )}
            </div>
        );
    }

    return (
        <div className="tetrone-card-wrapper" style={{ padding: 0, background: 'transparent', border: 'none' }}>

            <div className="tetrone-support-welcome">
                <h1>{t('support.welcome_title', { name: 'Tetrone' })}</h1>
                <p>{t('support.welcome_desc')}</p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <button className="tetrone-support-main-btn" onClick={() => navigateTo('form')}>
                        {t('support.create_ticket')}
                    </button>
                    <Button variant="secondary" onClick={() => navigateTo('tickets')}>
                        {t('support.tab_my_tickets')}
                    </Button>
                </div>
            </div>

            <div className="tetrone-support-grid">
                {categories.map(cat => (
                    <div
                        key={cat.id}
                        className="tetrone-support-category-card"
                        onClick={() => navigateTo('category', { cat: cat.id })}
                    >
                        <div className="tetrone-support-icon">{cat.icon}</div>
                        <div className="tetrone-support-cat-title">{t(cat.titleKey)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SupportPage;