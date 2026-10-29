import json
from django.test import TestCase, RequestFactory
from django.urls import reverse
from calculator.views import index, calculate_api, evaluate_expression

class CalculatorTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_evaluate_addition(self):
        result, error = evaluate_expression("15 + 27")
        self.assertIsNone(error)
        self.assertEqual(result, "42")

    def test_evaluate_subtraction(self):
        result, error = evaluate_expression("50 - 18")
        self.assertIsNone(error)
        self.assertEqual(result, "32")

    def test_evaluate_multiplication(self):
        result, error = evaluate_expression("12 * 8")
        self.assertIsNone(error)
        self.assertEqual(result, "96")

    def test_evaluate_division(self):
        result, error = evaluate_expression("100 / 4")
        self.assertIsNone(error)
        self.assertEqual(result, "25")

    def test_evaluate_division_by_zero(self):
        result, error = evaluate_expression("42 / 0")
        self.assertIsNone(result)
        self.assertEqual(error, "Cannot divide by zero")

    def test_evaluate_decimals(self):
        result, error = evaluate_expression("0.1 + 0.2")
        self.assertIsNone(error)
        self.assertEqual(result, "0.3")

    def test_evaluate_invalid_syntax(self):
        result, error = evaluate_expression("5 + * 3")
        self.assertIsNone(result)
        self.assertIsNotNone(error)

    def test_evaluate_disallowed_code(self):
        result, error = evaluate_expression("__import__('os').system('ls')")
        self.assertIsNone(result)
        self.assertIsNotNone(error)

    def test_index_view_get(self):
        request = self.factory.get(reverse('calculator:index'))
        response = index(request)
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        self.assertIn("Precision Calculator", content)
        self.assertIn('id="calculator-card"', content)

    def test_index_view_post_valid(self):
        request = self.factory.post(reverse('calculator:index'), {'expression': '25 + 75'})
        response = index(request)
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        self.assertIn("100", content)

    def test_index_view_post_division_by_zero(self):
        request = self.factory.post(reverse('calculator:index'), {'expression': '10 / 0'})
        response = index(request)
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        self.assertIn("Cannot divide by zero", content)

    def test_calculate_api_json_post(self):
        request = self.factory.post(
            reverse('calculator:calculate_api'),
            data=json.dumps({'expression': '12 * 12'}),
            content_type='application/json'
        )
        response = calculate_api(request)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(data['success'])
        self.assertEqual(data['result'], '144')

    def test_calculate_api_division_by_zero(self):
        request = self.factory.post(
            reverse('calculator:calculate_api'),
            data=json.dumps({'expression': '50 / 0'}),
            content_type='application/json'
        )
        response = calculate_api(request)
        data = json.loads(response.content.decode('utf-8'))
        self.assertFalse(data['success'])
        self.assertEqual(data['error'], 'Cannot divide by zero')
