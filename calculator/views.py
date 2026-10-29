import ast
import json
import operator
from decimal import Decimal, InvalidOperation, DivisionByZero
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# Safe AST operator mapping
OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Mod: operator.mod,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

def safe_eval(node):
    """
    Recursively evaluate an AST node containing only arithmetic operations.
    Raises ValueError on disallowed syntax or ZeroDivisionError.
    """
    if isinstance(node, ast.Constant):  # e.g. numbers in Python 3.8+
        if isinstance(node.value, (int, float)):
            return Decimal(str(node.value))
        raise ValueError("Unsupported literal type")
    elif isinstance(node, ast.UnaryOp):
        op_type = type(node.op)
        if op_type in OPERATORS:
            operand = safe_eval(node.operand)
            return OPERATORS[op_type](operand)
        raise ValueError(f"Unsupported unary operator: {op_type.__name__}")
    elif isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type in OPERATORS:
            left = safe_eval(node.left)
            right = safe_eval(node.right)
            if op_type == ast.Div and right == 0:
                raise ZeroDivisionError("Cannot divide by zero")
            if op_type == ast.Mod and right == 0:
                raise ZeroDivisionError("Cannot divide by zero")
            return OPERATORS[op_type](left, right)
        raise ValueError(f"Unsupported operator: {op_type.__name__}")
    elif isinstance(node, ast.Expression):
        return safe_eval(node.body)
    else:
        raise ValueError("Invalid mathematical expression")

def evaluate_expression(expr_str: str):
    """
    Sanitize and evaluate an arithmetic expression string.
    Returns (result_str, error_message).
    """
    if not expr_str or not expr_str.strip():
        return "0", None

    cleaned = (
        expr_str.strip()
        .replace('×', '*')
        .replace('÷', '/')
        .replace('−', '-')
    )

    try:
        parsed = ast.parse(cleaned, mode='eval')
        val = safe_eval(parsed)

        # Normalize Decimal output (e.g. 5.0 -> 5, 0.3333333333333333)
        if val == val.to_integral():
            result = str(val.quantize(Decimal('1')))
        else:
            result = format(val.normalize(), 'f')
            # Strip trailing zeros if decimal point is present
            if '.' in result:
                result = result.rstrip('0').rstrip('.')
        return result, None
    except ZeroDivisionError:
        return None, "Cannot divide by zero"
    except (ValueError, SyntaxError, InvalidOperation, OverflowError):
        return None, "Invalid Expression"
    except Exception:
        return None, "Calculation Error"

def index(request):
    """
    Renders the main calculator interface.
    Supports both standard GET and optional POST form submissions.
    """
    context = {
        'initial_expression': '',
        'initial_result': '0',
        'error': None,
    }

    if request.method == 'POST':
        expression = request.POST.get('expression', '')
        result, error = evaluate_expression(expression)
        context['initial_expression'] = expression
        context['initial_result'] = result if result is not None else '0'
        context['error'] = error

    return render(request, 'calculator/index.html', context)

@csrf_exempt
def calculate_api(request):
    """
    API endpoint for backend evaluation.
    Accepts JSON payload: {"expression": "12 + 34 * 2"}
    or Form-data / GET parameter: ?expression=12%2B34
    """
    expression = ''
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            expression = data.get('expression', '')
        except (json.JSONDecodeError, UnicodeDecodeError):
            expression = request.POST.get('expression', '')
    else:
        expression = request.GET.get('expression', '')

    result, error = evaluate_expression(expression)
    if error:
        return JsonResponse({
            'success': False,
            'expression': expression,
            'error': error,
        }, status=400 if error != "Cannot divide by zero" else 200)

    return JsonResponse({
        'success': True,
        'expression': expression,
        'result': result,
    })
