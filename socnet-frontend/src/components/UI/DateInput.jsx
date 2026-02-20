import Label from "./Label";

const DateInput = ({ label, wrapperClass = "socnet-form-group", className = "socnet-form-input", ...props }) => {
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