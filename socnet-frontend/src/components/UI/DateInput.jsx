import Label from "./Label";

const DateInput = ({ label, wrapperClass = "tetrone-form-group", className = "tetrone-form-input", ...props }) => {
    return (
        <div className={wrapperClass}>
            {label && <Label>{label}</Label>}
            <input
                type="date"
                className={`${className} tetrone-date-input-dark`}
                {...props}
            />
        </div>
    );
};

export default DateInput;