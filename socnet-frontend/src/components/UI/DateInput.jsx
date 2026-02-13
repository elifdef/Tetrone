import Label from "./Label";

const DateInput = ({ label, wrapperClass = "vk-form-group", className = "vk-form-input", ...props }) => {
    return (
        <div className={wrapperClass}>
            {label && <Label>{label}</Label>}
            <input
                type="date"
                className={className}
                style={{ colorScheme: 'dark' }}
                {...props}
            />
        </div>
    );
};

export default DateInput;