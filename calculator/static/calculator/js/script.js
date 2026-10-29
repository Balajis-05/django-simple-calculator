/**
 * Precision Calculator - Frontend Logic
 * Supports comprehensive arithmetic, edge cases, division-by-zero protection,
 * keyboard shortcuts, history, and seamless Django backend integration.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const expressionDisplay = document.getElementById('expression-display');
    const resultDisplay = document.getElementById('result-display');
    const equalsIndicator = document.getElementById('equals-indicator');
    const errorBanner = document.getElementById('error-banner');
    const errorText = document.getElementById('error-text');
    const historyToggleBtn = document.getElementById('history-toggle-btn');
    const historyPanel = document.getElementById('history-panel');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const copyResultBtn = document.getElementById('copy-result-btn');
    const toast = document.getElementById('toast-notification');
    const toastText = document.getElementById('toast-text');
    const keypad = document.querySelector('.calc-keypad');

    // Calculator State
    let currentInput = '0';
    let previousOperand = null;
    let currentOperator = null;
    let shouldResetInput = false;
    let fullExpression = '';
    let calculationHistory = [];

    // Load history from localStorage
    try {
        const stored = localStorage.getItem('django_calc_history');
        if (stored) {
            calculationHistory = JSON.parse(stored);
            renderHistory();
        }
    } catch (e) {
        calculationHistory = [];
    }

    // ==========================================
    // UI Update Functions
    // ==========================================

    function updateDisplay() {
        resultDisplay.textContent = formatNumberForDisplay(currentInput);
        adjustResultFontSize();

        if (currentOperator && previousOperand !== null) {
            expressionDisplay.textContent = `${previousOperand} ${currentOperator}`;
            equalsIndicator.style.visibility = 'visible';
        } else if (fullExpression) {
            expressionDisplay.textContent = fullExpression;
            equalsIndicator.style.visibility = 'visible';
        } else {
            expressionDisplay.textContent = '';
            equalsIndicator.style.visibility = 'hidden';
        }
    }

    function formatNumberForDisplay(val) {
        if (!val || val === 'Error' || val === 'Cannot divide by zero') return val;
        // Don't format during typing of trailing dot or minus
        if (val.endsWith('.') || val === '-') return val;

        const parts = val.split('.');
        const integerPart = parts[0];
        const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

        // Add thousands separators to the integer part if it's a valid integer
        if (!isNaN(integerPart) && Math.abs(Number(integerPart)) < 1e15) {
            return Number(integerPart).toLocaleString('en-US') + decimalPart;
        }
        return val;
    }

    function adjustResultFontSize() {
        const len = currentInput.length;
        resultDisplay.classList.remove('long-number', 'very-long-number');
        if (len > 15) {
            resultDisplay.classList.add('very-long-number');
        } else if (len > 9) {
            resultDisplay.classList.add('long-number');
        }
    }

    function showError(message) {
        errorText.textContent = message;
        errorBanner.style.display = 'flex';
        resultDisplay.textContent = 'Error';
        currentInput = '0';
        previousOperand = null;
        currentOperator = null;
        shouldResetInput = true;
    }

    function clearError() {
        errorBanner.style.display = 'none';
        errorText.textContent = '';
    }

    function showToast(message) {
        toastText.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2200);
    }

    // ==========================================
    // Calculator Operations
    // ==========================================

    function appendNumber(num) {
        clearError();
        if (shouldResetInput) {
            currentInput = num;
            shouldResetInput = false;
        } else {
            if (currentInput === '0' && num !== '.') {
                currentInput = num;
            } else {
                if (currentInput.replace(/[^0-9]/g, '').length >= 16) {
                    return; // Avoid numeric overflow
                }
                currentInput += num;
            }
        }
        updateDisplay();
    }

    function appendDecimal() {
        clearError();
        if (shouldResetInput) {
            currentInput = '0.';
            shouldResetInput = false;
        } else if (!currentInput.includes('.')) {
            currentInput += '.';
        }
        updateDisplay();
    }

    function handleOperator(op) {
        clearError();
        const inputValue = parseFloat(currentInput);

        if (currentOperator && !shouldResetInput) {
            // Chain calculation
            compute();
        } else {
            previousOperand = currentInput;
        }

        currentOperator = op;
        shouldResetInput = true;
        fullExpression = `${previousOperand} ${currentOperator}`;
        updateDisplay();
    }

    function toggleSign() {
        clearError();
        if (currentInput === '0') return;

        if (currentInput.startsWith('-')) {
            currentInput = currentInput.substring(1);
        } else {
            currentInput = '-' + currentInput;
        }
        updateDisplay();
    }

    function calculatePercent() {
        clearError();
        const val = parseFloat(currentInput);
        if (isNaN(val)) return;

        // If part of an expression like A + B%: B% becomes (A * B / 100)
        if (previousOperand !== null && (currentOperator === '+' || currentOperator === '-')) {
            const base = parseFloat(previousOperand);
            const percentVal = (base * val) / 100;
            currentInput = roundAccurate(percentVal).toString();
        } else {
            currentInput = roundAccurate(val / 100).toString();
        }
        updateDisplay();
    }

    function deleteLastDigit() {
        clearError();
        if (shouldResetInput) return;

        if (currentInput.length === 1 || (currentInput.length === 2 && currentInput.startsWith('-'))) {
            currentInput = '0';
        } else {
            currentInput = currentInput.slice(0, -1);
        }
        updateDisplay();
    }

    function clearAll() {
        clearError();
        currentInput = '0';
        previousOperand = null;
        currentOperator = null;
        fullExpression = '';
        shouldResetInput = false;
        updateDisplay();
    }

    function roundAccurate(num, decimals = 10) {
        // Handle precision floating point issues (e.g. 0.1 + 0.2 = 0.3)
        return Number(Math.round(num + 'e' + decimals) + 'e-' + decimals);
    }

    function compute() {
        if (!currentOperator || previousOperand === null) return;

        const prev = parseFloat(previousOperand);
        const curr = parseFloat(currentInput);
        const op = currentOperator;

        if (isNaN(prev) || isNaN(curr)) {
            showError('Invalid Expression');
            return;
        }

        // Division by Zero check
        if ((op === '÷' || op === '/') && curr === 0) {
            showError('Cannot divide by zero');
            saveToHistory(`${previousOperand} ${op} ${currentInput}`, 'Cannot divide by zero');
            return;
        }

        let result;
        switch (op) {
            case '+':
                result = prev + curr;
                break;
            case '-':
            case '−':
                result = prev - curr;
                break;
            case '×':
            case '*':
                result = prev * curr;
                break;
            case '÷':
            case '/':
                result = prev / curr;
                break;
            default:
                return;
        }

        result = roundAccurate(result);
        const formattedResult = result.toString();
        const expr = `${previousOperand} ${op} ${currentInput}`;

        saveToHistory(expr, formattedResult);

        fullExpression = expr;
        currentInput = formattedResult;
        previousOperand = formattedResult;
        currentOperator = null;
        shouldResetInput = true;
        updateDisplay();

        // Also ping backend API asynchronously for verification / logging
        syncWithBackend(expr);
    }

    // Backend verification sync
    async function syncWithBackend(expr) {
        try {
            await fetch('/api/calculate/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expression: expr })
            });
        } catch (e) {
            // Silently fallback if offline
        }
    }

    // ==========================================
    // History Management
    // ==========================================

    function saveToHistory(expr, res) {
        calculationHistory.unshift({ expr, res, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        if (calculationHistory.length > 20) {
            calculationHistory.pop();
        }
        try {
            localStorage.setItem('django_calc_history', JSON.stringify(calculationHistory));
        } catch (e) {}
        renderHistory();
    }

    function renderHistory() {
        if (calculationHistory.length === 0) {
            historyList.innerHTML = '<div class="empty-history-msg">No recent calculations yet.</div>';
            return;
        }

        historyList.innerHTML = '';
        calculationHistory.forEach((item) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <span class="history-expr">${item.expr} =</span>
                <span class="history-res">${item.res}</span>
            `;
            div.addEventListener('click', () => {
                if (item.res !== 'Cannot divide by zero' && item.res !== 'Error') {
                    currentInput = item.res;
                    previousOperand = null;
                    currentOperator = null;
                    fullExpression = item.expr;
                    shouldResetInput = true;
                    updateDisplay();
                    showToast('Loaded ' + item.res);
                }
            });
            historyList.appendChild(div);
        });
    }

    // ==========================================
    // Event Listeners
    // ==========================================

    // Keypad Click Delegation
    keypad.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        // Visual click wave / pressed class
        btn.classList.add('pressed');
        setTimeout(() => btn.classList.remove('pressed'), 120);

        if (btn.dataset.number !== undefined) {
            appendNumber(btn.dataset.number);
        } else if (btn.dataset.operator !== undefined) {
            handleOperator(btn.dataset.operator);
        } else if (btn.dataset.action !== undefined) {
            const action = btn.dataset.action;
            switch (action) {
                case 'decimal':
                    appendDecimal();
                    break;
                case 'clear':
                    clearAll();
                    break;
                case 'delete':
                    deleteLastDigit();
                    break;
                case 'percent':
                    calculatePercent();
                    break;
                case 'toggle-sign':
                    toggleSign();
                    break;
                case 'calculate':
                    compute();
                    break;
            }
        }
    });

    // Keyboard support
    window.addEventListener('keydown', (e) => {
        // Prevent default scrolling / navigation on certain keys
        if (['Enter', 'Space', '/', '*', '+', '-'].includes(e.key)) {
            if (document.activeElement.tagName !== 'INPUT') {
                e.preventDefault();
            }
        }

        let matchedBtn = null;

        if (e.key >= '0' && e.key <= '9') {
            appendNumber(e.key);
            matchedBtn = document.querySelector(`[data-number="${e.key}"]`);
        } else if (e.key === '.' || e.key === ',') {
            appendDecimal();
            matchedBtn = document.getElementById('btn-decimal');
        } else if (e.key === '+' || e.key === '-') {
            handleOperator(e.key);
            matchedBtn = e.key === '+' ? document.getElementById('btn-add') : document.getElementById('btn-subtract');
        } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
            handleOperator('×');
            matchedBtn = document.getElementById('btn-multiply');
        } else if (e.key === '/') {
            handleOperator('÷');
            matchedBtn = document.getElementById('btn-divide');
        } else if (e.key === 'Enter' || e.key === '=') {
            compute();
            matchedBtn = document.getElementById('btn-equals');
        } else if (e.key === 'Backspace') {
            deleteLastDigit();
            matchedBtn = document.getElementById('btn-delete');
        } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
            clearAll();
            matchedBtn = document.getElementById('btn-clear');
        } else if (e.key === '%') {
            calculatePercent();
            matchedBtn = document.getElementById('btn-percent');
        }

        if (matchedBtn) {
            matchedBtn.classList.add('pressed');
            setTimeout(() => matchedBtn.classList.remove('pressed'), 120);
        }
    });

    // History Toggle
    historyToggleBtn.addEventListener('click', () => {
        const isOpen = historyPanel.classList.toggle('open');
        historyToggleBtn.classList.toggle('active', isOpen);
        historyPanel.setAttribute('aria-hidden', !isOpen);
    });

    // Clear History
    clearHistoryBtn.addEventListener('click', () => {
        calculationHistory = [];
        localStorage.removeItem('django_calc_history');
        renderHistory();
        showToast('History cleared');
    });

    // Copy to Clipboard
    copyResultBtn.addEventListener('click', () => {
        if (!navigator.clipboard) {
            showToast('Clipboard access unavailable');
            return;
        }
        navigator.clipboard.writeText(currentInput).then(() => {
            showToast('Result copied: ' + currentInput);
        }).catch(() => {
            showToast('Failed to copy');
        });
    });

    // Initialize display
    updateDisplay();
});
