import { createContext, useState, useContext, useCallback } from 'react';
import GlobalModal from '../components/modals/GlobalModal';
import i18n from '../i18n';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: null,
        title: '',
        message: '',
        placeholder: '',
        inputValue: '',
        btnSubmit: '',
        btnCancel: '',
        allowEmptyPrompt: false,
        resolve: null,
        customContent: null
    });

    const closeAndReset = () => {
        setModalState(prev => ({ ...prev, isOpen: false, inputValue: '', customContent: null }));
    };

    const openConfirm = useCallback((message, title = i18n.t('action.confirm'), btnYes = i18n.t('common.yes'), btnNo = i18n.t('action.cancel')) => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true, type: 'confirm', title, message, btnSubmit: btnYes, btnCancel: btnNo, resolve, inputValue: '', customContent: null
            });
        });
    }, []);

    const openPrompt = useCallback((message, title, placeholder = '', allowEmpty = false, btnSubmit = i18n.t('action.save'), btnCancel = i18n.t('action.cancel')) => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true, type: 'prompt', title, message, placeholder, allowEmptyPrompt: allowEmpty, btnSubmit, btnCancel, resolve, inputValue: '', customContent: null
            });
        });
    }, []);

    const openPassword = useCallback((message = i18n.t('error.enter_confirm_password'), title = i18n.t('common.security'), btnSubmit = i18n.t('action.confirm')) => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true, type: 'password', title, message, placeholder: '********', allowEmptyPrompt: false, btnSubmit, btnCancel: i18n.t('action.cancel'), resolve, inputValue: '', customContent: null
            });
        });
    }, []);

    const openCustom = useCallback((customContent) => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true, type: 'custom', resolve, customContent, inputValue: ''
            });
        });
    }, []);

    return (
        <ModalContext.Provider value={{ openConfirm, openPrompt, openPassword, openCustom, closeModal: closeAndReset }}>
            {children}
            <GlobalModal
                isOpen={modalState.isOpen}
                onClose={closeAndReset}
                type={modalState.type}
                title={modalState.title}
                message={modalState.message}
                placeholder={modalState.placeholder}
                inputValue={modalState.inputValue}
                setInputValue={(val) => setModalState(prev => ({ ...prev, inputValue: val }))}
                btnSubmit={modalState.btnSubmit}
                btnCancel={modalState.btnCancel}
                allowEmptyPrompt={modalState.allowEmptyPrompt}
                onResolve={modalState.resolve}
            >
                {modalState.customContent}
            </GlobalModal>
        </ModalContext.Provider>
    );
};