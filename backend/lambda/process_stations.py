import json
import urllib.parse
import boto3
import re

s3 = boto3.client('s3')

def lambda_handler(event, context):
    # Get the object from the event
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')
    
    try:
        # Fetch the file from S3
        response = s3.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read().decode('utf-8')
        
        # Regex to extract the array content from the export const STATIONS = [...] format
        match = re.search(r'\[.*\]', content, re.DOTALL)
        if match:
            stations_raw = match.group(0)
            # Basic cleanup to make it JSON-like (Note: real-world may need a more robust parser)
            # This is where you'd transform the data for your production DB
            print(f"Successfully processed station file from {key}")
            
            return {
                'statusCode': 200,
                'body': json.dumps('Data processed successfully!')
            }
            
    except Exception as e:
        print(f"Error processing object {key} from bucket {bucket}: {e}")
        raise e
