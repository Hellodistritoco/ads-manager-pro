// =====================================================
// JS/UTILS/VALIDATOR.JS - Sistema de validaciones frontend
// =====================================================

class FormValidator {
    constructor() {
        this.rules = new Map();
        this.messages = new Map();
        this.customValidators = new Map();
        
        // Inicializar mensajes por defecto
        this.initDefaultMessages();
        
        // Inicializar validadores personalizados
        this.initCustomValidators();
    }

    // ==================== CONFIGURACIÓN ====================
    
    initDefaultMessages() {
        this.messages.set('required', 'Este campo es requerido');
        this.messages.set('email', 'Debe ser un email válido');
        this.messages.set('phone', 'Debe ser un teléfono válido');
        this.messages.set('url', 'Debe ser una URL válida');
        this.messages.set('number', 'Debe ser un número válido');
        this.messages.set('integer', 'Debe ser un número entero');
        this.messages.set('positive', 'Debe ser un número positivo');
        this.messages.set('min', 'El valor debe ser mayor o igual a {min}');
        this.messages.set('max', 'El valor debe ser menor o igual a {max}');
        this.messages.set('minLength', 'Debe tener al menos {min} caracteres');
        this.messages.set('maxLength', 'No puede tener más de {max} caracteres');
        this.messages.set('pattern', 'El formato no es válido');
        this.messages.set('date', 'Debe ser una fecha válida');
        this.messages.set('dateRange', 'La fecha de inicio debe ser anterior a la fecha de fin');
        this.messages.set('currency', 'Debe ser un monto válido');
        this.messages.set('percentage', 'Debe ser un porcentaje válido (0-100)');
    }

    initCustomValidators() {
        // Validador personalizado para ROAS
        this.customValidators.set('roas', {
            validate: (value) => {
                const num = parseFloat(value);
                return !isNaN(num) && num >= 0 && num <= 50; // ROAS razonable
            },
            message: 'El ROAS debe estar entre 0 y 50'
        });

        // Validador para presupuesto
        this.customValidators.set('budget', {
            validate: (value) => {
                const num = parseFloat(value);
                return !isNaN(num) && num > 0 && num <= 1000000;
            },
            message: 'El presupuesto debe estar entre $1 y $1,000,000'
        });

        // Validador para CTR
        this.customValidators.set('ctr', {
            validate: (value) => {
                const num = parseFloat(value);
                return !isNaN(num) && num >= 0 && num <= 100;
            },
            message: 'El CTR debe estar entre 0% y 100%'
        });

        // Validador para fechas futuras
        this.customValidators.set('futureDate', {
            validate: (value) => {
                const date = new Date(value);
                return date > new Date();
            },
            message: 'La fecha debe ser futura'
        });

        // Validador para fechas pasadas
        this.customValidators.set('pastDate', {
            validate: (value) => {
                const date = new Date(value);
                return date <= new Date();
            },
            message: 'La fecha no puede ser futura'
        });
    }

    // ==================== MÉTODOS PRINCIPALES ====================
    
