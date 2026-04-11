import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import GlobalModal from './GlobalModal';
import PrivacyService from '../../services/privacy.service';
import FriendService from '../../services/friend.service';
import Button from '../ui/Button';
import { notifyError, notifySuccess } from '../common/Notify';

export default function PrivacyExceptionsModal({ isOpen, onClose, context, initialExceptions, onSaveSuccess }) {
    const { t } = useTranslation();

    const [friends, setFriends] = useState([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [initialIds, setInitialIds] = useState([]);
    const [localAllowedIds, setLocalAllowedIds] = useState([]);

    useEffect(() => {
        if (isOpen && context) {
            const contextEx = initialExceptions.filter(ex => ex.context === context && ex.is_allowed);
            const ids = contextEx.map(ex => ex.target_user_id);

            setInitialIds(ids);
            setLocalAllowedIds(ids);
            fetchFriends();
        } else {
            setSearch('');
        }
    }, [isOpen, context, initialExceptions]);

    const fetchFriends = async () => {
        setIsLoading(true);
        try {
            const res = await FriendService.getList('friends');
            if (res.success) {
                setFriends(res.data?.data || res.data || []);
            } else {
                notifyError(res.message || t('common.error'));
            }
        } catch (error) {
            notifyError(t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = (friendId) => {
        setLocalAllowedIds(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        );
    };

    const isDirty = useMemo(() => {
        if (initialIds.length !== localAllowedIds.length) return true;
        return !localAllowedIds.every(id => initialIds.includes(id));
    }, [initialIds, localAllowedIds]);

    const handleSave = async () => {
        if (!isDirty) return;
        setIsSaving(true);

        try {
            const addedIds = localAllowedIds.filter(id => !initialIds.includes(id));
            const removedIds = initialIds.filter(id => !localAllowedIds.includes(id));

            const promises = [];

            addedIds.forEach(id => {
                promises.push(PrivacyService.setException(id, context, true));
            });

            removedIds.forEach(id => {
                const exceptionId = initialExceptions.find(
                    ex => ex.target_user_id === id && ex.context === context
                )?.id;

                if (exceptionId) {
                    promises.push(PrivacyService.deleteException(exceptionId));
                }
            });

            await Promise.all(promises);
            notifySuccess(t('settings.exceptions_saved'));

            if (onSaveSuccess) onSaveSuccess();
            onClose();

        } catch (error) {
            notifyError(t('common.error'));
        } finally {
            setIsSaving(false);
        }
    };

    const filteredFriends = useMemo(() => {
        return friends.filter(f => {
            const fullName = `${f.first_name} ${f.last_name} ${f.username}`.toLowerCase();
            return fullName.includes(search.toLowerCase());
        });
    }, [friends, search]);

    return (
        <GlobalModal
            isOpen={isOpen}
            onClose={onClose}
            onResolve={onClose}
            type="custom"
            title={context ? t(`privacy.context_${context}`) : ''}
        >
            <div className="tetrone-modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
                <div className="tetrone-modal-header">
                    <h3>{t('privacy.manage_exceptions')}</h3>
                    <button className="tetrone-modal-close" onClick={onClose} disabled={isSaving}>✖</button>
                </div>

                <div className="tetrone-modal-body tetrone-exceptions-modal-body">
                    <input
                        type="text"
                        className="tetrone-form-input tetrone-mb-15"
                        placeholder={t('action.search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        disabled={isSaving}
                    />

                    <div className="tetrone-exceptions-list-container">
                        {isLoading ? (
                            <div className="tetrone-loading">{t('common.loading')}</div>
                        ) : filteredFriends.length > 0 ? (
                            filteredFriends.map(friend => {
                                const isChecked = localAllowedIds.includes(friend.id);
                                return (
                                    <div key={friend.id} className="tetrone-friend-select-item">
                                        <div className="tetrone-friend-select-info">
                                            <img
                                                src={friend.avatar}
                                                alt=""
                                                className="tetrone-avatar-small tetrone-img-cover"
                                                style={{ borderRadius: '50%' }}
                                            />
                                            <div className="tetrone-friend-select-text">
                                                <span className="tetrone-friend-name">
                                                    {friend.first_name} {friend.last_name}
                                                </span>
                                                <span className="tetrone-friend-username">
                                                    @{friend.username}
                                                </span>
                                            </div>
                                        </div>

                                        <label className="tetrone-pointer">
                                            <input
                                                type="checkbox"
                                                className="tetrone-checkbox"
                                                checked={isChecked}
                                                onChange={() => handleToggle(friend.id)}
                                                disabled={isSaving}
                                            />
                                        </label>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="tetrone-empty-state tetrone-text-center tetrone-mt-15">
                                {t('empty.list')}
                            </div>
                        )}
                    </div>
                </div>

                <div className="tetrone-modal-footer">
                    <Button variant="secondary" onClick={onClose} disabled={isSaving}>
                        {t('action.cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={!isDirty || isSaving}
                    >
                        {isSaving ? t('common.loading') : t('action.save')}
                    </Button>
                </div>
            </div>
        </GlobalModal>
    );
}