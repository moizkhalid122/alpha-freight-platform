/**
 * Form Validation System
 * Alpha Freight - Real-time Form Validation
 */

class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.rules = {};
        this.errors = {};
        if (this.form) {
            this.init();
        }
    }

    init() {
        // Add validation on input
        this.form.addEventListener('input', (e) => {
            if (e.target.hasAttribute('data-validate')) {
                this.validateField(e.target);
            }
        });

        // Add validation on blur
        this.form.addEventListener('blur', (e) => {
            if (e.target.hasAttribute('data-validate')) {
                this.validateField(e.target);
            }
        }, true);

        // Prevent submit if invalid
        this.form.addEventListener('submit', (e) => {
            if (!this.validateForm()) {
                e.preventDefault();
                return false;
            }
        });
    }

    // Add validation rule
    addRule(fieldName, rule, message) {
        if (!this.rules[fieldName]) {
            this.rules[fieldName] = [];
        }
        this.rules[fieldName].push({ rule, message });
    }

    // Validate field
    validateField(field) {
        const fieldName = field.name || field.id;
        const value = field.value.trim();
        const rules = this.rules[fieldName] || [];
        
        // Clear previous error
        this.clearError(field);

        // Check each rule
        for (const { rule, message } of rules) {
            if (!this.checkRule(value, rule, field)) {
                this.showError(field, message);
                return false;
            }
        }

        // Field is valid
        this.showSuccess(field);
        return true;
    }

    // Check rule
    checkRule(value, rule, field) {
        switch(rule) {
            case 'required':
                return value.length > 0;
            
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            
            case 'phone':
                return /^[\d\s\-\+\(\)]+$/.test(value) && value.replace(/\D/g, '').length >= 10;
            
            case 'minLength':
                const min = parseInt(field.getAttribute('data-min') || '0');
                return value.length >= min;
            
            case 'maxLength':
                const max = parseInt(field.getAttribute('data-max') || '9999');
                return value.length <= max;
            
            case 'numeric':
                return /^\d+$/.test(value);
            
            case 'decimal':
                return /^\d+(\.\d+)?$/.test(value);
            
            case 'password':
                return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
            
            case 'match':
                const matchField = field.getAttribute('data-match');
                const matchValue = document.getElementById(matchField)?.value || '';
                return value === matchValue;
            
            case 'url':
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            
            default:
                return true;
        }
    }

    // Show error
    showError(field, message) {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');

        // Remove existing error message
        this.clearError(field);

        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        field.parentElement.appendChild(errorDiv);

        // Store error
        this.errors[field.name || field.id] = message;
    }

    // Show success
    showSuccess(field) {
        field.classList.add('is-valid');
        field.classList.remove('is-invalid');
        this.clearError(field);
        delete this.errors[field.name || field.id];
    }

    // Clear error
    clearError(field) {
        const errorDiv = field.parentElement.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    // Validate entire form
    validateForm() {
        const fields = this.form.querySelectorAll('[data-validate]');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        if (!isValid && window.Toast) {
            window.Toast.error('Please fix the errors in the form');
        }

        return isValid;
    }

    // Reset form
    reset() {
        this.form.reset();
        const fields = this.form.querySelectorAll('[data-validate]');
        fields.forEach(field => {
            field.classList.remove('is-valid', 'is-invalid');
            this.clearError(field);
        });
        this.errors = {};
    }
}

// Add CSS styles
const validatorStyle = document.createElement('style');
validatorStyle.textContent = `
    .is-invalid {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }

    .is-valid {
        border-color: #10b981 !important;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
    }

    .invalid-feedback {
        display: block;
        width: 100%;
        margin-top: 4px;
        font-size: 13px;
        color: #ef4444;
    }

    .valid-feedback {
        display: block;
        width: 100%;
        margin-top: 4px;
        font-size: 13px;
        color: #10b981;
    }
`;
document.head.appendChild(validatorStyle);

// Export
window.FormValidator = FormValidator;

console.log('✅ Form Validator loaded');

