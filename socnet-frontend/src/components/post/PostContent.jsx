import Linkify from "linkify-react";
import "linkify-plugin-mention";
import { useState } from "react";
import PhotoModal from "../UI/PhotoModal";

const linkifyOptions = {
    target: "_blank",
    className: "socnet-link",
    formatHref: {
        mention: (href) => `/${href.substring(1)}`, // перетворює @teto на /teto
        url: (href) => href,
    },
    validate: {
        mention: (value) => value.substring(1).length >= 4 // якщо юзернейм invalid
    }
};

export default function PostContent({ content, image, post, onUpdate, style }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="socnet-post-content" style={style}>
                {content &&
                    <p className="socnet-post-text">
                        <Linkify options={linkifyOptions}>{content}</Linkify>
                    </p>}

                {image && (
                    <div className="socnet-post-image">
                        <img
                            src={image}
                            className="socnet-post-image"
                            onClick={() => setIsModalOpen(true)}
                            style={{ cursor: 'pointer' }}
                        />
                    </div>
                )}
            </div>

            {image && (
                <PhotoModal
                    isOpen={isModalOpen}
                    image={image}
                    post={post}
                    onClose={() => setIsModalOpen(false)}
                    onUpdate={onUpdate}
                />
            )}
        </>
    );
}