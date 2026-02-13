const Textarea = ({ className = "vk-form-textarea", ...props }) => {
    return (
        <textarea 
            className={className} 
            {...props} 
        />
    );
};
export default Textarea;