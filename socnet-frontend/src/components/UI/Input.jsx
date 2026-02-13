const Input = ({ className = "", ...props }) => {
    return (
        <input 
            className={`vk-form-input ${className}`} 
            {...props} 
        />
    );
};
export default Input;