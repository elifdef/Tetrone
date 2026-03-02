import { useTranslation } from 'react-i18next';
import Textarea from "../UI/Textarea";
import Button from "../UI/Button";

export default function EditPostForm({
    post,
    editContent, setEditContent,
    editPreview, removeEditImage,
    handleEditFileSelect, handlePaste,
    saveEdit, cancelEditing
}) {
    const { t } = useTranslation();

    return (
        <div className="socnet-post">
            <div className="socnet-edit-mode">
                <Textarea
                    className="socnet-form-textarea fixed-size"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onPaste={(e) => handlePaste(e, 'edit')}
                    maxLength={2048}
                />

                {editPreview && (
                    <div className="socnet-post-preview">
                        <img src={editPreview} alt="Preview" />
                        <button className="socnet-preview-close" onClick={removeEditImage}>
                            ×
                        </button>
                    </div>
                )}

                <div className="socnet-edit-actions">
                    <label className="socnet-btn-small socnet-btn-attach">
                        {t('common.photo')}
                        <input type="file" hidden accept="image/*" onChange={handleEditFileSelect} />
                    </label>

                    <Button className="socnet-btn-small" onClick={() => saveEdit(post.id)}>
                        {t('common.save')}
                    </Button>

                    <Button
                        className="socnet-btn-small socnet-btn-cancel"
                        onClick={cancelEditing}
                    >
                        {t('common.cancel')}
                    </Button>
                </div>
            </div>
        </div>
    );
}