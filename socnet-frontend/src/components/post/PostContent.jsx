import Linkify from "linkify-react";
import "linkify-plugin-mention";

const linkifyOptions = {
    target: "_blank",
    className: "vk-link",
    formatHref: {
        mention: (href) => `/${href.substring(1)}`, // перетворює @teto на /teto
        url: (href) => href,
    },
};

export default function PostContent({ content, image }) {
    return (
        <div className="vk-post-content">
            {content && (
                <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    <Linkify options={linkifyOptions}>{content}</Linkify>
                </p>
            )}
            {image && (
                <div className="vk-post-image">
                    <img src={`${image}`} alt="Post" />
                </div>
            )}
        </div>
    );
}