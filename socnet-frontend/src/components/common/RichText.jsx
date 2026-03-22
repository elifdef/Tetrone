import Linkify from "linkify-react";
import "linkify-plugin-mention";

const linkifyOptions = {
    target: "_blank",
    className: "tetrone-link",
    formatHref: {
        mention: (href) => `/${href.substring(1)}`,
        url: (href) => href,
    },
    validate: {
        mention: (value) => value.substring(1).length >= 4
    }
};

export default function RichText({ text, className = "tetrone-post-text" }) {
    if (!text) return null;
    
    return (
        <div className={className}>
            <Linkify options={linkifyOptions}>{text}</Linkify>
        </div>
    );
}