import contextlib
import io
import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'agent'))
from src import fetch_data
from src.preprocess import preprocess_financial_data

class FinancialDataTests(unittest.TestCase):
    def response(self, payload, status=200):
        result=Mock(status_code=status,text='sensitive-provider-body')
        result.json.return_value=payload
        return result

    def test_stable_endpoints_merge_and_normalize_ratios(self):
        shared=[{'date':str(year)+'-12-31','fiscalYear':year,'period':'FY','symbol':'AAPL'} for year in (2024,2025)]
        metrics=[{**row,'returnOnInvestedCapital':0.2,'netIncomePerShare':2,'revenuePerShare':10+i} for i,row in enumerate(shared)]
        ratios=[{**row,'returnOnEquity':0.3} for row in shared]
        responses=[self.response(metrics),self.response(ratios)]
        output=io.StringIO()
        with patch.object(fetch_data,'FMP_API_KEY','test-secret'),patch.object(fetch_data.requests,'get',side_effect=responses) as request,contextlib.redirect_stdout(output):
            result=preprocess_financial_data(fetch_data.fetch_fundamental_data('AAPL'))
        self.assertEqual(result.loc['AAPL_2025','calendarYear'],'2025')
        self.assertEqual(result.loc['AAPL_2025','roe'],0.3)
        self.assertEqual(result.loc['AAPL_2025','roic'],0.2)
        self.assertIn('/stable/key-metrics?',request.call_args_list[0].args[0])
        self.assertIn('/stable/ratios?',request.call_args_list[1].args[0])
        self.assertNotIn('test-secret',output.getvalue())

    def test_provider_errors_do_not_expose_credentials(self):
        url='https://financialmodelingprep.com/stable/ratios?apikey=test-secret'
        for status in (401,429,500):
            output=io.StringIO()
            with self.subTest(status=status),patch.object(fetch_data.requests,'get',return_value=self.response({'error':'test-secret'},status)),contextlib.redirect_stdout(output):
                with self.assertRaises((ValueError,fetch_data.APILimitError)) as error:
                    fetch_data._call_fmp_api(url)
            self.assertNotIn('test-secret',str(error.exception)+output.getvalue())
            self.assertNotIn('sensitive-provider-body',str(error.exception))

    def test_network_errors_do_not_expose_request_url(self):
        with patch.object(fetch_data.requests,'get',side_effect=fetch_data.requests.RequestException('apikey=test-secret')):
            with self.assertRaises(ValueError) as error:
                fetch_data._call_fmp_api('https://example.com/?apikey=test-secret')
        self.assertNotIn('test-secret',str(error.exception))

if __name__=='__main__':unittest.main()
