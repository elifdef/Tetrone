import { formatFileSize } from "../../../utils/upload";

import Mp3Icon from "../../../assets/filetypes/mp3.svg?react";
import Mp4Icon from "../../../assets/filetypes/mp3.svg?react";
import EpsteinIcon from "../../../assets/filetypes/pdf.svg?react";
import RARIcon from "../../../assets/filetypes/rar.svg?react";
import ZIPIcon from "../../../assets/filetypes/zip.svg?react";
import DocIcon from "../../../assets/filetypes/word.svg?react";
import DefaultFileIcon from "../../../assets/filetypes/what.svg?react";

const getFileIcon = (fileName) => {
    if (!fileName) return <DefaultFileIcon width={64} height={64} />;
    const ext = fileName.split('.').pop().toLowerCase();

    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return <Mp3Icon width={64} height={64} />;
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return <Mp4Icon width={64} height={64} />;
    if (['pdf'].includes(ext)) return <EpsteinIcon width={64} height={64} />;
    if (['zip', '7z', 'tar', 'gz'].includes(ext)) return <ZIPIcon width={64} height={64} />;
    if (['rar'].includes(ext)) return <RARIcon width={64} height={64} />;
    if (['doc', 'docx'].includes(ext)) return <DocIcon width={64} height={64} />;

    return <DefaultFileIcon width={64} height={64} />;
};

export default function PostDocuments({ documents = [] }) {
    if (documents.length === 0) return null;

    return (
        <div className="socnet-post-documents">
            {documents.map((doc) => (
                <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="socnet-document-item"
                    download={doc.original_name}
                >
                    <div className="socnet-document-icon">
                        {getFileIcon(doc.original_name)}
                    </div>
                    <div className="socnet-document-info">
                        <span className="socnet-document-name" title={doc.original_name}>
                            {doc.original_name || 'Document'}
                        </span>
                        <span className="socnet-document-size">
                            {formatFileSize(doc.file_size)}
                        </span>
                    </div>
                </a>
            ))}
        </div>
    );
}