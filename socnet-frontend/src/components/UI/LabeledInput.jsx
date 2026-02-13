import Label from "./Label";
import Input from "./Input";
import FileInput from "./FileInput";

const LabeledInput = ({ label, type = "text", wrapperClass = "vk-form-group", ...props }) => {
    return (
        <div className={wrapperClass}>
            {label && <Label>{label}</Label>}

            {type === 'file' ? (
                <FileInput {...props} />
            ) : (
                <Input type={type} {...props} />
            )}
        </div>
    );
};

export default LabeledInput;