    // Validar un campo individual
    validateField(field, rules = []) {
        const value = this.getFieldValue(field);
        const fieldName = field.name || field.id || 'Campo';
        const errors = [];

        // Si no hay reglas definidas, usar las del atributo data-rules
        if (rules.length === 0 && field.dataset.rules) {
            rules = field.dataset.rules.split('|');
        }

        // Validaciones por atributos HTML5
        if (field.hasAttribute('required') && this.isEmpty(value)) {
            errors.push(this.getMessage('required', fieldName));
        }

        // Solo validar otros aspectos si el campo no está vacío o es requerido
        if (!this.isEmpty(value) || field.hasAttribute('required')) {
            
            // Validación por tipo de input
            if (field.type === 'email' && !this.isEmpty(value)) {
                if (!this.validateEmail(value)) {
                    errors.push(this.getMessage('email', fieldName));
                }
            }

            if (field.type === 'tel' && !this.isEmpty(value)) {
                if (!this.validatePhone(value)) {
                    errors.push(this.getMessage('phone', fieldName));
                }
            }

            if (field.type === 'url' && !this.isEmpty(value)) {
                if (!this.validateUrl(value)) {
                    errors.push(this.getMessage('url', fieldName));
                }
            }

            if (field.type === 'number' && !this.isEmpty(value)) {
                if (!this.validateNumber(value)) {
                    errors.push(this.getMessage('number', fieldName));
                }
            }

            if (field.type === 'date' && !this.isEmpty(value)) {
                if (!this.validateDate(value)) {
                    errors.push(this.getMessage('date', fieldName));
                }
            }

            // Validaciones por atributos
            if (field.hasAttribute('min') && !this.isEmpty(value)) {
                const min = parseFloat(field.getAttribute('min'));
                if (parseFloat(value) < min) {
                    errors.push(this.getMessage('min', fieldName, { min }));
                }
            }

            if (field.hasAttribute('max') && !this.isEmpty(value)) {
                const max = parseFloat(field.getAttribute('max'));
                if (parseFloat(value) > max) {
                    errors.push(this.getMessage('max', fieldName, { max }));
                }
            }

            if (field.hasAttribute('minlength') && !this.isEmpty(value)) {
                const minLength = parseInt(field.getAttribute('minlength'));
                if (value.length < minLength) {
                    errors.push(this.getMessage('minLength', fieldName, { min: minLength }));
                }
            }

            if (field.hasAttribute('maxlength') && !this.isEmpty(value)) {
                const maxLength = parseInt(field.getAttribute('maxlength'));
                if (value.length > maxLength) {
                    errors.push(this.getMessage('maxLength', fieldName, { max: maxLength }));
                }
            }

            if (field.hasAttribute('pattern') && !this.isEmpty(value)) {
                const pattern = new RegExp(field.getAttribute('pattern'));
                if (!pattern.test(value)) {
                    errors.push(this.getMessage('pattern', fieldName));
                }
            }

            // Validaciones personalizadas por reglas
            rules.forEach(rule => {
                const error = this.validateRule(value, rule, fieldName);
                if (error) {
                    errors.push(error);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Validar formulario completo
    validateForm(form, options = {}) {
        const fields = form.querySelectorAll('input, select, textarea');
        const results = new Map();
        let isValid = true;

        fields.forEach(field => {
            // Saltar campos deshabilitados o de solo lectura
            if (field.disabled || field.readOnly) return;

            const result = this.validateField(field);
            results.set(field.name || field.id, result);

            if (!result.isValid) {
                isValid = false;
                
                // Mostrar errores si está habilitado
                if (options.showErrors !== false) {
                    this.showFieldErrors(field, result.errors);
                }
            } else {
                // Limpiar errores si el campo es válido
                if (options.showErrors !== false) {
                    this.clearFieldErrors(field);
                }
            }
        });

        return {
            isValid: isValid,
            results: results,
            errors: this.getFormErrors(results)
        };
    }

    // ==================== VALIDADORES ESPECÍFICOS ====================
    
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePhone(phone) {
        // Acepta varios formatos de teléfono
        const phoneRegex = /^[\+]?[(]?[\d\s\-\(\)]{10,20}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    validateNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    validateDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    validateCurrency(value) {
        const currencyRegex = /^\d+(\.\d{1,2})?$/;
        return currencyRegex.test(value) && parseFloat(value) >= 0;
    }

    validatePercentage(value) {
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0 && num <= 100;
    }

    validateDateRange(startDate, endDate) {
        if (!startDate || !endDate) return false;
        return new Date(startDate) <= new Date(endDate);
    }

    // ==================== SISTEMA DE REGLAS ====================
    
    validateRule(value, rule, fieldName) {
        // Regla puede ser string simple o objeto con parámetros
        let ruleName, params = {};
        
        if (rule.includes(':')) {
            [ruleName, ...paramParts] = rule.split(':');
            const paramString = paramParts.join(':');
            
            // Parse parameters
            if (paramString.includes(',')) {
                paramString.split(',').forEach(param => {
                    const [key, val] = param.split('=');
                    params[key] = val;
                });
            } else {
                params.value = paramString;
            }
        } else {
            ruleName = rule;
        }

        switch (ruleName) {
            case 'required':
                if (this.isEmpty(value)) {
                    return this.getMessage('required', fieldName);
                }
                break;

            case 'email':
                if (!this.validateEmail(value)) {
                    return this.getMessage('email', fieldName);
                }
                break;

            case 'phone':
                if (!this.validatePhone(value)) {
                    return this.getMessage('phone', fieldName);
                }
                break;

            case 'url':
                if (!this.validateUrl(value)) {
                    return this.getMessage('url', fieldName);
                }
                break;

            case 'number':
                if (!this.validateNumber(value)) {
                    return this.getMessage('number', fieldName);
                }
                break;

            case 'integer':
                if (!Number.isInteger(parseFloat(value))) {
                    return this.getMessage('integer', fieldName);
                }
                break;

            case 'positive':
                if (parseFloat(value) <= 0) {
                    return this.getMessage('positive', fieldName);
                }
                break;

            case 'currency':
                if (!this.validateCurrency(value)) {
                    return this.getMessage('currency', fieldName);
                }
                break;

            case 'percentage':
                if (!this.validatePercentage(value)) {
                    return this.getMessage('percentage', fieldName);
                }
                break;

            case 'date':
                if (!this.validateDate(value)) {
                    return this.getMessage('date', fieldName);
                }
                break;

            default:
                // Verificar validadores personalizados
                if (this.customValidators.has(ruleName)) {
                    const validator = this.customValidators.get(ruleName);
                    if (!validator.validate(value)) {
                        return validator.message;
                    }
                }
        }

        return null;
    }

    // ==================== MANEJO DE ERRORES EN UI ====================
    
    showFieldErrors(field, errors) {
        this.clearFieldErrors(field);
        
        if (errors.length === 0) return;

        // Marcar campo como inválido
        field.classList.add('is-invalid');

        // Crear elemento de feedback
        const feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        feedback.textContent = errors[0]; // Mostrar solo el primer error

        // Insertar después del campo
        const parent = field.closest('.form-floating') || field.parentNode;
        parent.appendChild(feedback);

        // Agregar tooltip si hay múltiples errores
        if (errors.length > 1) {
            field.setAttribute('title', errors.join(', '));
        }
    }

    clearFieldErrors(field) {
        field.classList.remove('is-invalid');
        field.removeAttribute('title');

        // Remover elementos de feedback
        const parent = field.closest('.form-floating') || field.parentNode;
        const feedback = parent.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.remove();
        }
    }

    showFormErrors(form, errors) {
        // Crear o actualizar contenedor de errores
        let errorContainer = form.querySelector('.form-errors');
        
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'form-errors alert alert-danger';
            form.insertBefore(errorContainer, form.firstChild);
        }

        if (errors.length === 0) {
            errorContainer.style.display = 'none';
            return;
        }

        errorContainer.style.display = 'block';
        errorContainer.innerHTML = `
            <h6><i class="bi bi-exclamation-triangle"></i> Errores de validación:</h6>
            <ul class="mb-0">
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `;
    }

    // ==================== UTILIDADES ====================
    
    isEmpty(value) {
        return value === null || value === undefined || value === '' || 
               (Array.isArray(value) && value.length === 0);
    }

    getFieldValue(field) {
        if (field.type === 'checkbox') {
            return field.checked;
        }
        if (field.type === 'radio') {
            const form = field.closest('form');
            const radioGroup = form.querySelectorAll(`input[name="${field.name}"]`);
            const checked = Array.from(radioGroup).find(r => r.checked);
            return checked ? checked.value : '';
        }
        return field.value;
    }

    getMessage(rule, fieldName, params = {}) {
        let message = this.messages.get(rule) || 'Valor inválido';
        
        // Reemplazar placeholders
        Object.keys(params).forEach(key => {
            message = message.replace(`{${key}}`, params[key]);
        });
        
        return message;
    }

    getFormErrors(results) {
        const errors = [];
        
        results.forEach((result, fieldName) => {
            if (!result.isValid) {
                errors.push(...result.errors);
            }
        });
        
        return errors;
    }

    // ==================== CONFIGURACIÓN PERSONALIZADA ====================
    
    addCustomValidator(name, validator) {
        this.customValidators.set(name, validator);
    }

    setMessage(rule, message) {
        this.messages.set(rule, message);
    }

    // ==================== VALIDACIÓN EN TIEMPO REAL ====================
    
    enableRealTimeValidation(form, options = {}) {
        const fields = form.querySelectorAll('input, select, textarea');
        
        fields.forEach(field => {
            // Validar en blur (cuando pierde el foco)
            field.addEventListener('blur', () => {
                if (options.validateOnBlur !== false) {
                    const result = this.validateField(field);
                    if (!result.isValid) {
                        this.showFieldErrors(field, result.errors);
                    } else {
                        this.clearFieldErrors(field);
                    }
                }
            });

            // Limpiar errores en input (mientras escribe)
            field.addEventListener('input', () => {
                if (options.clearOnInput !== false) {
                    this.clearFieldErrors(field);
                }
            });

            // Validar en change para selects
            field.addEventListener('change', () => {
                if (options.validateOnChange !== false && field.tagName === 'SELECT') {
                    const result = this.validateField(field);
                    if (!result.isValid) {
                        this.showFieldErrors(field, result.errors);
                    } else {
                        this.clearFieldErrors(field);
                    }
                }
            });
        });

        // Validar formulario completo en submit
        form.addEventListener('submit', (e) => {
            const result = this.validateForm(form);
            if (!result.isValid) {
                e.preventDefault();
                e.stopPropagation();
                
                if (options.showFormErrors !== false) {
                    this.showFormErrors(form, result.errors);
                }
                
                // Scroll al primer campo con error
                const firstError = form.querySelector('.is-invalid');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstError.focus();
                }
            }
        });
    }

    // ==================== VALIDACIONES ESPECÍFICAS DEL DOMINIO ====================
    
    // Validar datos de cliente
    validateClientData(data) {
        const errors = [];

        if (!data.nombre || data.nombre.trim().length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        }

        if (!data.email || !this.validateEmail(data.email)) {
            errors.push('Email inválido');
        }

        if (data.telefono && !this.validatePhone(data.telefono)) {
            errors.push('Teléfono inválido');
        }

        if (data.presupuesto_mensual && (isNaN(data.presupuesto_mensual) || data.presupuesto_mensual < 0)) {
            errors.push('El presupuesto mensual debe ser un número positivo');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Validar datos de estrategia
    validateStrategyData(data) {
        const errors = [];

        if (!data.nombre_estrategia || data.nombre_estrategia.trim().length < 3) {
            errors.push('El nombre de la estrategia debe tener al menos 3 caracteres');
        }

        if (!data.objetivos || data.objetivos.trim().length < 10) {
            errors.push('Los objetivos deben tener al menos 10 caracteres');
        }

        if (!data.presupuesto || isNaN(data.presupuesto) || data.presupuesto <= 0) {
            errors.push('El presupuesto debe ser un número positivo');
        }

        if (!data.fecha_inicio || !this.validateDate(data.fecha_inicio)) {
            errors.push('Fecha de inicio inválida');
        }

        if (data.fecha_fin && !this.validateDate(data.fecha_fin)) {
            errors.push('Fecha de fin inválida');
        }

        if (data.fecha_inicio && data.fecha_fin && !this.validateDateRange(data.fecha_inicio, data.fecha_fin)) {
            errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Validar archivo CSV
    validateCSVFile(file) {
        const errors = [];

        if (!file) {
            errors.push('No se ha seleccionado ningún archivo');
            return { isValid: false, errors };
        }

        // Validar tipo de archivo
        const allowedTypes = ['text/csv', 'application/vnd.ms-excel'];
        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
            errors.push('El archivo debe ser de tipo CSV');
        }

        // Validar tamaño (máximo 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            errors.push('El archivo no puede ser mayor a 10MB');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// =====================================================
// Instancia global del validador
// =====================================================

const validator = new FormValidator();

// Utilidades globales de validación
window.validateField = (field, rules) => validator.validateField(field, rules);
window.validateForm = (form, options) => validator.validateForm(form, options);
window.enableRealTimeValidation = (form, options) => validator.enableRealTimeValidation(form, options);

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormValidator, validator };
}

// Hacer disponible globalmente
window.FormValidator = FormValidator;
window.validator = validator;