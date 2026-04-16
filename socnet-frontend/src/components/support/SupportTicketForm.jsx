import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import supportService from '../../services/support.service';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';

const SupportTicketForm = ({ onCancel, onSuccess }) => {
    const { t } = useTranslation();

    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const [form, setForm] = useState({
        category: '',
        subcategory: '',
        subject: '',
        message: '',
        steps_to_reproduce: '',
        attachments: []
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await supportService.getCategories();
                setCategories(res.data.categories || []);
                setSubcategories(res.data.subcategories || []);
                if (res.data.categories?.length > 0) {
                    setForm(prev => ({ ...prev, category: res.data.categories[0].id }));
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (field, value) => {
        setErrorMessage(null);
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const isFormValid = () => {
        if (!form.subject.trim() || form.message.trim().length < 10) return false;

        if (form.category === 'bug_report') {
            if (!form.subcategory || !form.steps_to_reproduce.trim() || form.attachments.length === 0) {
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid()) return;

        setLoading(true);
        setErrorMessage(null);
        try {
            const formData = new FormData();
            formData.append('category', form.category);
            formData.append('subject', form.subject);
            formData.append('message', form.message);

            if (form.category === 'bug_report') {
                formData.append('subcategory', form.subcategory);
                formData.append('meta[steps_to_reproduce]', form.steps_to_reproduce);
                form.attachments.forEach(file => formData.append('attachments[]', file));
            }

            await supportService.createTicket(formData);
            onSuccess();
        } catch (error) {
            setErrorMessage(error.message || t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tetrone-support-form-wrapper">
            <h2 className="tetrone-support-content-title">{t('support.create_ticket')}</h2>

            {errorMessage && (
                <div className="tetrone-support-error-box">
                    {errorMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} className="tetrone-support-form-body">
                <fieldset className="tetrone-support-fieldset">
                    <legend className="tetrone-support-legend">{t('support.fieldset_general')}</legend>

                    <div className="tetrone-input-group">
                        <label className="tetrone-label">{t('support.field_category')}</label>
                        <select
                            className="tetrone-input"
                            value={form.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                            required
                        >
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{t(c.name_key)}</option>
                            ))}
                        </select>
                    </div>

                    {form.category === 'bug_report' && (
                        <div className="tetrone-input-group">
                            <label className="tetrone-label">{t('support.field_subcategory')}</label>
                            <select
                                className="tetrone-input"
                                value={form.subcategory}
                                onChange={(e) => handleChange('subcategory', e.target.value)}
                                required
                            >
                                <option value="">{t('support.select_subcategory')}</option>
                                {subcategories.map(s => (
                                    <option key={s.id} value={s.id}>{t(s.name_key)}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="tetrone-input-group">
                        <Input
                            label={t('support.field_subject')}
                            value={form.subject}
                            onChange={(e) => handleChange('subject', e.target.value)}
                            required
                        />
                    </div>
                </fieldset>

                <fieldset className="tetrone-support-fieldset">
                    <legend className="tetrone-support-legend">{t('support.fieldset_details')}</legend>

                    {form.category === 'bug_report' && (
                        <div className="tetrone-support-info-box">
                            <div className="tetrone-support-info-box-icon">!</div>
                            <div>{t('support.bug_report_warning')}</div>
                        </div>
                    )}

                    <div className="tetrone-input-group">
                        <Textarea
                            label={t('support.field_message')}
                            value={form.message}
                            onChange={(e) => handleChange('message', e.target.value)}
                            placeholder={t('support.message_placeholder')}
                            required
                        />
                        <div className="tetrone-support-char-count">
                            {form.message.length > 0 && form.message.length < 10 ? t('support.min_10_chars') : ''}
                        </div>
                    </div>

                    {form.category === 'bug_report' && (
                        <>
                            <div className="tetrone-input-group">
                                <Textarea
                                    label={t('support.field_steps')}
                                    value={form.steps_to_reproduce}
                                    onChange={(e) => handleChange('steps_to_reproduce', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="tetrone-input-group">
                                <label className="tetrone-label">{t('support.field_attachments')}</label>
                                <FileInput
                                    accept="image/*"
                                    multiple
                                    onChange={(files) => handleChange('attachments', Array.from(files))}
                                />
                            </div>
                        </>
                    )}
                </fieldset>

                <div className="tetrone-support-form-actions">
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
                        {t('action.cancel')}
                    </Button>
                    <Button type="submit" disabled={!isFormValid() || loading}>
                        {t('action.submit')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default SupportTicketForm;