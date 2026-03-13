import Linkify from "linkify-react";
import "linkify-plugin-mention";

const linkifyOptions = {
    target: "_blank",
    className: "socnet-link",
    formatHref: {
        mention: (href) => `/${href.substring(1)}`,
        url: (href) => href,
    },
    validate: {
        mention: (value) => value.substring(1).length >= 4
    }
};

export default function RichText({ text }) {
    if (!text) return null;
    // поки це заглушка, так що воно просто відповідає за форматування тексту якщо там є юзернейм або силка
    return (
        <p className="socnet-post-text">
            <Linkify options={linkifyOptions}>{text}</Linkify>
        </p>
    );
}