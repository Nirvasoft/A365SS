import { forwardRef, type SelectHTMLAttributes } from 'react';
import styles from './Select.module.css';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    required?: boolean;
    options: SelectOption[];
    placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, required, options, placeholder, className = '', ...props }, ref) => {
        const selectClasses = [
            styles['select-group__select'],
            error && styles['select-group__select--error'],
            className,
        ].filter(Boolean).join(' ');

        return (
            <div className={styles['select-group']}>
                {label && (
                    <label className={styles['select-group__label']} htmlFor={props.id}>
                        {label}
                        {required && <span className={styles['select-group__required']}>*</span>}
                    </label>
                )}
                <select ref={ref} className={selectClasses} {...props}>
                    {placeholder && <option value="">{placeholder}</option>}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <span className={styles['select-group__error']}>{error}</span>}
            </div>
        );
    }
);

Select.displayName = 'Select';
export default Select;
